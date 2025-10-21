# Prototype v0.1 (MVP) — Spécification complète

> **Objectif** : Créer un prototype fonctionnel minimal avec 2 machines (Behringer RD-9 + TD-3), séquenceurs opérationnels, timeline, et export MIDI complet.

---

## 🎯 Objectifs du prototype v0.1

### Fonctionnalités essentielles (MVP)

1. **Gate OpenAI** : Pop-up de saisie de clé API au démarrage
2. **Bureau virtuel** : Canvas plein écran avec drag & drop
3. **2 machines fonctionnelles** : Behringer RD-9 (drums) + TD-3 (bass)
4. **Séquenceurs 16 steps** : Édition notes + automation CC
5. **Timeline multi-pistes** : Arrangement façon DAW
6. **Chat IA intégré** : Génération de patterns via GPT-4.1-mini
7. **DSP temps réel** : Pré-écoute audio via AudioWorklet
8. **Export MIDI** : Fichiers `.mid` multi-pistes prêts pour hardware

### Non-objectifs (v0.2+)

- ❌ Moog Subsequent 37 (reporté à v0.2)
- ❌ Eventide H90 (reporté à v0.2)
- ❌ Effets audio (reverb, delay) (reporté à v0.2)
- ❌ Enregistrement audio (reporté à v0.3)
- ❌ Synchronisation MIDI externe (reporté à v0.3)

---

## 🏗️ Architecture du prototype

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│  iPhone 14 Pro Max (Pythonista App)                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  HTML_Studio_V4_0.py (Backend Python)                 │  │
│  │  ├─ Flask Server (127.0.0.1:8787)                     │  │
│  │  ├─ OpenAI Client (GPT-4.1-mini)                      │  │
│  │  ├─ MIDI Manager (python-rtmidi)                      │  │
│  │  └─ Persistence (JSON + SQLite)                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ▲ ▼                                │
│                    REST API / Fetch                          │
│                           ▲ ▼                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  WebView (index.html)                                 │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Gate OpenAI (Pop-up clé API)                   │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Bureau virtuel (Canvas)                        │  │  │
│  │  │  ├─ RD-9 (drag & drop)                          │  │  │
│  │  │  └─ TD-3 (drag & drop)                          │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Timeline (Multi-pistes)                        │  │  │
│  │  │  ├─ Track 1 : RD-9 (MIDI Ch 10)                 │  │  │
│  │  │  └─ Track 2 : TD-3 (MIDI Ch 1)                  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Séquenceurs (16 steps)                         │  │  │
│  │  │  ├─ RD-9 : 11 instruments (BD, SD, HH, etc.)    │  │  │
│  │  │  └─ TD-3 : Notes + slide + accent               │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Chat IA (docké en bas)                         │  │  │
│  │  │  └─ "Crée un kick 4/4" → GPT génère pattern    │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  DSP AudioWorklet                               │  │  │
│  │  │  ├─ RD-9 : Synthèse 909-style                   │  │  │
│  │  │  └─ TD-3 : Oscillateur + filtre résonant        │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎹 Machine 1 : Behringer RD-9

### Spécifications

- **Type** : Boîte à rythmes (clone Roland TR-909)
- **Canal MIDI** : 10 (standard drums)
- **Instruments** : 11 (BD, SD, LT, MT, HT, RS, CP, CB, CY, OH, CH)
- **Séquenceur** : 16 steps par instrument
- **Automation** : CC pour accent, tuning, decay

### Mappings MIDI (sourcés depuis manuel officiel)

| Instrument | Note MIDI | CC Accent | CC Tuning | CC Decay |
|------------|-----------|-----------|-----------|----------|
| BD (Kick)  | 36        | 46        | 47        | 48       |
| SD (Snare) | 38        | 49        | 50        | 51       |
| LT (Low Tom) | 43      | 52        | 53        | 54       |
| MT (Mid Tom) | 47      | 55        | 56        | 57       |
| HT (High Tom) | 50     | 58        | 59        | 60       |
| RS (Rimshot) | 37      | 61        | 62        | 63       |
| CP (Clap)  | 39        | 64        | 65        | 66       |
| CB (Cowbell) | 56      | 67        | 68        | 69       |
| CY (Cymbal) | 49       | 70        | 71        | 72       |
| OH (Open HH) | 46      | 73        | 74        | 75       |
| CH (Closed HH) | 42    | 76        | 77        | 78       |

