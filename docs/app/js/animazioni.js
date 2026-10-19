// Spiegazioni animate brevi, da guardare prima di un esercizio su un argomento nuovo.
// Ogni spiegazione è fatta di pochi passi: un disegno che si muove e una frase, letta ad alta voce.
// Le frasi sono state controllate una per una: semplici, ma senza semplificazioni che diventano errori.

import { el, pulsanteVoce } from "./ui.js";
import { parla, zitto } from "./voce.js";
import { impostazioni } from "./impostazioni.js";
import { movimentoRidotto } from "./scena.js";
import { ANIMAZIONI } from "./modello.js";

const NS = "http://www.w3.org/2000/svg";
function s(tag, attr, ...figli) {
  const n = document.createElementNS(NS, tag);
  Object.entries(attr || {}).forEach(([k, v]) => n.setAttribute(k, v));
  figli.flat(Infinity).forEach(f => f && n.append(typeof f === "string" ? document.createTextNode(f) : f));
  return n;
}
const scritta = (x, y, t, attr) => s("text", Object.assign({ x, y, "text-anchor": "middle", class: "sp-scritta" }, attr), t);
const etichetta = (x, y, t, misura) => scritta(x, y, t, { "font-size": misura || 22, "font-weight": 800, fill: "#1D2329",
  stroke: "#fff", "stroke-width": 6, "paint-order": "stroke", "stroke-linejoin": "round" });
const etichettaCielo = (x, y, t, misura) => scritta(x, y, t, { "font-size": misura || 18, "font-weight": 800, fill: "#fff",
  stroke: "#0B1020", "stroke-width": 5, "paint-order": "stroke", "stroke-linejoin": "round" });

// numeri «a caso» ma sempre uguali: le stelle non cambiano posto ogni volta che si apre la spiegazione
function dado(seme) {
  let x = seme;
  return () => (x = (x * 16807) % 2147483647) / 2147483647;
}
const vedi = (n, si) => { n.style.opacity = si ? 1 : 0; };
const anima = (n, si) => n.classList.toggle("sp-va", !!si);

function ciclo(fn) {
  let id = 0, attivo = true;
  const giro = t => { if (!attivo) return; fn(t); id = requestAnimationFrame(giro); };
  if (movimentoRidotto()) fn(0); else id = requestAnimationFrame(giro);
  return () => { attivo = false; cancelAnimationFrame(id); };
}

function cielo(svg, seme, quante) {
  const r = dado(seme);
  svg.append(s("rect", { width: 800, height: 450, fill: "#0B1020" }));
  const g = s("g", {});
  for (let i = 0; i < quante; i++) g.append(s("circle", { cx: (r() * 800).toFixed(1), cy: (r() * 450).toFixed(1), r: (0.4 + r() * 1.1).toFixed(2), fill: "#fff", opacity: (0.3 + r() * 0.6).toFixed(2) }));
  svg.append(g);
}

