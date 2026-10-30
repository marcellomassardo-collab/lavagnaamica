// Vero o falso: due carte vicine. Vanno insieme? Si tocca Vero o Falso; se era falso, si vede la coppia giusta.
// Metà delle prove sono vere e metà false: la carta falsa è quella di un'altra coppia.

import { el, carta, mescola } from "../ui.js";

export function avvia(area, es, ctx) {
  const coppie = mescola(es.dati.coppie).slice(0, ctx.opz.elementi);
  const uguali = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  const prove = mescola(coppie.map((c, i) => {
    const altra = coppie[(i + 1 + Math.floor(Math.random() * (coppie.length - 1))) % coppie.length];
    const destra = i % 2 === 0 ? c[1] : altra[1];
    return { c, destra, vera: uguali(destra, c[1]) };
  }));
  let n = 0;
  let giuste = 0;
  let fermo = false;

  const punti = el("div", { class: "punti", "aria-hidden": "true" }, prove.map(() => el("span")));
  const scena = el("div", { class: "vf-scena" });
  area.append(punti, scena);

  function mostra() {
    const p = prove[n];
    punti.children[n].classList.add("ora");
    let sbagliato = false;
    const destra = carta(p.destra, "vf-carta");
    const coppia = el("div", { class: "vf-coppia" }, carta(p.c[0], "vf-carta"), el("span", { class: "vf-segno", text: "↔", "aria-hidden": "true" }), destra);
    const si = el("button", { type: "button", class: "vf-tasto vf-vero", text: "✔ Vero" });
    const no = el("button", { type: "button", class: "vf-tasto vf-falso", text: "✘ Falso" });
    function rispondi(b, detto) {
      if (detto !== p.vera) {
        b.disabled = true;
        sbagliato = true;
        ctx.riprova(b, detto ? no : si);
        return;
      }
      si.disabled = no.disabled = true;
      ctx.giusto(b);
      if (!sbagliato) giuste++;
      // se era falso, la carta sbagliata lascia il posto a quella giusta
      if (!p.vera) destra.replaceWith(carta(p.c[1], "vf-carta vf-corretta"));
      setTimeout(() => {
        if (fermo) return;
        punti.children[n].classList.add("fatto");
        if (++n < prove.length) mostra(); else ctx.fine({ giuste, totale: prove.length });
      }, p.vera ? 900 : 1900);
    }
    si.addEventListener("click", () => rispondi(si, true));
    no.addEventListener("click", () => rispondi(no, false));
    scena.replaceChildren(coppia, el("p", { class: "vf-chiede", text: "Vanno insieme?" }), el("div", { class: "vf-tasti" }, si, no));
    ctx.leggi([p.c[0].t, p.destra.t].filter(Boolean).join(" … ") + ". Vanno insieme?");
  }

  mostra();
  return () => { fermo = true; };
}
