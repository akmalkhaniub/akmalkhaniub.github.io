// Shared site behavior: theme toggle + mobile navigation
(function () {
  function init() {
    // Theme Toggle (Dark / Light Mode)
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      const icon = themeToggle.querySelector('i');
      const syncIcon = () => {
        const theme = document.documentElement.getAttribute('data-theme') || 'light';
        icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
      };
      syncIcon();
      themeToggle.addEventListener('click', () => {
        const next = (document.documentElement.getAttribute('data-theme') === 'light') ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) { /* private mode */ }
        syncIcon();
      });
    }

    // Mobile Navigation Toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.querySelector('nav');
    if (mobileToggle && navMenu) {
      const navIcon = mobileToggle.querySelector('i');
      mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navIcon.className = navMenu.classList.contains('active') ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
      });
      // Close menu when a nav link is clicked
      navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          if (navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            navIcon.className = 'fa-solid fa-bars';
          }
        });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
