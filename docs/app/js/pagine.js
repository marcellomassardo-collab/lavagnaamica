// L'impalcatura delle pagine: intestazione e cambio di pagina.

import { el } from "./ui.js";
import { zitto } from "./voce.js";
import { catalogoAttivo } from "./catalogo.js";

const app = document.getElementById("app");
let chiudi = null;

// Cosa fare quando si lascia la pagina (fermare un gioco, uscire dallo schermo intero…).
export function quandoSiEsce(fn) {
  chiudi = fn;
}

export function vista(...nodi) {
  if (chiudi) chiudi();
  chiudi = null;
  zitto();
  app.replaceChildren(...nodi);
  window.scrollTo(0, 0);
}

const LOGO = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="2" y="8" width="60" height="48" rx="8" fill="#B7793F"/>' +
  '<rect x="8" y="14" width="48" height="36" rx="4" fill="#1E6B52"/><circle cx="24" cy="28" r="3" fill="#fff"/>' +
  '<circle cx="40" cy="28" r="3" fill="#fff"/><path d="M22 37q10 9 20 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>';

export function intestazione() {
  const marchio = el("a", { class: "marchio", href: "#/" });
  marchio.innerHTML = LOGO;
  marchio.append(el("span", { text: "Lavagna Amica" }));
  return el("header", { class: "testata" }, marchio,
    el("nav", { class: "testata-link" },
      catalogoAttivo ? el("a", { href: "#/insegnanti", text: "🧑‍🏫 Insegnanti" }) : null,
      el("a", { href: "#/impostazioni", text: "⚙️ Impostazioni" }),
      el("a", { href: "#/info", text: "ℹ️ Info" })));
}

export function pagina(titolo, ...contenuto) {
  return el("div", { class: "pagina" }, intestazione(), el("main", { class: "contenuto" }, el("h1", { text: titolo }), ...contenuto));
}
