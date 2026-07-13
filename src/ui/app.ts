import {
  calculateConcentration,
  calculateContainedAmount,
  calculateDilution,
  calculatePumpRateForward,
  calculatePumpRateReverse,
  calculateRequiredVolume,
  calculateWeightDose,
  calculateWeightVolumePercent,
  getUnit,
  isUnitOfKind,
  parseDecimalInput,
  quantity,
  unitSymbol,
  type AnyUnitId,
  type CalculationResult,
  type DecimalValue,
  type UnitId,
  type UnitKind
} from '../domain';

type CalculatorId =
  | 'konzentration'
  | 'volumen'
  | 'wirkstoffmenge'
  | 'verduennung'
  | 'gewichtsdosis'
  | 'rate'
  | 'prozent';

interface CalculatorMeta {
  readonly id: CalculatorId;
  readonly title: string;
  readonly short: string;
  readonly formula: string;
  readonly group: 'Grundrechner' | 'Gewicht und Raten' | 'Spezialumrechnung';
  readonly icon: string;
}

const calculators: readonly CalculatorMeta[] = [
  { id: 'konzentration', title: 'Konzentration berechnen', short: 'Konzentration', formula: 'Wirkstoffmenge ÷ Volumen', group: 'Grundrechner', icon: 'C' },
  { id: 'volumen', title: 'Benötigtes Volumen', short: 'Volumen', formula: 'Wirkstoffmenge ÷ Konzentration', group: 'Grundrechner', icon: 'V' },
  { id: 'wirkstoffmenge', title: 'Enthaltene Wirkstoffmenge', short: 'Wirkstoffmenge', formula: 'Konzentration × Volumen', group: 'Grundrechner', icon: 'M' },
  { id: 'verduennung', title: 'Verdünnung berechnen', short: 'Verdünnung', formula: 'C1 × V1 = C2 × V2', group: 'Grundrechner', icon: 'D' },
  { id: 'gewichtsdosis', title: 'Gewichtsbezogene Dosis', short: 'Dosis pro kg', formula: 'Gewicht × vorgegebene Dosis', group: 'Gewicht und Raten', icon: 'kg' },
  { id: 'rate', title: 'Infusions- und Perfusorrate', short: 'Pumpenrate', formula: 'Vorwärts- und Rückwärtsrechnung', group: 'Gewicht und Raten', icon: 'R' },
  { id: 'prozent', title: 'Prozentlösung (% w/v)', short: '% w/v', formula: '1 % w/v = 10 mg/mL', group: 'Spezialumrechnung', icon: '%' }
];

type Option = readonly [string, string];

const massOptions: readonly Option[] = [['g', 'g'], ['mg', 'mg'], ['ug', 'µg'], ['ng', 'ng']];
const amountOptions: readonly Option[] = [...massOptions, ['IU', 'IE']];
const volumeOptions: readonly Option[] = [['L', 'L'], ['mL', 'mL'], ['uL', 'µL']];
const weightOptions: readonly Option[] = [['kg_body', 'kg'], ['g_body', 'g']];
const concentrationOptions: readonly Option[] = [
  ['g_per_L', 'g/L'], ['mg_per_mL', 'mg/mL'], ['mg_per_L', 'mg/L'], ['ug_per_mL', 'µg/mL'],
  ['ug_per_L', 'µg/L'], ['ng_per_mL', 'ng/mL'], ['IU_per_mL', 'IE/mL']
];
const doseOptions: readonly Option[] = [['mg_per_kg', 'mg/kg'], ['ug_per_kg', 'µg/kg']];
const rateOptions: readonly Option[] = [
  ['mg_per_h', 'mg/h'], ['ug_per_h', 'µg/h'], ['ug_per_min', 'µg/min'], ['mg_per_kg_h', 'mg/kg/h'],
  ['ug_per_kg_h', 'µg/kg/h'], ['ug_per_kg_min', 'µg/kg/min'], ['IU_per_h', 'IE/h'], ['IU_per_kg_h', 'IE/kg/h']
];

const disclaimer = 'Dieses Tool führt ausschließlich mathematische Umrechnungen durch. Es prüft nicht, ob eine Dosierung medizinisch geeignet oder verordnet ist.';

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character] ?? character);
}

function optionsHtml(options: readonly Option[], placeholder = 'Einheit wählen', selected = ''): string {
  return [
    `<option value="">${escapeHtml(placeholder)}</option>`,
    ...options.map(([value, label]) => `<option value="${value}"${value === selected ? ' selected' : ''}>${escapeHtml(label)}</option>`)
  ].join('');
}

