#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
server.py — Backend Flask pour LiveTechno-Web v0.1 (Pythonista compatible)
Sans dépendances C/C++ : pas de mido, pas de jsonschema
Tous les fichiers à plat dans le même dossier
"""

import os
import json
import sqlite3
from datetime import datetime
from pathlib import Path

# Flask (disponible via pip, pure Python)
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

# OpenAI (disponible via pip, pure Python)
try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

# ============================================================================
# CONFIGURATION
# ============================================================================

HOST = "127.0.0.1"
PORT = 8787

OPENAI_API_KEY = None
OPENAI_MODEL = "gpt-4.1-mini"

# Chemins (tous dans le même dossier)
BASE_DIR = Path(__file__).parent
DB_PATH = BASE_DIR / "logs.db"
PROJECT_PATH = BASE_DIR / "project.json"

# ============================================================================
# BASE DE DONNÉES
# ============================================================================

def init_db():
    """Initialise la base SQLite."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            level TEXT,
            message TEXT
        )
    """)
    
    conn.commit()
    conn.close()
    log("INFO", "Base de données initialisée")

def log(level, message):
    """Log un message."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO logs (timestamp, level, message) VALUES (?, ?, ?)",
                      (datetime.utcnow().isoformat(), level, message))
        conn.commit()
        conn.close()
    except:
        pass
    print(f"[{level}] {message}")

# ============================================================================
# MIDI EXPORT (Pure Python, sans mido)
# ============================================================================

def create_midi_file(project_state):
    """Crée un fichier MIDI basique en pure Python."""
    # Header MIDI Type 1
    midi_data = bytearray()
    
    # MThd chunk
    midi_data.extend(b'MThd')
    midi_data.extend((0, 0, 0, 6).to_bytes(4, 'big'))  # Length
    midi_data.extend((0, 1).to_bytes(2, 'big'))  # Format 1
    midi_data.extend((0, 2).to_bytes(2, 'big'))  # 2 tracks
    midi_data.extend((1, 224).to_bytes(2, 'big'))  # 480 PPQ
    
    # Track 0: Tempo
    track0 = bytearray()
    
    # Tempo event (120 BPM = 500000 microseconds per quarter note)
    bpm = project_state.get('meta', {}).get('bpm', 128)
    tempo_us = int(60000000 / bpm)
    
    track0.extend(b'\x00\xFF\x51\x03')  # Delta time 0, Meta Event Tempo
    track0.extend(tempo_us.to_bytes(3, 'big'))
    
    # End of track
    track0.extend(b'\x00\xFF\x2F\x00')
    
    # MTrk chunk for track 0
    midi_data.extend(b'MTrk')
    midi_data.extend(len(track0).to_bytes(4, 'big'))
    midi_data.extend(track0)
    
    # Track 1: Notes
    track1 = bytearray()
    
    patterns = project_state.get('patterns', [])
    for pattern in patterns:
        steps = pattern.get('steps', [])
        for step in steps:
            t = step.get('t', 0)
            note = step.get('note', 60)
            vel = step.get('vel', 100)
            
            # Note On
            delta = int(t * 120)  # Approximation
            track1.extend(encode_variable_length(delta))
            track1.extend(bytes([0x90, note, vel]))  # Channel 1, Note On
            
            # Note Off (100 ticks later)
            track1.extend(encode_variable_length(100))
            track1.extend(bytes([0x80, note, 0]))  # Channel 1, Note Off
    
    # End of track
    track1.extend(b'\x00\xFF\x2F\x00')
    
    # MTrk chunk for track 1
    midi_data.extend(b'MTrk')
    midi_data.extend(len(track1).to_bytes(4, 'big'))
    midi_data.extend(track1)
    
    return bytes(midi_data)

def encode_variable_length(value):
    """Encode un nombre en variable length quantity (MIDI)."""
    result = bytearray()
    result.insert(0, value & 0x7F)
    value >>= 7
    while value > 0:
        result.insert(0, (value & 0x7F) | 0x80)
        value >>= 7
    return bytes(result)

# ============================================================================
# FLASK APP
# ============================================================================

app = Flask(__name__)
CORS(app)

@app.after_request
def add_headers(response):
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
    response.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
    return response

# ============================================================================
# ROUTES
# ============================================================================

@app.route('/')
def index():
    """Servir index.html."""
    index_path = BASE_DIR / 'index.html'
    if index_path.exists():
        return send_file(index_path)
    return "index.html not found", 404

@app.route('/<path:filename>')
def serve_file(filename):
    """Servir les fichiers statiques."""
    file_path = BASE_DIR / filename
    if file_path.exists() and file_path.is_file():
        return send_file(file_path)
    return f"{filename} not found", 404

