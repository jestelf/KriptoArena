/******************************************************************
 *  CryptoArena v2.2 : узел-за-уровень, ветви растут/сохнут        *
 ******************************************************************/
import { DefenseModule, AttackModule, Block } from './main.js';

/* ---------- стартовые сущности ---------- */
const defenses = {
  PoW   : new DefenseModule('PoW',    32, 3, 'FastNonce'),
  SHA256: new DefenseModule('SHA256',128, 2, 'HashCollision'),
  ECDSA : new DefenseModule('ECDSA', 160, 1, 'KeySpoof'),
};
const attacks = {
  FastNonce     : new AttackModule('FastNonce',     'PoW',    'pow'),
  HashCollision : new AttackModule('HashCollision', 'SHA256', 'collision'),
  KeySpoof      : new AttackModule('KeySpoof',      'ECDSA',  'forgery'),
};

/* ---------- канвас ---------- */
const canvas = document.getElementById('arena');
const ctx    = canvas.getContext('2d');
const fit = () => { canvas.width = innerWidth; canvas.height = innerHeight * 0.6; };
addEventListener('resize', fit); fit();

/* ---------- постоянные ---------- */
const R = 16;                // радиус ВСЕХ узлов
const STEP_MS = 1200;        // один «тик» = 1.2 c
const CHILD_DIST = 80;       // длина связи родитель-потомок

/* ---------- граф узлов ---------- */
let nextId = 1;
const nodes = [];            // {id,type,def,x,y,parentId}

/* корневые узлы по центру */
const rootAngle = Math.PI * 2 / Object.keys(defenses).length;
Object.keys(defenses).forEach((t, i) => {
  const angle = i * rootAngle;
  const cx    = canvas.width  / 2 + Math.cos(angle) * 150;
  const cy    = canvas.height / 2 + Math.sin(angle) * 150;
  nodes.push({ id: nextId++, type: t, def: defenses[t], x: cx, y: cy, parentId: null });
});

/* --- утилиты работы с графом --- */
function spawnChild(parentNode) {
  const angle = Math.random() * Math.PI * 2;
  const x = parentNode.x + Math.cos(angle) * CHILD_DIST;
  const y = parentNode.y + Math.sin(angle) * CHILD_DIST;
  nodes.push({ id: nextId++, type: parentNode.type, def: parentNode.def, x, y, parentId: parentNode.id });
}

function removeNode(node) {
  /* удаляем лист; если у него были дети — сделаем их сиротами (parentId = null) */
  const idx = nodes.findIndex(n => n.id === node.id);
  if (idx !== -1) nodes.splice(idx, 1);
  nodes.forEach(n => { if (n.parentId === node.id) n.parentId = null; });
}

/* ---------- лог ---------- */
const logBox = document.getElementById('log');
const log = msg => { logBox.textContent += msg + '\n'; logBox.scrollTop = logBox.scrollHeight; };

/* ---------- отрисовка ---------- */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* линии */
  ctx.strokeStyle = '#9ac'; ctx.lineWidth = 1.4;
  nodes.forEach(n => {
    if (!n.parentId) return;
    const p = nodes.find(x => x.id === n.parentId);
    if (p) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(n.x, n.y); ctx.stroke(); }
  });

  /* узлы */
  nodes.forEach(n => {
    ctx.beginPath(); ctx.arc(n.x, n.y, R, 0, Math.PI * 2);
    ctx.fillStyle = '#d8ecff'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#345'; ctx.stroke();

    ctx.fillStyle = '#000'; ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(n.type, n.x, n.y);
  });

  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

/* ---------- непрерывная симуляция ---------- */
setInterval(() => {
  /* 1. случайный узел-жертва */
  const victim = nodes[Math.random() * nodes.length | 0];
  const def    = victim.def;

  /* 2. атака */
  const atk = Object.values(attacks).find(a => a.target === def.name) ??
              Object.values(attacks)[Math.random() * 3 | 0];

  /* 3. бой */
  const { success, chance } = new Block(def, atk).resolve();
  const pText = (chance * 100).toExponential(2);

  /* 4. эволюция ветви */
  if (success) {
    const branch = nodes.filter(n => n.type === def.name);
    if (branch.length > 1) {          // не последний?
      removeNode(victim);
      log(`❌  ${atk.name} → ${def.name}  (P=${pText}) — узел уничтожен`);
    } else {
      log(`❌  ${atk.name} → ${def.name}  (P=${pText}) — минимум 1 узел, остаёмся`);
    }
  } else {
    spawnChild(victim);
    log(`✅  ${def.name} отбил ${atk.name}  (P=${pText}) — +1 узел`);
  }
}, STEP_MS);
