// Ascolta e tocca: la voce dice la parola e si tocca il disegno giusto, senza dover leggere.
// Con le coppie si ascolta la seconda carta e si sceglie tra le prime. Se la voce non c'è, la parola si scrive.

import { el, carta, mescola } from "../ui.js";
import { voceDisponibile, vociInglesiDelDispositivo } from "../voce.js";

export function avvia(area, es, ctx) {
  const tutte = es.dati.coppie;
  const coppie = mescola(tutte).slice(0, ctx.opz.elementi);
  // senza voce il gioco resta possibile: si legge la parola invece di ascoltarla
  const siSente = ctx.opz.voce && voceDisponibile && (ctx.lingua !== "en" || vociInglesiDelDispositivo().length > 0);
  let n = 0;
  let giuste = 0;
  let fermo = false;

  const punti = el("div", { class: "punti", "aria-hidden": "true" }, coppie.map(() => el("span")));
  const scena = el("div", { class: "scelta-scena" });
  area.append(punti, scena);

  function mostra() {
    const c = coppie[n];
    punti.children[n].classList.add("ora");
    const altre = mescola(tutte.filter(x => x !== c)).slice(0, ctx.opz.risposte - 1);
    const scelte = mescola([c].concat(altre));
    const bottoni = scelte.map(x => el("button", { type: "button", class: "opzione" }, carta(x[0])));
    const giusto = bottoni[scelte.indexOf(c)];
    let sbagliato = false;
    bottoni.forEach(b => b.addEventListener("click", () => {
      if (b !== giusto) {
        b.disabled = true;
        sbagliato = true;
        ctx.riprova(b, giusto);
        ctx.leggi(c[1].t);
        return;
      }
      bottoni.forEach(x => { x.disabled = true; });
      ctx.giusto(b);
      if (!sbagliato) giuste++;
      setTimeout(() => {
        if (fermo) return;
        punti.children[n].classList.add("fatto");
        if (++n < coppie.length) mostra(); else ctx.fine({ giuste, totale: coppie.length });
      }, 1000);
    }));
    scena.replaceChildren(
      el("div", { class: "domanda-grande" }, siSente
        ? el("button", { type: "button", class: "pulsante asc-ascolta", text: "🔊 Ascolta", on: { click: () => ctx.leggi(c[1].t) } })
        : carta(c[1], "domanda-carta")),
      el("div", { class: "opzioni", style: "--quante:" + scelte.length }, bottoni));
    if (siSente) setTimeout(() => { if (!fermo) ctx.leggi(c[1].t); }, 350);
  }

  mostra();
  return () => { fermo = true; };
}
