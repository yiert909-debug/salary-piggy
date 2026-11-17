(function(root){
 'use strict';
 const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
 function date(s){const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)}
 function validate(c){
  if(!c||typeof c!=='object')throw Error('备份格式无效');
  for(const n of ['salary','deduction','coin'])if(typeof c[n]!=='number'||!Number.isFinite(c[n])||c[n]<0||c[n]>1e8)throw Error('请输入有效的工资和扣款金额');
  if(c.coin<.01)throw Error('金币金额至少为 0.01 元');
  for(const n of ['start','end'])if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(c[n]))throw Error('请输入有效的上下班时间');
  if(c.start===c.end)throw Error('上下班时间不能相同');
  if(!Array.isArray(c.days)||!c.days.length||c.days.some(x=>!Number.isInteger(x)||x<0||x>6))throw Error('请至少选择一个工作日');
  if(typeof c.since!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(c.since)||key(date(c.since))!==c.since||date(c.since).getFullYear()<2000||c.since>key(new Date()))throw Error('累计起始日期应在 2000 年至今天之间');
  if(typeof c.overrides!=='string'||c.overrides.length>30000)throw Error('特殊日期内容无效');
  parseOverrides(c.overrides);return c;
 }
 function parseOverrides(text){const out={};for(const line of text.split(/[;\r\n]+/)){if(!line.trim())continue;const m=line.trim().match(/^(\d{4}-\d{2}-\d{2})\s*=\s*(0(?:\.\d+)?|1(?:\.0+)?)$/);if(!m||key(date(m[1]))!==m[1])throw Error('特殊日期请按 yyyy-MM-dd=0 到 1 的比例填写');out[m[1]]=Number(m[2])}return out}
 function slot(d,c){const [h,m]=c.start.split(':').map(Number),[eh,em]=c.end.split(':').map(Number);const a=new Date(d.getFullYear(),d.getMonth(),d.getDate(),h,m);const b=new Date(d.getFullYear(),d.getMonth(),d.getDate(),eh,em);if(b<=a)b.setDate(b.getDate()+1);return [a,b]}
 function calculate(c,now=new Date()){
  const overrides=parseOverrides(c.overrides),since=date(c.since),zero=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  let total=0,today=0,month=0,rate=0,active=false,seconds=0,denominator=0;
  for(let mo=new Date(since.getFullYear(),since.getMonth(),1);mo<=now;mo=new Date(mo.getFullYear(),mo.getMonth()+1,1)){
   const next=new Date(mo.getFullYear(),mo.getMonth()+1,1);let denom=0,elapsed=0,daily=0;
   for(let d=new Date(mo);d<next;d.setDate(d.getDate()+1)){
    const [a,b]=slot(d,c),base=c.days.includes(d.getDay())?1:0,f=overrides[key(d)]??base;
    denom+=(b-a)/1000*base;
    if(d<since)continue;
    elapsed+=Math.max(0,Math.min(b-a,now-a))/1000*f;
    daily+=Math.max(0,Math.min(+b,+now)-Math.max(+a,+zero))/1000*f;
    if(now>=a&&now<b&&f>0)active=true;
   }
   const r=denom?Math.max(0,c.salary-c.deduction)/denom:0;
   total+=elapsed*r;today+=daily*r;
   if(mo.getFullYear()===now.getFullYear()&&mo.getMonth()===now.getMonth()){month=elapsed*r;rate=r;seconds=elapsed;denominator=denom}
  }
  return {total,today,month,rate,active,seconds,denominator,net:Math.max(0,c.salary-c.deduction)};
 }
 const api={key,date,validate,parseOverrides,calculate,slot};root.SalaryMath=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
