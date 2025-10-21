# Guide de tests et validation pour LiveTechno-Web

## Philosophie de test

LiveTechno-Web est une application **critique** pour la production musicale live. Les tests doivent garantir :

1. **Zéro glitch audio** : Aucune interruption du DSP en temps réel
2. **Fidélité MIDI** : Export MIDI bit-perfect conforme aux specs
3. **Cohérence IA** : Validation des actions JSON générées par GPT
4. **Stabilité UI** : Pas de crash, pas de freeze

## Stratégie de test multi-niveaux

```
┌─────────────────────────────────────────────────────────────┐
│  Niveau 1 : Tests unitaires (Python, JavaScript)            │
│  ├─ Validation des schémas JSON                             │
│  ├─ Logique métier (patterns, machines, routing)            │
│  └─ Conversion MIDI (notes, CC, NRPN)                       │
├─────────────────────────────────────────────────────────────┤
│  Niveau 2 : Tests d'intégration                             │
│  ├─ Communication Python ↔ JavaScript                       │
│  ├─ API OpenAI (mocks + tests réels)                        │
│  └─ Persistance (JSON, SQLite)                              │
├─────────────────────────────────────────────────────────────┤
│  Niveau 3 : Tests DSP (AudioWorklet)                        │
│  ├─ Oscillateurs (anti-aliasing, précision de phase)        │
│  ├─ Filtres (réponse en fréquence, stabilité)               │
│  └─ Performance (CPU, latence, glitches)                    │
├─────────────────────────────────────────────────────────────┤
│  Niveau 4 : Tests MIDI (goldens)                            │
│  ├─ Export MIDI bit-perfect                                 │
│  ├─ Validation contre fichiers de référence                 │
│  └─ Tests de régression                                     │
├─────────────────────────────────────────────────────────────┤
│  Niveau 5 : Tests UI/UX                                     │
│  ├─ Interactions utilisateur (drag & drop, clicks)          │
│  ├─ Rendu canvas (timeline, câbles, machines)               │
│  └─ Responsive (iPhone 14 Pro Max)                          │
└─────────────────────────────────────────────────────────────┘
```

## Niveau 1 : Tests unitaires

### Python (pytest)

#### Installation

```bash
pip install pytest pytest-cov
```

#### Structure

```
TESTS/
├── unit/
│   ├── test_schemas.py
│   ├── test_midi_export.py
│   ├── test_pattern_logic.py
│   └── test_persistence.py
├── integration/
│   ├── test_api.py
│   └── test_gpt_integration.py
├── dsp/
│   ├── test_oscillators.py
│   └── test_filters.py
└── goldens/
    ├── exports/
    │   ├── bassline_A.mid
    │   └── drums_basic.mid
    └── audio/
        ├── moog_saw_440hz.wav
        └── rd9_kick.wav
```

#### Exemple : Validation des schémas JSON

```python
# TESTS/unit/test_schemas.py
import pytest
import json
import jsonschema

def load_schema(name):
    """Charge un schéma JSON."""
    with open(f"SCHEMAS/{name}.schema.json", "r") as f:
        return json.load(f)

def test_machine_schema_valid():
    """Vérifie que le schéma Machine.v1 est valide."""
    schema = load_schema("Machine.v1")
    
    # Vérifier que c'est un schéma JSON valide
    jsonschema.Draft7Validator.check_schema(schema)

def test_machine_instance_valid():
    """Vérifie qu'une instance de machine est valide."""
    schema = load_schema("Machine.v1")
    
    machine = {
        "schema": "Machine.v1",
        "id": "moog.subsequent37",
        "displayName": "Moog Subsequent 37",
        "category": "synth",
        "midi": {
            "defaultChannel": 1,
            "supports": ["note", "cc"],
            "ccMap": []
        },
        "dsp": {
            "oscillators": [],
            "filters": []
        }
    }
    
    # Valider l'instance
    jsonschema.validate(instance=machine, schema=schema)

def test_machine_instance_invalid():
    """Vérifie qu'une instance invalide est rejetée."""
    schema = load_schema("Machine.v1")
    
    # Machine sans champ obligatoire "id"
    invalid_machine = {
        "schema": "Machine.v1",
        "displayName": "Test"
    }
    
    with pytest.raises(jsonschema.ValidationError):
        jsonschema.validate(instance=invalid_machine, schema=schema)

def test_pattern_schema_valid():
    """Vérifie que le schéma Pattern.v1 est valide."""
    schema = load_schema("Pattern.v1")
    jsonschema.Draft7Validator.check_schema(schema)

def test_pattern_instance_valid():
    """Vérifie qu'un pattern valide passe la validation."""
    schema = load_schema("Pattern.v1")
    
    pattern = {
        "schema": "Pattern.v1",
        "machineId": "moog.subsequent37",
        "bars": 4,
        "steps": 16,
        "notes": [
            {
                "step": 0,
                "note": 60,
                "velocity": 100,
                "duration": 0.5
            }
        ],
        "automation": []
    }
    
    jsonschema.validate(instance=pattern, schema=schema)
```

