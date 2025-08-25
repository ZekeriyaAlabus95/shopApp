
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

// DELETE /deleteSource - delete a source by ID
exports.deleteSource = async (req, res) => {
    try {
        const { source_id } = req.body;
        await pool.query("DELETE FROM source WHERE source_id = ?", [source_id]);
        res.json({ message: `Source ${source_id} deleted successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};
