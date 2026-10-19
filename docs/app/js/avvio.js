// Le pagine dell'app e il passaggio dall'una all'altra (tutto dopo il # dell'indirizzo).

import { GIOCHI, TIPI, MOTIVI, giochiPer, consegnaDi, valida } from "./modello.js";
import { caricaEsempi, elencoMiei, trovaMio, salvaMio, eliminaMio, inLink, daLink, scaricaFile, apriFile } from "./dati.js";
import { impostazioni, applica, cambia, LIMITI } from "./impostazioni.js";
import { parla, zitto, voceDisponibile } from "./voce.js";
import { suonoFesta } from "./suoni.js";
import { el, creaContesto, pulsanteVoce, avviso, finestra } from "./ui.js";
import { vista, pagina, intestazione, quandoSiEsce } from "./pagine.js";
import { catalogo, catalogoAttivo, insegnante } from "./catalogo.js";
import { vistaInsegnanti, vistaModerazione, schedaCatalogo, pubblica, copiaLink } from "./insegnanti.js";
import { editor, bozzaDa } from "./editor.js";
import * as abbina from "./giochi/abbina.js";
import * as memory from "./giochi/memory.js";
import * as scelta from "./giochi/scelta.js";
import * as raggruppa from "./giochi/raggruppa.js";
import * as sequenza from "./giochi/sequenza.js";
import * as completa from "./giochi/completa.js";

const MOTORI = { abbina, memory, scelta, raggruppa, sequenza, completa };

/* ---------- inizio ---------- */

function descrizione(es) {
  const quanti = { coppie: es.dati.coppie, gruppi: es.dati.gruppi, domande: es.dati.domande, sequenza: es.dati.passi, frasi: es.dati.frasi }[es.tipo];
  return TIPI[es.tipo].nome + " · " + quanti.length;
}

async function condividi(es) {
  const url = await inLink(es);
  const campo = el("input", { type: "text", readonly: true, value: url, "aria-label": "Link dell'esercizio" });
  const d = finestra("Condividi l'esercizio",
    el("p", { text: "Chi apre questo link gioca subito, senza registrarsi. L'esercizio viaggia dentro il link: non è salvato da nessuna parte." }),
    campo,
    el("div", { class: "finestra-piede" },
      el("button", { type: "button", class: "pulsante", text: "Copia il link", on: { click: async () => {
        campo.select();
        try { await navigator.clipboard.writeText(url); avviso("Link copiato."); d.close(); }
        catch (e) { avviso("Seleziona il link e copialo a mano."); }
      } } }),
      navigator.share ? el("button", { type: "button", class: "pulsante secondario", text: "Invia…", on: { click: () => {
        navigator.share({ title: es.titolo, url }).catch(() => {});
      } } }) : null));
}

function schedaEsercizio(es, origine) {
  const g = GIOCHI[es.gioco];
  const apri = el("a", { class: "scheda-apri", href: "#/gioca/" + origine + "/" + es.id },
    el("span", { class: "scheda-icona", "aria-hidden": "true", text: g.icona }),
    el("span", { class: "scheda-titolo", text: es.titolo }),
    el("span", { class: "scheda-info", text: g.nome + " · " + descrizione(es) + (es.catalogo ? " · nel catalogo" : "") }));
  if (origine !== "mio") return el("li", { class: "scheda" }, apri);
  return el("li", { class: "scheda" }, apri,
    el("div", { class: "scheda-azioni" },
      el("a", { class: "tasto-piccolo", href: "#/modifica/" + es.id, text: "✏️ Modifica" }),
      el("button", { type: "button", class: "tasto-piccolo", text: "🔗 Condividi", on: { click: () => condividi(es) } }),
      el("button", { type: "button", class: "tasto-piccolo", text: "💾 File", title: "Scarica il file dell'esercizio", on: { click: () => scaricaFile(es) } }),
      catalogoAttivo ? el("button", { type: "button", class: "tasto-piccolo", text: es.catalogo ? "📤 Aggiorna nel catalogo" : "📤 Pubblica",
        on: { click: () => pubblica(es, casa) } }) : null,
      el("button", { type: "button", class: "tasto-piccolo", text: "🗑", "aria-label": "Elimina", title: "Elimina", on: { click: () => {
        if (!confirm("Eliminare «" + es.titolo + "» da questo dispositivo?")) return;
        eliminaMio(es.id);
        casa();
      } } })));
}

