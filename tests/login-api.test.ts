import assert from 'node:assert/strict';
import test from 'node:test';
import { parseLoginBody } from '../lib/auth/parseLoginBody';

test('parseLoginBody parses JSON objects', function () {
  const result = parseLoginBody({
    body: { username: 'owner', password: 'secret' }
  } as never);

  assert.equal(result.malformed, false);
  assert.equal(result.body.username, 'owner');
});

test('parseLoginBody parses JSON strings', function () {
  const result = parseLoginBody({
    body: JSON.stringify({ username: 'owner', password: 'secret' })
  } as never);

  assert.equal(result.malformed, false);
  assert.equal(result.body.password, 'secret');
});

test('parseLoginBody rejects malformed JSON', function () {
  const result = parseLoginBody({
    body: '{not-json'
  } as never);

  assert.equal(result.malformed, true);
});
