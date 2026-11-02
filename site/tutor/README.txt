PDE — the course app

Put the tutor/ folder at the root of your site, so it is served at https://<your-site>/tutor/,
and link to it from your pages (e.g. <a href="/tutor/">…</a>). It needs nothing from the rest of the site.

Then add its address to the backend:
  1. Supabase → Authentication → URL Configuration → Redirect URLs: https://<your-site>/tutor/
  2. The ALLOWED_ORIGINS secret of the Edge Functions: add https://<your-site>

course.json holds the brand and the backend's public address. The course content is not in this folder:
publish it from the Studio (Site tab → Publish content). Updates reach students without a new export.
