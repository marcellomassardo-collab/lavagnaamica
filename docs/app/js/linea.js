// La linea del tempo, sempre visibile in basso negli esercizi di storia.
// La preistoria è schiacciata a sinistra (durerebbe milioni di anni); dalla scrittura in poi la scala è vera,
// così si vede che gli anni avanti Cristo sono tanti più di quelli fino alla fine dell'Impero romano.

import { el, immaginePicto } from "./ui.js";

const PREISTORIA = 22;          // percentuale di riga data alla preistoria
const INIZIO = -3500, FINE = 500;

// Posizione (in %) di un anno: negativo = avanti Cristo.
export function posizione(anno) {
  if (anno <= INIZIO) return Math.max(0, PREISTORIA - PREISTORIA * Math.log10(anno / INIZIO) / 3);
  return PREISTORIA + (Math.min(anno, FINE) - INIZIO) / (FINE - INIZIO) * (100 - PREISTORIA);
}

const TAPPE = [
  { x: 3, t: "Paleolitico", p: 34991 },
  { x: 10.5, t: "Neolitico", p: 38079 },
  { x: 18, t: "Età dei metalli", f: "ascia-di-bronzo.jpg" },
  { anno: -3200, circa: true, t: "La scrittura", f: "tavoletta-cuneiforme.jpg" },
  { anno: -2560, circa: true, t: "La grande piramide", f: "piramidi.jpg" },
  { anno: -1754, circa: true, t: "Le leggi di Hammurabi", f: "codice-hammurabi.jpg" },
  { anno: -1050, circa: true, t: "L'alfabeto fenicio", f: "alfabeto-fenicio.jpg" },
  { anno: -753, t: "Nasce Roma (tradizione)" },
  { anno: -432, t: "Il Partenone", f: "partenone.jpg" },
  { anno: 80, t: "Il Colosseo", f: "colosseo.jpg" },
  { anno: 476, t: "Fine dell'Impero romano", f: "moneta-romana.jpg" }
];

const scritta = a => (a < 0 ? -a + " a.C." : a + " d.C.");

function figura(tappa) {
  if (tappa.f) return el("img", { src: "foto/" + tappa.f, alt: "", draggable: "false", decoding: "async" });
  if (tappa.p) return immaginePicto(tappa.p, "");
  return null;
}

// epoca: [da, a] in anni (negativi = a.C.): il periodo dell'esercizio, evidenziato sulla riga.
export function lineaDelTempo(epoca) {
  const cristo = posizione(0);
  const da = Array.isArray(epoca) && epoca.length === 2 ? posizione(epoca[0]) : null;
  const a = da === null ? null : posizione(epoca[1]);
  const tacche = [-3000, -2000, -1000]
    .filter(anno => da === null || posizione(anno) < da - 2 || posizione(anno) > da + 10)
    .map(anno => el("span", { class: "lt-tacca", style: "left:" + posizione(anno) + "%", text: scritta(anno) }));
  const linea = el("div", { class: "linea-tempo", role: "img", "aria-label": "Linea del tempo, dalla preistoria alla fine dell'Impero romano" },
    el("div", { class: "lt-dentro" },
      el("div", { class: "lt-tappe" }, TAPPE.map((tp, k) => {
        const x = tp.x !== undefined ? tp.x : posizione(tp.anno);
        return el("div", { class: "lt-tappa" + (k % 2 ? " alta" : "") + (x > 90 ? " a-destra" : "") + (tp.f || tp.p ? "" : " senza-figura"),
          style: "left:" + x + "%" },
          figura(tp),
          el("span", { class: "lt-nome", text: tp.t }),
          tp.anno !== undefined ? el("span", { class: "lt-anno", text: (tp.circa ? "circa " : "") + scritta(tp.anno) }) : null);
      })),
      el("div", { class: "lt-riga" },
        el("div", { class: "lt-preistoria", style: "width:" + PREISTORIA + "%" }, el("span", { text: "Preistoria" })),
        el("div", { class: "lt-ac", style: "left:" + PREISTORIA + "%;width:" + (cristo - PREISTORIA) + "%" },
          el("span", { text: "◀ a.C. = avanti Cristo: gli anni si contano all'indietro" })),
        el("div", { class: "lt-dc", style: "left:" + cristo + "%;right:0" }, el("span", { text: "d.C. ▶" })),
        el("div", { class: "lt-cristo", style: "left:" + cristo + "%" }),
        da === null ? null : el("div", { class: "lt-fascia", style: "left:" + da + "%;width:" + Math.max(a - da, 1.5) + "%" })),
      el("div", { class: "lt-sotto" },
        tacche,
        el("span", { class: "lt-cristo-nome", style: "left:" + cristo + "%", text: "Nascita di Cristo" }),
        da === null ? null : el("span", { class: "lt-qui", style: "left:" + da + "%", text: "▲ Siamo qui" }))));
  // sugli schermi stretti la linea scorre: si parte mostrando il periodo dell'esercizio
  if (da !== null) requestAnimationFrame(() => {
    const dentro = linea.firstChild;
    linea.scrollLeft = Math.max(0, dentro.offsetWidth * (da + a) / 200 - linea.clientWidth / 2);
  });
  return linea;
}
