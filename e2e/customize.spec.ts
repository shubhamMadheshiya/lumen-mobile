import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './fixtures/test-helper';

test.describe('Customize Configuration Flows', () => {
  test('User can open Customize tab and view builder options', async ({ page }) => {
    await loginAsTestUser(page);

    // Switch to Customize tab
    await page.getByText('Customize', { exact: true }).click();
    await expect(page).toHaveURL(/\/customize/);

    // Verify Heading & Subheading
    await expect(page.getByText('Customize', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Everything here is yours/i)).toBeVisible();

    // Verify Builder Navigation Cards
    await expect(page.getByText('Categories & Questions')).toBeVisible();
    await expect(page.getByText('Quick-tap buttons')).toBeVisible();
    await expect(page.getByText('Template library')).toBeVisible();
    await expect(page.getByText('Medications')).toBeVisible();
    await expect(page.getByText('Custom units')).toBeVisible();
    await expect(page.getByText('Export config')).toBeVisible();
  });
});
