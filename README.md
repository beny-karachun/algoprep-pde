# algoprep-pde
Exam-prep site for Technion PDE (104228, מד״ח מ׳: משוואות דיפרנציאליות חלקיות). Planned at pde.algoprep.com (GitHub Pages).
The design, styles and scripts are copied from technionprep-physics2 (physics2.algoprep.com). Only the text, content and ASCII scenes change.
- `site/`: the static course website. All chapter pages are placeholders for now, one per syllabus topic.
- `site/tutor/`: the course app (AI tutor, formula sheet, drill, exam analysis). It is exported from the Exam Mastery Studio (Site tab → Export as tutor/); don't edit it by hand. The course content isn't in it: the Studio publishes it to the backend, and students' copies update on their next visit without a new export.
- `scripts/generate-placeholders.py`: regenerates the landing page, chapter placeholders and `site/assets/config.js`.
- The exam date is not published yet. Add it to `exams` in `scripts/generate-placeholders.py` (or `site/assets/config.js`) when known.

Run `python -m http.server 8000 --directory site` to preview the site.
After an asset change, run `node scripts/version-assets.mjs`.
Run `node scripts/check-site.mjs` to check page links, assets, and practice banks.
The deployment workflow updates asset versions and checks the site before publication.
