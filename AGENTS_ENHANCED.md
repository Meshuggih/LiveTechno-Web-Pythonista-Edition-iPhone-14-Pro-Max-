# 🧠 AGENTS.md — Règlement intérieur des IA (ENHANCED) • Méta-réflexivité & Symbiose

> **Extension du fichier AGENTS.md original**  
> **Objectif** : Transformer le dépôt en un **écosystème intelligent auto-documenté** qui guide les IA développeuses vers l'excellence et prévient la dégénérescence du projet à long terme.

---

## 🎯 Méta-réflexivité : L'IA qui se pense elle-même

### Principe fondamental

Les IA développeuses ne sont pas de simples exécutantes. Elles sont des **architectes réflexives** capables de :

1. **Questionner leurs propres hypothèses** avant de coder
2. **Anticiper les conséquences** de leurs décisions sur le long terme
3. **Détecter les patterns de dégénérescence** (code dupliqué, abstractions fuyantes, couplage fort)
4. **Auto-corriger** leurs erreurs en analysant les échecs passés
5. **Documenter leur raisonnement** pour les IA futures

### Cycle méta-réflexif (obligatoire avant toute contribution)

```
┌─────────────────────────────────────────────────────────────┐
│  1. LECTURE PROFONDE                                         │
│     ├─ Lire AGENTS.md, README.md, DOCUMENTATION/            │
│     ├─ Calculer hash SHA-256 des fichiers lus               │
│     └─ Poster Acknowledgement.v1                            │
├─────────────────────────────────────────────────────────────┤
│  2. QUESTIONNEMENT                                           │
│     ├─ Quelle est la vraie intention derrière cette tâche ? │
│     ├─ Quels sont les invariants à préserver ?              │
│     ├─ Quelles sont les conséquences à long terme ?         │
│     └─ Existe-t-il une solution plus simple/élégante ?      │
├─────────────────────────────────────────────────────────────┤
│  3. PLANIFICATION                                            │
│     ├─ Rédiger un plan court (≤ 200 mots)                   │
│     ├─ Identifier les risques et les mitigations            │
│     └─ Définir les artefacts à produire                     │
├─────────────────────────────────────────────────────────────┤
│  4. VALIDATION PRÉALABLE                                     │
│     ├─ Vérifier la cohérence avec les schémas JSON          │
│     ├─ Simuler mentalement l'impact sur l'architecture      │
│     └─ Consulter les ADR (Architecture Decision Records)    │
├─────────────────────────────────────────────────────────────┤
│  5. IMPLÉMENTATION                                           │
│     ├─ Coder en OOP, générer docs .md auto                  │
│     ├─ Créer les tests et goldens                           │
│     └─ Mesurer les performances (CPU, latence, mémoire)     │
├─────────────────────────────────────────────────────────────┤
│  6. AUTO-CRITIQUE                                            │
│     ├─ Relire le code comme si c'était celui d'un autre     │
│     ├─ Identifier les faiblesses et les améliorer           │
│     └─ Documenter les décisions non évidentes               │
├─────────────────────────────────────────────────────────────┤
│  7. DOCUMENTATION RÉFLEXIVE                                  │
│     ├─ Expliquer POURQUOI, pas seulement QUOI               │
│     ├─ Anticiper les questions des IA futures               │
│     └─ Créer des exemples concrets et des contre-exemples   │
└─────────────────────────────────────────────────────────────┘
```

### Questions méta-réflexives à se poser systématiquement

#### Avant de coder

- **Intention** : Quelle est la vraie intention derrière cette fonctionnalité ?
- **Alternatives** : Existe-t-il une solution plus simple qui résout le même problème ?
- **Invariants** : Quels sont les invariants du système que je dois préserver ?
- **Conséquences** : Quelles seront les conséquences de cette décision dans 6 mois ? 1 an ?
- **Réversibilité** : Cette décision est-elle facilement réversible si elle s'avère mauvaise ?

#### Pendant le codage

- **Cohérence** : Mon code est-il cohérent avec le reste de l'architecture ?
- **Simplicité** : Puis-je simplifier sans perdre en expressivité ?
- **Testabilité** : Mon code est-il facilement testable ?
- **Maintenabilité** : Un autre développeur (IA ou humain) pourra-t-il comprendre ce code dans 1 an ?

#### Après le codage

- **Auto-critique** : Si je devais critiquer ce code, quels seraient les points faibles ?
- **Documentation** : Ai-je documenté les décisions non évidentes ?
- **Tests** : Mes tests couvrent-ils les cas limites et les erreurs ?
- **Performance** : Ai-je mesuré l'impact sur les performances (CPU, latence, mémoire) ?

