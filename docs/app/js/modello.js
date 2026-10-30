// Il modello degli esercizi, uguale per l'app e per il server del catalogo:
// tipi di contenuto, giochi, scritture, motivi di segnalazione e controllo dei dati.

export const TIPI = {
  coppie:   { nome: "Coppie",   spiega: "Due cose che vanno insieme: un animale e il suo verso, una parola e la sua immagine." },
  gruppi:   { nome: "Gruppi",   spiega: "Elementi da mettere nel gruppo giusto." },
  domande:  { nome: "Domande",  spiega: "Una domanda, la risposta giusta e qualche risposta sbagliata." },
  sequenza: { nome: "Sequenza", spiega: "Passi da mettere in ordine, dal primo all'ultimo." },
  frasi:    { nome: "Frasi",    spiega: "Frasi con le parole mancanti. Scrivi tra [quadre] le parole da completare." },
  matematica: { nome: "Matematica", spiega: "Numeri, operazioni e problemi con gli oggetti da vedere, muovere e contare." },
  lettura: { nome: "Lettura", spiega: "Dalle lettere alle sillabe, alle parole, alle frasi: per imparare a leggere un passo alla volta." },
  brano: { nome: "Brano da leggere", spiega: "Un racconto, una poesia o una favola da leggere, e poi le domande per capirlo." }
};

export const GIOCHI = {
  abbina:    { nome: "Abbina",             icona: "🔗", tipi: ["coppie"],                      consegna: "Porta ogni carta vicino alla sua coppia." },
  memory:    { nome: "Memory",             icona: "🃏", tipi: ["coppie"],                      consegna: "Gira due carte e trova le coppie." },
  raggruppa: { nome: "Raggruppa",          icona: "🧺", tipi: ["gruppi"],                      consegna: "Metti ogni carta nel gruppo giusto." },
  sequenza:  { nome: "Ordina la sequenza", icona: "🔢", tipi: ["sequenza"],                    consegna: "Metti le carte in ordine." },
  completa:  { nome: "Completa la frase",  icona: "✏️", tipi: ["frasi"],                       consegna: "Metti ogni parola al suo posto." },
  matematica: { nome: "Matematica con gli oggetti", icona: "🧮", tipi: ["matematica"],       consegna: "Guarda, conta e rispondi." },
  lettura:   { nome: "Impariamo a leggere", icona: "📖", tipi: ["lettura"],                  consegna: "Guarda, ascolta e leggi." },
  brano:     { nome: "Leggi e rispondi",   icona: "📚", tipi: ["brano"],                      consegna: "Leggi il testo, poi rispondi alle domande." },
  scelta:    { nome: "Scelta multipla",    icona: "✅", tipi: ["domande", "coppie", "gruppi"], consegna: "Scegli la risposta giusta." },
  vero:      { nome: "Vero o falso",       icona: "⚖️", tipi: ["coppie"],                      consegna: "Vanno insieme? Tocca Vero o Falso." },
  palloncini: { nome: "Palloncini",        icona: "🎈", tipi: ["gruppi"],                      consegna: "Scoppia solo i palloncini del gruppo giusto." }
};
// L'ordine conta: il primo gioco adatto a un tipo è quello con cui l'esercizio si apre.

export const SCRITTURE = {
  maiuscolo: "STAMPATO MAIUSCOLO",
  minuscolo: "stampato minuscolo",
  doppio: "MAIUSCOLO e minuscolo",
  corsivo: "corsivo"
};

