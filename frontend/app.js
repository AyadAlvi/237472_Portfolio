
// const API_BASE = 'http://localhost:5000';
const API_BASE = 'https://craft-collective-api.onrender.com'; 

const STORAGE_KEYS = {
  auth: 'craft-collective-auth',
  cart: 'craft-collective-cart',
  theme: 'craft-collective-theme',
};
const VIEW = {
  PUBLIC: 'public',
  PROFILE: 'profile',
};

const state = {
  vendors: [],
  products: [],
  blog: [],
  selectedVendor: null,
  cart: [],
  user: null,
  token: null,
  view: VIEW.PUBLIC,
  dashboard: {
    profile: null,
    orders: [],
    customizations: [],
    vendorStore: null,
    vendorProducts: [],
    vendorRequests: [],
  },
  loading: {
    vendors: false,
    products: false,
    blog: false,
    dashboard: false,
  },
  errors: {
    vendors: '',
    products: '',
    blog: '',
    dashboard: '',
  },
  theme: 'light',
};

const els = {
  main: document.getElementById('mainContent'),
  navLinks: document.querySelectorAll('.site-nav .nav-link[data-nav-target]'),
  profileNav: document.getElementById('profileNav'),
  vendorGrid: document.getElementById('vendorGrid'),
  vendorSearch: document.getElementById('vendorSearch'),
  vendorDetail: document.getElementById('vendorDetail'),
  detailName: document.getElementById('detailName'),
  detailBio: document.getElementById('detailBio'),
  detailLocation: document.getElementById('detailLocation'),
  detailCategories: document.getElementById('detailCategories'),
  detailShipping: document.getElementById('detailShipping'),
  detailProducts: document.getElementById('detailProducts'),
  closeVendorDetail: document.getElementById('closeVendorDetail'),
  productGrid: document.getElementById('productGrid'),
  productSearch: document.getElementById('productSearch'),
  vendorFilter: document.getElementById('vendorFilter'),
  customForm: document.getElementById('customForm'),
  customVendor: document.getElementById('customVendor'),
  customProduct: document.getElementById('customProduct'),
  customDetails: document.getElementById('customDetails'),
  customBudget: document.getElementById('customBudget'),
  customFeedback: document.getElementById('customFeedback'),
  blogGrid: document.getElementById('blogGrid'),
  refreshBlog: document.getElementById('refreshBlog'),
  authModal: document.getElementById('authModal'),
  authTrigger: document.getElementById('authTrigger'),
  closeAuth: document.getElementById('closeAuth'),
  tabs: document.querySelectorAll('.tab'),
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  loginFeedback: document.getElementById('loginFeedback'),
  registerFeedback: document.getElementById('registerFeedback'),
  dashboardPanel: document.getElementById('dashboard'),
  dashboardContent: document.getElementById('dashboardContent'),
  dashboardBack: document.getElementById('dashboardBack'),
  cartDrawer: document.getElementById('cartDrawer'),
  cartTrigger: document.getElementById('cartTrigger'),
  closeCart: document.getElementById('closeCart'),
  cartItems: document.getElementById('cartItems'),
  cartSubtotal: document.getElementById('cartSubtotal'),
  cartFee: document.getElementById('cartFee'),
  cartTotal: document.getElementById('cartTotal'),
  cartCount: document.getElementById('cartCount'),
  checkoutBtn: document.getElementById('checkoutBtn'),
  cartFeedback: document.getElementById('cartFeedback'),
  ctaBrowse: document.getElementById('ctaBrowse'),
  ctaBecomeVendor: document.getElementById('ctaBecomeVendor'),
  profileNavButton: document.getElementById('profileNav'),
  liveRegion: document.getElementById('liveRegion'),
  registerVendorId: document.getElementById('registerVendorId'),
  themeToggle: document.getElementById('themeToggle'),
};

const template = document.getElementById('productCardTemplate');
const PUBLIC_SECTION_IDS = ['vendors', 'products', 'custom', 'blog'];
const focusMemory = { auth: null, cart: null };

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

const getVendorName = (vendorId) => state.vendors.find((vendor) => vendor.id === vendorId)?.name || 'Independent';
const getProductName = (productId) => state.products.find((product) => product.id === productId)?.name || 'Custom piece';

