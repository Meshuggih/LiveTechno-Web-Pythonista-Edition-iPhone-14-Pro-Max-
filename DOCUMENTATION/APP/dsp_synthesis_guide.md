# Guide DSP : Synthèse audio temps réel pour LiveTechno-Web

> **Objectif** : Fournir les connaissances DSP nécessaires pour implémenter des synthétiseurs et boîtes à rythmes crédibles en JavaScript/AudioWorklet.

---

## 🎯 Principes fondamentaux

### Qu'est-ce que le DSP (Digital Signal Processing) ?

Le DSP est le traitement numérique du signal audio. Dans LiveTechno-Web, le DSP sert à :

1. **Générer** des sons (oscillateurs, noise)
2. **Filtrer** les fréquences (lowpass, highpass, bandpass)
3. **Moduler** les paramètres (envelopes, LFO)
4. **Appliquer** des effets (distorsion, delay, reverb)

### Contraintes temps réel

Le DSP temps réel impose des contraintes strictes :

- **Latence** : < 50 ms (idéalement < 10 ms)
- **CPU** : < 30% sur iPhone 14 Pro Max
- **Pas d'allocations mémoire** dans le thread audio
- **Pas de GC (Garbage Collection)** pendant le traitement

---

## 🌊 Oscillateurs

### Oscillateurs naïfs (à éviter)

Les oscillateurs naïfs produisent de l'**aliasing** (fréquences parasites) aux hautes fréquences.

**Exemple : Sawtooth naïf**
```javascript
// ❌ MAUVAIS : Aliasing audible
function naiveSawtooth(phase) {
    return 2.0 * phase - 1.0;  // Discontinuité à phase = 1.0
}
```

**Problème** : La discontinuité à `phase = 1.0` crée des harmoniques infinies qui se replient (aliasing).

### PolyBLEP (Polynom Bandlimited Step)

PolyBLEP est une technique simple pour réduire l'aliasing en lissant les discontinuités.

**Principe** : Remplacer les discontinuités par des polynômes qui s'annulent aux bords.

**Implémentation** :
```javascript
class PolyBLEPOscillator {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.phase = 0.0;
        this.frequency = 440.0;
        this.phaseIncrement = 0.0;
        this.updatePhaseIncrement();
    }
    
    setFrequency(frequency) {
        this.frequency = frequency;
        this.updatePhaseIncrement();
    }
    
    updatePhaseIncrement() {
        this.phaseIncrement = this.frequency / this.sampleRate;
    }
    
    // PolyBLEP correction
    polyBLEP(t) {
        const dt = this.phaseIncrement;
        
        // Discontinuité à t = 0
        if (t < dt) {
            t /= dt;
            return t + t - t * t - 1.0;
        }
        // Discontinuité à t = 1
        else if (t > 1.0 - dt) {
            t = (t - 1.0) / dt;
            return t * t + t + t + 1.0;
        }
        
        return 0.0;
    }
    
    // Sawtooth avec PolyBLEP
    processSawtooth() {
        let value = 2.0 * this.phase - 1.0;
        value -= this.polyBLEP(this.phase);
        
        this.phase += this.phaseIncrement;
        if (this.phase >= 1.0) {
            this.phase -= 1.0;
        }
        
        return value;
    }
    
    // Square avec PolyBLEP
    processSquare() {
        let value = this.phase < 0.5 ? 1.0 : -1.0;
        value += this.polyBLEP(this.phase);
        value -= this.polyBLEP((this.phase + 0.5) % 1.0);
        
        this.phase += this.phaseIncrement;
        if (this.phase >= 1.0) {
            this.phase -= 1.0;
        }
        
        return value;
    }
}
```

**Avantages** :
- ✅ Réduit l'aliasing de ~60%
- ✅ CPU faible (pas de tables)
- ✅ Fonctionne pour sawtooth, square, triangle

**Inconvénients** :
- ❌ Aliasing résiduel aux très hautes fréquences
- ❌ Nécessite oversampling pour les filtres résonants

---

## 🎛️ Filtres

### Filtres naïfs (à éviter)

Les filtres naïfs (biquad direct form) sont instables à haute résonance.

