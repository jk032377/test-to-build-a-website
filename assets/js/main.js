const toggle=document.getElementById('menuToggle');
const nav=document.getElementById('siteNav');
if(toggle&&nav){
  toggle.addEventListener('click',()=>{
    const open=nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded',String(open));
  });
}
const bar=document.getElementById('readingProgress');
if(bar){
  const update=()=>{
    const doc=document.documentElement;
    const max=doc.scrollHeight-doc.clientHeight;
    const pct=max>0?(doc.scrollTop/max)*100:0;
    bar.style.width=pct+'%';
  };
  document.addEventListener('scroll',update,{passive:true});
  update();
}
