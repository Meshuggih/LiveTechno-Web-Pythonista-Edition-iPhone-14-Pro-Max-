# Overview de l'application

## Vision

**LiveTechno-Web Pythonista Edition** est un setup live techno assisté par IA pour iPhone 14 Pro Max. L'application permet à l'utilisateur de déclarer ses **machines réelles** (synthés, boîtes à rythmes, effets MIDI), de composer avec l'aide d'une **IA compositrice**, de **pré-écouter** le résultat dans l'app, puis d'**exporter en MIDI** pour piloter son matériel réel dans Logic/Live/boîtiers.

## Objectifs

1. **Composition assistée par IA** : l'utilisateur dialogue avec l'IA qui génère des patterns, automations et arrangements au format JSON strict
2. **Pré-écoute crédible** : DSP "de travail" (AudioWorklet/WASM) pour feedback sonore rapide
3. **Vue DAW intégrée** : timeline multi-pistes + lanes d'automation + table de mixage géante, toujours synchronisées au bureau et aux machines.
4. **Export MIDI propre** : multi-pistes, BPM/signature, noms normalisés, déterministe
5. **Parité de contrôle** : reproduire les interfaces de contrôle (CC/NRPN) des machines réelles, pas leur son exact
6. **Discipline documentaire** : schémas JSON stricts, sources officielles, tests goldens

## Non-objectifs

- ❌ Émulation analogique "à l'identique" des machines
- ❌ Streaming audio serveur dans la maquette
- ❌ Envoi automatique vers matériel réel sans validation utilisateur
- ❌ Clonage sonore exact des synthés

## Architecture technique

### Lecteur HTML intégré

**Fichier** : `PYTHONISTA/HTML_Studio_V4_0.py`

Le lecteur intégré fournit :

- **Serveur HTTP local** (`127.0.0.1`, port auto 8787-8888)
- **En-têtes COOP/COEP** pour débloquer modules ES, AudioWorklet, WASM
- **Console JS** intégrée (logs redirigés vers Pythonista)
- **Hard reload** (cache-busting avec `?v=timestamp`)
- **Mock WebMIDI** (shim pour iOS WebView)
- **Open in Safari** (test PWA/Service Worker)
- **Persistance locale** (JSON + SQLite)
- **Import/Export ZIP** du projet

### UI maquette

**Composants principaux** :

1. **Gate OpenAI** : écran d'accueil pour saisir la clé API ou activer Mock AI
2. **Bureau virtuel** : canvas plein écran avec grille, drag/resize de panneaux machines
3. **Vue Arrangement & Mixer** : timeline façon Logic Pro + table de mixage monumentale avec bus, sends, automations visibles.
4. **Chat IA** : dock en bas pour dialoguer avec l'IA compositrice
5. **Palette +Machine** : ajouter des clones de machines réelles (filtrable par type/marque)
6. **Séquenceurs** : multi-longueurs (12/16/32/48/64/68/128/256 pas) avec micro-timing, ratchet, probabilité, swing

### Flux utilisateur typique

1. Lancer `HTML_Studio_V4_0.py` dans Pythonista
2. Autoriser l'accès réseau local (iOS)
3. Saisir la clé OpenAI (ou activer Mock AI)
4. Accéder au bureau virtuel
5. Ajouter des machines via la palette +Machine
6. Dialoguer avec l'IA : "Compose un groove funky"
7. L'IA renvoie des Actions JSON (AddMachine, CreatePattern, SetParam, Arrange)
8. L'app valide et applique les actions, synchronise timeline, câblage virtuel et console
9. Pré-écoute dans l'app (DSP AudioWorklet) + monitoring mixeur
10. Export MIDI multi-pistes pour Logic/Live/boîtiers + plan du routing virtuel

## Modèles de données

### Conventions

- **IDs machines** : `vendor.model` en minuscules (ex: `moog.subsequent37`)
- **Normalisation UI/DSP** : 0.0–1.0 (floats)
- **Conversion MIDI** : CC 0–127, NRPN 0–16383 via courbes (`lin|log|exp`)
- **Timing** : PPQ (pulses per quarter, ex. 96/192/480)

### Schémas canoniques

- `Machine.v1` : parité de contrôle d'un appareil réel
- `Pattern.v1` : contenu rythmico-mélodique + automations
- `ProjectState.v1` : méta (BPM, signature), machines actives, patterns, routing
- `Actions/*.v1` : AddMachine, CreatePattern, SetParam, Arrange, ExportPlan, ActionBatch
- `Acknowledgement.v1` : preuve de lecture (hashes SHA-256)

## Protocole IA

### Entrées vers l'IA

- `ProjectState.v1` (état complet)
- `Capabilities.v1` (contraintes séquenceur/DSP)
- `Inventory.v1` (machines réellement possédées)
- `UserIntent.v1` (style/intention/contraintes)

### Sorties de l'IA (JSON strict uniquement)

- `AddMachine.v1`
- `CreatePattern.v1`
- `SetParam.v1` (CC/NRPN, easing, durée en beats)
- `Arrange.v1` (intro/build/drop/outro)
- `ExportPlan.v1`
- `ActionBatch.v1` (séquence ordonnée d'actions atomiques)

### Garde-fous

- ❌ Aucune prose, aucune chaîne de pensée
- ✅ Option `explain` courte (1-2 phrases) si vraiment utile
- ❌ Jamais de machine hors `Inventory.v1` sans consentement
- ✅ Toujours respecter `midi.ccMap/nrpn` déclarés
- ✅ Validation UI obligatoire avant application

## DSP de pré-écoute

**Objectif** : feedback sonore utile (pas un clonage)

**Techniques recommandées** :

- Oscillateurs anti-alias (PolyBLEP/MinBLEP)
- Filtres ZDF (zero-delay feedback)
- Oversampling ×2/×4 pour non-linéarités
- Smoothing expo pour tous paramètres (éviter zipper noise)
- Convolution FFT partitionnée (IRs)
- True-peak limiter + dither au bounce

**Cible perf iPhone 14 Pro Max** : < 30% CPU pour 3 machines + FX

## Exports MIDI

- Multi-pistes avec noms normalisés (`BASS`, `DRUMS`, `LEAD`)
- Encodage BPM/signature
- Mapping canal par machine (respecter `ProjectState.routing`)
- Tests goldens : comparer événements, tempo map, structure

## Sécurité

- Clés OpenAI : **jamais** en dépôt, stockage local uniquement
- Données perso : minimales, logs sobres
- Marques : respect des titulaires, description d'interfaces (CC/NRPN) sourcées

## Roadmap

1. ✅ Bootstrap : arbo complète, docs, schémas, gabarits
2. 🔄 Maquette : lecteur intégré + projet HTML/JS/CSS
3. 🔄 Schemas first : Machine/Pattern/ProjectState/Actions
4. 🔄 Machines seed : 4 machines de base (spécs incomplètes mais structurées)
5. ⏳ Tests : goldens MIDI + validation
6. ⏳ PR Bootstrap : vers main
7. ⏳ PR Complete structure : compléter docs, presets, UI
8. ⏳ Itérations : palette +Machine, validation UI, arrangement, exports

## Références

- **README.md** : vision complète (18+ sections)
- **AGENTS.md** : règlement intérieur des IA développeuses
- **DOCUMENTATION/MACHINES/** : docs manuelles des machines
- **DOCUMENTATION/CODING/** : normes de code, TODO policy

