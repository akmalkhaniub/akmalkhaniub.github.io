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
  });
})();
