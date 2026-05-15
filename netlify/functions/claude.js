const https = require('https');

const BASE_CLINICA = `
DICIONÁRIO CLÍNICO — PILATES (resumo para prescrição)

SPINE STRETCH: Hipomobilidade=segmentos retificados→hipermobilidade compensatória adjacente→desgaste precoce. Pelve retroversão=encurtamento isquiotibiais/piriforme→retificação lombar. Pelve anteversão=encurtamento lombares/iliopsoas. Dor irradiada=compressão neural. Dor pontual=lesão discal. Dor queimação=fadiga muscular/facetária/instabilidade.

SPINE EXTENSION: Hipomobilidade torácica=restrição extensão. Encurtamento peitoral/grande dorsal=baixa amplitude flexão ombros. Dor ombro anterior=tendinite supraespinhoso/bursite.

MERMAID: Inclinação ruim=restrições articulares/musculares coluna. Hiperativação trapézio=mau ritmo escapuloumeral→tendinites ombro. Restrição escapular=diminuição espaço subacromial+fraqueza depressores.

STEP DOWN: Joelho valgo=fraqueza glúteo médio+tensão banda iliotibial. Joelho varo=encurtamento rotadores externos quadril(piriforme). Pelve oscilação=fraqueza glúteo médio.

FOOTWORK: Pelve retroversão=encurtamento isquiotibiais/piriforme. Pelve anteversão=encurtamento paravertebrais/iliopsoas. Hipomobilidade tornozelo=encurtamento tríceps sural. Valgo=fraqueza glúteo médio. Varo=encurtamento rotadores externos.

LEG EXTENSION: Pelve retroversão=piriforme encurtado. Pelve anteversão=iliopsoas/QL encurtados. Joelho valgo dinâmico=rotadores internos/adutores/TFL encurtados→pelve anteversão. Pé supinado=rotação externa quadril+pelve retroversão. Pé pronado=rotação interna+valgo dinâmico+pelve anteversão.

PUMPING ONE LEG: Pelve oscilação=fraqueza glúteo médio. Joelho valgo=fraqueza glúteo médio+encurtamento adutores. Pé pronação=fraqueza glúteo médio+redução arco plantar→indicar footwork intensivo.

GOING UP FRONT: Força ruim=fraqueza extensores quadril/joelho. Controle tronco ruim=fraqueza abdominais+paravertebrais. Impulso excessivo=indicar pré-pilates.

TRÍCEPS: Estabilidade escapular ruim=descolamento borda medial escápula. Dor ombro anterior=bursite+tendinite.

ADUÇÃO MMSS: Mobilidade ruim=fraqueza adutores ou encurtamento grande dorsal/supraespinhoso→hiperatividade trapézio→mau ritmo escapuloumeral. Cervical retificada=encurtamento ECM. Força MMII ruim=fraqueza flexores quadril+abdominais.

BÍCEPS: Elevação ombros=fraqueza serrátil anterior→hiperatividade trapézio. MMII descolados=tensão banda iliotibial+pelvitrocanterianos→pelve tendente retroversão.

ABDUÇÃO HORIZONTAL: Trapézio hiperativo=compensação. Força interescapulares ruim=grande descolamento bordas mediais. Punho extensão=carga leve. Punho flexão=fraqueza extensores punho.

SIT UP: Força ruim=fraqueza abdominal+possível restrição mobilidade lombar. Molas necessárias=menor força abdominal.

SÍNDROMES: Cruzada inferior=anteversão pélvica+joelho valgo+pé pronado+fraqueza glúteos+encurtamento iliopsoas/paravertebrais. Cruzada superior=hipercifose+projeção anterior cabeça+ombros anteriorizados+fraqueza interescapulares+encurtamento peitorais. Instabilidade lombar=dor difusa/queimação+fraqueza multífidos+fraqueza abdominal. Síndrome ombro=hiperatividade trapézio+fraqueza interescapulares+mau ritmo escapuloumeral.
`;

exports.handler = function(event, context, callback) {
  if (event.httpMethod === 'OPTIONS') {
    return callback(null, {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    });
  }

  if (event.httpMethod !== 'POST') {
    return callback(null, { statusCode: 405, body: 'Method Not Allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return callback(null, {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Chave de API não configurada.' }),
    });
  }

  try {
    const parsed = JSON.parse(event.body);

    if (parsed.messages && parsed.messages[0] &&
        parsed.messages[0].content &&
        parsed.messages[0].content.includes('ACHADOS DA AULA AVALIATIVA')) {
      parsed.messages[0].content = BASE_CLINICA + '\n\n' + parsed.messages[0].content;
    }

    const bodyData = JSON.stringify(parsed);

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(bodyData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        callback(null, {
          statusCode: res.statusCode,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: data,
        });
      });
    });

    req.on('error', (err) => {
      callback(null, {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: err.message }),
      });
    });

    req.write(bodyData);
    req.end();
  } catch(e) {
    callback(null, {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message }),
    });
  }
};