function setLiveMessage(message) {
  if (!els.liveRegion) return;
  els.liveRegion.textContent = message;
}

/**
 * Generic fetch helper that injects JWT headers and surfaces friendly errors.
 * @param {string} path
 * @param {RequestInit & { body?: BodyInit | Record<string, unknown> }} options
 */
async function fetchJSON(path, options = {}) {
  const config = { ...options, headers: { ...(options.headers || {}) } };
  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData) && !(config.body instanceof Blob)) {
    config.body = JSON.stringify(config.body);
    config.headers['Content-Type'] = 'application/json';
  }
  if (state.token) {
    config.headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, config);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) {
      clearAuth();
      setLiveMessage('Session expired. Please sign in again.');
    }
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

function persistAuth() {
  if (state.user && state.token) {
    localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify({ user: state.user, token: state.token }));
  } else {
    localStorage.removeItem(STORAGE_KEYS.auth);
  }
}

function restoreAuth() {
  const raw = localStorage.getItem(STORAGE_KEYS.auth);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    state.user = parsed.user;
    state.token = parsed.token;
  } catch (error) {
    localStorage.removeItem(STORAGE_KEYS.auth);
  }
}

function clearAuth() {
  state.user = null;
  state.token = null;
  persistAuth();
  resetDashboardState();
  setView(VIEW.PUBLIC);
  updateAuthUI();
}

function persistCart() {
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(state.cart));
}

function restoreCart() {
  const raw = localStorage.getItem(STORAGE_KEYS.cart);
  if (!raw) return;
  try {
    state.cart = JSON.parse(raw);
  } catch (error) {
    state.cart = [];
  }
}

function updateAuthUI() {
  if (state.user) {
    els.authTrigger.textContent = 'Sign out';
    els.profileNav.hidden = false;
    els.profileNav.textContent = 'Profile';
  } else {
    els.authTrigger.textContent = 'Sign In';
    els.profileNav.hidden = true;
  }
}

