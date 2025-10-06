document.getElementById('scanBtn').addEventListener('click', scanForDuplicates);
document.getElementById('deleteBtn').addEventListener('click', deleteDuplicates);
document.getElementById('cancelBtn').addEventListener('click', cancelDeletion);

let duplicatesToDelete = [];
let itemsMetadata = {}; // Store metadata about items to delete

async function scanForDuplicates() {
  const statusDiv = document.getElementById('status');
  const resultsDiv = document.getElementById('results');
  const actionsDiv = document.getElementById('actions');

  statusDiv.textContent = 'Scanning bookmarks and folders...';
  resultsDiv.innerHTML = '';
  actionsDiv.style.display = 'none';
  duplicatesToDelete = [];
  itemsMetadata = {};

  try {
    // Get all bookmarks
    const bookmarks = await chrome.bookmarks.getTree();
    const allBookmarks = [];
    const allFolders = [];

    // Flatten the bookmark tree
    function flattenBookmarks(nodes) {
      for (const node of nodes) {
        if (node.url) {
          allBookmarks.push(node);
        } else if (node.children && node.title) {
          // It's a folder (has children and title, but no URL)
          allFolders.push(node);
        }
        if (node.children) {
          flattenBookmarks(node.children);
        }
      }
    }

    flattenBookmarks(bookmarks);

    // Group bookmarks by URL
    const urlMap = new Map();
    for (const bookmark of allBookmarks) {
      if (!urlMap.has(bookmark.url)) {
        urlMap.set(bookmark.url, []);
      }
      urlMap.get(bookmark.url).push(bookmark);
    }

    // Group folders by title
    const folderMap = new Map();
    for (const folder of allFolders) {
      if (!folderMap.has(folder.title)) {
        folderMap.set(folder.title, []);
      }
      folderMap.get(folder.title).push(folder);
    }

    // Find duplicate bookmarks (URLs with more than one bookmark)
    const duplicateBookmarkGroups = [];
    for (const [url, bookmarks] of urlMap) {
      if (bookmarks.length > 1) {
        // Sort by dateAdded (newest first)
        bookmarks.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));

        // Keep the newest (first), mark the rest for deletion
        const toKeep = bookmarks[0];
        const toDelete = bookmarks.slice(1);

        duplicateBookmarkGroups.push({
          type: 'bookmark',
          identifier: url,
          keep: toKeep,
          delete: toDelete
        });
      }
    }

    // Find duplicate folders (folder names with more than one folder)
    const duplicateFolderGroups = [];
    for (const [title, folders] of folderMap) {
      if (folders.length > 1) {
        // Sort by dateAdded (newest first)
        folders.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));

        // Keep the newest (first), mark the rest for deletion
        const toKeep = folders[0];
        const toDelete = folders.slice(1);

        duplicateFolderGroups.push({
          type: 'folder',
          identifier: title,
          keep: toKeep,
          delete: toDelete
        });
      }
    }

    const allDuplicateGroups = [...duplicateBookmarkGroups, ...duplicateFolderGroups];

    if (allDuplicateGroups.length === 0) {
      statusDiv.textContent = 'No duplicates found!';
      statusDiv.className = 'status success';
      return;
    }

    // Display results
    const totalBookmarkDuplicates = duplicateBookmarkGroups.reduce((sum, group) => sum + group.delete.length, 0);
    const totalFolderDuplicates = duplicateFolderGroups.reduce((sum, group) => sum + group.delete.length, 0);
    const totalDuplicates = totalBookmarkDuplicates + totalFolderDuplicates;

    statusDiv.textContent = `Found ${totalBookmarkDuplicates} duplicate bookmark(s) and ${totalFolderDuplicates} duplicate folder(s)`;
    statusDiv.className = 'status warning';

    resultsDiv.innerHTML = '<h2>Preview of Duplicates to Delete:</h2>';

    // Display duplicate bookmarks
    if (duplicateBookmarkGroups.length > 0) {
      const bookmarkSection = document.createElement('h3');
      bookmarkSection.textContent = 'Duplicate Bookmarks:';
      resultsDiv.appendChild(bookmarkSection);

      for (const group of duplicateBookmarkGroups) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'duplicate-group';

        const urlHeader = document.createElement('div');
        urlHeader.className = 'url-header';
        urlHeader.textContent = group.identifier;
        groupDiv.appendChild(urlHeader);

        // Show which one will be kept
        const keepDiv = document.createElement('div');
        keepDiv.className = 'bookmark-item keep';
        keepDiv.innerHTML = `
          <strong>✓ KEEP (newest):</strong> ${group.keep.title || 'Untitled'}<br>
          <small>Added: ${new Date(group.keep.dateAdded).toLocaleString()}</small>
        `;
        groupDiv.appendChild(keepDiv);

        // Show which ones will be deleted
        for (const bookmark of group.delete) {
          const deleteDiv = document.createElement('div');
          deleteDiv.className = 'bookmark-item delete';
          deleteDiv.innerHTML = `
            <strong>✗ DELETE:</strong> ${bookmark.title || 'Untitled'}<br>
            <small>Added: ${new Date(bookmark.dateAdded).toLocaleString()}</small>
          `;
          groupDiv.appendChild(deleteDiv);

          duplicatesToDelete.push(bookmark.id);
          itemsMetadata[bookmark.id] = { type: 'bookmark' };
        }

        resultsDiv.appendChild(groupDiv);
      }
    }

    // Display duplicate folders
    if (duplicateFolderGroups.length > 0) {
      const folderSection = document.createElement('h3');
      folderSection.textContent = 'Duplicate Folders:';
      folderSection.style.marginTop = '20px';
      resultsDiv.appendChild(folderSection);

      for (const group of duplicateFolderGroups) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'duplicate-group';

        const folderHeader = document.createElement('div');
        folderHeader.className = 'url-header';
        folderHeader.textContent = `Folder: "${group.identifier}"`;
        groupDiv.appendChild(folderHeader);

        // Show which one will be kept
        const keepDiv = document.createElement('div');
        keepDiv.className = 'bookmark-item keep';
        const childCount = group.keep.children ? group.keep.children.length : 0;
        keepDiv.innerHTML = `
          <strong>✓ KEEP (newest):</strong> ${group.keep.title}<br>
          <small>Added: ${new Date(group.keep.dateAdded).toLocaleString()} | ${childCount} item(s)</small>
        `;
        groupDiv.appendChild(keepDiv);

        // Show which ones will be deleted
        for (const folder of group.delete) {
          const deleteDiv = document.createElement('div');
          deleteDiv.className = 'bookmark-item delete';
          const childCount = folder.children ? folder.children.length : 0;
          deleteDiv.innerHTML = `
            <strong>✗ DELETE:</strong> ${folder.title}<br>
            <small>Added: ${new Date(folder.dateAdded).toLocaleString()} | ${childCount} item(s)</small>
          `;
          groupDiv.appendChild(deleteDiv);

          duplicatesToDelete.push(folder.id);
          itemsMetadata[folder.id] = { type: 'folder' };
        }

        resultsDiv.appendChild(groupDiv);
      }
    }

    actionsDiv.style.display = 'flex';

  } catch (error) {
    statusDiv.textContent = 'Error: ' + error.message;
    statusDiv.className = 'status error';
  }
}

