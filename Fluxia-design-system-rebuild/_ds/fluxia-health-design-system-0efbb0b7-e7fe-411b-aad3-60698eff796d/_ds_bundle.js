/* @ds-bundle: {"format":4,"namespace":"FluxiaHealthDesignSystem_0efbb0","components":[{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"IconButton","sourcePath":"components/buttons/IconButton.jsx"},{"name":"CalendarStrip","sourcePath":"components/data/CalendarStrip.jsx"},{"name":"MedicalNoteCard","sourcePath":"components/data/MedicalNoteCard.jsx"},{"name":"MetricCard","sourcePath":"components/data/MetricCard.jsx"},{"name":"TimelineItem","sourcePath":"components/data/TimelineItem.jsx"},{"name":"AlertBanner","sourcePath":"components/feedback/AlertBanner.jsx"},{"name":"BottomSheet","sourcePath":"components/feedback/BottomSheet.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"Modal","sourcePath":"components/feedback/Modal.jsx"},{"name":"ProgressBar","sourcePath":"components/feedback/ProgressBar.jsx"},{"name":"Spinner","sourcePath":"components/feedback/Spinner.jsx"},{"name":"Skeleton","sourcePath":"components/feedback/Spinner.jsx"},{"name":"LoadingBlock","sourcePath":"components/feedback/Spinner.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"DatePicker","sourcePath":"components/forms/DatePicker.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"RadioCard","sourcePath":"components/forms/RadioCard.jsx"},{"name":"SegmentedControl","sourcePath":"components/forms/SegmentedControl.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Slider","sourcePath":"components/forms/Slider.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"TimePicker","sourcePath":"components/forms/TimePicker.jsx"},{"name":"BloodMucusSelector","sourcePath":"components/health/BloodMucusSelector.jsx"},{"name":"BowelLog","sourcePath":"components/health/BowelLog.jsx"},{"name":"BristolScaleSelector","sourcePath":"components/health/BristolScaleSelector.jsx"},{"name":"ClinicalAlertCard","sourcePath":"components/health/ClinicalAlertCard.jsx"},{"name":"DailySummaryCard","sourcePath":"components/health/DailySummaryCard.jsx"},{"name":"ExportReportButton","sourcePath":"components/health/ExportReportButton.jsx"},{"name":"FluidIntakeSelector","sourcePath":"components/health/FluidIntakeSelector.jsx"},{"name":"MedicationField","sourcePath":"components/health/MedicationField.jsx"},{"name":"PainSelector","sourcePath":"components/health/PainSelector.jsx"},{"name":"ProfessionalReviewCard","sourcePath":"components/health/ProfessionalReviewCard.jsx"},{"name":"QuickLogCard","sourcePath":"components/health/QuickLogCard.jsx"},{"name":"SymptomTags","sourcePath":"components/health/SymptomTags.jsx"},{"name":"UrgencySelector","sourcePath":"components/health/UrgencySelector.jsx"},{"name":"UrinationLog","sourcePath":"components/health/UrinationLog.jsx"},{"name":"WeeklyTrendCard","sourcePath":"components/health/WeeklyTrendCard.jsx"},{"name":"BottomNav","sourcePath":"components/navigation/BottomNav.jsx"},{"name":"TopBar","sourcePath":"components/navigation/TopBar.jsx"},{"name":"Badge","sourcePath":"components/surfaces/Badge.jsx"},{"name":"Card","sourcePath":"components/surfaces/Card.jsx"},{"name":"Tag","sourcePath":"components/surfaces/Tag.jsx"}],"sourceHashes":{"components/_internal/fxStyle.js":"f127b728178f","components/buttons/Button.jsx":"5535b48481c6","components/buttons/IconButton.jsx":"961f69298b12","components/data/CalendarStrip.jsx":"c19d7fefb864","components/data/MedicalNoteCard.jsx":"89ac647d6ab8","components/data/MetricCard.jsx":"531051375ec2","components/data/TimelineItem.jsx":"6b087b7cc4a1","components/feedback/AlertBanner.jsx":"2b4961f1ff8a","components/feedback/BottomSheet.jsx":"324045f61604","components/feedback/EmptyState.jsx":"d64097eac259","components/feedback/Modal.jsx":"55213e97883c","components/feedback/ProgressBar.jsx":"4452469a7b1f","components/feedback/Spinner.jsx":"d423b58b95d7","components/feedback/Toast.jsx":"2eff44ff247f","components/forms/Checkbox.jsx":"97163ceafab7","components/forms/DatePicker.jsx":"f02b7c903727","components/forms/Input.jsx":"2c4ef644993a","components/forms/RadioCard.jsx":"86df1750f508","components/forms/SegmentedControl.jsx":"31b8a82f80a2","components/forms/Select.jsx":"cbb2f4ca02fa","components/forms/Slider.jsx":"cc979237646f","components/forms/Switch.jsx":"e752b3b10b06","components/forms/Textarea.jsx":"cfdb26c73f6c","components/forms/TimePicker.jsx":"094883fc74fe","components/health/BloodMucusSelector.jsx":"d567800507f6","components/health/BowelLog.jsx":"81755569a2b8","components/health/BristolScaleSelector.jsx":"b3084309daa5","components/health/ClinicalAlertCard.jsx":"aaa906a7787f","components/health/DailySummaryCard.jsx":"a8aa57cacea1","components/health/ExportReportButton.jsx":"dda361963a9f","components/health/FluidIntakeSelector.jsx":"304856448c66","components/health/MedicationField.jsx":"bfd64097a570","components/health/PainSelector.jsx":"9d4e3aeff669","components/health/ProfessionalReviewCard.jsx":"717affc844eb","components/health/QuickLogCard.jsx":"0ba767e594dd","components/health/SymptomTags.jsx":"2f4dfea7e855","components/health/UrgencySelector.jsx":"18be0fd5c49f","components/health/UrinationLog.jsx":"d22dae60ad4e","components/health/WeeklyTrendCard.jsx":"d4be262ee499","components/navigation/BottomNav.jsx":"4084ef25da2c","components/navigation/TopBar.jsx":"f52c78b5477f","components/surfaces/Badge.jsx":"126639524743","components/surfaces/Card.jsx":"2c12c97ff154","components/surfaces/Tag.jsx":"49b4a8960aab","ui_kits/fluxia-app/app.jsx":"924f053ec55c","ui_kits/fluxia-app/logflows.jsx":"414901938446","ui_kits/fluxia-app/screens-account.jsx":"313cdaace2aa","ui_kits/fluxia-app/screens-main.jsx":"c6264a23c38a"},"inlinedExternals":[],"unexposedExports":[{"name":"fieldChromeCss","sourcePath":"components/_internal/fxStyle.js"},{"name":"injectStyle","sourcePath":"components/_internal/fxStyle.js"}]} */

