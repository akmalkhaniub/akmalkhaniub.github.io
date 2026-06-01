document.addEventListener('DOMContentLoaded', () => {
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
