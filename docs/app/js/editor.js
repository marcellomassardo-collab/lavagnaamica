// Editor degli esercizi: tutto si prepara riempiendo dei campi, senza codice.

import { el, immaginePicto } from "./ui.js";
import { TIPI, GIOCHI, SCRITTURE, MATERIE, GENERI, OPERAZIONI, SCHEMI, ANIMAZIONI, giochiPer, valida } from "./modello.js";
import { scegliPittogramma } from "./picto.js";

const vuoto = () => ({ t: "" });
const nuovoGruppo = () => ({ testa: vuoto(), elementi: [vuoto(), vuoto()] });
const nuovaDomanda = () => ({ d: vuoto(), giusta: vuoto(), sbagliate: [vuoto(), vuoto()] });

const NUOVI = {
  coppie: () => ({ coppie: [[vuoto(), vuoto()], [vuoto(), vuoto()], [vuoto(), vuoto()]] }),
  gruppi: () => ({ gruppi: [nuovoGruppo(), nuovoGruppo()] }),
  domande: () => ({ domande: [nuovaDomanda()] }),
  sequenza: () => ({ passi: [vuoto(), vuoto(), vuoto()] }),
  frasi: () => ({ frasi: ["", ""], extra: [] }),
  matematica: () => ({ aiuto: "sempre", oggetto: { t: "mela", p: 2462 }, esercizi: [{ genere: "conta", a: 5 }] })
};

// L'editor lavora su una copia; nei gruppi nome e immagine stanno in «testa».
export function bozzaDa(es) {
  if (!es) return { titolo: "", consegna: "", scrittura: "maiuscolo", tipo: "coppie", gioco: "abbina", dati: NUOVI.coppie() };
  const b = JSON.parse(JSON.stringify(es));
  if (b.tipo === "gruppi") {
    b.dati.gruppi = b.dati.gruppi.map(g => ({ testa: g.p ? { t: g.nome, p: g.p } : { t: g.nome }, elementi: g.elementi }));
  }
  return b;
}

function esercizioDa(b) {
  const es = JSON.parse(JSON.stringify(b));
  if (es.tipo === "gruppi") {
    es.dati.gruppi = es.dati.gruppi.map(g => ({ nome: g.testa.t, p: g.testa.p, elementi: g.elementi }));
  }
  return valida(es);
}

// Dal link di un video di YouTube (in tutte le sue forme) al codice di 11 caratteri.
export function idYoutube(testo) {
  const t = String(testo || "").trim();
  const m = t.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/) || t.match(/^([\w-]{11})$/);
  return m ? m[1] : "";
}

function haContenuto(b) {
  return /"t":"[^"]|"p":\d/.test(JSON.stringify(b.dati)) || (b.dati.frasi || []).some(f => f.trim());
}

/* ---------- campi ---------- */

function etichetta(nome, campo, aiuto) {
  return el("label", { class: "campo" }, el("span", { class: "campo-nome", text: nome }), campo, aiuto ? el("small", { text: aiuto }) : null);
}

function testoLibero(valore, cambia, attr) {
  const i = el("input", Object.assign({ type: "text", value: valore || "" }, attr));
  i.addEventListener("input", () => cambia(i.value));
  return i;
}

// Una carta da scrivere: testo e, se serve, un'immagine.
function campoElemento(e, segnaposto) {
  const testo = testoLibero(e.t, v => { e.t = v; }, { placeholder: segnaposto, maxlength: "200", "aria-label": segnaposto });
  const immagine = el("button", { type: "button", class: "picto-scegli" });
  function mostra() {
    immagine.replaceChildren(e.p ? immaginePicto(e.p, "") : el("span", { "aria-hidden": "true", text: "🖼️" }));
    immagine.setAttribute("aria-label", e.p ? "Cambia l'immagine" : "Aggiungi un'immagine");
    immagine.title = immagine.getAttribute("aria-label");
  }
  immagine.addEventListener("click", () => scegliPittogramma(testo.value, id => {
    if (id) e.p = id; else delete e.p;
    mostra();
  }));
  mostra();
  return el("div", { class: "campo-el" }, immagine, testo);
}

const tasto = (testo, azione, attr) =>
  el("button", Object.assign({ type: "button", class: "tasto-piccolo", text: testo, on: { click: azione } }, attr));
