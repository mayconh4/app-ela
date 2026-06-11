/* ===========================================================
   BELLA — Protótipo Web   |   app.js
   Lógica, dados de exemplo e persistência (localStorage).
   Tudo simulável. Placeholders para integração futura (Iugu/Supabase).
   =========================================================== */

'use strict';

/* ---------- ÍCONE helper ---------- */
const ic = (id, cls = '') => `<svg class="${cls}"><use href="#${id}"/></svg>`;
const money = n => 'R$ ' + n.toFixed(2).replace('.', ',');
const $ = s => document.querySelector(s);
const el = id => document.getElementById(id);

/* ===========================================================
   1. CONFIG DE MONETIZAÇÃO (simulável)
   =========================================================== */
const CONFIG = {
  taxaPorAtendimento: 2.99,     // R$ taxa de entrada por atendimento
  assinaturaMensal: 89.90,      // teto para quem tem volume
  iuguPercentual: 0.0099,       // ~0,99% provedor
  fidelidadeMeta: 10,           // a cada 10 → próximo grátis
  modeloPlataforma: 'taxa'      // 'taxa' | 'assinatura'
};

/* ===========================================================
   2. DADOS DE EXEMPLO (seed)
   =========================================================== */
const CATEGORIAS = [
  { id: 'unhas', nome: 'Unhas', icon: 'i-nail' },
  { id: 'cabelo', nome: 'Cabelo', icon: 'i-scissors' },
  { id: 'cilios', nome: 'Cílios', icon: 'i-lash' },
  { id: 'sobrancelha', nome: 'Sobrancelhas', icon: 'i-brow' },
  { id: 'estrias', nome: 'Tratamento de estrias', icon: 'i-wave' },
  { id: 'botox', nome: 'Botox (ácido hialurônico)', icon: 'i-drop' }
];

const SERVICOS = [
  { id: 's1', cat: 'cabelo', nome: 'Corte feminino', preco: 70, dur: 45 },
  { id: 's2', cat: 'cabelo', nome: 'Escova', preco: 50, dur: 40 },
  { id: 's3', cat: 'cabelo', nome: 'Coloração', preco: 180, dur: 120 },
  { id: 's4', cat: 'cabelo', nome: 'Hidratação', preco: 90, dur: 60 },
  { id: 's5', cat: 'unhas', nome: 'Manicure', preco: 45, dur: 50 },
  { id: 's6', cat: 'unhas', nome: 'Pedicure', preco: 50, dur: 50 },
  { id: 's7', cat: 'unhas', nome: 'Esmaltação em gel', preco: 75, dur: 70 },
  { id: 's8', cat: 'sobrancelha', nome: 'Design de sobrancelha', preco: 40, dur: 30 },
  { id: 's9', cat: 'sobrancelha', nome: 'Henna', preco: 55, dur: 45 },
  { id: 's10', cat: 'cilios', nome: 'Extensão de cílios', preco: 160, dur: 110 },
  { id: 's11', cat: 'cilios', nome: 'Lifting de cílios', preco: 120, dur: 70 },
  { id: 's12', cat: 'estrias', nome: 'Tratamento de estrias (sessão)', preco: 150, dur: 60 },
  { id: 's13', cat: 'estrias', nome: 'Microagulhamento para estrias', preco: 220, dur: 80 },
  { id: 's14', cat: 'botox', nome: 'Preenchimento com ácido hialurônico', preco: 650, dur: 60 },
  { id: 's15', cat: 'botox', nome: 'Toxina botulínica (botox facial)', preco: 580, dur: 50 },
  { id: 's16', cat: 'botox', nome: 'Preenchimento labial', preco: 720, dur: 60 }
];

// horário de trabalho e intervalos por profissional
const PROFISSIONAIS = [
  { id: 'p1', nome: 'Ana Beatriz', estab: 'e1', cats: ['cabelo'], nota: 4.9, dist: 0.8, freelancer: false, comissao: 50, exp: '8 anos', inicio: 9, fim: 18, almoco: [12, 13] },
  { id: 'p2', nome: 'Camila Rocha', estab: 'e1', cats: ['unhas', 'sobrancelha', 'cilios'], nota: 4.8, dist: 0.8, freelancer: false, comissao: 45, exp: '5 anos', inicio: 9, fim: 19, almoco: [13, 14] },
  { id: 'p3', nome: 'Júlia Mendes', estab: 'e2', cats: ['cabelo', 'estrias', 'botox'], nota: 4.7, dist: 2.3, freelancer: true, comissao: 60, exp: '6 anos', inicio: 10, fim: 20, almoco: [14, 15] },
  { id: 'p4', nome: 'Larissa Souza', estab: 'e2', cats: ['estrias', 'botox', 'sobrancelha', 'cilios'], nota: 5.0, dist: 2.3, freelancer: true, comissao: 55, exp: '10 anos', inicio: 8, fim: 16, almoco: [12, 13] },
  { id: 'p5', nome: 'Patrícia Lima', estab: 'e3', cats: ['unhas', 'cabelo'], nota: 4.6, dist: 4.1, freelancer: false, comissao: 50, exp: '4 anos', inicio: 9, fim: 18, almoco: [12, 13] }
];

const ESTABS = [
  { id: 'e1', nome: 'Studio Bella Centro', end: 'R. das Flores, 120 - Centro', lat: -23.5505, lng: -46.6333, nota: 4.9 },
  { id: 'e2', nome: 'Glow Beauty Lounge', end: 'Av. Paulista, 900 - Bela Vista', lat: -23.5614, lng: -46.6560, nota: 4.8 },
  { id: 'e3', nome: 'Espaço Charme', end: 'R. Augusta, 1500 - Consolação', lat: -23.5520, lng: -46.6620, nota: 4.7 }
];

/* ===========================================================
   3. ESTADO PERSISTENTE (localStorage)
   =========================================================== */
