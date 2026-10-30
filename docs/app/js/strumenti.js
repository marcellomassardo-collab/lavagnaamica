// Strumenti per la LIM: attrezzi liberi da usare mentre si spiega, senza punteggi e senza domande.
// Ogni strumento disegna nella sua area e, se serve, restituisce una funzione per fermarsi (timer, microfono).

import { el, immaginePicto } from "./ui.js";
import { vista, intestazione, quandoSiEsce } from "./pagine.js";
import { centinaio, barretta, cubetto } from "./scena.js";
import { suonoFesta, suonoGiusto } from "./suoni.js";
import { parla } from "./voce.js";
import { impostazioni } from "./impostazioni.js";

const NS = "http://www.w3.org/2000/svg";
function sv(tag, attr, ...figli) {
  const n = document.createElementNS(NS, tag);
  Object.entries(attr || {}).forEach(([k, v]) => n.setAttribute(k, v));
  figli.forEach(f => f && n.append(typeof f === "string" ? document.createTextNode(f) : f));
  return n;
}
const tasto = (testo, fai, extra) => el("button", Object.assign({ type: "button", class: "tasto-piccolo", text: testo, on: { click: fai } }, extra || {}));
const interruttore = (testo, acceso, cambia) => {
  const b = tasto(testo, () => { acceso = !acceso; b.classList.toggle("acceso", acceso); cambia(acceso); });
  b.classList.toggle("acceso", acceso);
  return b;
};
const dici = t => { if (impostazioni.voce) parla(String(t)); };

/* ---------- cornici del 10 ---------- */
function cornici(area, comandi) {
  let quante = 2;
  let mostra = true;
  const numero = el("p", { class: "st-numero" });
  const box = el("div", { class: "st-cornici" });
  const conta = () => {
    const r = box.querySelectorAll(".rosso").length, b = box.querySelectorAll(".blu").length;
    numero.textContent = mostra ? (b ? r + " + " + b + " = " + (r + b) : String(r)) : "";
  };
  function disegna() {
    box.replaceChildren(...Array.from({ length: quante }, () => el("div", { class: "st-cornice" }, Array.from({ length: 10 }, () => {
      const c = el("button", { type: "button", class: "st-casella", "aria-label": "casella" });
      // vuota → rossa → blu → vuota: due colori per vedere le addizioni
      c.addEventListener("click", () => {
        if (c.classList.contains("rosso")) { c.classList.replace("rosso", "blu"); }
        else if (c.classList.contains("blu")) c.classList.remove("blu");
        else c.classList.add("rosso");
        conta();
      });
      return c;
    }))));
    conta();
  }
  comandi.append(tasto("1 cornice", () => { quante = 1; disegna(); }), tasto("2 cornici", () => { quante = 2; disegna(); }),
    tasto("Svuota", disegna), interruttore("Mostra il numero", mostra, v => { mostra = v; conta(); }));
  area.append(box, numero);
  disegna();
}

