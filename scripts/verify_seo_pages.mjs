import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const VALUES_FILE = path.join(ROOT_DIR, 'data', 'Values-en.json');
const SITE_URL = 'https://www.valuesinthewild.com';
const REQUIRED_CATEGORIES = ['personal', 'interpersonal', 'growth', 'mindset', 'social', 'core-values', 'aspirations'];

const slugifyValueName = (valueName = '') =>
  valueName
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const readText = (filePath) => fs.readFile(filePath, 'utf8');

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const hasExactlyOneH1 = (html) => (html.match(/<h1[\s>]/g) || []).length === 1;

const main = async () => {
  const values = JSON.parse(await readText(VALUES_FILE)).values || [];
  const valueSlugs = values.map((value) => slugifyValueName(value.name));
  const sitemap = await readText(path.join(DIST_DIR, 'sitemap.xml'));
  const robots = await readText(path.join(DIST_DIR, 'robots.txt'));

  assert(robots.includes('Allow: /'), 'robots.txt must allow crawling');
  assert(!robots.includes('Disallow: /'), 'robots.txt must not block the whole site');
  assert(robots.includes(`${SITE_URL}/sitemap.xml`), 'robots.txt must reference the sitemap');
  assert(sitemap.trim().startsWith('<?xml'), 'sitemap.xml must be XML');

  const requiredRoutes = [
    '',
    'guide',
    'about',
    'practice',
    ...REQUIRED_CATEGORIES.map((category) => `guide/category/${category}`),
    ...valueSlugs.map((slug) => `guide/${slug}`),
  ];

  for (const route of requiredRoutes) {
    const html = await readText(path.join(DIST_DIR, route, 'index.html'));
    const routePath = route ? `/${route}` : '';
    const expectedUrl = `${SITE_URL}${routePath}`;

    assert(html.includes('<meta name="description"'), `${route || '/'} is missing a meta description`);
    assert(html.includes(`<link rel="canonical" href="${expectedUrl}"`), `${route || '/'} has a missing or wrong canonical`);
    assert(html.includes('application/ld+json'), `${route || '/'} is missing JSON-LD schema`);
    assert(hasExactlyOneH1(html), `${route || '/'} must have exactly one fallback h1`);
    assert(sitemap.includes(`<loc>${expectedUrl}</loc>`), `${route || '/'} is missing from sitemap.xml`);
  }

  const notesHtml = await readText(path.join(DIST_DIR, 'notes', 'index.html'));
  const feedbackHtml = await readText(path.join(DIST_DIR, 'feedback', 'index.html'));
  const debugHtml = await readText(path.join(DIST_DIR, 'debug', 'analytics', 'index.html'));

  assert(notesHtml.includes('noindex,follow'), '/notes must be noindex,follow');
  assert(feedbackHtml.includes('noindex,follow'), '/feedback must be noindex,follow');
  assert(debugHtml.includes('noindex,follow'), '/debug/analytics must be noindex,follow');

  const guideHtml = await readText(path.join(DIST_DIR, 'guide', 'index.html'));
  assert(REQUIRED_CATEGORIES.every((category) => guideHtml.includes(`/guide/category/${category}`)), '/guide must link to every category hub');

  const acceptanceHtml = await readText(path.join(DIST_DIR, 'guide', 'acceptance', 'index.html'));
  assert(acceptanceHtml.includes('/guide/category/personal'), 'value pages must link to their category hub');
  assert(acceptanceHtml.includes('/practice/acceptance'), 'value pages must link to practice routes');
  assert(acceptanceHtml.includes('"@type":"DefinedTerm"'), 'value pages must include DefinedTerm schema');

  console.log(`SEO verification passed for ${valueSlugs.length} value pages, ${REQUIRED_CATEGORIES.length} category hubs, and crawl files.`);
};

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
