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
    const userId = c.req.header('X-User-ID');
    if (!userId) {
      return c.json({ error: "User ID required" }, 400);
    }

    const { items } = await c.req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: "No products provided for selling" }, 400);
    }

    let transactionId = null;
    let totalAmount = 0;

    await c.env.DB.transaction(async (txn) => {
      let total = 0;
      const itemsWithPrice = [];

      // Validate & calculate
      for (const item of items) {
        const res = await txn
          .prepare(
            "SELECT product_id, price, quantity FROM product WHERE product_id = ? AND user_id = ?"
          )
          .bind(item.product_id, userId)
          .all();

        if (!res.results.length) {
          throw new Error(`Product ID ${item.product_id} not found`);
        }

        const p = res.results[0];
        if (p.quantity < item.quantity) {
          throw new Error(
            `Not enough quantity for product ID ${item.product_id}. Available: ${p.quantity}`
          );
        }

        total += p.price * item.quantity;
        itemsWithPrice.push({
          product_id: p.product_id,
          qty: item.quantity,
          price: p.price,
        });
      }

      totalAmount = Number(total.toFixed(2));

      // Insert transaction
      await txn
        .prepare("INSERT INTO transactions (user_id, total_amount) VALUES (?, ?)")
        .bind(userId, totalAmount)
        .run();

      const idRes = await txn.prepare("SELECT last_insert_rowid() AS id").all();
      transactionId = idRes.results[0].id;

      // Insert items & update stock
      for (const it of itemsWithPrice) {
        await txn
          .prepare(
            "INSERT INTO transaction_item (transaction_id, product_id, user_id, quantity, price) VALUES (?, ?, ?, ?, ?)"
          )
          .bind(transactionId, it.product_id, userId, it.qty, it.price)
          .run();

        await txn
          .prepare(
            "UPDATE product SET quantity = quantity - ? WHERE product_id = ? AND user_id = ?"
          )
          .bind(it.qty, it.product_id, userId)
          .run();
      }
    });

    return c.json({
      message: "✅ Sale recorded",
      transaction_id: transactionId,
      total_amount: totalAmount,
    });
  } catch (err) {
    console.error(err);
    return c.json({ error: err.message || "Database error" }, 500);
  }
};


exports.addOrIncrease = async (c) => {
  try {
    const userId = c.req.header('X-User-ID');
    if (!userId) {
      return c.json({ error: "User ID required" }, 400);
    }

    const { barcode, price, product_name, quantity, source_id, category } =
      await c.req.json();

    // Check if product already exists
    const existing = await c.env.DB.prepare(
      "SELECT product_id, quantity FROM product WHERE barcode = ? AND user_id = ?"
    ).bind(barcode, userId).all();
    const existingRows = existing.results || [];

    if (existingRows.length > 0) {
      // Increase quantity
      const newQty = Number(existingRows[0].quantity) + Number(quantity);
      await c.env.DB.prepare("UPDATE product SET quantity = ? WHERE product_id = ? AND user_id = ?").bind(
        newQty,
        existingRows[0].product_id,
        userId
      ).run();
      return c.json({
        message: `✅ Product exists. Quantity increased by ${quantity}`,
      });
    }

    // Insert new product
    await c.env.DB.prepare(
      `INSERT INTO product (barcode, price, date_accepted, product_name, quantity, source_id, category, user_id)
       VALUES (?, ?, DATE('now'), ?, ?, ?, ?, ?)`
    ).bind(barcode, price, product_name, quantity, source_id, category, userId).run();

    return c.json({ message: "✅ Product added successfully" });
  } catch (err) {
    console.error(err);
    return c.json({ error: "❌ Database error" }, 500);
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

