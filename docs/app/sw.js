// Fa funzionare l'app anche senza connessione.
// I file dell'app si chiedono prima alla rete (così si vede sempre l'ultima versione)
// e solo se la rete non risponde in tempo si prendono dalla copia salvata.

const VERSIONE = "app-23";
const PITTOGRAMMI = "pittogrammi";
const MAX_PITTOGRAMMI = 400;
const ATTESA_RETE = 3500;

const FILE = [
  "./", "index.html", "stile.css", "manifest.webmanifest",
  "js/animazioni.js", "js/avvio.js", "js/catalogo.js", "js/config.js", "js/dati.js", "js/editor.js", "js/impostazioni.js", "js/insegnanti.js", "js/linea.js",
  "js/modello.js", "js/pagine.js", "js/picto.js", "js/scena.js", "js/suoni.js", "js/trascina.js", "js/ui.js", "js/voce.js",
  "js/giochi/abbina.js", "js/giochi/brano.js", "js/giochi/completa.js", "js/giochi/lettura.js", "js/giochi/matematica.js", "js/giochi/memory.js", "js/giochi/raggruppa.js", "js/giochi/scelta.js", "js/giochi/sequenza.js",
  "esempi/esempi.json", "font/corsivo-scuola.woff2", "font/andika-400.woff2", "font/andika-700.woff2",
  "foto/alfabeto-fenicio.jpg", "foto/amigdala.jpg", "foto/anfora-greca.jpg", "foto/argo.jpg", "foto/ascia-di-bronzo.jpg", "foto/augusto.jpg", "foto/bedford-peter-pan.jpg", "foto/birket-foster-girotondo.jpg", "foto/bruegel-caduta-icaro.jpg", "foto/codice-hammurabi.jpg", "foto/colosseo.jpg", "foto/crane-gigante.jpg", "foto/denslow-casa-ciclone.jpg", "foto/dore-cicala-formica.jpg", "foto/dore-lupo-agnello.jpg", "foto/elmo-corinzio.jpg", "foto/ettore-astianatte.jpg", "foto/fenrir.jpg", "foto/grimm-pappa-dolce.jpg", "foto/kalila-leone-lepre.jpg", "foto/leighton-persefone.jpg", "foto/mazzanti-pinocchio.jpg", "foto/moneta-romana.jpg", "foto/mosaico-romano.jpg", "foto/musicanti-brema.jpg", "foto/novembre-tres-riches-heures.jpg", "foto/partenone.jpg", "foto/pedersen-anatroccolo.jpg", "foto/piramidi.jpg", "foto/pittura-rupestre.jpg", "foto/polifemo.jpg", "foto/poussin-mida.jpg", "foto/rackham-lepre-tartaruga.jpg", "foto/rackham-volpe-uva.jpg", "foto/rembrandt-filemone.jpg", "foto/stele-egizia.jpg", "foto/tavoletta-cuneiforme.jpg", "foto/thor-sposa.jpg", "foto/tiepolo-cavallo.jpg", "foto/ubbelohde-folletti.jpg", "foto/velazquez-filatrici.jpg", "foto/waterhouse-sirene.jpg",
  "video/terra-che-gira.webm",
  "icone/icona.svg", "icone/icona-192.png", "icone/icona-512.png", "icone/icona-maskable-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSIONE)
    .then(c => c.addAll(FILE.map(f => new Request(f, { cache: "reload" }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(nomi => Promise.all(nomi.filter(n => n !== VERSIONE && n !== PITTOGRAMMI).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

function primaLaRete(richiesta) {
  return new Promise(risolvi => {
    let risposto = false;
    const salvata = () => caches.match(richiesta, { ignoreSearch: true });
    const timer = setTimeout(() => {
      salvata().then(r => { if (r && !risposto) { risposto = true; risolvi(r); } });
    }, ATTESA_RETE);
    // «no-cache»: il browser chiede sempre al server se il file è cambiato, senza fidarsi della sua copia
    fetch(richiesta.url, { cache: "no-cache" }).then(r => {
      if (r.ok) {
        const copia = r.clone();
        caches.open(VERSIONE).then(c => c.put(richiesta, copia));
      }
      if (!risposto) { risposto = true; clearTimeout(timer); risolvi(r); }
    }).catch(() => {
      clearTimeout(timer);
      salvata().then(r => {
        if (!risposto) { risposto = true; risolvi(r || Response.error()); }
      });
    });
  });
}

async function pittogramma(richiesta) {
  const cache = await caches.open(PITTOGRAMMI);
  const salvato = await cache.match(richiesta);
  if (salvato) return salvato;
  const r = await fetch(richiesta);
  if (r.ok) {
    await cache.put(richiesta, r.clone());
    const chiavi = await cache.keys();
    if (chiavi.length > MAX_PITTOGRAMMI) await Promise.all(chiavi.slice(0, chiavi.length - MAX_PITTOGRAMMI).map(k => cache.delete(k)));
  }
  return r;
}

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin === location.origin) e.respondWith(primaLaRete(e.request));
  else if (url.hostname === "static.arasaac.org") e.respondWith(pittogramma(e.request));
});
