import { test, expect } from '@playwright/test'

/**
 * Smoke tests — verify the app loads and core navigation works.
 * These run on every deploy.
 */
test.describe('Smoke', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('MoveOutSale')).toBeVisible()
  })

  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/MoveOutSale/)
  })

  test('protected route redirects to login', async ({ page }) => {
    await page.goto('/sell')
    await expect(page).toHaveURL(/\/login/)
  })
})