#### Exemple : Tests MIDI export

```python
# TESTS/unit/test_midi_export.py
import pytest
from mido import MidiFile, MidiTrack, Message

def test_note_to_midi():
    """Vérifie la conversion note → MIDI."""
    from midi_export import note_to_midi_messages
    
    note = {
        "step": 0,
        "note": 60,
        "velocity": 100,
        "duration": 0.5
    }
    
    messages = note_to_midi_messages(note, ticks_per_beat=480)
    
    assert len(messages) == 2  # Note On + Note Off
    assert messages[0].type == "note_on"
    assert messages[0].note == 60
    assert messages[0].velocity == 100
    assert messages[1].type == "note_off"
    assert messages[1].note == 60

def test_cc_to_midi():
    """Vérifie la conversion CC → MIDI."""
    from midi_export import cc_to_midi_message
    
    cc = {
        "step": 4,
        "cc": 74,
        "value": 64
    }
    
    message = cc_to_midi_message(cc, channel=1)
    
    assert message.type == "control_change"
    assert message.control == 74
    assert message.value == 64
    assert message.channel == 1

def test_nrpn_to_midi():
    """Vérifie la conversion NRPN → MIDI."""
    from midi_export import nrpn_to_midi_messages
    
    nrpn = {
        "step": 0,
        "param": 256,
        "value": 8192
    }
    
    messages = nrpn_to_midi_messages(nrpn, channel=1)
    
    assert len(messages) == 4  # NRPN MSB, LSB, Data MSB, LSB
    assert messages[0].control == 99  # NRPN MSB
    assert messages[1].control == 98  # NRPN LSB
    assert messages[2].control == 6   # Data Entry MSB
    assert messages[3].control == 38  # Data Entry LSB

def test_export_pattern_to_midi():
    """Vérifie l'export complet d'un pattern."""
    from midi_export import export_pattern_to_midi
    
    pattern = {
        "schema": "Pattern.v1",
        "machineId": "moog.subsequent37",
        "bars": 1,
        "steps": 16,
        "notes": [
            {"step": 0, "note": 60, "velocity": 100, "duration": 0.25},
            {"step": 4, "note": 64, "velocity": 90, "duration": 0.25}
        ],
        "automation": [
            {"step": 0, "cc": 74, "value": 64}
        ]
    }
    
    midi_file = export_pattern_to_midi(pattern, channel=1)
    
    # Vérifier la structure
    assert len(midi_file.tracks) == 1
    
    # Compter les messages
    note_ons = [msg for msg in midi_file.tracks[0] if msg.type == "note_on"]
    note_offs = [msg for msg in midi_file.tracks[0] if msg.type == "note_off"]
    ccs = [msg for msg in midi_file.tracks[0] if msg.type == "control_change"]
    
    assert len(note_ons) == 2
    assert len(note_offs) == 2
    assert len(ccs) == 1
```

### JavaScript (Jest)

#### Installation

```bash
npm install --save-dev jest @jest/globals
```

#### Configuration (jest.config.js)

```javascript
module.exports = {
    testEnvironment: "jsdom",
    moduleFileExtensions: ["js", "json"],
    testMatch: ["**/TESTS/**/*.test.js"],
    collectCoverageFrom: [
        "projet/**/*.js",
        "!projet/dsp/**/*.worklet.js"  // Exclure les worklets
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    }
};
```

#### Exemple : Tests DSP

