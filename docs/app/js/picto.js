// Ricerca dei pittogrammi in italiano nell'archivio pubblico ARASAAC.

import { el, immaginePicto, finestra } from "./ui.js";

const API = "https://api.arasaac.org/v1/pictograms/it/search/";

export function scegliPittogramma(iniziale, scelto) {
  const campo = el("input", { type: "search", value: iniziale || "", placeholder: "Cerca: cane, mela, scuola…", "aria-label": "Parola da cercare", enterkeyhint: "search" });
  const risultati = el("div", { class: "picto-risultati" });
  const stato = el("p", { class: "picto-stato", "aria-live": "polite" });
  let richiesta = 0;

  async function cerca() {
    const q = campo.value.trim();
    if (!q) return;
    const mia = ++richiesta;
    stato.textContent = "Cerco…";
    risultati.replaceChildren();
    try {
      const r = await fetch(API + encodeURIComponent(q));
      const lista = r.ok ? await r.json() : [];
      if (mia !== richiesta) return;
      stato.textContent = lista.length ? "" : "Nessuna immagine per «" + q + "». Prova con un'altra parola.";
      risultati.replaceChildren(...lista.slice(0, 30).map(p => {
        const nome = p.keywords && p.keywords[0] ? p.keywords[0].keyword : q;
        return el("button", { type: "button", class: "picto-scelta", title: nome, "aria-label": nome,
          on: { click: () => { scelto(p._id); d.close(); } } }, immaginePicto(p._id, ""));
      }));
    } catch (e) {
      if (mia === richiesta) stato.textContent = "Non riesco a cercare: serve la connessione a internet.";
    }
  }

  campo.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); cerca(); } });
  const d = finestra("Scegli un'immagine",
    el("div", { class: "picto-cerca" }, campo, el("button", { type: "button", class: "pulsante", text: "Cerca", on: { click: cerca } })),
    stato,
    risultati,
    el("div", { class: "finestra-piede" },
      el("button", { type: "button", class: "pulsante secondario", text: "Nessuna immagine", on: { click: () => { scelto(null); d.close(); } } }),
      el("small", { text: "Pittogrammi ARASAAC, licenza CC BY-NC-SA" })));
  if (campo.value.trim()) cerca(); else campo.focus();
}
