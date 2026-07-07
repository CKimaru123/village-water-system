// Favicon refresh utility
(function() {
  // Force favicon refresh on page load
  function refreshFavicon() {
    var links = document.querySelectorAll('link[rel*="icon"]');
    links.forEach(function(link) {
      var href = link.href;
      link.href = href + '?v=' + Date.now();
    });
  }
  
  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refreshFavicon);
  } else {
    refreshFavicon();
  }
})();