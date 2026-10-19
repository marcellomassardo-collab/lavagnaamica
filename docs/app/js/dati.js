// Salvataggio sul dispositivo, esempi, link e file.

import { valida } from "./modello.js";

function errore(msg) { throw new Error(msg); }

// Un esercizio del dispositivo ricorda, se è stato pubblicato, il suo numero nel catalogo comune.
function conCatalogo(pulito, origine) {
  if (typeof origine.catalogo === "string" && /^[\w-]{1,40}$/.test(origine.catalogo)) pulito.catalogo = origine.catalogo;
  return pulito;
}

/* ---------- esercizi di esempio ---------- */

let esempi = null;
export async function caricaEsempi() {
  if (!esempi) {
    const r = await fetch("esempi/esempi.json");
    esempi = (await r.json()).map(valida);
  }
  return esempi;
}

/* ---------- i miei esercizi, salvati solo su questo dispositivo ---------- */

const CHIAVE = "la.esercizi";

export function elencoMiei() {
  try {
    const lista = JSON.parse(localStorage.getItem(CHIAVE));
    return Array.isArray(lista) ? lista.flatMap(e => { try { return [conCatalogo(valida(e), e)]; } catch (x) { return []; } }) : [];
  } catch (e) {
    return [];
  }
}

function scriviMiei(lista) {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(lista));
  } catch (e) {
    errore("Non riesco a salvare su questo dispositivo: lo spazio potrebbe essere pieno.");
  }
}

export function trovaMio(id) {
  return elencoMiei().find(e => e.id === id) || null;
}

export function salvaMio(es) {
  const pulito = conCatalogo(valida(es), es);
  pulito.id = es.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const lista = elencoMiei().filter(e => e.id !== pulito.id);
  lista.unshift(pulito);
  scriviMiei(lista);
  return pulito;
}

export function eliminaMio(id) {
  scriviMiei(elencoMiei().filter(e => e.id !== id));
}

/* ---------- link: l'esercizio viaggia dentro l'indirizzo, dopo il # ---------- */

function inBase64(bytes) {
  let s = "";
  bytes.forEach(b => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function daBase64(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

async function trasforma(bytes, flusso) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(flusso)).arrayBuffer());
}

export async function inLink(es) {
  const copia = Object.assign({}, es);
  delete copia.id;
  delete copia.catalogo;
  const bytes = new TextEncoder().encode(JSON.stringify(copia));
  const codice = window.CompressionStream
    ? "z" + inBase64(await trasforma(bytes, new CompressionStream("deflate-raw")))
    : "j" + inBase64(bytes);
  return location.origin + location.pathname + "#/link/" + codice + "/gioca";
}

export async function daLink(codice) {
  let bytes;
  try { bytes = daBase64(codice.slice(1)); } catch (e) { errore("Il link è incompleto o rovinato."); }
  if (codice[0] === "z") {
    if (!window.DecompressionStream) errore("Questo browser è troppo vecchio per aprire il link: prova ad aggiornarlo.");
    try { bytes = await trasforma(bytes, new DecompressionStream("deflate-raw")); } catch (e) { errore("Il link è incompleto o rovinato."); }
  } else if (codice[0] !== "j") {
    errore("Il link è incompleto o rovinato.");
  }
  let dati;
  try { dati = JSON.parse(new TextDecoder().decode(bytes)); } catch (e) { errore("Il link è incompleto o rovinato."); }
  return valida(dati);
}

/* ---------- file da scaricare e da aprire ---------- */

export function nomeFile(es) {
  const base = es.titolo.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "esercizio";
  return base + ".lavagna.json";
}

export function scaricaFile(es) {
  const copia = Object.assign({}, es);
  delete copia.id;
  delete copia.catalogo;
  const url = URL.createObjectURL(new Blob([JSON.stringify(copia, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeFile(es);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function apriFile(file) {
  let dati;
  try { dati = JSON.parse(await file.text()); } catch (e) { errore("Questo file non è un esercizio di Lavagna Amica."); }
  return valida(dati);
}
