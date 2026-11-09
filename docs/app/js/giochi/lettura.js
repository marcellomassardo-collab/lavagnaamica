// Lettura: dalle lettere alle sillabe, dalle sillabe alle parole, dalle parole alle frasi.
// Chi gioca deve leggere davvero: la voce non dice mai il testo da leggere prima della risposta giusta
// (c'è un pulsante per farselo leggere se ci si blocca). Le parole da ascoltare, invece, si sentono.
// Tre giochi per leggere più sciolti: la lettura lampo (la parola si vede per un attimo), il giro veloce
// dei suoni (si sente una sillaba, si tocca quella scritta) e la piramide di parole (la frase cresce a righe).

import { el, mescola, pulsanteVoce, immaginePicto, due } from "../ui.js";
import { sposta, aspetta } from "../scena.js";
import { voceDisponibile } from "../voce.js";

const VOCALI = /^[aeiou]$/i;
// il tempo vero (aspetta() con le animazioni ridotte non aspetta): serve alla lettura lampo
const attendi = ms => new Promise(r => setTimeout(r, ms));
const minuscola = s => s.toLocaleLowerCase("it");

// Quanto si somigliano due scritte: le lettere da cambiare, togliere, aggiungere o scambiare di posto
// per passare dall'una all'altra (così «or» è vicinissima a «ro», come negli errori di lettura veri).
function distanza(a, b) {
  a = minuscola(a); b = minuscola(b);
  const m = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) m[i][j] = Math.min(m[i][j], m[i - 2][j - 2] + 1);
    }
  }
  return m[a.length][b.length];
}

// Le scelte sbagliate: le più simili a quella giusta (a pari somiglianza, a caso).
function vicine(giusta, tutte, quante) {
  const altre = [...new Set(tutte)].filter(x => minuscola(x) !== minuscola(giusta));
  return mescola(altre).sort((x, y) => distanza(giusta, x) - distanza(giusta, y)).slice(0, quante);
}

const secondi = ms => (ms / 1000).toFixed(ms < 1000 ? 2 : 1).replace(".", ",") + " s";