// Il catalogo comune: cerca, filtra per tipo, ordina per stelle o per novità.
function sezioneCatalogo() {
  const filtri = { q: "", tipo: "", ordine: "", da: 0 };
  const cerca = el("input", { type: "search", placeholder: "Cerca un esercizio…", "aria-label": "Cerca nel catalogo", enterkeyhint: "search" });
  const tipo = el("select", { "aria-label": "Tipo" }, el("option", { value: "", text: "Tutti i tipi" }),
    Object.keys(TIPI).map(t => el("option", { value: t, text: TIPI[t].nome })));
  const ordine = el("select", { "aria-label": "Ordine" }, el("option", { value: "", text: "I più votati" }), el("option", { value: "recenti", text: "I più recenti" }));
  const elenco = el("ul", { class: "schede" });
  const stato = el("p", { class: "vuoto", "aria-live": "polite" });
  const altri = el("button", { type: "button", class: "pulsante secondario", hidden: true, text: "Mostra altri" });

  async function carica(daCapo) {
    if (daCapo) {
      filtri.da = 0;
      elenco.replaceChildren();
    }
    stato.textContent = "Carico…";
    altri.hidden = true;
    try {
      const r = await catalogo.elenco(filtri);
      elenco.append(...r.esercizi.map(e => schedaCatalogo(e)));
      filtri.da += r.esercizi.length;
      altri.hidden = !r.altri;
      stato.textContent = elenco.children.length ? "" : filtri.q || filtri.tipo
        ? "Nessun esercizio trovato."
        : "Il catalogo è ancora vuoto: i primi esercizi arriveranno presto.";
    } catch (e) {
      stato.textContent = e.message;
    }
  }
  let attesa = null;
  cerca.addEventListener("input", () => {
    clearTimeout(attesa);
    attesa = setTimeout(() => { filtri.q = cerca.value.trim(); carica(true); }, 350);
  });
  tipo.addEventListener("change", () => { filtri.tipo = tipo.value; carica(true); });
  ordine.addEventListener("change", () => { filtri.ordine = ordine.value; carica(true); });
  altri.addEventListener("click", () => carica(false));
  carica(true);
  return el("section", {},
    el("h2", { text: "Catalogo comune" }),
    el("p", { class: "tenue", text: "Esercizi pubblicati dagli insegnanti e controllati da altri insegnanti. Si gioca senza account." }),
    el("div", { class: "filtri" }, cerca, tipo, ordine),
    elenco, stato, altri);
}

async function casa() {
  const miei = elencoMiei();
  const esempi = await caricaEsempi();
  const file = el("input", { type: "file", accept: ".json,application/json", hidden: true });
  file.addEventListener("change", async () => {
    if (!file.files[0]) return;
    try {
      salvaMio(await apriFile(file.files[0]));
      avviso("Esercizio aggiunto ai tuoi.");
      casa();
    } catch (e) {
      avviso(e.message);
    }
  });
  vista(el("div", { class: "pagina" }, intestazione(), el("main", { class: "contenuto" },
    el("div", { class: "benvenuto" },
      el("h1", { text: "Esercizi interattivi, facili per tutti" }),
      el("p", { text: "Per la LIM, il tablet e il telefono. Gratis, senza pubblicità, senza account." }),
      el("div", { class: "azioni" },
        el("a", { class: "pulsante", href: "#/crea", text: "＋ Crea un esercizio" }),
        el("button", { type: "button", class: "pulsante secondario", text: "📂 Apri un file", on: { click: () => file.click() } }),
        file)),
    el("section", {},
      el("h2", { text: "I miei esercizi" }),
      miei.length
        ? el("ul", { class: "schede" }, miei.map(e => schedaEsercizio(e, "mio")))
        : el("p", { class: "vuoto", text: "Qui troverai gli esercizi che crei. Restano salvati su questo dispositivo: per portarli altrove usa «Condividi» o «File»." })),
    catalogoAttivo ? sezioneCatalogo() : null,
    el("section", {},
      el("h2", { text: "Esempi da provare" }),
      el("ul", { class: "schede" }, esempi.map(e => schedaEsercizio(e, "es")))))));
}

/* ---------- gioco ---------- */

