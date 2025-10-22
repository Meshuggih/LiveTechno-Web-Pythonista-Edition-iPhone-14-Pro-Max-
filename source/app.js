/**
 * app.js — Frontend LiveTechno-Web v0.1 (Pythonista compatible)
 */

const API_BASE = 'http://127.0.0.1:8787';

const appState = {
    apiKey: null,
    authenticated: false,
    bpm: 128,
    ppq: 480,
    machines: [],
    patterns: [],
    isPlaying: false,
    audioContext: null,
    audioWorklet: null,
    drawCanvas: null
};

// ============================================================================
// GATE
// ============================================================================

function initGate() {
    const modal = document.getElementById('gate-modal');
    const input = document.getElementById('api-key-input');
    const btn = document.getElementById('validate-key-btn');
    const error = document.getElementById('gate-error');
    
    const stored = localStorage.getItem('openai_api_key');
    if (stored) input.value = stored;
    
    btn.addEventListener('click', async () => {
        const apiKey = input.value.trim();
        if (!apiKey) {
            error.textContent = 'Clé manquante';
            return;
        }
        
        try {
            const res = await fetch(`${API_BASE}/api/auth/validate`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({apiKey})
            });
            
            const data = await res.json();
            
            if (data.valid) {
                localStorage.setItem('openai_api_key', apiKey);
                appState.apiKey = apiKey;
                appState.authenticated = true;
                modal.classList.add('hidden');
                document.getElementById('desktop').classList.remove('hidden');
                initApp();
            } else {
                error.textContent = data.error || 'Clé invalide';
            }
        } catch (e) {
            error.textContent = `Erreur : ${e.message}`;
        }
    });
    
    input.addEventListener('keypress', e => {
        if (e.key === 'Enter') btn.click();
    });
}

// ============================================================================
// APP
// ============================================================================

async function initApp() {
    console.log('🎹 Init app');
    initCanvas();
    initTimeline();
    initChat();
    initButtons();
    await initAudio();
}

// ============================================================================
// CANVAS
// ============================================================================

function initCanvas() {
    const canvas = document.getElementById('desktop-canvas');
    const ctx = canvas.getContext('2d');
    
    function resize() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        draw();
    }
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Grille
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        const grid = 50;
        for (let x = 0; x < canvas.width; x += grid) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += grid) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // Machines
        appState.machines.forEach(m => {
            const {x, y} = m.position;
            const w = 200, h = 100;
            
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(x, y, w, h);
            
            ctx.strokeStyle = '#007aff';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);
            
            ctx.fillStyle = '#fff';
            ctx.font = '14px -apple-system';
            ctx.textAlign = 'center';
            ctx.fillText(m.label, x + w/2, y + h/2);
            
            ctx.font = '12px -apple-system';
            ctx.fillStyle = '#aaa';
            ctx.fillText(`Ch ${m.midiChannel}`, x + w/2, y + h/2 + 20);
        });
    }
    
    window.addEventListener('resize', resize);
    resize();
    
    appState.drawCanvas = draw;
    
    // Drag & drop
    let dragging = null;
    
    canvas.addEventListener('mousedown', e => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        for (const m of appState.machines) {
            const mx = m.position.x, my = m.position.y;
            if (x >= mx && x <= mx + 200 && y >= my && y <= my + 100) {
                dragging = m;
                break;
            }
        }
    });
    
    canvas.addEventListener('mousemove', e => {
        if (dragging) {
            const rect = canvas.getBoundingClientRect();
            dragging.position.x = e.clientX - rect.left - 100;
            dragging.position.y = e.clientY - rect.top - 50;
            draw();
        }
    });
    
    canvas.addEventListener('mouseup', () => {
        dragging = null;
    });
    
    canvas.addEventListener('dblclick', e => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        for (const m of appState.machines) {
            const mx = m.position.x, my = m.position.y;
            if (x >= mx && x <= mx + 200 && y >= my && y <= my + 100) {
                openSequencer(m);
                break;
            }
        }
    });
}

// ============================================================================
// TIMELINE
// ============================================================================

