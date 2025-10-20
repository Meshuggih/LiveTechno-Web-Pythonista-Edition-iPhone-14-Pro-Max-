# 🎛️ LiveTechno-Web • **Pythonista Edition (iPhone 14 Pro Max)**
*Maquette locale autonome — Bureau virtuel + Machines réelles clonées + IA compositrice (OpenAI) — Lecteur HTML intégré*

> **But de ce dépôt**  
> Cette branche **Pythonista** est la **maquette locale officielle** : elle permet de tout tester **directement sur iPhone** (sans serveur externe) grâce à un **lecteur HTML/JS/CSS intégré** au dépôt. On y valide l’ergonomie, la logique des **machines** (clones de synthés/boîtes), le **protocole IA** (formulaires JSON ↔︎ actions), les **séquenceurs** et les **exports MIDI** avant tout déploiement en ligne (Cloudflare/Workers/VPS).

---

## 0) TL;DR

- **Lecteur intégré** : `PYTHONISTA/HTML_Studio_V4_0.py` lance un **serveur HTTP local** (`127.0.0.1`) avec **COOP/COEP**, MIME `.wasm`, **console JS**, **Hard Reload**, **Mock MIDI**, **Open in Safari**.  
  👉 *Cloner → Ouvrir le script dans Pythonista → Appuyer sur Run → Tout tester.*
- **App maquette** : un **bureau virtuel** plein écran (canvas) + **chat IA** en bas.  
  Bouton **“+ Machine”** pour ajouter des **clones** (ex. *moog.subsequent37*, *behringer.rd9*, *roland.tb303*, *eventide.h90*).
- **IA compositrice** : architecture **formulaire JSON** (app ↔︎ IA). L’IA lit l’état complet, propose **des actions unitaires** (ajout machine, pattern, automation, arrangement, export plan).
- **Pré-écoute** : DSP interne (AudioWorklet/WASM) pour un son “de travail” crédible; **rendu final** = vos **vrais instruments** via **exports MIDI**.
- **Gate OpenAI** : **clé API obligatoire** au démarrage pour accéder au bureau.  
- **Documentation impérative** : `AGENTS.md` + `DOCUMENTATION/` (à lire **intégralement** avant toute contribution, humaine ou IA).

> iOS demandera l’accès **Réseau local** : **normal** (serveur sur `127.0.0.1` uniquement).

---

## 1) Vision & frontières

- **Objectif** : un **setup live techno** assisté par IA. L’artiste déclare ses **machines réelles**, compose avec l’**IA compositrice**, pré-écoute dans l’app, exporte en **MIDI** pour piloter ses **vrais synthés/effets** (Logic/Live/standalone).
- **Clones** : on vise la **parité de contrôle** (boutons, potards, menus, **MIDI CC/NRPN**), **pas** l’émulation analogique exacte. Le DSP interne sert à **auditionner**, pas à remplacer les originaux.
- **Échelle** : étude et intégration progressive de **centaines** de machines (synthés/boîtes/FX), à partir de leurs **manuels officiels** (sources à l’appui).
- **Non-objectifs** : pas de streaming audio serveur; pas d’écriture automatique vers périphériques réels sans confirmation; pas d’émulation “bit-perfect”.

---

## 2) Structure du dépôt

README.md                          ← CE document (à jour, exhaustif)
AGENTS.md                          ← Règles IMPÉRATIVES pour toutes les IA
DOCUMENTATION/                     ← À LIRE AVANT TOUT CODE (obligation)
APP/                             ← Doc de l’app (générée par IA, tenue à jour)
MACHINES/                        ← Doc manuelle ajoutée par le mainteneur : manuels, schémas, pratiques DSP, CC/NRPN sourcés
CODING/                          ← Normes de code (OOP), TODO policy, génération .md, logs SQLite, sauvegardes
SCHEMAS/                           ← JSON Schema (Machine.v1, Pattern.v1, ProjectState.v1, Actions.v1, etc.)
MACHINES/                          ← Définitions JSON validées (une arbo par modèle réel)
PYTHONISTA/
HTML_Studio_V4_0.py              ← Lecteur intégré (serveur local, preview, console, mock MIDI)
projet/
index.html                     ← Bureau virtuel + Gate OpenAI + Chat IA (UI)
app.js                         ← Gestion UI, machines, séquenceurs, protocole JSON
style.css
dsp.worklet.js                 ← DSP de pré-écoute (approx), + .wasm optionnel
machines/                      ← Spécifs JSON machines utilisées par la maquette
presets/                       ← Presets/kits/patterns démo
assets/                        ← Icônes, IRs, images
TOOLS/                             ← Validateurs JSON, linter CC/NRPN, générateurs d’index
TESTS/                             ← Goldens (patterns de référence, exports MIDI attendus)
.gitignore                         ← Clés/exports/caches, fichiers locaux

