// options.js
// Handles loading and saving extension options (icons per row, background image, custom CSS) with Monaco Editor
// require.config({ paths: { 'vs': 'monaco/vs' } });
// let monacoEditor;

function loadOptions() {
  chrome.bookmarks.getTree((tree) => {
    const folderSelect = document.getElementById('folderId');
    folderSelect.innerHTML = '';
    function addFolders(nodes, prefix = '') {
      nodes.forEach(node => {
        if (node.children) {
          const option = document.createElement('option');
          option.value = node.id;
          option.textContent = prefix + ' ' + (node.title || 'Root');
          folderSelect.appendChild(option);
          addFolders(node.children, prefix + '— ');
        }
      });
    }
    addFolders(tree);
    // After populating, load settings
    chrome.storage.local.get(null, (data) => {
      document.getElementById('iconsPerRow').value = data.iconsPerRow ?? 6;
      document.getElementById('bgUrl').value = data.bgUrl ?? '';
      document.getElementById('customCss').value = data.customCss ?? '';
      folderSelect.value = data.folderId ?? '1';
      document.getElementById('maxEntries').value = data.maxEntries ?? 100;
    });
  });
}

function saveOptions() {
  const iconsPerRow = parseInt(document.getElementById('iconsPerRow').value) || 6;
  const bgUrl = document.getElementById('bgUrl').value;
  const customCss = document.getElementById('customCss').value;
  const folderId = document.getElementById('folderId').value;
  const maxEntries = parseInt(document.getElementById('maxEntries').value) || 100;
  chrome.storage.local.set({
    iconsPerRow,
    bgUrl,
    folderId,
    customCss,
    maxEntries
  }, () => {
    // Show a small test pop under the button
    let pop = document.getElementById('savePop');
    if (!pop) {
      pop = document.createElement('span');
      pop.id = 'savePop';
      pop.textContent = '✔ Saved!';
      pop.style.marginLeft = '12px';
      pop.style.color = '#4caf50';
      const btn = document.getElementById('saveOptions');
      btn.parentNode.insertBefore(pop, btn.nextSibling);
    }
    pop.style.display = 'inline';
    setTimeout(() => { pop.style.display = 'none'; }, 1200);
  });
}

function exportNewTabHtml() {
  // Create a hidden iframe to load newtab.html
  const iframe = document.createElement('iframe');
  // Use the current window size to match scaling
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '-9999px';
//   console.log('Window size:', window.innerWidth, window.innerHeight);
  iframe.style.width = window.innerWidth + 'px';
  iframe.style.height = window.innerHeight + 'px';
  iframe.style.visibility = 'hidden';
  iframe.src = 'newtab.html';
  document.body.appendChild(iframe);

  iframe.onload = async function () {
    try {
      const win = iframe.contentWindow;
      const doc = iframe.contentDocument;
      // Wait for all images and fonts to load
      await new Promise(resolve => {
        if (doc.readyState === 'complete') {
          resolve();
        } else {
          doc.addEventListener('readystatechange', function onReady() {
            if (doc.readyState === 'complete') {
              doc.removeEventListener('readystatechange', onReady);
              resolve();
            }
          });
        }
      });
      // Wait for images
      const images = Array.from(doc.images);
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(res => {
          img.onload = img.onerror = res;
        });
      }));
      // Inline all stylesheets
      const styleSheets = Array.from(doc.styleSheets);
      for (const sheet of styleSheets) {
        try {
          if (sheet.href) {
            // Fetch and inline external CSS
            const resp = await fetch(sheet.href);
            const css = await resp.text();
            const style = doc.createElement('style');
            style.textContent = css;
            doc.head.appendChild(style);
          }
        } catch (e) {
          // Ignore CORS errors for chrome-extension:// URLs
        }
      }
      // Remove all <link rel="stylesheet"> tags
      Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).forEach(link => link.remove());
      // Download as HTML file
      const html = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
      const blob = new Blob([html], {type: 'text/html'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bookmarks_export.html';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        document.body.removeChild(iframe);
      }, 100);
    } catch (e) {
      alert('Export failed: ' + e);
      document.body.removeChild(iframe);
    }
  };
}

document.getElementById('saveOptions').addEventListener('click', saveOptions);
document.getElementById('exportHtml').addEventListener('click', exportNewTabHtml);

// Initial load
loadOptions();
