import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString =
  process.env.DATABASE_ADMIN_URL ||
  "postgresql://postgres:Mylocal%40123@localhost:5432/postgres";

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  const targetDbs = ["openfolio_next", "openfolio_next_test"];
  for (const db of targetDbs) {
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [db]
    );
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE "${db}"`);
      console.log(`Created database: ${db}`);
    } else {
      console.log(`Database already exists: ${db}`);
    }
  }
  await client.end();
}

run().catch((err) => {
  console.error("Error creating databases:", err);
  process.exit(1);
});
