# Guide AudioWorklet pour DSP temps réel

## Introduction

L'**AudioWorklet** est l'API moderne du Web Audio pour le traitement audio personnalisé en temps réel. Elle remplace l'ancien ScriptProcessorNode (déprécié) et offre des performances bien supérieures grâce à l'exécution dans un **thread audio dédié** à haute priorité.

## Pourquoi AudioWorklet ?

### Avantages par rapport à ScriptProcessorNode

| Caractéristique | ScriptProcessorNode | AudioWorklet |
|-----------------|---------------------|--------------|
| Thread | Main thread (UI) | Thread audio dédié |
| Priorité | Normale | Temps réel |
| Latence | Élevée (>100ms) | Faible (<10ms) |
| Glitches | Fréquents | Rares |
| Performance | Limitée | Optimale |
| Statut | ⚠️ Déprécié | ✅ Standard |

### Cas d'usage pour LiveTechno-Web

- **DSP de pré-écoute** : Synthèse audio pour les machines virtuelles
- **Effets temps réel** : Filtres, distorsions, delays
- **Génération de formes d'onde** : Oscillateurs anti-alias (PolyBLEP)
- **Traitement MIDI** : Conversion MIDI → Audio en temps réel

## Architecture AudioWorklet

### Composants principaux

```
┌─────────────────────────────────────────────────────────────┐
│                      Main Thread (UI)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AudioContext                                         │   │
│  │  ├─ addModule("dsp.worklet.js")                      │   │
│  │  ├─ new AudioWorkletNode(context, "processor-name")  │   │
│  │  └─ connect() / disconnect()                         │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────┘
                                │
                                │ MessagePort
                                │
┌───────────────────────────────▼──────────────────────────────┐
│                    Audio Thread (Worklet)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AudioWorkletProcessor                                │   │
│  │  ├─ constructor()                                     │   │
│  │  ├─ process(inputs, outputs, parameters)             │   │
│  │  └─ parameterDescriptors                             │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

### Flux de données

1. **Main thread** : Création du contexte audio et chargement du worklet
2. **Audio thread** : Traitement des buffers audio à chaque frame (128 samples par défaut)
3. **Communication** : Messages bidirectionnels via `MessagePort`

## Implémentation de base

### 1. Fichier Worklet (dsp.worklet.js)

```javascript
/**
 * Processeur audio personnalisé
 * ⚠️ Exécuté dans le thread audio - Pas d'accès au DOM !
 */
class SimpleOscillator extends AudioWorkletProcessor {
    constructor() {
        super();
        
        // État interne
        this.phase = 0;
        this.frequency = 440;  // Hz
        
        // Écouter les messages du main thread
        this.port.onmessage = (event) => {
            if (event.data.type === "setFrequency") {
                this.frequency = event.data.value;
            }
        };
    }
    
    /**
     * Méthode appelée pour chaque frame audio (128 samples)
     * @param {Float32Array[][]} inputs - Buffers d'entrée
     * @param {Float32Array[][]} outputs - Buffers de sortie
     * @param {Object} parameters - Paramètres automatisables
     * @returns {boolean} - true pour continuer, false pour arrêter
     */
    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const channel = output[0];
        
        const sampleRate = sampleRate || 44100;
        const phaseIncrement = (2 * Math.PI * this.frequency) / sampleRate;
        
        for (let i = 0; i < channel.length; i++) {
            // Génération d'une sinusoïde simple
            channel[i] = Math.sin(this.phase);
            
            // Avancer la phase
            this.phase += phaseIncrement;
            
            // Wrap de la phase pour éviter l'accumulation d'erreurs
            if (this.phase > 2 * Math.PI) {
                this.phase -= 2 * Math.PI;
            }
        }
        
        return true;  // Continuer le traitement
    }
    
    /**
     * Définit les paramètres automatisables
     */
    static get parameterDescriptors() {
        return [
            {
                name: "frequency",
                defaultValue: 440,
                minValue: 20,
                maxValue: 20000,
                automationRate: "a-rate"  // Audio-rate (par sample)
            }
        ];
    }
}

// Enregistrer le processeur
registerProcessor("simple-oscillator", SimpleOscillator);
```

### 2. Chargement et utilisation (main thread)

```javascript
// Créer le contexte audio
const audioContext = new AudioContext();

// Charger le worklet
await audioContext.audioWorklet.addModule("dsp.worklet.js");

// Créer une instance du processeur
const oscillatorNode = new AudioWorkletNode(
    audioContext,
    "simple-oscillator"
);

// Connecter à la sortie
oscillatorNode.connect(audioContext.destination);

// Envoyer un message au worklet
oscillatorNode.port.postMessage({
    type: "setFrequency",
    value: 880  // La 880 Hz
});

