import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './fixtures/test-helper';

test.describe('Today Dashboard & Navigation', () => {
  test('Renders Today dashboard widgets, greeting, and metrics', async ({ page }) => {
    const user = await loginAsTestUser(page);

    // Verify greeting (use .first() to target header greeting rather than DayClockCard)
    await expect(page.getByText(/Good (morning|afternoon|evening)/i).first()).toBeVisible();

    // Verify Walking Tracker Card
    await expect(page.getByText('Walking', { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Today's distance")).toBeVisible();
    await expect(page.getByText("Today's time")).toBeVisible();
    await expect(page.getByText(/START WALKING|CONTINUE WALKING/)).toBeVisible();

    // Verify Active Reminders Card
    await expect(page.getByText('Active Reminders')).toBeVisible();

    // Verify Tab Bar navigation items
    await expect(page.getByRole('tab', { name: /Today/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Timeline/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Insights/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Customize/i })).toBeVisible();
  });

  test('User can switch tabs between Today, Timeline, Insights, and Customize', async ({ page }) => {
    await loginAsTestUser(page);

    // Click on Timeline tab
    await page.getByRole('tab', { name: /Timeline/i }).click({ force: true });
    await expect(page).toHaveURL(/\/timeline/);
    await expect(page.getByText('Timeline', { exact: true }).first()).toBeVisible();

    // Click on Insights tab
    await page.getByRole('tab', { name: /Insights/i }).click({ force: true });
    await expect(page).toHaveURL(/\/insights/);
    await expect(page.getByText('Insights', { exact: true }).first()).toBeVisible();

    // Click on Customize tab
    await page.getByRole('tab', { name: /Customize/i }).click({ force: true });
    await expect(page).toHaveURL(/\/customize/);
    await expect(page.getByText('Customize', { exact: true }).first()).toBeVisible();

    // Navigate back to Today tab
    await page.getByRole('tab', { name: /Today/i }).click({ force: true });
    await expect(page).toHaveURL(/\/today/);
    await expect(page.getByText('Walking', { exact: true }).first()).toBeVisible();
  });
});
