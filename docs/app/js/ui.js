// Pezzi d'interfaccia condivisi da giochi, editor e pagine.

import { impostazioni } from "./impostazioni.js";
import { linguaAttuale, parla, parlaEAspetta, voceDisponibile } from "./voce.js";
import { suonoGiusto, suonoRiprova } from "./suoni.js";
import { inSillabe } from "./sillabe.js";

export function el(tag, attr, ...figli) {
  const n = document.createElement(tag);
  Object.entries(attr || {}).forEach(([k, v]) => {
    if (v === null || v === undefined || v === false) return;
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k === "on") Object.entries(v).forEach(([evento, fn]) => n.addEventListener(evento, fn));
    else n.setAttribute(k, v === true ? "" : v);
  });
  figli.flat(Infinity).forEach(f => {
    if (f === null || f === undefined || f === false) return;
    n.append(typeof f === "string" ? document.createTextNode(f) : f);
  });
  return n;
}

export function mescola(lista) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function immaginePicto(id, alt) {
  const img = document.createElement("img");
  img.crossOrigin = "anonymous";
  img.alt = alt || "";
  img.draggable = false;
  img.decoding = "async";
  img.src = "https://static.arasaac.org/pictograms/" + id + "/" + id + "_300.png";
  return img;
}

// Una carta: immagine e/o testo. data-voce contiene ciò che va letto ad alta voce.
export function fotoCarta(file, alt) {
  return el("img", { class: "foto", src: "foto/" + file, alt: alt || "", draggable: "false", decoding: "async" });
}

// Un testo per la scrittura «doppia»: sopra in stampato maiuscolo, sotto com'è scritto (minuscolo,
// con la maiuscola a inizio frase). Con le altre scritture si vede una riga sola.
// «evidenzia»: quanti caratteri iniziali mettere in grassetto.
// Le sillabe colorate (se sono accese nelle impostazioni): blu e rosso alternati, ogni parola comincia dal blu.
function aSillabe(t) {
  return inSillabe(String(t)).map(p => (p.sillabe ? p.sillabe.map((x, j) => el("span", { class: j % 2 ? "sil-b" : "sil-a", text: x })) : p.t));
}

export function due(t, evidenzia) {
  const colori = !evidenzia && impostazioni.sillabe && linguaAttuale() !== "en" && /\p{L}/u.test(String(t));
  const riga = classe => el("span", { class: classe },
    evidenzia ? [el("b", { text: t.slice(0, evidenzia) }), t.slice(evidenzia)] : colori ? aSillabe(t) : t);
  return el("span", { class: "due" }, riga("alto"), riga("basso"));
}

export function carta(e, classe, attr) {
  // una o due lettere (alfabeto, sillabe) si scrivono grandi
  const breve = e.t && !e.p && !e.f && e.t.trim().length <= 3 ? " breve" : "";
  return el("div", Object.assign({ class: "carta" + breve + " " + (classe || ""), "data-voce": e.t || null }, attr),
    e.f ? fotoCarta(e.f, e.t) : e.p ? immaginePicto(e.p, e.t) : null,
    e.t ? el("span", { class: "carta-testo" }, due(e.t)) : null);
}

export function pulsanteVoce(testo, etichetta, lingua) {
  const b = el("button", { type: "button", class: "voce", "aria-label": etichetta || "Ascolta", text: "🔊" });
  if (!voceDisponibile) b.hidden = true;
  b.addEventListener("click", e => {
    e.stopPropagation();
    parla(typeof testo === "function" ? testo() : testo, lingua);
  });
  return b;
}

// ---------- un po' di movimento: le scelte entrano una dopo l'altra, la risposta giusta salta e manda stelline ----------
const fermi = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
const ENTRANO = ".gi-box, .sc-scatola, .carta, .opzione, .let-opzione, .let-tessera, .let-pezzo, .brano-opzione, .mat-opzione, .vf-coppia, .vf-tasto, .barre-scelta, .logica-tessera, .piramide-riga";
const viste = new WeakSet();