const DB_KEY = 'bella_db_v1';
function seedDB() {
  return {
    agendamentos: [
      // status: paid | wait | cancel  ;  faltou: bool
      { id: 'a1', estab: 'e1', prof: 'p1', serv: 's1', data: hojeISO(), hora: '10:00', cliente: 'Mariana Alves', cpf: '111.111.111-11', wpp: '11999990001', status: 'paid', faltou: false },
      { id: 'a2', estab: 'e1', prof: 'p2', serv: 's5', data: hojeISO(), hora: '11:00', cliente: 'Fernanda Dias', cpf: '222.222.222-22', wpp: '11999990002', status: 'wait', faltou: false },
      { id: 'a3', estab: 'e1', prof: 'p1', serv: 's2', data: hojeISO(), hora: '15:00', cliente: 'Carla Nunes', cpf: '333.333.333-33', wpp: '11999990003', status: 'paid', faltou: false },
      { id: 'a4', estab: 'e2', prof: 'p3', serv: 's11', data: hojeISO(), hora: '16:00', cliente: 'Beatriz Lima', cpf: '444.444.444-44', wpp: '11999990004', status: 'cancel', faltou: true }
    ],
    avaliacoes: [
      { prof: 'p1', estrelas: 5, txt: 'Amei o corte!', cliente: 'Mariana' },
      { prof: 'p4', estrelas: 5, txt: 'Profissional impecável.', cliente: 'Sofia' }
    ],
    // fidelidade por cliente (cpf -> contagem)
    fidelidade: { '111.111.111-11': 7 },
    // marketplace
    vagas: [
      { id: 'v1', estab: 'e1', titulo: 'Diária — Cabeleireira (Sábado)', valor: 180, cat: 'cabelo', tipo: 'Diária' },
      { id: 'v2', estab: 'e3', titulo: 'Fixa — Manicure (3x/semana)', valor: 1400, cat: 'unhas', tipo: 'Mensal' }
    ],
    candidaturas: [],
    metas: { 'mes': 12000, '6meses': 70000, 'ano': 150000 },
    politicaFalta: 15, // % de desconto/multa aplicada no próximo atendimento de quem faltou
    cadastroPro: null,
    comissoes: {},     // override de comissão por profissional (id -> %)
    convites: [],      // ids de profissionais convidados pela Rede
    equipe: [],        // freelancers cadastrados pela dona (persistem)
    perfil: 'cliente' // cliente | profissional
  };
}
let DB = load();
function load() {
  let db;
  try { const r = localStorage.getItem(DB_KEY); db = r ? JSON.parse(r) : seedDB(); }
  catch (e) { db = seedDB(); }
  // migração de chaves novas em bancos antigos
  if (!db.comissoes) db.comissoes = {};
  if (!db.convites) db.convites = [];
  if (!db.equipe) db.equipe = [];
  return db;
}
// reidrata freelancers cadastrados pela dona na lista em memória
DB.equipe.forEach(p => { if (!PROFISSIONAIS.some(x => x.id === p.id)) PROFISSIONAIS.push(p); });

function save() { localStorage.setItem(DB_KEY, JSON.stringify(DB)); }
// comissão efetiva (considera override salvo)
function comissaoDe(p) { return DB.comissoes[p.id] != null ? DB.comissoes[p.id] : p.comissao; }
function resetDB() { DB = seedDB(); save(); toast('Dados de exemplo restaurados'); render(); }

function hojeISO() { return new Date().toISOString().slice(0, 10); }

/* ===========================================================
   4. ESTADO DE NAVEGAÇÃO / FLUXO
   =========================================================== */
const FLOW = {
  perfil: DB.perfil,            // cliente | profissional
  screen: 'menu',
  proScreen: 'agenda',
  proTipo: null,                // freelancer | dona
  // seleção do fluxo cliente
  sel: { estab: null, cat: null, serv: null, prof: null, data: hojeISO(), hora: null }
};

/* ===========================================================
   5. NAVEGAÇÃO
   =========================================================== */
function go(screen) { FLOW.screen = screen; render(); window.scrollTo(0, 0); }
function goPro(s) { FLOW.proScreen = s; render(); window.scrollTo(0, 0); }

function setPerfil(p) {
  FLOW.perfil = p; DB.perfil = p; save();
  if (p === 'cliente') FLOW.screen = 'menu';
  else FLOW.screen = DB.cadastroPro ? 'agenda-wrap' : 'onboard';
  closeSheet(); render();
}

/* ===========================================================
   6. RENDER PRINCIPAL
   =========================================================== */
function render() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  renderTabbar();

  if (FLOW.perfil === 'cliente') {
    ({
      menu: renderMenu, estab: renderEstab, servicos: renderServicos, prof: renderProf,
      horario: renderHorario, meus: renderMeus
    }[FLOW.screen] || renderMenu)();
  } else {
    if (!DB.cadastroPro && FLOW.screen !== 'cadastro') return renderOnboard();
    if (FLOW.screen === 'cadastro') return renderCadastro();
    ({
      agenda: renderProAgenda, resumo: renderProResumo, rede: renderProRede,
      equipe: renderProEquipe, metas: renderProMetas
    }[FLOW.proScreen] || renderProAgenda)();
  }
}

function show(id, html) { const s = el(id); s.innerHTML = html; s.classList.add('active'); }

/* ===========================================================
   7. TAB BAR
   =========================================================== */
function renderTabbar() {
  const tb = el('tabbar');
  if (FLOW.perfil === 'cliente') {
    const tabs = [
      { k: 'menu', i: 'i-home', l: 'Agendar' },
      { k: 'meus', i: 'i-cal', l: 'Meus' }
    ];
    tb.innerHTML = tabs.map(t => `
      <button class="tab ${FLOW.screen === t.k || (t.k==='menu' && ['estab','servicos','prof','horario'].includes(FLOW.screen)) ? 'active' : ''}" onclick="go('${t.k}')">
        ${ic(t.i)}<span>${t.l}</span></button>`).join('');
  } else if (DB.cadastroPro) {
    const dona = DB.cadastroPro.tipo === 'dona';
    let tabs = [
      { k: 'agenda', i: 'i-cal', l: 'Agenda' },
      { k: 'resumo', i: 'i-chart', l: 'Resumo' },
      { k: 'rede', i: 'i-net', l: 'Rede' }
    ];
    if (dona) tabs.push({ k: 'equipe', i: 'i-team', l: 'Equipe' });
    tabs.push({ k: 'metas', i: 'i-target', l: 'Metas' });
    tb.innerHTML = tabs.map(t => `
      <button class="tab ${FLOW.proScreen === t.k ? 'active' : ''}" onclick="goPro('${t.k}')">
        ${ic(t.i)}<span>${t.l}</span></button>`).join('');
  } else { tb.innerHTML = ''; }
}

/* ===========================================================
   7b. CLIENTE — Menu inicial de categorias
   =========================================================== */
function renderMenu() {
  const cards = CATEGORIAS.map(c => {
    const qtd = SERVICOS.filter(s => s.cat === c.id).length;
    return `<div class="cat-card glass" onclick="selCatMenu('${c.id}')">
      <div class="cat-ic">${ic(c.icon)}</div>
      <div class="cat-nome">${c.nome}</div>
      <div class="cat-qtd">${qtd} serviço${qtd>1?'s':''}</div>
    </div>`;
  }).join('');
  show('scr-menu', `
    <h2 class="section-title big" style="margin-top:6px">O que você<br>procura hoje?</h2>
    <div class="cat-grid">${cards}</div>
  `);
}
function selCatMenu(id) { FLOW.sel.cat = id; FLOW.sel.serv = null; FLOW.sel.estab = null; go('estab'); }

/* ===========================================================
   8. CLIENTE — Escolher estabelecimento
   =========================================================== */
