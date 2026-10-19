// Modello degli esercizi, salvataggio sul dispositivo, link e file.

export const TIPI = {
  coppie:   { nome: "Coppie",   spiega: "Due cose che vanno insieme: un animale e il suo verso, una parola e la sua immagine." },
  gruppi:   { nome: "Gruppi",   spiega: "Elementi da mettere nel gruppo giusto." },
  domande:  { nome: "Domande",  spiega: "Una domanda, la risposta giusta e qualche risposta sbagliata." },
  sequenza: { nome: "Sequenza", spiega: "Passi da mettere in ordine, dal primo all'ultimo." },
  frasi:    { nome: "Frasi",    spiega: "Frasi con le parole mancanti. Scrivi tra [quadre] le parole da completare." }
};

export const GIOCHI = {
  abbina:    { nome: "Abbina",             icona: "🔗", tipi: ["coppie"],                      consegna: "Porta ogni carta vicino alla sua coppia." },
  memory:    { nome: "Memory",             icona: "🃏", tipi: ["coppie"],                      consegna: "Gira due carte e trova le coppie." },
  raggruppa: { nome: "Raggruppa",          icona: "🧺", tipi: ["gruppi"],                      consegna: "Metti ogni carta nel gruppo giusto." },
  sequenza:  { nome: "Ordina la sequenza", icona: "🔢", tipi: ["sequenza"],                    consegna: "Metti le carte in ordine." },
  completa:  { nome: "Completa la frase",  icona: "✏️", tipi: ["frasi"],                       consegna: "Metti ogni parola al suo posto." },
  scelta:    { nome: "Scelta multipla",    icona: "✅", tipi: ["domande", "coppie", "gruppi"], consegna: "Scegli la risposta giusta." }
};
// L'ordine conta: il primo gioco adatto a un tipo è quello con cui l'esercizio si apre.

export const SCRITTURE = {
  maiuscolo: "STAMPATO MAIUSCOLO",
  minuscolo: "stampato minuscolo",
  corsivo: "corsivo"
};

export function giochiPer(tipo) {
  return Object.keys(GIOCHI).filter(g => GIOCHI[g].tipi.includes(tipo));
}

export function consegnaDi(es, gioco) {
  return gioco === es.gioco && es.consegna ? es.consegna : GIOCHI[gioco].consegna;
}

/* ---------- controllo di ciò che arriva da link, file e dispositivo ---------- */

function testo(v, max) {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function elemento(v) {
  const e = { t: testo(v && v.t, 200) };
  const p = Number(v && v.p);
  if (Number.isInteger(p) && p > 0 && p < 1e7) e.p = p;
  return e.t || e.p ? e : null;
}

function elementi(lista) {
  return Array.isArray(lista) ? lista.map(elemento).filter(Boolean) : [];
}

function errore(msg) { throw new Error(msg); }

export function valida(v) {
  if (!v || typeof v !== "object") errore("Il contenuto non è un esercizio.");
  const tipo = TIPI[v.tipo] ? v.tipo : errore("Il tipo di esercizio non è riconosciuto.");
  const es = {
    v: 1,
    titolo: testo(v.titolo, 120) || errore("Manca il titolo."),
    consegna: testo(v.consegna, 300),
    scrittura: SCRITTURE[v.scrittura] ? v.scrittura : "maiuscolo",
    tipo,
    gioco: giochiPer(tipo).includes(v.gioco) ? v.gioco : giochiPer(tipo)[0],
    dati: {}
  };
  if (typeof v.id === "string" && /^[\w-]{1,40}$/.test(v.id)) es.id = v.id;
  const d = v.dati || {};

  if (tipo === "coppie") {
    es.dati.coppie = (Array.isArray(d.coppie) ? d.coppie : [])
      .map(c => Array.isArray(c) ? [elemento(c[0]), elemento(c[1])] : [])
      .filter(c => c[0] && c[1]);
    if (es.dati.coppie.length < 2) errore("Servono almeno 2 coppie complete.");
  }
  if (tipo === "gruppi") {
    es.dati.gruppi = (Array.isArray(d.gruppi) ? d.gruppi : []).map(g => {
      const testa = elemento({ t: g && g.nome, p: g && g.p });
      return testa && { nome: testa.t, p: testa.p, elementi: elementi(g.elementi) };
    }).filter(g => g && g.nome && g.elementi.length);
    if (es.dati.gruppi.length < 2) errore("Servono almeno 2 gruppi con un nome e almeno un elemento.");
    es.dati.gruppi.forEach(g => { if (g.p === undefined) delete g.p; });
  }
  if (tipo === "domande") {
    es.dati.domande = (Array.isArray(d.domande) ? d.domande : []).map(q => ({
      d: elemento(q && q.d), giusta: elemento(q && q.giusta), sbagliate: elementi(q && q.sbagliate)
    })).filter(q => q.d && q.giusta && q.sbagliate.length);
    if (!es.dati.domande.length) errore("Serve almeno una domanda con la risposta giusta e una sbagliata.");
  }
  if (tipo === "sequenza") {
    es.dati.passi = elementi(d.passi);
    if (es.dati.passi.length < 2) errore("Servono almeno 2 passi.");
  }
  if (tipo === "frasi") {
    es.dati.frasi = (Array.isArray(d.frasi) ? d.frasi : []).map(f => testo(f, 300)).filter(f => /\[[^\]]+\]/.test(f));
    es.dati.extra = (Array.isArray(d.extra) ? d.extra : []).map(p => testo(p, 60)).filter(Boolean);
    if (!es.dati.frasi.length) errore("Serve almeno una frase con una parola tra [quadre].");
  }
  return es;
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
    return Array.isArray(lista) ? lista.flatMap(e => { try { return [valida(e)]; } catch (x) { return []; } }) : [];
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
  const pulito = valida(es);
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
