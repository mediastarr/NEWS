// Tuned EMG mapping:
// - wristRotation: smooth scroll (lower sensitivity)
// - pinch: click at center (or later: gaze point)
// - doublePinch: back
// - longPinch: focus URL bar
// - triplePinch: toggle mini-player

const urlInput = document.getElementById('url-input');
const btnBack = document.getElementById('btn-back');

function getActiveIframe() {
  return window.AR_TABS?.getActiveIframe() || null;
}

function postToActiveFrame(payload) {
  const iframe = getActiveIframe();
  if (!iframe || !iframe.contentWindow) return;
  iframe.contentWindow.postMessage(payload, '*');
}

// EMG event listener (from wristband host)
window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !data.type || data.source !== 'EMG') return;

  switch (data.type) {
    case 'wristRotation':
      handleWristRotation(data.delta);
      break;
    case 'pinch':
      handlePinch();
      break;
    case 'doublePinch':
      handleDoublePinch();
      break;
    case 'longPinch':
      handleLongPinch();
      break;
    case 'triplePinch':
      handleTriplePinch();
      break;
  }
});

function handleWristRotation(delta) {
  // delta is typically small; keep it smooth
  const factor = 25; // tune this per your wristband feel
  postToActiveFrame({
    source: 'AR_BROWSER',
    type: 'scroll',
    deltaY: delta * factor
  });
}

function handlePinch() {
  // Center click for now; later you can map to gaze or last pointer
  postToActiveFrame({
    source: 'AR_BROWSER',
    type: 'click',
    x: 0.5,
    y: 0.5
  });
}

function handleDoublePinch() {
  btnBack.click();
}

function handleLongPinch() {
  urlInput.focus();
}

function handleTriplePinch() {
  // Toggle mini-player
  if (miniPlayer.classList.contains('hidden')) {
    // If PAGE_VIDEO already sent something, mini-player will open automatically.
    // As a fallback, you could open a demo video here.
    // Example fallback:
    // window.AR_MINI_PLAYER.open({
    //   src: 'https://your-cdn.com/sample.mp4',
    //   title: 'EMG Mini Player'
    // });
  } else {
    window.AR_MINI_PLAYER.close();
  }
}