**Exemple : Biquad lowpass naïf**
```javascript
// ❌ MAUVAIS : Instable à haute résonance
class NaiveLowpass {
    constructor() {
        this.x1 = 0; this.x2 = 0;
        this.y1 = 0; this.y2 = 0;
    }
    
    process(input, cutoff, resonance) {
        // Calcul des coefficients (simplifié)
        const omega = 2 * Math.PI * cutoff / sampleRate;
        const alpha = Math.sin(omega) / (2 * resonance);
        
        const b0 = (1 - Math.cos(omega)) / 2;
        const b1 = 1 - Math.cos(omega);
        const b2 = b0;
        const a0 = 1 + alpha;
        const a1 = -2 * Math.cos(omega);
        const a2 = 1 - alpha;
        
        // Direct Form I (instable)
        const output = (b0/a0) * input + (b1/a0) * this.x1 + (b2/a0) * this.x2
                     - (a1/a0) * this.y1 - (a2/a0) * this.y2;
        
        this.x2 = this.x1; this.x1 = input;
        this.y2 = this.y1; this.y1 = output;
        
        return output;
    }
}
```

**Problème** : À haute résonance, les coefficients deviennent très grands → instabilité numérique.

### ZDF (Zero-Delay Feedback)

Les filtres ZDF sont **stables** à toute résonance et ont une **réponse en fréquence précise**.

**Principe** : Résoudre la boucle de feedback de manière implicite (pas de délai).

**Implémentation : Lowpass 1-pole**
```javascript
class ZDFLowpass1Pole {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.z1 = 0.0;  // État du filtre
        this.g = 0.0;   // Coefficient
    }
    
    setCutoff(cutoff) {
        // Transformation bilinéaire
        const omega = 2 * Math.PI * cutoff / this.sampleRate;
        this.g = Math.tan(omega / 2);
    }
    
    process(input) {
        // Résolution implicite
        const v = (input - this.z1) * this.g / (1 + this.g);
        const lp = v + this.z1;
        this.z1 = lp + v;
        
        return lp;
    }
}
```

**Implémentation : Lowpass 2-pole (résonant)**
```javascript
class ZDFLowpass2Pole {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.z1 = 0.0;
        this.z2 = 0.0;
        this.g = 0.0;
        this.k = 0.0;  // Résonance
    }
    
    setCutoff(cutoff) {
        const omega = 2 * Math.PI * cutoff / this.sampleRate;
        this.g = Math.tan(omega / 2);
    }
    
    setResonance(resonance) {
        // resonance : 0.0 - 1.0
        // k : 0.0 (pas de résonance) - 2.0 (auto-oscillation)
        this.k = 2.0 * (1.0 - resonance);
    }
    
    process(input) {
        // Résolution implicite (2-pole)
        const g2 = this.g * this.g;
        const gk = this.g * this.k;
        
        const v1 = (input - this.z1 * this.k - this.z2) / (1 + gk + g2);
        const v2 = v1 * this.g + this.z1;
        const lp = v2 * this.g + this.z2;
        
        this.z1 += 2 * this.g * v1;
        this.z2 += 2 * this.g * v2;
        
        return lp;
    }
}
```

**Avantages** :
- ✅ Stable à toute résonance (même auto-oscillation)
- ✅ Réponse en fréquence précise
- ✅ Modulation des paramètres sans artefacts

**Inconvénients** :
- ❌ Légèrement plus coûteux en CPU que biquad

---

## 📈 Envelopes

### ADSR (Attack, Decay, Sustain, Release)

L'envelope ADSR est la modulation d'amplitude la plus courante.

**Implémentation** :
```javascript
class ADSREnvelope {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.state = "idle";  // idle, attack, decay, sustain, release
        this.value = 0.0;
        
        // Paramètres (en secondes)
        this.attackTime = 0.01;
        this.decayTime = 0.1;
        this.sustainLevel = 0.7;
        this.releaseTime = 0.2;
        
        // Coefficients (calculés)
        this.attackCoeff = 0.0;
        this.decayCoeff = 0.0;
        this.releaseCoeff = 0.0;
        
        this.updateCoefficients();
    }
    
    updateCoefficients() {
        // Courbe exponentielle : y(t) = 1 - exp(-t / tau)
        // Coefficient : exp(-1 / (tau * sampleRate))
        this.attackCoeff = Math.exp(-1 / (this.attackTime * this.sampleRate));
        this.decayCoeff = Math.exp(-1 / (this.decayTime * this.sampleRate));
        this.releaseCoeff = Math.exp(-1 / (this.releaseTime * this.sampleRate));
    }
    
    noteOn() {
        this.state = "attack";
    }
    
    noteOff() {
        this.state = "release";
    }
    
    process() {
        switch (this.state) {
            case "idle":
                this.value = 0.0;
                break;
                
            case "attack":
                this.value += (1.0 - this.value) * (1.0 - this.attackCoeff);
                if (this.value >= 0.99) {
                    this.value = 1.0;
                    this.state = "decay";
                }
                break;
                
            case "decay":
                this.value += (this.sustainLevel - this.value) * (1.0 - this.decayCoeff);
                if (Math.abs(this.value - this.sustainLevel) < 0.01) {
                    this.value = this.sustainLevel;
                    this.state = "sustain";
                }
                break;
                
            case "sustain":
                this.value = this.sustainLevel;
                break;
                
            case "release":
                this.value *= this.releaseCoeff;
                if (this.value < 0.001) {
                    this.value = 0.0;
                    this.state = "idle";
                }
                break;
        }
        
        return this.value;
    }
}
```

