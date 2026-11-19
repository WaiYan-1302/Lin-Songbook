import { expect, test } from '@playwright/test'

test('opens demo song and selects an actual C chord', async ({ page }) => {
  await page.goto('/songbook/demo-1')
  await expect(page.getByRole('heading', { name: 'Lanterns at Low Tide' })).toBeVisible()
  const sampleResponse = page.waitForResponse(response => response.url().endsWith('.ogg'))
  await page.getByRole('button', { name: 'C', exact: true }).first().click()
  expect((await sampleResponse).ok()).toBe(true)
  await expect(page.getByRole('img', { name: 'C chord diagram' })).toBeVisible()
  await expect(page.getByText('Acoustic samples ready')).toBeAttached()
})

test('mobile library has no document-level horizontal overflow', async ({ page }) => {
  await page.goto('/songbook')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)
})

test('bundled songbook entries can be deleted persistently', async ({ page }) => {
  await page.goto('/songbook')
  const song = page.locator('.library-row').filter({ hasText: 'Lanterns at Low Tide' })
  await expect(song).toBeVisible()
  page.once('dialog', dialog => dialog.accept())
  await song.getByRole('button', { name: 'Delete Lanterns at Low Tide' }).click()
  await expect(song).not.toBeAttached()
  await page.reload()
  await expect(page.getByText('Lanterns at Low Tide', { exact: true })).not.toBeAttached()
})

test('desktop navigation can be hidden and restored', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await expect(page).toHaveTitle("Lin's Songbook")
  await expect(page.getByText("Lin's Songbook", { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Hide navigation' }).click()
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).not.toBeAttached()
  await page.getByRole('button', { name: 'Show navigation' }).click()
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
})

test('Chord Lab marks only fretted and muted strings', async ({ page }) => {
  await page.goto('/chord-lab?chord=Cadd9')
  await expect(page.getByRole('heading', { name: 'Cadd9', exact: true })).toBeVisible()
  await expect(page.locator('.fretboard button[data-active="true"]')).toHaveCount(3)
  await expect(page.locator('.fretboard button.open-position[data-active="true"]')).toHaveCount(0)
  await expect(page.locator('.fretboard .fret-row.muted')).toHaveCount(1)
})
