const express = require("express");
const router = express.Router();

// Import from sourceController instead of productController
const { 
    listAll,
    
    addSource,
    updateSource,
    deleteSource
} = require("../controllers/sourceController"); // ← changed here

// Routes
router.get("/list", listAll);

router.post("/addSource", addSource);
router.put("/updateSource", updateSource);
router.delete("/deleteSource", deleteSource);

module.exports = router;
