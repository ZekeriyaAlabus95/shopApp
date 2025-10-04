// routes/authRoute.js

const auth = require("../controllers/authController");

// Authentication routes
const authRoutes = {
  register: auth.register,
  login: auth.login,
  verify: auth.verify
};

module.exports = authRoutes;
