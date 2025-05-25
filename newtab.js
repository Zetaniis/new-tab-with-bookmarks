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
            // Always set the title to the bookmark/folder text (not URL)
            icon.title = bm.title || (bm.url ? '' : 'Folder');
            console.log(bm);
            // Bookmark folder
            if (!bm.url || bm.url.startsWith('chrome://bookmarks')) {
                icon.href = '#';
                icon.title = bm.title || 'Open in Bookmark Manager';
                const img = document.createElement('img');
                img.src = 'bookmark_folder.svg';
                img.alt = '';
                icon.appendChild(img);
                // Open bookmark folder in a new tab
                icon.addEventListener('click', (e) => {
                    e.preventDefault();
                    chrome.tabs.create({ url: `chrome://bookmarks/?id=${bm.id}` });
                });
            }
            // chrome internals
            else if (bm.url.startsWith('chrome://')) {
                icon.href = '#';
                icon.title = bm.title || 'Chrome internal page';
                const img = document.createElement('img');
                img.src = 'internals.svg';
                img.alt = '';
                icon.appendChild(img);
                // Open chrome:// url in a new tab
                icon.addEventListener('click', (e) => {
                    e.preventDefault();
                    chrome.tabs.create({ url: bm.url });
                });
            }
            // file access
            else if (bm.url.startsWith('file:///')) {
                icon.href = bm.url;
                icon.target = '_self';
                const img = document.createElement('img');
                img.src = 'file.svg';
                img.alt = '';
                icon.appendChild(img);
                // Optionally open in new tab (remove if not wanted)
                icon.addEventListener('click', (e) => {
                    e.preventDefault();
                    chrome.tabs.create({ url: bm.url });
                });
            }
            // normal bookmarks/urls
            else {
                icon.href = bm.url;
                icon.target = '_self';
                const img = document.createElement('img');

                const cacheKey = 'favicon_' + bm.url;
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    img.src = cached;
                }
                else {
                    // Use Google's favicon service
                    img.src = `https://t3.gstatic.com/faviconV2?client=chrome&size=32&url=${encodeURIComponent(bm.url)}`;
                    img.alt = '';
                    // If favicon fails, use default_url.svg
                    img.onerror = function () {
                        img.onerror = null;
                        img.src = 'default_url.svg';
                    };
                    localStorage.setItem(cacheKey, img.src);
                }
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