(() => {

const __ds_ns = (window.FluxiaHealthDesignSystem_0efbb0 = window.FluxiaHealthDesignSystem_0efbb0 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/_internal/fxStyle.js
try { (() => {
// Internal: inject a component's CSS once. Lowercase export → not exposed on the public namespace.
const _done = typeof window !== 'undefined' && (window.__fxStyles || (window.__fxStyles = new Set())) || new Set();
// Shared field chrome (label, helper, error) used by Input, Textarea, Select.
const fieldChromeCss = `
.fx-field{ display:flex; flex-direction:column; gap:7px; font-family:var(--font-sans); }
.fx-field__label{ font-size:var(--text-label); font-weight:var(--weight-medium); color:var(--text-secondary); }
.fx-field__req{ color:var(--color-error); margin-left:2px; }
.fx-field--error .fx-input, .fx-field--error .fx-textarea, .fx-field--error .fx-select{ border-color:var(--color-error); }
.fx-field--error .fx-input:focus, .fx-field--error .fx-textarea:focus, .fx-field--error .fx-select:focus{ box-shadow:0 0 0 3px rgba(210,100,100,.3); }
.fx-field__help{ font-size:var(--text-caption); color:var(--text-tertiary); }
.fx-field__help--error{ color:var(--color-error); display:flex; align-items:center; gap:5px; }
`;
function injectStyle(id, css) {
  if (typeof document === 'undefined' || _done.has(id)) return;
  _done.add(id);
  const s = document.createElement('style');
  s.setAttribute('data-fx', id);
  s.textContent = css;
  document.head.appendChild(s);
}
Object.assign(__ds_scope, { fieldChromeCss, injectStyle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/_internal/fxStyle.js", error: String((e && e.message) || e) }); }

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.fx-btn{
  --_bg: var(--color-primary); --_fg: var(--color-on-primary); --_bd: transparent; --_hover: var(--color-primary-hover); --_active: var(--color-primary-active);
  display:inline-flex; align-items:center; justify-content:center; gap:.55em;
  font-family:var(--font-sans); font-weight:var(--weight-semibold); letter-spacing:-0.01em;
  border:1.5px solid var(--_bd); border-radius:var(--radius-pill); cursor:pointer;
  background:var(--_bg); color:var(--_fg); text-decoration:none; white-space:nowrap;
  transition:var(--transition-colors), transform var(--duration-fast) var(--ease-out);
  -webkit-tap-highlight-color:transparent;
}
.fx-btn:hover{ background:var(--_hover); }
.fx-btn:active{ transform:scale(.98); background:var(--_active); }
.fx-btn:focus-visible{ outline:none; box-shadow:var(--focus-ring); }
.fx-btn--md{ min-height:48px; padding:0 22px; font-size:var(--text-body); }
.fx-btn--lg{ min-height:56px; padding:0 28px; font-size:var(--text-body-lg); }
.fx-btn--sm{ min-height:40px; padding:0 16px; font-size:var(--text-label); }
.fx-btn--full{ width:100%; }
.fx-btn--primary{ box-shadow:var(--shadow-primary); }
.fx-btn--primary:hover{ box-shadow:var(--shadow-primary); }
.fx-btn--secondary{ --_bg:var(--color-secondary); --_hover:var(--color-secondary-hover); --_active:var(--green-700); box-shadow:var(--shadow-secondary); }
.fx-btn--ghost{ --_bg:transparent; --_fg:var(--color-primary); --_bd:var(--border); --_hover:var(--color-primary-soft); --_active:var(--blue-100); }
.fx-btn--ghost:hover{ color:var(--color-primary-hover); }
.fx-btn--quiet{ --_bg:transparent; --_fg:var(--text-secondary); --_bd:transparent; --_hover:var(--ink-100); --_active:var(--ink-150); }
.fx-btn--quiet:hover{ color:var(--text-primary); }
.fx-btn--destructive{ --_bg:var(--color-error); --_fg:#fff; --_hover:var(--error-600); --_active:var(--error-700); }
.fx-btn[disabled], .fx-btn[aria-disabled="true"]{
  cursor:not-allowed; background:var(--disabled-bg); color:var(--disabled-text); border-color:var(--disabled-border);
  box-shadow:none; transform:none; pointer-events:none;
}
.fx-btn__icon{ display:inline-flex; width:1.25em; height:1.25em; }
.fx-btn__icon svg{ width:100%; height:100%; }
`;
let injected = false;
function ensure() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const s = document.createElement('style');
  s.setAttribute('data-fx', 'button');
  s.textContent = CSS;
  document.head.appendChild(s);
}

/**
 * Fluxia primary action button. Pill-shaped, large touch target (≥48px).
 */
function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leadingIcon = null,
  trailingIcon = null,
  disabled = false,
  as = 'button',
  className = '',
  children,
  ...rest
}) {
  ensure();
  const Tag = as;
  const cls = ['fx-btn', `fx-btn--${variant}`, `fx-btn--${size}`, fullWidth ? 'fx-btn--full' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: cls,
    disabled: Tag === 'button' ? disabled : undefined,
    "aria-disabled": disabled || undefined
  }, rest), leadingIcon && /*#__PURE__*/React.createElement("span", {
    className: "fx-btn__icon",
    "aria-hidden": "true"
  }, leadingIcon), children, trailingIcon && /*#__PURE__*/React.createElement("span", {
    className: "fx-btn__icon",
    "aria-hidden": "true"
  }, trailingIcon));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/buttons/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.fx-iconbtn{
  display:inline-flex; align-items:center; justify-content:center;
  background:var(--color-surface); color:var(--ink-700); border:1.5px solid var(--border);
  border-radius:var(--radius-pill); cursor:pointer; padding:0;
  transition:var(--transition-colors), transform var(--duration-fast) var(--ease-out);
  -webkit-tap-highlight-color:transparent;
}
.fx-iconbtn:hover{ background:var(--ink-50); color:var(--text-primary); border-color:var(--border-strong); }
.fx-iconbtn:active{ transform:scale(.96); }
.fx-iconbtn:focus-visible{ outline:none; box-shadow:var(--focus-ring); }
.fx-iconbtn--md{ width:48px; height:48px; }
.fx-iconbtn--sm{ width:40px; height:40px; }
.fx-iconbtn--lg{ width:56px; height:56px; }
.fx-iconbtn svg{ width:1.45em; height:1.45em; }
.fx-iconbtn--md svg{ font-size:18px; } .fx-iconbtn--sm svg{ font-size:16px; } .fx-iconbtn--lg svg{ font-size:20px; }
.fx-iconbtn--solid{ background:var(--color-primary); color:#fff; border-color:transparent; box-shadow:var(--shadow-primary); }
.fx-iconbtn--solid:hover{ background:var(--color-primary-hover); color:#fff; }
.fx-iconbtn--glass{ background:var(--color-surface-glass); -webkit-backdrop-filter:blur(var(--blur-glass)); backdrop-filter:blur(var(--blur-glass)); border-color:rgba(255,255,255,.6); }
.fx-iconbtn[disabled]{ cursor:not-allowed; background:var(--disabled-bg); color:var(--disabled-text); border-color:var(--disabled-border); pointer-events:none; }
`;
let injected = false;
function ensure() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const s = document.createElement('style');
  s.setAttribute('data-fx', 'iconbtn');
  s.textContent = CSS;
  document.head.appendChild(s);
}

/** Circular icon-only button. Requires an accessible label. */
function IconButton({
  icon,
  label,
  variant = 'default',
  size = 'md',
  className = '',
  ...rest
}) {
  ensure();
  const cls = ['fx-iconbtn', `fx-iconbtn--${size}`, variant !== 'default' ? `fx-iconbtn--${variant}` : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: cls,
    "aria-label": label,
    title: label
  }, rest), icon);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/data/CalendarStrip.jsx
try { (() => {
const CSS = `
.fx-calstrip{ font-family:var(--font-sans); display:flex; gap:8px; overflow-x:auto; padding:4px 2px; scrollbar-width:none; }
.fx-calstrip::-webkit-scrollbar{ display:none; }
.fx-calday{
  flex:none; width:52px; min-height:72px; border-radius:var(--radius-lg); border:1.5px solid var(--border-soft);
  background:var(--color-surface); cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px;
  transition:var(--transition-colors), transform var(--duration-fast) var(--ease-out); -webkit-tap-highlight-color:transparent;
}
.fx-calday:hover{ border-color:var(--border-strong); }
.fx-calday:active{ transform:scale(.96); }
.fx-calday__dow{ font-size:11px; font-weight:var(--weight-medium); color:var(--text-tertiary); text-transform:uppercase; }
.fx-calday__num{ font-size:var(--text-title); font-weight:var(--weight-semibold); color:var(--text-primary); font-variant-numeric:tabular-nums; }
.fx-calday__dot{ width:6px; height:6px; border-radius:50%; background:var(--color-secondary); }
.fx-calday__dot--empty{ background:transparent; }
.fx-calday--selected{ background:var(--gradient-primary); border-color:transparent; box-shadow:var(--shadow-primary); }
.fx-calday--selected .fx-calday__dow, .fx-calday--selected .fx-calday__num{ color:#fff; }
.fx-calday--selected .fx-calday__dot{ background:rgba(255,255,255,.9); }
.fx-calday--today .fx-calday__num{ color:var(--color-primary); }
.fx-calday--today.fx-calday--selected .fx-calday__num{ color:#fff; }
`;

/** Horizontal day selector (calendar strip) with per-day activity dots. */
function CalendarStrip({
  days = [],
  value,
  onChange,
  className = ''
}) {
  __ds_scope.injectStyle('calstrip', CSS);
  return /*#__PURE__*/React.createElement("div", {
    className: ['fx-calstrip', className].filter(Boolean).join(' '),
    role: "tablist"
  }, days.map(d => {
    const sel = d.date === value;
    return /*#__PURE__*/React.createElement("button", {
      key: d.date,
      role: "tab",
      "aria-selected": sel,
      className: ['fx-calday', sel ? 'fx-calday--selected' : '', d.today ? 'fx-calday--today' : ''].filter(Boolean).join(' '),
      onClick: () => onChange && onChange(d.date)
    }, /*#__PURE__*/React.createElement("span", {
      className: "fx-calday__dow"
    }, d.dow), /*#__PURE__*/React.createElement("span", {
      className: "fx-calday__num"
    }, d.day), /*#__PURE__*/React.createElement("span", {
      className: `fx-calday__dot${d.count ? '' : ' fx-calday__dot--empty'}`
    }));
  }));
}
Object.assign(__ds_scope, { CalendarStrip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/CalendarStrip.jsx", error: String((e && e.message) || e) }); }

// components/data/MedicalNoteCard.jsx
try { (() => {
const CSS = `
.fx-note{ font-family:var(--font-sans); background:var(--color-surface); border-radius:var(--radius-xl); box-shadow:var(--shadow-sm); padding:18px; box-sizing:border-box; border-left:none; }
.fx-note__head{ display:flex; align-items:center; gap:12px; margin-bottom:12px; }
.fx-note__avatar{ width:42px; height:42px; border-radius:50%; flex:none; background:var(--gradient-flow); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:var(--weight-semibold); font-size:var(--text-body); }
.fx-note__avatar img{ width:100%; height:100%; border-radius:50%; object-fit:cover; }
.fx-note__who{ flex:1; min-width:0; }
.fx-note__name{ font-size:var(--text-body); font-weight:var(--weight-semibold); color:var(--text-primary); }
.fx-note__role{ font-size:var(--text-caption); color:var(--text-tertiary); }
.fx-note__date{ font-size:var(--text-caption); color:var(--text-tertiary); white-space:nowrap; }
.fx-note__body{ font-size:var(--text-body); color:var(--text-secondary); line-height:1.55; }
.fx-note__quote{ background:var(--ink-50); border-radius:var(--radius-md); padding:13px 15px; }
`;

/** Card for a clinician's note / observation, with author, role and date. */
function MedicalNoteCard({
  author,
  role,
  date,
  avatar,
  initials,
  children,
  quote = false,
  className = ''
}) {
  __ds_scope.injectStyle('note', CSS);
  return /*#__PURE__*/React.createElement("div", {
    className: ['fx-note', className].filter(Boolean).join(' ')
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-note__head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-note__avatar"
  }, avatar ? /*#__PURE__*/React.createElement("img", {
    src: avatar,
    alt: ""
  }) : initials || (author ? author.slice(0, 2) : '·')), /*#__PURE__*/React.createElement("div", {
    className: "fx-note__who"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-note__name"
  }, author), role && /*#__PURE__*/React.createElement("div", {
    className: "fx-note__role"
  }, role)), date && /*#__PURE__*/React.createElement("div", {
    className: "fx-note__date"
  }, date)), /*#__PURE__*/React.createElement("div", {
    className: `fx-note__body${quote ? ' fx-note__quote' : ''}`
  }, children));
}
Object.assign(__ds_scope, { MedicalNoteCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/MedicalNoteCard.jsx", error: String((e && e.message) || e) }); }

// components/data/MetricCard.jsx
try { (() => {
const CSS = `
.fx-metric{ font-family:var(--font-sans); background:var(--color-surface); border-radius:var(--radius-xl); box-shadow:var(--shadow-sm); padding:18px; box-sizing:border-box; display:flex; flex-direction:column; gap:10px; }
.fx-metric__top{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
.fx-metric__label{ font-size:var(--text-label); color:var(--text-secondary); font-weight:var(--weight-medium); }
.fx-metric__icon{ width:40px; height:40px; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; flex:none; }
.fx-metric__icon svg{ width:22px; height:22px; }
.fx-metric__icon--primary{ background:var(--color-primary-soft); color:var(--color-primary); }
.fx-metric__icon--secondary{ background:var(--color-secondary-soft); color:var(--color-secondary); }
.fx-metric__icon--accent{ background:var(--color-accent-soft); color:var(--color-accent); }
.fx-metric__icon--warning{ background:var(--warning-soft); color:var(--warning-600); }
.fx-metric__value{ font-size:var(--text-display); font-weight:var(--weight-semibold); letter-spacing:-0.02em; line-height:1; font-variant-numeric:tabular-nums; }
.fx-metric__value small{ font-size:18px; font-weight:var(--weight-medium); color:var(--text-tertiary); margin-left:3px; }
.fx-metric__trend{ display:inline-flex; align-items:center; gap:4px; font-size:var(--text-caption); font-weight:var(--weight-semibold); font-variant-numeric:tabular-nums; }
.fx-metric__trend svg{ width:15px; height:15px; }
.fx-metric__trend--up{ color:var(--success-600); }
.fx-metric__trend--down{ color:var(--error-600); }
.fx-metric__trend--flat{ color:var(--text-tertiary); }
`;
const arrows = {
  up: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M7 17 17 7M9 7h8v8"
  })),
  down: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M7 7l10 10M17 9v8H9"
  })),
  flat: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14"
  }))
};

/** Single-metric card with big tabular value, optional icon and trend. */
function MetricCard({
  label,
  value,
  unit,
  icon,
  iconTone = 'primary',
  trend,
  trendLabel,
  className = ''
}) {
  __ds_scope.injectStyle('metric', CSS);
  return /*#__PURE__*/React.createElement("div", {
    className: ['fx-metric', className].filter(Boolean).join(' ')
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-metric__top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fx-metric__label"
  }, label), icon && /*#__PURE__*/React.createElement("span", {
    className: `fx-metric__icon fx-metric__icon--${iconTone}`
  }, icon)), /*#__PURE__*/React.createElement("div", {
    className: "fx-metric__value"
  }, value, unit && /*#__PURE__*/React.createElement("small", null, unit)), trend && /*#__PURE__*/React.createElement("span", {
    className: `fx-metric__trend fx-metric__trend--${trend}`
  }, arrows[trend], trendLabel));
}
Object.assign(__ds_scope, { MetricCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/MetricCard.jsx", error: String((e && e.message) || e) }); }

// components/data/TimelineItem.jsx
try { (() => {
const CSS = `
.fx-tl{ display:flex; gap:14px; font-family:var(--font-sans); }
.fx-tl__rail{ display:flex; flex-direction:column; align-items:center; flex:none; }
.fx-tl__time{ font-size:var(--text-caption); color:var(--text-tertiary); font-variant-numeric:tabular-nums; margin-bottom:6px; width:46px; text-align:center; }
.fx-tl__icon{ width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex:none; background:var(--ink-100); color:var(--ink-600); z-index:1; }
.fx-tl__icon svg{ width:21px; height:21px; }
.fx-tl__icon--bowel{ background:var(--color-secondary-soft); color:var(--color-secondary); }
.fx-tl__icon--urine{ background:var(--color-accent-soft); color:var(--color-accent); }
.fx-tl__icon--alert{ background:var(--error-soft); color:var(--color-error); }
.fx-tl__line{ width:2px; flex:1; background:var(--border); margin-top:4px; min-height:14px; }
.fx-tl__body{ flex:1; min-width:0; padding-bottom:20px; }
.fx-tl__card{ background:var(--color-surface); border-radius:var(--radius-lg); box-shadow:var(--shadow-xs); border:1px solid var(--border-soft); padding:13px 15px; }
.fx-tl__title{ font-size:var(--text-body-lg); font-weight:var(--weight-semibold); color:var(--text-primary); }
.fx-tl__meta{ font-size:var(--text-caption); color:var(--text-secondary); margin-top:3px; line-height:1.4; }
.fx-tl__tags{ display:flex; gap:6px; flex-wrap:wrap; margin-top:10px; }
.fx-tl__tag{ font-size:11px; font-weight:var(--weight-medium); color:var(--text-secondary); background:var(--ink-100); border-radius:var(--radius-pill); padding:4px 10px; }
.fx-tl--last .fx-tl__line{ display:none; }
.fx-tl--last .fx-tl__body{ padding-bottom:0; }
`;

/** A single event in the daily timeline. Set `last` to hide the connector. */
function TimelineItem({
  time,
  kind = 'default',
  icon,
  title,
  meta,
  tags = [],
  last = false,
  className = ''
}) {
  __ds_scope.injectStyle('timeline', CSS);
  return /*#__PURE__*/React.createElement("div", {
    className: ['fx-tl', last ? 'fx-tl--last' : '', className].filter(Boolean).join(' ')
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-tl__rail"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fx-tl__time"
  }, time), /*#__PURE__*/React.createElement("span", {
    className: `fx-tl__icon fx-tl__icon--${kind}`
  }, icon), /*#__PURE__*/React.createElement("span", {
    className: "fx-tl__line"
  })), /*#__PURE__*/React.createElement("div", {
    className: "fx-tl__body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-tl__card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-tl__title"
  }, title), meta && /*#__PURE__*/React.createElement("div", {
    className: "fx-tl__meta"
  }, meta), tags.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "fx-tl__tags"
  }, tags.map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "fx-tl__tag"
  }, t))))));
}
Object.assign(__ds_scope, { TimelineItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/TimelineItem.jsx", error: String((e && e.message) || e) }); }

// components/feedback/AlertBanner.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.fx-alert{
  display:flex; gap:13px; align-items:flex-start; font-family:var(--font-sans);
  border-radius:var(--radius-lg); padding:15px 16px; box-sizing:border-box;
}
.fx-alert__icon{ flex:none; width:24px; height:24px; display:flex; align-items:center; justify-content:center; }
.fx-alert__icon svg{ width:22px; height:22px; }
.fx-alert__body{ flex:1; min-width:0; }
.fx-alert__title{ font-size:var(--text-body); font-weight:var(--weight-semibold); margin-bottom:2px; }
.fx-alert__msg{ font-size:var(--text-body-sm); color:var(--text-secondary); line-height:1.45; }
.fx-alert__close{ flex:none; background:none; border:none; cursor:pointer; color:var(--text-tertiary); padding:4px; border-radius:8px; display:flex; }
.fx-alert__close:hover{ background:rgba(0,0,0,.05); color:var(--text-secondary); }
.fx-alert__close svg{ width:18px; height:18px; }
.fx-alert--info{ background:var(--info-soft); }
.fx-alert--info .fx-alert__icon, .fx-alert--info .fx-alert__title{ color:var(--blue-700); }
.fx-alert--success{ background:var(--success-soft); }
.fx-alert--success .fx-alert__icon, .fx-alert--success .fx-alert__title{ color:var(--success-700); }
.fx-alert--warning{ background:var(--warning-soft); }
.fx-alert--warning .fx-alert__icon, .fx-alert--warning .fx-alert__title{ color:var(--warning-700); }
.fx-alert--error{ background:var(--error-soft); }
.fx-alert--error .fx-alert__icon, .fx-alert--error .fx-alert__title{ color:var(--error-700); }
`;
const ICONS = {
  info: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 11v5M12 8h.01"
  })),
  success: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m8 12 2.5 2.5L16 9"
  })),
  warning: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10.3 3.3 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 9v4M12 17h.01"
  })),
  error: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 8v4M12 16h.01"
  }))
};

/** Inline status banner. Calm tone for warnings/errors — never alarming. */
function AlertBanner({
  tone = 'info',
  title,
  children,
  onDismiss,
  icon,
  className = '',
  ...rest
}) {
  __ds_scope.injectStyle('alert', CSS);
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['fx-alert', `fx-alert--${tone}`, className].filter(Boolean).join(' '),
    role: tone === 'error' ? 'alert' : 'status'
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "fx-alert__icon"
  }, icon || ICONS[tone]), /*#__PURE__*/React.createElement("div", {
    className: "fx-alert__body"
  }, title && /*#__PURE__*/React.createElement("div", {
    className: "fx-alert__title"
  }, title), children && /*#__PURE__*/React.createElement("div", {
    className: "fx-alert__msg"
  }, children)), onDismiss && /*#__PURE__*/React.createElement("button", {
    className: "fx-alert__close",
    onClick: onDismiss,
    "aria-label": "Cerrar"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  }))));
}
Object.assign(__ds_scope, { AlertBanner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/AlertBanner.jsx", error: String((e && e.message) || e) }); }

// components/feedback/BottomSheet.jsx
try { (() => {
const CSS = `
@keyframes fx-sheet-overlay{ from{opacity:0} to{opacity:1} }
@keyframes fx-sheet-up{ from{transform:translateY(100%)} to{transform:none} }
.fx-sheet-overlay{
  position:fixed; inset:0; z-index:1000; display:flex; align-items:flex-end; justify-content:center;
  background:rgba(34,42,46,.42); -webkit-backdrop-filter:blur(4px); backdrop-filter:blur(4px);
  animation:fx-sheet-overlay var(--duration-base) var(--ease-standard);
}
.fx-sheet{
  font-family:var(--font-sans); background:var(--color-surface);
  border-radius:var(--radius-3xl) var(--radius-3xl) 0 0; box-shadow:var(--shadow-xl);
  width:100%; max-width:520px; max-height:92vh; overflow:auto; box-sizing:border-box;
  padding:10px 20px calc(20px + env(safe-area-inset-bottom)); animation:fx-sheet-up var(--duration-slow) var(--ease-out);
}
.fx-sheet__grip{ width:44px; height:5px; border-radius:999px; background:var(--ink-200); margin:6px auto 16px; }
.fx-sheet__head{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px; }
.fx-sheet__title{ font-size:var(--text-h3); font-weight:var(--weight-semibold); letter-spacing:-0.01em; }
.fx-sheet__close{ background:var(--ink-100); border:none; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--text-secondary); }
.fx-sheet__close svg{ width:18px; height:18px; }
`;

/** Bottom sheet that slides up from the screen edge. Render conditionally when open. */
function BottomSheet({
  open = true,
  onClose,
  title,
  showClose = true,
  closeOnBackdrop = true,
  className = '',
  children
}) {
  __ds_scope.injectStyle('bottomsheet', CSS);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "fx-sheet-overlay",
    onClick: closeOnBackdrop ? onClose : undefined
  }, /*#__PURE__*/React.createElement("div", {
    className: ['fx-sheet', className].filter(Boolean).join(' '),
    role: "dialog",
    "aria-modal": "true",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-sheet__grip"
  }), (title || showClose) && /*#__PURE__*/React.createElement("div", {
    className: "fx-sheet__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fx-sheet__title"
  }, title), showClose && /*#__PURE__*/React.createElement("button", {
    className: "fx-sheet__close",
    onClick: onClose,
    "aria-label": "Cerrar"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  })))), children));
}
Object.assign(__ds_scope, { BottomSheet });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/BottomSheet.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
const CSS = `
.fx-empty{ font-family:var(--font-sans); text-align:center; display:flex; flex-direction:column; align-items:center; gap:8px; padding:32px 24px; }
.fx-empty__art{ width:96px; height:96px; border-radius:var(--radius-2xl); display:flex; align-items:center; justify-content:center; margin-bottom:8px;
  background:radial-gradient(120% 120% at 30% 20%, rgba(120,173,137,.22), rgba(62,120,181,.16)); color:var(--color-primary); }
.fx-empty__art svg{ width:44px; height:44px; stroke-width:1.6; }
.fx-empty__title{ font-size:var(--text-h3); font-weight:var(--weight-semibold); color:var(--text-primary); }
.fx-empty__msg{ font-size:var(--text-body); color:var(--text-secondary); max-width:300px; line-height:1.5; }
.fx-empty__action{ margin-top:12px; }
`;

/** Friendly empty state — calm illustration slot, title, message and optional action. */
function EmptyState({
  icon,
  title,
  message,
  action,
  className = ''
}) {
  __ds_scope.injectStyle('empty', CSS);
  return /*#__PURE__*/React.createElement("div", {
    className: ['fx-empty', className].filter(Boolean).join(' ')
  }, icon && /*#__PURE__*/React.createElement("div", {
    className: "fx-empty__art"
  }, icon), title && /*#__PURE__*/React.createElement("div", {
    className: "fx-empty__title"
  }, title), message && /*#__PURE__*/React.createElement("div", {
    className: "fx-empty__msg"
  }, message), action && /*#__PURE__*/React.createElement("div", {
    className: "fx-empty__action"
  }, action));
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Modal.jsx
try { (() => {
const CSS = `
@keyframes fx-overlay-in{ from{opacity:0} to{opacity:1} }
@keyframes fx-modal-in{ from{opacity:0; transform:translateY(16px) scale(.97)} to{opacity:1; transform:none} }
.fx-overlay{
  position:fixed; inset:0; z-index:1000; display:flex; align-items:center; justify-content:center;
  background:rgba(34,42,46,.42); -webkit-backdrop-filter:blur(4px); backdrop-filter:blur(4px);
  padding:20px; animation:fx-overlay-in var(--duration-base) var(--ease-standard);
}
.fx-modal{
  font-family:var(--font-sans); background:var(--color-surface); border-radius:var(--radius-2xl);
  box-shadow:var(--shadow-xl); width:100%; max-width:420px; max-height:90vh; overflow:auto;
  padding:24px; box-sizing:border-box; animation:fx-modal-in var(--duration-slow) var(--ease-out);
}
.fx-modal__icon{ width:56px; height:56px; border-radius:var(--radius-lg); display:flex; align-items:center; justify-content:center; margin-bottom:16px; background:var(--color-primary-soft); color:var(--color-primary); }
.fx-modal__icon svg{ width:28px; height:28px; }
.fx-modal__icon--error{ background:var(--error-soft); color:var(--color-error); }
.fx-modal__title{ font-size:var(--text-h3); font-weight:var(--weight-semibold); letter-spacing:-0.01em; margin-bottom:8px; }
.fx-modal__body{ font-size:var(--text-body); color:var(--text-secondary); line-height:1.5; }
.fx-modal__actions{ display:flex; flex-direction:column; gap:10px; margin-top:24px; }
`;

/** Centered modal dialog over a blurred scrim. Render conditionally when open. */
function Modal({
  open = true,
  onClose,
  icon,
  iconTone = 'primary',
  title,
  children,
  actions,
  closeOnBackdrop = true,
  className = ''
}) {
  __ds_scope.injectStyle('modal', CSS);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "fx-overlay",
    onClick: closeOnBackdrop ? onClose : undefined
  }, /*#__PURE__*/React.createElement("div", {
    className: ['fx-modal', className].filter(Boolean).join(' '),
    role: "dialog",
    "aria-modal": "true",
    "aria-label": typeof title === 'string' ? title : undefined,
    onClick: e => e.stopPropagation()
  }, icon && /*#__PURE__*/React.createElement("div", {
    className: `fx-modal__icon${iconTone === 'error' ? ' fx-modal__icon--error' : ''}`
  }, icon), title && /*#__PURE__*/React.createElement("div", {
    className: "fx-modal__title"
  }, title), children && /*#__PURE__*/React.createElement("div", {
    className: "fx-modal__body"
  }, children), actions && /*#__PURE__*/React.createElement("div", {
    className: "fx-modal__actions"
  }, actions)));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Modal.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ProgressBar.jsx
try { (() => {
const CSS = `
.fx-progress{ font-family:var(--font-sans); display:flex; flex-direction:column; gap:8px; }
.fx-progress__head{ display:flex; justify-content:space-between; font-size:var(--text-label); }
.fx-progress__label{ color:var(--text-secondary); font-weight:var(--weight-medium); }
.fx-progress__val{ color:var(--text-tertiary); font-variant-numeric:tabular-nums; }
.fx-progress__track{ height:10px; border-radius:var(--radius-pill); background:var(--ink-150); overflow:hidden; }
.fx-progress__fill{ height:100%; border-radius:var(--radius-pill); background:var(--gradient-primary); transition:width var(--duration-slow) var(--ease-out); }
.fx-progress--secondary .fx-progress__fill{ background:var(--gradient-secondary); }
.fx-steps{ display:flex; gap:6px; }
.fx-steps__seg{ flex:1; height:6px; border-radius:var(--radius-pill); background:var(--ink-150); transition:background var(--duration-base); }
.fx-steps__seg--done{ background:var(--color-primary); }
`;

/** Linear progress bar. Set `steps` for a stepped indicator (e.g. onboarding). */
function ProgressBar({
  value = 0,
  max = 100,
  label,
  showValue = false,
  tone = 'primary',
  steps,
  currentStep,
  className = ''
}) {
  __ds_scope.injectStyle('progress', CSS);
  if (steps) {
    return /*#__PURE__*/React.createElement("div", {
      className: ['fx-steps', className].filter(Boolean).join(' '),
      role: "progressbar",
      "aria-valuenow": currentStep,
      "aria-valuemax": steps
    }, Array.from({
      length: steps
    }).map((_, i) => /*#__PURE__*/React.createElement("span", {
      key: i,
      className: `fx-steps__seg${i < currentStep ? ' fx-steps__seg--done' : ''}`
    })));
  }
  const pct = Math.max(0, Math.min(100, value / max * 100));
  return /*#__PURE__*/React.createElement("div", {
    className: ['fx-progress', tone === 'secondary' ? 'fx-progress--secondary' : '', className].filter(Boolean).join(' ')
  }, (label || showValue) && /*#__PURE__*/React.createElement("div", {
    className: "fx-progress__head"
  }, label && /*#__PURE__*/React.createElement("span", {
    className: "fx-progress__label"
  }, label), showValue && /*#__PURE__*/React.createElement("span", {
    className: "fx-progress__val"
  }, Math.round(pct), "%")), /*#__PURE__*/React.createElement("div", {
    className: "fx-progress__track",
    role: "progressbar",
    "aria-valuenow": Math.round(pct),
    "aria-valuemin": 0,
    "aria-valuemax": 100
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-progress__fill",
    style: {
      width: `${pct}%`
    }
  })));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Spinner.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
@keyframes fx-spin{ to{ transform:rotate(360deg); } }
@keyframes fx-shimmer{ 0%{ background-position:-200% 0; } 100%{ background-position:200% 0; } }
.fx-spinner{ display:inline-block; border-radius:50%; border:3px solid var(--ink-150); border-top-color:var(--color-primary); animation:fx-spin .8s linear infinite; }
.fx-spinner--sm{ width:20px; height:20px; border-width:2.5px; }
.fx-spinner--md{ width:32px; height:32px; }
.fx-spinner--lg{ width:48px; height:48px; border-width:4px; }
.fx-skeleton{ background:linear-gradient(90deg, var(--ink-100) 25%, var(--ink-150) 37%, var(--ink-100) 63%); background-size:200% 100%; animation:fx-shimmer 1.4s ease-in-out infinite; border-radius:var(--radius-sm); }
.fx-loadblock{ display:flex; flex-direction:column; align-items:center; gap:12px; font-family:var(--font-sans); color:var(--text-secondary); font-size:var(--text-body); padding:24px; }
`;

/** Spinning loader. */
function Spinner({
  size = 'md',
  className = '',
  label = 'Cargando',
  ...rest
}) {
  __ds_scope.injectStyle('spinner', CSS);
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ['fx-spinner', `fx-spinner--${size}`, className].filter(Boolean).join(' '),
    role: "status",
    "aria-label": label
  }, rest));
}

/** Shimmer placeholder block — set width/height/radius via style. */
function Skeleton({
  width = '100%',
  height = 16,
  radius,
  className = '',
  style = {}
}) {
  __ds_scope.injectStyle('spinner', CSS);
  return /*#__PURE__*/React.createElement("span", {
    className: ['fx-skeleton', className].filter(Boolean).join(' '),
    style: {
      display: 'block',
      width,
      height,
      borderRadius: radius,
      ...style
    },
    "aria-hidden": "true"
  });
}

