// Script para criar um usuário administrador
const { Pool } = require('pg');
const { neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const { eq } = require('drizzle-orm');

neonConfig.webSocketConstructor = ws;

async function createAdmin() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não está definida");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Verifica se já existe um usuário administrador
    const { rows: existingAdmins } = await pool.query(
      "SELECT * FROM users WHERE type = 'admin'"
    );
    
    if (existingAdmins.length > 0) {
      console.log("Um usuário administrador já existe:", existingAdmins[0].email);
      return;
    }

    // Criar o usuário administrador
    const result = await pool.query(
      `INSERT INTO users (name, email, password, type, phone, address, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        "Administrador", 
        "admin@fastlanche.com", 
        "$2b$10$O/OcS3LIjnAmpWnBgMb8x.AnD/LLT2b52poWTkcQ2QZm/quYvsR/O", // admin123
        "admin",
        null,
        null,
        new Date()
      ]
    );
    
    console.log("Usuário administrador criado com sucesso:", result.rows[0]);
  } catch (error) {
    console.error("Erro ao criar usuário administrador:", error);
  } finally {
    await pool.end();
  }
}

createAdmin()
  .then(() => {
    console.log("Script finalizado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erro no script:", error);
    process.exit(1);
  });