function gioca(es, base, uscita, giocoChiesto, sopra) {
  const giochi = giochiPer(es.tipo);
  const gioco = giochi.includes(giocoChiesto) ? giocoChiesto : es.gioco;
  const consegna = consegnaDi(es, gioco);
  const area = el("div", { class: "area-gioco" });
  let ferma = null;

  function inizia() {
    if (ferma) ferma();
    zitto();
    area.replaceChildren();
    ferma = MOTORI[gioco].avvia(area, es, creaContesto(finito)) || null;
  }

  function finito() {
    suonoFesta();
    if (impostazioni.voce) parla("Ce l'hai fatta!");
    area.append(el("div", { class: "festa" }, el("div", { class: "festa-box", role: "status" },
      el("p", { class: "festa-titolo", text: "Ce l'hai fatta! 🎉" }),
      el("div", { class: "azioni" },
        el("button", { type: "button", class: "pulsante", text: "↻ Gioca ancora", on: { click: inizia } }),
        giochi.filter(g => g !== gioco).map(g => el("a", { class: "pulsante secondario", href: base + "/" + g, text: GIOCHI[g].icona + " " + GIOCHI[g].nome })),
        el("a", { class: "pulsante secondario", href: uscita, text: "Esci" })))));
  }

  const cambiaGioco = giochi.length > 1
    ? el("select", { class: "tasto", "aria-label": "Cambia gioco", on: { change: e => { location.hash = base + "/" + e.target.value; } } },
      giochi.map(g => el("option", { value: g, selected: g === gioco, text: GIOCHI[g].icona + " " + GIOCHI[g].nome })))
    : null;
  const schermo = document.documentElement.requestFullscreen
    ? el("button", { type: "button", class: "tasto", text: "⛶", title: "Schermo intero", "aria-label": "Schermo intero", on: { click: () => {
      if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {});
    } } })
    : null;

  vista(el("div", { class: "gioco s-" + es.scrittura },
    el("header", { class: "gioco-testa" },
      el("h1", { text: es.titolo }),
      el("p", { class: "consegna" }, el("span", { text: consegna }), pulsanteVoce(consegna, "Ascolta la consegna"))),
    sopra || null,
    area,
    el("nav", { class: "barra-gioco", "aria-label": "Comandi del gioco" },
      el("a", { class: "tasto", href: uscita, "aria-label": "Esci" }, "⟵", el("span", { class: "etichetta", text: "Esci" })),
      el("button", { type: "button", class: "tasto", "aria-label": "Ricomincia", on: { click: inizia } }, "↻", el("span", { class: "etichetta", text: "Ricomincia" })),
      cambiaGioco,
      schermo)));
  quandoSiEsce(() => {
    if (ferma) ferma();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  });
  inizia();
}

async function giocaSalvato(origine, id, gioco) {
  const es = origine === "es" ? (await caricaEsempi()).find(e => e.id === id) : origine === "mio" ? trovaMio(id) : null;
  if (!es) {
    location.hash = "#/";
    return;
  }
  gioca(es, "#/gioca/" + origine + "/" + id, "#/", gioco);
}

/* ---------- esercizio del catalogo comune ---------- */

function segnala(id) {
  const motivo = el("select", { "aria-label": "Motivo" }, el("option", { value: "", text: "Scegli che cosa non va…" }),
    Object.keys(MOTIVI).map(m => el("option", { value: m, text: MOTIVI[m].nome })));
  const invia = el("button", { type: "button", class: "pulsante", text: "Invia" });
  const d = finestra("Segnala un problema",
    el("p", { text: "Che cosa non va in questo esercizio?" }),
    motivo,
    el("p", { class: "tenue", text: "Le segnalazioni le guardano gli insegnanti. Grazie per l'aiuto." }),
    el("div", { class: "finestra-piede" }, invia,
      el("button", { type: "button", class: "pulsante secondario", text: "Annulla", on: { click: () => d.close() } })));
  invia.addEventListener("click", async () => {
    if (!motivo.value) { motivo.focus(); return; }
    try {
      await catalogo.segnala(id, motivo.value);
      d.close();
      avviso("Grazie! La segnalazione è arrivata.");
    } catch (e) {
      avviso(e.message);
    }
  });
}

function dagliStelle(r, aggiorna) {
  const d = finestra("Quante stelle?",
    el("div", { class: "stelle-scelta", role: "group", "aria-label": "Stelle" },
      [1, 2, 3, 4, 5].map(n => el("button", { type: "button", class: "stella" + (n <= r.mieStelle ? " accesa" : ""), "aria-label": n + (n === 1 ? " stella" : " stelle"),
        text: "★", on: { click: async () => {
          try {
            Object.assign(r, await catalogo.stelle(r.id, n));
            d.close();
            avviso("Grazie per le stelle!");
            aggiorna();
          } catch (e) { avviso(e.message); }
        } } }))),
    el("p", { class: "tenue", text: "Le stelle aiutano gli altri insegnanti a trovare gli esercizi migliori." }));
}

