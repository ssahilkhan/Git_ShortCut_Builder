// Run: node test.mjs — checks the URL parser and per-tool link building in index.html.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const tools = html.slice(html.indexOf('const CATEGORIES'), html.indexOf('const $ ='));
const parser = html.slice(html.indexOf('// --- parsing'), html.indexOf('// --- end parsing'));
const { TOOLS, parseGitHubUrl: parse } = new Function(`${tools}\n${parser}\nreturn { TOOLS, parseGitHubUrl };`)();
const url = (id, input) => TOOLS.find(t => t.id === id).url(parse(input));

for (const input of ['facebook/react', 'github.com/facebook/react', 'https://github.com/facebook/react.git', 'https://www.github.com/facebook/react/', 'https://github.com/facebook/react/issues/1', 'https://github.com/facebook/react?tab=x#readme']) {
  assert.equal(parse(input)?.spec, 'facebook/react', input);
}
assert.equal(parse('vercel/next.js').repo, 'vercel/next.js');
for (const bad of ['', 'react', 'https://gitlab.com/a/b', 'example.com/a/b', 'javascript://github.com/a/b', 'a b/c', 'owner/..', '<img>/x']) {
  assert.equal(parse(bad), null, bad);
}

const deep = 'https://github.com/o/r/blob/main/src/a.js';
assert.equal(parse(deep).spec, 'o/r/blob/main/src/a.js');
assert.deepEqual(parse(parse(deep).spec), parse(deep), 'share-link spec round-trips');
assert.equal(url('githubdev', deep), 'https://github.dev/o/r/blob/main/src/a.js');
assert.equal(url('stackblitz', 'o/r/tree/dev'), 'https://stackblitz.com/github/o/r/tree/dev');
assert.equal(url('gitpod', deep), `https://gitpod.io/#${deep}`);
assert.equal(url('sourcegraph', deep), 'https://sourcegraph.com/github.com/o/r@main/-/blob/src/a.js');
assert.equal(url('sourcegraph', 'o/r'), 'https://sourcegraph.com/github.com/o/r');
assert.equal(url('deepwiki', deep), 'https://deepwiki.com/o/r');
assert.ok(!/["'<> ]/.test(parse(`github.com/o/r/tree/main/"'<x>`).spec), 'subpath is encoded');

console.log('all checks passed');