function initTimeline() {
    const play = document.getElementById('play-btn');
    const stop = document.getElementById('stop-btn');
    const slider = document.getElementById('bpm-slider');
    const display = document.getElementById('bpm-display');
    
    play.addEventListener('click', () => {
        appState.isPlaying = true;
        if (appState.audioContext && appState.audioContext.state === 'suspended') {
            appState.audioContext.resume();
        }
    });
    
    stop.addEventListener('click', () => {
        appState.isPlaying = false;
        if (appState.audioContext && appState.audioContext.state === 'running') {
            appState.audioContext.suspend();
        }
    });
    
    slider.addEventListener('input', e => {
        appState.bpm = parseInt(e.target.value);
        display.textContent = `BPM: ${appState.bpm}`;
    });
}

// ============================================================================
// CHAT
// ============================================================================

function initChat() {
    const input = document.getElementById('chat-input');
    const btn = document.getElementById('chat-send-btn');
    const messages = document.getElementById('chat-messages');
    
    async function send() {
        const msg = input.value.trim();
        if (!msg) return;
        
        addMsg('user', msg);
        input.value = '';
        
        try {
            const res = await fetch(`${API_BASE}/api/gpt`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    prompt: msg,
                    projectState: getProjectState()
                })
            });
            
            const data = await res.json();
            
            if (data.pattern) {
                applyPattern(data.pattern);
                addMsg('assistant', `Pattern créé : ${data.pattern.name || 'sans nom'}`);
            } else {
                addMsg('assistant', `Erreur : ${data.error || 'Échec'}`);
            }
        } catch (e) {
            addMsg('assistant', `Erreur : ${e.message}`);
        }
    }
    
    btn.addEventListener('click', send);
    input.addEventListener('keypress', e => {
        if (e.key === 'Enter') send();
    });
    
    function addMsg(type, text) {
        const div = document.createElement('div');
        div.className = `chat-message ${type}`;
        div.textContent = text;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }
}

// ============================================================================
// BUTTONS
// ============================================================================

function initButtons() {
    document.getElementById('add-machine-btn').addEventListener('click', () => {
        document.getElementById('machine-palette-modal').classList.remove('hidden');
    });
    
    document.getElementById('close-palette-btn').addEventListener('click', () => {
        document.getElementById('machine-palette-modal').classList.add('hidden');
    });
    
    document.querySelectorAll('.add-machine-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const id = e.target.dataset.machineId;
            addMachine(id);
            document.getElementById('machine-palette-modal').classList.add('hidden');
        });
    });
    
    document.getElementById('export-midi-btn').addEventListener('click', exportMIDI);
    document.getElementById('save-btn').addEventListener('click', saveProject);
    document.getElementById('load-btn').addEventListener('click', loadProject);
}

// ============================================================================
// MACHINES
// ============================================================================

function addMachine(id) {
    const data = {
        'behringer.rd9': {id: 'behringer.rd9', label: 'Behringer RD-9', defaultChannel: 10},
        'behringer.td3': {id: 'behringer.td3', label: 'Behringer TD-3', defaultChannel: 1}
    };
    
    const d = data[id];
    if (!d) return;
    
    const m = {
        id: d.id,
        instanceId: `${d.id}_${Date.now()}`,
        label: d.label,
        midiChannel: d.defaultChannel,
        position: {
            x: 100 + appState.machines.length * 50,
            y: 100 + appState.machines.length * 50
        },
        params: {}
    };
    
    appState.machines.push(m);
    appState.drawCanvas();
}

function openSequencer(m) {
    if (m.id === 'behringer.rd9') {
        openRD9(m);
    } else if (m.id === 'behringer.td3') {
        openTD3(m);
    }
}

