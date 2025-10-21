# Intégration de GPT (OpenAI API) dans Pythonista et applications Web HTML

## Présentation de l'API OpenAI et des modèles GPT-4.1 / GPT-5

L'API OpenAI permet d'utiliser les modèles GPT (dont GPT-4.1 et GPT-5) dans vos applications via des requêtes HTTP sur Internet. Vous devrez obtenir une **clé API secrète** depuis le dashboard OpenAI et la conserver en lieu sûr (ne jamais la publier). L'API est en ligne : une connexion internet est indispensable (il n'existe pas de version locale/offline des modèles GPT, qui tournent sur les serveurs d'OpenAI).

Les modèles de chat fonctionnent via l'endpoint **Chat Completions** (`/v1/chat/completions`). Chaque requête doit spécifier le modèle cible et fournir une liste de messages composant la conversation courante. Le modèle renverra un message réponse à ajouter à la conversation.

### Exemple d'utilisation en Python

```python
import openai

openai.api_key = "VOTRE_CLÉ_API"

reponse = openai.ChatCompletion.create(
    model="gpt-4.1",  # ou "gpt-5", "gpt-4.1-mini", "gpt-4.1-nano"
    messages=[
        {"role": "system", "content": "Vous êtes un assistant serviable."},
        {"role": "user", "content": "Bonjour, que peux-tu faire ?"}
    ]
)

texte = reponse["choices"][0]["message"]["content"]
print(texte)
```

Dans cet exemple, on envoie deux messages : un message système initial qui définit le rôle du chatbot, puis un message de l'utilisateur. L'API renvoie un objet JSON dont on extrait la réponse de l'assistant (`choices[0].message.content`).

### Modèles disponibles

#### GPT-4.1 (avril 2025)

GPT-4.1 est une amélioration de GPT-4 axée sur le code, le suivi d'instructions et le **long contexte**. OpenAI a lancé trois variantes :

- **GPT-4.1** : Modèle complet avec fenêtre de contexte jusqu'à **1 million de tokens**
- **GPT-4.1 mini** : Performances proches de GPT-4 avec latence réduite de moitié et coût réduit de 83%
- **GPT-4.1 nano** : Version ultra-légère et rapide, idéale pour classification ou autocomplétion

Toutes les variantes conservent la fenêtre de contexte de 1M tokens, permettant de gérer des conversations ou documents extrêmement longs.

#### GPT-5 (août 2025)

GPT-5 représente le nouveau modèle phare d'OpenAI, avec des améliorations majeures en **raisonnement complexe**, génération de code front-end, rédaction et précision générale. GPT-5 est un système unifié capable de décider **quand réfléchir plus longuement** sur une question difficile grâce à un "mode pensée" interne.

Variantes disponibles :
- **gpt-5** : Version standard
- **gpt-5-mini** et **gpt-5-nano** : Versions allégées
- **gpt-5-pro** : Raisonnement encore plus poussé (contexte ~400k tokens)
- **gpt-5-codex** : Optimisé pour le développement logiciel

GPT-5 réduit les hallucinations, suit mieux les instructions, et fournit des réponses plus utiles et nuancées.

### Disponibilité & accès

- **GPT-3.5-turbo** : Accessible à tous
- **GPT-4, GPT-4.1, GPT-5** : Peuvent nécessiter un abonnement payant (ChatGPT Plus/Pro) ou autorisation
- GPT-4.1 disponible depuis mai 2025 pour les abonnés Plus/Pro
- GPT-5 déployé progressivement depuis août 2025

Vérifiez la documentation OpenAI pour les noms de modèles exacts et les limitations de taux selon votre souscription.

## Utilisation de l'API OpenAI en Python (Pythonista sur iPhone)

**Pythonista** est un environnement Python pour iOS qui permet d'exécuter des scripts Python sur iPhone/iPad. On peut y intégrer l'API OpenAI pour créer un chatbot GPT dans une app Pythonista.

### Étapes d'intégration

#### 1. Installer la bibliothèque OpenAI

