// UI rendering helpers
// Show a small auto‑disappearing toast at the bottom centre
function showToast(message, duration = 4000) {
  // Remove any existing toast
  const old = document.querySelector('.toast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 3rem;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: #fff;
    padding: 0.6rem 1.2rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
    z-index: 300;
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
    white-space: nowrap;
  `;
  document.body.appendChild(toast);

  // Fade in
  requestAnimationFrame(() => { toast.style.opacity = '1'; });

  // Fade out and remove
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
// Format an ISO date string into a compact readable form
function formatAbsoluteDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }) + ', ' + d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function showSkeletons() {
  App.skeletonProfile.classList.remove('hidden');
  App.skeletonVideoGrid.classList.remove('hidden');
  App.profileCard.classList.add('hidden');
  App.videoGrid.classList.add('hidden');
}

function hideSkeletons() {
  App.skeletonProfile.classList.add('hidden');
  App.skeletonVideoGrid.classList.add('hidden');
}

function showLoading(show) {
  if (show) App.loadingOverlay.classList.remove('hidden');
  else App.loadingOverlay.classList.add('hidden');
}

function showSaving(show, message = 'Saving to database...') {
  if (show) {
    App.savingText.textContent = message;
    App.savingOverlay.classList.remove('hidden');
  } else {
    App.savingOverlay.classList.add('hidden');
  }
}

function disableSaveButton() {
  App.saveBtn.disabled = true;
}

function enableSaveButton() {
  App.saveBtn.disabled = false;
}

function renderProfile(data) {
  document.getElementById('avatar').src = data.avatar || '';
  document.getElementById('displayName').textContent = data.displayName || data.username;

  const bioEl = document.getElementById('bio');
  if (data.bio) {
    bioEl.textContent = data.bio;
    bioEl.classList.remove('hidden');
  } else {
    bioEl.classList.add('hidden');
  }

  document.getElementById('statPosts').textContent = data.stats?.posts || 0;
  document.getElementById('statFollowers').textContent = data.stats?.followers || 0;
  document.getElementById('statFollowing').textContent = data.stats?.following || 0;
  document.getElementById('statLikes').textContent = data.stats?.likes || 0;

  App.profileCard.classList.remove('hidden');
  renderVideos(data.videos);
}

function renderVideos(videos) {
  App.videoGrid.innerHTML = '';

  if (!videos || videos.length === 0) {
    App.videoGrid.innerHTML = '<p style="text-align:center;color:#888;padding:0.5rem;font-size:0.8rem;">No videos</p>';
    App.videoGrid.classList.remove('hidden');
    return;
  }

  videos.forEach(video => {
    const card = document.createElement('a');
    card.className = 'video-card';
    card.href = video.link || '#';
    card.target = '_blank';
    card.rel = 'noopener';
    card.innerHTML = `
      <div class="thumbnail-wrapper">
        <img src="${video.thumbnail || ''}" alt="${video.title || ''}" loading="lazy">
        <div class="video-stats-overlay">
          <span class="stat"><i class="fa-solid fa-heart"></i><span>${video.stats?.likes || 0}</span></span>
          <span class="stat"><i class="fa-solid fa-eye"></i><span>${video.stats?.views || 0}</span></span>
          <span class="stat"><i class="fa-solid fa-comment"></i><span>${video.stats?.comments || 0}</span></span>
          <span class="stat"><i class="fa-solid fa-share"></i><span>${video.stats?.shares || 0}</span></span>
          <span class="stat"><i class="fa-solid fa-bookmark"></i><span>${video.stats?.collections || 0}</span></span>
        </div>
      </div>
      <div class="video-info">
        <div class="video-title">${video.title || 'Untitled'}</div>
        ${video.posted_at
          ? `<div class="posted-time">${formatAbsoluteDate(video.posted_at)}</div>`
          : (video.posted ? `<div class="posted-time">${video.posted}</div>` : '')}
      </div>
    `;
    App.videoGrid.appendChild(card);
  });

  App.videoGrid.classList.remove('hidden');
}

function createVideoCard(video) {
  const card = document.createElement('a');
  card.className = 'video-card';
  card.href = video.link || '#';
  card.target = '_blank';
  card.rel = 'noopener';
  card.innerHTML = `
    <div class="thumbnail-wrapper">
      <img src="${video.thumbnail || ''}" alt="${video.title || ''}" loading="lazy">
      <div class="video-stats-overlay">
        <span class="stat"><i class="fa-solid fa-heart"></i><span>${video.stats?.likes || 0}</span></span>
        <span class="stat"><i class="fa-solid fa-eye"></i><span>${video.stats?.views || 0}</span></span>
        <span class="stat"><i class="fa-solid fa-comment"></i><span>${video.stats?.comments || 0}</span></span>
        <span class="stat"><i class="fa-solid fa-share"></i><span>${video.stats?.shares || 0}</span></span>
        <span class="stat"><i class="fa-solid fa-bookmark"></i><span>${video.stats?.collections || 0}</span></span>
      </div>
    </div>
    <div class="video-info">
      <div class="video-title">${video.title || 'Untitled'}</div>
      ${video.posted_at
        ? `<div class="posted-time">${formatAbsoluteDate(video.posted_at)}</div>`
        : (video.posted ? `<div class="posted-time">${video.posted}</div>` : '')}
    </div>
  `;
  return card;
}

function appendVideoCards(videos) {
  videos.forEach(video => App.videoGrid.appendChild(createVideoCard(video)));
}
