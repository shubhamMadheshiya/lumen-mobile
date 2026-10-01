import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './fixtures/test-helper';

test.describe('Walking Tracker Flows', () => {
  test('User can start a walking session from Today screen and see active HUD', async ({ page }) => {
    await loginAsTestUser(page);

    // Locate and click START WALKING CTA on Today screen
    const startWalkBtn = page.getByText(/START WALKING|CONTINUE WALKING/);
    await expect(startWalkBtn).toBeVisible();
    await startWalkBtn.click();

    // Verify redirected to active walk session HUD
    await expect(page).toHaveURL(/\/walking\/active/);
    await expect(page.getByText('WALKING', { exact: true })).toBeVisible();

    // Check metric labels
    await expect(page.getByText('Distance (km)')).toBeVisible();
    await expect(page.getByText('Avg Pace (min/km)')).toBeVisible();
    await expect(page.getByText('Steps')).toBeVisible();

    // Verify Pause / Resume control
    const pauseBtn = page.getByText('PAUSE');
    await expect(pauseBtn).toBeVisible();
    await pauseBtn.click();

    // After pausing, RESUME button should appear
    await expect(page.getByText('RESUME')).toBeVisible();
    await page.getByText('RESUME').click();
    await expect(page.getByText('PAUSE')).toBeVisible();

    // Verify Stop button
    await expect(page.getByText('STOP')).toBeVisible();
  });

  test('User can view Walking Tracker history dashboard', async ({ page }) => {
    await loginAsTestUser(page);

    // Click History in the Walking section
    const historyLink = page.getByText('History', { exact: true });
    await expect(historyLink).toBeVisible();
    await historyLink.click();

    // Verify navigation to /walking
    await expect(page).toHaveURL(/\/walking/);
    await expect(page.getByText('Walking Tracker')).toBeVisible();
    await expect(page.getByText(/START WALK|CONTINUE WALK/).last()).toBeVisible();
  });
});