function numberField(id: string, label: string, hint?: string): string {
  return `<div class="field-group">
    <label for="${id}">${escapeHtml(label)}</label>
    <input id="${id}" name="${id}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="0,0" aria-describedby="${id}-error${hint ? ` ${id}-hint` : ''}" />
    ${hint ? `<p class="field-hint" id="${id}-hint">${escapeHtml(hint)}</p>` : ''}
    <p class="field-error" id="${id}-error" aria-live="polite"></p>
  </div>`;
}

function selectField(id: string, label: string, options: readonly Option[], selected = '', placeholder = 'Einheit wählen'): string {
  return `<div class="field-group">
    <label for="${id}">${escapeHtml(label)}</label>
    <select id="${id}" name="${id}" aria-describedby="${id}-error">${optionsHtml(options, placeholder, selected)}</select>
    <p class="field-error" id="${id}-error" aria-live="polite"></p>
  </div>`;
}

function pairedField(valueId: string, valueLabel: string, unitId: string, unitLabel: string, options: readonly Option[], selected = '', hint?: string): string {
  return `<div class="paired-fields">${numberField(valueId, valueLabel, hint)}${selectField(unitId, unitLabel, options, selected)}</div>`;
}

function formShell(content: string, extraClass = ''): string {
  return `<form class="calculator-form ${extraClass}" novalidate>
    <div class="form-errors" id="form-errors" tabindex="-1" role="alert" hidden></div>
    ${content}
    <div class="form-actions">
      <button class="button button-primary" type="submit">Berechnen</button>
      <button class="button button-secondary" type="reset">Eingaben löschen</button>
    </div>
  </form>
  <div id="calculation-result" class="result-region" aria-live="polite"></div>`;
}

function concentrationForm(): string {
  return formShell(`
    ${pairedField('amount', 'Wirkstoffmenge', 'amountUnit', 'Einheit der Wirkstoffmenge', amountOptions)}
    ${pairedField('volume', 'Gesamtvolumen', 'volumeUnit', 'Volumeneinheit', volumeOptions, 'mL')}
    ${selectField('outputUnit', 'Gewünschte Konzentrationseinheit', concentrationOptions)}
  `);
}

function requiredVolumeForm(): string {
  return formShell(`
    ${pairedField('amount', 'Gewünschte Wirkstoffmenge', 'amountUnit', 'Einheit der Wirkstoffmenge', amountOptions)}
    ${pairedField('concentration', 'Vorhandene Konzentration', 'concentrationUnit', 'Konzentrationseinheit', concentrationOptions)}
    ${selectField('outputUnit', 'Ausgabeeinheit des Volumens', volumeOptions, 'mL')}
  `);
}

function containedAmountForm(): string {
  return formShell(`
    ${pairedField('concentration', 'Konzentration', 'concentrationUnit', 'Konzentrationseinheit', concentrationOptions)}
    ${pairedField('volume', 'Verwendetes Volumen', 'volumeUnit', 'Volumeneinheit', volumeOptions, 'mL')}
    ${selectField('outputUnit', 'Ausgabeeinheit der Wirkstoffmenge', amountOptions)}
  `);
}

function dilutionForm(): string {
  return formShell(`
    <aside class="info-box"><strong>Nur Verdünnung:</strong> Dieser Rechner bildet keine Rekonstitution einer Trockensubstanz ab.</aside>
    ${pairedField('sourceConcentration', 'Ausgangskonzentration C1', 'sourceConcentrationUnit', 'Einheit C1', concentrationOptions)}
    ${pairedField('targetConcentration', 'Zielkonzentration C2', 'targetConcentrationUnit', 'Einheit C2', concentrationOptions)}
    ${pairedField('finalVolume', 'Gewünschtes Endvolumen V2', 'finalVolumeUnit', 'Volumeneinheit', volumeOptions, 'mL')}
    ${selectField('outputUnit', 'Ausgabeeinheit der Volumina', volumeOptions, 'mL')}
  `);
}

function weightDoseForm(): string {
  return formShell(`
    <aside class="info-box">Die Dosis pro kg wird ausschließlich von Ihnen eingegeben. Es wird kein Wert vorgeschlagen.</aside>
    ${pairedField('weight', 'Körpergewicht', 'weightUnit', 'Gewichtseinheit', weightOptions, 'kg_body')}
    ${pairedField('dose', 'Vorgegebene Dosis pro kg', 'doseUnit', 'Dosiseinheit', doseOptions)}
    ${pairedField('concentration', 'Vorhandene Konzentration', 'concentrationUnit', 'Konzentrationseinheit', concentrationOptions.filter(([id]) => id !== 'IU_per_mL'))}
    <div class="paired-fields">
      ${selectField('amountOutputUnit', 'Einheit der Gesamtwirkstoffmenge', massOptions, 'mg')}
      ${selectField('volumeOutputUnit', 'Einheit des Volumens', volumeOptions, 'mL')}
    </div>
  `);
}