### DSP (pré-écoute)

**Kick (BD)** :
- Oscillateur sinusoïdal avec pitch envelope (80 Hz → 40 Hz en 50ms)
- Distorsion légère pour punch
- Envelope ADSR (A=1ms, D=200ms, S=0, R=0)

**Snare (SD)** :
- Noise blanc filtré (highpass 200 Hz)
- Oscillateur sinusoïdal 200 Hz (corps)
- Mix 70% noise / 30% tone
- Envelope ADSR (A=1ms, D=150ms, S=0, R=0)

**Hi-Hats (CH/OH)** :
- Noise blanc filtré (bandpass 8 kHz - 12 kHz)
- Envelope ADSR :
  - CH : A=1ms, D=50ms, S=0, R=0
  - OH : A=1ms, D=300ms, S=0, R=0

### UI (séquenceur)

```
┌─────────────────────────────────────────────────────────────┐
│  Behringer RD-9                                              │
├─────────────────────────────────────────────────────────────┤
│  BD  ▓░░░▓░░░▓░░░▓░░░  [Accent] [Tuning] [Decay]           │
│  SD  ░░░░▓░░░░░░░▓░░░  [Accent] [Tuning] [Decay]           │
│  CH  ▓░▓░▓░▓░▓░▓░▓░▓░  [Accent] [Tuning] [Decay]           │
│  OH  ░░░░░░░░▓░░░░░░░  [Accent] [Tuning] [Decay]           │
│  ...                                                         │
├─────────────────────────────────────────────────────────────┤
│  [▶️ Play] [⏹️ Stop] [🔄 Loop] [💾 Save Pattern]            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎸 Machine 2 : Behringer TD-3

### Spécifications

- **Type** : Synthé basse (clone Roland TB-303)
- **Canal MIDI** : 1
- **Polyphonie** : Monophonique
- **Séquenceur** : 16 steps avec slide, accent, tie
- **Automation** : CC pour cutoff, resonance, envelope, accent

### Mappings MIDI (sourcés depuis manuel officiel)

| Paramètre | CC | Range | Curve | Smoothed |
|-----------|----|-------|-------|----------|
| Cutoff    | 74 | 0-127 | exp   | true     |
| Resonance | 71 | 0-127 | lin   | true     |
| Env Mod   | 72 | 0-127 | lin   | true     |
| Decay     | 73 | 0-127 | lin   | true     |
| Accent    | 75 | 0-127 | lin   | false    |

### DSP (pré-écoute)

**Oscillateur** :
- Waveform : Sawtooth ou Square (sélectionnable)
- Anti-aliasing : PolyBLEP
- Range : C1 - C5 (36-84 MIDI)

**Filtre** :
- Type : Lowpass résonant 24 dB/oct (ZDF)
- Cutoff : 20 Hz - 20 kHz (contrôlé par CC 74)
- Resonance : 0 - 100% (contrôlé par CC 71)
- Envelope modulation : -100% à +100% (contrôlé par CC 72)

**Envelope** :
- ADSR : A=1ms, D=variable (CC 73), S=0, R=10ms
- Accent : Boost velocity +30% + envelope decay ×0.5

**Slide** :
- Portamento exponentiel entre notes
- Temps : 50ms (fixe pour v0.1)

### UI (séquenceur)

```
┌─────────────────────────────────────────────────────────────┐
│  Behringer TD-3                                              │
├─────────────────────────────────────────────────────────────┤
│  Notes  C3 ░░ E3 ░░ G3 ░░ C4 ░░ ░░ ░░ ░░ ░░               │
│  Slide  ░  ░  ▓  ░  ░  ░  ░  ░  ░  ░  ░  ░  ░  ░  ░  ░   │
│  Accent ▓  ░  ░  ▓  ░  ░  ░  ░  ░  ░  ░  ░  ░  ░  ░  ░   │
├─────────────────────────────────────────────────────────────┤
│  Cutoff    [━━━━━━━▓━━━━━━━] 64                            │
│  Resonance [━━━━▓━━━━━━━━━━] 32                            │
│  Env Mod   [━━━━━━━━▓━━━━━━] 80                            │
│  Decay     [━━━━━▓━━━━━━━━━] 48                            │
├─────────────────────────────────────────────────────────────┤
│  [▶️ Play] [⏹️ Stop] [🔄 Loop] [💾 Save Pattern]            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎬 Timeline multi-pistes

