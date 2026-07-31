require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize, User, Customer, Category, Product, Order, OrderItem, Invoice, Transaction, Expense } = require('../../models/associations');
const { generateOrderNumber, generateInvoiceNumber, generateTransactionRef } = require('../../utils/generators');

async function seedUsers() {
  const existing = await User.findOne({ where: { email: 'admin@salesorder.com' } });
  if (existing) {
    await existing.update({ password: 'admin123' });
    console.log('Admin password updated.');
    return;
  }
  await User.bulkCreate([
    { name: 'Super Admin', email: 'admin@salesorder.com', password: 'admin123', role: 'super_admin', phone: '08012345678' },
    { name: 'John Manager', email: 'manager@salesorder.com', password: 'admin123', role: 'manager', phone: '08023456789' },
    { name: 'Mary Accountant', email: 'accountant@salesorder.com', password: 'admin123', role: 'accountant', phone: '08034567890' },
    { name: 'Sales Staff', email: 'sales@salesorder.com', password: 'admin123', role: 'sales_staff', phone: '08045678901' },
  ], { individualHooks: true });
  console.log('Users seeded.');
}

module.exports = { seedUsers };

async function seed() {
  await sequelize.sync({ force: true });
  console.log('Tables created');

  // Users
  const users = await User.bulkCreate([
    { name: 'Super Admin', email: 'admin@salesorder.com', password: 'admin123', role: 'super_admin', phone: '08012345678' },
    { name: 'John Manager', email: 'manager@salesorder.com', password: 'admin123', role: 'manager', phone: '08023456789' },
    { name: 'Mary Accountant', email: 'accountant@salesorder.com', password: 'admin123', role: 'accountant', phone: '08034567890' },
    { name: 'Sales Staff', email: 'sales@salesorder.com', password: 'admin123', role: 'sales_staff', phone: '08045678901' },
  ], { individualHooks: true });
  console.log('Users seeded');

  // Categories
  const categories = await Category.bulkCreate([
    { name: 'Electronics', description: 'Electronic devices and accessories' },
    { name: 'Office Supplies', description: 'Stationery and office materials' },
    { name: 'Furniture', description: 'Office and home furniture' },
    { name: 'Food & Beverages', description: 'Consumable goods' },
  ]);

  // Products
  const products = await Product.bulkCreate([
    { name: 'Laptop HP 15', sku: 'LAP-HP-001', category_id: categories[0].id, cost_price: 180000, selling_price: 220000, quantity: 25, min_stock_level: 5, supplier: 'HP Nigeria', product_code: 'PROD-0001' },
    { name: 'Wireless Mouse', sku: 'MOU-WL-001', category_id: categories[0].id, cost_price: 3500, selling_price: 5500, quantity: 80, min_stock_level: 15, supplier: 'Logitech', product_code: 'PROD-0002' },
    { name: 'Office Chair', sku: 'CHR-OFF-001', category_id: categories[2].id, cost_price: 25000, selling_price: 38000, quantity: 12, min_stock_level: 3, supplier: 'FurniturePlus', product_code: 'PROD-0003' },
    { name: 'A4 Paper Ream', sku: 'PAP-A4-001', category_id: categories[1].id, cost_price: 2200, selling_price: 3200, quantity: 200, min_stock_level: 30, supplier: 'PaperWorld', product_code: 'PROD-0004' },
    { name: 'USB Flash Drive 32GB', sku: 'USB-32-001', category_id: categories[0].id, cost_price: 1800, selling_price: 3000, quantity: 150, min_stock_level: 20, supplier: 'SanDisk', product_code: 'PROD-0005' },
    { name: 'Printer Ink Cartridge', sku: 'INK-HP-001', category_id: categories[1].id, cost_price: 4500, selling_price: 7000, quantity: 8, min_stock_level: 10, supplier: 'HP Nigeria', product_code: 'PROD-0006' },
  ]);

  // Customers
  const customers = await Customer.bulkCreate([
    { name: 'Emeka Okafor', email: 'emeka@techcorp.ng', phone: '08056789012', address: '12 Broad Street, Lagos', customer_code: 'CUST-0001', city: 'Lagos' },
    { name: 'Ngozi Adeyemi', email: 'ngozi@adeyemi.com', phone: '08067890123', address: '45 Adeola Odeku, VI', customer_code: 'CUST-0002', city: 'Lagos' },
    { name: 'Chukwudi Enterprises', email: 'info@chukwudi.ng', phone: '08078901234', address: '7 Ogui Road, Enugu', customer_code: 'CUST-0003', city: 'Enugu' },
    { name: 'Fatima Stores', email: 'fatima@stores.ng', phone: '08089012345', address: '22 Ahmadu Bello Way, Abuja', customer_code: 'CUST-0004', city: 'Abuja' },
  ]);

  // Expenses
  await Expense.bulkCreate([
    { title: 'Office Rent', category: 'Rent', amount: 150000, date: '2025-01-01', recorded_by: users[0].id },
    { title: 'Electricity Bill', category: 'Utilities', amount: 25000, date: '2025-01-05', recorded_by: users[1].id },
    { title: 'Staff Salaries', category: 'Payroll', amount: 450000, date: '2025-01-31', recorded_by: users[0].id },
    { title: 'Internet Subscription', category: 'Utilities', amount: 15000, date: '2025-02-01', recorded_by: users[1].id },
  ]);

  // Sample Orders
  for (let i = 0; i < 5; i++) {
    const customer = customers[i % customers.length];
    const product1 = products[i % products.length];
    const product2 = products[(i + 1) % products.length];
    const qty1 = 2, qty2 = 1;
    const subtotal = product1.selling_price * qty1 + product2.selling_price * qty2;
    const tax_amount = subtotal * 0.075;
    const total_amount = subtotal + tax_amount;

    const order = await Order.create({
      order_number: `ORD-2025-${String(i + 1).padStart(6, '0')}`,
      customer_id: customer.id,
      created_by: users[3].id,
      status: i < 3 ? 'paid' : 'pending',
      subtotal, tax_rate: 7.5, tax_amount, total_amount,
      amount_paid: i < 3 ? total_amount : 0,
      balance_due: i < 3 ? 0 : total_amount,
      payment_method: 'cash',
    });

    await OrderItem.bulkCreate([
      { order_id: order.id, product_id: product1.id, product_name: product1.name, quantity: qty1, unit_price: product1.selling_price, cost_price: product1.cost_price, total: product1.selling_price * qty1 },
      { order_id: order.id, product_id: product2.id, product_name: product2.name, quantity: qty2, unit_price: product2.selling_price, cost_price: product2.cost_price, total: product2.selling_price * qty2 },
    ]);

    await Invoice.create({
      invoice_number: `INV-2025-${String(i + 1).padStart(6, '0')}`,
      order_id: order.id, customer_id: customer.id, issued_by: users[3].id,
      subtotal, tax_amount, total_amount,
      amount_paid: i < 3 ? total_amount : 0,
      balance_due: i < 3 ? 0 : total_amount,
      status: i < 3 ? 'paid' : 'draft',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    if (i < 3) {
      await Transaction.create({
        reference: `TXN-${Date.now()}-${i}`,
        type: 'sale', order_id: order.id, customer_id: customer.id,
        amount: total_amount, payment_method: 'cash',
        description: `Payment for order ORD-2025-${String(i + 1).padStart(6, '0')}`,
        recorded_by: users[3].id,
      });
    }
  }

  console.log('Seed complete!');
  console.log('\nLogin credentials:');
  console.log('  Super Admin : admin@salesorder.com / Admin@1234');
  console.log('  Manager     : manager@salesorder.com / Manager@1234');
  console.log('  Accountant  : accountant@salesorder.com / Account@1234');
  console.log('  Sales Staff : sales@salesorder.com / Sales@1234');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