/** Centered spinner with a calm message. */
function LoadingBlock({
  message = 'Cargando…',
  size = 'lg'
}) {
  __ds_scope.injectStyle('spinner', CSS);
  return /*#__PURE__*/React.createElement("div", {
    className: "fx-loadblock"
  }, /*#__PURE__*/React.createElement(Spinner, {
    size: size
  }), /*#__PURE__*/React.createElement("span", null, message));
}
Object.assign(__ds_scope, { Spinner, Skeleton, LoadingBlock });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Spinner.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
@keyframes fx-toast-in{ from{ opacity:0; transform:translateY(14px) scale(.98); } to{ opacity:1; transform:none; } }
.fx-toast{
  display:flex; align-items:center; gap:12px; font-family:var(--font-sans);
  background:var(--ink-800); color:#fff; border-radius:var(--radius-lg); padding:14px 16px;
  box-shadow:var(--shadow-lg); min-width:260px; max-width:420px; box-sizing:border-box;
  animation:fx-toast-in var(--duration-slow) var(--ease-out);
}
.fx-toast__icon{ flex:none; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; }
.fx-toast__icon svg{ width:18px; height:18px; color:#fff; }
.fx-toast__icon--success{ background:var(--color-success); }
.fx-toast__icon--error{ background:var(--color-error); }
.fx-toast__icon--info{ background:var(--color-primary); }
.fx-toast__body{ flex:1; min-width:0; }
.fx-toast__title{ font-size:var(--text-body); font-weight:var(--weight-semibold); }
.fx-toast__msg{ font-size:var(--text-caption); color:rgba(255,255,255,.78); margin-top:1px; }
.fx-toast__action{ background:none; border:none; color:var(--blue-300); font-family:var(--font-sans); font-size:var(--text-label); font-weight:var(--weight-semibold); cursor:pointer; padding:6px 8px; border-radius:8px; }
.fx-toast__action:hover{ background:rgba(255,255,255,.1); }
`;
const I = {
  success: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m5 12 4.5 4.5L19 7"
  })),
  error: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  })),
  info: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 8h.01M12 11v5"
  }))
};

/** Transient confirmation toast (dark pill). Pair with your own timer/stack. */
function Toast({
  tone = 'success',
  title,
  message,
  actionLabel,
  onAction,
  className = '',
  ...rest
}) {
  __ds_scope.injectStyle('toast', CSS);
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['fx-toast', className].filter(Boolean).join(' '),
    role: "status"
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: `fx-toast__icon fx-toast__icon--${tone}`
  }, I[tone]), /*#__PURE__*/React.createElement("div", {
    className: "fx-toast__body"
  }, title && /*#__PURE__*/React.createElement("div", {
    className: "fx-toast__title"
  }, title), message && /*#__PURE__*/React.createElement("div", {
    className: "fx-toast__msg"
  }, message)), actionLabel && /*#__PURE__*/React.createElement("button", {
    className: "fx-toast__action",
    onClick: onAction
  }, actionLabel));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.fx-check{ display:flex; align-items:flex-start; gap:12px; cursor:pointer; font-family:var(--font-sans); -webkit-tap-highlight-color:transparent; }
.fx-check__box{
  flex:none; width:26px; height:26px; margin-top:1px; border-radius:8px;
  border:2px solid var(--border-strong); background:var(--color-surface);
  display:flex; align-items:center; justify-content:center;
  transition:var(--transition-colors), transform var(--duration-fast) var(--ease-out);
}
.fx-check__box svg{ width:17px; height:17px; color:#fff; opacity:0; transform:scale(.6); transition:opacity var(--duration-fast), transform var(--duration-fast) var(--ease-out); }
.fx-check input{ position:absolute; opacity:0; width:1px; height:1px; }
.fx-check:hover .fx-check__box{ border-color:var(--color-primary); }
.fx-check input:checked + .fx-check__box{ background:var(--color-primary); border-color:var(--color-primary); }
.fx-check input:checked + .fx-check__box svg{ opacity:1; transform:scale(1); }
.fx-check input:focus-visible + .fx-check__box{ box-shadow:var(--focus-ring); }
.fx-check__body{ display:flex; flex-direction:column; gap:2px; padding-top:1px; }
.fx-check__label{ font-size:var(--text-body); color:var(--text-primary); line-height:1.35; }
.fx-check__desc{ font-size:var(--text-caption); color:var(--text-tertiary); }
.fx-check--disabled{ cursor:not-allowed; opacity:.55; }
`;
const Tick = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "3",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("polyline", {
  points: "20 6 9 17 4 12"
}));

/** Large, rounded checkbox with label and optional description. */
function Checkbox({
  label,
  description,
  checked,
  defaultChecked,
  disabled,
  id,
  className = '',
  ...rest
}) {
  __ds_scope.injectStyle('checkbox', CSS);
  const cid = id || `fx-${Math.random().toString(36).slice(2, 8)}`;
  return /*#__PURE__*/React.createElement("label", {
    className: ['fx-check', disabled ? 'fx-check--disabled' : '', className].filter(Boolean).join(' '),
    htmlFor: cid
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: cid,
    type: "checkbox",
    checked: checked,
    defaultChecked: defaultChecked,
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "fx-check__box"
  }, /*#__PURE__*/React.createElement(Tick, null)), (label || description) && /*#__PURE__*/React.createElement("span", {
    className: "fx-check__body"
  }, label && /*#__PURE__*/React.createElement("span", {
    className: "fx-check__label"
  }, label), description && /*#__PURE__*/React.createElement("span", {
    className: "fx-check__desc"
  }, description)));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/DatePicker.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.fx-datetime{ position:relative; display:flex; align-items:center; }
.fx-datetime input{
  width:100%; min-height:52px; box-sizing:border-box;
  font-family:var(--font-sans); font-size:var(--text-body-lg); color:var(--text-primary);
  background:var(--color-surface); border:1.5px solid var(--border); border-radius:var(--radius-md);
  padding:0 16px; -webkit-appearance:none; appearance:none; transition:var(--transition-colors);
}
.fx-datetime input:hover{ border-color:var(--border-strong); }
.fx-datetime input:focus{ outline:none; border-color:var(--border-focus); box-shadow:var(--focus-ring); }
.fx-datetime input:disabled{ background:var(--disabled-bg); color:var(--disabled-text); }
.fx-datetime__icon{ position:absolute; right:16px; pointer-events:none; color:var(--text-secondary); display:flex; }
.fx-datetime__icon svg{ width:20px; height:20px; }
.fx-datetime input::-webkit-calendar-picker-indicator{ opacity:0; position:absolute; right:0; width:48px; height:100%; cursor:pointer; }
`;
const CalIcon = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.9",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("rect", {
  x: "3",
  y: "4",
  width: "18",
  height: "18",
  rx: "3"
}), /*#__PURE__*/React.createElement("path", {
  d: "M3 9h18M8 2v4M16 2v4"
}));

/** Date field using the platform date picker, with a calendar affordance. */
function DatePicker({
  label,
  helperText,
  error,
  id,
  className = '',
  ...rest
}) {
  __ds_scope.injectStyle('field', __ds_scope.fieldChromeCss);
  __ds_scope.injectStyle('datetime', CSS);
  const did = id || `fx-${Math.random().toString(36).slice(2, 8)}`;
  return /*#__PURE__*/React.createElement("div", {
    className: ['fx-field', error ? 'fx-field--error' : '', className].filter(Boolean).join(' ')
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "fx-field__label",
    htmlFor: did
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "fx-datetime"
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: did,
    type: "date",
    "aria-invalid": !!error
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "fx-datetime__icon"
  }, /*#__PURE__*/React.createElement(CalIcon, null))), error ? /*#__PURE__*/React.createElement("span", {
    className: "fx-field__help fx-field__help--error"
  }, error) : helperText ? /*#__PURE__*/React.createElement("span", {
    className: "fx-field__help"
  }, helperText) : null);
}
Object.assign(__ds_scope, { DatePicker });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/DatePicker.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.fx-input-wrap{ position:relative; display:flex; align-items:center; }
.fx-input{
  width:100%; min-height:52px; box-sizing:border-box;
  font-family:var(--font-sans); font-size:var(--text-body-lg); color:var(--text-primary);
  background:var(--color-surface); border:1.5px solid var(--border); border-radius:var(--radius-md);
  padding:0 16px; transition:var(--transition-colors); -webkit-appearance:none; appearance:none;
}
.fx-input::placeholder{ color:var(--text-tertiary); }
.fx-input:hover{ border-color:var(--border-strong); }
.fx-input:focus{ outline:none; border-color:var(--border-focus); box-shadow:var(--focus-ring); }
.fx-input--has-lead{ padding-left:46px; }
.fx-input--has-trail{ padding-right:46px; }
.fx-input--lg{ min-height:60px; font-size:var(--text-h3); }
.fx-input__icon{ position:absolute; display:flex; color:var(--text-tertiary); pointer-events:none; }
.fx-input__icon svg{ width:20px; height:20px; }
.fx-input__icon--lead{ left:15px; } .fx-input__icon--trail{ right:15px; }
.fx-input:disabled{ background:var(--disabled-bg); color:var(--disabled-text); border-color:var(--disabled-border); cursor:not-allowed; }
`;

/** Labelled text input with helper / error text and optional icons. */
function Input({
  label,
  helperText,
  error,
  required = false,
  leadingIcon = null,
  trailingIcon = null,
  id,
  className = '',
  ...rest
}) {
  __ds_scope.injectStyle('field', __ds_scope.fieldChromeCss);
  __ds_scope.injectStyle('input', CSS);
  const inputId = id || `fx-${Math.random().toString(36).slice(2, 8)}`;
  const cls = ['fx-field', error ? 'fx-field--error' : '', className].filter(Boolean).join(' ');
  const inputCls = ['fx-input', leadingIcon ? 'fx-input--has-lead' : '', trailingIcon ? 'fx-input--has-trail' : ''].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("div", {
    className: cls
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "fx-field__label",
    htmlFor: inputId
  }, label, required && /*#__PURE__*/React.createElement("span", {
    className: "fx-field__req"
  }, "*")), /*#__PURE__*/React.createElement("div", {
    className: "fx-input-wrap"
  }, leadingIcon && /*#__PURE__*/React.createElement("span", {
    className: "fx-input__icon fx-input__icon--lead"
  }, leadingIcon), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    className: inputCls,
    "aria-invalid": !!error
  }, rest)), trailingIcon && /*#__PURE__*/React.createElement("span", {
    className: "fx-input__icon fx-input__icon--trail"
  }, trailingIcon)), error ? /*#__PURE__*/React.createElement("span", {
    className: "fx-field__help fx-field__help--error"
  }, error) : helperText ? /*#__PURE__*/React.createElement("span", {
    className: "fx-field__help"
  }, helperText) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/RadioCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.fx-radiocard{
  position:relative; display:flex; align-items:center; gap:14px; cursor:pointer;
  font-family:var(--font-sans); background:var(--color-surface); border:1.5px solid var(--border);
  border-radius:var(--radius-lg); padding:16px; min-height:64px; box-sizing:border-box;
  transition:var(--transition-colors), transform var(--duration-fast) var(--ease-out);
  -webkit-tap-highlight-color:transparent;
}
.fx-radiocard:hover{ border-color:var(--border-strong); background:var(--ink-50); }
.fx-radiocard:active{ transform:scale(.99); }
.fx-radiocard input{ position:absolute; opacity:0; width:1px; height:1px; }
.fx-radiocard__icon{ flex:none; width:44px; height:44px; border-radius:var(--radius-md); background:var(--ink-100); color:var(--ink-600);
  display:flex; align-items:center; justify-content:center; transition:var(--transition-colors); }
.fx-radiocard__icon svg{ width:23px; height:23px; }
.fx-radiocard__body{ flex:1; display:flex; flex-direction:column; gap:2px; min-width:0; }
.fx-radiocard__title{ font-size:var(--text-body-lg); font-weight:var(--weight-medium); color:var(--text-primary); }
.fx-radiocard__desc{ font-size:var(--text-caption); color:var(--text-tertiary); }
.fx-radiocard__dot{ flex:none; width:24px; height:24px; border-radius:50%; border:2px solid var(--border-strong); display:flex; align-items:center; justify-content:center; transition:var(--transition-colors); }
.fx-radiocard__dot::after{ content:''; width:12px; height:12px; border-radius:50%; background:var(--color-primary); transform:scale(0); transition:transform var(--duration-fast) var(--ease-out); }
.fx-radiocard input:checked ~ .fx-radiocard__dot{ border-color:var(--color-primary); }
.fx-radiocard input:checked ~ .fx-radiocard__dot::after{ transform:scale(1); }
.fx-radiocard:has(input:checked){ border-color:var(--color-primary); background:var(--color-primary-soft); box-shadow:0 0 0 1px var(--color-primary) inset; }
.fx-radiocard:has(input:checked) .fx-radiocard__icon{ background:var(--color-primary); color:#fff; }
.fx-radiocard input:focus-visible ~ .fx-radiocard__dot{ box-shadow:var(--focus-ring); }
.fx-radiocard--disabled{ opacity:.5; cursor:not-allowed; }
`;

/** Selectable card with optional icon, title and description; behaves as a radio in a group. */
function RadioCard({
  name,
  value,
  icon,
  title,
  description,
  checked,
  defaultChecked,
  disabled,
  hideDot = false,
  id,
  className = '',
  ...rest
}) {
  __ds_scope.injectStyle('radiocard', CSS);
  const rid = id || `fx-${Math.random().toString(36).slice(2, 8)}`;
  return /*#__PURE__*/React.createElement("label", {
    className: ['fx-radiocard', disabled ? 'fx-radiocard--disabled' : '', className].filter(Boolean).join(' '),
    htmlFor: rid
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: rid,
    type: "radio",
    name: name,
    value: value,
    checked: checked,
    defaultChecked: defaultChecked,
    disabled: disabled
  }, rest)), icon && /*#__PURE__*/React.createElement("span", {
    className: "fx-radiocard__icon"
  }, icon), /*#__PURE__*/React.createElement("span", {
    className: "fx-radiocard__body"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fx-radiocard__title"
  }, title), description && /*#__PURE__*/React.createElement("span", {
    className: "fx-radiocard__desc"
  }, description)), !hideDot && /*#__PURE__*/React.createElement("span", {
    className: "fx-radiocard__dot"
  }));
}
Object.assign(__ds_scope, { RadioCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/RadioCard.jsx", error: String((e && e.message) || e) }); }

// components/forms/SegmentedControl.jsx
try { (() => {
const CSS = `
.fx-seg{ display:inline-flex; background:var(--ink-100); border-radius:var(--radius-pill); padding:4px; gap:2px; font-family:var(--font-sans); }
.fx-seg--full{ display:flex; width:100%; }
.fx-seg__btn{
  flex:1; border:none; background:transparent; cursor:pointer; min-height:44px; padding:0 18px;
  border-radius:var(--radius-pill); font-family:var(--font-sans); font-size:var(--text-body); font-weight:var(--weight-medium);
  color:var(--text-secondary); white-space:nowrap; display:inline-flex; align-items:center; justify-content:center; gap:7px;
  transition:var(--transition-colors), transform var(--duration-fast) var(--ease-out);
  -webkit-tap-highlight-color:transparent;
}
.fx-seg__btn svg{ width:18px; height:18px; }
.fx-seg__btn:hover{ color:var(--text-primary); }
.fx-seg__btn:active{ transform:scale(.97); }
.fx-seg__btn:focus-visible{ outline:none; box-shadow:var(--focus-ring); }
.fx-seg__btn--active{ background:var(--color-surface); color:var(--color-primary); box-shadow:var(--shadow-sm); font-weight:var(--weight-semibold); }
`;

/** Pill segmented control for 2–4 mutually-exclusive options. */
function SegmentedControl({
  options = [],
  value,
  onChange,
  fullWidth = false,
  className = ''
}) {
  __ds_scope.injectStyle('segmented', CSS);
  return /*#__PURE__*/React.createElement("div", {
    className: ['fx-seg', fullWidth ? 'fx-seg--full' : '', className].filter(Boolean).join(' '),
    role: "tablist"
  }, options.map(o => {
    const opt = typeof o === 'string' ? {
      value: o,
      label: o
    } : o;
    const active = opt.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: opt.value,
      type: "button",
      role: "tab",
      "aria-selected": active,
      className: ['fx-seg__btn', active ? 'fx-seg__btn--active' : ''].join(' '),
      onClick: () => onChange && onChange(opt.value)
    }, opt.icon, opt.label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.fx-select-wrap{ position:relative; display:flex; align-items:center; }
.fx-select{
  width:100%; min-height:52px; box-sizing:border-box;
  font-family:var(--font-sans); font-size:var(--text-body-lg); color:var(--text-primary);
  background:var(--color-surface); border:1.5px solid var(--border); border-radius:var(--radius-md);
  padding:0 46px 0 16px; cursor:pointer; -webkit-appearance:none; appearance:none;
  transition:var(--transition-colors);
}
.fx-select:hover{ border-color:var(--border-strong); }
.fx-select:focus{ outline:none; border-color:var(--border-focus); box-shadow:var(--focus-ring); }
.fx-select:disabled{ background:var(--disabled-bg); color:var(--disabled-text); cursor:not-allowed; }
.fx-select--placeholder{ color:var(--text-tertiary); }
.fx-select__chev{ position:absolute; right:16px; pointer-events:none; color:var(--text-secondary); display:flex; }
.fx-select__chev svg{ width:20px; height:20px; }
`;
const Chevron = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("polyline", {
  points: "6 9 12 15 18 9"
}));

/** Styled native select with chevron, label and helper/error text. */
function Select({
  label,
  helperText,
  error,
  options = [],
  placeholder,
  value,
  id,
  className = '',
  children,
  ...rest
}) {
  __ds_scope.injectStyle('field', __ds_scope.fieldChromeCss);
  __ds_scope.injectStyle('select', CSS);
  const sid = id || `fx-${Math.random().toString(36).slice(2, 8)}`;
  const cls = ['fx-field', error ? 'fx-field--error' : '', className].filter(Boolean).join(' ');
  const isPlaceholder = (value === undefined || value === '') && placeholder;
  return /*#__PURE__*/React.createElement("div", {
    className: cls
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "fx-field__label",
    htmlFor: sid
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "fx-select-wrap"
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: sid,
    className: ['fx-select', isPlaceholder ? 'fx-select--placeholder' : ''].join(' '),
    value: value,
    "aria-invalid": !!error
  }, rest), placeholder && /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, placeholder), options.map(o => typeof o === 'string' ? /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, o) : /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label)), children), /*#__PURE__*/React.createElement("span", {
    className: "fx-select__chev"
  }, /*#__PURE__*/React.createElement(Chevron, null))), error ? /*#__PURE__*/React.createElement("span", {
    className: "fx-field__help fx-field__help--error"
  }, error) : helperText ? /*#__PURE__*/React.createElement("span", {
    className: "fx-field__help"
  }, helperText) : null);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Slider.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.fx-slider{ font-family:var(--font-sans); display:flex; flex-direction:column; gap:10px; }
