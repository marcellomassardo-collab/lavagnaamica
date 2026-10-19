// Lettura ad alta voce con la voce italiana del dispositivo.

const sintesi = window.speechSynthesis;
let voce = null;

function scegliVoce() {
  const italiane = sintesi.getVoices().filter(v => /^it(-|_|$)/i.test(v.lang));
  voce = italiane.find(v => v.localService) || italiane[0] || null;
}

if (sintesi) {
  scegliVoce();
  if (sintesi.addEventListener) sintesi.addEventListener("voiceschanged", scegliVoce);
}

export const voceDisponibile = !!sintesi;

export function parla(testo) {
  if (!sintesi || !testo) return;
  sintesi.cancel();
  const u = new SpeechSynthesisUtterance(testo);
  u.lang = "it-IT";
  if (voce) u.voice = voce;
  u.rate = 0.9;
  sintesi.speak(u);
}

// Legge e aspetta la fine della frase, per far andare la storia insieme alla voce.
export function parlaEAspetta(testo) {
  return new Promise(fine => {
    if (!sintesi || !testo) {
      fine();
      return;
    }
    sintesi.cancel();
    const u = new SpeechSynthesisUtterance(testo);
    u.lang = "it-IT";
    if (voce) u.voice = voce;
    u.rate = 0.9;
    u.onend = fine;
    u.onerror = fine;
    sintesi.speak(u);
    setTimeout(fine, 9000);
  });
}

export function zitto() {
  if (sintesi) sintesi.cancel();
}
