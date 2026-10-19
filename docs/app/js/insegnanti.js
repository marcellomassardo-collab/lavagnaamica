// Area insegnanti: accesso con Google, esercizi da controllare, i propri pubblicati e, per chi modera, la coda.

import { el, avviso, finestra } from "./ui.js";
import { vista, pagina } from "./pagine.js";
import { catalogo, insegnante, linkCatalogo } from "./catalogo.js";
import { GOOGLE_CLIENT_ID } from "./config.js";
import { GIOCHI, TIPI, MOTIVI } from "./modello.js";
import { salvaMio } from "./dati.js";

const STATI = {
  nuovo: "Nuovo: in attesa del controllo",
  pubblico: "Nel catalogo",
  nascosto: "Nascosto: in attesa di moderazione"
};

function stelleTesto(r) {
  return r.stelle ? "⭐ " + r.stelle.toLocaleString("it") + " (" + r.voti + ")" : "Ancora nessuna stella";
}

export function schedaCatalogo(r, ...azioni) {
  const g = GIOCHI[r.gioco];
  return el("li", { class: "scheda" },
    el("a", { class: "scheda-apri", href: "#/catalogo/" + r.id },
      el("span", { class: "scheda-icona", "aria-hidden": "true", text: g.icona }),
      el("span", { class: "scheda-titolo", text: r.titolo }),
      el("span", { class: "scheda-info", text: [g.nome, TIPI[r.tipo].nome, stelleTesto(r), r.autore ? "di " + r.autore : ""].filter(Boolean).join(" · ") })),
    azioni.length ? el("div", { class: "scheda-azioni" }, azioni) : null);
}

const tasto = (testo, azione, attr) =>
  el("button", Object.assign({ type: "button", class: "tasto-piccolo", text: testo, on: { click: azione } }, attr));

export async function copiaLink(id) {
  try {
    await navigator.clipboard.writeText(linkCatalogo(id));
    avviso("Link copiato: chi lo apre gioca subito.");
  } catch (e) {
    finestra("Link dell'esercizio", el("input", { type: "text", readonly: true, value: linkCatalogo(id), "aria-label": "Link" }));
  }
}

/* ---------- pubblicare dal dispositivo al catalogo ---------- */

export function pubblica(es, fatto) {
  if (!insegnante()) {
    avviso("Per pubblicare accedi come insegnante.");
    location.hash = "#/insegnanti";
    return;
  }
  const invia = el("button", { type: "button", class: "pulsante", text: es.catalogo ? "Aggiorna" : "Pubblica" });
  const d = finestra(es.catalogo ? "Aggiorna nel catalogo comune" : "Pubblica nel catalogo comune",
    el("p", { text: "Pubblicando dichiari che:" }),
    el("ul", { class: "regole" },
      el("li", { text: "non ci sono nomi, foto o altri dati di alunni;" }),
      el("li", { text: "testi e immagini sono tuoi, liberi o di pubblico dominio;" }),
      el("li", { text: "chiunque potrà usarlo e adattarlo, citando la fonte (licenza CC BY-SA 4.0)." })),
    el("p", { class: "tenue", text: es.catalogo
      ? "La nuova versione tornerà al controllo di due insegnanti."
      : "Due insegnanti lo controlleranno, poi comparirà nel catalogo. Intanto si può già giocare con il suo link." }),
    el("div", { class: "finestra-piede" },
      invia,
      el("button", { type: "button", class: "pulsante secondario", text: "Annulla", on: { click: () => d.close() } })));
  invia.addEventListener("click", async () => {
    invia.disabled = true;
    try {
      let r;
      try {
        r = es.catalogo ? await catalogo.aggiorna(es.catalogo, es) : await catalogo.pubblica(es);
      } catch (e) {
        if (!es.catalogo || e.stato !== 404) throw e;
        r = await catalogo.pubblica(es);
      }
      salvaMio(Object.assign({}, es, { catalogo: r.id }));
      d.close();
      avviso(es.catalogo ? "Aggiornato: ora torna al controllo." : "Pubblicato! Ora lo controllano due insegnanti.");
      if (fatto) fatto();
    } catch (e) {
      invia.disabled = false;
      avviso(e.message);
    }
  });
}

