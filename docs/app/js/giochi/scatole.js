// Apri la scatola: tante scatole numerate, ognuna nasconde una domanda. Si sceglie una scatola,
// il coperchio salta via e compare la domanda. Risposta giusta: la scatola resta aperta con una stella.
// Si va avanti finché tutte le scatole sono aperte. Niente tempo che scade.

import { el, carta, mescola, pulsanteVoce } from "../ui.js";
import { domandeDa } from "./scelta.js";

const COLORI = ["#E0332B", "#2F6FD6", "#2E9E5B", "#F2A300", "#8E44AD", "#16A3B8", "#E4609B", "#D35400"];

export function avvia(area, es, ctx) {
  const domande = mescola(domandeDa(es, 12)).slice(0, Math.max(4, Math.min(12, ctx.opz.elementi + 2)));
  let giuste = 0;
  let aperte = 0;
  let fermo = false;

  const griglia = el("div", { class: "sc-griglia" });
  const scena = el("div", { class: "sc-scena", hidden: true });
  area.append(griglia, scena);

  const scatole = domande.map((q, i) => {
    const b = el("button", { type: "button", class: "sc-scatola", style: "--colore:" + COLORI[i % COLORI.length], "aria-label": "Scatola " + (i + 1) },
      el("span", { class: "sc-coperchio", "aria-hidden": "true" }), el("span", { class: "sc-numero", text: String(i + 1) }));
    b.addEventListener("click", () => apri(i, b));
    return b;
  });
  griglia.append(...scatole);
  ctx.dici("Scegli una scatola.");

  function apri(i, b) {
    if (fermo || b.disabled || !scena.hidden) return;
    b.classList.add("sc-aperta");
    scatole.forEach(x => { x.disabled = true; });
    setTimeout(() => { if (!fermo) chiedi(i, b); }, 550);
  }

  function chiedi(i, b) {
    const q = domande[i];
    const opzioni = mescola([q.giusta].concat(mescola(q.sbagliate).slice(0, ctx.opz.risposte - 1)));
    let sbagliato = false;
    const bottoni = opzioni.map(o => el("button", { type: "button", class: "opzione sc-opzione" }, carta(o)));
    const giusto = bottoni[opzioni.indexOf(q.giusta)];
    bottoni.forEach(x => x.addEventListener("click", () => {
      if (x !== giusto) {
        x.disabled = true;
        x.classList.add("sbagliata");
        sbagliato = true;
        ctx.riprova(x, giusto);
        return;
      }
      bottoni.forEach(y => { y.disabled = true; });
      ctx.giusto(x);
      if (!sbagliato) giuste++;
      setTimeout(() => {
        if (fermo) return;
        b.classList.add(sbagliato ? "sc-fatta" : "sc-stella");
        b.querySelector(".sc-numero").textContent = sbagliato ? "✓" : "★";
        scena.hidden = true;
        griglia.hidden = false;
        scatole.forEach(x => { x.disabled = x.classList.contains("sc-aperta"); });
        if (++aperte === domande.length) ctx.fine({ giuste, totale: domande.length });
      }, 1000);
    }));
    const testo = q.d.t || "";
    scena.replaceChildren(
      el("p", { class: "sc-quale", text: "Scatola " + (i + 1) }),
      el("div", { class: "sc-domanda" }, carta(q.d, "sc-carta-domanda"), testo ? pulsanteVoce(testo, "Ascolta") : null),
      el("div", { class: "sc-opzioni", style: "--quante:" + opzioni.length }, bottoni));
    griglia.hidden = true;
    scena.hidden = false;
    if (testo) ctx.leggi(testo);
  }

  return () => { fermo = true; };
}
