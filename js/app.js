/* ═══════════════════════════════════════════════
   SELLTHEAD — app.js v6.0 ULTRA PREMIUM
   Matches new CSS theme: Blue accent glassmorphism
═══════════════════════════════════════════════ */

/* ─── CUSTOM CURSOR ─── */
(function () {
  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  dot.style.opacity  = '0';
  ring.style.opacity = '0';

  let mx = 0, my = 0, rx = 0, ry = 0, moved = false;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (!moved) {
      moved = true;
      dot.style.opacity  = '1';
      ring.style.opacity = '0.7';
      dot.style.transition  = 'opacity .3s';
      ring.style.transition = 'opacity .3s, width .18s, height .18s, border-color .18s';
    }
  });

  dot.style.cssText  = 'position:fixed;top:0;left:0;width:7px;height:7px;border-radius:50%;background:#ffffff;pointer-events:none;z-index:9999;box-shadow:0 0 12px 5px rgba(255,255,255,.7),0 0 28px 8px rgba(255,255,255,.3);transform:translate(-50%,-50%);opacity:0;';
  ring.style.cssText = 'position:fixed;top:0;left:0;width:34px;height:34px;border-radius:50%;border:2px solid rgba(255,255,255,.55);box-shadow:0 0 14px 3px rgba(255,255,255,.2);pointer-events:none;z-index:9998;transform:translate(-50%,-50%);opacity:0;animation:cursorPulse 2.2s ease-in-out infinite;';

  if (!document.getElementById('cursorKF')) {
    const s = document.createElement('style'); s.id = 'cursorKF';
    s.textContent = '@keyframes cursorPulse{0%,100%{box-shadow:0 0 14px 3px rgba(255,255,255,.2)}50%{box-shadow:0 0 28px 9px rgba(255,255,255,.45)}}';
    document.head.appendChild(s);
  }

  (function anim() {
    requestAnimationFrame(anim);
    rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
    dot.style.left  = mx + 'px'; dot.style.top  = my + 'px';
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
  })();

  document.addEventListener('mousedown', () => { dot.style.transform='translate(-50%,-50%) scale(1.8)'; ring.style.width='22px'; ring.style.height='22px'; });
  document.addEventListener('mouseup',   () => { dot.style.transform='translate(-50%,-50%) scale(1)'; ring.style.width='34px'; ring.style.height='34px'; });
  document.addEventListener('mouseover', e => {
    if (e.target.closest('a, button, .product-card, .collab-card, .col-card')) {
      ring.style.width='44px'; ring.style.height='44px';
      ring.style.borderColor='rgba(255,255,255,.9)';
      ring.style.boxShadow='0 0 20px 6px rgba(255,255,255,.45)';
    }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest('a, button, .product-card, .collab-card, .col-card')) {
      ring.style.width='34px'; ring.style.height='34px';
      ring.style.borderColor='rgba(255,255,255,.55)';
      ring.style.boxShadow='0 0 14px 3px rgba(255,255,255,.2)';
    }
  });
})();

/* ─── HAMBURGER / DRAWER ─── */
(function () {
  const ham  = document.getElementById('hamburger');
  const draw = document.getElementById('drawer');
  const bg   = document.getElementById('drawerBg');
  if (!ham) return;
  const open  = () => { draw.classList.add('open'); bg.classList.add('open'); };
  const close = () => { draw.classList.remove('open'); bg.classList.remove('open'); };
  ham.addEventListener('click', open);
  document.getElementById('drawerClose')?.addEventListener('click', close);
  bg.addEventListener('click', close);
  document.getElementById('drawerLoginBtn')?.addEventListener('click', () => { close(); openModal(); });
})();

