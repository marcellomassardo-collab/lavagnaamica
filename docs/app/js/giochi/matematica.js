// Matematica con gli oggetti: prima si vede (e si fa), poi si scrive con i numeri.
// Nei problemi l'operazione nasce da ciò che succede nella storia, non dalle parole del testo.

import { el, mescola, pulsanteVoce } from "../ui.js";
import { OPERAZIONI, SCHEMI, PROPRIETA, LINEE, risultato } from "../modello.js";
import { oggetto, oggetti, file10, compari, sposta, spostaInsieme, riordina, aspetta, contaToccando, gruppo, decine, barretta, cubetto, centinaio, linea } from "../scena.js";

const MELA = { t: "mela", p: 2462 };

export function avvia(area, es, ctx) {
  const tutti = es.dati.esercizi;
  // se sono tanti se ne prende una parte, ma nell'ordine dell'insegnante (dal più facile al più difficile)
  const scelti = tutti.length > ctx.opz.elementi
    ? mescola(tutti.map((x, i) => i)).slice(0, ctx.opz.elementi).sort((x, y) => x - y).map(i => tutti[i])
    : tutti;
  const aRichiesta = es.dati.aiuto === "a-richiesta";
  let n = 0;
  let giuste = 0;
  let totale = 0;
  let fermo = false;
  const fermato = () => fermo;

  const punti = el("div", { class: "punti", "aria-hidden": "true" }, scelti.map(() => el("span")));
  const testo = el("div", { class: "mat-testo" });
  const scena = el("div", { class: "mat-scena" });
  const strumenti = el("div", { class: "mat-strumenti" });
  const scatola = el("div", { class: "mat-scatola" }, scena);
  const pannello = el("div", { class: "mat-pannello", "aria-live": "polite" });
  area.append(punti, testo, el("div", { class: "mat-corpo" }, el("div", { class: "mat-vista" }, scatola, strumenti), pannello));
  const azzeraConta = contaToccando(scena, numero => ctx.leggi(numero));

  /* ---------- pezzi comuni ---------- */

  function tasto(etichetta, azione) {
    return el("button", { type: "button", class: "tasto-piccolo", text: etichetta, on: { click: azione } });
  }

  // Con l'aiuto «a richiesta» gli oggetti restano coperti finché il bambino non li chiede.
  function coperta() {
    if (!aRichiesta) return;
    scatola.classList.add("coperta");
    const mostra = el("button", { type: "button", class: "pulsante secondario mat-mostra", text: "👀 Aiutami con gli oggetti",
      on: { click: () => { scatola.classList.remove("coperta"); mostra.remove(); } } });
    scatola.append(mostra);
  }

  function opzioniNumeri(giusto, altre) {
    const scelte = [giusto];
    altre.concat([giusto + 1, giusto - 1, giusto + 2, giusto - 2, giusto + 10]).forEach(x => {
      if (Number.isInteger(x) && x >= 0 && !scelte.includes(x) && scelte.length < ctx.opz.risposte) scelte.push(x);
    });
    return mescola(scelte.map(String));
  }

  // Una domanda con le risposte da toccare: si va avanti solo con quella giusta.
  function chiedi(domanda, opzioni, giusta, sopra) {
    return new Promise(avanti => {
      totale++;
      let sbagliato = false;
      const bottoni = opzioni.map(o => el("button", { type: "button", class: "mat-opzione", text: o }));
      const giustoB = bottoni[opzioni.indexOf(giusta)];
      bottoni.forEach(b => b.addEventListener("click", () => {
        if (b !== giustoB) {
          b.disabled = true;
          b.classList.add("sbagliata");
          sbagliato = true;
          ctx.riprova(b, giustoB);
          return;
        }
        bottoni.forEach(x => { x.disabled = true; });
        b.classList.add("giusta");
        ctx.giusto();
        if (!sbagliato) giuste++;
        setTimeout(avanti, 650);
      }));
      pannello.replaceChildren(sopra || "", el("p", { class: "mat-chiede" }, el("span", { text: domanda }), pulsanteVoce(domanda, "Ascolta")),
        el("div", { class: "mat-opzioni", style: "--quante:" + Math.min(opzioni.length, 4) }, bottoni));
      ctx.leggi(domanda);
    });
  }

  const uguale = (testoConto, nascosto) => el("p", { class: "mat-uguale" + (nascosto ? " in-attesa" : "") }, testoConto);

  function avanti(dopo) {
    return new Promise(ok => {
      const b = el("button", { type: "button", class: "pulsante", text: "Avanti ▶", on: { click: ok } });
      pannello.replaceChildren(...dopo.filter(Boolean), b);
      b.focus();
    });
  }

  /* ---------- le scene ---------- */

  // aggiungere: i nuovi arrivano dopo i primi e completano le file da dieci
  async function scenaAggiunta(a, b, o, separati) {
    const primi = oggetti(a, o);
    const nuovi = oggetti(b, o, "nuovo");
    const f = file10(primi.concat(nuovi), a + b > 30 ? "tanti" : "");
    scena.replaceChildren(f);
    await compari(primi, fermato);
    if (!separati) await aspetta(500);
    return async () => compari(nuovi, fermato);
  }

  async function scenaTogliere(a, b, o) {
    const tutti = oggetti(a, o);
    scena.replaceChildren(file10(tutti, a > 30 ? "tanti" : ""));
    await compari(tutti, fermato);
    return async () => {
      for (const x of tutti.slice(a - b).reverse()) {
        if (fermo) return;
        x.classList.add("via");
        await aspetta(Math.max(60, 900 / b));
      }
    };
  }

  async function scenaConfronto(a, b, o) {
    const primi = oggetti(a, o);
    const secondi = oggetti(b, o, "nuovo");
    scena.replaceChildren(el("div", { class: "confronto" },
      el("div", { class: "riga-confronto" }, el("span", { class: "etichetta-gruppo", text: "1°" }), file10(primi)),
      el("div", { class: "riga-confronto" }, el("span", { class: "etichetta-gruppo", text: "2°" }), file10(secondi))));
    await compari(primi, fermato);
    return async () => {
      await compari(secondi, fermato);
      await aspetta(300);
      // in coppia: uno del primo con uno del secondo; quelli senza compagno sono «in più»
      for (let k = 0; k < Math.max(a, b); k++) {
        if (fermo) return;
        if (k < a && k < b) { primi[k].classList.add("in-coppia"); secondi[k].classList.add("in-coppia"); }
        else (k < a ? primi[k] : secondi[k]).classList.add("in-piu");
        await aspetta(110);
      }
    };
  }

  // gruppi uguali: a gruppi da b
  async function scenaGruppi(a, b, o, contenitore) {
    const gruppi = Array.from({ length: a }, () => oggetti(b, o));
    const scatole = gruppi.map(g => gruppo(contenitore, g));
    scena.replaceChildren(el("div", { class: "gruppi-m" + (a * b >= 20 ? " tanti" : "") }, scatole));
    scatole.forEach(s => s.classList.add("chiuso"));
    scatole[0].classList.remove("chiuso");
    await compari(gruppi[0], fermato);
    return async () => {
      for (let k = 1; k < a; k++) {
        if (fermo) return;
        scatole[k].classList.remove("chiuso");
        await compari(gruppi[k], fermato);
      }
    };
  }

  // schieramento: a righe da b
  async function scenaSchieramento(a, b, o) {
    const righe = Array.from({ length: a }, () => oggetti(b, o));
    scena.replaceChildren(el("div", { class: "schieramento" + (a * b > 64 ? " molti" : a * b > 36 ? " tanti" : ""), style: "--colonne:" + b }, righe.flat()));
    for (const r of righe) {
      if (fermo) return;
      await compari(r, fermato);
      await aspetta(200);
    }
  }

  // dividere in parti uguali (ripartizione) o in gruppi da b (contenenza): lo fa il bambino toccando il mucchio
  function scenaDividere(a, b, o, contenitore, contenenza) {
    const mucchio = oggetti(a, o);
    mucchio.forEach(x => x.classList.add("visibile"));
    const pila = file10(mucchio, "mucchio" + (a > 30 ? " tanti" : ""));
    const piatti = contenenza ? [] : Array.from({ length: b }, () => gruppo(contenitore || { p: 16857, t: "piatto" }, []));
    const zonaPiatti = el("div", { class: "gruppi-m piatti" }, piatti);
    scena.replaceChildren(el("div", { class: "dividere" }, pila, zonaPiatti));
    let k = 0;
    let finito = null;
    const fatto = new Promise(r => { finito = r; });
    async function unPasso() {
      const restano = [...pila.children];
      if (!restano.length) return;
      if (contenenza) {
        const nuovo = gruppo(contenitore, []);
        zonaPiatti.append(nuovo);
        for (const x of restano.slice(0, b)) await sposta(x, nuovo.querySelector(".gruppo-dentro"));
      } else {
        await sposta(restano[0], piatti[k % b].querySelector(".gruppo-dentro"));
        k++;
      }
      if (!pila.children.length) finito();
    }
    let occupato = false;
    pila.addEventListener("click", async () => {
      if (occupato) return;
      occupato = true;
      await unPasso();
      occupato = false;
    });
    const tutto = async () => {
      while (pila.children.length && !fermo) {
        if (!occupato) {
          occupato = true;
          await unPasso();
          occupato = false;
        } else await aspetta(100);
      }
    };
    return { fatto, tutto };
  }

  /* ---------- i generi di esercizio ---------- */

  async function conta(x) {
    const o = es.dati.oggetto || MELA;
    testo.replaceChildren(el("p", {}, el("span", { text: "Quanti sono? Puoi toccarli per contarli." })));
    const tutti = oggetti(x.a, o);
    scena.replaceChildren(file10(tutti, x.a > 30 ? "tanti" : ""));
    coperta();
    await compari(tutti, fermato);
    await chiedi("Quanti sono?", opzioniNumeri(x.a, []), String(x.a));
    await avanti([uguale("Sono " + x.a + ".")]);
  }

  async function confronta(x) {
    const o = es.dati.oggetto || MELA;
    testo.replaceChildren(el("p", {}, el("span", { text: "Metti gli oggetti in coppia: chi ne ha di più?" })));
    coperta();
    const poi = await scenaConfronto(x.a, x.b, o);
    await poi();
    strumenti.replaceChildren(tasto("▶ Guarda di nuovo", async () => (await scenaConfronto(x.a, x.b, o))()));
    const chi = x.a === x.b ? "Sono uguali" : x.a > x.b ? "Il 1° gruppo" : "Il 2° gruppo";
    await chiedi("Quale gruppo ne ha di più?", ["Il 1° gruppo", "Il 2° gruppo", "Sono uguali"], chi);
    const segni = { "<": "< minore", ">": "> maggiore", "=": "= uguale" };
    const s = x.a < x.b ? "<" : x.a > x.b ? ">" : "=";
    await chiedi("Che segno metti?", Object.values(segni), segni[s], uguale(x.a + "  …  " + x.b));
    await avanti([uguale(x.a + " " + s + " " + x.b)]);
  }

  async function primaDopo(x) {
    const g = x.verso === "dopo" ? x.a + 1 : x.a - 1;
    const domanda = "Che numero viene " + (x.verso === "dopo" ? "dopo " : "prima di ") + x.a + "?";
    testo.replaceChildren(el("p", {}, el("span", { text: domanda })));
    const da = Math.max(0, x.a - 5);
    scena.replaceChildren(linea(da, da + 10, x.a));
    coperta();
    await chiedi(domanda, opzioniNumeri(g, [x.verso === "dopo" ? x.a - 1 : x.a + 1]), String(g));
    const arrivo = scena.querySelector('[data-numero="' + g + '"]');
    arrivo.classList.add("salto", "segnata");
    await avanti([uguale(x.verso === "dopo" ? x.a + " + 1 = " + g : x.a + " − 1 = " + g)]);
  }

  async function decineUnita(x) {
    const da = Math.floor(x.a / 10);
    const u = x.a % 10;
    testo.replaceChildren(el("p", {}, el("span", { text: "Il numero " + x.a + ": quante decine e quante unità? Tocca per contare." })));
    const d = decine(x.a);
    scena.replaceChildren(d.vista);
    coperta();
    await compari(d.barrette, fermato);
    await compari(d.unita, fermato);
    await chiedi("Quante decine?", opzioniNumeri(da, [u]), String(da));
    await chiedi("Quante unità?", opzioniNumeri(u, [da]), String(u));
    await avanti([uguale(x.a + " = " + da + " da + " + u + " u")]);
  }

  async function operazione(x) {
    const o = es.dati.oggetto || MELA;
    const segno = OPERAZIONI[x.op];
    const r = risultato(x.op, x.a, x.b);
    const conto = x.a + " " + segno + " " + x.b;
    testo.replaceChildren(el("p", {}, el("span", { text: conto + " = ?" })));
    coperta();
    let rigioca = null;
    if (x.op === "+") rigioca = async () => (await scenaAggiunta(x.a, x.b, o))();
    if (x.op === "-") rigioca = async () => (await scenaTogliere(x.a, x.b, o))();
    if (x.op === "x") rigioca = () => scenaSchieramento(x.a, x.b, o);
    if (rigioca) {
      await rigioca();
      strumenti.replaceChildren(tasto("▶ Guarda di nuovo", rigioca), tasto("↺ Conta da capo", azzeraConta));
    } else {
      const div = scenaDividere(x.a, x.b, o, null, false);
      strumenti.replaceChildren(tasto("▶ Distribuisci tu tutto", div.tutto));
      pannello.replaceChildren(el("p", { class: "mat-chiede", text: "Tocca il mucchio: dai un oggetto a ogni piatto, uno alla volta." }));
      ctx.leggi("Tocca il mucchio: dai un oggetto a ogni piatto, uno alla volta.");
      await div.fatto;
      strumenti.replaceChildren(tasto("↺ Conta da capo", azzeraConta));
    }
    const sbagliato = x.op === "+" ? Math.abs(x.a - x.b) : x.op === "-" ? x.a + x.b : x.op === "x" ? x.a + x.b : x.a - x.b;
    await chiedi(x.op === ":" ? "Quanti in ogni piatto?" : "Quanto fa?", opzioniNumeri(r, [sbagliato]), String(r));
    await avanti([uguale(conto + " = " + r)]);
  }

  async function problema(x) {
    const schema = SCHEMI[x.schema];
    const o = x.oggetto || es.dati.oggetto || MELA;
    const frasi = x.testo.map(t => el("span", { class: "frase-storia", text: t }));
    testo.replaceChildren(el("p", { class: "storia" }, frasi, pulsanteVoce(x.testo.join(" "), "Ascolta il problema")));
    coperta();
    const inizio = frasi.slice(0, Math.max(1, frasi.length - 2));
    const azione = frasi.length > 2 ? frasi[frasi.length - 2] : null;
    const domanda = frasi[frasi.length - 1];

    // la storia: ogni frase letta fa succedere la sua parte
    async function storia() {
      frasi.forEach(f => f.classList.remove("ora"));
      let poi = null;
      let dividere = null;
      const prepara = async () => {
        if (x.schema === "unione" || x.schema === "aggiunta") poi = await scenaAggiunta(x.a, x.b, o, x.schema === "unione");
        if (x.schema === "togliere") poi = await scenaTogliere(x.a, x.b, o);
        if (x.schema === "confronto") poi = await scenaConfronto(x.a, x.b, o);
        if (x.schema === "gruppi") poi = await scenaGruppi(x.a, x.b, o, x.contenitore);
        if (x.schema === "ripartizione" || x.schema === "contenenza") dividere = scenaDividere(x.a, x.b, o, x.contenitore, x.schema === "contenenza");
      };
      for (const f of inizio) {
        if (fermo) return null;
        f.classList.add("ora");
        const voce = ctx.racconta(f.textContent);
        if (f === inizio[0]) await prepara();
        await voce;
        f.classList.remove("ora");
      }
      if (azione && !fermo) {
        azione.classList.add("ora");
        const voce = ctx.racconta(azione.textContent);
        if (poi) await poi();
        await voce;
        azione.classList.remove("ora");
      }
      if (fermo) return null;
      domanda.classList.add("ora");
      await ctx.racconta(domanda.textContent);
      return dividere;
    }

    let dividere = await storia();
    if (fermo) return;
    strumenti.replaceChildren(tasto("▶ Guarda di nuovo", async () => { dividere = await storia(); }), tasto("↺ Conta da capo", azzeraConta));

    const altri = mescola(Object.keys(SCHEMI).filter(s => SCHEMI[s].op !== schema.op)).slice(0, 2);
    await chiedi("Che cosa succede?", mescola([x.schema].concat(altri)).map(s => SCHEMI[s].nome), schema.nome);
    await chiedi("Che operazione serve?", Object.values(OPERAZIONI), OPERAZIONI[schema.op]);

    const conto = x.a + " " + OPERAZIONI[schema.op] + " " + x.b;
    if (dividere) {
      const istruzione = x.schema === "contenenza"
        ? "Tocca il mucchio: ogni volta fai un gruppo da " + x.b + "."
        : "Tocca il mucchio: dai un oggetto a ogni parte, uno alla volta.";
      pannello.replaceChildren(uguale(conto + " = ?"), el("p", { class: "mat-chiede", text: istruzione }));
      ctx.leggi(istruzione);
      strumenti.replaceChildren(tasto("▶ Fallo per me", dividere.tutto), tasto("↺ Conta da capo", azzeraConta));
      await dividere.fatto;
    }
    const r = risultato(schema.op, x.a, x.b);
    const sbagliato = schema.op === "+" ? Math.abs(x.a - x.b) : schema.op === "-" ? x.a + x.b : schema.op === "x" ? x.a + x.b : x.a - x.b;
    await chiedi(domanda.textContent, opzioniNumeri(r, [sbagliato]), String(r), uguale(conto + " = ?"));
    await avanti([uguale(conto + " = " + r), x.risposta ? el("p", { class: "mat-risposta", text: x.risposta }) : null]);
  }

  // In colonna: ogni colonna (centinaia, decine, unità) ha le sue cifre e i suoi blocchi: quadrati da cento,
  // barrette da dieci, cubetti. Si comincia dalle unità; il cambio si vede succedere: 10 blocchi diventano uno
  // della colonna a sinistra (riporto), oppure uno della colonna a sinistra diventa 10 blocchi (prestito).
  const POSTI = [
    { nome: "unità", sigla: "u", blocco: cubetto, uno: "1 decina" },
    { nome: "decine", sigla: "da", blocco: barretta, uno: "1 centinaio" },
    { nome: "centinaia", sigla: "h", blocco: centinaio }];
  async function colonna(x) {
    const piu = x.op === "+";
    const segno = OPERAZIONI[x.op];
    const parola = piu ? " più " : " meno ";
    const r = risultato(x.op, x.a, x.b);
    const cifreDi = n => [n % 10, Math.floor(n / 10) % 10, Math.floor(n / 100)];
    const A = cifreDi(x.a), B = cifreDi(x.b);
    const quante = Math.max(2, String(Math.max(x.a, x.b, r)).length);
    const conto = x.a + " " + segno + " " + x.b;
    testo.replaceChildren(el("p", {}, el("span", { text: conto + ": in colonna" })));
    const blocchi = (n, fatto) => Array.from({ length: n }, fatto);
    const cifra = n => el("span", { class: "cifra", text: n === null ? "" : String(n) });
    // le cifre a zero in testa al numero non si scrivono (7, non 07)
    const inTesta = (n, k) => k > 0 && n < 10 ** k;
    const col = [];
    for (let k = 0; k < quante; k++) {
      const c = { ca: cifra(inTesta(x.a, k) ? null : A[k]), cb: cifra(inTesta(x.b, k) ? null : B[k]), cr: cifra(null),
        sopra: el("span", { class: "sopra-col" }) };
      c.blA = blocchi(A[k], POSTI[k].blocco);
      // nella sottrazione il secondo numero è quello da togliere: si scrive, ma non si costruisce con i blocchi
      c.blB = piu ? blocchi(B[k], POSTI[k].blocco) : [];
      const cella = (cf, figli) => el("div", { class: "cella-col", "data-k": k }, cf, el("div", { class: "blocchi" }, figli));
      c.cellaA = cella(c.ca, c.blA);
      c.cellaB = cella(c.cb, c.blB);
      c.cellaR = cella(c.cr, []);
      col.push(c);
    }
    const daSinistra = sceglie => col.slice().reverse().map(sceglie);
    const riga = (s, celle, classe) => el("div", { class: "riga-col " + (classe || "") }, el("span", { class: "segno-col", text: s }), celle);
    const tabella = el("div", { class: "colonna-blocchi", style: "--colonne:" + quante },
      riga("", daSinistra((c, i) => el("span", { class: "posto" }, POSTI[quante - 1 - i].sigla, c.sopra)), "testa"),
      riga("", daSinistra(c => c.cellaA)), riga(segno, daSinistra(c => c.cellaB), "seconda"), riga("", daSinistra(c => c.cellaR), "risultato"));
    scena.replaceChildren(tabella);
    await compari(col.flatMap(c => c.blA.concat(c.blB)).reverse(), fermato);
    const dentro = c => c.querySelector(".blocchi");
    const vivi = c => [...dentro(c).children].filter(b => !b.classList.contains("via"));
    const scrivi = (k, n) => { if (!inTesta(r, k)) { col[k].cr.textContent = String(n); col[k].cr.classList.add("scritta"); } };
    const spiega = async t => {
      pannello.replaceChildren(el("p", { class: "mat-chiede" }, el("span", { text: t }), pulsanteVoce(t, "Ascolta")));
      await ctx.racconta(t);
    };
    const prima = k => (k === 0 ? "Prima le " : "Ora le ") + POSTI[k].nome + ": ";

    if (piu) {
      let riporto = 0;
      for (let k = 0; k < quante; k++) {
        if (fermo) return;
        tabella.dataset.ora = k;
        const c = col[k];
        const somma = A[k] + B[k] + riporto;
        if (A[k] || B[k]) {
          await chiedi(prima(k) + A[k] + parola + B[k] + (riporto ? parola + "1" : "") + ". Quante sono?",
            opzioniNumeri(somma, [riporto ? somma - 1 : Math.abs(A[k] - B[k])]), String(somma),
            uguale(A[k] + " + " + B[k] + (riporto ? " + 1" : "") + " = ?"));
        }
        await spostaInsieme(c.blA.concat(c.blB), dentro(c.cellaR));
        if (somma >= 10 && !fermo) {
          const dieci = [...dentro(c.cellaR).children].slice(0, 10);
          dieci.forEach(b => b.classList.add("cambio"));
          await spiega(somma + " " + POSTI[k].nome + ": 10 " + POSTI[k].nome + " fanno " + POSTI[k].uno + ". Cambio e porto " + POSTI[k].uno + " nella colonna a sinistra.");
          const nuovo = POSTI[k + 1].blocco();
          nuovo.classList.add("visibile", "riportata");
          dieci.forEach(b => b.remove());
          dentro(col[k + 1].cellaR).append(nuovo);
          col[k + 1].sopra.textContent = "1";
          col[k + 1].sopra.classList.add("visibile");
          await aspetta(400);
          await chiedi("Quante " + POSTI[k].nome + " restano?", opzioniNumeri(somma - 10, [somma]), String(somma - 10));
        }
        scrivi(k, somma % 10);
        riporto = somma >= 10 ? 1 : 0;
      }
    } else {
      const disp = A.slice();  // le cifre del primo numero dopo i cambi
      // la colonna j+1 dà un blocco alla colonna j, che ne riceve 10; se anche lei è a zero, prima chiede alla sua sinistra
      const presta = async j => {
        if (disp[j + 1] === 0) await presta(j + 1);
        if (fermo) return;
        const da = col[j + 1], a = col[j];
        const blocco = vivi(da.cellaA).pop();
        blocco.classList.add("cambio");
        await spiega("Le " + POSTI[j].nome + " non bastano: cambio " + POSTI[j].uno + " in 10 " + POSTI[j].nome + ".");
        blocco.remove();
        disp[j + 1]--;
        disp[j] += 10;
        const dieci = blocchi(10, POSTI[j].blocco);
        dentro(a.cellaA).append(...dieci);
        await compari(dieci, fermato);
        da.ca.classList.add("barrata");
        da.sopra.textContent = String(disp[j + 1]);
        da.sopra.classList.add("visibile");
        a.ca.dataset.prestito = "1";
      };
      for (let k = 0; k < quante; k++) {
        if (fermo) return;
        tabella.dataset.ora = k;
        const c = col[k];
        if (disp[k] < B[k]) {
          await presta(k);
          await chiedi("Quante " + POSTI[k].nome + " ci sono adesso?", opzioniNumeri(disp[k], [A[k]]), String(disp[k]));
        }
        const resto = disp[k] - B[k];
        if (disp[k] || B[k]) {
          await chiedi(prima(k) + disp[k] + parola + B[k] + ". Quante restano?", opzioniNumeri(resto, [Math.abs(B[k] - A[k])]), String(resto),
            uguale(disp[k] + " − " + B[k] + " = ?"));
        }
        for (const b of vivi(c.cellaA).slice(disp[k] - B[k])) {
          if (fermo) return;
          b.classList.add("via");
          await aspetta(Math.max(40, 600 / Math.max(1, B[k])));
        }
        scrivi(k, resto);
      }
    }
    delete tabella.dataset.ora;
    strumenti.replaceChildren(tasto("↺ Conta da capo", azzeraConta));
    await avanti([uguale(conto + " = " + r)]);
  }

  /* ---------- le proprietà: lo stesso calcolo, fatto in un modo più facile ---------- */
  // Prima si vede che gli oggetti sono sempre quelli (il risultato non cambia), poi si fa il calcolo nel modo comodo.
  const regola = p => el("p", { class: "mat-risposta" }, el("strong", { text: PROPRIETA[p].nome + ": " }), PROPRIETA[p].regola);
  const consiglio = t => el("p", { class: "mat-consiglio", text: "💡 " + t });
  const dimensione = n => (n > 64 ? " molti" : n > 36 ? " tanti" : "");
  const schieramento = (colonne, nodi, quanti) => el("div", { class: "schieramento" + dimensione(quanti || nodi.length), style: "--colonne:" + colonne }, nodi);
  const titolo = t => testo.replaceChildren(el("p", {}, el("span", { text: t })));
  const racconta = async t => {
    pannello.replaceChildren(el("p", { class: "mat-chiede" }, el("span", { text: t }), pulsanteVoce(t, "Ascolta")));
    await ctx.racconta(t);
  };
  const righeDi = (a, b, o) => Array.from({ length: a }, () => oggetti(b, o));
  async function compariRighe(righe) {
    for (const r of righe) {
      if (fermo) return;
      await compari(r, fermato);
      await aspetta(120);
    }
  }

  const PROP = {
    async "commutativa-addizione"(x, o) {
      const r = x.a + x.b;
      titolo(x.a + " + " + x.b + ": se scambio i numeri, il risultato cambia?");
      const primi = oggetti(x.a, o), secondi = oggetti(x.b, o, "nuovo");
      const fila = file10(primi.concat(secondi), r > 30 ? "tanti" : "");
      scena.replaceChildren(fila);
      coperta();
      await compari(primi, fermato);
      await compari(secondi, fermato);
      let scambiati = false;
      const scambia = () => {
        scambiati = !scambiati;
        return riordina(primi.concat(secondi), () => fila.append(...(scambiati ? secondi.concat(primi) : primi.concat(secondi))));
      };
      await racconta("Scambio i due gruppi: prima " + x.b + ", poi " + x.a + ".");
      await scambia();
      strumenti.replaceChildren(tasto("⇄ Scambia di nuovo", scambia), tasto("↺ Conta da capo", azzeraConta));
      await chiedi(x.a + " + " + x.b + " = " + x.b + " + ?", opzioniNumeri(x.a, [x.b]), String(x.a));
      await chiedi("Quanto fa?", opzioniNumeri(r, [Math.abs(x.a - x.b)]), String(r), uguale(x.b + " + " + x.a + " = ?"));
      await avanti([uguale(x.a + " + " + x.b + " = " + x.b + " + " + x.a + " = " + r), regola(x.prop),
        x.a !== x.b ? consiglio("Conviene partire dal numero più grande: da " + Math.max(x.a, x.b) + " conti solo " + Math.min(x.a, x.b) + " passi avanti.") : null]);
    },

    async "associativa-addizione"(x, o) {
      const prima = (x.a + x.b) % 10 === 0;   // la coppia vicina che fa un numero tondo (il modello ne accetta una sola)
      const coppie = [x.a + " + " + x.b, x.b + " + " + x.c];
      const s = prima ? x.a + x.b : x.b + x.c;
      const r = x.a + x.b + x.c;
      const conto = x.a + " + " + x.b + " + " + x.c;
      titolo(conto + ": quali numeri sommo prima?");
      const gruppi = [oggetti(x.a, o), oggetti(x.b, o, "nuovo"), oggetti(x.c, o)];
      const scatole = gruppi.map(g => el("div", { class: "gruppo-m" }, el("div", { class: "gruppo-dentro" }, g)));
      scena.replaceChildren(el("div", { class: "gruppi-m" + (r > 20 ? " tanti" : "") }, scatole));
      coperta();
      for (const g of gruppi) await compari(g, fermato);
      await chiedi("Quali due numeri conviene sommare prima? Cerca quelli che insieme fanno un numero tondo.", coppie, coppie[prima ? 0 : 1], uguale(conto));
      // i due gruppi diventano uno solo, in file da dieci: si vede che fanno una decina (o più) intera
      const uniti = prima ? gruppi[0].concat(gruppi[1]) : gruppi[1].concat(gruppi[2]);
      const nuova = el("div", { class: "gruppo-m" }, file10([], "tanti"));
      await riordina(uniti, () => {
        const [s1, s2] = prima ? scatole.slice(0, 2) : scatole.slice(1, 3);
        s1.replaceWith(nuova);
        s2.remove();
        nuova.firstChild.append(...uniti);
      });
      strumenti.replaceChildren(tasto("↺ Conta da capo", azzeraConta));
      await chiedi(coppie[prima ? 0 : 1] + " = ?", opzioniNumeri(s, [s - 1]), String(s));
      const dopo = prima ? s + " + " + x.c : x.a + " + " + s;
      await chiedi(dopo + " = ?", opzioniNumeri(r, [r - 10]), String(r));
      await avanti([uguale((prima ? "(" + coppie[0] + ") + " + x.c : x.a + " + (" + coppie[1] + ")") + " = " + dopo + " = " + r), regola(x.prop),
        consiglio("Cerca i numeri amici, quelli che insieme fanno 10, 20, 30…")]);
    },

    // senza c: si spezza b per arrivare alla decina dopo a (8 + 5 = 8 + 2 + 3); con c: b = c + il resto (34 + 25 = 34 + 20 + 5)
    async "dissociativa-addizione"(x, o) {
      const decina = x.c === undefined;
      const pezzo = decina ? 10 - x.a % 10 : x.c, meta = x.a + pezzo, resto = x.b - pezzo, r = x.a + x.b;
      titolo(x.a + " + " + x.b + ": " + (decina ? "prima arrivo a " + meta + ", poi aggiungo il resto" : "spezzo il " + x.b + " in " + pezzo + " + " + resto));
      const primi = oggetti(x.a, o), nuovi = oggetti(x.b, o, "nuovo");
      scena.replaceChildren(file10(primi.concat(nuovi), r > 30 ? "tanti" : ""));
      coperta();
      await compari(primi, fermato);
      if (decina) await chiedi("Quanti ne mancano a " + x.a + " per arrivare a " + meta + "?", opzioniNumeri(pezzo, [x.a % 10]), String(pezzo));
      else await chiedi("Spezzo il " + x.b + ": " + x.b + " = " + pezzo + " + ?", opzioniNumeri(resto, [x.b + pezzo]), String(resto));
      // arriva prima il primo pezzo (cerchiato in rosso), poi il resto
      nuovi.slice(0, pezzo).forEach(n => n.classList.add("cambio"));
      await compari(nuovi.slice(0, pezzo), fermato);
      if (!decina) await chiedi(x.a + " + " + pezzo + " = ?", opzioniNumeri(meta, [x.a + resto]), String(meta));
      await aspetta(500);
      await compari(nuovi.slice(pezzo), fermato);
      strumenti.replaceChildren(tasto("↺ Conta da capo", azzeraConta));
      if (decina) await chiedi("Spezzo il " + x.b + ": " + x.b + " = " + pezzo + " + ?", opzioniNumeri(resto, [x.b + pezzo]), String(resto));
      await chiedi(meta + " + " + resto + " = ?", opzioniNumeri(r, [r + 10]), String(r));
      await avanti([uguale(x.a + " + " + x.b + " = " + x.a + " + " + pezzo + " + " + resto + " = " + meta + " + " + resto + " = " + r), regola(x.prop),
        consiglio(decina ? "Arriva prima al numero tondo: dopo è più facile." : "Aggiungi prima le decine, poi le unità.")]);
    },

    async "invariantiva-sottrazione"(x, o) {
      const r = x.a - x.b, A = x.a + x.c, B = x.b + x.c, k = Math.abs(x.c), piu = x.c > 0;
      const segno = piu ? " + " : " − ";
      titolo(x.a + " − " + x.b + ": " + (piu ? "aggiungo " : "tolgo ") + k + " a tutti e due i numeri");
      const tanti = Math.max(x.a, A) > 20 ? "tanti" : "";
      const uno = oggetti(x.a, o), due = oggetti(x.b, o, "nuovo");
      const f1 = file10(uno, tanti), f2 = file10(due, tanti);
      scena.replaceChildren(el("div", { class: "confronto" },
        el("div", { class: "riga-confronto" }, el("span", { class: "etichetta-gruppo", text: "1°" }), f1),
        el("div", { class: "riga-confronto" }, el("span", { class: "etichetta-gruppo", text: "2°" }), f2)));
      coperta();
      // la differenza: quelli della prima fila che restano senza compagno nella seconda
      const marca = () => {
        const v1 = uno.filter(n => !n.classList.contains("via")), v2 = due.filter(n => !n.classList.contains("via"));
        uno.concat(due).forEach(n => n.classList.remove("in-coppia", "in-piu"));
        v1.forEach((n, i) => n.classList.add(i < v2.length ? "in-coppia" : "in-piu"));
        v2.forEach(n => n.classList.add("in-coppia"));
      };
      await compari(uno, fermato);
      await compari(due, fermato);
      marca();
      await racconta("Quelli senza compagno sono la differenza tra " + x.a + " e " + x.b + ". Ora " +
        (piu ? "aggiungo " + k + " a tutte e due le file." : "tolgo " + k + " da tutte e due le file."));
      if (fermo) return;
      if (piu) {
        const n1 = oggetti(k, o), n2 = oggetti(k, o, "nuovo");
        f1.append(...n1);
        f2.append(...n2);
        uno.push(...n1);
        due.push(...n2);
        await compari(n1.concat(n2), fermato);
      } else {
        for (const n of uno.slice(-k).concat(due.slice(-k))) {
          n.classList.add("via");
          await aspetta(180);
        }
      }
      marca();
      strumenti.replaceChildren(tasto("↺ Conta da capo", azzeraConta));
      await chiedi("Prima fila: " + x.a + segno + k + " = ?", opzioniNumeri(A, [x.a]), String(A));
      await chiedi("Seconda fila: " + x.b + segno + k + " = ?", opzioniNumeri(B, [x.b]), String(B));
      await chiedi("Quelli senza compagno sono sempre gli stessi. " + A + " − " + B + " = ?", opzioniNumeri(r, [x.a - B]), String(r), uguale(A + " − " + B + " = ?"));
      await avanti([uguale(x.a + " − " + x.b + " = " + A + " − " + B + " = " + r), regola(x.prop),
        consiglio("Fai diventare tondo il numero da togliere: " + A + " − " + B + " è più facile.")]);
    },

    async "commutativa-moltiplicazione"(x, o) {
      const r = x.a * x.b;
      titolo(x.a + " × " + x.b + ": se giro lo schieramento, il risultato cambia?");
      const righe = righeDi(x.a, x.b, o);
      const tutti = righe.flat();
      const vista = schieramento(x.b, tutti);
      scena.replaceChildren(vista);
      coperta();
      await compariRighe(righe);
      let girato = false;
      // girare = le righe diventano colonne: l'oggetto della riga i, colonna j va nella riga j, colonna i
      const gira = () => {
        girato = !girato;
        const ordine = girato ? Array.from({ length: x.b }, (_, j) => righe.map(riga => riga[j])).flat() : tutti;
        return riordina(tutti, () => {
          vista.style.setProperty("--colonne", girato ? x.a : x.b);
          vista.append(...ordine);
        });
      };
      await racconta(x.a + " righe da " + x.b + ". Ora giro lo schieramento: diventano " + x.b + " righe da " + x.a + ".");
      await gira();
      strumenti.replaceChildren(tasto("⟳ Gira di nuovo", gira), tasto("↺ Conta da capo", azzeraConta));
      await chiedi(x.a + " × " + x.b + " = " + x.b + " × ?", opzioniNumeri(x.a, [x.b]), String(x.a));
      await chiedi("Quanto fa?", opzioniNumeri(r, [x.a + x.b]), String(r), uguale(x.b + " × " + x.a + " = ?"));
      await avanti([uguale(x.a + " × " + x.b + " = " + x.b + " × " + x.a + " = " + r), regola(x.prop),
        x.a !== x.b ? consiglio("Se sai " + x.b + " × " + x.a + ", sai anche " + x.a + " × " + x.b + ": le tabelline da imparare sono quasi la metà.") : null]);
    },

    async "associativa-moltiplicazione"(x, o) {
      const prima = (x.a * x.b) % 10 === 0;   // la coppia vicina che fa un numero tondo (il modello ne accetta una sola)
      const coppie = [x.a + " × " + x.b, x.b + " × " + x.c];
      const [p, q] = prima ? [x.a, x.b] : [x.b, x.c];
      const fuori = prima ? x.c : x.a;
      const s = p * q, r = s * fuori;
      const conto = x.a + " × " + x.b + " × " + x.c;
      titolo(conto + ": quale moltiplicazione faccio prima?");
      scena.replaceChildren(uguale(conto));
      await chiedi("Quale moltiplicazione conviene fare prima? Cerca quella che fa un numero tondo.", coppie, coppie[prima ? 0 : 1]);
      // tanti gruppi quanto il numero rimasto fuori; in ogni gruppo uno schieramento della coppia
      const gruppi = Array.from({ length: fuori }, () => oggetti(s, o));
      scena.replaceChildren(el("div", { class: "gruppi-m" + (r > 20 ? " tanti" : "") },
        gruppi.map(g => el("div", { class: "gruppo-m" }, schieramento(q, g)))));
      coperta();
      for (const g of gruppi) await compari(g, fermato);
      strumenti.replaceChildren(tasto("↺ Conta da capo", azzeraConta));
      await chiedi("In ogni gruppo: " + coppie[prima ? 0 : 1] + " = ?", opzioniNumeri(s, [p + q]), String(s));
      const dopo = prima ? s + " × " + x.c : x.a + " × " + s;
      await chiedi("I gruppi sono " + fuori + ": " + dopo + " = ?", opzioniNumeri(r, [s + fuori]), String(r));
      await avanti([uguale((prima ? "(" + coppie[0] + ") × " + x.c : x.a + " × (" + coppie[1] + ")") + " = " + dopo + " = " + r), regola(x.prop),
        consiglio("Cerca la coppia che fa 10: moltiplicare per 10 è facile.")]);
    },

    // il contrario dell'associativa: b si spezza in c × (b : c), e si vedono b : c gruppi, ognuno con a righe da c
    async "dissociativa-moltiplicazione"(x, o) {
      const volte = x.b / x.c, s = x.a * x.c, r = x.a * x.b;
      const doppio = x.c === 2 && volte === 2;
      titolo(x.a + " × " + x.b + ": spezzo il " + x.b + " in " + x.c + " × " + volte);
      scena.replaceChildren(uguale(x.a + " × " + x.b));
      await chiedi("Spezzo il " + x.b + " in una moltiplicazione: " + x.b + " = " + x.c + " × ?", opzioniNumeri(volte, [x.b - x.c]), String(volte));
      const gruppi = Array.from({ length: volte }, () => oggetti(s, o));
      scena.replaceChildren(el("div", { class: "gruppi-m" + (r > 20 ? " tanti" : "") },
        gruppi.map(g => el("div", { class: "gruppo-m" }, schieramento(x.c, g)))));
      coperta();
      await compari(gruppi[0], fermato);
      await chiedi("Nel primo gruppo: " + x.a + " × " + x.c + " = ?", opzioniNumeri(s, [x.a + x.c]), String(s));
      for (const g of gruppi.slice(1)) await compari(g, fermato);
      strumenti.replaceChildren(tasto("↺ Conta da capo", azzeraConta));
      await chiedi("I gruppi sono " + volte + ": " + s + " × " + volte + " = ?", opzioniNumeri(r, [s + volte]), String(r));
      await avanti([uguale(x.a + " × " + x.b + " = " + x.a + " × " + x.c + " × " + volte + " = " + s + " × " + volte + " = " + r), regola(x.prop),
        consiglio(doppio ? "Per moltiplicare per 4 fai il doppio del doppio." : "Spezza il numero in una moltiplicazione più facile, come " + x.c + " × " + volte + ".")]);
    },

    async "distributiva-moltiplicazione"(x, o) {
      if (x.c > x.b) return distributivaMeno(x, o);
      const d = x.b - x.c, p1 = x.a * x.c, p2 = x.a * d, r = x.a * x.b;
      titolo(x.a + " × " + x.b + ": spezzo il " + x.b + " in " + x.c + " + " + d);
      const righe = righeDi(x.a, x.b, o);
      const tutti = righe.flat();
      scena.replaceChildren(schieramento(x.b, tutti));
      coperta();
      await compariRighe(righe);
      await racconta(x.a + " righe da " + x.b + ". Spezzo ogni riga: " + x.c + " da una parte e " + d + " dall'altra.");
      if (fermo) return;
      const sinistra = righe.flatMap(riga => riga.slice(0, x.c)), destra = righe.flatMap(riga => riga.slice(x.c));
      const parte = (colonne, nodi, scritta) => el("div", { class: "prop-parte" }, schieramento(colonne, nodi, r), el("span", { text: scritta }));
      await riordina(tutti, () => {
        scena.replaceChildren(el("div", { class: "prop-parti" }, parte(x.c, sinistra, x.a + " × " + x.c), parte(d, destra, x.a + " × " + d)));
      });
      destra.forEach(n => n.classList.add("nuovo"));
      strumenti.replaceChildren(tasto("↺ Conta da capo", azzeraConta));
      await chiedi(x.a + " × " + x.c + " = ?", opzioniNumeri(p1, [x.a + x.c]), String(p1));
      await chiedi(x.a + " × " + d + " = ?", opzioniNumeri(p2, [x.a + d]), String(p2));
      await chiedi("Ora sommo i due pezzi: " + p1 + " + " + p2 + " = ?", opzioniNumeri(r, [r - 10]), String(r));
      await avanti([uguale(x.a + " × " + x.b + " = " + x.a + " × " + x.c + " + " + x.a + " × " + d + " = " + p1 + " + " + p2 + " = " + r), regola(x.prop),
        consiglio("Spezza il numero difficile in pezzi facili: qui " + x.b + " = " + x.c + " + " + d + ".")]);
    }
  };

  // la distributiva con il meno: a × b = a × c − a × (c − b), per esempio 6 × 9 = 6 × 10 − 6 × 1.
  // Si costruisce lo schieramento più grande (c colonne) e si tolgono le colonne in più.
  async function distributivaMeno(x, o) {
    const d = x.c - x.b, p1 = x.a * x.c, p2 = x.a * d, r = x.a * x.b;
    titolo(x.a + " × " + x.b + ": faccio " + x.a + " × " + x.c + " e poi tolgo " + x.a + " × " + d);
    const righe = righeDi(x.a, x.c, o);
    scena.replaceChildren(schieramento(x.c, righe.flat()));
    coperta();
    await compariRighe(righe);
    await chiedi(x.a + " × " + x.c + " = ?", opzioniNumeri(p1, [x.a + x.c]), String(p1));
    await racconta("Ma io volevo " + x.b + " in ogni riga, non " + x.c + ": tolgo " + d + " da ogni riga.");
    for (const n of righe.flatMap(riga => riga.slice(x.b))) {
      if (fermo) return;
      n.classList.add("via");
      await aspetta(120);
    }
    strumenti.replaceChildren(tasto("↺ Conta da capo", azzeraConta));
    await chiedi("Quanti ne ho tolti? " + x.a + " × " + d + " = ?", opzioniNumeri(p2, [x.a + d]), String(p2));
    await chiedi(p1 + " − " + p2 + " = ?", opzioniNumeri(r, [p1 + p2]), String(r));
    await avanti([uguale(x.a + " × " + x.b + " = " + x.a + " × " + x.c + " − " + x.a + " × " + d + " = " + p1 + " − " + p2 + " = " + r), regola(x.prop),
      consiglio(x.c === 10 && d === 1 ? "Per moltiplicare per 9: moltiplica per 10 e togli una volta il numero." : "Arriva a un numero tondo e poi togli quello che è in più.")]);
  }

  const proprieta = x => PROP[x.prop](x, es.dati.oggetto || MELA);

  /* ---------- la retta, i blocchi, le frazioni: si tocca e si costruisce ---------- */

  // le risposte sbagliate stanno sulle tacche vicine: un salto in più, uno in meno
  function opzioniPasso(giusto, passo) {
    const scelte = [giusto];
    [giusto + passo, giusto - passo, giusto + 2 * passo, giusto - 2 * passo, giusto + 5 * passo].forEach(v => {
      if (v >= 0 && !scelte.includes(v) && scelte.length < ctx.opz.risposte) scelte.push(v);
    });
    return mescola(scelte.map(String));
  }

  // una domanda che si risponde toccando la scena: si va avanti solo con il pezzo giusto
  function toccaGiusto(domanda, pezzi, giusto) {
    return new Promise(ok => {
      totale++;
      let sbagliato = false;
      pezzi.forEach(p => p.addEventListener("click", () => {
        if (p !== giusto) { sbagliato = true; ctx.riprova(p, giusto); return; }
        pezzi.forEach(q => { q.disabled = true; });
        ctx.giusto(p);
        if (!sbagliato) giuste++;
        setTimeout(ok, 650);
      }));
      pannello.replaceChildren(el("p", { class: "mat-chiede" }, el("span", { text: domanda }), pulsanteVoce(domanda, "Ascolta")));
      ctx.leggi(domanda);
    });
  }

  // si costruisce (blocchi, parti colorate) e poi si tocca «Fatto»: se non va, si dice che cosa si è fatto
  function controlla(domanda, conta, giusto, sbaglio) {
    return new Promise(ok => {
      totale++;
      let sbagliato = false;
      const frase = el("span", { text: domanda });
      const fatto = el("button", { type: "button", class: "pulsante", text: "✔ Fatto", on: { click: () => {
        const n = conta();
        if (n !== giusto) {
          sbagliato = true;
          frase.textContent = sbaglio(n);
          ctx.riprova(fatto);
          ctx.leggi(frase.textContent);
          return;
        }
        fatto.disabled = true;
        ctx.giusto(fatto);
        if (!sbagliato) giuste++;
        setTimeout(ok, 650);
      } } });
      pannello.replaceChildren(el("p", { class: "mat-chiede" }, frase, pulsanteVoce(() => frase.textContent, "Ascolta")), fatto);
      ctx.leggi(domanda);
    });
  }

  // la retta dei numeri: 11 tacche, scritti solo il primo, quello di mezzo e l'ultimo
  async function retta(x) {
    const valori = Array.from({ length: 11 }, (_, k) => x.da + k * x.passo);
    const scritti = [valori[0], valori[5], valori[10]];
    const tacche = valori.map(v => el("button", { type: "button", class: "rt-tacca", "data-numero": v, "aria-label": scritti.includes(v) ? String(v) : "tacca" },
      el("span", { class: "rt-segno", "aria-hidden": "true" }), el("span", { class: "rt-num", text: scritti.includes(v) ? String(v) : "" })));
    const giusta = tacche[(x.a - x.da) / x.passo];
    scena.replaceChildren(el("div", { class: "retta" }, el("div", { class: "rt-linea", "aria-hidden": "true" }), tacche));
    testo.replaceChildren(el("p", {}, el("span", { text: x.passo === 1 ? "La retta dei numeri: ogni tacca è un numero." :
      "Guarda i numeri scritti: quanto vale ogni salto da una tacca all'altra?" })));
    if (x.modo === "trova") await toccaGiusto("Tocca la tacca del numero " + x.a + ".", tacche, giusta);
    else {
      tacche.forEach(t => { t.disabled = true; });
      giusta.classList.add("freccia");
      await chiedi("Che numero indica la freccia?", opzioniPasso(x.a, x.passo), String(x.a));
    }
    // si scrivono tutti i numeri, di salto in salto
    giusta.classList.add("freccia");
    for (const t of tacche) {
      if (fermo) return;
      t.querySelector(".rt-num").textContent = t.dataset.numero;
      t.classList.add("vista");
      await aspetta(120);
    }
    const salti = (x.a - x.da) / x.passo;
    await avanti([uguale(salti === 0 ? "È il primo numero: " + x.a + "." :
      "Da " + x.da + ", " + salti + (salti === 1 ? " salto" : " salti") + " da " + x.passo + ": " + x.a + ".")]);
  }

  // i blocchi: da leggere, oppure da costruire con + e −
  async function blocchi(x) {
    const cifre = { h: Math.floor(x.a / 100), d: Math.floor(x.a / 10) % 10, u: x.a % 10 };
    const fai = { h: centinaio, d: barretta, u: cubetto };
    const nomi = { h: ["h", "centinaia"], d: ["da", "decine"], u: ["u", "unità"] };
    const pezzi = { h: el("div", { class: "mb-pezzi" }), d: el("div", { class: "mb-pezzi" }), u: el("div", { class: "mb-pezzi" }) };
    const quanti = { h: 0, d: 0, u: 0 };
    const tasti = [];
    const colonna = k => {
      const metti = piu => {
        if (piu && quanti[k] < 9) { quanti[k]++; const b = fai[k](); pezzi[k].append(b); compari([b], fermato); }
        if (!piu && quanti[k] > 0) { quanti[k]--; pezzi[k].lastChild.remove(); }
      };
      const comandi = x.modo === "costruisci" ? el("div", { class: "mb-tasti" },
        tasti[tasti.push(tasto("−", () => metti(false))) - 1], tasti[tasti.push(tasto("+", () => metti(true))) - 1]) : null;
      return el("div", { class: "mb-colonna mb-" + k }, el("span", { class: "mb-nome" }, el("b", { text: nomi[k][0] }), " " + nomi[k][1]), comandi, pezzi[k]);
    };
    scena.replaceChildren(el("div", { class: "multibase" }, colonna("h"), colonna("d"), colonna("u")));
    if (x.modo === "costruisci") {
      testo.replaceChildren(el("p", {}, el("span", { text: "Costruisci il numero " + x.a + " con i blocchi." })));
      await controlla("Metti i blocchi con + e −, poi tocca Fatto.", () => quanti.h * 100 + quanti.d * 10 + quanti.u, x.a,
        n => "Con questi blocchi hai fatto " + n + ". Ti serve " + x.a + ": guarda le centinaia, le decine e le unità.");
      tasti.forEach(t => { t.disabled = true; });
    } else {
      testo.replaceChildren(el("p", {}, el("span", { text: "Che numero formano i blocchi? Tocca per contare." })));
      const tutti = ["h", "d", "u"].map(k => Array.from({ length: cifre[k] }, () => { const b = fai[k](); pezzi[k].append(b); return b; }));
      coperta();
      for (const g of tutti) await compari(g, fermato);
      if (x.a >= 100) await chiedi("Quante centinaia?", opzioniNumeri(cifre.h, [cifre.d, cifre.u]), String(cifre.h));
      await chiedi("Quante decine?", opzioniNumeri(cifre.d, [cifre.u, cifre.h]), String(cifre.d));
      await chiedi("Quante unità?", opzioniNumeri(cifre.u, [cifre.d]), String(cifre.u));
      const scambi = [cifre.h * 100 + cifre.u * 10 + cifre.d, cifre.d * 100 + cifre.h * 10 + cifre.u, cifre.u * 100 + cifre.d * 10 + cifre.h];
      await chiedi("Che numero è?", opzioniNumeri(x.a, scambi.filter(v => v !== x.a && v > 0)), String(x.a));
    }
    await avanti([uguale(x.a + " = " + cifre.h + " h + " + cifre.d + " da + " + cifre.u + " u"),
      uguale(x.a + " = " + cifre.h * 100 + " + " + cifre.d * 10 + " + " + cifre.u)]);
  }

  // le frazioni: un cerchio o una barra divisi in parti uguali
  const PARTE = { 2: ["mezzo", "mezzi"], 3: ["terzo", "terzi"], 4: ["quarto", "quarti"], 5: ["quinto", "quinti"], 6: ["sesto", "sesti"],
    7: ["settimo", "settimi"], 8: ["ottavo", "ottavi"], 9: ["nono", "noni"], 10: ["decimo", "decimi"], 11: ["undicesimo", "undicesimi"], 12: ["dodicesimo", "dodicesimi"] };
  const PAROLE = ["zero", "un", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove", "dieci", "undici", "dodici"];
  const nomeFrazione = (a, b) => (a === 1 ? "un " + PARTE[b][0] : PAROLE[a] + " " + PARTE[b][1]);
  const svgEl = (tag, attr) => {
    const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attr).forEach(([k, v]) => n.setAttribute(k, v));
    return n;
  };
  function figuraFrazione(b, forma) {
    const svg = svgEl("svg", { viewBox: forma === "barra" ? "0 0 420 120" : "0 0 240 240", class: "fr-figura fr-" + forma });
    const parti = Array.from({ length: b }, (_, k) => {
      let p;
      if (forma === "barra") p = svgEl("rect", { x: (10 + k * 400 / b).toFixed(2), y: 10, width: (400 / b).toFixed(2), height: 100 });
      else {
        const r = 110, c = 120, a0 = -Math.PI / 2 + k * 2 * Math.PI / b, a1 = a0 + 2 * Math.PI / b;
        const punto = t => (c + r * Math.cos(t)).toFixed(2) + "," + (c + r * Math.sin(t)).toFixed(2);
        p = svgEl("path", { d: "M" + c + "," + c + " L" + punto(a0) + " A" + r + "," + r + " 0 0 1 " + punto(a1) + " Z" });
      }
      p.setAttribute("class", "fr-parte");
      svg.append(p);
      return p;
    });
    return { svg, parti };
  }

  async function frazione(x) {
    const { svg, parti } = figuraFrazione(x.b, x.forma);
    scena.replaceChildren(el("div", { class: "fr-scena" }, svg));
    const scritta = x.a + "/" + x.b;
    if (x.modo === "colora") {
      testo.replaceChildren(el("p", {}, el("span", { text: "Colora " + scritta + ": " + nomeFrazione(x.a, x.b) + ". Tocca le parti." })));
      parti.forEach(p => {
        const cambia = () => { if (!p.classList.contains("ferma")) p.classList.toggle("colorata"); };
        p.setAttribute("tabindex", "0");
        p.setAttribute("role", "button");
        p.setAttribute("aria-label", "una parte");
        p.addEventListener("click", cambia);
        p.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cambia(); } });
      });
      await controlla("Colora " + nomeFrazione(x.a, x.b) + ", poi tocca Fatto.", () => parti.filter(p => p.classList.contains("colorata")).length, x.a,
        n => "Hai colorato " + n + (n === 1 ? " parte" : " parti") + " su " + x.b + ". Ne servono " + x.a + ".");
      parti.forEach(p => p.classList.add("ferma"));
    } else {
      testo.replaceChildren(el("p", {}, el("span", { text: "La figura è divisa in parti uguali. Quante sono? Quante sono colorate?" })));
      parti.slice(0, x.a).forEach(p => p.classList.add("colorata"));
      const altre = [(x.b - x.a) + "/" + x.b, x.b + "/" + x.a, x.a + "/" + (x.b - x.a), x.a + "/" + (x.b + 1)]
        .filter(f => f !== scritta && !f.startsWith("0/") && !f.endsWith("/0"));
      const opzioni = mescola([scritta].concat([...new Set(altre)].slice(0, ctx.opz.risposte - 1)));
      await chiedi("Quale frazione è colorata?", opzioni, scritta);
    }
    await avanti([uguale(scritta + " = " + nomeFrazione(x.a, x.b)),
      el("p", { class: "mat-consiglio", text: "💡 Sotto la linea c'è " + x.b + ", il denominatore: in quante parti uguali è diviso l'intero. " +
        "Sopra c'è " + x.a + ", il numeratore: quante parti si prendono." })]);
  }

  /* ---------- geometria: linee, angoli, simmetria, perimetro, con disegni nostri ---------- */
  // Le figure si disegnano anche girate (giro, in gradi): una retta è retta anche in obliquo,
  // un angolo retto è retto anche se non ha un lato orizzontale.
  const NERO = "#1D2329";
  const tratto = (attr, extra) => svgEl(attr.d ? "path" : "line", Object.assign({ stroke: NERO, "stroke-width": 6, "stroke-linecap": "round",
    "stroke-linejoin": "round", fill: "none" }, attr, extra || {}));
  const pallino = (x, y) => svgEl("circle", { cx: x, cy: y, r: 9, fill: "#E0332B" });
  function figura(viewBox, giro, cx, cy) {
    const svg = svgEl("svg", { viewBox, class: "geo-figura" });
    const g = svgEl("g", { transform: "rotate(" + (giro || 0) + " " + cx + " " + cy + ")" });
    svg.append(g);
    scena.replaceChildren(el("div", { class: "geo-scena" }, svg));
    return g;
  }
  // segmento, semiretta, retta: i puntini dicono che la linea continua
  function rettaSvg(g, x1, y1, x2, y2, tipo) {
    const p = t => [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
    const pezzo = (a, b, puntini) => {
      const [ax, ay] = p(a), [bx, by] = p(b);
      g.append(tratto({ x1: ax, y1: ay, x2: bx, y2: by }, puntini ? { "stroke-dasharray": "1 14" } : {}));
    };
    if (tipo === "segmento") pezzo(0.12, 0.88);
    else {
      pezzo(0.15, 0.85);
      pezzo(0.85, 1, true);
      if (tipo === "retta") pezzo(0, 0.15, true);
    }
    if (tipo === "segmento") g.append(pallino(...p(0.12)), pallino(...p(0.88)));
    if (tipo === "semiretta") g.append(pallino(...p(0.15)));
  }
  const DISEGNI_LINEE = {
    segmento: g => rettaSvg(g, 40, 150, 560, 150, "segmento"),
    semiretta: g => rettaSvg(g, 40, 150, 560, 150, "semiretta"),
    retta: g => rettaSvg(g, 40, 150, 560, 150, "retta"),
    curva: g => g.append(tratto({ d: "M60,190 C160,30 250,40 300,150 S450,270 540,110" })),
    spezzata: g => g.append(tratto({ d: "M60,200 L170,90 L270,210 L380,80 L540,170" })),
    mista: g => g.append(tratto({ d: "M60,200 L170,90 L270,210 C320,40 470,40 540,170" })),
    parallele: g => { rettaSvg(g, 40, 100, 560, 100, "retta"); rettaSvg(g, 40, 200, 560, 200, "retta"); },
    incidenti: g => { rettaSvg(g, 60, 240, 540, 60, "retta"); rettaSvg(g, 60, 80, 540, 220, "retta"); },
    perpendicolari: g => {
      rettaSvg(g, 40, 150, 560, 150, "retta");
      rettaSvg(g, 300, 0, 300, 300, "retta");
      g.append(svgEl("path", { d: "M300,122 L328,122 L328,150", stroke: "#E0332B", "stroke-width": 4, fill: "none" }));
    }
  };
  const SPIEGA_LINEE = {
    segmento: "Il segmento ha un inizio e una fine: si può misurare.",
    semiretta: "La semiretta ha un inizio, l'origine, ma non ha fine: continua da una parte sola.",
    retta: "La retta non ha né inizio né fine: continua sempre, da tutte e due le parti.",
    curva: "La linea curva non ha pezzi dritti: gira sempre.",
    spezzata: "La linea spezzata è fatta di segmenti dritti, uno dopo l'altro.",
    mista: "La linea mista ha pezzi dritti e pezzi curvi.",
    parallele: "Le rette parallele non si incontrano mai: restano sempre alla stessa distanza, come i binari del treno.",
    incidenti: "Le rette incidenti si incontrano in un punto.",
    perpendicolari: "Le rette perpendicolari si incontrano formando quattro angoli retti."
  };
  const FAMIGLIE = [["segmento", "semiretta", "retta"], ["curva", "spezzata", "mista"], ["parallele", "incidenti", "perpendicolari"]];

  async function linee(x) {
    const g = figura("0 0 600 300", x.giro, 300, 150);
    DISEGNI_LINEE[x.cosa](g);
    testo.replaceChildren(el("p", {}, el("span", { text: "Guarda bene la linea: che cos'è?" })));
    const famiglia = FAMIGLIE.find(f => f.includes(x.cosa));
    await chiedi("Che cos'è?", mescola(famiglia.map(k => LINEE[k])), LINEE[x.cosa]);
    await avanti([uguale(LINEE[x.cosa].replace(/^./, c => c.toUpperCase())), el("p", { class: "mat-consiglio", text: "💡 " + SPIEGA_LINEE[x.cosa] })]);
  }

  // l'angolo: il vertice, un lato fisso e l'altro aperto di x.a gradi
  const tipoAngolo = a => (a < 90 ? "acuto" : a === 90 ? "retto" : a < 180 ? "ottuso" : "piatto");
  async function angolo(x) {
    const V = [300, 230], L = 230, r = 62;
    const rad = x.a * Math.PI / 180;
    const fine = [V[0] + L * Math.cos(rad), V[1] - L * Math.sin(rad)];
    const g = figura("0 0 600 330", x.giro, V[0], V[1]);
    const arco = x.a === 90
      ? svgEl("path", { d: "M" + (V[0] + 40) + "," + V[1] + " L" + (V[0] + 40) + "," + (V[1] - 40) + " L" + V[0] + "," + (V[1] - 40), stroke: "#E0332B", "stroke-width": 4, fill: "#FFD23F" })
      : svgEl("path", { d: "M" + V[0] + "," + V[1] + " L" + (V[0] + r) + "," + V[1] + " A" + r + "," + r + " 0 0 0 " +
        (V[0] + r * Math.cos(rad)).toFixed(1) + "," + (V[1] - r * Math.sin(rad)).toFixed(1) + " Z", fill: "#FFD23F", stroke: "#E0332B", "stroke-width": 3 });
    // l'angolo campione: un foglio piegato due volte, appoggiato sul vertice
    const campione = svgEl("rect", { x: V[0], y: V[1] - 110, width: 110, height: 110, fill: "#2F6FD6", "fill-opacity": 0.28, stroke: "#2F6FD6", "stroke-width": 3, class: "geo-campione" });
    g.append(arco, tratto({ x1: V[0], y1: V[1], x2: V[0] + L, y2: V[1] }), tratto({ x1: V[0], y1: V[1], x2: fine[0].toFixed(1), y2: fine[1].toFixed(1) }), pallino(...V));
    testo.replaceChildren(el("p", {}, el("span", { text: "Guarda l'apertura tra i due lati: che angolo è?" })));
    const tipo = tipoAngolo(x.a);
    await chiedi("Che angolo è?", ["acuto", "retto", "ottuso", "piatto"], tipo);
    g.append(campione);
    const confronto = { acuto: "È più chiuso dell'angolo retto.", retto: "È proprio come l'angolo campione.", ottuso: "È più aperto dell'angolo retto.",
      piatto: "I due lati sono uno il proseguimento dell'altro: è come due angoli retti." }[tipo];
    await avanti([uguale("Angolo " + tipo), el("p", { class: "mat-consiglio", text: "💡 In blu c'è l'angolo campione, l'angolo retto: un foglio piegato due volte. " + confronto })]);
  }

  // la simmetria: a sinistra dell'asse la figura, a destra si colora la parte simmetrica
  async function simmetria(x) {
    const piene = new Set(x.celle.map(c => c[0] + "," + (7 - c[1])));
    const celle = [];
    const griglia = el("div", { class: "sim-griglia" });
    for (let rr = 0; rr < 6; rr++) {
      for (let c = 0; c < 8; c++) {
        const sinistra = c < 4;
        const b = el("button", { type: "button", class: "sim-cella" + (sinistra && x.celle.some(q => q[0] === rr && q[1] === c) ? " piena" : ""),
          "aria-label": "riga " + (rr + 1) + ", colonna " + (c + 1), "data-cella": rr + "," + c });
        if (sinistra) b.disabled = true;
        else { b.addEventListener("click", () => { if (!b.classList.contains("ferma")) b.classList.toggle("piena"); }); celle.push(b); }
        griglia.append(b);
      }
    }
    scena.replaceChildren(el("div", { class: "sim-scena" }, griglia));
    testo.replaceChildren(el("p", {}, el("span", { text: "La linea rossa è l'asse di simmetria. Colora a destra la parte simmetrica." })));
    const giuste = () => celle.filter(b => b.classList.contains("piena") === piene.has(b.dataset.cella)).length === celle.length;
    await controlla("Conta i quadretti dall'asse e colora alla stessa distanza dall'altra parte. Poi tocca Fatto.", () => (giuste() ? 1 : 0), 1, () => {
      const messe = celle.filter(b => b.classList.contains("piena"));
      const bene = messe.filter(b => piene.has(b.dataset.cella)).length;
      return "Al posto giusto ce ne sono " + bene + " su " + piene.size + (messe.length > bene ? ", e " + (messe.length - bene) + " sono fuori posto" : "") + ". Guarda la distanza dall'asse.";
    });
    celle.forEach(b => b.classList.add("ferma"));
    await avanti([uguale("Le due parti sono uguali, come allo specchio.")]);
  }

  // il perimetro: un rettangolo sul quaderno a quadretti
  async function perimetro(x) {
    const u = 40, W = (x.a + 2) * u, H = (x.b + 2) * u;
    const svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, class: "geo-figura geo-quadretti" });
    for (let i = 0; i <= x.a + 2; i++) svg.append(svgEl("line", { x1: i * u, x2: i * u, y1: 0, y2: H, stroke: "#B9D3F0", "stroke-width": 1.5 }));
    for (let j = 0; j <= x.b + 2; j++) svg.append(svgEl("line", { y1: j * u, y2: j * u, x1: 0, x2: W, stroke: "#B9D3F0", "stroke-width": 1.5 }));
    svg.append(svgEl("rect", { x: u, y: u, width: x.a * u, height: x.b * u, fill: "#FFF1A8", stroke: "#E0332B", "stroke-width": 6, "stroke-linejoin": "round" }));
    // i numeri del giro, lato per lato: base, altezza, base, altezza
    const numeri = [];
    const scrivi = (cx, cy) => {
      const t = svgEl("text", { x: cx, y: cy, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": 17, "font-weight": 800, fill: "#1E6B52", class: "geo-conta" });
      t.textContent = String(numeri.length + 1);
      numeri.push(t);
      svg.append(t);
    };
    for (let i = 0; i < x.a; i++) scrivi(u + i * u + u / 2, u - 14);
    for (let j = 0; j < x.b; j++) scrivi(u + x.a * u + 16, u + j * u + u / 2);
    for (let i = x.a - 1; i >= 0; i--) scrivi(u + i * u + u / 2, u + x.b * u + 16);
    for (let j = x.b - 1; j >= 0; j--) scrivi(u - 16, u + j * u + u / 2);
    scena.replaceChildren(el("div", { class: "geo-scena" }, svg));
    const contaGiro = async () => {
      numeri.forEach(t => t.classList.remove("vista"));
      for (const t of numeri) { if (fermo) return; t.classList.add("vista"); await aspetta(160); }
    };
    strumenti.replaceChildren(tasto("👣 Contiamo insieme il giro", contaGiro));
    testo.replaceChildren(el("p", {}, el("span", { text: "Il perimetro è la lunghezza del contorno. Quanti lati di quadretto misura?" })));
    const P = 2 * (x.a + x.b);
    const scelte = [P];
    [x.a * x.b, x.a + x.b, P + 2, P - 2, P + 4].forEach(v => { if (v > 0 && !scelte.includes(v) && scelte.length < ctx.opz.risposte) scelte.push(v); });
    await chiedi("Quanto misura il perimetro?", mescola(scelte.map(String)), String(P));
    await contaGiro();
    await avanti([uguale(x.a + " + " + x.b + " + " + x.a + " + " + x.b + " = " + P),
      el("p", { class: "mat-consiglio", text: "💡 Il perimetro è il giro intorno. I quadretti dentro sono un'altra cosa: sono la superficie." })]);
  }

  const GENERI = { conta, confronta, "prima-dopo": primaDopo, decine: decineUnita, operazione, colonna, proprieta, problema, retta, blocchi, frazione,
    linee, angolo, simmetria, perimetro };

  (async () => {
    for (n = 0; n < scelti.length; n++) {
      if (fermo) return;
      punti.children[n].classList.add("ora");
      scatola.classList.remove("coperta");
      scatola.querySelectorAll(".mat-mostra").forEach(b => b.remove());
      strumenti.replaceChildren();
      pannello.replaceChildren();
      azzeraConta();
      await GENERI[scelti[n].genere](scelti[n]);
      punti.children[n].classList.add("fatto");
    }
    if (!fermo) ctx.fine({ giuste, totale });
  })();

  return () => { fermo = true; };
}
