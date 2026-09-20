/* assets.png is expected to use 32×32 tiles; edit only the CSS positions if your sheet differs. */
const SAVE_KEY = "wildernessHunterRpg_v1";
const MATERIALS = {
  meat: { name: "짐승 고기", icon: "meat-icon" }, leather: { name: "가죽", icon: "leather-icon" },
  fang: { name: "날카로운 송곳니", icon: "fang-icon" }, iron: { name: "철광석", icon: "iron-icon" }
};
const GROUNDS = {
  1: { name:"숲 가장자리", description:"토끼와 여우의 흔적이 이어지는 안전한 사냥터입니다.", animals:[{name:"토끼",icon:"rabbit-icon"},{name:"여우",icon:"fox-icon"}], cooldown:5000, success:0.88, rewards:["meat","leather"] },
  2: { name:"안개 낀 침엽수림", description:"늑대와 곰이 지배하는 위험한 숲입니다. 좋은 무기를 준비하세요.", animals:[{name:"늑대",icon:"wolf-icon"},{name:"곰",icon:"bear-icon"}], cooldown:8000, success:0.58, rewards:["meat","leather","fang","iron"] }
};
const RECIPES = [
  { id:"leatherArmor", name:"보강 가죽 갑옷", icon:"boot-icon", text:"거친 가죽을 덧대어 추적 시간을 줄입니다.", costs:{leather:5,meat:2}, gear:"보강 가죽 갑옷", speed:.22 },
  { id:"ironSpear", name:"철제 창", icon:"weapon-icon", text:"2단계 사냥터를 열고 사냥 성공률을 올립니다.", costs:{leather:4,fang:2,iron:3}, weapon:"철제 창", success:.25, unlock:2 },
  { id:"hunterBow", name:"사냥꾼의 활", icon:"weapon-icon", text:"가벼운 활로 추적과 사냥의 효율을 높입니다.", costs:{leather:8,fang:4,iron:2}, weapon:"사냥꾼의 활", success:.15, speed:.12 }
];
const defaultState = () => ({ materials:{meat:0,leather:0,fang:0,iron:0}, weapon:"기본 활", gear:"낡은 가죽 갑옷", crafted:[], unlockedTier:1, selectedTier:1, nextHuntAt:0 });
let state;
try { state = { ...defaultState(), ...JSON.parse(localStorage.getItem(SAVE_KEY)), materials:{...defaultState().materials,...JSON.parse(localStorage.getItem(SAVE_KEY))?.materials} }; } catch { state = defaultState(); }
const $ = id => document.getElementById(id);
function save() { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
function bonuses() { return RECIPES.filter(r => state.crafted.includes(r.id)).reduce((a,r) => ({success:a.success+(r.success||0),speed:a.speed+(r.speed||0)}), {success:0,speed:0}); }
function currentGround() { return GROUNDS[state.selectedTier]; }
function render() {
  const bonus=bonuses(), ground=currentGround();
  $("equippedWeapon").textContent=state.weapon; $("equippedGear").textContent=state.gear;
  $("weaponBonus").textContent=`성공률 +${Math.round(bonus.success*100)}%`; $("gearBonus").textContent=`사냥 시간 -${Math.round(bonus.speed*100)}%`;
  $("unlockedTier").textContent=`${state.unlockedTier}단계 · ${GROUNDS[state.unlockedTier].name}`; $("bestTier").textContent=`최고 티어: ${state.unlockedTier}`;
  $("levelText").textContent=state.unlockedTier === 2 ? "숲의 추적자" : "견습 사냥꾼";
  $("groundName").textContent=ground.name; $("groundDescription").textContent=ground.description; $("tierMark").textContent=`TIER ${state.selectedTier}`;
  $("groundTabs").innerHTML=Object.keys(GROUNDS).map(tier=>`<button class="ground-tab ${+tier===state.selectedTier?"active":""}" data-tier="${tier}" ${+tier>state.unlockedTier?"disabled":""}>${tier}단계 ${+tier>state.unlockedTier?"(잠김)":""}</button>`).join("");
  document.querySelectorAll(".ground-tab").forEach(b=>b.addEventListener("click",()=>{ state.selectedTier=+b.dataset.tier; save(); render(); }));
  $("animalRow").innerHTML=ground.animals.map(a=>`<div class="animal"><span class="sprite ${a.icon}"></span>${a.name}<small>추적 가능</small></div>`).join("");
  $("inventoryList").innerHTML=Object.entries(MATERIALS).map(([id,item])=>`<div class="inventory-item"><span class="sprite ${item.icon}"></span><span>${item.name}</span><b>× ${state.materials[id]}</b></div>`).join("");
  $("recipeGrid").innerHTML=RECIPES.map(r=>{ const made=state.crafted.includes(r.id), enough=Object.entries(r.costs).every(([m,n])=>state.materials[m]>=n); const costs=Object.entries(r.costs).map(([m,n])=>`${MATERIALS[m].name} ${state.materials[m]}/${n}`).join("<br>"); return `<article class="recipe"><h3><span class="sprite ${r.icon}"></span>${r.name}</h3><p>${r.text}</p><div class="cost">${costs}</div><button class="plank-button craft" data-id="${r.id}" ${made||!enough?"disabled":""}>${made?"제작 완료":!enough?"재료 부족":"제작 후 장착"}</button></article>`; }).join("");
  document.querySelectorAll(".craft").forEach(b=>b.addEventListener("click",()=>craft(b.dataset.id)));
  updateCooldown();
}
function hunt() { const now=Date.now(); if(now<state.nextHuntAt) return; const g=currentGround(), b=bonuses(), chance=Math.min(.97,g.success+b.success); const cooldown=Math.round(g.cooldown*(1-b.speed)); state.nextHuntAt=now+cooldown; if(Math.random()<=chance) { const reward=g.rewards[Math.floor(Math.random()*g.rewards.length)]; const amount=Math.random()<.2?2:1; state.materials[reward]+=amount; $("huntResult").textContent=`사냥 성공! ${MATERIALS[reward].name} × ${amount}을(를) 획득했습니다.`; } else { $("huntResult").textContent="먹잇감이 흔적을 감췄습니다. 다음 추적을 준비하세요."; } save(); render(); }
function craft(id) { const r=RECIPES.find(x=>x.id===id); if(!r || state.crafted.includes(id)) return; if(!Object.entries(r.costs).every(([m,n])=>state.materials[m]>=n)) return; Object.entries(r.costs).forEach(([m,n])=>state.materials[m]-=n); state.crafted.push(id); if(r.weapon) state.weapon=r.weapon; if(r.gear) state.gear=r.gear; if(r.unlock) { state.unlockedTier=Math.max(state.unlockedTier,r.unlock); state.selectedTier=r.unlock; } $("huntResult").textContent=`${r.name} 제작 완료! 새로운 힘으로 황야에 나서세요.`; save(); render(); }
function updateCooldown() { const remain=Math.max(0,state.nextHuntAt-Date.now()), total=Math.round(currentGround().cooldown*(1-bonuses().speed)); $("huntButton").disabled=remain>0; $("cooldownText").textContent=remain?`${Math.ceil(remain/1000)}초`:"준비 완료"; $("cooldownBar").style.width=`${remain?(1-remain/total)*100:100}%`; }
$("huntButton").addEventListener("click",hunt); $("resetButton").addEventListener("click",()=>{ if(confirm("모든 사냥 기록과 재료를 초기화할까요?")){ state=defaultState(); save(); $("huntResult").textContent="새 사냥꾼의 여정이 시작됩니다."; render(); }});
setInterval(updateCooldown,200); render();
