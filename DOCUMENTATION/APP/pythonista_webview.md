# Guide Pythonista WebView pour LiveTechno-Web

## Introduction

Pythonista permet de créer des applications web hybrides en combinant Python (backend) et HTML/CSS/JavaScript (frontend) via le module `webview`. Cette approche est idéale pour LiveTechno-Web car elle permet de :

- Exécuter du code Python pour la logique métier (MIDI, persistance, IA)
- Afficher une interface web moderne (HTML5, CSS3, Web Audio API)
- Communiquer bidirectionnellement entre Python et JavaScript
- Accéder aux APIs iOS via Python (fichiers, notifications, etc.)

## Architecture globale

```
┌─────────────────────────────────────────────────────────────┐
│                    Pythonista (iOS)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  HTML_Studio_V4_0.py (Python)                        │   │
│  │  ├─ Serveur HTTP local (Flask/http.server)          │   │
│  │  ├─ Gestionnaire MIDI (python-rtmidi)               │   │
│  │  ├─ Client OpenAI API                                │   │
│  │  ├─ Persistance (JSON, SQLite)                       │   │
│  │  └─ WebView bridge (pywebview/ui.WebView)           │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ▲ ▼                                │
│                    JavaScript ↔ Python                       │
│                           ▲ ▼                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  WebView (HTML/CSS/JS)                               │   │
│  │  ├─ projet/index.html                                │   │
│  │  ├─ projet/app.js (UI, Web Audio, Canvas)           │   │
│  │  ├─ projet/dsp/ (AudioWorklets)                     │   │
│  │  └─ projet/styles.css                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Méthode 1 : ui.WebView (recommandé pour maquette)

### Avantages

- ✅ Intégré nativement dans Pythonista
- ✅ Pas de dépendances externes
- ✅ Communication Python ↔ JS simple
- ✅ Accès complet aux APIs Pythonista

### Structure de base

```python
# HTML_Studio_V4_0.py
import ui
import json
import os

class LiveTechnoApp:
    def __init__(self):
        self.webview = ui.WebView()
        self.webview.name = "LiveTechno Studio"
        self.webview.flex = "WH"
        
        # Charger le HTML local
        html_path = os.path.join(os.path.dirname(__file__), "projet/index.html")
        with open(html_path, "r", encoding="utf-8") as f:
            html_content = f.read()
        
        self.webview.load_html(html_content)
        
        # Délégué pour intercepter les messages JS
        self.webview.delegate = self
    
    def webview_should_start_load(self, webview, url, nav_type):
        """
        Intercepte les navigations pour gérer les commandes JS → Python.
        """
        if url.startswith("pythonista://"):
            # Extraire la commande
            command = url.replace("pythonista://", "")
            self.handle_command(command)
            return False  # Bloquer la navigation
        
        return True  # Autoriser les autres navigations
    
    def handle_command(self, command):
        """
        Traite les commandes envoyées depuis JavaScript.
        """
        try:
            data = json.loads(command)
            action = data.get("action")
            
            if action == "addMachine":
                result = self.add_machine(data["machineId"], data["channel"])
                self.send_to_js({"type": "acknowledgement", "result": result})
            
            elif action == "callGPT":
                response = self.call_gpt(data["messages"])
                self.send_to_js({"type": "gptResponse", "text": response})
            
            elif action == "saveMIDI":
                self.save_midi(data["patterns"])
                self.send_to_js({"type": "acknowledgement", "success": True})
        
        except Exception as e:
            print(f"Erreur commande : {e}")
            self.send_to_js({"type": "error", "message": str(e)})
    
    def send_to_js(self, data):
        """
        Envoie des données de Python vers JavaScript.
        """
        js_code = f"window.receiveFromPython({json.dumps(data)});"
        self.webview.eval_js(js_code)
    
    def add_machine(self, machine_id, channel):
        """Logique métier : Ajouter une machine."""
        print(f"Ajout machine {machine_id} sur canal {channel}")
        return {"machineId": machine_id, "channel": channel, "success": True}
    
    def call_gpt(self, messages):
        """Appeler l'API OpenAI."""
        import openai
        
        # Charger la clé API depuis un fichier local
        with open("user_openai_key.json", "r") as f:
            config = json.load(f)
            openai.api_key = config["api_key"]
        
        response = openai.ChatCompletion.create(
            model="gpt-4.1-mini",
            messages=messages
        )
        
        return response["choices"][0]["message"]["content"]
    
    def save_midi(self, patterns):
        """Sauvegarder les patterns en MIDI."""
        from mido import MidiFile, MidiTrack, Message
        
        mid = MidiFile()
        track = MidiTrack()
        mid.tracks.append(track)
        
        # ... logique d'export MIDI ...
        
        mid.save("output.mid")
        print("MIDI sauvegardé : output.mid")
    
    def run(self):
        """Lancer l'application."""
        self.webview.present("fullscreen")