```javascript
// TESTS/dsp/test_oscillators.test.js
import { PolyBLEPOscillator } from "../../projet/dsp/oscillators.js";

describe("PolyBLEP Oscillator", () => {
    let oscillator;
    
    beforeEach(() => {
        oscillator = new PolyBLEPOscillator(44100);
    });
    
    test("should generate sawtooth wave", () => {
        const buffer = new Float32Array(128);
        oscillator.setFrequency(440);
        oscillator.process(buffer);
        
        // Vérifier que le buffer n'est pas vide
        const nonZero = buffer.filter(x => Math.abs(x) > 0.001);
        expect(nonZero.length).toBeGreaterThan(0);
    });
    
    test("should not clip", () => {
        const buffer = new Float32Array(128);
        oscillator.setFrequency(440);
        oscillator.process(buffer);
        
        // Vérifier qu'aucune valeur ne dépasse ±1
        const clipped = buffer.filter(x => Math.abs(x) > 1.0);
        expect(clipped.length).toBe(0);
    });
    
    test("should have correct frequency", () => {
        const sampleRate = 44100;
        const frequency = 440;
        const buffer = new Float32Array(sampleRate);  // 1 seconde
        
        oscillator.setFrequency(frequency);
        oscillator.process(buffer);
        
        // Compter les passages par zéro
        let zeroCrossings = 0;
        for (let i = 1; i < buffer.length; i++) {
            if (buffer[i - 1] < 0 && buffer[i] >= 0) {
                zeroCrossings++;
            }
        }
        
        // Fréquence mesurée = passages par zéro / 2
        const measuredFreq = zeroCrossings / 2;
        
        // Tolérance de 1 Hz
        expect(Math.abs(measuredFreq - frequency)).toBeLessThan(1);
    });
    
    test("should reduce aliasing compared to naive sawtooth", () => {
        // Générer un sawtooth naïf
        const naiveBuffer = new Float32Array(128);
        for (let i = 0; i < naiveBuffer.length; i++) {
            const phase = (i / 128) % 1.0;
            naiveBuffer[i] = 2.0 * phase - 1.0;
        }
        
        // Générer un sawtooth PolyBLEP
        const polyBLEPBuffer = new Float32Array(128);
        oscillator.setFrequency(10000);  // Haute fréquence pour tester l'aliasing
        oscillator.process(polyBLEPBuffer);
        
        // Mesurer l'énergie haute fréquence (FFT simplifiée)
        const naiveHF = measureHighFrequencyEnergy(naiveBuffer);
        const polyBLEPHF = measureHighFrequencyEnergy(polyBLEPBuffer);
        
        // PolyBLEP doit avoir moins d'énergie HF
        expect(polyBLEPHF).toBeLessThan(naiveHF);
    });
});

function measureHighFrequencyEnergy(buffer) {
    // Approximation simple : somme des différences absolues
    let energy = 0;
    for (let i = 1; i < buffer.length; i++) {
        energy += Math.abs(buffer[i] - buffer[i - 1]);
    }
    return energy;
}
```

## Niveau 2 : Tests d'intégration

### Tests API (Python + JavaScript)

```python
# TESTS/integration/test_api.py
import pytest
import json
from flask import Flask
from HTML_Studio_V4_0 import app

@pytest.fixture
def client():
    """Créer un client de test Flask."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_add_machine(client):
    """Tester l'ajout d'une machine via l'API."""
    response = client.post("/api/machines", json={
        "machineId": "moog.subsequent37",
        "channel": 1
    })
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["machine"]["id"] == "moog.subsequent37"

def test_call_gpt_mock(client, monkeypatch):
    """Tester l'appel GPT avec un mock."""
    def mock_gpt_call(*args, **kwargs):
        return {
            "choices": [{
                "message": {
                    "content": "Pattern de kick créé"
                }
            }]
        }
    
    # Remplacer openai.ChatCompletion.create par le mock
    monkeypatch.setattr("openai.ChatCompletion.create", mock_gpt_call)
    
    response = client.post("/api/gpt", json={
        "messages": [
            {"role": "user", "content": "Crée un kick"}
        ]
    })
    
    assert response.status_code == 200
    data = response.get_json()
    assert "Pattern de kick" in data["text"]

def test_export_midi(client):
    """Tester l'export MIDI."""
    response = client.post("/api/midi/export", json={
        "patterns": [
            {
                "machineId": "moog.subsequent37",
                "notes": [
                    {"step": 0, "note": 60, "velocity": 100, "duration": 0.5}
                ]
            }
        ]
    })
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert "output.mid" in data["path"]
```

