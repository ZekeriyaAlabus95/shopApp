const express = require("express");
const router = express.Router();

// Import from sourceController instead of productController
const { 
    listAll,
    showSource,
    addSource,
    updateSource,
    deleteSource
} = require("../controllers/sourceController"); // ← changed here

// Routes
router.get("/list", listAll);
router.get("/show", showSource);
router.post("/addSource", addSource);
router.put("/updateSource", updateSource);
router.delete("/deleteSource", deleteSource);

module.exports = router;
