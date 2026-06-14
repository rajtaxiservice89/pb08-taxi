const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_C1iBy5NHgAfW@ep-wispy-river-atry3hoz.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require' });

async function main() {
  await pool.query(`UPDATE "SiteSetting" SET "heroTitle" = $1, "heroText" = $2`, [
    "Ride into the Destination",
    "Experience next-generation comfort and safety. From city commutes to outstation trips, we provide a seamless journey tailored for you."
  ]);
  console.log('updated');
}
main().catch(console.error).finally(() => pool.end());
