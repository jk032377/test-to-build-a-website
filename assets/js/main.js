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
