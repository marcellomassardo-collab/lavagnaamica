// Suoni sintetizzati al momento (nessun file da scaricare): un «ding» per la risposta giusta,
// un «bup» morbido per riprovare (mai un suono di sconfitta) e una fanfara alla fine.

import { impostazioni } from "./impostazioni.js";

let audio = null;

function contesto() {
  audio = audio || new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === "suspended") audio.resume();
  return audio;
}

// Una nota: frequenza, quando parte, quanto dura, forma d'onda, volume e, se serve, dove scivola.
function nota(c, f, inizio, durata, forma, volume, fineF) {
  const o = c.createOscillator();
  const g = c.createGain();
  const t = c.currentTime + inizio;
  o.type = forma;
  o.frequency.setValueAtTime(f, t);
  if (fineF) o.frequency.exponentialRampToValueAtTime(fineF, t + durata);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volume, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + durata);
  o.connect(g);
  g.connect(c.destination);
  o.start(t);
  o.stop(t + durata + 0.05);
}

function suona(fn) {
  if (!impostazioni.suoni) return;
  try { fn(contesto()); } catch (e) {}
}

export const suonoGiusto = () => suona(c => {
  nota(c, 1046.5, 0, 0.18, "triangle", 0.28);
  nota(c, 1568, 0.09, 0.32, "triangle", 0.24);
  nota(c, 3136, 0.09, 0.2, "sine", 0.05);
});

export const suonoRiprova = () => suona(c => {
  nota(c, 330, 0, 0.22, "sine", 0.16, 247);
});

// Fanfara: su per l'arpeggio, poi l'accordo finale che resta, con qualche scintilla in alto.
export const suonoFesta = () => suona(c => {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, k) => nota(c, f, k * 0.13, 0.22, "triangle", 0.26));
  [523.25, 659.25, 783.99, 1046.5].forEach(f => nota(c, f, 0.58, 1.3, "triangle", 0.16));
  [261.63].forEach(f => nota(c, f, 0.58, 1.3, "sine", 0.18));
  [2093, 2637, 3136, 2637, 3136].forEach((f, k) => nota(c, f, 0.62 + k * 0.09, 0.14, "sine", 0.05));
});
