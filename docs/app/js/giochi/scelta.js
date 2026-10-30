// Scelta multipla: una domanda alla volta, si tocca la risposta giusta.
// Funziona con le domande, con le coppie (prima carta → seconda) e con i gruppi (elemento → gruppo).

import { el, carta, mescola, pulsanteVoce } from "../ui.js";

const testaGruppo = g => (g.p ? { t: g.nome, p: g.p } : { t: g.nome });

export function domandeDa(es, quante) {
  const d = es.dati;
  if (es.tipo === "domande") return d.domande;
  if (es.tipo === "coppie") {
    return mescola(d.coppie).slice(0, quante).map(c => ({
      d: c[0], giusta: c[1], sbagliate: d.coppie.filter(x => x !== c).map(x => x[1])
    }));
  }
  const tutti = d.gruppi.flatMap(g => g.elementi.map(e => ({ e, g })));
  return mescola(tutti).slice(0, quante).map(({ e, g }) => ({
    d: e, giusta: testaGruppo(g), sbagliate: d.gruppi.filter(x => x !== g).map(testaGruppo)
  }));
}

export function avvia(area, es, ctx) {
  const domande = domandeDa(es, ctx.opz.elementi);
  const punti = el("div", { class: "punti", "aria-hidden": "true" }, domande.map(() => el("span")));
  const scena = el("div", { class: "scelta-scena" });
  area.append(punti, scena);
  let n = 0;
  let giuste = 0;
  let sbagliato = false;
  let attesa = null;

  function mostra() {
    const q = domande[n];
    sbagliato = false;
    punti.children[n].classList.add("ora");
    const opzioni = mescola([q.giusta].concat(mescola(q.sbagliate).slice(0, ctx.opz.risposte - 1)));
    const bottoni = opzioni.map(o => el("button", { type: "button", class: "opzione" }, carta(o)));
    const giusto = bottoni[opzioni.indexOf(q.giusta)];
    bottoni.forEach((b, k) => b.addEventListener("click", () => {
      ctx.leggi(opzioni[k].t);
      if (b !== giusto) {
        b.disabled = true;
        b.classList.add("sbagliata");
        sbagliato = true;
        ctx.riprova(b, giusto);
        return;
      }
      bottoni.forEach(x => { x.disabled = true; });
      ctx.giusto(b);
      if (!sbagliato) giuste++;
      punti.children[n].classList.add("fatto");
      attesa = setTimeout(() => {
        n++;
        if (n < domande.length) mostra(); else ctx.fine({ giuste, totale: domande.length });
      }, 1100);
    }));
    scena.replaceChildren(
      el("div", { class: "domanda-grande" }, carta(q.d, "domanda-carta"), pulsanteVoce(q.d.t, "Ascolta la domanda")),
      el("div", { class: "opzioni", style: "--quante:" + opzioni.length }, bottoni));
    ctx.leggi(q.d.t);
  }

  mostra();
  return () => clearTimeout(attesa);
}