@app.route('/api/machines', methods=['GET'])
def get_machines():
    """Lister les machines."""
    machines = [
        {"id": "behringer.rd9", "label": "Behringer RD-9", "category": "drum", "defaultChannel": 10},
        {"id": "behringer.td3", "label": "Behringer TD-3", "category": "synth", "defaultChannel": 1}
    ]
    log("INFO", "Machines listées")
    return jsonify({"machines": machines})

@app.route('/api/auth/validate', methods=['POST'])
def validate_key():
    """Valider une clé API OpenAI."""
    global OPENAI_API_KEY
    
    data = request.json
    api_key = data.get('apiKey', '')
    
    if not api_key:
        return jsonify({"valid": False, "error": "Clé manquante"}), 400
    
    # Test simple (pas de vraie validation pour éviter les dépendances)
    if api_key.startswith('sk-'):
        OPENAI_API_KEY = api_key
        log("INFO", "Clé API validée")
        return jsonify({"valid": True})
    else:
        log("WARNING", "Clé API invalide")
        return jsonify({"valid": False, "error": "Clé invalide"}), 401

@app.route('/api/gpt', methods=['POST'])
def generate_pattern():
    """Générer un pattern via GPT."""
    global OPENAI_API_KEY
    
    if not OPENAI_API_KEY:
        return jsonify({"error": "Clé API non configurée"}), 401
    
    if not OpenAI:
        return jsonify({"error": "Module openai non installé"}), 500
    
    data = request.json
    prompt = data.get('prompt', '')
    project_state = data.get('projectState', {})
    
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        system_prompt = """Tu es une IA compositrice pour LiveTechno-Web.
Génère un pattern JSON avec cette structure :
{
  "name": "nom du pattern",
  "targetMachine": "behringer.rd9" ou "behringer.td3",
  "lengthSteps": 16,
  "resolutionPPQ": 96,
  "steps": [
    {"t": 0, "note": 36, "vel": 100, "duration": 0.25}
  ]
}

Retourne UNIQUEMENT le JSON, sans texte avant ou après."""
        
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        content = response.choices[0].message.content.strip()
        
        # Nettoyer le JSON
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
        
        pattern = json.loads(content)
        
        log("INFO", f"Pattern généré : {pattern.get('name', 'sans nom')}")
        return jsonify({"pattern": pattern})
        
    except Exception as e:
        log("ERROR", f"Erreur GPT : {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/midi/export', methods=['POST'])
def export_midi():
    """Exporter en MIDI."""
    data = request.json
    project_state = data.get('projectState', {})
    
    try:
        midi_data = create_midi_file(project_state)
        
        midi_path = BASE_DIR / 'export.mid'
        with open(midi_path, 'wb') as f:
            f.write(midi_data)
        
        log("INFO", "Export MIDI réussi")
        return send_file(midi_path, as_attachment=True, download_name='export.mid')
        
    except Exception as e:
        log("ERROR", f"Erreur export MIDI : {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/project/save', methods=['POST'])
def save_project():
    """Sauvegarder le projet."""
    data = request.json
    project_state = data.get('projectState', {})
    
    try:
        with open(PROJECT_PATH, 'w', encoding='utf-8') as f:
            json.dump(project_state, f, indent=2)
        
        log("INFO", "Projet sauvegardé")
        return jsonify({"success": True})
        
    except Exception as e:
        log("ERROR", f"Erreur sauvegarde : {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/project/load', methods=['GET'])
def load_project():
    """Charger le projet."""
    try:
        if not PROJECT_PATH.exists():
            return jsonify({"error": "Aucun projet"}), 404
        
        with open(PROJECT_PATH, 'r', encoding='utf-8') as f:
            project_state = json.load(f)
        
        log("INFO", "Projet chargé")
        return jsonify({"projectState": project_state})
        
    except Exception as e:
        log("ERROR", f"Erreur chargement : {str(e)}")
        return jsonify({"error": str(e)}), 500

# ============================================================================
# MAIN
# ============================================================================

def main():
    print("=" * 60)
    print("🎹 LiveTechno-Web v0.1 — Backend Flask (Pythonista)")
    print("=" * 60)
    
    init_db()
    
    print(f"\n🚀 Serveur : http://{HOST}:{PORT}")
    print(f"📁 Dossier : {BASE_DIR}")
    print(f"📁 Base de données : {DB_PATH}")
    print("\n⚠️  Ctrl+C pour arrêter\n")
    
    app.run(host=HOST, port=PORT, debug=False, threaded=True)

if __name__ == "__main__":
    main()