function renderEstab() {
  const cat = FLOW.sel.cat;
  const catNome = cat ? CATEGORIAS.find(c => c.id === cat).nome : null;
  const elig = ESTABS.filter(e => !cat || PROFISSIONAIS.some(p => p.estab === e.id && p.cats.includes(cat)));
  const ordered = [...elig].sort((a, b) => dist(a) - dist(b));
  const list = ordered.map(e => {
    const hoje = freeSlotsCount(e.id);
    const semana = freeSlotsWeek(e.id);
    const bairro = (e.end.split(' - ')[1] || e.end);
    const sub = hoje > 0 ? hoje + ' horários hoje'
              : semana > 0 ? 'horários a partir de amanhã'
              : 'consultar horários';
    return `<div class="item" onclick="selEstab('${e.id}')">
      <div class="icon-tile">${ic('i-store')}</div>
      <div class="meta"><div class="t">${e.nome}</div>
        <div class="s">${bairro} · ${ic('i-star')} ${e.nota} · ${sub}</div></div>
      <svg class="chev"><use href="#i-chev"/></svg>
    </div>`;
  }).join('');

  show('scr-estab', `
    ${backBtn('menu')}
    ${stepper(1, catNome ? catNome : 'Agendamento')}
    <h2 class="section-title big">Onde quer ser atendida?</h2>
    <button class="btn block lg" onclick="acharProxima()">${ic('i-pin')} A mais próxima de você</button>
    <div class="eyebrow" style="margin-top:20px">OU ESCOLHA</div>
    ${list}
  `);
}
function dist(e) { return FLOW._geo ? haversine(FLOW._geo, e) : e._d || (e._d = mockDist(e)); }
function mockDist(e) { return ({ e1: 0.8, e2: 2.3, e3: 4.1 })[e.id]; }
function haversine(g, e) {
  const R = 6371, dLat = rad(e.lat - g.lat), dLng = rad(e.lng - g.lng);
  const a = Math.sin(dLat/2)**2 + Math.cos(rad(g.lat))*Math.cos(rad(e.lat))*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
const rad = d => d * Math.PI / 180;

function acharProxima() {
  if (!navigator.geolocation) { fallbackProxima(); return; }
  toast('Localizando…');
  navigator.geolocation.getCurrentPosition(
    pos => {
      FLOW._geo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const best = [...ESTABS].sort((a,b)=>dist(a)-dist(b)).find(e=>freeSlotsCount(e.id)>0) || ESTABS[0];
      toast('Mais próxima: ' + best.nome);
      render();
    },
    () => fallbackProxima(),
    { timeout: 6000 }
  );
}
function fallbackProxima() {
  const best = [...ESTABS].sort((a,b)=>mockDist(a)-mockDist(b)).find(e=>freeSlotsCount(e.id)>0);
  toast('Mais próxima: ' + best.nome + ' (localização indisponível, usando exemplo)');
  selEstab(best.id);
}

function selEstab(id) { FLOW.sel.estab = id; FLOW.sel.serv = null; go('servicos'); }

/* ===========================================================
   9. CLIENTE — Categoria + Serviço
   =========================================================== */
function renderServicos() {
  const estab = ESTABS.find(e => e.id === FLOW.sel.estab);
  const cat = FLOW.sel.cat;
  const catNome = cat ? CATEGORIAS.find(c => c.id === cat).nome : 'Serviços';
  const servs = SERVICOS.filter(s => !cat || s.cat === cat);
  const list = servs.map(s => `
    <div class="item ${FLOW.sel.serv===s.id?'selected':''}" onclick="selServ('${s.id}')">
      <div class="avatar soft">${ic(catIcon(s.cat))}</div>
      <div class="meta"><div class="t">${s.nome}</div>
        <div class="s">${ic('i-clock')} ${s.dur} min</div></div>
      <div class="price">${money(s.preco)}</div>
    </div>`).join('');

  show('scr-servicos', `
    ${backBtn('estab')}
    ${stepper(2, estab.nome)}
    <h2 class="section-title">${catNome}</h2>
    <p class="muted" style="margin:-8px 2px 16px">Escolha o serviço desejado</p>
    ${list}
  `);
}
const catIcon = c => CATEGORIAS.find(x=>x.id===c).icon;
function selCat(c) { FLOW.sel.cat = c; FLOW.sel.serv = null; renderServicos(); }
function selServ(id) { FLOW.sel.serv = id; FLOW.sel.prof = null; go('prof'); }

/* ===========================================================
   10. CLIENTE — Profissional
   =========================================================== */
function renderProf() {
  const serv = SERVICOS.find(s => s.id === FLOW.sel.serv);
  const profs = PROFISSIONAIS.filter(p => p.estab === FLOW.sel.estab && p.cats.includes(serv.cat));
  const anyCard = `<div class="item ${FLOW.sel.prof==='any'?'selected':''}" onclick="selProf('any')">
      <div class="avatar">${ic('i-spark')}</div>
      <div class="meta"><div class="t">Qualquer profissional</div>
        <div class="s">Pegamos o horário livre mais cedo</div></div>${chev()}</div>`;
  const list = profs.map(p => `
    <div class="item ${FLOW.sel.prof===p.id?'selected':''}" onclick="selProf('${p.id}')">
      <div class="avatar">${initials(p.nome)}</div>
      <div class="meta"><div class="t">${p.nome} ${p.freelancer?'<span class="tag">freelancer</span>':''}</div>
        <div class="s">${ic('i-star')} ${p.nota} · ${p.exp} de experiência</div></div>${chev()}</div>`).join('');

  show('scr-prof', `
    ${backBtn('servicos')}
    ${stepper(3, estabNome())}
    <h2 class="section-title">Com quem?</h2>
    <p class="muted" style="margin:-6px 2px 14px">${serv.nome} · ${money(serv.preco)} · ${serv.dur} min</p>
    ${anyCard}${list}
  `);
}
function selProf(id) { FLOW.sel.prof = id; go('horario'); }
const initials = n => n.split(' ').slice(0,2).map(x=>x[0]).join('');
const chev = () => `<svg style="width:18px;height:18px;fill:var(--ink-faint)"><use href="#i-chev"/></svg>`;
// barra de etapas do agendamento (estilo da referência)
function stepper(n, ctx) {
  const total = 4;
  const segs = Array.from({length: total}, (_, i) => `<div class="step-seg ${i < n ? 'on' : ''}"></div>`).join('');
  return `<div class="stepper"><div class="step-bar">${segs}</div>
    <div class="step-label">${ctx} · PASSO ${n} DE ${total}</div></div>`;
}
const estabNome = () => { const e = ESTABS.find(x => x.id === FLOW.sel.estab); return e ? e.nome : 'BELLA'; };

/* ===========================================================
   11. CLIENTE — Data + Horário (descontando ocupados/intervalo)
   =========================================================== */
function renderHorario() {
  const serv = SERVICOS.find(s => s.id === FLOW.sel.serv);
  const days = nextDays(7);
  const dayChips = days.map(d =>
    `<button class="chip ${FLOW.sel.data===d.iso?'active':''}" onclick="selData('${d.iso}')">
      ${d.lbl}</button>`).join('');

  const prof = FLOW.sel.prof === 'any'
    ? PROFISSIONAIS.find(p => p.estab===FLOW.sel.estab && p.cats.includes(serv.cat))
    : PROFISSIONAIS.find(p => p.id === FLOW.sel.prof);

  // se o dia atual não tem horário livre, pula para o primeiro dia que tiver
  if (!buildSlots(prof, FLOW.sel.data).some(s => !s.busy)) {
    const dia = days.find(d => buildSlots(prof, d.iso).some(s => !s.busy));
    if (dia) FLOW.sel.data = dia.iso;
  }
  const slots = buildSlots(prof, FLOW.sel.data);
  const grid = slots.map(s =>
    `<div class="slot ${s.busy?'busy':''} ${FLOW.sel.hora===s.h&&!s.busy?'active':''}"
      ${s.busy?'':`onclick="selHora('${s.h}')"`}>${s.h}</div>`).join('');

  show('scr-horario', `
    ${backBtn('prof')}
    ${stepper(4, estabNome())}
    <h2 class="section-title">Quando?</h2>
    <div class="chips">${dayChips}</div>
    <p class="muted" style="margin:6px 2px 12px">Profissional: ${prof.nome} · só mostramos horários livres</p>
    <div class="grid cols-4">${grid}</div>
    <button class="btn block" style="margin-top:18px" ${FLOW.sel.hora?'':'disabled'} onclick="openCheckout()">
      Continuar para pagamento</button>
  `);
}
function selData(iso) { FLOW.sel.data = iso; FLOW.sel.hora = null; renderHorario(); }
function selHora(h) { FLOW.sel.hora = h; renderHorario(); }

function nextDays(n) {
  const wd = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const out = [];
  for (let i=0;i<n;i++){ const d=new Date(); d.setDate(d.getDate()+i);
    out.push({ iso:d.toISOString().slice(0,10), lbl:(i===0?'Hoje':i===1?'Amanhã':wd[d.getDay()]+' '+d.getDate()) }); }
  return out;
}
// gera slots de 30min respeitando expediente, almoço e agendamentos existentes
function buildSlots(prof, data) {
  const taken = DB.agendamentos
    .filter(a => a.prof === prof.id && a.data === data && a.status !== 'cancel')
    .map(a => a.hora);
  const slots = [];
  for (let h = prof.inicio; h < prof.fim; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
      const inAlmoco = h >= prof.almoco[0] && h < prof.almoco[1];
      const past = data === hojeISO() && (h*60+m) <= (new Date().getHours()*60 + new Date().getMinutes());
      slots.push({ h: hh, busy: inAlmoco || taken.includes(hh) || past });
    }
  }
  return slots;
}
function freeSlotsCount(estabId) {
  const profs = PROFISSIONAIS.filter(p => p.estab === estabId);
  return profs.reduce((sum,p)=> sum + buildSlots(p, hojeISO()).filter(s=>!s.busy).length, 0);
}
// disponibilidade considerando os próximos 7 dias (não só hoje)
function freeSlotsWeek(estabId) {
  const profs = PROFISSIONAIS.filter(p => p.estab === estabId);
  let total = 0;
  for (const d of nextDays(7)) total += profs.reduce((sum,p)=> sum + buildSlots(p, d.iso).filter(s=>!s.busy).length, 0);
  return total;
}