function rateForm(): string {
  return formShell(`
    <fieldset class="mode-switch">
      <legend>Rechenrichtung</legend>
      <label><input type="radio" name="direction" value="forward" checked /> Rate → mL/h</label>
      <label><input type="radio" name="direction" value="reverse" /> mL/h → Rate</label>
    </fieldset>
    <section id="forwardFields" aria-label="Vorwärtsrechnung">
      ${pairedField('rate', 'Vorgegebene Rate', 'rateUnit', 'Rateneinheit', rateOptions)}
    </section>
    <section id="reverseFields" aria-label="Rückwärtsrechnung" hidden>
      ${pairedField('pumpRate', 'Pumpenrate', 'pumpRateUnit', 'Pumpeneinheit', [['mL_per_h', 'mL/h']], 'mL_per_h')}
    </section>
    <div id="weightFields" hidden>
      ${pairedField('weight', 'Körpergewicht', 'weightUnit', 'Gewichtseinheit', weightOptions, 'kg_body', 'Nur für Rateneinheiten pro kg erforderlich.')}
    </div>
    ${pairedField('concentration', 'Konzentration der Lösung', 'concentrationUnit', 'Konzentrationseinheit', concentrationOptions)}
    <section id="reverseOutput" hidden>
      ${selectField('outputUnit', 'Ziel-Rateneinheit', rateOptions)}
    </section>
  `, 'rate-form');
}

function percentForm(): string {
  return formShell(`
    <aside class="info-box">Eine Umrechnung in mg/mL ist nur für ausdrücklich angegebene Gewicht-zu-Volumen-Prozente (% w/v) definiert.</aside>
    ${selectField('percentType', 'Art der Prozentangabe', [['w/v', '% w/v – Gewicht/Volumen'], ['v/v', '% v/v – Volumen/Volumen'], ['w/w', '% w/w – Gewicht/Gewicht']], '', 'Prozentart wählen')}
    ${numberField('percent', 'Prozentwert')}
  `);
}

function calculatorForm(id: CalculatorId): string {
  switch (id) {
    case 'konzentration': return concentrationForm();
    case 'volumen': return requiredVolumeForm();
    case 'wirkstoffmenge': return containedAmountForm();
    case 'verduennung': return dilutionForm();
    case 'gewichtsdosis': return weightDoseForm();
    case 'rate': return rateForm();
    case 'prozent': return percentForm();
  }
}

function headerHtml(): string {
  return `<header class="app-header">
    <a class="brand" href="#start" aria-label="Zur Startseite">
      <span class="brand-mark" aria-hidden="true">∑</span>
      <span><strong>Umrechner</strong><small>Mathematische Einheiten</small></span>
    </a>
    <button id="theme-toggle" class="icon-button" type="button" aria-label="Farbschema ändern"><span aria-hidden="true">◐</span></button>
  </header>`;
}

function homeHtml(): string {
  const groups = ['Grundrechner', 'Gewicht und Raten', 'Spezialumrechnung'] as const;
  return `<main id="main-content" class="main-content">
    <section class="hero">
      <p class="eyebrow">Offlinefähige PWA</p>
      <h1>Mathematische Umrechnungen</h1>
      <p>Mengen, Konzentrationen, Verdünnungen und Raten transparent berechnen.</p>
    </section>
    <aside class="safety-notice"><strong>Zweckbestimmung</strong><p>${disclaimer}</p><p>Die medizinische Eignung wird nicht bewertet.</p></aside>
    ${groups.map((group) => `<section class="calculator-group"><h2>${group}</h2><div class="card-grid">
      ${calculators.filter((item) => item.group === group).map((item) => `<a class="calculator-card" href="#${item.id}">
        <span class="card-icon" aria-hidden="true">${item.icon}</span>
        <span><strong>${item.short}</strong><small>${item.formula}</small></span><span class="card-arrow" aria-hidden="true">›</span>
      </a>`).join('')}
    </div></section>`).join('')}
  </main>`;
}

function calculatorHtml(meta: CalculatorMeta): string {
  return `<main id="main-content" class="main-content calculator-page">
    <a class="back-link" href="#start">← Alle Rechner</a>
    <header class="calculator-heading"><span class="card-icon" aria-hidden="true">${meta.icon}</span><div><p class="eyebrow">Mathematischer Rechner</p><h1>${meta.title}</h1></div></header>
    <p class="calculator-intro">${meta.formula}. Alle Werte und Einheiten werden gemeinsam im Rechenweg dargestellt.</p>
    ${calculatorForm(meta.id)}
    <aside class="compact-disclaimer">${disclaimer}</aside>
  </main>`;
}

