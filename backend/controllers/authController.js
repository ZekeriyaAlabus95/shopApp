// controllers/authController.js (Hono + Cloudflare D1)

const bcrypt = require('bcryptjs');

// POST /register - register a new user
exports.register = async (c) => {
  try {
    const { username, password } = await c.req.json();

    // Validation
    if (!username || !password) {
      return c.json({ error: "Username and password are required" }, 400);
    }

    if (username.length < 3) {
      return c.json({ error: "Username must be at least 3 characters long" }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: "Password must be at least 6 characters long" }, 400);
    }

    // Check if user already exists
    const existingUser = await c.env.DB.prepare(
      "SELECT user_id FROM users WHERE username = ?"
    ).bind(username).all();

    if (existingUser.results && existingUser.results.length > 0) {
      return c.json({ error: "Username already exists" }, 400);
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    await c.env.DB.prepare(
      "INSERT INTO users (username, password) VALUES (?, ?)"
    ).bind(username, hashedPassword).run();

    // Get the new user ID
    const userResult = await c.env.DB.prepare("SELECT last_insert_rowid() as user_id").all();
    const userId = userResult.results && userResult.results[0] && userResult.results[0].user_id;

    return c.json({ 
      message: "✅ User registered successfully",
      user_id: userId,
      username: username
    });
  } catch (err) {
    console.error(err);
    return c.json({ error: "❌ Database error" }, 500);
  }
};

// POST /login - authenticate user
exports.login = async (c) => {
  try {
    const { username, password } = await c.req.json();

    // Validation
    if (!username || !password) {
      return c.json({ error: "Username and password are required" }, 400);
    }

    // Find user by username
    const userResult = await c.env.DB.prepare(
      "SELECT user_id, username, password FROM users WHERE username = ?"
    ).bind(username).all();

    const users = userResult.results || [];

    if (users.length === 0) {
      return c.json({ error: "Invalid username or password" }, 401);
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return c.json({ error: "Invalid username or password" }, 401);
    }

    // Return user info (without password)
    return c.json({
      message: "✅ Login successful",
      user: {
        user_id: user.user_id,
        username: user.username
      }
    });
  } catch (err) {
    console.error(err);
    return c.json({ error: "❌ Database error" }, 500);
  }
};

// GET /verify - verify user token/session (for future JWT implementation)
exports.verify = async (c) => {
  try {
    // For now, this is a placeholder for future JWT implementation
    // You can implement JWT tokens later for stateless authentication
    return c.json({ message: "Verification endpoint - implement JWT if needed" });
  } catch (err) {
    console.error(err);
    return c.json({ error: "❌ Database error" }, 500);
  }
};