async function giocaCatalogo(id, gioco) {
  const r = await catalogo.apri(id);
  const es = valida(r.esercizio);
  const io = insegnante();
  const barra = el("div", { class: "azioni-catalogo" });
  const tasto = (testo, azione) => el("button", { type: "button", class: "tasto-piccolo", text: testo, on: { click: azione } });

  function disegna() {
    barra.replaceChildren(...[
      r.stato === "nuovo" ? el("span", { class: "stato stato-nuovo", text: "Nuovo: non ancora controllato" }) : null,
      r.stato === "nascosto" ? el("span", { class: "stato stato-nascosto", text: "Nascosto: in attesa di moderazione" }) : null,
      r.stelle ? el("span", { class: "tenue", text: "⭐ " + r.stelle.toLocaleString("it") + " (" + r.voti + ")" }) : null,
      r.autore ? el("span", { class: "tenue", text: "di " + r.autore }) : null,
      io && !r.mio && r.stato === "nuovo" && !r.approvato ? tasto("✓ Va bene", async () => {
        try {
          Object.assign(r, await catalogo.approva(id), { approvato: true });
          avviso(r.stato === "pubblico" ? "Grazie! Ora è nel catalogo." : "Grazie! Manca ancora un controllo.");
          disegna();
        } catch (e) { avviso(e.message); }
      }) : null,
      io && !r.mio && r.stato !== "nascosto" ? tasto(r.mieStelle ? "⭐ Le tue stelle: " + r.mieStelle : "⭐ Dai le stelle", () => dagliStelle(r, disegna)) : null,
      tasto("⚑ Segnala", () => segnala(id)),
      tasto("💾 Salva nei miei", () => {
        salvaMio(Object.assign({}, es));
        avviso("Salvato nei tuoi esercizi: ora puoi adattarlo.");
      }),
      tasto("🔗 Link", () => copiaLink(id))
    ].filter(Boolean));
  }
  disegna();
  gioca(es, "#/catalogo/" + id, "#/", gioco, barra);
}

/* ---------- esercizio arrivato con un link ---------- */

async function vistaLink(codice, azione, gioco) {
  const es = await daLink(codice);
  const qui = "#/link/" + codice;
  if (azione === "gioca") {
    gioca(es, qui + "/gioca", qui, gioco);
    return;
  }
  vista(pagina(es.titolo,
    el("p", { text: GIOCHI[es.gioco].icona + " " + GIOCHI[es.gioco].nome + " · " + descrizione(es) }),
    el("div", { class: "azioni" },
      el("a", { class: "pulsante", href: qui + "/gioca", text: "▶ Gioca" }),
      el("button", { type: "button", class: "pulsante secondario", text: "Salva nei miei esercizi", on: { click: () => {
        salvaMio(es);
        avviso("Salvato nei tuoi esercizi.");
        location.hash = "#/";
      } } }))));
}

/* ---------- crea e modifica ---------- */

function apriEditor(es) {
  vista(el("div", { class: "pagina" }, intestazione(), el("main", { class: "contenuto" },
    editor(bozzaDa(es), {
      salva(pronto, poi) {
        const s = salvaMio(Object.assign(pronto, { catalogo: es && es.catalogo }));
        avviso(s.catalogo ? "Salvato. Per mandare la modifica al catalogo usa «Aggiorna nel catalogo»." : "Esercizio salvato su questo dispositivo.");
        location.hash = poi === "gioca" ? "#/gioca/mio/" + s.id : "#/";
      },
      annulla() { location.hash = "#/"; }
    }))));
}

/* ---------- impostazioni e info ---------- */

function interruttore(chiave, nome, aiuto, attivo) {
  const c = el("input", { type: "checkbox", checked: !!impostazioni[chiave], disabled: attivo === false });
  c.addEventListener("change", () => cambia(chiave, c.checked));
  return el("label", { class: "interruttore" }, c, el("span", {}, el("b", { text: nome }), el("small", { text: aiuto })));
}

function numero(chiave, nome, aiuto) {
  const [min, max] = LIMITI[chiave];
  const valore = el("output", { text: String(impostazioni[chiave]) });
  const passo = d => el("button", { type: "button", class: "tasto-piccolo", text: d > 0 ? "＋" : "－", "aria-label": (d > 0 ? "Più " : "Meno ") + nome,
    on: { click: () => {
      cambia(chiave, Math.min(max, Math.max(min, impostazioni[chiave] + d)));
      valore.textContent = String(impostazioni[chiave]);
    } } });
  return el("div", { class: "numero" }, el("span", {}, el("b", { text: nome }), el("small", { text: aiuto })),
    el("div", { class: "numero-tasti" }, passo(-1), valore, passo(1)));
}

