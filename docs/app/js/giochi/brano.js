// Leggi e rispondi: un brano da leggere (racconto, poesia, filastrocca, favola) e poi le domande per capirlo.
// Il testo non parte da solo con la voce: si legge con gli occhi. La voce aiuta solo se la si chiama
// (tutto il brano, oppure toccando una riga).

import { el, mescola, immaginePicto, due, finestra, pulsanteVoce } from "../ui.js";

export function avvia(area, es, ctx) {
  const d = es.dati;
  let fermo = false;
  const fonte = [d.autore, d.opera, d.anno].filter(Boolean).join(", ");

  const testo = () => el("div", { class: "brano-testo" + (d.poesia ? " poesia" : "") },
    d.testo.map(r => (r ? el("p", { on: { click: () => ctx.leggi(r) } }, due(r)) : el("p", { class: "stacco", "aria-hidden": "true" }))));
  const piede = () => [
    fonte ? el("p", { class: "brano-fonte", text: fonte }) : null,
    d.nota ? el("p", { class: "brano-nota", text: d.nota }) : null
  ];
  const figura = () => (d.f ? el("img", { src: "foto/" + d.f, alt: "", decoding: "async" }) : d.p ? immaginePicto(d.p, "") : null);
  const leggimelo = () => el("button", { type: "button", class: "tasto-piccolo", text: "🔊 Leggimelo",
    on: { click: () => ctx.leggi(d.testo.filter(Boolean).join(" ")) } });

  function leggi() {
    const fig = figura();
    area.replaceChildren(el("article", { class: "brano" + (fig ? "" : " senza-figura") },
      fig ? el("figure", { class: "brano-immagine" }, fig, d.didascalia ? el("figcaption", { text: d.didascalia }) : null) : null,
      el("div", { class: "brano-corpo" }, testo(), piede(),
        el("div", { class: "brano-comandi" }, leggimelo(),
          el("button", { type: "button", class: "pulsante", text: "Ho letto: alle domande ▶", on: { click: domande } })))));
    area.scrollTop = 0;
  }

  function rileggi() {
    finestra(es.titolo, testo(), piede(), el("div", { class: "brano-comandi" }, leggimelo()));
  }

  async function domande() {
    const qs = d.domande;
    let giuste = 0;
    const punti = el("div", { class: "punti", "aria-hidden": "true" }, qs.map(() => el("span")));
    const box = el("div", { class: "brano-domanda" });
    area.replaceChildren(punti, box);
    for (let n = 0; n < qs.length; n++) {
      if (fermo) return;
      punti.children[n].classList.add("ora");
      const q = qs[n];
      const opzioni = mescola([q.giusta].concat(mescola(q.sbagliate).slice(0, ctx.opz.risposte - 1)));
      const primoColpo = await new Promise(fatto => {
        let sbagliato = false;
        const bottoni = opzioni.map(o => el("button", { type: "button", class: "brano-opzione" }, due(o)));
        const giusto = bottoni[opzioni.indexOf(q.giusta)];
        bottoni.forEach(b => b.addEventListener("click", () => {
          if (b !== giusto) {
            b.disabled = true;
            b.classList.add("sbagliata");
            sbagliato = true;
            ctx.riprova(b, giusto);
            return;
          }
          bottoni.forEach(x => { x.disabled = true; });
          ctx.giusto(b);
          setTimeout(() => fatto(!sbagliato), 900);
        }));
        box.replaceChildren(
          el("p", { class: "brano-chiede" }, due(q.d), pulsanteVoce(q.d, "Ascolta la domanda")),
          el("div", { class: "brano-opzioni" }, bottoni),
          el("button", { type: "button", class: "tasto-piccolo", text: "📖 Rileggi il testo", on: { click: rileggi } }));
        ctx.leggi(q.d);
      });
      if (primoColpo) giuste++;
      punti.children[n].classList.add("fatto");
    }
    if (!fermo) ctx.fine({ giuste, totale: qs.length });
  }

  leggi();
  return () => { fermo = true; };
}
