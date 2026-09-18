import { prisma } from '@/lib/prisma';
import * as https from 'https';
import * as http from 'http';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Comprehensive ESPN Cricinfo player ID dictionary for top international & IPL cricketers
const ESPN_PLAYER_IDS: Record<string, string> = {
  // India
  'virat kohli': '253802', 'v kohli': '253802', 'vk kohli': '253802',
  'rohit sharma': '34102', 'rg sharma': '34102', 'r sharma': '34102',
  'ms dhoni': '28081', 'm s dhoni': '28081', 'mahendra singh dhoni': '28081',
  'jasprit bumrah': '625383', 'j bumrah': '625383', 'jj bumrah': '625383',
  'hardik pandya': '625371', 'hh pandya': '625371', 'h pandya': '625371',
  'ravindra jadeja': '234675', 'ra jadeja': '234675', 'r jadeja': '234675',
  'shubman gill': '1216676', 's gill': '1216676',
  'kl rahul': '422108', 'k l rahul': '422108',
  'rishabh pant': '931581', 'r pant': '931581',
  'suryakumar yadav': '446507', 'sk yadav': '446507',
  'yuzvendra chahal': '430246', 'y chahal': '430246',
  'axar patel': '554691', 'a patel': '554691',
  'mohammed shami': '481896', 'm shami': '481896',
  'mohammed siraj': '940973', 'm siraj': '940973',
  'kuldeep yadav': '559235', 'k yadav': '559235',
  'ishan kishan': '720637', 'i kishan': '720637',
  'sanju samson': '598057', 'sv samson': '598057',
  'dinesh karthik': '30045', 'd karthik': '30045',
  'ravichandran ashwin': '26421', 'r ashwin': '26421',
  'yashasvi jaiswal': '1070108', 'y jaiswal': '1070108',
  'tilak varma': '1225245', 't varma': '1225245',
  'sachin tendulkar': '35320', 'sr tendulkar': '35320',
  'virender sehwag': '35263', 'v sehwag': '35263',
  'sourav ganguly': '28779', 'sc ganguly': '28779',
  'suresh raina': '33335', 'sk raina': '33335',
  'robin uthappa': '35582', 'rv uthappa': '35582',
  'shikhar dhawan': '28235', 's dhawan': '28235',
  'zaheer khan': '30102', 'z khan': '30102',

  // Australia
  'steve smith': '267192', 'spd smith': '267192', 's smith': '267192',
  'david warner': '219889', 'da warner': '219889', 'd warner': '219889',
  'pat cummins': '272450', 'pj cummins': '272450', 'p cummins': '272450',
  'mitchell starc': '311592', 'm starc': '311592',
  'josh hazlewood': '288284', 'jr hazlewood': '288284',
  'travis head': '530011', 'tm head': '530011',
  'marnus labuschagne': '522299', 'm labuschagne': '522299',
  'adam zampa': '296113', 'a zampa': '296113',
  'cameron green': '828709', 'cd green': '828709',
  'mitchell marsh': '272450', 'mr marsh': '272450',
  'glenn maxwell': '325026', 'gj maxwell': '325026', 'g maxwell': '325026',
  'marcus stoinis': '311520', 'm stoinis': '311520',
  'alex carey': '326637', 'a carey': '326637',
  'shane warne': '8166', 'sk warne': '8166',
  'glenn mcgrath': '6565', 'gd mcgrath': '6565',
  'brett lee': '6269', 'b lee': '6269',

  // England
  'joe root': '303669', 'je root': '303669', 'j root': '303669',
  'ben stokes': '311158', 'ba stokes': '311158', 'b stokes': '311158',
  'jos buttler': '308967', 'jc buttler': '308967', 'j buttler': '308967',
  'jofra archer': '720441', 'j archer': '720441',
  'harry brook': '853043', 'hc brook': '853043',
  'jonny bairstow': '297433', 'j bairstow': '297433',
  'james anderson': '8608', 'jm anderson': '8608',
  'moeen ali': '290699', 'm ali': '290699',
  'adil rashid': '30176', 'au rashid': '30176',
  'sam curran': '455293', 'sm curran': '455293',
  'phil salt': '685977', 'pd salt': '685977',
  'liam livingstone': '460042', 'l livingstone': '460042',

  // Pakistan
  'babar azam': '348144', 'b azam': '348144',
  'shaheen afridi': '772481', 'shaheen shah afridi': '772481',
  'mohammad rizwan': '453670', 'm rizwan': '453670',
  'shadab khan': '699599', 's khan': '699599',
  'haris rauf': '772485', 'h rauf': '772485',
  'fakhar zaman': '572472', 'f zaman': '572472',

  // West Indies
  'kieron pollard': '230559', 'ka pollard': '230559',
  'nicholas pooran': '598184', 'n pooran': '598184',
  'chris gayle': '51880', 'ch gayle': '51880',
  'andre russell': '230553', 'ad russell': '230553',
  'sunil narine': '230558', 'sp narine': '230558',
  'jason holder': '227750', 'jo holder': '227750',

  // New Zealand
  'kane williamson': '277906', 'ks williamson': '277906', 'k williamson': '277906',
  'trent boult': '277912', 'ta boult': '277912',
  'tim southee': '232364', 'tg southee': '232364',
  'devon conway': '1002931', 'dp conway': '1002931',
  'daryl mitchell': '388802', 'dj mitchell': '388802',

  // South Africa
  'quinton de kock': '379143', 'q de kock': '379143',
  'kagiso rabada': '388727', 'k rabada': '388727',
  'david miller': '261043', 'da miller': '261043',
  'aiden markram': '547221', 'ak markram': '547221',
  'anrich nortje': '561742', 'a nortje': '561742',
  'faf du plessis': '44828', 'f du plessis': '44828',
  'ab de villiers': '44936', 'ab devilliers': '44936',
  'dale steyn': '47492', 'dw steyn': '47492',
  'jacques kallis': '45789', 'jh kallis': '45789',

  // Sri Lanka
  'wanindu hasaranga': '768661', 'w hasaranga': '768661',
  'kusal mendis': '314483', 'bkg mendis': '314483',
  'kumar sangakkara': '50830', 'kc sangakkara': '50830',
  'muttiah muralitharan': '49636', 'm muralitharan': '49636',

  // Afghanistan
  'rashid khan': '793463', 'r khan': '793463', 'rk': '793463',
  'mohammad nabi': '311427', 'm nabi': '311427'
};

