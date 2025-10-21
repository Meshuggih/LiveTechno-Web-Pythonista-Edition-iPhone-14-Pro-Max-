# 📜 CHANGELOG.md

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2025-10-21

### ✨ Ajouté (Added)

-   **Architecture de base (MVP)** : Initialisation du projet avec une architecture complète pour le développement sur iPhone 14 Pro Max via Pythonista.
-   **Backend Python (Flask)** : Serveur local `Flask` (`127.0.0.1:8787`) avec gestion des en-têtes `CORS`, `COOP`, et `COEP` pour une compatibilité maximale avec les API web modernes.
-   **Frontend JavaScript (Vanilla)** : Interface utilisateur complète développée en JavaScript natif pour des performances optimales, incluant :
    -   **Gate OpenAI** : Pop-up de validation de clé API pour l'accès sécurisé.
    -   **Bureau Virtuel** : Espace de travail basé sur `Canvas` avec grille et support du glisser-déposer (drag & drop).
    -   **Timeline Multi-pistes** : Interface d'arrangement de style DAW pour organiser les patterns.
    -   **Chat IA** : Panneau de discussion pour interagir avec l'IA compositrice.
-   **IA Compositrice (GPT-4.1-mini)** : Intégration avec l'API OpenAI pour la génération de patterns musicaux via des commandes en langage naturel. L'IA communique via un protocole JSON structuré (`CreatePattern.v1`).
-   **DSP en Temps Réel (AudioWorklet)** : Moteur audio haute performance pour la pré-écoute, incluant :
    -   **Oscillateurs PolyBLEP** : Génération d'ondes *sawtooth* et *square* sans aliasing.
    -   **Filtres ZDF** : Filtres *lowpass* 1-pôle et 2-pôles résonants à feedback nul (Zero-Delay Feedback).
    -   **Enveloppes ADSR** : Enveloppes standards pour le contrôle dynamique de l'amplitude.
-   **Machines Virtuelles (v0.1)** :
    -   **Behringer RD-9** : Implémentation du DSP pour les sons de batterie (kick, snare, hi-hats) et du séquenceur 16 pas.
    -   **Behringer TD-3** : Implémentation du DSP pour la basse (oscillateur, filtre, enveloppe, slide) et du séquenceur 16 pas.
-   **Export MIDI** : Fonctionnalité d'exportation des compositions en fichiers `.mid` de Type 1 (multi-pistes), compatibles avec les séquenceurs matériels et logiciels.
-   **Persistence** : Sauvegarde et chargement de l'état complet du projet (`ProjectState.v1`) au format JSON.
-   **Logging** : Base de données `SQLite` pour l'enregistrement des actions et des erreurs, facilitant le débogage.
-   **Documentation Complète** :
    -   `USER_GUIDE.md` : Guide détaillé pour l'installation et l'utilisation.
    -   `README.md` : Vue d'ensemble de l'architecture et des objectifs.
    -   `AGENTS.md` : Règles impératives pour les contributions (humaines et IA).
    -   `DECISIONS.md` : Archives des décisions architecturales (ADR).

### ⚡ Modifié (Changed)

-   **Optimisation DSP** : Amélioration des algorithmes `PolyBLEP` et `ZDF` et pré-calcul des taux d'enveloppe pour réduire la charge CPU.

### 🐛 Corrigé (Fixed)

-   CeCeci est la première version, aucun bug n'a encore été corrigé.

### 🗑️ Supprimé (Removed)

-   Aucune fonctionnalité n'a été supprimée.

