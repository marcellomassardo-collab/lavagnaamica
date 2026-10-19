// Preferenze di chi usa l'app, salvate solo su questo dispositivo.

const CHIAVE = "la.impostazioni";

const BASE = {
  voce: true,       // legge le carte quando le tocchi e le domande quando compaiono
  suoni: true,
  aiuto: true,      // dopo un errore mostra dove va la carta
  contrasto: false,
  elementi: 6,      // carte per partita
  risposte: 3       // risposte tra cui scegliere
};

export const LIMITI = { elementi: [3, 10], risposte: [2, 4] };

function carica() {
  try {
    return Object.assign({}, BASE, JSON.parse(localStorage.getItem(CHIAVE)));
  } catch (e) {
    return Object.assign({}, BASE);
  }
}

export const impostazioni = carica();

export function applica() {
  document.documentElement.classList.toggle("contrasto", !!impostazioni.contrasto);
}

export function cambia(chiave, valore) {
  impostazioni[chiave] = valore;
  try { localStorage.setItem(CHIAVE, JSON.stringify(impostazioni)); } catch (e) {}
  applica();
}
