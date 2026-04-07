const fs = require('fs');
const path = require('path');
const url = require('url');
const { signToken, verifyAuthHeader } = require('./auth');
const { logAudit } = require('./audit');
const db = require('./db');

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function sendFile(res, filepath, contentType) {
  const full = path.join(__dirname, '..', 'public', filepath);
  fs.readFile(full, (err, data) => {
    if (err) return sendJson(res, 404, { error: 'Not found' });
    res.writeHead(200, { 'Content-Type': contentType });
    return res.end(data);
  });
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        return resolve(JSON.parse(data));
      } catch (_err) {
        return resolve({});
      }
    });
  });
}

function getUser(req, res) {
  const result = verifyAuthHeader(req.headers.authorization || '');
  if (!result.ok) {
    sendJson(res, 401, { error: result.error });
    return null;
  }
  return result.user;
}

function requireRole(user, roles, res) {
  if (!roles.includes(user.role)) {
    sendJson(res, 403, { error: 'Sin permisos para esta operación' });
    return false;
  }
  return true;
}

async function handleApi(req, res, pathname) {
  if (req.method === 'GET' && pathname === '/health') {
    return sendJson(res, 200, { ok: true, timestamp: new Date().toISOString() });
  }

  if (req.method === 'POST' && pathname === '/api/auth/google') {
    const body = await readBody(req);
    if (!body.email) return sendJson(res, 400, { error: 'Email es requerido' });
    const user = db.users.find((u) => u.email.toLowerCase() === body.email.toLowerCase() && u.is_active === 1);
    if (!user) return sendJson(res, 401, { error: 'Usuario no autorizado para esta empresa' });

    const token = signToken(user);
    logAudit(db, { companyId: user.company_id, userId: user.id, action: 'LOGIN_GOOGLE', entity: 'auth', entityId: user.id, payload: { email: user.email } });
    return sendJson(res, 200, { token, user });
  }

  if (pathname === '/api/dashboard' && req.method === 'GET') {
    const user = getUser(req, res);
    if (!user) return;
    const products = db.products.filter((p) => p.company_id === user.companyId);
    const orders = db.orders.filter((o) => o.company_id === user.companyId && o.status !== 'cancelled');
    const monthKey = new Date().toISOString().slice(0, 7);
    const monthlySales = orders.filter((o) => o.created_at.slice(0, 7) === monthKey).reduce((sum, o) => sum + o.total, 0);
    const lowStockAlerts = products.filter((p) => p.stock_available <= p.low_stock_threshold).length;
    const pendingOrders = orders.filter((o) => ['pending', 'approved', 'preparing'].includes(o.status)).length;
    return sendJson(res, 200, { totalProducts: products.length, lowStockAlerts, monthlySales, pendingOrders });
  }

  if (pathname === '/api/products' && req.method === 'GET') {
    const user = getUser(req, res);
    if (!user) return;
    const rows = db.products.filter((p) => p.company_id === user.companyId).map((p) => ({
      ...p,
      margin_percent: Number((((p.sale_price - p.cost_price) / p.cost_price) * 100).toFixed(2))
    }));
    return sendJson(res, 200, rows);
  }

  if (pathname === '/api/customers' && req.method === 'GET') {
    const user = getUser(req, res);
    if (!user) return;
    return sendJson(res, 200, db.customers.filter((c) => c.company_id === user.companyId));
  }

  if (pathname === '/api/orders' && req.method === 'GET') {
    const user = getUser(req, res);
    if (!user) return;
    const rows = db.orders.filter((o) => o.company_id === user.companyId).map((o) => ({
      ...o,
      customer_name: db.customers.find((c) => c.id === o.customer_id)?.name || '-',
      assigned_user_name: db.users.find((u) => u.id === o.assigned_user_id)?.full_name || '-'
    }));
    return sendJson(res, 200, rows);
  }

  if (pathname === '/api/products' && req.method === 'POST') {
    const user = getUser(req, res);
    if (!user || !requireRole(user, ['admin', 'warehouse'], res)) return;
    const body = await readBody(req);
    const row = {
      id: db.nextId('products'),
      company_id: user.companyId,
      sku: body.sku,
      name: body.name,
      category: body.category || null,
      tags: body.tags || null,
      cost_price: Number(body.cost_price || 0),
      sale_price: Number(body.sale_price || 0),
      min_purchase_qty: Number(body.min_purchase_qty || 1),
      stock_available: Number(body.stock_available || 0),
      stock_reserved: 0,
      low_stock_threshold: Number(body.low_stock_threshold || 5),
      currency: body.currency || 'ARS',
      is_active: 1,
      created_at: new Date().toISOString()
    };
    db.products.push(row);
    logAudit(db, { companyId: user.companyId, userId: user.sub, action: 'CREATE_PRODUCT', entity: 'product', entityId: row.id, payload: row });
    return sendJson(res, 201, { id: row.id });
  }

  if (pathname === '/api/customers' && req.method === 'POST') {
    const user = getUser(req, res);
    if (!user || !requireRole(user, ['admin', 'sales'], res)) return;
    const body = await readBody(req);
    const row = {
      id: db.nextId('customers'),
      company_id: user.companyId,
      name: body.name,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      tax_id: body.tax_id || null,
      segment: body.segment || 'estandar',
      credit_limit: Number(body.credit_limit || 0),
      balance: 0,
      created_at: new Date().toISOString()
    };
    db.customers.push(row);
    logAudit(db, { companyId: user.companyId, userId: user.sub, action: 'CREATE_CUSTOMER', entity: 'customer', entityId: row.id, payload: row });
    return sendJson(res, 201, { id: row.id });
  }

  if (pathname === '/api/orders' && req.method === 'POST') {
    const user = getUser(req, res);
    if (!user || !requireRole(user, ['admin', 'sales'], res)) return;
    const body = await readBody(req);
    const { customer_id, items = [], shipping_cost = 0, discount_total = 0, notes = '' } = body;
    if (!customer_id || items.length === 0) return sendJson(res, 400, { error: 'customer_id e items son requeridos' });

    let subtotal = 0;
    for (const item of items) {
      const product = db.products.find((p) => p.id === item.product_id && p.company_id === user.companyId);
      if (!product) return sendJson(res, 400, { error: `Producto ${item.product_id} no encontrado` });
      if (item.quantity < product.min_purchase_qty) return sendJson(res, 400, { error: `Cantidad mínima no cumplida para ${product.name}` });
      if (item.quantity > product.stock_available) return sendJson(res, 400, { error: `Stock insuficiente para ${product.name}` });
      subtotal += product.sale_price * item.quantity;
    }

    const order = {
      id: db.nextId('orders'),
      company_id: user.companyId,
      customer_id: Number(customer_id),
      assigned_user_id: body.assigned_user_id || null,
      status: 'pending',
      shipping_cost: Number(shipping_cost),
      discount_total: Number(discount_total),
      notes,
      subtotal,
      total: subtotal + Number(shipping_cost) - Number(discount_total),
      currency: 'ARS',
      created_at: new Date().toISOString()
    };
    db.orders.push(order);

    items.forEach((item) => {
      const product = db.products.find((p) => p.id === item.product_id && p.company_id === user.companyId);
      product.stock_available -= item.quantity;
      product.stock_reserved += item.quantity;
      db.order_items.push({ id: db.nextId('order_items'), order_id: order.id, product_id: product.id, quantity: item.quantity, unit_price: product.sale_price, unit_cost: product.cost_price, discount: 0 });
      db.stock_movements.push({ id: db.nextId('stock_movements'), company_id: user.companyId, product_id: product.id, movement_type: 'reserve', quantity: item.quantity, reason: `Reserva por pedido ${order.id}`, created_by: user.sub, created_at: new Date().toISOString() });
    });

    logAudit(db, { companyId: user.companyId, userId: user.sub, action: 'CREATE_ORDER', entity: 'order', entityId: order.id, payload: body });
    return sendJson(res, 201, { id: order.id, subtotal: order.subtotal, total: order.total });
  }

  return sendJson(res, 404, { error: 'Not found' });
}

async function app(req, res) {
  const parsed = url.parse(req.url);
  const pathname = parsed.pathname;

  if (pathname.startsWith('/api/') || pathname === '/health') {
    return handleApi(req, res, pathname);
  }

  if (pathname === '/styles.css') return sendFile(res, 'styles.css', 'text/css');
  if (pathname === '/app.js') return sendFile(res, 'app.js', 'application/javascript');
  return sendFile(res, 'index.html', 'text/html');
}

module.exports = app;