function setNavCurrent(target) {
  els.navLinks.forEach((link) => {
    if (link.dataset.navTarget === target) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
  if (target !== 'profile') {
    els.profileNav.removeAttribute('aria-current');
  }
}

function updateCartUI() {
  if (!state.cart.length) {
    els.cartItems.innerHTML = '<p class="status-message">Your cart is empty. Start exploring the marketplace.</p>';
  } else {
    els.cartItems.innerHTML = '';
    state.cart.forEach((item, index) => {
      const block = document.createElement('div');
      block.className = 'cart-item';
      const personalization = Object.entries(item.customizations || {})
        .filter(([, value]) => value)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      block.innerHTML = `
        <h4>${item.name}</h4>
        <p>${formatCurrency(item.price)} · Qty ${item.quantity}</p>
        <p class="muted">${personalization || 'No personalization selected'}</p>
        <button data-index="${index}" class="ghost-button" type="button">Remove</button>
      `;
      block.querySelector('button').addEventListener('click', () => removeCartItem(index));
      els.cartItems.appendChild(block);
    });
  }

  const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const fee = +(subtotal * 0.05).toFixed(2);
  const total = subtotal + fee;

  els.cartSubtotal.textContent = formatCurrency(subtotal);
  els.cartFee.textContent = formatCurrency(fee);
  els.cartTotal.textContent = formatCurrency(total);
  els.cartCount.textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  persistCart();
}

function openCart() {
  focusMemory.cart = document.activeElement;
  els.cartDrawer.classList.add('open');
  els.cartDrawer.setAttribute('aria-hidden', 'false');
  els.closeCart.focus();
}

function closeCart() {
  els.cartDrawer.classList.remove('open');
  els.cartDrawer.setAttribute('aria-hidden', 'true');
  els.cartFeedback.textContent = '';
  if (focusMemory.cart) {
    focusMemory.cart.focus();
  }
}

function openModal(tab = 'login') {
  focusMemory.auth = document.activeElement;
  switchTab(tab);
  els.authModal.classList.add('open');
  const focusTarget = tab === 'login' ? document.getElementById('loginEmail') : document.getElementById('registerName');
  focusTarget?.focus();
}

function closeModal() {
  els.authModal.classList.remove('open');
  els.loginFeedback.textContent = '';
  els.registerFeedback.textContent = '';
  if (focusMemory.auth) {
    focusMemory.auth.focus();
  }
}

function switchTab(tabName) {
  els.tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === tabName;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  els.loginForm.classList.toggle('active', tabName === 'login');
  els.registerForm.classList.toggle('active', tabName === 'register');
}

function renderPanelState(container, key, { loadingText, emptyMessage } = {}) {
  if (state.loading[key]) {
    container.innerHTML = `<p class="status-message">${loadingText || 'Loading...'}</p>`;
    return true;
  }
  if (state.errors[key]) {
    container.innerHTML = `<p class="status-message error">${state.errors[key]}</p>`;
    return true;
  }
  if (emptyMessage && !container.children.length) {
    container.innerHTML = `<p class="status-message">${emptyMessage}</p>`;
    return true;
  }
  return false;
}
/**
 * Renders the vendor grid and handles simple search filtering.
 */
function renderVendors() {
  const filtered = state.vendors.filter((vendor) => {
    const query = els.vendorSearch.value.toLowerCase();
    if (!query) return true;
    return (
      vendor.name.toLowerCase().includes(query) ||
      vendor.location.toLowerCase().includes(query) ||
      vendor.categories.some((cat) => cat.toLowerCase().includes(query))
    );
  });

  if (renderPanelState(els.vendorGrid, 'vendors', { loadingText: 'Loading studios...' })) {
    return;
  }

  els.vendorGrid.innerHTML = '';
  if (!filtered.length) {
    els.vendorGrid.innerHTML = '<p class="status-message">No studios match that filter yet.</p>';
    return;
  }

  filtered.forEach((vendor) => {
    const card = document.createElement('article');
    card.className = 'vendor-card';
    card.innerHTML = `
      <p class="eyebrow">${vendor.location}</p>
      <h3>${vendor.name}</h3>
      <p>${vendor.bio}</p>
      <div class="vendor-tags">
        ${vendor.categories.map((tag) => `<span class="vendor-tag">${tag}</span>`).join('')}
      </div>
    `;
    card.addEventListener('click', () => showVendorDetail(vendor.id));
    els.vendorGrid.appendChild(card);
  });
}

/**
 * Displays the vendor detail panel with featured pieces.
 */
function showVendorDetail(identifier) {
  const vendor = state.vendors.find((item) => item.id === identifier);
  if (!vendor) return;
  state.selectedVendor = vendor;
  els.detailName.textContent = vendor.name;
  els.detailBio.textContent = vendor.bio;
  els.detailLocation.textContent = vendor.location;
  els.detailCategories.textContent = vendor.categories.join(', ');
  els.detailShipping.textContent = vendor.shippingPolicy;

  const vendorProducts = state.products.filter((product) => product.vendorId === vendor.id && product.isActive !== false);
  els.detailProducts.innerHTML = '';
  if (!vendorProducts.length) {
    els.detailProducts.innerHTML = '<p class="status-message">No featured products yet.</p>';
  } else {
    vendorProducts.forEach((product) => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="product-body">
          <h4>${product.name}</h4>
          <p class="product-description">${product.description}</p>
          <span class="price-tag">${formatCurrency(product.price)}</span>
        </div>
      `;
      els.detailProducts.appendChild(card);
    });
  }
  els.vendorDetail.hidden = false;
  els.vendorDetail.scrollIntoView({ behavior: 'smooth' });
}

function closeVendorDetailPanel() {
  els.vendorDetail.hidden = true;
  state.selectedVendor = null;
}

/**
 * Renders the marketplace cards with customization controls.
 */
function renderProducts() {
  const searchTerm = els.productSearch.value.toLowerCase();
  const vendorFilter = els.vendorFilter.value;
  const filtered = state.products.filter((product) => {
    if (product.isActive === false) {
      return false;
    }
    const matchesVendor = vendorFilter ? product.vendorId === vendorFilter : true;
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.tags.some((tag) => tag.toLowerCase().includes(searchTerm));
    return matchesVendor && matchesSearch;
  });

  if (renderPanelState(els.productGrid, 'products', { loadingText: 'Loading marketplace...' })) {
    return;
  }

  els.productGrid.innerHTML = '';
  if (!filtered.length) {
    els.productGrid.innerHTML = '<p class="status-message">No drops match that search. Try another keyword.</p>';
    return;
  }

  filtered.forEach((product) => {
    const node = template.content.firstElementChild.cloneNode(true);
    const media = node.querySelector('.product-media');
    if (product.images && product.images.length) {
      media.style.backgroundImage = `url('${product.images[0]}')`;
      media.style.backgroundSize = 'cover';
      media.style.backgroundPosition = 'center';
    } else {
      media.style.backgroundImage = 'linear-gradient(135deg, #efe7da, #f8f1e8)';
    }
    node.querySelector('h3').textContent = product.name;
    node.querySelector('.product-vendor').textContent = getVendorName(product.vendorId);
    node.querySelector('.product-description').textContent = product.description;
    node.querySelector('.price-tag').textContent = formatCurrency(product.price);

    const customizationContainer = node.querySelector('.product-customizations');
    customizationContainer.innerHTML = '';
    product.customizations.forEach((option) => {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = `<label>${option.label}</label>`;
      let input;
      if (option.type === 'select') {
        input = document.createElement('select');
        option.options.forEach((value) => {
          const opt = document.createElement('option');
          opt.value = value;
          opt.textContent = value;
          input.appendChild(opt);
        });
      } else {
        input = document.createElement('input');
        input.type = 'text';
        input.placeholder = option.placeholder || '';
      }
      input.dataset.customKey = option.key;
      wrapper.appendChild(input);
      customizationContainer.appendChild(wrapper);
    });

    const footer = node.querySelector('.product-footer');
    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.min = '1';
    quantityInput.value = '1';
    quantityInput.className = 'quantity-input';
    quantityInput.setAttribute('aria-label', 'Quantity');
    footer.insertBefore(quantityInput, footer.firstChild);

    node.querySelector('.add-to-cart').addEventListener('click', () => handleAddToCart(product, node, quantityInput));
    els.productGrid.appendChild(node);
  });
}

function populateVendorFilter() {
  els.vendorFilter.innerHTML = '<option value="">All vendors</option>';
  state.vendors.forEach((vendor) => {
    const option = document.createElement('option');
    option.value = vendor.id;
    option.textContent = vendor.name;
    els.vendorFilter.appendChild(option);
  });
}

function populateCustomForm() {
  els.customVendor.innerHTML = '<option value="" disabled selected>Select vendor</option>';
  state.vendors.forEach((vendor) => {
    const option = document.createElement('option');
    option.value = vendor.id;
    option.textContent = vendor.name;
    els.customVendor.appendChild(option);
  });
  updateCustomProducts();
}

function updateCustomProducts() {
  const vendorId = els.customVendor.value || '';
  const filteredProducts = vendorId ? state.products.filter((prod) => prod.vendorId === vendorId && prod.isActive !== false) : state.products;
  els.customProduct.innerHTML = '<option value="" disabled selected>Select product</option>';
  filteredProducts.forEach((product) => {
    const option = document.createElement('option');
    option.value = product.id;
    option.textContent = product.name;
    els.customProduct.appendChild(option);
  });
}

function renderBlog() {
  if (renderPanelState(els.blogGrid, 'blog', { loadingText: 'Gathering stories...' })) {
    return;
  }

  els.blogGrid.innerHTML = '';
  if (!state.blog.length) {
    els.blogGrid.innerHTML = '<p class="status-message">Stay tuned—vendor stories are coming soon.</p>';
    return;
  }

  state.blog.forEach((post) => {
    const card = document.createElement('article');
    card.className = 'blog-card';
    card.innerHTML = `
      <p class="eyebrow">${new Date(post.publishedAt).toLocaleDateString()}</p>
      <h3>${post.title}</h3>
      <p>${post.excerpt}</p>
      <button type="button" class="ghost-button">Read story</button>
    `;
    card.querySelector('button').addEventListener('click', () => {
      alert(`${post.title}\n\n${post.excerpt}`);
    });
    els.blogGrid.appendChild(card);
  });
}
function removeCartItem(index) {
  state.cart.splice(index, 1);
  updateCartUI();
}

function handleAddToCart(product, cardNode, quantityInput) {
  const quantity = Number(quantityInput.value) || 1;
  if (quantity < 1) return;
  const customizations = {};
  cardNode.querySelectorAll('[data-custom-key]').forEach((input) => {
    customizations[input.dataset.customKey] = input.value;
  });
  state.cart.push({
    productId: product.id,
    vendorId: product.vendorId,
    name: product.name,
    price: product.price,
    quantity,
    customizations,
  });
  updateCartUI();
  els.cartFeedback.textContent = 'Item added to cart.';
  openCart();
}

async function handleCheckout() {
  if (state.cart.length === 0) {
    els.cartFeedback.textContent = 'Add at least one item before checking out.';
    return;
  }

  if (!state.token) {
    els.cartFeedback.textContent = 'Please sign in to place your order.';
    openModal('login');
    return;
  }

  els.cartFeedback.textContent = 'Processing checkout...';
  els.checkoutBtn.disabled = true;
  try {
    await fetchJSON('/api/cart/checkout', {
      method: 'POST',
      body: {
        items: state.cart.map((item) => ({
          productId: item.productId,
          vendorId: item.vendorId,
          quantity: item.quantity,
          customizations: item.customizations,
        })),
        paymentMethod: 'card',
      },
    });
    state.cart = [];
    updateCartUI();
    els.cartFeedback.textContent = 'Order placed! A confirmation email is on the way.';
    setLiveMessage('Checkout complete');
  } catch (error) {
    els.cartFeedback.textContent = error.message;
  } finally {
    els.checkoutBtn.disabled = false;
  }
}

async function submitCustomForm(event) {
  event.preventDefault();
  if (!state.token) {
    els.customFeedback.textContent = 'Please sign in to submit a custom request.';
    openModal('login');
    return;
  }
  const payload = {
    vendorId: els.customVendor.value,
    productId: els.customProduct.value,
    details: els.customDetails.value.trim(),
    budget: els.customBudget.value ? Number(els.customBudget.value) : null,
  };
  if (!payload.vendorId || !payload.productId) {
    els.customFeedback.textContent = 'Select both a vendor and product.';
    return;
  }
  els.customFeedback.textContent = 'Sending request...';
  try {
    await fetchJSON('/api/customizations', {
      method: 'POST',
      body: payload,
    });
    els.customForm.reset();
    updateCustomProducts();
    els.customFeedback.textContent = 'Request sent! A vendor will follow up within 48 hours.';
    setLiveMessage('Customization request submitted');
  } catch (error) {
    els.customFeedback.textContent = error.message;
  }
}

async function login(event) {
  event.preventDefault();
  els.loginFeedback.textContent = 'Signing in...';
  try {
    const result = await fetchJSON('/api/auth/login', {
      method: 'POST',
      body: {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value,
      },
    });
    state.user = result.user;
    state.token = result.token;
    persistAuth();
    updateAuthUI();
    els.loginFeedback.textContent = 'Signed in.';
    setTimeout(() => {
      closeModal();
      setLiveMessage('Signed in successfully');
    }, 400);
  } catch (error) {
    els.loginFeedback.textContent = error.message;
  }
}

async function register(event) {
  event.preventDefault();
  els.registerFeedback.textContent = 'Creating account...';
  try {
    const role = document.getElementById('registerRole').value;
    const body = {
      name: document.getElementById('registerName').value,
      email: document.getElementById('registerEmail').value,
      password: document.getElementById('registerPassword').value,
      role,
    };
    if (role === 'vendor') {
      body.vendorId = els.registerVendorId.value.trim();
    }
    const result = await fetchJSON('/api/auth/register', {
      method: 'POST',
      body,
    });
    state.user = result.user;
    state.token = result.token;
    persistAuth();
    updateAuthUI();
    els.registerFeedback.textContent = 'Account created. Welcome!';
    setTimeout(() => {
      closeModal();
      setLiveMessage('Account created');
    }, 400);
  } catch (error) {
    els.registerFeedback.textContent = error.message;
  }
}

function handleAuthTrigger() {
  if (state.user) {
    clearAuth();
    setLiveMessage('You have signed out.');
  } else {
    openModal('login');
  }
}

function resetDashboardState() {
  state.dashboard = {
    profile: null,
    orders: [],
    customizations: [],
    vendorStore: null,
    vendorProducts: [],
    vendorRequests: [],
  };
  state.errors.dashboard = '';
}

function setView(view) {
  state.view = view;
  const showProfile = view === VIEW.PROFILE && Boolean(state.user);
  PUBLIC_SECTION_IDS.forEach((id) => {
    const section = document.getElementById(id);
    if (section) {
      section.hidden = showProfile;
    }
  });
  els.dashboardPanel.hidden = !showProfile;
  if (showProfile) {
    setNavCurrent('profile');
    loadDashboard();
    els.dashboardPanel.scrollIntoView({ behavior: 'smooth' });
  } else {
    setNavCurrent('');
  }
}
function renderDashboard() {
  if (els.dashboardPanel.hidden) return;
  if (state.loading.dashboard) {
    els.dashboardContent.innerHTML = '<p class="status-message">Loading your dashboard...</p>';
    return;
  }
  if (state.errors.dashboard) {
    els.dashboardContent.innerHTML = `<p class="status-message error">${state.errors.dashboard}</p>`;
    return;
  }
  if (!state.dashboard.profile) {
    els.dashboardContent.innerHTML = '<p class="status-message">No profile data yet.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  fragment.appendChild(renderProfileSummary(state.dashboard.profile));
  if (state.dashboard.profile.role === 'customer') {
    fragment.appendChild(renderCustomerDashboard());
  } else {
    fragment.appendChild(renderVendorDashboard());
  }
  els.dashboardContent.innerHTML = '';
  els.dashboardContent.appendChild(fragment);
}

/**
 * Builds the profile summary card with inline name editing.
 */
function renderProfileSummary(profile) {
  const card = document.createElement('section');
  card.className = 'dashboard-card';
  card.innerHTML = `
    <h3>Profile</h3>
    <p><strong>Name:</strong> <span>${profile.name}</span></p>
    <p><strong>Email:</strong> ${profile.email}</p>
    <p><strong>Role:</strong> ${profile.role === 'vendor' ? 'Vendor' : 'Art lover'}</p>
    <form class="profile-edit-form">
      <label for="profileName">Update display name</label>
      <input id="profileName" name="name" type="text" value="${profile.name}" required />
      <button class="pill-button" type="submit">Save</button>
      <p class="form-feedback" role="status"></p>
    </form>
  `;
  const form = card.querySelector('form');
  const feedback = card.querySelector('.form-feedback');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    feedback.textContent = 'Saving...';
    try {
      const updated = await fetchJSON('/api/profile/me', {
        method: 'PUT',
        body: { name: form.name.value.trim() },
      });
      state.dashboard.profile = updated;
      state.user = { ...state.user, name: updated.name };
      persistAuth();
      updateAuthUI();
      renderDashboard();
      feedback.textContent = 'Saved!';
      setLiveMessage('Profile updated');
    } catch (error) {
      feedback.textContent = error.message;
    }
  });
  return card;
}

function renderCustomerDashboard() {
  const wrapper = document.createElement('div');
  wrapper.className = 'dashboard-grid';

  const ordersCard = document.createElement('section');
  ordersCard.className = 'dashboard-card';
  ordersCard.innerHTML = '<h3>Recent orders</h3>';
  if (!state.dashboard.orders.length) {
    ordersCard.innerHTML += '<div class="dashboard-empty">No orders yet.</div>';
  } else {
    const table = document.createElement('table');
    table.className = 'dashboard-table';
    table.innerHTML = `
      <thead>
        <tr><th>Date</th><th>Items</th><th>Total</th></tr>
      </thead>
      <tbody>
        ${state.dashboard.orders
          .map(
            (order) =>
              `<tr><td>${new Date(order.createdAt).toLocaleDateString()}</td><td>${order.items.length}</td><td>${formatCurrency(order.total)}</td></tr>`
          )
          .join('')}
      </tbody>
    `;
    ordersCard.appendChild(table);
  }

  const customCard = document.createElement('section');
  customCard.className = 'dashboard-card';
  customCard.innerHTML = '<h3>Customization requests</h3>';
  if (!state.dashboard.customizations.length) {
    customCard.innerHTML += '<div class="dashboard-empty">No custom requests yet.</div>';
  } else {
    const list = document.createElement('div');
    state.dashboard.customizations.forEach((request) => {
      const row = document.createElement('p');
      row.innerHTML = `<strong>${getProductName(request.productId)}</strong> with ${getVendorName(request.vendorId)} — <span class="muted">${request.status}</span>`;
      list.appendChild(row);
    });
    customCard.appendChild(list);
  }

  wrapper.append(ordersCard, customCard);
  return wrapper;
}
function renderVendorDashboard() {
  const container = document.createElement('div');
  container.className = 'dashboard-grid';

  const storeCard = document.createElement('section');
  storeCard.className = 'dashboard-card';
  const store = state.dashboard.vendorStore;
  storeCard.innerHTML = `
    <h3>${store?.name || 'Your store'}</h3>
    <p>${store?.bio || 'Add your story to inspire collectors.'}</p>
    <p class="muted">${store?.location || ''}</p>
  `;

  const productsCard = document.createElement('section');
  productsCard.className = 'dashboard-card';
  productsCard.innerHTML = '<h3>Products</h3>';
  if (!state.dashboard.vendorProducts.length) {
    productsCard.innerHTML += '<div class="dashboard-empty">No products yet. Add your first piece below.</div>';
  } else {
    state.dashboard.vendorProducts.forEach((product) => {
      const form = document.createElement('form');
      form.className = 'product-manage-row';
      form.dataset.productId = product.id;
      form.innerHTML = `
        <label>
          <span class="sr-only">Name</span>
          <input type="text" name="name" value="${product.name}" />
        </label>
        <label>
          <span class="sr-only">Price</span>
          <input type="number" name="price" min="1" value="${product.price}" />
        </label>
        <label>
          <span class="sr-only">Active</span>
          <input type="checkbox" name="isActive" ${product.isActive !== false ? 'checked' : ''} />
          <span>Active</span>
        </label>
        <button class="ghost-button" type="submit">Update</button>
      `;
      form.addEventListener('submit', (event) => handleVendorProductUpdate(event, product.id));
      productsCard.appendChild(form);
    });
  }

  const createForm = document.createElement('form');
  createForm.className = 'product-manage-row';
  createForm.innerHTML = `
    <label class="sr-only" for="newProductName">Product name</label>
    <input id="newProductName" name="name" type="text" placeholder="New product name" required />
    <label class="sr-only" for="newProductPrice">Price</label>
    <input id="newProductPrice" name="price" type="number" min="1" placeholder="Price" required />
    <label class="sr-only" for="newProductDescription">Description</label>
    <input id="newProductDescription" name="description" type="text" placeholder="Short description" required />
    <button class="pill-button" type="submit">Add product</button>
  `;
  createForm.addEventListener('submit', handleVendorProductCreate);
  productsCard.appendChild(createForm);

  const requestsCard = document.createElement('section');
  requestsCard.className = 'dashboard-card';
  requestsCard.innerHTML = '<h3>Customization requests</h3>';
  if (!state.dashboard.vendorRequests.length) {
    requestsCard.innerHTML += '<div class="dashboard-empty">No custom requests yet.</div>';
  } else {
    state.dashboard.vendorRequests.forEach((request) => {
      const row = document.createElement('p');
      row.innerHTML = `<strong>${getProductName(request.productId)}</strong> — <span class="muted">${request.status}</span>`;
      requestsCard.appendChild(row);
    });
  }

  container.append(storeCard, productsCard, requestsCard);
  return container;
}

async function handleVendorProductUpdate(event, productId) {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = {
    name: form.name.value.trim(),
    price: Number(form.price.value),
    isActive: form.isActive.checked,
  };
  try {
    const updated = await fetchJSON(`/api/vendor/products/${productId}`, {
      method: 'PUT',
      body: payload,
    });
    state.dashboard.vendorProducts = state.dashboard.vendorProducts.map((product) =>
      product.id === productId ? updated : product
    );
    renderDashboard();
    setLiveMessage('Product updated');
  } catch (error) {
    alert(error.message);
  }
}

async function handleVendorProductCreate(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = {
    name: form.name.value.trim(),
    price: Number(form.price.value),
    description: form.description.value.trim(),
  };
  try {
    const created = await fetchJSON('/api/vendor/products', {
      method: 'POST',
      body: payload,
    });
    state.dashboard.vendorProducts.unshift(created);
    form.reset();
    renderDashboard();
    setLiveMessage('Product created');
  } catch (error) {
    alert(error.message);
  }
}
async function loadDashboard() {
  if (!state.user) return;
  state.loading.dashboard = true;
  state.errors.dashboard = '';
  renderDashboard();
  try {
    const profile = await fetchJSON('/api/profile/me');
    state.dashboard.profile = profile;
    if (profile.role === 'customer') {
      const [orders, customizations] = await Promise.all([fetchJSON('/api/orders/my'), fetchJSON('/api/customizations/my')]);
      state.dashboard.orders = orders;
      state.dashboard.customizations = customizations;
    } else {
      const [store, products, requests] = await Promise.all([
        fetchJSON('/api/vendors/me'),
        fetchJSON('/api/vendor/products'),
        fetchJSON('/api/vendor/customizations'),
      ]);
      state.dashboard.vendorStore = store;
      state.dashboard.vendorProducts = products;
      state.dashboard.vendorRequests = requests;
    }
  } catch (error) {
    state.errors.dashboard = error.message;
  } finally {
    state.loading.dashboard = false;
    renderDashboard();
  }
}

async function loadVendors() {
  state.loading.vendors = true;
  renderVendors();
  try {
    state.vendors = await fetchJSON('/api/vendors');
    state.errors.vendors = '';
  } catch (error) {
    state.errors.vendors = error.message;
  } finally {
    state.loading.vendors = false;
    renderVendors();
    populateVendorFilter();
    populateCustomForm();
  }
}

async function loadProducts() {
  state.loading.products = true;
  renderProducts();
  try {
    state.products = await fetchJSON('/api/products');
    state.errors.products = '';
  } catch (error) {
    state.errors.products = error.message;
  } finally {
    state.loading.products = false;
    renderProducts();
    populateCustomForm();
  }
}

async function loadBlog() {
  state.loading.blog = true;
  renderBlog();
  try {
    state.blog = await fetchJSON('/api/blog');
    state.errors.blog = '';
  } catch (error) {
    state.errors.blog = error.message;
  } finally {
    state.loading.blog = false;
    renderBlog();
  }
}

function bindEvents() {
  els.vendorSearch.addEventListener('input', renderVendors);
  els.closeVendorDetail.addEventListener('click', closeVendorDetailPanel);
  els.productSearch.addEventListener('input', renderProducts);
  els.vendorFilter.addEventListener('change', renderProducts);
  els.customVendor.addEventListener('change', updateCustomProducts);
  els.customForm.addEventListener('submit', submitCustomForm);
  els.refreshBlog.addEventListener('click', loadBlog);
  els.cartTrigger.addEventListener('click', openCart);
  els.closeCart.addEventListener('click', closeCart);
  els.checkoutBtn.addEventListener('click', handleCheckout);
  els.authTrigger.addEventListener('click', handleAuthTrigger);
  els.closeAuth.addEventListener('click', closeModal);
  els.tabs.forEach((tab) => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
  els.loginForm.addEventListener('submit', login);
  els.registerForm.addEventListener('submit', register);
  els.profileNav.addEventListener('click', () => setView(VIEW.PROFILE));
  els.dashboardBack.addEventListener('click', () => setView(VIEW.PUBLIC));
  els.ctaBrowse.addEventListener('click', () => {
    setView(VIEW.PUBLIC);
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  });
  els.ctaBecomeVendor.addEventListener('click', () => {
    openModal('register');
    document.getElementById('registerRole').value = 'vendor';
    els.registerVendorId.focus();
  });
  els.navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      setView(VIEW.PUBLIC);
      setNavCurrent(link.dataset.navTarget);
    });
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
      closeCart();
    }
  });
}

function init() {
  restoreAuth();
  restoreCart();
  updateAuthUI();
  bindEvents();
  updateCartUI();
  renderVendors();
  renderProducts();
  renderBlog();
  loadVendors();
  loadProducts();
  loadBlog();
}

init();


