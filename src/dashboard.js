/******************************************************************
 * CryptoArena Dashboard — фикс: берём Chart из window            *
 ******************************************************************/
import { DefenseModule, AttackModule, Block } from './main.js';

/* --- единственная критическая строка -------------------------- */
const Chart = window.Chart;          // ← теперь Chart доступен в модуле
/* ----------------------------------------------------------------*/

/* ---------- объекты модели ---------- */
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

/* ---------- внутренние журналы ---------- */
const histLvl = { PoW: [], SHA256: [], ECDSA: [] };
const histEff = { FastNonce: [], HashCollision: [], KeySpoof: [] };
const MAXPTS = 200;
let tick = 0;

/* ---------- график уровней защит ---------- */
const defChart = new Chart(
  document.getElementById('defChart'),
  {
    type:'line',
    data:{
      labels:[],
      datasets:Object.keys(defenses).map(name=>({label:name,data:[],tension:.25}))
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      animation:false, interaction:{mode:'nearest'},
      scales:{x:{title:{display:true,text:'tick'}},y:{beginAtZero:true}}
    }
  }
);

/* ---------- график эффективности атак ---------- */
const atkChart = new Chart(
  document.getElementById('atkChart'),
  {
    type:'line',
    data:{
      labels:[],
      datasets:Object.keys(attacks).map(name=>({
        label:name,data:[],tension:.25,borderDash:[4,2]
      }))
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      animation:false, interaction:{mode:'nearest'},
      scales:{x:{title:{display:true,text:'tick'}},y:{beginAtZero:true,max:1}}
    }
  }
);

/* ---------- лог ---------- */
const logBox=document.getElementById('log');
const log=msg=>{logBox.textContent+=msg+'\n';logBox.scrollTop=logBox.scrollHeight;};

/* ---------- helper -------- */
const push=(arr,v)=>{arr.push(v); if(arr.length>MAXPTS) arr.shift();};

/* ---------- цикл ---------- */
setInterval(()=>{
  tick++;

  /* цель + атака */
  const def = Object.values(defenses)[Math.random()*3|0];
  const atk = Object.values(attacks).find(a=>a.target===def.name) ??
              Object.values(attacks)[Math.random()*3|0];

  /* бой */
  const {success,chance}=new Block(def,atk).resolve();
  const ptxt=(chance*100).toExponential(2);

  /* учёт истории */
  push(histLvl[def.name],def.level);
  push(histEff[atk.name],success?1:0);

  /* обновление графов */
  defChart.data.labels.push(tick);
  atkChart.data.labels.push(tick);

  defChart.data.datasets.forEach(ds=>{
    ds.data.push(histLvl[ds.label].at(-1));
    if(ds.data.length>MAXPTS){ds.data.shift();}
  });

  atkChart.data.datasets.forEach(ds=>{
    const arr=histEff[ds.label];
    const r=arr.slice(-50);          // скользящее окно
    const avg=r.reduce((s,v)=>s+v,0)/(r.length||1);
    ds.data.push(+avg.toFixed(3));
    if(ds.data.length>MAXPTS){ds.data.shift();}
  });

  defChart.update('none');
  atkChart.update('none');

  /* лог */
  const mark=success?'❌':'✅';
  log(`${mark} tick ${tick}: ${atk.name} vs ${def.name}  P=${ptxt}  → lvl ${def.level}`);

},1000);
