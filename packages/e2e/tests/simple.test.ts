import { test, expect } from '@playwright/test';

test('render components with a basic layout', async ({ page }) => {
  await page.goto('/simple/');
  await expect(page.getByRole('heading', { name: 'Simple Site' })).toBeVisible();
});
