# Pull Request

## Objectif

<!-- Description claire et concise de l'objectif de cette PR -->

## Impact

<!-- Quels composants/fichiers sont affectés ? -->
<!-- Y a-t-il des breaking changes ? -->

- [ ] Schémas JSON modifiés
- [ ] Machines ajoutées/modifiées
- [ ] Documentation mise à jour
- [ ] Tests ajoutés/modifiés
- [ ] Goldens modifiés (justification musicale requise)

## Validation des schémas

<!-- OBLIGATOIRE : Exécuter avant de soumettre -->

```bash
python3 TOOLS/validate.py SCHEMAS/
```

**Résultat** : ✅ OK / ❌ Erreurs (détailler)

## Tests et goldens

<!-- Liste des tests ajoutés/modifiés -->
<!-- Si goldens modifiés : justification musicale OBLIGATOIRE -->

- [ ] Tests unitaires ajoutés
- [ ] Tests d'intégration ajoutés
- [ ] Goldens validés (ou justification de modification)

## Performance (iPhone 14 Pro Max)

<!-- Cible : < 30% CPU pour 3 machines + FX -->

**Mesures** :
- CPU : 
- Mémoire : 
- Latence audio : 

## Sécurité

<!-- Vérifications de sécurité -->

- [ ] Aucune clé API ou secret commité
- [ ] Aucune donnée personnelle
- [ ] `.gitignore` respecté
- [ ] Sources officielles citées (pour machines)

## Documentation mise à jour

<!-- Cochez les docs mises à jour -->

- [ ] README.md
- [ ] AGENTS.md
- [ ] DOCUMENTATION/APP/*
- [ ] DOCUMENTATION/MACHINES/*
- [ ] DOCUMENTATION/CODING/*
- [ ] Commentaires de code

## Preuve de lecture (Acknowledgement.v1)

<!-- OBLIGATOIRE : Collez votre Acknowledgement.v1 généré avec TOOLS/hash_docs.py -->

```json
{
  "schema": "Acknowledgement.v1",
  "actor": "votre.identifiant",
  "read": [
    {"path": "AGENTS.md", "sha256": "..."},
    {"path": "README.md", "sha256": "..."}
  ],
  "timestamp": "2025-10-20T12:00:00Z"
}
```

## Checklist finale

- [ ] Code suit les normes OOP
- [ ] Docs `.md` auto générées (si applicable)
- [ ] Logs SQLite appropriés
- [ ] TODOs conservés (cochés `[X]` si réalisés)
- [ ] Commits atomiques et messages clairs
- [ ] Branche à jour avec `main`
- [ ] Toutes les sections de ce template remplies

## Contexte additionnel

<!-- Captures, diagrammes, liens, notes -->

