export function errorsToCSV(errors = []) {
  const header = "index,error";
  return [
    header,
    ...errors.map((e, i) => `${i},"${String(e).replace(/"/g, '""')}"`),
  ].join("\n");
}

export function downloadErrorsCSV(errors, filename = "validation_errors.csv") {
  if (!errors?.length) return;
  const csv = errorsToCSV(errors);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 0);
}
