
import { build as esbuildBuild } from 'esbuild';
import { build as viteBuild } from 'vite';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const production = {
  'process.env.NODE_ENV': '"production"',
};

// Prepare output directories.
await mkdir('.build', { recursive: true });
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });

// Copy static files (images and CSS).
await cp('public', 'dist', { recursive: true });

// Build the server-side React renderer with esbuild.
await esbuildBuild({
  entryPoints: ['src/render.jsx'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: '.build/render.cjs',
  define: production,
});

// Build the browser React application with Vite.
await viteBuild();

// Load the server-side renderer.
const require = createRequire(import.meta.url);
const { render } = require(resolve('.build/render.cjs'));

// Read page metadata.
const pages = JSON.parse(
  await readFile('src/pages/metadata.json', 'utf8')
);

const escape = value =>
  String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));

const year = new Date().getFullYear();

// Generate the six HTML pages.
for (const [page, meta] of Object.entries(pages)) {
  const alternates = meta.alternates
    .map(link =>
      `<link rel="alternate" hreflang="${escape(link.hreflang)}" href="${escape(link.href)}">`
    )
    .join('');

  const html = `<!doctype html>
<html lang="${meta.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(meta.title)}</title>
<meta name="description" content="${escape(meta.description)}">
<link rel="icon" href="assets/mark.png">
<link rel="stylesheet" href="style.css">
${alternates}
</head>
<body>
<div id="root" data-page="${page}" data-year="${year}">${render(page, year)}</div>
<script type="module" src="assets/app.js"></script>
</body>
</html>`;

  await writeFile(`dist/${page}`, html);
}

console.log(`Built ${Object.keys(pages).length} React pages in dist/.`);
