require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function insertUser(username, password, role) {
  const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const hashedPassword = await bcrypt.hash(password, 10);
  await db.query("INSERT INTO utilisateurs (username, password, role) VALUES (?, ?, ?)", [username, hashedPassword, role]);
  console.log(`✅ Utilisateur ${username} ajouté avec succès`);
}

insertUser('guichetier', 'guichetier123', 'guichetier');
