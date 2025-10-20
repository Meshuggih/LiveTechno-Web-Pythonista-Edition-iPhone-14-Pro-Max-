# TODO Policy

## Règle absolue

**Ne JAMAIS supprimer un TODO.**

Les TODOs sont des marqueurs de traçabilité qui documentent l'historique du projet. Ils permettent de comprendre ce qui était prévu, ce qui a été réalisé, et ce qui reste à faire.

## Format standard

### TODO non réalisé

```python
# TODO: Implémenter le filtre ZDF avec oversampling
```

```javascript
// TODO: Ajouter validation des paramètres MIDI
```

### TODO réalisé

Lorsqu'un TODO est réalisé, **cochez-le** avec `[X]` et ajoutez la date :

```python
# TODO: [X] Implémenter le filtre ZDF avec oversampling (fait le 2025-10-20)
```

```javascript
// TODO: [X] Ajouter validation des paramètres MIDI (fait le 2025-10-20)
```

### TODO avec contexte

Ajoutez du contexte si nécessaire :

```python
# TODO: Optimiser le DSP pour iPhone 14 Pro Max
#       Cible : < 30% CPU pour 3 machines + FX
#       Pistes : réutilisation de buffers, oversampling ciblé
```

## Catégories de TODOs

### Fonctionnalités

```python
# TODO: Ajouter support du swing global
# TODO: Implémenter l'export MIDI multi-pistes
```

### Optimisations

```python
# TODO: Optimiser les allocations dans AudioWorklet
# TODO: Réduire la latence audio sur iOS WebView
```

### Documentation

```python
# TODO: Documenter les mappages MIDI du Moog Subsequent 37
# TODO: Ajouter des exemples d'utilisation dans le README
```

### Tests

```python
# TODO: Ajouter des tests pour la validation des schémas JSON
# TODO: Créer des goldens pour les exports MIDI
```

### Bugs connus

```python
# TODO: Corriger le bug de synchronisation MIDI Clock
# TODO: Résoudre le problème de latence sur iOS 15
```

## Workflow

### 1. Création d'un TODO

Lorsque vous identifiez une tâche à réaliser :

1. Ajoutez un TODO avec une description claire
2. Incluez du contexte si nécessaire (cible, contraintes, pistes)
3. Commitez avec un message explicite

```bash
git commit -m "docs: add TODO for MIDI export optimization"
```

### 2. Réalisation d'un TODO

Lorsque vous réalisez un TODO :

1. **Ne supprimez pas le TODO**
2. Cochez-le avec `[X]`
3. Ajoutez la date de réalisation
4. Commitez avec un message explicite

```bash
git commit -m "feat: implement MIDI export (closes TODO)"
```

### 3. Abandon d'un TODO

Si un TODO n'est plus pertinent :

1. **Ne supprimez pas le TODO**
2. Marquez-le comme `[OBSOLETE]` avec une explication
3. Ajoutez la date et la raison

```python
# TODO: [OBSOLETE] Implémenter le support WebMIDI natif (2025-10-20)
#       Raison : iOS WebView ne supporte pas WebMIDI, on utilise Mock MIDI
```

## Exemples

### Python

```python
class Machine:
    """Représentation d'une machine."""
    
    def __init__(self, id: str, midi_channel: int) -> None:
        self.id = id
        self.midi_channel = midi_channel
        # TODO: Ajouter validation du format vendor.model
        # TODO: [X] Valider le canal MIDI (1-16) (fait le 2025-10-20)
        if not 1 <= midi_channel <= 16:
            raise ValueError(f"Canal MIDI invalide: {midi_channel}")
    
    def set_param(self, param: str, value: float) -> None:
        # TODO: Implémenter le smoothing exponentiel
        # TODO: Ajouter conversion vers CC/NRPN
        pass
```

### JavaScript

```javascript
class Machine {
  constructor(id, midiChannel) {
    this.id = id;
    this.midiChannel = midiChannel;
    // TODO: Ajouter validation du format vendor.model
    // TODO: [X] Valider le canal MIDI (1-16) (fait le 2025-10-20)
    if (midiChannel < 1 || midiChannel > 16) {
      throw new Error(`Canal MIDI invalide: ${midiChannel}`);
    }
  }
  
  setParam(param, value) {
    // TODO: Implémenter le smoothing exponentiel
    // TODO: Ajouter conversion vers CC/NRPN
  }
}
```

### JSON (commentaires non standards)

Pour les fichiers JSON (qui ne supportent pas les commentaires), utilisez un champ `_todo` :

```json
{
  "schema": "Machine.v1",
  "id": "moog.subsequent37",
  "midiChannel": 1,
  "_todo": [
    "Compléter les mappages CC/NRPN depuis le manuel officiel",
    "[X] Ajouter validation du canal MIDI (fait le 2025-10-20)"
  ]
}
```

## Avantages de cette politique

### Traçabilité

Les TODOs conservés permettent de :

- Comprendre l'historique des décisions
- Identifier les tâches abandonnées et pourquoi
- Mesurer la progression du projet

### Transparence

Les contributeurs peuvent :

- Voir ce qui a été fait
- Identifier les tâches en attente
- Comprendre les priorités

### Discipline

Cette politique encourage :

- La documentation continue
- La réflexion avant l'action
- La rigueur dans le développement

## Anti-patterns

### ❌ Supprimer un TODO

```python
# Avant
# TODO: Ajouter validation

# Après (MAUVAIS)
# (TODO supprimé)
```

### ❌ Modifier un TODO réalisé

```python
# Avant
# TODO: Ajouter validation

# Après (MAUVAIS)
# TODO: Ajouter validation améliorée
```

### ❌ TODOs vagues

```python
# MAUVAIS
# TODO: Améliorer les perfs

# BON
# TODO: Optimiser le DSP pour iPhone 14 Pro Max
#       Cible : < 30% CPU pour 3 machines + FX
#       Pistes : réutilisation de buffers, oversampling ciblé
```

## Outils

### Recherche de TODOs

```bash
# Tous les TODOs
grep -r "TODO" --include="*.py" --include="*.js" .

# TODOs non réalisés
grep -r "TODO:" --include="*.py" --include="*.js" . | grep -v "\[X\]"

# TODOs réalisés
grep -r "TODO: \[X\]" --include="*.py" --include="*.js" .
```

### Statistiques

```bash
# Nombre de TODOs non réalisés
grep -r "TODO:" --include="*.py" --include="*.js" . | grep -v "\[X\]" | wc -l

# Nombre de TODOs réalisés
grep -r "TODO: \[X\]" --include="*.py" --include="*.js" . | wc -l
```

## Références

- **CONTRIBUTING.md** : guide de contribution
- **AGENTS.md** : règlement intérieur des IA développeuses
- **README.md** : vision complète du projet

