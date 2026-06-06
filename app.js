document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle (Dark / Light Mode)
  const themeToggle = document.getElementById('theme-toggle');
  const themeToggleIcon = themeToggle.querySelector('i');
  
  // Load saved theme or default to light
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  
  if (currentTheme === 'dark') {
    themeToggleIcon.className = 'fa-solid fa-sun';
  } else {
    themeToggleIcon.className = 'fa-solid fa-moon';
  }

  themeToggle.addEventListener('click', () => {
    let theme = 'light';
    if (document.documentElement.getAttribute('data-theme') === 'light') {
      theme = 'dark';
      themeToggleIcon.className = 'fa-solid fa-sun';
    } else {
      themeToggleIcon.className = 'fa-solid fa-moon';
    }
    
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  });

  // Mobile Navigation Toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.querySelector('nav');
  const mobileToggleIcon = mobileToggle.querySelector('i');

  mobileToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    
    // Toggle icon class
    if (navMenu.classList.contains('active')) {
      mobileToggleIcon.className = 'fa-solid fa-xmark';
    } else {
      mobileToggleIcon.className = 'fa-solid fa-bars';
    }
  });

  // Close Mobile Menu on Nav Link Click
  const navLinks = document.querySelectorAll('.nav-link, .nav-btn');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        mobileToggleIcon.className = 'fa-solid fa-bars';
      }
    });
  });

  // Scroll Spy: Highlight active nav link on scroll
  const sections = document.querySelectorAll('section');
  
  const scrollSpy = () => {
    const scrollPos = window.scrollY || document.documentElement.scrollTop;
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 150; // offset header height
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');
      
      if (sectionId && scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active-nav');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active-nav');
          }
        });
      }
    });
  };

  window.addEventListener('scroll', scrollSpy);
  scrollSpy(); // Run initially
});