.fx-slider__head{ display:flex; justify-content:space-between; align-items:baseline; }
.fx-slider__label{ font-size:var(--text-label); font-weight:var(--weight-medium); color:var(--text-secondary); }
.fx-slider__value{ font-size:var(--text-body-lg); font-weight:var(--weight-semibold); color:var(--color-primary); font-variant-numeric:tabular-nums; }
.fx-slider__input{ -webkit-appearance:none; appearance:none; width:100%; height:8px; border-radius:var(--radius-pill); background:var(--ink-150); outline:none; }
.fx-slider__input::-webkit-slider-thumb{ -webkit-appearance:none; appearance:none; width:28px; height:28px; border-radius:50%; background:#fff; border:3px solid var(--color-primary); box-shadow:var(--shadow-md); cursor:pointer; transition:transform var(--duration-fast) var(--ease-out); }
.fx-slider__input::-webkit-slider-thumb:active{ transform:scale(1.12); }
.fx-slider__input::-moz-range-thumb{ width:28px; height:28px; border-radius:50%; background:#fff; border:3px solid var(--color-primary); box-shadow:var(--shadow-md); cursor:pointer; }
.fx-slider__input:focus-visible{ box-shadow:var(--focus-ring); }
.fx-slider__ticks{ display:flex; justify-content:space-between; font-size:var(--text-caption); color:var(--text-tertiary); }
`;

/** Range slider with a live value read-out and optional end labels. */
function Slider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  formatValue,
  minLabel,
  maxLabel,
  className = '',
  ...rest
}) {
  __ds_scope.injectStyle('slider', CSS);
  const pct = (Number(value) - min) / (max - min) * 100;
  const display = formatValue ? formatValue(value) : value;
  return /*#__PURE__*/React.createElement("div", {
    className: ['fx-slider', className].filter(Boolean).join(' ')
  }, (label || display !== undefined) && /*#__PURE__*/React.createElement("div", {
    className: "fx-slider__head"
  }, label && /*#__PURE__*/React.createElement("span", {
    className: "fx-slider__label"
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "fx-slider__value"
  }, display)), /*#__PURE__*/React.createElement("input", _extends({
    type: "range",
    className: "fx-slider__input",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: onChange,
    style: {
      background: `linear-gradient(90deg, var(--color-primary) ${pct}%, var(--ink-150) ${pct}%)`
    }
  }, rest)), (minLabel || maxLabel) && /*#__PURE__*/React.createElement("div", {
    className: "fx-slider__ticks"
  }, /*#__PURE__*/React.createElement("span", null, minLabel), /*#__PURE__*/React.createElement("span", null, maxLabel)));
}
Object.assign(__ds_scope, { Slider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Slider.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.fx-switch{ display:inline-flex; align-items:center; gap:12px; cursor:pointer; font-family:var(--font-sans); -webkit-tap-highlight-color:transparent; }
.fx-switch input{ position:absolute; opacity:0; width:1px; height:1px; }
.fx-switch__track{
  flex:none; width:52px; height:32px; border-radius:var(--radius-pill);
  background:var(--ink-250); padding:3px; transition:background var(--duration-base) var(--ease-standard);
}
.fx-switch__thumb{
  width:26px; height:26px; border-radius:50%; background:#fff; box-shadow:var(--shadow-sm);
  transition:transform var(--duration-base) var(--ease-out);
}
.fx-switch input:checked + .fx-switch__track{ background:var(--color-success); }
.fx-switch input:checked + .fx-switch__track .fx-switch__thumb{ transform:translateX(20px); }
.fx-switch input:focus-visible + .fx-switch__track{ box-shadow:var(--focus-ring); }
.fx-switch__label{ font-size:var(--text-body); color:var(--text-primary); }
.fx-switch--disabled{ cursor:not-allowed; opacity:.55; }
`;

/** On/off toggle. Green when on, with a soft sliding thumb. */
function Switch({
  label,
  checked,
  defaultChecked,
  disabled,
  id,
  className = '',
  ...rest
}) {
  __ds_scope.injectStyle('switch', CSS);
  const sid = id || `fx-${Math.random().toString(36).slice(2, 8)}`;
  return /*#__PURE__*/React.createElement("label", {
    className: ['fx-switch', disabled ? 'fx-switch--disabled' : '', className].filter(Boolean).join(' '),
    htmlFor: sid
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: sid,
    type: "checkbox",
    role: "switch",
    checked: checked,
    defaultChecked: defaultChecked,
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "fx-switch__track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fx-switch__thumb"
  })), label && /*#__PURE__*/React.createElement("span", {
    className: "fx-switch__label"
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.fx-textarea{
  width:100%; box-sizing:border-box; min-height:108px; resize:vertical;
  font-family:var(--font-sans); font-size:var(--text-body-lg); line-height:var(--leading-normal);
  color:var(--text-primary); background:var(--color-surface);
  border:1.5px solid var(--border); border-radius:var(--radius-md); padding:14px 16px;
  transition:var(--transition-colors);
}
.fx-textarea::placeholder{ color:var(--text-tertiary); }
.fx-textarea:hover{ border-color:var(--border-strong); }
.fx-textarea:focus{ outline:none; border-color:var(--border-focus); box-shadow:var(--focus-ring); }
.fx-textarea:disabled{ background:var(--disabled-bg); color:var(--disabled-text); cursor:not-allowed; }
.fx-textarea__count{ align-self:flex-end; font-size:var(--text-caption); color:var(--text-tertiary); font-variant-numeric:tabular-nums; }
`;

/** Multi-line text area with optional label, helper and character count. */
function Textarea({
  label,
  helperText,
  error,
  maxLength,
  value,
  id,
  className = '',
  ...rest
}) {
  __ds_scope.injectStyle('field', __ds_scope.fieldChromeCss);
  __ds_scope.injectStyle('textarea', CSS);
  const tid = id || `fx-${Math.random().toString(36).slice(2, 8)}`;
  const cls = ['fx-field', error ? 'fx-field--error' : '', className].filter(Boolean).join(' ');
  const len = typeof value === 'string' ? value.length : 0;
  return /*#__PURE__*/React.createElement("div", {
    className: cls
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "fx-field__label",
    htmlFor: tid
  }, label), /*#__PURE__*/React.createElement("textarea", _extends({
    id: tid,
    className: "fx-textarea",
    maxLength: maxLength,
    value: value,
    "aria-invalid": !!error
  }, rest)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 8
    }
  }, error ? /*#__PURE__*/React.createElement("span", {
    className: "fx-field__help fx-field__help--error"
  }, error) : helperText ? /*#__PURE__*/React.createElement("span", {
    className: "fx-field__help"
  }, helperText) : /*#__PURE__*/React.createElement("span", null), maxLength ? /*#__PURE__*/React.createElement("span", {
    className: "fx-textarea__count"
  }, len, "/", maxLength) : null));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/forms/TimePicker.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.fx-time input::-webkit-calendar-picker-indicator{ opacity:0; position:absolute; right:0; width:48px; height:100%; cursor:pointer; }
`;
const ClockIcon = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.9",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "9"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 7v5l3 2"
}));

/** Time field using the platform time picker (24h), with a clock affordance. */
function TimePicker({
  label,
  helperText,
  error,
  id,
  className = '',
  ...rest
}) {
  __ds_scope.injectStyle('field', __ds_scope.fieldChromeCss);
  __ds_scope.injectStyle('datetime', `
.fx-datetime{ position:relative; display:flex; align-items:center; }
.fx-datetime input{ width:100%; min-height:52px; box-sizing:border-box; font-family:var(--font-sans); font-size:var(--text-body-lg); color:var(--text-primary); background:var(--color-surface); border:1.5px solid var(--border); border-radius:var(--radius-md); padding:0 16px; -webkit-appearance:none; appearance:none; transition:var(--transition-colors); }
.fx-datetime input:hover{ border-color:var(--border-strong); }
.fx-datetime input:focus{ outline:none; border-color:var(--border-focus); box-shadow:var(--focus-ring); }
.fx-datetime__icon{ position:absolute; right:16px; pointer-events:none; color:var(--text-secondary); display:flex; }
.fx-datetime__icon svg{ width:20px; height:20px; }`);
  __ds_scope.injectStyle('time', CSS);
  const tid = id || `fx-${Math.random().toString(36).slice(2, 8)}`;
  return /*#__PURE__*/React.createElement("div", {
    className: ['fx-field', 'fx-time', error ? 'fx-field--error' : '', className].filter(Boolean).join(' ')
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "fx-field__label",
    htmlFor: tid
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "fx-datetime"
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: tid,
    type: "time",
    "aria-invalid": !!error
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "fx-datetime__icon"
  }, /*#__PURE__*/React.createElement(ClockIcon, null))), error ? /*#__PURE__*/React.createElement("span", {
    className: "fx-field__help fx-field__help--error"
  }, error) : helperText ? /*#__PURE__*/React.createElement("span", {
    className: "fx-field__help"
  }, helperText) : null);
}
Object.assign(__ds_scope, { TimePicker });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/TimePicker.jsx", error: String((e && e.message) || e) }); }

// components/health/BloodMucusSelector.jsx
try { (() => {
const CSS = `
.fx-bm{ font-family:var(--font-sans); display:flex; flex-direction:column; gap:10px; }
.fx-bm__opts{ display:flex; gap:8px; }
.fx-bm__opt{
  flex:1; display:flex; align-items:center; justify-content:center; gap:8px; min-height:52px; padding:0 12px; box-sizing:border-box;
  background:var(--color-surface); border:1.5px solid var(--border); border-radius:var(--radius-md); cursor:pointer;
  font-size:var(--text-body); font-weight:var(--weight-medium); color:var(--text-secondary);
  transition:var(--transition-colors), transform var(--duration-fast) var(--ease-out); -webkit-tap-highlight-color:transparent;
}
.fx-bm__opt svg{ width:20px; height:20px; }
.fx-bm__opt:hover{ border-color:var(--border-strong); }
.fx-bm__opt:active{ transform:scale(.98); }
.fx-bm__opt input{ position:absolute; opacity:0; width:1px; height:1px; }
.fx-bm__opt--none:has(input:checked){ border-color:var(--success-500); background:var(--success-50); color:var(--success-700); }
.fx-bm__opt--flag:has(input:checked){ border-color:var(--error-500); background:var(--error-50); color:var(--error-700); }
.fx-bm__note{ display:flex; align-items:flex-start; gap:9px; font-size:var(--text-body-sm); color:var(--error-700); background:var(--error-50); border-radius:var(--radius-md); padding:12px 14px; line-height:1.45; }
.fx-bm__note svg{ width:18px; height:18px; flex:none; margin-top:1px; }
`;
const Drop = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"
}));
const Wave = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 8c3 0 3 2 6 2s3-2 6-2 3 2 6 2M3 14c3 0 3 2 6 2s3-2 6-2 3 2 6 2"
}));
const Check = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "m5 12 4.5 4.5L19 7"
}));
const Info = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "9"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 11v5M12 8h.01"
}));

/**
 * Blood / mucus warning selector. Multi-select (none is exclusive).
 * `value` is an array like ['sangre'] / ['moco'] / ['ninguno'].
 */
function BloodMucusSelector({
  value = [],
  onChange,
  className = ''
}) {
  __ds_scope.injectStyle('bloodmucus', CSS);
  const has = k => value.includes(k);
  const toggle = k => {
    if (!onChange) return;
    if (k === 'ninguno') return onChange(['ninguno']);
    let next = value.filter(v => v !== 'ninguno');
    next = has(k) ? next.filter(v => v !== k) : [...next, k];
    onChange(next.length ? next : []);
  };
  const flagged = has('sangre') || has('moco');
  return /*#__PURE__*/React.createElement("div", {
    className: ['fx-bm', className].filter(Boolean).join(' ')
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-bm__opts"
  }, /*#__PURE__*/React.createElement("label", {
    className: "fx-bm__opt fx-bm__opt--none"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: has('ninguno'),
    onChange: () => toggle('ninguno')
  }), /*#__PURE__*/React.createElement(Check, null), " Nada"), /*#__PURE__*/React.createElement("label", {
    className: "fx-bm__opt fx-bm__opt--flag"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: has('sangre'),
    onChange: () => toggle('sangre')
  }), /*#__PURE__*/React.createElement(Drop, null), " Sangre"), /*#__PURE__*/React.createElement("label", {
    className: "fx-bm__opt fx-bm__opt--flag"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: has('moco'),
    onChange: () => toggle('moco')
  }), /*#__PURE__*/React.createElement(Wave, null), " Moco")), flagged && /*#__PURE__*/React.createElement("div", {
    className: "fx-bm__note"
  }, /*#__PURE__*/React.createElement(Info, null), /*#__PURE__*/React.createElement("span", null, "Lo registraremos con cuidado. Si se repite, te recomendamos comentarlo con tu m\xE9dico.")));
}
Object.assign(__ds_scope, { BloodMucusSelector });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/health/BloodMucusSelector.jsx", error: String((e && e.message) || e) }); }

// components/health/BristolScaleSelector.jsx
try { (() => {
const CSS = `
.fx-bristol{ font-family:var(--font-sans); display:flex; flex-direction:column; gap:8px; }
.fx-bristol__opt{
  display:flex; align-items:center; gap:14px; padding:12px 14px; min-height:64px; box-sizing:border-box;
  background:var(--color-surface); border:1.5px solid var(--border); border-radius:var(--radius-lg); cursor:pointer;
  transition:var(--transition-colors), transform var(--duration-fast) var(--ease-out); -webkit-tap-highlight-color:transparent;
}
.fx-bristol__opt:hover{ border-color:var(--border-strong); }
.fx-bristol__opt:active{ transform:scale(.99); }
.fx-bristol__opt input{ position:absolute; opacity:0; width:1px; height:1px; }
.fx-bristol__num{ flex:none; width:30px; height:30px; border-radius:50%; background:var(--ink-100); color:var(--ink-600);
  display:flex; align-items:center; justify-content:center; font-weight:var(--weight-semibold); font-size:var(--text-label); font-variant-numeric:tabular-nums; }
.fx-bristol__glyph{ flex:none; width:54px; height:34px; color:var(--ink-500); display:flex; align-items:center; justify-content:center; }
.fx-bristol__glyph svg{ width:54px; height:34px; }
.fx-bristol__body{ flex:1; min-width:0; }
.fx-bristol__label{ font-size:var(--text-body); font-weight:var(--weight-medium); color:var(--text-primary); line-height:1.25; }
.fx-bristol__cat{ font-size:11px; font-weight:var(--weight-semibold); margin-top:2px; }
.fx-bristol__cat--hard{ color:var(--warning-600); }
.fx-bristol__cat--ok{ color:var(--success-600); }
.fx-bristol__cat--loose{ color:var(--teal-600); }
.fx-bristol__opt:has(input:checked){ border-color:var(--color-primary); background:var(--color-primary-soft); box-shadow:0 0 0 1px var(--color-primary) inset; }
.fx-bristol__opt:has(input:checked) .fx-bristol__num{ background:var(--color-primary); color:#fff; }
.fx-bristol__opt:has(input:checked) .fx-bristol__glyph{ color:var(--color-primary); }
.fx-bristol__opt input:focus-visible ~ .fx-bristol__num{ box-shadow:var(--focus-ring); }
`;

// Abstract, clinical glyphs — never literal or cartoonish.
const G = {
  1: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 54 34",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "17",
    r: "5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "22",
    cy: "17",
    r: "5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "35",
    cy: "17",
    r: "5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "47",
    cy: "17",
    r: "4.2"
  })),
  2: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 54 34",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 17c0-5 4-7 9-7 3 0 4 2 7 2s4-2 7-2 4 2 7 2 4-2 7-2c5 0 7 3 7 7s-2 7-7 7c-3 0-4-2-7-2s-4 2-7 2-4-2-7-2-4 2-7 2c-5 0-9-2-9-7Z"
  })),
  3: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 54 34",
    fill: "none"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "5",
    y: "10",
    width: "44",
    height: "14",
    rx: "7",
    fill: "currentColor"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M18 10v14M30 10v14M40 10v14",
    stroke: "var(--color-bg)",
    strokeWidth: "2"
  })),
  4: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 54 34",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "4",
    y: "11",
    width: "46",
    height: "12",
    rx: "6"
  })),
  5: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 54 34",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("ellipse", {
    cx: "13",
    cy: "17",
    rx: "8",
    ry: "6.5"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "30",
    cy: "17",
    rx: "7",
    ry: "6"
  }), /*#__PURE__*/React.createElement("ellipse", {
    cx: "44",
    cy: "17",
    rx: "6",
    ry: "5.5"
  })),
  6: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 54 34",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8 18c-3 0-5-2-4-5 0-2 2-3 4-3 0-3 3-5 6-4 1-3 5-4 7-2 2-2 6-1 7 1 3-1 6 1 6 4 3 0 5 2 4 5 1 2-1 5-4 5-1 2-4 3-6 1-2 2-5 2-7 0-2 2-5 1-6-1-2 1-5 1-7-1-1 1-3 1-4 0Z"
  })),
  7: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 54 34",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "3.4",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 19c5 0 5-3 10-3s5 3 10 3 5-3 10-3 5 3 10 3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 25h34",
    opacity: ".5"
  }))
};
const TYPES = [{
  n: 1,
  label: 'Trozos duros separados',
  cat: 'Estreñimiento',
  catClass: 'hard'
}, {
  n: 2,
  label: 'Forma alargada y grumosa',
  cat: 'Estreñimiento',
  catClass: 'hard'
}, {
  n: 3,
  label: 'Alargada con grietas',
  cat: 'Normal',
  catClass: 'ok'
}, {
  n: 4,
  label: 'Lisa y blanda',
  cat: 'Ideal',
  catClass: 'ok'
}, {
  n: 5,
  label: 'Trozos blandos con bordes',
  cat: 'Tránsito rápido',
  catClass: 'loose'
}, {
  n: 6,
  label: 'Trozos blandos deshechos',
  cat: 'Diarrea leve',
  catClass: 'loose'
}, {
  n: 7,
  label: 'Líquida, sin trozos',
  cat: 'Diarrea',
  catClass: 'loose'
}];

/** Bristol stool scale (types 1–7) with tasteful abstract glyphs and plain-language labels. */
function BristolScaleSelector({
  name = 'bristol',
  value,
  onChange,
  className = ''
}) {
  __ds_scope.injectStyle('bristol', CSS);
  return /*#__PURE__*/React.createElement("div", {
    className: ['fx-bristol', className].filter(Boolean).join(' '),
    role: "radiogroup",
    "aria-label": "Escala de Bristol"
  }, TYPES.map(t => /*#__PURE__*/React.createElement("label", {
    key: t.n,
    className: "fx-bristol__opt"
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: name,
    value: t.n,
    checked: value === t.n,
    onChange: () => onChange && onChange(t.n)
  }), /*#__PURE__*/React.createElement("span", {
    className: "fx-bristol__num"
  }, t.n), /*#__PURE__*/React.createElement("span", {
    className: "fx-bristol__glyph"
  }, G[t.n]), /*#__PURE__*/React.createElement("span", {
    className: "fx-bristol__body"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fx-bristol__label"
  }, t.label), /*#__PURE__*/React.createElement("span", {
    className: `fx-bristol__cat fx-bristol__cat--${t.catClass}`
  }, t.cat)))));
}
Object.assign(__ds_scope, { BristolScaleSelector });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/health/BristolScaleSelector.jsx", error: String((e && e.message) || e) }); }

// components/health/ClinicalAlertCard.jsx
try { (() => {
const CSS = `
.fx-calert{ font-family:var(--font-sans); border-radius:var(--radius-xl); padding:18px; box-sizing:border-box; display:flex; gap:14px; align-items:flex-start; }
.fx-calert--info{ background:var(--info-soft); }
.fx-calert--watch{ background:var(--warning-soft); }
.fx-calert--urgent{ background:var(--error-soft); }
.fx-calert__icon{ flex:none; width:46px; height:46px; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; }
.fx-calert__icon svg{ width:24px; height:24px; color:#fff; }
.fx-calert--info .fx-calert__icon{ background:var(--color-primary); }
.fx-calert--watch .fx-calert__icon{ background:var(--warning-500); }
.fx-calert--urgent .fx-calert__icon{ background:var(--error-500); }
.fx-calert__body{ flex:1; min-width:0; }
.fx-calert__tag{ font-size:11px; font-weight:var(--weight-bold); letter-spacing:.04em; text-transform:uppercase; }
.fx-calert--info .fx-calert__tag{ color:var(--blue-700); }
.fx-calert--watch .fx-calert__tag{ color:var(--warning-700); }
.fx-calert--urgent .fx-calert__tag{ color:var(--error-700); }
.fx-calert__title{ font-size:var(--text-body-lg); font-weight:var(--weight-semibold); color:var(--text-primary); margin-top:3px; }
.fx-calert__msg{ font-size:var(--text-body-sm); color:var(--text-secondary); line-height:1.5; margin-top:5px; }
.fx-calert__actions{ margin-top:13px; display:flex; gap:10px; flex-wrap:wrap; }
`;
const ICONS = {
  info: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 11v5M12 8h.01"
  })),
  watch: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 7v5l3 2"
  })),
  urgent: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10.3 3.3 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 9v4M12 17h.01"
  }))
};
const LABEL = {
  info: 'Información',
  watch: 'A vigilar',
  urgent: 'Atención'
};

