import { build, context } from 'esbuild';
import { cpSync, mkdirSync, rmSync } from 'node:fs';

const watch = process.argv.includes('--watch');
const outdir = 'dist';

rmSync(outdir, { recursive: true, force: true });
mkdirSync(outdir, { recursive: true });
cpSync('src/manifest.json', 'dist/manifest.json');
cpSync('branding/logo.png', 'dist/logo.png');

const target = (entry, outfile, css = false) => ({
  entryPoints: [entry],
  outfile,
  bundle: true,
  format: 'iife',
  target: ['chrome111'],
  legalComments: 'none',
  minify: !watch,
  sourcemap: watch,
  loader: css ? { '.css': 'text' } : {},
});

const targets = [
  target('src/interceptor.ts', 'dist/interceptor.js'),
  target('src/content.ts', 'dist/content.js', true),
];

if (watch) {
  const contexts = await Promise.all(targets.map((options) => context(options)));
  await Promise.all(contexts.map((ctx) => ctx.watch()));
  console.log('linspector: watching for changes');
} else {
  await Promise.all(targets.map((options) => build(options)));
  console.log('linspector: build complete');
}
