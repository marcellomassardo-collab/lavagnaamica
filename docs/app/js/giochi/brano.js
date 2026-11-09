// Leggi e rispondi: un brano da leggere (racconto, poesia, filastrocca, favola) e poi le domande per capirlo.
// Il testo non parte da solo con la voce: si legge con gli occhi. La voce aiuta solo se la si chiama.
// Gli strumenti per leggere vengono da metodi usati nelle scuole di molti paesi:
// - la voce legge e il colore segue la parola che sta dicendo;
// - «leggi dopo di me» (lettura a eco): la voce legge una frase, poi tocca al bambino ripeterla;
// - il righello: si vede bene una riga sola, le altre si scuriscono;
// - le sillabe colorate, alternate blu e rosso;
// - «leggo a tempo» (lettura ripetuta): parole lette bene al minuto e sillabe al secondo, salvate solo su questo dispositivo, senza nomi.

import { el, mescola, immaginePicto, due, finestra, pulsanteVoce } from "../ui.js";
import { impostazioni, cambia } from "../impostazioni.js";
import { leggiRiga, zitto, voceDisponibile, PAROLA, linguaAttuale } from "../voce.js";
import { sillabeParola } from "../sillabe.js";

const CHIAVE_TEMPI = "lavagna-amica-tempi";

