// Il labirinto: in alto la domanda, in fondo ai corridoi le risposte. Si porta il topolino fino alla risposta giusta
// con le frecce (sullo schermo o della tastiera) oppure toccando la casella vicina. Niente nemici e niente tempo:
// se si arriva a una risposta sbagliata, il topolino torna al via e si riprova.

import { el, carta, mescola, pulsanteVoce } from "../ui.js";
import { domandeDa } from "./scelta.js";

const COLONNE = 7, RIGHE = 4;
const MOSSE = { su: [0, -1], giu: [0, 1], sx: [-1, 0], dx: [1, 0] };

// un labirinto «perfetto»: da ogni casella a ogni altra c'è una sola strada
function scava() {
  const aperto = Array.from({ length: RIGHE }, () => Array.from({ length: COLONNE }, () => ({ su: false, giu: false, sx: false, dx: false })));
  const visto = new Set(["0,0"]);
  const pila = [[0, 0]];
  const opposto = { su: "giu", giu: "su", sx: "dx", dx: "sx" };
  while (pila.length) {
    const [x, y] = pila[pila.length - 1];
    const vicini = Object.entries(MOSSE).map(([d, [dx, dy]]) => [d, x + dx, y + dy])
      .filter(([, nx, ny]) => nx >= 0 && ny >= 0 && nx < COLONNE && ny < RIGHE && !visto.has(nx + "," + ny));
    if (!vicini.length) { pila.pop(); continue; }
    const [d, nx, ny] = vicini[Math.floor(Math.random() * vicini.length)];
    aperto[y][x][d] = true;
    aperto[ny][nx][opposto[d]] = true;
    visto.add(nx + "," + ny);
    pila.push([nx, ny]);
  }
  return aperto;
}

// quanto dista ogni casella dal via, seguendo i corridoi
function distanze(aperto, sx, sy) {
  const d = Array.from({ length: RIGHE }, () => Array(COLONNE).fill(-1));
  d[sy][sx] = 0;
  const coda = [[sx, sy]];
  while (coda.length) {
    const [x, y] = coda.shift();
    Object.entries(MOSSE).forEach(([k, [dx, dy]]) => {
      if (aperto[y][x][k] && d[y + dy][x + dx] < 0) { d[y + dy][x + dx] = d[y][x] + 1; coda.push([x + dx, y + dy]); }
    });
  }
  return d;
}