function appHtml(content: string): string {
  return `${headerHtml()}${content}<div id="pwa-status" class="pwa-status" aria-live="polite"></div><footer class="app-footer"><span>Version ${escapeHtml(__APP_VERSION__)}</span><span>Rechnet lokal im Browser</span></footer>`;
}

function routeFromHash(): CalculatorId | 'start' {
  const id = window.location.hash.slice(1);
  return calculators.some((item) => item.id === id) ? id as CalculatorId : 'start';
}

function getFormElement<T extends HTMLInputElement | HTMLSelectElement>(form: HTMLFormElement, id: string): T {
  const element = form.elements.namedItem(id);
  if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLSelectElement)) {
    throw new Error(`Form field not found: ${id}`);
  }
  return element as T;
}

interface FieldProblem {
  readonly field: string;
  readonly message: string;
}

function clearErrors(form: HTMLFormElement): void {
  form.querySelectorAll<HTMLElement>('.field-error').forEach((node) => { node.textContent = ''; });
  form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[aria-invalid="true"]').forEach((node) => node.removeAttribute('aria-invalid'));
  const summary = form.querySelector<HTMLElement>('#form-errors');
  if (summary) {
    summary.hidden = true;
    summary.textContent = '';
  }
}

function showProblems(form: HTMLFormElement, problems: readonly FieldProblem[]): void {
  for (const problem of problems) {
    const field = form.elements.namedItem(problem.field);
    if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) field.setAttribute('aria-invalid', 'true');
    const error = form.querySelector<HTMLElement>(`#${CSS.escape(problem.field)}-error`);
    if (error) error.textContent = problem.message;
  }
  const summary = form.querySelector<HTMLElement>('#form-errors');
  if (summary) {
    summary.innerHTML = `<strong>Bitte Eingaben prüfen</strong><ul>${problems.map(({ message }) => `<li>${escapeHtml(message)}</li>`).join('')}</ul>`;
    summary.hidden = false;
    summary.focus();
  }
}

function parseField(form: HTMLFormElement, id: string, allowZero: boolean, problems: FieldProblem[]): DecimalValue | undefined {
  const element = getFormElement<HTMLInputElement>(form, id);
  const result = parseDecimalInput(element.value, { allowZero });
  if (!result.valid) {
    problems.push({ field: id, message: result.error.message });
    return undefined;
  }
  return result.value;
}

function selectValue(form: HTMLFormElement, id: string, problems: FieldProblem[]): string | undefined {
  const element = getFormElement<HTMLSelectElement>(form, id);
  if (!element.value) {
    problems.push({ field: id, message: 'Bitte eine Einheit oder Option auswählen.' });
    return undefined;
  }
  return element.value;
}

function unitValue<K extends UnitKind>(form: HTMLFormElement, id: string, kind: K, problems: FieldProblem[]): UnitId<K> | undefined {
  const value = selectValue(form, id, problems);
  if (!value) return undefined;
  if (!isUnitOfKind(value, kind)) {
    problems.push({ field: id, message: 'Diese Einheit ist für dieses Feld nicht zulässig.' });
    return undefined;
  }
  return value;
}

function renderResult(result: CalculationResult): void {
  const region = document.querySelector<HTMLElement>('#calculation-result');
  if (!region) return;
  if (!result.valid) {
    region.innerHTML = `<section class="result-card error-card" tabindex="-1"><p class="eyebrow">Berechnung nicht möglich</p><h2>Eingaben und Einheiten prüfen</h2><ul>${result.errors.map((error) => `<li>${escapeHtml(error.message)}</li>`).join('')}</ul></section>`;
    region.querySelector<HTMLElement>('.result-card')?.focus();
    return;
  }

  region.innerHTML = `<article class="result-card" tabindex="-1">
    <p class="eyebrow">Mathematisches Ergebnis</p>
    <h2>Ergebnis und Rechenweg</h2>
    <div class="result-values">${result.outputs.map((item) => `<section><span>${escapeHtml(item.label)}</span><strong>${item.rounded ? '≈ ' : ''}${escapeHtml(item.displayValue)} <small>${escapeHtml(unitSymbol(item.resultUnit))}</small></strong>${item.rounded ? '<em>Für die Anzeige mathematisch gerundet</em>' : ''}</section>`).join('')}</div>
    ${result.warnings.length ? `<section class="warning-list" aria-label="Hinweise"><h3>Einheiten prüfen</h3>${result.warnings.map((warning) => `<p><span aria-hidden="true">!</span>${escapeHtml(warning.message)}</p>`).join('')}</section>` : ''}
    <section class="review-section"><h3>Eingaben</h3><dl>${result.enteredInputs.map((item) => `<div><dt>${escapeHtml(item.label)}</dt><dd>${escapeHtml(item.value)} ${escapeHtml(item.unit)}</dd></div>`).join('')}</dl></section>
    <section class="calculation-path"><h3>Vollständiger Rechenweg</h3><p class="formula">${escapeHtml(result.formula)}</p><p>${escapeHtml(result.substitution)}</p><ol>${result.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol></section>
    <details><summary>Normalisierte interne Werte</summary><dl>${result.normalizedInputs.map((item) => `<div><dt>${escapeHtml(item.label)}</dt><dd>${escapeHtml(item.value)} ${escapeHtml(item.unit)}</dd></div>`).join('')}</dl>${result.outputs.map((item) => `<p>Interner Wert ${escapeHtml(item.label)}: ${escapeHtml(item.unroundedValue)} ${escapeHtml(unitSymbol(item.resultUnit))}</p>`).join('')}</details>
    <p class="result-boundary">${disclaimer}</p>
  </article>`;
  region.querySelector<HTMLElement>('.result-card')?.focus();
}

