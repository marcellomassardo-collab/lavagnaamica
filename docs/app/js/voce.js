// Lettura ad alta voce con le voci del dispositivo. Se nessuno ne ha scelta una, si prende la più
// naturale: quelle «in rete» e quelle neurali suonano molto meglio delle voci vecchie del sistema.

import { impostazioni } from "./impostazioni.js";

const sintesi = window.speechSynthesis;
let vociItaliane = [];
let vociInglesi = [];
let turno = 0;
// La lingua di quello che si legge: negli esercizi di inglese le carte le legge una voce inglese.
let linguaGioco = "it";

function aggiornaVoci() {
  vociItaliane = sintesi.getVoices().filter(v => /^it(-|_|$)/i.test(v.lang));
  vociInglesi = sintesi.getVoices().filter(v => /^en(-|_|$)/i.test(v.lang));
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

// A scuola si impara l'inglese britannico: a parità di qualità, prima quello.
const qualitaInglese = v => (/natural|neural|premium|enhanced/i.test(v.name) ? 4 : 0) + (v.localService ? 0 : 3) + (/^en[-_]GB$/i.test(v.lang) ? 2 : 0);

export function vociInglesiDelDispositivo() {
  if (sintesi && !vociInglesi.length) aggiornaVoci();
  return vociInglesi.slice().sort((a, b) => qualitaInglese(b) - qualitaInglese(a));
}

export const impostaLingua = l => { linguaGioco = l === "en" ? "en" : "it"; };
export const linguaAttuale = () => linguaGioco;

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
    .replace(/\ba\.\s?c\./gi, "avanti Cristo")
    .replace(/\bd\.\s?c\./gi, "dopo Cristo")
    .replace(/\b1°/g, "primo")
    .replace(/\b2°/g, "secondo")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("it");
}

// In inglese il testo resta com'è (le parole «più», «fa», «diviso» sono italiane): si tolgono solo simboli e buchi.
const perLaVoceInglese = t => String(t).replace(/[🔊🎉]/gu, "").replace(/_{2,}|…/g, ", ").replace(/\s+/g, " ").trim();

// Le parole come le conta il lettore di brani: l'apostrofo tiene unite le due parti (l'albero).
export const PAROLA = /[\p{L}\d]+(?:['’][\p{L}\d]+)*/gu;

function leggi(testo, lingua, alConfine) {
  const mio = ++turno;
  if (sintesi) sintesi.cancel();
  const inglese = (lingua || linguaGioco) === "en";
  return new Promise(fine => {
    const t = inglese ? perLaVoceInglese(testo || "") : perLaVoce(testo || "");
    if (!sintesi || !t) return fine();
    const voci = inglese ? vociInglesiDelDispositivo() : vociDelDispositivo();
    // meglio il silenzio di una voce italiana che insegna la pronuncia sbagliata
    if (inglese && !voci.length) return fine();
    const u = new SpeechSynthesisUtterance(t);
    const scelta = voci.find(v => v.name === (inglese ? impostazioni.voceInglese : impostazioni.voceScelta)) || voci[0];
    u.lang = inglese ? "en-GB" : "it-IT";
    if (scelta) u.voice = scelta;
    u.rate = impostazioni.velocita;
    u.onend = u.onerror = fine;
    // a ogni parola detta, il numero della parola (non tutte le voci lo dicono: chi non lo dice, legge e basta)
    if (alConfine) {
      const inizi = [...t.matchAll(PAROLA)].map(m => m.index);
      u.onboundary = e => {
        if (e.name && e.name !== "word") return;
        let k = 0;
        while (k + 1 < inizi.length && inizi[k + 1] <= e.charIndex) k++;
        alConfine(k);
      };
    }
    if (mio === turno) sintesi.speak(u); else fine();
  });
}

export function parla(testo, lingua) {
  leggi(testo, lingua);
}

// Legge e aspetta la fine della frase, per far andare la storia insieme alla voce.
export function parlaEAspetta(testo) {
  return Promise.race([leggi(testo), new Promise(r => setTimeout(r, 15000))]);
}

// Legge una frase e dice quale parola sta dicendo; aspetta la fine (con un tetto, se la voce non avvisa).
export function leggiRiga(testo, alConfine) {
  const tetto = 3000 + String(testo).length * 170 / (impostazioni.velocita || 1);
  return Promise.race([leggi(testo, undefined, alConfine), new Promise(r => setTimeout(r, tetto))]);
}

export function zitto() {
  turno++;
  if (sintesi) sintesi.cancel();
}