### Spécifications

- **Résolution** : 96 PPQ (Pulses Per Quarter)
- **Zoom** : 1 bar - 64 bars
- **Snap** : 1/4, 1/8, 1/16, 1/32, off
- **Tracks** : 2 (RD-9 + TD-3)
- **Automation** : Lanes superposées (cutoff, resonance, etc.)

### UI

```
┌─────────────────────────────────────────────────────────────┐
│  Timeline (BPM: 128, 4/4)                                    │
├─────────────────────────────────────────────────────────────┤
│  Track 1 (RD-9, Ch 10)                                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Pattern A │ Pattern A │ Pattern B │ Pattern A │       │  │
│  └───────────────────────────────────────────────────────┘  │
│  Automation (Accent)                                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Track 2 (TD-3, Ch 1)                                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           │ Bassline  │ Bassline  │ Bassline  │       │  │
│  └───────────────────────────────────────────────────────┘  │
│  Automation (Cutoff)                                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │  │
│  └───────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  [▶️ Play] [⏹️ Stop] [⏺️ Rec] [Zoom: 4 bars] [Snap: 1/16]   │
└─────────────────────────────────────────────────────────────┘
```

---

## 💬 Chat IA intégré

### Fonctionnalités

1. **Génération de patterns** : "Crée un kick 4/4"
2. **Modification de patterns** : "Ajoute une snare sur le 2 et le 4"
3. **Automation** : "Monte le cutoff progressivement"
4. **Arrangement** : "Arrange sur 16 bars : intro, build, drop"
5. **Export** : "Exporte en MIDI"

### Exemple de conversation

```
User: "Crée un kick 4/4 sur le RD-9"

IA: {
  "schema": "CreatePattern.v1",
  "machineId": "behringer.rd9",
  "lengthSteps": 16,
  "steps": [
    {"t": 0, "note": 36, "vel": 110},
    {"t": 4, "note": 36, "vel": 110},
    {"t": 8, "note": 36, "vel": 110},
    {"t": 12, "note": 36, "vel": 110}
  ],
  "explain": "Kick 4/4 classique techno"
}

App: ✅ Pattern créé et ajouté à la timeline

---

User: "Ajoute une bassline funky sur le TD-3"

IA: {
  "schema": "CreatePattern.v1",
  "machineId": "behringer.td3",
  "lengthSteps": 16,
  "steps": [
    {"t": 0, "note": 48, "vel": 100, "accent": true},
    {"t": 3, "note": 50, "vel": 90, "slide": true},
    {"t": 6, "note": 53, "vel": 110},
    {"t": 10, "note": 55, "vel": 100, "slide": true}
  ],
  "automation": [
    {"target": "cutoff", "at": 0, "val": 0.3},
    {"target": "cutoff", "at": 8, "val": 0.8}
  ],
  "explain": "Bassline funky avec slides et montée de cutoff"
}

App: ✅ Pattern créé et ajouté à la timeline
```

---

## 📤 Export MIDI

### Spécifications

- **Format** : MIDI Type 1 (multi-pistes)
- **Résolution** : 480 PPQ
- **Tracks** :
  - Track 0 : Tempo map + signature
  - Track 1 : RD-9 (canal 10)
  - Track 2 : TD-3 (canal 1)
- **Noms de pistes** : "RD-9 DRUMS", "TD-3 BASS"

### Structure du fichier MIDI

