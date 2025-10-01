const { Hono } = require("hono");
const { cors } = require("hono/cors");

// Controllers (Hono handlers)
const products = require("./controllers/productController");
const sources = require("./controllers/sourceController");

const app = new Hono();

// CORS middleware
app.use("*", cors());

// JSON content-type for all responses by default
app.use("*", async (c, next) => {
  c.header("Content-Type", "application/json");
  await next();
});

// Product routes
app.get("/api/products/list", products.listAll);
app.get("/api/products/findByBarcode", products.findByBarcode);
app.post("/api/products/addProduct", products.addProduct);
app.post("/api/products/addOrIncrease", products.addOrIncrease);
app.put("/api/products/update", products.updateProduct);
app.put("/api/products/updateAllProducts", products.updateAllProducts);
app.put("/api/products/updateByCategory", products.updateByCategory);
app.put("/api/products/updateBySource", products.updateBySource);
app.put("/api/products/updateSelected", products.updateSelectedProducts);
app.post("/api/products/sell", products.sellProduct);
app.get("/api/products/categories", products.getCategories);

// Source routes
app.get("/api/sources/list", sources.listAll);
app.post("/api/sources/addSource", sources.addSource);
app.put("/api/sources/updateSource", sources.updateSource);
app.delete("/api/sources/deleteSource", sources.deleteSource);

// Health check
app.get("/health", (c) => c.json({ ok: true }));

// Export the Worker fetch handler (CommonJS for Wrangler)
module.exports = { fetch: (...args) => app.fetch(...args) };