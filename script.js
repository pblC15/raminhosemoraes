/* =========================================================
   ✏️ CONFIGURAÇÃO
   WhatsApp: indicativo do país + número, sem "+" nem espaços.
   INSTAGRAM: só o nome de utilizador, sem @ (ex.: "raminhosemoraes").
              Enquanto estiver vazio, os botões de Instagram ficam escondidos.
   ========================================================= */
const WHATSAPP = {
  1: "351938213616",
  2: "351935789111",
};
const INSTAGRAM = "";
const MENSAGEM_PADRAO = "Olá Raminhos & Moraes! Gostaria de pedir um orçamento de limpeza.";

/* --------- Não é preciso mexer abaixo desta linha --------- */
const waLink = (texto, linha = 1) =>
  `https://wa.me/${WHATSAPP[linha] || WHATSAPP[1]}?text=${encodeURIComponent(texto)}`;

// WhatsApp
document.querySelectorAll("[data-wa]").forEach((link) => {
  link.href = waLink(link.dataset.msg || MENSAGEM_PADRAO, link.dataset.wa || 1);
});

// Instagram
document.querySelectorAll("[data-ig]").forEach((link) => {
  if (INSTAGRAM) link.href = `https://www.instagram.com/${INSTAGRAM}/`;
  else link.hidden = true;
});
if (INSTAGRAM) {
  document.querySelectorAll("[data-ig-handle]").forEach((el) => (el.textContent = "@" + INSTAGRAM));
}

document.getElementById("ano").textContent = new Date().getFullYear();

/* ---------- Orçamento em 30 segundos ---------- */
const preview = document.getElementById("preview");
const sendBtn = document.getElementById("builder-send");
const localInput = document.getElementById("local");

function montarMensagem() {
  const espaco = document.querySelector('input[name="espaco"]:checked').value;
  const servico = document.querySelector('input[name="servico"]:checked').value;
  const local = localInput.value.trim();
  let msg = `Olá Raminhos & Moraes! Gostaria de um orçamento de ${servico} para ${espaco}`;
  msg += local ? ` em ${local}.` : ".";
  return msg;
}
function atualizar() {
  const msg = montarMensagem();
  preview.textContent = msg;
  sendBtn.href = waLink(msg);
}
document.querySelectorAll("#builder input").forEach((el) => el.addEventListener("input", atualizar));
atualizar();

/* ---------- Fotografia para "limpar" com o dedo ---------- */
(function () {
  const wipe = document.getElementById("wipe");
  const canvas = wipe.querySelector(".wipe__grime");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const hint = document.getElementById("wipe-hint");
  const done = document.getElementById("wipe-done");
  const allBtn = document.getElementById("wipe-all");
  const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0, h = 0, dpr = 1, limpo = false, ultimo = null, interagiu = false;

  // Pseudo-aleatório com semente: a sujidade é sempre igual
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  function sujar() {
    const r = wipe.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed = 7;

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(92, 82, 64, 0.78)";
    ctx.fillRect(0, 0, w, h);

    // manchas
    for (let i = 0; i < 46; i++) {
      const x = rnd() * w, y = rnd() * h, rad = 20 + rnd() * 90;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      const tom = rnd() > 0.5 ? "70, 58, 40" : "128, 116, 92";
      g.addColorStop(0, `rgba(${tom}, ${0.35 + rnd() * 0.35})`);
      g.addColorStop(1, `rgba(${tom}, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
    }
    // pó
    for (let i = 0; i < 1600; i++) {
      ctx.fillStyle = `rgba(${rnd() > 0.5 ? "40,34,24" : "170,160,140"}, ${0.25 + rnd() * 0.4})`;
      ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2);
    }
    // escorridos
    for (let i = 0; i < 14; i++) {
      const x = rnd() * w, y = rnd() * h * 0.6, len = 40 + rnd() * 140;
      const g = ctx.createLinearGradient(x, y, x, y + len);
      g.addColorStop(0, "rgba(60,50,34,.45)"); g.addColorStop(1, "rgba(60,50,34,0)");
      ctx.fillStyle = g; ctx.fillRect(x, y, 3 + rnd() * 5, len);
    }
    limpo = false;
    canvas.style.opacity = "";
    done.hidden = true;
  }

  function esfregar(x, y) {
    ctx.globalCompositeOperation = "destination-out";
    const raio = Math.max(26, w * 0.075);
    const pontos = ultimo ? Math.ceil(Math.hypot(x - ultimo.x, y - ultimo.y) / (raio / 3)) : 1;
    for (let i = 1; i <= pontos; i++) {
      const px = ultimo ? ultimo.x + ((x - ultimo.x) * i) / pontos : x;
      const py = ultimo ? ultimo.y + ((y - ultimo.y) * i) / pontos : y;
      const g = ctx.createRadialGradient(px, py, 0, px, py, raio);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(0.6, "rgba(0,0,0,.9)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(px, py, raio, 0, Math.PI * 2); ctx.fill();
    }
    ultimo = { x, y };
  }

  let verificarTimer = null;
  function verificar() {
    if (limpo || verificarTimer) return;
    verificarTimer = setTimeout(() => {
      verificarTimer = null;
      const dados = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let sujo = 0, total = 0;
      for (let i = 3; i < dados.length; i += 4 * 40) { total++; if (dados[i] > 60) sujo++; }
      if (sujo / total < 0.35) acabar();
    }, 250);
  }

  function acabar() {
    if (limpo) return;
    limpo = true;
    canvas.style.opacity = "0";
    hint.hidden = true;
    allBtn.hidden = true;
    done.hidden = false;
    wipe.classList.add("is-clean");
  }

  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  let ativo = false;
  canvas.addEventListener("pointerdown", (e) => {
    ativo = true; interagiu = true; ultimo = null; hint.hidden = true;
    canvas.setPointerCapture(e.pointerId);
    const p = pos(e); esfregar(p.x, p.y);
  });
  canvas.addEventListener("pointermove", (e) => {
    // No computador também limpa só de passar o rato
    if (!ativo && e.pointerType !== "mouse") return;
    if (e.pointerType === "mouse") { interagiu = true; hint.hidden = true; }
    const p = pos(e); esfregar(p.x, p.y); verificar();
  });
  const parar = () => { ativo = false; ultimo = null; verificar(); };
  canvas.addEventListener("pointerup", parar);
  canvas.addEventListener("pointercancel", parar);
  canvas.addEventListener("pointerleave", () => { ultimo = null; });

  allBtn.addEventListener("click", acabar);

  // Uma passagem automática, como um rodo, para mostrar que se pode limpar
  function demonstracao() {
    if (reduz) return;
    const dur = 1400; let t0;
    function passo(t) {
      if (interagiu || limpo) return;
      t0 ??= t;
      const p = Math.min((t - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      esfregar(w * (0.08 + 0.84 * e), h * (0.36 + 0.1 * Math.sin(e * Math.PI)));
      if (p < 1) requestAnimationFrame(passo); else ultimo = null;
    }
    requestAnimationFrame(passo);
  }

  sujar();
  let largura = window.innerWidth;
  window.addEventListener("resize", () => {
    if (limpo || window.innerWidth === largura) return;
    largura = window.innerWidth; sujar();
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((en) => en.isIntersecting)) { io.disconnect(); setTimeout(demonstracao, 700); }
    }, { threshold: 0.5 });
    io.observe(wipe);
  }
})();
