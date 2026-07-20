(function () {
  var LAST_ORDER_KEY = 'dollarsFoodLastOrder';
  var PLACEHOLDER_IMAGE =
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
    var value = String(url || '').trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value) || value.startsWith('data:image/')) {
      return value;
    }
    return '';
  }

  function formatPrice(amount) {
    return '$' + Number(amount || 0).toFixed(2);
  }

  function formatTime(isoString) {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleTimeString('en-PK', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Karachi'
      });
    } catch {
      return '—';
    }
  }

  function getOrderIdFromUrl() {
    return new URLSearchParams(window.location.search).get('id') || '';
  }

  function loadStoredOrder() {
    try {
      return JSON.parse(localStorage.getItem(LAST_ORDER_KEY)) || null;
    } catch {
      return null;
    }
  }

  function getStatusStep(status) {
    if (status === 'confirmed') return 2;
    if (status === 'cancelled') return -1;
    return 1;
  }

  function renderTimeline(step, status) {
    var steps = document.querySelectorAll('[data-track-step]');
    steps.forEach(function (el) {
      var stepNum = parseInt(el.getAttribute('data-track-step'), 10);
      var iconWrap = el.querySelector('[data-step-icon]');
      var label = el.querySelector('[data-step-label]');
      var time = el.querySelector('[data-step-time]');
      var check = el.querySelector('[data-step-check]');

      el.classList.remove('opacity-40');

      if (status === 'cancelled') {
        if (stepNum === 1) {
          el.classList.add('opacity-40');
        } else if (stepNum === 4) {
          el.classList.remove('opacity-40');
          if (label) {
            label.textContent = 'Cancelled';
            label.classList.add('text-error');
          }
          if (time) time.textContent = 'Contact us if needed';
        } else {
          el.classList.add('opacity-40');
        }
        return;
      }

      if (stepNum < step) {
        if (iconWrap) {
          iconWrap.className =
            'w-16 h-16 rounded-full bg-tertiary-fixed neo-border flex items-center justify-center relative';
        }
        if (check) check.classList.remove('hidden');
      } else if (stepNum === step) {
        if (iconWrap) {
          iconWrap.className =
            'w-20 h-20 rounded-full bg-secondary-container neo-border flex items-center justify-center relative animate-pulse-green';
        }
        if (check) check.classList.add('hidden');
        if (label) label.classList.add('text-primary');
      } else {
        el.classList.add('opacity-40');
        if (check) check.classList.add('hidden');
        if (iconWrap) {
          iconWrap.className =
            'w-16 h-16 rounded-full bg-surface-variant neo-border flex items-center justify-center';
        }
      }
    });
  }

  function renderItems(items) {
    var listEl = document.getElementById('order-items-list');
    var countEl = document.getElementById('order-item-count');
    if (!listEl) return;

    if (!items || !items.length) {
      listEl.innerHTML =
        '<li class="font-body-md text-on-surface-variant py-4">No items found for this order.</li>';
      if (countEl) countEl.textContent = '0 Items';
      return;
    }

    var totalQty = items.reduce(function (sum, item) {
      return sum + (item.quantity || 0);
    }, 0);

    if (countEl) {
      countEl.textContent = totalQty + (totalQty === 1 ? ' Item' : ' Items');
    }

    listEl.innerHTML = items
      .map(function (item) {
        var imageUrl = sanitizeImageUrl(item.image) || PLACEHOLDER_IMAGE;
        var name = escapeHtml(item.name);
        var qty = item.quantity || 1;
        var lineTotal = item.lineTotal != null ? item.lineTotal : (item.price || item.unitPrice || 0) * qty;

        return (
          '<li class="flex justify-between items-center border-b-[1.5px] border-black pb-4">' +
          '<div class="flex items-center gap-4 min-w-0">' +
          '<div class="w-12 h-12 bg-secondary-fixed neo-border p-1 shrink-0">' +
          '<img class="w-full h-full object-cover" alt="' + name + '" src="' + escapeHtml(imageUrl) + '" loading="lazy" decoding="async"/>' +
          '</div>' +
          '<div class="min-w-0">' +
          '<p class="font-headline-md text-sm break-words">' + name + '</p>' +
          '<p class="font-label-mono text-xs">x' + qty + '</p>' +
          '</div>' +
          '</div>' +
          '<span class="font-price-display text-sm shrink-0">' + formatPrice(lineTotal) + '</span>' +
          '</li>'
        );
      })
      .join('');
  }

  function showEmptyState() {
    var main = document.querySelector('main');
    if (!main) return;

    main.innerHTML =
      '<div class="max-w-xl mx-auto text-center py-20">' +
      '<div class="inline-flex items-center gap-2 px-4 py-2 bg-secondary-container neo-border neo-shadow mb-6">' +
      '<span class="material-symbols-outlined text-primary">receipt_long</span>' +
      '<span class="font-label-mono text-label-mono uppercase">No Order Found</span>' +
      '</div>' +
      '<h1 class="font-display text-headline-lg-mobile md:text-headline-lg uppercase mb-4">Order Not Available</h1>' +
      '<p class="font-body-md text-on-surface-variant mb-8">Place an order first, or open the link from your order confirmation.</p>' +
      '<div class="flex flex-col sm:flex-row gap-4 justify-center">' +
      '<a class="py-4 px-8 neo-border neo-shadow bg-primary text-on-primary font-display uppercase hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all" href="Full menu.html">Browse Menu</a>' +
      '<a class="py-4 px-8 neo-border neo-shadow bg-surface font-display uppercase hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all" href="Main Page.html">Back Home</a>' +
      '</div>' +
      '</div>';
  }

  function renderOrderPage(order) {
    var orderIdEl = document.getElementById('order-id-display');
    var etaEl = document.getElementById('order-eta');
    var statusBadge = document.getElementById('live-status-badge');
    var totalEl = document.getElementById('order-total');
    var addressEl = document.getElementById('order-address');
    var paymentEl = document.getElementById('order-payment');
    var placedTimeEl = document.getElementById('step-time-placed');
    var kitchenTimeEl = document.getElementById('step-time-kitchen');

    if (orderIdEl) orderIdEl.textContent = 'Order #' + order.id;
    document.title = 'Order ' + order.id + ' | Dollars Food';

    var status = order.status || 'received';
    var step = getStatusStep(status);

    if (etaEl) {
      if (status === 'cancelled') {
        etaEl.textContent = 'This order was cancelled';
      } else if (status === 'confirmed') {
        etaEl.textContent = 'Confirmed — preparing your order';
      } else {
        etaEl.textContent = 'Restaurant will confirm shortly';
      }
    }

    if (statusBadge) {
      statusBadge.textContent =
        status === 'confirmed'
          ? 'Order Confirmed'
          : status === 'cancelled'
            ? 'Order Cancelled'
            : 'Order Received';
    }

    if (placedTimeEl) placedTimeEl.textContent = formatTime(order.createdAt);
    if (kitchenTimeEl) {
      kitchenTimeEl.textContent = status === 'confirmed' ? formatTime(order.updatedAt) : '—';
    }

    renderTimeline(step, status);
    renderItems(order.items);

    if (totalEl) totalEl.textContent = formatPrice(order.total);
    if (addressEl) addressEl.textContent = order.address || order.customer?.address || '—';
    if (paymentEl) paymentEl.textContent = order.paymentMethod || 'Cash on Delivery';

    var supportLink = document.getElementById('support-link');
    if (supportLink && window.SiteConfig) {
      var message =
        'Hi Dollars Food, I need help with my order ' +
        order.id +
        '.';
      supportLink.href =
        'https://wa.me/' +
        window.SiteConfig.whatsapp +
        '?text=' +
        encodeURIComponent(message);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var urlOrderId = getOrderIdFromUrl();
    var stored = loadStoredOrder();

    if (!stored || (urlOrderId && stored.id !== urlOrderId)) {
      showEmptyState();
      return;
    }

    renderOrderPage(stored);

    if (window.DollarsFoodCart) {
      window.DollarsFoodCart.updateCartBadges();
    }
  });
})();