/* ---------- solidi, liquidi e gas ---------- */
const STATI = {
  passi: [
    "Tutte le cose sono fatte di particelle piccolissime, così piccole che non si vedono nemmeno con una lente.",
    "Nei SOLIDI le particelle sono vicinissime e ordinate: vibrano, ma restano al loro posto. Per questo un solido ha una forma sua.",
    "Nei LIQUIDI le particelle sono vicine ma scivolano l'una sull'altra: il liquido prende la forma del recipiente.",
    "Nei GAS le particelle sono lontane tra loro e si muovono veloci in tutte le direzioni: il gas occupa tutto lo spazio che trova.",
    "Se scaldiamo, le particelle si muovono di più: il ghiaccio fonde e diventa acqua, l'acqua evapora e diventa vapore."
  ],
  crea(svg) {
    const r = dado(7);
    svg.append(s("rect", { width: 800, height: 450, fill: "#EEF4F8" }));
    svg.append(s("defs", {}, s("marker", { id: "sp-punta", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto" },
      s("path", { d: "M0 0 L10 5 L0 10 Z", fill: "#E0332B" }))));
    const scatole = [["SOLIDO", "#9B7448"], ["LIQUIDO", "#2F8FD8"], ["GAS", "#8FA3B5"]].map(([nome, colore], k) => {
      const x = 40 + k * 250;
      const g = s("g", { class: "sp-sfuma" },
        s("rect", { x, y: 70, width: 220, height: 280, rx: 18, fill: "#fff", stroke: "#9AA8B4", "stroke-width": 4 }),
        scritta(x + 110, 395, nome, { "font-size": 30, "font-weight": 800, fill: "#1D2329" }));
      svg.append(g);
      return { g, x, colore, p: [] };
    });
    const [sol, liq, gas] = scatole;
    for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) sol.p.push({ bx: sol.x + 35 + i * 30, by: 328 - j * 30 });
    for (let i = 0; i < 26; i++) liq.p.push({ x: liq.x + 20 + r() * 180, y: 225 + r() * 105, vx: r() - .5, vy: r() - .5 });
    for (let i = 0; i < 9; i++) gas.p.push({ x: gas.x + 20 + r() * 180, y: 90 + r() * 240, vx: (r() - .5) * 7, vy: (r() - .5) * 7 });
    scatole.forEach(sc => sc.p.forEach(p => { p.n = s("circle", { r: 13, fill: sc.colore, stroke: "#fff", "stroke-width": 2 }); sc.g.append(p.n); }));
    const frecce = s("g", { class: "sp-sfuma" },
      s("path", { d: "M170 62 Q 275 8 380 62", fill: "none", stroke: "#E0332B", "stroke-width": 5, "marker-end": "url(#sp-punta)" }),
      s("path", { d: "M420 62 Q 525 8 630 62", fill: "none", stroke: "#E0332B", "stroke-width": 5, "marker-end": "url(#sp-punta)" }),
      etichetta(275, 30, "calore: fonde", 20), etichetta(525, 30, "calore: evapora", 20));
    svg.append(frecce);
    const dentro = (p, x0, x1, y0, y1) => {
      if (p.x < x0 || p.x > x1) { p.vx *= -1; p.x = Math.min(Math.max(p.x, x0), x1); }
      if (p.y < y0 || p.y > y1) { p.vy *= -1; p.y = Math.min(Math.max(p.y, y0), y1); }
    };
    const ferma = ciclo(t => {
      sol.p.forEach(p => { p.n.setAttribute("cx", p.bx + Math.sin(t / 45 + p.bx) * 2.2); p.n.setAttribute("cy", p.by + Math.cos(t / 40 + p.by) * 2.2); });
      liq.p.forEach(p => {
        p.vx = (p.vx + (r() - .5) * .35) * .96; p.vy = (p.vy + (r() - .5) * .35) * .96;
        p.x += p.vx; p.y += p.vy; dentro(p, liq.x + 16, liq.x + 204, 215, 334);
        p.n.setAttribute("cx", p.x); p.n.setAttribute("cy", p.y);
      });
      gas.p.forEach(p => { p.x += p.vx; p.y += p.vy; dentro(p, gas.x + 16, gas.x + 204, 86, 334); p.n.setAttribute("cx", p.x); p.n.setAttribute("cy", p.y); });
    });
    return {
      vai(k) {
        scatole.forEach((sc, i) => { sc.g.style.opacity = k >= 1 && k <= 3 && i !== k - 1 ? .3 : 1; });
        vedi(frecce, k === 4);
      },
      ferma
    };
  }
};

