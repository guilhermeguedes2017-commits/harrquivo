/* Harrquivo — arquivo de mesa do Mundo de Harr (PWA offline) */
"use strict";

const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const sg = n => (n >= 0 ? "+" : "") + n;
const modAttr = v => Math.floor((v - 10) / 2);
const ATR = ["FOR", "DES", "CON", "INT", "SAB", "CAR"];

/* ---------- armazenamento local ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem("hq:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("hq:" + k, JSON.stringify(v)); } catch {} }
};

/* ---------- estado ---------- */
const S = {
  cat: null, harr: null, monstros: [], itens: [], porId: new Map(),
  favs: new Set(store.get("favs", [])),
  filtro: store.get("filtro", { q: "", raca: "", fonte: "", cr: "", hab: "", ord: "nome" }),
  loja: store.get("loja", { aba: "Armas", q: "", ajuste: 0 }),
  cesta: store.get("cesta", []),
  comb: store.get("comb", { rodada: 1, vez: 0, lista: [] }),
  imgsCache: new Set(),
};

/* ---------- ícones por tipo de criatura ---------- */
const ICONE = {
  "Aberração": '<circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1.2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
  "Besta": '<path d="M7 9c-2 0-3-2-3-4 2 0 3 1 4 2M17 9c2 0 3-2 3-4-2 0-3 1-4 2M6 11c0 5 3 9 6 9s6-4 6-9-3-4-6-4-6-1-6 4z"/><circle cx="9.5" cy="12" r=".9"/><circle cx="14.5" cy="12" r=".9"/><path d="M11 16h2"/>',
  "Celestial": '<path d="M12 3l2 5 5 .5-4 3.5 1.2 5L12 14.5 7.8 17l1.2-5-4-3.5 5-.5z"/><path d="M5 21c2-2 12-2 14 0"/>',
  "Constructo": '<rect x="6" y="5" width="12" height="14" rx="2"/><path d="M9 10h.01M15 10h.01M9 15h6M12 2v3M4 12h2M18 12h2"/>',
  "Dragão": '<path d="M4 18c3-1 5-4 5-8 3 2 4 5 4 8M13 18c2-3 6-4 7-9-3 1-5 1-7 3M9 10L7 5l4 3"/><circle cx="16" cy="12" r=".8"/>',
  "Elemental": '<path d="M12 3c2 4 6 6 6 11a6 6 0 01-12 0c0-3 2-4 2-7 1 2 2 3 3 3 0-3 0-5 1-7z"/>',
  "Fada": '<path d="M12 12c-3-6-8-6-8-2s5 4 8 2zM12 12c3-6 8-6 8-2s-5 4-8 2zM12 12c-2 4-6 6-6 8 3 0 5-3 6-8zM12 12c2 4 6 6 6 8-3 0-5-3-6-8z"/>',
  "Gigante": '<path d="M9 21v-5H7l1-7h8l1 7h-2v5M10 9V6a2 2 0 014 0v3"/>',
  "Gosma": '<path d="M4 18c0-6 3-11 8-11s8 5 8 11c-2 1-3-1-4 0s-1 2-4 2-3-1-4-2-2 1-4 0z"/><circle cx="10" cy="13" r=".8"/><circle cx="14" cy="12" r=".8"/>',
  "Humanóide": '<circle cx="12" cy="7" r="3.2"/><path d="M5 21c0-5 3-8 7-8s7 3 7 8"/>',
  "Ínfero": '<path d="M6 4c0 4 2 5 4 6M18 4c0 4-2 5-4 6M7 11c0 5 2 9 5 9s5-4 5-9c0-2-2-3-5-3s-5 1-5 3z"/><path d="M10 14l1 1M14 14l-1 1"/>',
  "Monstruosidade": '<path d="M4 20c1-6 4-10 8-10s7 4 8 10M8 10L6 5M16 10l2-5M12 10V4"/><circle cx="10" cy="14" r=".8"/><circle cx="14" cy="14" r=".8"/>',
  "Morto-vivo": '<path d="M12 3a7 7 0 00-7 7c0 3 2 4 2 6v3h10v-3c0-2 2-3 2-6a7 7 0 00-7-7z"/><circle cx="9.5" cy="11" r="1.5"/><circle cx="14.5" cy="11" r="1.5"/><path d="M10 19v-2M12 19v-2M14 19v-2"/>',
  "Planta": '<path d="M12 21V9M12 13c-4 0-6-3-6-7 4 0 6 3 6 7zM12 10c0-4 2-7 7-7 0 4-3 7-7 7z"/>',
  "_": '<path d="M12 3l8 4v6c0 4-3 7-8 8-5-1-8-4-8-8V7z"/>',
};
const icone = r => `<svg viewBox="0 0 24 24">${ICONE[r] || ICONE._}</svg>`;
const ICO = {
  estrela: '<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
  espadas: '<svg viewBox="0 0 24 24"><path d="M5 19l9-9M14 5l5 5-3 1-3-3 1-3zM4 15l5 5M3 21l3-3"/></svg>',
  baixar: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  cesta: '<svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7L6 8zM9 8a3 3 0 016 0"/></svg>',
  livro: '<svg viewBox="0 0 24 24"><path d="M5 4h10a3 3 0 013 3v13H8a3 3 0 01-3-3zM5 17a3 3 0 013-3h10"/></svg>',
  cadeado: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
  engrenagem: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>',
};

/* ---------- carregamento ---------- */
async function carregar() {
  const r = await fetch("data/catalogo.json");
  S.cat = await r.json();
  S.itens = [...S.cat.itens, ...S.cat.magicos];
  await abrirHarr(store.get("senha", null), true);
  montarMonstros();
  try {
    const c = await caches.open("harrquivo-img");
    (await c.keys()).forEach(k => S.imgsCache.add(new URL(k.url).pathname.split("/").pop()));
  } catch {}
}
function montarMonstros() {
  S.monstros = [...(S.harr?.monstros || []), ...S.cat.monstros];
  S.porId = new Map([...S.monstros, ...S.itens].map(x => [x.id, x]));
}

