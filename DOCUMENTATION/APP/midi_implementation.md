# Guide d'implémentation MIDI (CC et NRPN)

## Introduction

Ce document décrit les bonnes pratiques pour implémenter les mappages MIDI **Control Change (CC)** et **Non-Registered Parameter Number (NRPN)** dans LiveTechno-Web. L'objectif est de garantir une compatibilité maximale avec les machines hardware tout en respectant les spécifications officielles.

## Principes fondamentaux

### Règle d'or

**Ne JAMAIS inventer de valeurs CC/NRPN**. Toujours sourcer depuis les **manuels officiels**.

### Hiérarchie des sources

1. **Manuel officiel** du fabricant (MIDI Implementation Chart)
2. **Firmware release notes** (pour les mises à jour)
3. **Documentation technique** officielle
4. **Tests empiriques** (en dernier recours, documentés)

### Traçabilité obligatoire

Chaque mapping doit inclure :
- **URL** du manuel source
- **Page(s)** exacte(s) du MIDI Implementation Chart
- **Révision** du manuel/firmware
- **Date d'accès** à la documentation

## MIDI Control Change (CC)

### Structure d'un message CC

```
Status Byte: 1011nnnn (0xBn)
    ├─ 1011: Control Change
    └─ nnnn: Canal MIDI (0-15)

Data Byte 1: 0ccccccc (0-127)
    └─ Controller Number

Data Byte 2: 0vvvvvvv (0-127)
    └─ Controller Value
```

### CC standards (définis par MIDI Spec)

| CC | Nom | Description | Plage |
|----|-----|-------------|-------|
| 0 | Bank Select MSB | Sélection de banque (MSB) | 0-127 |
| 1 | Modulation Wheel | Roue de modulation | 0-127 |
| 7 | Channel Volume | Volume du canal | 0-127 |
| 10 | Pan | Panoramique | 0 (L) - 64 (C) - 127 (R) |
| 11 | Expression | Expression dynamique | 0-127 |
| 32 | Bank Select LSB | Sélection de banque (LSB) | 0-127 |
| 64 | Sustain Pedal | Pédale de sustain | 0-63 (off), 64-127 (on) |
| 71 | Resonance | Résonance (timbre) | 0-127 |
| 74 | Brightness | Luminosité (cutoff) | 0-127 |
| 91 | Reverb Send | Envoi reverb | 0-127 |
| 93 | Chorus Send | Envoi chorus | 0-127 |
| 120 | All Sound Off | Coupe tous les sons | 0 |
| 121 | Reset All Controllers | Réinitialise tous les CC | 0 |
| 123 | All Notes Off | Coupe toutes les notes | 0 |

### CC spécifiques aux machines

Chaque fabricant peut assigner les CC 14-31 et 70-119 librement. **Toujours vérifier le manuel**.

#### Exemple : Moog Subsequent 37

```json
{
  "ccMap": [
    {
      "cc": 3,
      "name": "glide_rate",
      "range": [0, 127],
      "curve": "lin",
      "smoothed": true,
      "source": {
        "manual": "Moog Subsequent 37 Manual v1.0",
        "page": 42,
        "url": "https://www.moogmusic.com/support",
        "accessed": "2025-10-20"
      }
    },
    {
      "cc": 19,
      "name": "cutoff",
      "range": [0, 127],
      "curve": "exp",
      "smoothed": true,
      "source": {
        "manual": "Moog Subsequent 37 Manual v1.0",
        "page": 42,
        "url": "https://www.moogmusic.com/support",
        "accessed": "2025-10-20"
      }
    }
  ]
}
```

### Courbes de conversion

#### Linéaire (lin)

```javascript
function ccToLinear(cc, min, max) {
    return min + (cc / 127) * (max - min);
}

// Exemple : CC 74 (Cutoff) → 20 Hz - 20 kHz
const cutoffHz = ccToLinear(cc74, 20, 20000);
```

#### Exponentielle (exp)

```javascript
function ccToExponential(cc, min, max) {
    const normalized = cc / 127;
    return min * Math.pow(max / min, normalized);
}

// Exemple : CC 74 (Cutoff) → 20 Hz - 20 kHz (exponentiel)
const cutoffHz = ccToExponential(cc74, 20, 20000);
```

#### Logarithmique (log)

```javascript
function ccToLogarithmic(cc, min, max) {
    const normalized = cc / 127;
    const logMin = Math.log(min);
    const logMax = Math.log(max);
    return Math.exp(logMin + normalized * (logMax - logMin));
}
```

### Smoothing (éviter zipper noise)

