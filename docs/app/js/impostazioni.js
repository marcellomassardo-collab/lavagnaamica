// Preferenze di chi usa l'app, salvate solo su questo dispositivo.

const CHIAVE = "la.impostazioni";

const BASE = {
  voce: true,       // legge le carte quando le tocchi e le domande quando compaiono
  suoni: true,
  aiuto: true,      // dopo un errore mostra dove va la carta
  contrasto: false,
  tema: "scuro",    // chiaro, scuro o auto (come il dispositivo)
  elementi: 6,      // carte per partita
  risposte: 3,      // risposte tra cui scegliere
  voceScelta: "",   // nome della voce del dispositivo; vuoto = la più naturale disponibile
  velocita: 0.85,   // un po' più lenta del normale
  sensore: false,   // le scelte si illuminano una alla volta e si sceglie con un solo tasto
  ritmo: 2          // secondi per ogni scelta illuminata
};

export const VELOCITA = [[0.7, "Lenta"], [0.85, "Calma"], [1, "Normale"]];

export const TEMI = [["chiaro", "Chiaro"], ["scuro", "Scuro"], ["auto", "Come il dispositivo"]];

export const LIMITI = { elementi: [3, 10], risposte: [2, 4], ritmo: [1, 5] };

function carica() {
  try {
    return Object.assign({}, BASE, JSON.parse(localStorage.getItem(CHIAVE)));
  } catch (e) {
    return Object.assign({}, BASE);
  }
}

export const impostazioni = carica();

const scuroNelDispositivo = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : null;

// Il tema scuro cede all'alto contrasto, che ha colori suoi.
export function applica() {
  const radice = document.documentElement;
  const scuro = !impostazioni.contrasto && (impostazioni.tema === "scuro" ||
    (impostazioni.tema === "auto" && !!scuroNelDispositivo && scuroNelDispositivo.matches));
  radice.classList.toggle("contrasto", !!impostazioni.contrasto);
  radice.classList.toggle("scuro", scuro);
  const colore = document.querySelector('meta[name="theme-color"]');
  if (colore) colore.content = scuro ? "#171D21" : "#1E6B52";
}
if (scuroNelDispositivo && scuroNelDispositivo.addEventListener) scuroNelDispositivo.addEventListener("change", applica);

export function cambia(chiave, valore) {
  impostazioni[chiave] = valore;
  try { localStorage.setItem(CHIAVE, JSON.stringify(impostazioni)); } catch (e) {}
  applica();
}