**Obligation de lecture (IA & devs)** : `AGENTS.md` + `DOCUMENTATION/APP` + **toute** la doc machine concernée dans `DOCUMENTATION/MACHINES/`.  
> Les contributions sans preuve de lecture/documentation peuvent être refusées.

---

## 3) Lecteur Pythonista intégré (comportement)

- **Serveur HTTP local** (Threading) lié à `127.0.0.1`:PORT (plage 8787–8888).  
- **En-têtes** : `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`, CORS dev, `application/wasm`.  
- **Preview par URL** : `http://127.0.0.1:PORT/...` (≠ `file://`) → modules ES, AudioWorklet, WASM fonctionnels façon prod.  
- **Console JS** intégrée : hook `console.log/warn/error` + `window.onerror` → panneau logs Pythonista.  
- **Hard Reload** : `?v=timestamp` pour casser cache modules/WASM/CSS.  
- **Mock MIDI** : shim `navigator.requestMIDIAccess()` (notes/clock simulées) si WebMIDI indisponible.  
- **Open in Safari** : test PWA/Service Worker (selon support iOS).  
- **ZIP Import/Export** : empaqueter/charger un projet complet.  
- **Persistance locale** : `HTML_Studio_config.json` + `HTML_Studio_logs.db` (SQLite).  
- **UX** : explorateur, éditeur, preview, console, plein écran, ratio split persisté.

---

## 4) Flux utilisateur

1. **Gate OpenAI** : écran de saisie de **clé API** (obligatoire).  
2. **Bureau virtuel** : canvas plein écran, grille optionnelle, **panneau de chat** docké en bas.  
3. **+ Machine** : palette filtrable des appareils supportés (IDs `vendor.model`), ajout sur bureau avec configuration MIDI (canal, nom piste).  
4. **Commande IA** : l’utilisateur tape “Compose un groove funky” → l’**IA compositrice** :  
   - choisit parmi les **machines disponibles** (y compris FX MIDI comme H90),  
   - crée **patterns** et **automations CC/NRPN**,  
   - propose un **arrangement** (intro/build/drop/outro),  
   - met à jour l’**état de projet**.  
5. **Pré-écoute** : DSP interne (approx) + visualisation des contrôles.  
6. **Export MIDI** : multi-pistes, noms normalisés, BPM/signature embarqués → glisser dans Logic/Live → jouer sur **matériel réel**.

---

## 5) Séquenceurs & patterns

- **Longueurs supportées** : **12, 16, 32, 48, 64, 68, 128, 256** pas (et *micro-timing* entre pas).  
- **Résolution** : `PPQ` (ex. 96/192/480) documentée; conversion pas↔︎ticks déterministe.  
- **Step data** : `note`, `velocity`, `gate`, `tie`, `slide`, `ratchet`, `probability`, `microTime`.  
- **Automation** : pistes paramètriques (CC/NRPN) par machine (`target`, `time`, `value`, `curve`).  
- **Swing** : global et par piste; quantification paramétrable.