```javascript
class CCSmoothing {
    constructor(smoothingTime = 0.01) {
        this.currentValue = 0;
        this.targetValue = 0;
        this.smoothingFactor = Math.exp(-1 / (smoothingTime * sampleRate));
    }
    
    process(targetValue) {
        this.targetValue = targetValue;
        this.currentValue = this.currentValue * this.smoothingFactor +
                            this.targetValue * (1 - this.smoothingFactor);
        return this.currentValue;
    }
}

// Utilisation
const cutoffSmooth = new CCSmoothing(0.02);  // 20ms

function onCCMessage(cc, value) {
    if (cc === 74) {  // Cutoff
        const targetHz = ccToExponential(value, 20, 20000);
        const smoothedHz = cutoffSmooth.process(targetHz);
        filter.frequency.value = smoothedHz;
    }
}
```

## MIDI NRPN (Non-Registered Parameter Number)

### Structure d'un message NRPN

NRPN utilise **4 messages CC** pour transmettre une valeur :

```
1. CC 99 (NRPN MSB) : Numéro de paramètre (MSB)
2. CC 98 (NRPN LSB) : Numéro de paramètre (LSB)
3. CC 6  (Data Entry MSB) : Valeur (MSB)
4. CC 38 (Data Entry LSB) : Valeur (LSB) [optionnel]
```

### Exemple de séquence NRPN

```
Paramètre NRPN 256 (0x0100) = Valeur 8192 (0x2000)

CC 99 (NRPN MSB) : 1      (0x01)
CC 98 (NRPN LSB) : 0      (0x00)
CC 6  (Data MSB) : 64     (0x40)
CC 38 (Data LSB) : 0      (0x00)
```

### Plage de valeurs NRPN

- **Paramètre** : 0-16383 (14 bits)
- **Valeur** : 0-16383 (14 bits) ou 0-127 (7 bits si LSB non utilisé)

### Implémentation NRPN

```javascript
class NRPNHandler {
    constructor() {
        this.nrpnMSB = 0;
        this.nrpnLSB = 0;
        this.dataMSB = 0;
        this.dataLSB = 0;
        this.nrpnReady = false;
    }
    
    handleCC(cc, value) {
        switch (cc) {
            case 99:  // NRPN MSB
                this.nrpnMSB = value;
                this.nrpnReady = false;
                break;
            
            case 98:  // NRPN LSB
                this.nrpnLSB = value;
                this.nrpnReady = false;
                break;
            
            case 6:   // Data Entry MSB
                this.dataMSB = value;
                this.nrpnReady = true;
                break;
            
            case 38:  // Data Entry LSB
                this.dataLSB = value;
                break;
        }
        
        if (this.nrpnReady) {
            this.processNRPN();
            this.nrpnReady = false;
        }
    }
    
    processNRPN() {
        const paramNumber = (this.nrpnMSB << 7) | this.nrpnLSB;
        const value14bit = (this.dataMSB << 7) | this.dataLSB;
        const value7bit = this.dataMSB;
        
        console.log(`NRPN ${paramNumber} = ${value14bit} (14-bit) / ${value7bit} (7-bit)`);
        
        // Dispatcher vers le paramètre approprié
        this.applyNRPN(paramNumber, value14bit);
    }
    
    applyNRPN(param, value) {
        // Exemple : Behringer RD-9
        switch (param) {
            case 0:  // Bass Drum Tune
                this.setParameter("bd_tune", value / 16383);
                break;
            
            case 1:  // Bass Drum Decay
                this.setParameter("bd_decay", value / 16383);
                break;
            
            // ... autres paramètres ...
        }
    }
    
    setParameter(name, normalizedValue) {
        console.log(`Paramètre ${name} = ${normalizedValue}`);
        // Appliquer au DSP
    }
}

// Utilisation
const nrpnHandler = new NRPNHandler();

function onMIDIMessage(event) {
    const [status, data1, data2] = event.data;
    const messageType = status & 0xF0;
    const channel = status & 0x0F;
    
    if (messageType === 0xB0) {  // Control Change
        nrpnHandler.handleCC(data1, data2);
    }
}
```

### Best practice : Nulling NRPN

Après l'envoi d'un NRPN, il est recommandé de "nuller" le paramètre actif pour éviter les conflits :

```javascript
function sendNRPN(param, value) {
    const paramMSB = (param >> 7) & 0x7F;
    const paramLSB = param & 0x7F;
    const valueMSB = (value >> 7) & 0x7F;
    const valueLSB = value & 0x7F;
    
    // Envoyer le NRPN
    sendCC(99, paramMSB);  // NRPN MSB
    sendCC(98, paramLSB);  // NRPN LSB
    sendCC(6, valueMSB);   // Data Entry MSB
    sendCC(38, valueLSB);  // Data Entry LSB
    
    // Nuller (best practice)
    sendCC(99, 127);       // NRPN MSB = 127
    sendCC(98, 127);       // NRPN LSB = 127
}
```

