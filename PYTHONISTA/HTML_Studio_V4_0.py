#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HTML_Studio_V4_0.py — Backend Python pour LiveTechno-Web v0.1
Serveur Flask local pour iPhone 14 Pro Max via Pythonista

Fonctionnalités :
- Serveur HTTP local (127.0.0.1:8787)
- Routes API REST (machines, patterns, GPT, MIDI export, project save/load)
- Intégration OpenAI (GPT-4.1-mini)
- Export MIDI multi-pistes (mido)
- Persistence (JSON + SQLite)
- Gate OpenAI (validation clé API)

Auteur : IA constructrice
Date : 2025-10-21
"""

import os
import sys
import json
import sqlite3
import threading
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

# Flask
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# MIDI
import mido
from mido import MidiFile, MidiTrack, Message, MetaMessage

# OpenAI
from openai import OpenAI

# JSON Schema validation
import jsonschema
from jsonschema import validate, ValidationError

# ============================================================================
# CONFIGURATION
# ============================================================================

# Chemins
BASE_DIR = Path(__file__).parent
PROJECT_DIR = BASE_DIR / "projet"
SCHEMAS_DIR = BASE_DIR.parent / "SCHEMAS"
MACHINES_DIR = BASE_DIR.parent / "MACHINES"
DATA_DIR = BASE_DIR / "data"

# Créer les dossiers nécessaires
DATA_DIR.mkdir(exist_ok=True)

# Serveur
HOST = "127.0.0.1"
PORT = 8787

# OpenAI
OPENAI_API_KEY = None  # Sera défini via Gate
OPENAI_MODEL = "gpt-4.1-mini"

# Base de données SQLite
DB_PATH = DATA_DIR / "HTML_Studio_logs.db"

# ============================================================================
# BASE DE DONNÉES
# ============================================================================

def init_database():
    """Initialise la base de données SQLite pour les logs."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Table des logs d'actions
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS action_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            action_type TEXT NOT NULL,
            payload TEXT,
            success INTEGER NOT NULL,
            error_message TEXT
        )
    """)
    
    # Table des logs d'erreurs
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS error_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            error_type TEXT NOT NULL,
            message TEXT NOT NULL,
            stack_trace TEXT
        )
    """)
    
    conn.commit()
    conn.close()
    print(f"✅ Base de données initialisée : {DB_PATH}")

def log_action(action_type: str, payload: Dict, success: bool, error_message: Optional[str] = None):
    """Log une action dans la base de données."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO action_logs (timestamp, action_type, payload, success, error_message)
        VALUES (?, ?, ?, ?, ?)
    """, (
        datetime.utcnow().isoformat(),
        action_type,
        json.dumps(payload),
        1 if success else 0,
        error_message
    ))
    
    conn.commit()
    conn.close()

def log_error(error_type: str, message: str, stack_trace: Optional[str] = None):
    """Log une erreur dans la base de données."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO error_logs (timestamp, error_type, message, stack_trace)
        VALUES (?, ?, ?, ?)
    """, (
        datetime.utcnow().isoformat(),
        error_type,
        message,
        stack_trace
    ))
    
    conn.commit()
    conn.close()

# ============================================================================
# VALIDATION JSON SCHEMA
# ============================================================================

def load_schema(schema_name: str) -> Dict:
    """Charge un schéma JSON depuis le dossier SCHEMAS."""
    schema_path = SCHEMAS_DIR / f"{schema_name}.schema.json"
    if not schema_path.exists():
        # Essayer dans le dossier actions/
        schema_path = SCHEMAS_DIR / "actions" / f"{schema_name}.schema.json"
    
    if not schema_path.exists():
        raise FileNotFoundError(f"Schéma introuvable : {schema_name}")
    
    with open(schema_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def validate_json(data: Dict, schema_name: str) -> bool:
    """Valide un JSON contre un schéma."""
    try:
        schema = load_schema(schema_name)
        validate(instance=data, schema=schema)
        return True
    except ValidationError as e:
        log_error("ValidationError", str(e))
        return False
    except Exception as e:
        log_error("SchemaLoadError", str(e))
        return False

# ============================================================================
# OPENAI CLIENT
# ============================================================================

def validate_openai_key(api_key: str) -> bool:
    """Valide une clé API OpenAI."""
    try:
        client = OpenAI(api_key=api_key)
        # Test minimal (1 token)
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role": "user", "content": "Test"}],
            max_tokens=1
        )
        return True
    except Exception as e:
        log_error("OpenAI_ValidationError", str(e))
        return False

