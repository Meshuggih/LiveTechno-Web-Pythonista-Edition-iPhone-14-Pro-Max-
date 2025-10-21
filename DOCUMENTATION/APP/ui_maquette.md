# UI de la maquette Pythonista

## Vue d'ensemble

La maquette Pythonista Edition fournit une interface utilisateur complète pour composer de la musique techno assistée par IA sur iPhone 14 Pro Max.

## Architecture UI

### Lecteur HTML intégré

**Fichier** : `PYTHONISTA/HTML_Studio_V4_0.py`

Le lecteur intégré est un serveur HTTP local qui permet de charger l'application web dans une WebView Pythonista.

#### Fonctionnalités

1. **Serveur HTTP local** : `127.0.0.1`, port auto 8787-8888
2. **En-têtes COOP/COEP** : débloquer modules ES, AudioWorklet, WASM
3. **Console JS intégrée** : logs redirigés vers Pythonista
4. **Hard reload** : cache-busting avec `?v=timestamp`
5. **Mock WebMIDI** : shim pour iOS WebView
6. **Open in Safari** : test PWA/Service Worker
7. **Persistance locale** : JSON + SQLite
8. **Import/Export ZIP** : snapshots du projet

#### Configuration

- **Root directory** : `PYTHONISTA/projet/`
- **Port** : auto-détection 8787-8888
- **MIME types** : `.wasm`, `.js`, `.css`, `.html`, `.json`

#### Utilisation

1. Ouvrir `HTML_Studio_V4_0.py` dans Pythonista
2. Appuyer sur "Set Root" et sélectionner `PYTHONISTA/projet/`
3. Appuyer sur "⟲ Hard Reload"
4. Autoriser l'accès réseau local (iOS)
5. L'app se charge dans la WebView

### Écran d'accueil (Gate OpenAI)

**Objectif** : sécuriser l'accès à l'API OpenAI

#### Fonctionnalités

- **Saisie de clé API** : input sécurisé (type password)
- **Mock AI** : checkbox pour activer le mode démo sans clé
- **Validation** : test de la clé avant d'accéder à l'app
- **Stockage local** : `user_openai_key.json` (hors versionnement)

#### Flux

1. L'utilisateur arrive sur l'écran d'accueil
2. Deux options :
   - Saisir une clé OpenAI valide
   - Cocher "Mock AI" pour mode démo
3. Validation de la clé (si fournie)
4. Accès au bureau virtuel

### Bureau virtuel

**Objectif** : espace de travail principal pour composer

#### Composants

1. **Canvas** : zone de travail plein écran avec grille optionnelle
2. **Panneaux machines** : représentations visuelles des machines ajoutées
3. **Grille magnétique** : alignement automatique des panneaux
4. **Zones de regroupement** : organiser les machines par type/fonction
5. **Visualisation câbles** : tracés automatiques des câbles MIDI Thru et audio (jacks) entre machines, thru box et table de mixage.
6. **Toolbar** : boutons d'action (+ Machine, Export, Settings)

#### Interactions

- **Drag & Drop** : déplacer les panneaux machines
- **Resize** : redimensionner les panneaux
- **Double-clic** : ouvrir l'éditeur de machine
- **Clic droit** : menu contextuel (dupliquer, supprimer, etc.)
- **Routeur** : appui long sur un port pour rediriger un câble vers une autre destination.

### Palette +Machine

**Objectif** : ajouter des clones de machines réelles

#### Fonctionnalités

- **Liste filtrable** : recherche par nom, type, marque
- **Catégories** : Synthés, Boîtes à rythmes, Effets
- **Aperçu** : image, description courte, spécifications
- **Ajout** : clic pour ajouter au bureau

#### Machines disponibles (seed)

1. **moog.subsequent37** (Synthé basse)
2. **behringer.rd9** (Boîte à rythmes)
3. **roland.tb303** (Basse acid)
4. **eventide.h90** (Effets)

### Chat IA

**Objectif** : dialoguer avec l'IA compositrice

#### Fonctionnalités

- **Dock en bas** : toujours accessible, repliable
- **Input texte** : saisie des intentions utilisateur
- **Historique** : messages utilisateur + réponses IA
- **Validation UI** : aperçu des actions avant application
- **Feedback** : indicateur de traitement (spinner)

#### Flux

1. L'utilisateur saisit une intention : "Compose un groove funky"
2. L'app envoie le contexte à l'IA (ProjectState, Capabilities, Inventory, UserIntent)
3. L'IA renvoie des Actions JSON
4. L'app affiche un résumé des actions
5. L'utilisateur valide ou rejette
6. Si validé, les actions sont appliquées
7. Historique mis à jour

### Éditeur de machine

**Objectif** : contrôler les paramètres d'une machine

#### Fonctionnalités

- **Panneau de contrôle** : knobs, sliders, switches
- **Mapping MIDI** : affichage des CC/NRPN
- **Automation** : enregistrer/éditer des automations
- **Presets** : sauvegarder/charger des presets
- **Monitoring** : valeurs en temps réel

#### Layout

- **Section oscillateurs** : waveform, pitch, detune
- **Section filtres** : cutoff, resonance, envelope
- **Section enveloppes** : ADSR
- **Section LFO** : rate, depth, shape
- **Section FX** : reverb, delay, distortion

