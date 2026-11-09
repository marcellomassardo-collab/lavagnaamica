// La divisione in sillabe dell'italiano, con le regole della scuola primaria:
// una consonante tra due vocali va con la seconda (ca-ne); le doppie si dividono (gat-to);
// la s con un'altra consonante va con la sillaba dopo (pa-sta); consonante + l o r resta unita (ca-pra);
// gn, gl(i), ch, gh, sc restano uniti (ba-gno, fi-glio); due vocali «forti» si separano (po-e-ta).
// Senza l'accento lo iato con la i o la u toniche non si vede dalle lettere: le parole comuni sono in un elenco (pa-u-ra, mi-o).

const VOCALI = "aeiouàèéìíòóùú";
const FORTI = "aeoàèéòó";
const MUTE = "bcdfgptv";
const vocale = c => VOCALI.includes(c);
const forte = c => FORTI.includes(c);

// le parole comuni con la i o la u toniche staccate (iato), che le regole da sole non vedono
const IATI = { paura: [2, 3], mio: [2], mia: [2], tuo: [2], tua: [2], suo: [2], sua: [2], zio: [2], zia: [2], via: [2], magia: [4], bugia: [4],
  fantasia: [7], allegria: [7], farmacia: [7], poesia: [2, 5], lucia: [4], energia: [6], pizzeria: [7], gelateria: [8], scia: [3] };

// e quelle che restano intere anche se le regole le dividerebbero (dittonghi e trittonghi)
const INTERE = new Set(["ciao", "miei", "tuoi", "suoi", "buoi", "vuoi", "puoi", "cuoi", "aiuola"]);

export function sillabe(parola) {
  const w = parola.toLowerCase();
  if (INTERE.has(w)) return w === "aiuola" ? [parola.slice(0, 1), parola.slice(1, 4), parola.slice(4)] : [parola];
  if (IATI[w]) {
    const base = w.length >= 3 ? sillabeRegole(parola) : [parola];
    // si aggiungono i tagli dello iato a quelli delle regole
    const posti = new Set(); let n = 0;
    base.slice(0, -1).forEach(x => { n += x.length; posti.add(n); });
    IATI[w].forEach(p => posti.add(p));
    const ordinati = [...posti].sort((a, b) => a - b);
    const out = []; let da = 0;
    ordinati.forEach(p => { out.push(parola.slice(da, p)); da = p; });
    out.push(parola.slice(da));
    return out.filter(Boolean);
  }
  return w.length < 3 ? [parola] : sillabeRegole(parola);
}

function sillabeRegole(parola) {
  const w = parola.toLowerCase();
  const tagli = new Set();
  // le vocali vicine: si separano due forti (po-e-ta); la i o la u tra una forte e un'altra vocale va avanti (a-iu-to, no-ia)
  for (let k = 1; k < w.length; k++) {
    if (!vocale(w[k]) || !vocale(w[k - 1])) continue;
    if (forte(w[k]) && forte(w[k - 1])) tagli.add(k);
    else if ("iu".includes(w[k]) && forte(w[k - 1]) && k + 1 < w.length && vocale(w[k + 1])) tagli.add(k);
  }
  // le consonanti tra due vocali
  for (let k = 0; k < w.length;) {
    if (!vocale(w[k])) { k++; continue; }
    let fine = k;
    while (fine + 1 < w.length && vocale(w[fine + 1])) fine++;
    const c0 = fine + 1;
    let c1 = c0;
    while (c1 < w.length && !vocale(w[c1])) c1++;
    if (c1 >= w.length) break;   // le consonanti in fondo restano con l'ultima sillaba
    const g = w.slice(c0, c1);
    let taglio;
    if (g.length === 1) taglio = c0;
    else if (g[0] === g[1]) taglio = c0 + 1;                                    // gat-to, mac-chi-na
    else if (g[0] === "s") taglio = c0;                                          // pa-sta, fi-ne-stra
    else if (g === "gn" || g === "ch" || g === "gh" || (g === "gl" && w[c1] === "i")) taglio = c0;   // ba-gno, fi-glio
    else if (g.length === 2 && MUTE.includes(g[0]) && "lr".includes(g[1])) taglio = c0;            // ca-pra, li-bro
    else taglio = c0 + 1;                                                        // al-be-ro, ac-qua, den-tro, an-che
    tagli.add(taglio);
    k = c1;
  }
  const posti = [...tagli].filter(p => p > 0 && p < w.length).sort((a, b) => a - b);
  const pezzi = [];
  let da = 0;
  for (const p of posti) { pezzi.push(parola.slice(da, p)); da = p; }
  pezzi.push(parola.slice(da));
  return pezzi.filter(Boolean);
}

// Una parola come si scrive nei testi: l'apostrofo resta attaccato alla prima sillaba (l'al-be-ro, c'è); i numeri restano interi.
export function sillabeParola(w) {
  if (/\d/.test(w)) return [w];
  const ap = w.search(/['’]/);
  if (ap < 0) return sillabe(w);
  const resto = sillabeParola(w.slice(ap + 1));
  resto[0] = w.slice(0, ap + 1) + resto[0];
  return resto;
}

// Un testo diviso in pezzi: le parole in sillabe, il resto com'è.
export function inSillabe(testo) {
  const fuori = [];
  const re = /[\p{L}\d]+(?:['’][\p{L}\d]+)*/gu;
  let ultimo = 0, m;
  while ((m = re.exec(testo))) {
    if (m.index > ultimo) fuori.push({ t: testo.slice(ultimo, m.index) });
    fuori.push({ sillabe: sillabeParola(m[0]) });
    ultimo = re.lastIndex;
  }
  if (ultimo < testo.length) fuori.push({ t: testo.slice(ultimo) });
  return fuori;
}
