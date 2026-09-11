// Apply a saved preference before paint; otherwise follow the system in CSS.
try {
  var preference = localStorage.getItem('crew-theme');
  if (preference === 'light' || preference === 'dark') {
    document.documentElement.dataset.theme = preference;
  }
} catch (_) { /* Storage is optional. */ }
