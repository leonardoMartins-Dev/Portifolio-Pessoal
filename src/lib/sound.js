import { useOS } from './os-store.js';

/**
 * Sons discretos sintetizados com Web Audio (sem arquivos). Desligados por
 * padrão; ligam em Ajustes.
 */
let context = null;

const TONES = {
  open: [523.25, 783.99],
  close: [659.25, 440],
  click: [880],
};

export function playSound(name) {
  if (!useOS.getState().sound) return;
  try {
    context ??= new AudioContext();
    const now = context.currentTime;
    TONES[name]?.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + index * 0.06;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.05, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.14);
    });
  } catch {
    // Sem Web Audio: segue em silêncio.
  }
}