function openRD9(m) {
    const modal = document.getElementById('rd9-sequencer-modal');
    const grid = document.getElementById('rd9-grid');
    
    const instruments = [
        {name: 'BD', note: 36},
        {name: 'SD', note: 38},
        {name: 'LT', note: 43},
        {name: 'MT', note: 47},
        {name: 'HT', note: 50},
        {name: 'RS', note: 37},
        {name: 'CP', note: 39},
        {name: 'CB', note: 56},
        {name: 'CY', note: 49},
        {name: 'OH', note: 46},
        {name: 'CH', note: 42}
    ];
    
    grid.innerHTML = '';
    
    instruments.forEach(inst => {
        const row = document.createElement('div');
        row.className = 'sequencer-row';
        
        const label = document.createElement('div');
        label.className = 'sequencer-row-label';
        label.textContent = inst.name;
        row.appendChild(label);
        
        const steps = document.createElement('div');
        steps.className = 'sequencer-steps';
        
        for (let i = 0; i < 16; i++) {
            const step = document.createElement('div');
            step.className = 'sequencer-step';
            step.dataset.note = inst.note;
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
    
    document.getElementById('close-rd9-btn').addEventListener('click', () => {
        modal.classList.add('hidden');
    }, {once: true});
}

function openTD3(m) {
    const modal = document.getElementById('td3-sequencer-modal');
    const grid = document.getElementById('td3-grid');
    
    grid.innerHTML = '';
    
    const row = document.createElement('div');
    row.className = 'sequencer-row';
    
    const label = document.createElement('div');
    label.className = 'sequencer-row-label';
    label.textContent = 'Notes';
    row.appendChild(label);
    
    const steps = document.createElement('div');
    steps.className = 'sequencer-steps';
    
    for (let i = 0; i < 16; i++) {
        const step = document.createElement('div');
        step.className = 'sequencer-step';
        step.dataset.step = i;
        step.textContent = '-';
        
        step.addEventListener('click', () => {
            const notes = ['C3', 'D3', 'E3', 'G3', 'A3', 'C4'];
            const current = step.textContent;
            const idx = notes.indexOf(current);
            const next = (idx + 1) % (notes.length + 1);
            
            if (next === notes.length) {
                step.textContent = '-';
                step.classList.remove('active');
            } else {
                step.textContent = notes[next];
                step.classList.add('active');
            }
        });
        
        steps.appendChild(step);
    }
    
    row.appendChild(steps);
    grid.appendChild(row);
    
    modal.classList.remove('hidden');
    
    document.getElementById('close-td3-btn').addEventListener('click', () => {
        modal.classList.add('hidden');
    }, {once: true});
}

// ============================================================================
// PATTERNS
// ============================================================================

function applyPattern(pattern) {
    console.log('Pattern:', pattern);
    appState.patterns.push(pattern);
    
    if (appState.audioWorklet && pattern.steps) {
        pattern.steps.forEach((step, idx) => {
            setTimeout(() => {
                appState.audioWorklet.port.postMessage({
                    type: 'noteOn',
                    machine: pattern.targetMachine.includes('rd9') ? 'rd9' : 'td3',
                    note: step.note,
                    velocity: step.vel
                });
                
                setTimeout(() => {
                    appState.audioWorklet.port.postMessage({
                        type: 'noteOff',
                        machine: pattern.targetMachine.includes('rd9') ? 'rd9' : 'td3',
                        note: step.note
                    });
                }, 100);
            }, idx * 250);
        });
    }
}

// ============================================================================
// PROJECT
// ============================================================================

function getProjectState() {
    return {
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
        patterns: appState.patterns
    };
}

async function exportMIDI() {
    try {
        const res = await fetch(`${API_BASE}/api/midi/export`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({projectState: getProjectState()})
        });
        
        if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'export.mid';
            a.click();
            URL.revokeObjectURL(url);
            console.log('✅ Export MIDI');
        }
    } catch (e) {
        console.error('Erreur export:', e);
    }
}

async function saveProject() {
    try {
        const res = await fetch(`${API_BASE}/api/project/save`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({projectState: getProjectState()})
        });
        
        const data = await res.json();
        if (data.success) console.log('✅ Sauvegardé');
    } catch (e) {
        console.error('Erreur save:', e);
    }
}

async function loadProject() {
    try {
        const res = await fetch(`${API_BASE}/api/project/load`);
        const data = await res.json();
        
        if (data.projectState) {
            appState.bpm = data.projectState.meta.bpm;
            appState.ppq = data.projectState.meta.ppq;
            appState.machines = data.projectState.machines;
            appState.patterns = data.projectState.patterns;
            appState.drawCanvas();
            console.log('✅ Chargé');
        }
    } catch (e) {
        console.error('Erreur load:', e);
    }
}

// ============================================================================
// AUDIO
// ============================================================================

async function initAudio() {
    try {
        appState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        await appState.audioContext.audioWorklet.addModule('dsp.js');
        appState.audioWorklet = new AudioWorkletNode(appState.audioContext, 'livetechno-processor');
        appState.audioWorklet.connect(appState.audioContext.destination);
        console.log('✅ Audio OK');
    } catch (e) {
        console.error('Erreur audio:', e);
    }
}

// ============================================================================
// START
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎹 LiveTechno-Web v0.1');
    initGate();
});

