// Ordina la sequenza: ogni carta va nella casella col suo numero.

import { el, carta, mescola } from "../ui.js";
import { creaTavolo } from "../trascina.js";

export function avvia(area, es, ctx) {
  const passi = es.dati.passi;
  let restano = passi.length;
  let giuste = 0;
  const sbagliate = new Set();
  let ordine = mescola(passi.map((p, i) => i));
  if (ordine.every((x, k) => x === k)) ordine.reverse();

  const fila = el("ol", { class: "fila", style: "--passi:" + Math.min(passi.length, 6) },
    passi.map((p, i) => el("li", { class: "casella", "data-bersaglio": true, "data-i": i },
      el("span", { class: "casella-numero", "aria-hidden": "true", text: String(i + 1) }))));
  const vasca = el("div", { class: "vasca" },
    ordine.map(i => carta(passi[i], "mobile", { "data-mobile": true, "data-i": i })));
  area.append(fila, vasca);

  creaTavolo(area, {
    scegli: k => ctx.leggi(k.dataset.voce),
    lascia(k, casella) {
      if (k.dataset.i !== casella.dataset.i) {
        sbagliate.add(k.dataset.i);
        ctx.riprova(k, fila.querySelector('.casella[data-i="' + k.dataset.i + '"]'));
        return;
      }
      casella.append(k);
      casella.removeAttribute("data-bersaglio");
      k.removeAttribute("data-mobile");
      ctx.giusto(k);
      if (!sbagliate.has(k.dataset.i)) giuste++;
      if (--restano === 0) ctx.fine({ giuste, totale: passi.length });
    }
  });
}
