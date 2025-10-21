# Bureau virtuel & vue arrangement

## Objectif

Décrire en détail l'environnement virtuel que doit présenter la maquette Pythonista : un **studio live techno complet** mêlant
bureau modulaire, timeline de type DAW et table de mixage géante, entièrement pilotables à la fois par l'utilisateur et par le
GPT intégré.

## Principes clefs

1. **Timeline multi-pistes** :
   - Affichage plein écran façon Logic Pro/Live avec pistes horizontales pour chaque machine (MIDI, automation, audio placeholder).
   - Patterns représentés par des clips colorés, chainés automatiquement selon la structure (intro/build/drop/outro).
   - Automations CC/NRPN affichées dans des lanes superposées ou repliables.
   - Possibilité de zoomer/dézoomer, boucler, déplacer et dupliquer les clips directement depuis le bureau.
2. **Table de mixage monumentale** :
   - Vue mixeur dockable affichant faders, panoramiques, aux send/return et VU-mètres pour chaque machine virtuelle.
   - Buses de groupe (DRUM BUS, SYNTH BUS, FX BUS) avec couleur dédiée et sommation visuelle.
   - Assignation automatique des machines à la console, avec indication du canal MIDI et du port audio virtuel.
3. **Câblage virtuel** :
   - Canvas affiche **câbles MIDI Thru** et **jacks audio** reliant machines → boîte thru → table de mixage → enregistreur.
   - Les câbles se dessinent automatiquement selon le routing défini dans `ProjectState.v1`.
   - Interaction : appui long pour rerouter, double-tap pour afficher la fiche détaillée (latence, canal, couleur).
4. **GPT en symbiose** :
   - L'IA doit pouvoir créer/modifier la timeline, router les câbles, configurer la console via les actions JSON.
   - Les décisions IA sont annotées visuellement (badges "IA" sur les clips, logs contextuels).
   - Le chat conserve un lien vers les éléments manipulés (clic → focus sur la zone correspondante).
5. **Vue bureau hybride** :
   - Combinaison du plan de travail machines (drag & drop) et de la timeline : split vertical ajustable.
   - Machines affichent leurs contrôles principaux + mini-vue du pattern en cours.
   - Bouton "Vue DAW" pour passer en plein écran timeline/mixage, bouton "Vue Setup" pour revenir au bureau modulaire.
6. **Export et synchronisation** :
   - Export MIDI doit refléter la timeline : un clip = une région exportée, automations CC alignées sur les lanes.
   - Génération d'une carte PDF/PNG du routing (câbles + console) pour usage en studio réel.

## Interactions utilisateur

- **Création machine** : depuis le bureau, glisser une machine sur le canvas → elle apparaît automatiquement dans la timeline et la console.
- **Arrangement** : drag des clips, insertion de marqueurs, duplication par Alt+drag, suppression rapide.
- **Automation** : dessiner courbes (stylet/ doigt) avec snapping optionnel, interpolation log/exp visible.
- **Routing** : menu contextuel "Envoyer vers" pour assigner aux bus/aux.
- **Câbles** : double-tap sur un câble pour afficher le détail (machine source/destination, canal, couleur, longueur virtuelle).

## Impacts techniques attendus

- Nécessite une couche de **layout automatique** pour les câbles (algorithme de spline orthogonale) et la timeline (gestion des overlaps, zoom, snapping).
- Stockage des éléments visuels (clips, câbles, faders) dans `ProjectState.v1` ou structures dérivées pour permettre à l'IA de raisonner dessus.
- Mise à jour des schémas : prévoir des extensions `ProjectState.v2` / `TimelineView.v1` si nécessaire.
- Tests UI : définir des goldens (captures JSON de configuration) pour valider le rendu des timelines et du mixeur.

## Ressources d'inspiration

- Logic Pro X (vue arrangement + mixer)
- Ableton Live Session + Arrangement view
- Elektron Overbridge (visualisation câbles virtuels)
- Moog Sound Studio (diagrammes de patchs)

## Prochaines étapes documentaires

- Décrire le mapping JSON précis des câbles et des lanes d'automation.
- Ajouter des maquettes visuelles (Figma/PNG) dans `DOCUMENTATION/APP/assets/`.
- Définir le protocole d'interaction IA pour lier chat ↔ timeline (nouvelles actions JSON si besoin).