/* ===========================================================
   12. CLIENTE — Checkout PIX (nome, CPF, WhatsApp; sem cadastro)
   =========================================================== */
function openCheckout() {
  const serv = SERVICOS.find(s => s.id === FLOW.sel.serv);
  openSheet(`
    ${stepper(4, estabNome())}
    <h2 class="section-title" style="margin-top:0">Pagamento via PIX</h2>
    <div class="card glass" style="margin-bottom:16px">
      <div class="row between"><span class="muted">${serv.nome}</span><b>${money(serv.preco)}</b></div>
      <div class="row between"><span class="muted">${FLOW.sel.data} às ${FLOW.sel.hora}</span></div>
    </div>
    <div class="field"><label>Nome completo</label><input id="ckNome" placeholder="Seu nome"></div>
    <div class="field"><label>CPF</label><input id="ckCpf" placeholder="000.000.000-00"></div>
    <div class="field"><label>WhatsApp</label><input id="ckWpp" placeholder="(11) 99999-0000"></div>
    <button class="btn block" onclick="gerarPix()">Gerar PIX ${money(serv.preco)}</button>
    <p class="faint center" style="font-size:11px;margin-top:10px">
      Split invisível: profissional + plataforma (taxa ${money(CONFIG.taxaPorAtendimento)}). Provedor: Iugu (placeholder).</p>
  `);
}

let pixTimer = null;
function gerarPix() {
  const nome = el('ckNome').value.trim(), cpf = el('ckCpf').value.trim(), wpp = el('ckWpp').value.trim();
  if (!nome || !cpf || !wpp) { toast('Preencha nome, CPF e WhatsApp'); return; }
  FLOW._checkout = { nome, cpf, wpp };
  const serv = SERVICOS.find(s => s.id === FLOW.sel.serv);
  const copia = `00020126BR.GOV.BCB.PIX${cpf.replace(/\D/g,'')}BELLA${serv.preco}5204000053039865802BR6009SAO PAULO62070503***6304`;
  let secs = 600;
  openSheet(`
    <h2 class="section-title center" style="margin-top:0">Escaneie para pagar</h2>
    <div class="qr">${fakeQR()}</div>
    <div class="timer" id="pixTimer">10:00</div>
    <p class="faint center" style="font-size:12px;margin-bottom:14px">Expira em 10 minutos</p>
    <div class="field"><label>PIX copia e cola</label><div class="copia" id="copiaCola">${copia}</div></div>
    <button class="btn ghost block" onclick="copiar('${copia}')">${ic('i-copy')} Copiar código</button>
    <button class="btn block dark" style="margin-top:10px" onclick="confirmarPix()">${ic('i-check')} Já paguei (simular)</button>
  `);
  clearInterval(pixTimer);
  pixTimer = setInterval(() => {
    secs--; if (secs < 0) { clearInterval(pixTimer); closeSheet(); toast('PIX expirado'); return; }
    const t = el('pixTimer'); if (t) t.textContent = String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0');
  }, 1000);
}

