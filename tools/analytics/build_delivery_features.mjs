import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Laasya%40123@localhost:5432/cricmetrics'
});

async function run() {
  await client.connect();
  console.log('Connected to local PostgreSQL DB');

  try {
    // 1. Drop table if exists
    console.log('Dropping existing delivery_features table if it exists...');
    await client.query('DROP TABLE IF EXISTS "delivery_features";');

    // 2. Create the table using the CTAS query
    console.log('Creating delivery_features table...');
    const createQuery = `
      CREATE TABLE "delivery_features" AS
      SELECT
        d."matchId", d.inning, d.over, d.ball, d."runsTotal",
        SUM(d."runsTotal") OVER (PARTITION BY d."matchId", d.inning ORDER BY d.over, d.ball) AS runs_at_ball,
        SUM(CASE WHEN d.wicket IS NOT NULL THEN 1 ELSE 0 END) OVER (PARTITION BY d."matchId", d.inning ORDER BY d.over, d.ball) AS wickets_at_ball,
        m.format, m.venue,
        CASE 
          WHEN d.over < 6 THEN 'powerplay' 
          WHEN d.over < 16 THEN 'middle' 
          ELSE 'death' 
        END AS match_phase
      FROM "Delivery" d
      JOIN "Match" m ON m.id = d."matchId"
      WHERE m.format = 'T20' AND d.inning IN (1,2);
    `;
    
    await client.query(createQuery);
    console.log('Table delivery_features created successfully!');

    // 3. Add an index for faster API querying
    console.log('Adding indexes...');
    await client.query(`
      CREATE INDEX idx_delivery_features_phase ON "delivery_features" (match_phase, wickets_at_ball);
    `);

    // 4. Print row count
    const countRes = await client.query('SELECT COUNT(*) FROM "delivery_features";');
    console.log(`\nTotal rows in delivery_features: ${countRes.rows[0].count}`);

    // 5. Print 5 sample rows
    const sampleRes = await client.query('SELECT * FROM "delivery_features" LIMIT 5;');
    console.log('\nSample 5 rows:');
    console.table(sampleRes.rows);

  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await client.end();
  }
}

run();