# Point d'entrée
if __name__ == "__main__":
    app = LiveTechnoApp()
    app.run()
```

### Communication JavaScript → Python

```javascript
// projet/app.js

/**
 * Envoie une commande à Python via URL scheme
 */
function sendToPython(data) {
    const command = JSON.stringify(data);
    const url = `pythonista://${encodeURIComponent(command)}`;
    
    // Créer un iframe caché pour déclencher la navigation
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = url;
    document.body.appendChild(iframe);
    
    // Nettoyer après 100ms
    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 100);
}

/**
 * Reçoit des données de Python
 */
window.receiveFromPython = function(data) {
    console.log("Reçu de Python :", data);
    
    if (data.type === "acknowledgement") {
        console.log("Acknowledgement :", data.result);
    } else if (data.type === "gptResponse") {
        displayGPTResponse(data.text);
    } else if (data.type === "error") {
        console.error("Erreur Python :", data.message);
    }
};

// Exemples d'utilisation

// Ajouter une machine
sendToPython({
    action: "addMachine",
    machineId: "moog.subsequent37",
    channel: 1
});

// Appeler GPT
sendToPython({
    action: "callGPT",
    messages: [
        { role: "system", content: "Tu es un assistant techno." },
        { role: "user", content: "Crée un pattern de kick." }
    ]
});

// Sauvegarder MIDI
sendToPython({
    action: "saveMIDI",
    patterns: [/* ... */]
});
```

## Méthode 2 : Serveur HTTP local + WebView

### Avantages

- ✅ Séparation claire frontend/backend
- ✅ Rechargement à chaud du HTML/JS
- ✅ Debugging facile (Chrome DevTools)
- ✅ Architecture REST standard

### Serveur Flask

```python
# HTML_Studio_V4_0.py
from flask import Flask, jsonify, request, send_from_directory
import threading
import ui

app = Flask(__name__, static_folder="projet", static_url_path="")

# État global
state = {
    "machines": [],
    "patterns": []
}

@app.route("/")
def index():
    """Servir le HTML principal."""
    return send_from_directory("projet", "index.html")

@app.route("/api/machines", methods=["POST"])
def add_machine():
    """API : Ajouter une machine."""
    data = request.json
    machine_id = data["machineId"]
    channel = data["channel"]
    
    machine = {
        "id": machine_id,
        "channel": channel,
        "parameters": {}
    }
    
    state["machines"].append(machine)
    
    return jsonify({"success": True, "machine": machine})

@app.route("/api/gpt", methods=["POST"])
def call_gpt():
    """API : Appeler GPT."""
    import openai
    
    messages = request.json["messages"]
    
    # Charger la clé API
    with open("user_openai_key.json", "r") as f:
        config = json.load(f)
        openai.api_key = config["api_key"]
    
    response = openai.ChatCompletion.create(
        model="gpt-4.1-mini",
        messages=messages
    )
    
    return jsonify({
        "text": response["choices"][0]["message"]["content"]
    })

@app.route("/api/midi/export", methods=["POST"])
def export_midi():
    """API : Exporter MIDI."""
    patterns = request.json["patterns"]
    
    # ... logique d'export MIDI ...
    
    return jsonify({"success": True, "path": "output.mid"})

def run_server():
    """Lancer le serveur Flask dans un thread."""
    app.run(host="127.0.0.1", port=5000, debug=False)

class LiveTechnoApp:
    def __init__(self):
        # Lancer le serveur dans un thread
        server_thread = threading.Thread(target=run_server, daemon=True)
        server_thread.start()
        
        # Créer la WebView
        self.webview = ui.WebView()
        self.webview.name = "LiveTechno Studio"
        self.webview.flex = "WH"
        
        # Charger l'URL locale
        self.webview.load_url("http://127.0.0.1:5000")
    
    def run(self):
        self.webview.present("fullscreen")

