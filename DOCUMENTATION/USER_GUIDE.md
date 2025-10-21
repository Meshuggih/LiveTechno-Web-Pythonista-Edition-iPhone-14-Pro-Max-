 # 📚 Guide Utilisateur — LiveTechno-Web v0.1

> **Bienvenue dans le guide utilisateur du prototype v0.1 de LiveTechno-Web !**
> 
> Ce document vous guidera à travers l'installation, la configuration et l'utilisation de l'application sur votre iPhone 14 Pro Max avec Pythonista.

---

## 🚀 Installation et Lancement

### Prérequis

Pour utiliser cette application, vous devez disposer des éléments suivants :

- **Appareil** : iPhone 14 Pro Max (ou un appareil iOS récent)
- **Logiciel** : Pythonista 3.4+ installé depuis l'App Store
- **Connexion** : Une connexion WiFi est nécessaire pour télécharger les dépendances.
- **Clé API** : Une clé API OpenAI valide (modèle `gpt-4.1-mini` ou supérieur) est requise pour utiliser l'IA compositrice.

### Étapes d'installation

1.  **Cloner le dépôt** : La méthode la plus simple est d'utiliser l'intégration Git de Pythonista (`StaSh` ou un autre client) pour cloner le dépôt `Meshuggih/LiveTechno-Web-Pythonista-Edition-iPhone-14-Pro-Max-`.

2.  **Installer les dépendances** : Ouvrez la console Pythonista et exécutez la commande suivante pour installer les bibliothèques Python nécessaires.

    ```bash
    pip install flask flask-cors mido openai jsonschema
    ```

3.  **Lancer le serveur** : Naviguez vers le dossier du projet dans Pythonista, ouvrez le fichier `PYTHONISTA/HTML_Studio_V4_0.py` et appuyez sur l'icône "Run" (▶️).

Le serveur backend démarrera sur votre appareil. La console affichera un message de confirmation indiquant que le serveur est actif sur `http://127.0.0.1:8787`.

---

## 🎯 Démarrage Rapide (Quick Start)

### 1. Accéder à l'application

Une fois le serveur lancé, ouvrez le navigateur web intégré de Pythonista (ou Safari sur votre iPhone) et accédez à l'adresse :

> `http://127.0.0.1:8787`

### 2. Gate OpenAI : Entrer votre clé API

Au premier lancement, un écran de bienvenue ("Gate") vous demandera de saisir votre clé API OpenAI.

-   **Saisissez votre clé** dans le champ prévu (elle doit commencer par `sk-...`).
-   Cliquez sur **Valider**.

La clé est validée par le backend et stockée de manière sécurisée dans le `localStorage` de votre navigateur pour ne pas avoir à la resaisir à chaque session. Si la clé est valide, vous accéderez au bureau virtuel.

### 3. Explorer le Bureau Virtuel

Le bureau virtuel est l'interface principale de l'application. Il se compose de trois zones :

| Zone                  | Description                                                                        |
| --------------------- | ---------------------------------------------------------------------------------- |
| **Bureau (Canvas)**   | Zone principale où vous pouvez ajouter et déplacer vos machines virtuelles.          |
| **Timeline**          | En bas à gauche, permet d'arranger les patterns musicaux de manière séquentielle.     |
| **Chat IA**           | En bas à droite, pour interagir avec l'IA compositrice et générer de la musique.   |

### 4. Ajouter une Machine

-   Cliquez sur le bouton **+ Machine** en haut à gauche.
-   Une palette s'ouvre, affichant les deux machines disponibles pour la v0.1 :
    -   **Behringer RD-9** : Une boîte à rythmes puissante, clone de la légendaire TR-909.
    -   **Behringer TD-3** : Un synthétiseur de basse monophonique, clone de l'iconique TB-303.
-   Cliquez sur **Ajouter** à côté de la machine de votre choix pour la placer sur le bureau.

### 5. Créer un Pattern avec l'IA

C'est ici que la magie opère. Utilisez le **Chat IA** pour demander à l'IA de composer pour vous.

-   Dans la zone de texte du chat, tapez une commande simple et descriptive. Par exemple :

    > `Crée un kick 4/4 sur le RD-9`

-   Appuyez sur **Envoyer**.

L'IA va interpréter votre demande, générer un pattern JSON (`CreatePattern.v1`), et l'envoyer à l'application. Le son correspondant sera immédiatement joué par le moteur DSP, et le pattern apparaîtra dans la timeline.

### 6. Utiliser les Séquenceurs

Pour un contrôle manuel, vous pouvez éditer les patterns directement.

-   **Double-cliquez** sur une machine sur le bureau pour ouvrir son séquenceur.
-   **Séquenceur RD-9** : Cliquez sur les cases pour activer ou désactiver les pas pour chacun des 11 instruments.
-   **Séquenceur TD-3** : Cliquez sur les cases pour définir les notes, le slide et l'accent.
-   Cliquez sur **Fermer** pour revenir au bureau.

### 7. Exporter en MIDI

Une fois votre composition terminée, vous pouvez l'exporter pour l'utiliser avec votre matériel réel ou dans un autre logiciel (DAW).

-   Cliquez sur le bouton **Export MIDI** en haut à gauche.
-   Un fichier nommé `export.mid` sera généré et téléchargé par votre navigateur.
-   Vous pouvez ensuite importer ce fichier dans Logic Pro, Ableton Live, ou tout autre séquenceur compatible MIDI.

---

## 🎶 Exemples de Commandes IA

Voici quelques exemples pour vous inspirer. Soyez créatif !

#### Pour le RD-9 (Boîte à rythmes)

-   `Crée un rythme techno simple avec un kick sur chaque temps.`
-   `Ajoute une caisse claire sur les temps 2 et 4.`
-   `Fais un pattern de hi-hat fermé sur toutes les doubles-croches.`
-   `Crée un break de 4 mesures avec des toms.`

#### Pour le TD-3 (Basse)

-   `Crée une ligne de basse acid simple et répétitive.`
-   `Fais une bassline funky en Do mineur.`
-   `Ajoute du slide entre la première et la deuxième note.`
-   `Crée une montée en modulant le cutoff du filtre.`

---

## 🐛 Dépannage

-   **Clé API invalide** : Assurez-vous que votre clé est correcte et qu'elle dispose des crédits nécessaires. Vérifiez qu'il n'y a pas d'espaces avant ou après.
-   **Le son ne joue pas** : Assurez-vous que le volume de votre iPhone n'est pas en sourdine. Le navigateur peut nécessiter une interaction (un clic) pour démarrer l'AudioContext. Essayez de cliquer sur le bouton Play/Stop.
-   **L'application est lente** : Le prototype v0.1 est optimisé, mais l'utilisation de nombreuses machines complexes pourrait dépasser les capacités du DSP. Pour cette version, limitez-vous aux deux machines fournies.

Pour tout autre problème, veuillez consulter les logs dans la console Pythonista ou ouvrir une issue sur le dépôt GitHub.

**Merci d'utiliser LiveTechno-Web !**