Pythonista ne dispose pas d'un pip standard. Options :
- Utiliser **StaSh** (un shell Pythonista) pour installer `openai`
- Copier manuellement le module `openai` dans votre workspace
- Utiliser des **requêtes HTTP directes** avec le module standard `requests` (inclus dans Pythonista)

#### 2. Configurer la clé API

**⚠️ SÉCURITÉ CRITIQUE** : Ne jamais stocker la clé API en dur dans le code.

Options sécurisées :
- Stocker dans le **porte-clés iOS** de Pythonista
- Utiliser un fichier de config **non partagé** (ajouté au `.gitignore`)
- Variable d'environnement locale

```python
# ❌ NE JAMAIS FAIRE
openai.api_key = "sk-...votreClé..."  # DANGEREUX

# ✅ BONNE PRATIQUE
import json

with open("user_openai_key.json", "r") as f:
    config = json.load(f)
    openai.api_key = config["api_key"]
```

#### 3. Appeler le modèle GPT

##### Option A : Via la bibliothèque `openai`

```python
import openai

openai.api_key = "VOTRE_CLÉ_API"

reponse = openai.ChatCompletion.create(
    model="gpt-4.1-mini",
    messages=[
        {"role": "system", "content": "Tu es un assistant Python."},
        {"role": "user", "content": "Peux-tu me donner un conseil ?"}
    ]
)

texte = reponse["choices"][0]["message"]["content"]
print("Assistant:", texte)
```

##### Option B : Via `requests` (HTTP direct)

```python
import requests
import json

url = "https://api.openai.com/v1/chat/completions"

headers = {
    "Authorization": "Bearer VOTRE_CLÉ_API",
    "Content-Type": "application/json"
}

data = {
    "model": "gpt-4.1-mini",
    "messages": [
        {"role": "system", "content": "Vous êtes un assistant Python."},
        {"role": "user", "content": "Peux-tu me donner un conseil ?"}
    ]
}

response = requests.post(url, headers=headers, data=json.dumps(data))
reponse_json = response.json()

texte = reponse_json["choices"][0]["message"]["content"]
print("Assistant:", texte)
```

#### 4. Interface utilisateur (optionnel)

Options pour l'interface :
- **Console simple** : `input()` pour les questions, `print()` pour les réponses
- **Module `ui`** de Pythonista : Créer une interface graphique native
- **WebView** : Afficher du HTML/CSS pour une interface web

Exemple de boucle console :

```python
conversation = [
    {"role": "system", "content": "Tu es un assistant utile."}
]

while True:
    user_input = input("Vous: ")
    
    if user_input.lower() in ["quit", "exit", "bye"]:
        break
    
    conversation.append({"role": "user", "content": user_input})
    
    reponse = openai.ChatCompletion.create(
        model="gpt-4.1-mini",
        messages=conversation
    )
    
    msg = reponse["choices"][0]["message"]["content"]
    print(f"Assistant: {msg}")
    
    conversation.append({"role": "assistant", "content": msg})
```

#### 5. Gérer l'historique de conversation

**⚠️ IMPORTANT** : L'API ne maintient pas de contexte entre deux appels. Chaque requête est traitée indépendamment. C'est à vous d'envoyer l'historique complet (ou une partie pertinente) à chaque fois.

##### Stratégies de gestion de l'historique

**A. Fenêtre glissante** (recommandé)

```python
MAX_HISTORY = 10  # Garder les 10 derniers échanges

def trim_history(conversation, max_messages=MAX_HISTORY):
    """Conserve le message système + les N derniers échanges."""
    if len(conversation) <= max_messages + 1:
        return conversation
    
    # Garder le message système (index 0) + les derniers messages
    system_msg = [conversation[0]]
    recent_msgs = conversation[-(max_messages):]
    
    return system_msg + recent_msgs

# Utilisation
conversation = trim_history(conversation)
```

**B. Résumé des anciens échanges**

```python
def summarize_old_messages(conversation):
    """Résume les anciens messages pour économiser des tokens."""
    if len(conversation) <= 12:
        return conversation
    
    # Garder système + 2 premiers + résumé + 8 derniers
    system_msg = [conversation[0]]
    old_msgs = conversation[1:4]
    recent_msgs = conversation[-8:]
    
    # Créer un résumé (peut utiliser GPT pour résumer)
    summary = {
        "role": "system",
        "content": f"Résumé des échanges précédents : {len(old_msgs)} messages discutés."
    }
    
    return system_msg + [summary] + recent_msgs
```