### Séquenceur

**Objectif** : éditer les patterns rythmico-mélodiques

#### Fonctionnalités

- **Multi-longueurs** : 12, 16, 32, 48, 64, 68, 128, 256 pas
- **Résolution** : PPQ configurable (96, 192, 480)
- **Micro-timing** : offset par pas (en ticks)
- **Ratchet** : sous-déclenchements (2, 3, 4, etc.)
- **Probabilité** : chance de déclenchement (0.0–1.0)
- **Swing** : décalage des pas pairs (global ou par piste)
- **Vélocité** : édition graphique
- **Automation** : courbes de paramètres

#### Vues

1. **Piano roll** : notes + vélocité
2. **Step sequencer** : grille de pas
3. **Automation lanes** : courbes de paramètres

### Vue timeline & clips

**Objectif** : offrir une vue arrangement façon DAW.

#### Fonctionnalités

- **Multi-pistes** : une lane par machine + lanes d'automation superposées.
- **Clips** : représentation graphique des patterns (couleur par machine, badges IA quand générés par GPT).
- **Zoom** : pinch/scroll, navigation par mini-map.
- **Loops & marqueurs** : définition de boucles, sections (intro/build/drop/outro) et marqueurs custom.
- **Edition directe** : duplication Alt+drag, raccourcis gestuels pour split/join.

### Table de mixage géante

**Objectif** : centraliser le mixage de toutes les machines virtuelles.

#### Fonctionnalités

- **Faders** : volume, mute, solo, pré/post.
- **Panos** : panoramique + width.
- **Aux sends** : A/B/C paramétrables (reverb/delay/outboard).
- **Bus** : DRUM BUS, SYNTH BUS, FX BUS avec VU-mètres dédiés.
- **Canaux IA** : indicateur lumineux quand l'IA modifie un paramètre.
- **Assignation automatique** : chaque machine ajoutée crée une tranche avec canal MIDI et port audio virtuel affichés.

### Visualisation du câblage

**Objectif** : montrer le setup live complet (MIDI + audio).

#### Fonctionnalités

- **Câbles dynamiques** : tracés Bézier/orthogonaux auto, couleurs par type (MIDI, audio, CV).
- **Boîte MIDI Thru** : hub central affiché avec ports numérotés.
- **Table de mixage** : destination finale, avec inserts/returns visibles.
- **Interactions** : double-tap pour détails (latence, canal), drag pour rerouter, highlight lors de la lecture.
- **Capture** : export PNG/PDF du schéma pour usage studio.

### Arrangement

**Objectif** : structurer le morceau

#### Fonctionnalités

- **Timeline** : vue horizontale du morceau (synchro avec la vue timeline & clips)
- **Sections** : intro, build, drop, outro
- **Patterns** : placement des patterns sur la timeline avec preview de contenu
- **Mute/Solo** : par piste
- **Marqueurs** : annotations
- **Automations** : lanes CC/NRPN, affichage des courbes générées par l'IA
- **Historiques IA** : badges listant les actions GPT appliquées

### Export MIDI

**Objectif** : générer des fichiers MIDI pour matériel réel

#### Fonctionnalités

- **Multi-pistes** : une piste par machine
- **Noms normalisés** : BASS, DRUMS, LEAD, etc.
- **BPM/signature** : encodage dans le fichier MIDI
- **Mapping canal** : respecter `ProjectState.routing`
- **Aperçu** : liste des événements avant export + rappel du routing/câblage
- **Plan du setup** : export parallèle d'un schéma du câblage virtuel

#### Format

- **Type 1** : multi-pistes
- **PPQ** : respecter la résolution du projet
- **Événements** : Note On/Off, CC, NRPN, Program Change

## Responsive design

### iPhone 14 Pro Max

- **Résolution** : 1290 × 2796 pixels (3×)
- **Safe area** : respecter les notches
- **Touch targets** : minimum 44×44 points
- **Gestures** : swipe, pinch, long-press

### Orientation

- **Portrait** : layout vertical (chat en bas, bureau au centre)
- **Landscape** : layout horizontal (chat à droite, bureau à gauche)

## Accessibilité

- **Contraste** : WCAG AA minimum
- **Labels** : aria-label pour tous les contrôles
- **Focus** : indicateurs visuels clairs
- **Taille de texte** : respecter les préférences système

## Performance

### Cibles (iPhone 14 Pro Max)

- **CPU** : < 30% pour 3 machines + FX
- **Mémoire** : < 500 MB
- **Latence audio** : < 50 ms (indicatif, dépend de WebView)
- **FPS** : 60 fps pour les animations

### Optimisations

- **Réutilisation de buffers** : limiter GC
- **Throttling** : limiter les updates UI
- **Lazy loading** : charger les machines à la demande
- **Web Workers** : déporter les calculs lourds

## Références

- **PYTHONISTA/projet/index.html** : point d'entrée
- **PYTHONISTA/projet/app.js** : logique applicative
- **PYTHONISTA/projet/style.css** : styles
- **PYTHONISTA/projet/dsp.worklet.js** : DSP AudioWorklet

