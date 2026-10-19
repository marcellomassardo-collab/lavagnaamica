// Trascinamento con dito, penna o mouse, e in alternativa «tocca e tocca»:
// tocchi una carta per sceglierla, poi tocchi il posto dove va.
// Le carte mobili hanno data-mobile, i posti dove lasciarle hanno data-bersaglio.

export function creaTavolo(radice, { scegli, lascia }) {
  let scelta = null;
  let presa = null;

  function seleziona(carta) {
    if (scelta) scelta.classList.remove("scelta");
    scelta = carta;
    if (carta) {
      carta.classList.add("scelta");
      scegli(carta);
    }
  }

  function bersaglioIn(x, y) {
    const n = document.elementFromPoint(x, y);
    const b = n && n.closest("[data-bersaglio]");
    return b && radice.contains(b) ? b : null;
  }

  radice.addEventListener("pointerdown", e => {
    const carta = e.target.closest("[data-mobile]");
    if (!carta || !radice.contains(carta) || e.button > 0 || presa) return;
    e.preventDefault();
    presa = { carta, id: e.pointerId, x0: e.clientX, y0: e.clientY, fantasma: null, sopra: null };
    try { carta.setPointerCapture(e.pointerId); } catch (x) {}
  });

  radice.addEventListener("pointermove", e => {
    if (!presa || e.pointerId !== presa.id) return;
    const dx = e.clientX - presa.x0;
    const dy = e.clientY - presa.y0;
    if (!presa.fantasma) {
      if (Math.hypot(dx, dy) < 10) return;
      const r = presa.carta.getBoundingClientRect();
      const f = presa.carta.cloneNode(true);
      f.classList.add("fantasma");
      f.classList.remove("scelta");
      Object.assign(f.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
      document.body.append(f);
      presa.fantasma = f;
      presa.carta.classList.add("in-viaggio");
      seleziona(null);
    }
    presa.fantasma.style.transform = "translate(" + dx + "px," + dy + "px)";
    const b = bersaglioIn(e.clientX, e.clientY);
    if (b !== presa.sopra) {
      if (presa.sopra) presa.sopra.classList.remove("sopra");
      if (b) b.classList.add("sopra");
      presa.sopra = b;
    }
  });

  function rilascia(e) {
    if (!presa || e.pointerId !== presa.id) return;
    const p = presa;
    presa = null;
    if (!p.fantasma) {
      if (e.type === "pointerup") seleziona(scelta === p.carta ? null : p.carta);
      return;
    }
    if (p.sopra) p.sopra.classList.remove("sopra");
    p.fantasma.remove();
    p.carta.classList.remove("in-viaggio");
    const b = e.type === "pointerup" ? bersaglioIn(e.clientX, e.clientY) : null;
    if (b) lascia(p.carta, b);
  }
  radice.addEventListener("pointerup", rilascia);
  radice.addEventListener("pointercancel", rilascia);
  radice.addEventListener("dragstart", e => e.preventDefault());

  radice.addEventListener("click", e => {
    if (!scelta) return;
    const b = e.target.closest("[data-bersaglio]");
    if (b && radice.contains(b)) {
      const c = scelta;
      seleziona(null);
      lascia(c, b);
    }
  });
}
