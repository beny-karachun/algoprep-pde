import json, os
import pathlib; ROOT=str(pathlib.Path(__file__).resolve().parent.parent / 'site')
# The course's syllabus topics, in order: (slug, topic). The full title is "פרק N - topic".
CH=[
("ch-01-basic-concepts","מושגי יסוד"),
("ch-02-first-order","משוואות מסדר ראשון: שיטת האופיינים"),
("ch-03-second-order-classification","משוואות לינאריות מסדר שני: מיון וצורות קנוניות"),
("ch-04-wave-equation","משוואת הגלים: נוסחת דלמבר"),
("ch-05-sturm-liouville-fourier","בעיות שטורם-ליוביל וטורי פורייה"),
("ch-06-initial-boundary-problems","בעיות התחלה-שפה: הפרדת משתנים"),
("ch-07-laplace-poisson","משוואות לפלס ופואסון"),
]
def full_title(i,t): return f"פרק {i+1} - {t}"
BRAND="מד״ח מ׳"
HEAD='''<!doctype html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="/assets/theme.js"></script>
  <meta name="theme-color" content="#FAF9F5">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
{extra_pre}  <link rel="stylesheet" href="/assets/style.css">
{extra_css}  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossorigin="anonymous">
  <script src="/assets/config.js" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" crossorigin="anonymous" defer></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js" crossorigin="anonymous" defer></script>
  <script src="/assets/app.js" defer></script>
{extra_js}  <title>{title}</title>
  <meta name="description" content="{desc}">
</head>
<body{body}>
<a class="skip-link" href="#main">דילוג לתוכן</a>
<header class="site-header">
  <nav class="container nav" aria-label="ניווט ראשי">
    <a class="brand" href="/">'''+BRAND+'''</a>
    <div class="nav-links">
      <a class="nav-tutor" href="/tutor/">תרגול עם מורה AI</a><a href="/#chapters">הפרקים</a><a href="/formula-sheet.pdf">דף נוסחאות</a>
    </div>
    <div class="nav-tools">
      <button type="button" class="icon-button" data-theme-toggle>מצב כהה</button>
    </div>
  </nav>
{progress}</header>
'''
FOOT='''<footer class="site-footer"><div class="container footer-row"><a class="footer-brand" href="/">'''+BRAND+'''</a><a href="/tutor/">תרגול עם מורה AI</a><a href="/#chapters">לכל הפרקים</a><a href="/formula-sheet.pdf">דף נוסחאות (PDF)</a><a href="https://students.technion.ac.il/local/technionsearch/course/104228">דף הקורס 104228 באתר הטכניון</a></div><p class="container small">האתר הוא מיזם עצמאי ואינו אתר רשמי של הטכניון. ההתקדמות נשמרת בדפדפן במכשיר זה.</p></footer>
<noscript><p class="container callout">{ns}</p></noscript>
</body>
</html>
'''
NS_PAGE="יש להפעיל JavaScript להצגת נוסחאות, ספירה לבחינה ותרגול. פרקי הלימוד נמצאים ברשימה בעמוד הראשי."
DESC="הכנה למבחן במד״ח מ׳ (104228) בטכניון: משוואות דיפרנציאליות חלקיות. פרקי לימוד, שיטות פתרון ותרגול."
def head(title,body='',landing=False,desc=DESC):
    return HEAD.format(title=title,desc=desc,body=body,
      extra_pre='  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>\n' if landing else '',
      extra_css='  <link rel="stylesheet" href="/assets/landing.css">\n' if landing else '',
      extra_js='  <script src="/assets/landing.js" defer></script>\n  <script src="/assets/ascii.js" defer></script>\n' if landing else '',
      progress='  <span class="scroll-progress" aria-hidden="true"></span>\n' if landing else '')
def w(p,s):
    os.makedirs(os.path.dirname(p),exist_ok=True); open(p,'w').write(s)

# config.js
cfg={"timeZone":"Asia/Jerusalem","publicChapters":[],
 "exams":[{"date":"2027-02-24","time":None,"validity":"יש לאמת את מועד הבחינה מול לוח הבחינות הרשמי של הטכניון."},{"date":"2027-03-26","time":None,"validity":"יש לאמת את מועד הבחינה מול לוח הבחינות הרשמי של הטכניון."}],
 "chapters":[{"slug":s,"title_he":full_title(i,t),"order":i+1} for i,(s,t) in enumerate(CH)]}
