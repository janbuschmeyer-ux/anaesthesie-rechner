# Deployment und PWA

## Lokaler Produktionsbuild

Root-Pfad:

```bash
VITE_BASE_PATH=/ pnpm build
pnpm preview
```

GitHub-Pages-Unterpfad:

```bash
VITE_BASE_PATH=/anaesthesie-rechner/ VITE_BUILD_ID=1.0.0-local pnpm build
VITE_BASE_PATH=/anaesthesie-rechner/ pnpm preview
```

`VITE_BUILD_ID` wird Bestandteil der eigenen Cache-Namen. Veröffentlichungen sollen Paketversion und Changelog aktualisieren.

## GitHub Pages

1. Repository zu GitHub pushen.
2. Settings → Pages → Source auf „GitHub Actions“ setzen.
3. `main` pushen oder Workflow manuell starten.
4. `.github/workflows/deploy.yml` setzt den Basispfad dynamisch auf den Repository-Namen.
5. Der Workflow führt Typprüfung, Linter, Coverage-Tests und Produktionsbuild aus.
6. Nur ein erfolgreicher Build wird als `dist`-Artefakt veröffentlicht.

GitHub Pages stellt HTTPS bereit. Es gibt kein Backend und keine Secrets.

## Pfadkonzept

- Vite-`base` stammt aus `VITE_BASE_PATH`.
- HTML-Assets werden durch Vite auf diesen Pfad umgeschrieben.
- `manifest.webmanifest` verwendet `./` für `id`, `start_url` und `scope`.
- Iconpfade im Manifest sind relativ zur Manifestdatei.
- Service Worker und Navigation-Fallback verwenden denselben Build-Basispfad.
- Hash-Navigation benötigt keine serverseitige Rewrite-Regel.

## Cache und Updates

- Precache enthält HTML, JavaScript, CSS, Manifest und Icons.
- Cache-Präfix: `anaesthesie-rechner`.
- Cache-Suffix: Build-ID.
- Nur veraltete Caches mit dem eigenen Präfix werden gelöscht.
- Der neue Service Worker wartet, bis „Jetzt neu laden“ gewählt wird.
- „Später“ lässt die aktuelle Version aktiv und bewahrt laufende Eingaben.
- Nach der ersten erfolgreichen Installation meldet die App ihre Offline-Bereitschaft.

## Prüfung vor Veröffentlichung

```bash
pnpm typecheck
pnpm lint
pnpm test:coverage
VITE_BASE_PATH=/anaesthesie-rechner/ pnpm build
pnpm test:e2e
```

Zusätzlich im gebauten `dist` prüfen:

- `index.html` referenziert nur `/anaesthesie-rechner/…`
- `manifest.webmanifest` und alle Icons existieren
- `sw.js` existiert und enthält das App-Shell-Manifest
- keine externen Runtime-URLs
- Navigation und Berechnungen funktionieren nach Offline-Neuladen

## Manuelle iPhone-Prüfung

1. veröffentlichte URL in Safari vollständig laden
2. Manifest-Icon und „Zum Home-Bildschirm“ prüfen
3. Standalone-Start ohne Safari-Adresszeile
4. Safe Areas in Hoch- und Querformat
5. Light und Dark Mode
6. kein Fokuszoom bei Eingaben
7. VoiceOver-Feldnamen, Fehler und Ergebnisankündigung
8. Flugmodus: Home-Screen-App neu starten und alle Rechner öffnen
9. neue Version veröffentlichen und Update-Hinweis prüfen

Automatisiertes Playwright-WebKit ist kein vollständiger Ersatz für branded Safari auf einem echten iPhone.
