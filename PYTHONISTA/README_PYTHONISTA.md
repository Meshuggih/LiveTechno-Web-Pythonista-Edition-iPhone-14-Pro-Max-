# 🎹 LiveTechno-Web v0.1 — Pythonista Edition

## 📋 Contenu du dossier

Ce dossier contient l'application complète LiveTechno-Web v0.1 pour iPhone 14 Pro Max via Pythonista.

### Fichiers principaux

- **HTML_Studio_V4_0.py** : Backend Python (Flask, OpenAI, MIDI, Persistence)
- **projet/** : Frontend web (HTML, CSS, JavaScript, AudioWorklet)
  - **index.html** : Structure de l'interface utilisateur
  - **app.js** : Logique frontend (Gate, Bureau, Séquenceurs, Timeline, Chat)
  - **style.css** : Design minimaliste dark theme
  - **dsp.worklet.js** : DSP AudioWorklet (RD-9 + TD-3)
- **data/** : Données de l'application (créé automatiquement)
  - **HTML_Studio_logs.db** : Base SQLite pour les logs
  - **project.json** : État du projet sauvegardé
  - **export.mid** : Fichier MIDI exporté

## 🚀 Installation

### Prérequis

- iPhone 14 Pro Max (iOS 16+)
- Pythonista 3.4+
- Connexion WiFi
- Clé API OpenAI (GPT-4.1-mini)

### Dépendances Python

```bash
pip install flask flask-cors mido openai jsonschema
```

## 🎯 Utilisation

### 1. Lancer le serveur

Dans Pythonista, ouvrir `HTML_Studio_V4_0.py` et appuyer sur **Run**.

Le serveur démarre sur `http://127.0.0.1:8787`.

### 2. Ouvrir l'application

Ouvrir le navigateur intégré de Pythonista et naviguer vers `http://127.0.0.1:8787`.

### 3. Gate OpenAI

Au démarrage, un pop-up demande la clé API OpenAI. Entrer la clé (format `sk-...`) et cliquer sur **Valider**.

La clé est stockée localement dans `localStorage` et validée via le backend.

### 4. Bureau virtuel

Après validation, le bureau virtuel s'affiche avec :
- **Canvas** : Grille pour placer les machines
- **Timeline** : Multi-pistes pour arranger les patterns
- **Chat IA** : Pour générer des patterns via GPT-4.1-mini

### 5. Ajouter des machines

Cliquer sur **+ Machine** pour ouvrir la palette de machines. Deux machines sont disponibles :
- **Behringer RD-9** : Boîte à rythmes (clone TR-909)
- **Behringer TD-3** : Synthé basse (clone TB-303)

Cliquer sur **Ajouter** pour placer la machine sur le bureau.

### 6. Séquenceurs

Double-cliquer sur une machine pour ouvrir son séquenceur :
- **RD-9** : 11 instruments × 16 steps (BD, SD, CH, OH, etc.)
- **TD-3** : 16 steps avec notes, slide, accent

Cliquer sur les steps pour les activer/désactiver.

### 7. Chat IA

Taper une commande dans le chat, par exemple :
- "Crée un kick 4/4 sur le RD-9"
- "Ajoute une bassline funky sur le TD-3"
- "Monte le cutoff progressivement"

L'IA génère un pattern au format `CreatePattern.v1` et l'applique automatiquement.

### 8. Export MIDI

Cliquer sur **Export MIDI** pour générer un fichier `.mid` multi-pistes. Le fichier est téléchargé et peut être importé dans Logic Pro, Ableton Live, etc.

### 9. Sauvegarde/Chargement

- **💾 Save** : Sauvegarde l'état du projet dans `data/project.json`
- **📂 Load** : Charge l'état du projet depuis `data/project.json`

## 🎨 Fonctionnalités

### Backend Python

- ✅ Serveur Flask local (127.0.0.1:8787)
- ✅ Routes API REST (machines, patterns, GPT, MIDI export, project save/load)
- ✅ Intégration OpenAI (GPT-4.1-mini)
- ✅ Export MIDI multi-pistes (mido)
- ✅ Persistence (JSON + SQLite)
- ✅ Gate OpenAI (validation clé API)
- ✅ En-têtes CORS/COOP/COEP

### Frontend JavaScript

- ✅ Gate OpenAI (pop-up de saisie de clé)
- ✅ Bureau virtuel (Canvas, drag & drop)
- ✅ Séquenceurs RD-9 et TD-3
- ✅ Timeline multi-pistes
- ✅ Chat IA (GPT-4.1-mini)
- ✅ Export MIDI
- ✅ Persistence (save/load)

### DSP AudioWorklet

- ✅ Oscillateurs PolyBLEP (sawtooth, square)
- ✅ Filtres ZDF (lowpass 1-pole, 2-pole résonant)
- ✅ Envelopes ADSR
- ✅ RD-9 DSP (kick, snare, hi-hats, toms, etc.)
- ✅ TD-3 DSP (oscillateur + filtre + envelope + slide)
- ✅ Mixer 2 tracks + master limiter

## 📊 Performances

### Cibles

- **CPU** : < 30% avec 2 machines
- **Latence** : < 50ms
- **Mémoire** : < 200MB
- **FPS UI** : 60fps

### Mesures (iPhone 14 Pro Max)

À mesurer lors des tests sur appareil réel.

## 🐛 Débogage

### Logs backend

Les logs sont stockés dans `data/HTML_Studio_logs.db` (SQLite).

Tables :
- `action_logs` : Logs des actions (API calls, etc.)
- `error_logs` : Logs des erreurs

### Console JavaScript

Ouvrir la console du navigateur pour voir les logs frontend.

## 📚 Références

- [Behringer RD-9 Manual](https://www.behringer.com/product.html?modelCode=P0DJX)
- [Behringer TD-3 Manual](https://www.behringer.com/product.html?modelCode=P0CM2)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MIDI Specification](https://www.midi.org/specifications)
- [OpenAI API](https://platform.openai.com/docs/)

## 🤝 Contribution

Voir `AGENTS.md` et `CONTRIBUTING.md` à la racine du dépôt.

## 📝 Licence

Voir `LICENSE` à la racine du dépôt.

---

**Fait avec ❤️ et 🤖 pour la musique techno**