function incompatibleProblem(form: HTMLFormElement, fields: readonly string[]): void {
  showProblems(form, fields.map((field) => ({ field, message: 'Diese Einheiten können in dieser Berechnung nicht miteinander kombiniert werden.' })));
}

function submitConcentration(form: HTMLFormElement): void {
  const problems: FieldProblem[] = [];
  const amount = parseField(form, 'amount', true, problems);
  const volume = parseField(form, 'volume', false, problems);
  const amountUnitRaw = selectValue(form, 'amountUnit', problems);
  const volumeUnit = unitValue(form, 'volumeUnit', 'volume', problems);
  const outputRaw = selectValue(form, 'outputUnit', problems);
  if (problems.length || !amount || !volume || !amountUnitRaw || !volumeUnit || !outputRaw) return showProblems(form, problems);
  if (isUnitOfKind(amountUnitRaw, 'mass') && isUnitOfKind(outputRaw, 'massConcentration')) {
    renderResult(calculateConcentration({ substance: 'mass', amount: quantity<'mass'>(amount, amountUnitRaw), volume: quantity<'volume'>(volume, volumeUnit), outputUnit: outputRaw }));
  } else if (isUnitOfKind(amountUnitRaw, 'activity') && isUnitOfKind(outputRaw, 'activityConcentration')) {
    renderResult(calculateConcentration({ substance: 'activity', amount: quantity<'activity'>(amount, amountUnitRaw), volume: quantity<'volume'>(volume, volumeUnit), outputUnit: outputRaw }));
  } else incompatibleProblem(form, ['amountUnit', 'outputUnit']);
}

function submitRequiredVolume(form: HTMLFormElement): void {
  const problems: FieldProblem[] = [];
  const amount = parseField(form, 'amount', true, problems);
  const concentration = parseField(form, 'concentration', false, problems);
  const amountUnitRaw = selectValue(form, 'amountUnit', problems);
  const concentrationRaw = selectValue(form, 'concentrationUnit', problems);
  const outputUnit = unitValue(form, 'outputUnit', 'volume', problems);
  if (problems.length || !amount || !concentration || !amountUnitRaw || !concentrationRaw || !outputUnit) return showProblems(form, problems);
  if (isUnitOfKind(amountUnitRaw, 'mass') && isUnitOfKind(concentrationRaw, 'massConcentration')) {
    renderResult(calculateRequiredVolume({ substance: 'mass', amount: quantity<'mass'>(amount, amountUnitRaw), concentration: quantity<'massConcentration'>(concentration, concentrationRaw), outputUnit }));
  } else if (isUnitOfKind(amountUnitRaw, 'activity') && isUnitOfKind(concentrationRaw, 'activityConcentration')) {
    renderResult(calculateRequiredVolume({ substance: 'activity', amount: quantity<'activity'>(amount, amountUnitRaw), concentration: quantity<'activityConcentration'>(concentration, concentrationRaw), outputUnit }));
  } else incompatibleProblem(form, ['amountUnit', 'concentrationUnit']);
}

function submitContainedAmount(form: HTMLFormElement): void {
  const problems: FieldProblem[] = [];
  const concentration = parseField(form, 'concentration', true, problems);
  const volume = parseField(form, 'volume', true, problems);
  const concentrationRaw = selectValue(form, 'concentrationUnit', problems);
  const volumeUnit = unitValue(form, 'volumeUnit', 'volume', problems);
  const outputRaw = selectValue(form, 'outputUnit', problems);
  if (problems.length || !concentration || !volume || !concentrationRaw || !volumeUnit || !outputRaw) return showProblems(form, problems);
  if (isUnitOfKind(concentrationRaw, 'massConcentration') && isUnitOfKind(outputRaw, 'mass')) {
    renderResult(calculateContainedAmount({ substance: 'mass', concentration: quantity<'massConcentration'>(concentration, concentrationRaw), volume: quantity<'volume'>(volume, volumeUnit), outputUnit: outputRaw }));
  } else if (isUnitOfKind(concentrationRaw, 'activityConcentration') && isUnitOfKind(outputRaw, 'activity')) {
    renderResult(calculateContainedAmount({ substance: 'activity', concentration: quantity<'activityConcentration'>(concentration, concentrationRaw), volume: quantity<'volume'>(volume, volumeUnit), outputUnit: outputRaw }));
  } else incompatibleProblem(form, ['concentrationUnit', 'outputUnit']);
}