def generate_pattern_with_gpt(prompt: str, project_state: Dict) -> Optional[Dict]:
    """Génère un pattern via GPT-4.1-mini."""
    global OPENAI_API_KEY
    
    if not OPENAI_API_KEY:
        return None
    
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Construire le prompt système
        system_prompt = f"""Tu es une IA compositrice pour LiveTechno-Web.
Tu génères des patterns musicaux au format JSON (CreatePattern.v1).

État du projet actuel :
{json.dumps(project_state, indent=2)}

Machines disponibles :
- behringer.rd9 (drums, canal 10) : 11 instruments (BD=36, SD=38, CH=42, OH=46, etc.)
- behringer.td3 (bass, canal 1) : synthé monophonique avec slide et accent

Règles :
1. Retourne UNIQUEMENT un JSON valide (CreatePattern.v1)
2. Pas de texte avant ou après le JSON
3. Utilise les notes MIDI correctes pour chaque instrument
4. Longueurs supportées : 12, 16, 32, 48, 64, 68, 128, 256 pas
5. Résolutions supportées : 96, 192, 480 PPQ
6. Valeurs normalisées 0.0-1.0 pour l'automation
"""
        
        # Appel GPT
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        # Extraire le JSON
        content = response.choices[0].message.content.strip()
        
        # Nettoyer le contenu (enlever les ```json si présents)
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
        
        # Parser le JSON
        pattern = json.loads(content)
        
        # Valider contre le schéma
        if not validate_json(pattern, "CreatePattern.v1"):
            log_error("GPT_ValidationError", "Pattern généré invalide")
            return None
        
        return pattern
        
    except Exception as e:
        log_error("GPT_GenerationError", str(e))
        return None

# ============================================================================
# MIDI EXPORT
# ============================================================================

