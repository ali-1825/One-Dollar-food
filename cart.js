(function () {
  const CART_KEY = 'dollarsFoodCart';
  const PLACEHOLDER_IMAGE =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="#FFF6E5"/><text x="48" y="54" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#241608">FOOD</text></svg>'
    );

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function sanitizeImageUrl(url) {
    const value = String(url || '').trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value) || value.startsWith('data:image/')) {
      return value;
    }
    return '';
  }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadges();
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }));
  }

  function getCartCount() {
    return getCart().reduce(function (sum, item) {
      return sum + item.quantity;
    }, 0);
  }

  function getCartTotal() {
    return getCart().reduce(function (sum, item) {
      return sum + item.price * item.quantity;
    }, 0);
  }

  function addToCart(product) {
    var cart = getCart();
    var existing = cart.find(function (item) {
      return item.id === product.id;
    });

    if (existing) {
      existing.quantity += product.quantity || 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: product.quantity || 1,
        image: product.image || '',
        description: product.description || '',
        options: product.options || []
      });
    }

    saveCart(cart);
    return cart;
  }

  function updateQuantity(id, delta) {
    var cart = getCart();
    var item = cart.find(function (entry) {
      return entry.id === id;
    });

    if (!item) return cart;

    item.quantity += delta;

    if (item.quantity <= 0) {
      cart = cart.filter(function (entry) {
        return entry.id !== id;
      });
    }

    saveCart(cart);
    return cart;
  }

  function removeFromCart(id) {
    var cart = getCart().filter(function (item) {
      return item.id !== id;
    });
    saveCart(cart);
    return cart;
  }

  function clearCart() {
    saveCart([]);
  }

  function updateCartBadges() {
    var count = getCartCount();
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = count;
      el.classList.toggle('hidden', count === 0);
      el.classList.add('flex');
    });
  }

  function formatPrice(amount) {
    return '$' + Number(amount || 0).toFixed(2);
  }

  function setActionLinkState(element, enabled) {
    if (!element) return;
    element.classList.toggle('opacity-50', !enabled);
    element.classList.toggle('pointer-events-none', !enabled);
    if (element.tagName === 'BUTTON') {
      element.disabled = !enabled;
    }
  }

  function buildOrderMessage(orderDetails) {
    var lines = [
      'NEW ORDER - Dollars Food',
      '------------------------',
      'Order Time: ' + new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })
    ];

    if (orderDetails.name) lines.push('Customer Name: ' + orderDetails.name);
    if (orderDetails.phone) lines.push('Phone Number: ' + orderDetails.phone);
    if (orderDetails.address) lines.push('Delivery Address: ' + orderDetails.address);
    lines.push('Payment: Cash on Delivery');

    if (orderDetails.items && orderDetails.items.length) {
      lines.push('', 'Ordered Items:');
      orderDetails.items.forEach(function (item, index) {
        lines.push(
          (index + 1) + '. ' + item.name +
          ' | Qty: ' + item.quantity +
          ' | ' + formatPrice(item.price * item.quantity)
        );
      });
    }

    var note = orderDetails.notes || orderDetails.note;
    if (note) lines.push('', 'Note: ' + note);

    if (orderDetails.total !== undefined) {
      lines.push('', 'Total Price: ' + formatPrice(orderDetails.total));
    }

    return lines.join('\n');
  }

  function buildWhatsAppOrderUrl(orderDetails) {
    var config = window.SiteConfig || { whatsapp: '923245972524' };
    var message = buildOrderMessage(orderDetails);
    return 'https://wa.me/' + config.whatsapp + '?text=' + encodeURIComponent(message);
  }

  function submitOrder(orderDetails, options) {
    options = options || {};
    var config = window.SiteConfig || { orderApiUrl: '/api/order' };
    var apiUrl = config.orderApiUrl || '/api/order';

    var payload = {
      customerName: orderDetails.name,
      phone: orderDetails.phone,
      address: orderDetails.address,
      items: (orderDetails.items || []).map(function (item) {
        return {
          id: item.id,
          quantity: item.quantity
        };
      }),
      paymentMethod: orderDetails.paymentMethod || 'Cash on Delivery',
      notes: orderDetails.notes || '',
      source: orderDetails.source || 'checkout',
      _honeypot: orderDetails._honeypot || ''
    };

    return fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        return response.text().then(function (text) {
          var data = {};
          try {
            data = text ? JSON.parse(text) : {};
          } catch (parseError) {
            data = { success: false, error: 'Invalid server response.' };
          }
          return { ok: response.ok, data: data };
        });
      })
      .then(function (result) {
        if (result.ok && result.data.success) {
          if (options.clearCart !== false) {
            clearCart();
          }
          return {
            success: true,
            orderId: result.data.orderId,
            message: result.data.message
          };
        }

        return {
          success: false,
          orderId: result.data.orderId,
          error: result.data.error || 'Could not place order.'
        };
      })
      .catch(function () {
        return {
          success: false,
          error: 'Could not reach order server. Please try again or call 0324 5972524.'
        };
      });
  }

  function bindAddToCartButtons() {
    document.querySelectorAll('[data-add-to-cart]').forEach(function (button) {
      if (button.dataset.bound === 'true') return;
      button.dataset.bound = 'true';

      button.addEventListener('click', function () {
        var dataset = button.dataset;
        var price = parseFloat(dataset.itemPrice);
        if (!Number.isFinite(price) || price <= 0) {
          price = 1;
        }

        addToCart({
          id: dataset.itemId,
          name: dataset.itemName,
          price: price,
          image: dataset.itemImage || '',
          description: dataset.itemDescription || ''
        });

        var original = button.innerHTML;
        button.disabled = true;
        button.innerHTML = 'ADDED!';
        setTimeout(function () {
          button.disabled = false;
          button.innerHTML = original;
        }, 1200);
      });
    });
  }

  function renderCartItemHtml(item) {
    var qty = String(item.quantity).padStart(2, '0');
    var imageUrl = sanitizeImageUrl(item.image) || PLACEHOLDER_IMAGE;
    var name = escapeHtml(item.name);
    var description = escapeHtml(item.description || '');

    return (
      '<div class="flex gap-4 items-start relative" data-cart-item="' + escapeHtml(item.id) + '">' +
      '<div class="w-24 h-24 neo-brutalist-card bg-white overflow-hidden shrink-0">' +
      '<img class="w-full h-full object-cover" alt="' + name + '" src="' + escapeHtml(imageUrl) + '" loading="lazy" decoding="async"/>' +
      '</div>' +
      '<div class="flex-1 min-w-0">' +
      '<div class="flex justify-between items-start gap-3">' +
      '<h3 class="font-headline-md text-headline-md leading-none mb-1 min-w-0 break-words">' + name.toUpperCase() + '</h3>' +
      '<span class="font-price-display text-price-display bg-secondary-container px-2 py-1 border-2 border-border-black rotate-3 shrink-0">' + formatPrice(item.price) + '</span>' +
      '</div>' +
      '<p class="font-body-md text-on-surface-variant text-sm mb-3 break-words">' + description + '</p>' +
      '<div class="flex flex-wrap items-center gap-4">' +
      '<div class="flex items-center border-2 border-border-black rounded-DEFAULT overflow-hidden">' +
      '<button type="button" class="px-2 py-1 bg-white hover:bg-surface-variant" data-qty-minus="' + escapeHtml(item.id) + '"><span class="material-symbols-outlined text-sm">remove</span></button>' +
      '<span class="px-4 font-label-mono" data-qty-display="' + escapeHtml(item.id) + '">' + qty + '</span>' +
      '<button type="button" class="px-2 py-1 bg-white hover:bg-surface-variant" data-qty-plus="' + escapeHtml(item.id) + '"><span class="material-symbols-outlined text-sm">add</span></button>' +
      '</div>' +
      '<button type="button" class="text-error font-label-mono text-xs uppercase" data-remove-item="' + escapeHtml(item.id) + '">Remove</button>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }

  function renderCartPage() {
    var listEl = document.getElementById('cart-items');
    var subtotalEl = document.getElementById('cart-subtotal');
    var totalEl = document.getElementById('cart-total');
    var checkoutBtn = document.getElementById('checkout-btn');
    if (!listEl) return;

    var cart = getCart();

    if (cart.length === 0) {
      listEl.innerHTML =
        '<div class="text-center py-12"><p class="font-headline-md mb-4">Your stash is empty!</p><a href="/menu" class="inline-block bg-primary text-white px-6 py-3 border-3 border-border-black neo-brutalist-btn font-display">Browse Menu</a></div>';
      if (subtotalEl) subtotalEl.textContent = '$0.00';
      if (totalEl) totalEl.textContent = '$0.00';
      setActionLinkState(checkoutBtn, false);
      return;
    }

    setActionLinkState(checkoutBtn, true);
    listEl.innerHTML = cart.map(renderCartItemHtml).join('');

    var total = getCartTotal();
    if (subtotalEl) subtotalEl.textContent = formatPrice(total);
    if (totalEl) totalEl.textContent = formatPrice(total);

    listEl.querySelectorAll('[data-qty-minus]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        updateQuantity(btn.getAttribute('data-qty-minus'), -1);
        renderCartPage();
      });
    });

    listEl.querySelectorAll('[data-qty-plus]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        updateQuantity(btn.getAttribute('data-qty-plus'), 1);
        renderCartPage();
      });
    });

    listEl.querySelectorAll('[data-remove-item]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        removeFromCart(btn.getAttribute('data-remove-item'));
        renderCartPage();
      });
    });
  }

  function renderCheckoutSummary() {
    var listEl = document.getElementById('checkout-items');
    var subtotalEl = document.getElementById('checkout-subtotal');
    var totalEl = document.getElementById('checkout-total');
    var confirmBtn = document.getElementById('confirm-btn');
    var mobileTotalEl = document.getElementById('checkout-mobile-total');
    var mobileCountEl = document.getElementById('checkout-mobile-count');
    if (!listEl) return;

    var cart = getCart();

    if (cart.length === 0) {
      listEl.innerHTML =
        '<p class="font-body-md text-on-surface-variant">No items in stash. <a href="/menu" class="text-primary underline">Add some food</a></p>';
      if (subtotalEl) subtotalEl.textContent = '$0.00';
      if (totalEl) totalEl.textContent = '$0.00';
      if (mobileTotalEl) mobileTotalEl.textContent = '$0.00';
      if (mobileCountEl) mobileCountEl.textContent = '0 items';
      setActionLinkState(confirmBtn, false);
      return;
    }

    setActionLinkState(confirmBtn, true);

    listEl.innerHTML = cart
      .map(function (item) {
        var imageUrl = sanitizeImageUrl(item.image) || PLACEHOLDER_IMAGE;
        var name = escapeHtml(item.name);
        return (
          '<div class="flex items-center gap-4">' +
          '<div class="w-20 h-20 border-3 border-border-black bg-background-cream relative flex-shrink-0 overflow-hidden">' +
          '<img class="w-full h-full object-cover" alt="' + name + '" src="' + escapeHtml(imageUrl) + '" loading="lazy" decoding="async"/>' +
          '</div>' +
          '<div class="flex-grow min-w-0">' +
          '<h3 class="font-headline-md text-body-lg uppercase leading-tight break-words">' + name + '</h3>' +
          '<p class="font-body-md text-on-surface-variant text-sm">Qty: ' + item.quantity + '</p>' +
          '</div>' +
          '<div class="bg-secondary-container border-3 border-border-black px-2 py-1 rotate-3 shrink-0">' +
          '<span class="font-price-display text-price-display">' + formatPrice(item.price * item.quantity) + '</span>' +
          '</div>' +
          '</div>'
        );
      })
      .join('');

    var total = getCartTotal();
    var count = getCartCount();
    if (subtotalEl) subtotalEl.textContent = formatPrice(total);
    if (totalEl) totalEl.textContent = formatPrice(total);
    if (mobileTotalEl) mobileTotalEl.textContent = formatPrice(total);
    if (mobileCountEl) mobileCountEl.textContent = count + (count === 1 ? ' item' : ' items');
  }

  function initCartOverlay() {
    var overlay = document.getElementById('cart-overlay');
    var backdrop = document.getElementById('cart-backdrop');
    var closeBtn = document.getElementById('close-cart');
    if (!overlay) return;

    function closeCartOverlay() {
      if (window.history.length > 1) {
        window.history.back();
        return;
      }
      window.location.href = '/menu';
    }

    if (backdrop) {
      backdrop.addEventListener('click', closeCartOverlay);
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', closeCartOverlay);
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeCartOverlay();
      }
    });
  }

  window.DollarsFoodCart = {
    getCart: getCart,
    saveCart: saveCart,
    getCartCount: getCartCount,
    getCartTotal: getCartTotal,
    addToCart: addToCart,
    updateQuantity: updateQuantity,
    removeFromCart: removeFromCart,
    clearCart: clearCart,
    updateCartBadges: updateCartBadges,
    formatPrice: formatPrice,
    buildOrderMessage: buildOrderMessage,
    buildWhatsAppOrderUrl: buildWhatsAppOrderUrl,
    submitOrder: submitOrder,
    bindAddToCartButtons: bindAddToCartButtons,
    renderCartPage: renderCartPage,
    renderCheckoutSummary: renderCheckoutSummary
  };

  window.addEventListener('cart-updated', function () {
    renderCartPage();
    renderCheckoutSummary();
  });

  document.addEventListener('DOMContentLoaded', function () {
    updateCartBadges();
    bindAddToCartButtons();
    renderCartPage();
    renderCheckoutSummary();
    initCartOverlay();
  });
})();
