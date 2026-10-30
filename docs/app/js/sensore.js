// Gioco con un sensore: le scelte si illuminano una alla volta e si sceglie premendo un solo tasto.
// Va bene con un sensore collegato al computer come tasto (spazio o invio) o con la tastiera.
// Nei giochi in cui si porta una carta al suo posto, prima si scorrono le carte e poi i posti.

import { impostazioni } from "./impostazioni.js";
import { parla } from "./voce.js";

const SCELTE = [".opzione", ".mat-opzione", ".brano-opzione", ".vf-tasto", ".pallone", ".barre-scelta", ".logica-scelta", ".rt-tacca",
  ".let-opzione", ".mat-pannello .pulsante", ".sq-numeri .pulsante", ".sq-gira", ".sq-podio .pulsante", ".sp-comandi .pulsante",
  ".festa .azioni .pulsante", ".festa-prossimo .pulsante", ".vasca [data-mobile]"].map(s => s + ":not(:disabled)").join(",");

function candidati() {
  const area = document.querySelector(".area-gioco");
  if (!area) return [];
  // se una carta è già presa, si scorrono i posti dove portarla
  const presa = area.querySelector(".carta.scelta[data-mobile]");
  const lista = presa ? [...area.querySelectorAll("[data-bersaglio]")] : [...area.querySelectorAll(SCELTE)];
  return lista.filter(n => n.offsetParent !== null || n.closest("svg"));
}

export function avviaSensore() {
  let attiva = null, indice = -1;
  const spegni = () => { if (attiva) attiva.classList.remove("sensore-luce"); };
  function passo() {
    const c = candidati();
    spegni();
    if (!c.length) { attiva = null; indice = -1; return; }
    indice = c.indexOf(attiva) + 1 >= c.length ? 0 : c.indexOf(attiva) + 1;
    attiva = c[indice];
    attiva.classList.add("sensore-luce");
    attiva.scrollIntoView({ block: "nearest", inline: "nearest" });
    // la scansione si può anche ascoltare: si legge quello che è illuminato
    const voce = attiva.dataset.voce || (attiva.querySelector("[data-voce]") || {}).dataset?.voce || attiva.getAttribute("aria-label") || attiva.textContent;
    if (impostazioni.voce && voce) parla(voce.trim());
  }
  function scegli(e) {
    if (!(e.key === " " || e.key === "Enter")) return;
    if (e.target.closest && e.target.closest("input, select, textarea")) return;
    e.preventDefault();
    if (!attiva || !document.contains(attiva)) return;
    if (attiva.matches("[data-mobile]")) {
      // le carte si prendono con un tocco (premi e lascia), come con il dito
      const r = attiva.getBoundingClientRect(), o = { bubbles: true, pointerId: 9, button: 0, clientX: r.x + 4, clientY: r.y + 4, isPrimary: true };
      attiva.dispatchEvent(new PointerEvent("pointerdown", o));
      attiva.dispatchEvent(new PointerEvent("pointerup", o));
    } else attiva.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    spegni();
    attiva = null;
    indice = -1;
    clearInterval(id);
    id = setInterval(passo, impostazioni.ritmo * 1000);
    setTimeout(passo, 600);
  }
  let id = setInterval(passo, impostazioni.ritmo * 1000);
  document.addEventListener("keydown", scegli);
  setTimeout(passo, 800);
  return () => {
    clearInterval(id);
    spegni();
    document.removeEventListener("keydown", scegli);
  };
}
