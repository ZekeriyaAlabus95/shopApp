// controllers/sourceController.js (Hono + Cloudflare D1)

// GET /list - fetch all sources
exports.listAll = async (c) => {
    try {
        const result = await c.env.DB.prepare("SELECT * FROM source").all();
        const rows = result.results || [];
        return c.json({ sources: rows });
    } catch (err) {
        console.error(err);
        return c.json({ error: "Database error" }, 500);
    }
};

// GET /show - fetch a single source by ID


// POST /addSource - add a new source
exports.addSource = async (c) => {
    try {
        const { name, phone, address } = await c.req.json();

        // --- Validation ---
        if (!name || !name.trim()) {
            return c.json({ error: "Source name is required" }, 400);
        }

        if (phone && !/^\d+$/.test(phone)) {
            return c.json({ error: "Phone number must contain digits only" }, 400);
        }

        await c.env.DB.prepare(
            "INSERT INTO source (name, phone, address) VALUES (?, ?, ?)"
        ).bind(name, phone, address).run();
        const idRes = await c.env.DB.prepare("SELECT last_insert_rowid() as id").all();
        const sourceId = idRes.results && idRes.results[0] && idRes.results[0].id;

        return c.json({ 
            message: "✅ Source added successfully", 
            source_id: sourceId 
        });
    } catch (err) {
        console.error(err);
        return c.json({ error: "❌ Database error" }, 500);
    }
};



// PUT /updateSource - update a source by ID
exports.updateSource = async (c) => {
    try {
        const { source_id, newName, newPhone, newAddress } = await c.req.json();
        await c.env.DB.prepare(
            "UPDATE source SET name = ?, phone = ?, address = ? WHERE source_id = ?"
        ).bind(newName, newPhone, newAddress, source_id).run();
        return c.json({
            message: `Source ${source_id} updated successfully`,
            updated: { newName, newPhone, newAddress }
        });
    } catch (err) {
        console.error(err);
        return c.json({ error: "Database error" }, 500);
    }
};

exports.deleteSource = async (c) => {
  try {
    const { source_ids } = await c.req.json();
    if (!Array.isArray(source_ids) || source_ids.length === 0) {
      return c.json({ error: "No source IDs provided" }, 400);
    }

    const placeholders = source_ids.map(() => "?").join(",");
    await c.env.DB.prepare(
      `DELETE FROM source WHERE source_id IN (${placeholders})`
    ).bind(...source_ids).run();

    return c.json({ message: `${source_ids.length} source(s) deleted successfully` });
  } catch (err) {
    console.error(err);
    return c.json({ error: "Database error" }, 500);
  }
};