/* ---------- blocchi: centinaia, decine, unità ---------- */
function blocchi(area, comandi) {
  let mostra = true;
  const quanti = { h: 0, d: 0, u: 0 };
  const fai = { h: centinaio, d: barretta, u: cubetto };
  const nomi = { h: ["h", "centinaia"], d: ["da", "decine"], u: ["u", "unità"] };
  const pezzi = {};
  const numero = el("p", { class: "st-numero" });
  const scrivi = () => {
    const n = quanti.h * 100 + quanti.d * 10 + quanti.u;
    numero.textContent = mostra ? quanti.h + " h  " + quanti.d + " da  " + quanti.u + " u  =  " + n : "";
  };
  const metti = (k, piu) => {
    if (piu && quanti[k] < 19) { quanti[k]++; const b = fai[k](); b.classList.add("visibile"); pezzi[k].append(b); }
    if (!piu && quanti[k] > 0) { quanti[k]--; pezzi[k].lastChild.remove(); }
    scrivi();
  };
  // il cambio: 10 unità diventano una decina, 10 decine un centinaio (e il contrario)
  const cambio = (da, a) => {
    if (quanti[da] < 10) return;
    for (let i = 0; i < 10; i++) metti(da, false);
    metti(a, true);
  };
  const colonna = k => {
    pezzi[k] = el("div", { class: "mb-pezzi" });
    return el("div", { class: "mb-colonna mb-" + k }, el("span", { class: "mb-nome" }, el("b", { text: nomi[k][0] }), " " + nomi[k][1]),
      el("div", { class: "mb-tasti" }, tasto("−", () => metti(k, false)), tasto("+", () => metti(k, true))), pezzi[k]);
  };
  area.append(el("div", { class: "multibase st-largo" }, colonna("h"), colonna("d"), colonna("u")), numero);
  comandi.append(tasto("10 u → 1 da", () => cambio("u", "d")), tasto("10 da → 1 h", () => cambio("d", "h")),
    tasto("Svuota", () => { ["h", "d", "u"].forEach(k => { quanti[k] = 0; pezzi[k].replaceChildren(); }); scrivi(); }),
    interruttore("Mostra il numero", mostra, v => { mostra = v; scrivi(); }));
  scrivi();
}

/* ---------- la retta dei numeri, con i salti ---------- */
function retta(area, comandi) {
  let da = 0, passo = 1;
  let primo = null;
  const box = el("div", { class: "st-retta-box" });
  const campo = (nome, valore, cambia) => {
    const i = el("input", { type: "number", value: valore, "aria-label": nome, class: "st-campo" });
    i.addEventListener("change", () => { cambia(Number(i.value) || 0); disegna(); });
    return el("label", { class: "st-etichetta" }, nome, i);
  };
  function disegna() {
    primo = null;
    const L = 900, x = k => 30 + k * (L - 60) / 10;
    const svg = sv("svg", { viewBox: "0 0 " + L + " 240", class: "st-retta" });
    const salti = sv("g", {});
    svg.append(sv("line", { x1: 10, x2: L - 10, y1: 170, y2: 170, stroke: "#1D2329", "stroke-width": 5 }), salti);
    for (let k = 0; k <= 10; k++) {
      const v = da + k * passo;
      const g = sv("g", { class: "st-tacca", tabindex: 0, role: "button", "aria-label": String(v) },
        sv("rect", { x: x(k) - 30, y: 120, width: 60, height: 110, fill: "transparent" }),
        sv("line", { x1: x(k), x2: x(k), y1: 152, y2: 188, stroke: "#1D2329", "stroke-width": 5 }),
        sv("text", { x: x(k), y: 222, "text-anchor": "middle", "font-size": 26, "font-weight": 800, fill: "#1D2329" }, String(v)));
      // si tocca una tacca e poi un'altra: compare il salto, con quanto vale
      g.addEventListener("click", () => {
        if (primo === null) { primo = k; g.classList.add("scelta"); dici(v); return; }
        const a = primo;
        primo = null;
        svg.querySelectorAll(".scelta").forEach(n => n.classList.remove("scelta"));
        if (a === k) return;
        const alto = 150 - Math.min(110, 30 + Math.abs(k - a) * 12);
        salti.append(sv("path", { d: "M" + x(a) + ",160 Q" + (x(a) + x(k)) / 2 + "," + alto + " " + x(k) + ",160", fill: "none", stroke: "#E0332B", "stroke-width": 4 }),
          sv("text", { x: (x(a) + x(k)) / 2, y: (160 + alto) / 2 - 4, "text-anchor": "middle", "font-size": 24, "font-weight": 800, fill: "#C0282B" },
            ((k - a) * passo > 0 ? "+" : "−") + Math.abs((k - a) * passo)));
        dici(((k - a) * passo > 0 ? "più " : "meno ") + Math.abs((k - a) * passo));
      });
      svg.append(g);
    }
    box.replaceChildren(svg);
  }
  comandi.append(campo("Parte da", da, v => { da = v; }), campo("Ogni tacca vale", passo, v => { passo = v || 1; }), tasto("Cancella i salti", disegna));
  area.append(box, el("p", { class: "tenue", text: "Tocca una tacca e poi un'altra: compare il salto." }));
  disegna();
}