---

## 🥁 Synthèse de boîte à rythmes (909-style)

### Kick (Bass Drum)

**Principe** : Oscillateur sinusoïdal avec pitch envelope + distorsion.

**Implémentation** :
```javascript
class Kick909 {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.phase = 0.0;
        this.pitchEnv = 0.0;
        this.ampEnv = 0.0;
        
        // Paramètres
        this.pitchStart = 80;   // Hz
        this.pitchEnd = 40;     // Hz
        this.pitchDecay = 0.05; // secondes
        this.ampDecay = 0.2;    // secondes
        this.distortion = 0.3;  // 0.0 - 1.0
    }
    
    trigger() {
        this.pitchEnv = 1.0;
        this.ampEnv = 1.0;
    }
    
    process() {
        if (this.ampEnv < 0.001) {
            return 0.0;
        }
        
        // Pitch envelope (exponentiel)
        const pitchEnvCoeff = Math.exp(-1 / (this.pitchDecay * this.sampleRate));
        this.pitchEnv *= pitchEnvCoeff;
        
        // Fréquence instantanée
        const freq = this.pitchEnd + (this.pitchStart - this.pitchEnd) * this.pitchEnv;
        
        // Oscillateur sinusoïdal
        const phaseIncrement = freq / this.sampleRate;
        let sample = Math.sin(2 * Math.PI * this.phase);
        this.phase += phaseIncrement;
        if (this.phase >= 1.0) this.phase -= 1.0;
        
        // Distorsion (soft clipping)
        sample = Math.tanh(sample * (1 + this.distortion * 5));
        
        // Amplitude envelope (exponentiel)
        const ampEnvCoeff = Math.exp(-1 / (this.ampDecay * this.sampleRate));
        this.ampEnv *= ampEnvCoeff;
        
        return sample * this.ampEnv;
    }
}
```

### Snare

**Principe** : Noise blanc filtré + oscillateur sinusoïdal (corps).

**Implémentation** :
```javascript
class Snare909 {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.ampEnv = 0.0;
        this.tonePhase = 0.0;
        
        // Filtre highpass pour le noise
        this.hpFilter = new ZDFHighpass1Pole(sampleRate);
        this.hpFilter.setCutoff(200);
        
        // Paramètres
        this.toneFreq = 200;    // Hz
        this.toneMix = 0.3;     // 0.0 - 1.0 (30% tone, 70% noise)
        this.ampDecay = 0.15;   // secondes
    }
    
    trigger() {
        this.ampEnv = 1.0;
    }
    
    process() {
        if (this.ampEnv < 0.001) {
            return 0.0;
        }
        
        // Noise blanc
        const noise = Math.random() * 2 - 1;
        const filteredNoise = this.hpFilter.process(noise);
        
        // Oscillateur sinusoïdal (corps)
        const phaseIncrement = this.toneFreq / this.sampleRate;
        const tone = Math.sin(2 * Math.PI * this.tonePhase);
        this.tonePhase += phaseIncrement;
        if (this.tonePhase >= 1.0) this.tonePhase -= 1.0;
        
        // Mix
        const sample = filteredNoise * (1 - this.toneMix) + tone * this.toneMix;
        
        // Amplitude envelope
        const ampEnvCoeff = Math.exp(-1 / (this.ampDecay * this.sampleRate));
        this.ampEnv *= ampEnvCoeff;
        
        return sample * this.ampEnv;
    }
}
```

---

## 🎸 Synthèse soustractive (303-style)

### Oscillateur + Filtre résonant

**Principe** : Oscillateur PolyBLEP → Filtre ZDF lowpass résonant → Envelope.

