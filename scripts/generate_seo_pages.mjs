import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const DIST_INDEX = path.join(DIST_DIR, 'index.html');
const VALUES_FILE = path.join(ROOT_DIR, 'data', 'Values-en.json');
const SITE_CONTENT_FILE = path.join(ROOT_DIR, 'data', 'ValueSiteContent.json');

const SITE_URL = 'https://www.valuesinthewild.com';
const UPDATED_AT = new Date().toISOString().slice(0, 10);
const CATEGORY_ORDER = ['Personal', 'Interpersonal', 'Growth', 'Mindset', 'Social', 'Core Values', 'Aspirations'];

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const escapeAttr = escapeHtml;

const slugifyValueName = (valueName = '') =>
  valueName
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const slugifyCategory = slugifyValueName;

const collapseSpace = (value = '') => String(value).replace(/\s+/g, ' ').trim();

const stripHtml = (value = '') => collapseSpace(String(value).replace(/<[^>]*>/g, ' '));

const truncate = (value, maxLength) => {
  const text = collapseSpace(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).replace(/\s+\S*$/, '')}.`;
};

const siteText = (field) => (typeof field?.value === 'string' ? field.value : '');
const siteList = (field) => (Array.isArray(field?.value) ? field.value.filter((entry) => typeof entry === 'string') : []);

const loadValues = async () => {
  const [rawValues, rawSiteContent] = await Promise.all([
    fs.readFile(VALUES_FILE, 'utf8'),
    fs.readFile(SITE_CONTENT_FILE, 'utf8'),
  ]);
  const values = JSON.parse(rawValues).values || [];
  const siteContent = JSON.parse(rawSiteContent);

  return values
    .map((value) => ({
      ...value,
      siteContent: siteContent[value.name] || value.siteContent || {},
    }))
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }));
};

const pagePath = (routePath) => (routePath === '/' ? '/' : routePath.replace(/\/$/, ''));
const canonical = (routePath) => `${SITE_URL}${pagePath(routePath) === '/' ? '' : pagePath(routePath)}`;

const jsonLd = (payload) =>
  `<script type="application/ld+json">${JSON.stringify(payload).replace(/</g, '\\u003c')}</script>`;

const getCleanShell = (html) => {
  const assetTags = [
    ...(html.match(/<script\b[^>]*\bsrc="[^"]+"[^>]*><\/script>/g) || []),
    ...(html.match(/<link\b[^>]*\bhref="[^"]+"[^>]*>/g) || []),
  ].filter((tag) => tag.includes('/assets/') || tag.includes('/index.tsx') || tag.includes('/index.css'));

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Values in the Wild</title>
  ${assetTags.join('\n  ')}
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;
};

const linkList = (links) =>
  `<ul>${links
    .map((link) => `<li><a href="${escapeAttr(link.href)}">${escapeHtml(link.label)}</a>${link.text ? ` - ${escapeHtml(link.text)}` : ''}</li>`)
    .join('')}</ul>`;

const plainList = (items) => `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;

const makeHeadTags = ({ title, description, routePath, schema, robots = 'index,follow' }) => {
  const url = canonical(routePath);
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeAttr(description);

  return [
    `<title>${safeTitle}</title>`,
    `<meta name="description" content="${safeDescription}" />`,
    `<link rel="canonical" href="${escapeAttr(url)}" />`,
    `<meta name="robots" content="${escapeAttr(robots)}" />`,
    `<meta property="og:site_name" content="Values in the Wild" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${safeTitle}" />`,
    `<meta property="og:description" content="${safeDescription}" />`,
    `<meta property="og:url" content="${escapeAttr(url)}" />`,
    '<meta name="twitter:card" content="summary" />',
    `<meta name="twitter:title" content="${safeTitle}" />`,
    `<meta name="twitter:description" content="${safeDescription}" />`,
    ...schema.map(jsonLd),
  ].join('\n    ');
};

const injectPage = (shell, { title, description, routePath, schema, body, robots }) => {
  const headTags = makeHeadTags({ title, description, routePath, schema, robots });
  const withTitle = shell.replace(/<title>.*?<\/title>/s, headTags);
  return withTitle.replace('<div id="root"></div>', `<div id="root">\n${body}\n    </div>`);
};

const writePage = async (routePath, html) => {
  const segments = pagePath(routePath).split('/').filter(Boolean);
  const outputDir = segments.length ? path.join(DIST_DIR, ...segments) : DIST_DIR;
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, 'index.html'), html);
};

const getValueDescription = (value) =>
  truncate(
    value.siteContent?.seo?.value?.description ||
      siteText(value.siteContent?.summary) ||
      siteText(value.siteContent?.shortDefinition) ||
      value.description,
    158
  );

