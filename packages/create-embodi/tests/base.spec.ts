import { test, expect } from '@playwright/test';

test.describe('Embodi build and binding', () => {
  test('render front-matter', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Welcome to Embodi'})).toBeVisible();
  });

  test('render markdown', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Introduction'})).toBeVisible();
  })

});