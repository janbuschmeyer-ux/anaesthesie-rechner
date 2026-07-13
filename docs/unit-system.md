# Einheitensystem

## Dimensionsmodell

Jede Unit besitzt einen Laufzeitvektor aus Exponenten für:

- Masse
- biologische Aktivität
- Volumen
- Zeit
- Körpergewicht

Die TypeScript-Typen binden Unit-IDs zusätzlich an konkrete Größenarten. `g` als Wirkstoffmasse und `g` als Körpergewicht sind deshalb intern unterschiedliche Unit-IDs.

## Basiseinheiten

| Größe | Basis |
|---|---|
| Masse | `g` |
| biologische Aktivität | `IE` |
| Volumen | `L` |
| Zeit | `s` |
| Körpergewicht | `kg` |
| Massekonzentration | `g/L` |
| Aktivitätskonzentration | `IE/L` |
| absolute Masserate | `g/h` |
| gewichtsbezogene Masserate | `g/kg/h` |
| absolute Aktivitätsrate | `IE/h` |
| gewichtsbezogene Aktivitätsrate | `IE/kg/h` |
| Volumenrate | `L/h` |

Für abgeleitete Raten wird die Stunde als Basis verwendet. Dadurch bleiben die unterstützten Stunden- und Minutenfaktoren endliche Dezimalzahlen; `µg/min` wird exakt mit 60 nach `µg/h` skaliert.

## Unterstützte Einheiten

- Masse: `g`, `mg`, `µg`, `ng`
- Volumen: `L`, `mL`, `µL`
- Zeit: `h`, `min`, `s`
- Körpergewicht: `kg`, `g`
- Konzentration: `g/L`, `mg/mL`, `mg/L`, `µg/mL`, `µg/L`, `ng/mL`, `IE/mL`
- Dosis pro Gewicht: `mg/kg`, `µg/kg`
- absolute Rate: `mg/h`, `µg/h`, `µg/min`, `IE/h`
- gewichtsbezogene Rate: `mg/kg/h`, `µg/kg/h`, `µg/kg/min`, `IE/kg/h`
- Volumenrate: `mL/h`
- Aktivität: `IE`

## Exakte Faktoren

- `1 g = 1.000 mg = 1.000.000 µg = 1.000.000.000 ng`
- `1 L = 1.000 mL = 1.000.000 µL`
- `1 kg Körpergewicht = 1.000 g Körpergewicht`
- `1 mg/mL = 1 g/L`
- `1 mg/L = 0,001 g/L`
- `1 µg/mL = 0,001 g/L`
- `1 IE/mL = 1.000 IE/L`

Alle Faktoren stehen als Dezimalstrings im Registry-Modul. Jede Unit wird automatisiert zur Basis und zurück getestet.

## Sicherheitsregeln

- Nur identische Dimensionsvektoren dürfen konvertiert werden.
- IE besitzt keinen generischen Faktor zu Masse.
- Eine Mischung aus `mg` und `µg` erzeugt eine eigene Warnung.
- Präfixunterschiede von mindestens drei Zehnerpotenzen erzeugen eine Faktor-1.000-Warnung.
- Interne Normalisierung allein erzeugt keine Warnung; maßgeblich sind die sichtbar ausgewählten Einheiten.
- Prozentangaben gehören nicht zur allgemeinen Unit-Registry. `% w/v` ist ein expliziter Spezialrechner.
