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

/* ---------- immagini dentro i disegni ---------- */
const picto = id => "https://static.arasaac.org/pictograms/" + id + "/" + id + "_300.png";
const figura = (href, x, y, w, h) => s("image", { href, x, y, width: w, height: h, preserveAspectRatio: "xMidYMid meet" });

/* ---------- le fonti storiche ---------- */
const FONTI = {
  passi: [
    "Come facciamo a sapere che cosa è successo tanto tempo fa? Lo storico fa come un detective: cerca e studia le tracce del passato. Queste tracce si chiamano FONTI.",
    "Le FONTI ORALI sono i racconti e i ricordi delle persone, come quelli dei nonni.",
    "Le FONTI SCRITTE sono tutto quello che è scritto: lettere, libri, documenti, scritte sulla pietra o sull'argilla.",
    "Le IMMAGINI sono disegni, pitture e fotografie, come le pitture che gli uomini preistorici facevano nelle caverne.",
    "Gli OGGETTI sono le cose costruite e usate dalle persone: vasi, attrezzi, monete, case.",
    "I RESTI sono quello che rimane degli esseri viventi: fossili, ossa, scheletri, impronte.",
    "Lo storico confronta tante fonti diverse: così ricostruisce il passato nel modo più vicino possibile al vero."
  ],
  crea(svg) {
    svg.append(s("rect", { width: 800, height: 450, fill: "#FFF8EC" }));
    const storico = s("g", {}, figura(picto(9191), 20, 120, 210, 260), etichetta(125, 410, "LO STORICO", 22));
    const lente = s("g", { class: "sp-sfuma" }, s("g", { class: "sp-cerca" }, figura(picto(9927), 0, 0, 90, 90)));
    lente.setAttribute("transform", "translate(400 170)");
    const dati = [
      ["FONTI ORALI", picto(23718), 265, 30], ["FONTI SCRITTE", "foto/tavoletta-cuneiforme.jpg", 440, 30], ["IMMAGINI", "foto/pittura-rupestre.jpg", 615, 30],
      ["OGGETTI", "foto/anfora-greca.jpg", 352, 240], ["RESTI", picto(34254), 527, 240]
    ];
    const fili = s("g", { class: "sp-sfuma" }, dati.map(([n, h, x, y]) =>
      s("line", { x1: 205, y1: 230, x2: x, y2: y + 85, stroke: "#B7793F", "stroke-width": 3, "stroke-dasharray": "8 8" })));
    const carte = dati.map(([nome, href, x, y]) => s("g", { class: "sp-sfuma" },
      s("rect", { x, y, width: 160, height: 180, rx: 16, fill: "#fff", stroke: "#DDD5C3", "stroke-width": 3, class: "sp-bordo" }),
      figura(href, x + 15, y + 12, 130, 120),
      scritta(x + 80, y + 162, nome, { "font-size": 17, "font-weight": 800, fill: "#1D2329" })));
    svg.append(fili, storico, ...carte, lente);
    return {
      vai(k) {
        vedi(lente, k === 0);
        vedi(fili, k === 6);
        carte.forEach((c, i) => {
          c.style.opacity = k === 0 ? .15 : k === 6 || i + 1 === k ? 1 : i + 1 < k ? .4 : 0;
          c.querySelector(".sp-bordo").setAttribute("stroke", i + 1 === k ? "#F2B705" : "#DDD5C3");
          c.querySelector(".sp-bordo").setAttribute("stroke-width", i + 1 === k ? 6 : 3);
        });
      },
      ferma() {}
    };
  }
};

