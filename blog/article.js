// Article page behavior: progress bar, copy buttons, mermaid, zoom, share
(function () {
  // Scroll progress bar
  window.addEventListener('scroll', () => {
    const bar = document.getElementById('progress-bar');
    if (!bar) return;
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    bar.style.width = (height > 0 ? (winScroll / height) * 100 : 0) + '%';
  });

  document.addEventListener('DOMContentLoaded', () => {
    // Copy-link share button
    const copyLinkBtn = document.getElementById('share-link-btn');
    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          copyLinkBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
          setTimeout(() => {
            copyLinkBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy Link';
          }, 2000);
        } catch (err) {
          console.error('Failed to copy link:', err);
        }
      });
    }

    // Copy buttons on code blocks
    document.querySelectorAll('.article-body pre').forEach(pre => {
      const code = pre.querySelector('code');
      if (!code) return;
      const btn = document.createElement('button');
      btn.className = 'copy-code-btn';
      btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(code.innerText);
          btn.classList.add('copied');
          btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
          setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
          }, 2000);
        } catch (err) {
          console.error('Failed to copy code:', err);
        }
      });
      pre.appendChild(btn);
    });

    // Render mermaid diagrams, then enable zoom on them
    const zoomModal = document.getElementById('zoom-modal');
    const zoomContent = document.getElementById('zoom-content');
    const openZoom = (html) => {
      if (!zoomModal || !zoomContent) return;
      zoomContent.innerHTML = html;
      zoomModal.style.display = 'flex';
    };
    if (zoomModal) {
      zoomModal.addEventListener('click', () => {
        zoomModal.style.display = 'none';
        zoomContent.innerHTML = '';
      });
    }

    if (window.mermaid && document.querySelector('.mermaid')) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        securityLevel: 'strict',
        flowchart: { useMaxWidth: false, htmlLabels: true }
      });
      mermaid.run({ querySelector: '.mermaid' }).then(() => {
        document.querySelectorAll('.mermaid').forEach(block => {
          block.addEventListener('click', () => openZoom(block.innerHTML));
        });
      }).catch(err => console.error('Mermaid render error:', err));
    }

    // Zoom on article images
    document.querySelectorAll('.article-body img').forEach(img => {
      img.addEventListener('click', () => {
        openZoom(`<img src="${img.src}" alt="${img.alt || ''}" style="max-width:100%; height:auto;">`);
      });
    });

    // Active Table of Contents (TOC) Highlighting
    const tocLinks = document.querySelectorAll('.toc-link');
    const headings = Array.from(document.querySelectorAll('.article-body h2[id]'));

    if (tocLinks.length > 0 && headings.length > 0) {
      const linkMap = new Map();
      tocLinks.forEach(link => {
        const targetId = link.getAttribute('href').replace(/^#/, '');
        linkMap.set(targetId, link);
      });

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            tocLinks.forEach(l => l.classList.remove('active'));
            const activeLink = linkMap.get(entry.target.id);
            if (activeLink) {
              activeLink.classList.add('active');
            }
          }
        });
      }, {
        rootMargin: '-80px 0px -65% 0px',
        threshold: 0
      });

      headings.forEach(h => observer.observe(h));
    }

    // Scholarly Citations Tooltip Popup & Backlink Navigation
    let lastCitationSource = null;
    const tooltip = document.createElement('div');
    tooltip.className = 'citation-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    document.body.appendChild(tooltip);

    document.querySelectorAll('.citation-link').forEach(link => {
      const refId = link.getAttribute('data-ref');
      const targetItem = document.getElementById(`ref-${refId}`);
      if (!targetItem) return;

      // Show citation hovercard
      link.addEventListener('mouseenter', () => {
        const clone = targetItem.cloneNode(true);
        const backLink = clone.querySelector('.citation-backlink');
        if (backLink) backLink.remove();

        tooltip.innerHTML = `<strong>[${refId}]</strong> ${clone.innerHTML.trim()}`;
        tooltip.classList.add('visible');

        const rect = link.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        let top = rect.top - tooltipRect.height - 10;
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

        if (top < 10) {
          top = rect.bottom + 10;
        }
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
          left = window.innerWidth - tooltipRect.width - 10;
        }

        tooltip.style.top = `${top + window.scrollY}px`;
        tooltip.style.left = `${left + window.scrollX}px`;
      });

      link.addEventListener('mouseleave', () => {
        tooltip.classList.remove('visible');
      });

      link.addEventListener('click', () => {
        lastCitationSource = link;
      });
    });

    // Backlink return to prose
    document.querySelectorAll('.citation-backlink').forEach(backlink => {
      backlink.addEventListener('click', (e) => {
        if (lastCitationSource) {
          e.preventDefault();
          lastCitationSource.scrollIntoView({ behavior: 'smooth', block: 'center' });
          lastCitationSource.classList.add('citation-highlight');
          setTimeout(() => lastCitationSource.classList.remove('citation-highlight'), 1800);
        }
      });
    });
  });
})();

