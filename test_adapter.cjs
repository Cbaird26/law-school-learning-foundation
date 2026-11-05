const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

(async () => {
  let sent, next = {text: 'Try a common denominator.', truncated: false};
  const context = {window: {}, document: {addEventListener() {}},
    fetch: async (url, opts) => {
      if (url === '/api/status') return {ok: true, json: async () => ({configured: true, token: 'csrf-fixture'})};
      sent = JSON.parse(opts.body);
      assert.equal(opts.headers['X-School-Token'], 'csrf-fixture');
      if (next instanceof Error) throw next;
      return {ok: !next.code, json: async () => next};
    }};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(__dirname + '/local-claude.js', 'utf8'), context);
  const sample = await context.window.ToELocal.connect();
  assert.equal(typeof sample, 'function');
  let rendered;
  await sample([{role: 'user', content: 'Fractions?'}], {onText: r => rendered = r.text});
  assert.equal(rendered, next.text);
  assert.equal(sent.messages[0].content, 'Fractions?');
  next = {text: '```json\n[{"answer":4}]\n```'};
  assert.equal((await sample.json('Make practice'))[0].answer, 4);
  assert.equal(sent.json_mode, true);
  next = {text: '[]', truncated: true};
  await assert.rejects(sample.json('Make practice'), e => e.code === 'invalid_json');
  next = {code: 'credit_balance', message: 'Link your credits.'};
  await assert.rejects(sample('Hello'), e => e.code === 'credit_balance');
  next = Object.assign(new Error('cancelled'), {name: 'AbortError'});
  await assert.rejects(sample('Hello'), e => e.code === 'cancelled');
  await assert.rejects(sample('Photo', {images: [{size: 6*1024*1024}]}), e => e.code === 'image_rejected');
  console.log('Adapter checks passed: context, JSON practice, truncation, API errors, cancellation, image size.');
})();
