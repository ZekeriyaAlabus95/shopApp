const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
     port: 3306,              // or your MySQL user
    password: "",           // your MySQL password (maybe empty for local XAMPP/WAMP)
    database: "shopdb",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(conn => {
        console.log("✅ MySQL connected!");
        conn.release();
    })
    .catch(err => {
        console.error("❌ MySQL connection failed:", err.message);
    });

module.exports = pool;
