const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres:Laasya%40123@localhost:5432/cricmetrics' });
c.connect().then(async () => {
  const r = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'Player' ORDER BY ordinal_position");
  console.log('Player columns:', r.rows.map(x => x.column_name).join(', '));
  const r2 = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'Match' ORDER BY ordinal_position");
  console.log('Match columns:', r2.rows.map(x => x.column_name).join(', '));
  const r3 = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log('All tables:', r3.rows.map(x => x.table_name).join(', '));
  await c.end();
}).catch(e => console.error(e));