if __name__ == "__main__":
    app = LiveTechnoApp()
    app.run()
```

### Communication JavaScript → Python (REST)

```javascript
// projet/app.js

/**
 * Appeler l'API Python
 */
async function callAPI(endpoint, data) {
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Erreur API ${endpoint} :`, error);
        throw error;
    }
}

// Exemples d'utilisation

// Ajouter une machine
const machine = await callAPI("machines", {
    machineId: "moog.subsequent37",
    channel: 1
});

console.log("Machine ajoutée :", machine);

// Appeler GPT
const gptResponse = await callAPI("gpt", {
    messages: [
        { role: "system", content: "Tu es un assistant techno." },
        { role: "user", content: "Crée un pattern de kick." }
    ]
});

console.log("GPT :", gptResponse.text);

// Exporter MIDI
const exportResult = await callAPI("midi/export", {
    patterns: [/* ... */]
});

console.log("MIDI exporté :", exportResult.path);
```

## Gestion de la persistance

### Option 1 : JSON local

```python
import json
import os

class PersistenceManager:
    def __init__(self, data_dir="data"):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
    
    def save_project(self, project_state):
        """Sauvegarder l'état du projet."""
        path = os.path.join(self.data_dir, "project_state.json")
        
        with open(path, "w", encoding="utf-8") as f:
            json.dump(project_state, f, indent=2, ensure_ascii=False)
        
        print(f"Projet sauvegardé : {path}")
    
    def load_project(self):
        """Charger l'état du projet."""
        path = os.path.join(self.data_dir, "project_state.json")
        
        if not os.path.exists(path):
            return None
        
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    
    def list_projects(self):
        """Lister tous les projets."""
        projects = []
        
        for filename in os.listdir(self.data_dir):
            if filename.endswith(".json"):
                projects.append(filename.replace(".json", ""))
        
        return projects

# Utilisation
persistence = PersistenceManager()

# Sauvegarder
persistence.save_project({
    "version": "1.0",
    "machines": [/* ... */],
    "patterns": [/* ... */]
})

# Charger
project = persistence.load_project()
```

### Option 2 : SQLite

```python
import sqlite3
import json

class SQLitePersistence:
    def __init__(self, db_path="data/livetechno.db"):
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.init_db()
    
    def init_db(self):
        """Créer les tables."""
        cursor = self.conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                state TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS patterns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER,
                machine_id TEXT,
                data TEXT,
                FOREIGN KEY (project_id) REFERENCES projects(id)
            )
        """)
        
        self.conn.commit()
    
    def save_project(self, name, state):
        """Sauvegarder un projet."""
        cursor = self.conn.cursor()
        
        cursor.execute("""
            INSERT INTO projects (name, state)
            VALUES (?, ?)
        """, (name, json.dumps(state)))
        
        self.conn.commit()
        return cursor.lastrowid
    
    def load_project(self, project_id):
        """Charger un projet."""
        cursor = self.conn.cursor()
        
        cursor.execute("""
            SELECT state FROM projects WHERE id = ?
        """, (project_id,))
        
        row = cursor.fetchone()
        if row:
            return json.loads(row[0])
        
        return None

# Utilisation
db = SQLitePersistence()

# Sauvegarder
project_id = db.save_project("Mon projet techno", {
    "machines": [/* ... */],
    "patterns": [/* ... */]
})

# Charger
project = db.load_project(project_id)
```

## Gestion MIDI (python-rtmidi)

### Installation

```bash
# Dans Pythonista, utiliser StaSh
pip install python-rtmidi
```

### Envoi de messages MIDI

```python
import rtmidi

class MIDIManager:
    def __init__(self):
        self.midiout = rtmidi.MidiOut()
        self.ports = self.midiout.get_ports()
        
        if self.ports:
            self.midiout.open_port(0)
            print(f"MIDI ouvert : {self.ports[0]}")
        else:
            self.midiout.open_virtual_port("LiveTechno Virtual")
            print("Port MIDI virtuel créé")
    
    def send_note_on(self, channel, note, velocity):
        """Envoyer un Note On."""
        status = 0x90 | (channel & 0x0F)
        self.midiout.send_message([status, note, velocity])
    
    def send_note_off(self, channel, note):
        """Envoyer un Note Off."""
        status = 0x80 | (channel & 0x0F)
        self.midiout.send_message([status, note, 0])
    
    def send_cc(self, channel, cc, value):
        """Envoyer un Control Change."""
        status = 0xB0 | (channel & 0x0F)
        self.midiout.send_message([status, cc, value])
    
    def send_nrpn(self, channel, param, value):
        """Envoyer un NRPN."""
        param_msb = (param >> 7) & 0x7F
        param_lsb = param & 0x7F
        value_msb = (value >> 7) & 0x7F
        value_lsb = value & 0x7F
        
        self.send_cc(channel, 99, param_msb)  # NRPN MSB
        self.send_cc(channel, 98, param_lsb)  # NRPN LSB
        self.send_cc(channel, 6, value_msb)   # Data Entry MSB
        self.send_cc(channel, 38, value_lsb)  # Data Entry LSB
    
    def close(self):
        """Fermer le port MIDI."""
        del self.midiout

# Utilisation
midi = MIDIManager()

# Jouer une note
midi.send_note_on(1, 60, 100)  # Canal 1, C4, vélocité 100
time.sleep(0.5)
midi.send_note_off(1, 60)

# Changer un paramètre
midi.send_cc(1, 74, 64)  # Cutoff à 50%

# Fermer
midi.close()
```

## Bonnes pratiques

### 1. Sécurité de la clé API

```python
import keychain

# Sauvegarder (une seule fois)
keychain.set_password("livetechno", "openai_key", "sk-...")

# Récupérer
api_key = keychain.get_password("livetechno", "openai_key")
```

### 2. Gestion des erreurs

```python
def safe_api_call(func):
    """Décorateur pour gérer les erreurs d'API."""
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            print(f"Erreur API : {e}")
            return {"error": str(e)}
    
    return wrapper

@app.route("/api/gpt", methods=["POST"])
@safe_api_call
def call_gpt():
    # ... logique ...
    pass
```

### 3. Threading pour ne pas bloquer l'UI

```python
import threading

def long_running_task():
    """Tâche longue (export MIDI, appel GPT, etc.)."""
    time.sleep(5)
    return "Terminé"

def async_task(callback):
    """Exécuter une tâche en arrière-plan."""
    def worker():
        result = long_running_task()
        callback(result)
    
    thread = threading.Thread(target=worker, daemon=True)
    thread.start()

# Utilisation
def on_complete(result):
    print(f"Résultat : {result}")
    # Envoyer au JavaScript
    app.send_to_js({"type": "taskComplete", "result": result})

async_task(on_complete)
```

### 4. Logging structuré

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("livetechno.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Utilisation
logger.info("Application démarrée")
logger.warning("Clé API non trouvée")
logger.error("Erreur MIDI", exc_info=True)
```

## Debugging

### 1. Console JavaScript dans Pythonista

```javascript
// Rediriger console.log vers Python
(function() {
    const originalLog = console.log;
    
    console.log = function(...args) {
        originalLog.apply(console, args);
        
        // Envoyer à Python
        sendToPython({
            action: "log",
            message: args.join(" ")
        });
    };
})();
```

```python
def handle_command(self, command):
    data = json.loads(command)
    
    if data["action"] == "log":
        print(f"[JS] {data['message']}")
```

### 2. Inspecteur Web (Safari)

1. Activer le mode développeur dans Safari (Préférences → Avancées)
2. Connecter l'iPhone au Mac
3. Safari → Développement → [iPhone] → [WebView]

## Références

- [Pythonista Documentation](http://omz-software.com/pythonista/docs/)
- [Pythonista ui Module](http://omz-software.com/pythonista/docs/ios/ui.html)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [python-rtmidi Documentation](https://spotlightkid.github.io/python-rtmidi/)

## Prochaines étapes

1. Implémenter `HTML_Studio_V4_0.py` avec ui.WebView
2. Créer l'API REST pour les actions JSON
3. Intégrer le gestionnaire MIDI
4. Tester la communication bidirectionnelle Python ↔ JS
5. Optimiser les performances (threading, caching)

