# 🤖 AGENTS.md — Règlement intérieur des IA (et devs) du dépôt *LiveTechno-Web • Pythonista Edition*

> **Objet** : cadrer **toutes** les IA (et humains) qui contribuent au dépôt.  
> **But** : produire du code **éprouvé**, **lisible**, **testé**, **non halluciné** et **compatible** avec l’architecture et la vision du projet.  
> **Principe** : *méthode d’abord, code ensuite*. Rien n’est codé sans lecture préalable et plan clair.  
> **Langue du dépôt** : Français (code/commentaires/doc en FR sauf API standards).

---

## 0) TL;DR (obligations non négociables)

1. **Lire intégralement** : `README.md`, `DOCUMENTATION/APP/*`, `DOCUMENTATION/MACHINES/*` pertinents, puis `SCHEMAS/*`.  
2. **Preuve de lecture** : poster un JSON **`Acknowledgement.v1`** (voir §2) avec **hash SHA-256** des fichiers lus.  
3. **Sortie publique** (issues/PRs) : **pas de “chaîne de pensée”**. Résumés courts + artefacts concrets (plan, schémas, patchs, tests).  
4. **Aucune invention** de CC/NRPN/paramètres : **sources officielles** obligatoires (page/URL).  
5. **OOP** + **docs .md auto** + **logs SQLite** si pertinent + **TODOs** **conservés** (cochés `[X]` quand réalisés).  
6. **Tests & goldens** obligatoires pour tout changement fonctionnel.  
7. **Compatibilité iPhone 14 Pro Max** : budgets CPU/latence respectés.  
8. **Clés OpenAI** : jamais en dur, jamais en client “prod”. Ici (maquette), stockage **local** non versionné.

---

## 1) Rôles des IA

- **IA compositrice** : *utilisée dans l’app* (pas ici pour coder) — produit **uniquement** des **formulaires JSON d’actions** (Add/Pattern/SetParam/Arrange/ExportPlan). Voir `README.md §7`.  
- **IA constructrice** *(vous, ici)* : conçoit, code, teste, documente. Suit **strictement** AGENTS.md + schémas + doc.  
  - **IA architecte** : propose designs/ADR (`docs/ADR-*.md`).  
  - **IA codeuse** : écrit patchs + tests.  
  - **IA documentaliste** : génère/maintient docs `.md`, met à jour `DOCUMENTATION/APP`.

---

## 2) Onboarding & preuve de lecture

Avant toute tâche, **publier** dans l’issue/PR le JSON :

