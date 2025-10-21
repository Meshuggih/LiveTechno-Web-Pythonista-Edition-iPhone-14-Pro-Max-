# Architecture de LiveTechno-Web Pythonista Edition

## Vue d'ensemble

LiveTechno-Web est une **application web hybride** exécutée dans Pythonista sur iPhone 14 Pro Max. Elle combine Python (backend), HTML/CSS/JavaScript (frontend), et Web Audio API (DSP) pour créer un studio de production techno live contrôlé par IA.

## Diagramme d'architecture global

```
┌─────────────────────────────────────────────────────────────────────┐
│                        iPhone 14 Pro Max                             │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Pythonista App                              │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  HTML_Studio_V4_0.py (Python Backend)                   │  │  │
│  │  │  ├─ Flask Server (HTTP API)                             │  │  │
│  │  │  ├─ MIDI Manager (python-rtmidi)                        │  │  │
│  │  │  ├─ OpenAI Client (GPT-4.1-mini)                        │  │  │
│  │  │  ├─ Persistence (JSON/SQLite)                           │  │  │
│  │  │  └─ WebView Bridge                                      │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                           ▲ ▼                                   │  │
│  │                    REST API / MessagePort                       │  │
│  │                           ▲ ▼                                   │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  WebView (HTML/CSS/JavaScript)                          │  │  │
│  │  │  ┌───────────────────────────────────────────────────┐  │  │  │
│  │  │  │  Main Thread                                       │  │  │  │
│  │  │  │  ├─ UI Manager (Canvas, Timeline, Mixer)          │  │  │  │
│  │  │  │  ├─ State Manager (ProjectState.v1)               │  │  │  │
│  │  │  │  ├─ GPT Chat Interface                            │  │  │  │
│  │  │  │  └─ MIDI Export Controller                        │  │  │  │
│  │  │  └───────────────────────────────────────────────────┘  │  │  │
│  │  │                           ▲ ▼                             │  │  │
│  │  │                    AudioContext                           │  │  │
│  │  │                           ▲ ▼                             │  │  │
│  │  │  ┌───────────────────────────────────────────────────┐  │  │  │
│  │  │  │  Audio Thread (AudioWorklet)                      │  │  │  │
│  │  │  │  ├─ Oscillators (PolyBLEP)                        │  │  │  │
│  │  │  │  ├─ Filters (ZDF)                                 │  │  │  │
│  │  │  │  ├─ Effects (Distortion, Delay)                   │  │  │  │
│  │  │  │  └─ Machine Processors (4 machines)               │  │  │  │
│  │  │  └───────────────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  iOS APIs (via Python)                                        │  │
│  │  ├─ Files (Documents, iCloud)                                 │  │
│  │  ├─ Keychain (Clé API OpenAI)                                 │  │
│  │  └─ Notifications                                              │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                  ▲ ▼
                           Internet (WiFi)
                                  ▲ ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Services externes                             │
│  ├─ OpenAI API (GPT-4.1-mini, GPT-5)                                │
│  └─ GitHub (Versioning, CI/CD)                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Composants principaux

### 1. Backend Python (HTML_Studio_V4_0.py)

#### Responsabilités

- **Serveur HTTP** : API REST pour les actions JSON
- **Gestionnaire MIDI** : Export MIDI, envoi de messages CC/NRPN
- **Client OpenAI** : Communication avec GPT pour génération de patterns
- **Persistance** : Sauvegarde/chargement des projets (JSON, SQLite)
- **Bridge WebView** : Communication bidirectionnelle avec JavaScript

#### Technologies

- **Flask** : Serveur HTTP léger
- **python-rtmidi** : Gestion MIDI
- **openai** : Client API OpenAI
- **sqlite3** : Base de données locale
- **ui.WebView** : Affichage de l'interface web

#### Structure de fichiers

```
PYTHONISTA/
├── HTML_Studio_V4_0.py          # Point d'entrée principal
├── modules/
│   ├── midi_manager.py          # Gestion MIDI
│   ├── gpt_client.py            # Client OpenAI
│   ├── persistence.py           # Persistance
│   └── api_routes.py            # Routes Flask
├── data/
│   ├── projects/                # Projets sauvegardés
│   └── livetechno.db            # Base de données SQLite
└── user_openai_key.json         # Clé API (non versionné)
```

### 2. Frontend JavaScript (projet/)

#### Responsabilités

- **UI Manager** : Rendu du bureau virtuel, timeline, mixer
- **State Manager** : Gestion de l'état global (ProjectState.v1)
- **GPT Chat** : Interface de chat avec GPT
- **MIDI Export** : Préparation des données pour l'export
- **DSP Controller** : Contrôle des AudioWorklets

#### Technologies

- **Vanilla JavaScript** : Pas de framework (performance)
- **Canvas API** : Rendu du bureau virtuel et des câbles
- **Web Audio API** : DSP temps réel
- **Fetch API** : Communication avec le backend Python

#### Structure de fichiers

```
projet/
├── index.html                   # Point d'entrée HTML
├── app.js                       # Contrôleur principal
├── modules/
│   ├── ui_manager.js            # Gestion de l'UI
│   ├── state_manager.js         # Gestion de l'état
│   ├── gpt_chat.js              # Interface GPT
│   ├── midi_export.js           # Export MIDI
│   └── dsp_controller.js        # Contrôle DSP
├── dsp/
│   ├── worklets/
│   │   ├── oscillators.worklet.js
│   │   ├── filters.worklet.js
│   │   └── machines/
│   │       ├── moog.subsequent37.worklet.js
│   │       ├── behringer.rd9.worklet.js
│   │       ├── roland.tb303.worklet.js
│   │       └── eventide.h90.worklet.js
│   └── engine.js                # Gestionnaire DSP principal
├── styles/
│   ├── main.css                 # Styles principaux
│   ├── timeline.css             # Styles timeline
│   └── mixer.css                # Styles mixer
└── assets/
    ├── icons/                   # Icônes des machines
    └── fonts/                   # Polices personnalisées
