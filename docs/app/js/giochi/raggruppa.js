// Raggruppa: ogni carta va nel suo cesto.

import { el, carta, mescola } from "../ui.js";
import { creaTavolo } from "../trascina.js";

export function avvia(area, es, ctx) {
  const gruppi = es.dati.gruppi;
  const liste = gruppi.map((g, gi) => mescola(g.elementi).map(e => ({ e, gi })));
  const quante = Math.min(ctx.opz.elementi, liste.reduce((s, l) => s + l.length, 0));
  const scelti = [];
  for (let k = 0; scelti.length < quante; k++) {
    liste.forEach(l => { if (l[k] && scelti.length < quante) scelti.push(l[k]); });
  }
  let restano = scelti.length;
  let giuste = 0;
  const sbagliate = new WeakSet();

  const cesti = el("div", { class: "cesti", style: "--gruppi:" + gruppi.length },
    gruppi.map((g, gi) => el("div", { class: "cesto", "data-bersaglio": true, "data-g": gi },
      carta(g.p ? { t: g.nome, p: g.p } : { t: g.nome }, "cesto-testa"),
      el("div", { class: "cesto-dentro" }))));
  const vasca = el("div", { class: "vasca" },
    mescola(scelti).map(({ e, gi }) => carta(e, "mobile", { "data-mobile": true, "data-g": gi })));
  area.append(cesti, vasca);

  cesti.addEventListener("click", e => {
    const t = e.target.closest(".cesto-testa");
    if (t) ctx.leggi(t.dataset.voce);
  });

  creaTavolo(area, {
    scegli: k => ctx.leggi(k.dataset.voce),
    lascia(k, cesto) {
      if (k.dataset.g !== cesto.dataset.g) {
        sbagliate.add(k);
        ctx.riprova(k, cesti.querySelector('.cesto[data-g="' + k.dataset.g + '"]'));
        return;
      }
      cesto.querySelector(".cesto-dentro").append(k);
      k.removeAttribute("data-mobile");
      ctx.giusto(k);
      if (!sbagliate.has(k)) giuste++;
      if (--restano === 0) ctx.fine({ giuste, totale: scelti.length });
    }
  });
}
