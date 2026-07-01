const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: 'postgresql://postgres:Laasya%40123@localhost:5432/cricmetrics' });
  await client.connect();
  const res = await client.query(`SELECT pg_database_size('cricmetrics')`);
  console.log('Size in bytes:', res.rows[0].pg_database_size);
  await client.end();
}

main().catch(console.error);
