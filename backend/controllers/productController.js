// controllers/productController.js (Hono + Cloudflare D1)

// GET /list - fetch all products
exports.listAll = async (c) => {
  try {
    const userId = c.req.header('X-User-ID');
    if (!userId) {
      return c.json({ error: "User ID required" }, 400);
    }

    const result = await c.env.DB.prepare(
      "SELECT p.*, s.name FROM product p JOIN source s ON p.source_id = s.source_id WHERE p.quantity > 0 AND p.user_id = ?"
    ).bind(userId).all();

    const rows = result.results || [];

    const localDate = (isoDate) => {
      if (!isoDate) return null;
      const d = new Date(isoDate);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const products = rows.map((row) => ({
      ...row,
      date_accepted: localDate(row.date_accepted),
    }));

    return c.json({ products });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Database error" }, 500);
  }
};


// GET /show - fetch a single product by ID

// POST /addProduct - add a new product
exports.addProduct = async (c) => {
  try {
    const userId = c.req.header('X-User-ID');
    if (!userId) {
      return c.json({ error: "User ID required" }, 400);
    }

    const body = await c.req.json();
    const { barcode, price, product_name, quantity, source_id, category } = body;

    if (isNaN(price) || Number(price) < 0) {
      return c.json({ error: "Price must be a positive number" }, 400);
    }
    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 0) {
      return c.json({ error: "Quantity must be a positive integer" }, 400);
    }
    if (!product_name || !barcode) {
      return c.json({ error: "Barcode and product name are required" }, 400);
    }

    const today = new Date().toISOString().split("T")[0];

    try {
      await c.env.DB.prepare(
        `INSERT INTO product 
          (barcode, price, date_accepted, product_name, quantity, source_id, category, user_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(barcode, price, today, product_name, quantity, source_id, category, userId)
        .run();
    } catch (err) {
      if (/UNIQUE constraint failed|SQLITE_CONSTRAINT/i.test(err.message || "")) {
        return c.json({ error: `Duplicate entry: barcode '${barcode}' already exists.` }, 400);
      }
      throw err;
    }

    return c.json({ message: "✅ Product added successfully" });
  } catch (err) {
    console.error(err);
    return c.json({ error: "❌ Database error" }, 500);
  }
};


// PUT /update - update a product by ID
exports.updateProduct = async (c) => {
  try {
    const userId = c.req.header('X-User-ID');
    if (!userId) {
      return c.json({ error: "User ID required" }, 400);
    }

    const { product_id, barcode, price, product_name, quantity, source_id } =
      await c.req.json();

    // Backend validation
    if (
      !product_id ||
      !barcode ||
      !product_name ||
      !price ||
      !quantity ||
      !source_id
    ) {
      return c.json({ error: "All fields are required" }, 400);
    }

    if (isNaN(price) || Number(price) < 0) {
      return c.json({ error: "Price must be a positive number" }, 400);
    }

    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 0) {
      return res
        .json({ error: "Quantity must be a positive integer" }, 400);
    }

    await c.env.DB.prepare(
      "UPDATE product SET barcode = ?, price = ?, product_name = ?, quantity = ?, source_id = ? WHERE product_id = ? AND user_id = ?"
    ).bind(barcode, price, product_name, quantity, source_id, product_id, userId).run();

    return c.json({
      message: `Product ${product_id} updated successfully`,
      updated: {
        barcode,
        price,
        product_name,
        quantity,
        source_id,
      },
    });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Database error" }, 500);
  }
};

// PUT /updateAllProducts - example: increase all prices by a certain amount
// PUT /updateAllProducts
exports.updateAllProducts = async (c) => {
  try {
    const { priceIncrease, type } = await c.req.json();
    if (type === "number") {
      await c.env.DB.prepare("UPDATE product SET price = price + ?").bind(priceIncrease).run();
    } else if (type === "percentage") {
      await c.env.DB.prepare("UPDATE product SET price = price * (1 + ? / 100)").bind(priceIncrease).run();
    } else {
      return c.json({ error: "Invalid type. Must be 'number' or 'percentage'" }, 400);
    }

    return c.json({ message: "✅ All products updated successfully" });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Database error" }, 500);
  }
};

// PUT /updateBySource
exports.updateBySource = async (c) => {
  try {
    const { source_id, changes } = await c.req.json();
    const { price, type } = changes;

    if (type === "number") {
      await c.env.DB.prepare("UPDATE product SET price = price + ? WHERE source_id = ?").bind(price, source_id).run();
    } else if (type === "percentage") {
      await c.env.DB.prepare("UPDATE product SET price = price * (1 + ? / 100) WHERE source_id = ?").bind(price, source_id).run();
    } else {
      return c.json({ error: "Invalid type. Must be 'number' or 'percentage'" }, 400);
    }

    return c.json({ message: `Products from source ${source_id} updated successfully` });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Database error" }, 500);
  }
};

// PUT /updateByCategory
exports.updateByCategory = async (c) => {
  try {
    const { category, changes } = await c.req.json();
    const { price, type } = changes;

    if (type === "number") {
      await c.env.DB.prepare("UPDATE product SET price = price + ? WHERE category = ?").bind(price, category).run();
    } else if (type === "percentage") {
      await c.env.DB.prepare("UPDATE product SET price = price * (1 + ? / 100) WHERE category = ?").bind(price, category).run();
    } else {
      return c.json({ error: "Invalid type. Must be 'number' or 'percentage'" }, 400);
    }

    return c.json({ message: `Products in category ${category} updated successfully` });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Database error" }, 500);
  }
};


// DELETE /deleteProduct - delete a product by ID
exports.deleteProduct = async (c) => {
  try {
    const { product_ids } = await c.req.json();

    if (!product_ids || product_ids.length === 0) {
      return c.json({ error: "No product IDs provided" }, 400);
    }

    // Generate placeholders for IN clause (?, ?, ?)
    const placeholders = product_ids.map(() => "?").join(",");

    await c.env.DB.prepare(
      `UPDATE product SET quantity = 0 where product_id IN (${placeholders})`
    ).bind(...product_ids).run();

    return c.json({
      message: `Products ${product_ids.join(", ")} deleted successfully`,
    });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Database error" }, 500);
  }
};
exports.findByBarcode = async (c) => {
  try {
    const userId = c.req.header('X-User-ID');
    if (!userId) {
      return c.json({ error: "User ID required" }, 400);
    }

    const barcode = c.req.query("barcode");

    const result = await c.env.DB.prepare(
      "SELECT p.*, s.name as source_name FROM product p JOIN source s ON p.source_id = s.source_id WHERE p.barcode = ? AND p.user_id = ?"
    ).bind(barcode, userId).all();
    const rows = result.results || [];

    if (rows.length === 0) {
      return c.json({ error: "❌ Product not found" }, 404);
    }

    return c.json({ product: rows[0] });
  } catch (err) {
    console.error(err);
    return c.json({ error: "❌ Database error" }, 500);
  }
};

// POST /sell - sell products and record transaction
exports.sellProduct = async (c) => {
  try {
    const userId = c.req.header("X-User-ID");
    if (!userId) {
      return c.json({ error: "User ID required" }, 400);
    }

    const { items } = await c.req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: "No products provided for selling" }, 400);
    }

    // 1) الحصول على بيانات المنتجات قبل البيع
    const productIds = items.map(i => i.product_id);
    const placeholders = productIds.map(() => "?").join(",");

    const existing = await c.env.DB
      .prepare(`SELECT product_id, price, quantity FROM product WHERE product_id IN (${placeholders}) AND user_id = ?`)
      .bind(...productIds, userId)
      .all();

    const rows = existing.results || [];
    if (rows.length !== items.length) {
      return c.json({ error: "Some products not found" }, 400);
    }

    // 2) التحقق من الكميات وحساب المجموع
    let total = 0;
    const updates = [];
    const soldItems = [];

    for (const item of items) {
      const p = rows.find(r => r.product_id === item.product_id);
      if (!p) return c.json({ error: `Product ${item.product_id} not found` }, 400);

      if (p.quantity < item.quantity) {
        return c.json({
          error: `Not enough quantity for product ${item.product_id}. Available: ${p.quantity}`
        }, 400);
      }

      total += p.price * item.quantity;

      updates.push({
        product_id: p.product_id,
        reduce: item.quantity,
        price: p.price
      });
    }

    const totalAmount = Number(total.toFixed(2));

    // 3) تنفيذ العمليات دفعة واحدة batch()
    const statements = [];

    // Insert transaction
    statements.push(
      c.env.DB.prepare("INSERT INTO transactions (user_id, total_amount, type) VALUES (?, ?, ?)").bind(userId, totalAmount, "sold")
    );

    // After inserting, get last row ID
    statements.push(
      c.env.DB.prepare("SELECT last_insert_rowid() as id")
    );

    const batchResult = await c.env.DB.batch(statements);

    const transactionId = batchResult[1].results[0].id;

    // 4) إدخال العناصر وتحديث الكميات
    const itemStatements = [];

    for (const u of updates) {
      itemStatements.push(
        c.env.DB.prepare(
          "INSERT INTO transaction_item (transaction_id, product_id, user_id, quantity, price) VALUES (?, ?, ?, ?, ?)"
        ).bind(transactionId, u.product_id, userId, u.reduce, u.price)
      );

      itemStatements.push(
        c.env.DB.prepare(
          "UPDATE product SET quantity = quantity - ? WHERE product_id = ? AND user_id = ?"
        ).bind(u.reduce, u.product_id, userId)
      );
    }

    await c.env.DB.batch(itemStatements);

    return c.json({
      message: "✅ Sale recorded successfully",
      transaction_id: transactionId,
      total_amount: totalAmount
    });

  } catch (err) {
    console.error(err);
    return c.json({ error: err.message || "Database error" }, 500);
  }
};



exports.addOrIncrease = async (c) => {
  try {
    const userId = c.req.header("X-User-ID");
    if (!userId) return c.json({ error: "User ID required" }, 400);

    const { items } = await c.req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: "Items are required" }, 400);
    }

    let totalAmount = 0;
    const transactionItems = [];
    let transactionSourceId = null;

    for (const item of items) {
      const {
        barcode,
        price,
        product_name,
        quantity,
        source_id,
        category,
      } = item;

      const qty = Number(quantity);
      const unitPrice = Number(price);
      const srcId = Number(source_id);

      if (!barcode || !product_name || !srcId || qty <= 0 || unitPrice <= 0) {
        return c.json({ error: "Invalid product data" }, 400);
      }

      if (transactionSourceId === null) {
        transactionSourceId = srcId;
      }

      totalAmount += qty * unitPrice;

      // Check if product exists
      const existing = await c.env.DB.prepare(
        "SELECT product_id, quantity FROM product WHERE barcode = ? AND user_id = ?"
      )
        .bind(barcode, userId)
        .all();

      const exists = existing.results?.length > 0;
      let productId;

      if (exists) {
        const newQty = Number(existing.results[0].quantity) + qty;
        productId = existing.results[0].product_id;

        await c.env.DB
          .prepare(
            "UPDATE product SET quantity = ?, price = ? WHERE product_id = ? AND user_id = ?"
          )
          .bind(newQty, unitPrice, productId, userId)
          .run();
      } else {
        const insertResult = await c.env.DB
          .prepare(
            `INSERT INTO product (barcode, price, date_accepted, product_name, quantity, source_id, category, user_id)
             VALUES (?, ?, DATE('now'), ?, ?, ?, ?, ?)`
          )
          .bind(
            barcode,
            unitPrice,
            product_name,
            qty,
            srcId,
            category,
            userId
          )
          .run();
        productId = insertResult.meta.last_row_id;
      }

      transactionItems.push({
        product_id: productId,
        qty,
        unitPrice,
      });
    }

    const transactionResult = await c.env.DB.prepare(
      `INSERT INTO transactions (user_id, source_id, total_amount, type)
       VALUES (?, ?, ?, 'bought')`
    ).bind(userId, transactionSourceId, totalAmount).run();

    const transactionId = transactionResult.meta.last_row_id;

    for (const ti of transactionItems) {
      await c.env.DB.prepare(
        `INSERT INTO transaction_item (transaction_id, product_id, user_id, quantity, price)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(transactionId, ti.product_id, userId, ti.qty, ti.unitPrice).run();
    }

    return c.json({
      message: "✅ Products updated and bought transaction recorded",
      transaction_id: transactionId,
      total_amount: Number(totalAmount.toFixed(2)),
      items_count: items.length,
    });
  } catch (err) {
    console.error(err);
    return c.json({ error: err.message || "❌ Database error" }, 500);
  }
};
    


// GET /products/categories - fetch all unique categories
exports.getCategories = async (c) => {
  try {
    const userId = c.req.header('X-User-ID');
    if (!userId) {
      return c.json({ error: "User ID required" }, 400);
    }

    const result = await c.env.DB.prepare("SELECT DISTINCT category FROM product WHERE category IS NOT NULL AND user_id = ?").bind(userId).all();
    const rows = result.results || [];
    const categories = rows.map(r => r.category);
    return c.json({ categories });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Database error fetching categories" }, 500);
  }
};
// PUT /api/products/updateSelected
// controllers/productController.js

// PUT /api/products/updateSelected
exports.updateSelectedProducts = async (c) => {
  try {
    const { product_ids, changes } = await c.req.json();
    const { price, type } = changes;

    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return c.json({ error: "No product IDs provided" }, 400);
    }

    // Build SQL dynamically
    let query, params;
    if (type === "number") {
      query = `UPDATE product SET price = price + ? WHERE product_id IN (${product_ids.map(() => "?").join(",")})`;
      params = [price, ...product_ids];
    } else if (type === "percentage") {
      query = `UPDATE product SET price = price * (1 + ? / 100) WHERE product_id IN (${product_ids.map(() => "?").join(",")})`;
      params = [price, ...product_ids];
    } else {
      return c.json({ error: "Invalid type. Must be 'number' or 'percentage'" }, 400);
    }

    await c.env.DB.prepare(query).bind(...params).run();

    return c.json({ success: true, message: "✅ Selected products updated successfully" });
  } catch (err) {
    console.error(err);
    return c.json({ error: "❌ Error updating selected products" }, 500);
  }
};

