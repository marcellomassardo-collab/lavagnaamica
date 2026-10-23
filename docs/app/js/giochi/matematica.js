// Matematica con gli oggetti: prima si vede (e si fa), poi si scrive con i numeri.
// Nei problemi l'operazione nasce da ciò che succede nella storia, non dalle parole del testo.

import { el, mescola, pulsanteVoce } from "../ui.js";
import { OPERAZIONI, SCHEMI, risultato } from "../modello.js";
import { oggetto, oggetti, file10, compari, sposta, spostaInsieme, aspetta, contaToccando, gruppo, decine, barretta, cubetto, centinaio, linea } from "../scena.js";

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

  const GENERI = { conta, confronta, "prima-dopo": primaDopo, decine: decineUnita, operazione, colonna, problema };

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
