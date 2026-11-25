import { test, expect } from "@playwright/test";

test("homepage loads successfully", async ({ page }) => {
  const response = await page.goto("/");

  expect(response.status()).toBe(200);
  await expect(page.locator("body")).toBeVisible();
  await expect(page).toHaveTitle(/.+/);
});

test("English page loads", async ({ page }) => {
  const response = await page.goto("/en.html");

  expect(response.status()).toBe(200);
  await expect(page.locator("body")).toBeVisible();
});

test("French project page loads", async ({ page }) => {
  const response = await page.goto("/projet.html");

  expect(response.status()).toBe(200);
});

test("English project page loads", async ({ page }) => {
  const response = await page.goto("/project.html");

  expect(response.status()).toBe(200);
});