/* Navbar glass scroll effect */
(function(){
  const nav = document.getElementById('navbar');
  if(!nav) return;
  function onScroll(){
    if(window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();

/* ─── CART ─── */
const Cart = {
  items: JSON.parse(localStorage.getItem('sh_cart') || '[]'),

  // Save to localStorage (always) + Firestore (if logged in) for cross-device sync
  async save() {
    localStorage.setItem('sh_cart', JSON.stringify(this.items));
    const uid = window.auth?.currentUser?.uid;
    if (uid && window.db) {
      try {
        await window.db.collection('carts').doc(uid).set({ items: this.items, updatedAt: Date.now() });
      } catch(e) { /* silent fail — localStorage still works */ }
    }
  },

  // Load cart from Firestore if logged in, else use localStorage
  async loadFromCloud() {
    const uid = window.auth?.currentUser?.uid;
    if (!uid || !window.db) return;
    try {
      const doc = await window.db.collection('carts').doc(uid).get();
      if (doc.exists && doc.data().items) {
        const cloudItems = doc.data().items;
        // Merge cloud + local — keep highest qty for each item
        cloudItems.forEach(cloudItem => {
          const idx = this.items.findIndex(i => i.id === cloudItem.id && i.size === cloudItem.size);
          if (idx > -1) {
            this.items[idx].qty = Math.max(this.items[idx].qty, cloudItem.qty);
          } else {
            this.items.push(cloudItem);
          }
        });
        localStorage.setItem('sh_cart', JSON.stringify(this.items));
        this.render();
      }
    } catch(e) { /* use localStorage fallback */ }
  },

  add(product, size) {
    const idx = this.items.findIndex(i => i.id === product.id && i.size === size);
    if (idx > -1) this.items[idx].qty++;
    else this.items.push({ id: product.id, title: product.title, price: product.price, image: product.image, size, qty: 1 });
    // Render and open sidebar FIRST (instant feedback), then save to cloud
    this.render();
    this.openSidebar();
    showToast('Added to cart! 💪');
    this.save(); // async — runs in background, doesn't affect display
  },
  remove(id, size) {
    this.items = this.items.filter(i => !(i.id === id && i.size === size));
    this.render();
    this.save();
  },
  total()  { return this.items.reduce((s, i) => s + i.price * i.qty, 0); },
  count()  { return this.items.reduce((s, i) => s + i.qty, 0); },
  render() {
    // Update count in navbar pill
    const countEls = document.querySelectorAll('#cartCount');
    const c = this.count();
    countEls.forEach(el => el.textContent = c);

    const el  = document.getElementById('cartItems');
    const tot = document.getElementById('cartTotal');
    if (el) {
      if (!this.items.length) {
        el.innerHTML = `<div class="cart-empty">Your cart is empty 😢<br><a href="shop.html" style="color:var(--accent);font-size:.85rem;margin-top:.5rem;display:inline-block">Browse Shop →</a></div>`;
      } else {
        el.innerHTML = this.items.map(i => `
          <div class="cart-item">
            <img src="${i.image}" alt="${i.title}" class="cart-item-img" onerror="this.style.background='#1a1a2a'" />
            <div class="cart-item-info">
              <div class="cart-item-title">${i.title}</div>
              <div class="cart-item-price">₹${i.price.toLocaleString('en-IN')} × ${i.qty} — Size: ${i.size}</div>
            </div>
            <button class="cart-item-remove" onclick="Cart.remove(${i.id},'${i.size}')">✕</button>
          </div>`).join('');
      }
    }
    if (tot) tot.textContent = '₹' + this.total().toLocaleString('en-IN');
  },
  openSidebar()  { document.getElementById('cartSidebar')?.classList.add('open'); document.getElementById('cartBg')?.classList.add('open'); },
  closeSidebar() { document.getElementById('cartSidebar')?.classList.remove('open'); document.getElementById('cartBg')?.classList.remove('open'); }
};

Cart.render();
document.getElementById('cartBtn')?.addEventListener('click',  () => Cart.openSidebar());
document.getElementById('closeCart')?.addEventListener('click', () => Cart.closeSidebar());
document.getElementById('cartBg')?.addEventListener('click',   () => Cart.closeSidebar());

/* Live search removed */

/* ─── LOGIN MODAL ─── */
function openModal(tab = 'login') {
  document.getElementById('loginModal')?.classList.add('open');
  document.getElementById('loginFormWrap').style.display    = tab === 'login'    ? '' : 'none';
  document.getElementById('registerFormWrap').style.display = tab === 'register' ? '' : 'none';
  document.getElementById('forgotFormWrap').style.display   = tab === 'forgot'   ? '' : 'none';
}
function closeModal() { document.getElementById('loginModal')?.classList.remove('open'); }

document.getElementById('loginBtn')?.addEventListener('click', () => openModal('login'));
document.getElementById('closeLoginModal')?.addEventListener('click', closeModal);
document.getElementById('loginModal')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
document.getElementById('goRegister')?.addEventListener('click', e => { e.preventDefault(); openModal('register'); });
document.getElementById('goLogin')?.addEventListener('click',    e => { e.preventDefault(); openModal('login'); });
document.getElementById('goForgot')?.addEventListener('click',   e => { e.preventDefault(); openModal('forgot'); });
document.getElementById('goLoginFromForgot')?.addEventListener('click', e => { e.preventDefault(); openModal('login'); });

/* ─── AUTH ACTIONS ─── */
document.getElementById('doLogin')?.addEventListener('click', async () => {
  const email = document.getElementById('loginEmail')?.value.trim();
  const pass  = document.getElementById('loginPassword')?.value;
  if (!email || !pass) { showToast('Please fill all fields.', 'error'); return; }
  const res = await Auth.login(email, pass);
  if (res.ok) { showToast('Welcome back! 💪'); closeModal(); updateNavUser(Auth.currentUser); }
  else showToast(res.msg, 'error');
});
document.getElementById('doRegister')?.addEventListener('click', async () => {
  const name  = document.getElementById('regName')?.value.trim();
  const email = document.getElementById('regEmail')?.value.trim();
  const pass  = document.getElementById('regPassword')?.value;
  if (!name || !email || !pass) { showToast('Fill all fields!', 'error'); return; }
  if (pass.length < 6) { showToast('Password min 6 characters.', 'error'); return; }
  const res = await Auth.register(name, email, pass);
  if (res.ok) { showToast('Account created! 🔥 Please verify your email.'); closeModal(); }
  else showToast(res.msg, 'error');
});
document.getElementById('doForgot')?.addEventListener('click', async () => {
  const email = document.getElementById('forgotEmail')?.value.trim();
  if (!email) { showToast('Enter your email.', 'error'); return; }
  const res = await Auth.resetPassword(email);
  showToast(res.msg, res.ok ? 'success' : 'error');
});

/* ─── GOOGLE SIGN-IN ─── */
async function handleGoogleSignIn() {
  const btn = document.getElementById('doGoogleLogin') || document.getElementById('doGoogleRegister');
  if (btn) { btn.disabled = true; btn.textContent = 'Opening Google...'; }
  const res = await Auth.googleSignIn();
  if (res.ok) {
    showToast('Welcome, ' + (res.user.displayName || 'there') + '! 🔥');
    closeModal();
    updateNavUser(res.user);
  } else if (res.msg) {
    showToast(res.msg, 'error');
  }
  if (btn) { btn.disabled = false; btn.innerHTML = btn.id === 'doGoogleLogin'
    ? '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg> CONTINUE WITH GOOGLE'
    : '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg> SIGN UP WITH GOOGLE'; }
}
document.getElementById('doGoogleLogin')?.addEventListener('click', handleGoogleSignIn);
document.getElementById('doGoogleRegister')?.addEventListener('click', handleGoogleSignIn);

/* ─── NAV USER STATE ─── */
function updateNavUser(user) {
  const btn  = document.getElementById('loginBtn');
  const link = document.getElementById('myAccountLink');
  if (!btn) return;
  if (user) {
    const cached = JSON.parse(localStorage.getItem('sh_user_cache') || '{}');
    localStorage.setItem('sh_user_cache', JSON.stringify({
      uid: user.uid,
      name: user.displayName || user.email,
      photoURL: cached.photoURL || user.photoURL || ''
    }));
    btn.title = 'My Account';
    btn.style.color = 'var(--accent)';
    btn.onclick = () => location.href = 'account.html';
    if (link) link.style.display = '';
    // Load photoURL from Firestore and show in navbar
    setTimeout(() => {
      const photoURL = JSON.parse(localStorage.getItem('sh_user_cache') || '{}').photoURL;
      if (photoURL) applyNavAvatar(photoURL);
      else if (window.db && user.uid) {
        window.db.collection('users').doc(user.uid).get().then(doc => {
          const url = doc.data()?.photoURL;
          if (url) {
            applyNavAvatar(url);
            const c = JSON.parse(localStorage.getItem('sh_user_cache') || '{}');
            c.photoURL = url;
            localStorage.setItem('sh_user_cache', JSON.stringify(c));
          }
        }).catch(() => {});
      }
    }, 500);
  } else {
    // Clear cache on logout
    localStorage.removeItem('sh_user_cache');
    btn.title = 'Login / Register';
    btn.style.color = '';
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>';
    btn.style.cssText = '';
    btn.onclick = () => openModal('login');
    if (link) link.style.display = 'none';
  }
}

function applyNavAvatar(url) {
  const btn = document.getElementById('loginBtn');
  if (!btn || !url) return;
  btn.innerHTML = `<img src="${url}" alt="Profile" class="nav-avatar-img" onerror="this.outerHTML=''" />`;
  btn.className = 'nav-avatar-btn';
  btn.onclick = () => location.href = 'account.html';
}

// expose so account.html can call it
window.updateNavAvatar = applyNavAvatar;

// ✅ Instant UI restore from cache — runs before Firebase even loads
// Prevents navbar flickering to "logged out" on every page navigation
(function restoreNavFromCache() {
  const cached = localStorage.getItem('sh_user_cache');
  if (!cached) return;
  const data = JSON.parse(cached);
  const btn  = document.getElementById('loginBtn');
  const link = document.getElementById('myAccountLink');
  if (btn) {
    btn.title = 'My Account';
    btn.onclick = () => location.href = 'account.html';
    // Check photoURL from cache OR from dedicated avatar key
    const avatarUrl = data.photoURL || (data.uid && localStorage.getItem('sh_avatar_' + data.uid));
    if (avatarUrl) {
      setTimeout(() => applyNavAvatar(avatarUrl), 0);
    } else {
      btn.style.color = 'var(--accent)';
    }
  }
  if (link) link.style.display = '';
  Cart.items = JSON.parse(localStorage.getItem('sh_cart') || '[]');
  Cart.render();
})();

/* ─── TOAST ─── */
function showToast(msg, type = 'success') {
  let t = document.getElementById('toastEl');
  if (!t) {
    t = document.createElement('div'); t.id = 'toastEl'; t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.borderColor = type === 'error' ? '#c0392b' : 'rgba(232,28,28,.35)';
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}

/* ─── PRODUCT CARD RENDERER (new premium classes) ─── */
function renderProductCard(p) {
  const discount = Math.round((1 - p.price / p.oldPrice) * 100);
  const stars = '★'.repeat(Math.floor(p.rating || 4)) + ((p.rating % 1 >= .5) ? '★' : '');
  const badge = p.featured
    ? (discount > 0 ? `<span class="product-badge sale">-${discount}%</span>` : `<span class="product-badge">NEW</span>`)
    : '';

  return `
    <div class="product-card fade-in" data-cat="${(p.category||[]).join(' ')}" onclick="location.href='product.html?id=${p.id}'" style="cursor:pointer">
      <div class="product-img-wrap">
        ${badge}
        <img src="${p.image}" alt="${p.title}" loading="lazy" onerror="this.parentElement.style.background='#1a1a2a'" /></div>
      <div class="product-info">
        <div class="product-stars">
          <span class="star">${stars}</span>
          <span class="review-count">(${p.reviews || 0})</span>
        </div>
        <div class="product-info-top">
          <div class="product-name">${p.title}</div>
          <div class="product-price">₹${p.price.toLocaleString('en-IN')}</div>
        </div>
        <div class="product-type">${p.type || ''}</div>
        <div class="product-actions">
          <button class="product-btn cart" onclick="event.stopPropagation();quickAddToCart(${p.id})">ADD TO CART</button>
          <button class="product-btn buy" onclick="event.stopPropagation();location.href='product.html?id=${p.id}'">BUY NOW</button>
        </div>
      </div>
    </div>`;
}

function quickAddToCart(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (p) Cart.add(p, 'M');
}

/* ─── FEATURED PRODUCTS (index.html) — live prices from Firestore ─── */
(function () {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;

  function renderWith(products) {
    const featured = products.filter(p => p.featured !== false);
    grid.innerHTML = featured.length
      ? featured.map(renderProductCard).join('')
      : '<p style="color:var(--white2);text-align:center;padding:2rem">No products yet.</p>';
    initFadeIn();
  }

  // Show data.js immediately (instant render)
  renderWith(PRODUCTS);

  // Then patch with Firestore live prices (admin changes)
  function patchFromFirestore() {
    if (!window.db) { setTimeout(patchFromFirestore, 600); return; }
    window.db.collection('products').get().then(snap => {
      if (snap.empty) return;
      const fsMap = {};
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.id !== undefined) fsMap[String(data.id)] = data;
        else fsMap[d.id] = data;
      });
      const merged = PRODUCTS.map(p => {
        const fs = fsMap[String(p.id)];
        if (!fs) return p;
        return {
          ...p,
          price:    fs.price     !== undefined ? fs.price     : p.price,
          oldPrice: fs.oldPrice  !== undefined ? fs.oldPrice  : p.oldPrice,
          inStock:  fs.inStock   !== undefined ? fs.inStock   : p.inStock,
          featured: fs.featured  !== undefined ? fs.featured  : p.featured
        };
      });
      renderWith(merged);
    }).catch(() => {}); // silently fallback to data.js
  }
  // Start patching after short delay to let Firebase initialize
  setTimeout(patchFromFirestore, 400);
})();

/* ─── SHOP PAGE — live prices from Firestore ─── */
(function () {
  const grid = document.getElementById('shopGrid');
  if (!grid) return;
  const initCat = new URLSearchParams(window.location.search).get('cat') || 'all';
  let liveProducts = PRODUCTS; // starts with data.js, patched by Firestore

  function renderShop(cat) {
    const filtered = cat === 'all' ? liveProducts : liveProducts.filter(p => p.category.includes(cat));
    grid.innerHTML = filtered.length
      ? filtered.map(renderProductCard).join('')
      : '<p style="color:var(--white2);text-align:center;padding:3rem;grid-column:1/-1">No products in this category.</p>';
    initFadeIn();
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
  }
  document.querySelectorAll('.filter-btn').forEach(b => b.addEventListener('click', () => renderShop(b.dataset.cat)));
  renderShop(initCat); // immediate render from data.js

  // Patch from Firestore
  function patchShopFromFirestore() {
    if (!window.db) { setTimeout(patchShopFromFirestore, 600); return; }
    window.db.collection('products').get().then(snap => {
      if (snap.empty) return;
      const fsMap = {};
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.id !== undefined) fsMap[String(data.id)] = data;
        else fsMap[d.id] = data;
      });
      liveProducts = PRODUCTS.map(p => {
        const fs = fsMap[String(p.id)];
        if (!fs) return p;
        return { ...p,
          price:    fs.price    !== undefined ? fs.price    : p.price,
          oldPrice: fs.oldPrice !== undefined ? fs.oldPrice : p.oldPrice,
          inStock:  fs.inStock  !== undefined ? fs.inStock  : p.inStock
        };
      });
      renderShop(initCat);
    }).catch(() => {});
  }
  setTimeout(patchShopFromFirestore, 400);
})();

