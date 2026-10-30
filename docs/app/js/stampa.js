// Le schede da stampare: ogni esercizio diventa un foglio in bianco e nero, da fare con la matita.
// Le figure di matematica si ridisegnano a linee (vanno bene anche con una stampante in bianco e nero);
// i pittogrammi si stampano in grigio. Nessun dato degli alunni: il nome si scrive a mano.

import { el, mescola, due, immaginePicto } from "./ui.js";
import { OPERAZIONI, PROPRIETA } from "./modello.js";

const NS = "http://www.w3.org/2000/svg";
function sv(tag, attr, ...figli) {
  const n = document.createElementNS(NS, tag);
  Object.entries(attr || {}).forEach(([k, v]) => n.setAttribute(k, v));
  figli.forEach(f => f && n.append(typeof f === "string" ? document.createTextNode(f) : f));
  return n;
}
const testo = (t, tag, classe) => el(tag || "span", { class: classe || "" }, due(String(t)));
const riga = "__________";
const cartaStampa = e => el("span", { class: "st-carta" }, e.p ? immaginePicto(e.p, e.t || "") : null, e.t ? testo(e.t) : null);
const casella = () => el("span", { class: "st-casella-x", "aria-hidden": "true", text: "☐" });

/* ---------- disegni a linee ---------- */
function puntiN(n) {
  // pallini in file da 10, come nel gioco
  const svg = sv("svg", { viewBox: "0 0 " + (Math.min(n, 10) * 26 + 6) + " " + (Math.ceil(n / 10) * 26 + 6), class: "st-disegno st-punti" });
  for (let i = 0; i < n; i++) svg.append(sv("circle", { cx: 16 + (i % 10) * 26 + (i % 10 >= 5 ? 0 : 0), cy: 16 + Math.floor(i / 10) * 26, r: 9, fill: "none", stroke: "#000", "stroke-width": 2 }));
  return svg;
}
function rettaStampa(x) {
  const L = 640, X = k => 20 + k * 60;
  const svg = sv("svg", { viewBox: "0 0 " + L + " 110", class: "st-disegno st-largo" }, sv("line", { x1: 4, x2: L - 4, y1: 60, y2: 60, stroke: "#000", "stroke-width": 3 }));
  for (let k = 0; k <= 10; k++) {
    const v = x.da + k * x.passo, scritto = k === 0 || k === 5 || k === 10;
    svg.append(sv("line", { x1: X(k), x2: X(k), y1: 48, y2: 72, stroke: "#000", "stroke-width": 3 }));
    if (scritto) svg.append(sv("text", { x: X(k), y: 98, "text-anchor": "middle", "font-size": 20, "font-weight": 700 }, String(v)));
    if (x.modo !== "trova" && v === x.a) svg.append(sv("path", { d: "M" + X(k) + ",40 l-10,-22 l20,0 Z", fill: "#000" }));
  }
  return svg;
}
function blocchiStampa(n) {
  const h = Math.floor(n / 100), d = Math.floor(n / 10) % 10, u = n % 10;
  const svg = sv("svg", { viewBox: "0 0 620 130", class: "st-disegno st-largo" });
  let x = 4;
  for (let i = 0; i < h; i++, x += 112) {
    svg.append(sv("rect", { x, y: 10, width: 100, height: 100, fill: "none", stroke: "#000", "stroke-width": 2 }));
    for (let j = 1; j < 10; j++) svg.append(sv("line", { x1: x + j * 10, x2: x + j * 10, y1: 10, y2: 110, stroke: "#000", "stroke-width": 0.6 }), sv("line", { x1: x, x2: x + 100, y1: 10 + j * 10, y2: 10 + j * 10, stroke: "#000", "stroke-width": 0.6 }));
  }
  for (let i = 0; i < d; i++, x += 16) {
    svg.append(sv("rect", { x, y: 10, width: 10, height: 100, fill: "none", stroke: "#000", "stroke-width": 2 }));
    for (let j = 1; j < 10; j++) svg.append(sv("line", { x1: x, x2: x + 10, y1: 10 + j * 10, y2: 10 + j * 10, stroke: "#000", "stroke-width": 0.6 }));
  }
  x += 8;
  for (let i = 0; i < u; i++) svg.append(sv("rect", { x: x + (i % 5) * 16, y: 80 + Math.floor(i / 5) * 16 - 16, width: 12, height: 12, fill: "none", stroke: "#000", "stroke-width": 2 }));
  svg.setAttribute("viewBox", "0 0 " + Math.max(200, x + 90) + " 130");
  return svg;
}
function frazioneStampa(x, colorate) {
  const svg = sv("svg", { viewBox: x.forma === "barra" ? "0 0 420 120" : "0 0 240 240", class: "st-disegno" + (x.forma === "barra" ? " st-largo" : "") });
  for (let k = 0; k < x.b; k++) {
    let p;
    if (x.forma === "barra") p = sv("rect", { x: 10 + k * 400 / x.b, y: 10, width: 400 / x.b, height: 100 });
    else {
      const r = 110, c = 120, a0 = -Math.PI / 2 + k * 2 * Math.PI / x.b, a1 = a0 + 2 * Math.PI / x.b;
      const pt = t => (c + r * Math.cos(t)).toFixed(1) + "," + (c + r * Math.sin(t)).toFixed(1);
      p = sv("path", { d: "M" + c + "," + c + " L" + pt(a0) + " A" + r + "," + r + " 0 0 1 " + pt(a1) + " Z" });
    }
    p.setAttribute("fill", k < colorate ? "#888" : "#fff");
    p.setAttribute("stroke", "#000");
    p.setAttribute("stroke-width", 3);
    svg.append(p);
  }
  return svg;
}
function lineeStampa(x) {
  const svg = sv("svg", { viewBox: "0 0 600 300", class: "st-disegno" });
  const g = sv("g", { transform: "rotate(" + (x.giro || 0) + " 300 150)" });
  svg.append(g);
  const linea = (x1, y1, x2, y2, tipo) => {
    const p = t => [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
    const tratto = (a, b, puntini) => { const [ax, ay] = p(a), [bx, by] = p(b); g.append(sv("line", { x1: ax, y1: ay, x2: bx, y2: by, stroke: "#000", "stroke-width": 4, "stroke-dasharray": puntini ? "2 10" : "none", "stroke-linecap": "round" })); };
    if (tipo === "segmento") tratto(0.12, 0.88); else { tratto(0.15, 0.85); tratto(0.85, 1, true); if (tipo === "retta") tratto(0, 0.15, true); }
    if (tipo === "segmento") [0.12, 0.88].forEach(t => g.append(sv("circle", { cx: p(t)[0], cy: p(t)[1], r: 7 })));
    if (tipo === "semiretta") g.append(sv("circle", { cx: p(0.15)[0], cy: p(0.15)[1], r: 7 }));
  };
  const curva = d => g.append(sv("path", { d, fill: "none", stroke: "#000", "stroke-width": 4, "stroke-linejoin": "round" }));
  ({
    segmento: () => linea(40, 150, 560, 150, "segmento"), semiretta: () => linea(40, 150, 560, 150, "semiretta"), retta: () => linea(40, 150, 560, 150, "retta"),
    curva: () => curva("M60,190 C160,30 250,40 300,150 S450,270 540,110"), spezzata: () => curva("M60,200 L170,90 L270,210 L380,80 L540,170"),
    mista: () => curva("M60,200 L170,90 L270,210 C320,40 470,40 540,170"),
    parallele: () => { linea(40, 100, 560, 100, "retta"); linea(40, 200, 560, 200, "retta"); },
    incidenti: () => { linea(60, 240, 540, 60, "retta"); linea(60, 80, 540, 220, "retta"); },
    perpendicolari: () => { linea(40, 150, 560, 150, "retta"); linea(300, 0, 300, 300, "retta"); }
  })[x.cosa]();
  return svg;
}
function angoloStampa(x) {
  const V = [300, 230], L = 230, rad = x.a * Math.PI / 180;
  const svg = sv("svg", { viewBox: "0 0 600 330", class: "st-disegno" });
  const g = sv("g", { transform: "rotate(" + (x.giro || 0) + " " + V[0] + " " + V[1] + ")" },
    sv("line", { x1: V[0], y1: V[1], x2: V[0] + L, y2: V[1], stroke: "#000", "stroke-width": 4 }),
    sv("line", { x1: V[0], y1: V[1], x2: (V[0] + L * Math.cos(rad)).toFixed(1), y2: (V[1] - L * Math.sin(rad)).toFixed(1), stroke: "#000", "stroke-width": 4 }),
    sv("path", { d: "M" + (V[0] + 50) + "," + V[1] + " A50,50 0 0 0 " + (V[0] + 50 * Math.cos(rad)).toFixed(1) + "," + (V[1] - 50 * Math.sin(rad)).toFixed(1), fill: "none", stroke: "#000", "stroke-width": 2 }));
  svg.append(g);
  return svg;
}
function quadrettiStampa(colonne, righe, piene, asse, rett) {
  const u = 30;
  const svg = sv("svg", { viewBox: "0 0 " + colonne * u + " " + righe * u, class: "st-disegno" });
  for (let i = 0; i <= colonne; i++) svg.append(sv("line", { x1: i * u, x2: i * u, y1: 0, y2: righe * u, stroke: "#999", "stroke-width": 1 }));
  for (let j = 0; j <= righe; j++) svg.append(sv("line", { x1: 0, x2: colonne * u, y1: j * u, y2: j * u, stroke: "#999", "stroke-width": 1 }));
  (piene || []).forEach(([r, c]) => svg.append(sv("rect", { x: c * u, y: r * u, width: u, height: u, fill: "#777" })));
  if (asse) svg.append(sv("line", { x1: asse * u, x2: asse * u, y1: 0, y2: righe * u, stroke: "#000", "stroke-width": 4, "stroke-dasharray": "8 6" }));
  if (rett) svg.append(sv("rect", { x: u, y: u, width: rett[0] * u, height: rett[1] * u, fill: "none", stroke: "#000", "stroke-width": 4 }));
  return svg;
}
const FORME = {
  cerchio: () => sv("circle", { cx: 30, cy: 30, r: 24 }), quadrato: () => sv("rect", { x: 8, y: 8, width: 44, height: 44 }),
  triangolo: () => sv("path", { d: "M30,5 L55,52 L5,52 Z" }), stella: () => sv("path", { d: "M30,4 L37,23 L57,23 L41,35 L47,55 L30,43 L13,55 L19,35 L3,23 L23,23 Z" }),
  cuore: () => sv("path", { d: "M30,54 C6,37 2,21 13,12 C22,6 29,12 30,18 C31,12 38,6 47,12 C58,21 54,37 30,54 Z" })
};
const GRIGI = ["#000", "#fff", "#999", "#d0d0d0", "#555"];
function figuraLogica(forma, grigio) {
  const f = FORME[forma]();
  f.setAttribute("fill", grigio);
  f.setAttribute("stroke", "#000");
  f.setAttribute("stroke-width", 3);
  return sv("svg", { viewBox: "0 0 60 60", class: "st-logica" }, f);
}
const SCHEMI_LOGICA = { AB: [0, 1], AAB: [0, 0, 1], ABB: [0, 1, 1], ABC: [0, 1, 2], AABB: [0, 0, 1, 1] };

/* ---------- un esercizio di matematica, a seconda del genere ---------- */
const caso = (da, a) => da + Math.floor(Math.random() * (a - da + 1));
const CONTI = {
  "amici-10": () => { const n = caso(0, 10); return n + " + ___ = 10"; }, "amici-100": () => { const n = caso(1, 9) * 10; return n + " + ___ = 100"; },
  doppi: () => "il doppio di " + caso(2, 25) + " = ___", meta: () => "la metà di " + caso(1, 25) * 2 + " = ___",
  "piu-meno-10": () => caso(10, 89) + (Math.random() < 0.5 ? " + 10" : " − 10") + " = ___", "piu-meno-100": () => caso(100, 899) + (Math.random() < 0.5 ? " + 100" : " − 100") + " = ___",
  "entro-20": () => { const a = caso(1, 19), b = caso(1, Math.random() < 0.5 ? 20 - a : a); return a + (a + b <= 20 && Math.random() < 0.5 ? " + " : " − ") + b + " = ___"; },
  tabelline: x => (x.n || caso(2, 10)) + " × " + caso(1, 10) + " = ___", divisioni: x => { const b = x.n || caso(2, 10); return b * caso(1, 10) + " : " + b + " = ___"; }
};
function matematica(x, oggetto) {
  const parti = [];
  const chiede = t => parti.push(el("p", { class: "st-chiede" }, testo(t)));
  const conto = t => parti.push(el("p", { class: "st-conto", text: t }));
  switch (x.genere) {
    case "conta": parti.push(puntiN(x.a)); chiede("Quanti sono? " + riga); break;
    case "confronta": parti.push(el("div", {}, puntiN(x.a), puntiN(x.b))); conto(x.a + "   ☐ <   ☐ >   ☐ =   " + x.b); break;
    case "prima-dopo": conto(x.verso === "dopo" ? x.a + " → ___" : "___ ← " + x.a); break;
    case "decine": conto(x.a + " = ___ da  ___ u"); break;
    case "operazione": conto(x.a + " " + OPERAZIONI[x.op] + " " + x.b + " = ___"); break;
    case "colonna": {
      const larghe = n => String(n).padStart(3, " ").split("");
      parti.push(el("table", { class: "st-colonna" }, el("tr", {}, ["", "h", "da", "u"].map(t => el("th", { text: t }))),
        el("tr", {}, el("td"), larghe(x.a).map(c => el("td", { text: c.trim() }))),
        el("tr", {}, el("td", { text: OPERAZIONI[x.op] }), larghe(x.b).map(c => el("td", { text: c.trim() }))),
        el("tr", { class: "st-risultato" }, el("td"), el("td"), el("td"), el("td"))));
      break;
    }
    case "proprieta": {
      const op = x.prop.includes("moltiplicazione") ? "×" : x.prop.includes("sottrazione") ? "−" : "+";
      conto(x.a + " " + op + " " + x.b + " = ___");
      chiede(PROPRIETA[x.prop].nome);
      break;
    }
    case "problema":
    case "barre":
      x.testo.forEach(t => parti.push(el("p", {}, testo(t))));
      if (x.genere === "barre") chiede("Disegna le barre:");
      parti.push(el("div", { class: "st-spazio" }));
      chiede("Operazione: " + riga + riga + "   Risposta: " + riga + riga);
      break;
    case "retta": parti.push(rettaStampa(x)); chiede(x.modo === "trova" ? "Segna con una X il numero " + x.a + "." : "Che numero indica la freccia? " + riga); break;
    case "blocchi":
      if (x.modo === "costruisci") { chiede("Disegna il numero " + x.a + " con i blocchi."); parti.push(el("div", { class: "st-spazio" })); conto(x.a + " = ___ h  ___ da  ___ u"); }
      else { parti.push(blocchiStampa(x.a)); conto("___ h  ___ da  ___ u  = " + riga); }
      break;
    case "frazione":
      parti.push(frazioneStampa(x, x.modo === "colora" ? 0 : x.a));
      chiede(x.modo === "colora" ? "Colora " + x.a + "/" + x.b + "." : "Che frazione è colorata? " + riga);
      break;
    case "linee": parti.push(lineeStampa(x)); chiede("Che cos'è? " + riga + riga); break;
    case "angolo": parti.push(angoloStampa(x)); chiede("☐ acuto   ☐ retto   ☐ ottuso   ☐ piatto"); break;
    case "simmetria": parti.push(quadrettiStampa(8, 6, x.celle, 4)); chiede("Colora a destra la parte simmetrica."); break;
    case "perimetro": parti.push(quadrettiStampa(x.a + 2, x.b + 2, null, 0, [x.a, x.b])); chiede("Perimetro = ___ + ___ + ___ + ___ = " + riga); break;
    case "veloce": parti.push(el("ol", { class: "st-conti" }, Array.from({ length: x.quante }, () => el("li", { text: CONTI[x.fatto](x) })))); break;
    case "logica": {
      const forme = mescola(Object.keys(FORME)), grigi = GRIGI;
      if (x.prova === "intruso") {
        const pezzi = [0, 1, 2, 3].map(k => x.per !== "colore" ? [k < 3 ? forme[0] : forme[1], grigi[k]] : [forme[k], k < 3 ? grigi[0] : grigi[2]]);
        parti.push(el("div", { class: "st-fila" }, mescola(pezzi).map(([f, g]) => figuraLogica(f, g))));
        chiede("Fai una X su quella che non c'entra.");
      } else {
        const motivo = SCHEMI_LOGICA[x.schema] || SCHEMI_LOGICA.AB;
        const pezzo = i => x.per !== "colore" ? [forme[i], "#fff"] : [forme[0], grigi[i]];
        const lunga = Math.max(motivo.length * 2 + 1, 6);
        parti.push(el("div", { class: "st-fila" }, Array.from({ length: lunga - 1 }, (_, k) => figuraLogica(...pezzo(motivo[k % motivo.length]))), el("span", { class: "st-vuoto", text: "?" })));
        chiede("Disegna quello che viene dopo.");
      }
      break;
    }
    default: break;
  }
  return el("li", { class: "st-esercizio" }, parti);
}

/* ---------- un foglio per esercizio ---------- */
function corpo(es) {
  const d = es.dati;
  switch (es.tipo) {
    case "coppie": {
      const destre = mescola(d.coppie.map(c => c[1]));
      return el("div", { class: "st-collega" },
        el("ul", { class: "st-colonna-carte" }, d.coppie.map(c => el("li", {}, cartaStampa(c[0]), el("span", { class: "st-pallino" })))),
        el("ul", { class: "st-colonna-carte" }, destre.map(c => el("li", {}, el("span", { class: "st-pallino" }), cartaStampa(c)))));
    }
    case "gruppi": {
      const tutte = mescola(d.gruppi.flatMap(g => g.elementi));
      return el("div", {}, el("p", { class: "st-banca" }, tutte.map(e => cartaStampa(e))),
        el("table", { class: "st-gruppi" }, el("tr", {}, d.gruppi.map(g => el("th", {}, cartaStampa(g.p ? { t: g.nome, p: g.p } : { t: g.nome })))),
          el("tr", {}, d.gruppi.map(() => el("td")))));
    }
    case "domande":
      return el("ol", { class: "st-domande" }, d.domande.map(q => el("li", {}, el("p", {}, cartaStampa(q.d)),
        el("p", { class: "st-opzioni" }, mescola([q.giusta].concat(q.sbagliate.slice(0, 2))).map(o => el("span", {}, casella(), cartaStampa(o)))))));
    case "sequenza":
      return el("div", {}, el("p", { class: "st-chiede", text: "Scrivi nel quadrato il numero: 1, 2, 3…" }),
        el("ul", { class: "st-sequenza" }, mescola(d.passi).map(p => el("li", {}, el("span", { class: "st-quadro" }), cartaStampa(p)))));
    case "frasi": {
      const parole = mescola(d.frasi.flatMap(f => (f.match(/\[[^\]]+\]/g) || []).map(p => p.slice(1, -1))).concat(d.extra || []));
      return el("div", {}, el("p", { class: "st-banca" }, parole.map(p => el("span", { class: "st-parola" }, testo(p)))),
        el("ol", { class: "st-frasi" }, d.frasi.map(f => el("li", {}, testo(f.replace(/\[[^\]]+\]/g, "______________"))))));
    }
    case "brano":
      return el("div", {}, d.f ? el("img", { src: "foto/" + d.f, alt: "", class: "st-foto" }) : null,
        el("div", { class: "st-brano" + (d.poesia ? " poesia" : "") }, d.testo.map(r => (r ? el("p", {}, testo(r)) : el("p", { class: "st-stacco" })))),
        [d.autore, d.opera].some(Boolean) ? el("p", { class: "st-fonte", text: "Tratto da: " + [d.autore, d.opera].filter(Boolean).join(", ") + (d.anno ? " (" + d.anno + ")" : "") }) : null,
        el("ol", { class: "st-domande" }, d.domande.map(q => el("li", {}, el("p", {}, testo(q.d)),
          el("p", { class: "st-opzioni" }, mescola([q.giusta].concat(q.sbagliate.slice(0, 2))).map(o => el("span", {}, casella(), testo(o))))))));
    case "lettura":
      return el("ol", { class: "st-domande" }, d.esercizi.map(x => {
        if (x.genere === "iniziale") return el("li", {}, cartaStampa({ p: x.p }), el("p", {}, "Con che lettera comincia? ", [x.giusta].concat(x.altre.slice(0, 3)).sort().map(l => el("span", { class: "st-lettera" }, casella(), testo(l)))));
        if (x.genere === "fusione") return el("li", {}, el("p", {}, testo(x.pezzi.join(" + ") + " = " + riga)));
        if (x.genere === "parola" || x.genere === "frase") return el("li", {}, cartaStampa({ p: x.p }), el("p", {}, mescola(x.pezzi.slice()).map(p => el("span", { class: "st-parola" }, testo(p)))), el("p", { text: "Scrivi: " + riga + riga + riga }));
        if (x.genere === "leggi") return el("li", {}, el("p", { class: "st-grande" }, testo(x.testo)), el("p", {}, "Fai una X sul disegno giusto: ", mescola([x.p].concat(x.altre)).map(p => cartaStampa({ p }))));
        return null;
      }));
    case "matematica":
      return el("ol", { class: "st-domande" }, d.esercizi.map(x => matematica(x, d.oggetto)));
    default:
      return el("p", { text: "Questo esercizio non si può stampare." });
  }
}

export function foglio(es) {
  return el("section", { class: "foglio s-" + (es.scrittura || "maiuscolo") },
    el("p", { class: "st-nome", text: "Nome ____________________________   Data ______________" }),
    el("h1", {}, testo(es.titolo)),
    es.consegna ? el("p", { class: "st-consegna" }, testo(es.consegna)) : null,
    corpo(es));
}

// stampa uno o più esercizi: un foglio per esercizio, dopo che le immagini sono arrivate
export async function stampa(lista) {
  document.getElementById("stampa")?.remove();
  const box = el("div", { id: "stampa" }, lista.map(foglio));
  document.body.append(box);
  await Promise.all([...box.querySelectorAll("img")].map(i => (i.decode ? i.decode().catch(() => {}) : null)));
  window.print();
}
