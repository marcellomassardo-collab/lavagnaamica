// Pezzi d'interfaccia condivisi da giochi, editor e pagine.

import { impostazioni } from "./impostazioni.js";
import { parla, parlaEAspetta, voceDisponibile } from "./voce.js";
import { suonoGiusto, suonoRiprova } from "./suoni.js";

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
export function due(t, evidenzia) {
  const riga = classe => el("span", { class: classe },
    evidenzia ? [el("b", { text: t.slice(0, evidenzia) }), t.slice(evidenzia)] : t);
  return el("span", { class: "due" }, riga("alto"), riga("basso"));
}

export function carta(e, classe, attr) {
  // una o due lettere (alfabeto, sillabe) si scrivono grandi
  const breve = e.t && !e.p && !e.f && e.t.trim().length <= 3 ? " breve" : "";
  return el("div", Object.assign({ class: "carta" + breve + " " + (classe || ""), "data-voce": e.t || null }, attr),
    e.f ? fotoCarta(e.f, e.t) : e.p ? immaginePicto(e.p, e.t) : null,
    e.t ? el("span", { class: "carta-testo" }, due(e.t)) : null);
}

export function pulsanteVoce(testo, etichetta) {
  const b = el("button", { type: "button", class: "voce", "aria-label": etichetta || "Ascolta", text: "🔊" });
  if (!voceDisponibile) b.hidden = true;
  b.addEventListener("click", e => {
    e.stopPropagation();
    parla(typeof testo === "function" ? testo() : testo);
  });
  return b;
}

// Ciò che ogni gioco riceve per parlare, dare un riscontro e dire che ha finito.
export function creaContesto(fine) {
  return {
    opz: impostazioni,
    leggi(testo) { if (impostazioni.voce) parla(testo); },
    // racconta una frase e aspetta che finisca (o un momento, se la voce è spenta)
    racconta(testo) {
      return impostazioni.voce && voceDisponibile ? parlaEAspetta(testo) : new Promise(r => setTimeout(r, 1200));
    },
    giusto(n) {
      suonoGiusto();
      if (n) n.classList.add("giusta");
    },
    riprova(n, dove) {
      suonoRiprova();
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
