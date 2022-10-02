const assert = require('assert/strict');
const formstream = require('formstream');
const stream = require('stream');

const parser = require('..');

describe('test/index.test.js', () => {
  it('should work', async () => {
    const form = formstream();
    form.field('name', 'tz');
    form.field('love', 'egg');
    form.field('by', 'node.js');
    form.field('by2', 'node.js');
    form.file('file1', __filename, 'test.js');
    form.buffer('file2', Buffer.from('abc'), 'test2.js');
    form.buffer('file3', Buffer.from('xxx'), '', 'application/octet-stream');

    const request = new stream.PassThrough();
    request.headers = form.headers();
    form.pipe(request);

    const parts = parser(request, {
      limits: {
        // fieldSize: 2,
        // fields: 3,
        // fileSize: 100,
        // files: 1,
      },
    });

    const { fields, files } = await collect(parts);
    console.log(fields, files);
    assert(fields.name.value === 'tz');
  });
});


async function collect(parts) {
  const result = { fields: {}, files: {} };
  for await (const part of parts) {
    const { name, value, stream, info } = part;
    if (!stream) {
      result.fields[name] = { value, ...info };
    } else {
      let content = '';
      for await (const chunk of stream) {
        content += chunk.toString();
      }
      result.files[name] = { content, ...info };
      console.log('@@@', name, result.files[ name ])
    }
  }
  return result;
}

