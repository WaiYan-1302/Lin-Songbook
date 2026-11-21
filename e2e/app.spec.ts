import { expect, test } from '@playwright/test'

test('opens demo song and selects an actual C chord', async ({ page }) => {
  await page.goto('/songbook/demo-1')
  await expect(page.getByRole('heading', { name: 'Lanterns at Low Tide' })).toBeVisible()
  const sampleResponse = page.waitForResponse(response => response.url().endsWith('.ogg'))
  await page.getByRole('button', { name: 'C', exact: true }).first().click()
  expect((await sampleResponse).ok()).toBe(true)
  await expect(page.locator('.chord-panel').getByRole('img', { name: 'C chord diagram' })).toBeVisible()
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
  await expect(page).toHaveTitle("Fretbook")
  await expect(page.getByText("Fretbook", { exact: true })).toBeVisible()
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

test('song roadmap shows diagrams and saves a custom section', async ({ page }) => {
  await page.goto('/songbook/demo-1')
  await expect(page.getByRole('heading', { name: 'Chord roadmap' })).toBeVisible()
  await expect(page.locator('.song-roadmap').getByRole('img', { name: /chord diagram/ }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Customize' }).click()
  await page.getByRole('button', { name: 'Add another progression' }).click()
  const newProgression = page.locator('.roadmap-section').last()
  await newProgression.getByRole('textbox', { name: /Progression .* name/ }).fill('Solo')
  await newProgression.getByRole('textbox', { name: 'Add chords to Solo' }).fill('Dm G C')
  await newProgression.getByRole('button', { name: 'Add chords' }).click()
  await page.getByRole('button', { name: 'Save roadmap' }).click()
  await expect(page.getByRole('button', { name: 'Customize' })).toBeVisible()
  await page.reload()
  const solo = page.locator('.roadmap-section').filter({ hasText: 'Solo' })
  await expect(solo.getByRole('img', { name: 'Dm chord diagram' })).toBeVisible()
  await expect(solo.getByRole('img', { name: 'G chord diagram' })).toBeVisible()
  await expect(solo.getByRole('img', { name: 'C chord diagram' })).toBeVisible()
})
