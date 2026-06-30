const PLAYER_ID = "cf7f20a50c8142798124cfd0e1264b26"; // MS Dhoni

async function test() {
  const res = await fetch(`http://localhost:3000/api/players/${PLAYER_ID}`);
  const text = await res.text();
  console.log(text);
}
test();