function submitDilution(form: HTMLFormElement): void {
  const problems: FieldProblem[] = [];
  const c1 = parseField(form, 'sourceConcentration', false, problems);
  const c2 = parseField(form, 'targetConcentration', false, problems);
  const v2 = parseField(form, 'finalVolume', false, problems);
  const c1UnitRaw = selectValue(form, 'sourceConcentrationUnit', problems);
  const c2UnitRaw = selectValue(form, 'targetConcentrationUnit', problems);
  const v2Unit = unitValue(form, 'finalVolumeUnit', 'volume', problems);
  const outputUnit = unitValue(form, 'outputUnit', 'volume', problems);
  if (problems.length || !c1 || !c2 || !v2 || !c1UnitRaw || !c2UnitRaw || !v2Unit || !outputUnit) return showProblems(form, problems);
  if (isUnitOfKind(c1UnitRaw, 'massConcentration') && isUnitOfKind(c2UnitRaw, 'massConcentration')) {
    renderResult(calculateDilution({ substance: 'mass', sourceConcentration: quantity<'massConcentration'>(c1, c1UnitRaw), targetConcentration: quantity<'massConcentration'>(c2, c2UnitRaw), finalVolume: quantity<'volume'>(v2, v2Unit), outputUnit }));
  } else if (isUnitOfKind(c1UnitRaw, 'activityConcentration') && isUnitOfKind(c2UnitRaw, 'activityConcentration')) {
    renderResult(calculateDilution({ substance: 'activity', sourceConcentration: quantity<'activityConcentration'>(c1, c1UnitRaw), targetConcentration: quantity<'activityConcentration'>(c2, c2UnitRaw), finalVolume: quantity<'volume'>(v2, v2Unit), outputUnit }));
  } else incompatibleProblem(form, ['sourceConcentrationUnit', 'targetConcentrationUnit']);
}

function submitWeightDose(form: HTMLFormElement): void {
  const problems: FieldProblem[] = [];
  const weight = parseField(form, 'weight', false, problems);
  const dose = parseField(form, 'dose', true, problems);
  const concentration = parseField(form, 'concentration', false, problems);
  const weightUnit = unitValue(form, 'weightUnit', 'bodyWeight', problems);
  const doseUnit = unitValue(form, 'doseUnit', 'massDosePerWeight', problems);
  const concentrationUnit = unitValue(form, 'concentrationUnit', 'massConcentration', problems);
  const amountOutputUnit = unitValue(form, 'amountOutputUnit', 'mass', problems);
  const volumeOutputUnit = unitValue(form, 'volumeOutputUnit', 'volume', problems);
  if (problems.length || !weight || !dose || !concentration || !weightUnit || !doseUnit || !concentrationUnit || !amountOutputUnit || !volumeOutputUnit) return showProblems(form, problems);
  renderResult(calculateWeightDose({
    weight: quantity<'bodyWeight'>(weight, weightUnit), dose: quantity<'massDosePerWeight'>(dose, doseUnit),
    concentration: quantity<'massConcentration'>(concentration, concentrationUnit), amountOutputUnit, volumeOutputUnit
  }));
}

function rateTypeFromKind(kind: UnitKind): 'massAbsolute' | 'massWeight' | 'activityAbsolute' | 'activityWeight' | undefined {
  if (kind === 'massAbsoluteRate') return 'massAbsolute';
  if (kind === 'massWeightRate') return 'massWeight';
  if (kind === 'activityAbsoluteRate') return 'activityAbsolute';
  if (kind === 'activityWeightRate') return 'activityWeight';
  return undefined;
}

