const express = require("express");
const router = express.Router();
const { 
    listAll,
    addProduct,
    updateProduct,
    updateAllProducts,
    updateByCategory,
    updateBySource,
    deleteProduct,
    findByBarcode,
    sellProduct,
    getCategories,
    updateSelectedProducts,
    addOrIncrease  // <-- new controller
} = require("../controllers/productController");

// Product routes
router.get("/list", listAll);
router.get("/findByBarcode", findByBarcode);

router.post("/addProduct", addProduct);
router.post("/addOrIncrease", addOrIncrease); // <-- new POST endpoint

router.put("/update", updateProduct);
router.put("/updateAllProducts", updateAllProducts);
router.put("/updateByCategory", updateByCategory);
router.put("/updateBySource", updateBySource);
router.put("/updateSelected", updateSelectedProducts);

router.post("/sell", sellProduct);
router.delete("/deleteProduct", deleteProduct);
router.get("/categories", getCategories);
module.exports = router;