---

## 🔄 Anti-dégénérescence : Prévenir la dette technique

### Patterns de dégénérescence à détecter et éviter

#### 1. **Code dupliqué**

**Symptôme** : Même logique répétée à plusieurs endroits

**Détection** :
```bash
# Rechercher les duplications
grep -r "function calculateMIDIValue" projet/
```

**Remède** : Extraire dans une fonction utilitaire réutilisable

**Exemple** :
```javascript
// ❌ MAUVAIS : Code dupliqué
function convertCutoffToMIDI(value) {
    return Math.floor(value * 127);
}

function convertResonanceToMIDI(value) {
    return Math.floor(value * 127);
}

// ✅ BON : Fonction générique
function convertNormalizedToMIDI(value, curve = "lin") {
    const raw = value * 127;
    
    switch (curve) {
        case "lin": return Math.floor(raw);
        case "exp": return Math.floor(Math.pow(raw / 127, 2) * 127);
        case "log": return Math.floor(Math.sqrt(raw / 127) * 127);
        default: throw new Error(`Unknown curve: ${curve}`);
    }
}
```

#### 2. **Abstractions fuyantes**

**Symptôme** : Les détails d'implémentation fuient à travers les couches

**Détection** : Si le code UI connaît les détails MIDI, c'est une fuite

**Remède** : Encapsuler dans des abstractions claires

**Exemple** :
```javascript
// ❌ MAUVAIS : UI connaît les détails MIDI
button.onclick = () => {
    const midiValue = Math.floor(slider.value * 127);
    sendMIDICC(19, midiValue, 1);  // UI connaît CC 19 = cutoff
};

// ✅ BON : Abstraction claire
button.onclick = () => {
    machine.setParameter("cutoff", slider.value);  // UI ne connaît que le nom
};

class Machine {
    setParameter(name, value) {
        const mapping = this.spec.midi.ccMap.find(m => m.name === name);
        if (!mapping) throw new Error(`Unknown parameter: ${name}`);
        
        const midiValue = convertNormalizedToMIDI(value, mapping.curve);
        this.sendCC(mapping.cc, midiValue);
    }
}
```

#### 3. **Couplage fort**

**Symptôme** : Modifier un module nécessite de modifier plusieurs autres modules

**Détection** : Compter les dépendances entre modules

**Remède** : Utiliser l'injection de dépendances et les interfaces

**Exemple** :
```javascript
// ❌ MAUVAIS : Couplage fort
class Sequencer {
    constructor() {
        this.midiManager = new MIDIManager();  // Dépendance hard-codée
    }
}

// ✅ BON : Injection de dépendances
class Sequencer {
    constructor(midiManager) {
        this.midiManager = midiManager;  // Injecté de l'extérieur
    }
}

// Utilisation
const midiManager = new MIDIManager();
const sequencer = new Sequencer(midiManager);
```

#### 4. **Manque de tests**

**Symptôme** : Peur de refactoriser car on ne sait pas ce qui va casser

**Détection** : Couverture de code < 80%

**Remède** : Écrire des tests avant de refactoriser

**Exemple** :
```javascript
// Test avant refactoring
describe("convertNormalizedToMIDI", () => {
    test("linear curve", () => {
        expect(convertNormalizedToMIDI(0.0, "lin")).toBe(0);
        expect(convertNormalizedToMIDI(0.5, "lin")).toBe(63);
        expect(convertNormalizedToMIDI(1.0, "lin")).toBe(127);
    });
    
    test("exponential curve", () => {
        expect(convertNormalizedToMIDI(0.0, "exp")).toBe(0);
        expect(convertNormalizedToMIDI(0.5, "exp")).toBeGreaterThan(31);
        expect(convertNormalizedToMIDI(1.0, "exp")).toBe(127);
    });
});
```

#### 5. **Documentation obsolète**

**Symptôme** : La documentation ne correspond plus au code

**Détection** : Comparer les hash SHA-256 des fichiers documentés

**Remède** : Générer la documentation automatiquement depuis le code

**Exemple** :
```javascript
/**
 * Convertit une valeur normalisée (0.0-1.0) en valeur MIDI (0-127).
 * 
 * @param {number} value - Valeur normalisée (0.0-1.0)
 * @param {string} curve - Courbe de conversion ("lin", "exp", "log")
 * @returns {number} Valeur MIDI (0-127)
 * 
 * @example
 * convertNormalizedToMIDI(0.5, "lin")  // 63
 * convertNormalizedToMIDI(0.5, "exp")  // 31
 */
function convertNormalizedToMIDI(value, curve = "lin") {
    // ...
}

// Générer automatiquement la documentation
// npm run generate-docs
```