// Accéder aux paramètres automatisables
const freqParam = oscillatorNode.parameters.get("frequency");
freqParam.setValueAtTime(440, audioContext.currentTime);
freqParam.linearRampToValueAtTime(880, audioContext.currentTime + 1);
```

## Bonnes pratiques pour le DSP temps réel

### 1. ⚠️ Restrictions du thread audio

**INTERDIT** dans le thread audio :
- ❌ `console.log()` (peut causer des glitches)
- ❌ Accès au DOM (`document`, `window`)
- ❌ Allocations mémoire fréquentes (`new Array()`, `[]`)
- ❌ Opérations bloquantes (I/O, fetch)
- ❌ `Math.random()` (lent, utiliser un PRNG personnalisé)

**AUTORISÉ** :
- ✅ Calculs mathématiques purs
- ✅ Accès aux buffers audio
- ✅ Variables locales et état interne
- ✅ Messages via `port.postMessage()`

### 2. Réutilisation des buffers

```javascript
class EfficientProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        
        // ✅ Allouer les buffers UNE SEULE FOIS
        this.tempBuffer = new Float32Array(128);
        this.filterState = new Float32Array(2);
    }
    
    process(inputs, outputs, parameters) {
        const output = outputs[0][0];
        
        // ✅ Réutiliser le buffer temporaire
        for (let i = 0; i < output.length; i++) {
            this.tempBuffer[i] = Math.sin(i * 0.1);
        }
        
        // ❌ NE PAS FAIRE : allocation à chaque frame
        // const temp = new Float32Array(128);  // MAUVAIS !
        
        return true;
    }
}
```

### 3. Smoothing des paramètres (éviter zipper noise)

```javascript
class SmoothedProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.currentValue = 0;
        this.targetValue = 0;
        this.smoothingFactor = 0.999;  // Plus proche de 1 = plus lent
    }
    
    process(inputs, outputs, parameters) {
        const output = outputs[0][0];
        const freqParam = parameters.frequency;
        
        for (let i = 0; i < output.length; i++) {
            // Lissage exponentiel (one-pole filter)
            if (freqParam.length > 1) {
                // a-rate : une valeur par sample
                this.targetValue = freqParam[i];
            } else {
                // k-rate : une valeur par frame
                this.targetValue = freqParam[0];
            }
            
            // Interpolation exponentielle
            this.currentValue = this.currentValue * this.smoothingFactor +
                                this.targetValue * (1 - this.smoothingFactor);
            
            // Utiliser la valeur lissée
            output[i] = Math.sin(this.currentValue);
        }
        
        return true;
    }
}
```

### 4. Gestion de la latence

```javascript
// Main thread
const audioContext = new AudioContext({
    latencyHint: "interactive",  // Options: "balanced", "playback", "interactive"
    sampleRate: 44100            // Forcer le sample rate si nécessaire
});

console.log(`Latence de base : ${audioContext.baseLatency * 1000} ms`);
console.log(`Latence de sortie : ${audioContext.outputLatency * 1000} ms`);
```

## Techniques DSP avancées

### 1. Oscillateurs anti-alias (PolyBLEP)

```javascript
/**
 * Oscillateur sawtooth avec PolyBLEP pour réduire l'aliasing
 */
class PolyBLEPOscillator extends AudioWorkletProcessor {
    constructor() {
        super();
        this.phase = 0;
    }
    
    /**
     * Fonction PolyBLEP pour réduire les discontinuités
     */
    polyBLEP(t, dt) {
        if (t < dt) {
            t = t / dt;
            return t + t - t * t - 1.0;
        } else if (t > 1.0 - dt) {
            t = (t - 1.0) / dt;
            return t * t + t + t + 1.0;
        }
        return 0.0;
    }
    
    process(inputs, outputs, parameters) {
        const output = outputs[0][0];
        const frequency = parameters.frequency[0];
        const sampleRate = sampleRate || 44100;
        
        const phaseIncrement = frequency / sampleRate;
        
        for (let i = 0; i < output.length; i++) {
            // Sawtooth naïf
            let value = 2.0 * this.phase - 1.0;
            
            // Correction PolyBLEP
            value -= this.polyBLEP(this.phase, phaseIncrement);
            
            output[i] = value;
            
            // Avancer la phase
            this.phase += phaseIncrement;
            if (this.phase >= 1.0) {
                this.phase -= 1.0;
            }
        }
        
        return true;
    }
    
    static get parameterDescriptors() {
        return [{
            name: "frequency",
            defaultValue: 440,
            minValue: 20,
            maxValue: 20000,
            automationRate: "k-rate"
        }];
    }
}

registerProcessor("polyblep-oscillator", PolyBLEPOscillator);
```

### 2. Filtre ZDF (Zero-Delay Feedback)

```javascript
/**
 * Filtre passe-bas 1-pole ZDF
 */
