# Anästhesie-Umrechnungsrechner

Deutschsprachige, offlinefähige Progressive Web App für transparente mathematische Einheiten- und Formelumrechnungen. Die Anwendung ist mobile-first gestaltet, rechnet vollständig lokal im Browser und kann als statische Website auf GitHub Pages veröffentlicht werden.

> Dieses Tool führt ausschließlich mathematische Umrechnungen durch. Es prüft nicht, ob eine Dosierung medizinisch geeignet oder verordnet ist.

## Zweckbestimmung

Die Anwendung ist ein Entwicklungs-, Schulungs- und Demonstrationsprototyp. Sie enthält keine Medikamentenempfehlungen, Dosisvorschläge, Arzneimittel-Presets, klinischen Grenzwerte, Diagnosen oder Therapieentscheidungen. Eine klinische Verwendung erfordert eine gesonderte fachliche Validierung, regulatorische Bewertung sowie die Beachtung von Verordnung, Fachinformation und institutionellen Vorgaben.

## Rechner

- Konzentration aus Wirkstoffmenge und Volumen
- benötigtes Volumen aus Wirkstoffmenge und Konzentration
- enthaltene Wirkstoffmenge aus Konzentration und Volumen
- Verdünnung nach `C1 × V1 = C2 × V2`
- gewichtsbezogene Dosis aus ausschließlich eingegebenen Werten
- Infusions-/Perfusorrate vorwärts und rückwärts
- explizite `% w/v`-Umrechnung in `mg/mL`

Jedes Ergebnis enthält Eingaben, Einheiten, Normalwerte, Formel, eingesetzte Zahlen, ungerundeten internen Wert, Anzeigeergebnis und Warnungen.

## Datenschutz und Offline-Funktion

- keine Benutzerkonten, Cookies, APIs, Telemetrie oder Analytics
- keine Übertragung von Eingaben oder Ergebnissen
- keine Berechnungshistorie oder Speicherung medizinischer Werte
- Local Storage enthält höchstens die nichtmedizinische Farbschema-Präferenz
- Cache Storage enthält ausschließlich statische App-Dateien
- vollständige Offline-Nutzung nach dem ersten erfolgreichen Laden

Beim initialen Abruf über GitHub Pages entstehen technisch notwendige HTTPS-Anfragen und Hosting-Metadaten. Berechnungswerte werden dabei nicht übertragen.

## Technischer Aufbau

- Vite und TypeScript
- semantisches HTML und modernes CSS ohne UI-Framework
- `decimal.js` für konfigurierbare Dezimalarithmetik mit 40 signifikanten Stellen
- zentrale typisierte Unit-Registry
- Vitest für Fachlogik und Playwright für Browser-/PWA-Tests
- `vite-plugin-pwa` und Workbox für App-Shell und kontrollierte Updates

`decimal.js` ist die einzige fachliche Laufzeitabhängigkeit. Sie verhindert typische Binärkommaartefakte von JavaScript-`number` und wird vollständig in die lokalen statischen Assets gebündelt. Workbox-Module werden ausschließlich für den lokalen Service Worker gebündelt; es gibt keine CDN-Laufzeitabhängigkeit.

## Lokale Entwicklung

Voraussetzungen:

- Node.js 24 oder kompatible aktuelle LTS-Version
- pnpm 11.7 oder kompatibel

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Die Entwicklungsumgebung registriert absichtlich keinen Service Worker. PWA- und Offline-Verhalten werden im Produktionsbuild geprüft.

## Prüfungen

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:coverage
pnpm build
pnpm exec playwright install chromium webkit
pnpm test:e2e
```

Vollständige lokale Qualitätsprüfung:

```bash
pnpm check
```

## GitHub-Pages-Unterpfad

Für ein Repository `anaesthesie-rechner`:

```bash
VITE_BASE_PATH=/anaesthesie-rechner/ pnpm build
```

Manifest, Service Worker, Icons und alle App-Assets verwenden relative beziehungsweise vom Vite-Basispfad abgeleitete URLs. Die Workflows unter `.github/workflows/` prüfen und veröffentlichen das `dist`-Verzeichnis.

## Installation auf dem iPhone

1. veröffentlichte HTTPS-Adresse in Safari öffnen
2. das vollständige erste Laden abwarten
3. Teilen → „Zum Home-Bildschirm“
4. App vom Home-Bildschirm starten
5. für die Offline-Prüfung anschließend Flugmodus aktivieren und die App erneut öffnen

## Dokumentation

- [Architektur](docs/architecture.md)
- [Rechenspezifikation](docs/calculation-specification.md)
- [Einheitensystem](docs/unit-system.md)
- [Testfälle](docs/test-cases.md)
- [Sicherheit und Zweckbestimmung](docs/safety-and-intended-use.md)
- [Deployment](docs/deployment.md)