**C. Surveillance de la longueur en tokens**

```python
import tiktoken

def count_tokens(messages, model="gpt-4.1"):
    """Compte le nombre de tokens dans les messages."""
    encoding = tiktoken.encoding_for_model(model)
    num_tokens = 0
    
    for message in messages:
        num_tokens += 4  # Overhead par message
        for key, value in message.items():
            num_tokens += len(encoding.encode(value))
    
    num_tokens += 2  # Overhead de la réponse
    return num_tokens

# Utilisation
token_count = count_tokens(conversation)
print(f"Tokens utilisés : {token_count}")

# Limiter si nécessaire
MAX_TOKENS = 10000  # Exemple : limiter à 10k tokens
if token_count > MAX_TOKENS:
    conversation = trim_history(conversation, max_messages=5)
```

#### 6. Gestion des erreurs

**Toujours** englober les appels API dans un `try/except` pour gérer les erreurs.

```python
import time
from openai.error import RateLimitError, APIError, Timeout

def call_gpt_with_retry(messages, model="gpt-4.1-mini", max_retries=3):
    """Appelle GPT avec gestion d'erreurs et retry exponentiel."""
    for attempt in range(max_retries):
        try:
            response = openai.ChatCompletion.create(
                model=model,
                messages=messages,
                timeout=30  # Timeout de 30 secondes
            )
            return response["choices"][0]["message"]["content"]
        
        except RateLimitError:
            if attempt < max_retries - 1:
                wait_time = (2 ** attempt) * 2  # Backoff exponentiel
                print(f"Rate limit atteint. Attente de {wait_time}s...")
                time.sleep(wait_time)
            else:
                print("❌ Quota dépassé après plusieurs tentatives.")
                return None
        
        except Timeout:
            print(f"⏱️  Timeout (tentative {attempt + 1}/{max_retries})")
            if attempt == max_retries - 1:
                return None
        
        except APIError as e:
            print(f"❌ Erreur API : {e}")
            return None
        
        except Exception as e:
            print(f"❌ Erreur inattendue : {e}")
            return None
    
    return None
```

### Bonnes pratiques spécifiques à Pythonista

#### Threading pour ne pas bloquer l'UI

```python
import threading

def call_api_async(messages, callback):
    """Appelle l'API dans un thread séparé."""
    def worker():
        response = call_gpt_with_retry(messages)
        callback(response)
    
    thread = threading.Thread(target=worker)
    thread.start()

# Utilisation
def on_response(text):
    print(f"Assistant: {text}")

call_api_async(conversation, on_response)
```

#### Stockage sécurisé de la clé API

```python
import keychain

# Sauvegarder la clé (une seule fois)
keychain.set_password('openai', 'api_key', 'sk-...')

# Récupérer la clé
api_key = keychain.get_password('openai', 'api_key')
openai.api_key = api_key
```

#### Gestion de la mémoire

Pythonista étant sur mobile, surveillez l'utilisation mémoire :

```python
import sys

# Vérifier la taille de l'historique
history_size = sys.getsizeof(conversation)
print(f"Taille de l'historique : {history_size / 1024:.2f} KB")

# Limiter si nécessaire
if history_size > 100000:  # 100 KB
    conversation = trim_history(conversation, max_messages=5)
```

## Intégration dans une application Web HTML/JavaScript

Il est également possible d'intégrer GPT via l'API dans une application web (page HTML locale avec JavaScript).

