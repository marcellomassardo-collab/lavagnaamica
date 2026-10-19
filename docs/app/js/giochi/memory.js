// Memory: si girano due carte alla volta e si cercano le coppie.

import { el, carta, mescola } from "../ui.js";

const COPERTA = "Carta coperta";

export function avvia(area, es, ctx) {
  const coppie = mescola(es.dati.coppie).slice(0, Math.min(ctx.opz.elementi, 8));
  const carte = mescola(coppie.flatMap((c, i) => [{ e: c[0], i }, { e: c[1], i }]));
  const colonne = carte.length <= 6 ? 3 : carte.length <= 12 ? 4 : 5;
  const griglia = el("div", { class: "memory", style: "--colonne:" + colonne });
  let prima = null;
  let attesa = null;
  let trovate = 0;

  function copri(b) {
    b.classList.remove("girata");
    b.setAttribute("aria-label", COPERTA);
  }

  carte.forEach(({ e, i }) => {
    const b = el("button", { type: "button", class: "memo", "data-i": i, "aria-label": COPERTA },
      el("span", { class: "memo-retro", "aria-hidden": "true" }),
      carta(e, "memo-fronte"));
    b.addEventListener("click", () => {
      if (attesa || b.classList.contains("girata")) return;
      b.classList.add("girata");
      b.setAttribute("aria-label", e.t || "Immagine");
      ctx.leggi(e.t);
      if (!prima) {
        prima = b;
        return;
      }
      const a = prima;
      prima = null;
      if (a.dataset.i === b.dataset.i) {
        a.disabled = b.disabled = true;
        ctx.giusto(a);
        b.classList.add("giusta");
        if (++trovate === coppie.length) attesa = setTimeout(ctx.fine, 700);
      } else {
        attesa = setTimeout(() => {
          copri(a);
          copri(b);
          attesa = null;
        }, 1300);
      }
    });
    griglia.append(b);
  });
  area.append(griglia);
  return () => clearTimeout(attesa);
}
