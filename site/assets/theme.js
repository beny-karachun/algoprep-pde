/* Apply the saved theme before the first page paint. */
(() => {
  try {
    const theme = localStorage.getItem('tp_theme');
    if (theme === 'dark' || theme === 'light') document.documentElement.dataset.theme = theme;
  } catch { /* Use the default theme if storage is not available. */ }
})();