const cestino = (azione, attivo) => tasto("🗑", azione, { "aria-label": "Togli", title: "Togli", disabled: !attivo });
const aggiungi = (testo, azione) => el("button", { type: "button", class: "aggiungi", text: "＋ " + testo, on: { click: azione } });

/* ---------- matematica con gli oggetti ---------- */

const NOMI_NUMERI = {
  operazione: ["Primo numero", "Secondo numero"],
  unione: ["Primo gruppo", "Secondo gruppo"],
  aggiunta: ["All'inizio", "Ne arrivano"],
  togliere: ["All'inizio", "Ne vanno via"],
  confronto: ["Gruppo più grande", "Gruppo più piccolo"],
  gruppi: ["Quanti gruppi", "Quanti in ogni gruppo"],
  ripartizione: ["Quanti oggetti", "In quante parti"],
  contenenza: ["Quanti oggetti", "Quanti in ogni gruppo"]
};

function numero(valore, cambia, nome) {
  const i = el("input", { type: "number", inputmode: "numeric", min: "0", max: "99", value: valore === undefined ? "" : valore, "aria-label": nome });
  i.addEventListener("input", () => cambia(i.value === "" ? undefined : Number(i.value)));
  return etichetta(nome, i);
}

function menu(valore, voci, cambia, nome) {
  const s = el("select", { "aria-label": nome, on: { change: e => cambia(e.target.value) } },
    Object.entries(voci).map(([v, t]) => el("option", { value: v, selected: v === valore, text: t })));
  return etichetta(nome, s);
}

function campiDiMatematica(x, ridisegna) {
  const genere = menu(x.genere, Object.fromEntries(Object.entries(GENERI).map(([k, g]) => [k, g.nome])), v => {
    Object.keys(x).forEach(k => delete x[k]);
    Object.assign(x, { genere: v, a: 5 });
    if (v === "operazione") Object.assign(x, { op: "+", b: 3 });
    if (v === "confronta") x.b = 3;
    if (v === "prima-dopo") x.verso = "dopo";
    if (v === "problema") Object.assign(x, { schema: "aggiunta", b: 3, testo: ["", "", ""], oggetto: { t: "" } });
    ridisegna();
  }, "Che cosa");
  const campi = [genere, el("small", { class: "spiega", text: GENERI[x.genere].spiega })];
  const a = nome => numero(x.a, v => { x.a = v; }, nome);
  const b = nome => numero(x.b, v => { x.b = v; }, nome);
  if (x.genere === "conta" || x.genere === "decine") campi.push(a("Numero"));
  if (x.genere === "confronta") campi.push(a("Primo gruppo"), b("Secondo gruppo"));
  if (x.genere === "prima-dopo") campi.push(a("Numero"), menu(x.verso, { dopo: "Il numero dopo", prima: "Il numero prima" }, v => { x.verso = v; }, "Che cosa chiedere"));
  if (x.genere === "operazione") {
    campi.push(a(NOMI_NUMERI.operazione[0]), menu(x.op, OPERAZIONI, v => { x.op = v; }, "Operazione"), b(NOMI_NUMERI.operazione[1]));
  }
  if (x.genere === "problema") {
    if (!Array.isArray(x.testo)) x.testo = ["", "", ""];
    while (x.testo.length < 3) x.testo.push("");
    const nomi = NOMI_NUMERI[x.schema];
    campi.push(
      menu(x.schema, Object.fromEntries(Object.entries(SCHEMI).map(([k, s]) => [k, s.nome])), v => { x.schema = v; ridisegna(); }, "Che cosa succede nella storia"),
      etichetta("Prima frase: la situazione", testoLibero(x.testo[0], v => { x.testo[0] = v; }, { placeholder: "NEL CESTO CI SONO 15 MELE." })),
      etichetta("Seconda frase: che cosa succede", testoLibero(x.testo[1], v => { x.testo[1] = v; }, { placeholder: "LA MAMMA NE PRENDE 6." })),
      etichetta("La domanda", testoLibero(x.testo[2], v => { x.testo[2] = v; }, { placeholder: "QUANTE MELE RESTANO?" })),
      a(nomi[0]), b(nomi[1]),
      etichetta("Gli oggetti della storia", campoElemento(x.oggetto || (x.oggetto = { t: "" }), "Per esempio: mele")));
    if (["gruppi", "ripartizione", "contenenza"].includes(x.schema)) {
      campi.push(etichetta("Il contenitore (facoltativo)", campoElemento(x.contenitore || (x.contenitore = { t: "" }), "Per esempio: scatola, piatto, bambino")));
    }
    campi.push(etichetta("La risposta completa (facoltativa)", testoLibero(x.risposta, v => { x.risposta = v; }, { placeholder: "RESTANO 9 MELE." })));
  }
  return campi;
}

