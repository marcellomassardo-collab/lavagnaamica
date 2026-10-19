// Collegamento al catalogo comune: elenco, esercizi, stelle, segnalazioni e area insegnanti.

import { API } from "./config.js";

export const catalogoAttivo = !!API;

const CHIAVE = "la.sessione";
let sessione = leggi();

function leggi() {
  try {
    const s = JSON.parse(localStorage.getItem(CHIAVE));
    return s && s.gettone && s.insegnante ? s : null;
  } catch (e) {
    return null;
  }
}

function scrivi(s) {
  sessione = s;
  try {
    if (s) localStorage.setItem(CHIAVE, JSON.stringify(s)); else localStorage.removeItem(CHIAVE);
  } catch (e) {}
}

export const insegnante = () => (sessione ? sessione.insegnante : null);

export const linkCatalogo = id => location.origin + location.pathname + "#/catalogo/" + id;

// Un numero a caso, salvato solo qui, perché una segnalazione dallo stesso dispositivo conti una volta.
function dispositivo() {
  try {
    let d = localStorage.getItem("la.dispositivo");
    if (!d) {
      d = Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, "0")).join("");
      localStorage.setItem("la.dispositivo", d);
    }
    return d;
  } catch (e) {
    return "senza-memoria-" + Math.random().toString(36).slice(2, 12);
  }
}

async function chiama(metodo, via, corpo) {
  let r;
  try {
    r = await fetch(API + via, {
      method: metodo,
      headers: Object.assign({ "Content-Type": "application/json" }, sessione ? { Authorization: "Bearer " + sessione.gettone } : {}),
      body: corpo === undefined ? undefined : JSON.stringify(corpo)
    });
  } catch (e) {
    throw new Error("Il catalogo non risponde: controlla la connessione a internet.");
  }
  const dati = await r.json().catch(() => ({}));
  if (r.status === 401 && sessione) scrivi(null);
  if (!r.ok) {
    const errore = new Error(dati.errore || "Il catalogo non risponde: riprova tra poco.");
    errore.stato = r.status;
    throw errore;
  }
  return dati;
}

const via = (id, azione) => "/esercizi/" + encodeURIComponent(id) + (azione ? "/" + azione : "");

export const catalogo = {
  elenco(filtri) {
    const q = new URLSearchParams();
    Object.entries(filtri).forEach(([k, v]) => { if (v) q.set(k, v); });
    return chiama("GET", "/catalogo?" + q);
  },
  apri: id => chiama("GET", via(id)),
  pubblica: es => chiama("POST", "/esercizi", { esercizio: es }),
  aggiorna: (id, es) => chiama("PUT", via(id), { esercizio: es }),
  ritira: id => chiama("DELETE", via(id)),
  approva: id => chiama("POST", via(id, "approva"), {}),
  stelle: (id, stelle) => chiama("POST", via(id, "stelle"), { stelle }),
  segnala: (id, motivo) => chiama("POST", via(id, "segnala"), { motivo, dispositivo: dispositivo() }),
  risolto: id => chiama("POST", via(id, "risolto"), {}),
  daControllare: () => chiama("GET", "/da-controllare"),
  io: () => chiama("GET", "/io"),
  async nome(nome) {
    const d = await chiama("PUT", "/io", { nome });
    scrivi(Object.assign({}, sessione, { insegnante: d.insegnante }));
    return d.insegnante;
  },
  coda: () => chiama("GET", "/coda"),
  decidi: (id, azione) => chiama("POST", "/coda/" + encodeURIComponent(id), { azione }),
  blocca: (id, azione) => chiama("POST", "/insegnanti/" + encodeURIComponent(id) + "/blocca", { azione }),
  async accedi(credenziale) {
    const d = await chiama("POST", "/accesso", { credenziale });
    scrivi(d);
    return d.insegnante;
  },
  async esci() {
    try { await chiama("POST", "/esci", {}); } finally { scrivi(null); }
  }
};
