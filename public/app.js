const state = { token: null, activeView: 'dashboard' };
const view = document.getElementById('view');
const statusNode = document.getElementById('status');

function api(path, options = {}) {
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
    }
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Error de API');
    return data;
  });
}

async function login() {
  const email = prompt('Email demo (admin@trendmax.com o ventas@trendmax.com)');
  if (!email) return;

  try {
    const data = await api('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    state.token = data.token;
    statusNode.textContent = `Sesión: ${data.user.full_name} (${data.user.role})`;
    loadView(state.activeView);
  } catch (error) {
    alert(error.message);
  }
}

function renderTable(columns, rows) {
  const header = columns.map((col) => `<th>${col.label}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${columns.map((col) => `<td>${col.format ? col.format(row[col.key], row) : row[col.key] ?? '-'}</td>`).join('')}</tr>`)
    .join('');

  return `
    <div class="tableWrap">
      <table class="table">
        <thead><tr>${header}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

async function loadView(viewName) {
  state.activeView = viewName;

  if (!state.token) {
    view.innerHTML = '<p>Inicia sesión para ver el sistema.</p>';
    return;
  }

  if (viewName === 'dashboard') {
    const data = await api('/api/dashboard');
    view.innerHTML = `
      <h2>Dashboard</h2>
      <div class="cards">
        <div class="card"><strong>Ventas del mes</strong><p>$${Number(data.monthlySales).toLocaleString('es-AR')}</p></div>
        <div class="card"><strong>Pedidos pendientes</strong><p>${data.pendingOrders}</p></div>
        <div class="card"><strong>Productos</strong><p>${data.totalProducts}</p></div>
        <div class="card"><strong>Alertas de stock</strong><p>${data.lowStockAlerts}</p></div>
      </div>
    `;
    return;
  }

  if (viewName === 'products') {
    const products = await api('/api/products');
    view.innerHTML = `<h2>Productos</h2>${renderTable(
      [
        { key: 'sku', label: 'SKU' },
        { key: 'name', label: 'Producto' },
        { key: 'stock_available', label: 'Stock' },
        { key: 'sale_price', label: 'Venta', format: (v) => `$${Number(v).toLocaleString('es-AR')}` },
        { key: 'margin_percent', label: 'Margen %' }
      ],
      products
    )}`;
    return;
  }

  if (viewName === 'orders') {
    const orders = await api('/api/orders');
    view.innerHTML = `<h2>Pedidos</h2>${renderTable(
      [
        { key: 'id', label: 'ID' },
        { key: 'customer_name', label: 'Cliente' },
        { key: 'status', label: 'Estado' },
        { key: 'total', label: 'Total', format: (v) => `$${Number(v).toLocaleString('es-AR')}` },
        { key: 'assigned_user_name', label: 'Asignado a' }
      ],
      orders
    )}`;
    return;
  }

  if (viewName === 'customers') {
    const customers = await api('/api/customers');
    view.innerHTML = `<h2>Clientes</h2>${renderTable(
      [
        { key: 'name', label: 'Cliente' },
        { key: 'segment', label: 'Segmento' },
        { key: 'credit_limit', label: 'Límite crédito', format: (v) => `$${Number(v).toLocaleString('es-AR')}` },
        { key: 'balance', label: 'Saldo', format: (v) => `$${Number(v).toLocaleString('es-AR')}` }
      ],
      customers
    )}`;
  }
}

document.getElementById('loginBtn').addEventListener('click', login);
document.querySelectorAll('[data-view]').forEach((button) => {
  button.addEventListener('click', () => loadView(button.dataset.view));
});

loadView('dashboard');
