async function run() {
  const res = await fetch('http://localhost:3000/api/dashboard/live-matches');
  const text = await res.text();
  console.log('RAW ROUTE RESPONSE:', text.slice(0, 500));
}
run();
