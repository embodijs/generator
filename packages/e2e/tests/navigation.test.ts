import { test, expect } from '@playwright/test';

test.describe('Embodi build and binding', () => {
  test('navigate to different pages', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Link to comp').click();
    await expect(page.getByRole('heading', { name: 'Render Component' })).toBeVisible();
    await page.getByText('relative').click();
    await expect(page.getByRole('heading', { name: 'This is some random second page' })).toBeVisible();
  });
});
