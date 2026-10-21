// Il catalogo comune di Lavagna Amica.
// Gli insegnanti accedono con Google, pubblicano, controllano gli esercizi nuovi, danno le stelle e segnalano.
// Chiunque, anche senza account, può giocare e segnalare. Degli alunni non si salva nulla.

import { valida, TIPI, MOTIVI } from "../../docs/app/js/modello.js";

const GIORNO = 86400;
const DURATA_SESSIONE = 60 * GIORNO;
const APPROVAZIONI_NECESSARIE = 2;
const SEGNALAZIONI_ANONIME = 3;
const MAX_CONTENUTO = 20000;
const MAX_PUBBLICAZIONI_AL_GIORNO = 20;
const MAX_SEGNALAZIONI_AL_GIORNO = 30;
const PER_PAGINA = 24;

// Elenchi SQL fatti con le chiavi di MOTIVI, che sono costanti nostre.
const elencoSql = regola => Object.keys(MOTIVI).filter(regola).map(m => "'" + m + "'").join(",");
const MOTIVI_AUTORE = elencoSql(m => MOTIVI[m].nascondi === "mai");
const MOTIVI_MODERAZIONE = elencoSql(m => MOTIVI[m].nascondi !== "mai");
const MOTIVI_CONTATI = elencoSql(m => MOTIVI[m].nascondi === "conta");

const ora = () => Math.floor(Date.now() / 1000);

class Rifiuto extends Error {
  constructor(stato, messaggio) { super(messaggio); this.stato = stato; }
}
const no = (stato, messaggio) => { throw new Rifiuto(stato, messaggio); };

/* ---------- strumenti ---------- */

const codifica = new TextEncoder();

function daBase64url(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}