def export_midi(project_state: Dict, output_path: Path) -> bool:
    """Exporte le projet en fichier MIDI multi-pistes."""
    try:
        # Créer le fichier MIDI (Type 1, multi-pistes)
        mid = MidiFile(type=1)
        
        # Récupérer les métadonnées
        meta = project_state.get("meta", {})
        bpm = meta.get("bpm", 128)
        ppq = meta.get("ppq", 480)
        
        # Configurer le PPQ
        mid.ticks_per_beat = ppq
        
        # Track 0 : Tempo map
        tempo_track = MidiTrack()
        mid.tracks.append(tempo_track)
        
        tempo_track.append(MetaMessage('set_tempo', tempo=mido.bpm2tempo(bpm), time=0))
        tempo_track.append(MetaMessage('time_signature', numerator=4, denominator=4, time=0))
        
        # Créer une track par machine
        machines = project_state.get("machines", [])
        patterns = project_state.get("patterns", [])
        
        for machine in machines:
            instance_id = machine.get("instanceId", "unknown")
            midi_channel = machine.get("midiChannel", 1) - 1  # MIDI channels 0-15
            machine_id = machine.get("id", "unknown")
            
            # Créer la track
            track = MidiTrack()
            mid.tracks.append(track)
            
            # Nom de la track
            track_name = f"{machine_id.upper()}_{instance_id}"
            track.append(MetaMessage('track_name', name=track_name, time=0))
            
            # Trouver les patterns de cette machine
            machine_patterns = [p for p in patterns if p.get("targetMachine") == instance_id or p.get("targetMachine") == machine_id]
            
            # Ajouter les notes de chaque pattern
            for pattern in machine_patterns:
                steps = pattern.get("steps", [])
                length_steps = pattern.get("lengthSteps", 16)
                resolution_ppq = pattern.get("resolutionPPQ", 96)
                
                # Calculer le ratio de conversion pas → ticks
                ticks_per_step = ppq * 4 // length_steps  # 4 beats = 1 bar
                
                for step in steps:
                    t = step.get("t", 0)
                    note = step.get("note", 60)
                    vel = step.get("vel", 100)
                    duration = step.get("duration", 0.5)  # Durée en beats
                    
                    # Convertir en ticks
                    time_ticks = t * ticks_per_step
                    duration_ticks = int(duration * ppq)
                    
                    # Note On
                    track.append(Message('note_on', note=note, velocity=vel, time=time_ticks, channel=midi_channel))
                    
                    # Note Off
                    track.append(Message('note_off', note=note, velocity=0, time=duration_ticks, channel=midi_channel))
                
                # Ajouter l'automation
                automation = pattern.get("automation", [])
                for auto in automation:
                    target = auto.get("target", "")
                    at = auto.get("at", 0)
                    val = auto.get("val", 0.5)
                    
                    # Mapper le paramètre à un CC (exemple simplifié)
                    cc_map = {
                        "cutoff": 74,
                        "resonance": 71,
                        "envmod": 72,
                        "decay": 73,
                        "accent": 75
                    }
                    
                    cc_num = cc_map.get(target.lower(), 1)
                    cc_val = int(val * 127)
                    
                    time_ticks = at * ticks_per_step
                    
                    track.append(Message('control_change', control=cc_num, value=cc_val, time=time_ticks, channel=midi_channel))
        
        # Sauvegarder le fichier
        mid.save(output_path)
        
        log_action("midi_export", {"output": str(output_path)}, True)
        return True
        
    except Exception as e:
        log_error("MIDI_ExportError", str(e))
        return False

# ============================================================================
# FLASK APP
# ============================================================================

app = Flask(__name__, static_folder=str(PROJECT_DIR), static_url_path='')
CORS(app)  # Activer CORS pour le développement

# En-têtes COOP/COEP
@app.after_request
def add_headers(response):
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
    response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

# ============================================================================
# ROUTES
# ============================================================================

