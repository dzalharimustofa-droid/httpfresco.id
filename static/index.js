(() => {
  const priceRange = document.getElementById('price-range');
  const priceValue = document.getElementById('price-value');
  const searchInput = document.getElementById('search-input');
  const mobileSearchInput = document.getElementById('mobile-search-input');
  const filterInputs = Array.from(
    document.querySelectorAll('.filter-list input[type="checkbox"]')
  ) || [];

  const cartButton = document.getElementById('cart-button');
  const mobileCartButton = document.getElementById('mobile-cart-button');
  const cartModal = document.getElementById('cartModal');
  const cartItemsContainer = document.getElementById('cart-items');
  const cartTotalBoard = document.getElementById('cart-total');
  const cartCount = document.getElementById('cart-count');
  const mobileCartCount = document.getElementById('mobile-cart-count');

  const newsletterInput = document.querySelector('.newsletter-input');
  const newsletterBtn = document.querySelector('.newsletter-btn');
  const shopButton = document.getElementById('btn-shop');

  const addButtons = Array.from(document.querySelectorAll('.btn-add')) || [];

  const STORAGE_KEY = 'frescofruits_cart';
  const cart = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

  function formatCurrency(value) {
    const number = Number(value) || 0;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(number);
  }

  function updatePriceValue() {
    if (!priceValue || !priceRange) return;
    priceValue.textContent = `Rp0 - ${formatCurrency(priceRange.value)}`;
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    if (cartCount) cartCount.textContent = count;
    if (mobileCartCount) mobileCartCount.textContent = count;
  }

  function renderCart() {
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = '';

    if (!cart.length) {
      cartItemsContainer.innerHTML = '<p class="cart-empty">Keranjang Anda kosong.</p>';
      if (cartTotalBoard) cartTotalBoard.textContent = formatCurrency(0);
      return;
    }

    cart.forEach((item) => {
      const cartItem = document.createElement('div');
      cartItem.className = 'cart-item';
      cartItem.innerHTML = `
        <img src="${item.image_url || ''}" alt="${item.name}">
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <p>${formatCurrency(item.price)} / ${item.unit || ''}</p>
          <div class="cart-item-meta">
            <input type="number" min="1" class="cart-qty" value="${item.quantity || 1}" data-name="${item.name}">
            <button class="cart-remove" data-name="${item.name}">Hapus</button>
          </div>
        </div>
      `;

      const qtyInput = cartItem.querySelector('.cart-qty');
      if (qtyInput) {
        qtyInput.addEventListener('change', (e) => {
          const val = parseInt(e.target.value, 10) || 1;
          const idx = cart.findIndex((entry) => entry.name === item.name);
          if (idx >= 0) {
            cart[idx].quantity = val;
            saveCart();
            renderCart();
            updateCartCount();
          }
        });
      }

      const removeBtn = cartItem.querySelector('.cart-remove');
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          const index = cart.findIndex((entry) => entry.name === item.name);
          if (index >= 0) {
            cart.splice(index, 1);
            saveCart();
            renderCart();
            updateCartCount();
          }
        });
      }

      cartItemsContainer.appendChild(cartItem);
    });

    const total = cart.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
      0
    );
    if (cartTotalBoard) cartTotalBoard.textContent = formatCurrency(total);
  }

  function applyFilters() {
    if (!searchInput || !priceRange) return;

    const query = searchInput.value.trim().toLowerCase();
    const priceLimit = Number(priceRange.value) || 0;

    const activeFilters = filterInputs
      .filter((input) => input.checked && input.dataset.filter !== 'all')
      .map((input) => input.dataset.filter);

    const allCheckedInput = filterInputs.find(
      (input) => input.dataset.filter === 'all'
    );
    const allChecked = allCheckedInput ? allCheckedInput.checked : true;

    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach((card) => {
      const name = (card.dataset.name || '').toLowerCase();
      const category = (card.querySelector('.category')?.textContent || '')
        .toLowerCase();
      const price = Number(card.dataset.price) || 0;
      const tags = (card.dataset.tags || '').split(' ').filter(Boolean);

      const matchesSearch = !query || name.includes(query) || category.includes(query);
      const matchesPrice = price <= priceLimit;
      const matchesFilter =
        allChecked ||
        activeFilters.length === 0 ||
        tags.some((tag) => activeFilters.includes(tag));

      const isVisible = matchesSearch && matchesPrice && matchesFilter;
      card.style.display = isVisible ? 'block' : 'none';
    });
  }

  function handleFilterChange(changedInput) {
    const allInput = filterInputs.find((input) => input.dataset.filter === 'all');
    if (!allInput) return;

    if (changedInput.dataset.filter === 'all' && changedInput.checked) {
      filterInputs
        .filter((input) => input.dataset.filter !== 'all')
        .forEach((input) => (input.checked = false));
    }

    if (changedInput.dataset.filter !== 'all' && changedInput.checked) {
      allInput.checked = false;
    }

    if (!filterInputs.some((input) => input.dataset.filter !== 'all' && input.checked)) {
      allInput.checked = true;
    }

    applyFilters();
  }

  filterInputs.forEach((input) =>
    input.addEventListener('change', () => handleFilterChange(input))
  );

  if (searchInput) searchInput.addEventListener('input', applyFilters);

  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('input', (event) => {
      if (searchInput) {
        searchInput.value = event.target.value;
        applyFilters();
      }
    });
  }

  if (priceRange) {
    priceRange.addEventListener('input', () => {
      updatePriceValue();
      applyFilters();
    });
  }

  addButtons.forEach((button) => {
    if (!button) return;
    button.addEventListener('click', (event) => {
      const card = event.target.closest('.product-card');
      if (!card) return;

      const name = card.dataset.name;
      const price = Number(card.dataset.price) || 0;
      const unit =
        card.dataset.unit ||
        card.querySelector('.price')?.textContent.split('/')[1] || '';
      const img = card.querySelector('img')?.src || '';

      const index = cart.findIndex((item) => item.name === name);

      if (index >= 0) {
        cart[index].quantity += 1;
      } else {
        cart.push({ name, price, unit, image_url: img, quantity: 1 });
      }

      saveCart();
      updateCartCount();
      alert(`${name} berhasil ditambahkan ke keranjang.`);
    });
  });

  if (cartButton) {
    cartButton.addEventListener('click', () => {
      if (cartModal) {
        cartModal.style.display = 'block';
        renderCart();
      }
    });
  }

  if (mobileCartButton) {
    mobileCartButton.addEventListener('click', () => {
      if (cartModal) {
        cartModal.style.display = 'block';
        renderCart();
      }
      closeMobileMenu();
    });
  }

  function closeCartModal() {
    if (cartModal) cartModal.style.display = 'none';
  }

  function openShopSection() {
    const shop = document.getElementById('shop');
    if (shop) shop.scrollIntoView({ behavior: 'smooth' });
  }

  if (newsletterBtn) {
    newsletterBtn.addEventListener('click', (event) => {
      event.preventDefault();
      const email = newsletterInput ? newsletterInput.value.trim() : '';
      if (!email) {
        alert('Masukkan email Anda terlebih dahulu.');
        return;
      }
      if (newsletterInput) newsletterInput.value = '';
      alert(`Terima kasih! Penawaran terbaru akan kami kirim ke ${email}.`);
    });
  }

  // expose for inline onclick in footer
  window.showPaymentModal = function showPaymentModal(bank, accountNo) {
    const el1 = document.getElementById('paymentBankName');
    const el2 = document.getElementById('paymentAccountNo');
    const modal = document.getElementById('paymentModal');

    if (el1) el1.textContent = 'Pembayaran via ' + bank;
    if (el2) el2.textContent = accountNo;
    if (modal) modal.style.display = 'block';
  };

  window.closePaymentModal = function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) modal.style.display = 'none';
  };

  window.copyToClipboard = function copyToClipboard() {
    const el = document.getElementById('paymentAccountNo');
    if (!el || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(el.textContent || '')
      .then(() => alert('Nomor rekening berhasil disalin!'));
  };

  window.showQRISModal = function showQRISModal() {
    const modal = document.getElementById('qrisModal');
    if (modal) modal.style.display = 'block';
  };

  window.closeQRISModal = function closeQRISModal() {
    const modal = document.getElementById('qrisModal');
    if (modal) modal.style.display = 'none';
  };

  window.onclick = function (event) {
    const paymentModal = document.getElementById('paymentModal');
    const qrisModal = document.getElementById('qrisModal');

    if (event.target === paymentModal && paymentModal) paymentModal.style.display = 'none';
    if (event.target === qrisModal && qrisModal) qrisModal.style.display = 'none';
    if (event.target === cartModal && cartModal) closeCartModal();
  };

  const menuToggle = document.getElementById('menu-toggle');
  const menuClose = document.getElementById('menu-close');
  const navMain = document.querySelector('nav.main-nav');
  const navBackdrop = document.getElementById('nav-backdrop');

  window.closeMobileMenu = function closeMobileMenu() {
    if (navMain) navMain.classList.remove('active');
    if (navBackdrop) navBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  };

  function openMobileMenu() {
    if (navMain) navMain.classList.add('active');
    if (navBackdrop) navBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  if (menuToggle) menuToggle.addEventListener('click', openMobileMenu);
  if (menuClose) menuClose.addEventListener('click', window.closeMobileMenu);
  if (navBackdrop) navBackdrop.addEventListener('click', window.closeMobileMenu);
  document
    .querySelectorAll('nav.main-nav ul li a')
    .forEach((link) => link.addEventListener('click', window.closeMobileMenu));

  document.addEventListener('DOMContentLoaded', () => {
    updatePriceValue();
    updateCartCount();
  });

  if (shopButton) shopButton.addEventListener('click', openShopSection);
})();