/** Clinical alert card — calm, plain-language flag (blood, dehydration, irregularity). */
function ClinicalAlertCard({
  severity = 'watch',
  tagLabel,
  title,
  message,
  actions,
  icon,
  className = ''
}) {
  __ds_scope.injectStyle('clinicalalert', CSS);
  return /*#__PURE__*/React.createElement("div", {
    className: ['fx-calert', `fx-calert--${severity}`, className].filter(Boolean).join(' '),
    role: severity === 'urgent' ? 'alert' : 'status'
  }, /*#__PURE__*/React.createElement("span", {
    className: "fx-calert__icon"
  }, icon || ICONS[severity]), /*#__PURE__*/React.createElement("div", {
    className: "fx-calert__body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-calert__tag"
  }, tagLabel || LABEL[severity]), title && /*#__PURE__*/React.createElement("div", {
    className: "fx-calert__title"
  }, title), message && /*#__PURE__*/React.createElement("div", {
    className: "fx-calert__msg"
  }, message), actions && /*#__PURE__*/React.createElement("div", {
    className: "fx-calert__actions"
  }, actions)));
}
Object.assign(__ds_scope, { ClinicalAlertCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/health/ClinicalAlertCard.jsx", error: String((e && e.message) || e) }); }

// components/health/DailySummaryCard.jsx
try { (() => {
const CSS = `
.fx-summary{ font-family:var(--font-sans); background:var(--gradient-flow); color:#fff; border-radius:var(--radius-2xl); box-shadow:var(--shadow-lg); padding:22px; box-sizing:border-box; position:relative; overflow:hidden; }
.fx-summary::after{ content:''; position:absolute; right:-40px; top:-40px; width:160px; height:160px; border-radius:50%; background:radial-gradient(circle, rgba(255,255,255,.18), transparent 70%); }
.fx-summary__head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; position:relative; }
.fx-summary__title{ font-size:var(--text-h3); font-weight:var(--weight-semibold); letter-spacing:-0.01em; }
.fx-summary__date{ font-size:var(--text-caption); color:rgba(255,255,255,.82); }
.fx-summary__stats{ display:flex; gap:10px; position:relative; }
.fx-summary__stat{ flex:1; background:rgba(255,255,255,.16); border-radius:var(--radius-lg); padding:14px; -webkit-backdrop-filter:blur(4px); backdrop-filter:blur(4px); }
.fx-summary__stat svg{ width:20px; height:20px; opacity:.92; margin-bottom:8px; }
.fx-summary__num{ font-size:var(--text-h2); font-weight:var(--weight-semibold); font-variant-numeric:tabular-nums; line-height:1; }
.fx-summary__num small{ font-size:14px; font-weight:var(--weight-medium); opacity:.85; margin-left:2px; }
.fx-summary__lbl{ font-size:var(--text-caption); color:rgba(255,255,255,.85); margin-top:4px; }
`;

/** "Resumen de hoy" hero card showing the day's key counts on a brand-gradient surface. */
function DailySummaryCard({
  title = 'Resumen de hoy',
  date,
  stats = [],
  className = ''
}) {
  __ds_scope.injectStyle('summary', CSS);
  return /*#__PURE__*/React.createElement("div", {
    className: ['fx-summary', className].filter(Boolean).join(' ')
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-summary__head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fx-summary__title"
  }, title), date && /*#__PURE__*/React.createElement("span", {
    className: "fx-summary__date"
  }, date)), /*#__PURE__*/React.createElement("div", {
    className: "fx-summary__stats"
  }, stats.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "fx-summary__stat"
  }, s.icon, /*#__PURE__*/React.createElement("div", {
    className: "fx-summary__num"
  }, s.value, s.unit && /*#__PURE__*/React.createElement("small", null, s.unit)), /*#__PURE__*/React.createElement("div", {
    className: "fx-summary__lbl"
  }, s.label)))));
}
Object.assign(__ds_scope, { DailySummaryCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/health/DailySummaryCard.jsx", error: String((e && e.message) || e) }); }

// components/health/ExportReportButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.fx-export{
  font-family:var(--font-sans); display:flex; align-items:center; gap:16px; width:100%; box-sizing:border-box; text-align:left;
  background:var(--color-surface); border:1.5px solid var(--border); border-radius:var(--radius-xl); padding:18px; cursor:pointer; min-height:72px;
  transition:var(--transition-colors), transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-base); -webkit-tap-highlight-color:transparent;
}
.fx-export:hover{ border-color:var(--color-primary); box-shadow:var(--shadow-md); }
.fx-export:active{ transform:scale(.99); }
.fx-export:focus-visible{ outline:none; box-shadow:var(--focus-ring); }
.fx-export__icon{ flex:none; width:52px; height:52px; border-radius:var(--radius-md); background:var(--gradient-primary); color:#fff; display:flex; align-items:center; justify-content:center; }
.fx-export__icon svg{ width:26px; height:26px; }
.fx-export__body{ flex:1; min-width:0; }
.fx-export__title{ font-size:var(--text-body-lg); font-weight:var(--weight-semibold); color:var(--text-primary); }
.fx-export__sub{ font-size:var(--text-caption); color:var(--text-secondary); margin-top:2px; }
.fx-export__fmt{ flex:none; font-size:11px; font-weight:var(--weight-bold); color:var(--text-tertiary); background:var(--ink-100); border-radius:var(--radius-sm); padding:5px 9px; letter-spacing:.03em; }
`;
const Share = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M12 15V3M8 7l4-4 4 4"
}), /*#__PURE__*/React.createElement("path", {
  d: "M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"
}));

/** Prominent button-card to export/share a clinical report. */
function ExportReportButton({
  title = 'Compartir informe',
  subtitle = 'Resumen para tu médico',
  format = 'PDF',
  icon,
  className = '',
  ...rest
}) {
  __ds_scope.injectStyle('export', CSS);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: ['fx-export', className].filter(Boolean).join(' ')
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "fx-export__icon"
  }, icon || /*#__PURE__*/React.createElement(Share, null)), /*#__PURE__*/React.createElement("span", {
    className: "fx-export__body"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fx-export__title"
  }, title), /*#__PURE__*/React.createElement("span", {
    className: "fx-export__sub"
  }, subtitle)), format && /*#__PURE__*/React.createElement("span", {
    className: "fx-export__fmt"
  }, format));
}
Object.assign(__ds_scope, { ExportReportButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/health/ExportReportButton.jsx", error: String((e && e.message) || e) }); }

// components/health/FluidIntakeSelector.jsx
try { (() => {
const CSS = `
.fx-fluid{ font-family:var(--font-sans); display:flex; flex-direction:column; gap:14px; }
.fx-fluid__total{ display:flex; align-items:center; gap:14px; background:var(--gradient-data-blue); border-radius:var(--radius-lg); padding:16px; }
.fx-fluid__icon{ width:48px; height:48px; border-radius:var(--radius-md); background:var(--color-surface); color:var(--color-accent); display:flex; align-items:center; justify-content:center; flex:none; }
.fx-fluid__icon svg{ width:26px; height:26px; }
.fx-fluid__amount{ font-size:var(--text-h1); font-weight:var(--weight-semibold); color:var(--text-primary); font-variant-numeric:tabular-nums; line-height:1; }
.fx-fluid__amount small{ font-size:var(--text-body); color:var(--text-secondary); font-weight:var(--weight-medium); margin-left:3px; }
.fx-fluid__sub{ font-size:var(--text-caption); color:var(--text-secondary); margin-top:3px; }
.fx-fluid__clear{ margin-left:auto; background:var(--color-surface); border:1px solid var(--border); border-radius:var(--radius-pill); color:var(--text-secondary); cursor:pointer; font-family:var(--font-sans); font-size:var(--text-caption); font-weight:var(--weight-medium); padding:7px 13px; min-height:36px; }
.fx-fluid__clear:hover{ border-color:var(--border-strong); color:var(--text-primary); }
.fx-fluid__quick{ display:flex; gap:8px; flex-wrap:wrap; }
.fx-fluid__btn{
  display:flex; flex-direction:column; align-items:center; gap:3px; flex:1; min-width:84px; min-height:64px; cursor:pointer;
  background:var(--color-surface); border:1.5px solid var(--border); border-radius:var(--radius-md); font-family:var(--font-sans);
  color:var(--text-primary); transition:var(--transition-colors), transform var(--duration-fast) var(--ease-out); -webkit-tap-highlight-color:transparent;
}
.fx-fluid__btn:hover{ border-color:var(--color-accent); }
.fx-fluid__btn:active{ transform:scale(.97); }
.fx-fluid__btn b{ font-size:var(--text-body); font-weight:var(--weight-semibold); }
.fx-fluid__btn span{ font-size:11px; color:var(--text-tertiary); }
`;
const Drop = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.9",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M12 3s6.5 7 6.5 12a6.5 6.5 0 0 1-13 0C5.5 10 12 3 12 3Z"
}));
const fmtL = ml => (ml / 1000).toFixed(1).replace('.', ',');

/** Fluid intake — running total with quick-add presets. `value` is in millilitres. */
function FluidIntakeSelector({
  value = 0,
  onChange,
  goalMl = 2000,
  presets,
  className = ''
}) {
  __ds_scope.injectStyle('fluid', CSS);
  const opts = presets || [{
    label: 'Vaso',
    ml: 200
  }, {
    label: 'Taza',
    ml: 250
  }, {
    label: 'Botella',
    ml: 500
  }];
  const add = ml => onChange && onChange(Math.max(0, value + ml));
  return /*#__PURE__*/React.createElement("div", {
    className: ['fx-fluid', className].filter(Boolean).join(' ')
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-fluid__total"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fx-fluid__icon"
  }, /*#__PURE__*/React.createElement(Drop, null)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "fx-fluid__amount"
  }, fmtL(value), /*#__PURE__*/React.createElement("small", null, "L")), /*#__PURE__*/React.createElement("div", {
    className: "fx-fluid__sub"
  }, "Objetivo: ", fmtL(goalMl), " L")), value > 0 && /*#__PURE__*/React.createElement("button", {
    className: "fx-fluid__clear",
    onClick: () => onChange && onChange(0)
  }, "Reiniciar")), /*#__PURE__*/React.createElement("div", {
    className: "fx-fluid__quick"
  }, opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.label,
    className: "fx-fluid__btn",
    onClick: () => add(o.ml)
  }, /*#__PURE__*/React.createElement("b", null, "+", o.ml, " ml"), /*#__PURE__*/React.createElement("span", null, o.label)))));
}
Object.assign(__ds_scope, { FluidIntakeSelector });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/health/FluidIntakeSelector.jsx", error: String((e && e.message) || e) }); }

// components/health/MedicationField.jsx
try { (() => {
const CSS = `
.fx-med{ font-family:var(--font-sans); display:flex; flex-direction:column; gap:10px; }
.fx-med__row{ display:flex; gap:10px; }
.fx-med__field{ flex:1; position:relative; display:flex; align-items:center; }
.fx-med__field input{
  width:100%; min-height:52px; box-sizing:border-box; font-family:var(--font-sans); font-size:var(--text-body-lg);
  color:var(--text-primary); background:var(--color-surface); border:1.5px solid var(--border); border-radius:var(--radius-md);
  padding:0 16px; transition:var(--transition-colors);
}
.fx-med__field--name input{ padding-left:46px; }
.fx-med__field input:hover{ border-color:var(--border-strong); }
.fx-med__field input:focus{ outline:none; border-color:var(--border-focus); box-shadow:var(--focus-ring); }
.fx-med__field input::placeholder{ color:var(--text-tertiary); }
.fx-med__icon{ position:absolute; left:15px; color:var(--text-tertiary); display:flex; pointer-events:none; }
.fx-med__icon svg{ width:20px; height:20px; }
.fx-med__field--dose{ flex:0 0 120px; }
.fx-med__add{ display:inline-flex; align-items:center; gap:7px; align-self:flex-start; background:none; border:none; cursor:pointer;
  color:var(--color-primary); font-family:var(--font-sans); font-size:var(--text-body); font-weight:var(--weight-semibold); padding:8px 4px; }
.fx-med__add svg{ width:18px; height:18px; }
.fx-med__chip{ display:inline-flex; align-items:center; gap:8px; background:var(--color-primary-soft); color:var(--blue-700); border-radius:var(--radius-pill); padding:8px 12px 8px 14px; font-size:var(--text-label); font-weight:var(--weight-medium); }
.fx-med__list{ display:flex; flex-direction:column; gap:8px; }
.fx-med__chip button{ background:none; border:none; cursor:pointer; color:inherit; opacity:.6; display:flex; padding:0; }
.fx-med__chip svg{ width:15px; height:15px; }
`;
const Pill = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.9",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "m10.5 20.5-7-7a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7Z"
}), /*#__PURE__*/React.createElement("path", {
  d: "m8.5 8.5 7 7"
}));
const Plus = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M12 5v14M5 12h14"
}));
const X = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2.4",
  strokeLinecap: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M18 6 6 18M6 6l12 12"
}));

/** Medication note field — add one or more medication + dose entries. */
function MedicationField({
  items = [],
  onAdd,
  onRemove,
  className = ''
}) {
  __ds_scope.injectStyle('medfield', CSS);
  const [name, setName] = React.useState('');
  const [dose, setDose] = React.useState('');
  const submit = () => {
    if (name.trim() && onAdd) {
      onAdd({
        name: name.trim(),
        dose: dose.trim()
      });
      setName('');
      setDose('');
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: ['fx-med', className].filter(Boolean).join(' ')
  }, items.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "fx-med__list"
  }, items.map((m, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "fx-med__chip"
  }, /*#__PURE__*/React.createElement(Pill, null), m.name, m.dose ? ` · ${m.dose}` : '', onRemove && /*#__PURE__*/React.createElement("button", {
    onClick: () => onRemove(i),
    "aria-label": "Quitar"
  }, /*#__PURE__*/React.createElement(X, null))))), /*#__PURE__*/React.createElement("div", {
    className: "fx-med__row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-med__field fx-med__field--name"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fx-med__icon"
  }, /*#__PURE__*/React.createElement(Pill, null)), /*#__PURE__*/React.createElement("input", {
    value: name,
    onChange: e => setName(e.target.value),
    placeholder: "Medicaci\xF3n",
    onKeyDown: e => e.key === 'Enter' && submit()
  })), /*#__PURE__*/React.createElement("div", {
    className: "fx-med__field fx-med__field--dose"
  }, /*#__PURE__*/React.createElement("input", {
    value: dose,
    onChange: e => setDose(e.target.value),
    placeholder: "Dosis",
    onKeyDown: e => e.key === 'Enter' && submit()
  }))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "fx-med__add",
    onClick: submit
  }, /*#__PURE__*/React.createElement(Plus, null), "A\xF1adir medicaci\xF3n"));
}
Object.assign(__ds_scope, { MedicationField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/health/MedicationField.jsx", error: String((e && e.message) || e) }); }

// components/health/PainSelector.jsx
try { (() => {
const CSS = `
.fx-levels{ font-family:var(--font-sans); display:flex; gap:8px; }
.fx-levels__opt{
  flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px;
  min-height:78px; padding:10px 6px; box-sizing:border-box; cursor:pointer;
  background:var(--color-surface); border:1.5px solid var(--border); border-radius:var(--radius-lg);
  transition:var(--transition-colors), transform var(--duration-fast) var(--ease-out); -webkit-tap-highlight-color:transparent;
}
.fx-levels__opt:hover{ border-color:var(--border-strong); }
.fx-levels__opt:active{ transform:scale(.97); }
.fx-levels__opt input{ position:absolute; opacity:0; width:1px; height:1px; }
.fx-levels__dot{ width:24px; height:24px; border-radius:50%; background:var(--ink-200); transition:var(--transition-colors); display:flex; align-items:center; justify-content:center; }
.fx-levels__dot svg{ width:15px; height:15px; color:#fff; }
.fx-levels__label{ font-size:var(--text-label); font-weight:var(--weight-medium); color:var(--text-secondary); text-align:center; line-height:1.2; }
.fx-levels__opt:has(input:checked){ border-color:var(--_c,var(--color-primary)); background:color-mix(in srgb, var(--_c,var(--color-primary)) 10%, white); box-shadow:0 0 0 1px var(--_c,var(--color-primary)) inset; }
.fx-levels__opt:has(input:checked) .fx-levels__dot{ background:var(--_c,var(--color-primary)); }
.fx-levels__opt:has(input:checked) .fx-levels__label{ color:var(--text-primary); }
.fx-levels__opt input:focus-visible ~ .fx-levels__dot{ box-shadow:var(--focus-ring); }
`;
const Tick = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "3",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "m5 12 4.5 4.5L16 7"
}));
function Levels({
  name,
  value,
  onChange,
  options,
  ariaLabel,
  className
}) {
  __ds_scope.injectStyle('levels', CSS);
  return /*#__PURE__*/React.createElement("div", {
    className: ['fx-levels', className].filter(Boolean).join(' '),
    role: "radiogroup",
    "aria-label": ariaLabel
  }, options.map(o => /*#__PURE__*/React.createElement("label", {
    key: o.value,
    className: "fx-levels__opt",
    style: {
      '--_c': o.color
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: name,
    value: o.value,
    checked: value === o.value,
    onChange: () => onChange && onChange(o.value)
  }), /*#__PURE__*/React.createElement("span", {
    className: "fx-levels__dot"
  }, value === o.value && /*#__PURE__*/React.createElement(Tick, null)), /*#__PURE__*/React.createElement("span", {
    className: "fx-levels__label"
  }, o.label))));
}

/** Pain / discomfort selector — calm 4-level scale (ninguno / leve / moderado / intenso). */
function PainSelector({
  name = 'dolor',
  value,
  onChange,
  className = ''
}) {
  return /*#__PURE__*/React.createElement(Levels, {
    name: name,
    value: value,
    onChange: onChange,
    ariaLabel: "Dolor o molestia",
    className: className,
    options: [{
      value: 'ninguno',
      label: 'Ninguno',
      color: 'var(--success-500)'
    }, {
      value: 'leve',
      label: 'Leve',
      color: 'var(--teal-500)'
    }, {
      value: 'moderado',
      label: 'Moderado',
      color: 'var(--warning-500)'
    }, {
      value: 'intenso',
      label: 'Intenso',
      color: 'var(--error-500)'
    }]
  });
}
Object.assign(__ds_scope, { PainSelector });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/health/PainSelector.jsx", error: String((e && e.message) || e) }); }

// components/health/ProfessionalReviewCard.jsx
try { (() => {
const CSS = `
.fx-review{ font-family:var(--font-sans); background:var(--color-surface); border-radius:var(--radius-xl); box-shadow:var(--shadow-sm); padding:18px; box-sizing:border-box; }
.fx-review__head{ display:flex; align-items:center; gap:13px; }
.fx-review__avatar{ width:48px; height:48px; border-radius:50%; flex:none; background:var(--gradient-flow); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:var(--weight-semibold); font-size:var(--text-body-lg); overflow:hidden; }
.fx-review__avatar img{ width:100%; height:100%; object-fit:cover; }
.fx-review__who{ flex:1; min-width:0; }
.fx-review__name{ font-size:var(--text-body-lg); font-weight:var(--weight-semibold); color:var(--text-primary); }
.fx-review__role{ font-size:var(--text-caption); color:var(--text-tertiary); }
.fx-review__status{ display:inline-flex; align-items:center; gap:5px; font-size:var(--text-caption); font-weight:var(--weight-semibold); padding:6px 11px; border-radius:var(--radius-pill); white-space:nowrap; }
.fx-review__status svg{ width:14px; height:14px; }
.fx-review__status--reviewed{ background:var(--success-50); color:var(--success-700); }
.fx-review__status--pending{ background:var(--warning-50); color:var(--warning-700); }
.fx-review__note{ margin-top:14px; background:var(--ink-50); border-radius:var(--radius-md); padding:13px 15px; font-size:var(--text-body); color:var(--text-secondary); line-height:1.55; }
.fx-review__foot{ margin-top:14px; display:flex; align-items:center; justify-content:space-between; gap:10px; }
.fx-review__date{ font-size:var(--text-caption); color:var(--text-tertiary); }
`;
const Check = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2.4",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "m5 12 4.5 4.5L19 7"
}));
const Clock = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "9"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 7v5l3 2"
}));

/** Professional review card — shows a clinician, review status and optional note. */
function ProfessionalReviewCard({
  name,
  role,
  avatar,
  initials,
  status = 'pending',
  note,
  date,
  footer,
  className = ''
}) {
  __ds_scope.injectStyle('review', CSS);
  const reviewed = status === 'reviewed';
  return /*#__PURE__*/React.createElement("div", {
    className: ['fx-review', className].filter(Boolean).join(' ')
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-review__head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-review__avatar"
  }, avatar ? /*#__PURE__*/React.createElement("img", {
    src: avatar,
    alt: ""
  }) : initials || (name ? name.slice(0, 2) : '·')), /*#__PURE__*/React.createElement("div", {
    className: "fx-review__who"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-review__name"
  }, name), role && /*#__PURE__*/React.createElement("div", {
    className: "fx-review__role"
  }, role)), /*#__PURE__*/React.createElement("span", {
    className: `fx-review__status fx-review__status--${reviewed ? 'reviewed' : 'pending'}`
  }, reviewed ? /*#__PURE__*/React.createElement(Check, null) : /*#__PURE__*/React.createElement(Clock, null), reviewed ? 'Revisado' : 'Pendiente')), note && /*#__PURE__*/React.createElement("div", {
    className: "fx-review__note"
  }, note), (date || footer) && /*#__PURE__*/React.createElement("div", {
    className: "fx-review__foot"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fx-review__date"
  }, date), footer));
}
Object.assign(__ds_scope, { ProfessionalReviewCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/health/ProfessionalReviewCard.jsx", error: String((e && e.message) || e) }); }

// components/health/QuickLogCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.fx-quicklog{
  font-family:var(--font-sans); display:flex; align-items:center; gap:16px; width:100%; box-sizing:border-box;
  background:var(--color-surface); border:none; border-radius:var(--radius-xl); box-shadow:var(--shadow-sm);
  padding:18px; min-height:var(--touch-large); cursor:pointer; text-align:left;
  transition:box-shadow var(--duration-base) var(--ease-out), transform var(--duration-fast) var(--ease-out);
  -webkit-tap-highlight-color:transparent;
}
.fx-quicklog:hover{ box-shadow:var(--shadow-md); }
.fx-quicklog:active{ transform:scale(.99); }
.fx-quicklog:focus-visible{ outline:none; box-shadow:var(--focus-ring); }
.fx-quicklog__icon{ flex:none; width:60px; height:60px; border-radius:var(--radius-lg); display:flex; align-items:center; justify-content:center; }
.fx-quicklog__icon svg{ width:30px; height:30px; }
.fx-quicklog--bowel .fx-quicklog__icon{ background:var(--gradient-secondary); color:#fff; }
.fx-quicklog--urine .fx-quicklog__icon{ background:linear-gradient(135deg,#5DB0B2,#4DA0A2); color:#fff; }
.fx-quicklog--neutral .fx-quicklog__icon{ background:var(--color-primary-soft); color:var(--color-primary); }
.fx-quicklog__body{ flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
.fx-quicklog__title{ font-size:var(--text-h3); font-weight:var(--weight-semibold); color:var(--text-primary); letter-spacing:-0.01em; }
.fx-quicklog__sub{ font-size:var(--text-body-sm); color:var(--text-secondary); margin-top:2px; }
.fx-quicklog__chev{ flex:none; color:var(--text-tertiary); }
.fx-quicklog__chev svg{ width:24px; height:24px; }
.fx-quicklog--compact{ padding:14px; min-height:auto; }
.fx-quicklog--compact .fx-quicklog__icon{ width:48px; height:48px; border-radius:var(--radius-md); }
.fx-quicklog--compact .fx-quicklog__title{ font-size:var(--text-title); }
`;
const Chevron = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "m9 18 6-6-6-6"
}));

