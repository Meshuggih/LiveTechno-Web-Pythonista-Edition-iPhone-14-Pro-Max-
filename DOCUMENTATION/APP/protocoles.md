# Protocoles de communication

## Vue d'ensemble

Ce document décrit les protocoles de communication entre l'application et l'IA compositrice, ainsi que les formats de données échangés.

## Protocole IA (App ↔ IA compositrice)

### Entrées vers l'IA

L'application envoie à l'IA un contexte complet pour lui permettre de générer des actions pertinentes.

#### ProjectState.v1

État complet du projet en cours :

```json
{
  "schema": "ProjectState.v1",
  "meta": {
    "bpm": 128,
    "signature": "4/4",
    "ppq": 96
  },
  "machines": [
    {
      "id": "moog.subsequent37",
      "instanceId": "bass_1",
      "midiChannel": 1,
      "position": {"x": 120, "y": 80}
    }
  ],
  "patterns": [],
  "routing": []
}
```

#### Capabilities.v1

Contraintes techniques du séquenceur et du DSP :

```json
{
  "schema": "Capabilities.v1",
  "sequencer": {
    "supportedLengths": [12, 16, 32, 48, 64, 68, 128, 256],
    "microTiming": true,
    "ratchet": true,
    "probability": true,
    "swing": true
  },
  "dsp": {
    "maxMachines": 8,
    "maxFX": 4,
    "targetCPU": 0.3
  }
}
```

#### Inventory.v1

Machines réellement possédées par l'utilisateur :

```json
{
  "schema": "Inventory.v1",
  "owned": [
    "moog.subsequent37",
    "behringer.rd9",
    "roland.tb303",
    "eventide.h90"
  ]
}
```

#### UserIntent.v1

Intention et contraintes de l'utilisateur :

```json
{
  "schema": "UserIntent.v1",
  "style": "techno funky",
  "constraints": {
    "bpm": 128,
    "duration": "2min",
    "machines": ["moog.subsequent37", "behringer.rd9"]
  },
  "reference": "Plastikman, Richie Hawtin"
}
```

### Sorties de l'IA (JSON strict uniquement)

L'IA répond **exclusivement** en JSON. Aucune prose, aucune chaîne de pensée.

#### AddMachine.v1

Ajouter une machine au projet :

```json
{
  "schema": "AddMachine.v1",
  "machineId": "behringer.rd9",
  "midiChannel": 10,
  "position": {"x": 120, "y": 80}
}
```

#### CreatePattern.v1

Créer un pattern rythmico-mélodique :

```json
{
  "schema": "CreatePattern.v1",
  "targetMachine": "moog.subsequent37",
  "lengthSteps": 16,
  "resolutionPPQ": 96,
  "steps": [
    {"t": 0, "note": 48, "vel": 96},
    {"t": 4, "note": 50, "vel": 96, "slide": true},
    {"t": 8, "note": 53, "vel": 110},
    {"t": 12, "note": 55, "vel": 100, "ratchet": 2, "prob": 0.7}
  ],
  "automation": [
    {"target": "cutoff", "at": 0, "val": 0.25},
    {"target": "cutoff", "at": 8, "val": 0.8}
  ]
}
```

#### SetParam.v1

Modifier un paramètre avec automation :

```json
{
  "schema": "SetParam.v1",
  "targetMachine": "moog.subsequent37",
  "param": "cutoff",
  "value": 0.8,
  "easing": "exp",
  "durationBeats": 4
}
```

#### Arrange.v1

Définir la structure du morceau :

```json
{
  "schema": "Arrange.v1",
  "sections": [
    {"name": "intro", "bars": 16},
    {"name": "build", "bars": 16},
    {"name": "drop", "bars": 32},
    {"name": "outro", "bars": 16}
  ]
}
```

#### ExportPlan.v1

Planifier l'export MIDI :

```json
{
  "schema": "ExportPlan.v1",
  "bpm": 128,
  "signature": "4/4",
  "tracks": [
    {"machine": "moog.subsequent37", "type": "midi", "channel": 1, "name": "BASS"},
    {"machine": "behringer.rd9", "type": "midi", "channel": 10, "name": "DRUMS"}
  ]
}
```