async function deleteDuplicates() {
  const statusDiv = document.getElementById('status');
  const actionsDiv = document.getElementById('actions');

  if (duplicatesToDelete.length === 0) {
    return;
  }

  statusDiv.textContent = `Deleting ${duplicatesToDelete.length} duplicate(s)...`;
  statusDiv.className = 'status';

  let deletedCount = 0;
  let failedCount = 0;

  try {
    for (const itemId of duplicatesToDelete) {
      try {
        const metadata = itemsMetadata[itemId];

        if (metadata && metadata.type === 'folder') {
          // Use removeTree for folders
          await chrome.bookmarks.removeTree(itemId);
        } else {
          // Use remove for bookmarks
          await chrome.bookmarks.remove(itemId);
        }
        deletedCount++;
      } catch (err) {
        console.error(`Failed to delete item ${itemId}:`, err);
        failedCount++;
      }
    }

    if (failedCount > 0) {
      statusDiv.textContent = `Deleted ${deletedCount} item(s). ${failedCount} failed (may have been already deleted).`;
      statusDiv.className = 'status warning';
    } else {
      statusDiv.textContent = `Successfully deleted ${deletedCount} duplicate item(s)!`;
      statusDiv.className = 'status success';
    }

    actionsDiv.style.display = 'none';
    document.getElementById('results').innerHTML = '';
    duplicatesToDelete = [];
    itemsMetadata = {};

  } catch (error) {
    statusDiv.textContent = 'Error deleting items: ' + error.message;
    statusDiv.className = 'status error';
  }
}

function cancelDeletion() {
  document.getElementById('results').innerHTML = '';
  document.getElementById('actions').style.display = 'none';
  document.getElementById('status').textContent = '';
  duplicatesToDelete = [];
  itemsMetadata = {};
}
