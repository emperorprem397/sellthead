/* SELLTHEAD — auth.js (Firebase Edition, safe version) */

function onFirebaseReady(fn) {
  // Only call immediately if Firebase is FULLY ready (=== true, not just set)
  if (window.firebaseReady === true) { fn(); }
  else { document.addEventListener('firebaseReady', () => fn(), { once: true }); }
}

const Auth = {
  currentUser: null,
  userDoc:     null,

  async register(name, email, password) {
    if (!window.auth) return { ok: false, msg: 'Service unavailable. Try again.' };
    try {
      const cred = await window.auth.createUserWithEmailAndPassword(email, password);
      await cred.user.updateProfile({ displayName: name });
      try { await cred.user.sendEmailVerification(); } catch(e) {}
      try {
        await window.db.collection('users').doc(cred.user.uid).set({
          uid: cred.user.uid, name, displayName: name, email, phone: '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          role: 'customer'
        });
      } catch(e) { console.warn('User doc create failed:', e); }
      return { ok: true, msg: 'Account created! Please verify your email.' };
    } catch (err) {
      return { ok: false, msg: Auth._friendlyError(err.code) };
    }
  },

  async login(email, password) {
    if (!window.auth) return { ok: false, msg: 'Service unavailable. Try again.' };
    try {
      const cred = await window.auth.signInWithEmailAndPassword(email, password);
      return { ok: true, user: cred.user };
    } catch (err) {
      return { ok: false, msg: Auth._friendlyError(err.code) };
    }
  },

  async logout() {
    try { if (window.auth) await window.auth.signOut(); } catch(e) {}
    Auth.currentUser = null;
    Auth.userDoc = null;
    // Clear all session data on logout
    localStorage.removeItem('sh_cart');
    localStorage.removeItem('sh_user_cache');
    if (typeof updateLoginBtn === 'function') updateLoginBtn();
    if (typeof showToast === 'function') showToast('Logged out successfully.');
  },

  async googleSignIn() {
    if (!window.auth) return { ok: false, msg: 'Service unavailable.' };
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      // signInWithPopup is the correct method — but needs user gesture
      // We call it directly inside the click handler so browser allows it
      const cred = await window.auth.signInWithPopup(provider);
      const user = cred.user;
      Auth.currentUser = user;
      // Create user doc in Firestore if first time
      if (window.db) {
        try {
          const docRef = window.db.collection('users').doc(user.uid);
          const snap = await docRef.get();
          if (!snap.exists) {
            await docRef.set({
              uid: user.uid,
              name: user.displayName || '',
              displayName: user.displayName || '',
              email: user.email,
              phone: '',
              photoURL: user.photoURL || '',
              createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              role: 'customer'
            });
          } else {
            // Update name & Google photo for existing users on every login
            const updates = { displayName: user.displayName || '', name: user.displayName || '' };
            if (user.photoURL && !snap.data().photoURL) updates.photoURL = user.photoURL;
            await docRef.update(updates);
          }
        } catch(e) { console.warn('Google user doc failed:', e); }
      }
      return { ok: true, user };
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') return { ok: false, msg: '' };
      if (err.code === 'auth/popup-blocked') return { ok: false, msg: 'popup-blocked' };
      return { ok: false, msg: Auth._friendlyError(err.code) };
    }
  },

  // No longer needed but kept for safety
  async handleGoogleRedirect() { return null; },

  async forgotPassword(email) {
    if (!window.auth) return { ok: false, msg: 'Service unavailable.' };
    try {
      await window.auth.sendPasswordResetEmail(email);
      return { ok: true, msg: 'Reset link sent to your email!' };
    } catch (err) {
      return { ok: false, msg: Auth._friendlyError(err.code) };
    }
  },

  isLoggedIn() { return !!Auth.currentUser; },

  async fetchUserDoc(uid) {
    if (!window.db) return null;
    try {
      const snap = await window.db.collection('users').doc(uid).get();
      if (snap.exists) Auth.userDoc = snap.data();
    } catch(e) { console.warn('fetchUserDoc failed:', e); }
    return Auth.userDoc;
  },

  async updateProfile(data) {
    if (!Auth.currentUser) return { ok: false, msg: 'Not logged in.' };
    try {
      if (window.db) await window.db.collection('users').doc(Auth.currentUser.uid).update(data);
      if (data.name) await Auth.currentUser.updateProfile({ displayName: data.name });
      Auth.userDoc = { ...Auth.userDoc, ...data };
      return { ok: true };
    } catch (err) {
      return { ok: false, msg: err.message };
    }
  },

  async changePassword(newPassword) {
    if (!Auth.currentUser) return { ok: false, msg: 'Not logged in.' };
    try {
      await Auth.currentUser.updatePassword(newPassword);
      return { ok: true };
    } catch (err) {
      return { ok: false, msg: Auth._friendlyError(err.code) };
    }
  },

  async saveOrder(order) {
    const orderData = {
      ...order,
      userId:    Auth.currentUser ? Auth.currentUser.uid : 'guest',
      userEmail: Auth.currentUser ? Auth.currentUser.email : (order.delivery?.email || ''),
      userName:  Auth.currentUser ? (Auth.userDoc?.name || Auth.currentUser.displayName) : (order.delivery?.fname || ''),
      createdAt: window.db ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString(),
      status:    'Pending'
    };
    // Always save to localStorage as backup
    try {
      const orders = JSON.parse(localStorage.getItem('sh_orders') || '[]');
      orders.unshift(orderData);
      localStorage.setItem('sh_orders', JSON.stringify(orders.slice(0, 50)));
    } catch(e) {}
    // Save to Firestore if available
    if (window.db) {
      try {
        await window.db.collection('orders').doc(order.id).set(orderData);
      } catch(e) {
        console.warn('Firestore order save failed, using localStorage:', e);
      }
    }
    return { ok: true };
  },

  async getUserOrders() {
    // Try Firestore first
    if (window.db && Auth.currentUser) {
      try {
        const snap = await window.db.collection('orders')
          .where('userId', '==', Auth.currentUser.uid)
          .get();
        const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort by date client-side (avoids composite index requirement)
        orders.sort((a, b) => {
          const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.date || 0);
          const db2 = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.date || 0);
          return db2 - da;
        });
        return orders;
      } catch(e) {
        console.warn('Firestore getUserOrders failed, using localStorage:', e);
      }
    }
    // Fallback: localStorage
    try {
      const all = JSON.parse(localStorage.getItem('sh_orders') || '[]');
      return Auth.currentUser
        ? all.filter(o => o.userId === Auth.currentUser.uid || o.userId === 'guest')
        : all;
    } catch(e) { return []; }
  },

  async markDiscountUsed(code) {
    // localStorage always
    try {
      const used = JSON.parse(localStorage.getItem('sh_used_codes') || '[]');
      if (!used.includes(code)) { used.push(code); localStorage.setItem('sh_used_codes', JSON.stringify(used)); }
    } catch(e) {}
    // Firestore if logged in
    if (!Auth.currentUser || !window.db) return;
    try {
      const docRef = window.db.collection('discountUsage').doc(Auth.currentUser.uid);
      const snap   = await docRef.get();
      const used   = snap.exists ? (snap.data().codes || []) : [];
      if (!used.includes(code)) {
        used.push(code);
        await docRef.set({ codes: used }, { merge: true });
      }
    } catch(e) { console.warn('markDiscountUsed Firestore failed:', e); }
  },

  async isDiscountUsed(code) {
    // Check localStorage first (works for guests too)
    try {
      const used = JSON.parse(localStorage.getItem('sh_used_codes') || '[]');
      if (used.includes(code)) return true;
    } catch(e) {}
    // Check Firestore if logged in
    if (Auth.currentUser && window.db) {
      try {
        const snap = await window.db.collection('discountUsage').doc(Auth.currentUser.uid).get();
        if (snap.exists && (snap.data().codes || []).includes(code)) return true;
      } catch(e) {}
    }
    return false;
  },

  _friendlyError(code) {
    const map = {
      'auth/email-already-in-use':   'This email is already registered.',
      'auth/invalid-email':          'Please enter a valid email address.',
      'auth/weak-password':          'Password must be at least 6 characters.',
      'auth/user-not-found':         'No account found with this email.',
      'auth/wrong-password':         'Incorrect password. Try again.',
      'auth/invalid-credential':     'Invalid email or password.',
      'auth/too-many-requests':      'Too many attempts. Please try again later.',
      'auth/requires-recent-login':  'Please log out and log in again.',
      'auth/network-request-failed': 'Network error. Check your connection.',
    };
    return map[code] || 'Something went wrong. Please try again.';
  }
};

/* Auth state observer - fires when Firebase is ready */
onFirebaseReady(async () => {
  if (!window.auth) {
    document.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user: null } }));
    return;
  }
  // Set persistence FIRST (await it), THEN register auth observer
  // This guarantees login survives page refresh and navigation
  try {
    await window.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  } catch(e) {
    console.warn('Persistence set failed:', e);
  }
  window.auth.onAuthStateChanged(async (user) => {
    Auth.currentUser = user;
    if (user) {
      try { await Auth.fetchUserDoc(user.uid); } catch(e) {}
    }
    if (typeof updateLoginBtn === 'function') updateLoginBtn();
    document.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user } }));
  });
});
