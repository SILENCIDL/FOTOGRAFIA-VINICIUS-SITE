import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/db/schema.js';
import bcrypt from 'bcryptjs';

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Uso: node scripts/seed-admin.mjs <email> <senha>');
  process.exit(1);
}

if (password.length < 12) {
  console.error('A senha deve ter no mínimo 12 caracteres.');
  process.exit(1);
}

const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/vinicius_site';

const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema });

const passwordHash = await bcrypt.hash(password, 12);

await db
  .insert(schema.users)
  .values({
    email: email.toLowerCase().trim(),
    passwordHash,
    role: 'admin',
  })
  .onConflictDoNothing({ target: schema.users.email });

console.log(`Usuário admin ${email} criado/atualizado.`);
await pool.end();
