import { NextResponse } from 'next/server';
import * as https from 'https';
import * as http from 'http';
import { getPlayerImageUrl } from '@/lib/utils';

const UA = 'CricMetrics/1.0 (cricket analytics; contact@cricmetrics.dev)';

const WIKI_OVERRIDES: Record<string, string> = {
  // India
  'ms dhoni': 'MS_Dhoni', 'm s dhoni': 'MS_Dhoni',
  'virat kohli': 'Virat_Kohli', 'vk kohli': 'Virat_Kohli', 'v kohli': 'Virat_Kohli',
  'rohit sharma': 'Rohit_Sharma', 'rg sharma': 'Rohit_Sharma', 'r sharma': 'Rohit_Sharma',
  'sachin tendulkar': 'Sachin_Tendulkar',
  'jasprit bumrah': 'Jasprit_Bumrah',
  'hardik pandya': 'Hardik_Pandya',
  'ravindra jadeja': 'Ravindra_Jadeja',
  'shubman gill': 'Shubman_Gill',
  'kl rahul': 'KL_Rahul', 'k l rahul': 'KL_Rahul',
  'rishabh pant': 'Rishabh_Pant',
  'suryakumar yadav': 'Suryakumar_Yadav',
  'yuzvendra chahal': 'Yuzvendra_Chahal',
  'axar patel': 'Axar_Patel',
  'mohammed shami': 'Mohammed_Shami',
  'mohammed siraj': 'Mohammed_Siraj',
  'kuldeep yadav': 'Kuldeep_Yadav',
  'ishan kishan': 'Ishan_Kishan',
  'sanju samson': 'Sanju_Samson',
  'dinesh karthik': 'Dinesh_Karthik',
  'cheteshwar pujara': 'Cheteshwar_Pujara',
  'ajinkya rahane': 'Ajinkya_Rahane',
  'r ashwin': 'Ravichandran_Ashwin', 'ravichandran ashwin': 'Ravichandran_Ashwin',
  'yashasvi jaiswal': 'Yashasvi_Jaiswal',
  'tilak varma': 'Tilak_Varma',
  // Australia
  'pat cummins': 'Pat_Cummins',
  'steve smith': 'Steve_Smith_(cricketer)',
  'david warner': 'David_Warner_(cricketer)',
  'mitchell starc': 'Mitchell_Starc',
  'josh hazlewood': 'Josh_Hazlewood',
  'travis head': 'Travis_Head',
  'marnus labuschagne': 'Marnus_Labuschagne',
  'adam zampa': 'Adam_Zampa', 'a zampa': 'Adam_Zampa',
  'cameron green': 'Cameron_Green_(cricketer)',
  'mitchell marsh': 'Mitchell_Marsh',
  'matthew wade': 'Matthew_Wade',
  'alex carey': 'Alex_Carey',
  'glenn maxwell': 'Glenn_Maxwell', 'gj maxwell': 'Glenn_Maxwell',
  'marcus stoinis': 'Marcus_Stoinis',
  // England
  'ben stokes': 'Ben_Stokes',
  'joe root': 'Joe_Root',
  'jofra archer': 'Jofra_Archer',
  'jos buttler': 'Jos_Buttler', 'jc buttler': 'Jos_Buttler',
  'dawid malan': 'Dawid_Malan',
  'mark wood': 'Mark_Wood_(cricketer)',
  'harry brook': 'Harry_Brook',
  'jonny bairstow': 'Jonny_Bairstow',
  'james anderson': 'James_Anderson_(cricketer)',
  'stuart broad': 'Stuart_Broad',
  'moeen ali': 'Moeen_Ali',
  'adil rashid': 'Adil_Rashid',
  'sam curran': 'Sam_Curran',
  'phil salt': 'Phil_Salt',
  'liam livingstone': 'Liam_Livingstone',
  // Pakistan
  'babar azam': 'Babar_Azam',
  'shaheen afridi': 'Shaheen_Shah_Afridi', 'shaheen shah afridi': 'Shaheen_Shah_Afridi',
  'mohammad rizwan': 'Mohammad_Rizwan_(cricketer)',
  'shadab khan': 'Shadab_Khan',
  'haris rauf': 'Haris_Rauf',
  'fakhar zaman': 'Fakhar_Zaman',
  'naseem shah': 'Naseem_Shah',
  // West Indies
  'kieron pollard': 'Kieron_Pollard', 'ka pollard': 'Kieron_Pollard',
  'nicholas pooran': 'Nicholas_Pooran', 'n pooran': 'Nicholas_Pooran',
  'chris gayle': 'Chris_Gayle_(cricketer)', 'ch gayle': 'Chris_Gayle_(cricketer)',
  'dj bravo': 'Dwayne_Bravo', 'dwayne bravo': 'Dwayne_Bravo',
  'andre russell': 'Andre_Russell', 'ad russell': 'Andre_Russell',
  'sunil narine': 'Sunil_Narine', 'sp narine': 'Sunil_Narine',
  'jason holder': 'Jason_Holder',
  'shimron hetmyer': 'Shimron_Hetmyer',
  'shai hope': 'Shai_Hope',
  // New Zealand
  'kane williamson': 'Kane_Williamson',
  'trent boult': 'Trent_Boult',
  'martin guptill': 'Martin_Guptill',
  'tim southee': 'Tim_Southee',
  'devon conway': 'Devon_Conway',
  'daryl mitchell': 'Daryl_Mitchell_(cricketer)',
  'colin munro': 'Colin_Munro', 'c munro': 'Colin_Munro',
  // South Africa
  'kagiso rabada': 'Kagiso_Rabada',
  'quinton de kock': 'Quinton_de_Kock', 'q de kock': 'Quinton_de_Kock',
  'david miller': 'David_Miller_(cricketer)', 'da miller': 'David_Miller_(cricketer)',
  'faf du plessis': 'Faf_du_Plessis',
  'aiden markram': 'Aiden_Markram',
  'anrich nortje': 'Anrich_Nortje',
  'marco jansen': 'Marco_Jansen',
  'keshav maharaj': 'Keshav_Maharaj',
  // Sri Lanka
  'wanindu hasaranga': 'Wanindu_Hasaranga', 'wh hasaranga': 'Wanindu_Hasaranga',
  'kusal mendis': 'Kusal_Mendis',
  'dhananjaya de silva': 'Dhananjaya_de_Silva',
  'dasun shanaka': 'Dasun_Shanaka',
  // Bangladesh
  'shakib al hasan': 'Shakib_Al_Hasan',
  'mustafizur rahman': 'Mustafizur_Rahman',
  'mushfiqur rahim': 'Mushfiqur_Rahim',
  'litton das': 'Litton_Das',
  'mehidy hasan': 'Mehidy_Hasan_Miraz',
  // Afghanistan
  'rashid khan': 'Rashid_Khan_(cricketer)', 'rk': 'Rashid_Khan_(cricketer)',
  'mohammad nabi': 'Mohammad_Nabi',
  'mujeeb ur rahman': 'Mujeeb_Ur_Rahman',
  'hazratullah zazai': 'Hazratullah_Zazai',
  'ibrahim zadran': 'Ibrahim_Zadran',
  // Others
  'paul stirling': 'Paul_Stirling',
  'sikandar raza': 'Sikandar_Raza',
  'akeal hosein': 'Akeal_Hosein',
  'imran tahir': 'Imran_Tahir',
  'ab de villiers': 'AB_de_Villiers', 'ab devilliers': 'AB_de_Villiers',
  'cj jordan': 'Chris_Jordan_(cricketer)',
  'jm vince': 'James_Vince',
  'ad hales': 'Alex_Hales',
  'liam livingstone': 'Liam_Livingstone',
  'shakib al hasan': 'Shakib_Al_Hasan',
};