function vistaImpostazioni() {
  vista(pagina("Impostazioni",
    el("p", { text: "Valgono per questo dispositivo." }),
    el("div", { class: "impostazioni" },
      interruttore("voce", "Lettura ad alta voce", voceDisponibile
        ? "Legge le carte quando le tocchi e le domande quando compaiono."
        : "Questo dispositivo non ha una voce per leggere.", voceDisponibile),
      interruttore("suoni", "Suoni", "Un suono gentile quando la risposta è giusta."),
      interruttore("aiuto", "Aiuto dopo un errore", "Mostra per un momento dove va la carta."),
      interruttore("contrasto", "Alto contrasto", "Colori più forti e bordi più spessi."),
      numero("elementi", "Carte per partita", "Quante carte o domande in ogni partita."),
      numero("risposte", "Risposte tra cui scegliere", "Nella scelta multipla e nelle frasi da completare."))));
}

function info() {
  vista(pagina("Lavagna Amica",
    el("p", { text: "Esercizi interattivi gratuiti, pensati per il sostegno e per la LIM. Nessuna funzione a pagamento, niente pubblicità, niente tracciamento." }),
    el("h2", { text: "I tuoi dati" }),
    el("p", { text: "Per giocare non serve un account e non raccogliamo nulla. Gli esercizi che crei e le impostazioni restano su questo dispositivo. Un esercizio esce dal dispositivo solo se lo condividi tu, con un link o un file, o se lo pubblichi nel catalogo." }),
    catalogoAttivo ? el("p", { text: "Il catalogo comune sta su un server di Cloudflare. Gli insegnanti accedono con Google: salviamo la loro email, che non viene mai mostrata, e il nome che scelgono di mostrare. Una segnalazione anonima salva solo il motivo, un numero a caso di questo dispositivo e un'impronta della rete che cambia ogni giorno, per frenare gli abusi." }) : null,
    el("p", { text: "Le immagini arrivano dall'archivio pubblico di pittogrammi ARASAAC, che vede quindi le richieste delle immagini." }),
    el("p", {}, el("a", { href: "../privacy.html", text: "Informativa privacy completa" })),
    el("h2", { text: "Riconoscimenti" }),
    el("p", { text: "Pittogrammi: autore Sergio Palao. Origine: ARASAAC (arasaac.org). Licenza: CC BY-NC-SA 4.0. Proprietà: Governo d'Aragona (Spagna)." }),
    el("p", { text: "Carattere corsivo: Playwrite IT Moderna, SIL Open Font License 1.1." }),
    el("h2", { text: "Licenze" }),
    el("p", {}, "Il codice è libero, sotto licenza ",
      el("a", { href: "https://github.com/marcellomassardo-collab/lavagnaamica", text: "GNU AGPL-3.0" }),
      ". Gli esercizi pubblicati sono sotto CC BY-SA 4.0."),
    el("h2", { text: "Sostenere il progetto" }),
    el("p", {}, "Lavagna Amica è e resterà gratuita. Se vuoi sostenerla, puoi farlo con ",
      el("a", { href: "https://www.paypal.com/paypalme/marcellomassardo", rel: "noopener", target: "_blank", text: "PayPal" }), ".")));
}

/* ---------- strada ---------- */

async function instrada() {
  const [pagina1, a, b, c] = location.hash.replace(/^#\/?/, "").split("/");
  try {
    if (!pagina1) await casa();
    else if (pagina1 === "gioca") await giocaSalvato(a, b, c);
    else if (pagina1 === "catalogo" && catalogoAttivo) await giocaCatalogo(a, b);
    else if (pagina1 === "link") await vistaLink(a || "", b, c);
    else if (pagina1 === "crea") apriEditor(null);
    else if (pagina1 === "modifica") {
      const es = trovaMio(a);
      if (es) apriEditor(es); else location.hash = "#/";
    }
    else if (pagina1 === "insegnanti" && catalogoAttivo) await vistaInsegnanti();
    else if (pagina1 === "moderazione" && catalogoAttivo) await vistaModerazione();
    else if (pagina1 === "impostazioni") vistaImpostazioni();
    else if (pagina1 === "info") info();
    else location.hash = "#/";
  } catch (e) {
    vista(pagina("C'è un problema", el("p", { text: e.message }), el("a", { class: "pulsante", href: "#/", text: "Torna all'inizio" })));
  }
}

applica();
window.addEventListener("hashchange", instrada);
instrada();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