function confirmarPix() {
  clearInterval(pixTimer);
  const c = FLOW._checkout, s = FLOW.sel;
  const id = 'a' + Date.now();
  DB.agendamentos.push({ id, estab: s.estab, prof: s.prof==='any'?firstProf(s):s.prof, serv: s.serv,
    data: s.data, hora: s.hora, cliente: c.nome, cpf: c.cpf, wpp: c.wpp, status: 'paid', faltou: false });
  // fidelidade
  DB.fidelidade[c.cpf] = (DB.fidelidade[c.cpf] || 0) + 1;
  let msgFid = '';
  if (DB.fidelidade[c.cpf] >= CONFIG.fidelidadeMeta) {
    DB.fidelidade[c.cpf] = 0; msgFid = ' Você completou 10 atendimentos — o próximo é grátis! 🎁';
  }
  save();
  FLOW._lastAg = id;
  const serv = SERVICOS.find(x=>x.id===s.serv);
  openSheet(`
    <div class="center">
      <div class="avatar" style="width:70px;height:70px;margin:6px auto 14px;border-radius:22px">${ic('i-check')}</div>
      <h2 class="section-title" style="margin-top:0">Pagamento confirmado!</h2>
      <p class="muted">${serv.nome} · ${s.data} às ${s.hora}.${msgFid}</p>
    </div>
    <hr class="soft">
    <button class="btn block" onclick="abrirAvaliacao('${id}')">${ic('i-star')} Avaliar atendimento (demo)</button>
    <button class="btn ghost block" style="margin-top:10px" onclick="closeSheet();go('meus')">Ver meus agendamentos</button>
  `);
}
function firstProf(s) {
  const serv = SERVICOS.find(x=>x.id===s.serv);
  const prof = PROFISSIONAIS.find(p=>p.estab===s.estab && p.cats.includes(serv.cat));
  return prof.id;
}

/* ===========================================================
   13. CLIENTE — Avaliação
   =========================================================== */
let _rating = 0;
function abrirAvaliacao(agId) {
  _rating = 0;
  const ag = DB.agendamentos.find(a => a.id === agId);
  const prof = PROFISSIONAIS.find(p => p.id === ag.prof);
  openSheet(`
    <h2 class="section-title center" style="margin-top:0">Como foi com ${prof?prof.nome:'a profissional'}?</h2>
    <div class="stars" id="stars">${[1,2,3,4,5].map(n=>`<svg data-n="${n}" onclick="setStar(${n})"><use href="#i-star"/></svg>`).join('')}</div>
    <div class="field"><label>Comentário (opcional)</label><textarea id="avTxt" rows="3" placeholder="Conte como foi…"></textarea></div>
    <button class="btn block" onclick="salvarAvaliacao('${agId}')">Enviar avaliação</button>
  `);
}
function setStar(n) { _rating = n; document.querySelectorAll('#stars svg').forEach(s => s.classList.toggle('on', +s.dataset.n <= n)); }
function salvarAvaliacao(agId) {
  if (!_rating) { toast('Escolha de 1 a 5 estrelas'); return; }
  const ag = DB.agendamentos.find(a => a.id === agId);
  DB.avaliacoes.push({ prof: ag.prof, estrelas: _rating, txt: el('avTxt').value.trim(), cliente: ag.cliente.split(' ')[0] });
  save(); closeSheet(); toast('Obrigada pela avaliação!');
}

/* ===========================================================
   14. CLIENTE — Meus agendamentos + fidelidade
   =========================================================== */
function renderMeus() {
  const ags = DB.agendamentos.filter(a => a.status !== 'cancel').slice().reverse();
  const list = ags.length ? ags.map(a => {
    const serv = SERVICOS.find(s=>s.id===a.serv), prof = PROFISSIONAIS.find(p=>p.id===a.prof), est = ESTABS.find(e=>e.id===a.estab);
    return `<div class="item" style="cursor:default">
      <div class="avatar soft">${ic(catIcon(serv.cat))}</div>
      <div class="meta"><div class="t">${serv.nome}</div>
        <div class="s">${est.nome} · ${prof?prof.nome:''}</div>
        <div class="s">${ic('i-clock')} ${a.data} às ${a.hora}</div></div>
      <span class="badge ${a.status}">${statusLbl(a.status)}</span>
    </div>`;
  }).join('') : `<div class="empty">${ic('i-cal')}<div>Nenhum agendamento ainda</div></div>`;

  // fidelidade do cliente atual (último checkout) ou exemplo
  const cpf = (FLOW._checkout && FLOW._checkout.cpf) || '111.111.111-11';
  const cnt = DB.fidelidade[cpf] || 0;
  const dots = Array.from({length: CONFIG.fidelidadeMeta}, (_,i) =>
    `<div class="dot ${i<cnt?'on':''}"></div>`).join('');

  show('scr-meus', `
    <h2 class="section-title">Meus agendamentos</h2>
    <div class="card glass">
      <div class="row between"><b>Cartão fidelidade</b><span class="tag">${cnt}/${CONFIG.fidelidadeMeta}</span></div>
      <div class="fidelity">${dots}</div>
      <p class="faint" style="font-size:12px;margin-top:8px">A cada ${CONFIG.fidelidadeMeta} atendimentos, o próximo é grátis.</p>
    </div>
    ${list}
  `);
}
const statusLbl = s => ({paid:'Pago', wait:'Aguardando', cancel:'Cancelado'}[s]);

/* ===========================================================
   15. PROFISSIONAL — Onboarding (tipo) + Cadastro
   =========================================================== */
function renderOnboard() {
  show('scr-pro-onboard', `
    <h2 class="section-title">Bem-vinda! Você é…</h2>
    <div class="item" onclick="escolherTipo('freelancer')">
      <div class="avatar">${ic('i-user')}</div>
      <div class="meta"><div class="t">Sou autônoma (freelancer)</div>
        <div class="s">Atendo por conta própria e pego diárias em salões</div></div>${chev()}</div>
    <div class="item" onclick="escolherTipo('dona')">
      <div class="avatar">${ic('i-store')}</div>
      <div class="meta"><div class="t">Sou dono de studio</div>
        <div class="s">Tenho equipe e quero gerenciar profissionais</div></div>${chev()}</div>
  `);
}
function escolherTipo(t) { FLOW.proTipo = t; FLOW.screen = 'cadastro'; render(); }

