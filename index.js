'use strict';

const Busboy = require('busboy');
const { Queue } = require('@toolbuilder/await-for-it');
const assert = require('assert/strict');
const stream = require('stream');

module.exports = function parser(request, options = {}) {
  const queue = new Queue();

  const parserOptions = extractOptions(request, options);

  const busboy = Busboy(parserOptions);

  busboy.on('field', onField);
  busboy.on('file', onFile);
  busboy.on('partsLimit', onLimit('partsLimit'));
  busboy.on('filesLimit', onLimit('filesLimit'));
  busboy.on('fieldsLimit', onLimit('fieldsLimit'));
  // busboy.on('error', onError)
  // busboy.on('close', onClose);

  function onField(name, value, info) {
    queue.push({ name, value, info });
  }

  function onFile(name, stream, info) {
    // info.truncated = stream.truncated;
    stream.once('limit', () => {
      info.truncated = true;
      stream.resume();
      onLimit('fileSize')();
    });
    if (stream.truncated) {
      stream.emit('limit');
    }
    queue.push({ name, stream, info });
  }

  function onLimit(type) {
    return function onLimit() {
      const error = new Error(`Reach ${type}`);
      error.code = 'LIMIT_EXCEEDED';
      error.status = 413;
      onError(error);
    };
  }

  function onClose() {
    console.log('close');
    queue.done();
  }

  function onError(err) {
    queue.reject(err);
  }

  stream.pipeline(request, busboy, err => {
    if (err) {
      onError(err);
    } else {
      onClose();
    }
  });

  return queue;
};

function extractOptions(request, options = {}) {
  assert(request.headers, 'request.headers is required');

  const headers = {};
  for (const [ key, value ] of Object.entries(request.headers)) {
    headers[key.toLowerCase()] = value;
  }
  return { ...options, headers };
}
