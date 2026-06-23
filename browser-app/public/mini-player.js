const miniPlayer = document.getElementById('mini-player');
const miniTitle = document.getElementById('mini-title');
const miniClose = document.getElementById('mini-close');
const miniVideo = document.getElementById('mini-video');

function openMiniPlayer({ src, title }) {
  if (!src) return;
  miniVideo.src = src;
  miniTitle.textContent = title || 'Mini Player';
  miniPlayer.classList.remove('hidden');
  miniVideo.play().catch(() => {});
}

function closeMiniPlayer() {
  miniVideo.pause();
  miniVideo.src = '';
  miniPlayer.classList.add('hidden');
}

miniClose.addEventListener('click', closeMiniPlayer);

// Listen for video info from proxied pages
window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.source !== 'PAGE_VIDEO') return;

  if (data.type === 'mainVideo') {
    openMiniPlayer({
      src: data.src,
      title: data.title
    });
  }
});

// Expose globally
window.AR_MINI_PLAYER = {
  open: openMiniPlayer,
  close: closeMiniPlayer
};