/* ---------- il ciclo dell'acqua ---------- */
const ACQUA = {
  passi: [
    "L'acqua della Terra non si consuma: si muove sempre, in un giro senza fine. È il ciclo dell'acqua.",
    "EVAPORAZIONE: il sole scalda l'acqua del mare, dei laghi e dei fiumi. L'acqua diventa vapore, che non si vede, e sale in alto.",
    "CONDENSAZIONE: in alto l'aria è fredda. Il vapore si raffredda e diventa tante goccioline piccolissime: si formano le nuvole.",
    "PRECIPITAZIONE: le goccioline si uniscono e diventano pesanti. Cadono come pioggia, oppure come neve o grandine quando fa molto freddo.",
    "L'acqua scorre nei fiumi e sotto terra e torna al mare. Il sole la scalda di nuovo, e il giro ricomincia!"
  ],
  crea(svg) {
    svg.append(s("defs", {}, s("linearGradient", { id: "sp-cielo", x1: 0, y1: 0, x2: 0, y2: 1 },
      s("stop", { offset: 0, "stop-color": "#9FD3F0" }), s("stop", { offset: 1, "stop-color": "#E8F6FC" }))));
    svg.append(s("rect", { width: 800, height: 450, fill: "url(#sp-cielo)" }));
    const sole = s("g", {}, s("g", { class: "sp-pulsa" },
      s("circle", { cx: 100, cy: 85, r: 40, fill: "#FFD23F" }),
      Array.from({ length: 8 }, (x, k) => {
        const a = k * Math.PI / 4;
        return s("line", { x1: 100 + Math.cos(a) * 52, y1: 85 + Math.sin(a) * 52, x2: 100 + Math.cos(a) * 70, y2: 85 + Math.sin(a) * 70, stroke: "#FFB800", "stroke-width": 6, "stroke-linecap": "round" });
      })));
    const mare = s("path", { d: "M0 330 Q 50 318 100 330 T 200 330 T 300 330 T 400 330 L 440 330 L 440 450 L 0 450 Z", fill: "#2F8FD8" });
    const terra = s("polygon", { points: "425,450 440,336 520,318 600,200 650,128 700,200 760,288 800,300 800,450", fill: "#74A85A" });
    const neve = s("polygon", { points: "619,175 650,128 681,175 666,167 650,180 634,167", fill: "#fff", class: "sp-sfuma" });
    const fiumeD = "M 652 190 C 640 240, 600 272, 560 300 S 480 334, 432 342";
    const fiume = s("g", {},
      s("path", { d: fiumeD, fill: "none", stroke: "#2F8FD8", "stroke-width": 10, "stroke-linecap": "round" }),
      s("path", { d: fiumeD, fill: "none", stroke: "#CFEAFF", "stroke-width": 3, "stroke-dasharray": "14 16", class: "sp-scorre" }));
    const vapore = s("g", { class: "sp-sfuma" }, Array.from({ length: 9 }, (x, k) =>
      s("path", { d: `M${60 + k * 40} 318 q 6 -8 0 -16 q -6 -8 0 -16`, fill: "none", stroke: "#fff", "stroke-width": 4, "stroke-linecap": "round",
        class: "sp-sale", style: "animation-delay:" + (k * 0.29).toFixed(2) + "s" })));
    const nuvola = s("g", { class: "sp-sfuma" }, s("g", { transform: "translate(540 78)" },
      [[0, 10, 34], [38, -6, 42], [80, 8, 34], [40, 22, 36]].map(([x, y, r]) => s("circle", { cx: x, cy: y, r, fill: "#fff", stroke: "#B8C7D3", "stroke-width": 3 })),
      s("rect", { x: -6, y: 8, width: 92, height: 34, fill: "#fff" })));
    const pioggia = s("g", { class: "sp-sfuma" }, Array.from({ length: 8 }, (x, k) =>
      s("line", { x1: 548 + k * 14, y1: 126, x2: 544 + k * 14, y2: 144, stroke: "#2F8FD8", "stroke-width": 4, "stroke-linecap": "round",
        class: "sp-cade", style: "animation-delay:" + ((k * 0.37) % 1.1).toFixed(2) + "s" })));
    const nomi = [
      etichetta(230, 270, "EVAPORAZIONE", 26), etichetta(580, 34, "CONDENSAZIONE", 26),
      etichetta(705, 252, "PRECIPITAZIONE", 22), etichetta(520, 425, "SCORRIMENTO", 24)
    ].map(n => { n.classList.add("sp-sfuma"); return n; });
    svg.append(sole, mare, terra, neve, fiume, vapore, nuvola, pioggia, ...nomi);
    return {
      vai(k) {
        anima(sole, k === 1);
        vedi(vapore, k === 1 || k === 2);
        vedi(nuvola, k >= 2);
        vedi(pioggia, k === 3);
        vedi(neve, k >= 3);
        anima(fiume, k === 4);
        nomi.forEach((n, i) => vedi(n, k === 4 || k === i + 1));
      },
      ferma() {}
    };
  }
};

