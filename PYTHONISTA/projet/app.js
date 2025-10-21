/**
 * app.js — Frontend JavaScript pour LiveTechno-Web v0.1
 * 
 * Fonctionnalités :
 * - Gate OpenAI (validation clé API)
 * - Bureau virtuel (Canvas, drag & drop)
 * - Séquenceurs RD-9 et TD-3
 * - Timeline multi-pistes
 * - Chat IA (GPT-4.1-mini)
 * - Export MIDI
 * - Persistence (save/load)
 * 
 * Auteur : IA constructrice
 * Date : 2025-10-21
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE_URL = 'http://127.0.0.1:8787';

// État global de l'application
const appState = {
    apiKey: null,
    authenticated: false,
    bpm: 128,
    ppq: 480,
    machines: [],
    patterns: [],
    isPlaying: false,
    audioContext: null,
    audioWorklet: null
};

// ============================================================================
// GATE OPENAI
// ============================================================================

function initGate() {
    const gateModal = document.getElementById('gate-modal');
    const apiKeyInput = document.getElementById('api-key-input');
    const validateBtn = document.getElementById('validate-key-btn');
    const gateError = document.getElementById('gate-error');
    
    // Vérifier si une clé est déjà stockée
    const storedKey = localStorage.getItem('openai_api_key');
    if (storedKey) {
        apiKeyInput.value = storedKey;
    }
    
    validateBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            gateError.textContent = 'Veuillez entrer une clé API';
            return;
        }
        
        // Valider la clé via le backend
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey })
            });
            
            const data = await response.json();
            
            if (data.valid) {
                // Stocker la clé
                localStorage.setItem('openai_api_key', apiKey);
                appState.apiKey = apiKey;
                appState.authenticated = true;
                
                // Cacher le gate et afficher le bureau
                gateModal.classList.add('hidden');
                document.getElementById('desktop').classList.remove('hidden');
                
                // Initialiser l'application
                initApp();
            } else {
                gateError.textContent = data.error || 'Clé API invalide';
            }
        } catch (error) {
            gateError.textContent = `Erreur : ${error.message}`;
        }
    });
    
    // Permettre la validation avec Enter
    apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            validateBtn.click();
        }
    });
}

// ============================================================================
// INITIALISATION DE L'APPLICATION
// ============================================================================

async function initApp() {
    console.log('🎹 Initialisation de LiveTechno-Web v0.1');
    
    // Initialiser le canvas
    initCanvas();
    
    // Initialiser la timeline
    initTimeline();
    
    // Initialiser le chat IA
    initChat();
    
    // Initialiser les boutons
    initButtons();
    
    // Charger les machines disponibles
    await loadMachines();
    
    // Initialiser l'audio
    await initAudio();
    
    console.log('✅ Application initialisée');
}

// ============================================================================
// CANVAS (BUREAU VIRTUEL)
// ============================================================================

function initCanvas() {
    const canvas = document.getElementById('desktop-canvas');
    const ctx = canvas.getContext('2d');
    
    // Adapter la taille du canvas
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        drawCanvas();
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Dessiner le canvas
    function drawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Grille optionnelle
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        
        const gridSize = 50;
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // Dessiner les machines
        appState.machines.forEach(machine => {
            drawMachine(ctx, machine);
        });
    }
    
    function drawMachine(ctx, machine) {
        const { x, y } = machine.position;
        const width = 200;
        const height = 100;
        
        // Fond
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(x, y, width, height);
        
        // Bordure
        ctx.strokeStyle = '#007aff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        
        // Texte
        ctx.fillStyle = '#fff';
        ctx.font = '14px -apple-system';
        ctx.textAlign = 'center';
        ctx.fillText(machine.label, x + width / 2, y + height / 2);
        
        // Canal MIDI
        ctx.font = '12px -apple-system';
        ctx.fillStyle = '#aaa';
        ctx.fillText(`Ch ${machine.midiChannel}`, x + width / 2, y + height / 2 + 20);
    }
    
    // Drag & drop (simplifié pour v0.1)
    let dragging = null;
    
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Trouver la machine cliquée
        for (const machine of appState.machines) {
            const mx = machine.position.x;
            const my = machine.position.y;
            
            if (x >= mx && x <= mx + 200 && y >= my && y <= my + 100) {
                dragging = machine;
                break;
            }
        }
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (dragging) {
            const rect = canvas.getBoundingClientRect();
            dragging.position.x = e.clientX - rect.left - 100;
            dragging.position.y = e.clientY - rect.top - 50;
            drawCanvas();
        }
    });
    
    canvas.addEventListener('mouseup', () => {
        dragging = null;
    });
    
    // Double-clic pour ouvrir le séquenceur
    canvas.addEventListener('dblclick', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        for (const machine of appState.machines) {
            const mx = machine.position.x;
            const my = machine.position.y;
            
            if (x >= mx && x <= mx + 200 && y >= my && y <= my + 100) {
                openSequencer(machine);
                break;
            }
        }
    });
    
    // Stocker la fonction de dessin
    appState.drawCanvas = drawCanvas;
}

// ============================================================================
// TIMELINE
// ============================================================================

function initTimeline() {
    const playBtn = document.getElementById('play-btn');
    const stopBtn = document.getElementById('stop-btn');
    const bpmSlider = document.getElementById('bpm-slider');
    const bpmDisplay = document.getElementById('bpm-display');
    
    playBtn.addEventListener('click', () => {
        appState.isPlaying = true;
        console.log('▶️ Play');
        
        // Démarrer la lecture audio (test simple)
        if (appState.audioContext && appState.audioContext.state === 'suspended') {
            appState.audioContext.resume();
        }
    });
    
    stopBtn.addEventListener('click', () => {
        appState.isPlaying = false;
        console.log('⏹️ Stop');
        
        // Arrêter la lecture audio (test simple)
        if (appState.audioContext && appState.audioContext.state === 'running') {
            appState.audioContext.suspend();
        }
    });
    
    bpmSlider.addEventListener('input', (e) => {
        appState.bpm = parseInt(e.target.value);
        bpmDisplay.textContent = `BPM: ${appState.bpm}`;
    });
}

// ============================================================================
// CHAT IA
// ============================================================================

function initChat() {
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatMessages = document.getElementById('chat-messages');
    
    async function sendMessage() {
        const message = chatInput.value.trim();
        
        if (!message) return;
        
        // Afficher le message utilisateur
        addChatMessage('user', message);
        chatInput.value = '';
        
        // Envoyer au backend
        try {
            const response = await fetch(`${API_BASE_URL}/api/gpt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: message,
                    projectState: getProjectState()
                })
            });
            
            const data = await response.json();
            
            if (data.pattern) {
                // Appliquer le pattern
                applyPattern(data.pattern);
                addChatMessage('assistant', `Pattern créé : ${data.pattern.name || 'Sans nom'}`);
            } else {
                addChatMessage('assistant', `Erreur : ${data.error || 'Génération échouée'}`);
            }
        } catch (error) {
            addChatMessage('assistant', `Erreur : ${error.message}`);
        }
    }
    
    chatSendBtn.addEventListener('click', sendMessage);
    
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    function addChatMessage(type, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// ============================================================================
// BOUTONS
// ============================================================================

function initButtons() {
    // Bouton "+ Machine"
    document.getElementById('add-machine-btn').addEventListener('click', () => {
        document.getElementById('machine-palette-modal').classList.remove('hidden');
    });
    
    // Bouton "Fermer" de la palette
    document.getElementById('close-palette-btn').addEventListener('click', () => {
        document.getElementById('machine-palette-modal').classList.add('hidden');
    });
    
    // Boutons "Ajouter" des machines
    document.querySelectorAll('.add-machine-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const machineId = e.target.dataset.machineId;
            addMachine(machineId);
            document.getElementById('machine-palette-modal').classList.add('hidden');
        });
    });
    
    // Bouton "Export MIDI"
    document.getElementById('export-midi-btn').addEventListener('click', async () => {
        await exportMIDI();
    });
    
    // Bouton "Save"
    document.getElementById('save-project-btn').addEventListener('click', async () => {
        await saveProject();
    });
    
    // Bouton "Load"
    document.getElementById('load-project-btn').addEventListener('click', async () => {
        await loadProject();
    });
}

// ============================================================================
// MACHINES
// ============================================================================

async function loadMachines() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/machines`);
        const data = await response.json();
        console.log('Machines disponibles :', data.machines);
    } catch (error) {
        console.error('Erreur chargement machines :', error);
    }
}

function addMachine(machineId) {
    const machineData = {
        'behringer.rd9': {
            id: 'behringer.rd9',
            label: 'Behringer RD-9',
            defaultChannel: 10
        },
        'behringer.td3': {
            id: 'behringer.td3',
            label: 'Behringer TD-3',
            defaultChannel: 1
        }
    };
    
    const data = machineData[machineId];
    if (!data) return;
    
    const machine = {
        id: data.id,
        instanceId: `${data.id}_${Date.now()}`,
        label: data.label,
        midiChannel: data.defaultChannel,
        position: {
            x: 100 + appState.machines.length * 50,
            y: 100 + appState.machines.length * 50
        },
        params: {}
    };
    
    appState.machines.push(machine);
    appState.drawCanvas();
    
    console.log('Machine ajoutée :', machine);
}

function openSequencer(machine) {
    if (machine.id === 'behringer.rd9') {
        openRD9Sequencer(machine);
    } else if (machine.id === 'behringer.td3') {
        openTD3Sequencer(machine);
    }
}

// ============================================================================
// SÉQUENCEUR RD-9
// ============================================================================

function openRD9Sequencer(machine) {
    const modal = document.getElementById('rd9-sequencer-modal');
    const grid = document.getElementById('rd9-grid');
    
    // Générer la grille (11 instruments × 16 steps)
    const instruments = [
        { name: 'BD', note: 36 },
        { name: 'SD', note: 38 },
        { name: 'LT', note: 43 },
        { name: 'MT', note: 47 },
        { name: 'HT', note: 50 },
        { name: 'RS', note: 37 },
        { name: 'CP', note: 39 },
        { name: 'CB', note: 56 },
        { name: 'CY', note: 49 },
        { name: 'OH', note: 46 },
        { name: 'CH', note: 42 }
    ];
    
    grid.innerHTML = '';
    
    instruments.forEach(instrument => {
        const row = document.createElement('div');
        row.className = 'sequencer-row';
        
        const label = document.createElement('div');
        label.className = 'sequencer-row-label';
        label.textContent = instrument.name;
        row.appendChild(label);
        
        const steps = document.createElement('div');
        steps.className = 'sequencer-steps';
        
        for (let i = 0; i < 16; i++) {
            const step = document.createElement('div');
            step.className = 'sequencer-step';
            step.dataset.instrument = instrument.name;
            step.dataset.note = instrument.note;
            step.dataset.step = i;
            
            step.addEventListener('click', () => {
                step.classList.toggle('active');
            });
            
            steps.appendChild(step);
        }
        
        row.appendChild(steps);
        grid.appendChild(row);
    });
    
    modal.classList.remove('hidden');
    
    // Bouton fermer
    document.getElementById('close-rd9-btn').addEventListener('click', () => {
        modal.classList.add('hidden');
    }, { once: true });
}

// ============================================================================
// SÉQUENCEUR TD-3
// ============================================================================

function openTD3Sequencer(machine) {
    const modal = document.getElementById('td3-sequencer-modal');
    const grid = document.getElementById('td3-grid');
    
    // Générer la grille (16 steps avec notes)
    grid.innerHTML = '';
    
    const notesRow = document.createElement('div');
    notesRow.className = 'sequencer-row';
    
    const notesLabel = document.createElement('div');
    notesLabel.className = 'sequencer-row-label';
    notesLabel.textContent = 'Notes';
    notesRow.appendChild(notesLabel);
    
    const notesSteps = document.createElement('div');
    notesSteps.className = 'sequencer-steps';
    
    for (let i = 0; i < 16; i++) {
        const step = document.createElement('div');
        step.className = 'sequencer-step';
        step.dataset.step = i;
        step.textContent = '-';
        
        step.addEventListener('click', () => {
            // Cycle through notes (C3, D3, E3, G3, A3, C4)
            const notes = ['C3', 'D3', 'E3', 'G3', 'A3', 'C4'];
            const currentNote = step.textContent;
            const currentIndex = notes.indexOf(currentNote);
            const nextIndex = (currentIndex + 1) % (notes.length + 1);
            
            if (nextIndex === notes.length) {
                step.textContent = '-';
                step.classList.remove('active');
            } else {
                step.textContent = notes[nextIndex];
                step.classList.add('active');
            }
        });
        
        notesSteps.appendChild(step);
    }
    
    notesRow.appendChild(notesSteps);
    grid.appendChild(notesRow);
    
    // Slide row
    const slideRow = document.createElement('div');
    slideRow.className = 'sequencer-row';
    
    const slideLabel = document.createElement('div');
    slideLabel.className = 'sequencer-row-label';
    slideLabel.textContent = 'Slide';
    slideRow.appendChild(slideLabel);
    
    const slideSteps = document.createElement('div');
    slideSteps.className = 'sequencer-steps';
    
    for (let i = 0; i < 16; i++) {
        const step = document.createElement('div');
        step.className = 'sequencer-step';
        step.dataset.step = i;
        
        step.addEventListener('click', () => {
            step.classList.toggle('active');
        });
        
        slideSteps.appendChild(step);
    }
    
    slideRow.appendChild(slideSteps);
    grid.appendChild(slideRow);
    
    // Accent row
    const accentRow = document.createElement('div');
    accentRow.className = 'sequencer-row';
    
    const accentLabel = document.createElement('div');
    accentLabel.className = 'sequencer-row-label';
    accentLabel.textContent = 'Accent';
    accentRow.appendChild(accentLabel);
    
    const accentSteps = document.createElement('div');
    accentSteps.className = 'sequencer-steps';
    
    for (let i = 0; i < 16; i++) {
        const step = document.createElement('div');
        step.className = 'sequencer-step';
        step.dataset.step = i;
        
        step.addEventListener('click', () => {
            step.classList.toggle('active');
        });
        
        accentSteps.appendChild(step);
    }
    
    accentRow.appendChild(accentSteps);
    grid.appendChild(accentRow);
    
    modal.classList.remove('hidden');
    
    // Bouton fermer
    document.getElementById('close-td3-btn').addEventListener('click', () => {
        modal.classList.add('hidden');
    }, { once: true });
}

// ============================================================================
// PATTERNS
// ============================================================================

function applyPattern(pattern) {
    console.log('Applying pattern:', pattern);
    appState.patterns.push(pattern);
    
    // Déclencher la lecture audio (test simple)
    if (appState.audioWorklet && pattern.steps) {
        pattern.steps.forEach((step, index) => {
            setTimeout(() => {
                appState.audioWorklet.port.postMessage({
                    type: 'noteOn',
                    machine: pattern.targetMachine.includes('rd9') ? 'rd9' : 'td3',
                    note: step.note,
                    velocity: step.vel
                });
                
                // Note off après 100ms
                setTimeout(() => {
                    appState.audioWorklet.port.postMessage({
                        type: 'noteOff',
                        machine: pattern.targetMachine.includes('rd9') ? 'rd9' : 'td3',
                        note: step.note
                    });
                }, 100);
            }, index * 250); // 250ms entre chaque step (240 BPM)
        });
    }
}

// ============================================================================
// PROJECT STATE
// ============================================================================

function getProjectState() {
    return {
        schema: 'ProjectState.v1',
        meta: {
            name: 'Untitled',
            bpm: appState.bpm,
            signature: '4/4',
            ppq: appState.ppq,
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        },
        machines: appState.machines.map(m => ({
            id: m.id,
            instanceId: m.instanceId,
            midiChannel: m.midiChannel,
            position: m.position,
            params: m.params
        })),
        patterns: appState.patterns,
        routing: appState.machines.map(m => ({
            instanceId: m.instanceId,
            midiChannel: m.midiChannel,
            trackName: m.label
        }))
    };
}

// ============================================================================
// EXPORT MIDI
// ============================================================================

async function exportMIDI() {
    try {
        const projectState = getProjectState();
        
        const response = await fetch(`${API_BASE_URL}/api/midi/export`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectState })
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'export.mid';
            a.click();
            URL.revokeObjectURL(url);
            
            console.log('✅ Export MIDI réussi');
        } else {
            console.error('❌ Export MIDI échoué');
        }
    } catch (error) {
        console.error('Erreur export MIDI :', error);
    }
}

// ============================================================================
// PERSISTENCE
// ============================================================================

async function saveProject() {
    try {
        const projectState = getProjectState();
        
        const response = await fetch(`${API_BASE_URL}/api/project/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectState })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Projet sauvegardé');
        } else {
            console.error('❌ Sauvegarde échouée');
        }
    } catch (error) {
        console.error('Erreur sauvegarde :', error);
    }
}

async function loadProject() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/project/load`);
        const data = await response.json();
        
        if (data.projectState) {
            // Restaurer l'état
            appState.bpm = data.projectState.meta.bpm;
            appState.ppq = data.projectState.meta.ppq;
            appState.machines = data.projectState.machines;
            appState.patterns = data.projectState.patterns;
            
            // Redessiner le canvas
            appState.drawCanvas();
            
            console.log('✅ Projet chargé');
        } else {
            console.error('❌ Chargement échoué');
        }
    } catch (error) {
        console.error('Erreur chargement :', error);
    }
}

// ============================================================================
// AUDIO (PLACEHOLDER)
// ============================================================================

async function initAudio() {
    try {
        appState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('✅ AudioContext initialisé');
        
        // Charger l'AudioWorklet
        await appState.audioContext.audioWorklet.addModule('dsp.worklet.js');
        
        // Créer le nœud AudioWorklet
        appState.audioWorklet = new AudioWorkletNode(appState.audioContext, 'livetechno-processor');
        
        // Connecter au speaker
        appState.audioWorklet.connect(appState.audioContext.destination);
        
        console.log('✅ AudioWorklet chargé et connecté');
    } catch (error) {
        console.error('Erreur initialisation audio :', error);
    }
}

// ============================================================================
// DÉMARRAGE
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎹 LiveTechno-Web v0.1 — Frontend chargé');
    initGate();
});

