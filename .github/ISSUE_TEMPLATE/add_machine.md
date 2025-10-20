---
name: Add Machine
about: Proposer l'ajout d'une nouvelle machine (synthé, boîte à rythmes, effet)
title: '[MACHINE] vendor.model'
labels: machine
assignees: ''
---

## Machine

**ID** : `vendor.model` (ex: `moog.subsequent37`)

**Type** : Synthé / Boîte à rythmes / Effet / Autre

**Fabricant** : 

**Modèle** : 

## Sources officielles

<!-- OBLIGATOIRE : Références aux manuels officiels -->

- **URL manuel** : 
- **Pages pertinentes** : 
- **Révision/version** : 

## Mappages MIDI

### Control Changes (CC)

<!-- Liste des CC avec leurs fonctions, bornes, courbes -->
<!-- NE JAMAIS INVENTER : toujours sourcer depuis le manuel -->

| CC | Paramètre | Min | Max | Courbe | Page manuel |
|----|-----------|-----|-----|--------|-------------|
| 74 | Cutoff    | 0   | 127 | lin    | p.42        |

### NRPN

<!-- Si applicable -->

| NRPN | Paramètre | Min | Max | Courbe | Page manuel |
|------|-----------|-----|-----|--------|-------------|
|      |           |     |     |        |             |

### Program Change / Bank

<!-- Si applicable -->

## Tests proposés

<!-- Pattern minimal + automation pour smoke test -->

```json
{
  "pattern": {
    "lengthSteps": 16,
    "steps": [
      {"t": 0, "note": 48, "vel": 96}
    ]
  },
  "automation": [
    {"target": "cutoff", "at": 0, "val": 0.5}
  ]
}
```

## Paramètres DSP de pré-écoute

<!-- Optionnel : paramètres pour le DSP de travail -->

- **Oscillateurs** : 
- **Filtres** : 
- **Enveloppes** : 

## Preuve de lecture (Acknowledgement.v1)

<!-- OBLIGATOIRE : Collez votre Acknowledgement.v1 généré avec TOOLS/hash_docs.py -->

```json
{
  "schema": "Acknowledgement.v1",
  "actor": "votre.identifiant",
  "read": [
    {"path": "AGENTS.md", "sha256": "..."},
    {"path": "README.md", "sha256": "..."},
    {"path": "DOCUMENTATION/MACHINES/_README.md", "sha256": "..."}
  ],
  "timestamp": "2025-10-20T12:00:00Z"
}
```

## Captures et références

<!-- Captures légères, liens vers specs techniques -->
<!-- PAS de copie extensive de manuels sous copyright -->

## Contexte additionnel

<!-- Particularités, ambiguïtés, notes -->

