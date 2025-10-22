========================================
LiveTechno-Web v0.1 — Dossier Source
========================================

Ce dossier contient TOUS les fichiers nécessaires pour faire fonctionner
l'application sur Pythonista (iPhone 14 Pro Max).

FICHIERS (tous à plat, pas d'arborescence) :
--------------------------------------------

1. server.py        — Backend Flask (Python pur, sans mido, sans jsonschema)
2. index.html       — Interface HTML
3. app.js           — Frontend JavaScript
4. style.css        — Styles CSS
5. dsp.js           — DSP AudioWorklet
6. README.txt       — Ce fichier

DÉPENDANCES PYTHON :
--------------------

Installer dans Pythonista :

    pip install flask flask-cors openai

IMPORTANT : Pas de mido, pas de jsonschema (bibliothèques C/C++)

UTILISATION :
-------------

1. Copier TOUS les fichiers de ce dossier dans Pythonista
2. Ouvrir server.py dans Pythonista
3. Appuyer sur Run (▶️)
4. Ouvrir le navigateur : http://127.0.0.1:8787
5. Entrer votre clé API OpenAI (sk-...)
6. Utiliser l'application !

FONCTIONNALITÉS :
-----------------

✅ Gate OpenAI (validation clé API)
✅ Bureau virtuel (Canvas + drag & drop)
✅ Machines : RD-9 (909) + TD-3 (303)
✅ Séquenceurs 16 pas
✅ Chat IA (GPT-4.1-mini)
✅ Export MIDI (pure Python)
✅ Sauvegarde/Chargement projet (JSON)
✅ DSP temps réel (AudioWorklet)

NOTES :
-------

- Tous les fichiers sont dans le MÊME dossier (structure plate)
- Aucune bibliothèque C/C++ requise
- Compatible Pythonista 3.4+
- Testé sur sandbox Linux (équivalent iPhone)

Bon test !