/* Product detail handled by product.html inline script */

/* Three.js 3D element removed */

/* ─── FADE-IN — bulletproof version ─── */
function initFadeIn() {
  // Mark all in-viewport elements visible immediately
  document.querySelectorAll('.fade-in:not(.visible)').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 300) el.classList.add('visible');
  });
  // Observe remaining off-screen elements
  if (!window._fadeObs) {
    window._fadeObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          window._fadeObs.unobserve(e.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px 200px 0px' });
  }
  document.querySelectorAll('.fade-in:not(.visible)').forEach(el => window._fadeObs.observe(el));
}

/* ─── AUTO FADE ─── */
function revealAll() {
  document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
}
// Add fade-in class to static section elements
document.querySelectorAll('.section, .term-block, .collab-card, .col-card, .about-inner').forEach(el => {
  if (!el.classList.contains('fade-in')) el.classList.add('fade-in');
});
// Run initFadeIn at multiple delays, then just reveal everything at 1.2s
setTimeout(initFadeIn, 80);
setTimeout(initFadeIn, 350);
setTimeout(initFadeIn, 700);
setTimeout(revealAll, 1200); // nuclear fallback — everything visible after 1.2s

window.addEventListener('scroll', initFadeIn, { passive: true });

// Also reveal on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => { setTimeout(initFadeIn, 100); setTimeout(revealAll, 1000); });

