/* SELLTHEAD — orders.js v5 — Amazon-style */
(function () {
  const listEl   = document.getElementById('ordersList');
  const noOrders = document.getElementById('noOrders');
  const prompt   = document.getElementById('ordersLoginPrompt');
  const content  = document.getElementById('ordersContent');
  if (!listEl) return;

  const STATUS_COLORS = {
    'Pending':         '#f59e0b',
    'Confirmed':       '#22c55e',
    'Processing':      '#3b82f6',
    'Packed':          '#8b5cf6',
    'Shipped':         '#a855f7',
    'Out for Delivery':'#f97316',
    'Delivered':       '#22c55e',
    'Cancelled':       '#ef4444'
  };

  const TRACK_STEPS = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

  let allOrders = [];
  let activeFilter = 'all';

  function getTrackIndex(status) {
    const idx = TRACK_STEPS.indexOf(status);
    return idx === -1 ? 0 : idx;
  }

  function renderTracker(status) {
    if (status === 'Cancelled') return `<div style="color:#e74c3c;font-size:.82rem;padding:.5rem 0">❌ Order Cancelled</div>`;
    const currentIdx = getTrackIndex(status);
    return `
      <div class="order-tracking">
        <div class="order-track-label">ORDER PROGRESS</div>
        <div class="track-steps">
          ${TRACK_STEPS.map((step, i) => `
            <div class="track-step ${i < currentIdx ? 'done' : ''} ${i === currentIdx ? 'active' : ''}">
              <div class="track-step-dot"></div>
              <div class="track-line"></div>
              <div class="track-step-label">${step.toUpperCase()}</div>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  function renderOrderCard(o) {
    const date   = o.date ? new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';
    const color  = STATUS_COLORS[o.status] || '#888';
    const items  = Array.isArray(o.items) ? o.items : [];
    const waMsg  = encodeURIComponent(`Hi! I want to track my order.\n\nOrder ID: ${o.id}\nDate: ${date}\nTotal: ₹${(o.total||0).toLocaleString('en-IN')}`);

    return `
      <div class="order-card-v2 fade-in">
        <div class="order-card-head">
          <div class="order-card-meta">
            <div class="order-card-meta-label">ORDER PLACED</div>
            <div class="order-card-meta-val">${date}</div>
          </div>
          <div class="order-card-meta">
            <div class="order-card-meta-label">TOTAL</div>
            <div class="order-card-meta-val">₹${(o.total||0).toLocaleString('en-IN')}</div>
          </div>
          <div class="order-card-meta">
            <div class="order-card-meta-label">SHIP TO</div>
            <div class="order-card-meta-val">${o.delivery ? o.delivery.fname + ' ' + (o.delivery.lname||'') : 'N/A'}</div>
          </div>
          <div class="order-card-meta" style="flex:1.5">
            <div class="order-card-meta-label">ORDER ID</div>
            <div class="order-card-meta-val" style="font-size:.82rem">#${o.id}</div>
          </div>
          <span class="order-status-badge" style="background:${color}20;color:${color};border:1px solid ${color}40">${o.status}</span>
        </div>

        <div class="order-card-body">
          ${items.length ? items.map(item => `
            <div class="order-item-row">
              <img class="order-item-img" src="${item.image || 'images/products_ref.png'}" alt="${item.title}" onerror="this.style.background='#0a0812';this.src=''" />
              <div class="order-item-info">
                <div class="order-item-name">${item.title}</div>
                <div class="order-item-meta">Size: ${item.size} &nbsp;·&nbsp; Qty: ${item.qty}</div>
              </div>
              <div class="order-item-price">₹${(item.price * item.qty).toLocaleString('en-IN')}</div>
            </div>
          `).join('') : `<div class="order-item-row"><div class="order-item-name" style="color:var(--white2)">Order items unavailable</div></div>`}
        </div>

        ${renderTracker(o.status)}

        <div class="order-card-foot">
          <div class="order-total-label">Total Paid: ₹${(o.total||0).toLocaleString('en-IN')}</div>
          <div class="order-card-actions">
            <a href="https://wa.me/917568521210?text=${waMsg}" class="btn-track" target="_blank">📦 TRACK</a>
            <a href="shop.html" class="btn-reorder">🔁 BUY AGAIN</a>
          </div>
        </div>
      </div>`;
  }

  function applyFilter(filter) {
    activeFilter = filter;
    document.querySelectorAll('.orders-tab').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
    const filtered = filter === 'all' ? allOrders : allOrders.filter(o => o.status === filter);
    if (!filtered.length) {
      listEl.innerHTML = `<div class="no-orders"><p>No ${filter === 'all' ? '' : filter.toLowerCase() + ' '}orders found.</p><a href="shop.html" class="btn-red btn-sm">SHOP NOW</a></div>`;
    } else {
      listEl.innerHTML = filtered.map(renderOrderCard).join('');
      if (typeof initFadeIn === 'function') initFadeIn();
    }
  }

  async function render() {
    if (!Auth.isLoggedIn()) {
      if (prompt)  prompt.style.display  = 'block';
      if (content) content.style.display = 'none';
      return;
    }
    if (prompt)  prompt.style.display  = 'none';
    if (content) content.style.display = 'block';

    listEl.innerHTML = '<div class="orders-loading">⏳ Loading your orders...</div>';
    allOrders = await Auth.getUserOrders();

    if (!allOrders.length) {
      noOrders?.classList.remove('hidden');
      listEl.innerHTML = '';
      return;
    }
    noOrders?.classList.add('hidden');
    applyFilter(activeFilter);
  }

  // Filter tab clicks
  document.addEventListener('click', e => {
    const tab = e.target.closest('.orders-tab');
    if (tab && tab.dataset.filter) applyFilter(tab.dataset.filter);
  });

  document.addEventListener('authStateChanged', render);
  document.addEventListener('refreshOrders', render);
  render();
})();
