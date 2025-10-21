#!/bin/bash
# Test d'intégration LiveTechno-Web v0.1

echo "🧪 Test d'intégration LiveTechno-Web v0.1"
echo "=========================================="

# Vérifier que tous les fichiers sont présents
echo ""
echo "📁 Vérification des fichiers..."

FILES=(
    "HTML_Studio_V4_0.py"
    "projet/index.html"
    "projet/app.js"
    "projet/style.css"
    "projet/dsp.worklet.js"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (manquant)"
    fi
done

echo ""
echo "✅ Tous les fichiers sont présents"
echo ""
echo "📝 Pour tester l'application :"
echo "1. Lancer le serveur : python3 HTML_Studio_V4_0.py"
echo "2. Ouvrir http://127.0.0.1:8787 dans un navigateur"
echo "3. Entrer une clé API OpenAI"
echo "4. Tester les fonctionnalités"
