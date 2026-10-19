// Lettura ad alta voce con le voci del dispositivo. Se nessuno ne ha scelta una, si prende la più
// naturale: quelle «in rete» e quelle neurali suonano molto meglio delle voci vecchie del sistema.

import { impostazioni } from "./impostazioni.js";

const sintesi = window.speechSynthesis;
let vociItaliane = [];
let turno = 0;

function aggiornaVoci() {
  vociItaliane = sintesi.getVoices().filter(v => /^it(-|_|$)/i.test(v.lang));
}
if (sintesi) {
  aggiornaVoci();
  if (sintesi.addEventListener) sintesi.addEventListener("voiceschanged", aggiornaVoci);
}

export const voceDisponibile = !!sintesi;

const qualita = v => (/natural|neural|premium|enhanced/i.test(v.name) ? 4 : 0) + (v.localService ? 0 : 3) + (/^it[-_]IT$/i.test(v.lang) ? 1 : 0);

export function vociDelDispositivo() {
  if (sintesi && !vociItaliane.length) aggiornaVoci();   // alcuni browser le caricano dopo, senza avvisare
  return vociItaliane.slice().sort((a, b) => qualita(b) - qualita(a));
}

export function quandoCambianoLeVoci(fn) {
  if (sintesi && sintesi.addEventListener) sintesi.addEventListener("voiceschanged", fn);
}

// Il testo come va detto: in minuscolo (alcune voci leggono il maiuscolo a scatti) e con i simboli in parole.
export function perLaVoce(t) {
  return String(t)
    .replace(/[🔊🎉]/gu, "")
    .replace(/^\s*[<>=]\s+(?=\p{L})/u, "")
    .replace(/(\d)\s*:\s*(\d)/g, "$1 diviso $2")
    .replace(/(\d)\s*[×x]\s*(\d)/g, "$1 per $2")
    .replace(/(\d)\s*[−-]\s*(\d)/g, "$1 meno $2")
    .replace(/(\d+)\s*da\b/gi, (m, n) => n + (n === "1" ? " decina" : " decine"))
    .replace(/(\d+)\s*u\b/gi, "$1 unità")
    .replace(/=\s*\?/g, " fa?")
    .replace(/=/g, " fa ")
    .replace(/\+/g, " più ")
    .replace(/</g, " minore di ")
    .replace(/>/g, " maggiore di ")
    .replace(/…/g, ", ")
    .replace(/\s\/\s/g, ", ")
    .replace(/\b1°/g, "primo")
    .replace(/\b2°/g, "secondo")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("it");
}

function leggi(testo) {
  const mio = ++turno;
  if (sintesi) sintesi.cancel();
  return new Promise(fine => {
    const t = perLaVoce(testo || "");
    if (!sintesi || !t) return fine();
    const u = new SpeechSynthesisUtterance(t);
    const voci = vociDelDispositivo();
    const scelta = voci.find(v => v.name === impostazioni.voceScelta) || voci[0];
    u.lang = "it-IT";
    if (scelta) u.voice = scelta;
    u.rate = impostazioni.velocita;
    u.onend = u.onerror = fine;
    if (mio === turno) sintesi.speak(u); else fine();
  });
}

export function parla(testo) {
  leggi(testo);
}

// Legge e aspetta la fine della frase, per far andare la storia insieme alla voce.
export function parlaEAspetta(testo) {
  return Promise.race([leggi(testo), new Promise(r => setTimeout(r, 15000))]);
}

export function zitto() {
  turno++;
  if (sintesi) sintesi.cancel();
}