#### ActionBatch.v1

Séquence ordonnée d'actions atomiques :

```json
{
  "schema": "ActionBatch.v1",
  "actions": [
    {"schema": "AddMachine.v1", "machineId": "behringer.rd9", "midiChannel": 10, "position": {"x": 80, "y": 60}},
    {"schema": "CreatePattern.v1", "targetMachine": "behringer.rd9", "lengthSteps": 16, "resolutionPPQ": 96, "steps": []}
  ]
}
```

### Garde-fous IA

**Règles strictes** pour l'IA compositrice :

1. **Aucune prose** : réponses JSON uniquement
2. **Aucune chaîne de pensée** : pas de raisonnement visible
3. **Option `explain`** : courte (1-2 phrases) si vraiment utile
4. **Respect de l'inventaire** : jamais de machine hors `Inventory.v1` sans consentement
5. **Respect des mappages** : toujours respecter `midi.ccMap/nrpn` déclarés
6. **Validation UI** : l'utilisateur valide avant application
7. **Mémoire par projet** : `project_state.json` + `history/` (diffs append-only) + logs SQLite

### Validation UI

Avant d'appliquer une action, l'application :

1. **Valide** le JSON contre le schéma correspondant
2. **Affiche** un résumé de l'action à l'utilisateur
3. **Demande confirmation** explicite
4. **Applique** l'action si validée
5. **Enregistre** dans l'historique (append-only)
6. **Log** dans SQLite (timestamp, action, résultat)

## Protocole MIDI

### Normalisation UI/DSP

Tous les paramètres sont normalisés en **0.0–1.0** (floats) dans l'UI et le DSP.

### Conversion vers MIDI

#### Control Changes (CC)

- **Plage** : 0–127 (7 bits)
- **Courbes** : `lin`, `log`, `exp`
- **Formule linéaire** : `cc = floor(norm * 127)`
- **Formule log** : `cc = floor(log(norm * 127 + 1) / log(128) * 127)`
- **Formule exp** : `cc = floor(pow(norm, 2) * 127)`

#### NRPN (Non-Registered Parameter Number)

- **Plage** : 0–16383 (14 bits)
- **Courbes** : `lin`, `log`, `exp`
- **Formule linéaire** : `nrpn = floor(norm * 16383)`

### Timing

- **PPQ** : Pulses Per Quarter (ex. 96, 192, 480)
- **Conversion pas→ticks** : `ticks = stepIndex * (ppq / stepsPerBeat)`
- **Micro-timing** : offset relatif par pas (en ticks)
- **Ratchet** : sous-déclenchements (ex. 2 = double-croche)
- **Probabilité** : 0.0–1.0 (chance de déclenchement)
- **Swing** : décalage des pas pairs (global ou par piste)

## Protocole de persistance

### Fichiers locaux

- `HTML_Studio_config.json` : configuration du lecteur
- `HTML_Studio_logs.db` : logs SQLite
- `project_state.json` : état du projet en cours
- `history/` : diffs append-only (JSON)

### Logs SQLite

**Table `logs`** :

| Colonne | Type | Description |
|---------|------|-------------|
| id | INTEGER PRIMARY KEY | ID auto-incrémenté |
| timestamp | TEXT | ISO 8601 |
| level | TEXT | `info`, `warn`, `error` |
| actor | TEXT | `user`, `ia`, `system` |
| action | TEXT | Type d'action |
| payload | TEXT | JSON de l'action |
| result | TEXT | `success`, `error` |
| message | TEXT | Message descriptif |

### Historique (append-only)

Chaque action appliquée est enregistrée dans `history/` :

```json
{
  "timestamp": "2025-10-20T12:34:56Z",
  "actor": "ia.compositrice",
  "action": "CreatePattern.v1",
  "payload": {...},
  "result": "success"
}
```

## Références

- **SCHEMAS/** : schémas JSON canoniques
- **AGENTS.md** : règlement intérieur des IA développeuses
- **README.md** : vision complète du projet