const getValueTitle = (value) => value.siteContent?.seo?.value?.title || `${value.name} Meaning in Real Life | Values in the Wild`;

const getValueSummary = (value) =>
  siteText(value.siteContent?.summary) || siteText(value.siteContent?.shortDefinition) || value.description;

const relatedValues = (value, values) =>
  values
    .filter((candidate) => candidate.name !== value.name)
    .map((candidate) => {
      const sharedTags = (candidate.tags || []).filter((tag) => (value.tags || []).includes(tag)).length;
      const sameCategory = candidate.category === value.category ? 2 : 0;
      return { value: candidate, score: sharedTags + sameCategory };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.value.name.localeCompare(right.value.name))
    .slice(0, 8)
    .map((entry) => entry.value);

const baseSchemas = (routePath) => [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Values in the Wild',
    url: SITE_URL,
    description: 'A field guide to the values people actually live, with examples, prompts, and reflective practice.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/guide?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Values in the Wild',
    url: SITE_URL,
  },
];

const breadcrumbs = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: canonical(item.path),
  })),
});

const pageShellStyle = `
      <main class="seo-fallback">
        <style>
          .seo-fallback{max-width:1120px;margin:0 auto;padding:56px 24px 72px;font-family:Plus Jakarta Sans,Inter,system-ui,sans-serif;color:#1e1b18;background:#fffaf7}
          .seo-fallback a{color:#35680e;font-weight:700}
          .seo-fallback h1{max-width:840px;margin:0;color:#35680e;font-size:clamp(2.6rem,6vw,5.8rem);line-height:.94;letter-spacing:-.055em}
          .seo-fallback h2{margin:36px 0 12px;font-size:1.55rem;letter-spacing:-.025em}
          .seo-fallback p,.seo-fallback li{font-size:1rem;line-height:1.75;color:#5f544c}
          .seo-fallback .eyebrow{display:inline-block;margin-bottom:18px;color:#8a7668;font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.22em}
          .seo-fallback .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;margin-top:18px}
          .seo-fallback article{border:1px solid #eadfd6;border-radius:18px;background:#fff;padding:20px}
        </style>
`;

const homePage = ({ shell, values, categories }) => {
  const description = 'Explore a field guide to lived values, real-life examples, reflection prompts, and practices for noticing what matters in the wild.';
  const body = `${pageShellStyle}
        <span class="eyebrow">Values in the Wild</span>
        <h1>A field guide to the values you actually live</h1>
        <p>${escapeHtml(description)}</p>
        <p><a href="/guide">Browse the field guide</a> or start with one of the major value categories below.</p>
        <h2>Value categories</h2>
        ${linkList(categories.map((category) => ({ href: `/guide/category/${slugifyCategory(category)}`, label: category })))}
        <h2>Start with a value</h2>
        ${linkList(values.slice(0, 24).map((value) => ({ href: `/guide/${slugifyValueName(value.name)}`, label: value.name, text: value.category })))}
      </main>`;

  return injectPage(shell, {
    title: 'Values in the Wild | A Field Guide to Lived Values',
    description,
    routePath: '/',
    schema: [
      ...baseSchemas('/'),
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Values in the Wild',
        url: canonical('/'),
        description,
      },
    ],
    body,
  });
};

const guidePage = ({ shell, values, categories }) => {
  const description = 'Browse 149 values with real-life meanings, examples, reflection prompts, and practice links.';
  const body = `${pageShellStyle}
        <span class="eyebrow">Field guide</span>
        <h1>Browse values by meaning, category, and lived practice</h1>
        <p>${escapeHtml(description)}</p>
        <h2>Categories</h2>
        ${linkList(categories.map((category) => ({ href: `/guide/category/${slugifyCategory(category)}`, label: category })))}
        <h2>All values</h2>
        <div class="grid">
          ${values
            .map(
              (value) => `<article>
                <h2><a href="/guide/${slugifyValueName(value.name)}">${escapeHtml(value.name)}</a></h2>
                <p>${escapeHtml(getValueDescription(value))}</p>
                <p><a href="/practice/${slugifyValueName(value.name)}">Practice ${escapeHtml(value.name)}</a></p>
              </article>`
            )
            .join('')}
        </div>
      </main>`;

  return injectPage(shell, {
    title: 'Values Field Guide | Values in the Wild',
    description,
    routePath: '/guide',
    schema: [
      ...baseSchemas('/guide'),
      breadcrumbs([
        { name: 'Values in the Wild', path: '/' },
        { name: 'Field Guide', path: '/guide' },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Values Field Guide',
        url: canonical('/guide'),
        description,
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: values.map((value, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: value.name,
            url: canonical(`/guide/${slugifyValueName(value.name)}`),
          })),
        },
      },
    ],
    body,
  });
};

