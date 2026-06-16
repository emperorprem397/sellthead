/* ═══════════════════════════════════════════════════════════════
   SELLTHEAD — Firebase Configuration
   Replace the config object below with YOUR Firebase project keys.
   Get them from: Firebase Console → Project Settings → Your Apps
═══════════════════════════════════════════════════════════════ */

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDhwsAHuXJLp5kMUS3nwtKVQZ2IizGu8-Y",
  authDomain:        "sellthead.firebaseapp.com",
  projectId:         "sellthead",
  storageBucket:     "sellthead.firebasestorage.app",
  messagingSenderId: "740513404991",
  appId:             "1:740513404991:web:ed9b19133a13dc4c62408a"
};

/* ── Load Firebase SDKs from CDN (sequentially — app must load before auth/firestore) ── */
(function loadFirebase(callback) {
  const scripts = [
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js",
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"
  ];
  function loadNext(i) {
    if (i >= scripts.length) { if (callback) callback(); return; }
    const s = document.createElement('script');
    s.src = scripts[i];
    s.onload  = () => loadNext(i + 1);
    s.onerror = () => {
      console.error('Failed to load Firebase script:', scripts[i]);
      loadNext(i + 1); // keep trying remaining scripts rather than freezing forever
    };
    document.head.appendChild(s);
  }
  loadNext(0);
})(() => {
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    window.db   = firebase.firestore();
    window.auth = firebase.auth();
    window.firebaseReady = true;
    document.dispatchEvent(new Event('firebaseReady'));
  } catch (e) {
    console.error('Firebase init failed:', e);
    window.firebaseReady = false;
    document.dispatchEvent(new Event('firebaseReady')); // still fire so UI doesn't hang forever
  }
});
