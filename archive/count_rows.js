const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: 'postgresql://postgres:Laasya%40123@localhost:5432/cricmetrics' });
  await client.connect();

  const tables = ['"Player"', '"Match"', '"Delivery"', '"CareerStat"', '"AuctionHistory"', '"TeamMeta"'];
  for (const table of tables) {
    try {
      const res = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`${table}: ${res.rows[0].count} rows`);
    } catch (e) {
      console.log(`Failed to count ${table}`);
    }
  }
  await client.end();
}

main().catch(console.error);