const aboutPage = ({ shell }) => {
  const description = 'Learn how Values in the Wild helps people move from abstract values lists into real-life evidence, reflection, and practice.';
  const body = `${pageShellStyle}
        <span class="eyebrow">About</span>
        <h1>Values become clearer when you can see them in the wild</h1>
        <p>${escapeHtml(description)}</p>
        <p>Most values work starts with choosing words. Values in the Wild starts one step later: noticing where a value shows up in behavior, relationships, pressure, repair, and ordinary decisions.</p>
        <h2>Use the field guide</h2>
        ${linkList([
          { href: '/guide', label: 'Browse the full values field guide' },
          { href: '/practice', label: 'Turn a value into a practice prompt' },
        ])}
      </main>`;

  return injectPage(shell, {
    title: 'About Values in the Wild | Lived Values Field Guide',
    description,
    routePath: '/about',
    schema: [
      ...baseSchemas('/about'),
      breadcrumbs([
        { name: 'Values in the Wild', path: '/' },
        { name: 'About', path: '/about' },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'About Values in the Wild',
        url: canonical('/about'),
        description,
      },
    ],
    body,
  });
};

const practicePage = ({ shell, values }) => {
  const description = 'Choose a value and use practical prompts to turn it into one lived move, field note, or reflection.';
  const body = `${pageShellStyle}
        <span class="eyebrow">Practice</span>
        <h1>Practice a value in real life</h1>
        <p>${escapeHtml(description)}</p>
        <p>Start with the field guide, pick one value, and record what actually happened.</p>
        <h2>Start with a value</h2>
        ${linkList(values.slice(0, 40).map((value) => ({ href: `/practice/${slugifyValueName(value.name)}`, label: `Practice ${value.name}`, text: value.category })))}
      </main>`;

  return injectPage(shell, {
    title: 'Values Practice Prompts | Values in the Wild',
    description,
    routePath: '/practice',
    schema: [
      ...baseSchemas('/practice'),
      breadcrumbs([
        { name: 'Values in the Wild', path: '/' },
        { name: 'Practice', path: '/practice' },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Values Practice Prompts',
        url: canonical('/practice'),
        description,
      },
    ],
    body,
  });
};

const noindexPage = ({ shell, routePath, title, description }) =>
  injectPage(shell, {
    title,
    description,
    routePath,
    robots: 'noindex,follow',
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        url: canonical(routePath),
        description,
      },
    ],
    body: `${pageShellStyle}
        <span class="eyebrow">Values in the Wild</span>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
        <p><a href="/guide">Return to the field guide</a></p>
      </main>`,
  });

const categoryPage = ({ shell, category, values }) => {
  const categoryValues = values.filter((value) => value.category === category);
  const routePath = `/guide/category/${slugifyCategory(category)}`;
  const categoryTitle = category.toLowerCase().endsWith('values') ? category : `${category} values`;
  const description = `Explore ${categoryValues.length} ${categoryTitle.toLowerCase()} with real-life meanings, examples, and practice prompts.`;
  const body = `${pageShellStyle}
        <span class="eyebrow">Value category</span>
        <h1>${escapeHtml(categoryTitle)}</h1>
        <p>${escapeHtml(description)}</p>
        <p><a href="/guide">Back to the full field guide</a></p>
        <div class="grid">
          ${categoryValues
            .map(
              (value) => `<article>
                <h2><a href="/guide/${slugifyValueName(value.name)}">${escapeHtml(value.name)}</a></h2>
                <p>${escapeHtml(getValueDescription(value))}</p>
                <p><a href="/practice/${slugifyValueName(value.name)}">Practice ${escapeHtml(value.name)}</a></p>
              </article>`
            )
            .join('')}
        </div>
      </main>`;

  return injectPage(shell, {
    title: `${categoryTitle.replace(/\b\w/g, (letter) => letter.toUpperCase())} | Values in the Wild`,
    description,
    routePath,
    schema: [
      ...baseSchemas(routePath),
      breadcrumbs([
        { name: 'Values in the Wild', path: '/' },
        { name: 'Field Guide', path: '/guide' },
        { name: category, path: routePath },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: categoryTitle.replace(/\b\w/g, (letter) => letter.toUpperCase()),
        url: canonical(routePath),
        description,
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: categoryValues.map((value, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: value.name,
            url: canonical(`/guide/${slugifyValueName(value.name)}`),
          })),
        },
      },
    ],
    body,
  });
};

