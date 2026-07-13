# Rechenspezifikation

Alle Beispiele sind rein mathematische Referenzwerte und keine Dosierungsempfehlungen.

## Gemeinsame Regeln

- Alle Werte werden vor der Berechnung in ihre Basiseinheit überführt.
- Zwischenergebnisse werden nicht für die Anzeige gerundet.
- Masse und Internationale Einheiten sind getrennte Substanzdimensionen.
- Ein Ergebnis enthält immer eine Einheit.
- Negative Werte werden überall abgewiesen.
- Erwartbare Eingabefehler werden als strukturierte Fehler zurückgegeben, nicht als Exceptions.

## 1. Konzentration

`C = A / V`

- Menge `A` darf null sein.
- Volumen `V` muss größer als null sein.
- Masse erzeugt nur Massekonzentrationen; IE nur Aktivitätskonzentrationen.

Referenz: `12 mg / 3 mL = 4 mg/mL`.

## 2. Benötigtes Volumen

`V = A / C`

- gewünschte Menge darf null sein.
- Konzentration muss größer als null sein.
- Menge und Konzentrationszähler müssen zur gleichen Substanzfamilie gehören.

Referenz: `2 mg / 0,5 mg/mL = 4 mL`.

## 3. Enthaltene Wirkstoffmenge

`A = C × V`

- Konzentration und Volumen dürfen null sein.
- Massekonzentrationen erzeugen Masse; `IE/mL` erzeugt IE.

Referenz: `25 µg/mL × 4 mL = 100 µg`.

## 4. Verdünnung

`C1 × V1 = C2 × V2`

`V1 = C2 × V2 / C1`

`VVerdünnung = V2 − V1`

- `C1`, `C2` und `V2` müssen größer als null sein.
- `C2` darf nicht größer als `C1` sein.
- `V1` darf nicht größer als `V2` werden.
- `C1 = C2` ist zulässig und ergibt ein Verdünnungsvolumen von null.
- Rekonstitution von Trockensubstanzen ist ausdrücklich nicht abgebildet.

Referenz: `C1 = 10 mg/mL`, `C2 = 2 mg/mL`, `V2 = 50 mL`; daraus `V1 = 10 mL` und Verdünnungsvolumen `40 mL`.

## 5. Gewichtsbezogene Dosis

`A = W × D`

`V = A / C`

- Körpergewicht muss größer als null sein.
- die Dosis pro kg darf null sein und wird niemals vorgeschlagen.
- Konzentration muss größer als null sein.
- V1 unterstützt `mg/kg` und `µg/kg` mit Massekonzentrationen.

Referenz: `8 kg × 3 mg/kg = 24 mg`; `24 mg / 6 mg/mL = 4 mL`.

## 6. Infusions-/Perfusorrate

### Vorwärts

Absolute Rate:

`V̇ = R / C`

Gewichtsbezogene Rate:

`V̇ = R × W / C`

Das Ergebnis wird in `mL/h` ausgegeben.

### Rückwärts

Absolute Rate:

`R = V̇ × C`

Gewichtsbezogene Rate:

`R = V̇ × C / W`

Körpergewicht wird nur für Einheiten pro kg benötigt. Masseraten können nur mit Massekonzentrationen, IE-Raten nur mit `IE/mL` kombiniert werden.

Referenz: `0,2 µg/kg/min × 50 kg × 60 / 20 µg/mL = 30 mL/h`. Rückwärts ergibt derselbe Datensatz `0,2 µg/kg/min`.

## 7. Gewicht-zu-Volumen-Prozent

Nur für ausdrücklich ausgewählte `% w/v` gilt:

`1 % w/v = 1 g / 100 mL = 10 mg/mL`

`C = Prozentwert × 10 mg/mL`

`% v/v` und `% w/w` werden ohne weitere stoffbezogene Angaben abgewiesen.

## Anzeigepräzision

- intern 40 signifikante Dezimalstellen
- Hauptergebnis maximal acht signifikante Stellen
- nachgestellte Nullen werden entfernt
- Dezimalkomma in der Anzeige
- wissenschaftliche Darstellung außerhalb `10⁻⁹` bis unter `10⁹`
- `≈` kennzeichnet eine reine Anzeigerundung
- der interne Wert bleibt in der Prüfkarte einsehbar

Die Rundung ist ausschließlich mathematisch und enthält keine klinischen Rundungsregeln.
