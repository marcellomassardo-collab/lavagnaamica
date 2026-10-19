// Completa la frase: una frase alla volta, le parole vanno nei buchi.
// Nel testo dell'insegnante le parole da completare stanno tra [quadre].

import { el, mescola, pulsanteVoce } from "../ui.js";
import { creaTavolo } from "../trascina.js";

const BUCO = /\[([^\]]+)\]/g;
const norma = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

function pezzi(frase) {
  const out = [];
  let ultimo = 0;
  frase.replace(BUCO, (tutto, parola, pos) => {
    if (pos > ultimo) out.push({ t: frase.slice(ultimo, pos) });
    out.push({ buco: parola.trim() });
    ultimo = pos + tutto.length;
    return tutto;
  });
  if (ultimo < frase.length) out.push({ t: frase.slice(ultimo) });
  return out;
}

function unici(parole) {
  const visti = new Set();
  return parole.filter(p => !visti.has(norma(p)) && visti.add(norma(p)));
}

export function avvia(area, es, ctx) {
  const frasi = es.dati.frasi.map(pezzi);
  const tutte = frasi.flatMap(f => f.filter(x => x.buco).map(x => x.buco)).concat(es.dati.extra);
  const punti = el("div", { class: "punti", "aria-hidden": "true" }, frasi.map(() => el("span")));
  const scena = el("div", { class: "completa-scena" });
  area.append(punti, scena);
  let n = 0;
  let restano = 0;
  let riga = null;
  let attesa = null;

  const leggiFrase = () => Array.from(riga.childNodes)
    .map(x => (x.classList && x.classList.contains("buco") && !x.textContent ? " … " : x.textContent)).join("");

  function mostra() {
    const f = frasi[n];
    const buchi = f.filter(x => x.buco).map(x => x.buco);
    const giuste = new Set(buchi.map(norma));
    const altre = mescola(unici(tutte.filter(p => !giuste.has(norma(p))))).slice(0, ctx.opz.risposte - 1);
    restano = buchi.length;
    punti.children[n].classList.add("ora");
    riga = el("p", { class: "frase" },
      f.map(x => (x.buco ? el("span", { class: "buco", "data-bersaglio": true, "data-parola": x.buco }) : x.t)));
    scena.replaceChildren(
      el("div", { class: "frase-box" }, riga, pulsanteVoce(leggiFrase, "Ascolta la frase")),
      el("div", { class: "vasca" },
        mescola(buchi.concat(altre)).map(p => el("div", { class: "carta parola mobile", "data-mobile": true, "data-voce": p },
          el("span", { class: "carta-testo", text: p })))));
    ctx.leggi(leggiFrase());
  }

  creaTavolo(scena, {
    scegli: k => ctx.leggi(k.dataset.voce),
    lascia(k, buco) {
      if (norma(k.dataset.voce) !== norma(buco.dataset.parola)) {
        const giusto = Array.from(riga.querySelectorAll(".buco[data-bersaglio]"))
          .find(b => norma(b.dataset.parola) === norma(k.dataset.voce));
        ctx.riprova(k, giusto);
        return;
      }
      buco.textContent = buco.dataset.parola;
      buco.removeAttribute("data-bersaglio");
      buco.classList.add("pieno");
      k.remove();
      if (--restano > 0) {
        ctx.giusto(buco);
        return;
      }
      ctx.giusto(riga);
      punti.children[n].classList.add("fatto");
      attesa = setTimeout(() => {
        n++;
        if (n < frasi.length) mostra(); else ctx.fine();
      }, 1300);
    }
  });

  mostra();
  return () => clearTimeout(attesa);
}