const valuePage = ({ shell, value, values }) => {
  const routePath = `/guide/${slugifyValueName(value.name)}`;
  const summary = getValueSummary(value);
  const longDefinition = siteText(value.siteContent?.longDefinition);
  const examples = [
    ...siteList(value.siteContent?.everydayExamples),
    ...(Array.isArray(value.inTheWild) ? value.inTheWild : []),
  ].slice(0, 5);
  const habits = siteList(value.siteContent?.habitIdeas).slice(0, 4);
  const prompts = siteList(value.siteContent?.journalPrompts).slice(0, 4);
  const related = relatedValues(value, values);

  const body = `${pageShellStyle}
        <span class="eyebrow">${escapeHtml(value.category)} value</span>
        <h1>${escapeHtml(value.name)} meaning in real life</h1>
        <p>${escapeHtml(summary)}</p>
        ${longDefinition ? `<h2>Longer read</h2><p>${escapeHtml(longDefinition)}</p>` : ''}
        ${examples.length ? `<h2>${escapeHtml(value.name)} in the wild</h2>${plainList(examples)}` : ''}
        ${habits.length ? `<h2>How to practice ${escapeHtml(value.name.toLowerCase())}</h2>${plainList(habits)}` : ''}
        ${prompts.length ? `<h2>Journal prompts</h2>${plainList(prompts)}` : ''}
        <h2>Keep exploring</h2>
        <p><a href="/guide/category/${slugifyCategory(value.category)}">More ${escapeHtml(value.category)} values</a> · <a href="/practice/${slugifyValueName(value.name)}">Practice ${escapeHtml(value.name)}</a> · <a href="/guide">Full field guide</a></p>
        ${related.length ? linkList(related.map((relatedValue) => ({ href: `/guide/${slugifyValueName(relatedValue.name)}`, label: relatedValue.name, text: relatedValue.category }))) : ''}
      </main>`;

  const description = getValueDescription(value);
  return injectPage(shell, {
    title: getValueTitle(value),
    description,
    routePath,
    schema: [
      ...baseSchemas(routePath),
      breadcrumbs([
        { name: 'Values in the Wild', path: '/' },
        { name: 'Field Guide', path: '/guide' },
        { name: value.category, path: `/guide/category/${slugifyCategory(value.category)}` },
        { name: value.name, path: routePath },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'DefinedTerm',
        name: value.name,
        description,
        url: canonical(routePath),
        inDefinedTermSet: canonical('/guide'),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: getValueTitle(value),
        description,
        mainEntityOfPage: canonical(routePath),
        dateModified: UPDATED_AT,
        author: {
          '@type': 'Organization',
          name: 'Values in the Wild',
        },
      },
    ],
    body,
  });
};

const writeCrawlFiles = async ({ values, categories }) => {
  const routes = [
    '/',
    '/guide',
    '/about',
    '/practice',
    ...categories.map((category) => `/guide/category/${slugifyCategory(category)}`),
    ...values.map((value) => `/guide/${slugifyValueName(value.name)}`),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes
    .map(
      (route) => `  <url>
    <loc>${escapeHtml(canonical(route))}</loc>
    <lastmod>${UPDATED_AT}</lastmod>
  </url>`
    )
    .join('\n')}\n</urlset>\n`;

  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;

  await Promise.all([
    fs.writeFile(path.join(DIST_DIR, 'sitemap.xml'), sitemap),
    fs.writeFile(path.join(DIST_DIR, 'robots.txt'), robots),
  ]);
};

const main = async () => {
  const [rawShell, values] = await Promise.all([fs.readFile(DIST_INDEX, 'utf8'), loadValues()]);
  const shell = getCleanShell(rawShell);
  const categories = CATEGORY_ORDER.filter((category) => values.some((value) => value.category === category));

  await writePage('/', homePage({ shell, values, categories }));
  await writePage('/guide', guidePage({ shell, values, categories }));
  await writePage('/about', aboutPage({ shell }));
  await writePage('/practice', practicePage({ shell, values }));
  await writePage(
    '/notes',
    noindexPage({
      shell,
      routePath: '/notes',
      title: 'Field Notes',
      description: 'Private reflection history for Values in the Wild users.',
    })
  );
  await writePage(
    '/feedback',
    noindexPage({
      shell,
      routePath: '/feedback',
      title: 'Feedback',
      description: 'A private feedback form for Values in the Wild users.',
    })
  );
  await writePage(
    '/debug/analytics',
    noindexPage({
      shell,
      routePath: '/debug/analytics',
      title: 'Analytics Debug',
      description: 'Private administrative analytics diagnostics for Values in the Wild.',
    })
  );

  await Promise.all([
    ...categories.map((category) => writePage(`/guide/category/${slugifyCategory(category)}`, categoryPage({ shell, category, values }))),
    ...values.map((value) => writePage(`/guide/${slugifyValueName(value.name)}`, valuePage({ shell, value, values }))),
  ]);

  await writeCrawlFiles({ values, categories });

  console.log(`Generated SEO pages for ${values.length} values and ${categories.length} categories.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