function renderCadastro() {
  const dona = FLOW.proTipo === 'dona';
  show('scr-pro-cadastro', `
    ${backBtn('onboard', true)}
    <h2 class="section-title">Cadastro ${dona?'do studio':'da profissional'}</h2>
    <p class="muted" style="margin:-6px 2px 14px">Dados exigidos pelo provedor de pagamento (Iugu).</p>
    <div class="field"><label>Nome ${dona?'do responsável':'completo'}</label><input id="cdNome" placeholder="Nome"></div>
    <div class="field"><label>${dona?'CNPJ (ou CPF)':'CPF'}</label><input id="cdDoc" placeholder="${dona?'00.000.000/0000-00':'000.000.000-00'}"></div>
    <div class="field"><label>Tipo de conta</label>
      <select id="cdTipo"><option>${dona?'Pessoa Jurídica':'Pessoa Física'}</option><option>MEI</option></select></div>
    <div class="field"><label>Faturamento mensal estimado</label>
      <select id="cdFat"><option>Até R$ 5.000</option><option>R$ 5.000 – 20.000</option><option>Acima de R$ 20.000</option></select></div>
    <div class="field"><label>Endereço completo</label><input id="cdEnd" placeholder="Rua, número, bairro, cidade/UF, CEP"></div>
    <div class="field"><label>Chave PIX (recebimento)</label><input id="cdPix" placeholder="CPF/CNPJ, e-mail, telefone ou aleatória"></div>
    <button class="btn block" onclick="salvarCadastro()">Concluir cadastro</button>
    <button class="btn ghost block" style="margin-top:10px" onclick="pularCadastro()">Pular (demo)</button>
  `);
}
function salvarCadastro() {
  const nome = el('cdNome').value.trim(), doc = el('cdDoc').value.trim();
  if (!nome || !doc) { toast('Preencha ao menos nome e documento'); return; }
  DB.cadastroPro = { tipo: FLOW.proTipo, nome, doc, pix: el('cdPix').value.trim() };
  save(); FLOW.screen = 'agenda-wrap'; FLOW.proScreen = 'agenda'; toast('Cadastro concluído!'); render();
}
function pularCadastro() {
  DB.cadastroPro = { tipo: FLOW.proTipo || 'dona', nome: 'Studio Demo', doc: '00.000.000/0001-00', pix: 'demo@bella.app' };
  save(); FLOW.screen = 'agenda-wrap'; FLOW.proScreen = 'agenda'; toast('Modo demo ativado'); render();
}

/* ===========================================================
   16. PROFISSIONAL — Agenda (cores por status + fidelidade)
   =========================================================== */
function renderProAgenda() {
  const hoje = DB.agendamentos.filter(a => a.data === hojeISO()).sort((a,b)=>a.hora.localeCompare(b.hora));
  const legend = `<div class="row" style="gap:14px;margin:-4px 2px 14px;font-size:12px;font-weight:600">
    <span class="row" style="gap:5px"><span class="dot-status paid"></span>Pago</span>
    <span class="row" style="gap:5px"><span class="dot-status wait"></span>Aguardando</span>
    <span class="row" style="gap:5px"><span class="dot-status cancel"></span>Cancelado</span></div>`;
  const list = hoje.length ? hoje.map(a => {
    const serv = SERVICOS.find(s=>s.id===a.serv), prof = PROFISSIONAIS.find(p=>p.id===a.prof);
    const fid = DB.fidelidade[a.cpf] || 0;
    const dots = Array.from({length:CONFIG.fidelidadeMeta},(_,i)=>`<div class="dot ${i<fid?'on':''}"></div>`).join('');
    return `<div class="card glass">
      <div class="row between">
        <div class="row"><span class="dot-status ${a.status}" style="margin-right:8px"></span>
          <div><b>${a.hora}</b> · ${serv.nome}<div class="s muted" style="font-size:12.5px">${a.cliente} · ${prof?prof.nome:''}</div></div></div>
        <span class="badge ${a.status}">${statusLbl(a.status)}</span>
      </div>
      <div class="fidelity" style="margin-top:10px">${dots}</div>
      ${a.faltou?`<p style="color:var(--bad);font-size:12px;margin-top:8px;font-weight:600">Faltou — desconto de ${DB.politicaFalta}% aplicado no próximo</p>`:''}
    </div>`;
  }).join('') : `<div class="empty">${ic('i-cal')}<div>Sem agendamentos hoje</div></div>`;

  show('scr-pro-agenda', `${proHeader('Agenda de hoje')}${legend}${list}`);
}

/* ===========================================================
   17. PROFISSIONAL — Resumo (faturamento, comissão, top, faltas)
   =========================================================== */
function renderProResumo() {
  const pagos = DB.agendamentos.filter(a => a.status === 'paid');
  const sum = arr => arr.reduce((t,a)=> t + (SERVICOS.find(s=>s.id===a.serv)?.preco||0), 0);
  const dia = sum(pagos.filter(a=>a.data===hojeISO()));
  const semana = sum(pagos);   // simplificado para demo
  const mes = semana;
  const comissaoMedia = 50;
  const comissao = dia * comissaoMedia/100;
  const taxaPlat = pagos.length * CONFIG.taxaPorAtendimento;

  // serviços mais vendidos
  const cont = {};
  pagos.forEach(a => cont[a.serv] = (cont[a.serv]||0)+1);
  const top = Object.entries(cont).sort((a,b)=>b[1]-a[1]).slice(0,4)
    .map(([sid,n])=>{ const s=SERVICOS.find(x=>x.id===sid); return `<div class="row between" style="padding:8px 0">
      <span>${s.nome}</span><b>${n}×</b></div>`; }).join('') || '<p class="faint">Sem vendas ainda</p>';

  const faltas = DB.agendamentos.filter(a=>a.faltou);

  show('scr-pro-resumo', `
    ${proHeader('Resumo')}
    <div class="stats">
      <div class="stat glass"><div class="v">${money(dia)}</div><div class="l">Hoje</div></div>
      <div class="stat glass"><div class="v">${money(semana)}</div><div class="l">Semana</div></div>
      <div class="stat glass"><div class="v">${money(mes)}</div><div class="l">Mês</div></div>
      <div class="stat glass"><div class="v">${money(comissao)}</div><div class="l">Comissão hoje (${comissaoMedia}%)</div></div>
    </div>
    <div class="card glass"><h3>Serviços mais vendidos</h3><hr class="soft">${top}</div>
    <div class="card glass">
      <div class="row between"><h3>Política de faltas</h3><span class="tag">${DB.politicaFalta}% desconto</span></div>
      <p class="faint" style="font-size:12.5px;margin:6px 0 10px">Desconto/multa aplicado no próximo atendimento de quem faltou.</p>
      <div class="row" style="gap:8px">
        <button class="btn ghost sm" onclick="ajustarFalta(-5)">−5%</button>
        <button class="btn ghost sm" onclick="ajustarFalta(5)">+5%</button>
        <span class="muted" style="font-size:12px">${faltas.length} falta(s) registrada(s)</span>
      </div>
    </div>
    <div class="card glass">
      <div class="row between"><span class="muted">Taxa da plataforma acumulada</span><b>${money(taxaPlat)}</b></div>
      <div class="row between"><span class="muted">Modelo</span><b>${CONFIG.modeloPlataforma==='taxa'?money(CONFIG.taxaPorAtendimento)+' / atend.':money(CONFIG.assinaturaMensal)+' / mês'}</b></div>
      <button class="btn ghost sm block" style="margin-top:10px" onclick="alternarModelo()">Alternar modelo (simular)</button>
    </div>
  `);
}
function ajustarFalta(d) { DB.politicaFalta = Math.max(0, Math.min(50, DB.politicaFalta + d)); save(); renderProResumo(); }
function alternarModelo() { CONFIG.modeloPlataforma = CONFIG.modeloPlataforma==='taxa'?'assinatura':'taxa'; renderProResumo(); toast('Modelo: '+CONFIG.modeloPlataforma); }