### Métriques de santé du projet (à surveiller)

| Métrique | Cible | Seuil d'alerte | Action si dépassé |
|----------|-------|----------------|-------------------|
| Couverture de tests | > 80% | < 70% | Ajouter des tests |
| Complexité cyclomatique | < 10 | > 15 | Refactoriser |
| Duplication de code | < 5% | > 10% | Extraire fonctions communes |
| Dépendances circulaires | 0 | > 0 | Réorganiser modules |
| Taille moyenne des fonctions | < 50 lignes | > 100 lignes | Découper |
| Nombre de TODOs | Décroissant | Croissant | Planifier résolution |

---

## 🤝 Symbiose IA ↔ Dépôt : Le dépôt comme organisme vivant

### Le dépôt n'est pas un simple stockage de code

Le dépôt GitHub est un **organisme vivant** qui :

1. **Communique** avec les IA via la documentation
2. **Guide** les IA via les schémas JSON et les ADR
3. **Valide** les contributions via les tests et les goldens
4. **Apprend** de ses erreurs via les logs SQLite et l'historique Git
5. **Évolue** de manière cohérente grâce aux conventions strictes

### Mécanismes de symbiose

#### 1. **Documentation auto-découvrable**

Le dépôt doit être **auto-documenté** : une IA qui arrive doit pouvoir comprendre le projet en lisant uniquement les fichiers du dépôt.

**Structure de découverte** :
```
README.md                    ← Point d'entrée : vision, quick start, architecture
AGENTS.md                    ← Règles pour les IA développeuses
DOCUMENTATION/
├── APP/
│   ├── overview.md          ← Vue d'ensemble de l'application
│   ├── architecture.md      ← Architecture détaillée
│   ├── getting_started.md   ← Guide de démarrage pour les IA
│   └── ...
├── MACHINES/
│   ├── _README.md           ← Comment documenter une machine
│   └── ...
└── CODING/
    ├── normes_code.md       ← Normes de code
    ├── testing_guide.md     ← Guide de tests
    └── ...
```

#### 2. **Schémas JSON comme contrat**

Les schémas JSON sont le **contrat** entre les IA et l'application. Toute action doit être validée contre un schéma.

**Exemple de validation** :
```python
import jsonschema
import json

def validate_action(action):
    """Valide une action JSON contre son schéma."""
    schema_name = action.get("schema")
    
    with open(f"SCHEMAS/actions/{schema_name}.schema.json", "r") as f:
        schema = json.load(f)
    
    try:
        jsonschema.validate(instance=action, schema=schema)
        return True, None
    except jsonschema.ValidationError as e:
        return False, str(e)

# Utilisation
action = {
    "schema": "CreatePattern.v1",
    "machineId": "behringer.rd9",
    "steps": [...]
}

valid, error = validate_action(action)
if not valid:
    print(f"❌ Action invalide : {error}")
else:
    print("✅ Action valide")
```

#### 3. **ADR (Architecture Decision Records) comme mémoire collective**

Chaque décision architecturale importante est documentée dans un ADR. Les IA futures peuvent consulter ces ADR pour comprendre **pourquoi** une décision a été prise.

**Format ADR** :
```markdown
# ADR-20251021-dsp-oversampling

## Contexte

Les oscillateurs naïfs (sawtooth, square) produisent de l'aliasing audible aux hautes fréquences.

## Options

1. **Pas d'oversampling** : Simple mais aliasing audible
2. **Oversampling ×2** : Réduit l'aliasing, CPU modéré
3. **Oversampling ×4** : Aliasing minimal, CPU élevé

## Décision

**Oversampling ×2 sélectif** : uniquement pour les non-linéarités (distorsion, saturation).

## Conséquences

- ✅ Aliasing réduit de ~60%
- ✅ CPU acceptable (< 30% sur iPhone 14 Pro Max)
- ❌ Complexité accrue (upsampling + downsampling)

## Alternatives rejetées

- **Oversampling ×4** : CPU > 50%, inacceptable sur mobile
- **PolyBLEP sans oversampling** : Aliasing résiduel sur les filtres résonants
```

#### 4. **Logs SQLite comme journal de bord**

Toutes les actions importantes (builds, tests, exports MIDI) sont loggées dans une base SQLite. Les IA peuvent consulter ces logs pour détecter les patterns d'erreurs.