### Structure HTML de base

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chatbot GPT</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        #chat {
            border: 1px solid #ddd;
            border-radius: 8px;
            height: 400px;
            overflow-y: auto;
            padding: 15px;
            margin-bottom: 15px;
            background: #f9f9f9;
        }
        
        .message {
            margin-bottom: 10px;
            padding: 10px;
            border-radius: 6px;
        }
        
        .user {
            background: #007aff;
            color: white;
            text-align: right;
        }
        
        .assistant {
            background: #e5e5ea;
            color: black;
        }
        
        #input-container {
            display: flex;
            gap: 10px;
        }
        
        #user-input {
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 16px;
        }
        
        #send-btn {
            padding: 10px 20px;
            background: #007aff;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
        }
        
        #send-btn:hover {
            background: #0051d5;
        }
        
        #send-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
    </style>
</head>
<body>
    <h1>💬 Chatbot GPT</h1>
    <div id="chat"></div>
    <div id="input-container">
        <input type="text" id="user-input" placeholder="Posez votre question..." />
        <button id="send-btn">Envoyer</button>
    </div>
    
    <script src="chatbot.js"></script>
</body>
</html>
```

### Code JavaScript (chatbot.js)

```javascript
// ⚠️ SÉCURITÉ : Ne JAMAIS mettre la clé API en dur dans le code client
// Utiliser un backend proxy ou une variable d'environnement

const API_KEY = "VOTRE_CLÉ_API";  // ❌ DANGEREUX en production
const API_URL = "https://api.openai.com/v1/chat/completions";

let conversation = [
    { role: "system", content: "Tu es un assistant serviable et concis." }
];

const chatDiv = document.getElementById("chat");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// Ajouter un message au chat
function addMessage(role, content) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${role}`;
    messageDiv.textContent = content;
    chatDiv.appendChild(messageDiv);
    chatDiv.scrollTop = chatDiv.scrollHeight;
}

// Appeler l'API OpenAI
async function callGPT(messages) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4.1-mini",
                messages: messages,
                max_tokens: 500,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("Erreur API:", error);
        return "❌ Erreur lors de l'appel à l'API. Vérifiez votre connexion.";
    }
}

// Gérer l'envoi de message
async function sendMessage() {
    const userMessage = userInput.value.trim();
    
    if (!userMessage) return;
    
    // Afficher le message utilisateur
    addMessage("user", userMessage);
    conversation.push({ role: "user", content: userMessage });
    
    // Désactiver l'input pendant l'appel
    userInput.value = "";
    userInput.disabled = true;
    sendBtn.disabled = true;
    sendBtn.textContent = "...";
    
    // Appeler l'API
    const assistantMessage = await callGPT(conversation);
    
    // Afficher la réponse
    addMessage("assistant", assistantMessage);
    conversation.push({ role: "assistant", content: assistantMessage });
    
    // Réactiver l'input
    userInput.disabled = false;
    sendBtn.disabled = false;
    sendBtn.textContent = "Envoyer";
    userInput.focus();
    
    // Limiter l'historique (optionnel)
    if (conversation.length > 20) {
        conversation = [conversation[0], ...conversation.slice(-18)];
    }
}

// Event listeners
sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        sendMessage();
    }
});

// Focus initial
userInput.focus();
```

### ⚠️ Sécurité en production

**JAMAIS** exposer la clé API côté client en production. Solutions :

#### Option 1 : Backend proxy (recommandé)

```javascript
// Frontend appelle votre backend
async function callGPT(messages) {
    const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages })
    });
    
    const data = await response.json();
    return data.message;
}
```

```python
# Backend Python (Flask/FastAPI)
from flask import Flask, request, jsonify
import openai

app = Flask(__name__)
openai.api_key = os.getenv("OPENAI_API_KEY")  # Variable d'environnement

@app.route("/api/chat", methods=["POST"])
def chat():
    messages = request.json["messages"]
    
    response = openai.ChatCompletion.create(
        model="gpt-4.1-mini",
        messages=messages
    )
    
    return jsonify({
        "message": response["choices"][0]["message"]["content"]
    })
```

#### Option 2 : Pythonista WebView (pour maquette)

Dans le contexte de LiveTechno-Web Pythonista Edition, la clé API est stockée **localement** dans Pythonista et **jamais** versionnée.