@app.route('/')
def index():
    """Servir index.html."""
    return send_from_directory(PROJECT_DIR, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Servir les fichiers statiques."""
    return send_from_directory(PROJECT_DIR, path)

@app.route('/api/machines', methods=['GET'])
def get_machines():
    """Lister les machines disponibles."""
    try:
        machines = [
            {
                "id": "behringer.rd9",
                "label": "Behringer RD-9",
                "vendor": "Behringer",
                "category": "drum",
                "defaultChannel": 10
            },
            {
                "id": "behringer.td3",
                "label": "Behringer TD-3",
                "vendor": "Behringer",
                "category": "synth",
                "defaultChannel": 1
            }
        ]
        
        log_action("get_machines", {}, True)
        return jsonify({"machines": machines})
        
    except Exception as e:
        log_error("API_Error", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/validate', methods=['POST'])
def validate_api_key():
    """Valider une clé API OpenAI."""
    try:
        data = request.json
        api_key = data.get('apiKey', '')
        
        if not api_key:
            return jsonify({"valid": False, "error": "Clé API manquante"}), 400
        
        # Valider la clé
        is_valid = validate_openai_key(api_key)
        
        if is_valid:
            global OPENAI_API_KEY
            OPENAI_API_KEY = api_key
            log_action("validate_api_key", {"valid": True}, True)
            return jsonify({"valid": True})
        else:
            log_action("validate_api_key", {"valid": False}, False, "Clé invalide")
            return jsonify({"valid": False, "error": "Clé API invalide"}), 401
            
    except Exception as e:
        log_error("API_Error", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/gpt', methods=['POST'])
def generate_with_gpt():
    """Générer un pattern via GPT-4.1-mini."""
    try:
        data = request.json
        prompt = data.get('prompt', '')
        project_state = data.get('projectState', {})
        
        if not prompt:
            return jsonify({"error": "Prompt manquant"}), 400
        
        if not OPENAI_API_KEY:
            return jsonify({"error": "Clé API OpenAI non configurée"}), 401
        
        # Générer le pattern
        pattern = generate_pattern_with_gpt(prompt, project_state)
        
        if pattern:
            log_action("gpt_generate", {"prompt": prompt}, True)
            return jsonify({"pattern": pattern})
        else:
            log_action("gpt_generate", {"prompt": prompt}, False, "Génération échouée")
            return jsonify({"error": "Génération échouée"}), 500
            
    except Exception as e:
        log_error("API_Error", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/midi/export', methods=['POST'])
def export_midi_route():
    """Exporter le projet en MIDI."""
    try:
        data = request.json
        project_state = data.get('projectState', {})
        
        # Valider ProjectState
        if not validate_json(project_state, "ProjectState.v1"):
            return jsonify({"error": "ProjectState invalide"}), 400
        
        # Générer le fichier MIDI
        output_path = DATA_DIR / "export.mid"
        success = export_midi(project_state, output_path)
        
        if success:
            log_action("midi_export", {"output": str(output_path)}, True)
            return send_from_directory(DATA_DIR, "export.mid", as_attachment=True)
        else:
            log_action("midi_export", {}, False, "Export échoué")
            return jsonify({"error": "Export échoué"}), 500
            
    except Exception as e:
        log_error("API_Error", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/project/save', methods=['POST'])
def save_project():
    """Sauvegarder le projet."""
    try:
        data = request.json
        project_state = data.get('projectState', {})
        
        # Valider ProjectState
        if not validate_json(project_state, "ProjectState.v1"):
            return jsonify({"error": "ProjectState invalide"}), 400
        
        # Sauvegarder dans un fichier JSON
        project_path = DATA_DIR / "project.json"
        with open(project_path, 'w', encoding='utf-8') as f:
            json.dump(project_state, f, indent=2, ensure_ascii=False)
        
        log_action("project_save", {"path": str(project_path)}, True)
        return jsonify({"success": True, "path": str(project_path)})
        
    except Exception as e:
        log_error("API_Error", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/project/load', methods=['GET'])
def load_project():
    """Charger le projet."""
    try:
        project_path = DATA_DIR / "project.json"
        
        if not project_path.exists():
            return jsonify({"error": "Aucun projet sauvegardé"}), 404
        
        with open(project_path, 'r', encoding='utf-8') as f:
            project_state = json.load(f)
        
        log_action("project_load", {"path": str(project_path)}, True)
        return jsonify({"projectState": project_state})
        
    except Exception as e:
        log_error("API_Error", str(e))
        return jsonify({"error": str(e)}), 500

# ============================================================================
# MAIN
# ============================================================================

def main():
    """Point d'entrée principal."""
    print("=" * 60)
    print("🎹 LiveTechno-Web v0.1 — Backend Python")
    print("=" * 60)
    
    # Initialiser la base de données
    init_database()
    
    # Démarrer le serveur Flask
    print(f"\n🚀 Serveur démarré sur http://{HOST}:{PORT}")
    print(f"📁 Dossier projet : {PROJECT_DIR}")
    print(f"📁 Dossier données : {DATA_DIR}")
    print(f"📁 Base de données : {DB_PATH}")
    print("\n⚠️  Appuyez sur Ctrl+C pour arrêter le serveur\n")
    
    app.run(host=HOST, port=PORT, debug=False, threaded=True)

if __name__ == "__main__":
    main()

