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

    if(value){
      url.searchParams.set('q',value);
    }else{
      url.searchParams.delete('q');
    }

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
  const nav=document.getElementById('readerTocNav');
  const box=document.getElementById('readerToc');
  if(!body||!nav||!box) return;
  const heads=[...body.querySelectorAll('h2,h3')];
  if(!heads.length){ box.hidden=true; return; }
  heads.forEach((h,i)=>{
    if(!h.id) h.id=slugifyHeading(h.textContent,i+1);
    const a=document.createElement('a');
    a.href='#'+h.id;
    a.textContent=h.textContent;
    a.className=h.tagName==='H3'?'toc-h3':'toc-h2';
    nav.appendChild(a);
  });
  const links=[...nav.querySelectorAll('a')];
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id));
      }
    });
  },{rootMargin:'-18% 0px -70% 0px'});
  heads.forEach(h=>obs.observe(h));
}
initReaderToc();

function initWritingEditor(){
  const area=document.getElementById('editorText');
  const outline=document.getElementById('editorOutline');
  if(!area||!outline) return;
  const title=document.getElementById('editorTitle');
  const status=document.getElementById('editorStatus');
  const recSearch=document.getElementById('editorRecommendSearch');
  const recResults=document.getElementById('editorRecommendResults');
  const storageKey='margin-editor-draft-v1';

  const saved=localStorage.getItem(storageKey);
  if(saved){
    try{
      const draft=JSON.parse(saved);
      area.value=draft.body||area.value;
      title.value=draft.title||'';
    }catch(e){}
  }

  function updateOutline(){
    const rows=area.value.split('\n');
    outline.innerHTML='';
    let found=0;
    let cursor=0;
    rows.forEach((line,index)=>{
      const m=line.match(/^(##|###)\s+(.+)/);
      const start=cursor;
      cursor+=line.length+1;
      if(!m) return;
      found++;
      const btn=document.createElement('button');
      btn.type='button';
      btn.textContent=m[2];
      btn.className=m[1]==='###'?'editor-outline-h3':'editor-outline-h2';
      btn.addEventListener('click',()=>{area.focus(); area.setSelectionRange(start,start);});
      outline.appendChild(btn);
    });
    if(!found) outline.innerHTML='<p>輸入 ## 或 ### 標題後，這裡會即時出現文章大綱。</p>';
  }

  function saveLocal(){
    localStorage.setItem(storageKey,JSON.stringify({title:title.value,body:area.value}));
    if(status){status.textContent='已自動儲存在這台瀏覽器';}
  }

  function insertText(before,after=''){
    const s=area.selectionStart,e=area.selectionEnd;
    const selected=area.value.slice(s,e);
    area.setRangeText(before+selected+after,s,e,'end');
    area.focus(); updateOutline(); saveLocal();
  }

  document.querySelectorAll('[data-editor-insert]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const type=btn.dataset.editorInsert;
      if(type==='h2') insertText('\n## ');
      if(type==='h3') insertText('\n### ');
      if(type==='highlight') insertText('<mark class="hl-yellow">','</mark>');
      if(type==='quote') insertText('\n> ');
    });
  });

  area.addEventListener('input',()=>{updateOutline();saveLocal();});
  title.addEventListener('input',saveLocal);

  const copyBtn=document.getElementById('editorCopy');
  if(copyBtn) copyBtn.addEventListener('click',async()=>{
    const front='---\nlayout: post\ntitle: "'+title.value.replaceAll('"','\\\"')+'"\ndescription: ""\ncategory: 未分類\ntone: sand\ncover_word: NOTE\n---\n\n';
    await navigator.clipboard.writeText(front+area.value);
    if(status) status.textContent='Markdown 已複製';
  });

  async function searchRecommendations(){
    const q=(recSearch.value||'').trim().toLowerCase();
    recResults.innerHTML='';
    if(!q) return;
    const base=document.body.dataset.baseurl||'';
    const posts=await fetch(base+'/search.json').then(r=>r.json());
    posts.filter(p=>[p.title,p.description,p.category].join(' ').toLowerCase().includes(q)).slice(0,6).forEach(p=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='editor-rec-result';
      b.innerHTML='<span>'+p.category+'</span><strong>'+p.title+'</strong>';
      b.addEventListener('click',()=>{
        const block='\n<aside class="inline-recommend"><a href="'+p.url+'"><span>推薦閱讀</span><strong>'+p.title+'</strong></a></aside>\n';
        insertText(block);
      });
      recResults.appendChild(b);
    });
  }
  if(recSearch) recSearch.addEventListener('input',searchRecommendations);
  updateOutline();
}
initWritingEditor();
