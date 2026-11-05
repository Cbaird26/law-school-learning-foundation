const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(__dirname + '/connect.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
for (const id of ['api-key', 'model', 'save']) {
  assert.match(html, new RegExp('id="' + id + '" disabled'));
}

async function scenario(hostname, reply) {
  const nodes = new Map();
  let calls = 0;
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, {
      disabled: true, hidden: true, value: '',
      addEventListener(_, fn) { this.submit = fn; },
      remove() { this.removed = true; }
    });
    return nodes.get(id);
  };
  const context = {
    location: {hostname, protocol: hostname === '127.0.0.1' ? 'http:' : 'https:'},
    document: {getElementById: node, querySelector: node},
    fetch: async () => { calls++; return {ok: true, json: async () => reply}; }
  };
  vm.createContext(context);
  vm.runInContext(script, context);
  await new Promise(resolve => setImmediate(resolve));
  return {node, calls: () => calls};
}

(async () => {
  const publicPage = await scenario('cbaird26.github.io');
  assert.equal(publicPage.node('connect-form').removed, true);
  await publicPage.node('connect-form').submit({preventDefault() {}});
  assert.equal(publicPage.calls(), 0, 'Public pages must never submit an API key');

  const wrongApp = await scenario('127.0.0.1', {app: 'unrelated-service', token: 'fixture'});
  assert.equal(wrongApp.node('api-key').disabled, true);
  assert.equal(wrongApp.node('save').disabled, true);

  const local = await scenario('127.0.0.1', {app: 'law-school-learning-foundation', token: 'fixture', configured: true, model: 'claude-sonnet-5-5'});
  assert.equal(local.node('api-key').disabled, false);
  assert.equal(local.node('save').disabled, false);
  console.log('Connection-page checks passed: no public key entry or submission, local app identity required.');
})();