/* ---------- dal seme al frutto ---------- */
const PIANTA = {
  passi: [
    "Dentro il seme c'è una piccola pianta che aspetta, con una scorta di cibo. Per nascere ha bisogno di acqua, aria e del giusto calore.",
    "GERMINAZIONE: il seme si gonfia d'acqua e si apre. Prima esce la radice, che scende nel terreno; poi il germoglio, che sale verso la luce.",
    "La pianta cresce: il fusto si allunga e spuntano le foglie. Con la luce del sole, le foglie producono il nutrimento per tutta la pianta.",
    "Arriva il FIORE. Gli insetti, come le api, portano il polline da un fiore all'altro: così il fiore può diventare frutto.",
    "Il fiore si trasforma in FRUTTO. Dentro il frutto ci sono i semi: da ogni seme può nascere una nuova pianta."
  ],
  crea(svg) {
    svg.append(s("rect", { width: 800, height: 450, fill: "#EAF6FF" }));
    svg.append(s("rect", { y: 330, width: 800, height: 120, fill: "#8B5E3C" }));
    const sole = s("g", { class: "sp-sfuma" }, s("circle", { cx: 700, cy: 70, r: 36, fill: "#FFD23F" }));
    const gocce = s("g", { class: "sp-sfuma" }, [340, 400, 460].map((x, k) =>
      s("path", { d: `M${x} 240 q 9 14 0 20 q -9 -6 0 -20 z`, fill: "#2F8FD8", class: "sp-cade", style: "animation-delay:" + (k * 0.35) + "s" })));
    const seme = s("ellipse", { cx: 400, cy: 372, rx: 18, ry: 11, fill: "#C99A5B", stroke: "#7A5530", "stroke-width": 3, class: "sp-sfuma" });
    const traccia = (d, colore, spessore) => s("path", { d, fill: "none", stroke: colore, "stroke-width": spessore, "stroke-linecap": "round", pathLength: 1, class: "sp-traccia" });
    const radici = traccia("M400 380 C 398 400, 386 418, 372 440 M400 380 C 404 402, 416 418, 432 438 M400 382 L 401 446", "#F1E3C6", 5);
    const fusto = traccia("M400 364 C 398 300, 404 230, 400 162", "#3C9A3C", 9);
    const foglia = (x, y, a) => s("g", { transform: `translate(${x} ${y}) rotate(${a})` },
      s("path", { d: "M0 0 C 20 -18, 50 -18, 66 0 C 50 18, 20 18, 0 0 Z", fill: "#4CB050", class: "sp-cresce" }));
    const foglie = [foglia(399, 270, 200), foglia(401, 232, -20), foglia(399, 200, 205)];
    const fiore = s("g", { transform: "translate(400 150)" }, s("g", { class: "sp-cresce" },
      Array.from({ length: 6 }, (x, k) => s("circle", { cx: Math.cos(k * Math.PI / 3) * 20, cy: Math.sin(k * Math.PI / 3) * 20, r: 16, fill: "#F38BB5" })),
      s("circle", { r: 13, fill: "#FFD23F" })));
    const ape = s("g", { class: "sp-sfuma" }, s("g", { transform: "translate(400 120)" }, s("g", { class: "sp-ronza" },
      s("ellipse", { cx: -4, cy: -12, rx: 8, ry: 6, fill: "#fff", opacity: .9 }), s("ellipse", { cx: 6, cy: -12, rx: 8, ry: 6, fill: "#fff", opacity: .9 }),
      s("ellipse", { rx: 13, ry: 9, fill: "#FFD23F", stroke: "#1D2329", "stroke-width": 2 }),
      s("line", { x1: -3, y1: -8, x2: -3, y2: 8, stroke: "#1D2329", "stroke-width": 3 }), s("line", { x1: 4, y1: -8, x2: 4, y2: 8, stroke: "#1D2329", "stroke-width": 3 }))));
    const frutto = s("g", { transform: "translate(400 158)" }, s("g", { class: "sp-cresce" },
      s("path", { d: "M2 -36 q 10 -16 26 -12 q -10 12 -26 12", fill: "#4CB050" }),
      s("circle", { r: 38, fill: "#E0332B" }), s("circle", { r: 29, fill: "#FFF4D6" }),
      [[-8, -6, -30], [8, -6, 30], [-8, 8, 30], [8, 8, -30]].map(([x, y, a]) => s("ellipse", { cx: x, cy: y, rx: 4, ry: 7, fill: "#5A3A1E", transform: `rotate(${a} ${x} ${y})` }))));
    const nomi = [etichetta(400, 300, "SEME"), etichetta(530, 400, "RADICE"), etichetta(520, 240, "FOGLIE"), etichetta(530, 160, "FIORE"), etichetta(530, 165, "FRUTTO")]
      .map(n => { n.classList.add("sp-sfuma"); return n; });
    svg.append(sole, gocce, radici, fusto, ...foglie, seme, fiore, ape, frutto, ...nomi);
    const cresci = (n, si) => n.querySelector(".sp-cresce").classList.toggle("sp-grande", !!si);
    return {
      vai(k) {
        vedi(gocce, k === 0);
        vedi(sole, k >= 2);
        seme.style.opacity = k <= 1 ? 1 : 0.35;
        radici.style.strokeDashoffset = k >= 1 ? 0 : 1;
        fusto.style.strokeDashoffset = k >= 2 ? 0 : k === 1 ? 0.88 : 1;
        foglie.forEach(f => cresci(f, k >= 2));
        cresci(fiore, k === 3);
        vedi(ape, k === 3);
        cresci(frutto, k === 4);
        nomi.forEach((n, i) => vedi(n, i === k));
      },
      ferma() {}
    };
  }
};

/* ---------- il sistema solare ---------- */
// nome, distanza (raggio dell'orbita nel disegno), grandezza, colore: né le distanze né le grandezze sono in scala
const PIANETI = [
  ["MERCURIO", 58, 4, "#B5A28A"], ["VENERE", 82, 6, "#E8C47C"], ["TERRA", 108, 6.5, "#3E8EDE"], ["MARTE", 134, 5, "#D2553A"],
  ["GIOVE", 185, 14, "#D9A066"], ["SATURNO", 240, 11, "#E3C77A"], ["URANO", 300, 9, "#8FD6E0"], ["NETTUNO", 355, 9, "#4169E1"]
];