/* ---------- geopiano ---------- */
function geopiano(area, comandi) {
  const N = 6, P = 80, COLORI = ["#E0332B", "#2F6FD6", "#2E9E5B", "#F2A300", "#8E44AD"];
  const svg = sv("svg", { viewBox: "0 0 " + (N * P) + " " + (N * P), class: "st-geopiano" });
  const elastici = sv("g", {});
  let punti = [], linea = null, colore = 0;
  const c = i => P / 2 + i * P;
  function nuovo() {
    punti = [];
    linea = sv("polyline", { points: "", fill: COLORI[colore % COLORI.length], "fill-opacity": 0.18, stroke: COLORI[colore % COLORI.length], "stroke-width": 7, "stroke-linejoin": "round" });
    colore++;
    elastici.append(linea);
  }
  svg.append(sv("rect", { width: N * P, height: N * P, rx: 18, fill: "#C9A26B" }), elastici);
  for (let r = 0; r < N; r++) {
    for (let k = 0; k < N; k++) {
      const chiodo = sv("circle", { cx: c(k), cy: c(r), r: 12, fill: "#5B3A1A", class: "st-chiodo" });
      // si tocca un chiodo dopo l'altro; toccando di nuovo il primo l'elastico si chiude
      chiodo.addEventListener("click", () => {
        if (punti.length > 2 && punti[0][0] === c(k) && punti[0][1] === c(r)) {
          linea.setAttribute("points", punti.concat([punti[0]]).map(p => p.join(",")).join(" "));
          nuovo();
          return;
        }
        punti.push([c(k), c(r)]);
        linea.setAttribute("points", punti.map(p => p.join(",")).join(" "));
      });
      svg.append(chiodo);
    }
  }
  nuovo();
  comandi.append(tasto("Nuovo elastico", nuovo), tasto("Cancella tutto", () => { elastici.replaceChildren(); nuovo(); }));
  area.append(svg, el("p", { class: "tenue", text: "Tocca i chiodi uno dopo l'altro; tocca di nuovo il primo per chiudere la figura." }));
}

/* ---------- frazioni ---------- */
function frazioni(area, comandi) {
  let parti = 4, forma = "cerchio", mostra = true;
  const box = el("div", { class: "st-frazioni" });
  const scritta = el("p", { class: "st-numero" });
  function disegna() {
    const svg = sv("svg", { viewBox: forma === "barra" ? "0 0 420 120" : "0 0 240 240", class: "fr-figura fr-" + forma });
    const pezzi = Array.from({ length: parti }, (_, k) => {
      let p;
      if (forma === "barra") p = sv("rect", { x: (10 + k * 400 / parti).toFixed(2), y: 10, width: (400 / parti).toFixed(2), height: 100 });
      else {
        const r = 110, cx = 120, a0 = -Math.PI / 2 + k * 2 * Math.PI / parti, a1 = a0 + 2 * Math.PI / parti;
        const pt = t => (cx + r * Math.cos(t)).toFixed(2) + "," + (cx + r * Math.sin(t)).toFixed(2);
        p = parti === 1 ? sv("circle", { cx, cy: cx, r }) : sv("path", { d: "M" + cx + "," + cx + " L" + pt(a0) + " A" + r + "," + r + " 0 0 1 " + pt(a1) + " Z" });
      }
      p.setAttribute("class", "fr-parte");
      p.setAttribute("role", "button");
      p.addEventListener("click", () => { p.classList.toggle("colorata"); conta(); });
      svg.append(p);
      return p;
    });
    const conta = () => {
      const k = pezzi.filter(p => p.classList.contains("colorata")).length;
      scritta.textContent = mostra ? k + "/" + parti : "";
    };
    box.replaceChildren(svg);
    conta();
  }
  const scegli = el("select", { class: "tasto-piccolo", "aria-label": "In quante parti" },
    Array.from({ length: 12 }, (_, i) => el("option", { value: i + 1, selected: i + 1 === parti, text: (i + 1) + (i ? " parti" : " intero") })));
  scegli.addEventListener("change", () => { parti = Number(scegli.value); disegna(); });
  comandi.append(scegli, tasto("Cerchio", () => { forma = "cerchio"; disegna(); }), tasto("Barra", () => { forma = "barra"; disegna(); }),
    tasto("Svuota", disegna), interruttore("Mostra la frazione", mostra, v => { mostra = v; disegna(); }));
  area.append(box, scritta);
  disegna();
}