// Le spiegazioni animate che si possono mettere prima di un esercizio (sono in animazioni.js).
export const ANIMAZIONI = {
  "stati-materia": "Solidi, liquidi e gas",
  "ciclo-acqua": "Il ciclo dell'acqua",
  pianta: "Dal seme al frutto",
  "sistema-solare": "Il sistema solare",
  universo: "Dove siamo nell'universo",
  fonti: "Le fonti storiche",
  "linea-del-tempo": "La linea del tempo",
  "punti-cardinali": "I punti cardinali",
  carte: "Pianta e carta geografica",
  riporto: "Il riporto, in colonna",
  prestito: "Il prestito, in colonna",
  "tavola-pitagorica": "Come si usa la tavola pitagorica",
  moltiplicazione: "Che cos'è la moltiplicazione",
  tabelline: "La moltiplicazione e la tavola pitagorica",
  "proprieta-addizione": "Le proprietà dell'addizione",
  "proprieta-sottrazione": "La proprietà invariantiva della sottrazione",
  "proprieta-moltiplicazione": "Le proprietà della moltiplicazione",
  "valore-posizionale": "Unità, decine e centinaia",
  frazioni: "Le frazioni: parti uguali",
  "pari-dispari": "Pari e dispari",
  "retta-numeri": "La retta dei numeri"
};

