// Global application state and configuration
window.App = {
  API_BASE: 'https://tikvib-api.vercel.app/api/profile/',
  TURSO_API_URL: 'https://turso-db-server.vercel.app',
  TURSO_DB_NAME: 'tikvib',

  authToken: null,
  TOKEN_STORAGE_KEY: 'tursoAuthToken',

  // DOM references (filled by each module on load)
  // Core elements
  usernameInput: null,
  customSelect: null,
  selectBtn: null,
  selectText: null,
  selectMenu: null,
  searchBtn: null,
  saveBtn: null,
  adminBtn: null,
  loadMoreBtn: null,
  loadMoreWrapper: null,
  loadingOverlay: null,
  savingOverlay: null,
  savingText: null,
  errorEl: null,
  skeletonProfile: null,
  skeletonVideoGrid: null,
  profileCard: null,
  videoGrid: null,
  dbStatusEl: null,
  dbUserCountEl: null,

  // Admin modal elements
  adminModal: null,
  adminModalClose: null,
  adminTable: null,
  adminTableBody: null,
  overviewLoading: null,

  // State
  lastUsername: '',
  lastProfile: null,
  lastVideos: [],
  currentPage: 1,
  isLoadingMore: false,
  isFromDB: false,
};

// Immediately grab common DOM elements (the rest can be fetched as needed)
document.addEventListener('DOMContentLoaded', () => {
  App.usernameInput = document.getElementById('usernameInput');
  App.customSelect = document.getElementById('usernameSelectWrapper');
  App.selectBtn = App.customSelect.querySelector('.select-btn');
  App.selectText = App.customSelect.querySelector('.select-btn .text');
  App.selectMenu = App.customSelect.querySelector('.select-menu');
  App.searchBtn = document.getElementById('searchBtn');
  App.saveBtn = document.getElementById('saveBtn');
  App.adminBtn = document.getElementById('adminBtn');
  App.loadMoreBtn = document.getElementById('loadMoreBtn');
  App.loadMoreWrapper = document.getElementById('loadMoreWrapper');
  App.loadingOverlay = document.getElementById('loadingOverlay');
  App.savingOverlay = document.getElementById('savingOverlay');
  App.savingText = document.getElementById('savingText');
  App.errorEl = document.getElementById('error');
  App.skeletonProfile = document.getElementById('skeletonProfile');
  App.skeletonVideoGrid = document.getElementById('skeletonVideoGrid');
  App.profileCard = document.getElementById('profileCard');
  App.videoGrid = document.getElementById('videoGrid');
  App.dbStatusEl = document.getElementById('dbStatus');
  App.dbUserCountEl = document.getElementById('dbUserCount');

  App.adminModal = document.getElementById('adminModal');
  App.adminModalClose = document.getElementById('adminModalClose');
  App.adminTable = document.getElementById('adminTable');
  App.adminTableBody = document.getElementById('adminTableBody');
  App.overviewLoading = document.getElementById('overviewLoading');
});
