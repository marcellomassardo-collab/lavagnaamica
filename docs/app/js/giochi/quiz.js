// Quiz a squadre e Ruota della fortuna, per giocare alla LIM con tutta la classe.
// Le squadre rispondono a turno: chi indovina prende un punto. Se una squadra sbaglia, la domanda «rimbalza»
// alla squadra dopo. Le squadre hanno solo un colore: nessun nome di alunni.

import { el, carta, mescola, pulsanteVoce } from "../ui.js";
import { domandeDa } from "./scelta.js";

const SQUADRE = [
  { nome: "Squadra rossa", colore: "#D7322A" }, { nome: "Squadra blu", colore: "#2F6FD6" },
  { nome: "Squadra verde", colore: "#23884C" }, { nome: "Squadra gialla", colore: "#C98A00" }];
const SPICCHI = ["#E0332B", "#2F6FD6", "#2E9E5B", "#F2A300", "#8E44AD", "#16A3B8", "#E4609B", "#6B8E23", "#D35400", "#34495E", "#C2185B", "#00897B"];
const svgEl = (tag, attr) => {
  const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attr).forEach(([k, v]) => n.setAttribute(k, v));
  return n;
};

function gioca(area, es, ctx, conRuota) {
  const domande = mescola(domandeDa(es, 12)).slice(0, conRuota ? 12 : 10);
  const ridotto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let squadre = [];
  let turno = 0;
  let primoColpo = 0;
  let angolo = 0;
  let fermo = false;

  const tabellone = el("div", { class: "sq-tabellone" });
  const scena = el("div", { class: "sq-scena" });
  area.append(tabellone, scena);

  const diChi = () => (squadre.length > 1 ? "Tocca alla " + squadre[turno].nome.toLowerCase() : "Tocca a tutta la classe");
  function disegnaTabellone() {
    tabellone.replaceChildren(...squadre.map((sq, i) => el("div", { class: "sq-squadra" + (i === turno ? " sq-turno" : ""), style: "--colore:" + sq.colore },
      el("span", { text: sq.nome }), el("strong", { class: "sq-punti", text: String(sq.punti) }))));
  }
  const cartello = () => el("p", { class: "sq-chi", style: "--colore:" + squadre[turno].colore, text: diChi() });

  // una domanda: la squadra di turno sceglie; se sbaglia, tocca alla squadra dopo
  function chiedi(q) {
    return new Promise(fatto => {
      const opzioni = mescola([q.giusta].concat(mescola(q.sbagliate.filter(x => JSON.stringify(x) !== JSON.stringify(q.giusta))).slice(0, ctx.opz.risposte - 1)));
      const bottoni = opzioni.map(o => el("button", { type: "button", class: "opzione" }, carta(o)));
      const giusto = bottoni[opzioni.indexOf(q.giusta)];
      let primo = true;
      let chi = cartello();
      bottoni.forEach(b => b.addEventListener("click", () => {
        if (b !== giusto) {
          b.disabled = true;
          primo = false;
          ctx.riprova(b);
          if (squadre.length > 1) {
            turno = (turno + 1) % squadre.length;
            const nuovo = cartello();
            chi.replaceWith(nuovo);
            chi = nuovo;
            disegnaTabellone();
            ctx.leggi("Rimbalzo! " + diChi());
          }
          return;
        }
        bottoni.forEach(x => { x.disabled = true; });
        ctx.giusto(b);
        squadre[turno].punti++;
        if (primo) primoColpo++;
        disegnaTabellone();
        setTimeout(fatto, 1400);
      }));
      disegnaTabellone();
      scena.replaceChildren(chi, el("div", { class: "domanda-grande" }, carta(q.d, "domanda-carta"), pulsanteVoce(q.d.t || "", "Ascolta la domanda")),
        el("div", { class: "opzioni", style: "--quante:" + opzioni.length }, bottoni));
      ctx.leggi(diChi() + ". " + (q.d.t || ""));
    });
  }

  // la ruota: tanti spicchi quante sono le domande; quelli già usciti diventano grigi
  function gira(usate) {
    return new Promise(fatto => {
      const n = domande.length, passo = 360 / n;
      const disco = svgEl("g", {});
      for (let i = 0; i < n; i++) {
        const a0 = (-90 + i * passo) * Math.PI / 180, a1 = (-90 + (i + 1) * passo) * Math.PI / 180, m = (a0 + a1) / 2;
        const pt = (a, r) => (r * Math.cos(a)).toFixed(1) + "," + (r * Math.sin(a)).toFixed(1);
        const numero = svgEl("text", { x: (70 * Math.cos(m)).toFixed(1), y: (70 * Math.sin(m) + 7).toFixed(1), "text-anchor": "middle",
          "font-size": 20, "font-weight": 800, fill: "#fff" });
        numero.textContent = String(i + 1);
        disco.append(svgEl("path", { d: "M0,0 L" + pt(a0, 100) + " A100,100 0 0 1 " + pt(a1, 100) + " Z",
          fill: usate.has(i) ? "#C9CED3" : SPICCHI[i % SPICCHI.length], stroke: "#fff", "stroke-width": 2 }), numero);
      }
      disco.style.transformOrigin = "0 0";
      disco.style.transformBox = "view-box";
      disco.style.transform = "rotate(" + angolo + "deg)";
      const svg = svgEl("svg", { viewBox: "-112 -122 224 236", class: "sq-ruota", role: "img", "aria-label": "La ruota delle domande" });
      svg.append(disco, svgEl("circle", { r: 15, fill: "#1D2329" }), svgEl("path", { d: "M-13,-120 L13,-120 L0,-92 Z", fill: "#1D2329", stroke: "#fff", "stroke-width": 2 }));
      const bottone = el("button", { type: "button", class: "pulsante sq-gira", text: "🎡 Gira la ruota!" });
      // si gira con il pulsante o toccando la ruota
      svg.addEventListener("click", () => bottone.click());
      bottone.addEventListener("click", () => {
        if (bottone.disabled) return;
        bottone.disabled = true;
        const libere = domande.map((_, i) => i).filter(i => !usate.has(i));
        const k = libere[Math.floor(Math.random() * libere.length)];
        // lo spicchio k deve fermarsi sotto la freccia, in alto, dopo qualche giro
        angolo += 360 * 4 + (((-(k + 0.5) * passo - angolo) % 360) + 360) % 360;
        disco.style.transition = "transform 3.2s cubic-bezier(.15,.85,.25,1)";
        disco.style.transform = "rotate(" + angolo + "deg)";
        setTimeout(() => {
          if (fermo) return;
          ctx.leggi("Domanda " + (k + 1));
          fatto(k);
        }, ridotto ? 300 : 3500);
      });
      disegnaTabellone();
      scena.replaceChildren(el("div", { class: "sq-riga" }, cartello(), bottone), svg);
      ctx.leggi(diChi() + ": gira la ruota!");
    });
  }

  function podio() {
    const ordine = squadre.slice().sort((x, y) => y.punti - x.punti);
    const titolo = squadre.length === 1 ? "Brava classe! " + squadre[0].punti + " risposte giuste su " + domande.length + "."
      : ordine[0].punti === ordine[1].punti ? "Pareggio!" : "🏆 Vince la " + ordine[0].nome.toLowerCase() + "!";
    scena.replaceChildren(el("div", { class: "sq-podio" }, el("p", { class: "sq-titolo", text: titolo }),
      el("ol", { class: "sq-classifica" }, ordine.map(sq => el("li", { style: "--colore:" + sq.colore },
        el("span", { text: sq.nome }), el("strong", { text: sq.punti + (sq.punti === 1 ? " punto" : " punti") })))),
      el("button", { type: "button", class: "pulsante", text: "Fine ▶", on: { click: () => ctx.fine({ giuste: primoColpo, totale: domande.length }) } })));
    ctx.leggi(titolo);
  }

  async function partita() {
    const usate = new Set();
    for (let n = 0; n < domande.length; n++) {
      if (fermo) return;
      turno = n % squadre.length;
      const k = conRuota ? await gira(usate) : n;
      if (fermo) return;
      usate.add(k);
      await chiedi(domande[k]);
    }
    if (!fermo) podio();
  }

  // prima si sceglie quante squadre giocano
  scena.replaceChildren(el("div", { class: "sq-scelta" }, el("p", { class: "sq-titolo", text: "Quante squadre giocano?" }),
    el("div", { class: "sq-numeri" }, [1, 2, 3, 4].map(n => el("button", { type: "button", class: "pulsante", text: n === 1 ? "Tutta la classe" : n + " squadre",
      on: { click: () => {
        squadre = SQUADRE.slice(0, n).map(sq => Object.assign({ punti: 0 }, sq));
        if (n === 1) squadre[0] = { nome: "La classe", colore: "#1E6B52", punti: 0 };
        partita();
      } } })))));
  ctx.leggi("Quante squadre giocano?");
  return () => { fermo = true; };
}

export const avvia = (area, es, ctx) => gioca(area, es, ctx, false);
export const avviaRuota = (area, es, ctx) => gioca(area, es, ctx, true);
