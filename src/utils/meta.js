export function setPageMeta({ title, description }) {
  try {
    if (title) document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    if (description) meta.setAttribute('content', description);
  } catch (_) {
    // ignore in non-DOM environments (tests)
  }
}
