export function setupModal(modalId, closeBtnId, openBtnId = null) {
  const modal = document.getElementById(modalId);
  if (!modal) return null;
  
  const closeBtn = document.getElementById(closeBtnId);
  const openBtn = openBtnId ? document.getElementById(openBtnId) : null;
  
  const open = () => modal.classList.remove('hidden');
  const close = () => modal.classList.add('hidden');
  
  if (openBtn) {
    openBtn.addEventListener('click', open);
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', close);
  }
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      close();
    }
  });
  
  return { open, close };
}

export function initVideoModal() {
  const triggers = document.querySelectorAll('a[href="/#how-it-works"], a[href="#how-it-works"]');
  if (triggers.length === 0) return;

  const modalHTML = `
    <div id="video-modal" class="modal-overlay hidden" style="z-index: 100;">
      <div class="modal-content" style="max-width: 800px; background: transparent; box-shadow: none;">
        <div class="modal-header" style="background: var(--color-surface); border-bottom: none; border-radius: 0.5rem 0.5rem 0 0;">
          <h2 class="text-xl font-bold text-text-primary">How It Works</h2>
          <button id="btn-close-video" class="text-text-secondary hover:text-text-primary">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="modal-body" style="padding: 0; background: black; border-radius: 0 0 0.5rem 0.5rem;">
          <video id="how-to-use-video" controls class="w-full" style="max-height: 70vh; display: block;">
            <source src="/assets/how_to_use.mp4" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('video-modal');
  const closeBtn = document.getElementById('btn-close-video');
  const video = document.getElementById('how-to-use-video');

  const open = (e) => {
    e.preventDefault();
    modal.classList.remove('hidden');
    video.play().catch(e => console.error("Video play failed:", e));
  };
  
  const close = () => {
    modal.classList.add('hidden');
    video.pause();
    video.currentTime = 0;
  };

  triggers.forEach(trigger => trigger.addEventListener('click', open));
  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
}