w(ROOT+'/assets/config.js',"// Edit exam dates and the chapter list here only.\n// Exam dates: Moed A 2027-02-24, Moed B 2027-03-26 (CheeseFork, Winter 2026-27). No start time is published.\n// To add one: {\"date\": \"YYYY-MM-DD\", \"time\": null, \"validity\": \"...\"}. time null means local midnight; show days/hours only.\nwindow.TP_CONFIG = "+json.dumps(cfg,ensure_ascii=False,indent=2)+";\n")

# The course app at /tutor/ (exported from the Exam Mastery Studio). Its numbers and topic counts come from the
# course's exam analysis (16 past exams); update them when the course content is republished.
APP_STATS=[("16","מבחני עבר","תשפ״ב עד תשפ״ה"),("89","שאלות מנותחות","ממוינות לפי נושא"),("9","נושאים","לפי תדירות במבחן"),("231","נוסחאות","בשני דפי נוסחאות")]
EXAM_TOPICS=[("משוואות מסדר ראשון ושיטת האופיינים",18),("לפלס בקואורדינטות קוטביות ובעיית נוימן",15),("סיווג וצורה קנונית, סדר שני",13),("משוואת הגלים בקו האינסופי ובחצי הישר",13),("משוואת הגלים בתחום חסום",10),("לפלס במלבן, עקרון המקסימום ויחידות",8),("משוואת החום בתחום חסום",6),("משוואות הפתירות כמד״ר",5),("שטורם-ליוביל וטורי פורייה",1)]
VIDEO_ID="OwL3q933n2Y"
stats_html="\n".join(f'      <div class="fact"><strong>{n}</strong><span>{a}</span><small>{b}</small></div>' for n,a,b in APP_STATS)
top=max(c for _,c in EXAM_TOPICS)
topics_html="\n".join(f'        <li style="--w:{c/top:.3f}; --i:{i}"><span class="topic-name">{t}</span><span class="topic-bar" aria-hidden="true"><i></i></span><span class="topic-count">{f'{c} שאלות' if c > 1 else 'שאלה אחת'}</span></li>' for i,(t,c) in enumerate(EXAM_TOPICS))
HERO=r"""  <section class="hero" aria-labelledby="hero-title">
    <svg class="hero-curve" viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path pathLength="1" d="M0 300 C 120 300, 160 120, 280 120 S 440 330, 560 300 S 720 60, 860 80 S 1060 240, 1200 40"/>
    </svg>
    <div class="container hero-grid">
      <div class="hero-copy">
        <p class="eyebrow rise" style="--d:0">מד״ח מ׳ · 104228 · טכניון</p>
        <h1 id="hero-title"><span class="rise" style="--d:1">מתרגלים מד״ח</span> <em class="rise" style="--d:2">על מבחנים אמיתיים.</em></h1>
        <p class="lead rise" style="--d:3">מורה AI שמכיר את 16 מבחני העבר של הקורס. הוא יודע אילו שאלות חוזרות בכל מועד, נותן לכם דף נוסחאות מוכן, ומתרגל אתכם עליו עד שתמצאו כל נוסחה בשניות.</p>
        <div class="actions rise" style="--d:4">
          <a class="button button-lg" href="/tutor/">התחילו לתרגל בחינם <span class="arrow" aria-hidden="true">←</span></a>
          <a class="button secondary button-lg" href="#how">איך זה עובד</a>
        </div>
        <p class="hero-free rise" style="--d:5">התחברות עם Google · ניסיון חינם במורה ה-AI</p>
      </div>
      <div class="hero-video rise" style="--d:3">
        <div class="hero-art" aria-hidden="true"></div>
        <div class="video" data-yt="VIDEO">
          <a class="video-link" href="https://www.youtube.com/watch?v=VIDEO" target="_blank" rel="noopener">
            <img src="https://i.ytimg.com/vi/VIDEO/maxresdefault.jpg" alt="" width="1280" height="720">
            <span class="video-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg></span>
            <span class="sr-only">צפייה בסרטון: כל סוגי השאלות ב־32 דקות</span>
          </a>
        </div>
        <p class="hero-video-cap">סרטון · כל סוגי השאלות ב־32 דקות</p>
      </div>
    </div>
  </section>

  <section class="app-facts" aria-label="מה יש בפנים">
    <div class="container facts" data-reveal>
STATS
    </div>
  </section>

  <section class="section how" id="how" aria-labelledby="how-title">
    <div class="container how-grid">
      <div data-reveal>
        <p class="eyebrow">איך זה עובד</p>
        <h2 id="how-title">שאלה ממבחן, נוסחה בדף, הסבר במקום.</h2>
        <ol class="steps">
          <li><b>המורה שואל שאלה ממבחן אמיתי.</b> מתוך 16 מבחני העבר, לפי הנושאים שהכי חשוב לכם לחזק.</li>
          <li><b>אתם מקיפים את הנוסחה בדף.</b> מחזיקים את העכבר ומקיפים את הנוסחה שפותרת את השאלה. כך לומדים למצוא כל נוסחה מהר, כמו במבחן.</li>
          <li><b>מקבלים הסבר בדיוק במקום שטעיתם.</b> המורה מתקן את הדרך שלכם, לא מחליף אותה, וחוזר לנושא אחרי כמה סבבים.</li>
        </ol>
      </div>
      <figure class="demo" data-reveal aria-label="דוגמה לסבב תרגול">
        <div class="demo-q">
          <span class="demo-tag">שאלה ממבחן · תשפ״ב, מועד ג׳, חורף</span>
          <p>מצאו פתרון לבעיה $u_{tt}-4u_{xx}=0$ עבור $x,t>0$, עם התנאים $u(x,0)=x^2$, $u_t(x,0)=x^2$ ו־$u(0,t)=0$.</p>
          <p class="demo-ask">הקיפו בדף את הנוסחה שפותרת אותה.</p>
        </div>
        <div class="demo-sheet">
          <div class="demo-cell is-answer"><span>נוסחת ד׳אלמבר</span><div dir="ltr">$\displaystyle u=\tfrac{f(x+ct)+f(x-ct)}{2}+\tfrac{1}{2c}\int_{x-ct}^{x+ct}\! g$</div>
            <svg class="lasso" viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M152 8 C 230 4, 296 22, 294 52 C 292 84, 214 97, 140 95 C 62 93, 6 80, 7 50 C 8 20, 70 6, 160 9 C 190 10, 214 14, 232 20"/></svg></div>
          <div class="demo-cell"><span>משוואות האופיינים</span><div dir="ltr">$\displaystyle \tfrac{dx}{dt}=a,\ \tfrac{dy}{dt}=b,\ \tfrac{du}{dt}=c$</div></div>
          <div class="demo-cell"><span>לפלס בעיגול</span><div dir="ltr">$\displaystyle v=\sum_{n} r^n(A_n\cos n\theta+B_n\sin n\theta)$</div></div>
          <div class="demo-cell"><span>מד״ר לזמן, משוואת החום</span><div dir="ltr">$\displaystyle T_n'+k\lambda_n T_n=F_n$</div></div>
        </div>
        <figcaption class="demo-feedback"><b>נכון, 3.4 שניות.</b> חצי ישר עם $u(0,t)=0$: מרחיבים את $f$ ו־$g$ הרחבה אי־זוגית, ואז ד׳אלמבר עם $c=2$.</figcaption>
      </figure>
    </div>
  </section>

  <section class="section tools" aria-labelledby="tools-title">
    <div class="container">
      <div class="section-intro" data-reveal>
        <p class="eyebrow">מה יש בפנים</p>
        <h2 id="tools-title">כל מה שצריך לקראת המבחן, במקום אחד.</h2>
      </div>
      <div class="tool-grid">
        <article class="tool-card" data-reveal><h3>ניתוח המבחנים</h3><p>מה מופיע הכי הרבה, תבניות השאלות שחוזרות בכל מועד, והנוסחאות שחובה לדעת.</p></article>
        <article class="tool-card" data-reveal><h3>דף נוסחאות מוכן</h3><p>מסודר לפי סוגי השאלות במבחן ומוכן להדפסה. אפשר לבקש מהמורה להוסיף, להסיר או לסדר בו כל דבר.</p></article>
        <article class="tool-card" data-reveal><h3>תרגול מהיר</h3><p>מציאת נוסחאות בדף נגד השעון, או הקפת הנוסחאות ששאלה אמיתית צריכה. פתוח לכולם, בלי הגבלה.</p></article>
        <article class="tool-card" data-reveal><h3>מבחן עבר עם טיימר</h3><p>פותרים מבחן מלא בזמן אמת, מצלמים את הפתרון, והמורה בודק ומראה איפה הדרך השתבשה.</p></article>
      </div>
    </div>
  </section>

  <section class="section sheet-section" id="sheet" aria-labelledby="sheet-title">
    <div class="container sheet-grid">
      <div class="section-intro" data-reveal>
        <p class="eyebrow">דף הנוסחאות</p>
        <h2 id="sheet-title">5 עמודים, לפי סוגי השאלות.</h2>
        <p class="muted">כל סוג שאלה שמופיע במבחן: מילות המפתח שמזהות אותו, שלבי הפתרון והנוסחאות שצריך.</p>
        <div class="actions">
          <a class="button" href="/formula-sheet.pdf" target="_blank" rel="noopener">פתיחת ה-PDF</a>
          <a class="button secondary" href="/tutor/">תרגול על הדף</a>
        </div>
      </div>
      <figure class="sheet-frame" data-reveal>
        <figcaption class="sheet-bar"><span>PDE · מד״ח מ׳ · 5 עמודים</span><a href="/formula-sheet.pdf" download="PDE · מד״ח מ׳ · דף נוסחאות.pdf">הורדה</a></figcaption>
        <div class="sheet-pages" tabindex="0" aria-label="דף הנוסחאות, 5 עמודים">
          <img src="/assets/sheet/page-1.webp" alt="דף הנוסחאות, עמוד 1 מתוך 5" width="1800" height="2548">
          <img src="/assets/sheet/page-2.webp" alt="דף הנוסחאות, עמוד 2 מתוך 5" width="1800" height="2548" loading="lazy">
          <img src="/assets/sheet/page-3.webp" alt="דף הנוסחאות, עמוד 3 מתוך 5" width="1800" height="2548" loading="lazy">
          <img src="/assets/sheet/page-4.webp" alt="דף הנוסחאות, עמוד 4 מתוך 5" width="1800" height="2548" loading="lazy">
          <img src="/assets/sheet/page-5.webp" alt="דף הנוסחאות, עמוד 5 מתוך 5" width="1800" height="2548" loading="lazy">
        </div>
      </figure>
    </div>
  </section>

  <section class="section exam-topics" aria-labelledby="topics-title">
    <div class="container topics-grid">
      <div class="section-intro" data-reveal>
        <p class="eyebrow">מה חוזר במבחנים</p>
        <h2 id="topics-title">89 שאלות, 9 נושאים.</h2>
        <p class="muted">כל השאלות מ־16 מבחני העבר, לפי נושא. המורה מתרגל אתכם יותר על מה שמופיע יותר, ועל מה שעוד קשה לכם.</p>
      </div>
      <ol class="topic-bars" data-reveal>
TOPICS
      </ol>
    </div>
  </section>

  <section class="section countdown-section" aria-labelledby="countdown-title">
    <div class="container countdown-grid">
      <div class="section-intro" data-reveal>
        <p class="eyebrow">הבחינה</p>
        <h2 id="countdown-title">כמה זמן נשאר לתרגל.</h2>
        <p class="muted">הספירה למועד הבחינה הבא. כמה סבבים קצרים עם המורה בכל יום עד אז, וכל נוסחה בדף נמצאת בשניות.</p>
      </div>
      <aside class="countdown-card" data-reveal id="exam"><div data-countdown="home" aria-label="ספירה לבחינה הבאה"></div></aside>
    </div>
  </section>

  <section class="section start" aria-labelledby="start-title">
    <div class="container">
      <a class="calc-cta start-cta" href="/tutor/" data-reveal>
        <span><strong id="start-title">התחילו לתרגל בחינם</strong><span>התחברות עם Google. ניתוח המבחנים, דף הנוסחאות והתרגול המהיר פתוחים לכולם, ויש ניסיון חינם במורה ה-AI.</span></span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
      </a>
    </div>
  </section>

""".replace("STATS",stats_html).replace("TOPICS",topics_html).replace("VIDEO",VIDEO_ID)

