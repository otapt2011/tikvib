// Scraping and saving logic

async function searchProfile() {
  const username = App.usernameInput.value.trim();
  if (!username) return;

  App.errorEl.classList.add('hidden');
  App.profileCard.classList.add('hidden');
  App.videoGrid.classList.add('hidden');
  App.loadMoreWrapper.classList.add('hidden');
  hideSkeletons();
  showSkeletons();
  showLoading(true);
  disableSaveButton();
  App.isFromDB = false;

  try {
    App.currentPage = 1;
    const response = await fetch(`${App.API_BASE}${username}`);
    if (!response.ok) {
      if (response.status === 404) throw new Error('Profile not found');
      throw new Error('Something went wrong');
    }
    const data = await response.json();
    App.lastScrapeTime = new Date();                  // NEW – capture scrape time
    hideSkeletons();
    renderProfile(data);
    App.lastUsername = username;
    App.lastProfile = { ...data };
    App.lastVideos = data.videos ? [...data.videos] : [];
    enableSaveButton();

    if (data.videos && data.videos.length > 0) {
      App.loadMoreWrapper.classList.remove('hidden');
    }
  } catch (err) {
    hideSkeletons();
    App.errorEl.textContent = err.message;
    App.errorEl.classList.remove('hidden');
    disableSaveButton();
  } finally {
    showLoading(false);
  }
}

async function loadMoreVideos() {
  if (App.isLoadingMore || !App.lastUsername) return;
  App.isLoadingMore = true;
  App.loadMoreBtn.disabled = true;
  App.loadMoreBtn.textContent = 'Loading...';

  App.currentPage++;
  try {
    const response = await fetch(`${App.API_BASE}${App.lastUsername}?page=${App.currentPage}`);
    if (!response.ok) throw new Error('Failed to load more');
    const data = await response.json();
    App.lastScrapeTime = new Date();                  // NEW – capture scrape time
    const newVideos = data.videos || [];

    App.lastVideos = App.lastVideos.concat(newVideos);
    appendVideoCards(newVideos);

    if (newVideos.length < 15) {
      App.loadMoreWrapper.classList.add('hidden');
    }
  } catch (err) {
    App.errorEl.textContent = err.message;
    App.errorEl.classList.remove('hidden');
    App.currentPage--;
  } finally {
    App.isLoadingMore = false;
    App.loadMoreBtn.disabled = false;
    App.loadMoreBtn.textContent = 'Load more';
  }
}

async function loadProfileFromDB(username) {
  if (!App.authToken) await authenticate();
  if (!App.authToken) throw new Error('Not connected to database');

  App.profileCard.classList.add('hidden');
  App.videoGrid.classList.add('hidden');
  hideSkeletons();
  showSkeletons();
  showLoading(true);
  disableSaveButton();
  App.isFromDB = true;
  App.loadMoreWrapper.classList.add('hidden');

  try {
    const profileRows = await fetchViewRows(
      'latest_profiles',
      `username = '${username.replace(/'/g, "''")}'`,
      '',
      1
    );
    if (!profileRows.length) throw new Error('User not found in database');
    const p = profileRows[0];

    const profileData = {
      username: p.username,
      avatar: p.avatar,
      displayName: p.display_name,
      bio: p.bio,
      stats: {
        posts: p.posts,
        followers: p.followers,
        following: p.following,
        likes: p.likes,
      }
    };

    const videoRows = await fetchViewRows(
      'latest_videos',
      `uploader = '${username.replace(/'/g, "''")}'`,
      'CAST(video_id AS INTEGER) DESC',
      200
    );

    const videos = videoRows.map(v => ({
      id: v.video_id,
      title: v.title,
      thumbnail: v.thumbnail_url,
      link: v.link,
      stats: {
        likes: v.likes,
        views: v.views,
        comments: v.comments,
        shares: v.shares,
        collections: v.collections
      },
      posted: v.posted,
      posted_at: v.posted_at            // NEW – include if present (from DB)
    }));

    hideSkeletons();
    renderProfile({ ...profileData, videos });
    App.lastUsername = username;
    App.lastProfile = profileData;
    App.lastVideos = videos;
    disableSaveButton();
  } catch (err) {
    hideSkeletons();
    App.errorEl.textContent = err.message;
    App.errorEl.classList.remove('hidden');
  } finally {
    showLoading(false);
  }
}

