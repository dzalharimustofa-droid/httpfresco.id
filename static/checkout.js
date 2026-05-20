document.addEventListener('DOMContentLoaded', () => {
  const checkoutItems = document.getElementById('checkout-items');
  const checkoutTotal = document.getElementById('checkout-total');
  const cartDataInput = document.getElementById('cart_data');
  const checkoutForm = document.getElementById('checkout-form');

  const cart = JSON.parse(localStorage.getItem('frescofruits_cart') || '[]');

  function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value);
  }

  function renderCheckoutItems() {
    if (!checkoutItems) return;
    checkoutItems.innerHTML = '';

    if (!cart.length) {
      checkoutItems.innerHTML = '<p class="cart-empty">Keranjang Anda kosong. Tambahkan produk terlebih dahulu.</p>';
      const submitBtn = checkoutForm?.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    cart.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <p>${formatCurrency(item.price)} x ${item.quantity}</p>
          <p>Subtotal: ${formatCurrency(item.price * item.quantity)}</p>
        </div>
      `;
      checkoutItems.appendChild(div);
    });

    const submitBtn = checkoutForm?.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = false;
  }

  function updateCheckoutTotal() {
    if (!checkoutTotal) return;
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    checkoutTotal.textContent = formatCurrency(total);
    if (cartDataInput) cartDataInput.value = JSON.stringify(cart);
  }

  checkoutForm?.addEventListener('submit', (event) => {
    if (!cart.length) {
      event.preventDefault();
      alert('Keranjang kosong. Tambahkan produk terlebih dahulu.');
    }
  });

  renderCheckoutItems();
  updateCheckoutTotal();
});

