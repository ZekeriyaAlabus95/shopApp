

// controllers/productController.js
const pool = require("../config/db")

// GET /list - fetch all products
exports.listAll = async (req, res) => {
    try {                                   
        const [rows] = await pool.query("SELECT p.*, s.name FROM product p  join source s using(source_id) where quantity > 0 ");
        res.json({ products: rows });
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

    await pool.query(
      `INSERT INTO product (barcode, price, date_accepted, product_name, quantity, source_id, category) 
       VALUES (?, ?, CURDATE(), ?, ?, ?, ?)`,
      [barcode, price, product_name, quantity, source_id, category]
    );

    res.json({ message: "✅ Product added successfully" });
  } catch (err) {
    console.error(err);

    // Check for duplicate entry error
    if (err.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: `Duplicate entry: barcode '${req.body.barcode}' already exists.` });
    } else {
      res.status(500).json({ error: "❌ Database error" });
    }
  }
};


// PUT /update - update a product by ID
exports.updateProduct = async (req, res) => {
    try {
        console.log("zAXsasd")
        const { product_id, barcode, price, date_accepted, product_name, quantity, source_id } = req.body;
        await pool.query(
            "UPDATE product SET barcode = ?, price = ?, date_accepted = ?, product_name = ?, quantity = ?, source_id = ? WHERE product_id = ?",
            [barcode, price, date_accepted, product_name, quantity, source_id, product_id]
        );
        res.json({
            message: `Product ${product_id} updated successfully`,
            updated: { barcode, price, date_accepted, product_name, quantity, source_id }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Databasegdf error" });
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
exports.updateByCayegory = async (req, res) => {
    try {
        const { source_id, changes } = req.body; // changes = { price, quantity }
        const { price, quantity } = changes;
        await pool.query(
            "UPDATE product SET price = ?, quantity = ? WHERE source_id = ?",
            [price, quantity, source_id]
        );
        res.json({ message: `Products from source ${source_id} updated successfully`, changes });
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
        res.json({ message: `Products from source ${source_id} updated successfully`, changes });
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

        res.json({ message: `Products ${product_ids.join(", ")} deleted successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};
exports.findByBarcode = async (req, res) => {
    try {
        const { barcode } = req.params;

        const [rows] = await pool.query(
            "SELECT p.*, s.name as source_name FROM product p JOIN source s ON p.source_id = s.source_id WHERE barcode = ?",
            [barcode]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "❌ Product not found" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "❌ Database error" });
    }
};