function inBase64url(bytes) {
  let s = "";
  bytes.forEach(b => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function impronta(s) {
  const h = await crypto.subtle.digest("SHA-256", codifica.encode(s));
  return Array.from(new Uint8Array(h), b => b.toString(16).padStart(2, "0")).join("");
}

const casuale = n => inBase64url(crypto.getRandomValues(new Uint8Array(n)));

function controllaId(id) {
  if (!/^[\w-]{6,40}$/.test(id || "")) no(404, "Questo esercizio non c'è nel catalogo.");
}

function scheda(r) {
  return {
    id: r.id,
    titolo: r.titolo,
    tipo: r.tipo,
    gioco: r.gioco,
    stato: r.stato,
    approvazioni: r.approvazioni,
    stelle: r.stelle_voti ? Math.round(r.stelle_somma / r.stelle_voti * 10) / 10 : null,
    voti: r.stelle_voti,
    autore: r.nome === undefined ? undefined : r.nome,
    daCorreggere: r.da_correggere,
    aggiornato: r.aggiornato
  };
}

/* ---------- accesso con Google ---------- */

let chiavi = null;
let scadenzaChiavi = 0;

async function chiaviGoogle() {
  if (chiavi && Date.now() < scadenzaChiavi) return chiavi;
  const r = await fetch("https://www.googleapis.com/oauth2/v3/certs");
  if (!r.ok) no(503, "Google non risponde: riprova tra poco.");
  const eta = /max-age=(\d+)/.exec(r.headers.get("Cache-Control") || "");
  chiavi = (await r.json()).keys;
  scadenzaChiavi = Date.now() + (eta ? Number(eta[1]) : 3600) * 1000;
  return chiavi;
}

// Controlla la firma del biglietto che Google dà a chi accede.
async function verificaGoogle(credenziale, clientId) {
  const pezzi = String(credenziale).split(".");
  if (pezzi.length !== 3) no(401, "Accesso non valido: riprova.");
  let testa, dati;
  try {
    testa = JSON.parse(new TextDecoder().decode(daBase64url(pezzi[0])));
    dati = JSON.parse(new TextDecoder().decode(daBase64url(pezzi[1])));
  } catch (e) {
    no(401, "Accesso non valido: riprova.");
  }
  const jwk = testa.alg === "RS256" && (await chiaviGoogle()).find(k => k.kid === testa.kid);
  if (!jwk) no(401, "Accesso non valido: riprova.");
  const chiave = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const firmato = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", chiave, daBase64url(pezzi[2]), codifica.encode(pezzi[0] + "." + pezzi[1]));
  const valido = firmato && dati.aud === clientId && dati.exp > ora() && dati.email && dati.email_verified === true &&
    ["accounts.google.com", "https://accounts.google.com"].includes(dati.iss);
  if (!valido) no(401, "Accesso non valido: riprova.");
  return { id: String(dati.sub), email: String(dati.email).toLowerCase() };
}

function gettoneDa(richiesta) {
  const m = /^Bearer ([\w-]{20,100})$/.exec(richiesta.headers.get("Authorization") || "");
  return m ? m[1] : null;
}

// Chi modera: una o più email, separate da virgola, nel segreto ADMIN_EMAIL.
function moderatori(env) {
  return (env.ADMIN_EMAIL || "").toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
}

function profilo(i, env) {
  return { id: i.id, email: i.email, nome: i.nome, admin: moderatori(env).includes(i.email) };
}

async function insegnanteDa(richiesta, env) {
  const gettone = gettoneDa(richiesta);
  if (!gettone) return null;
  const i = await env.DB.prepare(
    "SELECT i.id, i.email, i.nome, i.bloccato FROM sessioni s JOIN insegnanti i ON i.id = s.insegnante WHERE s.impronta = ? AND s.scade > ?"
  ).bind(await impronta(gettone), ora()).first();
  return i && !i.bloccato ? profilo(i, env) : null;
}

const serve = ins => ins || no(401, "Accedi come insegnante.");
const serveAdmin = ins => (serve(ins).admin ? ins : no(403, "Solo chi modera può farlo."));

async function accesso(corpo, env) {
  if (!env.GOOGLE_CLIENT_ID) no(503, "L'accesso degli insegnanti non è ancora attivo.");
  const g = await verificaGoogle(corpo.credenziale || "", env.GOOGLE_CLIENT_ID);
  const adesso = ora();
  const esistente = await env.DB.prepare("SELECT nome, bloccato FROM insegnanti WHERE id = ?").bind(g.id).first();
  if (esistente && esistente.bloccato) no(403, "Questo account è stato bloccato.");
  const gettone = casuale(32);
  await env.DB.batch([
    esistente
      ? env.DB.prepare("UPDATE insegnanti SET email = ? WHERE id = ?").bind(g.email, g.id)
      : env.DB.prepare("INSERT INTO insegnanti (id, email, nome, creato) VALUES (?, ?, '', ?)").bind(g.id, g.email, adesso),
    env.DB.prepare("DELETE FROM sessioni WHERE scade < ?").bind(adesso),
    env.DB.prepare("INSERT INTO sessioni (impronta, insegnante, scade) VALUES (?, ?, ?)").bind(await impronta(gettone), g.id, adesso + DURATA_SESSIONE)
  ]);
  return { gettone, insegnante: profilo({ id: g.id, email: g.email, nome: esistente ? esistente.nome : "" }, env) };
}

async function esci(richiesta, env) {
  const gettone = gettoneDa(richiesta);
  if (gettone) await env.DB.prepare("DELETE FROM sessioni WHERE impronta = ?").bind(await impronta(gettone)).run();
  return { uscito: true };
}

/* ---------- il mio profilo ---------- */

async function io(ins, env) {
  const { results } = await env.DB.prepare(
    `SELECT e.*, (SELECT COUNT(*) FROM segnalazioni s WHERE s.esercizio = e.id AND s.chiusa = 0 AND s.motivo IN (${MOTIVI_AUTORE})) AS da_correggere
     FROM esercizi e WHERE e.autore = ? ORDER BY e.aggiornato DESC`
  ).bind(ins.id).all();
  return { insegnante: ins, pubblicati: results.map(scheda) };
}

async function cambiaNome(ins, corpo, env) {
  const nome = String(corpo.nome || "").replace(/\s+/g, " ").trim().slice(0, 40);
  await env.DB.prepare("UPDATE insegnanti SET nome = ? WHERE id = ?").bind(nome, ins.id).run();
  return { insegnante: Object.assign({}, ins, { nome }) };
}

/* ---------- catalogo ---------- */

async function elenco(url, env) {
  const q = (url.searchParams.get("q") || "").trim().slice(0, 60);
  const tipo = url.searchParams.get("tipo");
  const da = Math.max(0, parseInt(url.searchParams.get("da"), 10) || 0);
  // Per le stelle si parte da una media prudente, così due voti alti non battono venti voti buoni.
  const ordine = url.searchParams.get("ordine") === "recenti"
    ? "e.aggiornato DESC"
    : "(e.stelle_somma + 6.0) / (e.stelle_voti + 2) DESC, e.stelle_voti DESC, e.aggiornato DESC";
  const filtri = ["e.stato = 'pubblico'"];
  const valori = [];
  if (q) {
    filtri.push("e.titolo LIKE ? ESCAPE '\\'");
    valori.push("%" + q.replace(/[\\%_]/g, m => "\\" + m) + "%");
  }
  if (TIPI[tipo]) {
    filtri.push("e.tipo = ?");
    valori.push(tipo);
  }
  const { results } = await env.DB.prepare(
    `SELECT e.*, i.nome FROM esercizi e JOIN insegnanti i ON i.id = e.autore
     WHERE ${filtri.join(" AND ")} ORDER BY ${ordine} LIMIT ${PER_PAGINA + 1} OFFSET ${da}`
  ).bind(...valori).all();
  return { esercizi: results.slice(0, PER_PAGINA).map(scheda), altri: results.length > PER_PAGINA };
}

async function apri(id, ins, env) {
  controllaId(id);
  const e = await env.DB.prepare("SELECT e.*, i.nome FROM esercizi e JOIN insegnanti i ON i.id = e.autore WHERE e.id = ?").bind(id).first();
  const mio = !!(ins && e && e.autore === ins.id);
  if (!e || (e.stato === "nascosto" && !mio && !(ins && ins.admin))) no(404, "Questo esercizio non c'è più nel catalogo.");
  const out = Object.assign(scheda(e), { esercizio: JSON.parse(e.contenuto), mio });
  if (ins) {
    const [stelle, approvato] = await env.DB.batch([
      env.DB.prepare("SELECT voto FROM stelle WHERE esercizio = ? AND insegnante = ?").bind(id, ins.id),
      env.DB.prepare("SELECT 1 AS si FROM approvazioni WHERE esercizio = ? AND insegnante = ?").bind(id, ins.id)
    ]);
    out.mieStelle = stelle.results.length ? stelle.results[0].voto : 0;
    out.approvato = approvato.results.length > 0;
  }
  return out;
}

function contenutoValido(v) {
  let es;
  try { es = valida(v); } catch (e) { no(400, e.message); }
  if (es.privato) no(400, "Questo esercizio contiene testi protetti da diritti: si usa solo in classe e non si pubblica.");
  delete es.id;
  if (JSON.stringify(es).length > MAX_CONTENUTO) no(413, "L'esercizio è troppo grande.");
  return es;
}

async function pubblica(ins, corpo, env) {
  const es = contenutoValido(corpo.esercizio);
  const adesso = ora();
  const oggi = await env.DB.prepare("SELECT COUNT(*) AS n FROM esercizi WHERE autore = ? AND creato > ?").bind(ins.id, adesso - GIORNO).first();
  if (oggi.n >= MAX_PUBBLICAZIONI_AL_GIORNO) no(429, "Hai già pubblicato molti esercizi oggi: riprova domani.");
  const id = casuale(8);
  await env.DB.prepare(
    "INSERT INTO esercizi (id, autore, contenuto, titolo, tipo, gioco, creato, aggiornato) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(id, ins.id, JSON.stringify(es), es.titolo, es.tipo, es.gioco, adesso, adesso).run();
  return { id, stato: "nuovo" };
}

async function esercizioDi(ins, id, env, ancheAdmin) {
  controllaId(id);
  const e = await env.DB.prepare("SELECT id, autore, stato, approvazioni FROM esercizi WHERE id = ?").bind(id).first();
  if (!e) no(404, "Questo esercizio non c'è nel catalogo.");
  if (e.autore !== ins.id && !(ancheAdmin && ins.admin)) no(403, "Puoi cambiare solo i tuoi esercizi.");
  return e;
}

// Chi modifica un esercizio lo rimanda al controllo: così nessuno può cambiarlo dopo l'approvazione.
async function aggiorna(ins, id, corpo, env) {
  const e = await esercizioDi(ins, id, env, false);
  const es = contenutoValido(corpo.esercizio);
  const stato = e.stato === "nascosto" ? "nascosto" : "nuovo";
  await env.DB.batch([
    env.DB.prepare("UPDATE esercizi SET contenuto = ?, titolo = ?, tipo = ?, gioco = ?, stato = ?, approvazioni = 0, aggiornato = ? WHERE id = ?")
      .bind(JSON.stringify(es), es.titolo, es.tipo, es.gioco, stato, ora(), id),
    env.DB.prepare("DELETE FROM approvazioni WHERE esercizio = ?").bind(id),
    env.DB.prepare(`UPDATE segnalazioni SET chiusa = 1 WHERE esercizio = ? AND motivo IN (${MOTIVI_AUTORE})`).bind(id)
  ]);
  return { id, stato };
}

function cancellaTutto(id, env) {
  return env.DB.batch(["esercizi WHERE id", "approvazioni WHERE esercizio", "stelle WHERE esercizio", "segnalazioni WHERE esercizio"]
    .map(t => env.DB.prepare("DELETE FROM " + t + " = ?").bind(id)));
}

async function ritira(ins, id, env) {
  await esercizioDi(ins, id, env, true);
  await cancellaTutto(id, env);
  return { ritirato: true };
}

async function approva(ins, id, env) {
  controllaId(id);
  const e = await env.DB.prepare("SELECT autore, stato FROM esercizi WHERE id = ?").bind(id).first();
  if (!e || e.stato !== "nuovo") no(409, "Questo esercizio non è più da controllare.");
  if (e.autore === ins.id) no(403, "I tuoi esercizi li controllano gli altri insegnanti.");
  const r = await env.DB.prepare("INSERT OR IGNORE INTO approvazioni (esercizio, insegnante) VALUES (?, ?)").bind(id, ins.id).run();
  if (r.meta.changes) {
    await env.DB.prepare(
      `UPDATE esercizi SET approvazioni = approvazioni + 1,
       stato = CASE WHEN approvazioni + 1 >= ${APPROVAZIONI_NECESSARIE} THEN 'pubblico' ELSE stato END WHERE id = ?`
    ).bind(id).run();
  }
  return env.DB.prepare("SELECT stato, approvazioni FROM esercizi WHERE id = ?").bind(id).first();
}

async function vota(ins, id, corpo, env) {
  controllaId(id);
  const voto = parseInt(corpo.stelle, 10);
  if (!(voto >= 1 && voto <= 5)) no(400, "Le stelle vanno da 1 a 5.");
  const e = await env.DB.prepare("SELECT autore, stato FROM esercizi WHERE id = ?").bind(id).first();
  if (!e || e.stato === "nascosto") no(404, "Questo esercizio non c'è nel catalogo.");
  if (e.autore === ins.id) no(403, "Le stelle ai tuoi esercizi le danno gli altri.");
  const prima = await env.DB.prepare("SELECT voto FROM stelle WHERE esercizio = ? AND insegnante = ?").bind(id, ins.id).first();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO stelle (esercizio, insegnante, voto) VALUES (?, ?, ?) ON CONFLICT (esercizio, insegnante) DO UPDATE SET voto = excluded.voto")
      .bind(id, ins.id, voto),
    env.DB.prepare("UPDATE esercizi SET stelle_somma = stelle_somma + ?, stelle_voti = stelle_voti + ? WHERE id = ?")
      .bind(voto - (prima ? prima.voto : 0), prima ? 0 : 1, id)
  ]);
  const dopo = await env.DB.prepare("SELECT stelle_somma, stelle_voti FROM esercizi WHERE id = ?").bind(id).first();
  return { stelle: Math.round(dopo.stelle_somma / dopo.stelle_voti * 10) / 10, voti: dopo.stelle_voti, mieStelle: voto };
}

async function segnala(ins, id, corpo, env, richiesta) {
  controllaId(id);
  const motivo = MOTIVI[corpo.motivo] ? corpo.motivo : no(400, "Scegli un motivo dal menu.");
  const dispositivo = typeof corpo.dispositivo === "string" && /^[\w-]{8,64}$/.test(corpo.dispositivo) ? corpo.dispositivo : null;
  if (!ins && !dispositivo) no(400, "Richiesta non valida.");
  const e = await env.DB.prepare("SELECT stato FROM esercizi WHERE id = ?").bind(id).first();
  if (!e) no(404, "Questo esercizio non c'è nel catalogo.");
  const adesso = ora();
  // L'indirizzo di rete non si salva: se ne tiene un'impronta che cambia ogni giorno, solo per contare.
  const rete = await impronta((richiesta.headers.get("CF-Connecting-IP") || "") + "|" + Math.floor(adesso / GIORNO) + "|" + (env.SALE || ""));
  const tante = await env.DB.prepare("SELECT COUNT(*) AS n FROM segnalazioni WHERE rete = ? AND creato > ?").bind(rete, adesso - GIORNO).first();
  if (tante.n >= MAX_SEGNALAZIONI_AL_GIORNO) no(429, "Oggi sono già arrivate molte segnalazioni da qui: grazie, le guardiamo.");
  const gia = await env.DB.prepare(
    "SELECT 1 AS si FROM segnalazioni WHERE esercizio = ? AND motivo = ? AND chiusa = 0 AND (insegnante = ? OR dispositivo = ?)"
  ).bind(id, motivo, ins ? ins.id : "-", dispositivo || "-").first();
  if (!gia) {
    await env.DB.prepare("INSERT INTO segnalazioni (esercizio, motivo, insegnante, dispositivo, rete, creato) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(id, motivo, ins ? ins.id : null, ins ? null : dispositivo, rete, adesso).run();
  }
  let nascondi = MOTIVI[motivo].nascondi === "subito";
  if (MOTIVI[motivo].nascondi === "conta") {
    const c = await env.DB.prepare(
      `SELECT COALESCE(SUM(insegnante IS NOT NULL), 0) AS insegnanti, COALESCE(SUM(insegnante IS NULL), 0) AS anonimi
       FROM segnalazioni WHERE esercizio = ? AND chiusa = 0 AND motivo IN (${MOTIVI_CONTATI})`
    ).bind(id).first();
    nascondi = c.insegnanti >= 1 || c.anonimi >= SEGNALAZIONI_ANONIME;
  }
  if (nascondi) await env.DB.prepare("UPDATE esercizi SET stato = 'nascosto' WHERE id = ?").bind(id).run();
  return { ricevuta: true };
}

async function risolto(ins, id, env) {
  await esercizioDi(ins, id, env, false);
  await env.DB.prepare(`UPDATE segnalazioni SET chiusa = 1 WHERE esercizio = ? AND motivo IN (${MOTIVI_AUTORE})`).bind(id).run();
  return { risolto: true };
}

async function daControllare(ins, env) {
  const { results } = await env.DB.prepare(
    `SELECT e.*, i.nome FROM esercizi e JOIN insegnanti i ON i.id = e.autore
     WHERE e.stato = 'nuovo' AND e.autore != ? AND NOT EXISTS (SELECT 1 FROM approvazioni a WHERE a.esercizio = e.id AND a.insegnante = ?)
     ORDER BY e.aggiornato ASC LIMIT 30`
  ).bind(ins.id, ins.id).all();
  return { esercizi: results.map(scheda) };
}

/* ---------- moderazione: l'ultima parola ---------- */

async function coda(env) {
  const { results } = await env.DB.prepare(
    `SELECT e.*, i.nome, i.email,
       (SELECT json_group_object(motivo, n) FROM (SELECT motivo, COUNT(*) AS n FROM segnalazioni s WHERE s.esercizio = e.id AND s.chiusa = 0 GROUP BY motivo)) AS motivi
     FROM esercizi e JOIN insegnanti i ON i.id = e.autore
     WHERE e.stato = 'nascosto'
        OR EXISTS (SELECT 1 FROM segnalazioni s WHERE s.esercizio = e.id AND s.chiusa = 0 AND s.motivo IN (${MOTIVI_MODERAZIONE}))
     ORDER BY e.stato = 'nascosto' DESC, e.aggiornato DESC LIMIT 100`
  ).all();
  return { esercizi: results.map(r => Object.assign(scheda(r), { autoreId: r.autore, email: r.email, motivi: JSON.parse(r.motivi || "{}") })) };
}

async function decidi(id, corpo, env) {
  controllaId(id);
  if (corpo.azione === "rimuovi") {
    await cancellaTutto(id, env);
    return { rimosso: true };
  }
  if (corpo.azione !== "ripristina") no(400, "Azione sconosciuta.");
  await env.DB.batch([
    env.DB.prepare(`UPDATE esercizi SET stato = CASE WHEN approvazioni >= ${APPROVAZIONI_NECESSARIE} THEN 'pubblico' ELSE 'nuovo' END WHERE id = ?`).bind(id),
    env.DB.prepare(`UPDATE segnalazioni SET chiusa = 1 WHERE esercizio = ? AND motivo IN (${MOTIVI_MODERAZIONE})`).bind(id)
  ]);
  return env.DB.prepare("SELECT stato FROM esercizi WHERE id = ?").bind(id).first();
}

async function blocca(id, corpo, env) {
  if (!/^[\w-]{1,80}$/.test(id || "")) no(404, "Insegnante sconosciuto.");
  const si = corpo.azione === "blocca";
  const passi = [env.DB.prepare("UPDATE insegnanti SET bloccato = ? WHERE id = ?").bind(si ? 1 : 0, id)];
  if (si) {
    passi.push(env.DB.prepare("DELETE FROM sessioni WHERE insegnante = ?").bind(id));
    passi.push(env.DB.prepare("UPDATE esercizi SET stato = 'nascosto' WHERE autore = ?").bind(id));
  }
  await env.DB.batch(passi);
  return { bloccato: si };
}

/* ---------- indirizzi ---------- */

async function instrada(richiesta, env) {
  const url = new URL(richiesta.url);
  const [a, b, c] = url.pathname.split("/").filter(Boolean);
  const metodo = richiesta.method;
  let corpo = {};
  if (metodo === "POST" || metodo === "PUT") {
    const t = await richiesta.text();
    if (t.length > MAX_CONTENUTO + 2000) no(413, "L'esercizio è troppo grande.");
    try { corpo = t ? JSON.parse(t) : {}; } catch (e) { no(400, "Richiesta non valida."); }
  }
  const ins = await insegnanteDa(richiesta, env);
  const via = metodo + " " + [a, b && ":id", c].filter(Boolean).join("/");

  switch (via) {
    case "POST accesso": return accesso(corpo, env);
    case "POST esci": return esci(richiesta, env);
    case "GET io": return io(serve(ins), env);
    case "PUT io": return cambiaNome(serve(ins), corpo, env);
    case "GET catalogo": return elenco(url, env);
    case "GET da-controllare": return daControllare(serve(ins), env);
    case "GET esercizi/:id": return apri(b, ins, env);
    case "POST esercizi": return pubblica(serve(ins), corpo, env);
    case "PUT esercizi/:id": return aggiorna(serve(ins), b, corpo, env);
    case "DELETE esercizi/:id": return ritira(serve(ins), b, env);
    case "POST esercizi/:id/approva": return approva(serve(ins), b, env);
    case "POST esercizi/:id/stelle": return vota(serve(ins), b, corpo, env);
    case "POST esercizi/:id/segnala": return segnala(ins, b, corpo, env, richiesta);
    case "POST esercizi/:id/risolto": return risolto(serve(ins), b, env);
    case "GET coda": serveAdmin(ins); return coda(env);
    case "POST coda/:id": serveAdmin(ins); return decidi(b, corpo, env);
    case "POST insegnanti/:id/blocca": serveAdmin(ins); return blocca(b, corpo, env);
    default: return no(404, "Indirizzo sconosciuto.");
  }
}

function cors(richiesta, env) {
  const origine = richiesta.headers.get("Origin");
  if (!origine || !env.ORIGINI.split(",").map(s => s.trim()).includes(origine)) return {};
  return {
    "Access-Control-Allow-Origin": origine,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

export default {
  async fetch(richiesta, env) {
    const intestazioni = Object.assign({ "Content-Type": "application/json; charset=utf-8" }, cors(richiesta, env));
    if (richiesta.method === "OPTIONS") return new Response(null, { status: 204, headers: intestazioni });
    try {
      const dati = await instrada(richiesta, env);
      return new Response(JSON.stringify(dati), { headers: intestazioni });
    } catch (e) {
      const conosciuto = e instanceof Rifiuto;
      if (!conosciuto) console.error(e);
      return new Response(JSON.stringify({ errore: conosciuto ? e.message : "Qualcosa non ha funzionato sul server. Riprova tra poco." }),
        { status: conosciuto ? e.stato : 500, headers: intestazioni });
    }
  }
};