## Niveau 3 : Tests DSP (AudioWorklet)

### Tests de performance

```javascript
// TESTS/dsp/test_performance.test.js
describe("AudioWorklet Performance", () => {
    test("should process 128 samples in < 3ms", async () => {
        const context = new OfflineAudioContext(1, 128, 44100);
        await context.audioWorklet.addModule("dsp/worklets/oscillators.worklet.js");
        
        const node = new AudioWorkletNode(context, "polyblep-oscillator");
        node.connect(context.destination);
        
        const startTime = performance.now();
        await context.startRendering();
        const endTime = performance.now();
        
        const processingTime = endTime - startTime;
        
        // Cible : < 3ms pour 128 samples (budget temps réel à 44.1kHz)
        expect(processingTime).toBeLessThan(3);
    });
    
    test("should not allocate memory during processing", () => {
        // Test avec heap snapshots (nécessite Chrome DevTools Protocol)
        // Vérifier que la mémoire n'augmente pas pendant le traitement
    });
});
```

## Niveau 4 : Tests MIDI (goldens)

### Création des goldens

```python
# TESTS/create_goldens.py
from mido import MidiFile, MidiTrack, Message

def create_bassline_golden():
    """Créer un fichier MIDI de référence pour une bassline."""
    mid = MidiFile()
    track = MidiTrack()
    mid.tracks.append(track)
    
    track.append(Message("program_change", program=0, time=0))
    
    # Pattern : C3 - E3 - G3 - C4
    notes = [48, 52, 55, 60]
    
    for i, note in enumerate(notes):
        track.append(Message("note_on", note=note, velocity=100, time=0 if i == 0 else 480))
        track.append(Message("note_off", note=note, velocity=0, time=480))
    
    mid.save("TESTS/goldens/exports/bassline_A.mid")
    print("✅ Golden créé : bassline_A.mid")

def create_drums_golden():
    """Créer un fichier MIDI de référence pour une batterie."""
    mid = MidiFile()
    track = MidiTrack()
    mid.tracks.append(track)
    
    # Pattern : Kick (36) sur 1 et 3, Snare (38) sur 2 et 4
    pattern = [
        (0, 36, 100),    # Kick
        (480, 38, 90),   # Snare
        (480, 36, 100),  # Kick
        (480, 38, 90)    # Snare
    ]
    
    for time, note, velocity in pattern:
        track.append(Message("note_on", note=note, velocity=velocity, time=time))
        track.append(Message("note_off", note=note, velocity=0, time=120))
    
    mid.save("TESTS/goldens/exports/drums_basic.mid")
    print("✅ Golden créé : drums_basic.mid")

if __name__ == "__main__":
    create_bassline_golden()
    create_drums_golden()
```

### Tests de régression