function sistemaSolare(g, cx, cy, schiaccia, conNomi) {
  g.append(s("circle", { cx, cy, r: 46, fill: "#FFC93C", opacity: .25 }), s("circle", { cx, cy, r: 30, fill: "#FFC93C" }));
  return PIANETI.map(([nome, rx, r, colore], k) => {
    g.append(s("ellipse", { cx, cy, rx, ry: rx * schiaccia, fill: "none", stroke: "#fff", "stroke-opacity": .22, "stroke-width": 1.5 }));
    const p = s("g", {}, s("circle", { r, fill: colore }),
      nome === "SATURNO" ? s("ellipse", { rx: r * 2.1, ry: r * .6, fill: "none", stroke: "#E3C77A", "stroke-width": 2.5 }) : null,
      conNomi ? etichettaCielo(0, r + 18, nome, 15) : null);
    g.append(p);
    return { p, rx, ry: rx * schiaccia, cx, cy, a: k * 2.1, w: (2 * Math.PI / 8000) * Math.pow(108 / rx, 1.5), nome: p.lastChild };
  });
}
const metti = (q, a) => q.p.setAttribute("transform", `translate(${(q.cx + Math.cos(a) * q.rx).toFixed(1)} ${(q.cy + Math.sin(a) * q.ry).toFixed(1)})`);

function giornoNotte(g) {
  g.append(s("defs", {}, s("clipPath", { id: "sp-globo" }, s("circle", { cx: 520, cy: 225, r: 120 }))));
  g.append(s("circle", { cx: 110, cy: 225, r: 62, fill: "#FFC93C" }), etichettaCielo(110, 325, "SOLE", 22));
  for (let k = 0; k < 5; k++) g.append(s("line", { x1: 190, y1: 145 + k * 40, x2: 380, y2: 145 + k * 40, stroke: "#FFE58A", "stroke-width": 3, "stroke-dasharray": "10 10", opacity: .7 }));
  const terre = s("g", {});
  const continenti = "M0 -60 c 30 -20 70 -10 80 20 c 10 30 -30 40 -20 70 c 8 25 -20 45 -45 30 c -30 -20 -45 -60 -15 -120 z " +
    "M150 -90 c 40 -10 70 10 60 40 c -10 30 -50 20 -70 0 c -15 -15 -5 -35 10 -40 z M140 10 c 30 0 50 30 40 60 c -10 30 -40 30 -50 0 c -8 -25 -10 -55 10 -60 z";
  for (let k = -1; k <= 2; k++) terre.append(s("path", { d: continenti, fill: "#5FAE4E", transform: `translate(${k * 260} 0)` }));
  const globo = s("g", { "clip-path": "url(#sp-globo)" }, s("circle", { cx: 520, cy: 225, r: 120, fill: "#2F7FD1" }), s("g", { transform: "translate(400 225)" }, terre),
    s("path", { d: "M520 105 A 120 120 0 0 1 520 345 Z", fill: "#04081A", opacity: .72 }));
  g.append(globo, etichettaCielo(450, 380, "GIORNO", 22), etichettaCielo(600, 380, "NOTTE", 22));
  return terre;
}

const SISTEMA = {
  passi: [
    "Il SOLE è una stella: un'enorme palla di gas caldissimo. Ci dà luce e calore.",
    "Intorno al Sole girano otto pianeti. I quattro più vicini sono piccoli e rocciosi: Mercurio, Venere, Terra e Marte.",
    "Più lontano ci sono i quattro pianeti giganti, fatti soprattutto di gas e di ghiaccio: Giove, Saturno con i suoi anelli, Urano e Nettuno.",
    "La Terra è il terzo pianeta dal Sole. Fa un giro completo intorno al Sole in un anno.",
    "Intanto la Terra gira su sé stessa: un giro ogni giorno. La metà rivolta verso il Sole ha il giorno, l'altra metà ha la notte."
  ],
  crea(svg) {
    cielo(svg, 11, 90);
    const sistema = s("g", { class: "sp-sfuma" });
    const pianeti = sistemaSolare(sistema, 400, 225, 0.42, true);
    const qui = s("g", {}, s("circle", { r: 14, fill: "none", stroke: "#FFD23F", "stroke-width": 3 }), etichettaCielo(0, -22, "SEI QUI", 16));
    sistema.append(qui, etichettaCielo(600, 438, "Grandezze e distanze non sono in scala", 13));
    const gn = s("g", { class: "sp-sfuma" });
    const terre = giornoNotte(gn);
    svg.append(sistema, gn);
    let passo = 0;
    const ferma = ciclo(t => {
      pianeti.forEach(q => metti(q, q.a - q.w * t));   // visti da sopra il polo nord girano in senso antiorario
      const terra = pianeti[2];
      qui.setAttribute("transform", terra.p.getAttribute("transform"));
      terre.setAttribute("transform", `translate(${((t / 40) % 260).toFixed(1)} 0)`);
    });
    return {
      vai(k) {
        passo = k;
        vedi(sistema, k < 4);
        vedi(gn, k === 4);
        pianeti.forEach((q, i) => {
          const visibile = k === 0 ? false : k === 1 ? i < 4 : k === 2 ? i >= 4 : i === 2;
          q.nome.style.opacity = visibile ? 1 : 0;
          q.p.style.opacity = k === 0 ? .35 : 1;
        });
        vedi(qui, passo === 3);
      },
      ferma
    };
  }
};

