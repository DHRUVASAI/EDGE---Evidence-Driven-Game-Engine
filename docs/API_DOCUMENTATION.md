# API Documentation

## Endpoints Summary

| Endpoint | Method | Description | Quota Impact |
| :--- | :--- | :--- | :--- |
| `GET /` | GET | Serves the main EDGE Analytics frontend. | 0 hits |
| `GET /api/cricketdata/players` | GET | Searches 17k+ local dataset + CricketData API. | 0 hits (local/cached) |
| `GET /players/<player_name>` | GET | Returns player profile & career statistics. | 0 hits |
| `GET /live` | GET | Fetches real-time ongoing match scores. | 0 hits |
| `GET /schedule` | GET | Returns upcoming international series schedule. | 0 hits |

## Request & Response Examples

### 1. Player Search
* **Request**: `GET /api/cricketdata/players?name=Virat`
* **Response**:
```json
{
  "query": "Virat",
  "count": 5,
  "players": [
    {
      "id": "46",
      "name": "Virat Kohli",
      "country": "India",
      "source": "local_database",
      "images": [
        "https://cdn.sportmonks.com/images/cricket/players/14/46.png",
        "https://hs-consumer-api.espncricinfo.com/v1/pages/player/image/46",
        "https://ui-avatars.com/api/?name=Virat+Kohli&background=198754&color=fff&size=256"
      ]
    }
  ]
}
```

### 2. Player Career Stats Profile
* **Request**: `GET /players/ms%20dhoni`
* **Response**:
```json
{
  "name": "Mahendra Singh Dhoni",
  "country": "India",
  "role": "International Player",
  "source": "local_database",
  "batting_stats": {
    "test": { "matches": "90", "runs": "4876", "average": "38.09" },
    "odi": { "matches": "350", "runs": "10773", "average": "50.57" },
    "t20": { "matches": "98", "runs": "1617", "average": "37.60" }
  }
}
```