function esc(str) {
  if (!str) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

async function saveToTurso(username, profile, videos) {
  const statements = [];

  // Profile
  statements.push(`INSERT OR IGNORE INTO profiles (username) VALUES ('${username.replace(/'/g, "''")}');`);
  statements.push(`
    UPDATE profiles SET
      avatar = ${esc(profile.avatar)},
      display_name = ${esc(profile.displayName)}
    WHERE username = '${username.replace(/'/g, "''")}'
      AND (
        avatar IS NULL OR avatar != ${esc(profile.avatar)}
        OR display_name IS NULL OR display_name != ${esc(profile.displayName)}
      )
  `);
  statements.push(`
    INSERT INTO profile_snapshots (profile_id, posts, followers, following, likes, scrape_time)
    VALUES (
      (SELECT id FROM profiles WHERE username = '${username.replace(/'/g, "''")}'),
      ${esc(profile.stats?.posts)},
      ${esc(profile.stats?.followers)},
      ${esc(profile.stats?.following)},
      ${esc(profile.stats?.likes)},
      datetime('now')
    )
  `);

  // Videos
  const referenceTime = App.lastScrapeTime || new Date();  // NEW – use captured scrape time

  for (const video of videos) {
    const vid = String(video.id || '').replace(/'/g, "''");
    const title = video.title?.replace(/'/g, "''") || '';
    const thumb = video.thumbnail?.replace(/'/g, "''") || '';
    const link = video.link?.replace(/'/g, "''") || '';
    const posted = video.posted?.replace(/'/g, "''") || '';

    // NEW – compute absolute posted date
    let postedAbsolute = null;
    if (video.posted && typeof relativeTimeToDate === 'function') {
      const absDate = relativeTimeToDate(video.posted, referenceTime);
      postedAbsolute = absDate ? absDate.toISOString().replace(/'/g, "''") : null;
    }

    statements.push(`INSERT OR IGNORE INTO videos (video_id, profile_id) VALUES ('${vid}', (SELECT id FROM profiles WHERE username = '${username.replace(/'/g, "''")}'))`);

    // UPDATE static fields AND the new posted_at column
    statements.push(`
      UPDATE videos SET
        title = ${title ? `'${title}'` : 'NULL'},
        thumbnail_url = ${thumb ? `'${thumb}'` : 'NULL'},
        link = ${link ? `'${link}'` : 'NULL'},
        posted = ${posted ? `'${posted}'` : 'NULL'},
        posted_at = ${postedAbsolute ? `'${postedAbsolute}'` : 'NULL'}
      WHERE video_id = '${vid}'
        AND (
          title IS NULL OR title != ${title ? `'${title}'` : 'NULL'}
          OR thumbnail_url IS NULL OR thumbnail_url != ${thumb ? `'${thumb}'` : 'NULL'}
          OR link IS NULL OR link != ${link ? `'${link}'` : 'NULL'}
          OR posted IS NULL OR posted != ${posted ? `'${posted}'` : 'NULL'}
          OR posted_at IS NULL OR posted_at != ${postedAbsolute ? `'${postedAbsolute}'` : 'NULL'}
        )
    `);

    const likes = video.stats?.likes?.replace(/'/g, "''") || '';
    const views = video.stats?.views?.replace(/'/g, "''") || '';
    const comments = video.stats?.comments?.replace(/'/g, "''") || '';
    const shares = video.stats?.shares?.replace(/'/g, "''") || '';
    const collections = video.stats?.collections?.replace(/'/g, "''") || '';

    statements.push(`
      INSERT INTO video_snapshots (video_id, likes, views, comments, shares, collections, scrape_time)
      VALUES (
        (SELECT id FROM videos WHERE video_id = '${vid}'),
        ${likes ? `'${likes}'` : 'NULL'},
        ${views ? `'${views}'` : 'NULL'},
        ${comments ? `'${comments}'` : 'NULL'},
        ${shares ? `'${shares}'` : 'NULL'},
        ${collections ? `'${collections}'` : 'NULL'},
        datetime('now')
      )
    `);
  }

  const fullSql = statements.join(';\n');
  await execSql(fullSql);
  

// Toast with unsaved blob counts (non‑critical – errors are silent)
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  App.searchBtn.addEventListener('click', searchProfile);
  App.usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchProfile();
  });
  App.loadMoreBtn.addEventListener('click', loadMoreVideos);

  App.saveBtn.addEventListener('click', async () => {
    if (!App.lastUsername || !App.lastProfile) return;
    disableSaveButton();
    showSaving(true, 'Connecting to database...');
    try {
      if (!App.authToken || !(await verifyToken(App.authToken))) {
        await authenticate();
      }
      App.savingText.textContent = 'Saving to database...';
      await saveToTurso(App.lastUsername, App.lastProfile, App.lastVideos);
await updateUserCount();
await updateUsernameSelect();

// Build extended success message with blob counts (if available)
let successMsg = 'Data saved successfully!';
try {
  if (typeof countUnsavedBlobs === 'function') {
    const [avatarCount, thumbCount] = await Promise.all([
      countUnsavedBlobs('avatar').catch(() => '?'),
      countUnsavedBlobs('thumbnail').catch(() => '?')
    ]);
    successMsg += `\n📸 Unsaved avatars: ${avatarCount} · Unsaved thumbnails: ${thumbCount}`;
  }
} catch (_) { /* ignore – alert stays simple if function missing */ }

await customAlert(successMsg);
    } catch (err) {
      if (err.message !== 'Password cancelled') {
        console.warn('Save failed:', err.message);
        await customAlert(`Failed to save: ${err.message}`);
        enableSaveButton();
      } else {
        enableSaveButton();
      }
    } finally {
      showSaving(false);
    }
  });

  showSkeletons();
  disableSaveButton();
  autoConnect();
});
