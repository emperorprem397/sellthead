// checkout.js — Order placement, UPI payment, discount codes

(function() {
  // ── State ────────────────────────────────────────────────
  let currentStep = 1;
  let orderData = {};
  window._orderData = orderData; // expose for per-app UPI buttons
  let appliedDiscount = null;   // { code, percent }
  let discountApplied = false;  // Prevent applying twice

  // ── Cart Reader (works without app.js) ───────────────────
  function getCart() {
    // Try Cart object (if app.js is loaded), else read localStorage directly
    if (typeof Cart !== 'undefined' && Cart.getItems) return Cart.getItems();
    try {
      return JSON.parse(localStorage.getItem('sh_cart') || '[]');
    } catch(e) { return []; }
  }

  function clearCart() {
    if (typeof Cart !== 'undefined' && Cart.clear) { Cart.clear(); return; }
    localStorage.removeItem('sh_cart');
  }

  // Live discount codes — loaded from Firestore discountCodes collection.
  // Falls back to this static map only if Firestore is unreachable.
  let LIVE_DISCOUNT_CODES = null; // null = not loaded yet, {} = loaded (possibly empty)
  const FALLBACK_DISCOUNT_CODES = {
    'PRATIK10':   10,
    'PRIYANSH10': 10,
    'DISHANT10':  10,
    'SAURABH10':  10,
    'SAMAR10':    10,
    'PRINCE10':   10
  };

  async function loadLiveDiscountCodes() {
    try {
      if (!window.db) { LIVE_DISCOUNT_CODES = { ...FALLBACK_DISCOUNT_CODES }; return; }
      const snap = await window.db.collection('discountCodes').get();
      const codes = {};
      snap.forEach(doc => {
        const data = doc.data() || {};
        const activeVal = data.active;
        const isActive = !(activeVal === false || activeVal === 'false' || activeVal === 0);
        if (!isActive) return; // skip deactivated codes
        const percent = Number(data.discount);
        if (!isNaN(percent)) codes[doc.id.toUpperCase()] = percent;
      });
      LIVE_DISCOUNT_CODES = codes;
    } catch (e) {
      LIVE_DISCOUNT_CODES = { ...FALLBACK_DISCOUNT_CODES };
    }
  }

  // ── Init ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    renderCheckoutItems();
    initStepButtons();
    initDiscountCode();
    loadLiveDiscountCodes();
    Auth.handleRedirectResult && Auth.handleRedirectResult();
  });

  // ── Cart Items Display ───────────────────────────────────
  function renderCheckoutItems() {
    const cart = getCart();
    const container = document.getElementById('checkoutItemsList');
    const cartCountEl = document.getElementById('cartCount');
    
    if (!container) return;
    
    // Update cart count in navbar
    if (cartCountEl) cartCountEl.textContent = cart.length;
    
    if (!cart || !cart.length) {
      container.innerHTML = '<p style="color:#888;text-align:center;padding:20px">Your cart is empty.</p>';
      updateOrderTotal(0);
      return;
    }
    
    let subtotal = 0;
    let html = '';
    
    cart.forEach(item => {
      const price = Number(item.price) || 0;
      const qty = Number(item.qty) || 1;
      const lineTotal = price * qty;
      subtotal += lineTotal;
      
      html += `<div class="checkout-item">
        <div class="checkout-item-info">
          <div class="checkout-item-name">${item.name || item.title || 'Product'}</div>
          <div class="checkout-item-meta">${item.size ? 'Size: ' + item.size + ' · ' : ''}Qty: ${qty}</div>
        </div>
        <div class="checkout-item-price">₹${lineTotal.toLocaleString('en-IN')}</div>
      </div>`;
    });
    
    container.innerHTML = html;
    updateOrderTotal(subtotal);  // Pass the accumulated subtotal
  }

  // ── Order Total ──────────────────────────────────────────
  function getCartSubtotal() {
    const cart = getCart();
    if (!cart || !cart.length) return 0;
    return cart.reduce((s, item) => {
      const price = Number(item.price) || 0;
      const qty = Number(item.qty) || 1;
      return s + (price * qty);
    }, 0);
  }

  function updateOrderTotal(subtotal) {
    // Ensure we have a valid subtotal
    subtotal = Number(subtotal) || 0;
    if (subtotal <= 0) subtotal = getCartSubtotal();
    
    const subtotalEl = document.getElementById('checkoutSubtotal');
    const discountEl = document.getElementById('checkoutDiscount');
    const discountRow = document.getElementById('discountRow');
    const totalEl = document.getElementById('checkoutTotal');
    const payTotalEl = document.getElementById('payTotal');
    const fallbackAmountEl = document.getElementById('fallbackAmount');

    if (subtotalEl) subtotalEl.textContent = '₹' + subtotal.toLocaleString('en-IN');

    let finalTotal = subtotal;
    let discountAmount = 0;
    
    if (appliedDiscount && appliedDiscount.percent > 0) {
      discountAmount = Math.floor(subtotal * appliedDiscount.percent / 100);
      finalTotal = subtotal - discountAmount;
      
      // Never let final total drop to 0 or below
      if (finalTotal < 1) finalTotal = 1;
      
      if (discountEl) discountEl.textContent = '−₹' + discountAmount.toLocaleString('en-IN');
      if (discountRow) discountRow.style.display = 'flex';
    } else {
      if (discountRow) discountRow.style.display = 'none';
    }

    if (totalEl) totalEl.textContent = '₹' + finalTotal.toLocaleString('en-IN');
    if (payTotalEl) payTotalEl.textContent = '₹' + finalTotal.toLocaleString('en-IN');
    if (fallbackAmountEl) fallbackAmountEl.textContent = finalTotal.toLocaleString('en-IN');
    
    orderData.total = finalTotal;
    orderData.subtotal = subtotal;
    return finalTotal;
  }

  // ── Discount Code ────────────────────────────────────────
  function initDiscountCode() {
    const applyBtn = document.getElementById('applyDiscountBtn');
    const discountInput = document.getElementById('discountCodeInput');
    if (!applyBtn || !discountInput) return;

    applyBtn.addEventListener('click', async () => {
      const code = discountInput.value.trim().toUpperCase();
      const msgEl = document.getElementById('discountMsg');

      if (!code) {
        showDiscountMsg('Enter a discount code.', 'error');
        return;
      }

      if (discountApplied) {
        showDiscountMsg('A discount is already applied. Remove it first.', 'error');
        return;
      }

      if (LIVE_DISCOUNT_CODES === null) {
        applyBtn.disabled = true;
        const prevText = applyBtn.textContent;
        applyBtn.textContent = 'Checking...';
        await loadLiveDiscountCodes();
        applyBtn.disabled = false;
        applyBtn.textContent = prevText;
      }

      const codes = LIVE_DISCOUNT_CODES || FALLBACK_DISCOUNT_CODES;

      if (codes[code] !== undefined) {
        const percent = codes[code];
        appliedDiscount = { code, percent };
        discountApplied = true;

        const subtotal = getCartSubtotal();
        const discountAmount = Math.floor(subtotal * percent / 100);
        const finalTotal = Math.max(subtotal - discountAmount, 1);

        updateOrderTotal(subtotal);
        showDiscountMsg(`✓ Code "${code}" applied! −${percent}% (−₹${discountAmount})`, 'success');

        // Show remove button
        applyBtn.textContent = 'Remove';
        applyBtn.onclick = removeDiscount;
        discountInput.disabled = true;

        orderData.discountCode = code;
        orderData.discountPercent = percent;
      } else {
        showDiscountMsg('Invalid discount code.', 'error');
      }
    });
  }

  function removeDiscount() {
    appliedDiscount = null;
    discountApplied = false;
    orderData.discountCode = null;
    orderData.discountPercent = 0;

    const discountInput = document.getElementById('discountCodeInput');
    const applyBtn = document.getElementById('applyDiscountBtn');
    const discountRow = document.getElementById('discountRow');

    if (discountInput) { discountInput.value = ''; discountInput.disabled = false; }
    if (discountRow) discountRow.style.display = 'none';
    if (applyBtn) {
      applyBtn.textContent = 'Apply';
      applyBtn.onclick = null;
      initDiscountCode();
    }

    updateOrderTotal(getCartSubtotal());
    showDiscountMsg('Discount removed.', 'info');
  }

  function showDiscountMsg(msg, type) {
    const el = document.getElementById('discountMsg');
    if (!el) return;
    el.textContent = msg;
    el.style.color = type === 'success' ? '#00cc88' : type === 'error' ? '#e81c1c' : '#888';
    el.style.display = 'block';
  }

  // ── Steps ────────────────────────────────────────────────
  function initStepButtons() {
    const nextBtns = document.querySelectorAll('[data-next-step]');
    const backBtns = document.querySelectorAll('[data-back-step]');
    nextBtns.forEach(btn => btn.addEventListener('click', () => goToStep(parseInt(btn.dataset.nextStep))));
    backBtns.forEach(btn => btn.addEventListener('click', () => goToStep(parseInt(btn.dataset.backStep))));
  }

  function goToStep(step) {
    // Validate when LEAVING a step, not when entering
    if (step === 3 && !validateDetails()) return;   // leaving step 2 → validate contact info
    if (step === 3 && !validateAddress()) return;   // also validate address before payment
    currentStep = step;
    document.querySelectorAll('.checkout-step').forEach(s => s.classList.remove('active'));
    const stepEl = document.getElementById('step' + step);
    if (stepEl) stepEl.classList.add('active');
    // Update step dots
    document.querySelectorAll('.step-dot').forEach((dot, i) => {
      dot.classList.remove('active', 'done');
      if (i + 1 < step) dot.classList.add('done');
      else if (i + 1 === step) dot.classList.add('active');
    });
    if (step === 3) preparePayment();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function validateDetails() {
    const name = document.getElementById('custName')?.value.trim();
    const email = document.getElementById('custEmail')?.value.trim();
    const phone = document.getElementById('custPhone')?.value.trim();
    if (!name || !email || !phone) {
      alert('Please fill in all contact details.');
      return false;
    }
    if (!/^\d{10}$/.test(phone)) {
      alert('Please enter a valid 10-digit phone number.');
      return false;
    }
    orderData.customerName = name;
    orderData.email = email;
    orderData.phone = phone;
    return true;
  }

  function validateAddress() {
    const addr = document.getElementById('custAddress')?.value.trim();
    const city = document.getElementById('custCity')?.value.trim();
    const pin = document.getElementById('custPincode')?.value.trim();
    if (!addr || !city || !pin) {
      alert('Please fill in all address fields.');
      return false;
    }
    if (!/^\d{6}$/.test(pin)) {
      alert('Please enter a valid 6-digit PIN code.');
      return false;
    }
    orderData.address = `${addr}, ${city} - ${pin}`;
    return true;
  }

  // ── Payment ──────────────────────────────────────────────
  function preparePayment() {
    const subtotal = getCartSubtotal();
    const finalTotal = updateOrderTotal(subtotal);
    const totalEl = document.getElementById('payAmountDisplay');
    if (totalEl) totalEl.textContent = '₹' + finalTotal.toLocaleString('en-IN');
  }

  // UPI payment button — called from HTML
  window.openUPI = function() {
    const total = orderData.total || getCartSubtotal();
    window._lastUpiTotal = total; // expose for per-app buttons
    const upiId = '7568521210-fb34-2@ybl';
    const name = encodeURIComponent('SELLTHEAD');
    const note = encodeURIComponent('SELLTHEAD Order');
    const amt = encodeURIComponent(total);
    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${name}&tn=${note}&am=${amt}&cu=INR`;
    window.location.href = upiLink;
    // Show fallback after 2.5s
    setTimeout(() => {
      const fb = document.getElementById('upiFailback');
      if (fb) fb.style.display = 'block';
    }, 2500);
  };

  // ── Place Order ──────────────────────────────────────────
  window.confirmOrder = async function() {
    const cart = getCart();
    if (!cart.length) { alert('Cart is empty.'); return; }

    const user = firebase.auth().currentUser;
    const subtotal = getCartSubtotal();
    const finalTotal = updateOrderTotal(subtotal);

    const order = {
      ...orderData,
      userId: user ? user.uid : 'guest',
      items: cart.map(i => ({
        id: i.id,
        name: i.name || i.title,
        price: Number(i.price),
        qty: Number(i.qty) || 1,
        size: i.size || ''
      })),
      subtotal: subtotal,
      discountCode: appliedDiscount ? appliedDiscount.code : null,
      discountPercent: appliedDiscount ? appliedDiscount.percent : 0,
      total: finalTotal,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      const docRef = await firebase.firestore().collection('orders').add(order);

      // Clear cart
      clearCart();

      // WhatsApp notification
      sendWhatsAppNotification(order, docRef.id);

      // Show success
      showOrderSuccess(docRef.id, finalTotal);
    } catch (e) {
      alert('Order failed: ' + e.message);
    }
  };

  function sendWhatsAppNotification(order, orderId) {
    const itemList = order.items.map(i => `• ${i.name} (${i.size || 'N/A'}) x${i.qty} = ₹${i.price * i.qty}`).join('\n');
    const discount = order.discountCode ? `\nDiscount (${order.discountCode}): -${order.discountPercent}%` : '';
    const msg = `🛒 *NEW ORDER — SELLTHEAD*\n\nOrder ID: ${orderId.slice(0,10)}\nCustomer: ${order.customerName}\nPhone: ${order.phone}\nEmail: ${order.email}\nAddress: ${order.address}\n\nItems:\n${itemList}${discount}\n\n*Total: ₹${order.total}*\n\nStatus: PENDING`;
    const waUrl = `https://wa.me/917568521210?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  }

  function showOrderSuccess(orderId, total) {
    const successEl = document.getElementById('orderSuccess');
    const stepEl = document.getElementById('step3');
    const paymentBtns = document.getElementById('paymentBtns');
    const upiBtn = document.querySelector('[onclick="openUPI()"]');
    const confirmBtn = document.querySelector('[onclick="confirmOrder()"]');
    
    if (paymentBtns) paymentBtns.style.display = 'none';
    if (upiBtn) upiBtn.style.display = 'none';
    if (confirmBtn) confirmBtn.parentElement.style.display = 'none';
    if (successEl) successEl.style.display = 'block';
    
    const idEl = document.getElementById('successOrderId');
    if (idEl) idEl.textContent = orderId.slice(0, 12) + '...';
    const totalEl = document.getElementById('successTotal');
    if (totalEl) totalEl.textContent = '₹' + total.toLocaleString('en-IN');
  }

  // Expose goToStep globally so onclick="goToStep(N)" in HTML works
  window.goToStep = goToStep;
})();
