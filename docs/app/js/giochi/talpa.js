// Acchiappa la talpa: in alto c'è una carta, dalle tane spuntano le talpe con altre carte.
// Si tocca la talpa che porta la coppia giusta. Le talpe tornano giù da sole, ma la giusta ricompare sempre:
// niente tempo che scade e niente punti persi per la lentezza, conta solo toccare quella giusta.

import { el, carta, mescola } from "../ui.js";

const TANE = 6;

export function avvia(area, es, ctx) {
  const coppie = mescola(es.dati.coppie).slice(0, ctx.opz.elementi);
  let n = 0;
  let giuste = 0;
  let fermo = false;
  let timer = null;

  const punti = el("div", { class: "punti", "aria-hidden": "true" }, coppie.map(() => el("span")));
  const testa = el("div", { class: "talpa-testa" });
  const prato = el("div", { class: "talpa-prato" });
  const tane = Array.from({ length: TANE }, () => {
    const talpa = el("button", { type: "button", class: "talpa", tabindex: "-1", "aria-hidden": "true" });
    const tana = el("div", { class: "talpa-tana" }, talpa, el("span", { class: "talpa-buco", "aria-hidden": "true" }));
    return { tana, talpa, su: false, via: null };
  });
  prato.append(...tane.map(t => t.tana));
  area.append(punti, testa, prato);

  function giu(t) {
    clearTimeout(t.via);
    t.su = false;
    t.talpa.classList.remove("su");
    t.talpa.tabIndex = -1;
    t.talpa.setAttribute("aria-hidden", "true");
  }

  function giro() {
    const c = coppie[n];
    const altre = coppie.filter((_, i) => i !== n).map(x => x[1]);
    let sbagliato = false;
    let finito = false;
    let quanteVolte = 0;
    punti.children[n].classList.add("ora");
    testa.replaceChildren(el("p", { class: "talpa-chiede" }, el("span", { text: "Acchiappa la talpa giusta:" }), carta(c[0], "talpa-modello")));
    if (c[0].t) ctx.leggi(c[0].t);

    // ogni tanto spunta una talpa da una tana libera; una su tre (e comunque spesso) porta la carta giusta
    const spunta = () => {
      if (fermo || finito) return;
      const libere = tane.filter(t => !t.su);
      if (libere.length) {
        const t = libere[Math.floor(Math.random() * libere.length)];
        const giustaSu = tane.some(x => x.su && x.giusta);
        const giusta = !giustaSu && (quanteVolte % 3 === 2 || Math.random() < 0.34 || !altre.length);
        quanteVolte++;
        const e = giusta ? c[1] : altre[Math.floor(Math.random() * altre.length)];
        t.giusta = giusta;
        t.talpa.replaceChildren(el("span", { class: "talpa-muso", "aria-hidden": "true" }), carta(e, "talpa-carta"));
        t.talpa.classList.remove("presa", "colpita");
        t.talpa.disabled = false;
        t.talpa.tabIndex = 0;
        t.talpa.removeAttribute("aria-hidden");
        t.talpa.onclick = () => {
          if (!t.su || finito) return;
          if (e.t) ctx.leggi(e.t);
          if (!t.giusta) {
            sbagliato = true;
            t.talpa.classList.add("colpita");
            ctx.riprova(t.talpa);
            setTimeout(() => giu(t), 350);
            return;
          }
          finito = true;
          t.talpa.classList.add("presa");
          ctx.giusto(t.talpa);
          if (!sbagliato) giuste++;
          clearTimeout(timer);
          setTimeout(() => {
            tane.forEach(giu);
            if (fermo) return;
            punti.children[n].classList.add("fatto");
            if (++n < coppie.length) setTimeout(giro, 400); else ctx.fine({ giuste, totale: coppie.length });
          }, 1100);
        };
        t.su = true;
        t.talpa.classList.add("su");
        t.via = setTimeout(() => giu(t), giusta ? 2600 : 2200);
      }
      timer = setTimeout(spunta, 750);
    };
    timer = setTimeout(spunta, 600);
  }

  giro();
  return () => { fermo = true; clearTimeout(timer); tane.forEach(t => clearTimeout(t.via)); };
}
