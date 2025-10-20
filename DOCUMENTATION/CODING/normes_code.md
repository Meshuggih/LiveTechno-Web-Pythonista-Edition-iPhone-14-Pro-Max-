# Normes de code

## Principes généraux

### Style

- **OOP** : programmation orientée objet, classes claires, responsabilités uniques
- **Fonctions pures** : testables, sans effets de bord quand possible
- **Modules clairs** : séparation des concerns, imports explicites
- **Lisibilité > astuce** : code clair et maintenable plutôt qu'optimisations prématurées
- **Méthode > improvisation** : suivre les patterns établis

### Documentation

- **Docs auto** : chaque composant génère un `.md` d'interface (I/O, invariants)
- **Commentaires** : expliquer le "pourquoi", pas le "quoi"
- **Exemples** : fournir des exemples d'utilisation
- **Schémas** : diagrammes pour les architectures complexes

## Python (Pythonista Edition)

### Version

- **Python 3.x** (Pythonista)
- **Stdlib only** : pas de dépendances externes dans la maquette

### Style

- **PEP 8** : suivre les conventions Python
- **Type hints** : utiliser les annotations de type
- **Docstrings** : format Google ou NumPy
- **Indentation** : 4 espaces (configuré dans `.editorconfig`)

### Exemple

```python
from typing import Dict, List, Optional

class Machine:
    """Représentation d'une machine (synthé, boîte à rythmes, effet).
    
    Attributes:
        id: Identifiant unique (vendor.model)
        midi_channel: Canal MIDI (1-16)
        cc_map: Mapping des Control Changes
    """
    
    def __init__(self, id: str, midi_channel: int) -> None:
        """Initialise une machine.
        
        Args:
            id: Identifiant vendor.model
            midi_channel: Canal MIDI (1-16)
            
        Raises:
            ValueError: Si le canal MIDI est invalide
        """
        if not 1 <= midi_channel <= 16:
            raise ValueError(f"Canal MIDI invalide: {midi_channel}")
        
        self.id = id
        self.midi_channel = midi_channel
        self.cc_map: Dict[int, str] = {}
    
    def set_param(self, param: str, value: float) -> None:
        """Définit un paramètre normalisé (0.0-1.0).
        
        Args:
            param: Nom du paramètre
            value: Valeur normalisée (0.0-1.0)
        """
        # Implémentation...
        pass
```

## JavaScript (Frontend)

### Version

- **ES2020+** : modules ES, async/await, optional chaining
- **Pas de transpilation** : code natif pour navigateurs modernes

### Style

- **Airbnb Style Guide** : conventions JavaScript
- **Modules ES** : `import`/`export`, pas de CommonJS
- **Const/Let** : pas de `var`
- **Arrow functions** : pour les callbacks
- **Indentation** : 2 espaces (configuré dans `.editorconfig`)

### Exemple

```javascript
/**
 * Représentation d'une machine.
 */
class Machine {
  /**
   * @param {string} id - Identifiant vendor.model
   * @param {number} midiChannel - Canal MIDI (1-16)
   */
  constructor(id, midiChannel) {
    if (midiChannel < 1 || midiChannel > 16) {
      throw new Error(`Canal MIDI invalide: ${midiChannel}`);
    }
    
    this.id = id;
    this.midiChannel = midiChannel;
    this.ccMap = new Map();
  }
  
  /**
   * Définit un paramètre normalisé (0.0-1.0).
   * @param {string} param - Nom du paramètre
   * @param {number} value - Valeur normalisée (0.0-1.0)
   */
  setParam(param, value) {
    // Implémentation...
  }
}

export { Machine };
```

## AudioWorklet

### Principes

- **Thread audio** : pas de `console.log`, pas d'accès DOM
- **Buffers réutilisés** : limiter les allocations (GC)
- **Smoothing** : tous les paramètres lissés (éviter zipper noise)
- **Performance** : cible < 30% CPU pour 3 machines + FX

### Exemple

```javascript
class SynthProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.phase = 0;
    this.cutoff = 0.5;
    this.cutoffSmooth = 0.5;
  }
  
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const channel = output[0];
    
    // Smoothing exponentiel
    const alpha = 0.99;
    this.cutoffSmooth = alpha * this.cutoffSmooth + (1 - alpha) * this.cutoff;
    
    // Génération audio
    for (let i = 0; i < channel.length; i++) {
      // Oscillateur + filtre...
      channel[i] = 0; // TODO
    }
    
    return true;
  }
}

registerProcessor('synth-processor', SynthProcessor);
```

## JSON

### Schémas

- **Draft-07+** : JSON Schema standard
- **Validation stricte** : `TOOLS/validate.py` avant commit
- **Versioning** : suffixe `.v1`, `.v2`, etc.
- **Documentation** : `description` pour chaque champ

### Exemple

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "Machine.v1.schema.json",
  "title": "Machine",
  "description": "Représentation d'une machine (synthé, boîte à rythmes, effet)",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[a-z]+\\.[a-z0-9]+$",
      "description": "Identifiant unique (vendor.model)"
    },
    "midiChannel": {
      "type": "integer",
      "minimum": 1,
      "maximum": 16,
      "description": "Canal MIDI"
    }
  },
  "required": ["id", "midiChannel"]
}
```

## Logs et sauvegardes

### SQLite

- **Table `logs`** : timestamp, level, actor, action, payload, result, message
- **Rotation** : limiter la taille (ex. 10 000 entrées)
- **Index** : sur timestamp, actor, action

### Exemple

```sql
CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  level TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  payload TEXT,
  result TEXT NOT NULL,
  message TEXT
);

CREATE INDEX idx_timestamp ON logs(timestamp);
CREATE INDEX idx_actor ON logs(actor);
CREATE INDEX idx_action ON logs(action);
```

## TODO Policy

**Règle absolue** : ne **jamais** supprimer un TODO.

### Format

```python
# TODO: Implémenter le filtre ZDF
# TODO: [X] Ajouter validation des paramètres (fait le 2025-10-20)
```

### Workflow

1. Créer un TODO avec description claire
2. Lorsque réalisé, cocher `[X]` et ajouter date
3. Ne jamais supprimer le TODO (traçabilité)

## Tests

### Principes

- **Goldens** : fichiers de référence (patterns, exports MIDI)
- **Smoke tests** : validation basique de chaque machine
- **Régression** : toute PR qui modifie un golden doit justifier

### Exemple

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

## Performance (iPhone 14 Pro Max)

### Cibles

- **CPU** : < 30% pour 3 machines + FX
- **Mémoire** : < 500 MB
- **Latence audio** : < 50 ms (indicatif)
- **FPS** : 60 fps pour animations UI

### Optimisations

- **Réutilisation de buffers** : limiter GC
- **Throttling** : limiter updates UI
- **Lazy loading** : charger à la demande
- **Web Workers** : déporter calculs lourds
- **Profiling** : mesurer avant d'optimiser

## Sécurité

- **Jamais de secrets** : pas de clés API en dépôt
- **Validation** : toutes les entrées utilisateur
- **Sanitization** : échapper les données affichées
- **CORS** : en-têtes appropriés

## Références

- **PEP 8** : https://peps.python.org/pep-0008/
- **Airbnb Style Guide** : https://github.com/airbnb/javascript
- **JSON Schema** : https://json-schema.org/
- **AudioWorklet** : https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet

