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
    });
  }

  function formatPrice(amount) {
    return '$' + amount.toFixed(2);
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
    bindAddToCartButtons: bindAddToCartButtons
  };

  document.addEventListener('DOMContentLoaded', function () {
    updateCartBadges();
    bindAddToCartButtons();
  });
})();
