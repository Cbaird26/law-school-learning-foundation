const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes('function protect(src)'));
const context = { module: { exports: {} } }; vm.runInNewContext(script, context);
const text = context.module.exports;
for (const currency of ['$100 offer and $200 counteroffer.', 'Price: $100.\n\nAnother price: $200.', 'Price: $100.']) {
  assert.equal(text.protect(currency).maths.length, 0);
  assert.equal(text.protect(currency).text, currency);
}
assert.equal(text.protect('Compute $2+2=4$ and $x^2$.').maths.length, 2);
assert.equal(text.protect('$$x = 1\n+2$$').maths.length, 1);
assert.equal(text.protect('Use `$100` in code.').maths.length, 0);
assert.equal(text.protect('Price: \\$100.').text, 'Price: $100.');
console.log('Currency remains readable; inline and display math still render.');
