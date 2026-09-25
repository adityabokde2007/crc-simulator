export function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-4 right-4 flex flex-col gap-2 z-50';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  
  // Base classes for a clean black-and-white look
  let bgClass = 'bg-surface';
  let borderClass = 'border-text-primary border-2';
  let textClass = 'text-text-primary';
  let iconHtml = '';

  if (type === 'success') {
    iconHtml = `<svg class="w-6 h-6 shrink-0" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>`;
  } else if (type === 'error') {
    iconHtml = `<svg class="w-6 h-6 shrink-0" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>`;
  } else if (type === 'warning') {
    iconHtml = `<svg class="w-6 h-6 shrink-0" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
  } else {
    // info
    iconHtml = `<svg class="w-6 h-6 shrink-0" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }

  toast.className = `flex items-center gap-4 px-6 py-4 rounded-md shadow-lg ${bgClass} ${borderClass} ${textClass} animate-toast-in`;
  toast.innerHTML = `
    ${iconHtml}
    <span class="text-base font-semibold">${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.replace('animate-toast-in', 'animate-toast-out');
    toast.addEventListener('animationend', () => {
      if (toastContainer.contains(toast)) {
        toastContainer.removeChild(toast);
      }
    });
  }, 3000);
}