/* ─── NAVBAR ACTIVE LINK (scroll spy for index) ─── */
(function () {
  const links = document.querySelectorAll('.nav-link');
  if (!links.length) return;
  window.addEventListener('scroll', () => {
    const sections = ['home','featured','collections','collabs','about','terms'];
    let cur = '';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && window.scrollY >= el.offsetTop - 130) cur = id;
    });
    links.forEach(l => {
      const h = l.getAttribute('href') || '';
      l.classList.toggle('active', h === '#' + cur || (cur === 'home' && (h === 'index.html' || h === '#home')));
    });
  }, { passive: true });
})();

/* ─── SMOOTH ANCHOR SCROLL ─── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth' }); }
  });
});

/* ─── AUTH STATE ON LOAD ─── */
// Listen for Firebase auth state — fires on every page load once Firebase restores session
document.addEventListener('authStateChanged', (e) => {
  const user = e.detail?.user || null;
  updateNavUser(user);
  if (user) {
    Cart.loadFromCloud();
    // Hide login gate if showing
    const gate = document.getElementById('loginGate');
    if(gate) gate.classList.remove('open');
  } else {
    Cart.items = [];
    Cart.render();
    // Show login gate for new/guest visitors on main pages only
    const isMainPage = document.getElementById('featuredGrid') || document.getElementById('shopGrid');
    const gateShown = sessionStorage.getItem('st_gateShown');
    if(isMainPage && !gateShown) {
      setTimeout(showLoginGate, 800); // slight delay for page to render
    }
  }
});