```
MIDI File: output.mid
Format: 1 (multi-track)
Tracks: 3
Division: 480 PPQ

Track 0 (Tempo & Signature)
├─ Meta: Set Tempo (BPM 128)
├─ Meta: Time Signature (4/4)
└─ Meta: End of Track

Track 1 (RD-9 DRUMS, Channel 10)
├─ Meta: Track Name "RD-9 DRUMS"
├─ Note On: Note 36 (BD), Velocity 110, Time 0
├─ Note Off: Note 36, Time 120
├─ Note On: Note 38 (SD), Velocity 90, Time 480
├─ Note Off: Note 38, Time 120
├─ CC: 46 (BD Accent), Value 80, Time 0
└─ Meta: End of Track

Track 2 (TD-3 BASS, Channel 1)
├─ Meta: Track Name "TD-3 BASS"
├─ Note On: Note 48 (C3), Velocity 100, Time 0
├─ Note Off: Note 48, Time 480
├─ Note On: Note 50 (D3), Velocity 90, Time 480
├─ Note Off: Note 50, Time 480
├─ CC: 74 (Cutoff), Value 38, Time 0
├─ CC: 74 (Cutoff), Value 102, Time 960
└─ Meta: End of Track
```

---

## 🔒 Gate OpenAI (Pop-up clé API)

### Workflow

1. **Lancement de l'app** : `HTML_Studio_V4_0.py` démarre le serveur Flask
2. **Chargement de index.html** : WebView s'ouvre en plein écran
3. **Vérification clé API** :
   - Si clé existe dans Keychain iOS → Valider
   - Si clé invalide ou absente → Afficher pop-up
