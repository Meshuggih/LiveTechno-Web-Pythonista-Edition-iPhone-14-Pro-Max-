# Guide de contribution

Merci de votre intérêt pour **LiveTechno-Web Pythonista Edition** !

## Obligations avant toute contribution

### 1. Lecture obligatoire

Avant d'ouvrir une issue ou une PR, vous **devez** lire :

- **AGENTS.md** (règlement intérieur des IA développeuses)
- **README.md** (vision complète du projet)
- **DOCUMENTATION/APP/** (protocoles, overview, UI)
- **DOCUMENTATION/MACHINES/** (pour toute contribution liée aux machines)
- **DOCUMENTATION/CODING/** (normes de code, TODO policy)

### 2. Preuve de lecture (Acknowledgement.v1)

Toute issue ou PR **doit** inclure un objet JSON `Acknowledgement.v1` contenant les hashes SHA-256 des fichiers lus. Utilisez `TOOLS/hash_docs.py` pour générer ces hashes.

Exemple :

```json
{
  "schema": "Acknowledgement.v1",
  "actor": "contributeur.humain",
  "read": [
    {"path": "AGENTS.md", "sha256": "abc123..."},
    {"path": "README.md", "sha256": "def456..."},
    {"path": "DOCUMENTATION/APP/overview.md", "sha256": "ghi789..."}
  ],
  "timestamp": "2025-10-20T12:00:00Z"
}
```

## TODO Policy

**Règle absolue** : ne **jamais** supprimer un TODO.

- Lorsqu'une tâche est réalisée, cochez-la : `[X]`
- Laissez le texte du TODO en place pour traçabilité
- Ajoutez un commentaire avec la date et le contexte si nécessaire

## Tests

- Toute PR modifiant du code doit inclure des tests
- Toute PR modifiant un **golden** (fichier de référence) doit expliquer **pourquoi musicalement** et fournir une validation

## Validation des schémas

Avant de soumettre une PR :

```bash
python3 TOOLS/validate.py SCHEMAS/
```

Assurez-vous que tous les schémas JSON sont valides.

## Style de commit

- Messages en **impératif** : `feat(ui): add machine palette`
- Scopes clairs : `feat`, `fix`, `docs`, `test`, `refactor`
- Commits atomiques et cohérents

## Sécurité

- **Jamais** de clés API ou secrets dans le dépôt
- **Jamais** de données personnelles
- Stockage local uniquement pour les clés OpenAI (maquette)

## Respect des marques

Les noms de marques (Moog, Roland, Behringer, Eventide, etc.) appartiennent à leurs détenteurs. Nous décrivons des **interfaces techniques** (mappages CC/NRPN) avec **sources officielles** citées.

## Processus de revue

1. Ouvrez une issue ou une PR avec le template approprié
2. Remplissez **toutes** les sections du template
3. Incluez votre `Acknowledgement.v1`
4. Attendez la revue et répondez aux commentaires
5. Une fois approuvée, votre contribution sera mergée

Merci de contribuer à ce projet avec rigueur et discipline !

