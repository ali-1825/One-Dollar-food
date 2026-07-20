import assert from 'node:assert/strict';
import test from 'node:test';
import { parseLoginBody, parseLoginJson } from '../lib/auth/parseLoginBody';

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

test('parseLoginJson rejects malformed JSON', function () {
  const result = parseLoginJson('{not-json');
  assert.equal(result.malformed, true);
});

test('parseLoginJson rejects JSON arrays', function () {
  const result = parseLoginJson('[]');
  assert.equal(result.malformed, true);
});