4. **Pop-up de saisie** :
   - Champ texte pour la clé API
   - Bouton "Annuler" (ferme l'app)
   - Bouton "Valider et entrer" (teste la clé)
5. **Validation** :
   - Appel minimal à OpenAI API (test de connexion)
   - Si succès → Stocker dans Keychain iOS + accès à l'app
   - Si échec → Message d'erreur + réessayer

### UI de la pop-up

```
┌─────────────────────────────────────────────────┐
│  🎹 LiveTechno-Web                              │
│                                                  │
│  Configuration API OpenAI                       │
│                                                  │
│  Entrez votre clé API OpenAI pour accéder       │
│  à l'IA compositrice.                           │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ Clé API : sk-...                           │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  ℹ️ La clé est stockée de manière sécurisée    │
│     dans le Keychain iOS et n'est jamais        │
│     partagée.                                   │
│                                                  │
│  [ Annuler ]              [ Valider et entrer ] │
└─────────────────────────────────────────────────┘
```

### Code de validation (Python)

```python
import openai
import keychain

def validate_openai_key(api_key):
    """Valide une clé API OpenAI."""
    openai.api_key = api_key
    
    try:
        # Test minimal (1 token)
        response = openai.ChatCompletion.create(
            model="gpt-4.1-mini",
            messages=[{"role": "user", "content": "test"}],
            max_tokens=1
        )
        return True, None
    except openai.error.AuthenticationError:
        return False, "Clé API invalide"
    except Exception as e:
        return False, str(e)

def store_openai_key(api_key):
    """Stocke la clé API dans le Keychain iOS."""
    keychain.set_password("livetechno", "openai_key", api_key)

def load_openai_key():
    """Charge la clé API depuis le Keychain iOS."""
    return keychain.get_password("livetechno", "openai_key")
```

---

## 🧪 Tests du prototype v0.1

### Tests fonctionnels

1. **Gate OpenAI** :
   - ✅ Pop-up s'affiche au premier lancement
   - ✅ Clé invalide → Message d'erreur
   - ✅ Clé valide → Accès à l'app
   - ✅ Clé stockée dans Keychain → Pas de pop-up au prochain lancement

2. **Bureau virtuel** :
   - ✅ Drag & drop RD-9 sur le canvas
   - ✅ Drag & drop TD-3 sur le canvas
   - ✅ Machines déplaçables
   - ✅ Machines supprimables

3. **Séquenceurs** :
   - ✅ RD-9 : Édition 16 steps par instrument
   - ✅ TD-3 : Édition notes + slide + accent
   - ✅ Automation CC fonctionnelle

4. **Timeline** :
   - ✅ Patterns ajoutables sur les tracks
   - ✅ Patterns déplaçables
   - ✅ Automation visible et éditable

5. **Chat IA** :
   - ✅ "Crée un kick 4/4" → Pattern créé
   - ✅ "Ajoute une bassline" → Pattern créé
   - ✅ Actions JSON validées contre schémas

6. **DSP** :
   - ✅ RD-9 : Kick, snare, hi-hats audibles
   - ✅ TD-3 : Oscillateur + filtre résonant audibles
   - ✅ CPU < 30% avec 2 machines

7. **Export MIDI** :
   - ✅ Fichier `.mid` généré
   - ✅ 3 tracks (tempo + RD-9 + TD-3)
   - ✅ Noms de pistes corrects
   - ✅ Notes et CC exportés correctement

### Tests de performance

| Métrique | Cible | Résultat |
|----------|-------|----------|
| CPU audio | < 30% | TODO |
| Latence totale | < 50 ms | TODO |
| Temps de chargement | < 2 s | TODO |
| Mémoire totale | < 200 MB | TODO |
| FPS UI | 60 fps | TODO |

---

## 📋 Checklist de développement

### Phase 1 : Backend Python

- [ ] Implémenter `HTML_Studio_V4_0.py` (serveur Flask)
- [ ] Créer les routes API REST (`/api/machines`, `/api/patterns`, `/api/gpt`, `/api/midi/export`)
- [ ] Intégrer OpenAI API (GPT-4.1-mini)
- [ ] Implémenter la gestion MIDI (python-rtmidi)
- [ ] Créer la persistance (JSON + SQLite)
- [ ] Implémenter le Gate OpenAI (validation + Keychain)

### Phase 2 : Frontend JavaScript

- [ ] Créer `index.html` (structure de base)
- [ ] Implémenter la pop-up Gate OpenAI
- [ ] Créer le bureau virtuel (Canvas + drag & drop)
- [ ] Implémenter les séquenceurs (RD-9 + TD-3)
- [ ] Créer la timeline multi-pistes
- [ ] Implémenter le chat IA
- [ ] Créer le contrôleur d'export MIDI

### Phase 3 : DSP AudioWorklet

- [ ] Créer `dsp.worklet.js` (processeur principal)
- [ ] Implémenter les oscillateurs (PolyBLEP)
- [ ] Implémenter les filtres (ZDF lowpass)
- [ ] Créer le DSP RD-9 (kick, snare, hi-hats)
- [ ] Créer le DSP TD-3 (oscillateur + filtre + envelope)
- [ ] Optimiser les performances (< 30% CPU)

### Phase 4 : Intégration et tests

- [ ] Tester le Gate OpenAI
- [ ] Tester le drag & drop
- [ ] Tester les séquenceurs
- [ ] Tester la timeline
- [ ] Tester le chat IA
- [ ] Tester le DSP
- [ ] Tester l'export MIDI
- [ ] Mesurer les performances

### Phase 5 : Documentation

- [ ] Mettre à jour README.md
- [ ] Créer le guide utilisateur
- [ ] Documenter les API
- [ ] Créer des exemples de patterns
- [ ] Enregistrer des vidéos de démonstration

---

## 🚀 Déploiement

### Prérequis

- iPhone 14 Pro Max (iOS 16+)
- Pythonista 3.4+
- Connexion WiFi
- Clé API OpenAI (GPT-4.1-mini)

### Installation

1. Cloner le dépôt dans Pythonista
2. Installer les dépendances : `pip install flask python-rtmidi openai mido`
3. Lancer `HTML_Studio_V4_0.py`
4. Entrer la clé API OpenAI
5. Profiter !

---

## 📚 Références

- [Behringer RD-9 Manual](https://www.behringer.com/product.html?modelCode=P0DJX)
- [Behringer TD-3 Manual](https://www.behringer.com/product.html?modelCode=P0CM2)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [MIDI Specification](https://www.midi.org/specifications)
- [OpenAI API](https://platform.openai.com/docs/)

---

**Fait avec ❤️ et 🤖 pour la musique techno**