export const MATERIE = ["Italiano", "Italiano L2", "Matematica", "Scienze", "Storia", "Geografia", "Inglese", "Arte e immagine", "Musica", "Altro"];

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
  // una foto della cartella foto/ dell'app (reperti, monumenti): solo il nome del file, mai un indirizzo esterno
  if (v && typeof v.f === "string" && /^[a-z0-9-]{1,60}\.(jpg|png|webp)$/.test(v.f)) e.f = v.f;
  return e.t || e.p || e.f ? e : null;
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
  if (MATERIE.includes(v.materia)) es.materia = v.materia;
  // il livello dell'esercizio, da 1 (i primi passi) a 4 (il più difficile): divide la pagina della materia
  if (LIVELLI[v.livello]) es.livello = Number(v.livello);
  // testi o immagini protetti da diritti: si usano solo in classe (art. 70 e 70-bis L. 633/1941),
  // quindi l'esercizio non si pubblica nel catalogo e non si condivide con un link
  if (v.privato) es.privato = true;
  // la spiegazione prima dell'esercizio: un'animazione dell'app, un video libero dell'archivio Wikimedia Commons
  // (solo il nome del file: niente pubblicità) e, se serve, un video di YouTube (solo il codice)
  if (v.scopri && typeof v.scopri === "object") {
    const sc = {};
    if (Object.prototype.hasOwnProperty.call(ANIMAZIONI, v.scopri.animazione)) sc.animazione = v.scopri.animazione;
    if (typeof v.scopri.commons === "string" && /^[^/\\?#<>"]{1,200}\.(webm|ogv|ogg|mp4)$/i.test(v.scopri.commons)) sc.commons = v.scopri.commons;
    if (typeof v.scopri.youtube === "string" && /^[\w-]{11}$/.test(v.scopri.youtube)) sc.youtube = v.scopri.youtube;
    if (sc.animazione || sc.commons || sc.youtube) es.scopri = sc;
  }
  // il periodo dell'esercizio sulla linea del tempo: [da, a] in anni, negativi = avanti Cristo
  if (Array.isArray(v.epoca) && v.epoca.length === 2 && v.epoca.every(Number.isFinite) &&
    v.epoca[0] < v.epoca[1] && v.epoca[0] >= -1e7 && v.epoca[1] <= 3000) es.epoca = v.epoca.map(Math.round);
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
  if (tipo === "matematica") {
    es.dati.aiuto = d.aiuto === "a-richiesta" ? "a-richiesta" : "sempre";
    const oggetto = elemento(d.oggetto);
    if (oggetto) es.dati.oggetto = oggetto;
    es.dati.esercizi = (Array.isArray(d.esercizi) ? d.esercizi : []).map(esercizioDiMatematica).filter(Boolean);
    if (!es.dati.esercizi.length) errore("Serve almeno un esercizio di matematica completo.");
  }
  if (tipo === "brano") es.dati = brano(d);
  if (tipo === "lettura") {
    es.dati.esercizi = (Array.isArray(d.esercizi) ? d.esercizi : []).map(esercizioDiLettura).filter(Boolean);
    if (!es.dati.esercizi.length) errore("Serve almeno un esercizio di lettura completo.");
  }
  return es;
}

/* ---------- brani da leggere ---------- */

export const LIVELLI = {
  1: "Livello 1 · prime letture",
  2: "Livello 2 · testi brevi",
  3: "Livello 3 · racconti",
  4: "Livello 4 · testi d'autore"
};

function brano(d) {
  const righe = (Array.isArray(d.testo) ? d.testo : []).slice(0, 80).map(r => testo(r, 1500));
  while (righe.length && !righe[0]) righe.shift();
  while (righe.length && !righe[righe.length - 1]) righe.pop();
  if (!righe.length) errore("Manca il testo da leggere.");
  const b = { testo: righe };
  ["autore", "opera", "anno", "nota", "didascalia"].forEach((k, i) => {
    const v = testo(d[k], [80, 140, 20, 300, 200][i]);
    if (v) b[k] = v;
  });
  if (d.poesia) b.poesia = true;
  if (LIVELLI[d.livello]) b.livello = Number(d.livello);
  if (typeof d.f === "string" && /^[a-z0-9-]{1,60}\.(jpg|png|webp)$/.test(d.f)) b.f = d.f;
  else if (picto(d.p)) b.p = picto(d.p);
  b.domande = (Array.isArray(d.domande) ? d.domande : []).map(q => ({
    d: testo(q && q.d, 300),
    giusta: testo(q && q.giusta, 200),
    sbagliate: (Array.isArray(q && q.sbagliate) ? q.sbagliate : []).map(s => testo(s, 200)).filter(Boolean)
  })).filter(q => q.d && q.giusta && q.sbagliate.length);
  if (!b.domande.length) errore("Serve almeno una domanda con la risposta giusta e una sbagliata.");
  return b;
}

/* ---------- lettura ---------- */

export const GENERI_LETTURA = {
  iniziale: { nome: "Con che lettera o sillaba inizia?", spiega: "Si vede l'immagine, la voce dice la parola e si sceglie come inizia." },
  fusione: { nome: "Unisci le lettere", spiega: "Le lettere si avvicinano e si legge la sillaba che formano insieme." },
  parola: { nome: "Componi la parola", spiega: "Si mettono in ordine le sillabe per formare la parola dell'immagine." },
  frase: { nome: "Metti in ordine la frase", spiega: "Si mettono in ordine le parole per formare la frase." },
  leggi: { nome: "Leggi e trova l'immagine", spiega: "Si legge una parola o una frase (la voce non la dice) e si sceglie l'immagine giusta." }
};

const minuscola = s => s.toLocaleLowerCase("it");
const picto = v => { const p = Number(v); return Number.isInteger(p) && p > 0 && p < 1e7 ? p : undefined; };

function esercizioDiLettura(x, i) {
  if (!x || typeof x !== "object" || !GENERI_LETTURA[x.genere]) return null;
  const inizio = "Esercizio " + (i + 1) + ": ";
  const lista = (v, max) => (Array.isArray(v) ? v : []).map(s => testo(s, max)).filter(Boolean);
  const diverse = (v, giusta) => [...new Set(v.map(minuscola))].filter(a => a !== minuscola(giusta));
  const e = { genere: x.genere };
  if (x.genere === "iniziale") {
    e.p = picto(x.p) || errore(inizio + "serve l'immagine.");
    e.parola = testo(x.parola, 40) || errore(inizio + "manca la parola.");
    e.giusta = testo(x.giusta, 4) || errore(inizio + "manca la risposta giusta.");
    if (!minuscola(e.parola).startsWith(minuscola(e.giusta))) errore(inizio + "«" + e.parola + "» non inizia con «" + e.giusta + "».");
    e.altre = diverse(lista(x.altre, 4), e.giusta);
    if (!e.altre.length) errore(inizio + "serve almeno una risposta sbagliata.");
  }
  if (x.genere === "fusione") {
    e.pezzi = lista(x.pezzi, 3);
    if (e.pezzi.length < 2 || e.pezzi.length > 3) errore(inizio + "servono 2 o 3 lettere da unire.");
    e.giusta = e.pezzi.join("");
    e.altre = diverse(lista(x.altre, 6), e.giusta);
    if (!e.altre.length) errore(inizio + "serve almeno una risposta sbagliata.");
  }
  if (x.genere === "parola" || x.genere === "frase") {
    const parola = x.genere === "parola";
    e.pezzi = lista(x.pezzi, parola ? 8 : 30);
    if (e.pezzi.length < 2 || e.pezzi.length > (parola ? 6 : 10)) errore(inizio + (parola ? "servono da 2 a 6 sillabe." : "servono da 2 a 10 parole."));
    const p = picto(x.p);
    if (p) e.p = p; else if (parola) errore(inizio + "serve l'immagine della parola.");
  }
  if (x.genere === "leggi") {
    e.testo = testo(x.testo, 120) || errore(inizio + "manca la parola o la frase da leggere.");
    e.p = picto(x.p) || errore(inizio + "serve l'immagine giusta.");
    e.altre = [...new Set((Array.isArray(x.altre) ? x.altre : []).map(picto).filter(p => p && p !== e.p))];
    if (!e.altre.length) errore(inizio + "serve almeno un'immagine sbagliata.");
  }
  return e;
}

/* ---------- matematica con gli oggetti ---------- */

export const MAX_OGGETTI = 60;

export const GENERI = {
  conta:        { nome: "Quanti sono?",          spiega: "Oggetti in file da dieci, da contare." },
  confronta:    { nome: "Di più, di meno, uguali", spiega: "Due gruppi: si mettono gli oggetti in coppia e si vede chi ne ha di più." },
  "prima-dopo": { nome: "Prima e dopo",          spiega: "Il numero che viene prima o dopo, sulla linea dei numeri." },
  decine:       { nome: "Decine e unità",        spiega: "Il numero fatto con le decine (barrette da dieci) e le unità." },
  operazione:   { nome: "Operazione",            spiega: "Un calcolo che si vede con gli oggetti." },
  colonna:      { nome: "In colonna",            spiega: "Addizione o sottrazione in colonna, fino a 999: con i quadrati delle centinaia, le barrette delle decine e i cubetti delle unità si vede il cambio (riporto e prestito)." },
  proprieta:    { nome: "Proprietà",             spiega: "Una proprietà delle operazioni, vista con gli oggetti: lo stesso calcolo fatto in un modo più facile." },
  problema:     { nome: "Problema",              spiega: "Una piccola storia da guardare e capire prima di scegliere l'operazione." },
  retta:        { nome: "La retta dei numeri",   spiega: "Una retta con 11 tacche: la freccia indica un numero da leggere, oppure si tocca la tacca del numero. Alla fine si vedono tutti i salti." },
  blocchi:      { nome: "Blocchi: centinaia, decine, unità", spiega: "Il numero con i quadrati delle centinaia, le barrette delle decine e i cubetti delle unità: da leggere, oppure da costruire con + e −." },
  frazione:     { nome: "Frazione",              spiega: "Un cerchio o una barra divisi in parti uguali: si colorano le parti, oppure si riconosce la frazione colorata." }
};

export const PASSI_RETTA = [1, 2, 5, 10, 20, 25, 50, 100];

export const OPERAZIONI = { "+": "+", "-": "−", "x": "×", ":": ":" };

// In un problema l'operazione nasce da ciò che succede, non dalle parole del testo.
// a e b: unione/aggiunta/togliere/confronto = due quantità; gruppi = quanti gruppi e quanti in ognuno;
// ripartizione = quanti oggetti e tra quante parti; contenenza = quanti oggetti e quanti in ogni gruppo.
export const SCHEMI = {
  unione:       { op: "+", nome: "Si mettono insieme due gruppi" },
  aggiunta:     { op: "+", nome: "Ne arrivano altri" },
  togliere:     { op: "-", nome: "Ne vanno via alcuni" },
  confronto:    { op: "-", nome: "Si confrontano due gruppi" },
  gruppi:       { op: "x", nome: "Ci sono gruppi tutti uguali" },
  ripartizione: { op: ":", nome: "Si dividono in parti uguali" },
  contenenza:   { op: ":", nome: "Si fanno gruppi uguali e si contano i gruppi" }
};

// Le proprietà delle operazioni. I numeri di ogni esercizio:
// commutativa: a e b, che si scambiano; associativa: a, b, c, e una delle due coppie vicine fa 10, 20, 30… (si fa prima quella);
// dissociativa dell'addizione: a + b, e b si spezza in c + (b − c), oppure, senza c, nel pezzo che porta a alla decina dopo;
// invariantiva: a − b, e c si aggiunge (o si toglie, se è negativo) a tutti e due, così b diventa tondo;
// dissociativa della moltiplicazione: a × b, e b si spezza in c × (b : c); distributiva: a × b, e b si spezza in c + (b − c),
// oppure, se c è più grande di b, in c − (c − b) (per esempio × 9 = × 10 − × 1).
export const PROPRIETA = {
  "commutativa-addizione":       { op: "+", voce: "Commutativa dell'addizione", nome: "Proprietà commutativa",
    regola: "se cambio l'ordine dei numeri, il risultato non cambia." },
  "associativa-addizione":       { op: "+", voce: "Associativa dell'addizione", nome: "Proprietà associativa",
    regola: "se sommo prima due numeri vicini, il risultato non cambia." },
  "dissociativa-addizione":      { op: "+", voce: "Dissociativa dell'addizione", nome: "Proprietà dissociativa",
    regola: "se spezzo un numero in due parti, il risultato non cambia." },
  "invariantiva-sottrazione":    { op: "-", voce: "Invariantiva della sottrazione", nome: "Proprietà invariantiva",
    regola: "se aggiungo o tolgo lo stesso numero a tutti e due i numeri, il risultato non cambia." },
  "commutativa-moltiplicazione": { op: "x", voce: "Commutativa della moltiplicazione", nome: "Proprietà commutativa",
    regola: "se cambio l'ordine dei numeri, il risultato non cambia." },
  "associativa-moltiplicazione": { op: "x", voce: "Associativa della moltiplicazione", nome: "Proprietà associativa",
    regola: "se moltiplico prima due numeri vicini, il risultato non cambia." },
  "dissociativa-moltiplicazione": { op: "x", voce: "Dissociativa della moltiplicazione", nome: "Proprietà dissociativa",
    regola: "se spezzo un numero in una moltiplicazione, il risultato non cambia." },
  "distributiva-moltiplicazione": { op: "x", voce: "Distributiva della moltiplicazione", nome: "Proprietà distributiva",
    regola: "se spezzo un numero in un'addizione (o in una sottrazione), moltiplico ogni parte e poi sommo (o sottraggo), il risultato non cambia." }
};

function controllaProprieta(x, a, b, c, no) {
  const intero = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
  const tondo = n => n > 0 && n % 10 === 0;
  if (!intero(a, 1, 60) || !intero(b, 1, 60)) no("i numeri vanno da 1 a 60.");
  if (x === "commutativa-addizione" && a + b > MAX_OGGETTI) no("con più di " + MAX_OGGETTI + " oggetti non si vedono bene.");
  if (x === "associativa-addizione") {
    if (!intero(c, 1, 60) || a + b + c > MAX_OGGETTI) no("servono tre numeri, in tutto al massimo " + MAX_OGGETTI + ".");
    if (tondo(a + b) === tondo(b + c)) no("una sola delle due coppie vicine (il primo col secondo, o il secondo col terzo) deve fare 10, 20, 30…");
  }
  if (x === "dissociativa-addizione") {
    if (c === undefined) {
      if (a % 10 === 0) no("il primo numero non deve essere già tondo.");
      if (a % 10 + b <= 10) no("il secondo numero deve superare la decina dopo il primo.");
    } else if (!Number.isInteger(c) || c < 1 || c >= b) no("il pezzo in cui si spezza il secondo numero va da 1 a " + (b - 1) + ".");
    if (a + b > MAX_OGGETTI) no("con più di " + MAX_OGGETTI + " oggetti non si vedono bene.");
  }
  if (x === "invariantiva-sottrazione") {
    if (b > a) no("il secondo numero non può essere più grande del primo.");
    if (!Number.isInteger(c) || c === 0 || Math.abs(c) > 9) no("il numero da aggiungere (o da togliere, col meno) va da 1 a 9.");
    if (!tondo(b + c)) no("aggiungendo o togliendo, il secondo numero deve diventare tondo (10, 20, 30…).");
    if (a + c > 40) no("al massimo 40 nella prima fila.");
  }
  if (x === "commutativa-moltiplicazione" && (a > 10 || b > 10)) no("al massimo 10 righe da 10.");
  if (x === "associativa-moltiplicazione") {
    if (!intero(c, 1, 10) || a > 10 || b > 10 || a * b * c > MAX_OGGETTI) no("servono tre numeri fino a 10, che moltiplicati fanno al massimo " + MAX_OGGETTI + ".");
    if (tondo(a * b) === tondo(b * c)) no("una sola delle due coppie vicine deve fare 10, 20, 30…");
  }
  if (x === "dissociativa-moltiplicazione") {
    if (a > 10 || b > 10 || a * b > MAX_OGGETTI) no("numeri fino a 10, che moltiplicati fanno al massimo " + MAX_OGGETTI + ".");
    if (!Number.isInteger(c) || c < 2 || c >= b || b % c !== 0) no("il secondo numero si deve spezzare in una moltiplicazione: il pezzo deve starci un numero esatto di volte.");
  }
  if (x === "distributiva-moltiplicazione") {
    if (a > 10 || b > 20 || a * Math.max(b, c || 0) > 100) no("al massimo 10 righe da 20, e al massimo 100 oggetti.");
    if (!Number.isInteger(c) || c < 1 || c === b || c > 20) no("il pezzo in cui si spezza il secondo numero va da 1 a 20, diverso dal numero.");
  }
}

export function risultato(op, a, b) {
  return op === "+" ? a + b : op === "-" ? a - b : op === "x" ? a * b : a / b;
}

function controllaConti(op, a, b, schema, inizio) {
  const no = msg => errore(inizio + msg);
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) no("servono due numeri interi.");
  if (op === "+" && a + b > MAX_OGGETTI) no("con più di " + MAX_OGGETTI + " oggetti non si vedono bene.");
  if (op === "-" && (b > a || a > MAX_OGGETTI)) no("il secondo numero non può essere più grande del primo, e al massimo " + MAX_OGGETTI + ".");
  // le tabelline arrivano fino a 10 × 10: per le moltiplicazioni gli oggetti possono essere fino a 100
  if (op === "x" && (a < 1 || b < 1 || a > 10 || b > 10)) no("al massimo 10 righe (o gruppi) da 10.");
  if (op === ":" && (b < 1 || a < 1 || a > MAX_OGGETTI || a % b !== 0)) no("il primo numero deve dividersi per il secondo senza resto, al massimo " + MAX_OGGETTI + ".");
  if (op === ":" && schema !== "contenenza" && b > 10) no("si divide al massimo in 10 parti.");
  if (schema === "contenenza" && a / b > 12) no("al massimo 12 gruppi.");
  if (schema === "confronto" && a > 30) no("per confrontare, al massimo 30 per gruppo.");
}