/** Large tappable card that starts a log. `kind` themes the icon (bowel/urine/neutral). */
function QuickLogCard({
  kind = 'neutral',
  icon,
  title,
  subtitle,
  compact = false,
  showChevron = true,
  className = '',
  ...rest
}) {
  __ds_scope.injectStyle('quicklog', CSS);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: ['fx-quicklog', `fx-quicklog--${kind}`, compact ? 'fx-quicklog--compact' : '', className].filter(Boolean).join(' ')
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "fx-quicklog__icon"
  }, icon), /*#__PURE__*/React.createElement("span", {
    className: "fx-quicklog__body"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fx-quicklog__title"
  }, title), subtitle && /*#__PURE__*/React.createElement("span", {
    className: "fx-quicklog__sub"
  }, subtitle)), showChevron && /*#__PURE__*/React.createElement("span", {
    className: "fx-quicklog__chev"
  }, /*#__PURE__*/React.createElement(Chevron, null)));
}
Object.assign(__ds_scope, { QuickLogCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/health/QuickLogCard.jsx", error: String((e && e.message) || e) }); }

// components/health/SymptomTags.jsx
try { (() => {
const CSS = `
.fx-symptoms{ font-family:var(--font-sans); display:flex; gap:9px; flex-wrap:wrap; }
.fx-symptom{
  display:inline-flex; align-items:center; gap:7px; min-height:44px; padding:9px 15px; box-sizing:border-box; cursor:pointer;
  background:var(--color-surface); border:1.5px solid var(--border); border-radius:var(--radius-pill);
  font-family:var(--font-sans); font-size:var(--text-body); font-weight:var(--weight-medium); color:var(--text-secondary);
  transition:var(--transition-colors), transform var(--duration-fast) var(--ease-out); -webkit-tap-highlight-color:transparent;
}
.fx-symptom svg{ width:17px; height:17px; }
.fx-symptom:hover{ border-color:var(--border-strong); color:var(--text-primary); }
.fx-symptom:active{ transform:scale(.97); }
.fx-symptom--on{ background:var(--color-primary-soft); border-color:var(--color-primary); color:var(--blue-700); }
.fx-symptom__plus{ border-style:dashed; color:var(--text-tertiary); }
`;
const Check = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2.6",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "m5 12 4.5 4.5L19 7"
}));
const Plus = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M12 5v14M5 12h14"
}));
const DEFAULTS = ['Hinchazón', 'Gases', 'Dolor abdominal', 'Náuseas', 'Cansancio', 'Estrés', 'Sin apetito'];

/** Selectable symptom chips (multi-select). `value` is an array of selected labels. */
function SymptomTags({
  options = DEFAULTS,
  value = [],
  onChange,
  onAdd,
  className = ''
}) {
  __ds_scope.injectStyle('symptoms', CSS);
  const toggle = s => {
    if (!onChange) return;
    onChange(value.includes(s) ? value.filter(v => v !== s) : [...value, s]);
  };
  const extras = value.filter(v => !options.includes(v));
  return /*#__PURE__*/React.createElement("div", {
    className: ['fx-symptoms', className].filter(Boolean).join(' '),
    role: "group",
    "aria-label": "S\xEDntomas"
  }, [...options, ...extras].map(s => {
    const on = value.includes(s);
    return /*#__PURE__*/React.createElement("button", {
      key: s,
      type: "button",
      className: ['fx-symptom', on ? 'fx-symptom--on' : ''].join(' '),
      "aria-pressed": on,
      onClick: () => toggle(s)
    }, on && /*#__PURE__*/React.createElement(Check, null), s);
  }), onAdd && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "fx-symptom fx-symptom__plus",
    onClick: onAdd
  }, /*#__PURE__*/React.createElement(Plus, null), "A\xF1adir s\xEDntoma"));
}
Object.assign(__ds_scope, { SymptomTags });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/health/SymptomTags.jsx", error: String((e && e.message) || e) }); }

// components/health/UrgencySelector.jsx
try { (() => {
const CSS = `
.fx-levels{ font-family:var(--font-sans); display:flex; gap:8px; }
.fx-levels__opt{
  flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px;
  min-height:78px; padding:10px 6px; box-sizing:border-box; cursor:pointer;
  background:var(--color-surface); border:1.5px solid var(--border); border-radius:var(--radius-lg);
  transition:var(--transition-colors), transform var(--duration-fast) var(--ease-out); -webkit-tap-highlight-color:transparent;
}
.fx-levels__opt:hover{ border-color:var(--border-strong); }
.fx-levels__opt:active{ transform:scale(.97); }
.fx-levels__opt input{ position:absolute; opacity:0; width:1px; height:1px; }
.fx-levels__dot{ width:24px; height:24px; border-radius:50%; background:var(--ink-200); transition:var(--transition-colors); display:flex; align-items:center; justify-content:center; }
.fx-levels__dot svg{ width:15px; height:15px; color:#fff; }
.fx-levels__label{ font-size:var(--text-label); font-weight:var(--weight-medium); color:var(--text-secondary); text-align:center; line-height:1.2; }
.fx-levels__opt:has(input:checked){ border-color:var(--_c,var(--color-primary)); background:color-mix(in srgb, var(--_c,var(--color-primary)) 10%, white); box-shadow:0 0 0 1px var(--_c,var(--color-primary)) inset; }
.fx-levels__opt:has(input:checked) .fx-levels__dot{ background:var(--_c,var(--color-primary)); }
.fx-levels__opt:has(input:checked) .fx-levels__label{ color:var(--text-primary); }
.fx-levels__opt input:focus-visible ~ .fx-levels__dot{ box-shadow:var(--focus-ring); }
`;
const Tick = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "3",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "m5 12 4.5 4.5L16 7"
}));
function Levels({
  name,
  value,
  onChange,
  options,
  ariaLabel,
  className
}) {
  __ds_scope.injectStyle('levels', CSS);
  return /*#__PURE__*/React.createElement("div", {
    className: ['fx-levels', className].filter(Boolean).join(' '),
    role: "radiogroup",
    "aria-label": ariaLabel
  }, options.map(o => /*#__PURE__*/React.createElement("label", {
    key: o.value,
    className: "fx-levels__opt",
    style: {
      '--_c': o.color
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: name,
    value: o.value,
    checked: value === o.value,
    onChange: () => onChange && onChange(o.value)
  }), /*#__PURE__*/React.createElement("span", {
    className: "fx-levels__dot"
  }, value === o.value && /*#__PURE__*/React.createElement(Tick, null)), /*#__PURE__*/React.createElement("span", {
    className: "fx-levels__label"
  }, o.label))));
}

/** Urgency selector — how urgent the need was (sin / moderada / alta). */
function UrgencySelector({
  name = 'urgencia',
  value,
  onChange,
  className = ''
}) {
  return /*#__PURE__*/React.createElement(Levels, {
    name: name,
    value: value,
    onChange: onChange,
    ariaLabel: "Urgencia",
    className: className,
    options: [{
      value: 'sin',
      label: 'Sin urgencia',
      color: 'var(--success-500)'
    }, {
      value: 'moderada',
      label: 'Moderada',
      color: 'var(--warning-500)'
    }, {
      value: 'alta',
      label: 'Urgencia alta',
      color: 'var(--error-500)'
    }]
  });
}
Object.assign(__ds_scope, { UrgencySelector });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/health/UrgencySelector.jsx", error: String((e && e.message) || e) }); }

// components/health/BowelLog.jsx
try { (() => {
const CSS = `
.fx-log{ font-family:var(--font-sans); display:flex; flex-direction:column; gap:24px; }
.fx-log__sec{ display:flex; flex-direction:column; gap:12px; }
.fx-log__q{ font-size:var(--text-h3); font-weight:var(--weight-semibold); color:var(--text-primary); letter-spacing:-0.01em; }
.fx-log__hint{ font-size:var(--text-body-sm); color:var(--text-tertiary); margin-top:-6px; }
`;

/** Full bowel-movement log body (Bristol, urgency, pain, blood/mucus, symptoms, notes). Controlled. */
function BowelLog({
  value = {},
  onChange,
  className = ''
}) {
  __ds_scope.injectStyle('log', CSS);
  const set = (k, v) => onChange && onChange({
    ...value,
    [k]: v
  });
  return /*#__PURE__*/React.createElement("div", {
    className: ['fx-log', className].filter(Boolean).join(' ')
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-log__sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-log__q"
  }, "\xBFC\xF3mo ha sido?"), /*#__PURE__*/React.createElement("div", {
    className: "fx-log__hint"
  }, "Elige la forma m\xE1s parecida."), /*#__PURE__*/React.createElement(__ds_scope.BristolScaleSelector, {
    value: value.bristol,
    onChange: v => set('bristol', v)
  })), /*#__PURE__*/React.createElement("div", {
    className: "fx-log__sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-log__q"
  }, "\xBFTen\xEDas urgencia?"), /*#__PURE__*/React.createElement(__ds_scope.UrgencySelector, {
    value: value.urgencia,
    onChange: v => set('urgencia', v)
  })), /*#__PURE__*/React.createElement("div", {
    className: "fx-log__sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-log__q"
  }, "\xBFNotaste dolor?"), /*#__PURE__*/React.createElement(__ds_scope.PainSelector, {
    value: value.dolor,
    onChange: v => set('dolor', v)
  })), /*#__PURE__*/React.createElement("div", {
    className: "fx-log__sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-log__q"
  }, "\xBFSangre o moco?"), /*#__PURE__*/React.createElement(__ds_scope.BloodMucusSelector, {
    value: value.bloodMucus || [],
    onChange: v => set('bloodMucus', v)
  })), /*#__PURE__*/React.createElement("div", {
    className: "fx-log__sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-log__q"
  }, "S\xEDntomas"), /*#__PURE__*/React.createElement(__ds_scope.SymptomTags, {
    value: value.symptoms || [],
    onChange: v => set('symptoms', v)
  })), /*#__PURE__*/React.createElement("div", {
    className: "fx-log__sec"
  }, /*#__PURE__*/React.createElement(__ds_scope.Textarea, {
    label: "Notas (opcional)",
    placeholder: "A\xF1ade cualquier detalle\u2026",
    value: value.notes || '',
    onChange: e => set('notes', e.target.value),
    maxLength: 200
  })));
}
Object.assign(__ds_scope, { BowelLog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/health/BowelLog.jsx", error: String((e && e.message) || e) }); }

// components/health/UrinationLog.jsx
try { (() => {
const CSS = `
.fx-ulog{ font-family:var(--font-sans); display:flex; flex-direction:column; gap:24px; }
.fx-ulog__sec{ display:flex; flex-direction:column; gap:12px; }
.fx-ulog__q{ font-size:var(--text-h3); font-weight:var(--weight-semibold); color:var(--text-primary); letter-spacing:-0.01em; }
.fx-ulog__opts{ display:flex; gap:8px; }
.fx-ulog__opt{ flex:1; display:flex; flex-direction:column; align-items:center; gap:9px; min-height:84px; justify-content:center; padding:12px 6px; box-sizing:border-box; cursor:pointer;
  background:var(--color-surface); border:1.5px solid var(--border); border-radius:var(--radius-lg);
  transition:var(--transition-colors), transform var(--duration-fast) var(--ease-out); -webkit-tap-highlight-color:transparent; }
.fx-ulog__opt:hover{ border-color:var(--border-strong); }
.fx-ulog__opt:active{ transform:scale(.97); }
.fx-ulog__opt input{ position:absolute; opacity:0; width:1px; height:1px; }
.fx-ulog__swatch{ width:34px; height:34px; border-radius:50%; border:2px solid rgba(0,0,0,.06); }
.fx-ulog__txt{ font-size:var(--text-label); font-weight:var(--weight-medium); color:var(--text-secondary); text-align:center; line-height:1.2; }
.fx-ulog__opt:has(input:checked){ border-color:var(--color-primary); background:var(--color-primary-soft); box-shadow:0 0 0 1px var(--color-primary) inset; }
.fx-ulog__opt:has(input:checked) .fx-ulog__txt{ color:var(--text-primary); }
.fx-ulog__opt input:focus-visible ~ .fx-ulog__swatch{ box-shadow:var(--focus-ring); }
`;
const COLORS = [{
  value: 'clara',
  label: 'Clara',
  swatch: '#F4F1C8'
}, {
  value: 'normal',
  label: 'Normal',
  swatch: '#EBD96B'
}, {
  value: 'oscura',
  label: 'Oscura',
  swatch: '#C8A12E'
}, {
  value: 'rojiza',
  label: 'Rojiza',
  swatch: '#C97A6A'
}];

/** Full urination log body (color, urgency, discomfort, amount, notes). Controlled. */
function UrinationLog({
  value = {},
  onChange,
  className = ''
}) {
  __ds_scope.injectStyle('urinelog', CSS);
  const set = (k, v) => onChange && onChange({
    ...value,
    [k]: v
  });
  return /*#__PURE__*/React.createElement("div", {
    className: ['fx-ulog', className].filter(Boolean).join(' ')
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-ulog__sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-ulog__q"
  }, "\xBFDe qu\xE9 color?"), /*#__PURE__*/React.createElement("div", {
    className: "fx-ulog__opts",
    role: "radiogroup",
    "aria-label": "Color"
  }, COLORS.map(c => /*#__PURE__*/React.createElement("label", {
    key: c.value,
    className: "fx-ulog__opt"
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: "ucolor",
    value: c.value,
    checked: value.color === c.value,
    onChange: () => set('color', c.value)
  }), /*#__PURE__*/React.createElement("span", {
    className: "fx-ulog__swatch",
    style: {
      background: c.swatch
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "fx-ulog__txt"
  }, c.label))))), /*#__PURE__*/React.createElement("div", {
    className: "fx-ulog__sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-ulog__q"
  }, "\xBFTen\xEDas urgencia?"), /*#__PURE__*/React.createElement(__ds_scope.UrgencySelector, {
    name: "u-urg",
    value: value.urgencia,
    onChange: v => set('urgencia', v)
  })), /*#__PURE__*/React.createElement("div", {
    className: "fx-ulog__sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-ulog__q"
  }, "\xBFEscozor o molestia?"), /*#__PURE__*/React.createElement(__ds_scope.PainSelector, {
    name: "u-dolor",
    value: value.molestia,
    onChange: v => set('molestia', v)
  })), /*#__PURE__*/React.createElement("div", {
    className: "fx-ulog__sec"
  }, /*#__PURE__*/React.createElement(__ds_scope.Textarea, {
    label: "Notas (opcional)",
    placeholder: "A\xF1ade cualquier detalle\u2026",
    value: value.notes || '',
    onChange: e => set('notes', e.target.value),
    maxLength: 200
  })));
}
Object.assign(__ds_scope, { UrinationLog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/health/UrinationLog.jsx", error: String((e && e.message) || e) }); }

// components/health/WeeklyTrendCard.jsx
try { (() => {
const CSS = `
.fx-trend{ font-family:var(--font-sans); background:var(--color-surface); border-radius:var(--radius-xl); box-shadow:var(--shadow-sm); padding:20px; box-sizing:border-box; }
.fx-trend__head{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:18px; }
.fx-trend__title{ font-size:var(--text-title); font-weight:var(--weight-semibold); color:var(--text-primary); }
.fx-trend__sub{ font-size:var(--text-caption); color:var(--text-tertiary); margin-top:2px; }
.fx-trend__delta{ display:inline-flex; align-items:center; gap:4px; font-size:var(--text-label); font-weight:var(--weight-semibold); padding:5px 10px; border-radius:var(--radius-pill); }
.fx-trend__delta svg{ width:15px; height:15px; }
.fx-trend__delta--up{ background:var(--success-50); color:var(--success-700); }
.fx-trend__delta--down{ background:var(--error-50); color:var(--error-700); }
.fx-trend__delta--flat{ background:var(--ink-100); color:var(--text-secondary); }
.fx-trend__chart{ display:flex; align-items:flex-end; gap:8px; height:96px; }
.fx-trend__col{ flex:1; display:flex; flex-direction:column; align-items:center; gap:8px; height:100%; justify-content:flex-end; }
.fx-trend__bar{ width:100%; max-width:30px; border-radius:8px 8px 4px 4px; background:var(--gradient-data-blue); min-height:6px; position:relative; transition:height var(--duration-slow) var(--ease-out); }
.fx-trend__bar--accent{ background:var(--gradient-secondary); }
.fx-trend__bar--max{ background:var(--gradient-primary); }
.fx-trend__day{ font-size:11px; color:var(--text-tertiary); font-weight:var(--weight-medium); }
.fx-trend__val{ position:absolute; top:-18px; left:50%; transform:translateX(-50%); font-size:11px; font-weight:var(--weight-semibold); color:var(--text-secondary); font-variant-numeric:tabular-nums; }
`;
const arrows = {
  up: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M7 17 17 7M9 7h8v8"
  })),
  down: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M7 7l10 10M17 9v8H9"
  })),
  flat: /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14"
  }))
};

