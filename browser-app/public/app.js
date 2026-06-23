const urlInput = document.getElementById('url-input');
const btnGo = document.getElementById('btn-go');
const btnBack = document.getElementById('btn-back');
const btnNewTab = document.getElementById('btn-new-tab');
const tabsContainer = document.getElementById('tabs-container');
const framesContainer = document.getElementById('frames-container');

let tabs = [];
let activeTabId = null;
let nextTabId = 1;

function normalizeUrl(raw) {
  if (!raw) return null;
  let url = raw.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
}

function createTab(initialUrl = 'https://example.com') {
  const id = `tab-${nextTabId++}`;

  const tabState = {
    id,
    title: 'New Tab',
    historyStack: [],
    historyIndex: -1,
    iframe: null,
    tabButton: null
  };

  // Tab button
  const btn = document.createElement('button');
  btn.className = 'tab';
  btn.textContent = tabState.title;
  btn.dataset.tabId = id;
  btn.addEventListener('click', () => setActiveTab(id));
  tabsContainer.appendChild(btn);
  tabState.tabButton = btn;

  // Iframe
  const iframe = document.createElement('iframe');
  iframe.className = 'tab-frame';
  iframe.sandbox = 'allow-scripts allow-same-origin';
  framesContainer.appendChild(iframe);
  tabState.iframe = iframe;

  tabs.push(tabState);
  setActiveTab(id);
  loadUrlForTab(id, initialUrl, true);

  return tabState;
}

function setActiveTab(id) {
  activeTabId = id;
  tabs.forEach(tab => {
    const isActive = tab.id === id;
    tab.tabButton.classList.toggle('active', isActive);
    tab.iframe.classList.toggle('active', isActive);
  });

  const tab = getActiveTab();
  if (tab) {
    const currentUrl = tab.historyStack[tab.historyIndex] || '';
    urlInput.value = currentUrl;
    updateNavButtons();
  }
}

function getActiveTab() {
  return tabs.find(t => t.id === activeTabId) || null;
}

function loadUrlForTab(tabId, rawUrl, pushHistory = true) {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return;

  const normalized = normalizeUrl(rawUrl);
  if (!normalized) return;

  const proxied = `/render?url=${encodeURIComponent(normalized)}`;
  tab.iframe.src = proxied;

  if (tabId === activeTabId) {
    urlInput.value = normalized;
  }

  if (pushHistory) {
    tab.historyStack.splice(tab.historyIndex + 1);
    tab.historyStack.push(normalized);
    tab.historyIndex = tab.historyStack.length - 1;
  }

  updateNavButtons();
}

function loadUrlFromInput() {
  const tab = getActiveTab();
  if (!tab) return;
  loadUrlForTab(tab.id, urlInput.value, true);
}

function goBack() {
  const tab = getActiveTab();
  if (!tab) return;
  if (tab.historyIndex <= 0) return;

  tab.historyIndex -= 1;
  const url = tab.historyStack[tab.historyIndex];
  loadUrlForTab(tab.id, url, false);
}

function updateNavButtons() {
  const tab = getActiveTab();
  if (!tab) {
    btnBack.disabled = true;
    return;
  }
  btnBack.disabled = tab.historyIndex <= 0;
}

btnGo.addEventListener('click', loadUrlFromInput);
urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loadUrlFromInput();
});
btnBack.addEventListener('click', goBack);

btnNewTab.addEventListener('click', () => {
  createTab('https://example.com');
});

// initial tab
createTab('https://example.com');

// Expose helper for gestures.js
window.AR_TABS = {
  getActiveIframe: () => {
    const tab = getActiveTab();
    return tab ? tab.iframe : null;
  }
};
