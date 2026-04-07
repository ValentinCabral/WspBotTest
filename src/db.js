const now = () => new Date().toISOString();

const db = {
  companies: [{ id: 1, name: 'TrendMax Mayorista', base_currency: 'ARS', created_at: now() }],
  users: [
    { id: 1, company_id: 1, google_sub: 'google-sub-admin', email: 'admin@trendmax.com', full_name: 'Admin TrendMax', role: 'admin', is_active: 1, created_at: now() },
    { id: 2, company_id: 1, google_sub: 'google-sub-sales', email: 'ventas@trendmax.com', full_name: 'Vendedora Demo', role: 'sales', is_active: 1, created_at: now() }
  ],
  customers: [
    { id: 1, company_id: 1, name: 'Comercial Sol', phone: '+541155501111', email: 'compras@comercialsol.com', address: 'Av. Siempre Viva 123', tax_id: '30-11111111-9', segment: 'premium', credit_limit: 1500000, balance: 350000, created_at: now() },
    { id: 2, company_id: 1, name: 'Revendedor Norte', phone: '+541155502222', email: 'norte@clientes.com', address: 'Calle Norte 987', tax_id: '20-22222222-2', segment: 'estandar', credit_limit: 700000, balance: 100000, created_at: now() }
  ],
  products: [
    { id: 1, company_id: 1, sku: 'TM-AUR-001', name: 'Auriculares BT Pro', category: 'Electrónica', tags: 'tendencia,audio', cost_price: 12000, sale_price: 18500, min_purchase_qty: 5, stock_available: 120, stock_reserved: 10, low_stock_threshold: 20, currency: 'ARS', is_active: 1, created_at: now() },
    { id: 2, company_id: 1, sku: 'TM-RGB-002', name: 'Aro de Luz RGB', category: 'Accesorios', tags: 'tendencia,streaming', cost_price: 9000, sale_price: 14900, min_purchase_qty: 3, stock_available: 60, stock_reserved: 8, low_stock_threshold: 15, currency: 'ARS', is_active: 1, created_at: now() },
    { id: 3, company_id: 1, sku: 'TM-POW-003', name: 'PowerBank 20k', category: 'Electrónica', tags: 'movilidad,carga', cost_price: 15000, sale_price: 23000, min_purchase_qty: 4, stock_available: 35, stock_reserved: 5, low_stock_threshold: 10, currency: 'ARS', is_active: 1, created_at: now() }
  ],
  orders: [
    { id: 1, company_id: 1, customer_id: 1, assigned_user_id: 2, status: 'approved', shipping_cost: 8000, discount_total: 5000, notes: 'Entrega parcial permitida', subtotal: 334000, total: 337000, currency: 'ARS', created_at: now() }
  ],
  order_items: [
    { id: 1, order_id: 1, product_id: 1, quantity: 10, unit_price: 18000, unit_cost: 12000, discount: 0 },
    { id: 2, order_id: 1, product_id: 2, quantity: 12, unit_price: 14500, unit_cost: 9000, discount: 3000 }
  ],
  payments: [{ id: 1, order_id: 1, amount: 150000, method: 'transferencia', paid_at: now() }],
  stock_movements: [],
  exchange_rates: [
    { id: 1, company_id: 1, from_currency: 'USD', to_currency: 'ARS', rate: 950, created_at: now() },
    { id: 2, company_id: 1, from_currency: 'BRL', to_currency: 'ARS', rate: 175, created_at: now() }
  ],
  audit_logs: []
};

const counters = Object.fromEntries(Object.entries(db).map(([k, arr]) => [k, arr.length + 1]));

db.nextId = (table) => counters[table]++;

module.exports = db;