export function avvia(area, es, ctx) {
  const domande = mescola(domandeDa(es, 12)).slice(0, Math.min(8, ctx.opz.elementi));
  let n = 0;
  let giuste = 0;
  let fermo = false;

  const punti = el("div", { class: "punti", "aria-hidden": "true" }, domande.map(() => el("span")));
  const testa = el("div", { class: "lab-testa" });
  const campo = el("div", { class: "lab-campo", style: "--colonne:" + COLONNE + ";--righe:" + RIGHE });
  const freccia = (dir, testo, nome) => el("button", { type: "button", class: "tasto lab-" + dir, "aria-label": nome, text: testo, on: { click: () => muovi(dir) } });
  const frecce = el("div", { class: "lab-frecce" }, freccia("su", "▲", "Su"), freccia("sx", "◀", "Sinistra"), freccia("giu", "▼", "Giù"), freccia("dx", "▶", "Destra"));
  area.append(punti, testa, el("div", { class: "lab-riga" }, campo, frecce));

  let aperto, celle, pos, via, uscite, occupato = false, sbagliato = false;

  function giro() {
    const q = domande[n];
    punti.children[n].classList.add("ora");
    sbagliato = false;
    aperto = scava();
    via = [0, Math.floor(RIGHE / 2)];
    const dist = distanze(aperto, via[0], via[1]);
    // le risposte vanno nei vicoli ciechi più lontani dal via, ben separati tra loro
    const vicoli = [];
    for (let y = 0; y < RIGHE; y++) for (let x = 0; x < COLONNE; x++) {
      const porte = Object.values(aperto[y][x]).filter(Boolean).length;
      if ((x || y !== via[1]) && porte === 1 && dist[y][x] >= 3) vicoli.push([x, y]);
    }
    vicoli.sort((a, b) => dist[b[1]][b[0]] - dist[a[1]][a[0]]);
    const opzioni = mescola([q.giusta].concat(mescola(q.sbagliate).slice(0, Math.min(ctx.opz.risposte, 3) - 1)));
    // le caselle in ordine di preferenza: prima i vicoli ciechi, poi le più lontane
    const tutte = [];
    for (let y = 0; y < RIGHE; y++) for (let x = 0; x < COLONNE; x++) if (dist[y][x] >= 2) tutte.push([x, y]);
    tutte.sort((a, b) => dist[b[1]][b[0]] - dist[a[1]][a[0]]);
    const candidate = vicoli.concat(tutte.filter(t => !vicoli.some(v => v[0] === t[0] && v[1] === t[1])));
    // la strada dal via a una casella: nessuna risposta può stare sulla strada verso un'altra
    const strada = (x, y) => {
      const passi = [[x, y]];
      while (dist[y][x] > 0) {
        const k = Object.keys(MOSSE).find(d => aperto[y][x][d] && dist[y + MOSSE[d][1]][x + MOSSE[d][0]] === dist[y][x] - 1);
        x += MOSSE[k][0]; y += MOSSE[k][1];
        passi.push([x, y]);
      }
      return passi;
    };
    const sopra = (a, b) => strada(a[0], a[1]).some(p => p[0] === b[0] && p[1] === b[1]);
    const scelti = [];
    for (const lontane of [true, false]) {
      for (const v of candidate) {
        if (scelti.length === opzioni.length) break;
        if (scelti.some(s => s[0] === v[0] && s[1] === v[1] || sopra(s, v) || sopra(v, s))) continue;
        if (lontane && !scelti.every(s => Math.abs(s[0] - v[0]) + Math.abs(s[1] - v[1]) >= 3)) continue;
        scelti.push(v);
      }
    }
    opzioni.length = Math.min(opzioni.length, scelti.length);
    if (!opzioni.includes(q.giusta)) opzioni[0] = q.giusta;
    uscite = opzioni.map((o, i) => ({ o, x: scelti[i][0], y: scelti[i][1], giusta: o === q.giusta }));

    celle = [];
    campo.replaceChildren();
    for (let y = 0; y < RIGHE; y++) for (let x = 0; x < COLONNE; x++) {
      const a = aperto[y][x];
      const c = el("div", { class: "lab-cella" + (a.su ? "" : " m-su") + (a.giu ? "" : " m-giu") + (a.sx ? "" : " m-sx") + (a.dx ? "" : " m-dx") });
      // toccando una casella sulla stessa riga o colonna, in un corridoio dritto, il topolino ci corre da solo
      c.addEventListener("click", async () => {
        if (occupato) return;
        const [px, py] = pos;
        if (px !== x && py !== y) return;
        const dir = x > px ? "dx" : x < px ? "sx" : y > py ? "giu" : "su";
        const passi = Math.abs(x - px) + Math.abs(y - py);
        for (let k = 0; k < passi && !occupato && !fermo; k++) {
          if (!muovi(dir)) break;
          await new Promise(r => setTimeout(r, 110));
        }
      });
      const u = uscite.find(u => u.x === x && u.y === y);
      if (u) c.append(carta(u.o, "lab-risposta"));
      celle.push(c);
      campo.append(c);
    }
    testa.replaceChildren(el("p", { class: "lab-chiede" }, el("span", { text: "Porta il topolino alla risposta giusta:" }),
      carta(q.d, "lab-domanda"), q.d.t ? pulsanteVoce(q.d.t, "Ascolta") : null));
    if (q.d.t) ctx.leggi(q.d.t);
    metti(via[0], via[1]);
  }

  const topo = el("div", { class: "lab-topo", "aria-label": "Topolino" }, el("span", { class: "lab-orecchie", "aria-hidden": "true" }));

  function metti(x, y) {
    pos = [x, y];
    celle[y * COLONNE + x].append(topo);
  }

  function muovi(dir) {
    if (fermo || occupato || !aperto) return false;
    const [x, y] = pos;
    if (!aperto[y][x][dir]) {
      topo.classList.remove("lab-sbatte"); void topo.offsetWidth; topo.classList.add("lab-sbatte");
      return false;
    }
    const [dx, dy] = MOSSE[dir];
    metti(x + dx, y + dy);
    const u = uscite.find(u => u.x === pos[0] && u.y === pos[1]);
    if (!u) return true;
    const c = celle[pos[1] * COLONNE + pos[0]].querySelector(".lab-risposta");
    if (u.giusta) {
      occupato = true;
      ctx.giusto(c);
      if (!sbagliato) giuste++;
      setTimeout(() => {
        occupato = false;
        if (fermo) return;
        punti.children[n].classList.add("fatto");
        if (++n < domande.length) giro(); else { aperto = null; ctx.fine({ giuste, totale: domande.length }); }
      }, 1100);
    } else {
      sbagliato = true;
      occupato = true;
      ctx.riprova(c);
      setTimeout(() => { occupato = false; if (!fermo) metti(via[0], via[1]); }, 700);
    }
    return false;
  }

  const tasti = e => {
    const dir = { ArrowUp: "su", ArrowDown: "giu", ArrowLeft: "sx", ArrowRight: "dx" }[e.key];
    if (dir && campo.isConnected) { e.preventDefault(); muovi(dir); }
  };
  document.addEventListener("keydown", tasti);

  giro();
  return () => { fermo = true; document.removeEventListener("keydown", tasti); };
}