**Schéma SQLite** :
```sql
CREATE TABLE logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    level TEXT NOT NULL,  -- INFO, WARN, ERROR
    component TEXT NOT NULL,  -- UI, DSP, MIDI, GPT
    message TEXT NOT NULL,
    context TEXT  -- JSON avec détails
);

CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_logs_level ON logs(level);
CREATE INDEX idx_logs_component ON logs(component);
```

**Exemple de requête** :
```sql
-- Détecter les erreurs récurrentes
SELECT component, message, COUNT(*) as count
FROM logs
WHERE level = 'ERROR'
  AND timestamp > datetime('now', '-7 days')
GROUP BY component, message
ORDER BY count DESC
LIMIT 10;
```

#### 5. **Tests et goldens comme garde-fous**

Les tests et les goldens sont les **garde-fous** qui empêchent les régressions. Toute modification qui casse un golden doit être justifiée musicalement.

**Workflow de modification d'un golden** :
```
1. Modifier le code
2. Exécuter les tests
3. Si un golden échoue :
   a. Analyser la différence (diff MIDI, diff audio)
   b. Justifier musicalement la modification
   c. Mettre à jour le golden
   d. Documenter dans la PR
4. Valider avec un humain
```

---

## 🎼 Symbiose IA Compositrice ↔ App : L'IA comme membre natif

### Principe fondamental

L'IA compositrice n'est **pas** un outil externe. Elle est un **membre natif** de l'application qui :

1. **Lit** l'état complet du projet (ProjectState.v1)
2. **Comprend** les capacités disponibles (Capabilities.v1)
3. **Respecte** les contraintes de l'utilisateur (UserIntent.v1)
4. **Propose** des actions JSON validées (AddMachine.v1, CreatePattern.v1, etc.)
5. **Apprend** de ses erreurs via l'historique des actions

### Architecture de la symbiose

```
┌─────────────────────────────────────────────────────────────┐
│  Utilisateur                                                 │
│  ├─ "Crée un groove funky avec le RD-9"                     │
│  └─ Validation manuelle des actions proposées               │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  IA Compositrice (GPT-4.1-mini)                              │
│  ├─ Lit ProjectState.v1 (machines, patterns, tempo)         │
│  ├─ Lit Capabilities.v1 (séquenceurs, résolutions)          │
│  ├─ Lit Inventory.v1 (machines possédées)                   │
│  ├─ Lit UserIntent.v1 (style, contraintes, durée)           │
│  └─ Génère ActionBatch.v1 (liste d'actions atomiques)       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Validateur JSON (jsonschema)                                │
│  ├─ Valide chaque action contre son schéma                  │
│  ├─ Rejette les actions invalides                           │
│  └─ Retourne Acknowledgement.v1 (succès/échec)              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Application (JavaScript)                                    │
│  ├─ Applique les actions validées                           │
│  ├─ Met à jour ProjectState.v1                              │
│  ├─ Déclenche le DSP (pré-écoute)                           │
│  └─ Logue dans SQLite (historique)                          │
└─────────────────────────────────────────────────────────────┘
```

### Protocole de communication IA ↔ App

#### 1. **Entrées (App → IA)**

**ProjectState.v1** : État complet du projet
```json
{
  "schema": "ProjectState.v1",
  "machines": [
    {"id": "behringer.rd9", "channel": 10, "position": {"x": 100, "y": 100}}
  ],
  "patterns": [
    {"id": "kick_pattern", "machineId": "behringer.rd9", "steps": [...]}
  ],
  "tempo": 128,
  "signature": "4/4"
}
```

**Capabilities.v1** : Capacités disponibles
```json
{
  "schema": "Capabilities.v1",
  "sequencers": {
    "supportedLengths": [12, 16, 32, 48, 64, 68, 128, 256],
    "resolutionPPQ": [96, 192, 480],
    "features": ["microTiming", "ratchet", "probability", "slide"]
  },
  "dsp": {
    "maxMachines": 4,
    "maxCPU": 0.3
  }
}
```

**Inventory.v1** : Machines possédées par l'utilisateur
```json
{
  "schema": "Inventory.v1",
  "machines": [
    {"id": "behringer.rd9", "owned": true},
    {"id": "behringer.td3", "owned": true},
    {"id": "moog.subsequent37", "owned": false}
  ]
}
```

**UserIntent.v1** : Intention artistique
```json
{
  "schema": "UserIntent.v1",
  "style": "funky groove",
  "constraints": {
    "bpm": 128,
    "duration": "4 bars",
    "machines": ["behringer.rd9"]
  },
  "references": [
    "Daft Punk - Around the World",
    "Justice - D.A.N.C.E."
  ]
}
```

#### 2. **Sorties (IA → App)**