class ZDFLowpassFilter extends AudioWorkletProcessor {
    constructor() {
        super();
        this.z1 = 0;  // État du filtre
    }
    
    process(inputs, outputs, parameters) {
        const input = inputs[0][0];
        const output = outputs[0][0];
        const cutoff = parameters.cutoff[0];
        
        const sampleRate = sampleRate || 44100;
        
        // Calcul du coefficient g
        const g = Math.tan(Math.PI * cutoff / sampleRate);
        const G = g / (1.0 + g);
        
        for (let i = 0; i < input.length; i++) {
            // Algorithme ZDF
            const v = (input[i] - this.z1) * G;
            const y = v + this.z1;
            this.z1 = y + v;
            
            output[i] = y;
        }
        
        return true;
    }
    
    static get parameterDescriptors() {
        return [{
            name: "cutoff",
            defaultValue: 1000,
            minValue: 20,
            maxValue: 20000,
            automationRate: "k-rate"
        }];
    }
}

registerProcessor("zdf-lowpass", ZDFLowpassFilter);
```

### 3. Oversampling pour non-linéarités

```javascript
/**
 * Distorsion avec oversampling ×2
 */
class OversampledDistortion extends AudioWorkletProcessor {
    constructor() {
        super();
        
        // Filtres pour downsampling (FIR simple)
        this.filterState = new Float32Array(4);
    }
    
    /**
     * Fonction de saturation (tanh approximation)
     */
    saturate(x) {
        const x2 = x * x;
        return x * (27 + x2) / (27 + 9 * x2);
    }
    
    /**
     * Upsampling linéaire
     */
    upsample(input, output) {
        for (let i = 0; i < input.length; i++) {
            output[i * 2] = input[i];
            output[i * 2 + 1] = (input[i] + (input[i + 1] || input[i])) * 0.5;
        }
    }
    
    /**
     * Downsampling avec filtre FIR
     */
    downsample(input, output) {
        for (let i = 0; i < output.length; i++) {
            output[i] = input[i * 2];
        }
    }
    
    process(inputs, outputs, parameters) {
        const input = inputs[0][0];
        const output = outputs[0][0];
        const drive = parameters.drive[0];
        
        // Buffer temporaire pour oversampling ×2
        const oversampledLength = input.length * 2;
        const upsampled = new Float32Array(oversampledLength);
        const processed = new Float32Array(oversampledLength);
        
        // Upsample
        this.upsample(input, upsampled);
        
        // Traitement non-linéaire
        for (let i = 0; i < oversampledLength; i++) {
            processed[i] = this.saturate(upsampled[i] * drive);
        }
        
        // Downsample
        this.downsample(processed, output);
        
        return true;
    }
    
    static get parameterDescriptors() {
        return [{
            name: "drive",
            defaultValue: 1.0,
            minValue: 1.0,
            maxValue: 10.0,
            automationRate: "k-rate"
        }];
    }
}

registerProcessor("oversampled-distortion", OversampledDistortion);
```

## Optimisation des performances

### 1. Mesure de la charge CPU

```javascript
// Main thread
const audioContext = new AudioContext();

// Surveiller la charge CPU
setInterval(() => {
    const cpuLoad = (audioContext.baseLatency / (128 / audioContext.sampleRate)) * 100;
    console.log(`Charge CPU audio : ${cpuLoad.toFixed(2)}%`);
}, 1000);
```

### 2. Profiling avec Performance API

```javascript
class ProfiledProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.frameCount = 0;
        this.totalTime = 0;
    }
    
    process(inputs, outputs, parameters) {
        const startTime = performance.now();
        
        // ... traitement DSP ...
        
        const endTime = performance.now();
        this.totalTime += (endTime - startTime);
        this.frameCount++;
        
        // Reporter toutes les 1000 frames
        if (this.frameCount % 1000 === 0) {
            const avgTime = this.totalTime / this.frameCount;
            this.port.postMessage({
                type: "performance",
                avgProcessTime: avgTime
            });
        }
        
        return true;
    }
}
```

### 3. Utilisation de WebAssembly (WASM)

```javascript
// Charger un module WASM pour le DSP intensif
class WASMProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.wasmModule = null;
        
        // Charger le module WASM
        this.port.onmessage = async (event) => {
            if (event.data.type === "loadWASM") {
                const response = await fetch("dsp.wasm");
                const bytes = await response.arrayBuffer();
                const module = await WebAssembly.instantiate(bytes);
                this.wasmModule = module.instance.exports;
            }
        };
    }
    
    process(inputs, outputs, parameters) {
        if (!this.wasmModule) return true;
        
        const input = inputs[0][0];
        const output = outputs[0][0];
        
        // Appeler la fonction WASM
        this.wasmModule.processAudio(
            input.buffer,
            output.buffer,
            input.length
        );
        
        return true;
    }
}
```

## Debugging et tests

### 1. Logging sécurisé (sans glitches)

```javascript
class DebugProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.debugBuffer = [];
        this.debugInterval = 0;
    }
    
    process(inputs, outputs, parameters) {
        // ... traitement ...
        
        // Accumuler les logs
        this.debugBuffer.push({
            time: currentFrame,
            value: someValue
        });
        
        // Envoyer par batch toutes les 100 frames
        this.debugInterval++;
        if (this.debugInterval >= 100) {
            this.port.postMessage({
                type: "debug",
                logs: this.debugBuffer
            });
            this.debugBuffer = [];
            this.debugInterval = 0;
        }
        
        return true;
    }
}
```

### 2. Tests unitaires

```javascript
// test/audioworklet.test.js
import { AudioContext } from "web-audio-test-api";

