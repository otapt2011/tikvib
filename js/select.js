// Custom select widget
function populateCustomSelect(usernames) {
  if (!App.selectMenu) return;
  App.selectMenu.innerHTML = '';
  usernames.forEach(name => {
    const div = document.createElement('div');
    div.className = 'option';
    div.dataset.value = name;
    div.textContent = name;
    App.selectMenu.appendChild(div);
  });
  if (usernames.length > 0) {
    App.selectText.textContent = 'Users';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  App.selectBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    App.customSelect.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!App.customSelect.contains(e.target)) {
      App.customSelect.classList.remove('open');
    }
  });

  App.selectMenu.addEventListener('click', (e) => {
    const option = e.target.closest('.option');
    if (!option) return;
    const value = option.dataset.value;
    const text = option.textContent;
    App.selectText.textContent = text;
    App.customSelect.classList.remove('open');
    App.customSelect.dispatchEvent(new CustomEvent('change', { detail: { value, text } }));
  });

  App.customSelect.addEventListener('change', (e) => {
    const selected = e.detail.value;
    if (selected) {
      App.usernameInput.value = '';
      App.isFromDB = true;
      loadProfileFromDB(selected);
      App.loadMoreWrapper.classList.add('hidden');
    }
  });
});
