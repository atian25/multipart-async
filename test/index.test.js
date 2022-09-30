const assert = require('assert/strict');

const run = require('..');

describe('test/index.test.js', () => {
  it('should work', async () => {
    const result = await run();
    assert.equal(result, 'Hello World!');
  });
});