```

### 3. DSP (AudioWorklet)

#### Responsabilités

- **Génération audio** : Oscillateurs anti-alias (PolyBLEP)
- **Filtrage** : Filtres ZDF (lowpass, highpass, bandpass)
- **Effets** : Distorsion, delay, reverb
- **Pré-écoute** : Simulation des machines hardware

#### Technologies

- **AudioWorklet** : Traitement audio dans un thread dédié
- **WebAssembly** (optionnel) : Optimisation des calculs intensifs

#### Architecture DSP

```
AudioContext
├─ Machine 1 (Moog Subsequent 37)
│  ├─ Oscillator (PolyBLEP Sawtooth)
│  ├─ Filter (ZDF Lowpass)
│  └─ Envelope (ADSR)
├─ Machine 2 (Behringer RD-9)
│  ├─ Kick (808-style)
│  ├─ Snare (909-style)
│  └─ Hi-Hat (Noise + Filter)
├─ Machine 3 (Roland TB-303)
│  ├─ Oscillator (Square/Saw)
│  ├─ Filter (Resonant Lowpass)
│  └─ Envelope (Accent)
├─ Machine 4 (Eventide H90)
│  ├─ Reverb (Algorithmic)
│  ├─ Delay (Stereo)
│  └─ Modulation (Chorus/Flanger)
└─ Master Output
   ├─ Limiter
   └─ Destination
```

## Flux de données

### 1. Ajout d'une machine

```
User (UI)
  │
  ├─> JavaScript: sendToPython({ action: "addMachine", ... })
  │
  ├─> Python: handle_command()
  │     ├─> Valider contre Machine.v1.schema.json
  │     ├─> Ajouter à ProjectState
  │     └─> Envoyer Acknowledgement.v1
  │
  └─> JavaScript: receiveFromPython({ type: "acknowledgement", ... })
        ├─> Mettre à jour l'UI
        ├─> Créer AudioWorkletNode
        └─> Afficher la machine sur le canvas
