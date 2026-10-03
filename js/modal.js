
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