function esercizioDiMatematica(x, i) {
  if (!x || !GENERI[x.genere]) return null;
  const inizio = "Esercizio " + (i + 1) + ": ";
  const a = Number(x.a);
  const b = Number(x.b);
  const m = { genere: x.genere, a };
  if (x.genere === "conta" && !(Number.isInteger(a) && a >= 1 && a <= MAX_OGGETTI)) errore(inizio + "il numero va da 1 a " + MAX_OGGETTI + ".");
  if (x.genere === "confronta") {
    if (!(Number.isInteger(a) && Number.isInteger(b) && a >= 0 && b >= 0 && a <= 30 && b <= 30)) errore(inizio + "i due numeri vanno da 0 a 30.");
    m.b = b;
  }
  if (x.genere === "prima-dopo" || x.genere === "decine") {
    if (!(Number.isInteger(a) && a >= 1 && a <= 99)) errore(inizio + "il numero va da 1 a 99.");
    if (x.genere === "prima-dopo") m.verso = x.verso === "prima" ? "prima" : "dopo";
  }
  if (x.genere === "operazione") {
    m.op = OPERAZIONI[x.op] ? x.op : errore(inizio + "scegli l'operazione.");
    m.b = b;
    controllaConti(m.op, a, b, null, inizio);
  }
  if (x.genere === "colonna") {
    m.op = x.op === "-" ? "-" : x.op === "+" ? "+" : errore(inizio + "in colonna: addizione o sottrazione.");
    m.b = b;
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 1 || b < 1 || a > 999 || b > 999) errore(inizio + "i due numeri vanno da 1 a 999.");
    if (m.op === "+" && a + b > 999) errore(inizio + "il risultato deve stare entro 999.");
    if (m.op === "-" && b > a) errore(inizio + "il secondo numero non può essere più grande del primo.");
  }
  if (x.genere === "proprieta") {
    m.prop = PROPRIETA[x.prop] ? x.prop : errore(inizio + "scegli la proprietà.");
    m.b = b;
    const facoltativo = m.prop === "dissociativa-addizione" && (x.c === undefined || x.c === null || x.c === "");
    const c = facoltativo ? undefined : Number(x.c);
    if (["associativa-addizione", "dissociativa-addizione", "invariantiva-sottrazione", "associativa-moltiplicazione",
      "dissociativa-moltiplicazione", "distributiva-moltiplicazione"].includes(m.prop) && c !== undefined) m.c = c;
    controllaProprieta(m.prop, a, b, c, msg => errore(inizio + msg));
  }
  if (x.genere === "retta") {
    const passo = Number(x.passo);
    const da = Number(x.da || 0);
    if (!PASSI_RETTA.includes(passo)) errore(inizio + "ogni tacca vale 1, 2, 5, 10, 20, 25, 50 o 100.");
    if (!(Number.isInteger(da) && da >= 0 && da + 10 * passo <= 1000)) errore(inizio + "la retta parte da 0 o da un numero intero, e arriva al massimo a 1000.");
    if (!(Number.isInteger(a) && a >= da && a <= da + 10 * passo && (a - da) % passo === 0)) {
      errore(inizio + "il numero deve stare su una tacca, tra " + da + " e " + (da + 10 * passo) + ".");
    }
    Object.assign(m, { passo, da, modo: x.modo === "trova" ? "trova" : "leggi" });
  }
  if (x.genere === "blocchi") {
    if (!(Number.isInteger(a) && a >= 1 && a <= 999)) errore(inizio + "il numero va da 1 a 999.");
    m.modo = x.modo === "costruisci" ? "costruisci" : "leggi";
  }
  if (x.genere === "frazione") {
    if (!(Number.isInteger(b) && b >= 2 && b <= 12)) errore(inizio + "le parti uguali vanno da 2 a 12.");
    if (!(Number.isInteger(a) && a >= 1 && a <= b)) errore(inizio + "le parti colorate vanno da 1 al numero delle parti.");
    Object.assign(m, { b, forma: x.forma === "barra" ? "barra" : "cerchio", modo: x.modo === "colora" ? "colora" : "leggi" });
  }
  if (x.genere === "problema") {
    m.schema = SCHEMI[x.schema] ? x.schema : errore(inizio + "scegli che cosa succede nel problema.");
    m.b = b;
    controllaConti(SCHEMI[m.schema].op, a, b, m.schema, inizio);
    if (m.schema === "confronto" && b > a) errore(inizio + "nel confronto il primo gruppo è quello più grande.");
    m.testo = (Array.isArray(x.testo) ? x.testo : []).map(t => testo(t, 200)).filter(Boolean).slice(0, 4);
    if (!m.testo.length) errore(inizio + "manca il testo del problema.");
    const oggetto = elemento(x.oggetto);
    const contenitore = elemento(x.contenitore);
    const risposta = testo(x.risposta, 200);
    if (oggetto) m.oggetto = oggetto;
    if (contenitore) m.contenitore = contenitore;
    if (risposta) m.risposta = risposta;
  }
  return m;
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