/* ===========================================================
   18. PROFISSIONAL — Rede (marketplace vagas + vitrine)
   =========================================================== */
function renderProRede() {
  const vagas = DB.vagas.map(v => {
    const est = ESTABS.find(e=>e.id===v.estab);
    const aplicou = DB.candidaturas.includes(v.id);
    return `<div class="card glass">
      <div class="row between"><b>${v.titulo}</b><span class="price">${money(v.valor)}</span></div>
      <div class="s muted" style="font-size:12.5px;margin:4px 0 10px">${est.nome} · ${v.tipo}</div>
      <button class="btn sm ${aplicou?'ghost':''}" ${aplicou?'disabled':''} onclick="candidatar('${v.id}')">
        ${aplicou?'Candidatura enviada':'Candidatar-se'}</button>
    </div>`;
  }).join('');

  const vitrine = PROFISSIONAIS.filter(p=>p.freelancer).map(p => {
    const conv = DB.convites.includes(p.id);
    return `<div class="item">
      <div class="avatar">${initials(p.nome)}</div>
      <div class="meta"><div class="t">${p.nome}</div>
        <div class="s">${ic('i-star')} ${p.nota} · ${p.cats.map(c=>CATEGORIAS.find(x=>x.id===c).nome).join(', ')} · ${p.dist} km</div></div>
      <button class="btn sm ${conv?'ghost':''}" ${conv?'disabled':''} onclick="convidar('${p.id}','${p.nome}')">${conv?'Convidada':'Convidar'}</button>
    </div>`; }).join('');

  show('scr-pro-rede', `
    ${proHeader('Rede')}
    <div class="segment glass"><button class="active" onclick="segRede(this,'vagas')">Mural de vagas</button>
      <button onclick="segRede(this,'vitrine')">Vitrine de profissionais</button></div>
    <div id="redeVagas">${vagas}</div>
    <div id="redeVitrine" class="hidden">${vitrine}</div>
  `);
}
function segRede(btn, k) {
  document.querySelectorAll('#scr-pro-rede .segment button').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  el('redeVagas').classList.toggle('hidden', k!=='vagas');
  el('redeVitrine').classList.toggle('hidden', k!=='vitrine');
}
function candidatar(id) { if(!DB.candidaturas.includes(id)) DB.candidaturas.push(id); save(); renderProRede(); toast('Candidatura enviada!'); }
function convidar(id, nome) { if(!DB.convites.includes(id)) DB.convites.push(id); save(); renderProRede(); toast('Convite enviado para '+nome); }

/* ===========================================================
   19. PROFISSIONAL — Equipe (só donas; comissão por pessoa)
   =========================================================== */
function renderProEquipe() {
  const team = PROFISSIONAIS.filter(p => p.estab === 'e1'); // demo: studio e1
  const list = team.map(p => `
    <div class="card glass">
      <div class="row"><div class="avatar">${initials(p.nome)}</div>
        <div class="meta"><div class="t">${p.nome} ${p.freelancer?'<span class="tag">freelancer</span>':''}</div>
          <div class="s">${ic('i-star')} ${p.nota} · ${p.cats.map(c=>CATEGORIAS.find(x=>x.id===c).nome).join(', ')}</div></div>
        <button class="btn ghost sm" onclick="removerProf('${p.id}')">Remover</button></div>
      <div class="row between" style="margin-top:12px">
        <span class="muted">Comissão</span>
        <div class="row" style="gap:8px">
          <button class="btn ghost sm" onclick="comissao('${p.id}',-5)">−5%</button>
          <input class="comm-input" type="number" min="0" max="100" value="${comissaoDe(p)}"
            onchange="setComissao('${p.id}', this.value)" onclick="this.select()">
          <span style="font-weight:700">%</span>
          <button class="btn ghost sm" onclick="comissao('${p.id}',5)">+5%</button>
        </div></div>
    </div>`).join('');
  show('scr-pro-equipe', `
    ${proHeader('Equipe')}
    <p class="faint" style="font-size:12.5px;margin:-8px 2px 12px">Toque no número para digitar a comissão exata.</p>
    <button class="btn block" onclick="formFreelancer()">${ic('i-plus')} Cadastrar freelancer</button>
    <div style="margin-top:14px">${list}</div>
  `);
}
// ajuste por passos (+/-)
function comissao(id, d) {
  const p = PROFISSIONAIS.find(x=>x.id===id);
  DB.comissoes[id] = Math.max(0, Math.min(100, comissaoDe(p) + d));
  save(); renderProEquipe();
}
// digitar valor exato
function setComissao(id, val) {
  let v = parseInt(val, 10); if (isNaN(v)) return;
  DB.comissoes[id] = Math.max(0, Math.min(100, v));
  save(); renderProEquipe(); toast('Comissão atualizada');
}
function removerProf(id) {
  const i = PROFISSIONAIS.findIndex(p => p.id === id); if (i >= 0) PROFISSIONAIS.splice(i, 1);
  DB.equipe = DB.equipe.filter(p => p.id !== id); delete DB.comissoes[id];
  save(); renderProEquipe(); toast('Profissional removida');
}
// formulário de cadastro de freelancer (funcional)
function formFreelancer() {
  const opts = CATEGORIAS.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
  openSheet(`
    <h2 class="section-title" style="margin-top:0">Cadastrar freelancer</h2>
    <div class="field"><label>Nome</label><input id="flNome" placeholder="Nome da profissional"></div>
    <div class="field"><label>Especialidade</label><select id="flCat">${opts}</select></div>
    <div class="field"><label>Comissão (%)</label><input id="flComm" type="number" min="0" max="100" value="50"></div>
    <button class="btn block" onclick="salvarFreelancer()">Adicionar à equipe</button>
  `);
}
function salvarFreelancer() {
  const nome = el('flNome').value.trim();
  if (!nome) { toast('Informe o nome'); return; }
  const cat = el('flCat').value;
  const comm = Math.max(0, Math.min(100, parseInt(el('flComm').value, 10) || 50));
  const novo = { id: 'p' + Date.now(), nome, estab: 'e1', cats: [cat], nota: 5.0, dist: 0,
    freelancer: true, comissao: comm, exp: 'nova', inicio: 9, fim: 18, almoco: [12, 13] };
  PROFISSIONAIS.push(novo); DB.equipe.push(novo); DB.comissoes[novo.id] = comm;
  save(); closeSheet(); renderProEquipe(); toast('Freelancer adicionada!');
}

