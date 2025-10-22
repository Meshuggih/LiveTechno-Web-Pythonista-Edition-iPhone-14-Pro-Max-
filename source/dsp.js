/**
 * dsp.js — DSP AudioWorklet LiveTechno-Web v0.1
 */

class LiveTechnoProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        
        this.sampleRate = sampleRate;
        this.time = 0;
        
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
            filterState: {z1: 0, z2: 0},
            envelope: 0,
            currentNote: 0,
            targetNote: 0,
            slidePhase: 0,
            active: false,
            velocity: 0,
            cutoff: 0.5,
            resonance: 0.3
        };
        
        this.port.onmessage = e => this.handleMessage(e.data);
    }
    
    handleMessage(data) {
        const {type, machine, note, velocity} = data;
        
        if (type === 'noteOn') {
            if (machine === 'rd9') {
                const idx = this.getNoteIndex(note);
                if (idx >= 0) {
                    const v = this.rd9.voices[idx];
                    v.active = true;
                    v.phase = 0;
                    v.envelope = 1.0;
                    v.note = note;
                    v.velocity = velocity / 127;
                }
            } else if (machine === 'td3') {
                this.td3.targetNote = note;
                this.td3.velocity = velocity / 127;
                if (!this.td3.active) {
                    this.td3.currentNote = note;
                    this.td3.phase = 0;
                } else {
                    this.td3.slidePhase = 0;
                }
                this.td3.active = true;
                this.td3.envelope = 1.0;
            }
        } else if (type === 'noteOff') {
            if (machine === 'rd9') {
                const idx = this.getNoteIndex(note);
                if (idx >= 0) {
                    this.rd9.voices[idx].active = false;
                }
            } else if (machine === 'td3') {
                this.td3.active = false;
            }
        }
    }
    
    getNoteIndex(note) {
        const map = {36:0, 38:1, 43:2, 47:3, 50:4, 37:5, 39:6, 56:7, 49:8, 46:9, 42:10};
        return map[note] !== undefined ? map[note] : -1;
    }
    
    polyBlepSaw(phase, dt) {
        let v = 2.0 * phase - 1.0;
        if (dt > 0) {
            if (phase < dt) {
                const t = phase / dt;
                v -= t * t - 2.0 * t + 1.0;
            } else if (phase > 1.0 - dt) {
                const t = (phase - 1.0) / dt;
                v -= t * t + 2.0 * t + 1.0;
            }
        }
        return v;
    }
    
    zdfLowpass2(input, cutoff, resonance, state) {
        const clamp = Math.max(20, Math.min(cutoff, this.sampleRate * 0.49));
        const g = Math.tan(Math.PI * clamp / this.sampleRate);
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
    
    processEnvelope(env, attack, decay, sustain, release, active) {
        const aRate = attack > 0 ? 1.0 / (attack * this.sampleRate) : 1.0;
        const dRate = decay > 0 ? 1.0 / (decay * this.sampleRate) : 1.0;
        const rRate = release > 0 ? 1.0 / (release * this.sampleRate) : 1.0;
        
        if (active) {
            if (env < 1.0) {
                env += aRate;
                if (env > 1.0) env = 1.0;
            } else {
                env -= dRate;
                if (env < sustain) env = sustain;
            }
        } else {
            env -= rRate;
            if (env < 0.0) env = 0.0;
        }
        
        return env;
    }
    
    processRD9Kick(v) {
        if (!v.active && v.envelope <= 0.0) return 0.0;
        
        const pitchEnv = v.envelope * 40.0 + 40.0;
        const freq = pitchEnv;
        
        let sample = Math.sin(2.0 * Math.PI * v.phase);
        sample = Math.tanh(sample * 2.0);
        
        v.envelope = this.processEnvelope(v.envelope, 0.001, 0.2, 0.0, 0.0, v.active);
        sample *= v.envelope * v.velocity;
        
        v.phase += freq / this.sampleRate;
        if (v.phase >= 1.0) v.phase -= 1.0;
        
        return sample * 0.8;
    }
    
    processRD9Snare(v) {
        if (!v.active && v.envelope <= 0.0) return 0.0;
        
        const noise = Math.random() * 2.0 - 1.0;
        const tone = Math.sin(2.0 * Math.PI * v.phase * 200.0);
        
        let sample = noise * 0.7 + tone * 0.3;
        
        v.envelope = this.processEnvelope(v.envelope, 0.001, 0.15, 0.0, 0.0, v.active);
        sample *= v.envelope * v.velocity;
        
        v.phase += 1.0 / this.sampleRate;
        if (v.phase >= 1.0) v.phase -= 1.0;
        
        return sample * 0.6;
    }
    
    processRD9HiHat(v, isOpen) {
        if (!v.active && v.envelope <= 0.0) return 0.0;
        
        const noise = Math.random() * 2.0 - 1.0;
        let sample = noise;
        
        const decay = isOpen ? 0.3 : 0.05;
        v.envelope = this.processEnvelope(v.envelope, 0.001, decay, 0.0, 0.0, v.active);
        sample *= v.envelope * v.velocity;
        
        return sample * 0.4;
    }
    
    processRD9Generic(v) {
        if (!v.active && v.envelope <= 0.0) return 0.0;
        
        const tone = Math.sin(2.0 * Math.PI * v.phase * 200.0);
        const noise = (Math.random() * 2.0 - 1.0) * 0.3;
        
        let sample = tone + noise;
        
        v.envelope = this.processEnvelope(v.envelope, 0.001, 0.1, 0.0, 0.0, v.active);
        sample *= v.envelope * v.velocity;
        
        v.phase += 1.0 / this.sampleRate;
        if (v.phase >= 1.0) v.phase -= 1.0;
        
        return sample * 0.5;
    }
    
    processRD9() {
        let out = 0.0;
        out += this.processRD9Kick(this.rd9.voices[0]);
        out += this.processRD9Snare(this.rd9.voices[1]);
        out += this.processRD9HiHat(this.rd9.voices[9], true);
        out += this.processRD9HiHat(this.rd9.voices[10], false);
        for (let i = 2; i < 9; i++) {
            out += this.processRD9Generic(this.rd9.voices[i]);
        }
        return out;
    }
    
    processTD3() {
        if (!this.td3.active && this.td3.envelope <= 0.0) return 0.0;
        
        if (this.td3.slidePhase < 1.0) {
            this.td3.slidePhase += 0.001;
            const t = this.td3.slidePhase;
            this.td3.currentNote = this.td3.currentNote * (1.0 - t) + this.td3.targetNote * t;
        } else {
            this.td3.currentNote = this.td3.targetNote;
        }
        
        const freq = 440.0 * Math.pow(2.0, (this.td3.currentNote - 69) / 12.0);
        const dt = freq / this.sampleRate;
        
        let sample = this.polyBlepSaw(this.td3.phase, dt);
        
        this.td3.phase += dt;
        if (this.td3.phase >= 1.0) this.td3.phase -= 1.0;
        
        this.td3.envelope = this.processEnvelope(this.td3.envelope, 0.001, 0.25, 0.0, 0.01, this.td3.active);
        
        const cutoffFreq = this.td3.cutoff * 10000.0 + this.td3.envelope * 5000.0;
        const cutoffClamped = Math.max(20.0, Math.min(20000.0, cutoffFreq));
        
        sample = this.zdfLowpass2(sample, cutoffClamped, this.td3.resonance, this.td3.filterState);
        sample *= this.td3.envelope * this.td3.velocity;
        
        return sample * 0.7;
    }
    
    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const channel = output[0];
        
        for (let i = 0; i < channel.length; i++) {
            let sample = 0.0;
            sample += this.processRD9();
            sample += this.processTD3();
            sample = Math.tanh(sample);
            channel[i] = sample;
            this.time++;
        }
        
        return true;
    }
}

registerProcessor('livetechno-processor', LiveTechnoProcessor);