/* ---------- orologio ---------- */
const ORE = ["mezzanotte", "l'una", "le due", "le tre", "le quattro", "le cinque", "le sei", "le sette", "le otto", "le nove", "le dieci", "le undici", "mezzogiorno"];
function orologio(area, comandi) {
  let minuti = 3 * 60;          // da 0 a 719: 12 ore sul quadrante
  let digitale = true;
  const svg = sv("svg", { viewBox: "-120 -120 240 240", class: "st-orologio" });
  svg.append(sv("circle", { r: 112, fill: "#fff", stroke: "#1D2329", "stroke-width": 6 }));
  for (let i = 0; i < 60; i++) {
    const a = i * Math.PI / 30, lungo = i % 5 === 0;
    svg.append(sv("line", { x1: (100 * Math.sin(a)).toFixed(1), y1: (-100 * Math.cos(a)).toFixed(1), x2: ((lungo ? 88 : 95) * Math.sin(a)).toFixed(1),
      y2: (-(lungo ? 88 : 95) * Math.cos(a)).toFixed(1), stroke: "#1D2329", "stroke-width": lungo ? 4 : 1.5 }));
    if (lungo) svg.append(sv("text", { x: (72 * Math.sin(a)).toFixed(1), y: (-72 * Math.cos(a) + 8).toFixed(1), "text-anchor": "middle", "font-size": 22, "font-weight": 800, fill: "#1D2329" }, String(i / 5 || 12)));
  }
  const ora = sv("line", { x1: 0, y1: 0, x2: 0, y2: -50, stroke: "#1D2329", "stroke-width": 9, "stroke-linecap": "round" });
  const min = sv("line", { x1: 0, y1: 0, x2: 0, y2: -84, stroke: "#E0332B", "stroke-width": 6, "stroke-linecap": "round" });
  svg.append(ora, min, sv("circle", { r: 7, fill: "#1D2329" }));
  const scritta = el("p", { class: "st-numero" });
  function disegna() {
    minuti = ((minuti % 720) + 720) % 720;
    const h = Math.floor(minuti / 60), m = minuti % 60;
    min.setAttribute("transform", "rotate(" + m * 6 + ")");
    ora.setAttribute("transform", "rotate(" + (h * 30 + m / 2) + ")");
    const parole = (h === 0 ? "le dodici" : ORE[h]) + (m === 0 ? " in punto" : m === 15 ? " e un quarto" : m === 30 ? " e mezza" : m === 45 ? " e tre quarti" : " e " + m);
    scritta.textContent = digitale ? (h || 12) + ":" + String(m).padStart(2, "0") + " · " + parole : "";
  }
  // si trascina la lancetta lunga: quando passa per il 12, l'ora va avanti o indietro
  let tiro = false;
  const angolo = e => {
    const r = svg.getBoundingClientRect();
    const a = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2)));
    return Math.round(((a * 180 / Math.PI + 360) % 360) / 6) % 60;
  };
  svg.addEventListener("pointerdown", e => { tiro = true; svg.setPointerCapture(e.pointerId); });
  svg.addEventListener("pointermove", e => {
    if (!tiro) return;
    const nuovo = angolo(e), vecchio = minuti % 60;
    let d = nuovo - vecchio;
    if (d > 30) d -= 60;
    if (d < -30) d += 60;
    minuti += d;
    disegna();
  });
  svg.addEventListener("pointerup", () => { tiro = false; });
  comandi.append(tasto("− 1 ora", () => { minuti -= 60; disegna(); }), tasto("− 5 min", () => { minuti -= 5; disegna(); }),
    tasto("+ 5 min", () => { minuti += 5; disegna(); }), tasto("+ 1 ora", () => { minuti += 60; disegna(); }),
    interruttore("Mostra l'ora", digitale, v => { digitale = v; disegna(); }));
  area.append(svg, scritta, el("p", { class: "tenue", text: "Trascina la lancetta lunga, oppure usa i tasti." }));
  disegna();
}

