import { expect, test } from '@playwright/test';

test('Startseite zeigt Zweckbestimmung und sieben Rechner', async ({ page }) => {
  await page.goto('');
  await expect(page.getByRole('heading', { name: 'Mathematische Umrechnungen' })).toBeVisible();
  await expect(page.getByText('Dieses Tool führt ausschließlich mathematische Umrechnungen durch.')).toBeVisible();
  await expect(page.locator('.calculator-card')).toHaveCount(7);
});

test('Konzentration mit Dezimalkomma zeigt Ergebnis und Rechenweg', async ({ page }) => {
  await page.goto('#konzentration');
  await page.getByLabel('Wirkstoffmenge', { exact: true }).fill('12,0');
  await page.getByLabel('Einheit der Wirkstoffmenge').selectOption('mg');
  await page.getByLabel('Gesamtvolumen').fill('3');
  await page.getByLabel('Gewünschte Konzentrationseinheit').selectOption('mg_per_mL');
  await page.getByRole('button', { name: 'Berechnen' }).click();
  await expect(page.getByText('4 mg/mL', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Vollständiger Rechenweg' })).toBeVisible();
  await expect(page.getByText('Konzentration = Wirkstoffmenge ÷ Gesamtvolumen')).toBeVisible();
});

test('mg/µg-Konflikt erzeugt beide Warnungen', async ({ page }) => {
  await page.goto('#volumen');
  await page.getByLabel('Gewünschte Wirkstoffmenge').fill('1');
  await page.getByLabel('Einheit der Wirkstoffmenge').selectOption('mg');
  await page.getByLabel('Vorhandene Konzentration').fill('100');
  await page.getByLabel('Konzentrationseinheit').selectOption('ug_per_mL');
  await page.getByRole('button', { name: 'Berechnen' }).click();
  await expect(page.getByText('10 mL', { exact: true })).toBeVisible();
  await expect(page.getByText(/Umrechnung um den Faktor 1\.000/)).toBeVisible();
  await expect(page.getByText(/mg und µg gemeinsam/)).toBeVisible();
});

test('Verdünnung weist C2 größer C1 ab', async ({ page }) => {
  await page.goto('#verduennung');
  await page.getByLabel('Ausgangskonzentration C1').fill('2');
  await page.getByLabel('Einheit C1').selectOption('mg_per_mL');
  await page.getByLabel('Zielkonzentration C2').fill('3');
  await page.getByLabel('Einheit C2').selectOption('mg_per_mL');
  await page.getByLabel('Gewünschtes Endvolumen V2').fill('10');
  await page.getByRole('button', { name: 'Berechnen' }).click();
  await expect(page.getByText(/Zielkonzentration darf bei einer Verdünnung nicht größer/)).toBeVisible();
});

test('gewichtete Rate ist vorwärts und rückwärts bedienbar', async ({ page }) => {
  await page.goto('#rate');
  await page.getByLabel('Vorgegebene Rate').fill('0.2');
  await page.getByLabel('Rateneinheit', { exact: true }).selectOption('ug_per_kg_min');
  await page.getByLabel('Körpergewicht').fill('50');
  await page.getByLabel('Konzentration der Lösung').fill('20');
  await page.getByLabel('Konzentrationseinheit').selectOption('ug_per_mL');
  await page.getByRole('button', { name: 'Berechnen' }).click();
  await expect(page.getByText('30 mL/h', { exact: true })).toBeVisible();

  await page.getByLabel('mL/h → Rate').check();
  await page.getByLabel('Pumpenrate').fill('30');
  await page.getByLabel('Ziel-Rateneinheit').selectOption('ug_per_kg_min');
  await page.getByRole('button', { name: 'Berechnen' }).click();
  await expect(page.getByText('0,2 µg/kg/min', { exact: true })).toBeVisible();
});

test('% w/v wird umgerechnet, % v/v wird sachlich abgewiesen', async ({ page }) => {
  await page.goto('#prozent');
  await page.getByLabel('Art der Prozentangabe').selectOption('w/v');
  await page.getByLabel('Prozentwert').fill('2');
  await page.getByRole('button', { name: 'Berechnen' }).click();
  await expect(page.getByText('20 mg/mL', { exact: true })).toBeVisible();

  await page.getByLabel('Art der Prozentangabe').selectOption('v/v');
  await page.getByRole('button', { name: 'Berechnen' }).click();
  await expect(page.getByText(/Nur % w\/v kann/)).toBeVisible();
});

test('mobile Ansicht bleibt ohne horizontalen Überlauf und mit großen Feldern', async ({ page }) => {
  await page.goto('#gewichtsdosis');
  const sizes = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    return {
      viewport,
      document: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll<HTMLElement>('body *')]
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.right > viewport + 0.5 || rect.left < -0.5;
        })
        .map((element) => ({ tag: element.tagName, className: element.className, rect: element.getBoundingClientRect().toJSON() })),
      inputFont: Number.parseFloat(getComputedStyle(document.querySelector('input')!).fontSize),
      buttonHeight: document.querySelector('button[type="submit"]')!.getBoundingClientRect().height
    };
  });
  expect(sizes.offenders).toEqual([]);
  expect(sizes.document).toBeLessThanOrEqual(sizes.viewport);
  expect(sizes.inputFont).toBeGreaterThanOrEqual(16);
  expect(sizes.buttonHeight).toBeGreaterThanOrEqual(44);
});

test('Manifest und Assets funktionieren im GitHub-Pages-Unterpfad', async ({ page, request }) => {
  await page.goto('');
  const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestLink).toContain('/anaesthesie-rechner/manifest.webmanifest');
  const response = await request.get(manifestLink!);
  expect(response.ok()).toBe(true);
  const manifest = await response.json() as { start_url: string; scope: string; display: string; icons: unknown[] };
  expect(manifest).toMatchObject({ start_url: './', scope: './', display: 'standalone' });
  expect(manifest.icons).toHaveLength(3);
});

test('App-Shell funktioniert nach Erstladung offline', async ({ page, context, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium' || testInfo.project.name !== 'chromium', 'Service-Worker-Offlinetest läuft in Chromium.');
  await page.goto('');
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) throw new Error('Service worker is not active');
  });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Mathematische Umrechnungen' })).toBeVisible();
  await page.goto(`${new URL(page.url()).origin}/anaesthesie-rechner/#konzentration`);
  await expect(page.getByRole('heading', { name: 'Konzentration berechnen' })).toBeVisible();
});
