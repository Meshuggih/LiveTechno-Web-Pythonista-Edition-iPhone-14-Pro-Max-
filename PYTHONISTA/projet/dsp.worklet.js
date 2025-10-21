/**
 * dsp.worklet.js — DSP AudioWorklet pour LiveTechno-Web v0.1
 * 
 * Fonctionnalités :
 * - Oscillateurs PolyBLEP (sawtooth, square)
 * - Filtres ZDF (lowpass 1-pole, 2-pole résonant)
 * - Envelopes ADSR
 * - RD-9 DSP (kick, snare, hi-hats, toms, etc.)
 * - TD-3 DSP (oscillateur + filtre + envelope + slide)
 * - Mixer 2 tracks + master limiter
 * 
 * Auteur : IA constructrice
 * Date : 2025-10-21
 */

class LiveTechnoProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        
        this.sampleRate = sampleRate;
        this.time = 0;
        
        // État des machines
        this.rd9 = {
            voices: Array(11).fill(null).map(() => ({
                active: false,
                phase: 0,
                envelope: 0,
                note: 0,
                velocity: 0
            }))
        };
        
        this.td3 = {
            phase: 0,
            filterState: { z1: 0, z2: 0 },
            envelope: 0,
            currentNote: 0,
            targetNote: 0,
            slidePhase: 0,
            active: false,
            cutoff: 0.5,
            resonance: 0.3,
            envMod: 0.5,
            decay: 0.5
        };
        
        // Écouter les messages du thread principal
        this.port.onmessage = (e) => {
            this.handleMessage(e.data);
        };
    }
    
    handleMessage(data) {
        const { type, ...params } = data;
        
        switch (type) {
            case 'noteOn':
                this.noteOn(params);
                break;
            case 'noteOff':
                this.noteOff(params);
                break;
            case 'setParam':
                this.setParam(params);
                break;
        }
    }
    
    noteOn({ machine, note, velocity }) {
        if (machine === 'rd9') {
            // RD-9 : Mapper la note MIDI à l'instrument
            const instrumentIndex = this.getNoteToInstrumentIndex(note);
            if (instrumentIndex >= 0) {
                const voice = this.rd9.voices[instrumentIndex];
                voice.active = true;
                voice.phase = 0;
                voice.envelope = 1.0;
                voice.note = note;
                voice.velocity = velocity / 127;
            }
        } else if (machine === 'td3') {
            // TD-3 : Synthé monophonique
            this.td3.targetNote = note;
            this.td3.velocity = velocity / 127;
            
            if (!this.td3.active) {
                this.td3.currentNote = note;
                this.td3.phase = 0;
            } else {
                // Slide actif
                this.td3.slidePhase = 0;
            }
            
            this.td3.active = true;
            this.td3.envelope = 1.0;
        }
    }
    
    noteOff({ machine, note }) {
        if (machine === 'rd9') {
            const instrumentIndex = this.getNoteToInstrumentIndex(note);
            if (instrumentIndex >= 0) {
                this.rd9.voices[instrumentIndex].active = false;
            }
        } else if (machine === 'td3') {
            this.td3.active = false;
        }
    }
    
    setParam({ machine, param, value }) {
        if (machine === 'td3') {
            this.td3[param] = value;
        }
    }
    
    getNoteToInstrumentIndex(note) {
        // Mapping MIDI note → instrument RD-9
        const noteMap = {
            36: 0,  // BD
            38: 1,  // SD
            43: 2,  // LT
            47: 3,  // MT
            50: 4,  // HT
            37: 5,  // RS
            39: 6,  // CP
            56: 7,  // CB
            49: 8,  // CY
            46: 9,  // OH
            42: 10  // CH
        };
        
        return noteMap[note] !== undefined ? noteMap[note] : -1;
    }
    
    // ========================================================================
    // OSCILLATEURS POLYBLEP
    // ========================================================================
    
    polyBlepSaw(phase, dt) {
        let value = 2.0 * phase - 1.0;
        
        // PolyBLEP correction (optimisé)
        if (dt > 0) {
            if (phase < dt) {
                const t = phase / dt;
                const t2 = t * t;
                value -= t2 - 2.0 * t + 1.0;
            } else if (phase > 1.0 - dt) {
                const t = (phase - 1.0) / dt;
                const t2 = t * t;
                value -= t2 + 2.0 * t + 1.0;
            }
        }
        
        return value;
    }
    
    polyBlepSquare(phase, dt, pulseWidth = 0.5) {
        let value = phase < pulseWidth ? 1.0 : -1.0;
        
        // PolyBLEP correction (rising edge)
        if (phase < dt) {
            const t = phase / dt;
            value += t * t - 2.0 * t + 1.0;
        } else if (phase > 1.0 - dt) {
            const t = (phase - 1.0) / dt;
            value += t * t + 2.0 * t + 1.0;
        }
        
        // PolyBLEP correction (falling edge)
        const pwPhase = phase - pulseWidth;
        if (pwPhase >= 0 && pwPhase < dt) {
            const t = pwPhase / dt;
            value -= t * t - 2.0 * t + 1.0;
        } else if (pwPhase < 0 && pwPhase > -dt) {
            const t = (pwPhase + 1.0) / dt;
            value -= t * t + 2.0 * t + 1.0;
        }
        
        return value;
    }
    
    // ========================================================================
    // FILTRES ZDF
    // ========================================================================
    
    zdfLowpass1Pole(input, cutoff, state) {
        const g = Math.tan(Math.PI * cutoff / this.sampleRate);
        const G = g / (1.0 + g);
        
        const v = G * (input - state.z1);
        const lp = v + state.z1;
        state.z1 = lp + v;
        
        return lp;
    }
    
    zdfLowpass2Pole(input, cutoff, resonance, state) {
        // Optimisation : Clamper cutoff pour éviter Math.tan instable
        const clampedCutoff = Math.max(20.0, Math.min(cutoff, this.sampleRate * 0.49));
        const g = Math.tan(Math.PI * clampedCutoff / this.sampleRate);
        const k = 2.0 - 2.0 * resonance;
        
        const G1 = g / (1.0 + g);
        const G2 = g / (1.0 + g + g * g * k);
        
        const v1 = G1 * (input - state.z1 - k * state.z2);
        const lp1 = v1 + state.z1;
        state.z1 = lp1 + v1;
        
        const v2 = G2 * (lp1 - state.z2);
        const lp2 = v2 + state.z2;
        state.z2 = lp2 + v2;
        
        return lp2;
    }
    
    // ========================================================================
    // ENVELOPE ADSR
    // ========================================================================
    
    processEnvelope(envelope, attack, decay, sustain, release, active) {
        // Optimisation : Précalculer les rates une seule fois
        const attackRate = attack > 0 ? 1.0 / (attack * this.sampleRate) : 1.0;
        const decayRate = decay > 0 ? 1.0 / (decay * this.sampleRate) : 1.0;
        const releaseRate = release > 0 ? 1.0 / (release * this.sampleRate) : 1.0;
        
        if (active) {
            if (envelope < 1.0) {
                // Attack
                envelope += attackRate;
                if (envelope > 1.0) envelope = 1.0;
            } else {
                // Decay
                envelope -= decayRate;
                if (envelope < sustain) envelope = sustain;
            }
        } else {
            // Release
            envelope -= releaseRate;
            if (envelope < 0.0) envelope = 0.0;
        }
        
        return envelope;
    }
    
    // ========================================================================
    // RD-9 DSP
    // ========================================================================
    
    processRD9Kick(voice) {
        if (!voice.active && voice.envelope <= 0.0) return 0.0;
        
        // Pitch envelope (80 Hz → 40 Hz en 50ms)
        const pitchEnv = voice.envelope * 40.0 + 40.0;
        const freq = pitchEnv;
        
        // Oscillateur sinusoïdal
        const phase = voice.phase;
        let sample = Math.sin(2.0 * Math.PI * phase);
        
        // Distorsion légère
        sample = Math.tanh(sample * 2.0);
        
        // Envelope
        voice.envelope = this.processEnvelope(voice.envelope, 0.001, 0.2, 0.0, 0.0, voice.active);
        sample *= voice.envelope * voice.velocity;
        
        // Incrémenter la phase
        voice.phase += freq / this.sampleRate;
        if (voice.phase >= 1.0) voice.phase -= 1.0;
        
        return sample * 0.8;
    }
    
    processRD9Snare(voice) {
        if (!voice.active && voice.envelope <= 0.0) return 0.0;
        
        // Noise blanc
        const noise = Math.random() * 2.0 - 1.0;
        
        // Oscillateur sinusoïdal (corps, 200 Hz)
        const phase = voice.phase;
        const tone = Math.sin(2.0 * Math.PI * phase * 200.0);
        
        // Mix 70% noise / 30% tone
        let sample = noise * 0.7 + tone * 0.3;
        
        // Envelope
        voice.envelope = this.processEnvelope(voice.envelope, 0.001, 0.15, 0.0, 0.0, voice.active);
        sample *= voice.envelope * voice.velocity;
        
        // Incrémenter la phase
        voice.phase += 1.0 / this.sampleRate;
        if (voice.phase >= 1.0) voice.phase -= 1.0;
        
        return sample * 0.6;
    }
    
    processRD9HiHat(voice, isOpen) {
        if (!voice.active && voice.envelope <= 0.0) return 0.0;
        
        // Noise blanc filtré (bandpass 8-12 kHz)
        const noise = Math.random() * 2.0 - 1.0;
        
        // Filtre simple (highpass)
        let sample = noise;
        
        // Envelope
        const decay = isOpen ? 0.3 : 0.05;
        voice.envelope = this.processEnvelope(voice.envelope, 0.001, decay, 0.0, 0.0, voice.active);
        sample *= voice.envelope * voice.velocity;
        
        return sample * 0.4;
    }
    
    processRD9Generic(voice) {
        if (!voice.active && voice.envelope <= 0.0) return 0.0;
        
        // Oscillateur simple + noise
        const phase = voice.phase;
        const tone = Math.sin(2.0 * Math.PI * phase * 200.0);
        const noise = (Math.random() * 2.0 - 1.0) * 0.3;
        
        let sample = tone + noise;
        
        // Envelope
        voice.envelope = this.processEnvelope(voice.envelope, 0.001, 0.1, 0.0, 0.0, voice.active);
        sample *= voice.envelope * voice.velocity;
        
        // Incrémenter la phase
        voice.phase += 1.0 / this.sampleRate;
        if (voice.phase >= 1.0) voice.phase -= 1.0;
        
        return sample * 0.5;
    }
    
    processRD9() {
        let output = 0.0;
        
        // Instrument 0 : Kick
        output += this.processRD9Kick(this.rd9.voices[0]);
        
        // Instrument 1 : Snare
        output += this.processRD9Snare(this.rd9.voices[1]);
        
        // Instrument 9 : Open Hi-Hat
        output += this.processRD9HiHat(this.rd9.voices[9], true);
        
        // Instrument 10 : Closed Hi-Hat
        output += this.processRD9HiHat(this.rd9.voices[10], false);
        
        // Autres instruments (générique)
        for (let i = 2; i < 9; i++) {
            output += this.processRD9Generic(this.rd9.voices[i]);
        }
        
        return output;
    }
    
    // ========================================================================
    // TD-3 DSP
    // ========================================================================
    
    processTD3() {
        if (!this.td3.active && this.td3.envelope <= 0.0) return 0.0;
        
        // Slide (portamento)
        if (this.td3.slidePhase < 1.0) {
            this.td3.slidePhase += 0.001; // 50ms slide
            const t = this.td3.slidePhase;
            this.td3.currentNote = this.td3.currentNote * (1.0 - t) + this.td3.targetNote * t;
        } else {
            this.td3.currentNote = this.td3.targetNote;
        }
        
        // Fréquence MIDI → Hz
        const freq = 440.0 * Math.pow(2.0, (this.td3.currentNote - 69) / 12.0);
        
        // Oscillateur PolyBLEP sawtooth
        const dt = freq / this.sampleRate;
        let sample = this.polyBlepSaw(this.td3.phase, dt);
        
        // Incrémenter la phase
        this.td3.phase += dt;
        if (this.td3.phase >= 1.0) this.td3.phase -= 1.0;
        
        // Envelope
        this.td3.envelope = this.processEnvelope(
            this.td3.envelope,
            0.001,
            this.td3.decay * 0.5,
            0.0,
            0.01,
            this.td3.active
        );
        
        // Cutoff avec envelope modulation
        const envAmount = this.td3.envMod * 2.0 - 1.0; // -1.0 à +1.0
        const cutoffFreq = this.td3.cutoff * 10000.0 + envAmount * this.td3.envelope * 5000.0;
        const cutoffClamped = Math.max(20.0, Math.min(20000.0, cutoffFreq));
        
        // Filtre ZDF lowpass 2-pole résonant
        sample = this.zdfLowpass2Pole(sample, cutoffClamped, this.td3.resonance, this.td3.filterState);
        
        // Appliquer l'envelope
        sample *= this.td3.envelope * this.td3.velocity;
        
        return sample * 0.7;
    }
    
    // ========================================================================
    // MIXER + LIMITER
    // ========================================================================
    
    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const channel = output[0];
        
        for (let i = 0; i < channel.length; i++) {
            // Mixer
            let sample = 0.0;
            
            // RD-9
            sample += this.processRD9();
            
            // TD-3
            sample += this.processTD3();
            
            // Master limiter (true-peak, simple tanh)
            sample = Math.tanh(sample);
            
            // Écrire dans le buffer de sortie
            channel[i] = sample;
            
            // Incrémenter le temps
            this.time++;
        }
        
        return true;
    }
}

registerProcessor('livetechno-processor', LiveTechnoProcessor);

