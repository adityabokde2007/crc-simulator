import { initVideoModal } from './modal.js';

document.addEventListener('DOMContentLoaded', () => {
  initVideoModal();
  // --- How It Works Accordion ---
  const btnToggleInfo = document.getElementById('btn-toggle-info');
  const infoContent = document.getElementById('info-content');
  const iconChevron = document.getElementById('icon-chevron');

  let isInfoOpen = false;

  if (btnToggleInfo) {
    btnToggleInfo.addEventListener('click', () => {
      isInfoOpen = !isInfoOpen;
      if (isInfoOpen) {
        infoContent.classList.remove('hidden');
        infoContent.style.maxHeight = '1000px';
        infoContent.style.opacity = '1';
        iconChevron.innerHTML = '<path d="m18 15-6-6-6 6"/>'; // Chevron up
      } else {
        infoContent.classList.add('hidden');
        infoContent.style.maxHeight = '0';
        infoContent.style.opacity = '0';
        iconChevron.innerHTML = '<path d="m6 9 6 6 6-6"/>'; // Chevron down
      }
    });
  }

});
