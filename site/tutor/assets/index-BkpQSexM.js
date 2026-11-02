import{a as e,i as t,t as n}from"./initials-C3Tklqxn.js";var r=window.matchMedia(`(prefers-reduced-motion: reduce)`).matches;function i(e=document){let t=new IntersectionObserver(e=>{for(let n of e)n.isIntersecting&&(n.target.classList.add(`in`),t.unobserve(n.target))},{rootMargin:`0px 0px -8% 0px`});e.querySelectorAll(`.reveal`).forEach((e,n)=>{e.style.setProperty(`--delay`,`${n%3*90}ms`),r?e.classList.add(`in`):t.observe(e)})}function a(){let e=document.querySelector(`.demo`);if(!e)return;if(r)return e.classList.add(`play`,`static`);let t=()=>{e.classList.remove(`play`),e.offsetWidth,e.classList.add(`play`)};setTimeout(t,400),setInterval(t,7e3)}var o=t=>e.renderToString(t,{throwOnError:!1}),s=e=>e.replace(/[&<>"]/g,e=>`&#${e.charCodeAt(0)};`),c=e=>e.split(/(\$[^$]+\$)/).map(e=>e.startsWith(`$`)&&e.endsWith(`$`)&&e.length>2?o(e.slice(1,-1)):s(e)).join(``),l={en:{open:`Open the course`,seeSheet:`See the formula sheet`,headline:e=>`${s(e)}, <span class="accent">ready for the exam.</span>`,lede:`The past exams are analysed, the formula sheet is built from them, and an AI tutor practises them with you until you know what’s coming and where every formula is.`,stats:{exams:`past exams analysed`,questions:`exam questions sorted by topic`,formulas:`formulas on the sheet`,topics:`topics mapped`},inside:`What’s inside`,sheet:`The formula sheet`,s1:`What comes up`,h1:`Know where the points are before you start`,p1:`Every question from the past exams is tagged by topic and by the method that solves it, so you spend your time on what’s actually asked.`,types:`Question types that keep coming back`,shares:`Share of exam questions by topic`,s2:`The formula sheet`,h2:`A sheet built from the exams, not the textbook`,p2:`Grouped by topic and ordered by how often each formula is needed. Print it for the exam, or make it yours: the tutor edits it on request.`,more:e=>`+ ${e} more formulas in the course`,s3:`Practise`,h3:`Drill until you find every formula in seconds`,p3:`The tutor asks, you circle the answer on your sheet. It explains, gives hints and full worked solutions, and brings back what you miss until you get it right.`,bullets:[`An AI tutor that knows this course’s exams`,`Step-by-step solutions to the past exam questions`,`Hebrew and English`],asks:`The drill asks`,find:e=>`Where is <b>${c(e)}</b> on your sheet?`,circled:`You circle it on your sheet`,correct:`✓ Correct · 3.2 seconds`,how:`How it works`,steps:[`Sign in with Google and get the course.`,`Practise with the tutor and drill the formula sheet.`,`Walk into the exam knowing what’s coming and where everything is.`],final:e=>`${s(e)}, <span class="accent">from past exams to exam-ready.</span>`,progress:`Your progress stays in your browser`},he:{open:`לפתיחת הקורס`,seeSheet:`לדף הנוסחאות`,headline:e=>`${s(e)}, <span class="accent">מוכנים למבחן.</span>`,lede:`מבחני העבר מנותחים, דף הנוסחאות בנוי מהם, ומורה AI מתרגל אותם איתכם עד שתדעו מה מגיע ואיפה כל נוסחה.`,stats:{exams:`מבחני עבר נותחו`,questions:`שאלות ממוינות לפי נושא`,formulas:`נוסחאות בדף`,topics:`נושאים`},inside:`מה בפנים`,sheet:`דף הנוסחאות`,s1:`מה שואלים`,h1:`דעו איפה הנקודות לפני שמתחילים`,p1:`כל שאלה ממבחני העבר מתויגת לפי נושא ולפי השיטה שפותרת אותה, כך שאתם משקיעים במה שבאמת נשאל.`,types:`סוגי שאלות שחוזרים שוב ושוב`,shares:`חלק השאלות לפי נושא`,s2:`דף הנוסחאות`,h2:`דף שנבנה מהמבחנים, לא מהספר`,p2:`מסודר לפי נושאים ולפי כמה כל נוסחה נדרשת. הדפיסו אותו למבחן, או התאימו אותו לעצמכם: המורה עורך אותו לפי בקשה.`,more:e=>`+ עוד ${e} נוסחאות בקורס`,s3:`תרגול`,h3:`תרגלו עד שתמצאו כל נוסחה בשניות`,p3:`המורה שואל, ואתם מקיפים את התשובה בדף. הוא מסביר, נותן רמזים ופתרונות מלאים, ומחזיר את מה שפספסתם עד שתצליחו.`,bullets:[`מורה AI שמכיר את המבחנים של הקורס`,`פתרונות מלאים, צעד אחר צעד, לשאלות ממבחני העבר`,`עברית ואנגלית`],asks:`התרגול שואל`,find:e=>`איפה <b>${c(e)}</b> בדף שלכם?`,circled:`אתם מקיפים אותה בדף`,correct:`✓ נכון · 3.2 שניות`,how:`איך זה עובד`,steps:[`מתחברים עם Google ורוכשים את הקורס.`,`מתרגלים עם המורה ועם דף הנוסחאות.`,`נכנסים למבחן ויודעים מה מגיע ואיפה כל דבר.`],final:e=>`${s(e)}, <span class="accent">ממבחני עבר למוכנות מלאה.</span>`,progress:`ההתקדמות שלכם נשמרת בדפדפן`}};function u(){if(!new URLSearchParams(location.search).has(`preview`))return null;try{return JSON.parse(localStorage.getItem(`site-preview`)??`null`)}catch{return null}}function d(e){let t=e.site??{brand:e.name,accent:`#2445a8`,lang:`en`},r=l[t.lang]??l.en;document.documentElement.lang=t.lang,document.documentElement.dir=t.lang===`he`?`rtl`:`ltr`,/^#[0-9a-f]{6}$/i.test(t.accent)&&(document.documentElement.style.setProperty(`--accent`,t.accent),document.documentElement.style.setProperty(`--accent-soft`,`color-mix(in srgb, ${t.accent} 12%, var(--bg))`)),u()&&(document.title=`${e.name} · ${t.brand}`);let d=e.stats,p=e.topics.slice(0,6),m=Math.max(...p.map(e=>e.share),.01),h=e.sheet.slice(0,4),g=e=>`<div class="a4-col">${e.map(e=>`<p class="a4-sec">${c(e.title)}</p>${e.items.slice(0,4).map(e=>`<div class="a4-row"><span>${c(e.label)}</span><span>${o(e.latex)}</span></div>`).join(``)}`).join(``)}</div>`,_=h.reduce((e,t)=>e+Math.min(4,t.items.length),0),v=e.sheet.flatMap(e=>e.items).slice(0,4),y=v[2]??v[0],b=s(n(t.brand));document.getElementById(`page`).innerHTML=`
    <header class="nav">
      <div class="wrap nav-inner">
        <a class="brand" href="./"><span class="site-mark">${b}</span>${s(t.brand)}</a>
        <nav class="nav-links"><a href="#inside">${r.inside}</a><a href="#sheet">${r.sheet}</a></nav>
        <a class="btn btn-sm" href="study/">${r.open}</a>
      </div>
    </header>
    <main>
      <section class="hero wrap">
        ${e.subtitle?`<p class="pill">${s(e.subtitle)}</p>`:``}
        <h1>${t.headline?s(t.headline):r.headline(e.name)}</h1>
        <p class="lede">${s(t.lede||r.lede)}</p>
        <div class="cta-row">
          <a class="btn" href="study/">${r.open}</a>
          <a class="btn btn-ghost" href="#sheet">${r.seeSheet}</a>
        </div>
        <p class="price-note" data-price hidden></p>
        <dl class="stats">
          <div><dt>${r.stats.exams}</dt><dd>${d.exams}</dd></div>
          <div><dt>${r.stats.questions}</dt><dd>${d.questions}</dd></div>
          <div><dt>${r.stats.formulas}</dt><dd>${d.formulas}</dd></div>
          <div><dt>${r.stats.topics}</dt><dd>${d.topics}</dd></div>
        </dl>
      </section>
      <section class="features wrap" id="inside">
        <article class="feature reveal">
          <div class="feature-copy">
            <span class="step">${r.s1}</span>
            <h2>${r.h1}</h2>
            <p>${r.p1}</p>
            ${e.templates.length?`<p class="types-label">${r.types}</p><ul data-templates>${e.templates.slice(0,4).map(e=>`<li><b>${c(e.name)}</b><span>${c(e.description)}</span></li>`).join(``)}</ul>`:``}
          </div>
          <div class="feature-visual"><div class="panel">
            <p class="panel-label first">${r.shares}</p>
            <div class="bars">${p.map(e=>`<div><span>${c(e.topic)}</span><i style="--w:${(e.share/m*100).toFixed(1)}%"></i><em>${Math.round(e.share*100)}%</em></div>`).join(``)}</div>
          </div></div>
        </article>
        <article class="feature reverse reveal" id="sheet">
          <div class="feature-copy">
            <span class="step">${r.s2}</span>
            <h2>${r.h2}</h2>
            <p>${r.p2}</p>
          </div>
          <div class="feature-visual">
            <div class="a4" dir="auto">${g(h.slice(0,2))}${g(h.slice(2,4))}</div>
            <p class="sheet-more">${d.formulas-_>0?r.more(d.formulas-_):``}</p>
          </div>
        </article>
        <article class="feature reveal">
          <div class="feature-copy">
            <span class="step">${r.s3}</span>
            <h2>${r.h3}</h2>
            <p>${r.p3}</p>
            <ul>${r.bullets.map(e=>`<li>${e}</li>`).join(``)}</ul>
          </div>
          <div class="feature-visual">
            ${y?`<div class="demo panel">
              <p class="demo-step"><span>${r.asks}</span>${r.find(y.label)}</p>
              <div class="sheet" dir="auto">${v.map(e=>e===y?`<div class="sh-row"><span>${c(e.label)}</span><span class="circled"><span>${o(e.latex)}</span><svg class="lasso" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M82 10 C 62 -2, 20 2, 8 18 C -2 32, 10 52, 42 56 C 74 60, 98 46, 96 28 C 95 16, 84 8, 64 8" /></svg></span></div>`:`<div class="sh-row"><span>${c(e.label)}</span><span>${o(e.latex)}</span></div>`).join(``)}</div>
              <p class="demo-step after"><span>${r.circled}</span><b class="found">${r.correct}</b></p>
            </div>`:``}
          </div>
        </article>
      </section>
      <section class="how wrap" id="how">
        <h2 class="section-title reveal">${r.how}</h2>
        <ol>${r.steps.map((e,t)=>`<li class="reveal"><span>${t+1}</span>${e}</li>`).join(``)}</ol>
      </section>
      <section class="final wrap reveal">
        <h2>${r.final(e.name)}</h2>
        <a class="btn" href="study/">${r.open}</a>
      </section>
    </main>
    <footer class="foot">
      <div class="wrap foot-inner">
        <span>© ${new Date().getFullYear()} ${s(t.brand)}${t.contact?` · ${s(t.contact)}`:``}</span>
        <span>${r.progress}</span>
      </div>
    </footer>`,i(),a(),e.backend&&f(e)}async function f(e){try{let t=await fetch(`${e.backend.url.replace(/\/+$/,``)}/functions/v1/course?site=${encodeURIComponent(e.slug)}`,{headers:{apikey:e.backend.key}}),n=t.ok?(await t.json()).course?.price:null,r=document.querySelector(`[data-price]`);n&&r&&(r.textContent=n,r.hidden=!1)}catch{}}var p=u();(p?Promise.resolve(p):t(`./`)).then(d).catch(e=>{document.getElementById(`page`).innerHTML=`<p style="padding:40px;text-align:center">${s(String(e?.message??e))}</p>`});