function submitRate(form: HTMLFormElement): void {
  const problems: FieldProblem[] = [];
  const direction = new FormData(form).get('direction') === 'reverse' ? 'reverse' : 'forward';
  const concentration = parseField(form, 'concentration', false, problems);
  const concentrationRaw = selectValue(form, 'concentrationUnit', problems);
  const selectedRateRaw = selectValue(form, direction === 'forward' ? 'rateUnit' : 'outputUnit', problems);
  if (!selectedRateRaw || !concentrationRaw) return showProblems(form, problems);
  const rateDefinition = getUnit(selectedRateRaw as AnyUnitId);
  const rateType = rateTypeFromKind(rateDefinition.kind);
  if (!rateType) {
    problems.push({ field: direction === 'forward' ? 'rateUnit' : 'outputUnit', message: 'Bitte eine unterstützte Rateneinheit wählen.' });
    return showProblems(form, problems);
  }
  const weighted = rateType === 'massWeight' || rateType === 'activityWeight';
  const weight = weighted ? parseField(form, 'weight', false, problems) : undefined;
  const weightUnit = weighted ? unitValue(form, 'weightUnit', 'bodyWeight', problems) : undefined;
  if (!concentration || problems.length || (weighted && (!weight || !weightUnit))) return showProblems(form, problems);

  const mass = rateType.startsWith('mass');
  if (mass && !isUnitOfKind(concentrationRaw, 'massConcentration')) return incompatibleProblem(form, ['concentrationUnit', direction === 'forward' ? 'rateUnit' : 'outputUnit']);
  if (!mass && !isUnitOfKind(concentrationRaw, 'activityConcentration')) return incompatibleProblem(form, ['concentrationUnit', direction === 'forward' ? 'rateUnit' : 'outputUnit']);

  if (direction === 'forward') {
    const rate = parseField(form, 'rate', true, problems);
    if (!rate || problems.length) return showProblems(form, problems);
    if (rateType === 'massAbsolute' && isUnitOfKind(selectedRateRaw, 'massAbsoluteRate') && isUnitOfKind(concentrationRaw, 'massConcentration')) {
      return renderResult(calculatePumpRateForward({ rateType, rate: quantity<'massAbsoluteRate'>(rate, selectedRateRaw), concentration: quantity<'massConcentration'>(concentration, concentrationRaw) }));
    }
    if (rateType === 'massWeight' && isUnitOfKind(selectedRateRaw, 'massWeightRate') && isUnitOfKind(concentrationRaw, 'massConcentration') && weight && weightUnit) {
      return renderResult(calculatePumpRateForward({ rateType, rate: quantity<'massWeightRate'>(rate, selectedRateRaw), concentration: quantity<'massConcentration'>(concentration, concentrationRaw), weight: quantity<'bodyWeight'>(weight, weightUnit) }));
    }
    if (rateType === 'activityAbsolute' && isUnitOfKind(selectedRateRaw, 'activityAbsoluteRate') && isUnitOfKind(concentrationRaw, 'activityConcentration')) {
      return renderResult(calculatePumpRateForward({ rateType, rate: quantity<'activityAbsoluteRate'>(rate, selectedRateRaw), concentration: quantity<'activityConcentration'>(concentration, concentrationRaw) }));
    }
    if (rateType === 'activityWeight' && isUnitOfKind(selectedRateRaw, 'activityWeightRate') && isUnitOfKind(concentrationRaw, 'activityConcentration') && weight && weightUnit) {
      return renderResult(calculatePumpRateForward({ rateType, rate: quantity<'activityWeightRate'>(rate, selectedRateRaw), concentration: quantity<'activityConcentration'>(concentration, concentrationRaw), weight: quantity<'bodyWeight'>(weight, weightUnit) }));
    }
  } else {
    const pumpRate = parseField(form, 'pumpRate', true, problems);
    if (!pumpRate || problems.length) return showProblems(form, problems);
    const pumpQuantity = quantity<'volumeRate'>(pumpRate, 'mL_per_h');
    if (rateType === 'massAbsolute' && isUnitOfKind(selectedRateRaw, 'massAbsoluteRate') && isUnitOfKind(concentrationRaw, 'massConcentration')) {
      return renderResult(calculatePumpRateReverse({ rateType, pumpRate: pumpQuantity, concentration: quantity<'massConcentration'>(concentration, concentrationRaw), outputUnit: selectedRateRaw }));
    }
    if (rateType === 'massWeight' && isUnitOfKind(selectedRateRaw, 'massWeightRate') && isUnitOfKind(concentrationRaw, 'massConcentration') && weight && weightUnit) {
      return renderResult(calculatePumpRateReverse({ rateType, pumpRate: pumpQuantity, concentration: quantity<'massConcentration'>(concentration, concentrationRaw), weight: quantity<'bodyWeight'>(weight, weightUnit), outputUnit: selectedRateRaw }));
    }
    if (rateType === 'activityAbsolute' && isUnitOfKind(selectedRateRaw, 'activityAbsoluteRate') && isUnitOfKind(concentrationRaw, 'activityConcentration')) {
      return renderResult(calculatePumpRateReverse({ rateType, pumpRate: pumpQuantity, concentration: quantity<'activityConcentration'>(concentration, concentrationRaw), outputUnit: selectedRateRaw }));
    }
    if (rateType === 'activityWeight' && isUnitOfKind(selectedRateRaw, 'activityWeightRate') && isUnitOfKind(concentrationRaw, 'activityConcentration') && weight && weightUnit) {
      return renderResult(calculatePumpRateReverse({ rateType, pumpRate: pumpQuantity, concentration: quantity<'activityConcentration'>(concentration, concentrationRaw), weight: quantity<'bodyWeight'>(weight, weightUnit), outputUnit: selectedRateRaw }));
    }
  }
  incompatibleProblem(form, ['concentrationUnit', direction === 'forward' ? 'rateUnit' : 'outputUnit']);
}

