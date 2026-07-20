(function () {
  const CART_KEY = 'dollarsFoodCart';

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
    return '$' + amount.toFixed(2);
  }

  function buildWhatsAppOrderUrl(orderDetails) {
    var config = window.SiteConfig || { whatsapp: '923211234567' };
    var lines = ['New order - Dollars Food'];
    if (orderDetails.name) lines.push('Name: ' + orderDetails.name);
    if (orderDetails.phone) lines.push('Phone: ' + orderDetails.phone);
    if (orderDetails.address) lines.push('Address: ' + orderDetails.address);
    lines.push('Payment: Cash on Delivery');
    if (orderDetails.items && orderDetails.items.length) {
      lines.push('Items:');
      orderDetails.items.forEach(function (item) {
        lines.push('- ' + item.name + ' x' + item.quantity + ' (' + formatPrice(item.price * item.quantity) + ')');
      });
    }
    if (orderDetails.total !== undefined) {
      lines.push('Total: ' + formatPrice(orderDetails.total));
    }
    return 'https://wa.me/' + config.whatsapp + '?text=' + encodeURIComponent(lines.join('\n'));
  }

  function bindAddToCartButtons() {
    document.querySelectorAll('[data-add-to-cart]').forEach(function (button) {
      button.addEventListener('click', function () {
        var dataset = button.dataset;
        addToCart({
          id: dataset.itemId,
          name: dataset.itemName,
          price: parseFloat(dataset.itemPrice),
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

  function renderCartPage() {
    var listEl = document.getElementById('cart-items');
    var subtotalEl = document.getElementById('cart-subtotal');
    var totalEl = document.getElementById('cart-total');
    var checkoutBtn = document.getElementById('checkout-btn');
    if (!listEl) return;

    var cart = getCart();

    if (cart.length === 0) {
      listEl.innerHTML = '<div class="text-center py-12"><p class="font-headline-md mb-4">Your stash is empty!</p><a href="Full menu.html" class="inline-block bg-primary text-white px-6 py-3 border-3 border-border-black neo-brutalist-btn font-display">Browse Menu</a></div>';
      if (subtotalEl) subtotalEl.textContent = '$0.00';
      if (totalEl) totalEl.textContent = '$0.00';
      if (checkoutBtn) checkoutBtn.classList.add('opacity-50', 'pointer-events-none');
      return;
    }

    if (checkoutBtn) checkoutBtn.classList.remove('opacity-50', 'pointer-events-none');

    listEl.innerHTML = cart.map(function (item) {
      var qty = String(item.quantity).padStart(2, '0');
      return '<div class="flex gap-4 items-start relative" data-cart-item="' + item.id + '">' +
        '<div class="w-24 h-24 neo-brutalist-card bg-white overflow-hidden shrink-0">' +
        '<img class="w-full h-full object-cover" alt="' + item.name + '" src="' + (item.image || '') + '"/>' +
        '</div>' +
        '<div class="flex-1">' +
        '<div class="flex justify-between items-start">' +
        '<h3 class="font-headline-md text-headline-md leading-none mb-1">' + item.name.toUpperCase() + '</h3>' +
        '<span class="font-price-display text-price-display bg-secondary-container px-2 py-1 border-2 border-border-black rotate-3">' + formatPrice(item.price) + '</span>' +
        '</div>' +
        '<p class="font-body-md text-on-surface-variant text-sm mb-3">' + (item.description || '') + '</p>' +
        '<div class="flex items-center gap-4">' +
        '<div class="flex items-center border-2 border-border-black rounded-DEFAULT overflow-hidden">' +
        '<button type="button" class="px-2 py-1 bg-white hover:bg-surface-variant" data-qty-minus="' + item.id + '"><span class="material-symbols-outlined text-sm">remove</span></button>' +
        '<span class="px-4 font-label-mono" data-qty-display="' + item.id + '">' + qty + '</span>' +
        '<button type="button" class="px-2 py-1 bg-white hover:bg-surface-variant" data-qty-plus="' + item.id + '"><span class="material-symbols-outlined text-sm">add</span></button>' +
        '</div>' +
        '<button type="button" class="text-error font-label-mono text-xs uppercase" data-remove-item="' + item.id + '">Remove</button>' +
        '</div>' +
        '</div>' +
        '</div>';
    }).join('');

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
    if (!listEl) return;

    var cart = getCart();

    if (cart.length === 0) {
      listEl.innerHTML = '<p class="font-body-md text-on-surface-variant">No items in stash. <a href="Full menu.html" class="text-primary underline">Add some food</a></p>';
      if (subtotalEl) subtotalEl.textContent = '$0.00';
      if (totalEl) totalEl.textContent = '$0.00';
      if (confirmBtn) confirmBtn.classList.add('opacity-50', 'pointer-events-none');
      return;
    }

    if (confirmBtn) confirmBtn.classList.remove('opacity-50', 'pointer-events-none');

    listEl.innerHTML = cart.map(function (item) {
      return '<div class="flex items-center gap-4">' +
        '<div class="w-20 h-20 border-3 border-border-black bg-background-cream relative flex-shrink-0 overflow-hidden">' +
        '<img class="w-full h-full object-cover" alt="' + item.name + '" src="' + (item.image || '') + '"/>' +
        '</div>' +
        '<div class="flex-grow">' +
        '<h3 class="font-headline-md text-body-lg uppercase leading-tight">' + item.name + '</h3>' +
        '<p class="font-body-md text-on-surface-variant text-sm">Qty: ' + item.quantity + '</p>' +
        '</div>' +
        '<div class="bg-secondary-container border-3 border-border-black px-2 py-1 rotate-3">' +
        '<span class="font-price-display text-price-display">' + formatPrice(item.price * item.quantity) + '</span>' +
        '</div>' +
        '</div>';
    }).join('');

    var total = getCartTotal();
    if (subtotalEl) subtotalEl.textContent = formatPrice(total);
    if (totalEl) totalEl.textContent = formatPrice(total);
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
    buildWhatsAppOrderUrl: buildWhatsAppOrderUrl,
    bindAddToCartButtons: bindAddToCartButtons,
    renderCartPage: renderCartPage,
    renderCheckoutSummary: renderCheckoutSummary
  };

  document.addEventListener('DOMContentLoaded', function () {
    updateCartBadges();
    bindAddToCartButtons();
    renderCartPage();
    renderCheckoutSummary();
  });
})();
