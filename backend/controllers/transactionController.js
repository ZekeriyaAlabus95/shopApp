// controllers/transactionController.js (Hono + Cloudflare D1)

// GET /api/transactions/list - list user's transactions
exports.listAll = async (c) => {
  try {
    const userId = c.req.header('X-User-ID');
    if (!userId) return c.json({ error: 'User ID required' }, 400);

    const res = await c.env.DB.prepare(
      `SELECT transaction_id, user_id, source_id, transaction_date, total_amount, type
       FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC`
    ).bind(userId).all();

    const rows = res.results || [];
    return c.json({ transactions: rows });
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Database error' }, 500);
  }
};

// GET /api/transactions/items?transaction_id=ID - get items for a transaction
exports.getItems = async (c) => {
  try {
    const userId = c.req.header('X-User-ID');
    if (!userId) return c.json({ error: 'User ID required' }, 400);

    const txId = c.req.query('transaction_id');
    if (!txId) return c.json({ error: 'transaction_id is required' }, 400);

    const res = await c.env.DB.prepare(
      `SELECT ti.transaction_item_id, ti.transaction_id, ti.product_id, ti.quantity, ti.price, p.product_name
       FROM transaction_item ti
       LEFT JOIN product p ON p.product_id = ti.product_id
       WHERE ti.transaction_id = ? AND ti.user_id = ?`
    ).bind(txId, userId).all();

    return c.json({ items: res.results || [] });
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Database error' }, 500);
  }
};

// POST /api/transactions/add - add a manual transaction (optional)
exports.add = async (c) => {
  try {
    const userId = c.req.header('X-User-ID');
    if (!userId) return c.json({ error: 'User ID required' }, 400);

    const { total_amount = 0, type = 'sell', source_id = null } = await c.req.json();
    const total = Number(total_amount);
    if (!Number.isFinite(total) || total < 0) {
      return c.json({ error: 'total_amount must be a positive number' }, 400);
    }

    await c.env.DB.prepare(
      'INSERT INTO transactions (user_id, source_id, total_amount, type) VALUES (?, ?, ?, ?)'
    ).bind(userId, source_id, total, type).run();

    const txIdRes = await c.env.DB.prepare('SELECT last_insert_rowid() as id').all();
    const transaction_id = txIdRes.results && txIdRes.results[0] && txIdRes.results[0].id;
    return c.json({ success: true, transaction_id });
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Database error' }, 500);
  }
};

// DELETE /api/transactions/delete - delete by ids
exports.deleteMany = async (c) => {
  try {
    const userId = c.req.header('X-User-ID');
    if (!userId) return c.json({ error: 'User ID required' }, 400);

    const { transaction_ids } = await c.req.json();
    if (!Array.isArray(transaction_ids) || transaction_ids.length === 0) {
      return c.json({ error: 'No transaction_ids provided' }, 400);
    }

    const placeholders = transaction_ids.map(() => '?').join(',');

    await c.env.DB.prepare(
      `DELETE FROM transactions WHERE transaction_id IN (${placeholders}) AND user_id = ?`
    ).bind(...transaction_ids, userId).run();

    return c.json({ success: true, deleted: transaction_ids.length });
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Database error' }, 500);
  }
};