```python
# TESTS/unit/test_midi_regression.py
import pytest
from mido import MidiFile
import hashlib

def midi_file_hash(path):
    """Calcule le hash SHA-256 d'un fichier MIDI."""
    mid = MidiFile(path)
    
    # Sérialiser tous les messages
    messages = []
    for track in mid.tracks:
        for msg in track:
            messages.append(str(msg))
    
    content = "".join(messages)
    return hashlib.sha256(content.encode()).hexdigest()

def test_bassline_export_matches_golden():
    """Vérifie que l'export d'une bassline correspond au golden."""
    from midi_export import export_pattern_to_midi
    
    pattern = {
        "machineId": "moog.subsequent37",
        "notes": [
            {"step": 0, "note": 48, "velocity": 100, "duration": 0.5},
            {"step": 4, "note": 52, "velocity": 100, "duration": 0.5},
            {"step": 8, "note": 55, "velocity": 100, "duration": 0.5},
            {"step": 12, "note": 60, "velocity": 100, "duration": 0.5}
        ]
    }
    
    # Exporter
    midi_file = export_pattern_to_midi(pattern, channel=1)
    midi_file.save("TESTS/temp/bassline_test.mid")
    
    # Comparer les hashes
    golden_hash = midi_file_hash("TESTS/goldens/exports/bassline_A.mid")
    test_hash = midi_file_hash("TESTS/temp/bassline_test.mid")
    
    assert test_hash == golden_hash, "L'export MIDI ne correspond pas au golden"

def test_drums_export_matches_golden():
    """Vérifie que l'export d'une batterie correspond au golden."""
    from midi_export import export_pattern_to_midi
    
    pattern = {
        "machineId": "behringer.rd9",
        "notes": [
            {"step": 0, "note": 36, "velocity": 100, "duration": 0.125},
            {"step": 4, "note": 38, "velocity": 90, "duration": 0.125},
            {"step": 8, "note": 36, "velocity": 100, "duration": 0.125},
            {"step": 12, "note": 38, "velocity": 90, "duration": 0.125}
        ]
    }
    
    midi_file = export_pattern_to_midi(pattern, channel=10)
    midi_file.save("TESTS/temp/drums_test.mid")
    
    golden_hash = midi_file_hash("TESTS/goldens/exports/drums_basic.mid")
    test_hash = midi_file_hash("TESTS/temp/drums_test.mid")
    
    assert test_hash == golden_hash
```

## Niveau 5 : Tests UI/UX

### Tests d'interaction (Playwright)

```javascript
// TESTS/ui/test_interactions.spec.js
const { test, expect } = require("@playwright/test");

test("should add machine via drag and drop", async ({ page }) => {
    await page.goto("http://127.0.0.1:5000");
    
    // Glisser une machine sur le canvas
    await page.dragAndDrop("#machine-moog", "#canvas");
    
    // Vérifier qu'elle apparaît
    const machine = await page.locator(".machine[data-id='moog.subsequent37']");
    await expect(machine).toBeVisible();
});

test("should create pattern via GPT", async ({ page }) => {
    await page.goto("http://127.0.0.1:5000");
    
    // Ouvrir le chat
    await page.click("#chat-button");
    
    // Envoyer une commande
    await page.fill("#chat-input", "Crée un pattern de kick");
    await page.click("#send-button");
    
    // Attendre la réponse
    await page.waitForSelector(".gpt-response");
    
    // Vérifier qu'un pattern a été créé
    const pattern = await page.locator(".pattern[data-machine='behringer.rd9']");
    await expect(pattern).toBeVisible();
});
```

## Commandes de test

### Exécuter tous les tests

```bash
# Python
pytest TESTS/ -v --cov=. --cov-report=html

# JavaScript
npm test

# Tous
./run_all_tests.sh
```

### Tests de régression uniquement

```bash
pytest TESTS/unit/test_midi_regression.py -v
```

### Tests de performance

```bash
pytest TESTS/dsp/test_performance.py -v --benchmark
```

## CI/CD (GitHub Actions)

```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  test-python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: "3.11"
      - run: pip install -r requirements.txt
      - run: pytest TESTS/ -v --cov

  test-javascript:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "22"
      - run: npm install
      - run: npm test

  validate-schemas:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
      - run: python3 TOOLS/validate.py SCHEMAS/
```

## Métriques de qualité

### Cibles de couverture

| Composant | Couverture cible | Actuel |
|-----------|------------------|--------|
| Schémas JSON | 100% | TODO |
| MIDI export | 95% | TODO |
| DSP (oscillateurs) | 90% | TODO |
| API REST | 85% | TODO |
| UI (interactions) | 70% | TODO |

### Métriques de performance

| Métrique | Cible | Mesure |
|----------|-------|--------|
| Temps de traitement DSP | < 3ms / 128 samples | TODO |
| Latence totale | < 50ms | TODO |
| Export MIDI | < 500ms | TODO |
| Chargement app | < 2s | TODO |

## Références

- [pytest Documentation](https://docs.pytest.org/)
- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Web Audio API Testing](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Testing)

## Prochaines étapes

1. Créer les goldens MIDI de référence
2. Implémenter les tests unitaires pour les schémas
3. Ajouter les tests de régression MIDI
4. Configurer CI/CD sur GitHub Actions
5. Atteindre 80% de couverture de code

