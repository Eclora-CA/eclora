import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.ts';

const env = { RESEND_API_KEY: 'test-key', CONTACT_TO: 'team@example.com' };
const origin = 'http://127.0.0.1:4173';
const payload = { name: 'Test Client', email: 'client@example.com', message: 'Hello', language: 'en', form_type: 'contact' };
function request(data = payload, headers = {}) {
  return new Request('http://localhost:8787/api/contact', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) });
}
function mockResend(t, statuses = [200, 200]) {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer test-key');
    calls.push(JSON.parse(options.body));
    return new Response(null, { status: statuses[calls.length - 1] ?? 500 });
  });
  return calls;
}
for (const lang of ['en', 'fr']) {
  test(`sends notification and localized confirmation (${lang})`, async t => {
    const calls = mockResend(t);
    const response = await worker.fetch(request({ ...payload, language: lang }), env);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true, confirmationSent: true });
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0].to, [env.CONTACT_TO]);
    assert.equal(calls[0].reply_to, payload.email);
    assert.equal(calls[0].subject, lang === 'fr' ? 'Éclora — Nouvelle demande de contact de Test Client' : 'Éclora — New contact enquiry from Test Client');
    assert.match(calls[0].text, /Message:\nHello/);
    assert.deepEqual(calls[1].to, [payload.email]);
    assert.equal(calls[1].subject, lang === 'fr' ? 'Nous avons bien reçu votre demande !' : 'We received your enquiry!');
  });
}
test('notification failure returns 502 and skips confirmation', async t => {
  const calls = mockResend(t, [500]);
  assert.equal((await worker.fetch(request(), env)).status, 502);
  assert.equal(calls.length, 1);
});
test('confirmation failure preserves successful submission', async t => {
  const calls = mockResend(t, [200, 500]);
  const response = await worker.fetch(request(), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, confirmationSent: false });
  assert.equal(calls.length, 2);
});
for (const [name, changes] of Object.entries({ 'missing name': { name: '' }, 'invalid email': { email: 'invalid' }, 'missing message': { message: '' }, 'missing form type': { form_type: '' } })) {
  test(`rejects ${name} without sending email`, async t => {
    const calls = mockResend(t);
    assert.equal((await worker.fetch(request({ ...payload, ...changes }), env)).status, 400);
    assert.equal(calls.length, 0);
  });
}
test('honeypot silently discards spam', async t => {
  const calls = mockResend(t);
  const response = await worker.fetch(request({ ...payload, _honey: 'spam' }), env);
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(calls.length, 0);
});
test('rejects unauthorized origin', async t => {
  const calls = mockResend(t);
  assert.equal((await worker.fetch(request(payload, { Origin: 'https://example.org' }), env)).status, 403);
  assert.equal(calls.length, 0);
});
test('project submission includes repeated checkbox values', async t => {
  const calls = mockResend(t);
  const response = await worker.fetch(request({ ...payload, form_type: 'project', message: '', activity: 'Design', 'pages[]': ['Home', 'Contact'] }), env);
  assert.equal(response.status, 200);
  assert.match(calls[0].text, /Requested pages:\nHome, Contact/);
  assert.match(calls[0].subject, /New website project/);
});