```

### 2. Génération de pattern par GPT

```
User (Chat)
  │
  ├─> JavaScript: "Crée un pattern de kick"
  │
  ├─> Python: call_gpt(messages)
  │     ├─> OpenAI API: ChatCompletion.create()
  │     ├─> Parser la réponse JSON (CreatePattern.v1)
  │     ├─> Valider contre le schéma
  │     └─> Retourner le pattern
  │
  └─> JavaScript: receiveFromPython({ type: "gptResponse", ... })
        ├─> Afficher le pattern dans la timeline
        ├─> Programmer les notes dans le séquenceur
        └─> Mettre à jour ProjectState
```

### 3. Export MIDI

```
User (UI)
  │
  ├─> JavaScript: exportMIDI()
  │     ├─> Préparer ExportPlan.v1
  │     └─> sendToPython({ action: "saveMIDI", ... })
  │
  ├─> Python: save_midi(patterns)
  │     ├─> Créer MidiFile (mido)
  │     ├─> Ajouter les tracks
  │     ├─> Convertir notes → MIDI messages
  │     ├─> Convertir automation → CC/NRPN
  │     └─> Sauvegarder output.mid
  │
  └─> JavaScript: receiveFromPython({ type: "acknowledgement", success: true })
        └─> Afficher notification "MIDI exporté"
```

## Protocoles de communication

### 1. Python ↔ JavaScript (WebView)

#### URL Scheme (ui.WebView)

```javascript
// JavaScript → Python
sendToPython({ action: "addMachine", machineId: "moog.subsequent37" });

// Implémentation
function sendToPython(data) {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = `pythonista://${encodeURIComponent(JSON.stringify(data))}`;
    document.body.appendChild(iframe);
    setTimeout(() => document.body.removeChild(iframe), 100);
}
```

```python
# Python → JavaScript
def send_to_js(self, data):
    js_code = f"window.receiveFromPython({json.dumps(data)});"
    self.webview.eval_js(js_code)
```

#### REST API (Flask)

```javascript
// JavaScript → Python
const response = await fetch("http://127.0.0.1:5000/api/machines", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ machineId: "moog.subsequent37", channel: 1 })
});

const data = await response.json();
```

```python
# Python → JavaScript
@app.route("/api/machines", methods=["POST"])
def add_machine():
    data = request.json
    # ... logique ...
    return jsonify({"success": True, "machine": machine})
```

### 2. Main Thread ↔ Audio Thread (AudioWorklet)

#### Messages

```javascript
// Main → Audio
oscillatorNode.port.postMessage({
    type: "setFrequency",
    value: 880
});

// Audio → Main
this.port.postMessage({
    type: "performance",
    avgProcessTime: 1.2
});
```

#### Paramètres automatisables

```javascript
// Main → Audio (automation)
const freqParam = oscillatorNode.parameters.get("frequency");
freqParam.setValueAtTime(440, audioContext.currentTime);
freqParam.linearRampToValueAtTime(880, audioContext.currentTime + 1);
```

### 3. IA ↔ App (Actions JSON)

#### Format des actions

Toutes les actions suivent le format défini dans `SCHEMAS/actions/`.

**Exemple : AddMachine.v1**

```json
{
  "schema": "AddMachine.v1",
  "machineId": "moog.subsequent37",
  "channel": 1,
  "position": { "x": 100, "y": 200 }
}
```

**Exemple : CreatePattern.v1**

```json
{
  "schema": "CreatePattern.v1",
  "machineId": "behringer.rd9",
  "bars": 4,
  "steps": 16,
  "notes": [
    { "step": 0, "note": 36, "velocity": 100, "duration": 0.125 }
  ],
  "automation": [
    { "step": 0, "cc": 74, "value": 64 }
  ]
}
```

## Gestion de l'état

### ProjectState.v1

L'état global de l'application est représenté par le schéma `ProjectState.v1`.

```json
{
  "schema": "ProjectState.v1",
  "version": "1.0.0",
  "metadata": {
    "title": "Mon projet techno",
    "author": "User",
    "bpm": 128,
    "createdAt": "2025-10-21T12:00:00Z",
    "updatedAt": "2025-10-21T14:30:00Z"
  },
  "machines": [
    {
      "id": "moog.subsequent37",
      "channel": 1,
      "position": { "x": 100, "y": 200 },
      "parameters": {
        "cutoff": 64,
        "resonance": 32
      }
    }
  ],
  "patterns": [
    {
      "machineId": "moog.subsequent37",
      "bars": 4,
      "notes": [/* ... */]
    }
  ],
  "arrangement": {
    "timeline": [
      {
        "patternId": "pattern-1",
        "startBar": 0,
        "endBar": 4,
        "track": 0
      }
    ]
  },
  "routing": {
    "cables": [
      {
        "from": "moog.subsequent37",
        "to": "eventide.h90",
        "type": "audio"
      }
    ]
  }
}
```

### Synchronisation

```javascript
// Sauvegarder l'état
async function saveProject() {
    const state = stateManager.getState();
    
    await callAPI("projects/save", {
        name: state.metadata.title,
        state: state
    });
}