/* ---------- contenuto per ogni tipo ---------- */

const SEZIONI = {
  matematica(d, ridisegna) {
    const sposta = (i, j) => { [d.esercizi[i], d.esercizi[j]] = [d.esercizi[j], d.esercizi[i]]; ridisegna(); };
    return [
      el("p", { class: "spiega", text: "Gli esercizi si vedono con gli oggetti da contare. Mettili in ordine, dal più facile al più difficile." }),
      etichetta("Gli oggetti da contare", campoElemento(d.oggetto || (d.oggetto = { t: "" }), "Per esempio: mele")),
      menu(d.aiuto, { sempre: "Sempre visibili", "a-richiesta": "Solo quando il bambino li chiede" }, v => { d.aiuto = v; }, "Gli oggetti"),
      d.esercizi.map((x, i) => el("fieldset", { class: "box-ed" },
        el("legend", { text: "Esercizio " + (i + 1) }),
        campiDiMatematica(x, ridisegna),
        el("div", { class: "riga-ed" },
          tasto("↑", () => sposta(i, i - 1), { "aria-label": "Sposta su", disabled: i === 0 }),
          tasto("↓", () => sposta(i, i + 1), { "aria-label": "Sposta giù", disabled: i === d.esercizi.length - 1 }),
          cestino(() => { d.esercizi.splice(i, 1); ridisegna(); }, d.esercizi.length > 1)))),
      aggiungi("Aggiungi un esercizio", () => { d.esercizi.push({ genere: "operazione", op: "+", a: 5, b: 3 }); ridisegna(); })
    ];
  },
  coppie(d, ridisegna) {
    return [
      el("p", { class: "spiega", text: "Scrivi le due carte di ogni coppia: una parola, un'immagine o tutte e due." }),
      d.coppie.map((c, i) => el("div", { class: "riga-ed" },
        campoElemento(c[0], "Prima carta"),
        el("span", { class: "segno", "aria-hidden": "true", text: "↔" }),
        campoElemento(c[1], "Seconda carta"),
        cestino(() => { d.coppie.splice(i, 1); ridisegna(); }, d.coppie.length > 2))),
      aggiungi("Aggiungi una coppia", () => { d.coppie.push([vuoto(), vuoto()]); ridisegna(); })
    ];
  },

  gruppi(d, ridisegna) {
    return [
      el("p", { class: "spiega", text: "Dai un nome a ogni gruppo e scrivi che cosa ci va dentro." }),
      d.gruppi.map((g, gi) => el("fieldset", { class: "box-ed" },
        el("legend", { text: "Gruppo " + (gi + 1) }),
        el("div", { class: "riga-ed" },
          campoElemento(g.testa, "Nome del gruppo"),
          cestino(() => { d.gruppi.splice(gi, 1); ridisegna(); }, d.gruppi.length > 2)),
        g.elementi.map((e, i) => el("div", { class: "riga-ed rientro" },
          campoElemento(e, "Che cosa ci va dentro"),
          cestino(() => { g.elementi.splice(i, 1); ridisegna(); }, g.elementi.length > 1))),
        aggiungi("Aggiungi un elemento", () => { g.elementi.push(vuoto()); ridisegna(); }))),
      d.gruppi.length < 4 ? aggiungi("Aggiungi un gruppo", () => { d.gruppi.push(nuovoGruppo()); ridisegna(); }) : null
    ];
  },

  domande(d, ridisegna) {
    return [
      el("p", { class: "spiega", text: "Per ogni domanda scrivi la risposta giusta e almeno una sbagliata." }),
      d.domande.map((q, qi) => el("fieldset", { class: "box-ed" },
        el("legend", { text: "Domanda " + (qi + 1) }),
        el("div", { class: "riga-ed" },
          campoElemento(q.d, "Scrivi la domanda"),
          cestino(() => { d.domande.splice(qi, 1); ridisegna(); }, d.domande.length > 1)),
        el("div", { class: "riga-ed rientro" },
          el("span", { class: "segno giusto", "aria-hidden": "true", text: "✓" }),
          campoElemento(q.giusta, "Risposta giusta")),
        q.sbagliate.map((s, si) => el("div", { class: "riga-ed rientro" },
          el("span", { class: "segno sbagliato", "aria-hidden": "true", text: "✗" }),
          campoElemento(s, "Risposta sbagliata"),
          cestino(() => { q.sbagliate.splice(si, 1); ridisegna(); }, q.sbagliate.length > 1))),
        q.sbagliate.length < 3 ? aggiungi("Aggiungi una risposta sbagliata", () => { q.sbagliate.push(vuoto()); ridisegna(); }) : null)),
      aggiungi("Aggiungi una domanda", () => { d.domande.push(nuovaDomanda()); ridisegna(); })
    ];
  },

  sequenza(d, ridisegna) {
    const sposta = (i, j) => { [d.passi[i], d.passi[j]] = [d.passi[j], d.passi[i]]; ridisegna(); };
    return [
      el("p", { class: "spiega", text: "Scrivi i passi nell'ordine giusto: il gioco li mescolerà." }),
      d.passi.map((p, i) => el("div", { class: "riga-ed" },
        el("span", { class: "segno", "aria-hidden": "true", text: String(i + 1) }),
        campoElemento(p, "Passo " + (i + 1)),
        tasto("↑", () => sposta(i, i - 1), { "aria-label": "Sposta su", disabled: i === 0 }),
        tasto("↓", () => sposta(i, i + 1), { "aria-label": "Sposta giù", disabled: i === d.passi.length - 1 }),
        cestino(() => { d.passi.splice(i, 1); ridisegna(); }, d.passi.length > 2))),
      aggiungi("Aggiungi un passo", () => { d.passi.push(vuoto()); ridisegna(); })
    ];
  },

  frasi(d, ridisegna) {
    return [
      el("p", { class: "spiega" }, "Scrivi le frasi e metti tra ", el("b", { text: "[quadre]" }),
        " le parole da completare. Per esempio: ", el("i", { text: "Il [gatto] dorme sul divano." })),
      d.frasi.map((f, i) => el("div", { class: "riga-ed" },
        testoLibero(f, v => { d.frasi[i] = v; }, { placeholder: "Il [gatto] dorme sul divano.", maxlength: "300", "aria-label": "Frase " + (i + 1) }),
        cestino(() => { d.frasi.splice(i, 1); ridisegna(); }, d.frasi.length > 1))),
      aggiungi("Aggiungi una frase", () => { d.frasi.push(""); ridisegna(); }),
      etichetta("Parole in più, per confondere (facoltative)",
        testoLibero(d.extra.join(", "), v => { d.extra = v.split(",").map(s => s.trim()).filter(Boolean); }, { placeholder: "cane, sedia, corre" }),
        "Separale con una virgola.")
    ];
  }
};