describe("PolyBLEP Oscillator", () => {
    let context;
    let oscillator;
    
    beforeEach(async () => {
        context = new AudioContext();
        await context.audioWorklet.addModule("dsp.worklet.js");
        oscillator = new AudioWorkletNode(context, "polyblep-oscillator");
    });
    
    it("should generate audio without clipping", async () => {
        const buffer = context.createBuffer(1, 128, context.sampleRate);
        // ... test logic ...
    });
    
    it("should respond to frequency changes", () => {
        const freqParam = oscillator.parameters.get("frequency");
        freqParam.value = 880;
        expect(freqParam.value).toBe(880);
    });
});
```

## Intégration avec LiveTechno-Web

### Architecture proposée

```
PYTHONISTA/projet/
├── dsp/
│   ├── worklets/
│   │   ├── oscillators.worklet.js    # PolyBLEP, MinBLEP
│   │   ├── filters.worklet.js        # ZDF filters
│   │   ├── effects.worklet.js        # Distortion, delay, reverb
│   │   └── machines/
│   │       ├── moog.subsequent37.worklet.js
│   │       ├── behringer.rd9.worklet.js
│   │       ├── roland.tb303.worklet.js
│   │       └── eventide.h90.worklet.js
│   ├── engine.js                     # Gestionnaire DSP principal
│   └── presets.json                  # Presets de machines
└── app.js                            # Point d'entrée
```

### Exemple d'intégration

```javascript
// dsp/engine.js
export class DSPEngine {
    constructor() {
        this.context = new AudioContext({ latencyHint: "interactive" });
        this.machines = new Map();
    }
    
    async init() {
        // Charger tous les worklets
        await this.context.audioWorklet.addModule("dsp/worklets/oscillators.worklet.js");
        await this.context.audioWorklet.addModule("dsp/worklets/filters.worklet.js");
        await this.context.audioWorklet.addModule("dsp/worklets/machines/moog.subsequent37.worklet.js");
    }
    
    createMachine(machineId, midiChannel) {
        const node = new AudioWorkletNode(
            this.context,
            `${machineId}-processor`
        );
        
        node.connect(this.context.destination);
        this.machines.set(machineId, node);
        
        return node;
    }
    
    setParameter(machineId, param, value) {
        const machine = this.machines.get(machineId);
        if (!machine) return;
        
        const parameter = machine.parameters.get(param);
        if (parameter) {
            parameter.setValueAtTime(value, this.context.currentTime);
        }
    }
}
```

## Cibles de performance (iPhone 14 Pro Max)

| Métrique | Cible | Mesure |
|----------|-------|--------|
| CPU audio | < 30% | 3 machines + FX |
| Latence totale | < 50 ms | Base + output |
| Glitches | 0 | Sur 10 min |
| Mémoire worklet | < 10 MB | Par machine |
| Temps de chargement | < 500 ms | Tous worklets |

## Références

- [MDN: Using AudioWorklet](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_AudioWorklet)
- [Chrome: AudioWorklet Design Pattern](https://developer.chrome.com/blog/audio-worklet-design-pattern)
- [Real-Time Audio in the Browser](https://engineering.videocall.rs/posts/how-to-make-javascript-audio-not-suck/)
- [PolyBLEP Tutorial](https://www.martin-finke.de/articles/audio-plugins-018-polyblep-oscillator/)
- [ZDF Filters Explained](http://www.u-he.com/downloads/UrsBlog/RePro_Filters_Unveiled.pdf)

## Prochaines étapes

1. Implémenter les oscillateurs PolyBLEP pour chaque machine
2. Créer les filtres ZDF (lowpass, highpass, bandpass)
3. Ajouter l'oversampling pour les distorsions
4. Tester les performances sur iPhone 14 Pro Max
5. Créer des goldens audio pour les tests de régression

