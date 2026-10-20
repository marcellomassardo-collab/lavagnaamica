// Lettura: dalle lettere alle sillabe, dalle sillabe alle parole, dalle parole alle frasi.
// Chi gioca deve leggere davvero: la voce non dice mai il testo da leggere prima della risposta giusta
// (c'è un pulsante per farselo leggere se ci si blocca). Le parole da ascoltare, invece, si sentono.

import { el, mescola, pulsanteVoce, immaginePicto, due } from "../ui.js";
import { sposta, aspetta } from "../scena.js";

const VOCALI = /^[aeiou]$/i;

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
  function scegli(valori, giusto, disegna, classe) {
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
      pannello.replaceChildren(el("div", { class: "let-opzioni", style: "--quante:" + valori.length }, bottoni));
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

  const GENERI = { iniziale, fusione, parola: componi, frase: componi, leggi };

  (async () => {
    for (let n = 0; n < scelti.length; n++) {
      if (fermo) return;
      punti.children[n].classList.add("ora");
      pannello.replaceChildren();
      const ok = await GENERI[scelti[n].genere](scelti[n]);
      if (fermo) return;
      if (ok) giuste++;
      punti.children[n].classList.add("fatto");
    }
    ctx.fine({ giuste, totale: scelti.length });
  })();

  return () => { fermo = true; };
}
