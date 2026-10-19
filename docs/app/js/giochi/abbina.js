// Abbina: ogni carta in basso va portata vicino alla sua coppia.

import { el, carta, mescola } from "../ui.js";
import { creaTavolo } from "../trascina.js";

export function avvia(area, es, ctx) {
  const coppie = mescola(es.dati.coppie).slice(0, ctx.opz.elementi);
  let restano = coppie.length;

  const righe = el("div", { class: "abbina-righe" },
    coppie.map((c, i) => el("div", { class: "riga", "data-bersaglio": true, "data-i": i },
      carta(c[0], "fissa"),
      el("div", { class: "posto", "aria-hidden": "true" }))));
  const vasca = el("div", { class: "vasca" },
    mescola(coppie.map((c, i) => carta(c[1], "mobile", { "data-mobile": true, "data-i": i }))));
  area.append(righe, vasca);

  righe.addEventListener("click", e => {
    const f = e.target.closest(".fissa");
    if (f) ctx.leggi(f.dataset.voce);
  });

  creaTavolo(area, {
    scegli: k => ctx.leggi(k.dataset.voce),
    lascia(k, riga) {
      if (k.dataset.i !== riga.dataset.i) {
        ctx.riprova(k, righe.querySelector('.riga[data-i="' + k.dataset.i + '"]'));
        return;
      }
      riga.querySelector(".posto").append(k);
      riga.removeAttribute("data-bersaglio");
      riga.classList.add("fatta");
      k.removeAttribute("data-mobile");
      ctx.giusto(k);
      if (--restano === 0) ctx.fine();
    }
  });
}
