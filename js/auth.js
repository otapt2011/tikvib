// Authentication & token management
async function verifyToken(token) {
  try {
    const resp = await fetch(`${App.TURSO_API_URL}/api/${App.TURSO_DB_NAME}/query?sql=SELECT%201`, {
      headers: { 'x-api-key': token }
    });
    return resp.ok;
  } catch { return false; }
}

async function authenticate() {
  if (App.authToken) {
    updateDbStatus('connecting');
    const valid = await verifyToken(App.authToken);
    if (valid) {
      updateDbStatus('connected');
      await updateUserCount();
      await updateUsernameSelect();
      return App.authToken;
    } else {
      App.authToken = null;
      localStorage.removeItem(App.TOKEN_STORAGE_KEY);
      updateDbStatus('error');
    }
  }

  const password = await customPrompt('Enter your Turso server password:', true);
  if (!password) {
    updateDbStatus('error');
    throw new Error('Password cancelled');
  }

  updateDbStatus('connecting');
  try {
    const resp = await fetch(`${App.TURSO_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || 'Authentication failed');
    }
    const data = await resp.json();
    App.authToken = data.token;
    localStorage.setItem(App.TOKEN_STORAGE_KEY, App.authToken);
    updateDbStatus('connected');
    await updateUserCount();
    await updateUsernameSelect();
    return App.authToken;
  } catch (err) {
    updateDbStatus('error');
    throw err;
  }
}

async function autoConnect() {
  const storedToken = localStorage.getItem(App.TOKEN_STORAGE_KEY);
  if (storedToken) {
    App.authToken = storedToken;
    updateDbStatus('connecting');
    const valid = await verifyToken(storedToken);
    if (valid) {
      updateDbStatus('connected');
      await updateUserCount();
      await updateUsernameSelect();
      return;
    } else {
      App.authToken = null;
      localStorage.removeItem(App.TOKEN_STORAGE_KEY);
    }
  }
  updateDbStatus('error');
  try {
    await authenticate();
  } catch { /* user cancelled */ }
}

function updateDbStatus(state) {
  if (!App.dbStatusEl) return;
  App.dbStatusEl.className = 'db-status ' + state;
  let icon = '';
  switch (state) {
    case 'connecting': icon = '<i class="fa-solid fa-spinner fa-spin"></i>'; break;
    case 'connected':  icon = '<i class="fa-solid fa-circle-check"></i>'; break;
    case 'error':      icon = '<i class="fa-solid fa-circle-exclamation"></i>'; break;
  }
  App.dbStatusEl.innerHTML = icon;
}
