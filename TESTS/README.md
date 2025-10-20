# Tests et Goldens

## Vue d'ensemble

Ce répertoire contient les tests et les fichiers de référence (goldens) pour valider le comportement de l'application.

## Structure

```
TESTS/
├── README.md                    # Ce fichier
├── goldens/                     # Fichiers de référence
│   └── exports/                 # Exports MIDI de référence
│       ├── bassline_A.mid       # TODO: Ligne de basse simple
│       └── drums_basic.mid      # TODO: Pattern de batterie basique
└── unit/                        # Tests unitaires (à créer)
```

## Goldens

Les **goldens** sont des fichiers de référence qui définissent le comportement attendu de l'application. Ils servent de base pour les tests de régression.

### Exports MIDI

Les exports MIDI goldens sont des fichiers `.mid` de référence qui valident :

- **Structure** : nombre de pistes, noms, canaux MIDI
- **Timing** : BPM, signature, PPQ
- **Événements** : Note On/Off, CC, NRPN, Program Change
- **Déterminisme** : reproductibilité exacte

### Modification des goldens

**Règle stricte** : toute PR qui modifie un golden doit :

1. **Justifier musicalement** : pourquoi cette modification ?
2. **Fournir une validation** : écoute, analyse, comparaison
3. **Documenter l'impact** : quels utilisateurs sont affectés ?
4. **Obtenir une revue** : approbation explicite du mainteneur

## Tests unitaires

**TODO** : À implémenter

### Python

```python
import unittest
from machine import Machine

class TestMachine(unittest.TestCase):
    def test_midi_channel_valid(self):
        machine = Machine("moog.subsequent37", 1)
        self.assertEqual(machine.midi_channel, 1)
    
    def test_midi_channel_invalid(self):
        with self.assertRaises(ValueError):
            Machine("moog.subsequent37", 17)
```

### JavaScript

```javascript
import { Machine } from './machine.js';
import { test } from 'node:test';
import assert from 'node:assert';

test('Machine: canal MIDI valide', () => {
  const machine = new Machine('moog.subsequent37', 1);
  assert.strictEqual(machine.midiChannel, 1);
});

test('Machine: canal MIDI invalide', () => {
  assert.throws(() => {
    new Machine('moog.subsequent37', 17);
  }, Error);
});
```

## Tests d'intégration

**TODO** : À implémenter

### Smoke tests

Tests basiques pour chaque machine :

1. Charger la spec JSON
2. Créer un pattern minimal
3. Appliquer une automation
4. Exporter en MIDI
5. Valider la structure du fichier MIDI

### Exemple

```python
def test_moog_subsequent37_smoke():
    # Charger la machine
    machine = load_machine("moog.subsequent37")
    
    # Créer un pattern minimal
    pattern = create_pattern(
        machine=machine,
        steps=[
            {"t": 0, "note": 48, "vel": 96},
            {"t": 4, "note": 50, "vel": 96}
        ]
    )
    
    # Appliquer une automation
    pattern.add_automation("cutoff", at=0, val=0.5)
    
    # Exporter en MIDI
    midi_file = export_midi(pattern)
    
    # Valider
    assert midi_file.tracks[0].name == "BASS"
    assert len(midi_file.tracks[0].events) > 0
```

## Tests de performance

**Cible** : iPhone 14 Pro Max

- **CPU** : < 30% pour 3 machines + FX
- **Mémoire** : < 500 MB
- **Latence audio** : < 50 ms (indicatif)
- **FPS** : 60 fps pour animations UI

### Mesure

```javascript
// Mesure CPU (approximative)
const start = performance.now();
// ... opération ...
const end = performance.now();
console.log(`Durée: ${end - start} ms`);

// Mesure mémoire
console.log(`Mémoire: ${performance.memory.usedJSHeapSize / 1024 / 1024} MB`);
```

## Validation des schémas

Avant chaque commit, valider les schémas JSON :

```bash
python3 TOOLS/validate.py SCHEMAS/
python3 TOOLS/validate.py MACHINES/
```

## Exécution des tests

**TODO** : À implémenter

```bash
# Tests Python
python3 -m unittest discover TESTS/unit/

# Tests JavaScript
node --test TESTS/unit/
```

## Références

- **TOOLS/validate.py** : validation des schémas JSON
- **TOOLS/hash_docs.py** : calcul des hashes SHA-256
- **DOCUMENTATION/CODING/normes_code.md** : normes de tests