/* ===========================================================
   20. PROFISSIONAL — Metas + fidelização (lembrar via WhatsApp)
   =========================================================== */
function renderProMetas() {
  const pagos = DB.agendamentos.filter(a=>a.status==='paid');
  const realizado = pagos.reduce((t,a)=>t+(SERVICOS.find(s=>s.id===a.serv)?.preco||0),0);
  const cards = [
    { k:'mes', l:'Meta do mês' }, { k:'6meses', l:'Meta de 6 meses' }, { k:'ano', l:'Meta de 1 ano' }
  ].map(m => {
    const meta = DB.metas[m.k], pct = Math.min(100, Math.round(realizado/meta*100));
    return `<div class="card glass">
      <div class="row between"><b>${m.l}</b>
        <button class="btn ghost sm" onclick="configMeta('${m.k}')">Configurar</button></div>
      <div class="row between" style="margin:8px 0 6px"><span class="muted">${money(realizado)} de ${money(meta)}</span><b>${pct}%</b></div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');

  // clientes para fidelizar (inativas / com fidelidade alta)
  const clientes = uniqueClientes();
  const fidList = clientes.map(c => `
    <div class="item" style="cursor:default">
      <div class="avatar soft">${initials(c.nome)}</div>
      <div class="meta"><div class="t">${c.nome}</div>
        <div class="s">Fidelidade ${DB.fidelidade[c.cpf]||0}/${CONFIG.fidelidadeMeta}</div></div>
      <button class="btn sm" onclick="lembrarWpp('${c.wpp}','${c.nome}')">${ic('i-wpp')} Lembrar</button>
    </div>`).join('');

  show('scr-pro-metas', `
    ${proHeader('Metas')}
    ${cards}
    <h3 style="margin:18px 2px 12px">Fidelização de clientes</h3>
    <p class="faint" style="font-size:12.5px;margin:-8px 2px 12px">Envie um lembrete no WhatsApp com mensagem pronta.</p>
    ${fidList}
  `);
}
function configMeta(k) {
  openSheet(`
    <h2 class="section-title" style="margin-top:0">Configurar meta</h2>
    <div class="field"><label>Valor da meta (${k})</label><input id="metaVal" type="number" value="${DB.metas[k]}"></div>
    <button class="btn block" onclick="salvarMeta('${k}')">Salvar meta</button>`);
}
function salvarMeta(k) { DB.metas[k] = +el('metaVal').value || DB.metas[k]; save(); closeSheet(); renderProMetas(); toast('Meta atualizada'); }
function uniqueClientes() {
  const seen = {}, out = [];
  DB.agendamentos.forEach(a => { if(!seen[a.cpf]){ seen[a.cpf]=1; out.push({nome:a.cliente, cpf:a.cpf, wpp:a.wpp}); }});
  return out;
}
function lembrarWpp(wpp, nome) {
  const msg = encodeURIComponent(`Oi ${nome}! Sentimos sua falta no Studio Bella 💆‍♀️ Que tal agendar seu próximo horário? Temos novidades esperando por você!`);
  window.open(`https://wa.me/55${wpp.replace(/\D/g,'')}?text=${msg}`, '_blank');
}

/* ===========================================================
   21. MENU DE USUÁRIO (troca de perfil / minha conta)
   =========================================================== */
function openUserMenu() {
  openSheet(`
    <h2 class="section-title" style="margin-top:0">Conta</h2>
    <div class="item ${FLOW.perfil==='cliente'?'selected':''}" onclick="setPerfil('cliente')">
      <div class="avatar soft">${ic('i-user')}</div>
      <div class="meta"><div class="t">Sou cliente</div><div class="s">Agendar atendimentos</div></div>${chev()}</div>
    <div class="item ${FLOW.perfil==='profissional'?'selected':''}" onclick="setPerfil('profissional')">
      <div class="avatar">${ic('i-store')}</div>
      <div class="meta"><div class="t">Sou profissional</div><div class="s">Painel de gestão</div></div>${chev()}</div>
    <hr class="soft">
    <div class="item" style="cursor:default"><div class="avatar soft">${ic('i-user')}</div>
      <div class="meta"><div class="t">Minha conta</div>
        <div class="s">${DB.cadastroPro?DB.cadastroPro.nome+' · '+DB.cadastroPro.doc:'Sem cadastro profissional'}</div></div></div>
    <button class="btn ghost block" style="margin-top:8px" onclick="resetDB();closeSheet()">Restaurar dados de exemplo</button>
  `);
}

/* ===========================================================
   22. HELPERS DE UI (header, voltar, sheet, toast, copiar, QR)
   =========================================================== */
function proHeader(t) {
  return `<div class="row between" style="margin:6px 2px 14px">
    <h2 class="section-title" style="margin:0">${t}</h2>
    <span class="tag">${DB.cadastroPro?(DB.cadastroPro.tipo==='dona'?'Dono de studio':'Freelancer'):''}</span></div>`;
}
function backBtn(to, isPro) {
  return `<button class="icon-btn" style="margin-bottom:8px" onclick="${isPro?`FLOW.screen='${to}';render()`:`go('${to}')`}">${ic('i-back')}</button>`;
}
function openSheet(html) { el('sheetBody').innerHTML = html; el('overlay').classList.add('open'); }
function closeSheet() { el('overlay').classList.remove('open'); clearInterval(pixTimer); }
function toast(msg) {
  const t = el('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2600);
}
function copiar(txt) { navigator.clipboard?.writeText(txt).then(()=>toast('Código copiado!')).catch(()=>toast('Copie manualmente')); }
// QR fake (visual) — placeholder; produção usa payload PIX real da Iugu
function fakeQR() {
  let cells = '';
  for (let y=0;y<21;y++) for (let x=0;x<21;x++) {
    const edge = (x<7&&y<7)||(x>13&&y<7)||(x<7&&y>13);
    if (edge ? ((x%6===0||y%6===0||(x>1&&x<5&&y>1&&y<5)||(x>14&&x<19&&y>1&&y<5)||(x>1&&x<5&&y>14&&y<19))) : (Math.random()>0.5))
      cells += `<rect x="${x*10}" y="${y*10}" width="10" height="10" fill="#2c2435"/>`;
  }
  return `<svg viewBox="0 0 210 210">${cells}</svg>`;
}

/* ===========================================================
   23. INIT
   =========================================================== */
el('userMenuBtn').addEventListener('click', openUserMenu);
el('overlay').addEventListener('click', e => { if (e.target === el('overlay')) closeSheet(); });
render();
