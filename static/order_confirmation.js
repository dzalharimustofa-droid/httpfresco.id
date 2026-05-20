document.addEventListener('DOMContentLoaded', () => {
  const confirmationItems = document.getElementById('confirmation-items');
  const totalElement = document.getElementById('confirmation-total');

  // cartData injected by template (as JSON script)
  let cartData = [];
  try {
    const el = document.getElementById('__CART_DATA__');
    cartData = el ? JSON.parse(el.textContent || '[]') : [];
  } catch (e) {
    cartData = [];
  }


  function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value);
  }

  if (!Array.isArray(cartData) || !cartData.length) {
    if (confirmationItems) {
      confirmationItems.innerHTML = '<p class="cart-empty">Tidak ada produk di ringkasan pesanan.</p>';
    }
    if (totalElement) totalElement.textContent = formatCurrency(0);
    return;
  }

  let total = 0;

  cartData.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    const subtotal = item.price * item.quantity;
    total += subtotal;

    div.innerHTML = `
      <div class="cart-item-details">
        <h4>${item.name}</h4>
        <p>${formatCurrency(item.price)} x ${item.quantity}</p>
        <p>Subtotal: ${formatCurrency(subtotal)}</p>
      </div>
    `;

    confirmationItems?.appendChild(div);
  });

  if (totalElement) totalElement.textContent = formatCurrency(total);
});