/* ---------- monete e banconote ---------- */
const SOLDI = [[1, 4775], [2, 4777], [5, 4779], [10, 4781], [20, 4783], [50, 4785], [100, 4776], [200, 10279], [500, 4780], [1000, 4782], [2000, 4784], [5000, 4786]];
const euro = c => (c >= 100 ? (c / 100).toFixed(2).replace(".", ",").replace(",00", "") + " euro" : c + (c === 1 ? " centesimo" : " centesimi"));
function soldi(area, comandi) {
  let mostra = true;
  const vassoio = el("div", { class: "st-vassoio" });
  const totale = el("p", { class: "st-numero" });
  const conta = () => {
    const c = [...vassoio.children].reduce((s, n) => s + Number(n.dataset.valore), 0);
    totale.textContent = mostra ? "In tutto: " + euro(c) : "";
  };
  const cassa = el("div", { class: "st-cassa" }, SOLDI.map(([v, p]) => el("button", { type: "button", class: "st-soldo", "aria-label": euro(v), on: { click: () => {
    // nel vassoio: toccando un pezzo lo si toglie
    const pezzo = el("button", { type: "button", class: "st-soldo", "data-valore": v, "aria-label": euro(v), on: { click: () => { pezzo.remove(); conta(); } } }, immaginePicto(p, euro(v)));
    vassoio.append(pezzo);
    conta();
    dici(euro(v));
  } } }, immaginePicto(p, euro(v)))));
  comandi.append(tasto("Svuota", () => { vassoio.replaceChildren(); conta(); }), interruttore("Mostra il totale", mostra, v => { mostra = v; conta(); }));
  area.append(cassa, el("p", { class: "tenue", text: "Tocca una moneta o una banconota per metterla nel vassoio; toccala nel vassoio per toglierla." }), vassoio, totale);
  conta();
}

/* ---------- timer visivo ---------- */
function timer(area, comandi) {
  let durata = 5 * 60, resta = durata, attivo = false, ultimo = 0, id = 0;
  const R = 100;
  const spicchio = sv("path", { fill: "#E0332B" });
  const svg = sv("svg", { viewBox: "-110 -110 220 220", class: "st-timer" }, sv("circle", { r: R + 6, fill: "#fff", stroke: "#1D2329", "stroke-width": 5 }), spicchio);
  const scritta = el("p", { class: "st-numero" });
  function disegna() {
    const q = Math.max(0, resta / durata), a = q * 2 * Math.PI;
    spicchio.setAttribute("d", q >= 0.9999 ? "M0,-" + R + " A" + R + "," + R + " 0 1 1 -0.01,-" + R + " Z" :
      q <= 0 ? "" : "M0,0 L0,-" + R + " A" + R + "," + R + " 0 " + (a > Math.PI ? 1 : 0) + " 0 " + (-R * Math.sin(a)).toFixed(2) + "," + (-R * Math.cos(a)).toFixed(2) + " Z");
    const s = Math.ceil(resta);
    scritta.textContent = Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }
  // si conta con l'orologio del dispositivo: il tempo passa giusto anche se la finestra resta indietro
  function giro() {
    if (!attivo) return;
    const t = performance.now();
    resta -= (t - ultimo) / 1000;
    ultimo = t;
    if (resta <= 0) { resta = 0; attivo = false; clearInterval(id); disegna(); suonoFesta(); dici("Tempo finito!"); return; }
    disegna();
  }
  const via = tasto("▶ Via", () => {
    attivo = !attivo;
    via.textContent = attivo ? "⏸ Pausa" : "▶ Via";
    clearInterval(id);
    if (attivo) { ultimo = performance.now(); id = setInterval(giro, 200); }
  });
  const imposta = m => { attivo = false; clearInterval(id); via.textContent = "▶ Via"; durata = resta = m * 60; disegna(); };
  comandi.append(...[1, 2, 3, 5, 10, 15].map(m => tasto(m + " min", () => imposta(m))), via, tasto("↺ Da capo", () => imposta(durata / 60)));
  area.append(svg, scritta);
  disegna();
  return () => { attivo = false; clearInterval(id); };
}

