// Palloncini: si scoppiano solo i palloncini del gruppo chiesto, un gruppo alla volta.
// Niente tempo che scade: i palloncini ondeggiano piano e aspettano.

import { el, carta, mescola } from "../ui.js";

const COLORI = ["#E0332B", "#2F6FD6", "#2E9E5B", "#F2A300", "#8E44AD", "#E4609B", "#16A3B8"];

export function avvia(area, es, ctx) {
  const gruppi = es.dati.gruppi;
  const giri = mescola(gruppi.map((g, i) => i)).slice(0, 3);
  let n = 0;
  let totale = 0;
  let errori = 0;
  let fermo = false;

  const punti = el("div", { class: "punti", "aria-hidden": "true" }, giri.map(() => el("span")));
  const testa = el("div", { class: "pal-testa" });
  const cielo = el("div", { class: "pal-cielo" });
  area.append(punti, testa, cielo);

  function giro() {
    const g = gruppi[giri[n]];
    punti.children[n].classList.add("ora");
    const buoni = mescola(g.elementi).slice(0, 5);
    const altri = mescola(gruppi.flatMap((h, i) => (i === giri[n] ? [] : h.elementi))).slice(0, Math.max(3, 9 - buoni.length));
    let restano = buoni.length;
    totale += buoni.length;
    testa.replaceChildren(el("p", { class: "pal-chiede" }, el("span", { text: "Scoppia i palloncini:" }),
      carta(g.p ? { t: g.nome, p: g.p } : { t: g.nome }, "pal-gruppo")));
    const palloni = mescola(buoni.map(e => ({ e, buono: true })).concat(altri.map(e => ({ e, buono: false })))).map(({ e, buono }, k) => {
      const b = el("button", { type: "button", class: "pallone",
        style: "--colore:" + COLORI[k % COLORI.length] + ";--ritardo:" + (-k * 0.73).toFixed(2) + "s" }, carta(e, "pal-carta"));
      b.addEventListener("click", () => {
        if (e.t) ctx.leggi(e.t);
        if (!buono) {
          errori++;
          b.disabled = true;
          b.classList.add("sgonfio");
          ctx.riprova(b);
          return;
        }
        b.disabled = true;
        b.classList.add("scoppia");
        ctx.giusto();
        if (--restano === 0) {
          setTimeout(() => {
            if (fermo) return;
            punti.children[n].classList.add("fatto");
            if (++n < giri.length) giro(); else ctx.fine({ giuste: Math.max(0, totale - errori), totale });
          }, 900);
        }
      });
      return b;
    });
    cielo.replaceChildren(...palloni);
    ctx.leggi("Scoppia i palloncini: " + g.nome);
  }

  giro();
  return () => { fermo = true; };
}
