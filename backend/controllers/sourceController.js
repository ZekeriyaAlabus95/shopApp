
// controllers/sourceController.js
const pool = require("../config/db");

// GET /list - fetch all sources
exports.listAll = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM source");
        res.json({ sources: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};

// GET /show - fetch a single source by ID


// POST /addSource - add a new source
exports.addSource = async (req, res) => {
    try {
        const { name, phone, address } = req.body;

        // --- Validation ---
        if (!name || !name.trim()) {
            return res.status(400).json({ error: "Source name is required" });
        }

        if (phone && !/^\d+$/.test(phone)) {
            return res.status(400).json({ error: "Phone number must contain digits only" });
        }

        const [result] = await pool.query(
            "INSERT INTO source (name, phone, address) VALUES (?, ?, ?)",
            [name, phone, address]
        );

        res.json({ 
            message: "✅ Source added successfully", 
            source_id: result.insertId 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "❌ Database error" });
    }
};



// PUT /updateSource - update a source by ID
exports.updateSource = async (req, res) => {
    try {
        const { source_id, newName, newPhone, newAddress } = req.body;
        await pool.query(
            "UPDATE source SET name = ?, phone = ?, address = ? WHERE source_id = ?",
            [newName, newPhone, newAddress, source_id]
        );
        res.json({
            message: `Source ${source_id} updated successfully`,
            updated: { newName, newPhone, newAddress }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};

exports.deleteSource = async (req, res) => {
  try {
    const { source_ids } = req.body; // expecting an array of IDs
    if (!Array.isArray(source_ids) || source_ids.length === 0) {
      return res.status(400).json({ error: "No source IDs provided" });
    }

    await pool.query(
      "DELETE FROM source WHERE source_id IN (?)",
      [source_ids]
    );

    res.json({ message: `${source_ids.length} source(s) deleted successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
};

