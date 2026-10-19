// Il modello degli esercizi, uguale per l'app e per il server del catalogo:
// tipi di contenuto, giochi, scritture, motivi di segnalazione e controllo dei dati.

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

// Motivi del menu «Segnala». «nascondi»: subito, dopo le segnalazioni (1 insegnante o 3 anonime), oppure mai
// (in quel caso la segnalazione arriva solo all'autore, perché corregga).
export const MOTIVI = {
  "inappropriato":  { nome: "Contenuto non adatto ai bambini", nascondi: "conta" },
  "dati-personali": { nome: "Contiene nomi o foto di alunni", nascondi: "subito" },
  "diritto-autore": { nome: "Copia materiale protetto (libri, immagini, testi)", nascondi: "conta" },
  "errore":         { nome: "Una risposta è sbagliata", nascondi: "mai" },
  "non-funziona":   { nome: "Un'immagine o una parte non funziona", nascondi: "mai" }
};
