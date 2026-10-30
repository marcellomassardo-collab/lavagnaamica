// Il ripasso che si adatta. Dopo ogni partita si ricorda com'è andata, solo su questo dispositivo e senza nomi:
// è il ripasso della LIM o del tablet, non di un alunno. Chi sbaglia rivede l'esercizio presto (il giorno dopo);
// se va bene lo rivede sempre più in là: 2, 4, 7, 14 giorni.

const CHIAVE = "lavagna-amica-ripasso";
const GIORNO = 864e5;
const INTERVALLI = [1, 2, 4, 7, 14];

function leggi() {
  try { return JSON.parse(localStorage.getItem(CHIAVE)) || {}; } catch (e) { return {}; }
}
function scrivi(d) {
  try { localStorage.setItem(CHIAVE, JSON.stringify(d)); } catch (e) {}
}

// chiave: «es:id», «mio:id» o «catalogo:id»; quota: la parte di risposte giuste al primo colpo, da 0 a 1
export function registra(chiave, quota) {
  const d = leggi();
  const prima = d[chiave] ? d[chiave].passo : 0;
  const passo = quota >= 0.9 ? Math.min(prima + 1, INTERVALLI.length - 1) : quota >= 0.6 ? prima : 0;
  d[chiave] = { passo, quota: Math.round(quota * 100) / 100, ultima: Date.now(), prossima: Date.now() + INTERVALLI[passo] * GIORNO };
  scrivi(d);
}

// gli esercizi da rivedere oggi, dal più urgente
export function daRipassare() {
  const ora = Date.now();
  return Object.entries(leggi()).filter(([, v]) => v.prossima <= ora).sort((a, b) => a[1].prossima - b[1].prossima).map(([k]) => k);
}

export function azzera() {
  scrivi({});
}

// Il prossimo esercizio della stessa materia: se è andata molto bene si sale di livello, se è andata male si scende;
// a parità, prima quelli mai fatti (nell'ordine dell'insegnante, dopo questo) e poi quelli fatti da più tempo.
export function prossimo(es, quota, esempi) {
  const d = leggi();
  const lettura = es.tipo === "brano";
  const stessa = esempi.filter(e => e.id !== es.id && (e.materia || "Altro") === (es.materia || "Altro") && (e.tipo === "brano") === lettura);
  const qui = esempi.findIndex(e => e.id === es.id);
  const quando = e => (d["es:" + e.id] ? d["es:" + e.id].ultima : 0);
  const ordine = e => (esempi.indexOf(e) - qui + esempi.length) % esempi.length;
  const livello = Number(es.livello) || 0;
  const verso = quota >= 0.9 ? 1 : quota >= 0.6 ? 0 : -1;
  for (const salto of verso === 1 ? [1, 0] : verso === -1 ? [-1, 0] : [0, 1]) {
    const scelti = stessa.filter(e => (Number(e.livello) || 0) === livello + salto).sort((a, b) => quando(a) - quando(b) || ordine(a) - ordine(b));
    if (scelti.length) return { es: scelti[0], salto };
  }
  return null;
}
