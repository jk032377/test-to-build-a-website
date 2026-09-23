const toggle=document.getElementById('menuToggle');
const nav=document.getElementById('siteNav');

if(toggle&&nav){
  toggle.addEventListener('click',()=>{
    const open=nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded',String(open));
  });
}

const bar=document.getElementById('readingProgress');
const backToTop=document.getElementById('backToTop');

function updateScrollUI(){
  const doc=document.documentElement;
  const max=doc.scrollHeight-doc.clientHeight;
  const pct=max>0?(doc.scrollTop/max)*100:0;
  if(bar) bar.style.width=pct+'%';
  if(backToTop) backToTop.classList.toggle('show',doc.scrollTop>520);
}
document.addEventListener('scroll',updateScrollUI,{passive:true});
updateScrollUI();

if(backToTop){
  backToTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
}

const searchForm=document.getElementById('searchForm');
const searchInput=document.getElementById('searchInput');
const searchResults=document.getElementById('searchResults');
const searchStatus=document.getElementById('searchStatus');

async function runSearch(keyword){
  if(!searchResults||!searchStatus) return;
  const term=(keyword||'').trim().toLowerCase();
  if(!term){
    searchStatus.textContent='請輸入關鍵字開始搜尋。';
    searchResults.innerHTML='';
    return;
  }

  searchStatus.textContent='搜尋中…';
  try{
    const base=document.body.dataset.baseurl||'';
    const res=await fetch(`${base}/search.json`);
    const posts=await res.json();
    const matched=posts.filter(post=>{
      const bag=[post.title,post.description,post.category,post.content].join(' ').toLowerCase();
      return bag.includes(term);
    });

    if(!matched.length){
      searchStatus.textContent=`找不到與「${keyword}」相關的文章。`;
      searchResults.innerHTML='';
      return;
    }

    searchStatus.textContent=`找到 ${matched.length} 篇與「${keyword}」相關的文章。`;
    searchResults.innerHTML=matched.map(post=>`
      <a class="search-card" href="${post.url}">
        <div class="card-meta">${post.category} · ${post.date}</div>
        <h2>${post.title}</h2>
        <p>${post.description || ''}</p>
      </a>
    `).join('');
  }catch(err){
    searchStatus.textContent='搜尋資料載入失敗，請稍後再試。';
  }
}

if(searchForm&&searchInput){
  const params=new URLSearchParams(window.location.search);
  const initial=params.get('q')||'';
  if(initial){
    searchInput.value=initial;
    runSearch(initial);
  }

  searchForm.addEventListener('submit',(e)=>{
    e.preventDefault();
    const value=searchInput.value.trim();
    const url=new URL(window.location.href);
    if(value) url.searchParams.set('q',value);
    else url.searchParams.delete('q');
    window.history.replaceState({},'',url);
    runSearch(value);
  });
}

function slugifyHeading(text,index){
  const clean=(text||'').trim().toLowerCase()
    .replace(/\s+/g,'-')
    .replace(/[^\u4e00-\u9fff\w-]/g,'');
  return clean || 'section-'+index;
}

function initReaderToc(){
  const body=document.getElementById('postBody');
  const tocNav=document.getElementById('readerTocNav');
  const box=document.getElementById('readerToc');
  if(!body||!tocNav||!box) return;

  const heads=[...body.querySelectorAll('h2,h3,h4')];
  if(!heads.length){
    box.hidden=true;
    return;
  }

  heads.forEach((h,i)=>{
    if(!h.id) h.id=slugifyHeading(h.textContent,i+1);
    const a=document.createElement('a');
    a.href='#'+h.id;
    a.textContent=h.textContent;
    a.className='toc-'+h.tagName.toLowerCase();
    tocNav.appendChild(a);
  });

  const links=[...tocNav.querySelectorAll('a')];
  let activeId=heads[0]?.id;

  function setActive(id){
    if(!id||id===activeId) return;
    activeId=id;
    links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+id));
  }

  if(links[0]) links[0].classList.add('active');

  const obs=new IntersectionObserver(entries=>{
    const visible=entries
      .filter(entry=>entry.isIntersecting)
      .sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);
    if(visible[0]) setActive(visible[0].target.id);
  },{rootMargin:'-16% 0px -72% 0px',threshold:[0,1]});

  heads.forEach(h=>obs.observe(h));
}
initReaderToc();
