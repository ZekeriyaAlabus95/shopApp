// controllers/productController.js (Hono + Cloudflare D1)

// GET /list - fetch all products
exports.listAll = async (c) => {
  try {
    const result = await c.env.DB.prepare(
      "SELECT p.*, s.name FROM product p JOIN source s ON p.source_id = s.source_id WHERE quantity > 0"
    ).all();

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
          (barcode, price, date_accepted, product_name, quantity, source_id, category) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(barcode, price, today, product_name, quantity, source_id, category)
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
      "UPDATE product SET barcode = ?, price = ?, product_name = ?, quantity = ?, source_id = ? WHERE product_id = ?"
    ).bind(barcode, price, product_name, quantity, source_id, product_id).run();

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
    const barcode = c.req.query("barcode");

    const result = await c.env.DB.prepare(
      "SELECT p.*, s.name as source_name FROM product p JOIN source s ON p.source_id = s.source_id WHERE barcode = ?"
    ).bind(barcode).all();
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
    const { items } = await c.req.json();
    // items = [{ product_id: number, quantity: number }]

    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: "No products provided for selling" }, 400);
    }

    try {
      await c.env.DB.prepare("BEGIN").run();

      // Validate stock and compute total with current snapshot prices
      let totalAmount = 0;
      const itemsWithPrice = [];

      for (const item of items) {
        const res1 = await c.env.DB.prepare(
          "SELECT product_id, price, quantity FROM product WHERE product_id = ?"
        ).bind(item.product_id).all();
        const rows = res1.results || [];

        if (!rows || rows.length === 0) {
          throw new Error(`Product ID ${item.product_id} not found`);
        }

        const product = rows[0];
        const currentQty = Number(product.quantity);
        const price = Number(product.price);
        const qty = Number(item.quantity);

        if (!Number.isFinite(qty) || qty <= 0) {
          throw new Error(`Invalid quantity for product ID ${item.product_id}`);
        }
        if (currentQty < qty) {
          throw new Error(
            `Not enough quantity for product ID ${item.product_id}. Available: ${currentQty}`
          );
        }

        totalAmount += price * qty;
        itemsWithPrice.push({ product_id: item.product_id, quantity: qty, price });
      }

      // Insert transaction
      await c.env.DB.prepare(
        "INSERT INTO `transaction` (total_amount) VALUES (?)"
      ).bind(Number(totalAmount.toFixed(2))).run();
      // Get last inserted id in SQLite
      const txIdRes = await c.env.DB.prepare("SELECT last_insert_rowid() as id").all();
      const transactionId = txIdRes.results && txIdRes.results[0] && txIdRes.results[0].id;

      // Insert items and decrement stock
      for (const it of itemsWithPrice) {
        await c.env.DB.prepare(
          "INSERT INTO transaction_item (transaction_id, product_id, quantity, price) VALUES (?, ?, ?, ?)"
        ).bind(transactionId, it.product_id, it.quantity, Number(it.price.toFixed(2))).run();

        await c.env.DB.prepare(
          "UPDATE product SET quantity = quantity - ? WHERE product_id = ?"
        ).bind(it.quantity, it.product_id).run();
      }

      await c.env.DB.prepare("COMMIT").run();
      return c.json({ message: "✅ Sale recorded", transaction_id: transactionId, total_amount: Number(totalAmount.toFixed(2)) });
    } catch (err) {
      await c.env.DB.prepare("ROLLBACK").run();
      console.error(err);
      return c.json({ error: err.message }, 400);
    }
  } catch (err) {
    console.error(err);
    return c.json({ error: "❌ Database error" }, 500);
  }
};

exports.addOrIncrease = async (c) => {
  try {
    const { barcode, price, product_name, quantity, source_id, category } =
      await c.req.json();

    // Check if product already exists
    const existing = await c.env.DB.prepare(
      "SELECT product_id, quantity FROM product WHERE barcode = ?"
    ).bind(barcode).all();
    const existingRows = existing.results || [];

    if (existingRows.length > 0) {
      // Increase quantity
      const newQty = Number(existingRows[0].quantity) + Number(quantity);
      await c.env.DB.prepare("UPDATE product SET quantity = ? WHERE product_id = ?").bind(
        newQty,
        existingRows[0].product_id,
      ).run();
      return c.json({
        message: `✅ Product exists. Quantity increased by ${quantity}`,
      });
    }

    // Insert new product
    await c.env.DB.prepare(
      `INSERT INTO product (barcode, price, date_accepted, product_name, quantity, source_id, category)
       VALUES (?, ?, DATE('now'), ?, ?, ?, ?)`
    ).bind(barcode, price, product_name, quantity, source_id, category).run();

    return c.json({ message: "✅ Product added successfully" });
  } catch (err) {
    console.error(err);
    return c.json({ error: "❌ Database error" }, 500);
  }
};
// GET /products/categories - fetch all unique categories
exports.getCategories = async (c) => {
  try {
    const result = await c.env.DB.prepare("SELECT DISTINCT category FROM product WHERE category IS NOT NULL").all();
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

