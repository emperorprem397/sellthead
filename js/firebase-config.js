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

/* ── Load Firebase SDKs from CDN ── */
(function loadFirebase(callback) {
  const scripts = [
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js",
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"
  ];
  let loaded = 0;
  scripts.forEach(src => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => { if (++loaded === scripts.length && callback) callback(); };
    document.head.appendChild(s);
  });
})(() => {
  firebase.initializeApp(FIREBASE_CONFIG);
  window.db   = firebase.firestore();
  window.auth = firebase.auth();
  window.firebaseReady = true;
  document.dispatchEvent(new Event('firebaseReady'));
});
