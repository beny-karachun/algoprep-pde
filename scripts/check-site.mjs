import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve('site');
const errors = [];
const pages = new Map();
function walk(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    // tutor/ is the course app, built elsewhere (Exam Mastery Studio → Export as tutor/), not a page of this site.
    if (entry.isDirectory()) { if (file !== path.join(root, 'tutor')) walk(file); }
    else if (entry.name.endsWith('.html')) pages.set(file, fs.readFileSync(file, 'utf8'));
  }
}
walk(root);
const ids = new Map([...pages].map(([file, html]) => [file, [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1])]));
for (const [file, html] of pages) {
  const label = path.relative(root, file);
  if ((html.match(/<h1\b/g) || []).length !== 1) errors.push(`${label}: expected one h1`);
  if (new Set(ids.get(file)).size !== ids.get(file).length) errors.push(`${label}: duplicate element ID`);
  for (const match of html.matchAll(/\b(?:href|src|data-quiz-source)="([^"]+)"/g)) {
    const url = new URL(match[1], `https://site.test/${label}`);
    if (url.origin !== 'https://site.test') continue;
    let target = path.join(root, decodeURIComponent(url.pathname));
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
    if (!fs.existsSync(target)) errors.push(`${label}: missing target ${match[1]}`);
    else if (url.hash && ids.has(target) && !ids.get(target).includes(decodeURIComponent(url.hash.slice(1)))) {
      errors.push(`${label}: missing section ${match[1]}`);
    }
  }
}

const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/config.js'), 'utf8'), context);
for (const slug of context.window.TP_CONFIG.publicChapters) {
  const chapter = path.join(root, 'chapters', slug);
  if (!fs.existsSync(path.join(chapter, 'lesson-1.html'))) errors.push(`${slug}: missing first lesson`);
  const bank = path.join(chapter, 'practice.json');
  if (!fs.existsSync(bank)) continue;
  const data = JSON.parse(fs.readFileSync(bank, 'utf8'));
  const questionIds = new Set();
  if (data.version !== 1 || !Array.isArray(data.questions) || !data.questions.length) errors.push(`${slug}: invalid practice bank`);
  for (const question of data.questions || []) {
    if (questionIds.has(question.id) || !question.id || typeof question.prompt !== 'string' || typeof question.solution !== 'string'
      || !Array.isArray(question.options) || question.options.length < 2 || question.options.some(option => typeof option !== 'string')
      || !Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex >= question.options.length) {
      errors.push(`${slug}: invalid question ${question.id}`);
    }
    questionIds.add(question.id);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else console.log(`Checked ${pages.size} pages: links, sections, assets, and available practice banks passed.`);