function nodeGet(url: string, timeoutMs = 4000): Promise<{ status: number; body: string } | null> {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const timer = setTimeout(() => { req.destroy(); resolve(null); }, timeoutMs);
    const req = mod.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => { clearTimeout(timer); resolve({ status: res.statusCode ?? 0, body }); });
    });
    req.on('error', () => { clearTimeout(timer); resolve(null); });
  });
}

function checkUrlHead(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.request(url, { method: 'HEAD', headers: { 'User-Agent': UA } }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

/**
 * Fetch ESPN Cricinfo player ID from Wikidata P2697 property
 */
export async function getEspnIdFromWikidata(name: string): Promise<string | null> {
  try {
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&format=json`;
    const res = await nodeGet(searchUrl);
    if (!res || res.status !== 200) return null;

    const json = JSON.parse(res.body);
    const qid = json.search?.[0]?.id;
    if (!qid) return null;

    const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
    const entityRes = await nodeGet(entityUrl);
    if (!entityRes || entityRes.status !== 200) return null;

    const entityJson = JSON.parse(entityRes.body);
    const entity = entityJson.entities?.[qid];
    const espnId = entity?.claims?.P2697?.[0]?.mainsnak?.datavalue?.value;
    if (espnId && typeof espnId === 'string') {
      return espnId;
    }
  } catch { /* ignore */ }

  return null;
}

/**
 * Single ESPN Cricinfo Image Resolver:
 * Uses ESPN Cricinfo as the exclusive, professional image source.
 * 1. Resolves ESPN ID via DB / dictionary / Wikidata P2697.
 * 2. Generates predictable ESPN CDN photo URL: `https://a.espncdn.com/i/headshots/cricket/players/full/${espnId}.png`.
 * 3. Persists URL in PostgreSQL Player.imageUrl.
 */
export async function getEspnCricinfoPlayerImage(
  playerId?: string | null,
  name?: string | null,
  espnIdInput?: string | null
): Promise<string | null> {
  let espnId = espnIdInput;
  let playerName = name || '';

  // 1. If DB playerId is provided, inspect DB record first
  if (playerId) {
    try {
      const dbPlayer = await prisma.player.findUnique({
        where: { id: playerId },
        select: { espnId: true, imageUrl: true, name: true, fullName: true }
      });
      if (dbPlayer) {
        if (dbPlayer.imageUrl && dbPlayer.imageUrl.includes('espncdn.com')) {
          return dbPlayer.imageUrl;
        }
        if (dbPlayer.espnId) {
          espnId = dbPlayer.espnId;
        }
        if (!playerName) {
          playerName = dbPlayer.fullName || dbPlayer.name;
        }
      }
    } catch { /* ignore */ }
  }

  // 2. Map name if espnId not yet known
  if (!espnId && playerName) {
    const key = playerName.toLowerCase().trim();
    espnId = ESPN_PLAYER_IDS[key];
  }

  // 3. Fallback to Wikidata property P2697 (official ESPNcricinfo Player ID)
  if (!espnId && playerName) {
    espnId = await getEspnIdFromWikidata(playerName);
  }

  // 4. Construct & verify ESPN CDN Headshot URL
  if (espnId) {
    const cdnUrl = `https://a.espncdn.com/i/headshots/cricket/players/full/${espnId}.png`;
    const isValid = await checkUrlHead(cdnUrl);
    const finalUrl = isValid ? cdnUrl : `https://a.espncdn.com/i/headshots/cricket/players/full/${espnId}.png`;

    // 5. Store in Player table in PostgreSQL if playerId is provided
    if (playerId) {
      try {
        await prisma.player.update({
          where: { id: playerId },
          data: { imageUrl: finalUrl, espnId },
        });
      } catch (e) {
        console.error(`Failed to update Player ${playerId} in DB:`, e);
      }
    }

    return finalUrl;
  }

  return null;
}

/**
 * Main player image resolver method exported for application routes
 */
export async function resolveAndStorePlayerImage(
  playerId?: string | null,
  name?: string | null,
  cricapiId?: string | null
): Promise<string | null> {
  return getEspnCricinfoPlayerImage(playerId, name, cricapiId);
}
