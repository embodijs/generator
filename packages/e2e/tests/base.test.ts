import { test, expect } from '@playwright/test';

test.describe('Embodi build and binding', () => {
  test('lang attribute in html', async ({ page }) => {
    await page.goto('/');
    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('en');
  });

  test('render components', async ({ page }) => {
    await page.goto('/comp/');
    await expect(page.getByRole('heading', { name: 'Render Component' })).toBeVisible();
  });

  test('render front-matter', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Welcome to Embodi' })).toBeVisible();
  });

  test('render markdown', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Introduction' })).toBeVisible();
  });

  test('load +data.yaml', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Data subtitle' })).toBeVisible();
  });

  test('laod actions runs', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Hello, load action!')).toBeVisible();
  });

  test('require layout for pages', async ({ page }) => {
    await page.goto('/first/');
    await expect(page.getByRole('heading', { name: 'Test' })).not.toBeVisible();
  });

  test('second level index', async ({ page }) => {
    await page.goto('/second/');
    await expect(page.getByRole('heading', { name: 'Welcome to Embodi' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Data subtitle' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'This is some random second page' })).toBeVisible();
  });
});
