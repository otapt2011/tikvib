console.log('✅ image-blob.js loaded (using App.db helpers)');

/**
 * Unified Image Blob Utilities
 *
 * Functions:
 *   imageUrlToHex(imageUrl)
 *   hexToBlobUrl(hex, mimeType)
 *   saveBlob(type, id, imageUrl)
 *   getBlob(type, id)
 *   getImageUrl(type, id)
 *   getAllImageUrls(type, limit)
 *   loadConvertSaveAll(type, limit, onProgress)
 *   countUnsavedBlobs(type)
 *
 * type: 'avatar' | 'thumbnail'
 *
 * Uses the global App object and the existing db helpers (execSql, queryRows).
 */

// ------------------------------------------------------------------
//  Configuration
// ------------------------------------------------------------------

const CONFIG = {
  avatar: {
    sourceTable: 'profiles',
    blobTable: 'avatar_blobs',
    sourceKey: 'id',
    blobKey: 'profile_id',
    sourceUrlColumn: 'avatar',
    sourceTitleColumn: 'username',
    blobKeyType: 'number'    // for SQL quoting
  },
  thumbnail: {
    sourceTable: 'videos',
    blobTable: 'thumbnail_blobs',
    sourceKey: 'video_id',
    blobKey: 'video_id',
    sourceUrlColumn: 'thumbnail_url',
    sourceTitleColumn: 'title',
    blobKeyType: 'text'
  }
};

function getConfig(type) {
  const cfg = CONFIG[type];
  if (!cfg) throw new Error(`Invalid type: ${type}. Use 'avatar' or 'thumbnail'.`);
  return cfg;
}

// ------------------------------------------------------------------
//  Core image helpers (unchanged)
// ------------------------------------------------------------------

async function imageUrlToHex(imageUrl) {
  const response = await fetch(imageUrl, { mode: 'cors' });
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return {
    hex,
    mimeType: blob.type || 'image/jpeg'
  };
}

function hexToBlobUrl(hex, mimeType = 'image/jpeg') {
  if (!hex || typeof hex !== 'string') return null;

  let clean = hex.trim();
  if (clean.startsWith("x'") || clean.startsWith("x’")) {
    clean = clean.slice(2, -1);
  } else if (clean.startsWith('0x')) {
    clean = clean.slice(2);
  }

  if (clean.length % 2 !== 0) {
    console.warn('hexToBlobUrl: hex string has odd length');
    return null;
  }

  try {
    const bytes = new Uint8Array(
      clean.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
    );
    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error('hexToBlobUrl conversion error:', err);
    return null;
  }
}

// ------------------------------------------------------------------
//  Database helpers (thin wrappers around your existing functions)
// ------------------------------------------------------------------

function checkApp() {
  if (!window.App || !window.App.TURSO_API_URL || !window.App.TURSO_DB_NAME || !window.App.authToken) {
    throw new Error('Database connection not available. Ensure App is initialised and authenticated.');
  }
}

// ------------------------------------------------------------------
//  Public unified functions
// ------------------------------------------------------------------

async function saveBlob(type, id, imageUrl) {
  checkApp();
  const cfg = getConfig(type);
  const { blobTable, blobKey, blobKeyType } = cfg;

  const { hex, mimeType } = await imageUrlToHex(imageUrl);
  const value = blobKeyType === 'number' ? id : `'${String(id).replace(/'/g, "''")}'`;
  const sql = `INSERT OR REPLACE INTO ${blobTable} (${blobKey}, image, mime_type) VALUES (${value}, x'${hex}', '${mimeType}')`;

  // Use the existing execSql from db.js
  await execSql(sql);
}

async function getBlob(type, id) {
  checkApp();
  const cfg = getConfig(type);
  const { blobTable, blobKey, blobKeyType } = cfg;
  const value = blobKeyType === 'number' ? id : `'${String(id).replace(/'/g, "''")}'`;

  const sql = `SELECT hex(image) AS image_hex, mime_type FROM ${blobTable} WHERE ${blobKey} = ${value}`;
  const rows = await queryRows(sql);   // <-- uses db.js helper
  if (rows.length === 0) return null;

  const { image_hex, mime_type } = rows[0];
  return hexToBlobUrl(image_hex, mime_type || 'image/jpeg');
}

