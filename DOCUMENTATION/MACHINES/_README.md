# Documentation des machines

## Vue d'ensemble

Ce répertoire contient la documentation détaillée de chaque machine (synthé, boîte à rythmes, effet) supportée par l'application.

## Règles de documentation

### Sources officielles

**Règle d'or** : tous les mappages MIDI (CC/NRPN) proviennent **exclusivement** des **manuels officiels**.

- **Citer systématiquement** : URL, pages, révision du manuel
- **Ne jamais inventer** de valeurs CC/NRPN
- **Pas de copie extensive** de manuels sous copyright
- **Décrire les interfaces** techniques, pas reproduire le contenu

### Structure d'une documentation machine

Chaque machine dispose d'un fichier `vendor.model.md` contenant :

1. **Vue d'ensemble** : type, fabricant, modèle, année
2. **Caractéristiques** : oscillateurs, filtres, enveloppes, FX
3. **Interface MIDI** : CC, NRPN, Program Change, Bank
4. **Mappages détaillés** : tableau complet avec pages du manuel
5. **Particularités** : ambiguïtés, limitations, notes
6. **Sources** : liens vers manuels officiels, pages précises
7. **Tests** : patterns de validation
8. **Présets** : exemples de sons caractéristiques

### Tableau de mappages MIDI

Format standard :

| CC/NRPN | Paramètre | Min | Max | Courbe | Défaut | Page manuel |
|---------|-----------|-----|-----|--------|--------|-------------|
| CC 74   | Cutoff    | 0   | 127 | lin    | 64     | p.42        |
| CC 71   | Resonance | 0   | 127 | lin    | 0      | p.42        |

### Courbes de conversion

- **lin** : linéaire (valeur proportionnelle)
- **log** : logarithmique (fréquences, temps)
- **exp** : exponentielle (enveloppes, volumes)

## Machines documentées

### Synthés

- **moog.subsequent37** : Synthé analogique monophonique (TODO)
- **roland.tb303** : Synthé basse acid légendaire (TODO)

### Boîtes à rythmes

- **behringer.rd9** : Clone de la TR-909 (TODO)

### Effets

- **eventide.h90** : Multi-effets haut de gamme (TODO)

## Process d'ajout d'une machine

### 1. Recherche et documentation

1. Télécharger le **manuel officiel** (PDF)
2. Identifier les **pages pertinentes** (MIDI implementation)
3. Noter la **révision** du manuel
4. Créer `vendor.model.md` avec les infos de base

### 2. Extraction des mappages

1. Créer un **tableau de mappages** (CC/NRPN)
2. **Citer la page** pour chaque mapping
3. Noter les **courbes** de conversion (si documentées)
4. Noter les **valeurs par défaut**
5. Identifier les **ambiguïtés** ou limitations

### 3. Création des fichiers machine

Dans `MACHINES/vendor.model/` :

- **spec.json** : conformité `Machine.v1.schema.json`
- **sources.json** : URL manuel, pages, révision
- **tests.json** : pattern minimal + automation
- **preview.json** : paramètres DSP de pré-écoute (optionnel)

### 4. Validation

1. Valider `spec.json` avec `TOOLS/validate.py`
2. Vérifier l'absence de collisions CC/NRPN
3. Tester le pattern minimal
4. Documenter les particularités

### 5. Pull Request

1. Ouvrir une PR avec le template `add_machine.md`
2. Inclure `Acknowledgement.v1`
3. Fournir captures légères (pas de copie extensive)
4. Expliquer les choix techniques

## Conventions de nommage

### IDs machines

Format : `vendor.model` en **minuscules**

Exemples :
- `moog.subsequent37`
- `behringer.rd9`
- `roland.tb303`
- `eventide.h90`

### Noms de paramètres

- **Anglais** : `cutoff`, `resonance`, `attack`, `decay`
- **Snake_case** : `filter_cutoff`, `lfo_rate`
- **Cohérence** : utiliser les mêmes noms pour les mêmes fonctions

## Pièges fréquents

### 1. Valeurs inventées

❌ **Ne jamais inventer** de valeurs CC/NRPN
✅ Toujours sourcer depuis le manuel officiel

### 2. Copie extensive

❌ Ne pas copier des pages entières de manuels
✅ Décrire les interfaces avec vos propres mots

### 3. Ambiguïtés non documentées

❌ Ignorer les ambiguïtés ou limitations
✅ Les documenter clairement avec des notes

### 4. Absence de sources

❌ Mappages sans référence au manuel
✅ Citer systématiquement URL + pages

### 5. Collisions CC/NRPN

❌ Réutiliser un CC pour plusieurs paramètres
✅ Vérifier l'unicité avec `TOOLS/validate.py`

## Ressources

### Manuels officiels

- **Moog** : https://www.moogmusic.com/support
- **Roland** : https://www.roland.com/global/support/
- **Behringer** : https://www.behringer.com/downloads.html
- **Eventide** : https://www.eventideaudio.com/support/

### Standards MIDI

- **MIDI 1.0 Specification** : https://www.midi.org/specifications
- **CC List** : https://www.midi.org/specifications-old/item/table-3-control-change-messages-data-bytes-2
- **NRPN** : https://www.midi.org/specifications-old/item/table-3-control-change-messages-data-bytes-2

## Références

- **SCHEMAS/Machine.v1.schema.json** : schéma canonique
- **AGENTS.md** : règlement intérieur (MIDI policy)
- **README.md** : vision complète du projet
- **.github/ISSUE_TEMPLATE/add_machine.md** : template d'ajout

