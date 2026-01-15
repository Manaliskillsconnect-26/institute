import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const db = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

try {
  const connection = await db.getConnection();
  console.log(" MySQL connected successfully");
  connection.release();
} catch (err) {
  console.error(" DB connection failed:", err.message);
}

export default db;