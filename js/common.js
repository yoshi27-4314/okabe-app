/* ===== OKABE GROUP 共通JavaScript ===== */

// ヘルプツールチップ
function toggleHelp(el) {
  const tooltip = el.parentElement.nextElementSibling;
  if (tooltip && tooltip.classList.contains('help-tooltip')) {
    tooltip.classList.toggle('show');
  }
}
