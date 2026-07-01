const PLAYER_ID = "cf7f20a50c8142798124cfd0e1264b26"; // MS Dhoni

async function test() {
  console.log(`Fetching profile for MS Dhoni (ID: ${PLAYER_ID})...`);
  try {
    const res = await fetch(`http://localhost:3000/api/players/${PLAYER_ID}`);
    const data = await res.json();
    
    console.log("\n==================================");
    console.log(`👤 Player: ${data.fullName || data.name}`);
    console.log(`🎂 DOB: ${data.dob}`);
    console.log(`📝 Generated Bio:\n${data.bio}`);
    console.log("==================================\n");
    
    // Check if it actually generated a bio!
    if (data.bio) {
      console.log("✅ SUCCESS! The bio was generated on-the-fly and returned by the API.");
    } else {
      console.log("⚠️ FAILED! Bio is still null. Something went wrong (e.g., API Key invalid).");
    }

  } catch (error) {
    console.error("Error fetching from local server:", error);
  }
}

test();
