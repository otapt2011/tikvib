// Database helper functions (Turso)

async function updateUserCount() {
  if (!App.dbUserCountEl) return;
  if (!App.authToken) {
    App.dbUserCountEl.textContent = '…';
    return;
  }
  try {
    const resp = await fetch(`${App.TURSO_API_URL}/api/${App.TURSO_DB_NAME}/query?sql=SELECT%20COUNT(*)%20AS%20cnt%20FROM%20profiles`, {
      headers: { 'x-api-key': App.authToken }
    });
    if (!resp.ok) throw new Error('Query failed');
    const rows = await resp.json();
    App.dbUserCountEl.textContent = rows[0]?.cnt || 0;
  } catch (err) {
    console.warn('Failed to fetch user count:', err.message);
    App.dbUserCountEl.textContent = '?';
  }
}

async function updateUsernameSelect() {
  if (!App.authToken) return;
  try {
    const resp = await fetch(`${App.TURSO_API_URL}/api/${App.TURSO_DB_NAME}/query?sql=SELECT%20username%20FROM%20profiles%20ORDER%20BY%20username`, {
      headers: { 'x-api-key': App.authToken }
    });
    if (!resp.ok) throw new Error('Query failed');
    const rows = await resp.json();
    const usernames = rows.map(r => r.username);
    populateCustomSelect(usernames);
  } catch (err) {
    console.warn('Failed to update username select:', err.message);
  }
}

// Generic helper to fetch rows from a view or table
async function fetchViewRows(viewName, whereClause = '', orderBy = '', limit = 100) {
  const sql = `SELECT * FROM ${viewName}${whereClause ? ' WHERE ' + whereClause : ''}${orderBy ? ' ORDER BY ' + orderBy : ''} LIMIT ${limit}`;
  const resp = await fetch(`${App.TURSO_API_URL}/api/${App.TURSO_DB_NAME}/query?sql=${encodeURIComponent(sql)}`, {
    headers: { 'x-api-key': App.authToken }
  });
  if (!resp.ok) throw new Error(`Failed to fetch from ${viewName}`);
  return await resp.json();
}

// Execute raw SQL (for save operations)
async function execSql(sql) {
  const resp = await fetch(`${App.TURSO_API_URL}/api/${App.TURSO_DB_NAME}/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': App.authToken,
    },
    body: JSON.stringify({ sql }),
  });
  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${resp.status}`);
  }
  return resp.json();
}

// Execute a read‑only SQL query and return the rows
async function queryRows(sql) {
  const resp = await fetch(`${App.TURSO_API_URL}/api/${App.TURSO_DB_NAME}/query?sql=${encodeURIComponent(sql)}`, {
    headers: { 'x-api-key': App.authToken }
  });
  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({}));
    throw new Error(errData.error || `Query failed (HTTP ${resp.status})`);
  }
  return await resp.json();
}