function submitPercent(form: HTMLFormElement): void {
  const problems: FieldProblem[] = [];
  const percent = parseField(form, 'percent', true, problems);
  const type = selectValue(form, 'percentType', problems);
  if (!percent || !type || problems.length) return showProblems(form, problems);
  if (type !== 'w/v' && type !== 'v/v' && type !== 'w/w') return;
  renderResult(calculateWeightVolumePercent(percent, type));
}

function updateRateFields(form: HTMLFormElement): void {
  const direction = new FormData(form).get('direction') === 'reverse' ? 'reverse' : 'forward';
  const forward = form.querySelector<HTMLElement>('#forwardFields');
  const reverse = form.querySelector<HTMLElement>('#reverseFields');
  const reverseOutput = form.querySelector<HTMLElement>('#reverseOutput');
  if (forward) forward.hidden = direction !== 'forward';
  if (reverse) reverse.hidden = direction !== 'reverse';
  if (reverseOutput) reverseOutput.hidden = direction !== 'reverse';
  const selected = getFormElement<HTMLSelectElement>(form, direction === 'forward' ? 'rateUnit' : 'outputUnit').value;
  const kind = selected ? getUnit(selected as AnyUnitId).kind : undefined;
  const weighted = kind === 'massWeightRate' || kind === 'activityWeightRate';
  const weightFields = form.querySelector<HTMLElement>('#weightFields');
  if (weightFields) weightFields.hidden = !weighted;
}

function installForm(meta: CalculatorMeta): void {
  const form = document.querySelector<HTMLFormElement>('.calculator-form');
  if (!form) return;
  let dirty = false;
  form.addEventListener('input', () => { dirty = true; });
  form.addEventListener('reset', () => {
    window.setTimeout(() => {
      dirty = false;
      clearErrors(form);
      const result = document.querySelector<HTMLElement>('#calculation-result');
      if (result) result.textContent = '';
      if (meta.id === 'rate') updateRateFields(form);
    });
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearErrors(form);
    switch (meta.id) {
      case 'konzentration': submitConcentration(form); break;
      case 'volumen': submitRequiredVolume(form); break;
      case 'wirkstoffmenge': submitContainedAmount(form); break;
      case 'verduennung': submitDilution(form); break;
      case 'gewichtsdosis': submitWeightDose(form); break;
      case 'rate': submitRate(form); break;
      case 'prozent': submitPercent(form); break;
    }
  });
  if (meta.id === 'rate') {
    form.addEventListener('change', () => updateRateFields(form));
    updateRateFields(form);
  }
  document.querySelector<HTMLAnchorElement>('.back-link')?.addEventListener('click', (event) => {
    if (dirty && !window.confirm('Die eingegebenen Werte werden verworfen. Zur Rechnerauswahl zurückkehren?')) event.preventDefault();
  });
}

type Theme = 'system' | 'light' | 'dark';
const themeKey = 'anaesthesia-calculator-theme';

function readTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(themeKey);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  const button = document.querySelector<HTMLButtonElement>('#theme-toggle');
  if (button) button.setAttribute('aria-label', `Farbschema ändern. Aktuell: ${theme === 'system' ? 'System' : theme === 'light' ? 'Hell' : 'Dunkel'}`);
}

function installThemeToggle(): void {
  let theme = readTheme();
  applyTheme(theme);
  document.querySelector<HTMLButtonElement>('#theme-toggle')?.addEventListener('click', () => {
    theme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    try {
      if (theme === 'system') window.localStorage.removeItem(themeKey);
      else window.localStorage.setItem(themeKey, theme);
    } catch {
      // Das Farbschema funktioniert weiterhin für diese Sitzung.
    }
    applyTheme(theme);
  });
}

export function renderApp(root: HTMLElement): void {
  const route = routeFromHash();
  if (route === 'start') {
    root.innerHTML = appHtml(homeHtml());
  } else {
    const meta = calculators.find((item) => item.id === route);
    if (!meta) return;
    root.innerHTML = appHtml(calculatorHtml(meta));
    installForm(meta);
  }
  installThemeToggle();
}