## Program Change et Bank Select

### Structure Program Change

```
Status Byte: 1100nnnn (0xCn)
    ├─ 1100: Program Change
    └─ nnnn: Canal MIDI (0-15)

Data Byte: 0ppppppp (0-127)
    └─ Program Number
```

### Bank Select (CC 0 et CC 32)

Pour accéder à plus de 128 programmes :

```javascript
function selectProgram(bank, program) {
    const bankMSB = (bank >> 7) & 0x7F;
    const bankLSB = bank & 0x7F;
    
    sendCC(0, bankMSB);    // Bank Select MSB
    sendCC(32, bankLSB);   // Bank Select LSB
    sendPC(program);       // Program Change
}

// Exemple : Banque 2, Programme 64
selectProgram(2, 64);
```

### Hiérarchie MIDI

```
MIDI Channel (1-16)
  └─ Bank (0-16383)
      └─ Sub-Bank (optionnel, dépend du fabricant)
          └─ Program (0-127)
```

## Validation et tests

### Validation des mappages

```python
# TOOLS/validate_midi.py
import json

def validate_cc_mapping(cc_map):
    """Valide un mapping CC selon les règles."""
    errors = []
    
    for entry in cc_map:
        # Vérifier le numéro CC
        if not (0 <= entry["cc"] <= 127):
            errors.append(f"CC {entry['cc']} hors plage (0-127)")
        
        # Vérifier la plage
        if entry["range"][0] < 0 or entry["range"][1] > 127:
            errors.append(f"Plage invalide pour CC {entry['cc']}")
        
        # Vérifier la source
        if "source" not in entry:
            errors.append(f"Source manquante pour CC {entry['cc']}")
        else:
            required = ["manual", "page", "url", "accessed"]
            for field in required:
                if field not in entry["source"]:
                    errors.append(f"Champ '{field}' manquant dans source CC {entry['cc']}")
        
        # Vérifier la courbe
        if entry["curve"] not in ["lin", "log", "exp"]:
            errors.append(f"Courbe invalide pour CC {entry['cc']}: {entry['curve']}")
    
    return errors

# Utilisation
with open("MACHINES/moog.subsequent37/spec.json", "r") as f:
    spec = json.load(f)
    errors = validate_cc_mapping(spec["midi"]["ccMap"])
    
    if errors:
        print("❌ Erreurs de validation :")
        for error in errors:
            print(f"  • {error}")
    else:
        print("✅ Mapping CC valide")
```

### Tests de collision CC

```python
def check_cc_collisions(cc_map):
    """Vérifie les collisions de numéros CC."""
    seen = {}
    collisions = []
    
    for entry in cc_map:
        cc = entry["cc"]
        if cc in seen:
            collisions.append(f"CC {cc} utilisé par '{seen[cc]}' et '{entry['name']}'")
        else:
            seen[cc] = entry["name"]
    
    return collisions
```

### Tests empiriques (en dernier recours)

Si le manuel est incomplet ou ambigu :

```javascript
// test/midi_empirical.js
async function testCCResponse(machine, cc, value) {
    console.log(`Test CC ${cc} = ${value}`);
    
    // Envoyer le CC
    machine.sendCC(cc, value);
    
    // Attendre la réponse
    await sleep(100);
    
    // Mesurer l'effet (audio, paramètre visible, etc.)
    const response = machine.measureResponse();
    
    return {
        cc,
        value,
        response,
        timestamp: Date.now()
    };
}

// Tester tous les CC de 0 à 127
const results = [];
for (let cc = 0; cc <= 127; cc++) {
    for (let value of [0, 64, 127]) {
        const result = await testCCResponse(machine, cc, value);
        results.push(result);
    }
}

// Sauvegarder les résultats
saveJSON("empirical_test_results.json", results);
```

## Documentation des mappages

### Format spec.json

```json
{
  "schema": "Machine.v1",
  "id": "moog.subsequent37",
  "midi": {
    "defaultChannel": 1,
    "supports": ["note", "cc", "pc", "nrpn"],
    "ccMap": [
      {
        "cc": 19,
        "name": "cutoff",
        "displayName": "Filter Cutoff",
        "range": [0, 127],
        "curve": "exp",
        "smoothed": true,
        "unit": "Hz",
        "physicalRange": [20, 20000],
        "source": {
          "manual": "Moog Subsequent 37 Manual v1.0",
          "page": 42,
          "url": "https://www.moogmusic.com/support",
          "accessed": "2025-10-20",
          "notes": "Exponential curve confirmed by manual"
        }
      }
    ],
    "nrpn": [
      {
        "param": 256,
        "name": "lfo_rate",
        "displayName": "LFO Rate",
        "range": [0, 16383],
        "resolution": 14,
        "curve": "lin",
        "source": {
          "manual": "Moog Subsequent 37 Manual v1.0",
          "page": 43,
          "url": "https://www.moogmusic.com/support",
          "accessed": "2025-10-20"
        }
      }
    ],
    "programChange": {
      "supported": true,
      "banks": 8,
      "programsPerBank": 128
    }
  }
}
```

