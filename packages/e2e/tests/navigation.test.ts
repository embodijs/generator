import { test, expect } from '@playwright/test';

test.describe('Embodi build and binding', () => {
  test('navigate to different pages', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Link to comp').click();
    await expect(page.getByRole('heading', { name: 'Render Component' })).toBeVisible();
    await page.getByText('relative').click();
    await expect(page.getByRole('heading', { name: 'This is some random second page' })).toBeVisible();
  });
  test('scroll to end', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Scroll to end').click();
    await expect(page.locator('#märker')).toBeInViewport();
  });

  test('browser navigation', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Link to comp').click();
    await expect(page.getByRole('heading', { name: 'Render Component' })).toBeVisible();
    await page.getByText('relative').click();
    await expect(page.getByRole('heading', { name: 'This is some random second page' })).toBeVisible();
    await page.getByText('Link to comp').click();
    await expect(page.getByRole('heading', { name: 'Render Component' })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'This is some random second page' })).toBeVisible();
    expect(page.url()).toContain('/second');
    await page.goForward();
    await expect(page.getByRole('heading', { name: 'Render Component' })).toBeVisible();
    expect(page.url()).toContain('/comp');
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'This is some random second page' })).toBeVisible();
    expect(page.url()).toContain('/second');
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Render Component' })).toBeVisible();
    expect(page.url()).toContain('/comp');
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Introduction' })).toBeVisible();
    expect(page.url()).toContain('/');
  });
});
