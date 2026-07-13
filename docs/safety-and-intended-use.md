# Sicherheit und Zweckbestimmung

## Verbindliche Grenze

> Dieses Tool führt ausschließlich mathematische Umrechnungen durch. Es prüft nicht, ob eine Dosierung medizinisch geeignet oder verordnet ist.

Die Software ist zunächst ein Entwicklungs-, Schulungs- und Demonstrationsprototyp. Sie ersetzt keine Verordnung, Fachinformation, institutionelle SOP, ärztliche Entscheidung oder professionelle Doppelkontrolle.

## Bewusst nicht enthalten

- Medikamentenauswahl oder Medikamentenempfehlungen
- Dosierungsvorschläge oder vorausgefüllte Dosierungswerte
- klinische Standard- oder Höchstdosen
- Diagnosen oder Therapieentscheidungen
- Arzneimitteldatenbank oder externe API
- Aussage, dass ein Wert medizinisch sicher, korrekt, geeignet oder empfohlen sei
- Rekonstitution von Trockensubstanzen
- Verhältnisangaben wie `1:1.000`
- Umrechnung von IE in Masse
- Patientenidentifikatoren oder medizinische Historie

## Mathematische Schutzmechanismen

- strikt typisierte Einheiten und Laufzeit-Dimensionsprüfung
- getrennte Dimension für biologische Aktivität
- keine Berechnung bei leeren, negativen oder unzulässigen Werten
- formelabhängige Nullregeln
- Faktor-1.000- und mg/µg-Warnungen
- Hinweis bei sehr großer oder kleiner Zahlendarstellung
- jedes Ergebnis mit Einheit, Eingaben und Rechenweg
- keine automatische Ergebnisübernahme
- `% w/v` muss ausdrücklich ausgewählt werden
- `% v/v` und `% w/w` werden nicht in `mg/mL` umgerechnet
- Verdünnung ist sichtbar von Rekonstitution abgegrenzt

Warnungen sind rein mathematisch. Sie treffen keine Aussage über medizinische Plausibilität oder Eignung.

## Datenschutz

Die Anwendung speichert oder übermittelt keine medizinischen Eingaben. Eine Farbschema-Präferenz ist die einzige zulässige Local-Storage-Information. Der Service Worker cached nur statische Programmdateien.

Beim Aufruf einer veröffentlichten Website verarbeitet der Hostinganbieter technisch notwendige Verbindungsmetadaten. Diese Anwendung sendet keine Berechnungswerte an den Hoster.

## Klinische und regulatorische Nutzung

Vor jeder klinischen Verwendung wären mindestens erforderlich:

- unabhängige fachliche Prüfung aller Formeln und Unit-Faktoren
- dokumentierte Softwareverifikation und -validierung
- Risikomanagement und Usability-Engineering
- Bewertung der einschlägigen Medizinprodukte- und Datenschutzanforderungen
- kontrolliertes Änderungs-, Freigabe- und Incident-Verfahren
- Validierung gegen verbindliche lokale Prozesse

Der aktuelle Projektstand beansprucht keine solche Freigabe.