/** Weekly trend card with a soft mini bar chart. `data`: [{day,value}]. */
function WeeklyTrendCard({
  title = 'Resumen semanal',
  subtitle,
  data = [],
  delta,
  deltaLabel,
  showValues = true,
  tone = 'blue',
  className = ''
}) {
  __ds_scope.injectStyle('trend', CSS);
  const max = Math.max(1, ...data.map(d => d.value));
  return /*#__PURE__*/React.createElement("div", {
    className: ['fx-trend', className].filter(Boolean).join(' ')
  }, /*#__PURE__*/React.createElement("div", {
    className: "fx-trend__head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "fx-trend__title"
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    className: "fx-trend__sub"
  }, subtitle)), delta && /*#__PURE__*/React.createElement("span", {
    className: `fx-trend__delta fx-trend__delta--${delta}`
  }, arrows[delta], deltaLabel)), /*#__PURE__*/React.createElement("div", {
    className: "fx-trend__chart"
  }, data.map((d, i) => {
    const isMax = d.value === max && max > 0;
    const h = `${Math.max(6, d.value / max * 100)}%`;
    const barCls = ['fx-trend__bar', tone === 'green' ? 'fx-trend__bar--accent' : '', isMax ? 'fx-trend__bar--max' : ''].filter(Boolean).join(' ');
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "fx-trend__col"
    }, /*#__PURE__*/React.createElement("div", {
      className: barCls,
      style: {
        height: h
      }
    }, showValues && /*#__PURE__*/React.createElement("span", {
      className: "fx-trend__val"
    }, d.value)), /*#__PURE__*/React.createElement("span", {
      className: "fx-trend__day"
    }, d.day));
  })));
}
Object.assign(__ds_scope, { WeeklyTrendCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/health/WeeklyTrendCard.jsx", error: String((e && e.message) || e) }); }

// components/navigation/BottomNav.jsx
try { (() => {
const CSS = `
.fx-bottomnav{
  display:flex; align-items:stretch; font-family:var(--font-sans); position:relative;
  background:var(--color-surface-glass-strong); -webkit-backdrop-filter:blur(var(--blur-glass)); backdrop-filter:blur(var(--blur-glass));
  border-top:1px solid var(--border-soft); padding:8px 8px calc(8px + env(safe-area-inset-bottom));
  box-shadow:0 -6px 24px rgba(40,70,82,.06);
}
.fx-bottomnav__item{
  flex:1; border:none; background:none; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px;
  min-height:56px; color:var(--text-tertiary); font-family:var(--font-sans); font-size:11px; font-weight:var(--weight-medium);
  border-radius:var(--radius-md); transition:var(--transition-colors); -webkit-tap-highlight-color:transparent;
}
.fx-bottomnav__item svg{ width:24px; height:24px; stroke-width:1.9; }
.fx-bottomnav__item:hover{ color:var(--text-secondary); }
.fx-bottomnav__item--active{ color:var(--color-primary); }
.fx-bottomnav__fab{ flex:none; width:64px; display:flex; align-items:center; justify-content:center; }
.fx-bottomnav__fabbtn{
  width:60px; height:60px; margin-top:-26px; border-radius:50%; border:4px solid var(--color-bg);
  background:var(--gradient-primary); color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer;
  box-shadow:var(--shadow-primary); transition:transform var(--duration-fast) var(--ease-out);
}
.fx-bottomnav__fabbtn:hover{ transform:scale(1.04); }
.fx-bottomnav__fabbtn:active{ transform:scale(.96); }
.fx-bottomnav__fabbtn svg{ width:30px; height:30px; stroke-width:2.2; }
`;

/** Glass bottom navigation with an optional centered FAB. */
function BottomNav({
  items = [],
  value,
  onChange,
  fab,
  className = ''
}) {
  __ds_scope.injectStyle('bottomnav', CSS);
  const mid = fab ? Math.ceil(items.length / 2) : items.length;
  const left = items.slice(0, mid);
  const right = items.slice(mid);
  const renderItem = it => /*#__PURE__*/React.createElement("button", {
    key: it.value,
    className: ['fx-bottomnav__item', it.value === value ? 'fx-bottomnav__item--active' : ''].join(' '),
    onClick: () => onChange && onChange(it.value),
    "aria-current": it.value === value ? 'page' : undefined
  }, it.icon, /*#__PURE__*/React.createElement("span", null, it.label));
  return /*#__PURE__*/React.createElement("nav", {
    className: ['fx-bottomnav', className].filter(Boolean).join(' ')
  }, left.map(renderItem), fab && /*#__PURE__*/React.createElement("div", {
    className: "fx-bottomnav__fab"
  }, /*#__PURE__*/React.createElement("button", {
    className: "fx-bottomnav__fabbtn",
    onClick: fab.onClick,
    "aria-label": fab.label
  }, fab.icon)), right.map(renderItem));
}
Object.assign(__ds_scope, { BottomNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/BottomNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TopBar.jsx
try { (() => {
const CSS = `
.fx-topbar{
  display:flex; align-items:center; gap:12px; font-family:var(--font-sans);
  min-height:60px; padding:10px 8px; box-sizing:border-box;
}
.fx-topbar--glass{ background:var(--color-surface-glass-strong); -webkit-backdrop-filter:blur(var(--blur-glass)); backdrop-filter:blur(var(--blur-glass)); border-bottom:1px solid var(--border-soft); }
.fx-topbar__btn{ flex:none; width:44px; height:44px; border-radius:50%; border:none; background:transparent; color:var(--ink-700); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:var(--transition-colors); }
.fx-topbar__btn:hover{ background:var(--ink-100); }
.fx-topbar__btn svg{ width:23px; height:23px; }
.fx-topbar__center{ flex:1; min-width:0; display:flex; flex-direction:column; }
.fx-topbar__center--c{ align-items:center; text-align:center; }
.fx-topbar__title{ font-size:var(--text-title); font-weight:var(--weight-semibold); letter-spacing:-0.01em; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.fx-topbar__sub{ font-size:var(--text-caption); color:var(--text-tertiary); }
.fx-topbar__actions{ display:flex; gap:4px; align-items:center; }
`;
const Back = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "m15 18-6-6 6-6"
}));

/** App top bar: optional back button, title/subtitle, trailing actions. */
function TopBar({
  title,
  subtitle,
  onBack,
  leading,
  actions,
  align = 'left',
  glass = false,
  className = ''
}) {
  __ds_scope.injectStyle('topbar', CSS);
  return /*#__PURE__*/React.createElement("header", {
    className: ['fx-topbar', glass ? 'fx-topbar--glass' : '', className].filter(Boolean).join(' ')
  }, onBack && /*#__PURE__*/React.createElement("button", {
    className: "fx-topbar__btn",
    onClick: onBack,
    "aria-label": "Atr\xE1s"
  }, /*#__PURE__*/React.createElement(Back, null)), leading, /*#__PURE__*/React.createElement("div", {
    className: ['fx-topbar__center', align === 'center' ? 'fx-topbar__center--c' : ''].join(' ')
  }, title && /*#__PURE__*/React.createElement("span", {
    className: "fx-topbar__title"
  }, title), subtitle && /*#__PURE__*/React.createElement("span", {
    className: "fx-topbar__sub"
  }, subtitle)), actions && /*#__PURE__*/React.createElement("div", {
    className: "fx-topbar__actions"
  }, actions));
}
Object.assign(__ds_scope, { TopBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TopBar.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.fx-badge{
  display:inline-flex; align-items:center; gap:5px; font-family:var(--font-sans);
  font-size:var(--text-caption); font-weight:var(--weight-semibold); line-height:1;
  padding:6px 11px; border-radius:var(--radius-pill); white-space:nowrap;
}
.fx-badge svg{ width:14px; height:14px; }
.fx-badge__dot{ width:7px; height:7px; border-radius:50%; background:currentColor; }
.fx-badge--neutral{ background:var(--ink-100); color:var(--ink-600); }
.fx-badge--primary{ background:var(--color-primary-soft); color:var(--blue-700); }
.fx-badge--success{ background:var(--success-50); color:var(--success-700); }
.fx-badge--warning{ background:var(--warning-50); color:var(--warning-700); }
.fx-badge--error{ background:var(--error-50); color:var(--error-700); }
.fx-badge--accent{ background:var(--teal-50); color:var(--teal-700); }
.fx-badge--solid{ background:var(--color-primary); color:#fff; }
`;

/** Small status pill. Optional leading dot or icon. */
function Badge({
  tone = 'neutral',
  dot = false,
  icon = null,
  className = '',
  children,
  ...rest
}) {
  __ds_scope.injectStyle('badge', CSS);
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ['fx-badge', `fx-badge--${tone}`, className].filter(Boolean).join(' ')
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    className: "fx-badge__dot"
  }), icon, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Badge.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.fx-card{
  background:var(--color-surface); border-radius:var(--radius-xl); box-shadow:var(--shadow-sm);
  font-family:var(--font-sans); color:var(--text-primary); box-sizing:border-box;
}
.fx-card--pad{ padding:var(--card-pad); }
.fx-card--pad-lg{ padding:var(--card-pad-lg); }
.fx-card--elev-0{ box-shadow:none; border:1px solid var(--border-soft); }
.fx-card--elev-2{ box-shadow:var(--shadow-md); }
.fx-card--elev-3{ box-shadow:var(--shadow-lg); }
.fx-card--glass{ background:var(--color-surface-glass); -webkit-backdrop-filter:blur(var(--blur-glass)); backdrop-filter:blur(var(--blur-glass)); box-shadow:var(--shadow-md); border:1px solid rgba(255,255,255,.6); }
.fx-card--flow{ background:var(--gradient-flow); color:#fff; box-shadow:var(--shadow-lg); }
.fx-card--interactive{ cursor:pointer; transition:box-shadow var(--duration-base) var(--ease-out), transform var(--duration-fast) var(--ease-out); }
.fx-card--interactive:hover{ box-shadow:var(--shadow-lg); }
.fx-card--interactive:active{ transform:scale(.995); }
.fx-card__head{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:var(--space-4); }
.fx-card__title{ font-size:var(--text-title); font-weight:var(--weight-semibold); letter-spacing:-0.01em; }
.fx-card__sub{ font-size:var(--text-caption); color:var(--text-tertiary); margin-top:2px; }
.fx-card--flow .fx-card__sub{ color:rgba(255,255,255,.8); }
`;

/** The base surface. Rounded, lightly elevated. Variants: surface / glass / flow. */
function Card({
  variant = 'surface',
  padding = 'md',
  elevation,
  interactive = false,
  title,
  subtitle,
  headerAction,
  as = 'div',
  className = '',
  children,
  ...rest
}) {
  __ds_scope.injectStyle('card', CSS);
  const Tag = as;
  const padCls = padding === 'none' ? '' : padding === 'lg' ? 'fx-card--pad-lg' : 'fx-card--pad';
  const cls = ['fx-card', variant !== 'surface' ? `fx-card--${variant}` : '', padCls, elevation != null ? `fx-card--elev-${elevation}` : '', interactive ? 'fx-card--interactive' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: cls
  }, rest), (title || headerAction) && /*#__PURE__*/React.createElement("div", {
    className: "fx-card__head"
  }, /*#__PURE__*/React.createElement("div", null, title && /*#__PURE__*/React.createElement("div", {
    className: "fx-card__title"
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    className: "fx-card__sub"
  }, subtitle)), headerAction), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Card.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.fx-tag{
  display:inline-flex; align-items:center; gap:7px; font-family:var(--font-sans);
  font-size:var(--text-label); font-weight:var(--weight-medium); color:var(--text-primary);
  background:var(--color-surface); border:1.5px solid var(--border); border-radius:var(--radius-pill);
  padding:8px 14px; min-height:40px; box-sizing:border-box; cursor:pointer; white-space:nowrap;
  transition:var(--transition-colors), transform var(--duration-fast) var(--ease-out);
  -webkit-tap-highlight-color:transparent;
}
.fx-tag svg{ width:16px; height:16px; }
.fx-tag:hover{ border-color:var(--border-strong); background:var(--ink-50); }
.fx-tag:active{ transform:scale(.97); }
.fx-tag--selected{ background:var(--color-primary-soft); border-color:var(--color-primary); color:var(--blue-700); }
.fx-tag--static{ cursor:default; }
.fx-tag--static:hover{ background:var(--color-surface); border-color:var(--border); }
.fx-tag__remove{ display:inline-flex; opacity:.6; }
.fx-tag__remove svg{ width:14px; height:14px; }
`;

/** Pill tag/chip. Use as a selectable symptom chip or a static label. */
function Tag({
  selected = false,
  icon = null,
  onRemove,
  interactive = true,
  className = '',
  children,
  ...rest
}) {
  __ds_scope.injectStyle('tag', CSS);
  const cls = ['fx-tag', selected ? 'fx-tag--selected' : '', !interactive ? 'fx-tag--static' : '', className].filter(Boolean).join(' ');
  const Tag = interactive ? 'button' : 'span';
  return /*#__PURE__*/React.createElement(Tag, _extends({
    type: interactive ? 'button' : undefined,
    className: cls,
    "aria-pressed": interactive ? selected : undefined
  }, rest), icon, children, onRemove && /*#__PURE__*/React.createElement("span", {
    className: "fx-tag__remove",
    onClick: e => {
      e.stopPropagation();
      onRemove();
    },
    "aria-label": "Quitar"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  }))));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Tag.jsx", error: String((e && e.message) || e) }); }

// ui_kits/fluxia-app/app.jsx
try { (() => {
/* global React, ReactDOM */
/*__IIFE__*/(function () {
  const Ic = (n, props = {}) => React.createElement('i', {
    'data-lucide': n,
    ...props
  });
  function StatusBar() {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 24px 2px',
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--text-primary)',
        fontVariantNumeric: 'tabular-nums'
      }
    }, /*#__PURE__*/React.createElement("span", null, "9:41"), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        gap: 6,
        alignItems: 'center'
      }
    }, Ic('signal', {
      style: {
        width: 16,
        height: 16
      }
    }), Ic('wifi', {
      style: {
        width: 16,
        height: 16
      }
    }), Ic('battery-full', {
      style: {
        width: 20,
        height: 20
      }
    })));
  }
  function FluxiaApp() {
    const NS = window.FluxiaHealthDesignSystem_0efbb0;
    const FX = window.FX;
    const {
      BottomNav,
      Toast
    } = NS;
    const [screen, setScreen] = React.useState('home');
    const [choose, setChoose] = React.useState(false);
    const [log, setLog] = React.useState(null); // 'bowel' | 'urine'
    const [toast, setToast] = React.useState(null);
    const scrollRef = React.useRef(null);
    const go = s => {
      setScreen(s);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    };
    const openLog = kind => {
      setChoose(false);
      setLog(kind);
    };
    const onSave = entry => {
      setLog(null);
      setToast({
        tone: 'success',
        title: 'Registro guardado',
        message: entry.kind === 'bowel' ? 'Deposición · ' + entry.time : 'Micción · ' + entry.time
      });
      go('timeline');
    };
    React.useEffect(() => {
      window.lucide && window.lucide.createIcons();
    });
    React.useEffect(() => {
      if (!toast) return;
      const t = setTimeout(() => setToast(null), 3200);
      return () => clearTimeout(t);
    }, [toast]);
    const screens = {
      onboarding: /*#__PURE__*/React.createElement(FX.Onboarding, {
        go: go
      }),
      home: /*#__PURE__*/React.createElement(FX.Home, {
        openLog: openLog,
        go: go
      }),
      empty: /*#__PURE__*/React.createElement(FX.EmptyHome, {
        openLog: openLog
      }),
      timeline: /*#__PURE__*/React.createElement(FX.Timeline, null),
      weekly: /*#__PURE__*/React.createElement(FX.Weekly, {
        go: go
      }),
      trends: /*#__PURE__*/React.createElement(FX.Trends, null),
      profile: /*#__PURE__*/React.createElement(FX.Profile, {
        go: go
      }),
      settings: /*#__PURE__*/React.createElement(FX.Settings, {
        go: go
      }),
      export: /*#__PURE__*/React.createElement(FX.Export, {
        go: go
      })
    };
    const navMap = {
      home: 'home',
      timeline: 'timeline',
      trends: 'trends',
      profile: 'profile'
    };
    const navValue = navMap[screen] || '';
    const showChrome = screen !== 'onboarding';
    const items = [{
      value: 'home',
      label: 'Inicio',
      icon: Ic('house')
    }, {
      value: 'timeline',
      label: 'Historial',
      icon: Ic('list')
    }, {
      value: 'trends',
      label: 'Tendencias',
      icon: Ic('trending-up')
    }, {
      value: 'profile',
      label: 'Perfil',
      icon: Ic('user-round')
    }];
    return /*#__PURE__*/React.createElement("div", {
      className: "phone"
    }, /*#__PURE__*/React.createElement("div", {
      className: "phone__notch"
    }), showChrome && /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
      className: "phone__scroll",
      ref: scrollRef,
      style: {
        paddingTop: showChrome ? 0 : 0
      }
    }, screens[screen]), showChrome && /*#__PURE__*/React.createElement("div", {
      className: "phone__nav"
    }, /*#__PURE__*/React.createElement(BottomNav, {
      items: items,
      value: navValue,
      onChange: go,
      fab: {
        icon: Ic('plus'),
        label: 'Nuevo registro',
        onClick: () => setChoose(true)
      }
    })), /*#__PURE__*/React.createElement(FX.ChooseLogSheet, {
      open: choose,
      onClose: () => setChoose(false),
      onPick: openLog
    }), /*#__PURE__*/React.createElement(FX.BowelLogSheet, {
      open: log === 'bowel',
      onClose: () => setLog(null),
      onSave: onSave
    }), /*#__PURE__*/React.createElement(FX.UrineLogSheet, {
      open: log === 'urine',
      onClose: () => setLog(null),
      onSave: onSave
    }), toast && /*#__PURE__*/React.createElement("div", {
      className: "phone__toast"
    }, /*#__PURE__*/React.createElement(Toast, {
      tone: toast.tone,
      title: toast.title,
      message: toast.message
    })));
  }

  // Mount only once every screen is registered on window.FX and the DS bundle is ready —
  // the four babel scripts are not guaranteed to execute in DOM order.
  function mount() {
    const FXr = window.FX || {};
    const NSr = window.FluxiaHealthDesignSystem_0efbb0;
    const need = ['Onboarding', 'Home', 'EmptyHome', 'Timeline', 'Weekly', 'Trends', 'Profile', 'Settings', 'Export', 'ChooseLogSheet', 'BowelLogSheet', 'UrineLogSheet'];
    const ready = NSr && NSr.BottomNav && need.every(k => typeof FXr[k] === 'function');
    const el = document.getElementById('root');
    if (!ready || !el) {
      return setTimeout(mount, 30);
    }
    if (el.__rooted) return;
    el.__rooted = true;
    ReactDOM.createRoot(el).render(/*#__PURE__*/React.createElement(FluxiaApp, null));
    setTimeout(() => window.lucide && window.lucide.createIcons(), 60);
  }
  mount();
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/fluxia-app/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/fluxia-app/logflows.jsx
try { (() => {
/* global React */
/*__IIFE__*/(function () {
  // Log flows: bottom-sheet experiences for bowel & urination logging.
  const FX = window.FX = window.FX || {};
  const NS = window.FluxiaHealthDesignSystem_0efbb0;
  const Ic = (n, props = {}) => React.createElement('i', {
    'data-lucide': n,
    ...props
  });
  function SheetHeaderTime({
    time,
    setTime
  }) {
    const {
      TopBar
    } = NS;
    return null;
  }

  // Choose-what-to-log sheet
  FX.ChooseLogSheet = function ChooseLogSheet({
    open,
    onClose,
    onPick
  }) {
    const {
      BottomSheet,
      QuickLogCard
    } = NS;
    return /*#__PURE__*/React.createElement(BottomSheet, {
      open: open,
      onClose: onClose,
      title: "\xBFQu\xE9 quieres registrar?"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        paddingBottom: 6
      }
    }, /*#__PURE__*/React.createElement(QuickLogCard, {
      kind: "bowel",
      icon: Ic('circle'),
      title: "Deposici\xF3n",
      subtitle: "Forma, s\xEDntomas y notas",
      onClick: () => onPick('bowel')
    }), /*#__PURE__*/React.createElement(QuickLogCard, {
      kind: "urine",
      icon: Ic('droplets'),
      title: "Micci\xF3n",
      subtitle: "Color, urgencia y molestias",
      onClick: () => onPick('urine')
    })));
  };

  // Bowel log flow
  FX.BowelLogSheet = function BowelLogSheet({
    open,
    onClose,
    onSave
  }) {
    const {
      BottomSheet,
      BowelLog,
      Button,
      TimePicker
    } = NS;
    const [val, setVal] = React.useState({
      bristol: 4,
      urgencia: 'sin',
      dolor: 'ninguno',
      bloodMucus: [],
      symptoms: []
    });
    const [time, setTime] = React.useState('11:24');
    React.useEffect(() => {
      window.lucide && window.lucide.createIcons();
    });
    return /*#__PURE__*/React.createElement(BottomSheet, {
      open: open,
      onClose: onClose,
      title: "Registrar deposici\xF3n"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 20
      }
    }, /*#__PURE__*/React.createElement(TimePicker, {
      label: "Hora",
      value: time,
      onChange: e => setTime(e.target.value)
    })), /*#__PURE__*/React.createElement(BowelLog, {
      value: val,
      onChange: setVal
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'sticky',
        bottom: 0,
        background: 'var(--color-surface)',
        paddingTop: 16,
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      fullWidth: true,
      leadingIcon: Ic('check'),
      onClick: () => onSave({
        kind: 'bowel',
        time,
        ...val
      })
    }, "Guardar registro")));
  };

  // Urination log flow
  FX.UrineLogSheet = function UrineLogSheet({
    open,
    onClose,
    onSave
  }) {
    const {
      BottomSheet,
      UrinationLog,
      Button,
      TimePicker
    } = NS;
    const [val, setVal] = React.useState({
      color: 'normal',
      urgencia: 'sin',
      molestia: 'ninguno'
    });
    const [time, setTime] = React.useState('11:24');
    React.useEffect(() => {
      window.lucide && window.lucide.createIcons();
    });
    return /*#__PURE__*/React.createElement(BottomSheet, {
      open: open,
      onClose: onClose,
      title: "Registrar micci\xF3n"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 20
      }
    }, /*#__PURE__*/React.createElement(TimePicker, {
      label: "Hora",
      value: time,
      onChange: e => setTime(e.target.value)
    })), /*#__PURE__*/React.createElement(UrinationLog, {
      value: val,
      onChange: setVal
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'sticky',
        bottom: 0,
        background: 'var(--color-surface)',
        paddingTop: 16,
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      fullWidth: true,
      leadingIcon: Ic('check'),
      onClick: () => onSave({
        kind: 'urine',
        time,
        ...val
      })
    }, "Guardar registro")));
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/fluxia-app/logflows.jsx", error: String((e && e.message) || e) }); }

// ui_kits/fluxia-app/screens-account.jsx
try { (() => {
/* global React */
/*__IIFE__*/(function () {
  const FX = window.FX = window.FX || {};
  const NS = window.FluxiaHealthDesignSystem_0efbb0;
  const Ic = (n, props = {}) => React.createElement('i', {
    'data-lucide': n,
    ...props
  });
  function Scroll({
    children
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '0 20px 120px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18
      }
    }, children);
  }

  /* ---------------- Onboarding / Welcome ---------------- */
  FX.Onboarding = function Onboarding({
    go
  }) {
    const {
      Button,
      ProgressBar
    } = NS;
    React.useEffect(() => {
      window.lucide && window.lucide.createIcons();
    });
    return /*#__PURE__*/React.createElement("div", {
      style: {
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--gradient-page)',
        backgroundColor: 'var(--color-bg)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 28px 24px'
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/logo/fluxia-mark.svg",
      alt: "Fluxia",
      style: {
        height: 96,
        marginBottom: 28
      }
    }), /*#__PURE__*/React.createElement("h1", {
      style: {
        fontSize: 'var(--text-h1)',
        fontWeight: 600,
        letterSpacing: '-0.02em',
        marginBottom: 14
      }
    }, "Tu salud digestiva, clara y privada"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 'var(--text-body-lg)',
        color: 'var(--text-secondary)',
        lineHeight: 1.55,
        maxWidth: 320
      }
    }, "Registra deposiciones y micciones en segundos. Entiende tus patrones y comp\xE1rtelos con tu m\xE9dico cuando quieras.")), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '0 24px 36px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '0 40px 8px'
      }
    }, /*#__PURE__*/React.createElement(ProgressBar, {
      steps: 3,
      currentStep: 1
    })), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      fullWidth: true,
      trailingIcon: Ic('arrow-right'),
      onClick: () => go('home')
    }, "Empezar"), /*#__PURE__*/React.createElement(Button, {
      variant: "quiet",
      fullWidth: true,
      onClick: () => go('home')
    }, "Ya tengo cuenta")));
  };

  /* ---------------- Profile ---------------- */
  FX.Profile = function Profile({
    go
  }) {
    const {
      TopBar,
      Card,
      MetricCard,
      ProfessionalReviewCard,
      Badge
    } = NS;
    React.useEffect(() => {
      window.lucide && window.lucide.createIcons();
    });
    const Row = ({
      icon,
      label,
      onClick,
      value
    }) => /*#__PURE__*/React.createElement("button", {
      onClick: onClick,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '15px 4px',
        borderBottom: '1px solid var(--border-soft)',
        fontFamily: 'var(--font-sans)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 40,
        height: 40,
        borderRadius: 'var(--radius-md)',
        background: 'var(--ink-100)',
        color: 'var(--ink-600)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none'
      }
    }, icon), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        textAlign: 'left',
        fontSize: 'var(--text-body-lg)',
        color: 'var(--text-primary)',
        fontWeight: 500
      }
    }, label), value && /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-tertiary)',
        fontSize: 'var(--text-label)'
      }
    }, value), Ic('chevron-right', {
      style: {
        color: 'var(--text-tertiary)'
      }
    }));
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(TopBar, {
      glass: true,
      title: "Perfil"
    }), /*#__PURE__*/React.createElement(Scroll, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '4px 4px 8px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: 'var(--gradient-flow)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
        fontWeight: 600
      }
    }, "M"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--text-h3)',
        fontWeight: 600
      }
    }, "Mar\xEDa Garc\xEDa"), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 6
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: "accent"
    }, "Seguimiento digestivo")))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement(MetricCard, {
      label: "Registros totales",
      value: "248",
      icon: Ic('clipboard-list'),
      iconTone: "primary"
    }), /*#__PURE__*/React.createElement(MetricCard, {
      label: "Racha",
      value: "12",
      unit: "d\xEDas",
      icon: Ic('flame'),
      iconTone: "warning"
    })), /*#__PURE__*/React.createElement(Card, {
      padding: "none",
      style: {
        padding: '4px 16px'
      }
    }, /*#__PURE__*/React.createElement(Row, {
      icon: Ic('heart-pulse'),
      label: "Datos m\xE9dicos"
    }), /*#__PURE__*/React.createElement(Row, {
      icon: Ic('users'),
      label: "Profesionales",
      value: "1"
    }), /*#__PURE__*/React.createElement(Row, {
      icon: Ic('share'),
      label: "Compartir informe",
      onClick: () => go('export')
    }), /*#__PURE__*/React.createElement(Row, {
      icon: Ic('settings'),
      label: "Ajustes",
      onClick: () => go('settings')
    })), /*#__PURE__*/React.createElement(ProfessionalReviewCard, {
      name: "Dra. Elena Ruiz",
      role: "Gastroenterolog\xEDa",
      initials: "ER",
      status: "reviewed",
      note: "Patr\xF3n estable esta semana. Mant\xE9n la hidrataci\xF3n y registra cualquier episodio con sangre.",
      date: "Revisado hace 2 d\xEDas"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => go('onboarding'),
      style: devBtn
    }, "Ver onboarding"), /*#__PURE__*/React.createElement("button", {
      onClick: () => go('empty'),
      style: devBtn
    }, "Ver estado vac\xEDo"))));
  };
  const devBtn = {
    flex: 1,
    background: 'var(--ink-100)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-sans)',
    fontSize: 12,
    padding: '10px',
    cursor: 'pointer'
  };

  /* ---------------- Settings ---------------- */
  FX.Settings = function Settings({
    go
  }) {
    const {
      TopBar,
      Card,
      Switch,
      Select
    } = NS;
    React.useEffect(() => {
      window.lucide && window.lucide.createIcons();
    });
    const Group = ({
      title,
      children
    }) => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '.04em',
        textTransform: 'uppercase',
        color: 'var(--text-tertiary)',
        margin: '4px 4px 10px'
      }
    }, title), /*#__PURE__*/React.createElement(Card, {
      padding: "none",
      style: {
        padding: '6px 16px'
      }
    }, children));
    const SwitchRow = ({
      label,
      desc,
      defaultChecked
    }) => /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        padding: '14px 0',
        borderBottom: '1px solid var(--border-soft)'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--text-body-lg)',
        color: 'var(--text-primary)'
      }
    }, label), desc && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--text-caption)',
        color: 'var(--text-tertiary)',
        marginTop: 2
      }
    }, desc)), /*#__PURE__*/React.createElement(Switch, {
      defaultChecked: defaultChecked
    }));
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(TopBar, {
      onBack: () => go('profile'),
      title: "Ajustes",
      align: "center"
    }), /*#__PURE__*/React.createElement(Scroll, null, /*#__PURE__*/React.createElement(Group, {
      title: "Recordatorios"
    }, /*#__PURE__*/React.createElement(SwitchRow, {
      label: "Recordatorios diarios",
      desc: "Un aviso suave para registrar",
      defaultChecked: true
    }), /*#__PURE__*/React.createElement(SwitchRow, {
      label: "Recordar hidrataci\xF3n"
    })), /*#__PURE__*/React.createElement(Group, {
      title: "Privacidad"
    }, /*#__PURE__*/React.createElement(SwitchRow, {
      label: "Bloqueo con huella",
      desc: "Protege tus registros",
      defaultChecked: true
    }), /*#__PURE__*/React.createElement(SwitchRow, {
      label: "Modo profesional",
      desc: "Vistas cl\xEDnicas y export"
    })), /*#__PURE__*/React.createElement(Group, {
      title: "Preferencias"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '14px 0'
      }
    }, /*#__PURE__*/React.createElement(Select, {
      label: "Idioma",
      options: ['Español', 'Català', 'English'],
      defaultValue: "Espa\xF1ol"
    })))));
  };

  /* ---------------- Export report ---------------- */
  FX.Export = function Export({
    go
  }) {
    const {
      TopBar,
      Card,
      Select,
      Checkbox,
      ExportReportButton,
      DailySummaryCard,
      AlertBanner
    } = NS;
    React.useEffect(() => {
      window.lucide && window.lucide.createIcons();
    });
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(TopBar, {
      onBack: () => go('weekly'),
      title: "Compartir informe",
      align: "center"
    }), /*#__PURE__*/React.createElement(Scroll, null, /*#__PURE__*/React.createElement(AlertBanner, {
      tone: "info",
      title: "Para tu m\xE9dico"
    }, "El informe resume tus registros en un PDF claro y f\xE1cil de leer."), /*#__PURE__*/React.createElement(Card, {
      title: "Periodo"
    }, /*#__PURE__*/React.createElement(Select, {
      options: ['Últimos 7 días', 'Últimas 4 semanas', 'Últimos 3 meses'],
      defaultValue: "\xDAltimas 4 semanas"
    })), /*#__PURE__*/React.createElement(Card, {
      title: "Qu\xE9 incluir"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        marginTop: 4
      }
    }, /*#__PURE__*/React.createElement(Checkbox, {
      label: "Resumen de deposiciones y micciones",
      defaultChecked: true
    }), /*#__PURE__*/React.createElement(Checkbox, {
      label: "S\xEDntomas y notas",
      defaultChecked: true
    }), /*#__PURE__*/React.createElement(Checkbox, {
      label: "Episodios con sangre o moco",
      defaultChecked: true
    }), /*#__PURE__*/React.createElement(Checkbox, {
      label: "Medicaci\xF3n registrada"
    }))), /*#__PURE__*/React.createElement(DailySummaryCard, {
      title: "Vista previa",
      date: "\xDAltimas 4 semanas",
      stats: [{
        icon: Ic('circle'),
        value: '47',
        label: 'Deposiciones'
      }, {
        icon: Ic('droplets'),
        value: '132',
        label: 'Micciones'
      }, {
        icon: Ic('triangle-alert'),
        value: '2',
        label: 'A revisar'
      }]
    }), /*#__PURE__*/React.createElement(ExportReportButton, {
      title: "Generar y compartir",
      subtitle: "PDF \xB7 \xFAltimas 4 semanas"
    })));
  };
  window.lucide && window.lucide.createIcons();
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/fluxia-app/screens-account.jsx", error: String((e && e.message) || e) }); }

// ui_kits/fluxia-app/screens-main.jsx
try { (() => {
/* global React */
/*__IIFE__*/(function () {
  const FX = window.FX = window.FX || {};
  const NS = window.FluxiaHealthDesignSystem_0efbb0;
  const Ic = (n, props = {}) => React.createElement('i', {
    'data-lucide': n,
    ...props
  });
  const week = [{
    date: '9',
    dow: 'Vie',
    day: 9,
    count: 2
  }, {
    date: '10',
    dow: 'Sáb',
    day: 10,
    count: 1
  }, {
    date: '11',
    dow: 'Dom',
    day: 11,
    count: 0
  }, {
    date: '12',
    dow: 'Lun',
    day: 12,
    count: 3
  }, {
    date: '13',
    dow: 'Mar',
    day: 13,
    count: 2,
    today: true
  }, {
    date: '14',
    dow: 'Mié',
    day: 14,
    count: 0
  }, {
    date: '15',
    dow: 'Jue',
    day: 15,
    count: 0
  }];
  function Scroll({
    children,
    pad = true
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: pad ? '0 20px 120px' : '0 0 120px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18
      }
    }, children);
  }
  function SectionTitle({
    children,
    action
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: -6
      }
    }, /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: 'var(--text-h3)',
        fontWeight: 600,
        letterSpacing: '-0.01em'
      }
    }, children), action);
  }
  const Link = ({
    children,
    onClick
  }) => /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      background: 'none',
      border: 'none',
      color: 'var(--color-primary)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-label)',
      fontWeight: 600,
      cursor: 'pointer',
      padding: 4
    }
  }, children);

  /* ---------------- Home ---------------- */
  FX.Home = function Home({
    openLog,
    go
  }) {
    const {
      TopBar,
      IconButton,
      DailySummaryCard,
      QuickLogCard,
      CalendarStrip,
      TimelineItem,
      Card,
      ClinicalAlertCard,
      Button
    } = NS;
    const [day, setDay] = React.useState('13');
    React.useEffect(() => {
      window.lucide && window.lucide.createIcons();
    });
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(TopBar, {
      glass: true,
      leading: /*#__PURE__*/React.createElement("img", {
        src: "../../assets/logo/fluxia-mark.svg",
        alt: "",
        style: {
          height: 30,
          marginLeft: 8,
          marginRight: 2
        }
      }),
      title: "Hola, Mar\xEDa",
      subtitle: "Martes, 13 de junio",
      actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(IconButton, {
        size: "sm",
        icon: Ic('bell'),
        label: "Avisos"
      }), /*#__PURE__*/React.createElement(IconButton, {
        size: "sm",
        icon: Ic('settings'),
        label: "Ajustes",
        onClick: () => go('settings')
      }))
    }), /*#__PURE__*/React.createElement(Scroll, null, /*#__PURE__*/React.createElement(DailySummaryCard, {
      date: "Hoy",
      stats: [{
        icon: Ic('circle'),
        value: '2',
        label: 'Deposiciones'
      }, {
        icon: Ic('droplets'),
        value: '5',
        label: 'Micciones'
      }, {
        icon: Ic('cup-soda'),
        value: '1,4',
        unit: 'L',
        label: 'Líquidos'
      }]
    }), /*#__PURE__*/React.createElement(SectionTitle, null, "Registro r\xE1pido"), /*#__PURE__*/React.createElement(QuickLogCard, {
      kind: "bowel",
      icon: Ic('circle'),
      title: "Registrar deposici\xF3n",
      subtitle: "En menos de 20 segundos",
      onClick: () => openLog('bowel')
    }), /*#__PURE__*/React.createElement(QuickLogCard, {
      kind: "urine",
      icon: Ic('droplets'),
      title: "Registrar micci\xF3n",
      onClick: () => openLog('urine')
    }), /*#__PURE__*/React.createElement(SectionTitle, {
      action: /*#__PURE__*/React.createElement(Link, {
        onClick: () => go('timeline')
      }, "Ver todo")
    }, "Hoy"), /*#__PURE__*/React.createElement(Card, {
      padding: "none",
      style: {
        overflow: 'hidden',
        padding: 16
      }
    }, /*#__PURE__*/React.createElement(TimelineItem, {
      time: "11:24",
      kind: "bowel",
      icon: Ic('circle'),
      title: "Deposici\xF3n",
      meta: "Tipo 4 \xB7 sin dolor",
      tags: ['Normal']
    }), /*#__PURE__*/React.createElement(TimelineItem, {
      time: "09:10",
      kind: "urine",
      icon: Ic('droplets'),
      title: "Micci\xF3n",
      meta: "Color normal",
      last: true
    })), /*#__PURE__*/React.createElement(ClinicalAlertCard, {
      severity: "info",
      title: "Vas muy bien esta semana",
      message: "Tus registros son constantes. Sigue as\xED para darle a tu m\xE9dico una imagen clara.",
      actions: /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        variant: "ghost",
        onClick: () => go('trends')
      }, "Ver tendencias")
    })));
  };

  /* ---------------- Empty (first-time) ---------------- */
  FX.EmptyHome = function EmptyHome({
    openLog
  }) {
    const {
      TopBar,
      EmptyState,
      Button
    } = NS;
    React.useEffect(() => {
      window.lucide && window.lucide.createIcons();
    });
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(TopBar, {
      glass: true,
      leading: /*#__PURE__*/React.createElement("img", {
        src: "../../assets/logo/fluxia-mark.svg",
        alt: "",
        style: {
          height: 30,
          marginLeft: 8
        }
      }),
      title: "Inicio"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '40px 24px'
      }
    }, /*#__PURE__*/React.createElement(EmptyState, {
      icon: Ic('clipboard-list'),
      title: "No hay registros todav\xEDa",
      message: "Empieza con tu primer registro. Es r\xE1pido, privado y te ayudar\xE1 a entender tu salud.",
      action: /*#__PURE__*/React.createElement(Button, {
        variant: "primary",
        size: "lg",
        leadingIcon: Ic('plus'),
        onClick: () => openLog('bowel')
      }, "Crear primer registro")
    })));
  };

  /* ---------------- Timeline ---------------- */
  FX.Timeline = function Timeline() {
    const {
      TopBar,
      CalendarStrip,
      TimelineItem,
      Card
    } = NS;
    const [day, setDay] = React.useState('13');
    React.useEffect(() => {
      window.lucide && window.lucide.createIcons();
    });
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(TopBar, {
      glass: true,
      title: "Historial",
      subtitle: "Tus registros"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '4px 20px 0'
      }
    }, /*#__PURE__*/React.createElement(CalendarStrip, {
      days: week,
      value: day,
      onChange: setDay
    })), /*#__PURE__*/React.createElement(Scroll, null, /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: 'var(--text-title)',
        fontWeight: 600,
        marginBottom: 14
      }
    }, "Martes, 13 de junio"), /*#__PURE__*/React.createElement(Card, {
      padding: "none",
      style: {
        padding: 16
      }
    }, /*#__PURE__*/React.createElement(TimelineItem, {
      time: "11:24",
      kind: "bowel",
      icon: Ic('circle'),
      title: "Deposici\xF3n",
      meta: "Tipo 4 \xB7 sin dolor \xB7 sin urgencia",
      tags: ['Normal', 'Sin sangre']
    }), /*#__PURE__*/React.createElement(TimelineItem, {
      time: "09:10",
      kind: "urine",
      icon: Ic('droplets'),
      title: "Micci\xF3n",
      meta: "Color normal \xB7 sin molestias"
    }), /*#__PURE__*/React.createElement(TimelineItem, {
      time: "08:30",
      kind: "bowel",
      icon: Ic('triangle-alert'),
      title: "Deposici\xF3n",
      meta: "Tipo 6 \xB7 con sangre \xB7 urgencia alta",
      tags: ['Revisar'],
      last: true
    })))));
  };

  /* ---------------- Weekly summary ---------------- */
  FX.Weekly = function Weekly({
    go
  }) {
    const {
      TopBar,
      SegmentedControl,
      WeeklyTrendCard,
      MetricCard,
      ExportReportButton
    } = NS;
    const [range, setRange] = React.useState('semana');
    React.useEffect(() => {
      window.lucide && window.lucide.createIcons();
    });
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(TopBar, {
      glass: true,
      title: "Resumen semanal",
      subtitle: "9 \u2013 15 de junio"
    }), /*#__PURE__*/React.createElement(Scroll, null, /*#__PURE__*/React.createElement(SegmentedControl, {
      value: range,
      onChange: setRange,
      fullWidth: true,
      options: [{
        value: 'dia',
        label: 'Día'
      }, {
        value: 'semana',
        label: 'Semana'
      }, {
        value: 'mes',
        label: 'Mes'
      }]
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement(MetricCard, {
      label: "Deposiciones",
      value: "11",
      icon: Ic('circle'),
      iconTone: "secondary",
      trend: "up",
      trendLabel: "+2"
    }), /*#__PURE__*/React.createElement(MetricCard, {
      label: "Micciones",
      value: "34",
      icon: Ic('droplets'),
      iconTone: "accent",
      trend: "flat",
      trendLabel: "Estable"
    })), /*#__PURE__*/React.createElement(WeeklyTrendCard, {
      title: "Deposiciones por d\xEDa",
      subtitle: "Esta semana",
      tone: "green",
      delta: "up",
      deltaLabel: "+2",
      data: [{
        day: 'L',
        value: 1
      }, {
        day: 'M',
        value: 2
      }, {
        day: 'X',
        value: 0
      }, {
        day: 'J',
        value: 3
      }, {
        day: 'V',
        value: 2
      }, {
        day: 'S',
        value: 1
      }, {
        day: 'D',
        value: 2
      }]
    }), /*#__PURE__*/React.createElement(WeeklyTrendCard, {
      title: "L\xEDquidos por d\xEDa",
      subtitle: "Litros",
      delta: "up",
      deltaLabel: "+0,3 L",
      data: [{
        day: 'L',
        value: 1
      }, {
        day: 'M',
        value: 1
      }, {
        day: 'X',
        value: 2
      }, {
        day: 'J',
        value: 1
      }, {
        day: 'V',
        value: 2
      }, {
        day: 'S',
        value: 1
      }, {
        day: 'D',
        value: 1
      }],
      showValues: false
    }), /*#__PURE__*/React.createElement(ExportReportButton, {
      onClick: () => go('export')
    })));
  };

  /* ---------------- Trends / insights ---------------- */
  FX.Trends = function Trends() {
    const {
      TopBar,
      WeeklyTrendCard,
      ClinicalAlertCard,
      MetricCard,
      Card,
      Button,
      Badge
    } = NS;
    React.useEffect(() => {
      window.lucide && window.lucide.createIcons();
    });
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(TopBar, {
      glass: true,
      title: "Tendencias",
      subtitle: "\xDAltimas 4 semanas"
    }), /*#__PURE__*/React.createElement(Scroll, null, /*#__PURE__*/React.createElement(ClinicalAlertCard, {
      severity: "watch",
      title: "Has registrado sangre 2 veces esta semana",
      message: "No siempre es preocupante, pero te recomendamos comentarlo con tu m\xE9dico en la pr\xF3xima visita.",
      actions: /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        variant: "ghost"
      }, "Saber m\xE1s")
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement(MetricCard, {
      label: "Regularidad",
      value: "Buena",
      icon: Ic('activity'),
      iconTone: "secondary"
    }), /*#__PURE__*/React.createElement(MetricCard, {
      label: "Tipo m\xE1s com\xFAn",
      value: "4",
      icon: Ic('circle'),
      iconTone: "primary",
      trend: "flat",
      trendLabel: "Ideal"
    })), /*#__PURE__*/React.createElement(WeeklyTrendCard, {
      title: "Regularidad",
      subtitle: "Deposiciones por semana",
      delta: "up",
      deltaLabel: "Mejorando",
      data: [{
        day: 'S1',
        value: 6
      }, {
        day: 'S2',
        value: 8
      }, {
        day: 'S3',
        value: 7
      }, {
        day: 'S4',
        value: 11
      }]
    }), /*#__PURE__*/React.createElement(Card, {
      title: "Observaci\xF3n",
      subtitle: "Generado a partir de tus registros"
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 'var(--text-body)',
        color: 'var(--text-secondary)',
        lineHeight: 1.55,
        margin: 0
      }
    }, "Tu patr\xF3n es m\xE1s regular los d\xEDas que registras m\xE1s l\xEDquidos. Mantener la hidrataci\xF3n parece ayudarte."))));
  };
  window.lucide && window.lucide.createIcons();
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/fluxia-app/screens-main.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.CalendarStrip = __ds_scope.CalendarStrip;

__ds_ns.MedicalNoteCard = __ds_scope.MedicalNoteCard;

__ds_ns.MetricCard = __ds_scope.MetricCard;

__ds_ns.TimelineItem = __ds_scope.TimelineItem;

__ds_ns.AlertBanner = __ds_scope.AlertBanner;

__ds_ns.BottomSheet = __ds_scope.BottomSheet;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.Spinner = __ds_scope.Spinner;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.LoadingBlock = __ds_scope.LoadingBlock;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.DatePicker = __ds_scope.DatePicker;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.RadioCard = __ds_scope.RadioCard;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Slider = __ds_scope.Slider;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.TimePicker = __ds_scope.TimePicker;

__ds_ns.BloodMucusSelector = __ds_scope.BloodMucusSelector;

__ds_ns.BowelLog = __ds_scope.BowelLog;

__ds_ns.BristolScaleSelector = __ds_scope.BristolScaleSelector;

__ds_ns.ClinicalAlertCard = __ds_scope.ClinicalAlertCard;

__ds_ns.DailySummaryCard = __ds_scope.DailySummaryCard;

__ds_ns.ExportReportButton = __ds_scope.ExportReportButton;

__ds_ns.FluidIntakeSelector = __ds_scope.FluidIntakeSelector;

__ds_ns.MedicationField = __ds_scope.MedicationField;

__ds_ns.PainSelector = __ds_scope.PainSelector;

__ds_ns.ProfessionalReviewCard = __ds_scope.ProfessionalReviewCard;

__ds_ns.QuickLogCard = __ds_scope.QuickLogCard;

__ds_ns.SymptomTags = __ds_scope.SymptomTags;

__ds_ns.UrgencySelector = __ds_scope.UrgencySelector;

__ds_ns.UrinationLog = __ds_scope.UrinationLog;

__ds_ns.WeeklyTrendCard = __ds_scope.WeeklyTrendCard;

__ds_ns.BottomNav = __ds_scope.BottomNav;

__ds_ns.TopBar = __ds_scope.TopBar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Tag = __ds_scope.Tag;

})();
