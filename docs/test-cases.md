# Testfälle

Alle Werte sind ausschließlich mathematische Testdaten und stellen keine medizinische Empfehlung dar.

## Referenzfälle

| Bereich | Eingabe und Rechenweg | Erwartung |
|---|---|---|
| Konzentration | `12 mg = 0,012 g`; `3 mL = 0,003 L`; `0,012 / 0,003` | `4 mg/mL` |
| Volumen | `2 mg / 0,5 mg/mL` | `4 mL` |
| Menge | `25 µg/mL × 4 mL` | `100 µg` |
| Verdünnung | `2 × 50 / 10`; `50 − 10` | `10 mL` und `40 mL` |
| Dosis pro kg | `8 kg × 3 mg/kg`; `24 / 6 mg/mL` | `24 mg` und `4 mL` |
| Rate pro kg | `0,2 µg/kg/min × 50 kg × 60 / 20 µg/mL` | `30 mL/h` |
| Rate rückwärts | `30 mL/h × 20 µg/mL / 50 kg / 60` | `0,2 µg/kg/min` |
| absolute Rate | `6 mg/h / 2 mg/mL` | `3 mL/h` |
| IE-Rate | `4 IE/kg/h × 25 kg / 50 IE/mL` | `2 mL/h` |
| Prozent | `2 g/100 mL = 2.000 mg/100 mL` | `20 mg/mL` |

## Parser

- Dezimalkomma und Dezimalpunkt ergeben denselben Decimal-Wert.
- führende und nachfolgende Leerzeichen werden entfernt.
- führende Null ist erforderlich.
- negative Werte, Pluszeichen, Exponentialschreibweise, Tausendertrennzeichen, gemischte Separatoren, leere Eingaben, `NaN` und `Infinity` werden abgewiesen.
- maximal 30 signifikante Stellen und 80 Eingabezeichen.

## Nullregeln

- Nullmenge ist bei Konzentration und benötigtem Volumen zulässig.
- Nullkonzentration ist nur bei reiner Multiplikation zulässig.
- Gesamtvolumen, Divisorkonzentration, Körpergewicht sowie `C1`, `C2`, `V2` müssen größer als null sein.
- Nullrate beziehungsweise Nullpumpenrate ergibt mathematisch null.

## Einheiten

- jede Unit: Basisnormalisierung und Rückweg
- `g ↔ mg`, `mg ↔ µg`, `µg ↔ ng`
- `L ↔ mL`, `mL ↔ µL`
- `kg ↔ g` Körpergewicht
- alle Konzentrations- und Ratenpaare
- inkompatible Dimensionsvektoren
- Masse-/IE-Mischung

## Warnungen

- `1 mg` mit `100 µg/mL`: Faktor-1.000- und mg/µg-Warnung
- `L` mit `mL`: Faktor-1.000-Warnung
- Körpergewicht `kg` mit `g`: Faktor-1.000-Warnung
- Ergebnis `< 0,001` oder `≥ 1.000.000` in gewählter Einheit: Größenhinweis
- mathematische Anzeigerundung: Präfix `≈`

## Verdünnungsfehler

- `C2 > C1`: Zielkonzentration und daraus folgend `V1 > V2`
- `C1`, `C2` oder `V2 = 0`
- Masse- und IE-Konzentration gemischt
- `C1 = C2`: gültig, Verdünnungsvolumen null

## Browser/PWA

- sieben Karten und Zweckbestimmung auf der Startseite
- Hauptpfad für Konzentration, Volumen, Verdünnung, Rate und Prozent
- Vorwärts-/Rückwärtsrechnung
- iPhone-Viewport ohne horizontalen Überlauf
- Eingabeschrift mindestens 16 px, Touch-Aktion mindestens 44 px
- Manifest unter GitHub-Pages-Unterpfad
- aktivierter Service Worker und Offline-Neuladen
- Home-Screen-Installation und VoiceOver zusätzlich manuell auf einem echten iPhone