toc="\n".join(f'              <li><a href="/chapters/{s}/"><span class="toc-n">{i+1:02d}</span><span class="toc-t">{t}</span><span class="toc-dots" aria-hidden="true"></span><span class="toc-tag upcoming">בקרוב</span></a></li>' for i,(s,t) in enumerate(CH))
index=head("מד״ח מ׳ · תרגול למבחן עם מורה AI (104228)",' class="home"',True,
  "הכנה למבחן במד״ח מ׳ (104228) בטכניון: 16 מבחני עבר מנותחים, דף נוסחאות ומורה AI שמתרגל אתכם על שאלות אמיתיות. ניסיון חינם.")+f'''<div class="ascii-backdrop" aria-hidden="true"><canvas data-ascii3d="backdrop"></canvas></div><div class="ascii-fade" aria-hidden="true"></div>
<main id="main" tabindex="-1">

{HERO}  <section class="section course" id="course" aria-labelledby="course-title">
    <div class="container">
      <div class="section-intro" data-reveal>
        <p class="eyebrow">פרקי לימוד</p>
        <h2 id="course-title">כל נושאי הסילבוס, בספר אחד.</h2>
        <p class="muted">{len(CH)} פרקים, אחד לכל נושא בסילבוס של קורס 104228, משיטת האופיינים ועד משוואת לפלס. הפרקים בהכנה; בינתיים כל החומר לתרגול נמצא <a href="/tutor/">אצל המורה ה-AI</a>.</p>
      </div>
      <div class="book-pin" data-book-pin><div class="book-pin-sticky">
      <div class="book-stage" id="chapters" tabindex="-1" aria-label="תוכן ענייני הקורס">
        <div class="book" data-book style="--p:0">
          <div class="book-page">
            <h3>תוכן העניינים</h3>
            <p class="toc-sub">{len(CH)} נושאים, לפי סדר הסילבוס</p>
            <ol class="toc">
{toc}
            </ol>
          </div>
          <div class="book-cover" aria-hidden="true">
            <div class="cover-front">
              <span class="cover-rule"></span>
              <span class="cover-title">מד״ח</span>
              <svg class="cover-mark" viewBox="0 0 120 60"><path d="M4 50 C 24 50, 30 10, 50 10 S 76 50, 96 44 S 112 20, 116 12"/></svg>
              <span class="cover-rule"></span>
            </div>
            <div class="cover-back"></div>
          </div>
        </div>
      </div>
      </div></div>
    </div>
  </section>

  <section class="section trick-section" aria-labelledby="trick-title">
    <div class="container trick-grid">
      <div data-reveal>
        <p class="eyebrow">שיטות שחוזרות</p>
        <h2 id="trick-title">פונקציה הרמונית שווה לממוצע שלה.</h2>
        <p class="muted trick-caption">עקרון הממוצע: הערך של פונקציה הרמונית במרכז עיגול שווה לממוצע ערכיה על שפת העיגול.</p>
        <a class="link-arrow" href="/tricks.html">לשיטות נוספות <span aria-hidden="true">←</span></a>
      </div>
      <div class="grow" data-grow style="--g:0">
        <div class="grow-line" dir="ltr">
          <span class="grow-expr">$\\displaystyle u(x_0,y_0)$</span>
          <span class="grow-result">$\\displaystyle =\\frac{{1}}{{2\\pi r}}\\oint_{{\\partial B_r}} u\\,ds$</span>
          <span class="grow-pen" aria-hidden="true"></span>
        </div>
      </div>
    </div>
  </section>
</main>
'''+FOOT.format(ns="יש להפעיל JavaScript להצגת נוסחאות וספירה לבחינה.")
w(ROOT+'/index.html',index)