/* ── LOGIN GATE — shown to first-time/logged-out visitors ── */
function showLoginGate(){
  sessionStorage.setItem('st_gateShown','1');
  // Inject gate HTML if not present
  if(document.getElementById('loginGate')) {
    document.getElementById('loginGate').classList.add('open');
    return;
  }
  const gate = document.createElement('div');
  gate.id = 'loginGate';
  gate.innerHTML = `
    <div class="lg-overlay"></div>
    <div class="lg-box">
      <div class="lg-brand">SELL<span>T</span>HEAD</div>
      <div class="lg-tagline">BUILT DIFFERENT. PERFORM BETTER.</div>
      <div class="lg-title">Welcome 👋</div>
      <div class="lg-sub">Sign in to shop, track orders, and get exclusive deals.</div>
      <div class="lg-actions">
        <button class="lg-btn-primary" onclick="document.getElementById('loginGate').classList.remove('open');openAuthModal('login')">LOGIN / REGISTER</button>
        <button class="lg-btn-ghost" onclick="document.getElementById('loginGate').classList.remove('open');sessionStorage.setItem('st_gateShown','forever')">Continue as Guest →</button>
      </div>
      <div class="lg-note">Already logged in? Your session will restore automatically.</div>
    </div>`;
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #loginGate { display:none; position:fixed; inset:0; z-index:9999; align-items:center; justify-content:center; }
    #loginGate.open { display:flex; }
    #loginGate .lg-overlay { position:absolute; inset:0; background:rgba(0,0,0,.75); backdrop-filter:blur(6px); }
    #loginGate .lg-box {
      position:relative; z-index:1;
      background:linear-gradient(145deg,rgba(16,10,28,.97),rgba(8,6,16,.99));
      border:1px solid rgba(255,255,255,.1); border-radius:24px;
      padding:2.8rem 2.4rem; width:100%; max-width:420px; text-align:center;
      box-shadow:0 0 80px rgba(232,28,28,.12),0 40px 80px rgba(0,0,0,.6);
      animation:lgSlideIn .4s cubic-bezier(.175,.885,.32,1.275);
    }
    @keyframes lgSlideIn { from{opacity:0;transform:translateY(30px) scale(.95)} to{opacity:1;transform:none} }
    #loginGate .lg-brand { font-family:'Bebas Neue',sans-serif; font-size:2.4rem; letter-spacing:4px; margin-bottom:.2rem; }
    #loginGate .lg-brand span { color:#e81c1c; }
    #loginGate .lg-tagline { font-size:.62rem; letter-spacing:4px; color:rgba(255,255,255,.3); margin-bottom:1.8rem; font-family:'Montserrat',sans-serif; font-weight:700; }
    #loginGate .lg-title { font-family:'Montserrat',sans-serif; font-size:1.3rem; font-weight:800; margin-bottom:.5rem; }
    #loginGate .lg-sub { font-size:.85rem; color:rgba(255,255,255,.55); margin-bottom:2rem; line-height:1.55; }
    #loginGate .lg-actions { display:flex; flex-direction:column; gap:.7rem; }
    #loginGate .lg-btn-primary { padding:.9rem; background:#e81c1c; color:#fff; border:none; border-radius:12px; font-family:'Montserrat',sans-serif; font-size:.88rem; font-weight:800; letter-spacing:.05em; cursor:pointer; transition:background .2s; }
    #loginGate .lg-btn-primary:hover { background:#b01010; }
    #loginGate .lg-btn-ghost { padding:.8rem; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.12); color:rgba(255,255,255,.65); border-radius:12px; font-family:'Montserrat',sans-serif; font-size:.82rem; font-weight:600; cursor:pointer; transition:all .2s; }
    #loginGate .lg-btn-ghost:hover { background:rgba(255,255,255,.1); color:#fff; }
    #loginGate .lg-note { font-size:.7rem; color:rgba(255,255,255,.25); margin-top:1.2rem; }
  `;
  document.head.appendChild(style);
  document.body.appendChild(gate);
  requestAnimationFrame(() => gate.classList.add('open'));
}

/* ─── HANDLE GOOGLE REDIRECT RESULT ON PAGE LOAD ─── */
async function tryHandleGoogleRedirect() {
  if (typeof Auth === 'undefined') return;
  const user = await Auth.handleGoogleRedirect();
  if (user) {
    showToast('Welcome, ' + (user.displayName || 'there') + '! 🔥');
    updateNavUser(user);
  }
}
// firebaseReady may have already fired before app.js loaded — check both ways
if (window.firebaseReady) {
  tryHandleGoogleRedirect();
} else {
  document.addEventListener('firebaseReady', tryHandleGoogleRedirect);
}