/* ---------- semaforo del rumore ---------- */
function rumore(area, comandi) {
  let flusso = null, contesto = null, id = 0, soglia = 0.12;
  const luci = ["rosso", "giallo", "verde"].map(c => el("span", { class: "st-luce st-" + c }));
  const semaforo = el("div", { class: "st-semaforo" }, luci);
  const accendi = k => luci.forEach((l, i) => l.classList.toggle("accesa", i === k));
  luci.forEach((l, i) => l.addEventListener("click", () => accendi(i)));
  accendi(2);
  const stato = el("p", { class: "tenue", text: "Tocca le luci per cambiarle a mano, oppure fai ascoltare il microfono." });
  const sensibilita = el("input", { type: "range", min: "0.03", max: "0.3", step: "0.01", value: soglia, "aria-label": "Sensibilità" });
  sensibilita.addEventListener("input", () => { soglia = Number(sensibilita.value); });
  async function ascolta() {
    if (flusso) return;
    try {
      flusso = await navigator.mediaDevices.getUserMedia({ audio: true });
      contesto = new AudioContext();
      const analisi = contesto.createAnalyser();
      analisi.fftSize = 1024;
      contesto.createMediaStreamSource(flusso).connect(analisi);
      const dati = new Float32Array(analisi.fftSize);
      let livello = 0;
      const giro = () => {
        analisi.getFloatTimeDomainData(dati);
        const rms = Math.sqrt(dati.reduce((s, x) => s + x * x, 0) / dati.length);
        livello = livello * 0.9 + rms * 0.1;   // si smussa: un colpo di tosse non accende il rosso
        accendi(livello > soglia ? 0 : livello > soglia * 0.6 ? 1 : 2);
        id = requestAnimationFrame(giro);
      };
      giro();
      stato.textContent = "Il microfono misura solo quanto è forte il suono, qui sul dispositivo: niente viene registrato o inviato.";
    } catch (e) {
      stato.textContent = "Il microfono non è disponibile: usa le luci a mano.";
    }
  }
  function ferma() {
    cancelAnimationFrame(id);
    if (flusso) flusso.getTracks().forEach(t => t.stop());
    if (contesto) contesto.close();
    flusso = contesto = null;
  }
  comandi.append(tasto("🎤 Ascolta il rumore", ascolta), tasto("Ferma il microfono", () => { ferma(); stato.textContent = "Microfono spento."; }),
    el("label", { class: "st-etichetta" }, "Sensibilità", sensibilita));
  area.append(semaforo, stato);
  return ferma;
}

/* ---------- dadi ---------- */
const PUNTI = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] };
function dadi(area, comandi) {
  let quanti = 2;
  const tavolo = el("div", { class: "st-dadi" });
  const somma = el("p", { class: "st-numero" });
  const faccia = n => sv("svg", { viewBox: "0 0 100 100", class: "st-dado" }, sv("rect", { x: 4, y: 4, width: 92, height: 92, rx: 18, fill: "#fff", stroke: "#1D2329", "stroke-width": 5 }),
    ...PUNTI[n].map(([x, y]) => sv("circle", { cx: 26 + x * 24, cy: 26 + y * 24, r: 9, fill: "#1D2329" })));
  function tira() {
    const n = Array.from({ length: quanti }, () => 1 + Math.floor(Math.random() * 6));
    tavolo.replaceChildren(...n.map(faccia));
    tavolo.classList.remove("rotola");
    void tavolo.offsetWidth;
    tavolo.classList.add("rotola");
    somma.textContent = quanti > 1 ? n.join(" + ") + " = " + n.reduce((a, b) => a + b) : String(n[0]);
    dici(somma.textContent.replace(/\+/g, "più").replace("=", "uguale"));
  }
  comandi.append(tasto("1 dado", () => { quanti = 1; tira(); }), tasto("2 dadi", () => { quanti = 2; tira(); }), tasto("3 dadi", () => { quanti = 3; tira(); }));
  area.append(el("button", { type: "button", class: "st-tavolo", "aria-label": "Tira i dadi", on: { click: tira } }, tavolo), somma,
    el("p", { class: "tenue", text: "Tocca i dadi per tirarli." }));
  tira();
}