/* ---------- la linea del tempo ---------- */
const LINEA = {
  passi: [
    "La LINEA DEL TEMPO mette in ordine i fatti: a sinistra quello che è successo PRIMA, a destra quello che è successo DOPO.",
    "Per contare gli anni partiamo da un fatto importante: la NASCITA DI CRISTO. È il modo di contare usato in Italia e in gran parte del mondo.",
    "Gli anni DOPO la nascita di Cristo si scrivono d.C. e si contano in avanti: 100, 500, 1000, 2000… fino a oggi.",
    "Gli anni PRIMA della nascita di Cristo si scrivono a.C. e si contano all'indietro: più il numero è grande, più il fatto è antico. Il 3000 a.C. è più antico del 500 a.C.!",
    "Per esempio: secondo la tradizione Roma nasce nel 753 a.C., e il Colosseo si apre nell'80 d.C. La nascita di Roma viene molto prima.",
    "Cento anni fanno un SECOLO e mille anni un MILLENNIO. E attenzione: contando gli anni avanti e dopo Cristo, l'anno zero non esiste! Dopo l'anno 1 a.C. viene subito l'anno 1 d.C."
  ],
  crea(svg) {
    svg.append(s("rect", { width: 800, height: 450, fill: "#FFF8EC" }));
    svg.append(s("defs", {}, s("marker", { id: "sp-punta-lt", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto" },
      s("path", { d: "M0 0 L10 5 L0 10 Z", fill: "#1D2329" }))));
    const X = anno => 472 + anno * 0.144;     // da 3000 a.C. (x 40) a 2000 d.C. (x 760)
    const riga = s("line", { x1: 30, y1: 260, x2: 778, y2: 260, stroke: "#1D2329", "stroke-width": 6, "marker-end": "url(#sp-punta-lt)" });
    const ordine = s("g", { class: "sp-sfuma" },
      figura(picto(2275), 90, 120, 110, 110), figura(picto(7176), 345, 110, 110, 120), figura(picto(39006), 600, 100, 110, 130),
      etichetta(80, 310, "◀ PRIMA", 26), etichetta(720, 310, "DOPO ▶", 26));
    const cristo = s("g", { class: "sp-sfuma" },
      s("rect", { x: X(0) - 4, y: 215, width: 8, height: 90, rx: 4, fill: "#1D2329" }),
      etichetta(X(0), 200, "NASCITA DI CRISTO", 22));
    // le tacche dei 500 anni scendono di una riga, così le scritte non si toccano
    const tacca = (anno, testo) => s("g", {},
      s("line", { x1: X(anno), y1: 250, x2: X(anno), y2: Math.abs(anno) === 500 ? 300 : 272, stroke: "#1D2329", "stroke-width": 3 }),
      scritta(X(anno), Math.abs(anno) === 500 ? 320 : 296, testo, { "font-size": 16, "font-weight": 700, fill: "#1D2329" }));
    const dopo = s("g", { class: "sp-sfuma" },
      s("rect", { x: X(0), y: 254, width: 760 - X(0), height: 12, fill: "#1E6B52" }),
      tacca(500, "500 d.C."), tacca(1000, "1000 d.C."), tacca(2000, "2000 d.C."), etichetta(752, 236, "OGGI", 16));
    const notaDopo = s("g", { class: "sp-sfuma" }, etichetta(670, 370, "si conta in avanti ▶", 20));
    const prima = s("g", { class: "sp-sfuma" },
      s("rect", { x: 40, y: 254, width: X(0) - 40, height: 12, fill: "#B7793F" }),
      tacca(-3000, "3000 a.C."), tacca(-2000, "2000 a.C."), tacca(-1000, "1000 a.C."), tacca(-500, "500 a.C."));
    const notaPrima = s("g", { class: "sp-sfuma" }, etichetta(190, 370, "◀ si conta all'indietro", 20), etichetta(150, 405, "più antico", 20));
    const esempio = s("g", { class: "sp-sfuma" },
      s("circle", { cx: X(-753), cy: 260, r: 12, fill: "#F2B705", stroke: "#1D2329", "stroke-width": 3 }),
      etichetta(X(-753) - 40, 118, "753 a.C.", 20), etichetta(X(-753) - 40, 144, "NASCE ROMA (tradizione)", 17),
      s("line", { x1: X(-753), y1: 154, x2: X(-753), y2: 248, stroke: "#F2B705", "stroke-width": 3 }),
      figura("foto/colosseo.jpg", X(80) + 40, 335, 80, 100),
      s("circle", { cx: X(80), cy: 260, r: 12, fill: "#F2B705", stroke: "#1D2329", "stroke-width": 3 }),
      etichetta(X(80) + 190, 370, "80 d.C.", 20), etichetta(X(80) + 190, 396, "IL COLOSSEO", 17));
    const misure = s("g", { class: "sp-sfuma" },
      s("rect", { x: 70, y: 40, width: 270, height: 110, rx: 16, fill: "#fff", stroke: "#DDD5C3", "stroke-width": 3 }),
      etichetta(205, 85, "1 SECOLO = 100 ANNI", 22), etichetta(205, 125, "1 MILLENNIO = 1000 ANNI", 20),
      s("rect", { x: 420, y: 40, width: 320, height: 110, rx: 16, fill: "#fff", stroke: "#E0332B", "stroke-width": 3 }),
      etichetta(580, 82, "... 2 a.C. | 1 a.C. | 1 d.C. | 2 d.C. ...", 18), etichetta(580, 124, "L'ANNO ZERO NON ESISTE", 22));
    svg.append(prima, dopo, riga, ordine, cristo, notaPrima, notaDopo, esempio, misure);
    return {
      vai(k) {
        vedi(ordine, k === 0);
        vedi(cristo, k >= 1);
        vedi(dopo, k >= 2);
        vedi(prima, k >= 3);
        vedi(notaDopo, k === 2 || k === 3);
        vedi(notaPrima, k === 3);
        vedi(esempio, k === 4);
        vedi(misure, k === 5);
      },
      ferma() {}
    };
  }
};

/* ---------- i punti cardinali ---------- */
const PUNTI = {
  passi: [
    "Per orientarci, cioè per capire dove ci troviamo e da che parte andare, usiamo i quattro PUNTI CARDINALI: NORD, EST, SUD e OVEST.",
    "Mettiamoci con il SUD davanti a noi. Al mattino il Sole sorge dalla parte di EST, alla nostra sinistra.",
    "A metà della giornata il Sole è nel punto più alto del suo cammino nel cielo, verso SUD.",
    "La sera il Sole tramonta dalla parte di OVEST, alla nostra destra.",
    "Il NORD è dalla parte opposta al sud. Di notte, guardando verso nord, vediamo la STELLA POLARE.",
    "La BUSSOLA ci aiuta sempre, di giorno e di notte: il suo ago calamitato indica il nord."
  ],
  crea(svg) {
    const cieloR = s("rect", { width: 800, height: 450, fill: "#9FD3F0", class: "sp-cielo" });
    svg.append(cieloR);
    const stelle = s("g", { class: "sp-sfuma" });
    const r = dado(5);
    for (let i = 0; i < 70; i++) stelle.append(s("circle", { cx: (r() * 800).toFixed(1), cy: (r() * 300).toFixed(1), r: (0.5 + r()).toFixed(2), fill: "#fff", opacity: .8 }));
    stelle.append(s("circle", { cx: 400, cy: 120, r: 6, fill: "#FFF6C8" }), etichettaCielo(400, 100, "STELLA POLARE", 18));
    const percorso = s("path", { d: "M90 330 Q 400 -150 710 330", fill: "none", stroke: "#fff", "stroke-width": 3, "stroke-dasharray": "8 10", opacity: .8, class: "sp-sfuma" });
    const sole = s("g", { class: "sp-astro" }, s("circle", { r: 34, fill: "#FFD23F" }),
      Array.from({ length: 8 }, (x, k) => { const a = k * Math.PI / 4; return s("line", { x1: Math.cos(a) * 44, y1: Math.sin(a) * 44, x2: Math.cos(a) * 58, y2: Math.sin(a) * 58, stroke: "#FFB800", "stroke-width": 5, "stroke-linecap": "round" }); }));
    const terra = s("rect", { y: 330, width: 800, height: 120, fill: "#74A85A" });
    const nomiGiorno = s("g", { class: "sp-sfuma" }, etichetta(90, 380, "EST", 30), etichetta(400, 380, "SUD", 30), etichetta(400, 418, "davanti a noi", 18), etichetta(710, 380, "OVEST", 30));
    const nomiNotte = s("g", { class: "sp-sfuma" }, etichetta(90, 380, "OVEST", 30), etichetta(400, 380, "NORD", 30), etichetta(400, 418, "davanti a noi", 18), etichetta(710, 380, "EST", 30));
    const rosa = s("g", { class: "sp-sfuma" }, s("g", { transform: "translate(400 200)" },
      s("circle", { r: 120, fill: "#fff", stroke: "#1D2329", "stroke-width": 4 }),
      s("path", { d: "M0 -105 L18 0 L0 105 L-18 0 Z", fill: "#1D2329" }), s("path", { d: "M-105 0 L0 -18 L105 0 L0 18 Z", fill: "#6B7785" }),
      s("path", { d: "M0 -105 L18 0 L-18 0 Z", fill: "#E0332B" }),
      etichetta(0, -128, "N", 32), etichetta(0, 156, "S", 32), etichetta(150, 12, "E", 32), etichetta(-150, 12, "O", 32)));
    const bussola = s("g", { class: "sp-sfuma" }, s("g", { transform: "translate(400 200)" },
      s("circle", { r: 130, fill: "#F4EFE6", stroke: "#8A6D3B", "stroke-width": 10 }),
      etichetta(0, -95, "N", 30), etichetta(0, 118, "S", 30), etichetta(105, 10, "E", 30), etichetta(-105, 10, "O", 30),
      s("g", { class: "sp-ago" }, s("path", { d: "M0 -90 L14 0 L-14 0 Z", fill: "#E0332B" }), s("path", { d: "M0 90 L14 0 L-14 0 Z", fill: "#6B7785" }),
        s("circle", { r: 8, fill: "#1D2329" }))));
    svg.append(stelle, percorso, sole, terra, nomiGiorno, nomiNotte, rosa, bussola);
    const posto = [[90, 330], [400, 90], [710, 330]];
    const colori = ["#9FD3F0", "#FFD6A5", "#9FD3F0", "#FFB38A", "#0B1020", "#9FD3F0"];
    return {
      vai(k) {
        cieloR.setAttribute("fill", colori[k]);
        const paesaggio = k >= 1 && k <= 4;
        terra.style.opacity = paesaggio ? 1 : 0;
        vedi(percorso, k >= 1 && k <= 3);
        vedi(nomiGiorno, k >= 1 && k <= 3);
        vedi(nomiNotte, k === 4);
        vedi(stelle, k === 4);
        vedi(rosa, k === 0);
        vedi(bussola, k === 5);
        anima(bussola, k === 5);
        const [x, y] = posto[Math.min(Math.max(k - 1, 0), 2)];
        sole.style.opacity = k >= 1 && k <= 3 ? 1 : 0;
        sole.style.transform = `translate(${x}px, ${y}px)`;
      },
      ferma() {}
    };
  }
};

/* ---------- pianta e carta geografica ---------- */
const CARTE = {
  passi: [
    "Per disegnare un posto lo guardiamo dall'ALTO, come farebbe un uccello in volo. Un tavolo, visto dall'alto, diventa un rettangolo.",
    "Poi lo RIMPICCIOLIAMO sempre nello stesso modo: è la RIDUZIONE IN SCALA. Con la scala 1 a 100, un centimetro sul foglio vale 100 centimetri nella realtà, cioè un metro.",
    "Al posto delle cose disegniamo SIMBOLI e colori. La LEGENDA spiega che cosa vuol dire ogni simbolo.",
    "La PIANTA rappresenta un posto piccolo, come una stanza o una casa. La CARTA GEOGRAFICA rappresenta un territorio grande, come una regione o tutta l'Italia.",
    "Nelle carte FISICHE i colori mostrano il territorio: verde per le pianure, giallo per le colline, marrone per le montagne, azzurro per l'acqua. Nelle carte POLITICHE vediamo confini, regioni e città."
  ],
  crea(svg) {
    svg.append(s("rect", { width: 800, height: 450, fill: "#F7F3EA" }));
    const alto = s("g", { class: "sp-sfuma" },
      figura(picto(3129), 60, 170, 230, 190), etichetta(175, 395, "di lato", 22),
      figura(picto(2490), 520, 10, 90, 90),
      s("path", { d: "M565 105 L565 160", stroke: "#1D2329", "stroke-width": 4, "stroke-dasharray": "6 6" }),
      s("rect", { x: 450, y: 180, width: 230, height: 140, rx: 6, fill: "#B07A45", stroke: "#6E4A26", "stroke-width": 5 }),
      etichetta(565, 365, "visto dall'alto", 22));
    const stanza = s("g", { transform: "translate(400 215)" }, s("g", { class: "sp-riduci" },
      s("rect", { x: -300, y: -150, width: 600, height: 300, fill: "#fff", stroke: "#1D2329", "stroke-width": 6 }),
      s("rect", { x: -120, y: -50, width: 240, height: 100, fill: "#B07A45" }),
      etichetta(0, -165, "3 metri nella realtà", 22)));
    const scala = s("g", { class: "sp-sfuma" },
      etichetta(400, 330, "3 centimetri sul foglio", 22), etichetta(400, 395, "SCALA 1 : 100", 34));
    const ridotta = s("g", { class: "sp-sfuma" }, stanza);
    const simbolo = {
      casa: (x, y) => s("rect", { x: x - 9, y: y - 9, width: 18, height: 18, fill: "#E0332B", stroke: "#1D2329", "stroke-width": 2 }),
      albero: (x, y) => s("circle", { cx: x, cy: y, r: 10, fill: "#2E9E44" })
    };
    const mappa = s("g", { class: "sp-sfuma" },
      s("rect", { x: 40, y: 40, width: 470, height: 370, rx: 10, fill: "#fff", stroke: "#9AA8B4", "stroke-width": 3 }),
      s("path", { d: "M60 120 C 180 160, 260 60, 380 140 S 470 260, 500 230", fill: "none", stroke: "#2F8FD8", "stroke-width": 10, "stroke-linecap": "round" }),
      s("path", { d: "M60 330 L 500 300", stroke: "#8A8F96", "stroke-width": 10 }),
      [[120, 260], [160, 280], [210, 250], [300, 270], [340, 245]].map(([x, y]) => simbolo.casa(x, y)),
      [[90, 200], [130, 190], [400, 360], [440, 370], [470, 350], [250, 200]].map(([x, y]) => simbolo.albero(x, y)),
      s("rect", { x: 540, y: 90, width: 220, height: 260, rx: 10, fill: "#fff", stroke: "#1D2329", "stroke-width": 3 }),
      etichetta(650, 125, "LEGENDA", 22),
      simbolo.casa(575, 170), scritta(670, 177, "casa", { "font-size": 20, fill: "#1D2329" }),
      simbolo.albero(575, 220), scritta(670, 227, "albero", { "font-size": 20, fill: "#1D2329" }),
      s("line", { x1: 560, y1: 270, x2: 595, y2: 270, stroke: "#2F8FD8", "stroke-width": 8 }), scritta(670, 277, "fiume", { "font-size": 20, fill: "#1D2329" }),
      s("line", { x1: 560, y1: 318, x2: 595, y2: 318, stroke: "#8A8F96", "stroke-width": 8 }), scritta(670, 325, "strada", { "font-size": 20, fill: "#1D2329" }));
    const confronto = s("g", { class: "sp-sfuma" },
      s("rect", { x: 70, y: 90, width: 280, height: 220, fill: "#fff", stroke: "#1D2329", "stroke-width": 5 }),
      s("rect", { x: 90, y: 110, width: 110, height: 70, fill: "#9BC3E6" }), s("rect", { x: 240, y: 230, width: 90, height: 60, fill: "#B07A45" }),
      s("rect", { x: 70, y: 250, width: 6, height: 50, fill: "#F7F3EA" }),
      etichetta(210, 350, "PIANTA DI UNA STANZA", 22),
      figura(picto(28971), 450, 50, 280, 290), etichetta(590, 370, "CARTA DELL'ITALIA", 22));
    const fisica = s("g", { class: "sp-sfuma" },
      s("rect", { x: 40, y: 40, width: 470, height: 370, rx: 10, fill: "#7FB8E8" }),
      s("path", { d: "M40 300 C 140 280, 200 330, 300 320 S 450 300, 510 320 L 510 410 L 40 410 Z", fill: "#7FB8E8" }),
      s("path", { d: "M40 40 L 510 40 L 510 300 C 450 290, 380 310, 300 300 C 220 290, 120 300, 40 290 Z", fill: "#8DC66B" }),
      s("path", { d: "M180 40 C 200 120, 330 140, 380 90 C 420 60, 470 70, 510 110 L 510 40 Z", fill: "#E9D36B" }),
      s("path", { d: "M300 40 C 320 80, 400 90, 430 60 C 450 45, 480 50, 510 70 L 510 40 Z", fill: "#A0703C" }),
      s("path", { d: "M330 110 C 300 170, 220 200, 185 290 S 170 320, 165 330", fill: "none", stroke: "#2F8FD8", "stroke-width": 8 }),
      s("ellipse", { cx: 120, cy: 160, rx: 45, ry: 25, fill: "#7FB8E8" }),
      s("rect", { x: 540, y: 90, width: 220, height: 260, rx: 10, fill: "#fff", stroke: "#1D2329", "stroke-width": 3 }),
      etichetta(650, 125, "LEGENDA", 22),
      [["#A0703C", "montagna"], ["#E9D36B", "collina"], ["#8DC66B", "pianura"], ["#7FB8E8", "acqua"]].map(([c, n], i) => s("g", {},
        s("rect", { x: 560, y: 150 + i * 48, width: 36, height: 28, fill: c, stroke: "#1D2329", "stroke-width": 2 }),
        scritta(675, 171 + i * 48, n, { "font-size": 20, fill: "#1D2329" }))),
      etichetta(275, 435, "CARTA FISICA", 22));
    svg.append(alto, ridotta, scala, mappa, confronto, fisica);
    return {
      vai(k) {
        vedi(alto, k === 0);
        vedi(ridotta, k === 1);
        scala.style.transitionDelay = k === 1 ? "2.4s" : "0s";   // le misure compaiono quando la stanza è già rimpicciolita
        vedi(scala, k === 1);
        stanza.firstChild.classList.toggle("sp-piccola", k === 1);
        vedi(mappa, k === 2);
        vedi(confronto, k === 3);
        vedi(fisica, k === 4);
      },
      ferma() {}
    };
  }
};

/* ---------- il riporto e il prestito, in colonna ---------- */
// Le stesse barrette (decine) e gli stessi cubetti (unità) dell'esercizio «In colonna»; ogni blocco si sposta
// con una transizione CSS, così si vede da dove viene e dove va. Ogni passo rimette tutto al suo posto:
// si può andare avanti e indietro.
const RIGHE = [72, 182, 302];
function blocco(tipo) {
  const g = s("g", { class: "sp-blocco" });
  if (tipo === "u") g.append(s("rect", { width: 15, height: 15, rx: 2, fill: "#F7C900", stroke: "#8A6D00", "stroke-width": 1.5 }));
  else {
    g.append(s("rect", { width: 16, height: 90, rx: 3, fill: "#F7C900", stroke: "#8A6D00", "stroke-width": 1.5 }));
    for (let j = 1; j < 10; j++) g.append(s("line", { x1: 1, x2: 15, y1: j * 9, y2: j * 9, stroke: "#8A6D00", "stroke-width": 1 }));
  }
  return g;
}
const piazza = (g, [x, y]) => { g.style.transform = "translate(" + x + "px," + y + "px)"; };
const postoD = (riga, i) => [250 + i * 22, RIGHE[riga]];
const postoU = (riga, i) => [500 + (i % 5) * 19, RIGHE[riga] + 6 + Math.floor(i / 5) * 19];
const cifraCol = (x, y, t, colore) => scritta(x, y, t, { "font-size": 54, "font-weight": 800, fill: colore || "#1D2329" });
function tabellaColonna(svg, a, segno, b) {
  svg.append(s("rect", { width: 800, height: 450, fill: "#FBF8F1" }));
  const luce = {
    d: s("rect", { x: 188, y: 50, width: 240, height: 352, rx: 16, fill: "#FFF1A8", class: "sp-sfuma" }),
    u: s("rect", { x: 438, y: 50, width: 292, height: 352, rx: 16, fill: "#FFF1A8", class: "sp-sfuma" })
  };
  vedi(luce.d, false);
  vedi(luce.u, false);
  svg.append(luce.d, luce.u,
    scritta(305, 38, "da", { "font-size": 26, "font-weight": 800, fill: "#5B6670" }), scritta(585, 38, "u", { "font-size": 26, "font-weight": 800, fill: "#5B6670" }),
    cifraCol(215, 120, String(Math.floor(a / 10))), cifraCol(465, 120, String(a % 10)),
    cifraCol(160, 230, segno), cifraCol(215, 230, String(Math.floor(b / 10))), cifraCol(465, 230, String(b % 10)),
    s("line", { x1: 140, x2: 730, y1: 285, y2: 285, stroke: "#1D2329", "stroke-width": 5 }));
  return luce;
}
function nascosto(n) {
  n.classList.add("sp-sfuma");
  vedi(n, false);
  return n;
}

const RIPORTO = {
  passi: [
    "Facciamo 38 + 25 in colonna. Ogni numero è fatto di decine, le barrette da dieci, e di unità, i cubetti.",
    "Si comincia sempre dalle unità: 8 unità più 5 unità fanno 13 unità.",
    "13 unità sono troppe per una colonna sola: 10 unità si mettono insieme e diventano 1 decina.",
    "La decina nuova va nella colonna delle decine: è il riporto. Sopra le decine si scrive un 1 piccolo, e nelle unità ne restano 3.",
    "Ora le decine: 3 più 2 fa 5, più 1 di riporto fa 6 decine. Il risultato è 63."
  ],
  crea(svg) {
    const luce = tabellaColonna(svg, 38, "+", 25);
    const aD = [0, 1, 2].map(() => blocco("d")), bD = [0, 1].map(() => blocco("d"));
    const unita = Array.from({ length: 13 }, () => blocco("u"));  // le prime 8 sono di 38, le altre 5 di 25
    const nuova = blocco("d");
    nuova.firstChild.setAttribute("stroke", "#C0282B");
    nuova.firstChild.setAttribute("stroke-width", 3);
    const dieci = nascosto(s("rect", { x: 492, y: 302, width: 102, height: 44, rx: 8, fill: "none", stroke: "#C0282B", "stroke-width": 4, "stroke-dasharray": "8 6" }));
    const scrittaDieci = nascosto(etichetta(612, 396, "10 unità = 1 decina", 19));
    const uno = nascosto(scritta(215, 66, "1", { "font-size": 34, "font-weight": 800, fill: "#C0282B" }));
    const ru = nascosto(cifraCol(465, 360, "3", "#1E6B52"));
    const rd = nascosto(cifraCol(215, 360, "6", "#1E6B52"));
    const finale = nascosto(etichetta(400, 436, "38 + 25 = 63", 30));
    aD.forEach((g, i) => piazza(g, postoD(0, i)));
    bD.forEach((g, i) => piazza(g, postoD(1, i)));
    unita.forEach((g, i) => piazza(g, i < 8 ? postoU(0, i) : postoU(1, i - 8)));
    piazza(nuova, [548, 300]);
    vedi(nuova, false);
    svg.append(...aD, ...bD, ...unita, nuova, dieci, scrittaDieci, uno, ru, rd, finale);
    return {
      vai(k) {
        vedi(luce.u, k >= 1 && k <= 3);
        vedi(luce.d, k === 4);
        unita.forEach((g, i) => {
          // dal passo 3 i primi 10 cubetti sono diventati la barretta: restano solo gli ultimi 3, spostati a sinistra
          piazza(g, k === 0 ? (i < 8 ? postoU(0, i) : postoU(1, i - 8)) : k >= 3 && i >= 10 ? postoU(2, i - 10) : postoU(2, i));
          vedi(g, !(k >= 3 && i < 10));
        });
        vedi(dieci, k === 2);
        vedi(scrittaDieci, k === 2);
        // la barretta nuova compare dove c'erano i 10 cubetti, poi vola tra le decine
        nuova.style.transition = k === 3 ? "opacity .5s, transform 1s cubic-bezier(.3,.7,.4,1) .7s" : "";
        vedi(nuova, k >= 3);
        piazza(nuova, k >= 3 ? postoD(2, 0) : [548, 300]);
        aD.forEach((g, i) => piazza(g, k === 4 ? postoD(2, 1 + i) : postoD(0, i)));
        bD.forEach((g, i) => piazza(g, k === 4 ? postoD(2, 4 + i) : postoD(1, i)));
        vedi(uno, k >= 3);
        vedi(ru, k >= 3);
        vedi(rd, k === 4);
        vedi(finale, k === 4);
      },
      ferma() {}
    };
  }
};

const PRESTITO = {
  passi: [
    "Facciamo 52 − 27 in colonna. Il numero 52 è fatto di 5 decine, le barrette, e di 2 unità, i cubetti.",
    "Si comincia dalle unità: devo togliere 7 unità, ma ne ho solo 2. Non bastano!",
    "Allora chiedo un prestito alle decine: 1 decina si apre e diventa 10 unità. Le decine diventano 4 e le unità diventano 12.",
    "Adesso le unità sono 12: ne tolgo 7, e ne restano 5.",
    "Ora le decine: ne sono rimaste 4. Ne tolgo 2, e ne restano 2. Il risultato è 25."
  ],
  crea(svg) {
    const luce = tabellaColonna(svg, 52, "−", 27);
    const aD = [0, 1, 2, 3, 4].map(() => blocco("d"));
    const unita = Array.from({ length: 12 }, () => blocco("u"));  // 2 di 52 e 10 che arrivano dalla decina aperta
    const pochi = nascosto(etichetta(640, 152, "2 è meno di 7!", 22));
    const barra = nascosto(s("line", { x1: 192, x2: 238, y1: 96, y2: 80, stroke: "#C0282B", "stroke-width": 6, "stroke-linecap": "round" }));
    const quattro = nascosto(scritta(215, 66, "4", { "font-size": 34, "font-weight": 800, fill: "#C0282B" }));
    const unoU = nascosto(scritta(438, 104, "1", { "font-size": 30, "font-weight": 800, fill: "#C0282B" }));
    const tolgo7 = nascosto(etichetta(640, 152, "ne tolgo 7", 22));
    const tolgo2 = nascosto(etichetta(305, 168, "ne tolgo 2", 22));
    const ru = nascosto(cifraCol(465, 360, "5", "#1E6B52"));
    const rd = nascosto(cifraCol(215, 360, "2", "#1E6B52"));
    const finale = nascosto(etichetta(400, 436, "52 − 27 = 25", 30));
    const casa = i => (i < 2 ? postoU(0, i) : postoD(0, 4));  // le 10 nuove partono da dentro la decina che si apre
    aD.forEach((g, i) => piazza(g, postoD(0, i)));
    unita.forEach((g, i) => { piazza(g, casa(i)); vedi(g, i < 2); });
    svg.append(...aD, ...unita, pochi, barra, quattro, unoU, tolgo7, tolgo2, ru, rd, finale);
    return {
      vai(k) {
        vedi(luce.u, k >= 1 && k <= 3);
        vedi(luce.d, k === 4);
        vedi(pochi, k === 1);
        // la quinta decina si apre: sparisce, e al suo posto partono 10 cubetti verso le unità
        vedi(aD[4], k < 2);
        unita.forEach((g, i) => {
          const tolto = k >= 3 && i >= 5;   // gli ultimi 7 se ne vanno
          vedi(g, i < 2 || k >= 2 ? (tolto ? 0.18 : 1) : 0);
          g.style.opacity = i < 2 || k >= 2 ? (tolto ? 0.18 : 1) : 0;
          piazza(g, k >= 3 && !tolto ? postoU(2, i) : k >= 2 || i < 2 ? postoU(0, i) : casa(i));
        });
        vedi(barra, k >= 2);
        vedi(quattro, k >= 2);
        vedi(unoU, k >= 2);
        vedi(tolgo7, k === 3);
        vedi(ru, k >= 3);
        aD.slice(0, 4).forEach((g, i) => {
          g.style.opacity = k === 4 && i >= 2 ? 0.18 : 1;
          piazza(g, k === 4 && i < 2 ? postoD(2, i) : postoD(0, i));
        });
        vedi(tolgo2, k === 4);
        vedi(rd, k === 4);
        vedi(finale, k === 4);
      },
      ferma() {}
    };
  }
};

/* ---------- che cos'è la moltiplicazione ---------- */
// 3 × 4 visto in tre modi: gruppi uguali, addizione ripetuta, schieramento (che si può girare: 4 × 3).
const MOLTIPLICAZIONE = {
  passi: [
    "La moltiplicazione serve a contare in fretta tanti gruppi tutti uguali.",
    "Qui ci sono 3 gruppi, e in ogni gruppo ci sono 4 mele. Si scrive 3 × 4, e si legge «3 per 4».",
    "Si può contare con l'addizione: 4 + 4 + 4 fa 12. Moltiplicare vuol dire sommare tante volte lo stesso numero.",
    "Mettiamo le mele in righe: 3 righe da 4. È uno schieramento. In tutto sono 12: 3 × 4 = 12.",
    "Se giriamo lo schieramento diventano 4 righe da 3, e il risultato non cambia: anche 4 × 3 fa 12."
  ],
  crea(svg) {
    svg.append(s("rect", { width: 800, height: 450, fill: "#FBF8F1" }));
    const piatti = [170, 400, 630].map(cx => nascosto(s("ellipse", { cx, cy: 200, rx: 92, ry: 78, fill: "#fff", stroke: "#9AA8B4", "stroke-width": 4 })));
    svg.append(...piatti);
    const mela = () => s("g", { class: "sp-blocco" },
      s("circle", { cx: 0, cy: 0, r: 19, fill: "#E0332B", stroke: "#9E1F1A", "stroke-width": 2 }),
      s("path", { d: "M0 -19 q 3 -10 10 -12", fill: "none", stroke: "#5B3A1E", "stroke-width": 3, "stroke-linecap": "round" }));
    const mele = Array.from({ length: 12 }, mela);
    // nei piatti: il gruppo g, al posto j (2 × 2); nello schieramento: riga r, colonna c
    const nelPiatto = i => [[170, 400, 630][Math.floor(i / 4)] - 26 + (i % 2) * 52, 174 + Math.floor((i % 4) / 2) * 52];
    const inRiga = i => [235 + (i % 4) * 110, 110 + Math.floor(i / 4) * 95];
    const girato = i => [290 + Math.floor(i / 4) * 110, 70 + (i % 4) * 80];
    mele.forEach((m, i) => piazza(m, nelPiatto(i)));
    svg.append(...mele);
    const scritte = ["3 gruppi da 4", "4 + 4 + 4 = 12", "3 × 4 = 12", "4 × 3 = 12"].map(t => nascosto(etichetta(400, 420, t, 34)));
    const numeri = [0, 1, 2].map(g => nascosto(etichetta([170, 400, 630][g], 320, "4", 30)));
    svg.append(...scritte, ...numeri);
    return {
      vai(k) {
        piatti.forEach(p => vedi(p, k <= 2));
        mele.forEach((m, i) => piazza(m, k <= 2 ? nelPiatto(i) : k === 3 ? inRiga(i) : girato(i)));
        scritte.forEach((t, j) => vedi(t, k === j + 1));
        numeri.forEach(n => vedi(n, k === 2));
      },
      ferma() {}
    };
  }
};

// Più spiegazioni una dopo l'altra, come se fossero una sola: ogni parte ha il suo disegno e i suoi passi.
function insieme(...parti) {
  return {
    passi: parti.flatMap(p => p.passi),
    crea(svg) {
      let da = 0;
      const pezzi = parti.map(p => {
        const g = s("g", {});
        svg.append(g);
        const ctrl = p.crea(g);
        const pezzo = { g, ctrl, da, a: da + p.passi.length };
        da = pezzo.a;
        return pezzo;
      });
      return {
        vai(k) {
          pezzi.forEach(p => {
            const qui = k >= p.da && k < p.a;
            p.g.style.display = qui ? "" : "none";
            if (qui) p.ctrl.vai(k - p.da);
          });
        },
        ferma() { pezzi.forEach(p => p.ctrl.ferma()); }
      };
    }
  };
}

/* ---------- come si usa la tavola pitagorica ---------- */
// 4 × 6: si trova il 4 nella colonna di sinistra, il 6 nella riga in alto, e si seguono fino a dove si incontrano.
const TAVOLA = {
  passi: [
    "Questa è la tavola pitagorica. Nella prima riga in alto e nella prima colonna a sinistra ci sono i numeri da 1 a 10.",
    "Per fare 4 × 6, cerca il 4 nella colonna a sinistra.",
    "Poi cerca il 6 nella riga in alto.",
    "Segui la riga del 4 verso destra e la colonna del 6 verso il basso: dove si incontrano c'è il risultato. 4 × 6 fa 24.",
    "Funziona anche al contrario: 6 × 4 fa sempre 24. E ogni riga è una tabellina: la riga del 4 conta 4, 8, 12, 16, 20, 24…"
  ],
  crea(svg) {
    const L = 37, x0 = 197, y0 = 22;   // 11 × 11 caselle: la prima riga e la prima colonna sono i numeri da 1 a 10
    svg.append(s("rect", { width: 800, height: 450, fill: "#FBF8F1" }));
    const cella = (r, c) => [x0 + c * L, y0 + r * L];
    const striscia = (x, y, w, h, colore) => nascosto(s("rect", { x, y, width: w, height: h, fill: colore, rx: 4 }));
    const riga4 = striscia(x0, y0 + 4 * L, 11 * L, L, "#CFE6FA");
    const colonna6 = striscia(x0 + 6 * L, y0, L, 11 * L, "#FFE3B8");
    const incontro = striscia(x0 + 6 * L, y0 + 4 * L, L, L, "#7FD49B");
    const contrario = striscia(x0 + 4 * L, y0 + 6 * L, L, L, "#7FD49B");
    svg.append(riga4, colonna6, incontro, contrario);
    const testa = [];
    for (let r = 0; r <= 10; r++) for (let c = 0; c <= 10; c++) {
      if (r === 0 && c === 0) continue;
      const [x, y] = cella(r, c);
      const bordo = r === 0 || c === 0;
      svg.append(s("rect", { x, y, width: L, height: L, fill: bordo ? "#F7C900" : "none", stroke: "#8A9BA8", "stroke-width": 1 }));
      const n = r === 0 ? c : c === 0 ? r : r * c;
      const t = scritta(x + L / 2, y + L / 2 + 6, String(n), { "font-size": bordo ? 18 : 16, "font-weight": bordo ? 800 : 600, fill: "#1D2329" });
      svg.append(t);
      if ((r === 0 && c === 6) || (c === 0 && r === 4)) testa.push(t);
    }
    svg.append(scritta(x0 + L / 2, y0 + L / 2 + 7, "×", { "font-size": 22, "font-weight": 800, fill: "#C0282B" }));
    const cerchio = (r, c) => nascosto(s("circle", { cx: cella(r, c)[0] + L / 2, cy: cella(r, c)[1] + L / 2, r: L / 2 + 3, fill: "none", stroke: "#C0282B", "stroke-width": 4 }));
    const c4 = cerchio(4, 0), c6 = cerchio(0, 6), c24 = cerchio(4, 6), c24b = cerchio(6, 4);
    const scritte = [nascosto(etichetta(100, 120, "4 × 6 = 24", 26)), nascosto(etichetta(100, 120, "6 × 4 = 24", 26))];
    svg.append(c4, c6, c24, c24b, ...scritte);
    return {
      vai(k) {
        vedi(riga4, k >= 1);
        vedi(c4, k >= 1 && k <= 3);
        vedi(colonna6, k >= 2 && k <= 3);
        vedi(c6, k >= 2 && k <= 3);
        vedi(incontro, k >= 3);
        vedi(c24, k >= 3);
        vedi(scritte[0], k === 3);
        vedi(contrario, k === 4);
        vedi(c24b, k === 4);
        vedi(scritte[1], k === 4);
        testa.forEach(t => t.setAttribute("fill", k >= 1 && k <= 3 ? "#C0282B" : "#1D2329"));
      },
      ferma() {}
    };
  }
};

/* ---------- le proprietà delle operazioni ---------- */
// Pallini che si spostano: si vede che sono sempre gli stessi, quindi il risultato non cambia.
// Ogni passo dice dove sta ogni pallino; le transizioni CSS fanno il movimento tra un passo e l'altro.
const ROSSO = "#E0332B", BLU = "#2F6FD6", VERDE = "#2E9E5B";
const pallino = (colore, r) => s("g", { class: "sp-blocco" },
  s("circle", { cx: 0, cy: 0, r: r || 15, fill: colore, stroke: "#1D2329", "stroke-width": 1.5 }));
const fondo = svg => svg.append(s("rect", { width: 800, height: 450, fill: "#FBF8F1" }));
const pallini = (n, colore, r) => Array.from({ length: n }, () => pallino(colore, r));

const COMMUTATIVA_ADD = {
  passi: [
    "Le proprietà delle operazioni sono come dei trucchi: il risultato non cambia, ma il calcolo diventa più facile.",
    "Proprietà commutativa. Qui ci sono 3 pallini rossi e 8 blu: 3 + 8 fa 11.",
    "Ora scambio i due gruppi: prima gli 8 blu, poi i 3 rossi. 8 + 3 fa sempre 11, perché i pallini sono gli stessi!",
    "A cosa serve? Conviene partire dal numero più grande: da 8 conto solo 3 passi avanti. 9, 10, 11."
  ],
  crea(svg) {
    fondo(svg);
    const x = i => 125 + i * 55;
    const rossi = pallini(3, ROSSO, 20), blu = pallini(8, BLU, 20);
    const titolo = nascosto(etichetta(400, 120, "LE PROPRIETÀ DELLE OPERAZIONI", 34));
    const scritte = ["3 + 8 = 11", "8 + 3 = 11", "8 + 3 = 11"].map(t => nascosto(etichetta(400, 340, t, 40)));
    const contati = ["9", "10", "11"].map((t, i) => nascosto(etichetta(x(8 + i), 185, t, 28)));
    svg.append(...rossi, ...blu, titolo, ...scritte, ...contati);
    const metti = k => {
      const scambiati = k >= 2;
      rossi.forEach((g, i) => piazza(g, [x(scambiati ? 8 + i : i), 235]));
      blu.forEach((g, i) => piazza(g, [x(scambiati ? i : 3 + i), 235]));
    };
    metti(0);
    return {
      vai(k) {
        metti(k);
        vedi(titolo, k === 0);
        scritte.forEach((t, j) => vedi(t, k === j + 1));
        contati.forEach(t => vedi(t, k === 3));
      },
      ferma() {}
    };
  }
};

const ASSOCIATIVA_ADD = {
  passi: [
    "Proprietà associativa. Devo fare 7 + 6 + 4.",
    "Posso sommare prima due numeri vicini. Scelgo 6 + 4, perché insieme fanno 10: sono numeri amici.",
    "Poi 7 + 10 fa 17. Il risultato non cambia, ma il calcolo è più facile."
  ],
  crea(svg) {
    fondo(svg);
    const gruppi = [pallini(7, ROSSO), pallini(6, BLU), pallini(4, VERDE)];
    // separati: tre gruppi con uno spazio in mezzo; poi il 6 e il 4 si avvicinano e diventano una fila da 10
    const inizio = (k, j) => (j === 0 ? 70 : j === 1 ? (k >= 1 ? 370 : 340) : (k >= 1 ? 586 : 600));
    const scatola = nascosto(s("rect", { x: 348, y: 182, width: 368, height: 56, rx: 28, fill: "none", stroke: "#C0282B", "stroke-width": 4 }));
    const dieci = nascosto(etichetta(532, 166, "10", 30));
    const numeri = [[178, "7"], [430, "6"], [654, "4"]].map(([x, t]) => nascosto(etichetta(x, 270, t, 28)));
    const scritte = ["7 + 6 + 4", "7 + (6 + 4)", "7 + 10 = 17"].map(t => nascosto(etichetta(400, 350, t, 40)));
    svg.append(scatola, ...gruppi.flat(), dieci, ...numeri, ...scritte);
    const metti = k => gruppi.forEach((g, j) => g.forEach((p, i) => piazza(p, [inizio(k, j) + i * 36, 210])));
    metti(0);
    return {
      vai(k) {
        metti(k);
        vedi(scatola, k >= 1);
        vedi(dieci, k >= 1);
        numeri.forEach(n => vedi(n, k === 0));
        scritte.forEach((t, j) => vedi(t, k === j));
      },
      ferma() {}
    };
  }
};

const DISSOCIATIVA_ADD = {
  passi: [
    "Proprietà dissociativa. Devo fare 8 + 5: 8 pallini rossi e 5 blu.",
    "A 8 mancano 2 per arrivare a 10. Allora spezzo il 5 in 2 + 3, e con il 2 riempio la decina.",
    "8 + 2 fa 10, e 10 + 3 fa 13. Quindi 8 + 5 = 13.",
    "Con i numeri più grandi si spezza in decine e unità. 34 + 25: prima aggiungo le 2 decine, 34 + 20 fa 54. Poi le 5 unità: 54 + 5 fa 59."
  ],
  crea(svg) {
    fondo(svg);
    const disegno = s("g", { class: "sp-sfuma" });
    svg.append(disegno);
    // due «file da dieci»: 2 righe da 5 caselle
    const L = 58;
    const casella = (f, i) => [(f === 0 ? 100 : 470) + (i % 5) * L + L / 2, 110 + Math.floor(i / 5) * L + L / 2];
    for (const f of [0, 1]) for (let i = 0; i < 10; i++) {
      const [cx, cy] = casella(f, i);
      disegno.append(s("rect", { x: cx - L / 2, y: cy - L / 2, width: L, height: L, fill: "#fff", stroke: "#9AA8B4", "stroke-width": 2 }));
    }
    const rossi = pallini(8, ROSSO, 20), blu = pallini(5, BLU, 20);
    const anelli = [8, 9].map(i => nascosto(s("circle", { cx: casella(0, i)[0], cy: casella(0, i)[1], r: 26, fill: "none", stroke: "#C0282B", "stroke-width": 4 })));
    const sotto = [[245, "10"], [615, "3"]].map(([x, t]) => nascosto(etichetta(x, 268, t, 30)));
    const scritte = ["8 + 5", "8 + 5 = 8 + 2 + 3", "10 + 3 = 13"].map(t => nascosto(etichetta(400, 400, t, 40)));
    const decine = ["34 + 25", "34 + 20 + 5", "54 + 5 = 59"].map((t, j) => nascosto(etichetta(400, 120 + j * 100, t, 44)));
    disegno.append(...rossi, ...blu, ...anelli, ...sotto);
    svg.append(...scritte, ...decine);
    const metti = k => {
      rossi.forEach((g, i) => piazza(g, casella(0, i)));
      blu.forEach((g, i) => piazza(g, k === 0 ? [499 + i * 58, 320] : i < 2 ? casella(0, 8 + i) : casella(1, i - 2)));
    };
    metti(0);
    return {
      vai(k) {
        metti(k);
        vedi(disegno, k <= 2);
        anelli.forEach(a => vedi(a, k >= 1));
        sotto.forEach(t => vedi(t, k === 2));
        scritte.forEach((t, j) => vedi(t, k === j));
        decine.forEach(t => vedi(t, k === 3));
      },
      ferma() {}
    };
  }
};

const INVARIANTIVA = {
  passi: [
    "Nella sottrazione non si possono scambiare i numeri: 7 − 3 fa 4, ma 3 − 7 non si può fare con i numeri che usiamo adesso.",
    "La sottrazione dice quanta differenza c'è tra due numeri. 13 − 9: sopra 13 pallini, sotto 9. Quelli senza compagno sono 4.",
    "Proprietà invariantiva: aggiungo 1 pallino a tutte e due le file. Adesso è 14 − 10, e quelli senza compagno sono sempre 4.",
    "A cosa serve? 14 − 10 è più facile di 13 − 9, perché il numero da togliere è tondo. Quindi anche 13 − 9 fa 4.",
    "Funziona anche togliendo lo stesso numero a tutti e due: 25 − 11 diventa 24 − 10, che fa 14."
  ],
  crea(svg) {
    fondo(svg);
    const x = i => 130 + i * 40;
    const file = nascosto(s("g", {}));
    // la differenza: un rettangolo giallo dietro i pallini senza compagno, che si sposta quando se ne aggiunge uno
    const giallo = s("g", { class: "sp-blocco" },
      s("rect", { x: x(9) - 20, y: 142, width: 160, height: 56, rx: 14, fill: "#FFE36A", stroke: "#B8860B", "stroke-width": 2 }),
      etichetta(x(9) + 60, 132, "4", 28));
    const compagni = Array.from({ length: 10 }, (_, i) => s("line", { x1: x(i), x2: x(i), y1: 186, y2: 234, stroke: "#9AA8B4", "stroke-width": 3, class: "sp-sfuma" }));
    const sopra = pallini(14, ROSSO), sotto = pallini(10, BLU);
    // i due pallini aggiunti hanno l'anello arancio, come gli oggetti nuovi negli esercizi
    [sopra[13], sotto[9]].forEach(p => { p.firstChild.setAttribute("stroke", "#F28C1B"); p.firstChild.setAttribute("stroke-width", 5); });
    sopra.forEach((p, i) => piazza(p, [x(i), 170]));
    sotto.forEach((p, i) => piazza(p, [x(i), 250]));
    file.append(giallo, ...compagni, ...sopra, ...sotto);
    const scritte = ["13 − 9 = 4", "14 − 10 = 4", "13 − 9 = 14 − 10 = 4"].map(t => nascosto(etichetta(400, 350, t, 40)));
    const inizio = [nascosto(etichetta(400, 170, "7 − 3 = 4", 44)), nascosto(etichetta(400, 280, "3 − 7  non si può", 40))];
    inizio[1].setAttribute("fill", "#C0282B");
    const togliendo = [nascosto(etichetta(400, 150, "25 − 11", 44)), nascosto(etichetta(400, 225, "−1 a tutti e due", 26)), nascosto(etichetta(400, 310, "24 − 10 = 14", 44))];
    svg.append(file, ...scritte, ...inizio, ...togliendo);
    return {
      vai(k) {
        vedi(file, k >= 1 && k <= 3);
        const aggiunto = k >= 2;
        vedi(sopra[13], aggiunto);
        vedi(sotto[9], aggiunto);
        vedi(compagni[9], aggiunto);
        piazza(giallo, [aggiunto ? 40 : 0, 0]);
        scritte.forEach((t, j) => vedi(t, k === j + 1));
        inizio.forEach(t => vedi(t, k === 0));
        togliendo.forEach(t => vedi(t, k === 4));
      },
      ferma() {}
    };
  }
};

const COMMUTATIVA_MOLT = {
  passi: [
    "Proprietà commutativa della moltiplicazione. 3 × 5 vuol dire 3 righe da 5 pallini: in tutto sono 15.",
    "Se giro lo schieramento, diventano 5 righe da 3: 5 × 3. I pallini sono sempre 15!",
    "A cosa serve? Se sai 3 × 8, sai anche 8 × 3. Così le tabelline da imparare sono quasi la metà."
  ],
  crea(svg) {
    fondo(svg);
    const L = 56;
    const colori = [ROSSO, BLU, VERDE];   // un colore per riga: quando si gira, le righe diventano colonne
    const tutti = Array.from({ length: 15 }, (_, i) => pallino(colori[Math.floor(i / 5)], 20));
    // un quarto di giro: il pallino della riga r, colonna c va nella riga c, colonna 2 − r
    const dritto = i => [400 - 2 * L + (i % 5) * L, 140 + Math.floor(i / 5) * L];
    const girato = i => [400 - L + (2 - Math.floor(i / 5)) * L, 85 + (i % 5) * L];
    const scritte = ["3 × 5 = 15", "5 × 3 = 15", "3 × 8 = 8 × 3 = 24"].map(t => nascosto(etichetta(400, 405, t, 40)));
    svg.append(...tutti, ...scritte);
    tutti.forEach((p, i) => piazza(p, dritto(i)));
    return {
      vai(k) {
        tutti.forEach((p, i) => piazza(p, k >= 1 ? girato(i) : dritto(i)));
        scritte.forEach((t, j) => vedi(t, k === j));
      },
      ferma() {}
    };
  }
};

const ASSOCIATIVA_MOLT = {
  passi: [
    "Proprietà associativa. 3 × 2 × 5: posso moltiplicare prima due numeri vicini. 2 × 5 fa 10: in ogni scatola ci sono 2 righe da 5.",
    "Le scatole sono 3, e in ognuna ce ne sono 10: 3 × 10 fa 30. Il risultato non cambia, ma il calcolo è più facile."
  ],
  crea(svg) {
    fondo(svg);
    const scatole = [70, 300, 530];
    scatole.forEach(x => svg.append(s("rect", { x, y: 110, width: 200, height: 120, rx: 16, fill: "#fff", stroke: "#9AA8B4", "stroke-width": 3, "stroke-dasharray": "10 7" })));
    scatole.forEach(x => {
      for (let i = 0; i < 10; i++) {
        const p = pallino(ROSSO, 14);
        piazza(p, [x + 32 + (i % 5) * 34, 145 + Math.floor(i / 5) * 50]);
        svg.append(p);
      }
    });
    const sotto = [0, 1].map(k => scatole.map(x => nascosto(etichetta(x + 100, 270, k === 0 ? "2 × 5 = 10" : "10", k === 0 ? 24 : 30))));
    const scritte = ["3 × (2 × 5)", "3 × 10 = 30"].map(t => nascosto(etichetta(400, 360, t, 42)));
    svg.append(...sotto.flat(), ...scritte);
    return {
      vai(k) {
        sotto.forEach((riga, j) => riga.forEach(t => vedi(t, k === j)));
        scritte.forEach((t, j) => vedi(t, k === j));
      },
      ferma() {}
    };
  }
};

const DISSOCIATIVA_MOLT = {
  passi: [
    "Proprietà dissociativa della moltiplicazione. 7 × 4: spezzo il 4 in 2 × 2. Prima faccio 7 × 2, che fa 14.",
    "Poi raddoppio: 14 × 2 fa 28. Per moltiplicare per 4 basta fare il doppio del doppio."
  ],
  crea(svg) {
    fondo(svg);
    // due scatole uguali con 14 pallini (2 righe da 7): la seconda arriva al secondo passo
    const scatola = x => {
      const g = s("g", { class: "sp-sfuma" }, s("rect", { x, y: 110, width: 300, height: 120, rx: 16, fill: "#fff", stroke: "#9AA8B4", "stroke-width": 3, "stroke-dasharray": "10 7" }));
      for (let i = 0; i < 14; i++) {
        const p = pallino(ROSSO, 15);
        piazza(p, [x + 42 + (i % 7) * 36, 145 + Math.floor(i / 7) * 50]);
        g.append(p);
      }
      return g;
    };
    const prima = scatola(70), seconda = scatola(430);
    const sotto = [nascosto(etichetta(220, 270, "7 × 2 = 14", 28)), nascosto(etichetta(580, 270, "14", 28))];
    const scritte = ["7 × 4 = 7 × 2 × 2", "14 × 2 = 28"].map(t => nascosto(etichetta(400, 370, t, 42)));
    svg.append(prima, seconda, ...sotto, ...scritte);
    return {
      vai(k) {
        vedi(seconda, k >= 1);
        vedi(sotto[0], true);
        vedi(sotto[1], k >= 1);
        scritte.forEach((t, j) => vedi(t, k === j));
      },
      ferma() {}
    };
  }
};

const DISTRIBUTIVA = {
  passi: [
    "Proprietà distributiva. 6 × 12 è difficile: sono 6 righe da 12 pallini.",
    "Spezzo il 12 in 10 + 2: diventano due schieramenti, 6 × 10 e 6 × 2.",
    "6 × 10 fa 60 e 6 × 2 fa 12. Poi sommo i due pezzi: 60 + 12 fa 72. Quindi 6 × 12 = 72.",
    "Si può spezzare anche con il meno. 6 × 9 è come 6 × 10, meno 6 × 1: 60 − 6 fa 54. Per moltiplicare per 9: moltiplica per 10 e togli una volta il numero."
  ],
  crea(svg) {
    fondo(svg);
    const P = 32;
    const tutti = pallini(72, ROSSO, 11);
    const posto = (i, spezzato) => {
      const c = i % 12, r = Math.floor(i / 12);
      return [(spezzato ? 175 : 224) + c * P + (spezzato && c >= 10 ? 70 : 0), 70 + r * P];
    };
    const sinistra = nascosto(etichetta(175 + 4.5 * P, 290, "6 × 10", 30)), destra = nascosto(etichetta(175 + 10.5 * P + 70, 290, "6 × 2", 30));
    const risultati = [nascosto(etichetta(175 + 4.5 * P, 330, "= 60", 30)), nascosto(etichetta(175 + 10.5 * P + 70, 330, "= 12", 30))];
    const scritte = ["6 × 12 = ?", "6 × 12 = 6 × 10 + 6 × 2", "60 + 12 = 72"].map(t => nascosto(etichetta(400, 405, t, 38)));
    const meno = ["6 × 9", "6 × 10 − 6 × 1", "60 − 6 = 54"].map((t, j) => nascosto(etichetta(400, 120 + j * 100, t, 44)));
    const disegno = s("g", { class: "sp-sfuma" }, ...tutti, sinistra, destra, ...risultati);
    svg.append(disegno, ...scritte, ...meno);
    tutti.forEach((p, i) => piazza(p, posto(i, false)));
    return {
      vai(k) {
        vedi(disegno, k <= 2);
        meno.forEach(t => vedi(t, k === 3));
        tutti.forEach((p, i) => {
          piazza(p, posto(i, k >= 1));
          p.firstChild.setAttribute("fill", k >= 1 && i % 12 >= 10 ? BLU : ROSSO);
        });
        vedi(sinistra, k >= 1);
        vedi(destra, k >= 1);
        risultati.forEach(t => vedi(t, k === 2));
        scritte.forEach((t, j) => vedi(t, k === j));
      },
      ferma() {}
    };
  }
};

/* ---------- il valore posizionale: unità, decine, centinaia ---------- */
// Dieci cubetti diventano una barretta, dieci barrette un quadrato; poi un numero in colonna, cifra per cifra.
const GIALLO = "#F7C900", BRUNO = "#8A6D00";
const mettiA = (g, x, y) => { g.style.transform = "translate(" + x + "px," + y + "px)"; };
const cubo = l => s("rect", { width: l, height: l, rx: 2, fill: GIALLO, stroke: BRUNO, "stroke-width": 1.5 });
function barra(l, verticale) {
  const g = s("g", {}, s("rect", { width: verticale ? l : l * 10, height: verticale ? l * 10 : l, rx: 3, fill: GIALLO, stroke: BRUNO, "stroke-width": 1.5 }));
  for (let j = 1; j < 10; j++) {
    g.append(verticale ? s("line", { x1: 1, x2: l - 1, y1: j * l, y2: j * l, stroke: BRUNO, "stroke-width": 1 })
      : s("line", { x1: j * l, x2: j * l, y1: 1, y2: l - 1, stroke: BRUNO, "stroke-width": 1 }));
  }
  return g;
}
function quadrato(l) {
  const g = s("g", {}, s("rect", { width: l * 10, height: l * 10, rx: 3, fill: GIALLO, stroke: BRUNO, "stroke-width": 2 }));
  for (let j = 1; j < 10; j++) {
    g.append(s("line", { x1: j * l, x2: j * l, y1: 0, y2: l * 10, stroke: BRUNO, "stroke-width": 1 }),
      s("line", { x1: 0, x2: l * 10, y1: j * l, y2: j * l, stroke: BRUNO, "stroke-width": 1 }));
  }
  return g;
}

const VALORE = {
  passi: [
    "Un cubetto è un'unità. Mettiamone dieci in fila: 1, 2, 3… fino a 10.",
    "Dieci unità si attaccano e diventano una barretta: 10 unità fanno 1 decina.",
    "Ora mettiamo insieme dieci barrette, cioè dieci decine…",
    "…e diventano un quadrato: 10 decine fanno 1 centinaio, cioè 100 unità.",
    "Ecco un numero: 2 centinaia, 4 decine e 3 unità. Si scrive 243: a sinistra le centinaia, poi le decine, poi le unità.",
    "La stessa cifra vale di più se sta più a sinistra: in 243 il 2 vale 200, il 4 vale 40 e il 3 vale 3."
  ],
  crea(svg) {
    svg.append(s("rect", { width: 800, height: 450, fill: "#FBF8F1" }));
    const L = 22, X = 290;
    const cubi = Array.from({ length: 10 }, (_, i) => { const g = s("g", { class: "sp-blocco" }, cubo(L)); mettiA(g, X + i * L, 214); return g; });
    const barre = Array.from({ length: 10 }, (_, j) => {
      const g = s("g", { class: "sp-blocco" }, barra(L));
      mettiA(g, j === 0 ? X : X + 420, j === 0 ? 214 : 104 + j * L);
      vedi(g, false);
      return g;
    });
    const grande = s("g", { class: "sp-blocco" }, quadrato(L));
    mettiA(grande, X, 104);
    vedi(grande, false);
    const scritte = ["10 unità", "10 unità = 1 decina", "10 decine", "10 decine = 1 centinaio = 100 unità"].map(t => nascosto(etichetta(400, 405, t, 30)));
    // il numero 243, in colonna
    const colonne = s("g", { class: "sp-sfuma" });
    [[50, 290, "h"], [355, 200, "da"], [570, 180, "u"]].forEach(([x, w, t]) => colonne.append(
      s("rect", { x, y: 45, width: w, height: 225, rx: 14, fill: "#FFF1A8" }),
      scritta(x + w / 2, 34, t, { "font-size": 26, "font-weight": 800, fill: "#5B6670" })));
    [70, 200].forEach(x => { const q = quadrato(12); q.setAttribute("transform", "translate(" + x + ",95)"); colonne.append(q); });
    for (let j = 0; j < 4; j++) { const b = barra(12, true); b.setAttribute("transform", "translate(" + (395 + j * 32) + ",95)"); colonne.append(b); }
    for (let j = 0; j < 3; j++) { const c = cubo(20); c.setAttribute("x", 597 + j * 44); c.setAttribute("y", 150); colonne.append(c); }
    [[195, "2"], [455, "4"], [660, "3"]].forEach(([x, t]) => colonne.append(cifraCol(x, 330, t)));
    const valori = s("g", { class: "sp-sfuma" }, [[195, "200"], [455, "40"], [660, "3"]].map(([x, t]) => etichetta(x, 375, "= " + t, 26)),
      etichetta(400, 432, "243 = 200 + 40 + 3", 30));
    vedi(colonne, false);
    vedi(valori, false);
    svg.append(...cubi, ...barre, grande, ...scritte, colonne, valori);
    return {
      vai(k) {
        cubi.forEach(g => vedi(g, k === 0));
        // la prima barretta nasce dove c'erano i cubetti; le altre arrivano da destra e si mettono sotto
        barre.forEach((g, j) => {
          vedi(g, (k === 1 && j === 0) || k === 2);
          if (k <= 1) mettiA(g, j === 0 ? X : X + 420, j === 0 ? 214 : 104 + j * L);
          else mettiA(g, X, 104 + j * L);
        });
        vedi(grande, k === 3);
        scritte.forEach((t, i) => vedi(t, i === k));
        vedi(colonne, k >= 4);
        vedi(valori, k === 5);
      },
      ferma() {}
    };
  }
};

/* ---------- le frazioni: parti uguali di un intero ---------- */
function spicchio(cx, cy, r, da, a) {
  const p = t => (cx + r * Math.cos(t)).toFixed(1) + "," + (cy + r * Math.sin(t)).toFixed(1);
  return "M" + cx + "," + cy + " L" + p(da) + " A" + r + "," + r + " 0 0 1 " + p(a) + " Z";
}
const PIZZA = "#F4C27A", CROSTA = "#C9822B", POMODORO = "#E0532B";
const FRAZIONI = {
  passi: [
    "Questa è una pizza intera: è l'intero.",
    "La tagliamo in 4 parti uguali: ogni parte è un quarto. Si scrive 1/4.",
    "Attenzione: le parti devono essere uguali! Questa pizza è tagliata in 4 pezzi, ma non sono uguali: non sono quarti.",
    "Prendiamo 3 parti uguali: abbiamo preso tre quarti. Si scrive 3/4.",
    "Sotto la linea c'è il denominatore: in quante parti uguali dividiamo l'intero. Sopra c'è il numeratore: quante parti prendiamo."
  ],
  crea(svg) {
    svg.append(s("rect", { width: 800, height: 450, fill: "#FBF8F1" }));
    const cx = 250, cy = 225, r = 150;
    svg.append(s("circle", { cx, cy, r, fill: PIZZA, stroke: CROSTA, "stroke-width": 12 }));
    const fette = [0, 1, 2, 3].map(k => s("path", { d: spicchio(cx, cy, r - 6, -Math.PI / 2 + k * Math.PI / 2, k * Math.PI / 2), fill: POMODORO, class: "sp-sfuma" }));
    const tagli = nascosto(s("g", {}, s("line", { x1: cx, x2: cx, y1: cy - r, y2: cy + r, stroke: "#7A3E0C", "stroke-width": 5 }),
      s("line", { x1: cx - r, x2: cx + r, y1: cy, y2: cy, stroke: "#7A3E0C", "stroke-width": 5 })));
    // la pizza tagliata male: 4 pezzi, ma di grandezza diversa
    const storta = nascosto(s("g", {}, s("circle", { cx: 600, cy: 230, r: 105, fill: PIZZA, stroke: CROSTA, "stroke-width": 10 }),
      s("line", { x1: 560, x2: 560, y1: 132, y2: 328, stroke: "#7A3E0C", "stroke-width": 5 }),
      s("line", { x1: 497, x2: 703, y1: 265, y2: 265, stroke: "#7A3E0C", "stroke-width": 5 }),
      scritta(705, 120, "✘", { "font-size": 64, "font-weight": 800, fill: "#C0282B" })));
    const sopra = scritta(630, 200, "1", { "font-size": 76, "font-weight": 800, fill: "#1D2329" });
    const sotto = scritta(630, 300, "4", { "font-size": 76, "font-weight": 800, fill: "#1D2329" });
    const frazione = nascosto(s("g", {}, sopra, s("line", { x1: 585, x2: 675, y1: 225, y2: 225, stroke: "#1D2329", "stroke-width": 6 }), sotto));
    const nomi = nascosto(s("g", {}, etichetta(630, 110, "numeratore:", 22), etichetta(630, 138, "quante parti prendo", 19),
      etichetta(630, 352, "denominatore:", 22), etichetta(630, 380, "in quante parti uguali", 19)));
    fette.forEach(f => vedi(f, false));
    svg.append(...fette, tagli, storta, frazione, nomi);
    return {
      vai(k) {
        vedi(tagli, k >= 1);
        fette.forEach((f, i) => vedi(f, (k === 1 && i === 0) || (k >= 3 && i < 3)));
        vedi(storta, k === 2);
        vedi(frazione, k === 1 || k >= 3);
        sopra.textContent = k >= 3 ? "3" : "1";
        vedi(nomi, k === 4);
      },
      ferma() {}
    };
  }
};

/* ---------- pari e dispari: in coppia, a due a due ---------- */
const COLORI_OMINI = ["#2F6FD6", "#E0332B", "#2E9E5B", "#F2A300", "#8E44AD", "#16A3B8", "#E4609B"];
function omino(colore) {
  return s("g", { class: "sp-blocco" }, s("circle", { cx: 0, cy: -46, r: 20, fill: "#F5C9A5", stroke: "#8A5A3C", "stroke-width": 2 }),
    s("rect", { x: -22, y: -24, width: 44, height: 66, rx: 16, fill: colore }));
}
const PARI = {
  passi: [
    "Ecco 6 bambini. Facciamo le coppie: si danno la mano a due a due.",
    "Tutti hanno un compagno, nessuno resta solo: 6 è un numero pari.",
    "Ora i bambini sono 7. Facciamo di nuovo le coppie…",
    "…e uno resta senza compagno: 7 è un numero dispari.",
    "I numeri pari finiscono con 0, 2, 4, 6, 8. I numeri dispari finiscono con 1, 3, 5, 7, 9."
  ],
  crea(svg) {
    svg.append(s("rect", { width: 800, height: 450, fill: "#FBF8F1" }));
    const bimbi = COLORI_OMINI.map(omino);
    const fila = (i, n) => [400 + (i - (n - 1) / 2) * 92, 250];
    bimbi.forEach((b, i) => { mettiA(b, ...fila(Math.min(i, 5), 6)); vedi(b, i < 6); });
    const coppia = (i, n) => {
      const quante = Math.ceil(n / 2), p = Math.floor(i / 2);
      return [400 + (p - (quante - 1) / 2) * 180 + (i % 2 ? 32 : -32), 250];
    };
    const mani = [0, 1, 2].map(() => nascosto(s("line", { x1: -14, x2: 14, y1: 0, y2: 0, stroke: "#8A5A3C", "stroke-width": 8, "stroke-linecap": "round" })));
    const solo = nascosto(s("circle", { r: 70, fill: "none", stroke: "#C0282B", "stroke-width": 5, "stroke-dasharray": "10 8" }));
    const dice = [nascosto(etichetta(400, 395, "6 → tutti in coppia: PARI", 30)), nascosto(etichetta(400, 395, "7 → uno resta solo: DISPARI", 30))];
    const tabella = nascosto(s("g", {},
      etichetta(400, 150, "pari:  0   2   4   6   8", 44), etichetta(400, 290, "dispari:  1   3   5   7   9", 44)));
    tabella.firstChild.setAttribute("fill", "#2F6FD6");
    tabella.lastChild.setAttribute("fill", "#C0282B");
    svg.append(...mani, solo, ...bimbi, ...dice, tabella);
    return {
      vai(k) {
        const n = k <= 1 ? 6 : 7;
        const inCoppia = k === 1 || k === 3;
        bimbi.forEach((b, i) => {
          vedi(b, i < n && k < 4);
          const [x, y] = inCoppia ? coppia(i, n) : fila(Math.min(i, n - 1), n);
          mettiA(b, x, y);
        });
        mani.forEach((m, p) => {
          const [x] = coppia(p * 2, n);
          m.setAttribute("transform", "translate(" + (x + 32) + ",262)");
          vedi(m, inCoppia && k < 4);
        });
        const [sx] = coppia(6, 7);
        solo.setAttribute("cx", sx);
        solo.setAttribute("cy", 240);
        vedi(solo, k === 3);
        vedi(dice[0], k === 1);
        vedi(dice[1], k === 3);
        vedi(tabella, k === 4);
      },
      ferma() {}
    };
  }
};

/* ---------- la retta dei numeri ---------- */
const RETTA = {
  passi: [
    "Sulla retta i numeri stanno in fila, in ordine, tutti alla stessa distanza.",
    "Qui ogni tacca vale 10: da una tacca alla successiva si fa un salto di 10.",
    "Per trovare 70 partiamo da 0 e facciamo 7 salti da 10: 10, 20, 30, 40, 50, 60, 70.",
    "Più si va a destra, più il numero è grande: 70 sta a destra di 40, quindi 70 è più grande di 40."
  ],
  crea(svg) {
    svg.append(s("rect", { width: 800, height: 450, fill: "#FBF8F1" }),
      s("line", { x1: 40, x2: 760, y1: 260, y2: 260, stroke: "#1D2329", "stroke-width": 5 }),
      s("path", { d: "M760,248 L784,260 L760,272 Z", fill: "#1D2329" }));
    const X = k => 70 + k * 66;
    const numeri = [];
    for (let k = 0; k <= 10; k++) {
      const t = scritta(X(k), 305, String(k), { "font-size": 26, "font-weight": 800, fill: "#1D2329" });
      numeri.push(t);
      svg.append(s("line", { x1: X(k), x2: X(k), y1: 244, y2: 276, stroke: "#1D2329", "stroke-width": 4 }), t);
    }
    const salti = Array.from({ length: 7 }, (_, k) => {
      const a = nascosto(s("path", { d: "M" + X(k) + ",244 Q" + (X(k) + 33) + ",180 " + X(k + 1) + ",244", fill: "none", stroke: "#E0332B", "stroke-width": 4 }));
      a.style.transitionDelay = (k * 0.35) + "s";
      svg.append(a, nascosto(scritta(X(k) + 33, 196, "+10", { "font-size": 18, "font-weight": 800, fill: "#C0282B" })));
      return a;
    });
    const piu = Array.from(svg.querySelectorAll("text")).filter(t => t.textContent === "+10");
    const punto = (k, colore) => nascosto(s("circle", { cx: X(k), cy: 260, r: 13, fill: colore, stroke: "#fff", "stroke-width": 3 }));
    const settanta = punto(7, "#E0332B"), quaranta = punto(4, "#2F6FD6");
    const confronto = nascosto(etichetta(400, 400, "40 < 70", 40));
    svg.append(settanta, quaranta, confronto);
    return {
      vai(k) {
        numeri.forEach((t, i) => { t.textContent = String(k === 0 ? i : i * 10); });
        salti.forEach((a, i) => { vedi(a, k === 2); vedi(piu[i], k === 2); });
        vedi(settanta, k >= 2);
        vedi(quaranta, k === 3);
        vedi(confronto, k === 3);
      },
      ferma() {}
    };
  }
};

/* ---------- geometria: linee, angoli, simmetria, perimetro ---------- */
const INCHIOSTRO = "#1D2329";
const riga = (x1, y1, x2, y2, extra) => s("line", Object.assign({ x1, y1, x2, y2, stroke: INCHIOSTRO, "stroke-width": 6, "stroke-linecap": "round" }, extra || {}));
const puntini = (x1, y1, x2, y2) => riga(x1, y1, x2, y2, { "stroke-dasharray": "1 14" });
const punto = (x, y) => s("circle", { cx: x, cy: y, r: 9, fill: "#E0332B" });
// una retta che continua da tutte e due le parti
const rettaIntera = (x1, y1, x2, y2) => {
  const p = t => [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
  return s("g", {}, puntini(...p(0), ...p(0.15)), riga(...p(0.15), ...p(0.85)), puntini(...p(0.85), ...p(1)));
};

const LINEE_RETTE = {
  passi: [
    "Il segmento ha un inizio e una fine, i due puntini rossi: si può misurare con il righello.",
    "La semiretta ha un inizio, l'origine, ma non ha fine: continua per sempre da una parte. I puntini neri vogliono dire «continua».",
    "La retta non ha né inizio né fine: continua per sempre, da tutte e due le parti.",
    "Due rette che non si incontrano mai sono parallele, come i binari del treno.",
    "Due rette che si incontrano sono incidenti. Se si incontrano formando quattro angoli retti sono perpendicolari, come le righe del quaderno a quadretti."
  ],
  crea(svg) {
    svg.append(s("rect", { width: 800, height: 450, fill: "#FBF8F1" }));
    const pieno = riga(160, 200, 640, 200);
    const sx = nascosto(puntini(40, 200, 160, 200)), dx = nascosto(puntini(640, 200, 760, 200));
    const pA = nascosto(punto(160, 200)), pB = nascosto(punto(640, 200));
    const nomi = ["segmento", "semiretta", "retta"].map(t => nascosto(etichetta(400, 300, t, 34)));
    const una = s("g", { class: "sp-sfuma" }, pieno, sx, dx, pA, pB, ...nomi);
    const parallele = nascosto(s("g", {}, rettaIntera(40, 150, 760, 150), rettaIntera(40, 290, 760, 290), etichetta(400, 380, "rette parallele", 32)));
    const incrocio = nascosto(s("g", {}, rettaIntera(50, 330, 370, 110), rettaIntera(50, 120, 370, 320), etichetta(210, 410, "incidenti", 30),
      rettaIntera(430, 220, 770, 220), rettaIntera(600, 50, 600, 390),
      s("path", { d: "M600,190 L630,190 L630,220", stroke: "#E0332B", "stroke-width": 4, fill: "none" }), etichetta(600, 432, "perpendicolari", 30)));
    svg.append(una, parallele, incrocio);
    return {
      vai(k) {
        vedi(una, k <= 2);
        vedi(pA, k <= 1);
        vedi(pB, k === 0);
        vedi(sx, k === 2);
        vedi(dx, k === 1 || k === 2);
        nomi.forEach((n, i) => vedi(n, i === k));
        vedi(parallele, k === 3);
        vedi(incrocio, k === 4);
      },
      ferma() {}
    };
  }
};

const ANGOLI = {
  passi: [
    "Un angolo è l'apertura tra due semirette che partono dallo stesso punto: il vertice.",
    "Pieghiamo un foglio due volte: il suo angolo è l'angolo retto. È il nostro angolo campione.",
    "Un angolo più chiuso dell'angolo retto si chiama acuto.",
    "Un angolo più aperto dell'angolo retto si chiama ottuso.",
    "Se i due lati sono uno il proseguimento dell'altro, l'angolo è piatto: è come due angoli retti."
  ],
  crea(svg) {
    svg.append(s("rect", { width: 800, height: 450, fill: "#FBF8F1" }));
    const V = [400, 340], GRADI = [55, 90, 40, 130, 180];
    const arco = s("path", { fill: "#FFD23F", stroke: "#E0332B", "stroke-width": 3 });
    const campione = nascosto(s("rect", { x: V[0], y: V[1] - 130, width: 130, height: 130, fill: "#2F6FD6", "fill-opacity": 0.25, stroke: "#2F6FD6", "stroke-width": 3 }));
    const lato = s("g", { class: "sp-blocco" }, riga(V[0], V[1], V[0] + 300, V[1]));
    lato.style.transformOrigin = V[0] + "px " + V[1] + "px";
    lato.style.transformBox = "view-box";
    const nomi = ["vertice", "angolo retto", "acuto", "ottuso", "piatto"].map((t, i) => nascosto(etichetta(i === 0 ? V[0] : 400, i === 0 ? V[1] + 50 : 70, t, 34)));
    svg.append(campione, arco, riga(V[0], V[1], V[0] + 300, V[1]), lato, punto(...V), ...nomi);
    return {
      vai(k) {
        const g = GRADI[k], r = 70, rad = g * Math.PI / 180;
        lato.style.transform = "rotate(" + (-g) + "deg)";
        arco.setAttribute("d", "M" + V[0] + "," + V[1] + " L" + (V[0] + r) + "," + V[1] + " A" + r + "," + r + " 0 0 0 " +
          (V[0] + r * Math.cos(rad)).toFixed(1) + "," + (V[1] - r * Math.sin(rad)).toFixed(1) + " Z");
        vedi(campione, k >= 1);
        nomi.forEach((n, i) => vedi(n, i === k));
      },
      ferma() {}
    };
  }
};

const SIMMETRIA = {
  passi: [
    "Questa farfalla ha un asse di simmetria: una linea che la divide in due parti uguali.",
    "Se la pieghiamo lungo l'asse, le due ali combaciano perfettamente.",
    "Ogni punto ha il suo gemello dall'altra parte, alla stessa distanza dall'asse.",
    "Sul quaderno a quadretti si contano i quadretti dall'asse, e si colora alla stessa distanza dall'altra parte."
  ],
  crea(svg) {
    svg.append(s("rect", { width: 800, height: 450, fill: "#FBF8F1" }));
    const ala = () => s("g", {}, s("path", { d: "M400,215 C470,50 650,60 630,185 C620,240 520,236 400,232 Z", fill: "#F2A300", stroke: INCHIOSTRO, "stroke-width": 4 }),
      s("path", { d: "M400,245 C520,245 610,300 570,370 C530,415 445,340 400,268 Z", fill: "#E0532B", stroke: INCHIOSTRO, "stroke-width": 4 }),
      s("circle", { cx: 560, cy: 150, r: 22, fill: "#2F6FD6" }));
    const destra = ala(), sinistra = ala();
    sinistra.classList.add("sp-blocco");
    sinistra.style.transform = "matrix(-1,0,0,1,800,0)";
    const corpo = s("g", {}, s("ellipse", { cx: 400, cy: 250, rx: 11, ry: 105, fill: INCHIOSTRO }),
      s("path", { d: "M396,152 C380,110 360,95 345,90 M404,152 C420,110 440,95 455,90", stroke: INCHIOSTRO, "stroke-width": 4, fill: "none" }));
    const farfalla = s("g", { class: "sp-sfuma" }, destra, sinistra, corpo);
    const asse = s("line", { x1: 400, y1: 30, x2: 400, y2: 430, stroke: "#C0282B", "stroke-width": 4, "stroke-dasharray": "14 10" });
    const gemelli = nascosto(s("g", {}, punto(560, 150), punto(240, 150),
      riga(400, 150, 548, 150, { "stroke-width": 3, "stroke-dasharray": "6 6" }), riga(252, 150, 400, 150, { "stroke-width": 3, "stroke-dasharray": "6 6" }),
      etichetta(475, 135, "uguale", 20), etichetta(325, 135, "uguale", 20)));
    // il quaderno: 5 colonne per parte, la figura a sinistra e la sua gemella a destra
    const Q = 36, X0 = 400 - 5 * Q, Y0 = 110;
    const quaderno = nascosto(s("g", {}));
    for (let i = 0; i <= 10; i++) quaderno.append(s("line", { x1: X0 + i * Q, x2: X0 + i * Q, y1: Y0, y2: Y0 + 6 * Q, stroke: "#B9D3F0", "stroke-width": 1.5 }));
    for (let j = 0; j <= 6; j++) quaderno.append(s("line", { x1: X0, x2: X0 + 10 * Q, y1: Y0 + j * Q, y2: Y0 + j * Q, stroke: "#B9D3F0", "stroke-width": 1.5 }));
    const forma = [[1, 4], [2, 3], [2, 4], [3, 2], [3, 3], [3, 4], [4, 4]];
    forma.forEach(([r, c]) => quaderno.append(s("rect", { x: X0 + c * Q, y: Y0 + r * Q, width: Q, height: Q, fill: "#2F6FD6" }),
      s("rect", { x: X0 + (9 - c) * Q, y: Y0 + r * Q, width: Q, height: Q, fill: "#F2A300" })));
    svg.append(farfalla, quaderno, gemelli, asse);
    return {
      vai(k) {
        vedi(farfalla, k <= 2);
        sinistra.style.transform = k === 1 ? "matrix(1,0,0,1,0,0)" : "matrix(-1,0,0,1,800,0)";
        vedi(gemelli, k === 2);
        vedi(quaderno, k === 3);
      },
      ferma() {}
    };
  }
};

const PERIMETRO = {
  passi: [
    "Il perimetro è la lunghezza del contorno di una figura: il giro tutto intorno.",
    "Una formica cammina sul contorno del rettangolo e conta i lati dei quadretti: 5 in alto, poi 3 a destra…",
    "…poi 5 in basso e 3 a sinistra. È tornata al punto di partenza.",
    "In tutto: 5 + 3 + 5 + 3 = 16. Il perimetro è 16 lati di quadretto.",
    "I quadretti dentro sono un'altra cosa: sono 15, e misurano la superficie."
  ],
  crea(svg) {
    svg.append(s("rect", { width: 800, height: 450, fill: "#FBF8F1" }));
    const u = 50, X = 275, Y = 110;
    for (let i = 0; i <= 16; i++) svg.append(s("line", { x1: i * u, x2: i * u, y1: 0, y2: 450, stroke: "#D5E4F5", "stroke-width": 1.5 }));
    for (let j = 0; j <= 9; j++) svg.append(s("line", { x1: 0, x2: 800, y1: 10 + j * u, y2: 10 + j * u, stroke: "#D5E4F5", "stroke-width": 1.5 }));
    const dentro = nascosto(s("g", {}));
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) dentro.append(s("rect", { x: X + c * u + 4, y: Y + r * u + 4, width: u - 8, height: u - 8, rx: 6, fill: "#FFD23F" }));
    svg.append(dentro, s("rect", { x: X, y: Y, width: 5 * u, height: 3 * u, fill: "none", stroke: "#E0332B", "stroke-width": 6, "stroke-linejoin": "round" }));
    // i numeri del giro, uno per lato di quadretto, che compaiono uno dopo l'altro
    const giro = [];
    const n = (x, y) => { const t = nascosto(scritta(x, y + 8, String(giro.length + 1), { "font-size": 22, "font-weight": 800, fill: "#1E6B52" })); giro.push(t); svg.append(t); };
    for (let i = 0; i < 5; i++) n(X + i * u + u / 2, Y - 20);
    for (let j = 0; j < 3; j++) n(X + 5 * u + 22, Y + j * u + u / 2);
    for (let i = 4; i >= 0; i--) n(X + i * u + u / 2, Y + 3 * u + 22);
    for (let j = 2; j >= 0; j--) n(X - 22, Y + j * u + u / 2);
    const formica = s("text", { x: 0, y: 0, "font-size": 34, "text-anchor": "middle", class: "sp-blocco" }, "🐜");
    const conto = nascosto(etichetta(400, 420, "5 + 3 + 5 + 3 = 16", 34));
    const superficie = nascosto(etichetta(400, 420, "15 quadretti dentro: la superficie", 30));
    svg.append(formica, conto, superficie);
    const angoli = [[X, Y], [X + 5 * u, Y], [X + 5 * u, Y + 3 * u], [X, Y + 3 * u]];
    const verso = ([x, y]) => ({ transform: "translate(" + x + "px," + (y + 12) + "px)" });
    formica.classList.remove("sp-blocco");
    formica.style.transform = verso(angoli[0]).transform;
    return {
      vai(k) {
        giro.forEach((t, i) => {
          t.style.transitionDelay = k === 1 ? (i * 0.25) + "s" : k === 2 ? ((i - 8) * 0.25) + "s" : "0s";
          vedi(t, (k === 1 && i < 8) || k >= 2);
        });
        // la formica gira lungo il contorno, lato per lato (mai in diagonale)
        const tappe = k === 1 ? [0, 1, 2] : k === 2 ? [2, 3, 0] : [0];
        formica.style.transform = verso(angoli[tappe[tappe.length - 1]]).transform;
        if (tappe.length > 1 && formica.animate && !movimentoRidotto()) {
          formica.animate(tappe.map(i => verso(angoli[i])), { duration: 2000, easing: "linear" });
        }
        vedi(conto, k === 3);
        vedi(dentro, k === 4);
        vedi(superficie, k === 4);
      },
      ferma() {}
    };
  }
};

const SPIEGAZIONI = { "stati-materia": STATI, "linee-rette": LINEE_RETTE, angoli: ANGOLI, simmetria: SIMMETRIA, perimetro: PERIMETRO, "valore-posizionale": VALORE, frazioni: FRAZIONI, "pari-dispari": PARI, "retta-numeri": RETTA, riporto: RIPORTO, prestito: PRESTITO, "tavola-pitagorica": TAVOLA,
  moltiplicazione: MOLTIPLICAZIONE, tabelline: insieme(MOLTIPLICAZIONE, TAVOLA), "ciclo-acqua": ACQUA, pianta: PIANTA, "sistema-solare": SISTEMA, universo: UNIVERSO,
  fonti: FONTI, "linea-del-tempo": LINEA, "punti-cardinali": PUNTI, carte: CARTE,
  "proprieta-addizione": insieme(COMMUTATIVA_ADD, ASSOCIATIVA_ADD, DISSOCIATIVA_ADD), "proprieta-sottrazione": INVARIANTIVA,
  "proprieta-moltiplicazione": insieme(COMMUTATIVA_MOLT, ASSOCIATIVA_MOLT, DISSOCIATIVA_MOLT, DISTRIBUTIVA) };

// Un video libero dell'archivio Wikimedia Commons: niente pubblicità. Si carica solo quando qualcuno lo chiede,
// e accanto c'è il link alla sua pagina, dove ci sono autore e licenza.
function videoLibero(nome) {
  const pagina = "https://commons.wikimedia.org/wiki/File:" + encodeURIComponent(nome);
  const box = el("div", { class: "sp-carica" },
    el("button", { type: "button", class: "pulsante", text: "▶ Carica il video", on: { click: () => {
      box.replaceChildren(el("video", { src: "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(nome),
        controls: true, autoplay: true, playsinline: true, preload: "metadata" }));
    } } }),
    el("small", {}, "Video libero, senza pubblicità, dall'archivio Wikimedia Commons. ",
      el("a", { href: pagina, target: "_blank", rel: "noopener", text: "Autore e licenza" })));
  return box;
}

// YouTube solo come seconda scelta: si carica al tocco, e si dice chiaro che può mostrare pubblicità.
function videoYoutube(id) {
  const box = el("div", { class: "sp-carica" },
    el("button", { type: "button", class: "pulsante", text: "▶ Carica il video", on: { click: () => {
      box.replaceChildren(el("iframe", { src: "https://www.youtube-nocookie.com/embed/" + id + "?rel=0", title: "Video",
        allow: "autoplay; encrypted-media; picture-in-picture", allowfullscreen: true, referrerpolicy: "strict-origin-when-cross-origin" }));
    } } }),
    el("small", { text: "Il video arriva da YouTube, che può mostrare pubblicità e riceve i dati della connessione. " +
      "Per non vedere la pubblicità si può usare un browser che la blocca, come Brave." }));
  return box;
}

// scopri: { animazione, commons, youtube }; fine: si chiama quando si passa all'esercizio.
export function spiegazione(scopri, fine) {
  const a = SPIEGAZIONI[scopri.animazione] || null;
  const passi = a ? a.passi.map(p => (typeof p === "string" ? { t: p } : p)) : [];
  if (scopri.commons) passi.push({ t: "Guarda anche questo video.", commons: scopri.commons });
  if (scopri.youtube) passi.push({ t: scopri.commons ? "E guarda anche questo." : "Guarda anche questo video.", youtube: scopri.youtube });
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
    svg.style.display = p.video || p.commons || p.youtube ? "none" : "";
    if (p.video) {
      extra = el("video", { src: "video/" + p.video, autoplay: true, loop: true, playsinline: true, "aria-hidden": "true" });
      extra.muted = true;
      scena.append(extra);
    } else if (p.commons) {
      extra = videoLibero(p.commons);
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