### Documentation Markdown

```markdown
# Moog Subsequent 37 - MIDI Implementation

## Control Change (CC)

| CC | Paramètre | Plage | Courbe | Smoothed | Source |
|----|-----------|-------|--------|----------|--------|
| 3  | Glide Rate | 0-127 | lin | ✅ | Manual p.42 |
| 19 | Filter Cutoff | 0-127 | exp | ✅ | Manual p.42 |
| 21 | Filter Resonance | 0-127 | lin | ✅ | Manual p.42 |

## NRPN

| Param | Paramètre | Plage | Résolution | Source |
|-------|-----------|-------|------------|--------|
| 256 | LFO Rate | 0-16383 | 14-bit | Manual p.43 |
| 257 | LFO Depth | 0-16383 | 14-bit | Manual p.43 |

## Sources

- **Manuel officiel** : Moog Subsequent 37 Manual v1.0
- **URL** : https://www.moogmusic.com/support
- **Pages MIDI** : 42-44
- **Date d'accès** : 2025-10-20

## Notes

- Le Subsequent 37 utilise une courbe **exponentielle** pour le cutoff (CC 19)
- Les NRPN utilisent une résolution 14-bit complète
- Le smoothing est appliqué automatiquement par le hardware
```

## Pièges fréquents

### 1. ❌ Confondre CC et NRPN

```javascript
// ❌ MAUVAIS : Traiter NRPN comme un CC simple
sendCC(256, 64);  // CC 256 n'existe pas !

// ✅ CORRECT : Envoyer un NRPN
sendNRPN(256, 8192);
```

### 2. ❌ Oublier le smoothing

```javascript
// ❌ MAUVAIS : Zipper noise garanti
filter.frequency.value = ccToExponential(cc74, 20, 20000);

// ✅ CORRECT : Smoothing appliqué
const smoothedHz = cutoffSmooth.process(ccToExponential(cc74, 20, 20000));
filter.frequency.value = smoothedHz;
```

### 3. ❌ Inventer des valeurs

```javascript
// ❌ MAUVAIS : Valeurs inventées
const ccMap = [
    { cc: 74, name: "cutoff" },  // Pas de source !
    { cc: 71, name: "resonance" }  // Pas de source !
];

// ✅ CORRECT : Valeurs sourcées
const ccMap = [
    {
        cc: 74,
        name: "cutoff",
        source: {
            manual: "Moog Subsequent 37 Manual v1.0",
            page: 42,
            url: "https://www.moogmusic.com/support"
        }
    }
];
```

### 4. ❌ Ignorer les collisions CC

```javascript
// ❌ MAUVAIS : CC 1 utilisé deux fois
const ccMap = [
    { cc: 1, name: "modulation" },
    { cc: 1, name: "vibrato" }  // COLLISION !
];

// ✅ CORRECT : Vérifier les collisions
const errors = check_cc_collisions(ccMap);
if (errors.length > 0) {
    console.error("Collisions détectées :", errors);
}
```

## Ressources

### Bases de données MIDI

- [MIDI.guide](https://midi.guide/) - Base de données CC/NRPN communautaire
- [MIDI Association](https://www.midi.org/) - Spécifications officielles
- [MIDI Implementation Chart Template](https://www.midi.org/specifications/midi1-specifications/midi-1-0-detailed-specification)

### Manuels officiels

- [Moog Music Support](https://www.moogmusic.com/support)
- [Behringer Downloads](https://www.behringer.com/downloads.html)
- [Roland Support](https://www.roland.com/global/support/)
- [Eventide Support](https://www.eventideaudio.com/support/)

### Outils de test

- [MIDI Monitor](https://www.snoize.com/MIDIMonitor/) (macOS)
- [MIDI-OX](http://www.midiox.com/) (Windows)
- [Web MIDI API Test](https://www.onlinemusictools.com/webmiditest/)

## Prochaines étapes

1. Compléter les mappages CC/NRPN pour les 4 machines de base
2. Valider avec `python3 TOOLS/validate_midi.py`
3. Créer des tests empiriques pour vérifier les courbes
4. Documenter les ambiguïtés dans `sources.json`
5. Implémenter le smoothing dans les AudioWorklets