/* conteúdo privado do Mundo de Harr (criptografado no site) */
async function chave(senha, sal) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(senha), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: sal, iterations: 200000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
}
const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function abrirHarr(senha, silencioso) {
  if (!senha) return false;
  try {
    const r = await fetch("data/harr.enc.json");
    if (!r.ok) return false;
    const e = await r.json();
    const k = await chave(senha, b64(e.sal));
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(e.iv) }, k, b64(e.dados));
    S.harr = JSON.parse(new TextDecoder().decode(pt));
    store.set("senha", senha);
    return true;
  } catch (err) {
    if (!silencioso) console.warn(err);
    return false;
  }
}

/* ---------- imagens (cache separado, sobrevive a atualizações) ---------- */
const imgArquivo = m => m.img ? m.img.split("/").pop() : null;
function imgHTML(m, cls = "") {
  if (m.img && (navigator.onLine || S.imgsCache.has(imgArquivo(m))))
    return `<img src="${esc(m.img)}" alt="" loading="lazy" ${cls} onerror="this.replaceWith(Object.assign(document.createElement('span'),{innerHTML:'${icone(m.raca).replace(/"/g, "&quot;")}'}))">`;
  return icone(m.raca);
}
async function baixarImagens(lista, aoProgredir) {
  const c = await caches.open("harrquivo-img");
  let feitos = 0;
  for (const m of lista) {
    if (!m.img) continue;
    try {
      if (!(await c.match(m.img))) { const r = await fetch(m.img); if (r.ok) await c.put(m.img, r); }
      S.imgsCache.add(imgArquivo(m));
    } catch {}
    aoProgredir?.(++feitos);
  }
}

/* ---------- roteamento ---------- */
const rotas = { inicio: telaInicio, bestiario: telaBestiario, combate: telaCombate, loja: telaLoja, fichas: telaFichas, ajustes: telaAjustes };
let historico = [];
function ir(hash) { location.hash = hash; }
function rotear() {
  if (!$("#aviso").hidden && $("#aviso button")) $("#aviso").hidden = true;
  const h = location.hash.slice(1) || "inicio";
  const [base, ...resto] = h.split("-");
  const id = resto.join("-");
  const app = $("#app");
  $("#btnVoltar").hidden = true;
  let aba = base;
  if (base === "m" && S.porId.has(id)) { telaMonstro(S.porId.get(id)); aba = "bestiario"; $("#btnVoltar").hidden = false; }
  else if (base === "i" && S.porId.has(id)) { telaItem(S.porId.get(id)); aba = "loja"; $("#btnVoltar").hidden = false; }
  else if (base === "p" && S.harr) { telaPersonagem(id); aba = "fichas"; $("#btnVoltar").hidden = false; }
  else (rotas[base] || telaInicio)();
  document.querySelectorAll(".abas a").forEach(a => a.classList.toggle("ativa", a.dataset.aba === aba));
  app.focus({ preventScroll: true });
}
function titulo(t) { $("#titulo").textContent = t; document.title = t === "Harrquivo" ? t : t + " · Harrquivo"; }
$("#btnVoltar").onclick = () => history.length > 1 ? history.back() : ir("inicio");

/* ---------- diálogo ---------- */
function dialogo(html, aoMontar) {
  const d = $("#dialogo"), c = $("#caixa");
  c.innerHTML = html; d.hidden = false;
  const fechar = () => { d.hidden = true; c.innerHTML = ""; };
  d.onclick = e => { if (e.target === d) fechar(); };
  c.querySelectorAll("[data-fechar]").forEach(b => b.onclick = fechar);
  aoMontar?.(c, fechar);
  return fechar;
}
function avisar(txt, botao, acao) {
  const a = $("#aviso");
  a.innerHTML = `<span>${txt}</span>` + (botao ? `<button class="btn peq">${botao}</button>` : "");
  a.hidden = false;
  if (botao) a.querySelector("button").onclick = acao;
  else setTimeout(() => (a.hidden = true), 3500);
}

/* ================= INÍCIO ================= */
function telaInicio() {
  titulo("Harrquivo");
  const favs = S.monstros.filter(m => S.favs.has(m.id));
  const nTrad = S.cat.monstros.filter(m => m.traduzido).length;
  const c = S.comb;
  $("#app").innerHTML = `
  <div class="hero">
    <svg class="selo" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0d08a"/><stop offset="1" stop-color="#a57c35"/></linearGradient></defs>
      <circle cx="50" cy="50" r="46" fill="none" stroke="url(#g)" stroke-width="2"/><circle cx="50" cy="50" r="39" fill="none" stroke="url(#g)" stroke-width=".8" stroke-dasharray="2 3"/>
      <path d="M50 18l7 20h20l-16 12 6 20-17-12-17 12 6-20-16-12h20z" fill="none" stroke="url(#g)" stroke-width="2.2" stroke-linejoin="round"/>
      <circle cx="50" cy="50" r="5" fill="url(#g)"/></svg>
    <h2>Harrquivo</h2>
    <p>O arquivo de mesa do Mundo de Harr</p>
  </div>
  <div class="grade-atalhos">
    <a class="atalho" href="#bestiario">${icone("Dragão")}<b>Bestiário</b><small>${S.monstros.length} criaturas</small></a>
    <a class="atalho" href="#combate">${ICO.espadas}<b>Combate</b><small>${c.lista.length ? `Rodada ${c.rodada} · ${c.lista.length} na luta` : "Nenhuma luta"}</small></a>
    <a class="atalho" href="#loja">${ICO.cesta}<b>Loja</b><small>${S.itens.length} itens</small></a>
    <a class="atalho" href="#fichas">${ICO.livro}<b>Fichas</b><small>${S.harr ? (S.harr.personagens?.length || 0) + " personagens" : "Bloqueado"}</small></a>
  </div>
  <div class="titulo-secao">Favoritos</div>
  ${favs.length ? favs.map(linhaMonstro).join("") : `<div class="vazio">Toque na estrela de um monstro pra deixá-lo aqui.</div>`}
  <div class="titulo-secao">Catálogo</div>
  <div class="cartao ajuda">
    Versão ${esc(S.cat.versao)} · ${S.cat.monstros.length} monstros do SRD (${nTrad} já traduzidos) · ${S.cat.itens.length} itens comuns · ${S.cat.magicos.length} itens mágicos.
    <div class="linha-btns" style="margin-top:10px"><a class="btn peq" href="#ajustes">${ICO.engrenagem} Ajustes e downloads</a></div>
  </div>`;
  ligarEstrelas();
}

