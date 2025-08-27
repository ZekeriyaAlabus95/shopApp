// controllers/productController.js
const pool = require("../config/db");

// GET /list - fetch all products
exports.listAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT p.*, s.name FROM product p JOIN source s USING(source_id) WHERE quantity > 0"
    );

    // Convert backend date string to local YYYY-MM-DD
    const localDate = (isoDate) => {
      if (!isoDate) return null;
      const d = new Date(isoDate);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0"); // month is 0-indexed
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    const products = rows.map((row) => ({
      ...row,
      date_accepted: localDate(row.date_accepted),
    }));

    res.json({ products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};


// GET /show - fetch a single product by ID

// POST /addProduct - add a new product
// controllers/productController.js
exports.addProduct = async (req, res) => {
  try {
    const { barcode, price, product_name, quantity, source_id, category } = req.body;

    // --- Validation ---
    if (isNaN(price) || Number(price) < 0) {
      return res.status(400).json({ error: "Price must be a positive number" });
    }
    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 0) {
      return res.status(400).json({ error: "Quantity must be a positive integer" });
    }
    if (!product_name || !barcode) {
      return res.status(400).json({ error: "Barcode and product name are required" });
    }

    const today = new Date().toISOString().split("T")[0];

    await pool.query(
      `INSERT INTO product 
        (barcode, price, date_accepted, product_name, quantity, source_id, category) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [barcode, price, today, product_name, quantity, source_id, category]
    );

    res.json({ message: "✅ Product added successfully" });
  } catch (err) {
    console.error(err);

    if (err.code === "ER_DUP_ENTRY") {
      res.status(400).json({
        error: `Duplicate entry: barcode '${req.body.barcode}' already exists.`,
      });
    } else {
      res.status(500).json({ error: "❌ Database error" });
    }
  }
};


// PUT /update - update a product by ID
exports.updateProduct = async (req, res) => {
  try {
    const { product_id, barcode, price, product_name, quantity, source_id } =
      req.body;

    // Backend validation
    if (
      !product_id ||
      !barcode ||
      !product_name ||
      !price ||
      !quantity ||
      !source_id
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (isNaN(price) || Number(price) < 0) {
      return res.status(400).json({ error: "Price must be a positive number" });
    }

    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 0) {
      return res
        .status(400)
        .json({ error: "Quantity must be a positive integer" });
    }

    await pool.query(
      "UPDATE product SET barcode = ?, price = ?, product_name = ?, quantity = ?, source_id = ? WHERE product_id = ?",
      [barcode, price, product_name, quantity, source_id, product_id]
    );

    res.json({
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
    res.status(500).json({ error: "Database error" });
  }
};

// PUT /updateAllProducts - example: increase all prices by a certain amount
exports.updateAllProducts = async (req, res) => {
  try {
    const { priceIncrease } = req.body; // number
    await pool.query("UPDATE product SET price = price + ?", [priceIncrease]);
    res.json({ message: "All products updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};

// PUT /updateByCategory - update products by source_id (as a category example)
exports.updateByCategory = async (req, res) => {
  try {
    const { source_id, changes } = req.body; // changes = { price, quantity }
    const { price, quantity } = changes;
    await pool.query(
      "UPDATE product SET price = ?, quantity = ? WHERE source_id = ?",
      [price, quantity, source_id]
    );
    res.json({
      message: `Products from source ${source_id} updated successfully`,
      changes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};

// PUT /updateBySource - update products by source_id
exports.updateBySource = async (req, res) => {
  try {
    const { source_id, changes } = req.body; // changes = { price, quantity }
    const { price, quantity } = changes;
    await pool.query(
      "UPDATE product SET price = ?, quantity = ? WHERE source_id = ?",
      [price, quantity, source_id]
    );
    res.json({
      message: `Products from source ${source_id} updated successfully`,
      changes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};

// DELETE /deleteProduct - delete a product by ID
exports.deleteProduct = async (req, res) => {
  try {
    const { product_ids } = req.body; // expect an array: [1, 2, 3]

    if (!product_ids || product_ids.length === 0) {
      return res.status(400).json({ error: "No product IDs provided" });
    }

    // Generate placeholders for IN clause (?, ?, ?)
    const placeholders = product_ids.map(() => "?").join(",");

    await pool.query(
      `UPDATE product SET quantity = 0 where product_id IN (${placeholders})`,
      product_ids
    );

    res.json({
      message: `Products ${product_ids.join(", ")} deleted successfully`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};
exports.findByBarcode = async (req, res) => {
  try {
    const { barcode } = req.query;

    const [rows] = await pool.query(
      "SELECT p.*, s.name as source_name FROM product p JOIN source s ON p.source_id = s.source_id WHERE barcode = ?",
      [barcode]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "❌ Product not found" });
    }

    // Wrap product in an object
    res.json({ product: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "❌ Database error" });
  }
};

// POST /sell - sell products
exports.sellProduct = async (req, res) => {
  try {
    const { items } = req.body;
    // items = [{ product_id: 1, quantity: 2 }, { product_id: 5, quantity: 1 }, ...]

    if (!items || items.length === 0) {
      return res
        .status(400)
        .json({ error: "No products provided for selling" });
    }

    // Start a transaction to ensure consistency
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      for (const item of items) {
        const [rows] = await conn.query(
          "SELECT quantity FROM product WHERE product_id = ?",
          [item.product_id]
        );

        if (rows.length === 0) {
          throw new Error(`Product ID ${item.product_id} not found`);
        }

        const currentQty = Number(rows[0].quantity);
        if (currentQty < item.quantity) {
          throw new Error(
            `Not enough quantity for product ID ${item.product_id}. Available: ${currentQty}`
          );
        }

        await conn.query(
          "UPDATE product SET quantity = quantity - ? WHERE product_id = ?",
          [item.quantity, item.product_id]
        );
      }

      await conn.commit();
      res.json({ message: "✅ Products sold successfully" });
    } catch (err) {
      await conn.rollback();
      console.error(err);
      res.status(400).json({ error: err.message });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "❌ Database error" });
  }
};

exports.addOrIncrease = async (req, res) => {
  try {
    const { barcode, price, product_name, quantity, source_id, category } =
      req.body;

    // Check if product already exists
    const [existing] = await pool.query(
      "SELECT product_id, quantity FROM product WHERE barcode = ?",
      [barcode]
    );

    if (existing.length > 0) {
      // Increase quantity
      const newQty = Number(existing[0].quantity) + Number(quantity);
      await pool.query("UPDATE product SET quantity = ? WHERE product_id = ?", [
        newQty,
        existing[0].product_id,
      ]);
      return res.json({
        message: `✅ Product exists. Quantity increased by ${quantity}`,
      });
    }

    // Insert new product
    await pool.query(
      `INSERT INTO product (barcode, price, date_accepted, product_name, quantity, source_id, category)
       VALUES (?, ?, CURDATE(), ?, ?, ?, ?)`,
      [barcode, price, product_name, quantity, source_id, category]
    );

    res.json({ message: "✅ Product added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "❌ Database error" });
  }
};
