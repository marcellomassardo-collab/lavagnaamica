// Carte da girare: tante carte coperte con la domanda (o la prima carta della coppia). Si legge, si prova a dire
// la risposta ad alta voce, poi si tocca la carta: si gira e mostra la risposta. Chi gioca dice da solo com'è andata
// («Lo sapevo» oppure «Da rivedere»): le carte da rivedere tornano coperte alla fine, finché non si sanno.

import { el, carta, mescola } from "../ui.js";
import { domandeDa } from "./scelta.js";

export function avvia(area, es, ctx) {
  const domande = mescola(domandeDa(es, 12)).slice(0, Math.max(4, Math.min(12, ctx.opz.elementi + 2)));
  let sapute = 0;          // sapute al primo giro
  let finite = 0;
  let fermo = false;

  const griglia = el("div", { class: "gi-griglia" });
  area.append(griglia);

  const carte = domande.map((q, i) => {
    let giri = 0;
    const fronte = el("div", { class: "gi-faccia gi-fronte" }, carta(q.d, "gi-carta"));
    const retro = el("div", { class: "gi-faccia gi-retro" }, carta(q.giusta, "gi-carta"));
    const si = el("button", { type: "button", class: "tasto-piccolo gi-si", text: "✔ Lo sapevo" });
    const no = el("button", { type: "button", class: "tasto-piccolo gi-no", text: "↺ Da rivedere" });
    const giudizio = el("div", { class: "gi-giudizio", hidden: true }, si, no);
    const dentro = el("button", { type: "button", class: "gi-dentro", "aria-label": "Carta " + (i + 1) + ": tocca per girarla" }, fronte, retro);
    const box = el("div", { class: "gi-box" }, dentro, giudizio);
    dentro.addEventListener("click", () => {
      if (fermo || box.classList.contains("girata")) return;
      box.classList.add("girata");
      dentro.disabled = true;
      if (q.giusta.t) ctx.leggi(q.giusta.t);
      setTimeout(() => { if (!fermo) giudizio.hidden = false; }, 450);
    });
    si.addEventListener("click", () => {
      giudizio.hidden = true;
      box.classList.add("saputa");
      ctx.giusto(box);
      if (giri === 0) sapute++;
      if (++finite === domande.length) setTimeout(() => { if (!fermo) ctx.fine({ giuste: sapute, totale: domande.length }); }, 900);
    });
    no.addEventListener("click", () => {
      giudizio.hidden = true;
      giri++;
      // torna coperta dopo un momento: si riprova più tardi
      setTimeout(() => {
        if (fermo) return;
        box.classList.remove("girata");
        dentro.disabled = false;
        griglia.append(box);
      }, 1200);
    });
    return box;
  });
  griglia.append(...carte);
  ctx.dici("Prova a dire la risposta, poi tocca la carta per girarla.");

  return () => { fermo = true; };
}