/* ---------- accesso ---------- */

function caricaGoogle() {
  return new Promise((ok, ko) => {
    if (window.google && window.google.accounts) return ok();
    const s = el("script", { src: "https://accounts.google.com/gsi/client", async: true });
    s.onload = ok;
    s.onerror = () => ko(new Error("Non riesco a contattare Google: controlla la connessione."));
    document.head.append(s);
  });
}

async function accesso() {
  const posto = el("div", { class: "posto-google" });
  vista(pagina("Area insegnanti",
    el("p", { text: "Qui gli insegnanti pubblicano esercizi nel catalogo comune, controllano quelli nuovi e danno le stelle. Gli alunni e le famiglie non hanno bisogno di accedere: giocano e basta." }),
    el("p", { text: "Si accede con Google, senza una password nuova. Salviamo la tua email, che non viene mai mostrata, e il nome che sceglierai di mostrare." }),
    GOOGLE_CLIENT_ID ? posto : el("p", { class: "tenue", text: "L'accesso degli insegnanti non è ancora attivo." })));
  if (!GOOGLE_CLIENT_ID) return;
  try {
    await caricaGoogle();
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async risposta => {
        try {
          await catalogo.accedi(risposta.credential);
          avviso("Accesso fatto.");
          vistaInsegnanti();
        } catch (e) {
          avviso(e.message);
        }
      }
    });
    window.google.accounts.id.renderButton(posto, { theme: "outline", size: "large", text: "signin_with", shape: "pill", locale: "it" });
  } catch (e) {
    posto.textContent = e.message;
  }
}

/* ---------- area di chi ha fatto l'accesso ---------- */

export async function vistaInsegnanti() {
  if (!insegnante()) return accesso();
  const [mio, daVedere] = await Promise.all([catalogo.io(), catalogo.daControllare()]);
  const io = mio.insegnante;

  const nome = el("input", { type: "text", value: io.nome, maxlength: "40", placeholder: "Per esempio: Maestra Anna", "aria-label": "Nome da mostrare" });
  const salvaNome = el("button", { type: "button", class: "pulsante secondario", text: "Salva", on: { click: async () => {
    try { await catalogo.nome(nome.value); avviso("Nome salvato."); } catch (e) { avviso(e.message); }
  } } });

  const controlli = daVedere.esercizi.map(r => {
    const va = tasto("✓ Va bene", async () => {
      try {
        const esito = await catalogo.approva(r.id);
        avviso(esito.stato === "pubblico" ? "Grazie! Ora è nel catalogo." : "Grazie! Manca ancora un controllo.");
        vistaInsegnanti();
      } catch (e) { avviso(e.message); }
    });
    return schedaCatalogo(Object.assign({}, r, { stelle: null }), el("a", { class: "tasto-piccolo", href: "#/catalogo/" + r.id, text: "▶ Provalo" }), va,
      el("span", { class: "tenue", text: "controlli: " + r.approvazioni + " di 2" }));
  });

  const pubblicati = mio.pubblicati.map(r => schedaCatalogo(r,
    el("span", { class: "stato stato-" + r.stato, text: STATI[r.stato] + (r.stato === "nuovo" ? " (" + r.approvazioni + " di 2)" : "") }),
    r.daCorreggere ? el("span", { class: "da-correggere", text: "⚠ " + r.daCorreggere + (r.daCorreggere === 1 ? " segnalazione" : " segnalazioni") + " di errori" }) : null,
    r.daCorreggere ? tasto("Fatto, corretto", async () => {
      try { await catalogo.risolto(r.id); vistaInsegnanti(); } catch (e) { avviso(e.message); }
    }) : null,
    tasto("🔗 Link", () => copiaLink(r.id)),
    tasto("Ritira", async () => {
      if (!confirm("Ritirare «" + r.titolo + "» dal catalogo? Chi ha il link non potrà più aprirlo.")) return;
      try { await catalogo.ritira(r.id); avviso("Ritirato dal catalogo."); vistaInsegnanti(); } catch (e) { avviso(e.message); }
    })));

  vista(pagina("Area insegnanti",
    el("p", { class: "tenue", text: "Hai fatto l'accesso come " + io.email + "." }),
    el("section", {},
      el("h2", { text: "Il tuo nome pubblico" }),
      el("p", { class: "tenue", text: "Compare sotto i tuoi esercizi nel catalogo. Puoi lasciarlo vuoto." }),
      el("div", { class: "riga-ed" }, nome, salvaNome)),
    el("section", {},
      el("h2", { text: "Da controllare" }),
      el("p", { class: "tenue", text: "Ogni esercizio nuovo entra nel catalogo quando due insegnanti lo hanno provato e dicono che va bene. Se qualcosa non va, aprilo e usa «Segnala»." }),
      controlli.length ? el("ul", { class: "schede" }, controlli) : el("p", { class: "vuoto", text: "Niente da controllare, per ora." })),
    el("section", {},
      el("h2", { text: "I tuoi esercizi nel catalogo" }),
      el("p", { class: "tenue", text: "Per pubblicarne uno nuovo usa «Pubblica» sotto i tuoi esercizi nella pagina iniziale." }),
      pubblicati.length ? el("ul", { class: "schede" }, pubblicati) : el("p", { class: "vuoto", text: "Non hai ancora pubblicato niente." })),
    el("div", { class: "azioni" },
      io.admin ? el("a", { class: "pulsante secondario", href: "#/moderazione", text: "🛡 Moderazione" }) : null,
      el("button", { type: "button", class: "pulsante secondario", text: "Esci", on: { click: async () => {
        await catalogo.esci();
        avviso("Hai chiuso l'accesso.");
        location.hash = "#/";
      } } }))));
}