// Le carte nuove entrano una alla volta, ma solo la prima volta: quando si spostano (trascinate, rimesse nel mucchio) non rientrano.
export function animaEntrate(area) {
  if (fermi() || !window.MutationObserver) return () => {};
  let fila = 0, azzera = null;
  const entra = n => {
    // le facce delle carte da girare non entrano da sole: entra la carta intera (un'animazione lì dentro rompe la girata)
    if (viste.has(n) || n.closest(".gi-faccia, .talpa")) return;
    viste.add(n);
    n.style.animationDelay = Math.min(fila++, 10) * 60 + "ms";
    n.classList.add("entra");
    n.addEventListener("animationend", () => { n.classList.remove("entra"); n.style.animationDelay = ""; }, { once: true });
    clearTimeout(azzera);
    azzera = setTimeout(() => { fila = 0; }, 120);
  };
  const guarda = radice => {
    if (radice.nodeType !== 1) return;
    if (radice.matches(ENTRANO)) entra(radice);
    radice.querySelectorAll(ENTRANO).forEach(entra);
  };
  // quelle che ci sono già al primo giro non devono «entrare» di nuovo dopo
  const o = new MutationObserver(lista => lista.forEach(m => m.addedNodes.forEach(guarda)));
  o.observe(area, { childList: true, subtree: true });
  guarda(area);
  return () => o.disconnect();
}

// Stelline che partono dalla risposta giusta.
function stelline(n) {
  if (fermi() || !n || !n.getBoundingClientRect) return;
  const r = n.getBoundingClientRect();
  if (!r.width) return;
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const colori = ["#FFD23F", "#1E8A4C", "#2B7FC4", "#E0332B", "#7B4FC9"];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.random() * 0.4;
    const d = 60 + Math.random() * 50;
    const s = el("span", { class: "stellina", "aria-hidden": "true", text: i % 2 ? "★" : "✦" });
    s.style.cssText = "left:" + cx + "px;top:" + cy + "px;color:" + colori[i % colori.length] +
      ";--dx:" + (Math.cos(a) * d).toFixed(0) + "px;--dy:" + (Math.sin(a) * d).toFixed(0) + "px";
    document.body.append(s);
    setTimeout(() => s.remove(), 900);
  }
}

// Le risposte giuste di fila, al primo colpo: a 3, 5, 10, 15… compare una scritta che salta.
function filaDiGiuste(quante) {
  if (![3, 5, 10, 15, 20].includes(quante)) return;
  const s = el("div", { class: "di-fila", role: "status", text: "🔥 " + quante + " di fila!" });
  document.body.append(s);
  setTimeout(() => s.remove(), 1600);
}

// Ciò che ogni gioco riceve per parlare, dare un riscontro e dire che ha finito.
export function creaContesto(fine) {
  let fila = 0, sbagliato = false;
  return {
    opz: impostazioni,
    get lingua() { return linguaAttuale(); },
    leggi(testo) { if (impostazioni.voce) parla(testo); },
    // le frasi dell'app, che restano in italiano anche negli esercizi di inglese
    dici(testo) { if (impostazioni.voce) parla(testo, "it"); },
    // racconta una frase e aspetta che finisca (o un momento, se la voce è spenta)
    racconta(testo) {
      return impostazioni.voce && voceDisponibile ? parlaEAspetta(testo) : new Promise(r => setTimeout(r, 1200));
    },
    giusto(n) {
      suonoGiusto();
      fila = sbagliato ? 0 : fila + 1;
      sbagliato = false;
      filaDiGiuste(fila);
      if (n) {
        n.classList.add("giusta");
        n.classList.remove("evviva");
        void n.offsetWidth;
        n.classList.add("evviva");
        stelline(n);
      }
    },
    riprova(n, dove) {
      suonoRiprova();
      sbagliato = true;
      fila = 0;
      if (n) {
        n.classList.remove("scuoti");
        void n.offsetWidth;
        n.classList.add("scuoti");
      }
      if (dove && impostazioni.aiuto) {
        dove.classList.add("suggerito");
        setTimeout(() => dove.classList.remove("suggerito"), 1600);
      }
    },
    fine
  };
}

let timerAvviso = null;
export function avviso(testo) {
  let box = document.getElementById("avviso");
  if (!box) {
    box = el("div", { id: "avviso", class: "avviso", role: "status", "aria-live": "polite" });
    document.body.append(box);
  }
  box.textContent = testo;
  box.classList.add("visibile");
  clearTimeout(timerAvviso);
  timerAvviso = setTimeout(() => box.classList.remove("visibile"), 3500);
}

export function finestra(titolo, ...contenuto) {
  const d = el("dialog", { class: "finestra", "aria-label": titolo },
    el("div", { class: "finestra-testa" },
      el("h2", { text: titolo }),
      el("button", { type: "button", class: "tasto-chiudi", "aria-label": "Chiudi", text: "✕", on: { click: () => d.close() } })),
    ...contenuto);
  d.addEventListener("close", () => d.remove());
  document.body.append(d);
  d.showModal();
  return d;
}
