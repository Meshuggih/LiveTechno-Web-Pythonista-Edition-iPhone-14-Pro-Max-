# Politique de sécurité

## Principes de sécurité

### Clés API et secrets

**Règle absolue** : aucune clé API, secret ou token ne doit être commité dans ce dépôt.

- Les clés OpenAI sont stockées **localement** dans la maquette Pythonista
- Fichier `PYTHONISTA/projet/user_openai_key.json` est dans `.gitignore`
- Utilisez le **Mock AI** pour les tests sans clé réelle

### Données personnelles

- Minimisez la collecte de données personnelles
- Logs sobres et anonymisés
- Pas de tracking ou télémétrie non sollicitée

### Stockage local

La maquette Pythonista utilise :

- `HTML_Studio_config.json` (configuration locale)
- `HTML_Studio_logs.db` (logs SQLite)
- Ces fichiers sont exclus du versionnement

### Réseau local (iOS)

Le lecteur HTML intégré utilise un serveur HTTP local (`127.0.0.1`). iOS demandera l'autorisation d'accès au réseau local lors du premier lancement. C'est normal et nécessaire pour le fonctionnement de la maquette.

## Signalement de vulnérabilités

Si vous découvrez une vulnérabilité de sécurité, veuillez **ne pas** ouvrir d'issue publique.

Contactez directement le mainteneur :

- **GitHub** : @Meshuggih
- **Email** : (à définir)

Incluez dans votre rapport :

1. Description de la vulnérabilité
2. Étapes pour la reproduire
3. Impact potentiel
4. Suggestions de correction (si possible)

Nous nous engageons à répondre dans les **48 heures** et à publier un correctif dans un délai raisonnable.

## Bonnes pratiques pour les contributeurs

- Utilisez `TOOLS/validate.py` pour valider les schémas JSON
- Ne commitez jamais de fichiers de configuration locale
- Vérifiez que `.gitignore` est respecté avant chaque commit
- Utilisez le **Mock AI** pour les tests et la documentation

## Conformité légale

- Respect des marques déposées (Moog, Roland, Behringer, Eventide, etc.)
- Les mappages CC/NRPN sont des descriptions techniques issues de manuels officiels
- Citez toujours les sources (URL, pages, révisions)
- Pas de copie extensive de manuels sous copyright

## Audit et revue

- Toute PR est revue pour les aspects de sécurité
- Les schémas JSON sont validés automatiquement
- Les secrets sont détectés par des outils d'analyse statique (à implémenter)

Merci de contribuer à la sécurité de ce projet !