/* ---------- moderazione: l'ultima parola su ciò che è stato segnalato ---------- */

export async function vistaModerazione() {
  const io = insegnante();
  if (!io || !io.admin) {
    location.hash = "#/insegnanti";
    return;
  }
  const { esercizi } = await catalogo.coda();
  const voci = esercizi.map(r => {
    const motivi = Object.entries(r.motivi).map(([m, n]) => (MOTIVI[m] ? MOTIVI[m].nome : m) + ": " + n).join(" · ");
    return schedaCatalogo(r,
      el("span", { class: "stato stato-" + r.stato, text: STATI[r.stato] }),
      el("span", { class: "tenue", text: motivi || "nessuna segnalazione aperta" }),
      el("span", { class: "tenue", text: "autore: " + (r.autore || "senza nome") + " (" + r.email + ")" }),
      tasto("Rimetti", async () => {
        try { await catalogo.decidi(r.id, "ripristina"); avviso("Rimesso."); vistaModerazione(); } catch (e) { avviso(e.message); }
      }),
      tasto("Rimuovi", async () => {
        if (!confirm("Rimuovere del tutto «" + r.titolo + "»? Non si può annullare.")) return;
        try { await catalogo.decidi(r.id, "rimuovi"); avviso("Rimosso."); vistaModerazione(); } catch (e) { avviso(e.message); }
      }),
      tasto("Blocca l'autore", async () => {
        if (!confirm("Bloccare " + r.email + "? Non potrà più accedere e i suoi esercizi verranno nascosti.")) return;
        try { await catalogo.blocca(r.autoreId, "blocca"); avviso("Autore bloccato."); vistaModerazione(); } catch (e) { avviso(e.message); }
      }));
  });
  vista(pagina("Moderazione",
    el("p", { class: "tenue", text: "Qui arrivano gli esercizi nascosti dalle segnalazioni e quelli con segnalazioni aperte. «Rimetti» li riporta dov'erano, «Rimuovi» li cancella." }),
    voci.length ? el("ul", { class: "schede" }, voci) : el("p", { class: "vuoto", text: "Nessuna segnalazione da guardare." }),
    el("a", { class: "pulsante secondario", href: "#/insegnanti", text: "⟵ Area insegnanti" })));
}