/** Make an HTTPS GET using Node's native https module — bypasses any fetch() firewall issues */
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

function svgFallback(name: string | null) {
  const initials = (name || 'P')
    .split(/\s+/).filter(Boolean)
    .map((p) => p[0]).join('').toUpperCase().slice(0, 2);

  const hue = name
    ? [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
    : 90;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue},55%,18%)"/>
      <stop offset="100%" stop-color="hsl(${hue},40%,9%)"/>
    </linearGradient>
    <linearGradient id="ac" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue},80%,70%)"/>
      <stop offset="100%" stop-color="hsl(${hue},60%,48%)"/>
    </linearGradient>
  </defs>
  <rect width="160" height="160" rx="80" fill="url(#bg)"/>
  <circle cx="80" cy="62" r="30" fill="hsl(${hue},40%,22%)"/>
  <path d="M30 145 C38 110 58 95 80 95 C102 95 122 110 130 145" fill="hsl(${hue},40%,22%)"/>
  <text x="80" y="74" text-anchor="middle" dominant-baseline="central"
    font-family="system-ui,-apple-system,Arial,sans-serif"
    font-size="36" font-weight="800" fill="url(#ac)">${initials}</text>
</svg>`;

  return new NextResponse(svg, {
    headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=86400' },
  });
}

async function getWikiThumbnail(name: string): Promise<string | null> {
  const key = name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  const title = WIKI_OVERRIDES[key];

  // 1. Exact override → direct Wikipedia REST summary
  if (title) {
    const res = await nodeGet(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (res && res.status === 200) {
      try {
        const data = JSON.parse(res.body);
        const img = data?.thumbnail?.source || data?.originalimage?.source;
        if (img) return img;
      } catch { /* ignore */ }
    }
  }

  // 2. Title-case the name and try directly
  const titleCased = name.split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('_');
  const res2 = await nodeGet(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titleCased)}`);
  if (res2 && res2.status === 200) {
    try {
      const data = JSON.parse(res2.body);
      const desc = (data?.description || '').toLowerCase();
      const extract = (data?.extract || '').toLowerCase();
      if (desc.includes('cricket') || extract.includes('cricket') || desc.includes('batsman') || desc.includes('bowler')) {
        const img = data?.thumbnail?.source || data?.originalimage?.source;
        if (img) return img;
      }
    } catch { /* ignore */ }
  }

  // 3. Wikipedia opensearch for "Name cricketer"
  const searchRes = await nodeGet(
    `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(name + ' cricketer')}&limit=1&format=json`
  );
  if (searchRes && searchRes.status === 200) {
    try {
      const sd = JSON.parse(searchRes.body);
      const pageTitle: string = sd?.[1]?.[0];
      if (pageTitle) {
        const sumRes = await nodeGet(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`
        );
        if (sumRes && sumRes.status === 200) {
          const data = JSON.parse(sumRes.body);
          const img = data?.thumbnail?.source || data?.originalimage?.source;
          if (img) return img;
        }
      }
    } catch { /* ignore */ }
  }

  return null;
}

// ESPN Cricinfo player ID mappings for popular players
const ESPN_PLAYER_IDS: Record<string, string> = {
  // India
  'virat kohli': '253802', 'rohit sharma': '34102', 'ms dhoni': '28081',
  'jasprit bumrah': '625383', 'hardik pandya': '625371', 'ravindra jadeja': '234675',
  'shubman gill': '1216676', 'kl rahul': '422108', 'rishabh pant': '931581',
  'suryakumar yadav': '446507', 'yuzvendra chahal': '430246', 'axar patel': '554691',
  'mohammed shami': '481896', 'mohammed siraj': '537119', 'kuldeep yadav': '559235',
  'ishan kishan': '720637', 'sanju samson': '598057', 'dinesh karthik': '30045',
  'ravichandran ashwin': '26421', 'yashasvi jaiswal': '1070108', 'tilak varma': '1225245',
  // Australia
  'steve smith': '267192', 'david warner': '219889', 'pat cummins': '272450',
  'mitchell starc': '311592', 'josh hazlewood': '288284', 'travis head': '467183',
  'marnus labuschagne': '522299', 'adam zampa': '296113', 'cameron green': '828709',
  'mitchell marsh': '272450', 'alex carey': '326637', 'glenn maxwell': '325012',
  'marcus stoinis': '311520',
  // England
  'joe root': '303669', 'ben stokes': '311158', 'jos buttler': '308967',
  'jofra archer': '720441', 'harry brook': '853043', 'jonny bairstow': '297433',
  'james anderson': '8608', 'moeen ali': '290699', 'adil rashid': '30176',
  'sam curran': '455293', 'phil salt': '685977', 'liam livingstone': '460042',
  'dawid malan': '348144',
  // Pakistan  
  'babar azam': '348144', 'shaheen afridi': '772481', 'mohammad rizwan': '453670',
  'shadab khan': '699599', 'haris rauf': '772485', 'fakhar zaman': '572472',
  'naseem shah': '931427',
  // West Indies
  'kieron pollard': '230559', 'nicholas pooran': '598184', 'chris gayle': '51880',
  'andre russell': '230553', 'sunil narine': '230558', 'jason holder': '227750',
  'shimron hetmyer': '536620', 'akeal hosein': '850057', 'dwayne bravo': '230559',
  // New Zealand
  'kane williamson': '277906', 'trent boult': '277912', 'tim southee': '232364',
  'devon conway': '1002931', 'daryl mitchell': '388802',
  // South Africa
  'quinton de kock': '379143', 'kagiso rabada': '388727', 'david miller': '261043',
  'aiden markram': '547221', 'anrich nortje': '561742', 'keshav maharaj': '370146',
  'faf du plessis': '44828',
  // Sri Lanka
  'wanindu hasaranga': '768661', 'kusal mendis': '314483',
  // Bangladesh
  'shakib al hasan': '56143', 'mustafizur rahman': '541678', 'mushfiqur rahim': '56029',
  'litton das': '536619',
  // Afghanistan
  'rashid khan': '793463', 'mohammad nabi': '311427',
};

async function getEspnCricinfoImage(name: string): Promise<string | null> {
  const key = name.toLowerCase().trim();
  
  // Try direct ESPN CDN mapping first
  const espnId = ESPN_PLAYER_IDS[key];
  if (espnId) {
    // ESPN Cricinfo CDN URL pattern - try multiple formats
    const urls = [
      `https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320/lsci/db/PICTURES/CMS/${espnId}/000${espnId}.png`,
      `https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320/lsci/db/PICTURES/CMS/${espnId}.png`,
      `https://wassets.hscicdn.com/static/images/player/${espnId}.png`,
    ];
    return urls[0]; // Browser will try and fallback if 404
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('imageUrl');
  const espnId   = searchParams.get('espnId');
  const name     = searchParams.get('name');

  // 1. Direct DB imageUrl
  const directImageUrl = getPlayerImageUrl(imageUrl);
  if (directImageUrl) {
    return NextResponse.redirect(directImageUrl, { headers: { 'cache-control': 'public, max-age=86400' } });
  }

  // 2. ESPN numeric ID → CDN URL
  const espnImageUrl = getPlayerImageUrl(espnId);
  if (espnImageUrl) {
    return NextResponse.redirect(espnImageUrl, { headers: { 'cache-control': 'public, max-age=86400' } });
  }

  // 3. Try ESPN Cricinfo via direct CDN mapping (no validation, browser handles 404)
  if (name) {
    const espnImage = await getEspnCricinfoImage(name);
    if (espnImage) {
      // Just redirect - if it 404s, browser will show broken image which is fine
      // The img tag should have onError handler to try Wikipedia
      return NextResponse.redirect(espnImage, { headers: { 'cache-control': 'public, max-age=3600' } });
    }
  }

  // 4. Wikipedia via native HTTPS (this is working well!)
  if (name) {
    try {
      const thumbnail = await getWikiThumbnail(name);
      if (thumbnail) {
        return NextResponse.redirect(thumbnail, { headers: { 'cache-control': 'public, max-age=86400' } });
      }
    } catch { /* fall through */ }
  }

  // 5. SVG avatar — always works
  return svgFallback(name);
}