// Una riga divisa in frasi; i punti delle abbreviazioni di una lettera (a.C.) non chiudono la frase.
function frasi(r) {
  const out = [];
  let da = 0, m;
  const re = /[.!?…]+["»”’)]*(?:\s+|$)/gu;
  while ((m = re.exec(r))) {
    if (!m[0]) { re.lastIndex++; continue; }
    const fine = m.index + m[0].length;
    if (/(^|[\s.])\p{L}$/u.test(r.slice(da, m.index)) && fine < r.length) continue;
    out.push(r.slice(da, fine));
    da = fine;
  }
  if (da < r.length) out.push(r.slice(da));
  return out.filter(s => s.trim());
}

// I pezzi di una frase: le parole e quello che c'è tra le parole.
function pezzi(s) {
  const out = [];
  let da = 0;
  for (const m of s.matchAll(PAROLA)) {
    if (m.index > da) out.push({ t: s.slice(da, m.index) });
    out.push({ t: m[0], parola: true });
    da = m.index + m[0].length;
  }
  if (da < s.length) out.push({ t: s.slice(da) });
  return out;
}

function leggiTempi() {
  try { return JSON.parse(localStorage.getItem(CHIAVE_TEMPI)) || {}; } catch (e) { return {}; }
}
function scriviTempi(t) {
  try { localStorage.setItem(CHIAVE_TEMPI, JSON.stringify(t)); } catch (e) {}
}

const minSec = s => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
const virgola = x => String(x).replace(".", ",");

export function avvia(area, es, ctx) {
  const d = es.dati;
  const chiave = es.id || es.titolo;
  let fermo = false;
  // La didascalia dice da dove viene il testo: autore, opera e quando (o la tradizione, se non c'è un libro).
  const opera = [d.autore, d.opera].filter(Boolean).join(", ");
  const fonte = opera ? "📖 " + (d.opera ? "Tratto da: " : "Fonte: ") + opera + (d.anno ? " (" + d.anno + ")" : "") : "";
  const rigaFonte = () => (fonte ? el("p", { class: "brano-fonte", text: fonte }) : null);
  const nota = () => (d.nota ? el("p", { class: "brano-nota", text: d.nota }) : null);
  const figura = () => (d.f ? el("img", { src: "foto/" + d.f, alt: "", decoding: "async" }) : d.p ? immaginePicto(d.p, "") : null);

  // ---------- il testo, parola per parola ----------
  // Ogni riga è scritta due volte (in alto e in basso) per la scrittura doppia: le parole hanno lo stesso numero nelle due copie.
  let vivo = null;   // il testo sullo schermo: { nodo, frasi: [{ testo, i0, n }], parole, sillabe }

  function costruisci(modo) {
    const colori = impostazioni.sillabe && linguaAttuale() !== "en";
    const elenco = [];
    let i = 0, quante = 0;
    const parolaEl = (w, k) => {
      const s = el("span", { class: "pa", "data-i": k });
      if (colori) sillabeParola(w).forEach((x, j) => s.append(el("span", { class: j % 2 ? "sil-b" : "sil-a", text: x })));
      else s.textContent = w;
      return s;
    };
    const righe = d.testo.map(r => {
      if (!r) return el("p", { class: "stacco", "aria-hidden": "true" });
      const fr = frasi(r).map(s => {
        const ps = pezzi(s);
        const x = { ps, i0: i, f: elenco.length };
        const n = ps.filter(p => p.parola).length;
        ps.forEach(p => { if (p.parola) quante += sillabeParola(p.t).length; });
        elenco.push({ testo: s, i0: i, n });
        i += n;
        return x;
      });
      const copia = classe => el("span", { class: classe }, fr.map(x => {
        let k = x.i0;
        return el("span", { class: "fr", "data-f": x.f }, x.ps.map(p => (p.parola ? parolaEl(p.t, k++) : el("span", { class: "sep", text: p.t }))));
      }));
      return el("p", {}, el("span", { class: "due" }, copia("alto"), copia("basso")));
    });
    const nodo = el("div", { class: "brano-testo" + (d.poesia ? " poesia" : "") + (modo === "tempo" ? " a-tempo" : "") }, righe);
    return { nodo, frasi: elenco, parole: i, sillabe: quante };
  }

  const tutte = sel => (vivo ? vivo.nodo.querySelectorAll(sel) : []);
  const accendi = (sel, classe) => tutte(sel).forEach(x => x.classList.add(classe));
  const spegni = classe => tutte("." + classe).forEach(x => x.classList.remove(classe));

  // ---------- la voce che legge e segue le parole ----------
  let corsa = 0;
  let svegliati = null;
  let quale = "";        // "tutto" o "eco": quale pulsante sta leggendo
  const bottoni = {};

  function ferma() {
    corsa++;
    zitto();
    if (svegliati) svegliati();
    quale = "";
    ["ora", "detta", "tocca"].forEach(spegni);
    if (bottoni.tutto) bottoni.tutto.textContent = "🔊 Leggimelo";
    if (bottoni.eco) bottoni.eco.textContent = "🗣 Leggi dopo di me";
  }

  const pausa = ms => new Promise(r => {
    const t = setTimeout(() => { svegliati = null; r(); }, ms);
    svegliati = () => { clearTimeout(t); svegliati = null; r(); };
  });

  async function suona(da, a, eco) {
    const mia = ++corsa;
    for (let f = da; f < a; f++) {
      if (mia !== corsa || fermo) return;
      const x = vivo.frasi[f];
      accendi('.fr[data-f="' + f + '"]', "ora");
      if (righello) vaiAllaParola(x.i0);
      await leggiRiga(x.testo, k => {
        if (mia !== corsa) return;
        const i = x.i0 + Math.min(k, x.n - 1);
        spegni("detta");
        accendi('.pa[data-i="' + i + '"]', "detta");
        if (righello) vaiAllaParola(i);
      });
      if (mia !== corsa) return;
      spegni("detta");
      if (eco) {
        // il tempo per ripetere: un secondo, più un po' per ogni parola
        accendi('.fr[data-f="' + f + '"]', "tocca");
        await pausa(1000 + 700 * x.n);
        if (mia !== corsa) return;
        spegni("tocca");
      }
      spegni("ora");
    }
    if (mia === corsa) ferma();
  }

  function pulsanteLettura(chi, testo, eco) {
    const b = el("button", { type: "button", class: "tasto-piccolo", text: testo, on: { click: () => {
      if (quale === chi) return ferma();
      ferma();
      quale = chi;
      b.textContent = "■ Ferma";
      suona(0, vivo.frasi.length, eco);
    } } });
    if (!voceDisponibile) b.hidden = true;
    bottoni[chi] = b;
    return b;
  }

  // ---------- il righello ----------
  let righello = false;
  let rigaOra = 0;
  let gruppi = [];
  let doveSta = new Map();

  function calcolaRighe() {
    gruppi = [];
    doveSta = new Map();
    let cima = null;
    tutte(".pa, .sep").forEach(s => {
      const r = s.getClientRects()[0];
      if (!r || !r.height) return;
      if (cima === null || Math.abs(r.top - cima) > r.height * 0.5) { gruppi.push([]); cima = r.top; }
      gruppi[gruppi.length - 1].push(s);
      doveSta.set(s, gruppi.length - 1);
    });
  }

  function mostraRiga(n, scorri) {
    if (!gruppi.length) return;
    rigaOra = Math.max(0, Math.min(gruppi.length - 1, n));
    spegni("vista");
    gruppi[rigaOra].forEach(s => s.classList.add("vista"));
    if (scorri !== false) gruppi[rigaOra][0].scrollIntoView({ block: "nearest" });
  }

  function vaiAllaParola(i) {
    const s = [...tutte('.pa[data-i="' + i + '"]')].find(x => doveSta.has(x));
    if (s && doveSta.get(s) !== rigaOra) mostraRiga(doveSta.get(s));
  }

  function righelloAcceso(si) {
    righello = si;
    if (!vivo) return;
    vivo.nodo.classList.toggle("con-righello", si);
    if (bottoni.righello) bottoni.righello.setAttribute("aria-pressed", String(si));
    if (bottoni.su) bottoni.su.hidden = bottoni.giu.hidden = !si;
    if (si) { calcolaRighe(); mostraRiga(rigaOra, false); } else spegni("vista");
  }

  const tasti = e => {
    if (!righello || !vivo || !vivo.nodo.isConnected || document.querySelector("dialog[open]")) return;
    if (e.key === "ArrowDown") { e.preventDefault(); mostraRiga(rigaOra + 1); }
    if (e.key === "ArrowUp") { e.preventDefault(); mostraRiga(rigaOra - 1); }
  };
  let attesa = null;
  const ridimensiona = () => {
    clearTimeout(attesa);
    attesa = setTimeout(() => {
      if (!righello || !vivo || !vivo.nodo.isConnected) return;
      const prima = gruppi[rigaOra] && gruppi[rigaOra][0];
      calcolaRighe();
      mostraRiga(prima && doveSta.has(prima) ? doveSta.get(prima) : rigaOra, false);
    }, 200);
  };
  document.addEventListener("keydown", tasti);
  window.addEventListener("resize", ridimensiona);

  // Toccare il testo: con il righello si sposta la riga; senza, la voce legge la frase toccata.
  function toccaTesto(e) {
    const s = e.target.closest(".pa, .sep");
    if (righello && s && doveSta.has(s)) { ferma(); mostraRiga(doveSta.get(s), false); return; }
    const fr = e.target.closest(".fr");
    if (!fr || !voceDisponibile) return;
    ferma();
    const f = Number(fr.dataset.f);
    suona(f, f + 1, false);
  }

  // ---------- leggere ----------
  function leggi() {
    ferma();
    const fig = figura();
    vivo = costruisci("leggi");
    vivo.nodo.addEventListener("click", toccaTesto);
    bottoni.righello = el("button", { type: "button", class: "tasto-piccolo", "aria-pressed": String(righello), text: "📏 Righello",
      on: { click: () => { ferma(); righelloAcceso(!righello); } } });
    bottoni.su = el("button", { type: "button", class: "tasto-piccolo", "aria-label": "Riga sopra", text: "▲", on: { click: () => mostraRiga(rigaOra - 1) } });
    bottoni.giu = el("button", { type: "button", class: "tasto-piccolo", "aria-label": "Riga sotto", text: "▼", on: { click: () => mostraRiga(rigaOra + 1) } });
    const sillabe = el("button", { type: "button", class: "tasto-piccolo", "aria-pressed": String(!!impostazioni.sillabe), text: "🎨 Sillabe",
      on: { click: () => { cambia("sillabe", !impostazioni.sillabe); leggi(); } } });
    if (linguaAttuale() === "en") sillabe.hidden = true;
    const strumenti = el("div", { class: "brano-strumenti" },
      pulsanteLettura("tutto", "🔊 Leggimelo", false),
      pulsanteLettura("eco", "🗣 Leggi dopo di me", true),
      bottoni.righello, bottoni.su, bottoni.giu, sillabe,
      el("button", { type: "button", class: "tasto-piccolo", text: "⏱ Leggo a tempo", on: { click: aTempo } }));
    area.replaceChildren(el("article", { class: "brano" + (fig ? "" : " senza-figura") },
      fig ? el("figure", { class: "brano-immagine" }, fig,
        fonte || d.didascalia ? el("figcaption", {}, rigaFonte(), d.didascalia ? el("p", { text: d.didascalia }) : null) : null) : null,
      el("div", { class: "brano-corpo" }, fig ? null : el("div", { class: "brano-didascalia" }, rigaFonte()), strumenti, vivo.nodo, nota(),
        el("div", { class: "brano-comandi" },
          el("button", { type: "button", class: "pulsante", text: "Ho letto: alle domande ▶", on: { click: domande } })))));
    area.scrollTop = 0;
    righelloAcceso(righello);
  }

  // ---------- leggo a tempo ----------
  function aTempo() {
    ferma();
    righello = false;
    vivo = costruisci("tempo");
    const testo = vivo;
    let stato = "pronto";
    let t0 = 0;
    let orologio = null;
    testo.nodo.addEventListener("click", e => {
      const s = e.target.closest(".pa");
      if (!s || stato === "finito") return;
      const segnata = !s.classList.contains("errore");
      testo.nodo.querySelectorAll('.pa[data-i="' + s.dataset.i + '"]').forEach(x => x.classList.toggle("errore", segnata));
    });
    const tempo = el("span", { class: "tempo-orologio", role: "timer", text: "0:00" });
    const via = el("button", { type: "button", class: "pulsante", text: "▶ Via!" });
    const comandi = el("div", { class: "brano-comandi" }, via, tempo,
      el("button", { type: "button", class: "tasto-piccolo", text: "📖 Torna al testo", on: { click: () => { clearInterval(orologio); leggi(); } } }));
    const esito = el("div", { class: "tempo-esito", "aria-live": "polite" });
    via.addEventListener("click", () => {
      if (stato === "pronto") {
        stato = "via";
        t0 = performance.now();
        orologio = setInterval(() => { tempo.textContent = minSec((performance.now() - t0) / 1000); }, 250);
        via.textContent = "■ Finito";
        return;
      }
      if (stato !== "via") return;
      clearInterval(orologio);
      const sec = (performance.now() - t0) / 1000;
      if (sec < 3) {
        stato = "pronto";
        tempo.textContent = "0:00";
        via.textContent = "▶ Via!";
        esito.replaceChildren(el("p", { text: "Troppo presto: premi «Finito» quando hai letto tutto il testo." }));
        return;
      }
      stato = "finito";
      tempo.textContent = minSec(sec);
      via.hidden = true;
      risultato(testo, sec, esito);
    });
    area.replaceChildren(el("article", { class: "brano senza-figura" },
      el("div", { class: "brano-corpo" },
        el("h2", { class: "tempo-titolo", text: "⏱ Leggo a tempo" }),
        el("p", { class: "tempo-guida", text: "Premi «Via!» e leggi ad alta voce. Chi ascolta tocca le parole lette male: diventano rosse. Alla fine premi «Finito»." }),
        testo.nodo, comandi, esito)));
    area.scrollTop = 0;
  }

  function risultato(testo, sec, esito) {
    const errori = new Set([...testo.nodo.querySelectorAll(".pa.errore")].map(s => s.dataset.i)).size;
    const minuti = sec / 60;
    const ppm = Math.round(Math.max(0, testo.parole - errori) / minuti);
    const sps = virgola((testo.sillabe / sec).toFixed(1));
    const tutti = leggiTempi();
    const prima = (tutti[chiave] || []).slice(-7);
    const ultimo = prima[prima.length - 1];
    const mie = prima.concat({ q: ppm, e: errori, s: Math.round(sec) });
    tutti[chiave] = mie;
    scriviTempi(tutti);

    let detto;
    if (!ultimo) detto = "Rileggi lo stesso testo altre volte: a ogni lettura diventa più facile.";
    else if (ppm > ultimo.q) detto = "Più veloce della volta scorsa: " + (ppm - ultimo.q) + (ppm - ultimo.q === 1 ? " parola" : " parole") + " al minuto in più!";
    else if (errori < ultimo.e) detto = "Meno errori della volta scorsa!";
    else detto = "Ogni lettura conta: riprova, ormai il testo lo conosci.";

    const alto = Math.max(...mie.map(x => x.q), 1);
    const barre = mie.length > 1 ? el("div", { class: "tempo-barre", role: "img",
      "aria-label": "Le ultime letture, in parole al minuto: " + mie.map(x => x.q).join(", ") },
      mie.map((x, k) => el("div", { class: "tempo-barra" + (k === mie.length - 1 ? " ultima" : "") },
        el("span", { class: "tempo-valore", text: String(x.q) }),
        el("span", { class: "tempo-colonna", style: "height:" + Math.max(4, Math.round(x.q / alto * 100)) + "%" })))) : null;

    let sicuro = false;
    const cancella = el("button", { type: "button", class: "tasto-piccolo tempo-cancella", text: "🗑 Cancella i tempi di questo testo" });
    cancella.addEventListener("click", () => {
      if (!sicuro) { sicuro = true; cancella.textContent = "Tocca ancora per cancellare"; return; }
      const t = leggiTempi();
      delete t[chiave];
      scriviTempi(t);
      cancella.replaceWith(el("p", { class: "tempo-nota", text: "Tempi cancellati." }));
      if (barre) barre.remove();
    });

    esito.replaceChildren(...[
      el("p", { class: "tempo-numero" }, el("strong", { text: String(ppm) }), " parole lette bene al minuto"),
      el("p", { class: "tempo-dettagli", text: minSec(sec) + " · " + errori + (errori === 1 ? " errore" : " errori") + " su " + testo.parole + " parole · " + sps + " sillabe al secondo" }),
      el("p", { class: "tempo-detto", text: detto }),
      barre,
      el("div", { class: "brano-comandi" },
        el("button", { type: "button", class: "pulsante", text: "⏱ Ancora a tempo", on: { click: aTempo } }),
        el("button", { type: "button", class: "tasto-piccolo", text: "Alle domande ▶", on: { click: domande } }),
        el("button", { type: "button", class: "tasto-piccolo", text: "📖 Torna al testo", on: { click: leggi } })),
      el("p", { class: "tempo-nota", text: "I tempi restano solo su questo dispositivo, senza nomi." }),
      cancella].filter(Boolean));
    ctx.dici(detto);
    esito.scrollIntoView({ block: "nearest" });
  }

  // ---------- le domande ----------
  function rileggi() {
    ferma();
    const prima = vivo;
    const testo = costruisci("leggi");
    vivo = testo;
    testo.nodo.addEventListener("click", toccaTesto);
    const leggimelo = el("button", { type: "button", class: "tasto-piccolo", text: "🔊 Leggimelo", on: { click: () => {
      if (quale) return ferma();
      ferma();
      quale = "tutto";
      leggimelo.textContent = "■ Ferma";
      vivo = testo;
      suona(0, testo.frasi.length, false).then(() => { leggimelo.textContent = "🔊 Leggimelo"; });
    } } });
    if (!voceDisponibile) leggimelo.hidden = true;
    const f = finestra(es.titolo, testo.nodo, el("div", { class: "brano-didascalia" }, rigaFonte()), nota(), el("div", { class: "brano-comandi" }, leggimelo));
    f.addEventListener("close", () => { ferma(); vivo = prima; });
  }

  async function domande() {
    ferma();
    righello = false;
    const qs = d.domande;
    let giuste = 0;
    const punti = el("div", { class: "punti", "aria-hidden": "true" }, qs.map(() => el("span")));
    const box = el("div", { class: "brano-domanda" });
    area.replaceChildren(punti, box);
    for (let n = 0; n < qs.length; n++) {
      if (fermo) return;
      punti.children[n].classList.add("ora");
      const q = qs[n];
      const opzioni = mescola([q.giusta].concat(mescola(q.sbagliate).slice(0, ctx.opz.risposte - 1)));
      const primoColpo = await new Promise(fatto => {
        let sbagliato = false;
        const bottoniRisposta = opzioni.map(o => el("button", { type: "button", class: "brano-opzione" }, due(o)));
        const giusto = bottoniRisposta[opzioni.indexOf(q.giusta)];
        bottoniRisposta.forEach(b => b.addEventListener("click", () => {
          if (b !== giusto) {
            b.disabled = true;
            b.classList.add("sbagliata");
            sbagliato = true;
            ctx.riprova(b, giusto);
            return;
          }
          bottoniRisposta.forEach(x => { x.disabled = true; });
          ctx.giusto(b);
          setTimeout(() => fatto(!sbagliato), 900);
        }));
        box.replaceChildren(
          el("p", { class: "brano-chiede" }, due(q.d), pulsanteVoce(q.d, "Ascolta la domanda")),
          el("div", { class: "brano-opzioni" }, bottoniRisposta),
          el("button", { type: "button", class: "tasto-piccolo", text: "📖 Rileggi il testo", on: { click: rileggi } }));
        ctx.leggi(q.d);
      });
      if (primoColpo) giuste++;
      punti.children[n].classList.add("fatto");
    }
    if (!fermo) ctx.fine({ giuste, totale: qs.length });
  }

  leggi();
  return () => {
    fermo = true;
    ferma();
    document.removeEventListener("keydown", tasti);
    window.removeEventListener("resize", ridimensiona);
  };
}
