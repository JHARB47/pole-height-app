/**
 * importBatch.js - Single-update import application helper
 * Ensures large imports update the store in one setState call.
 */

const toArray = (value) => (Array.isArray(value) ? value : []);

export function applyImportBatch({
  getState,
  setState,
  payload,
  mode = "append",
}) {
  const state = getState();
  const poles = toArray(payload?.poles);
  const spans = toArray(payload?.spans);
  const existingLines = toArray(payload?.existingLines);

  const nextImportedPoles =
    mode === "replace" ? poles : [...toArray(state.importedPoles), ...poles];
  const nextImportedSpans =
    mode === "replace" ? spans : [...toArray(state.importedSpans), ...spans];
  const nextImportedExistingLines =
    mode === "replace"
      ? existingLines
      : [...toArray(state.importedExistingLines), ...existingLines];
  const nextExistingLines =
    mode === "replace"
      ? existingLines
      : [...toArray(state.existingLines), ...existingLines];

  const update = {
    importedPoles: nextImportedPoles,
    importedSpans: nextImportedSpans,
    importedExistingLines: nextImportedExistingLines,
    existingLines: nextExistingLines,
  };

  setState(update);
  return update;
}