// Charger l'état
async function loadProject(projectId) {
    const response = await callAPI("projects/load", { projectId });
    
    stateManager.setState(response.state);
    uiManager.render();
}
```

## Sécurité

### 1. Clé API OpenAI

```python
# ✅ CORRECT : Keychain iOS
import keychain

api_key = keychain.get_password("livetechno", "openai_key")
openai.api_key = api_key
```

```python
# ❌ INTERDIT : Clé en dur
openai.api_key = "sk-..."  # NE JAMAIS FAIRE
```

### 2. Validation des schémas

```python
import jsonschema

def validate_action(action):
    """Valide une action JSON contre son schéma."""
    schema_name = action.get("schema")
    
    with open(f"SCHEMAS/actions/{schema_name}.schema.json", "r") as f:
        schema = json.load(f)
    
    jsonschema.validate(instance=action, schema=schema)
```

### 3. Sanitization des entrées

```python
def sanitize_machine_id(machine_id):
    """Nettoie un ID de machine."""
    # Autoriser uniquement alphanumériques, points et tirets
    import re
    if not re.match(r"^[a-z0-9.-]+$", machine_id):
        raise ValueError(f"ID de machine invalide : {machine_id}")
    
    return machine_id
```

## Performance

### Cibles (iPhone 14 Pro Max)

| Métrique | Cible | Mesure actuelle |
|----------|-------|-----------------|
| CPU audio | < 30% | TODO |
| Latence totale | < 50 ms | TODO |
| Temps de chargement | < 2 s | TODO |
| Mémoire totale | < 200 MB | TODO |
| FPS UI | 60 fps | TODO |

### Optimisations

#### 1. DSP

- **Réutilisation des buffers** : Pas d'allocation dans le thread audio
- **Oversampling sélectif** : Uniquement pour les non-linéarités
- **WASM pour calculs intensifs** : FFT, convolution

#### 2. UI

- **Canvas offscreen** : Pré-rendu des éléments statiques
- **RequestAnimationFrame** : Synchronisation avec le refresh rate
- **Lazy loading** : Chargement différé des machines

#### 3. Backend

- **Threading** : Tâches longues en arrière-plan
- **Caching** : Réponses GPT fréquentes
- **Compression** : Gzip pour les fichiers JSON

## Déploiement

### Prérequis

- iPhone 14 Pro Max (iOS 16+)
- Pythonista 3.4+
- Connexion WiFi (pour OpenAI API)

### Installation

1. Cloner le dépôt GitHub dans Pythonista
2. Installer les dépendances Python (StaSh)
3. Configurer la clé API OpenAI (Keychain)
4. Lancer `HTML_Studio_V4_0.py`

### Mise à jour

```bash
# Dans Pythonista (StaSh)
cd LiveTechno-Web-Pythonista-Edition-iPhone-14-Pro-Max-
git pull origin main
```

## Références

- [Pythonista Documentation](http://omz-software.com/pythonista/docs/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [OpenAI API](https://platform.openai.com/docs/)
- [MIDI Specification](https://www.midi.org/specifications)

## Prochaines étapes

1. Implémenter le backend Python complet
2. Créer l'interface web (HTML/CSS/JS)
3. Développer les AudioWorklets pour les 4 machines
4. Intégrer l'API OpenAI avec validation
5. Tester sur iPhone 14 Pro Max

