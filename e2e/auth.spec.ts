import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to root which redirects to /login when unauthenticated
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      try { localStorage.clear(); } catch {}
    });
    // Ensure we are on login screen
    await expect(page.getByText('🌿 Lumen')).toBeVisible();
  });

  test('Login screen renders with all elements and branding', async ({ page }) => {
    // Logo & Tagline
    await expect(page.getByText('🌿 Lumen')).toBeVisible();
    await expect(page.getByText('Track your health journey')).toBeVisible();

    // Inputs
    const emailInput = page.getByPlaceholder('Email');
    const passwordInput = page.getByPlaceholder('Password');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Sign in Button
    const signInBtn = page.getByRole('button', { name: 'Sign in', exact: true });
    await expect(signInBtn).toBeVisible();

    // Google Sign-In Button
    await expect(page.getByText('Continue with Google')).toBeVisible();

    // Link to create account
    const registerLink = page.getByRole('link', { name: "Don't have an account? Create one" });
    await expect(registerLink).toBeVisible();
  });

  test('Form validation keeps user on login page when inputs are empty', async ({ page }) => {
    // Click Sign In with empty fields
    const signInBtn = page.getByRole('button', { name: 'Sign in', exact: true });
    await signInBtn.click();

    // Verify user stays on login page
    await expect(page).toHaveURL(/\/(auth\/)?login/);
  });

  test('User can navigate to register page and create an account', async ({ page }) => {
    await expect(page.getByText('🌿 Lumen')).toBeVisible();

    // Click link to create account
    const registerLink = page.getByRole('link', { name: "Don't have an account? Create one" });
    await registerLink.click();

    // Verify on register page with correct header
    await expect(page.getByText('Create your account')).toBeVisible();
    await expect(page.getByPlaceholder('Your name')).toBeVisible();

    // Fill in registration form with unique email
    const rand = Math.floor(Math.random() * 1000000);
    const email = `playwright_user_${rand}@example.com`;

    await page.getByPlaceholder('Your name').fill('Alex Rivera');
    await page.getByPlaceholder('Email').last().fill(email);
    await page.getByPlaceholder('Password (8+ characters)').fill('SecurePass123!');

    // Submit registration
    const submitBtn = page.getByRole('button', { name: 'Create account' });
    await submitBtn.click();

    // Should redirect to Today dashboard (on web, path is /today)
    await expect(page).toHaveURL(/\/today/, { timeout: 10000 });
  });

  test('User can sign in with valid credentials and navigate to Today dashboard', async ({ page }) => {
    // First, register a user directly via backend API
    const rand = Math.floor(Math.random() * 1000000);
    const email = `login_user_${rand}@example.com`;
    const password = 'TestPassword123!';
    const name = 'Sam Developer';

    const res = await fetch('http://127.0.0.1:3000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    expect(res.ok).toBeTruthy();

    await expect(page.getByText('🌿 Lumen')).toBeVisible();
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Password').fill(password);

    // Click Sign in
    const signInBtn = page.getByRole('button', { name: 'Sign in', exact: true });
    await signInBtn.click();

    // Should redirect to Today tab (on web, path is /today)
    await expect(page).toHaveURL(/\/today/, { timeout: 10000 });

    // Verify tokens were saved in localStorage
    const accessToken = await page.evaluate(() => localStorage.getItem('lumen_access_token'));
    expect(accessToken).toBeTruthy();
  });
});
