# Architektur

## Ziele

Die Anwendung ist eine statische, offlinefähige Browser-App ohne Backend. Mathematische Korrektheit, explizite Einheiten und überprüfbare Rechenwege haben Vorrang vor visuellen oder komfortbezogenen Funktionen.

## Schichten

1. **DOM-Eingabe:** unveränderte Strings und sichtbare Unit-IDs
2. **Parser:** Dezimalkomma/-punkt, Syntax-, Vorzeichen- und Nullprüfung
3. **Typisierte Größe:** `Decimal`-Wert plus Unit-ID einer festgelegten Dimension
4. **Unit-Registry:** Laufzeit-Dimensionsvektor und exakter Faktor zur Basiseinheit
5. **Rechenfunktion:** reine, deterministische Mathematik ohne DOM-Zugriff
6. **Ergebnisobjekt:** Eingaben, Normalwerte, interne Werte, Ausgabewerte, Formel, Rechenweg, Warnungen oder strukturierte Fehler
7. **UI:** Formularsteuerung und barrierearme Darstellung
8. **PWA:** Registrierung, statischer Cache, Offline-Fallback und Update-Dialog

Die Domain-Module unter `src/domain/` importieren weder DOM- noch PWA-Code. Gleiche typisierte Eingaben erzeugen immer das gleiche Ergebnisobjekt.

## Zustandsmodell

- Formularwerte leben nur in den aktuellen DOM-Elementen.
- Ein Navigationwechsel verwirft Werte nach sichtbarer Bestätigung.
- URLs enthalten nur die Rechnerkennung als Hash.
- Ergebnisse werden nicht zwischen Rechnern übertragen.
- Es gibt keinen globalen medizinischen Anwendungszustand.
- Local Storage speichert ausschließlich `anaesthesia-calculator-theme`.

## Dezimalarithmetik

`decimal.js` wird mit 40 signifikanten Stellen und `ROUND_HALF_UP` konfiguriert. Eingaben gelangen ausschließlich als normalisierte Strings in die Bibliothek. Die Rechenkerne verwenden niemals `Number` oder `toNumber()`.

Die Abhängigkeit ist erforderlich, weil binäre JavaScript-Fließkommazahlen beispielsweise `0.3 - 0.1` nicht exakt dezimal darstellen. Eine eigene rationale Arithmetik wäre wartungsintensiver und fehleranfälliger. Die Bibliothek wird lokal gebündelt und führt keine Netzwerkzugriffe aus.

## Benutzeroberfläche

- frameworkfreies Rendering mit semantischen Formularen
- große native Steuerelemente und mindestens 16 px Eingabeschrift
- Hash-Navigation, damit GitHub Pages keine SPA-Rewrites benötigt
- Ergebnisprüfung nach explizitem „Berechnen“ statt während unvollständiger Eingabe
- Light/Dark/System-Schema über CSS-Variablen
- Safe-Area-Inset-Unterstützung und reduzierte Bewegung
- Ergebnisse und Fehler werden fokussiert und über Live-Regionen angekündigt

## PWA

`vite-plugin-pwa` injiziert die gebauten Asset-Revisionen in `src/sw.ts`. Der Service Worker:

- cached ausschließlich statische App-Dateien,
- verwendet Cache-Namen mit App-Präfix und Build-ID,
- löscht nur eigene veraltete Caches,
- liefert bei Navigation innerhalb des Scopes die App-Shell,
- aktiviert Updates erst nach sichtbarer Nutzerentscheidung.

Der Service Worker ist im Entwicklungsserver deaktiviert, um Cache-Verwechslungen bei der Entwicklung zu vermeiden.

## Abhängigkeitsgrenzen

- fachliche Laufzeit: `decimal.js`
- PWA-Bundle: Workbox-Module und `workbox-window`
- Entwicklung/Test: Vite, TypeScript, ESLint, Vitest, Playwright
- keine UI-, Routing-, State-, Netzwerk- oder Persistenzbibliothek