```python
# HTML_Studio_V4_0.py (serveur Pythonista)
import webview
import json

# Charger la clé depuis un fichier local
with open("user_openai_key.json", "r") as f:
    config = json.load(f)
    API_KEY = config["api_key"]

# Exposer une fonction Python au JavaScript
def call_gpt_from_js(messages):
    """Appelé depuis le JavaScript via pywebview."""
    response = openai.ChatCompletion.create(
        model="gpt-4.1-mini",
        messages=messages
    )
    return response["choices"][0]["message"]["content"]

# Créer la WebView avec l'API exposée
webview.create_window(
    "LiveTechno",
    "projet/index.html",
    js_api={"callGPT": call_gpt_from_js}
)
```

```javascript
// Dans projet/app.js
async function callGPT(messages) {
    // Appel de la fonction Python exposée
    const response = await window.pywebview.api.callGPT(messages);
    return response;
}
```

## Optimisations et bonnes pratiques

### 1. Choix du modèle selon le cas d'usage

| Cas d'usage | Modèle recommandé | Raison |
|-------------|-------------------|--------|
| Chat interactif rapide | gpt-4.1-nano | Latence minimale, coût faible |
| Génération de patterns MIDI | gpt-4.1-mini | Bon équilibre vitesse/qualité |
| Raisonnement complexe | gpt-5 ou gpt-5-pro | Meilleure compréhension |
| Génération de code | gpt-5-codex | Optimisé pour le code |

### 2. Paramètres de génération

```python
response = openai.ChatCompletion.create(
    model="gpt-4.1-mini",
    messages=messages,
    temperature=0.7,      # 0.0 = déterministe, 1.0 = créatif
    max_tokens=500,       # Limiter la longueur de réponse
    top_p=0.9,            # Nucleus sampling
    frequency_penalty=0.0, # Pénaliser les répétitions
    presence_penalty=0.0   # Encourager nouveaux sujets
)
```

### 3. Streaming des réponses (UX améliorée)

```python
response = openai.ChatCompletion.create(
    model="gpt-4.1-mini",
    messages=messages,
    stream=True  # Activer le streaming
)

for chunk in response:
    if "content" in chunk["choices"][0]["delta"]:
        content = chunk["choices"][0]["delta"]["content"]
        print(content, end="", flush=True)
```

### 4. Monitoring des coûts

```python
import tiktoken

def estimate_cost(messages, model="gpt-4.1-mini"):
    """Estime le coût approximatif d'un appel API."""
    encoding = tiktoken.encoding_for_model(model)
    
    input_tokens = sum(len(encoding.encode(msg["content"])) for msg in messages)
    
    # Tarifs approximatifs (à vérifier sur openai.com/pricing)
    costs = {
        "gpt-4.1": {"input": 0.01, "output": 0.03},      # $/1k tokens
        "gpt-4.1-mini": {"input": 0.002, "output": 0.006},
        "gpt-4.1-nano": {"input": 0.0005, "output": 0.0015},
        "gpt-5": {"input": 0.015, "output": 0.045},
        "gpt-5-pro": {"input": 0.03, "output": 0.09}
    }
    
    cost_per_1k = costs.get(model, costs["gpt-4.1-mini"])
    estimated_cost = (input_tokens / 1000) * cost_per_1k["input"]
    
    return {
        "input_tokens": input_tokens,
        "estimated_cost_usd": round(estimated_cost, 4)
    }

# Utilisation
cost_info = estimate_cost(conversation)
print(f"Tokens: {cost_info['input_tokens']}, Coût estimé: ${cost_info['estimated_cost_usd']}")
```

## Références

- [Documentation officielle OpenAI API](https://platform.openai.com/docs/api-reference)
- [Guide des modèles GPT-4.1](https://openai.com/index/gpt-4-1/)
- [Guide des modèles GPT-5](https://openai.com/index/introducing-gpt-5/)
- [Pythonista Documentation](http://omz-software.com/pythonista/docs/)
- [Web Audio API + GPT Integration](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

## Prochaines étapes

1. Implémenter le protocole IA ↔ App (voir `DOCUMENTATION/APP/protocoles.md`)
2. Créer le module `ai_composer.py` pour la génération de patterns
3. Intégrer la validation UI pour les actions JSON
4. Tester avec Mock AI pour le développement sans clé API