**Ex. `Pattern.v1`**
```json
{
  "schema": "pattern.v1",
  "id": "bassline_A",
  "lengthSteps": 16,
  "resolutionPPQ": 96,
  "steps": [
    { "t": 0,  "note": 48, "vel": 96, "gate": 0.5, "prob": 1.0 },
    { "t": 4,  "note": 50, "vel": 96, "gate": 0.5, "slide": true },
    { "t": 8,  "note": 53, "vel": 110, "gate": 0.45 },
    { "t": 12, "note": 55, "vel": 100, "ratchet": 2, "prob": 0.7 }
  ],
  "automation": [
    { "target": "cutoff", "at": 0, "val": 0.3, "curve": "exp" },
    { "target": "cutoff", "at": 8, "val": 0.7, "curve": "exp" }
  ]
}


⸻

6) Machines (clones) — spécification
	•	But : décrire fidèlement l’interface et le MIDI d’un appareil réel.
	•	Source : manuels officiels (CC/NRPN, Program Change, SysEx si besoin).
	•	Convention d’ID : marque.modele (minuscules, sans espace), ex. moog.subsequent37, behringer.rd9, roland.tb303, eventide.h90.

Ex. Machine.v1 (gabarit)

{
  "schema": "machine.v1",
  "id": "moog.subsequent37",
  "label": "Moog Subsequent 37",
  "vendor": "Moog",
  "category": "synth",    // synth | drum | fx | mixer | other
  "engine": {
    "type": "subtractive",
    "voices": 2,
    "previewModel": "s37.basic"  // modèle DSP interne pour pré-écoute
  },
  "midi": {
    "defaultChannel": 1,
    "supports": ["note", "cc", "pc", "nrpn"],   // + "sysex" si applicable
    "clockRx": true,
    "clockTx": false,
    "ccMap": [
      { "cc": 1, "name": "modwheel",  "range": [0,127], "curve": "lin", "smoothed": true },
      { "cc": 19, "name": "cutoff",   "range": [0,127], "curve": "exp", "smoothed": true },
      { "cc": 21, "name": "resonance","range": [0,127], "curve": "lin" }
      // … compléter depuis le manuel (pages/URL en sources.json)
    ],
    "nrpn": [
      // { "msb": 0, "lsb": 32, "name": "paramX", "range": [0,16383], "curve":"lin" }
    ],
    "programChange": { "enabled": true, "bankSelect": false }
  },
  "ui": {
    "panel": {
      "width": 520, "height": 260, "snap": 8,
      "controls": [
        { "type":"knob","id":"cutoff","x":40,"y":40,"label":"Cutoff" },
        { "type":"knob","id":"resonance","x":120,"y":40,"label":"Res" }
      ]
    }
  },
  "previewDSP": { "oversampling": 2, "truePeakLimit": -1.0 },
  "doc": {
    "manual": "A CONSULTER",
    "notes": "Les valeurs CC exactes doivent être vérifiées dans le manuel."
  }
}

Règles
	•	Aucune valeur “inventée” : tout CC/NRPN doit être sourcé (page/URL).
	•	Les valeurs UI/DSP normalisées 0.0–1.0; conversion vers MIDI (0–127, 0–16383) via curve (lin/log/exp) documentée.
	•	Tests par machine : un tests.json minimal (pattern, automation) + export attendu.

⸻

7) Protocole IA (app ↔︎ IA compositrice)

L’IA ne devine rien. Elle lit l’état et renvoie des actions JSON pures (une par message ou ActionBatch.v1).
Interdit : “chaîne de pensée”/raisonnement détaillé en clair. Si besoin, champ "explain" bref (1–2 phrases).

7.1 Entrées (app → IA)
	•	ProjectState.v1 — machines sur bureau, patterns, tempo, sections, mapping MIDI.
	•	Capabilities.v1 — séquenceurs, résolutions, limites CPU/DSP, features disponibles.
	•	Inventory.v1 — machines réellement possédées (déclarées par l’utilisateur).
	•	UserIntent.v1 — intention artistique (“funky/groovy”, “acid peak”, “dub minimal”, contraintes, durée, BPM).

7.2 Sorties (IA → app)
	•	AddMachine.v1
	•	CreatePattern.v1
	•	SetParam.v1 (CC/NRPN; easing/durée)
	•	Arrange.v1 (intro/build/drop/outro, transitions)
	•	ExportPlan.v1 (pistes MIDI, noms, BPM, signature)
	•	ActionBatch.v1 (liste ordonnée d’actions atomiques)

Ex.

{
  "schema": "AddMachine.v1",
  "machineId": "behringer.rd9",
  "midiChannel": 10,
  "position": {"x": 120, "y": 80}
}

{
  "schema": "CreatePattern.v1",
  "targetMachine": "moog.subsequent37",
  "lengthSteps": 16,
  "resolutionPPQ": 96,
  "steps": [
    {"t":0,"note":36,"vel":110},
    {"t":4,"note":43,"vel":100,"slide":true},
    {"t":8,"note":41,"vel":110}
  ],
  "automation":[{"target":"cutoff","at":0,"val":0.25},{"target":"cutoff","at":8,"val":0.8}],
  "explain":"Basse funky avec montée de cutoff."
}

{
  "schema": "SetParam.v1",
  "targetMachine": "eventide.h90",
  "param": "mix",
  "value": 0.35,
  "easing": "exp",
  "durationBeats": 4
}

{
  "schema": "ExportPlan.v1",
  "bpm": 128,
  "signature": "4/4",
  "tracks": [
    {"machine":"moog.subsequent37","type":"midi","channel":1,"name":"BASS"},
    {"machine":"behringer.rd9","type":"midi","channel":10,"name":"DRUMS"}
  ]
}

7.3 Garde-fous
	•	Respect strict de midi.ccMap/nrpn.
	•	Jamais de machine hors Inventory.v1 sans consentement explicite.
	•	Une seule action par message, sauf ActionBatch.v1 justifiée.
	•	Validation UI obligatoire avant application (l’utilisateur garde la main).
	•	Mémoire par projet : project_state.json + history/ (diffs append-only) + logs SQLite. Cloisonnement fort.

⸻

8) Documentation & obligations de lecture
	•	AGENTS.md : brief normatif pour toutes les IA (rôle, I/O exacts, interdits, style de sortie, Comprehension Check).
	•	DOCUMENTATION/APP : documentation générée par IA (schémas, flux, états, invariants) → source descriptive de l’app.
	•	DOCUMENTATION/MACHINES : documentation manuelle du mainteneur (extraits/synthèses des manuels, schémas, bonnes pratiques DSP, listes CC/NRPN à jour).
	•	DOCUMENTATION/CODING : normes de code (OOP), génération automatique de .md lors des builds d’outils, logs & sauvegardes SQLite, policy TODO.

Règle dure : lire intégralement AGENTS.md + DOCUMENTATION/APP + la doc MACHINE concernée avant toute tâche.
Option recommandée : renvoyer un JSON Acknowledgement.v1 contenant les hash des fichiers lus (preuve de lecture).

Ex. Acknowledgement.v1

{
  "schema": "Acknowledgement.v1",
  "actor": "ia.compositrice",
  "read": [
    {"path":"AGENTS.md","sha256":"..."},
    {"path":"DOCUMENTATION/APP/overview.md","sha256":"..."},
    {"path":"DOCUMENTATION/MACHINES/moog.subsequent37.md","sha256":"..."}
  ],
  "timestamp": "2025-10-20T10:10:10Z"
}


⸻

9) Normes de code (maquette & futurs outils)
	•	Style : OOP, fonctions pures testables, modules clairs.
	•	Docs auto : chaque composant génère un .md d’interface (I/O, invariants).
	•	Logs & sauvegardes : SQLite pour jobs/erreurs/horodatages; rotations.
	•	TODO policy : tous les TODO restent en place; les tâches réalisées sont cochées [X] (jamais supprimées).
	•	Tests : goldens (patterns/exports). Toute PR qui modifie un golden doit fournir la motivation musicale et la validation.

⸻

10) Qualité audio (pré-écoute)
	•	Oscillateurs anti-alias (PolyBLEP/MinBLEP).
	•	Filtres ZDF (zero-delay feedback).
	•	Oversampling ×2/×4 pour distos/saturations (downsample lin-phase).
	•	Smoothing expo pour tous paramètres.
	•	Convolution FFT partitionnée (IRs).
	•	True-peak limiter + dither au bounce.
	•	Cible iPhone 14 Pro Max : < 30 % CPU pour 3 machines + FX (indicatif).

⸻

11) Lancer la maquette (iPhone)
	1.	Installer Pythonista.
	2.	Cloner ce dépôt ou copier PYTHONISTA/ sur l’iPhone.
	3.	Ouvrir PYTHONISTA/HTML_Studio_V4_0.py.
	4.	Set Root=… → PYTHONISTA/projet/ → ⟲ Hard Reload.
	5.	iOS → Réseau local : autoriser (serveur localhost).
	6.	Lancer l’UI (index.html) → saisir la clé OpenAI → accéder au bureau virtuel.
	7.	Tester + Machine, chat IA, patterns, automation, export MIDI.
	8.	Open in Safari pour PWA (selon support), Mock MIDI si besoin.

⸻

12) Sécurité & confidentialité (maquette)
	•	La clé OpenAI est stockée localement (hors repo).
	•	Aucune donnée personnelle inutile; pas d’envoi externe non sollicité.
	•	Les noms/marques appartiennent à leurs détenteurs; nous décrivons des interfaces (mappages CC/NRPN) avec sources.

⸻

13) Tests & “goldens”
	•	Patterns goldens (acid 16 pas, house 16, break 32, techno 64, etc.) + exports MIDI attendus.
	•	Toute modification d’un golden = PR avec justification (intention musicale, impact sur utilisateurs).

⸻

14) Process d’ajout d’une machine (rituel)
	1.	Créer MACHINES/vendor.model/.
	2.	Créer spec.json (gabarit Machine.v1) + sources.json (pages/URL du manuel).
	3.	Compléter ccMap/nrpn (avec courbes et bornes).
	4.	Ajouter tests.json (pattern minimal + automation).
	5.	Valider via TOOLS/validate.py (schémas/collisions CC).
	6.	PR avec preuves (captures légères, refs exactes).

Interdit : copier des pans entiers de manuels sous copyright.

⸻

15) Glossaire
	•	AudioWorklet : DSP sur thread audio (faible latence).
	•	WASM : WebAssembly (C/C++ compilé).
	•	ZDF : filtres à zero-delay feedback.
	•	CC/NRPN : Control Change / Non-Registered Parameter Number.
	•	PPQ : Pulses Per Quarter (résolution temporelle).
	•	SAB : SharedArrayBuffer (performances FFT).

⸻

16) Roadmap (Pythonista Edition)
	•	Lecteur intégré (HTTP local, COOP/COEP, .wasm, console, Hard Reload, Mock MIDI).
	•	Bureau virtuel : drag/resize, grille, magnétisme.
	•	Palette + Machine (filtre par type/marque).
	•	Chat IA (dock), protocole messages, validation UI.
	•	Gabarits machines : moog.subsequent37, behringer.rd9, roland.tb303, eventide.h90.
	•	Exports MIDI multi-pistes (noms normalisés, BPM/signature).
	•	Goldens & tests automates.
	•	Génération docs .md depuis les définitions/ schémas.

⸻

17) Annexe — Exemples d’actions

Arrange.v1

{
  "schema": "Arrange.v1",
  "sections": [
    {"name":"intro","bars":16},
    {"name":"build","bars":16},
    {"name":"drop","bars":32},
    {"name":"outro","bars":16}
  ]
}

ActionBatch.v1

{
  "schema": "ActionBatch.v1",
  "actions": [
    {"schema":"AddMachine.v1","machineId":"behringer.rd9","midiChannel":10,"position":{"x":80,"y":60}},
    {"schema":"CreatePattern.v1","targetMachine":"behringer.rd9","lengthSteps":16,"resolutionPPQ":96,
     "steps":[{"t":0,"note":36,"vel":120},{"t":4,"note":38,"vel":110},{"t":8,"note":36,"vel":120},{"t":12,"note":38,"vel":110}]}
  ]
}


⸻

18) Licence & mentions
	•	Code maquette : MIT (à confirmer).
	•	Marques & noms : propriété de leurs détenteurs (Moog, Roland, Behringer, Eventide, etc.).
	•	Les tables de CC/NRPN sont des descriptions techniques issues de manuels officiels (citer systématiquement).

⸻

⚠️ Rappel final (discipline)
	•	Lire AGENTS.md + DOCUMENTATION/APP + docs machines avant d’écrire une ligne de code.
	•	Sortie IA = JSON strict (pas de “chaîne de pensée”).
	•	OOP, docs .md auto, logs SQLite, TODO jamais supprimés (✓ quand fait).
	•	Véracité : aucune valeur sans source. Toujours référencer les manuels.

Quand la maquette Pythonista sera validée, la version en ligne (Cloudflare/Workers/R2 + VPS FastAPI) reprendra les mêmes schémas et protocoles, garantissant une continuité parfaite entre local et prod.