/* ---------- dove siamo nell'universo ---------- */
function spirale(g, cx, cy, R, braccia, punti, rnd, schiaccia, ruota) {
  const pos = (u, b, dx, dy) => {
    const th = u * 3.4 + b * (2 * Math.PI / braccia) + ruota;
    const r = R * (0.16 + 0.84 * u);
    const x = Math.cos(th) * r + dx, y = Math.sin(th) * r + dy;
    return [cx + x, cy + y * schiaccia];
  };
  g.append(s("ellipse", { cx, cy, rx: R * .2, ry: R * .2 * schiaccia, fill: "#FFE9B0", opacity: .9 }));
  g.append(s("ellipse", { cx, cy, rx: R * .34, ry: R * .34 * schiaccia, fill: "#FFE9B0", opacity: .25 }));
  const colori = ["#FFFFFF", "#CFE3FF", "#FFF2C8", "#AFC8FF"];
  for (let i = 0; i < punti; i++) {
    const u = rnd(), spessore = R * 0.09 * (0.6 + u);
    const [x, y] = pos(u, i % braccia, (rnd() - .5) * spessore, (rnd() - .5) * spessore);
    g.append(s("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r: (0.5 + rnd() * R / 170).toFixed(2), fill: colori[i % 4], opacity: (0.45 + rnd() * .55).toFixed(2) }));
  }
  return pos;
}

const UNIVERSO = {
  passi: [
    { t: "Questa è la Terra, il pianeta dove viviamo, vista dallo spazio. Fa un giro su sé stessa ogni giorno.", video: "terra-che-gira.webm" },
    "La Terra è uno degli otto pianeti che girano intorno al Sole. Il Sole e i suoi pianeti formano il SISTEMA SOLARE.",
    "Il Sole è una delle centinaia di miliardi di stelle della VIA LATTEA, la nostra galassia. Sta in un braccio della spirale, a circa 26.000 anni luce dal centro. Un anno luce è la strada che fa la luce in un anno!",
    "La Via Lattea fa parte di un gruppo di più di 80 galassie, quasi tutte piccole: il GRUPPO LOCALE. La galassia grande più vicina a noi è Andromeda, a circa 2 milioni e mezzo di anni luce.",
    "Il Gruppo Locale si trova ai margini di un insieme enorme di circa centomila galassie: LANIAKEA. In lingua hawaiana Laniakea vuol dire «cielo immenso».",
    "Ecco il nostro indirizzo nell'universo: Terra, Sistema solare, Via Lattea, Gruppo Locale, Laniakea."
  ],
  crea(svg) {
    cielo(svg, 23, 70);
    const rnd = dado(42);
    const scene = [], centri = [];
    scene[0] = s("g", {});
    centri[0] = [400, 225];

    // il sistema solare, fermo, con la Terra segnata
    const sistema = s("g", {});
    const pianeti = sistemaSolare(sistema, 400, 225, 0.42, false);
    pianeti.forEach(q => metti(q, q.a));
    const terra = pianeti[2];
    const tx = terra.cx + Math.cos(terra.a) * terra.rx, ty = terra.cy + Math.sin(terra.a) * terra.ry;
    sistema.append(s("circle", { cx: tx, cy: ty, r: 14, fill: "none", stroke: "#FFD23F", "stroke-width": 3 }),
      etichettaCielo(tx, ty - 22, "TERRA", 16), etichettaCielo(400, 40, "IL SISTEMA SOLARE", 26));
    scene[1] = sistema; centri[1] = [tx, ty];

    // la Via Lattea, con il Sole in un braccio
    const via = s("g", {});
    const pos = spirale(via, 400, 225, 190, 4, 1100, rnd, 0.62, 0);
    const [sx, sy] = pos(0.43, 1, 0, 0);   // il Sole è a circa metà strada tra il centro e il bordo
    via.append(s("circle", { cx: sx, cy: sy, r: 11, fill: "none", stroke: "#FFD23F", "stroke-width": 3 }),
      etichettaCielo(sx, sy - 18, "IL SOLE È QUI", 16), etichettaCielo(400, 36, "LA VIA LATTEA", 26));
    scene[2] = via; centri[2] = [sx, sy];

    // il Gruppo Locale
    const gruppo = s("g", {});
    spirale(gruppo, 260, 270, 46, 4, 260, rnd, 0.62, 0);
    const andro = s("g", { transform: "rotate(-32 560 170)" });
    spirale(andro, 560, 170, 70, 2, 360, rnd, 0.32, 1);
    gruppo.append(andro);
    spirale(gruppo, 640, 330, 22, 2, 90, rnd, 0.7, 2);
    for (let i = 0; i < 70; i++) {
      const vicino = i % 2 ? [260, 270] : [560, 170];
      const a = rnd() * 6.28, d = 40 + rnd() * 120;
      gruppo.append(s("circle", { cx: (vicino[0] + Math.cos(a) * d).toFixed(1), cy: (vicino[1] + Math.sin(a) * d * .7).toFixed(1), r: (0.8 + rnd() * 1.6).toFixed(2), fill: "#DCE6FF", opacity: .7 }));
    }
    gruppo.append(s("line", { x1: 300, y1: 250, x2: 520, y2: 185, stroke: "#FFD23F", "stroke-width": 2, "stroke-dasharray": "6 6" }),
      etichettaCielo(420, 202, "circa 2,5 milioni di anni luce", 14),
      s("circle", { cx: 260, cy: 270, r: 52, fill: "none", stroke: "#FFD23F", "stroke-width": 3 }),
      etichettaCielo(260, 345, "VIA LATTEA", 17), etichettaCielo(600, 250, "ANDROMEDA", 17), etichettaCielo(640, 372, "TRIANGOLO", 15),
      etichettaCielo(400, 36, "IL GRUPPO LOCALE", 26));
    scene[3] = gruppo; centri[3] = [260, 270];

    // Laniakea: filamenti di galassie che vanno verso il centro
    const lani = s("g", {});
    const [ox, oy] = [400, 225];
    let gx = 0, gy = 0;
    for (let f = 0; f < 26; f++) {
      const a = f / 26 * 6.283 + rnd() * .2, R = 170 + rnd() * 70;
      const x0 = ox + Math.cos(a) * R * 1.55, y0 = oy + Math.sin(a) * R * .82;
      const qx = ox + Math.cos(a + .7) * R * .8, qy = oy + Math.sin(a + .7) * R * .45;
      for (let i = 0; i < 46; i++) {
        const t = i / 46, u = 1 - t;
        const x = u * u * x0 + 2 * u * t * qx + t * t * ox + (rnd() - .5) * 14, y = u * u * y0 + 2 * u * t * qy + t * t * oy + (rnd() - .5) * 10;
        lani.append(s("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r: (0.6 + rnd() * 1.5).toFixed(2), fill: i % 3 ? "#BFD4FF" : "#FFF2C8", opacity: (0.4 + rnd() * .5).toFixed(2) }));
        if (f === 4 && i === 5) { gx = x; gy = y; }
      }
    }
    lani.append(s("circle", { cx: ox, cy: oy, r: 26, fill: "#FFE9B0", opacity: .22 }),
      s("circle", { cx: gx, cy: gy, r: 10, fill: "none", stroke: "#FFD23F", "stroke-width": 3 }),
      etichettaCielo(gx, gy + 28, "NOI: IL GRUPPO LOCALE", 15), etichettaCielo(400, 36, "LANIAKEA", 28));
    scene[4] = lani; centri[4] = [gx, gy];

    // l'indirizzo: cerchi uno dentro l'altro
    const indirizzo = s("g", {});
    const anelli = [[196, "LANIAKEA", "#6C4DB3"], [150, "GRUPPO LOCALE", "#3D5BB8"], [106, "VIA LATTEA", "#2E7FB8"], [64, "SISTEMA SOLARE", "#E0A63A"], [26, "TERRA", "#2F8F5A"]];
    anelli.forEach(([r, nome, colore]) => indirizzo.append(s("circle", { cx: 400, cy: 232, r, fill: colore, stroke: "#fff", "stroke-width": 3, opacity: .92 })));
    anelli.forEach(([r, nome]) => indirizzo.append(etichettaCielo(400, r === 26 ? 238 : 232 - r + 26, nome, r === 26 ? 13 : 17)));
    scene[5] = indirizzo; centri[5] = [400, 232];

    scene.forEach(g => { g.classList.add("sp-sfuma"); svg.append(g); });
    return {
      vai(k, prima) {
        scene.forEach((g, i) => vedi(g, i === k));
        const g = scene[k];
        if (k === prima + 1 && k >= 2 && k <= 4 && g.animate && !movimentoRidotto()) {
          const [mx, my] = centri[k];
          g.animate([{ transform: `translate(${mx}px, ${my}px) scale(7) translate(${-mx}px, ${-my}px)`, opacity: 0 },
            { transform: "none", opacity: 1 }], { duration: 1600, easing: "cubic-bezier(.2,.7,.2,1)" });
        }
      },
      ferma() {}
    };
  }
};

const SPIEGAZIONI = { "stati-materia": STATI, "ciclo-acqua": ACQUA, pianta: PIANTA, "sistema-solare": SISTEMA, universo: UNIVERSO };

// Un video di YouTube si carica solo quando qualcuno lo chiede: prima non parte nessuna richiesta.
function videoYoutube(id) {
  const box = el("div", { class: "sp-yt" },
    el("button", { type: "button", class: "pulsante", text: "▶ Carica il video", on: { click: () => {
      box.replaceChildren(el("iframe", { src: "https://www.youtube-nocookie.com/embed/" + id + "?rel=0", title: "Video",
        allow: "autoplay; encrypted-media; picture-in-picture", allowfullscreen: true, referrerpolicy: "strict-origin-when-cross-origin" }));
    } } }),
    el("small", { text: "Il video arriva da YouTube: quando lo carichi, YouTube riceve i dati della connessione." }));
  return box;
}

// scopri: { animazione, youtube }; fine: si chiama quando si passa all'esercizio.
export function spiegazione(scopri, fine) {
  const a = SPIEGAZIONI[scopri.animazione] || null;
  const passi = a ? a.passi.map(p => (typeof p === "string" ? { t: p } : p)) : [];
  if (scopri.youtube) passi.push({ t: "Guarda anche questo video.", youtube: scopri.youtube });
  const svg = s("svg", { viewBox: "0 0 800 450", class: "sp-svg", role: "img", "aria-label": ANIMAZIONI[scopri.animazione] || "Video" });
  const ctrl = a ? a.crea(svg) : { vai() {}, ferma() {} };
  const scena = el("div", { class: "sp-scena" }, svg);
  const testo = el("p", { class: "sp-testo", "aria-live": "polite" });
  const punti = el("div", { class: "punti", "aria-hidden": "true" }, passi.map(() => el("span")));
  let i = -1, extra = null;
  const indietro = el("button", { type: "button", class: "tasto", text: "◀", "aria-label": "Indietro", on: { click: () => vai(i - 1) } });
  const avanti = el("button", { type: "button", class: "pulsante", on: { click: () => (i < passi.length - 1 ? vai(i + 1) : chiudi()) } });

  function vai(k) {
    if (k < 0 || k >= passi.length) return;
    const prima = i;
    i = k;
    const p = passi[k];
    if (extra) { extra.remove(); extra = null; }
    svg.style.display = p.video || p.youtube ? "none" : "";
    if (p.video) {
      extra = el("video", { src: "video/" + p.video, autoplay: true, loop: true, playsinline: true, "aria-hidden": "true" });
      extra.muted = true;
      scena.append(extra);
    } else if (p.youtube) {
      extra = videoYoutube(p.youtube);
      scena.append(extra);
    }
    ctrl.vai(k, prima);
    testo.textContent = p.t;
    Array.from(punti.children).forEach((x, j) => { x.className = j < k ? "fatto" : j === k ? "ora" : ""; });
    indietro.disabled = k === 0;
    avanti.textContent = k === passi.length - 1 ? "Inizia l'esercizio ▶" : "Avanti ▶";
    if (impostazioni.voce) parla(p.t);
  }
  function ferma() {
    ctrl.ferma();
    zitto();
    if (extra) extra.remove();
  }
  function chiudi() {
    ferma();
    fine();
  }
  return {
    el: el("div", { class: "spiegazione" }, scena, testo,
      el("div", { class: "sp-comandi" }, indietro, pulsanteVoce(() => (passi[i] ? passi[i].t : ""), "Ascolta"), avanti),
      punti,
      el("button", { type: "button", class: "tasto-piccolo", text: "Salta la spiegazione ▶▶", on: { click: chiudi } })),
    parti: () => vai(0),
    ferma
  };
}
