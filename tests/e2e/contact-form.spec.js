import { test, expect } from '@playwright/test';

for (const { path, lang, success, error } of [
  { path: '/', lang: 'fr', success: 'Merci ! Votre message a été envoyé.', error: 'Impossible d’envoyer votre message. Veuillez réessayer.' },
  { path: '/en.html', lang: 'en', success: 'Thank you! Your message has been sent.', error: 'Unable to send your message. Please try again.' },
]) {
  test.describe(`Contact form (${lang})`, () => {
    let form;
    let requests;
    let responseStatus;
    test.beforeEach(async ({ page }) => {
      requests = [];
      responseStatus = 200;
      await page.route('**/api/contact', async route => {
        const headers = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'Content-Type' };
        if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
        requests.push(route.request().postDataJSON());
        await route.fulfill({ status: responseStatus, headers, json: { success: responseStatus === 200 } });
      });
      await page.goto(path);
      form = page.locator('form').filter({ has: page.locator('[name="message"]') });
      await expect(form).toBeVisible();
      await expect(form.locator('[name="_url"]')).not.toHaveValue('');
    });
    const field = name => form.locator(`[name="${name}"]`);
    const submit = () => form.locator('button[type="submit"]').click();
    async function fill() {
      await field('name').fill('Test Client');
      await field('email').fill('client@example.com');
      await field('message').fill('I would like a website.');
    }
    test('requires name, email and message', async () => {
      await submit();
      for (const name of ['name', 'email', 'message']) {
        await expect(field(name)).toHaveJSProperty('required', true);
        expect(await field(name).evaluate(el => el.validity.valueMissing)).toBe(true);
      }
      expect(requests).toHaveLength(0);
    });
    test('rejects malformed email and clears error after correction', async () => {
      await fill();
      await field('email').fill('invalid@domain');
      await field('message').focus();
      await expect(field('email')).toHaveAttribute('aria-invalid', 'true');
      await submit();
      expect(requests).toHaveLength(0);
      await field('email').fill('client+test@example.com');
      await expect(field('email')).not.toHaveAttribute('aria-invalid', 'true');
    });
    test('rejects invalid optional phone', async () => {
      await fill();
      await field('phone').fill('123');
      await field('message').focus();
      await expect(field('phone')).toHaveAttribute('aria-invalid', 'true');
      await submit();
      expect(requests).toHaveLength(0);
    });
    test('submits valid data and resets fields', async ({ page }) => {
      await fill();
      await submit();
      await expect(form.getByRole('status')).toHaveText(success);
      expect(requests).toHaveLength(1);
      expect(requests[0]).toMatchObject({ name: 'Test Client', email: 'client@example.com', message: 'I would like a website.', language: lang, form_type: 'contact', _url: new URL(path, page.url()).href });
      await expect(field('name')).toHaveValue('');
      await expect(field('email')).toHaveValue('');
      await expect(field('message')).toHaveValue('');
    });
    test('preserves data after server failure and permits retry', async () => {
      await fill();
      responseStatus = 502;
      await submit();
      await expect(form.getByRole('status')).toHaveText(error);
      await expect(field('email')).toHaveValue('client@example.com');
      await expect(form.locator('button[type="submit"]')).toBeEnabled();
      responseStatus = 200;
      await submit();
      await expect(form.getByRole('status')).toHaveText(success);
      expect(requests).toHaveLength(2);
    });
  });
}
