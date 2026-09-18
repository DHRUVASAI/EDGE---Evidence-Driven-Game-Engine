import { PrismaClient } from '@prisma/client';
import https from 'https';

const prisma = new PrismaClient();

const ESPN_MAP = {
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

async function patchDatabase() {
  console.log('Starting ESPN Cricinfo image patch on PostgreSQL Player table...');
  const players = await prisma.player.findMany({
    select: { id: true, name: true, fullName: true, espnId: true, imageUrl: true }
  });

  let updatedCount = 0;

  for (const player of players) {
    let espnId = player.espnId;

    if (!espnId) {
      const nameKey = (player.fullName || player.name).toLowerCase().trim();
      const shortKey = player.name.toLowerCase().trim();
      espnId = ESPN_MAP[nameKey] || ESPN_MAP[shortKey];
    }

    if (espnId) {
      const imageUrl = `https://a.espncdn.com/i/headshots/cricket/players/full/${espnId}.png`;
      if (player.imageUrl !== imageUrl || player.espnId !== espnId) {
        await prisma.player.update({
          where: { id: player.id },
          data: { imageUrl, espnId }
        });
        updatedCount++;
      }
    }
  }

  console.log(`Successfully patched ${updatedCount} player records with ESPN Cricinfo headshot URLs in database.`);
  await prisma.$disconnect();
}

patchDatabase().catch(console.error);
