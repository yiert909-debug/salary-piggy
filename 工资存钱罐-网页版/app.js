'use strict';
const $=id=>document.getElementById(id),M=SalaryMath,STORAGE='salary-piggy-v1';
let configured=false,storageOK=true,hidden=false,lastBucket=null,fall=null,current=null;
let cfg={salary:10000,deduction:1500,start:'09:00',end:'18:00',days:[1,2,3,4,5],since:M.key(new Date()),coin:5,overrides:''};
try{const raw=localStorage.getItem(STORAGE);if(raw){cfg=M.validate(JSON.parse(raw));configured=true}}catch(e){storageOK=false}
const labels=['日','一','二','三','四','五','六'];
$('dayChecks').innerHTML=labels.map((x,i)=>`<label>${x}<input type="checkbox" name="day" value="${i}" aria-label="周${x}"></label>`).join('');
function toast(s){$('toast').textContent=s;$('toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('visible'),3500)}
function save(c){localStorage.setItem(STORAGE,JSON.stringify(c));storageOK=true;configured=true;cfg=c;lastBucket=null;render()}
function money(n,d=2){return hidden?'••••••':'¥ '+n.toLocaleString('zh-CN',{minimumFractionDigits:d,maximumFractionDigits:d})}
function render(){
 const now=new Date(),v=M.calculate(cfg,now);current=v;
 $('today').textContent=money(v.today,4);$('month').textContent=money(v.month);$('total').textContent=money(v.total);
 $('status').textContent=(v.active?'● 工作时段 · 正在积累':'○ 非工作时段 · 暂停累计')+(!configured?' · 示例':'');$('status').classList.toggle('off',!v.active);
 $('rate').textContent=`每秒 ${money(v.rate,6)} · 每小时 ${money(v.rate*3600)}`;
 $('date').textContent=now.toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
 $('monthDetail').textContent=`${now.getMonth()+1} 月预计扣款后 ${money(v.net)}`;$('sinceDetail').textContent=`自 ${cfg.since} 开始记录`;
 $('week').innerHTML=[1,2,3,4,5,6,0].map(i=>`<span class="${cfg.days.includes(i)?'on':''}">${labels[i]}</span>`).join('');
 $('hours').textContent=`${cfg.start} — ${cfg.end}`;$('timezone').textContent=Intl.DateTimeFormat().resolvedOptions().timeZone;
 $('next').textContent=v.active?'这段时间的努力，正在变成金币。':'休息也是生活的一部分，下个工作时段继续。';
 const percent=v.net?Math.max(0,v.month/v.net*100):0;$('percent').textContent=hidden?'••%':percent.toFixed(1)+'%';$('progress').style.width=Math.min(100,percent)+'%';
 $('coinCaption').textContent=`一枚金币 ≈ ${hidden?'••':cfg.coin} 元`;
 $('saveStatus').textContent=storageOK?(configured?'● 已保存在当前浏览器':'○ 示例数据 · 请先设置工资'):'⚠ 浏览器保存不可用，请导出备份';
 const bucket=Math.floor(v.month/cfg.coin);if(lastBucket!==null&&bucket>lastBucket&&!matchMedia('(prefers-reduced-motion: reduce)').matches)fall={start:performance.now(),seed:bucket};lastBucket=bucket;requestAnimationFrame(paint);
}
function openSettings(){const f=$('form');for(const k of ['salary','deduction','start','end','since','coin','overrides'])f.elements[k].value=cfg[k];for(const box of f.querySelectorAll('[name=day]'))box.checked=cfg.days.includes(Number(box.value));f.elements.since.max=M.key(new Date());$('demoNotice').textContent=configured?'修改设置会重算历史累计。建议先导出备份。':'首次使用显示示例工资，请填写你的实际数据。';$('formError').textContent='';$('settings').showModal()}
$('settingsBtn').onclick=openSettings;$('closeBtn').onclick=()=>$('settings').close();$('hideBtn').onclick=()=>{hidden=!hidden;$('hideBtn').textContent=hidden?'显示金额':'隐藏金额';render()};
$('form').onsubmit=e=>{e.preventDefault();try{const f=e.target;const c={};for(const k of ['salary','deduction','coin'])c[k]=Number(f.elements[k].value);for(const k of ['start','end','since','overrides'])c[k]=f.elements[k].value.trim();c.days=[...f.querySelectorAll('[name=day]:checked')].map(x=>Number(x.value));M.validate(c);save(c);$('settings').close();toast('已保存，开始积累每一秒的收获')}catch(err){$('formError').textContent=err.message}};
$('exportBtn').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(cfg,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='工资存钱罐备份-'+M.key(new Date())+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('备份含工资信息，请妥善保存')};
$('importBtn').onclick=()=>$('importFile').click();$('importFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>100000)throw Error('备份文件过大');const c=M.validate(JSON.parse(await file.text()));if(!confirm('导入将替换当前设置并重新计算累计，是否继续？'))return;save(c);$('settings').close();toast('备份已恢复')}catch(err){$('formError').textContent=err.message}finally{e.target.value=''}};
const ctx=$('coins').getContext('2d');
function coin(x,y,angle,scale=1){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,.64*scale);ctx.fillStyle='#94601d';ctx.beginPath();ctx.ellipse(0,5,23,23,0,0,Math.PI*2);ctx.fill();const g=ctx.createLinearGradient(-20,-20,20,20);g.addColorStop(0,'#fff0ac');g.addColorStop(.35,'#eac05f');g.addColorStop(.72,'#b77b28');g.addColorStop(1,'#f5d88b');ctx.fillStyle=g;ctx.strokeStyle='#fff0b4';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,23,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#ad772b';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#a16b23';ctx.font='bold 25px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('¥',0,1);ctx.restore()}
function paint(t){ctx.clearRect(0,0,900,600);const bucket=current?Math.floor(current.month/cfg.coin):0;const count=Math.min(72,bucket);for(let i=0;i<count;i++){const row=Math.floor(i/9),col=i%9;coin(230+col*43+row%2*14+(i*31%21)-10,450-row*30+(i*13%17)-8,(i*47%90-45)*Math.PI/180,.86+(i*17%25)/100)}if(fall){const p=(t-fall.start)/1100;if(p>=1)fall=null;else{const x=426+p*34,y=10+450*p*p;coin(x,y,p*5,1)}}if(fall)requestAnimationFrame(paint)}
render();setInterval(render,1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden){lastBucket=null;render()}});window.addEventListener('storage',e=>{if(e.key===STORAGE){try{if(e.newValue){cfg=M.validate(JSON.parse(e.newValue));configured=true;lastBucket=null;render()}}catch{toast('另一标签页的数据无法读取')}}});requestAnimationFrame(paint);