/* ---------- estrattore di numeri ---------- */
function estrattore(area, comandi) {
  let fino = 20, usciti = [];
  const grande = el("p", { class: "st-estratto", text: "?" });
  const lista = el("p", { class: "tenue" });
  const campo = el("input", { type: "number", min: "2", max: "99", value: fino, class: "st-campo", "aria-label": "Fino a" });
  campo.addEventListener("change", () => { fino = Math.max(2, Math.min(99, Number(campo.value) || 20)); usciti = []; grande.textContent = "?"; lista.textContent = ""; });
  const estrai = () => {
    const restano = Array.from({ length: fino }, (_, i) => i + 1).filter(n => !usciti.includes(n));
    if (!restano.length) { grande.textContent = "✔"; lista.textContent = "Sono usciti tutti."; return; }
    const n = restano[Math.floor(Math.random() * restano.length)];
    usciti.push(n);
    grande.textContent = String(n);
    grande.classList.remove("nuovo");
    void grande.offsetWidth;
    grande.classList.add("nuovo");
    lista.textContent = "Già usciti: " + usciti.join(", ");
    suonoGiusto();
    dici(n);
  };
  comandi.append(el("label", { class: "st-etichetta" }, "Numeri da 1 a", campo), tasto("🎲 Estrai", estrai),
    tasto("Rimetti tutti", () => { usciti = []; grande.textContent = "?"; lista.textContent = ""; }));
  area.append(grande, lista, el("p", { class: "tenue", text: "Ogni alunno ha un numero: l'estrattore non usa mai i nomi." }));
}

const STRUMENTI = {
  cornici: ["🔟", "Cornici del 10", cornici], blocchi: ["🧱", "Blocchi h da u", blocchi], retta: ["📏", "Retta dei numeri", retta],
  geopiano: ["📌", "Geopiano", geopiano], frazioni: ["🍕", "Frazioni", frazioni], orologio: ["🕒", "Orologio", orologio],
  soldi: ["💶", "Monete e banconote", soldi], timer: ["⏳", "Timer", timer], rumore: ["🚦", "Semaforo del rumore", rumore],
  dadi: ["🎲", "Dadi", dadi], estrattore: ["🔢", "Estrattore di numeri", estrattore]
};

export function vistaStrumenti(scelto) {
  const chiave = STRUMENTI[scelto] ? scelto : "cornici";
  const [icona, nome, crea] = STRUMENTI[chiave];
  const comandi = el("div", { class: "st-comandi" });
  const area = el("div", { class: "st-area" });
  const ferma = crea(area, comandi);
  vista(el("div", { class: "pagina" }, intestazione(), el("main", { class: "contenuto strumenti" },
    el("a", { class: "tasto-piccolo indietro", href: "#/", text: "⟵ Home" }),
    el("h1", { text: "🧰 Strumenti per la LIM" }),
    el("nav", { class: "st-scelta", "aria-label": "Strumenti" }, Object.entries(STRUMENTI).map(([k, [i, n]]) =>
      el("a", { class: "st-voce" + (k === chiave ? " attiva" : ""), href: "#/strumenti/" + k, "aria-current": k === chiave ? "page" : null },
        el("span", { "aria-hidden": "true", text: i }), n))),
    el("section", { class: "st-lavagna", "aria-label": nome }, el("h2", { text: icona + " " + nome }), comandi, area))));
  if (typeof ferma === "function") quandoSiEsce(ferma);
}
