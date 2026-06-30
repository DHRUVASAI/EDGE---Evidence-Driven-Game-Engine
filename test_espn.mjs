fetch('https://hs-consumer-api.espncricinfo.com/v1/pages/player/home?playerId=253802')
  .then(r=>r.json())
  .then(d=>console.log(JSON.stringify(d, null, 2)))
  .catch(console.error);
