import { Pool } from 'pg';

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_C1iBy5NHgAfW@ep-wispy-river-atry3hoz.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function main() {
  try {
    const result = await pool.query('SELECT * FROM "SiteSetting"');
    console.log("Settings:", result.rows);
  } catch(e) {
    console.log("No table SiteSetting");
  }
}

main().catch(console.error).finally(() => process.exit(0));