export function avvia(area, es, ctx) {
  const tutti = es.dati.esercizi;
  // se sono tanti se ne prende una parte, ma nell'ordine dell'insegnante (dal più facile al più difficile)
  const scelti = tutti.length > ctx.opz.elementi
    ? mescola(tutti.map((x, i) => i)).slice(0, ctx.opz.elementi).sort((x, y) => x - y).map(i => tutti[i])
    : tutti;
  let giuste = 0;
  let fermo = false;

  const punti = el("div", { class: "punti", "aria-hidden": "true" }, scelti.map(() => el("span")));
  const scena = el("div", { class: "let-scena" });
  const pannello = el("div", { class: "let-pannello", "aria-live": "polite" });
  area.append(punti, scena, pannello);

  const figura = p => el("div", { class: "let-figura" }, immaginePicto(p, ""));
  const domanda = (testo, voce) => el("p", { class: "let-domanda" }, el("span", { text: testo }), voce || null);

  // Le risposte da toccare: si va avanti solo con quella giusta. Risolve con «giusta al primo colpo».
  function scegli(valori, giusto, disegna, classe, inColonna) {
    return new Promise(fatto => {
      let sbagliato = false;
      const bottoni = valori.map(v => el("button", { type: "button", class: classe || "let-opzione" }, disegna(v)));
      const giustoB = bottoni[valori.indexOf(giusto)];
      bottoni.forEach(b => b.addEventListener("click", () => {
        if (b !== giustoB) {
          b.disabled = true;
          b.classList.add("sbagliata");
          sbagliato = true;
          ctx.riprova(b, giustoB);
          return;
        }
        bottoni.forEach(x => { x.disabled = true; });
        ctx.giusto(b);
        setTimeout(() => fatto(!sbagliato), 700);
      }));
      pannello.replaceChildren(el("div", { class: "let-opzioni" + (inColonna ? " in-colonna" : ""), style: "--quante:" + valori.length }, bottoni));
    });
  }
  const opzioni = (giusta, altre) => mescola([giusta].concat(mescola(altre).slice(0, ctx.opz.risposte - 1)));

  /* ---------- con che lettera (o sillaba) inizia? ---------- */
  async function iniziale(x) {
    const vocale = VOCALI.test(x.giusta) && x.altre.every(a => VOCALI.test(a));
    const chiede = x.giusta.length === 1 ? (vocale ? "Con che vocale inizia?" : "Con che lettera inizia?") : "Con che sillaba inizia?";
    const scritta = el("div", { class: "let-parola nascosta" }, due(x.parola, x.giusta.length));
    scena.replaceChildren(figura(x.p), domanda(chiede, pulsanteVoce(() => x.parola, "Ascolta la parola")), scritta);
    ctx.leggi(chiede + " " + x.parola);   // qui si ascolta: la parola si sente, si sceglie l'inizio
    const ok = await scegli(opzioni(x.giusta, x.altre), x.giusta, t => due(t));
    scritta.classList.remove("nascosta");
    ctx.leggi(x.parola);
    await aspetta(1500);
    return ok;
  }

  /* ---------- unisci le lettere ---------- */
  async function fusione(x) {
    const pezzi = el("div", { class: "let-pezzi" }, x.pezzi.map(p => el("span", { class: "let-pezzo" }, due(p))));
    const chiede = "Leggi: che cosa diventano insieme?";
    scena.replaceChildren(pezzi, domanda(chiede));
    pannello.replaceChildren();
    await aspetta(800);
    pezzi.classList.add("uniti");
    await aspetta(900);
    if (fermo) return false;
    ctx.leggi(chiede);
    const ok = await scegli(opzioni(x.giusta, x.altre), x.giusta, t => due(t));
    ctx.leggi(x.giusta);
    await aspetta(1100);
    return ok;
  }

  /* ---------- componi la parola (sillabe) o la frase (parole) ---------- */
  function componi(x) {
    const parola = x.genere === "parola";
    const intero = parola ? x.pezzi.join("") : x.pezzi.join(" ");
    return new Promise(fatto => {
      let sbagliato = false, occupato = false;
      const caselle = x.pezzi.map(() => el("span", { class: "let-casella" }));
      const fila = el("div", { class: "let-caselle" + (parola ? " parola" : "") }, caselle);
      const tessere = mescola(x.pezzi.map(t => el("button", { type: "button", class: "let-tessera", "data-t": t }, due(t))));
      const mucchio = el("div", { class: "let-mucchio" }, tessere);
      const chiede = parola ? "Metti in ordine le sillabe e componi la parola." : "Metti in ordine le parole e componi la frase.";
      scena.replaceChildren(x.p ? figura(x.p) : null,
        domanda(chiede, parola ? pulsanteVoce(() => intero, "Ascolta la parola") : null), fila);
      pannello.replaceChildren(mucchio);
      ctx.leggi(parola ? chiede + " " + intero : chiede);   // la frase invece si legge da soli

      async function controlla() {
        const messe = caselle.map(c => c.firstChild);
        if (messe.some(m => !m)) return;
        const primoSbagliato = messe.findIndex((m, i) => m.dataset.t !== x.pezzi[i]);
        if (primoSbagliato < 0) {
          tessere.forEach(t => { t.disabled = true; });
          fila.classList.add("fatta");
          ctx.giusto();
          ctx.leggi(intero);
          await aspetta(1500);
          fatto(!sbagliato);
          return;
        }
        sbagliato = true;
        occupato = true;
        // tornano nel mucchio le tessere dal primo errore in poi; quelle giuste all'inizio restano
        const dovevaEssere = tessere.find(t => t.dataset.t === x.pezzi[primoSbagliato] && !messe.slice(0, primoSbagliato).includes(t));
        ctx.riprova(fila, dovevaEssere);
        await aspetta(450);
        for (const m of messe.slice(primoSbagliato)) await sposta(m, mucchio);
        occupato = false;
      }

      tessere.forEach(t => t.addEventListener("click", async () => {
        if (occupato || t.disabled) return;
        occupato = true;
        if (t.parentNode === mucchio) {
          const libera = caselle.find(c => !c.firstChild);
          if (libera) await sposta(t, libera);
        } else {
          // si toglie solo l'ultima messa, così l'ordine resta chiaro
          const piene = caselle.filter(c => c.firstChild);
          if (piene[piene.length - 1] === t.parentNode) await sposta(t, mucchio);
        }
        occupato = false;
        controlla();
      }));
    });
  }

  /* ---------- leggi e trova l'immagine ---------- */
  async function leggi(x) {
    const aiuto = el("button", { type: "button", class: "tasto-piccolo", text: "🔊 Aiutami a leggere", on: { click: () => ctx.leggi(x.testo) } });
    scena.replaceChildren(el("div", { class: "let-testo" }, due(x.testo)), domanda("Leggi e tocca l'immagine giusta.", aiuto));
    ctx.leggi("Leggi e tocca l'immagine giusta.");
    const ok = await scegli(opzioni(x.p, x.altre), x.p, p => immaginePicto(p, ""), "let-opzione let-immagine");
    ctx.leggi(x.testo);
    await aspetta(1500);
    return ok;
  }

  /* ---------- lettura lampo ---------- */
  // La parola si vede per un attimo, poi si sceglie quale era. Il tempo si accorcia di un quinto quando si legge
  // bene al primo colpo e si allunga di un terzo dopo un errore (tra 0,15 e 3 secondi). Vale per tutta la partita.
  let tLampo = null;
  let lampoSpiegato = false;
  async function lampo(x) {
    if (tLampo === null) tLampo = x.ms || 1000;
    const parole = mescola(x.parole);
    let bene = 0;
    const box = el("div", { class: "lampo-box", "aria-live": "off" });
    const tempo = el("span", { class: "lampo-tempo" });
    const ancora = el("button", { type: "button", class: "tasto-piccolo", text: "↻ Guarda ancora" });
    const chiede = "Guarda il centro e leggi: che cosa compare?";
    for (let n = 0; n < parole.length; n++) {
      if (fermo) break;
      const p = parole[n];
      let rivista = false;
      const mostra = async () => {
        box.replaceChildren(el("span", { class: "lampo-croce", text: "+" }));
        await attendi(600);
        if (fermo) return;
        box.replaceChildren(el("span", { class: "lampo-parola" }, due(p)));
        await attendi(tLampo);
        box.replaceChildren(el("span", { class: "lampo-maschera", text: "#".repeat(Math.max(3, Math.min(12, p.length))) }));
      };
      tempo.textContent = "⚡ " + secondi(tLampo) + " · " + (n + 1) + "/" + parole.length;
      scena.replaceChildren(domanda(chiede), box, el("div", { class: "lampo-sotto" }, tempo, ancora));
      pannello.replaceChildren();
      ancora.disabled = true;
      ancora.onclick = null;
      if (!lampoSpiegato) { lampoSpiegato = true; ctx.leggi(chiede); await attendi(2200); } else await attendi(700);
      if (fermo) break;
      await mostra();
      if (fermo) break;
      ancora.disabled = false;
      ancora.onclick = async () => { rivista = true; ancora.disabled = true; pannello.classList.add("in-attesa"); await mostra(); pannello.classList.remove("in-attesa"); ancora.disabled = false; };
      const valori = mescola([p].concat(vicine(p, x.parole, ctx.opz.risposte - 1)));
      const ok = await scegli(valori, p, t => due(t));
      ancora.disabled = true;
      if (ok) {
        bene++;
        if (!rivista) tLampo = Math.max(150, Math.round(tLampo * 0.8));
      } else tLampo = Math.min(3000, Math.round(tLampo * 1.3));
      box.replaceChildren(el("span", { class: "lampo-parola vista" }, due(p)));
      ctx.leggi(p);
      await attendi(900);
    }
    return { giuste: bene, totale: parole.length };
  }

  /* ---------- suoni e lettere, giro veloce ---------- */
  // La voce dice una sillaba (o una vocale) e si tocca quella scritta. Si comincia con 2 scelte; dopo 2 risposte
  // giuste di fila se ne aggiunge una (fino a 4), dopo un errore se ne toglie una. Senza voce: si trova la stessa.
  let quanteScelte = 2;
  let difila = 0;
  async function suono(x) {
    const conVoce = ctx.opz.voce && voceDisponibile;
    let bene = 0;
    let prima = null;
    for (let n = 0; n < x.quante; n++) {
      if (fermo) break;
      let g;
      do { g = x.pezzi[Math.floor(Math.random() * x.pezzi.length)]; } while (g === prima && x.pezzi.length > 1);
      prima = g;
      const valori = mescola([g].concat(vicine(g, x.pezzi, Math.min(quanteScelte, x.pezzi.length) - 1)));
      const conta = el("p", { class: "suono-conta", text: (n + 1) + " / " + x.quante });
      if (conVoce) {
        scena.replaceChildren(conta, domanda("Ascolta e tocca quella che senti.", pulsanteVoce(() => g, "Ascolta ancora")));
        ctx.leggi(g);
      } else {
        scena.replaceChildren(conta, domanda("Trova la stessa."), el("div", { class: "let-testo suono-modello" }, due(g)));
      }
      const ok = await scegli(valori, g, t => due(t), "let-opzione suono-opzione");
      if (fermo) break;
      if (ok) {
        bene++;
        if (++difila >= 2 && quanteScelte < 4) { quanteScelte++; difila = 0; }
      } else {
        difila = 0;
        quanteScelte = Math.max(2, quanteScelte - 1);
      }
    }
    return { giuste: bene, totale: x.quante };
  }

  /* ---------- piramide di parole ---------- */
  // La frase cresce di una parola a ogni riga: si legge ogni riga ad alta voce e si tocca «Letta».
  // Alla fine, senza la piramide davanti, si riconosce la frase tra altre quasi uguali.
  function variantiFrase(parole) {
    const fuori = new Set();
    const intera = parole.join(" ");
    for (let j = 1; j <= parole.length - 2; j++) fuori.add(parole.filter((_, k) => k !== j).join(" "));   // senza una parola
    for (let j = 1; j <= parole.length - 3; j++) {                                                         // due parole scambiate
      const s = parole.slice();
      [s[j], s[j + 1]] = [s[j + 1], s[j]];
      fuori.add(s.join(" "));
    }
    fuori.delete(intera);
    return mescola([...fuori]);
  }

  async function piramide(x) {
    const parole = x.frase.split(/\s+/).filter(Boolean);
    const torre = el("div", { class: "piramide" });
    const letta = el("button", { type: "button", class: "pulsante", text: "✔ Letta" });
    const chiede = "Leggi ogni riga ad alta voce, poi tocca «Letta».";
    scena.replaceChildren(domanda(chiede), torre);
    ctx.leggi(chiede);
    for (let k = 0; k < parole.length; k++) {
      if (fermo) return false;
      const riga = parole.slice(0, k + 1).join(" ");
      torre.querySelectorAll(".ora").forEach(e => e.classList.remove("ora"));
      torre.append(el("p", { class: "piramide-riga ora", title: "Tocca per ascoltare", on: { click: () => ctx.leggi(riga) } }, due(riga)));
      pannello.replaceChildren(letta);
      await new Promise(fatto => { letta.onclick = fatto; });
    }
    if (fermo) return false;
    torre.querySelectorAll(".ora").forEach(e => e.classList.remove("ora"));
    const altre = variantiFrase(parole).slice(0, ctx.opz.risposte - 1);
    scena.replaceChildren(domanda("Quale frase hai letto?"));
    const ok = await scegli(mescola([x.frase].concat(altre)), x.frase, t => due(t), "let-opzione let-frase", true);
    ctx.leggi(x.frase);
    await aspetta(1200);
    return ok;
  }

  const GENERI = { iniziale, fusione, parola: componi, frase: componi, leggi, lampo, suono, piramide };

  (async () => {
    let totale = 0;
    for (let n = 0; n < scelti.length; n++) {
      if (fermo) return;
      punti.children[n].classList.add("ora");
      pannello.replaceChildren();
      const esito = await GENERI[scelti[n].genere](scelti[n]);
      if (fermo) return;
      // i giri (lampo, suoni) contano ogni parola; gli altri giochi contano uno
      if (esito && typeof esito === "object") { giuste += esito.giuste; totale += esito.totale; } else { totale++; if (esito) giuste++; }
      punti.children[n].classList.add("fatto");
    }
    ctx.fine({ giuste, totale });
  })();

  return () => { fermo = true; };
}