```json
{
  "schema": "Acknowledgement.v1",
  "actor": "ia.constructrice",
  "read": [
    {"path":"README.md","sha256":"<…>"},
    {"path":"DOCUMENTATION/APP/overview.md","sha256":"<…>"},
    {"path":"DOCUMENTATION/MACHINES/moog.subsequent37.md","sha256":"<…>"},
    {"path":"SCHEMAS/Machine.v1.schema.json","sha256":"<…>"}
  ],
  "timestamp": "YYYY-MM-DDThh:mm:ssZ"
}

Sans cet accusé, la contribution peut être refusée.

⸻

3) Modes de sortie autorisés (pour vous, IA constructrice)
	•	Plan court (≤ 200 mots) : objectifs, risques, artefacts à produire.
	•	ADR (Architecture Decision Record) : problème ➜ options ➜ décision ➜ conséquences.
	•	Schémas JSON : *.schema.json (draft-07+), exemples valides/invalides.
	•	Patchs : soit Unified Diff, soit PatchSet.v1 (JSON) + Unified Diff pour lecture humaine.
	•	Tests : cas unitaires (si runners), goldens (fichiers de référence).
	•	Docs : *.md générés (API, schémas, invariants), changelog de migration.
	•	Résumé PR : objectif, impact, sécurité, perf, docs, tests (pas de raisonnement détaillé).

Interdit : raisonnement interne détaillé, prompts de “chaîne de pensée”, pseudo-sources.

⸻

4) Frontières & structure (rappel)

PYTHONISTA/HTML_Studio_V4_0.py   ← Lecteur intégré (serveur local, preview, console, mock MIDI)
PYTHONISTA/projet/               ← Maquette UI (index.html, app.js, dsp.worklet.js, assets…)
SCHEMAS/                         ← Schémas JSON versionnés (Machine/Pattern/ProjectState/Actions)
MACHINES/                        ← Définitions JSON validées par schémas (1 dossier par modèle)
DOCUMENTATION/APP                ← Doc de l’app (générée par IA, maintenue)
DOCUMENTATION/MACHINES           ← Doc manuelle (extraits manuels, circuits, CC/NRPN sourcés)
TOOLS/                           ← validateurs, linters, générateurs d’index/doc
TESTS/                           ← Goldens (patterns, exports MIDI attendus)

Obligation : ne pas briser l’autonomie Pythonista ; le lecteur intégré doit continuer de démarrer et charger projet/.

⸻

5) Workflows normés

5.1 Feature
	1.	Plan court + ADR si nécessaire.
	2.	Schéma(s) à jour + validation TOOLS/validate.py.
	3.	Code OOP + docs .md auto (expliquer I/O, états).
	4.	Goldens (si impact audio/pattern/export).
	5.	Bench mini (CPU iPhone 14 Pro Max cible) dans la PR.

5.2 Ajout d’une machine
	1.	Créer MACHINES/vendor.model/ avec :
	•	spec.json (conforme Machine.v1)
	•	sources.json (pages/URL manuels, révisions)
	•	tests.json (pattern + automation minimales)
	•	preview.json (paramètres du DSP de pré-écoute, si utile)
	2.	Aucune valeur CC/NRPN sans source.
	3.	Valider schéma + collisions CC via TOOLS/validate.py.
	4.	Ajouter un mini preset dans PYTHONISTA/projet/machines/ si utilisé en démo.

5.3 Bugfix
	•	Repro minimal, test de non-régression, patch OOP ciblé, doc impact.

⸻

6) Gouvernance des schémas
	•	Versionnage SemVer (*.v1, *.v2, …).
	•	Migration : fournir un MIGRATIONS.md + script idempotent si rupture.
	•	Validateurs : TOOLS/validate.py doit échouer bruyamment si non conforme.
	•	Convention :
	•	UI/DSP : 0.0–1.0 (float)
	•	MIDI : 0–127 (CC) / 0–16383 (NRPN)
	•	Courbes : lin|log|exp + paramètres optionnels (ex: gamma)

⸻

7) Normes de code & docs
	•	Python (Pythonista) :
	•	HTML_Studio_V4_0.py : conserver l’API publique, la logique serveur local, COOP/COEP, .wasm, console, Hard Reload, Mock MIDI.
	•	Pas de dépendance externe C/C++; privilégier stdlib.
	•	JavaScript (UI/DSP) :
	•	AudioWorklet obligatoire pour DSP temps réel.
	•	Modules ES; pas de globales fuyantes.
	•	Budget CPU iPhone 14 Pro Max : < 30 % avec 3 machines + FX (indicatif).
	•	Smoothing paramètres; évitez GC spikes (buffers réutilisés).
	•	Docs .md auto : pour chaque module public, générer docs/*.md (I/O, invariants, limites).
	•	TODO policy : ne jamais supprimer; cocher [X] quand fait.

⸻

8) DSP & audio (pré-écoute)
	•	Oscillateurs anti-alias (Poly/MinBLEP).
	•	Filtres ZDF.
	•	Oversampling ×2/×4 (distos); downsample phase linéaire si critique.
	•	Convolution FFT partitionnée (IRs).
	•	True-peak limiter + dither aux exports.
	•	Mesures : latence, XRuns estimés, CPU. Reporter dans la PR (table courte).

⸻

9) MIDI & machines — politique stricte
	•	Source unique de vérité : manuels officiels.
	•	Spécifier canal par défaut, Program Change, Bank Select le cas échéant.
	•	CC/NRPN : nom canonique, range, curve, smoothed?.
	•	Interdire collisions CC au sein d’une machine (à part docs officielles ambiguës → le noter).

⸻

10) Sécurité & confidentialité
	•	Clés OpenAI : locales (maquette), jamais versionnées.
	•	Pas de données personnelles; logs sobres (SQLite).
	•	Respect des marques (références nominatives; pas de logos non libres).
	•	Réseau local iOS : le serveur est 127.0.0.1 uniquement.

⸻

11) Tests & goldens
	•	Goldens : patterns & exports MIDI attendus (comparaison stricte).
	•	Audio : là où possible, comparer features (pas de “bit-perfect” attendu en pré-écoute).
	•	CI locale : si runner absent, fournir script reproductible + consignes manuelles.
	•	Changement d’un golden : expliquer pourquoi musicalement.

⸻

12) Hygiène Git & PR
	•	Branches : feat/<topic>, fix/<topic>, machine/<vendor.model>, schema/<name>-vN.
	•	Commits : courts, impératifs, scope clair (feat(ui): …).
	•	PR template (inclure) :
	•	Objectif & motivation (≤ 150 mots)
	•	Changement(s) majeur(s)
	•	Sécurité & secrets
	•	Perf (CPU/latence) & mémoire
	•	Schémas & migrations
	•	Tests (goldens/steps de repro)
	•	Docs mises à jour (liens)
	•	Acknowledgement.v1 (preuve de lecture)

⸻

13) Définition de Fini (DoD)
	•	✅ Schémas à jour & validés
	•	✅ Code OOP + docs .md générées
	•	✅ Tests/goldens OK
	•	✅ Perf iPhone 14 Pro Max dans budget
	•	✅ Aucune clé/API dans le code
	•	✅ TODOs conservés (cochés si réalisés)
	•	✅ PR propre (template rempli + Acknowledgement)

⸻

14) Modèles de sortie (copier/coller)

14.1 Plan court

Objectif :
Impact :
Risques :
Artefacts :
- Schémas :
- Code :
- Tests/goldens :
- Docs :
Perf cible :

14.2 ADR (Architecture Decision Record)

# ADR-YYYYMMDD-<slug>
Contexte :
Options :
Décision :
Conséquences :
Alternatives rejetées :

14.3 PatchSet.v1 (en plus d’un diff unifié)

{
  "schema":"PatchSet.v1",
  "changes":[
    {"path":"SCHEMAS/Machine.v1.schema.json","op":"modify","diff":"<unified-diff>"},
    {"path":"MACHINES/moog.subsequent37/spec.json","op":"add","content":"<json>"}
  ]
}

14.4 Test golden (export MIDI attendu)

TEST: exports/midi/bassline_A.mid
Attendu: TESTS/goldens/exports/bassline_A.mid
Vérif: taille, événements, tempo map, noms de pistes


⸻

15) Points d’attention (pièges fréquents)
	•	WKWebView (Pythonista) ≠ Safari complet (PWA/Service Worker) → tester aussi Open in Safari.
	•	Caches modules/WASM : utiliser Hard Reload (query ?v=).
	•	WebMIDI souvent indisponible en iOS WebView → Mock MIDI obligatoire pour maquette.
	•	Manuels : ne pas copier des pans entiers (copyright). Résumer, citer, lier.

⸻

16) Annexe — Gabarits JSON clefs

Machine.v1 — champs sensibles

{
  "midi": {
    "defaultChannel": 1,
    "supports": ["note","cc","pc","nrpn"],
    "ccMap": [
      {"cc":19,"name":"cutoff","range":[0,127],"curve":"exp","smoothed":true}
    ],
    "nrpn":[]
  }
}

Pattern.v1 — micro-timing/ratchet

{
  "steps":[
    {"t":3,"note":50,"vel":96,"gate":0.45,"microTime":-0.02,"ratchet":2}
  ]
}

ExportPlan.v1 — multi-pistes

{
  "bpm":128,
  "tracks":[
    {"machine":"moog.subsequent37","type":"midi","channel":1,"name":"BASS"},
    {"machine":"behringer.rd9","type":"midi","channel":10,"name":"DRUMS"}
  ]
}


⸻

17) Éthique & légalité
	•	Respect des licences et marques.
	•	Docs machines : synthèses + citations courtes + liens (sources officielles).
	•	Aucune donnée sensible non nécessaire.

⸻

18) Contact & arbitrage
	•	CODEOWNERS définit les arbitres par domaine (UI/DSP/Schémas/Machines).
	•	En cas de conflit : ouvrir un ADR ou une Discussion et référencer les sources.

⸻

Rappel final

Lis, planifie, valide, puis code.
Ici, l’intelligence n’est pas de coder vite, mais de bâtir un écosystème stable où humains & IA composent… sans dissonances.

