// Le rappresentazioni della matematica: oggetti in file da dieci (con uno spazio dopo il quinto,
// così si contano a colpo d'occhio e si vedono le decine), gruppi uguali, schieramenti, piatti
// per dividere, barrette delle decine e linea dei numeri. Tutto si anima, salvo per chi ha
// chiesto al sistema meno movimento.

import { el, immaginePicto } from "./ui.js";

export const movimentoRidotto = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

export const aspetta = ms => new Promise(r => setTimeout(r, movimentoRidotto() ? 0 : ms));

export function oggetto(o, classe) {
  return el("span", { class: "ogg " + (classe || ""), "data-ogg": true },
    o && o.p ? immaginePicto(o.p, "") : el("span", { class: "pallino", "aria-hidden": "true" }));
}

export function oggetti(n, o, classe) {
  return Array.from({ length: n }, () => oggetto(o, classe));
}

export function file10(nodi, classe) {
  return el("div", { class: "file-10 " + (classe || "") }, nodi);
}

// Fa comparire gli oggetti uno alla volta, più in fretta quando sono tanti.
export async function compari(nodi, fermo) {
  const passo = Math.max(25, Math.min(140, 1600 / Math.max(1, nodi.length)));
  for (const n of nodi) {
    if (fermo && fermo()) return;
    n.classList.add("visibile");
    await aspetta(passo);
  }
}

// Sposta un oggetto in un altro contenitore e lo fa «volare» dalla vecchia alla nuova posizione.
export async function sposta(nodo, dove) {
  const prima = nodo.getBoundingClientRect();
  dove.append(nodo);
  if (movimentoRidotto() || !nodo.animate) return;
  const dopo = nodo.getBoundingClientRect();
  nodo.animate([
    { transform: "translate(" + (prima.left - dopo.left) + "px," + (prima.top - dopo.top) + "px)" },
    { transform: "none" }
  ], { duration: 420, easing: "cubic-bezier(.3,.7,.4,1)" });
  await aspetta(420);
}

// Contare col dito: ogni oggetto toccato prende il suo numero e la voce lo dice.
// Le barrette delle decine valgono 10 (data-valore), così si conta anche per decine.
export function contaToccando(radice, leggi) {
  let conta = 0;
  radice.addEventListener("click", e => {
    const o = e.target.closest("[data-ogg]");
    if (!o || o.dataset.n || o.classList.contains("via") || o.closest(".mucchio") || !radice.contains(o)) return;
    conta += Number(o.dataset.valore || 1);
    o.dataset.n = conta;
    leggi(String(conta));
  });
  return () => {
    conta = 0;
    radice.querySelectorAll("[data-n]").forEach(o => o.removeAttribute("data-n"));
  };
}

export function gruppo(contenitore, figli) {
  return el("div", { class: "gruppo-m" },
    contenitore && contenitore.p ? el("span", { class: "gruppo-testa" }, immaginePicto(contenitore.p, contenitore.t || "")) : null,
    el("div", { class: "gruppo-dentro" }, figli));
}

export const barretta = () => el("span", { class: "ogg decina", "data-ogg": true, "data-valore": 10, "aria-label": "una decina" },
  Array.from({ length: 10 }, () => el("i")));
export const cubetto = () => el("span", { class: "ogg unita", "data-ogg": true, "aria-label": "una unità" });
// il centinaio è un quadrato di 10 × 10 quadretti (disegnati con lo sfondo, non con cento elementi)
export const centinaio = () => el("span", { class: "ogg centinaio", "data-ogg": true, "data-valore": 100, "aria-label": "un centinaio" });

export function decine(n) {
  const barrette = Array.from({ length: Math.floor(n / 10) }, barretta);
  const unita = Array.from({ length: n % 10 }, cubetto);
  return { vista: el("div", { class: "decine-vista" }, el("div", { class: "barrette" }, barrette), el("div", { class: "unita-tutte" }, unita)), barrette, unita };
}

// Come sposta(), ma per tanti oggetti insieme: volano tutti nello stesso momento.
export async function spostaInsieme(nodi, dove) {
  const prima = nodi.map(n => n.getBoundingClientRect());
  dove.append(...nodi);
  if (movimentoRidotto() || !nodi.length || !nodi[0].animate) return;
  nodi.forEach((n, k) => {
    const dopo = n.getBoundingClientRect();
    n.animate([
      { transform: "translate(" + (prima[k].left - dopo.left) + "px," + (prima[k].top - dopo.top) + "px)" },
      { transform: "none" }
    ], { duration: 520, easing: "cubic-bezier(.3,.7,.4,1)" });
  });
  await aspetta(520);
}

// Cambia la disposizione degli oggetti (fai) e li fa scivolare dalle vecchie posizioni alle nuove:
// per girare uno schieramento, spezzarlo in due, scambiare due gruppi.
export async function riordina(nodi, fai) {
  const prima = nodi.map(n => n.getBoundingClientRect());
  fai();
  if (movimentoRidotto() || !nodi.length || !nodi[0].animate) return;
  nodi.forEach((n, k) => {
    const dopo = n.getBoundingClientRect();
    n.animate([
      { transform: "translate(" + (prima[k].left - dopo.left) + "px," + (prima[k].top - dopo.top) + "px)" },
      { transform: "none" }
    ], { duration: 800, easing: "cubic-bezier(.3,.7,.4,1)" });
  });
  await aspetta(800);
}

export function linea(da, a, segnato) {
  const celle = [];
  for (let k = da; k <= a; k++) celle.push(el("span", { class: "tacca" + (k === segnato ? " segnata" : ""), "data-numero": k, text: String(k) }));
  return el("div", { class: "linea-numeri" }, celle);
}