for i,(s,t) in enumerate(CH):
    t=full_title(i,t)
    w(f'{ROOT}/chapters/{s}/index.html', head(f"{t} · מד״ח מ׳",f' data-chapter="{s}"')+f'''<main id="main" class="container" tabindex="-1">
  <section class="paper-panel coming-soon">
    <p class="breadcrumb"><a href="/">עמוד ראשי</a> / <a href="/#chapters">פרקי הקורס</a></p>
    <span class="badge" data-access-badge="{s}">בקרוב</span>
    <h1>{t}</h1>
    <p class="muted">תוכן זמני (placeholder): הפרק בהכנה. התוכן עדיין לא נכתב.</p>
    <div class="actions"><a class="button" href="/#chapters">לתוכן העניינים</a><a class="button secondary" href="/tricks.html">לשיטות הפתרון</a></div>
  </section>
</main>
'''+FOOT.format(ns=NS_PAGE))

w(ROOT+'/tricks.html', head("שיטות שחוזרות · מד״ח מ׳")+'''<main id="main" class="container" tabindex="-1">
  <section class="paper-panel coming-soon">
    <p class="breadcrumb"><a href="/">עמוד ראשי</a></p>
    <span class="badge">בקרוב</span>
    <h1>שיטות שחוזרות</h1>
    <p class="muted">תוכן זמני (placeholder): דף השיטות בהכנה. התוכן עדיין לא נכתב.</p>
    <div class="actions"><a class="button" href="/#chapters">לתוכן העניינים</a><a class="button secondary" href="/">לעמוד הראשי</a></div>
  </section>
</main>
'''+FOOT.format(ns=NS_PAGE))

w(ROOT+'/404.html', head("הדף לא נמצא · "+BRAND)+'''<main id="main" class="container" tabindex="-1">
  <section class="paper-panel coming-soon">
    <p class="eyebrow">404</p>
    <h1>הדף לא נמצא</h1>
    <p class="muted">ייתכן שהכתובת השתנתה. אפשר לחזור לתוכן העניינים ולבחור פרק.</p>
    <div class="actions"><a class="button" href="/#chapters">לפרקי הקורס</a><a class="button secondary" href="/">לעמוד הראשי</a></div>
  </section>
</main>
'''+FOOT.format(ns=NS_PAGE))
