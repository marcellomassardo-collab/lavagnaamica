// Suoni brevi e gentili: niente suoni di sconfitta.

import { impostazioni } from "./impostazioni.js";

let audio = null;

function note(frequenze, passo, volume, durata) {
  if (!impostazioni.suoni) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const t = audio.currentTime;
    frequenze.forEach((f, k) => {
      const o = audio.createOscillator();
      const g = audio.createGain();
      const inizio = t + k * passo;
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, inizio);
      g.gain.exponentialRampToValueAtTime(volume, inizio + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, inizio + durata);
      o.connect(g);
      g.connect(audio.destination);
      o.start(inizio);
      o.stop(inizio + durata + 0.05);
    });
  } catch (e) {}
}

export const suonoGiusto = () => note([660, 880], 0.12, 0.16, 0.35);
export const suonoRiprova = () => note([330], 0, 0.06, 0.18);
export const suonoFesta = () => note([523, 659, 784, 1047], 0.13, 0.15, 0.45);
