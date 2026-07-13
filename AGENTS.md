# AGENTS.md

## Project

This repository contains a German-language, offline-capable Progressive Web App for mathematical medication-related unit conversions.

The application is designed primarily for mobile use on an iPhone.

## Core objective

Build a fast, transparent and maintainable mathematical calculator for:

- amount, volume and concentration
- dilution calculations
- weight-based calculations
- infusion and syringe-pump rate conversions
- supported physical and pharmacological units

The application must work without a backend and must be deployable as a static site.

## Intended-use boundary

This project is initially a development, demonstration and training prototype.

It performs mathematical conversions only.

It must not:

- recommend a medication
- recommend a dose
- select a clinically appropriate dose
- generate a diagnosis
- generate a treatment decision
- provide medication-specific standard doses
- provide automatically selected maximum doses
- claim that a dose is medically safe or appropriate
- replace a prescription, product information, institutional SOP or professional double-check
- store patient-related data

Never add clinical dose recommendations or drug presets unless the repository owner explicitly requests them and provides an approved, validated specification and source.

## Data protection

Do not add:

- user accounts
- analytics
- telemetry
- advertising
- tracking pixels
- external error tracking
- cloud synchronization
- calculation histories containing medical values
- patient identifiers
- external API calls

All calculations must be performed locally in the browser.

## Architecture

Prefer:

- Vite
- TypeScript
- semantic HTML
- modern CSS
- framework-free UI
- pure calculation functions
- a central typed unit-conversion system
- explicit validation
- static hosting
- GitHub Pages
- GitHub Actions
- a web app manifest
- a service worker
- offline-first static asset caching

Do not introduce React or another UI framework unless there is a documented and approved architectural reason.

Do not add runtime dependencies without a clear benefit.

## Calculation rules

Calculation code must be:

- deterministic
- side-effect free
- independent of the DOM
- independently testable
- strictly typed
- explicit about units
- explicit about dimensions
- transparent about formulas
- free of hidden defaults
- free of medication-specific assumptions

Never represent a medication value as an untyped number when its unit or dimension is required for correct interpretation.

Separate:

- raw user input
- parsed numeric value
- normalized internal value
- unit
- physical dimension
- unrounded result
- formatted result
- warnings
- validation errors

Do not round intermediate results unless mathematically necessary and documented.

## Unit safety

The application must distinguish at least:

- mass
- volume
- time
- body weight
- concentration
- biological activity
- dose
- dose rate
- volume rate

Reject dimensionally invalid combinations.

Conversions involving factors of 1,000, especially mg and µg, require a visible warning in the user interface.

International Units must not be converted generically into mass units.

Percentage conversions into mg/mL are only valid for explicitly identified weight-per-volume percentages.

## User input

Support both:

- decimal comma
- decimal point

Display German-formatted results by default.

Reject:

- negative values
- non-finite values
- invalid strings
- incompatible units
- division by zero
- invalid dilution relationships

Every displayed result must include its unit.

## User interface

The interface must be:

- German-language
- mobile first
- optimized for iPhone screens
- touch friendly
- keyboard accessible
- screen-reader friendly
- usable in light and dark mode
- compatible with safe-area insets
- readable without horizontal scrolling

Input font sizes must prevent unwanted iPhone zoom.

Do not use color as the only carrier of meaning.

Show the complete calculation path together with every result.

## PWA requirements

The production application must:

- include a valid web app manifest
- use standalone display mode
- have suitable app icons
- register a service worker
- cache all required static application files
- work offline after the initial successful load
- support versioned cache updates
- work from a GitHub Pages repository subpath
- avoid external runtime assets

## Testing requirements

Every formula and every unit conversion requires automated tests.

Tests must cover:

- normal values
- decimal comma
- decimal point
- zero
- negative values
- very small values
- very large values
- incompatible units
- factor-1,000 conversions
- rounding boundaries
- forward and reverse calculations
- dilution validation
- output formatting
- warnings
- deployment paths

A feature is not complete until its calculation logic is tested.

## Documentation

Keep these documents current:

- README.md
- docs/architecture.md
- docs/calculation-specification.md
- docs/unit-system.md
- docs/test-cases.md
- docs/safety-and-intended-use.md
- docs/deployment.md
- CHANGELOG.md

Any change to a formula, unit or rounding rule must update the relevant documentation and tests.

## Definition of done

Before completing a task:

1. run the TypeScript type check
2. run the linter
3. run all automated tests
4. create a production build
5. verify the GitHub Pages base path
6. verify the PWA manifest
7. verify the service-worker registration
8. check offline behavior where technically possible
9. summarize the changes
10. list any remaining manual verification steps

Never report successful completion when tests or builds are failing.

## Current implementation commands

The project uses the pinned pnpm version declared in `package.json`.

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test:coverage`
- `pnpm build`
- `pnpm test:e2e`

For GitHub Pages subpath verification, build with `VITE_BASE_PATH=/anaesthesie-rechner/`.
