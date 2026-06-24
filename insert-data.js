const https = require('https');

const API_URL = 'https://anapath-backend-ar7u.onrender.com/api/anapath';

// Données à insérer
const data = [
  {
    patientId: 'P001',
    typeExamen: 'BIOPSIE',
    prelevement: { site: 'Foie', description: 'Biopsie hépatique standard' }
  },
  {
    patientId: 'P002',
    typeExamen: 'FCV_PAP',
    prelevement: { site: 'Col utérin', description: 'Frottis cervico-vaginal' }
  },
  {
    patientId: 'P003',
    typeExamen: 'POS',
    prelevement: { site: 'Sein droit', description: 'Prélèvement organisé standard' }
  },
  {
    patientId: 'P004',
    typeExamen: 'POC',
    prelevement: { site: 'Ganglion axillaire', description: 'Prélèvement organisé complexe' }
  },
  {
    patientId: 'P005',
    typeExamen: 'EXTEMPORANE_STAT',
    isExtemporane: true,
    prelevement: { site: 'Tumeur mammaire', description: 'Pièce opératoire fraîche' }
  }
];

// Fonction utilitaire pour faire des requêtes HTTPS
function request(url, method, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: responseBody
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log('🚀 Démarrage du test de connexion...');

  // 1. Tester un GET simple
  try {
    console.log('📡 Test GET sur l’API...');
    const getResult = await request(API_URL, 'GET');
    console.log(`✅ GET - Statut: ${getResult.status}`);
    console.log(`📦 Corps: ${getResult.body.substring(0, 200)}`);
    if (getResult.status !== 200) {
      console.log('⚠️ Le GET a renvoyé un statut != 200, mais on continue...');
    }
  } catch (err) {
    console.error('❌ Échec du GET :', err.message);
    console.error('   (Détail complet :', err, ')');
    return;
  }

  console.log('\n--- Insertion des données ---\n');

  for (const item of data) {
    try {
      console.log(`➡️  Envoi de ${item.patientId} (${item.typeExamen})...`);
      const result = await request(API_URL, 'POST', item);
      console.log(`   Statut reçu : ${result.status}`);
      if (result.status === 201) {
        const json = JSON.parse(result.body);
        console.log(`✅ Inserté: ${json.anapathId} - ${json.patientId} (${json.typeExamen})`);
      } else {
        console.log(`❌ Erreur HTTP ${result.status}`);
        console.log(`   Réponse : ${result.body.substring(0, 300)}`);
      }
    } catch (err) {
      console.error(`❌ Erreur réseau pour ${item.patientId}:`, err.message);
      console.error(`   Détail complet :`, err);
    }
    console.log('---');
  }

  console.log('\n📋 Terminé.');
}

// Lancer le script
run();