/* ---------- l'editor ---------- */

export function editor(bozza, { salva, annulla }) {
  const contenuto = el("div", { class: "editor-contenuto" });
  const errore = el("p", { class: "errore", role: "alert" });
  const tipi = el("div", { class: "scelte-tipo", role: "radiogroup", "aria-label": "Che cosa vuoi preparare" });
  const scritture = el("div", { class: "scelte-scrittura", role: "radiogroup", "aria-label": "Scrittura" });
  const spiegaTipo = el("small", { text: TIPI[bozza.tipo].spiega });
  const sceltaGioco = el("select");
  const consegna = testoLibero(bozza.consegna, v => { bozza.consegna = v; }, { maxlength: "300" });

  const ridisegna = () => contenuto.replaceChildren(...SEZIONI[bozza.tipo](bozza.dati, ridisegna).flat().filter(Boolean));

  function mostraGiochi() {
    sceltaGioco.replaceChildren(...giochiPer(bozza.tipo).map(g =>
      el("option", { value: g, selected: g === bozza.gioco, text: GIOCHI[g].icona + " " + GIOCHI[g].nome })));
    consegna.placeholder = GIOCHI[bozza.gioco].consegna;
  }
  sceltaGioco.addEventListener("change", () => {
    bozza.gioco = sceltaGioco.value;
    consegna.placeholder = GIOCHI[bozza.gioco].consegna;
  });

  function mostraTipi() {
    tipi.replaceChildren(...Object.keys(TIPI).map(t => el("button", {
      type: "button", role: "radio", class: "scelta-tipo", "aria-checked": String(t === bozza.tipo),
      on: { click: () => cambiaTipo(t) }
    }, el("b", { text: TIPI[t].nome }), el("small", { text: giochiPer(t).map(g => GIOCHI[g].nome).join(" · ") }))));
  }
  function cambiaTipo(t) {
    if (t === bozza.tipo) return;
    if (haContenuto(bozza) && !confirm("Cambiando tipo perdi quello che hai scritto qui sotto. Continuo?")) return;
    bozza.tipo = t;
    bozza.dati = NUOVI[t]();
    bozza.gioco = giochiPer(t)[0];
    spiegaTipo.textContent = TIPI[t].spiega;
    mostraTipi();
    mostraGiochi();
    ridisegna();
  }

  function mostraScritture() {
    scritture.replaceChildren(...Object.keys(SCRITTURE).map(s => el("button", {
      type: "button", role: "radio", class: "scelta-scrittura s-" + s, "aria-checked": String(s === bozza.scrittura),
      text: SCRITTURE[s], on: { click: () => { bozza.scrittura = s; mostraScritture(); } }
    })));
  }

  function conferma(poi) {
    try {
      salva(esercizioDa(bozza), poi);
    } catch (e) {
      errore.textContent = e.message;
      errore.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }

  mostraTipi();
  mostraScritture();
  mostraGiochi();
  ridisegna();

  const materia = el("select", { on: { change: e => { bozza.materia = e.target.value || undefined; } } },
    el("option", { value: "", text: "Scegli la materia…" }),
    MATERIE.map(m => el("option", { value: m, selected: m === bozza.materia, text: m })));

  bozza.scopri = bozza.scopri || {};
  const animazione = el("select", { on: { change: e => { bozza.scopri.animazione = e.target.value || undefined; } } },
    el("option", { value: "", text: "Nessuna" }),
    Object.entries(ANIMAZIONI).map(([k, nome]) => el("option", { value: k, selected: k === bozza.scopri.animazione, text: nome })));
  const avvisoVideo = el("small", { class: "errore" });
  const video = testoLibero(bozza.scopri.youtube ? "https://youtu.be/" + bozza.scopri.youtube : "", v => {
    const id = idYoutube(v);
    bozza.scopri.youtube = id || undefined;
    avvisoVideo.textContent = v.trim() && !id ? "Non riconosco il link: copia l'indirizzo del video da YouTube." : "";
  }, { placeholder: "Per esempio: https://www.youtube.com/watch?v=…", "aria-label": "Link del video di YouTube" });

  return el("div", { class: "editor" },
    el("h1", { text: bozza.id ? "Modifica l'esercizio" : "Nuovo esercizio" }),
    etichetta("Titolo", testoLibero(bozza.titolo, v => { bozza.titolo = v; }, { placeholder: "Per esempio: Gli animali e i loro versi", maxlength: "120" })),
    etichetta("Materia", materia),
    el("div", { class: "campo" }, el("span", { class: "campo-nome", text: "Scrittura" }), scritture),
    el("div", { class: "campo" }, el("span", { class: "campo-nome", text: "Che cosa vuoi preparare?" }), tipi, spiegaTipo),
    contenuto,
    etichetta("Gioco con cui si apre", sceltaGioco, "Chi gioca può passare agli altri giochi della lista: il contenuto è lo stesso."),
    etichetta("Consegna (facoltativa)", consegna),
    etichetta("Spiegazione animata prima dell'esercizio (facoltativa)", animazione, "Parte da sola prima dell'esercizio; si può saltare o rivedere."),
    etichetta("Video di YouTube (facoltativo)", video, "Si vede dopo la spiegazione e si carica solo se qualcuno lo chiede."),
    avvisoVideo,
    errore,
    el("div", { class: "editor-azioni" },
      el("button", { type: "button", class: "pulsante secondario", text: "Annulla", on: { click: annulla } }),
      el("button", { type: "button", class: "pulsante secondario", text: "Salva", on: { click: () => conferma("casa") } }),
      el("button", { type: "button", class: "pulsante", text: "Salva e prova ▶", on: { click: () => conferma("gioca") } })));
}
