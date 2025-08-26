const express = require("express");
const router = express.Router();
const { 
    listAll,
    addProduct,
    updateProduct,
    updateAllProducts,
    updateByCayegory,
    updateBySource,
    deleteProduct,
    findByBarcode,
    sellProduct,
    addOrIncrease  // <-- new controller
} = require("../controllers/productController");

// Product routes
router.get("/list", listAll);
router.get("/findByBarcode", findByBarcode);

router.post("/addProduct", addProduct);
router.post("/addOrIncrease", addOrIncrease); // <-- new POST endpoint

router.put("/update", updateProduct);
router.put("/updateAllProducts", updateAllProducts);
router.put("/updateByCategory", updateByCayegory);
router.put("/updateBySource", updateBySource);

router.post("/sell", sellProduct);
router.delete("/deleteProduct", deleteProduct);

module.exports = router;
