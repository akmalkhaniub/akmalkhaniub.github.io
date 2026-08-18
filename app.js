// Home page behavior: scroll spy + dynamic featured article
document.addEventListener('DOMContentLoaded', () => {
  // Scroll Spy: Highlight active nav link on scroll
  const navLinks = document.querySelectorAll('.nav-link, .nav-btn');
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

  // Dynamic Featured Article: always show the most recent post
  const featured = document.getElementById('featured-article');
  if (featured) {
    fetch('blog/posts.json')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('posts.json unavailable'))))
      .then(posts => {
        const latest = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        if (!latest) return;
        const url = `blog/${latest.slug}.html`;
        featured.querySelector('.featured-title-link').textContent = latest.title;
        featured.querySelector('.featured-title-link').href = url;
        featured.querySelector('.featured-desc').textContent = latest.description;
        featured.querySelector('.featured-readtime').innerHTML = `<i class="fa-regular fa-clock"></i> ${latest.readTime}`;
        featured.querySelector('.featured-read-btn').href = url;
      })
  // Project Category Filter Handler
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-box[data-category]');

  if (filterBtns.length > 0 && projectCards.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterVal = btn.getAttribute('data-filter');

        projectCards.forEach(card => {
          const categories = card.getAttribute('data-category') || '';
          if (filterVal === 'all' || categories.split(' ').includes(filterVal)) {
            card.classList.remove('hidden-project');
          } else {
            card.classList.add('hidden-project');
          }
        });
      });
    });
  }
});