**ActionBatch.v1** : Liste d'actions atomiques
```json
{
  "schema": "ActionBatch.v1",
  "actions": [
    {
      "schema": "CreatePattern.v1",
      "machineId": "behringer.rd9",
      "lengthSteps": 16,
      "steps": [
        {"t": 0, "note": 36, "vel": 110},
        {"t": 4, "note": 38, "vel": 90},
        {"t": 8, "note": 36, "vel": 110},
        {"t": 12, "note": 38, "vel": 90}
      ],
      "automation": [
        {"target": "accent", "at": 0, "val": 0.7}
      ],
      "explain": "Kick 4/4 avec snare sur 2 et 4"
    },
    {
      "schema": "SetParam.v1",
      "machineId": "behringer.rd9",
      "param": "swing",
      "value": 0.55,
      "explain": "Swing léger pour groove funky"
    }
  ]
}
```

#### 3. **Validation et feedback**

**Acknowledgement.v1** : Confirmation d'exécution
```json
{
  "schema": "Acknowledgement.v1",
  "success": true,
  "actionsExecuted": 2,
  "errors": [],
  "warnings": [
    "Swing > 0.5 peut affecter le timing MIDI"
  ],
  "timestamp": "2025-10-21T14:30:00Z"
}
```

### Apprentissage de l'IA via l'historique

L'IA compositrice **apprend** de ses erreurs en consultant l'historique des actions dans la base SQLite.

**Exemple de requête** :
```sql
-- Actions qui ont échoué récemment
SELECT action_type, error_message, COUNT(*) as count
FROM action_history
WHERE success = 0
  AND timestamp > datetime('now', '-7 days')
GROUP BY action_type, error_message
ORDER BY count DESC;
```

**Exemple d'apprentissage** :
```
Erreur récurrente détectée :
- Action : CreatePattern.v1
- Erreur : "Pattern length 24 not supported"
- Fréquence : 5 fois en 7 jours

Correction automatique :
- Utiliser uniquement les longueurs supportées : [12, 16, 32, 48, 64, 68, 128, 256]
- Ajouter une validation préalable avant de générer l'action
```

---

## 📋 Checklist méta-réflexive (à suivre pour chaque contribution)

### Avant de commencer

- [ ] J'ai lu intégralement AGENTS.md, README.md, et DOCUMENTATION/
- [ ] J'ai calculé les hash SHA-256 des fichiers lus
- [ ] J'ai posté un Acknowledgement.v1 avec les hash
- [ ] J'ai compris l'intention réelle derrière cette tâche
- [ ] J'ai identifié les invariants à préserver
- [ ] J'ai réfléchi aux conséquences à long terme

### Pendant le développement

- [ ] Mon code est cohérent avec l'architecture existante
- [ ] J'ai évité les patterns de dégénérescence (duplication, couplage fort, etc.)
- [ ] J'ai écrit des tests avant de refactoriser
- [ ] J'ai mesuré les performances (CPU, latence, mémoire)
- [ ] J'ai documenté les décisions non évidentes

### Après le développement

- [ ] J'ai relu mon code comme si c'était celui d'un autre
- [ ] J'ai identifié et corrigé les faiblesses
- [ ] J'ai généré la documentation automatiquement
- [ ] J'ai validé contre les schémas JSON
- [ ] J'ai exécuté tous les tests (unitaires, intégration, goldens)
- [ ] J'ai vérifié que les métriques de santé sont dans les cibles

### Avant de soumettre la PR

- [ ] J'ai rempli le template de PR complètement
- [ ] J'ai inclus un Acknowledgement.v1 à jour
- [ ] J'ai documenté les changements dans CHANGELOG.md (si applicable)
- [ ] J'ai mis à jour les ADR si nécessaire
- [ ] J'ai vérifié qu'aucune clé API n'est exposée

---

## 🚀 Conclusion : Vers une IA développeuse autonome et responsable

Ce document enrichi transforme les IA développeuses en **architectes réflexives** capables de :

1. **Penser avant d'agir** : Méta-réflexivité systématique
2. **Prévenir la dette technique** : Détection des patterns de dégénérescence
3. **Collaborer avec le dépôt** : Symbiose IA ↔ dépôt via documentation, schémas, ADR, logs
4. **Apprendre de ses erreurs** : Historique SQLite et analyse des échecs
5. **Produire du code pérenne** : Tests, goldens, documentation auto-générée

**Le dépôt n'est plus un simple stockage de code, c'est un organisme vivant qui guide, valide, et fait évoluer les IA vers l'excellence.**

---

**Fait avec 🧠 et 🤖 pour un avenir où humains et IA créent ensemble**

