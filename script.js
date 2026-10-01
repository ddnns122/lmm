const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const menuBtn=$('#menuBtn'), mobileMenu=$('#mobileMenu'), dockMenu=$('.dock-menu'), dockItems=$$('.dock-item');
function toggleMenu(force){const open=force ?? !mobileMenu.classList.contains('open'); mobileMenu.classList.toggle('open',open); menuBtn.classList.toggle('open',open); menuBtn.setAttribute('aria-expanded',String(open)); mobileMenu.setAttribute('aria-hidden',String(!open)); document.body.classList.toggle('menu-open',open)}
menuBtn?.addEventListener('click',()=>toggleMenu()); dockMenu?.addEventListener('click',()=>toggleMenu()); $$('#mobileMenu a').forEach(a=>a.addEventListener('click',()=>toggleMenu(false)));

const slides=$$('.slide'),dots=$$('.dot'); let index=0, timer;
function show(i){if(!slides.length)return; index=(i+slides.length)%slides.length; slides.forEach((s,n)=>s.classList.toggle('active',n===index)); dots.forEach((d,n)=>{d.classList.toggle('active',n===index);d.setAttribute('aria-selected',String(n===index))})}
function restart(){clearInterval(timer);timer=setInterval(()=>show(index+1),4500)}
dots.forEach((d,i)=>d.addEventListener('click',()=>{show(i);restart()})); $('.prev')?.addEventListener('click',()=>{show(index-1);restart()}); $('.next')?.addEventListener('click',()=>{show(index+1);restart()});
const slider=$('#slider'); let startX=0,startY=0,moved=false;
slider?.addEventListener('touchstart',e=>{const t=e.changedTouches[0];startX=t.clientX;startY=t.clientY;moved=false},{passive:true});
slider?.addEventListener('touchmove',e=>{const t=e.changedTouches[0]; if(Math.abs(t.clientX-startX)>10)moved=true},{passive:true});
slider?.addEventListener('touchend',e=>{const t=e.changedTouches[0],dx=t.clientX-startX,dy=t.clientY-startY;if(moved&&Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){show(index+(dx<0?1:-1));restart()}},{passive:true}); restart();

const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('visible')),{threshold:.12}); $$('.reveal').forEach(e=>io.observe(e));
const progress=$('.progress span');
function onScroll(){const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max>0?scrollY/max*100:0)+'%';const y=scrollY+innerHeight*.35;let active='#top';$$('main section[id],footer[id]').forEach(s=>{if(s.offsetTop<=y)active='#'+s.id});dockItems.forEach(a=>{if(a.tagName==='A')a.classList.toggle('active',a.getAttribute('href')===active||(active==='#top'&&a.getAttribute('href')==='#top'))})}
addEventListener('scroll',onScroll,{passive:true});onScroll();

// 手机端卡片轻触反馈 + 鼠标/触控的微型倾斜效果
const cards=$$('.touch-cards article'); cards.forEach(card=>{card.addEventListener('click',()=>{if(matchMedia('(max-width:800px)').matches){card.classList.add('tapped');setTimeout(()=>card.classList.remove('tapped'),180)}});card.addEventListener('pointermove',e=>{if(!matchMedia('(hover:hover)').matches)return;const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform=`perspective(700px) rotateX(${y*-3}deg) rotateY(${x*3}deg) translateY(-5px)`});card.addEventListener('pointerleave',()=>card.style.transform='')});

const toast=$('#toast');let toastTimer;function say(msg){clearTimeout(toastTimer);toast.textContent=msg;toast.classList.add('show');toastTimer=setTimeout(()=>toast.classList.remove('show'),1600)}
// 在移动端双击顶部徽标快速回到首页
let lastTap=0;$('.logo')?.addEventListener('click',e=>{const now=Date.now();if(now-lastTap<320){e.preventDefault();scrollTo({top:0,behavior:'smooth'});say('已回到深海首页');}lastTap=now});


// 四大赛事展开/收起：点击、键盘 Enter/空格均可操作；同一时间只展开一个模块
const eventCards=$$('.event-card');
function setEvent(card, open){
  card.classList.toggle('is-open',open);
  card.setAttribute('aria-expanded',String(open));
  const btn=$('.event-toggle',card);
  btn?.setAttribute('aria-expanded',String(open));
}
eventCards.forEach(card=>{
  const btn=$('.event-toggle',card);
  btn?.addEventListener('click',()=>{
    const open=!card.classList.contains('is-open');
    eventCards.forEach(c=>setEvent(c,false));
    if(open)setEvent(card,true);
  });
  card.addEventListener('keydown',e=>{
    if(e.target!==card || (e.key!=='Enter' && e.key!==' ')) return;
    e.preventDefault(); btn?.click();
  });
});


// 联系我们展开/收起
const contactSection=$('#contact'), contactToggle=$('.contact-toggle',contactSection), contactDetail=$('#contactDetail');
contactToggle?.addEventListener('click',()=>{
  const open=!contactSection.classList.contains('is-open');
  contactSection.classList.toggle('is-open',open);
  contactToggle.setAttribute('aria-expanded',String(open));
  contactToggle.setAttribute('aria-label',open?'收起联系我们':'展开联系我们');
  contactDetail?.setAttribute('aria-hidden',String(!open));
});

// 成立时间轴：只有用户滚动进入视口后才从 1960 动画到 2016，并只播放一次。
const historySection=$('#history');
const historyYear=$('.history-year',historySection);
if(historySection&&historyYear){
  const startYear=Number(historyYear.dataset.start)||1960;
  const endYear=Number(historyYear.dataset.end)||2016;
  let historyStarted=false;
  let historyFrame=0;
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finishHistory=()=>{
    cancelAnimationFrame(historyFrame);
    historyYear.textContent=String(endYear);
    historySection.classList.remove('is-running');
    historySection.classList.add('is-finished');
  };
  const startHistory=()=>{
    if(historyStarted)return;
    historyStarted=true;
    if(reduceMotion){finishHistory();return;}
    historySection.classList.add('is-running');
    const duration=4200;
    let startedAt=null;
    const easeOut=t=>1-Math.pow(1-t,3);
    const tick=now=>{
      if(startedAt===null)startedAt=now;
      const progress=Math.min((now-startedAt)/duration,1);
      const value=Math.round(startYear+(endYear-startYear)*easeOut(progress));
      historyYear.textContent=String(value);
      if(progress<1){historyFrame=requestAnimationFrame(tick);}else{finishHistory();}
    };
    historyFrame=requestAnimationFrame(tick);
  };
  if('IntersectionObserver' in window){
    const historyObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){startHistory();historyObserver.disconnect();}});
    },{threshold:.28});
    historyObserver.observe(historySection);
  }else{
    startHistory();
  }
}
