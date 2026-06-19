// ============================================================
// hooks/useAudio.js
// Synthesizes all sound effects via Web Audio API.
// No external .mp3 files required.
// ============================================================

import { useRef, useCallback } from 'react';

export function useAudio() {
  // AudioContext is created lazily on first user interaction
  const ctxRef = useRef(null);

  // Get or create AudioContext
  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (browser policy: needs user gesture first)
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  // ── WHEEL TICK ─────────────────────────────────────────────
  // Rapid mechanical click — plays each time a wheel slice
  // passes the top indicator pin during spin animation.
  const playWheelTick = useCallback(() => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) { /* silently ignore if audio context not ready */ }
  }, [getCtx]);

  // ── COUNTDOWN TICK ─────────────────────────────────────────
  // Heavy clock tick — used in final 10 seconds of challenge timer.
  const playCountdownTick = useCallback(() => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  }, [getCtx]);

  // ── SUCCESS CHIME ──────────────────────────────────────────
  // Bright ascending three-note chime for correct answer.
  const playSuccess = useCallback(() => {
    try {
      const ctx = getCtx();
      const notes = [523, 659, 784]; // C5, E5, G5 — major chord arpeggio
      notes.forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        const t = ctx.currentTime + i * 0.12;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(1.0, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.start(t);
        osc.stop(t + 0.5);
      });
    } catch (e) {}
  }, [getCtx]);

  // ── FAILURE BUZZER ─────────────────────────────────────────
  // Low-frequency buzzer + noise burst for wrong answer / timeout.
  const playFailure = useCallback(() => {
    try {
      const ctx = getCtx();

      // Low sine buzz
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(1.0, ctx.currentTime);      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);

      // White noise burst layer
      const bufferSize = ctx.sampleRate * 0.3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseGain.gain.setValueAtTime(0.6, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      noise.start(ctx.currentTime);
    } catch (e) {}
  }, [getCtx]);

  // ── USE CASE REVEAL FANFARE ────────────────────────────────
  // Short dramatic sting when a use case number is revealed.
  const playReveal = useCallback(() => {
    try {
      const ctx = getCtx();
      const freqs = [392, 494, 587, 784]; // G4, B4, D5, G5
      freqs.forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        const t = ctx.currentTime + i * 0.08;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.9, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.start(t);
        osc.stop(t + 0.4);
      });
    } catch (e) {}
  }, [getCtx]);

  return { playWheelTick, playCountdownTick, playSuccess, playFailure, playReveal };
}