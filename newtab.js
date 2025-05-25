// newtab.js
// Handles loading bookmarks, rendering grid, user settings, and custom CSS

const bookmarksGrid = document.getElementById('bookmarks-grid');
const backgroundDiv = document.getElementById('background');

// Default settings
let settings = {
    iconsPerRow: 6,
    bgUrl: '',
    folderId: '1', // '1' is usually the bookmarks bar in Chrome
    customCss: '',
    maxEntries: 100
};

// Load settings from storage
function loadSettings() {
    chrome.storage.local.get(null, (data) => {
        settings = { ...settings, ...data };
        if (settings.bgUrl) backgroundDiv.style.backgroundImage = `url('${settings.bgUrl}')`;
        else backgroundDiv.style.backgroundImage = '';
        loadAndRenderBookmarks();
        loadCustomCss();
    });
}

function loadCustomCss() {
    chrome.storage.local.get(null, (data) => {
        if (data.customCss) {
            let style = document.getElementById('user-css');
            if (!style) {
                style = document.createElement('style');
                style.id = 'user-css';
                document.head.appendChild(style);
            }
            style.textContent = data.customCss;
        }
    });
}

// Load bookmarks from the chosen folder and render
function loadAndRenderBookmarks() {
    chrome.bookmarks.getChildren(settings.folderId, (nodes) => {
        // Sort by index (same as bookmark manager)
        nodes.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
        renderBookmarks(nodes);
    });
}

function getFaviconUrl(url) {
    const cacheKey = 'favicon_' + url;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        return cached;
    }
    const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(url)}`;
    // Return a fallback icon if the favicon fails to load
    // We'll use a data URL for a simple SVG globe icon as the default
    const defaultIcon =
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%23333"/><text x="16" y="22" font-size="16" text-anchor="middle" fill="%23fff">🌐</text></svg>';
    // Create a temporary image to check if the favicon loads
    const testImg = new window.Image();
    testImg.onerror = function () {
        localStorage.setItem(cacheKey, defaultIcon);
    };
    testImg.onload = function () {
        // Optionally cache successful loads (browser will cache anyway)
    };
    testImg.src = faviconUrl;
    return faviconUrl;
}

function renderBookmarks(bookmarks) {
    // Prepare in memory
    const container = document.createElement('div');
    const perRow = settings.iconsPerRow;
    const maxEntries = settings.maxEntries || 100;
    const limited = bookmarks.slice(0, maxEntries);
    for (let i = 0; i < limited.length; i += perRow) {
        const row = document.createElement('div');
        row.className = 'bookmark-row';
        const slice = limited.slice(i, i + perRow);
        slice.forEach(bm => {
            const icon = document.createElement('a');
            icon.className = 'bookmark-icon';
            // Set the title property to the bookmark/folder text (not URL)
            icon.title = bm.title || (bm.url ? '' : 'Folder');
            if (!bm.url || bm.url.startsWith('chrome://bookmarks')) {
                icon.href = '#';
                icon.title = 'Open in Bookmark Manager';
                const img = document.createElement('span');
                img.textContent = '📁';
                img.style.fontSize = '32px';
                img.style.display = 'block';
                img.style.marginBottom = '4px';
                icon.appendChild(img);
                // Open bookmark folder in a new tab
                icon.addEventListener('click', (e) => {
                    e.preventDefault();
                    chrome.tabs.create({ url: `chrome://bookmarks/?id=${bm.id}` });
                });
            } 
            else if (bm.url.startsWith('chrome://')){
                icon.href = '#';
                icon.title = 'Open in Bookmark Manager';
                const img = document.createElement('span');
                img.textContent = '[ ]';
                img.style.fontSize = '32px';
                img.style.display = 'block';
                img.style.marginBottom = '4px';
                icon.appendChild(img);
                // Open bookmark folder in a new tab
                icon.addEventListener('click', (e) => {
                    e.preventDefault();
                    chrome.tabs.create({ url: bm.url });
                });
            }
            else if (bm.url.startsWith('file:///')){
                icon.href = bm.url;
                // Open bookmarks in the current tab
                icon.target = '_self';
                icon.addEventListener('click', (e) => {
                    e.preventDefault();
                    chrome.tabs.create({ url: bm.url });
                });
                const img = document.createElement('img');
                img.src = getFaviconUrl(bm.url);
                img.alt = '';
                icon.appendChild(img);
            }
            else {
                icon.href = bm.url;
                // Open bookmarks in the current tab
                icon.target = '_self';
                const img = document.createElement('img');
                img.src = getFaviconUrl(bm.url);
                img.alt = '';
                icon.appendChild(img);

            }
            const span = document.createElement('span');
            span.textContent = bm.title || bm.url || 'Folder';
            icon.appendChild(span);
            row.appendChild(icon);
        });
        container.appendChild(row);
    }
    bookmarksGrid.innerHTML = '';
    bookmarksGrid.appendChild(container);
}

// Initial load
loadSettings();