async function getImageUrl(type, id) {
  checkApp();
  const cfg = getConfig(type);
  const { sourceTable, sourceKey, sourceUrlColumn, blobKeyType } = cfg;
  const value = blobKeyType === 'number' ? id : `'${String(id).replace(/'/g, "''")}'`;

  const sql = `SELECT ${sourceUrlColumn} FROM ${sourceTable} WHERE ${sourceKey} = ${value} LIMIT 1`;
  const rows = await queryRows(sql);
  return rows.length > 0 ? rows[0][sourceUrlColumn] : null;
}

async function getAllImageUrls(type, limit = 200) {
  checkApp();
  const cfg = getConfig(type);
  const { sourceTable, blobTable, sourceKey, blobKey, sourceUrlColumn, sourceTitleColumn } = cfg;

  const sql = `
    SELECT s.${sourceKey} AS id, s.${sourceTitleColumn} AS title, s.${sourceUrlColumn} AS url
    FROM ${sourceTable} s
    LEFT JOIN ${blobTable} b ON b.${blobKey} = s.${sourceKey}
    WHERE s.${sourceUrlColumn} IS NOT NULL
      AND b.${blobKey} IS NULL
    ORDER BY s.${sourceKey}
    LIMIT ${limit}
  `;

  return await queryRows(sql);
}

async function loadConvertSaveAll(type, limit = 200, onProgress = null) {
  checkApp();

  if (onProgress) onProgress({ step: 'loading', current: 0, total: 1, message: `Loading unsaved ${type} URLs…` });
  const items = await getAllImageUrls(type, limit);
  const total = items.length;
  let saved = 0;

  for (let i = 0; i < total; i++) {
    const item = items[i];
    const current = i + 1;
    if (onProgress) onProgress({ step: 'converting', current, total, message: `Processing ${type} ${current} of ${total}…` });

    try {
      await saveBlob(type, item.id, item.url);
      saved++;
      if (onProgress) onProgress({ step: 'saving', current, total, message: `Saved ${type} ${current} of ${total}` });
    } catch (err) {
      console.error(`Failed to save ${type} blob for ID ${item.id}`, err);
    }
  }

  if (onProgress) onProgress({ step: 'done', current: total, total, message: `Finished – saved ${saved} / ${total} ${type} blobs.` });
  return { total, saved };
}

async function countUnsavedBlobs(type) {
  checkApp();
  const cfg = getConfig(type);
  const { sourceTable, blobTable, sourceKey, blobKey, sourceUrlColumn } = cfg;

  const sql = `
    SELECT COUNT(*) AS cnt
    FROM ${sourceTable} s
    LEFT JOIN ${blobTable} b ON b.${blobKey} = s.${sourceKey}
    WHERE s.${sourceUrlColumn} IS NOT NULL AND b.${blobKey} IS NULL
  `;
  const rows = await queryRows(sql);
  return rows[0]?.cnt || 0;
}

// ------------------------------------------------------------------
//  Global exposure (backward‑compatible aliases included)
// ------------------------------------------------------------------
window.imageUrlToHex   = imageUrlToHex;
window.hexToBlobUrl    = hexToBlobUrl;

// New unified API
window.saveBlob        = saveBlob;
window.getBlob         = getBlob;
window.getImageUrl     = getImageUrl;
window.getAllImageUrls = getAllImageUrls;
window.loadConvertSaveAll = loadConvertSaveAll;
window.countUnsavedBlobs = countUnsavedBlobs;

// Backward compatibility
window.saveAvatarBlob    = (id, url) => saveBlob('avatar', id, url);
window.getAvatarBlob     = (id)      => getBlob('avatar', id);
window.getProfileAvatarUrl = (id)    => getImageUrl('avatar', id);
window.getAllAvatarUrls   = (limit)  => getAllImageUrls('avatar', limit);
window.loadConvertSaveAllAvatars = (limit, cb) => loadConvertSaveAll('avatar', limit, cb);
window.countUnsavedAvatarBlobs    = () => countUnsavedBlobs('avatar');

window.saveThumbnailBlob  = (id, url) => saveBlob('thumbnail', id, url);
window.getThumbnailBlob   = (id)      => getBlob('thumbnail', id);
window.getThumbnailUrl    = (id)      => getImageUrl('thumbnail', id);
window.getAllThumbnailUrls = (limit)  => getAllImageUrls('thumbnail', limit);
window.loadConvertSaveAllThumbnails = (limit, cb) => loadConvertSaveAll('thumbnail', limit, cb);
window.countUnsavedThumbnailBlobs   = () => countUnsavedBlobs('thumbnail');
