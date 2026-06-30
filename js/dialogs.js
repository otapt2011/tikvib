// Custom dialog system (prompt, alert, confirm)
window.customPrompt = function(message, isPassword = false) {
  return new Promise((resolve) => {
    const existing = document.querySelector('.dialog-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.innerHTML = `
      <div class="dialog-box">
        <h3>${message}</h3>
        <input type="${isPassword ? 'password' : 'text'}" id="dialogInput" placeholder="Enter password" autofocus>
        <div class="dialog-buttons">
          <button class="btn-cancel" id="dialogCancel">Cancel</button>
          <button class="btn-primary" id="dialogSubmit">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#dialogInput');
    const submitBtn = overlay.querySelector('#dialogSubmit');
    const cancelBtn = overlay.querySelector('#dialogCancel');
    input.focus();

    const handleKey = (e) => {
      if (e.key === 'Enter') submitBtn.click();
      else if (e.key === 'Escape') cancelBtn.click();
    };
    input.addEventListener('keydown', handleKey);

    submitBtn.addEventListener('click', () => {
      const val = input.value.trim();
      cleanup();
      resolve(val || null);
    });
    cancelBtn.addEventListener('click', () => {
      cleanup();
      resolve(null);
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(null);
      }
    });

    function cleanup() {
      input.removeEventListener('keydown', handleKey);
      overlay.remove();
    }
  });
};

window.customAlert = function(message) {
  return new Promise((resolve) => {
    const existing = document.querySelector('.dialog-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.innerHTML = `
      <div class="dialog-box">
        <h3>${message}</h3>
        <div class="dialog-buttons" style="justify-content: center;">
          <button class="btn-primary" id="dialogOk">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const okBtn = overlay.querySelector('#dialogOk');
    okBtn.focus();

    okBtn.addEventListener('click', () => {
      overlay.remove();
      resolve();
    });
    document.addEventListener('keydown', function escapeHandler(e) {
      if (e.key === 'Enter' || e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', escapeHandler);
        resolve();
      }
    });
  });
};

window.customConfirm = function(message) {
  return new Promise((resolve) => {
    const existing = document.querySelector('.dialog-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.innerHTML = `
      <div class="dialog-box">
        <h3>${message}</h3>
        <div class="dialog-buttons">
          <button class="btn-cancel" id="dialogCancel">Cancel</button>
          <button class="btn-primary" id="dialogOk">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const okBtn = overlay.querySelector('#dialogOk');
    const cancelBtn = overlay.querySelector('#dialogCancel');
    okBtn.focus();

    okBtn.addEventListener('click', () => {
      overlay.remove();
      resolve(true);
    });
    cancelBtn.addEventListener('click', () => {
      overlay.remove();
      resolve(false);
    });
    document.addEventListener('keydown', function keyHandler(e) {
      if (e.key === 'Enter') {
        overlay.remove();
        document.removeEventListener('keydown', keyHandler);
        resolve(true);
      } else if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', keyHandler);
        resolve(false);
      }
    });
  });
};