**Implémentation** :
```javascript
class Bass303 {
    constructor(sampleRate) {
        this.sampleRate = sampleRate;
        this.oscillator = new PolyBLEPOscillator(sampleRate);
        this.filter = new ZDFLowpass2Pole(sampleRate);
        this.ampEnvelope = new ADSREnvelope(sampleRate);
        this.filterEnvelope = new ADSREnvelope(sampleRate);
        
        // Paramètres
        this.cutoff = 1000;       // Hz
        this.resonance = 0.7;     // 0.0 - 1.0
        this.envMod = 0.5;        // 0.0 - 1.0
        this.accent = false;
    }
    
    noteOn(note, velocity) {
        this.oscillator.setFrequency(this.midiToFreq(note));
        this.ampEnvelope.noteOn();
        this.filterEnvelope.noteOn();
        
        // Accent : boost velocity + envelope decay plus court
        if (this.accent) {
            velocity = Math.min(127, velocity * 1.3);
            this.filterEnvelope.decayTime = 0.05;
        } else {
            this.filterEnvelope.decayTime = 0.1;
        }
        
        this.filterEnvelope.updateCoefficients();
    }
    
    noteOff() {
        this.ampEnvelope.noteOff();
        this.filterEnvelope.noteOff();
    }
    
    midiToFreq(note) {
        return 440 * Math.pow(2, (note - 69) / 12);
    }
    
    process() {
        // Oscillateur
        const osc = this.oscillator.processSawtooth();
        
        // Envelope de filtre
        const filterEnv = this.filterEnvelope.process();
        
        // Cutoff modulé par envelope
        const modulatedCutoff = this.cutoff * (1 + filterEnv * this.envMod * 10);
        this.filter.setCutoff(modulatedCutoff);
        this.filter.setResonance(this.resonance);
        
        // Filtre
        const filtered = this.filter.process(osc);
        
        // Amplitude envelope
        const ampEnv = this.ampEnvelope.process();
        
        return filtered * ampEnv;
    }
}
```

---

## 🔊 Oversampling

### Pourquoi oversampler ?

Les non-linéarités (distorsion, saturation, filtres résonants) génèrent des harmoniques qui peuvent dépasser la fréquence de Nyquist → aliasing.

**Solution** : Oversampler (×2 ou ×4) avant la non-linéarité, puis downsampler.

### Implémentation

**Upsampling (×2)** :
```javascript
function upsample2x(input) {
    const output = new Float32Array(input.length * 2);
    
    for (let i = 0; i < input.length; i++) {
        output[i * 2] = input[i];
        output[i * 2 + 1] = 0;  // Zéro-padding
    }
    
    // Filtre anti-imaging (lowpass à Fs/4)
    // (Implémentation simplifiée, utiliser un FIR réel en prod)
    return output;
}
```

**Downsampling (×2)** :
```javascript
function downsample2x(input) {
    const output = new Float32Array(input.length / 2);
    
    // Filtre anti-aliasing (lowpass à Fs/4)
    // (Implémentation simplifiée)
    
    for (let i = 0; i < output.length; i++) {
        output[i] = input[i * 2];  // Décimation
    }
    
    return output;
}
```

**Utilisation** :
```javascript
// Oversampling ×2 pour distorsion
const upsampled = upsample2x(input);

for (let i = 0; i < upsampled.length; i++) {
    upsampled[i] = Math.tanh(upsampled[i] * 5);  // Distorsion
}

const output = downsample2x(upsampled);
```

---

## 📊 Mesures et optimisations

### Mesurer le CPU

**Dans AudioWorklet** :
```javascript
class MeasuredProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.processTimes = [];
    }
    
    process(inputs, outputs, parameters) {
        const startTime = performance.now();
        
        // Traitement DSP
        // ...
        
        const endTime = performance.now();
        const processTime = endTime - startTime;
        
        this.processTimes.push(processTime);
        
        if (this.processTimes.length >= 100) {
            const avgTime = this.processTimes.reduce((a, b) => a + b) / this.processTimes.length;
            this.port.postMessage({ type: "performance", avgProcessTime: avgTime });
            this.processTimes = [];
        }
        
        return true;
    }
}
```

### Optimisations

1. **Réutiliser les buffers** : Pas d'allocations dans le thread audio
2. **Précalculer** : Tables de lookup pour sin/cos/exp
3. **SIMD** : Utiliser WebAssembly pour les calculs vectoriels
4. **Oversampling sélectif** : Uniquement pour les non-linéarités critiques

---

## 📚 Références

- [PolyBLEP Tutorial](https://www.martin-finke.de/articles/audio-plugins-018-polyblep-oscillator/)
- [ZDF Filters Explained](http://www.u-he.com/downloads/UrsBlog/RePro_Filters_Unveiled.pdf)
- [The Art of VA Filter Design](https://www.native-instruments.com/fileadmin/ni_media/downloads/pdf/VAFilterDesign_2.1.0.pdf)
- [Designing Software Synthesizer Plug-Ins in C++](https://www.willpirkle.com/synthbook/)

---

**Fait avec ❤️ et 🤖 pour la synthèse audio**

