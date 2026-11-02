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
      <a href="/#chapters">הפרקים</a><a href="/tricks.html">שיטות</a>
    </div>
    <div class="nav-tools">
      <button type="button" class="icon-button" data-theme-toggle>מצב כהה</button>
    </div>
  </nav>
{progress}</header>
'''
FOOT='''<footer class="site-footer"><div class="container footer-row"><a class="footer-brand" href="/">'''+BRAND+'''</a><a href="/#chapters">לכל הפרקים</a><a href="https://students.technion.ac.il/local/technionsearch/course/104228">דף הקורס 104228 באתר הטכניון</a></div><p class="container small">האתר הוא מיזם עצמאי ואינו אתר רשמי של הטכניון. ההתקדמות נשמרת בדפדפן במכשיר זה.</p></footer>
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

toc="\n".join(f'              <li><a href="/chapters/{s}/"><span class="toc-n">{i+1:02d}</span><span class="toc-t">{t}</span><span class="toc-dots" aria-hidden="true"></span><span class="toc-tag upcoming">בקרוב</span></a></li>' for i,(s,t) in enumerate(CH))
index=head("מד״ח מ׳ · הכנה למבחן במשוואות דיפרנציאליות חלקיות (104228)",' class="home"',True,
  "אתר הכנה למבחן במד״ח מ׳ (104228) בטכניון: משוואות דיפרנציאליות חלקיות. האתר בבנייה.")+f'''<div class="ascii-backdrop" aria-hidden="true"><canvas data-ascii3d="backdrop"></canvas></div><div class="ascii-fade" aria-hidden="true"></div>
<main id="main" tabindex="-1">

  <section class="hero" aria-labelledby="hero-title">
    <svg class="hero-curve" viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path pathLength="1" d="M0 300 C 120 300, 160 120, 280 120 S 440 330, 560 300 S 720 60, 860 80 S 1060 240, 1200 40"/>
    </svg>
    <div class="container hero-grid">
      <div class="hero-copy">
        <p class="eyebrow rise" style="--d:0">מד״ח מ׳ · 104228 · טכניון</p>
        <h1 id="hero-title"><span class="rise" style="--d:1">גלים, חום ולפלס,</span> <em class="rise" style="--d:2">פרק אחרי פרק.</em></h1>
        <p class="lead rise" style="--d:3">אתר הכנה למבחן בקורס מד״ח מ׳ (104228) בטכניון. החומר מסודר לפי נושאי הסילבוס, ממושגי יסוד ושיטת האופיינים ועד משוואות לפלס ופואסון. האתר בבנייה, והפרקים יתווספו בהדרגה.</p>
        <div class="actions rise" style="--d:4">
          <a class="button button-lg" href="/#chapters">לתוכן העניינים <span class="arrow" aria-hidden="true">←</span></a>
        </div>
      </div>
      <aside class="countdown-card rise" style="--d:3" id="exam"><div data-countdown="home" aria-label="ספירה לבחינה הבאה"></div></aside>
    </div>
  </section>

  <section class="section course" id="course" aria-labelledby="course-title">
    <div class="container">
      <div class="section-intro" data-reveal>
        <p class="eyebrow">הקורס</p>
        <h2 id="course-title">כל נושאי הסילבוס, בספר אחד.</h2>
        <p class="muted">{len(CH)} פרקים, אחד לכל נושא בסילבוס של קורס 104228, משיטת האופיינים ועד משוואת לפלס. כל הפרקים בהכנה.</p>
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