/* ================= BESTIÁRIO ================= */
function linhaMonstro(m) {
  const fav = S.favs.has(m.id);
  const tags = [m.fonte === "Mundo de Harr" ? '<span class="etiqueta harr">Harr</span>' : "", !m.traduzido && m.fonte !== "Mundo de Harr" ? '<span class="etiqueta pend">EN</span>' : ""].join(" ");
  return `<a class="item" href="#m-${m.id}">
    <span class="mini">${imgHTML(m)}</span>
    <span class="txt"><span class="nome">${esc(m.nome)}</span><span class="sub">${esc(m.raca || "")} · CR ${esc(m.cr_txt ?? "?")} ${tags}</span></span>
    <button class="estrela ${fav ? "on" : ""}" data-fav="${m.id}" aria-label="Favoritar">${ICO.estrela}</button></a>`;
}
function ligarEstrelas() {
  document.querySelectorAll("[data-fav]").forEach(b => b.onclick = e => {
    e.preventDefault(); e.stopPropagation();
    const id = b.dataset.fav;
    S.favs.has(id) ? S.favs.delete(id) : S.favs.add(id);
    store.set("favs", [...S.favs]);
    b.classList.toggle("on", S.favs.has(id));
  });
}
const CR_FAIXAS = { "0-1": [0, 1], "2-4": [2, 4], "5-10": [5, 10], "11-16": [11, 16], "17+": [17, 99] };
function filtrar() {
  const f = S.filtro, q = norm(f.q);
  let l = S.monstros.filter(m =>
    (!q || norm(m.nome).includes(q) || norm(m.nome_en).includes(q)) &&
    (!f.raca || m.raca === f.raca) && (!f.fonte || m.fonte === f.fonte) &&
    (!f.hab || (m.habitat || []).includes(f.hab)) &&
    (!f.cr || (m.cr >= CR_FAIXAS[f.cr][0] && m.cr <= CR_FAIXAS[f.cr][1])) &&
    (f.fonte !== "fav" || S.favs.has(m.id)));
  if (f.fonte === "fav") l = S.monstros.filter(m => S.favs.has(m.id));
  const ord = { nome: (a, b) => a.nome.localeCompare(b.nome, "pt"), cr: (a, b) => (a.cr ?? 0) - (b.cr ?? 0) || a.nome.localeCompare(b.nome, "pt"), crd: (a, b) => (b.cr ?? 0) - (a.cr ?? 0) || a.nome.localeCompare(b.nome, "pt") };
  return l.sort(ord[f.ord] || ord.nome);
}
function telaBestiario() {
  titulo("Bestiário");
  const racas = [...new Set(S.monstros.map(m => m.raca).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt"));
  const habs = [...new Set(S.monstros.flatMap(m => m.habitat || []))].sort((a, b) => a.localeCompare(b, "pt"));
  const f = S.filtro;
  const opt = (v, t, cur) => `<option value="${esc(v)}" ${v === cur ? "selected" : ""}>${esc(t)}</option>`;
  $("#app").innerHTML = `
  <div class="busca">
    <input class="campo" id="q" type="search" placeholder="Buscar monstro (português ou inglês)" value="${esc(f.q)}" autocomplete="off">
    <div class="filtros">
      <select id="fFonte">${opt("", "Todas as fontes", f.fonte)}${opt("Mundo de Harr", "Mundo de Harr", f.fonte)}${opt("SRD 2024", "SRD 2024", f.fonte)}${opt("fav", "★ Favoritos", f.fonte)}</select>
      <select id="fRaca">${opt("", "Todos os tipos", f.raca)}${racas.map(r => opt(r, r, f.raca)).join("")}</select>
      <select id="fCr">${opt("", "Qualquer CR", f.cr)}${Object.keys(CR_FAIXAS).map(k => opt(k, "CR " + k, f.cr)).join("")}</select>
      <select id="fHab">${opt("", "Qualquer habitat", f.hab)}${habs.map(r => opt(r, r, f.hab)).join("")}</select>
      <select id="fOrd">${opt("nome", "Ordem: A–Z", f.ord)}${opt("cr", "Ordem: CR ↑", f.ord)}${opt("crd", "Ordem: CR ↓", f.ord)}</select>
    </div>
  </div>
  <div class="contagem" id="cont"></div>
  <div id="lista"></div>`;
  const desenhar = () => {
    const l = filtrar();
    $("#cont").textContent = `${l.length} criatura${l.length === 1 ? "" : "s"}`;
    $("#lista").innerHTML = l.length ? l.slice(0, 400).map(linhaMonstro).join("") : `<div class="vazio">Nada encontrado.</div>`;
    ligarEstrelas();
    store.set("filtro", S.filtro);
  };
  $("#q").oninput = e => { f.q = e.target.value; desenhar(); };
  [["#fFonte", "fonte"], ["#fRaca", "raca"], ["#fCr", "cr"], ["#fHab", "hab"], ["#fOrd", "ord"]].forEach(([s, k]) => $(s).onchange = e => { f[k] = e.target.value; desenhar(); });
  desenhar();
}

function textoRico(s) {
  // descrição com quebras "\n- " vira lista
  const partes = String(s).split("\n");
  let html = "", lista = [];
  const fluxo = () => { if (lista.length) { html += "<ul>" + lista.map(x => `<li>${esc(x)}</li>`).join("") + "</ul>"; lista = []; } };
  partes.forEach((p, i) => { if (/^- /.test(p)) lista.push(p.slice(2)); else { fluxo(); if (p.trim()) html += (i ? "<br>" : "") + esc(p); } });
  fluxo();
  return html;
}
function mdSimples(md) {
  // markdown do Notion (fichas do Mundo de Harr)
  const linhas = String(md).split("\n");
  let h = "", tabela = [], lista = [];
  const inl = s => esc(s).replace(/&lt;(\/?)(b|i|u|s)&gt;/g, "<$1$2>").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<i>$2</i>").replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const fl = () => {
    if (lista.length) { h += "<ul>" + lista.map(x => `<li>${inl(x)}</li>`).join("") + "</ul>"; lista = []; }
    if (tabela.length) {
      const rows = tabela.filter(r => !/^\|\s*-/.test(r)).map(r => r.replace(/^\||\|$/g, "").split("|").map(c => c.trim()));
      h += `<div style="overflow-x:auto"><table class="tab">${rows.map((r, i) => `<tr>${r.map(c => i ? `<td>${inl(c)}</td>` : `<th>${inl(c)}</th>`).join("")}</tr>`).join("")}</table></div>`;
      tabela = [];
    }
  };
  for (const l of linhas) {
    if (/^\s*\|/.test(l)) { if (lista.length) fl(); tabela.push(l.trim()); continue; }
    if (/^\s*[-*] /.test(l)) { if (tabela.length) fl(); lista.push(l.replace(/^\s*[-*] /, "")); continue; }
    fl();
    if (/^#{1,3} /.test(l)) h += `<h3>${inl(l.replace(/^#+ /, ""))}</h3>`;
    else if (l.trim() && !/^<\/?(callout|columns|column|details|summary|page|database|empty-block)/.test(l.trim())) h += `<p>${inl(l)}</p>`;
  }
  fl();
  return h;
}

function telaMonstro(m) {
  titulo(m.nome);
  const fav = S.favs.has(m.id);
  const corA = { Baixa: "baixa", Média: "media", Alta: "alta" }[m.ameaca] || "";
  let corpo;
  if (m.md && !m.attr) {
    corpo = `<div class="secao">${mdSimples(m.md)}</div>`;
  } else {
    const dados = [["Perícias", m.pericias], ["Vulnerabilidades", m.vuln], ["Resistências", m.resist], ["Imunidades", m.imun], ["Sentidos", m.sentidos], ["Idiomas", m.idiomas], ["Equipamento", m.equip],
      ["Desafio", `CR ${m.cr_txt} (${(m.xp || 0).toLocaleString("pt-BR")} XP${m.xp_covil ? `, ou ${m.xp_covil.toLocaleString("pt-BR")} no covil` : ""}) · Bônus de Proficiência +${m.bp}`]].filter(x => x[1]);
    corpo = `
    <div class="atributos">${m.attr.map((v, i) => `<div><small>${ATR[i]}</small><b>${v}</b><span>${sg(modAttr(v))} · salv ${sg(m.salv[i])}</span></div>`).join("")}</div>
    <div class="dados">${dados.map(([k, v]) => `<div><dt>${k}</dt> <dd>${esc(v)}</dd></div>`).join("")}</div>
    ${(m.secoes || []).map(s => `<div class="secao"><h3>${esc(s.t)}</h3>${s.itens.map(i => `<p>${i.n ? `<b>${esc(i.n)}.</b> ` : ""}${textoRico(i.d)}</p>`).join("")}</div>`).join("")}
    ${m.dicas?.length ? `<div class="dicas"><h3>Dicas de mesa</h3><ul>${m.dicas.map(d => `<li>${esc(d)}</li>`).join("")}</ul></div>` : ""}`;
  }
  const fonte = m.fonte === "SRD 2024"
    ? `Fonte: SRD 5.2 (D&D 2024), Wizards of the Coast LLC — licença CC-BY-4.0.${m.traduzido ? " Tradução e adaptação para o Mundo de Harr." : " Tradução pendente: texto das ações ainda em inglês."}`
    : "Mundo de Harr — conteúdo da campanha.";
  $("#app").innerHTML = `
  <div class="ficha-img">${imgHTML(m)}</div>
  <h2 class="ficha-nome">${esc(m.nome)}</h2>
  ${m.nome_en && m.nome_en !== m.nome ? `<div class="ajuda">${esc(m.nome_en)}</div>` : ""}
  <div class="ficha-linha">${esc(m.linha || m.raca || "")}</div>
  <div class="linha-btns">${m.ameaca ? `<span class="etiqueta ${corA}">Ameaça ${esc(m.ameaca)}</span>` : ""}${(m.habitat || []).map(h => `<span class="etiqueta">${esc(h)}</span>`).join("")}${m.fonte === "Mundo de Harr" ? '<span class="etiqueta harr">Mundo de Harr</span>' : ""}</div>
  ${m.ca != null ? `<div class="chave">
    <div><small>CA</small><b>${m.ca}</b><i>${esc(m.ca_nota || "")}</i></div>
    <div><small>PV</small><b>${m.pv ?? "?"}</b><i>${esc(m.pv_dados || "")}</i></div>
    <div><small>INICIATIVA</small><b>${sg(m.ini ?? 0)}</b><i>&nbsp;</i></div>
    <div><small>CR</small><b>${esc(m.cr_txt ?? "?")}</b><i>&nbsp;</i></div></div>
    ${m.desl ? `<div class="ajuda"><b style="color:var(--ouro2)">Deslocamento</b> ${esc(m.desl)}</div>` : ""}` : ""}
  <div class="acoes-ficha">
    <button class="btn cheio" id="bComb">${ICO.espadas} Pôr no combate</button>
    <button class="btn" id="bFav">${ICO.estrela} ${fav ? "Favorito" : "Favoritar"}</button>
    ${m.notion ? `<a class="btn" href="${esc(m.notion)}" target="_blank" rel="noopener">Notion</a>` : ""}
  </div>
  ${corpo}
  <div class="fonte">${fonte}</div>`;
  $("#bFav").onclick = () => { S.favs.has(m.id) ? S.favs.delete(m.id) : S.favs.add(m.id); store.set("favs", [...S.favs]); telaMonstro(m); };
  $("#bComb").onclick = () => dialogoAdicionar(m);
}

/* ================= COMBATE ================= */
const CONDICOES = ["Agarrado", "Amedrontado", "Atordoado", "Caído", "Cego", "Contido", "Enfeitiçado", "Envenenado", "Exaustão", "Incapacitado", "Inconsciente", "Invisível", "Paralisado", "Petrificado", "Surdo", "Concentrando", "Sangrando"];
const d20 = () => 1 + Math.floor(Math.random() * 20);
function rolarDados(expr) {
  const m = String(expr || "").replace(/\s/g, "").match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (!m) return null;
  let t = +(m[3] || 0);
  for (let i = 0; i < +m[1]; i++) t += 1 + Math.floor(Math.random() * +m[2]);
  return Math.max(1, t);
}
function salvarComb() { store.set("comb", S.comb); }
function dialogoAdicionar(m) {
  dialogo(`<h3>${esc(m.nome)} no combate</h3>
    <label>Quantidade</label><input class="campo" id="dQtd" type="number" min="1" max="20" value="1">
    <label>Pontos de Vida</label>
    <div class="segmentos"><button class="on" data-pv="media">Média (${m.pv ?? "?"})</button><button data-pv="rolar" ${m.pv_dados ? "" : "disabled"}>Rolar ${esc(m.pv_dados || "")}</button></div>
    <p class="ajuda">A iniciativa é rolada automaticamente (d20 ${sg(m.ini ?? 0)}). Dá pra editar depois.</p>
    <div class="linha-btns"><button class="btn cheio" id="dOk">Adicionar</button><button class="btn" data-fechar>Cancelar</button></div>`,
    (c, fechar) => {
      let modo = "media";
      c.querySelectorAll("[data-pv]").forEach(b => b.onclick = () => { modo = b.dataset.pv; c.querySelectorAll("[data-pv]").forEach(x => x.classList.toggle("on", x === b)); });
      $("#dOk", c).onclick = () => {
        const n = Math.min(20, Math.max(1, +$("#dQtd", c).value || 1));
        const ja = S.comb.lista.filter(x => x.ref === m.id).length;
        for (let i = 0; i < n; i++) {
          const pv = modo === "rolar" ? (rolarDados(m.pv_dados) ?? m.pv) : (m.pv ?? 10);
          S.comb.lista.push({ uid: Date.now().toString(36) + i, ref: m.id, nome: m.nome + (n > 1 || ja ? ` ${ja + i + 1}` : ""), ini: d20() + (m.ini ?? 0), mod: m.ini ?? 0, pv, pvmax: pv, ca: m.ca, cond: [], tipo: "monstro" });
        }
        ordenarComb(); salvarComb(); fechar();
        avisar(`${n}× ${esc(m.nome)} no combate.`, "Abrir", () => { $("#aviso").hidden = true; ir("combate"); });
      };
    });
}
function ordenarComb() {
  const atual = S.comb.lista[S.comb.vez]?.uid;
  S.comb.lista.sort((a, b) => b.ini - a.ini || (b.mod ?? 0) - (a.mod ?? 0));
  const i = S.comb.lista.findIndex(x => x.uid === atual);
  S.comb.vez = i < 0 ? 0 : i;
}
function telaCombate() {
  titulo("Combate");
  const c = S.comb;
  $("#app").innerHTML = `
  <div class="cartao rodada"><div><small class="ajuda">Rodada</small><br><b>${c.rodada}</b></div>
    <div class="linha-btns"><button class="btn" id="cAnt">◂</button><button class="btn cheio" id="cProx">Próximo turno ▸</button></div></div>
  <div class="linha-btns" style="margin-bottom:12px">
    <button class="btn peq" id="cJog">+ Jogador / NPC</button><a class="btn peq" href="#bestiario">+ Monstro</a>
    <button class="btn peq perigo" id="cLimpar">Encerrar luta</button></div>
  <div id="cLista">${c.lista.length ? "" : `<div class="vazio">Adicione monstros pelo Bestiário (botão “Pôr no combate”) e os jogadores aqui.</div>`}</div>
  ${c.lista.length ? `<div class="ajuda" style="margin-top:8px">XP dos monstros derrotados: <b>${xpDerrotados().toLocaleString("pt-BR")}</b></div>` : ""}`;
  const L = $("#cLista");
  c.lista.forEach((x, i) => {
    const pct = x.pvmax ? Math.max(0, x.pv / x.pvmax * 100) : 100;
    const el = document.createElement("div");
    el.className = "comb" + (i === c.vez ? " vez" : "") + (x.tipo === "monstro" && x.pv <= 0 ? " caido" : "");
    el.innerHTML = `<div class="cab">
        <button class="ini" data-a="ini" title="Editar iniciativa">${x.ini}</button>
        <div class="nm"><b>${esc(x.nome)}</b><small>${x.tipo === "monstro" ? `CA ${x.ca ?? "?"} · PV ${x.pv}/${x.pvmax}` : "Jogador / NPC"}</small></div>
        ${x.ref ? `<a class="btn peq" href="#m-${x.ref}">Ficha</a>` : ""}
        <button class="btn peq" data-a="cond">Cond.</button>
        <button class="estrela" data-a="rem" aria-label="Remover">✕</button></div>
      ${x.tipo === "monstro" ? `<div class="barra"><i class="${pct < 34 ? "baixo" : pct < 67 ? "meio" : ""}" style="width:${pct}%"></i></div>
      <div class="ctrl"><input type="number" inputmode="numeric" placeholder="valor"><button class="btn peq perigo" data-a="dano">Dano</button><button class="btn peq" data-a="cura">Cura</button></div>` : ""}
      ${x.cond.length ? `<div class="conds">${x.cond.map(k => `<span>${esc(k)}</span>`).join("")}</div>` : ""}`;
    el.onclick = e => {
      const a = e.target.closest("[data-a]")?.dataset.a;
      if (!a) return;
      const v = Math.abs(parseInt($("input", el)?.value || "0", 10)) || 0;
      if (a === "dano") x.pv = Math.max(x.tipo === "monstro" ? 0 : -999, x.pv - v);
      if (a === "cura") x.pv = Math.min(x.pvmax, x.pv + v);
      if (a === "rem") { c.lista.splice(i, 1); if (c.vez >= c.lista.length) c.vez = 0; }
      if (a === "ini") return dialogoNumero("Iniciativa de " + x.nome, x.ini, n => { x.ini = n; ordenarComb(); salvarComb(); telaCombate(); });
      if (a === "cond") return dialogoCondicoes(x);
      salvarComb(); telaCombate();
    };
    L.appendChild(el);
  });
  $("#cProx").onclick = () => { if (!c.lista.length) return; c.vez++; if (c.vez >= c.lista.length) { c.vez = 0; c.rodada++; } salvarComb(); telaCombate(); };
  $("#cAnt").onclick = () => { if (!c.lista.length) return; c.vez--; if (c.vez < 0) { c.vez = c.lista.length - 1; c.rodada = Math.max(1, c.rodada - 1); } salvarComb(); telaCombate(); };
  $("#cLimpar").onclick = () => dialogo(`<h3>Encerrar a luta?</h3><p class="ajuda">Remove todos os participantes e zera a rodada.${c.lista.length ? ` XP dos derrotados: <b>${xpDerrotados().toLocaleString("pt-BR")}</b>.` : ""}</p>
      <div class="linha-btns"><button class="btn perigo" id="ok">Encerrar</button><button class="btn" data-fechar>Voltar</button></div>`,
    (cx, f) => $("#ok", cx).onclick = () => { S.comb = { rodada: 1, vez: 0, lista: [] }; salvarComb(); f(); telaCombate(); });
  $("#cJog").onclick = () => dialogo(`<h3>Jogador ou NPC</h3>
      <label>Nome</label><input class="campo" id="jN" placeholder="Ex.: Thalion">
      <label>Iniciativa (resultado já rolado)</label><input class="campo" id="jI" type="number" inputmode="numeric">
      ${S.harr?.personagens?.length ? `<label>Ou escolha um personagem</label><div class="toggles">${S.harr.personagens.map(p => `<button data-p="${esc(p.nome)}">${esc(p.nome)}</button>`).join("")}</div>` : ""}
      <div class="linha-btns" style="margin-top:14px"><button class="btn cheio" id="jOk">Adicionar</button><button class="btn" data-fechar>Cancelar</button></div>`,
    (cx, f) => {
      cx.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { $("#jN", cx).value = b.dataset.p; $("#jI", cx).focus(); });
      $("#jOk", cx).onclick = () => {
        const nome = $("#jN", cx).value.trim(); if (!nome) return;
        c.lista.push({ uid: Date.now().toString(36), nome, ini: parseInt($("#jI", cx).value || "0", 10), mod: 0, cond: [], tipo: "jogador" });
        ordenarComb(); salvarComb(); f(); telaCombate();
      };
    });
}
function xpDerrotados() { return S.comb.lista.filter(x => x.tipo === "monstro" && x.pv <= 0).reduce((t, x) => t + (S.porId.get(x.ref)?.xp || 0), 0); }
function dialogoNumero(tit, v, ok) {
  dialogo(`<h3>${esc(tit)}</h3><input class="campo" id="n" type="number" inputmode="numeric" value="${v}">
    <div class="linha-btns" style="margin-top:12px"><button class="btn cheio" id="ok">Salvar</button><button class="btn" data-fechar>Cancelar</button></div>`,
    (c, f) => { $("#n", c).select(); $("#ok", c).onclick = () => { ok(parseInt($("#n", c).value || "0", 10)); f(); }; });
}
function dialogoCondicoes(x) {
  dialogo(`<h3>Condições · ${esc(x.nome)}</h3><div class="toggles">${CONDICOES.map(k => `<button class="${x.cond.includes(k) ? "on" : ""}" data-k="${k}">${k}</button>`).join("")}</div>
    <div class="linha-btns" style="margin-top:14px"><button class="btn cheio" data-fechar>Pronto</button></div>`,
    (c, f) => {
      c.querySelectorAll("[data-k]").forEach(b => b.onclick = () => {
        const k = b.dataset.k; x.cond = x.cond.includes(k) ? x.cond.filter(y => y !== k) : [...x.cond, k];
        b.classList.toggle("on"); salvarComb();
      });
      c.querySelector("[data-fechar]").addEventListener("click", telaCombate);
    });
}

/* ================= LOJA ================= */
const MOEDAS = [["PL", 1000], ["PO", 100], ["PP", 10], ["PC", 1]];
function formatarPreco(pc) {
  if (!pc) return "—";
  if (pc >= 100) { const po = pc / 100; return (Number.isInteger(po) ? po : po.toFixed(1).replace(".", ",")).toLocaleString("pt-BR") + " PO"; }
  for (const [m, v] of MOEDAS) if (pc % v === 0) return pc / v + " " + m;
  return pc + " PC";
}
const precoLoja = it => it.valor ? Math.round(it.valor * (1 + (S.loja.ajuste || 0) / 100)) : 0;
function telaLoja() {
  titulo("Loja");
  const L = S.loja;
  const abas = ["Armas", "Armaduras", "Equipamento", "Itens Mágicos"];
  $("#app").innerHTML = `
  <div class="busca"><input class="campo" id="lq" type="search" placeholder="Buscar item" value="${esc(L.q)}" autocomplete="off">
    <div class="segmentos" style="margin-top:8px">${abas.map(a => `<button class="${a === L.aba ? "on" : ""}" data-aba="${a}">${a}</button>`).join("")}</div></div>
  <div class="ajuda" style="margin:0 2px 6px">Preços ${L.ajuste ? `com ajuste de <b>${L.ajuste > 0 ? "+" : ""}${L.ajuste}%</b>` : "de tabela"} · <a href="#" id="lAj">mudar ajuste</a></div>
  <div id="lLista"></div>
  ${S.cesta.length ? `<button class="btn cheio carrinho" id="lCesta">${ICO.cesta} ${S.cesta.reduce((t, x) => t + x.q, 0)} · ${formatarPreco(totalCesta())}</button>` : ""}`;
  const desenhar = () => {
    const q = norm(L.q);
    const lista = S.itens.filter(it => (q ? true : it.cat === L.aba) && (!q || norm(it.nome).includes(q) || norm(it.nome_en).includes(q)));
    const grupos = {};
    lista.forEach(it => (grupos[q ? it.cat : it.sub] ||= []).push(it));
    $("#lLista").innerHTML = Object.keys(grupos).length ? Object.entries(grupos).map(([g, its]) => `<div class="grupo">${esc(g)}</div>` +
      its.sort((a, b) => (a.valor || 0) - (b.valor || 0) || a.nome.localeCompare(b.nome, "pt")).map(it => `
      <a class="item" href="#i-${it.id}"><span class="txt"><span class="nome">${esc(it.nome)}</span>
      <span class="sub">${esc(it.cat === "Itens Mágicos" ? it.raridade + (it.sintonia ? " · sintonização" : "") : (it.campos?.[0]?.[1] || it.desc || it.peso || ""))}${!it.traduzido && it.cat === "Itens Mágicos" ? ' <span class="etiqueta pend">EN</span>' : ""}</span></span>
      <span class="dir">${formatarPreco(precoLoja(it))}</span></a>`).join("")).join("") : `<div class="vazio">Nada encontrado.</div>`;
    store.set("loja", L);
  };
  $("#lq").oninput = e => { L.q = e.target.value; desenhar(); };
  document.querySelectorAll("[data-aba]").forEach(b => b.onclick = () => { L.aba = b.dataset.aba; L.q = ""; telaLoja(); });
  $("#lAj").onclick = e => { e.preventDefault(); dialogoNumero("Ajuste de preço da loja (%)", L.ajuste || 0, n => { L.ajuste = n; store.set("loja", L); telaLoja(); }); };
  if ($("#lCesta")) $("#lCesta").onclick = dialogoCesta;
  desenhar();
}
function totalCesta() { return S.cesta.reduce((t, x) => t + precoLoja(S.porId.get(x.id) || {}) * x.q, 0); }
function dialogoCesta() {
  const linhas = S.cesta.map((x, i) => { const it = S.porId.get(x.id); return it ? `<div class="item"><span class="txt"><span class="nome">${esc(it.nome)}</span><span class="sub">${x.q} × ${formatarPreco(precoLoja(it))}</span></span>
    <button class="btn peq" data-m="${i}">−</button><button class="btn peq" data-p="${i}">+</button></div>` : ""; }).join("");
  dialogo(`<h3>Compras</h3>${linhas}<p style="font-family:Cinzel,serif;font-size:18px;color:var(--ouro2)">Total: ${formatarPreco(totalCesta())}</p>
    <div class="linha-btns"><button class="btn" id="cCopiar">Copiar lista</button><button class="btn perigo" id="cZerar">Esvaziar</button><button class="btn cheio" data-fechar>Fechar</button></div>`,
    (c, f) => {
      c.querySelectorAll("[data-m],[data-p]").forEach(b => b.onclick = () => {
        const i = +(b.dataset.m ?? b.dataset.p); S.cesta[i].q += b.dataset.m != null ? -1 : 1;
        if (S.cesta[i].q <= 0) S.cesta.splice(i, 1);
        store.set("cesta", S.cesta); f(); telaLoja(); if (S.cesta.length) dialogoCesta();
      });
      $("#cZerar", c).onclick = () => { S.cesta = []; store.set("cesta", []); f(); telaLoja(); };
      $("#cCopiar", c).onclick = async () => {
        const txt = S.cesta.map(x => { const it = S.porId.get(x.id); return `${x.q}× ${it.nome} — ${formatarPreco(precoLoja(it) * x.q)}`; }).join("\n") + `\nTotal: ${formatarPreco(totalCesta())}`;
        try { await navigator.clipboard.writeText(txt); avisar("Lista copiada."); } catch { avisar("Não deu pra copiar neste navegador."); }
      };
    });
}
function telaItem(it) {
  titulo(it.nome);
  const campos = [...(it.campos || []), ["Peso", it.peso], it.cat === "Itens Mágicos" ? ["Tipo", it.tipo] : null, it.cat === "Itens Mágicos" ? ["Raridade", it.raridade] : null,
    it.sintonia ? ["Sintonização", it.sintonia] : null].filter(x => x && x[1]);
  $("#app").innerHTML = `
  <div class="cartao">
    <h2 class="ficha-nome">${esc(it.nome)}</h2>
    ${it.nome_en && it.nome_en !== it.nome ? `<div class="ajuda">${esc(it.nome_en)}</div>` : ""}
    <div class="ficha-linha">${esc(it.sub || it.cat)}</div>
    <div class="chave" style="grid-template-columns:1fr"><div><small>PREÇO</small><b>${formatarPreco(precoLoja(it))}</b><i>${S.loja.ajuste ? `tabela: ${esc(formatarPreco(it.valor))}` : esc(it.nota_preco || "")}</i></div></div>
    <div class="dados">${campos.map(([k, v]) => `<div><dt>${esc(k)}</dt> <dd>${esc(v)}</dd></div>`).join("")}</div>
    ${it.desc ? `<div class="secao" style="margin-top:12px">${it.desc.split(/\n+/).map(p => `<p>${textoRico(p)}</p>`).join("")}</div>` : ""}
    <div class="acoes-ficha"><button class="btn cheio" id="iAdd">${ICO.cesta} Adicionar às compras</button></div>
    ${it.cat === "Itens Mágicos" ? `<div class="fonte">Fonte: SRD 5.2 (D&D 2024), Wizards of the Coast LLC — licença CC-BY-4.0.${it.traduzido ? " Tradução para o Mundo de Harr." : " Tradução pendente."} Preço sugerido pela raridade (Livro do Mestre 2024).</div>` : `<div class="fonte">Preço e estatísticas: Livro do Jogador 2024.</div>`}
  </div>`;
  $("#iAdd").onclick = () => {
    const x = S.cesta.find(y => y.id === it.id); x ? x.q++ : S.cesta.push({ id: it.id, q: 1 });
    store.set("cesta", S.cesta); avisar(`${esc(it.nome)} nas compras.`, "Ver", () => { $("#aviso").hidden = true; ir("loja"); setTimeout(dialogoCesta, 50); });
  };
}

/* ================= FICHAS ================= */
function telaFichas() {
  titulo("Fichas");
  if (!S.harr) {
    $("#app").innerHTML = `<div class="cartao" style="text-align:center">
      <div style="font-size:42px;color:var(--ouro)">${ICO.cadeado}</div>
      <h3 style="color:var(--ouro);margin:6px 0">Conteúdo do Mundo de Harr</h3>
      <p class="ajuda">As fichas dos personagens e os monstros da campanha ficam protegidos por senha, pra ninguém dar spoiler. Digite a senha uma vez neste aparelho.</p>
      <input class="campo" id="sh" type="password" placeholder="Senha" autocomplete="current-password">
      <div class="linha-btns" style="justify-content:center;margin-top:12px"><button class="btn cheio" id="shOk">Desbloquear</button></div></div>`;
    $("#shOk").onclick = async () => {
      const ok = await abrirHarr($("#sh").value.trim());
      if (ok) { montarMonstros(); avisar("Conteúdo de Harr desbloqueado."); telaFichas(); }
      else avisar(navigator.onLine || (await caches.match("data/harr.enc.json")) ? "Senha incorreta." : "Abra o app com internet uma vez para baixar o conteúdo.");
    };
    return;
  }
  const P = S.harr.personagens || [];
  $("#app").innerHTML = `<div class="titulo-secao" style="margin-top:4px">Personagens</div>
    ${P.length ? P.map((p, i) => `<a class="item" href="#p-${i}"><span class="mini">${icone("Humanóide")}</span><span class="txt"><span class="nome">${esc(p.nome)}</span><span class="sub">${esc(p.resumo || "")}</span></span></a>`).join("") : `<div class="vazio">Nenhuma ficha ainda.</div>`}
    <div class="ajuda" style="margin-top:14px">Atualizado do Notion em ${esc(S.harr.atualizado || "?")}.</div>`;
}
function telaPersonagem(i) {
  const p = S.harr.personagens?.[+i];
  if (!p) return telaFichas();
  titulo(p.nome);
  $("#app").innerHTML = `<div class="cartao"><h2 class="ficha-nome">${esc(p.nome)}</h2><div class="ficha-linha">${esc(p.resumo || "")}</div>
    <div class="secao">${mdSimples(p.md || "")}</div>
    ${p.notion ? `<div class="acoes-ficha"><a class="btn" href="${esc(p.notion)}" target="_blank" rel="noopener">Abrir no Notion</a></div>` : ""}</div>`;
}

/* ================= AJUSTES ================= */
async function telaAjustes() {
  titulo("Ajustes");
  $("#btnVoltar").hidden = false;
  const comImg = S.monstros.filter(m => m.img);
  let uso = "";
  try { const e = await navigator.storage.estimate(); uso = `${(e.usage / 1048576).toFixed(1)} MB usados neste aparelho`; } catch {}
  const persist = await navigator.storage?.persisted?.().catch(() => false);
  $("#app").innerHTML = `
  <div class="cartao"><h3 style="margin-top:0;color:var(--ouro)">Imagens</h3>
    <p class="ajuda">${comImg.length} criaturas têm arte. ${S.imgsCache.size} já estão salvas pra usar offline.</p>
    <div class="medidor"><i style="width:${comImg.length ? S.imgsCache.size / comImg.length * 100 : 0}%"></i></div>
    <div class="linha-btns" style="margin-top:12px"><button class="btn cheio" id="aImg" ${comImg.length ? "" : "disabled"}>${ICO.baixar} Baixar todas as imagens</button>
    <button class="btn" id="aFav">Só dos favoritos</button></div></div>
  <div class="cartao"><h3 style="margin-top:0;color:var(--ouro)">Armazenamento</h3>
    <p class="ajuda">${uso || "—"}. ${persist ? "O Android não vai apagar os dados do app sozinho." : "Peça armazenamento permanente pra o Android não limpar o app quando faltar espaço."}</p>
    ${persist ? "" : `<button class="btn" id="aPers">Manter dados permanentes</button>`}</div>
  <div class="cartao"><h3 style="margin-top:0;color:var(--ouro)">Atualizações</h3>
    <p class="ajuda">Catálogo versão ${esc(S.cat.versao)}. Quando houver internet, o app confere sozinho se tem catálogo novo.</p>
    <button class="btn" id="aAtu">Procurar atualização agora</button></div>
  <div class="cartao"><h3 style="margin-top:0;color:var(--ouro)">Mundo de Harr</h3>
    <p class="ajuda">${S.harr ? "Conteúdo da campanha desbloqueado neste aparelho." : "Conteúdo da campanha bloqueado."}</p>
    ${S.harr ? `<button class="btn perigo" id="aSair">Bloquear de novo</button>` : `<a class="btn" href="#fichas">Desbloquear</a>`}</div>
  <div class="cartao fonte" style="font-style:normal">
    <b>Créditos.</b> Este trabalho inclui material do System Reference Document 5.2 (“SRD 5.2”) da Wizards of the Coast LLC, disponível em dndbeyond.com/srd, licenciado sob a Creative Commons Attribution 4.0 International License (creativecommons.org/licenses/by/4.0). Tradução e adaptação para o português: Mundo de Harr. Preços de itens mágicos sugeridos pela tabela de raridade do Livro do Mestre 2024.</div>`;
  const baixar = async (lista, btn) => {
    btn.disabled = true;
    await baixarImagens(lista, n => btn.textContent = `Baixando ${n}/${lista.length}…`);
    avisar("Imagens salvas pra uso offline."); telaAjustes();
  };
  $("#aImg").onclick = e => baixar(comImg, e.target);
  $("#aFav").onclick = e => baixar(comImg.filter(m => S.favs.has(m.id)), e.target);
  if ($("#aPers")) $("#aPers").onclick = async () => { const ok = await navigator.storage?.persist?.(); avisar(ok ? "Dados marcados como permanentes." : "O Android recusou agora; instalar o app na tela inicial costuma liberar."); telaAjustes(); };
  $("#aAtu").onclick = () => { if (!navigator.onLine) return avisar("Sem internet agora."); navigator.serviceWorker?.getRegistration().then(r => r?.update()); avisar("Procurando… se houver novidade, aparece um aviso aqui em cima."); };
  if ($("#aSair")) $("#aSair").onclick = () => { store.set("senha", null); S.harr = null; montarMonstros(); telaAjustes(); };
}

/* ---------- rede e atualização ---------- */
function rede() { $("#rede").classList.toggle("off", !navigator.onLine); $("#rede").title = navigator.onLine ? "Online" : "Offline"; }
addEventListener("online", rede); addEventListener("offline", rede);

async function registrarSW() {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.register("sw.js", { updateViaCache: "none" });
  const oferecer = w => avisar("Nova versão do Harrquivo disponível.", "Atualizar", () => { w.postMessage("ativar"); });
  if (reg.waiting && navigator.serviceWorker.controller) oferecer(reg.waiting);
  reg.addEventListener("updatefound", () => {
    const w = reg.installing;
    w?.addEventListener("statechange", () => { if (w.state === "installed" && navigator.serviceWorker.controller) oferecer(w); });
  });
  let recarregou = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (!recarregou) { recarregou = true; location.reload(); } });
  if (navigator.onLine) reg.update().catch(() => {});
}

(async () => {
  rede();
  try { await carregar(); }
  catch (e) { $("#app").innerHTML = `<div class="vazio">Não deu pra abrir o catálogo. Abra o app uma vez com internet.</div>`; console.error(e); return; }
  addEventListener("hashchange", rotear);
  rotear();
  registrarSW();
})();
