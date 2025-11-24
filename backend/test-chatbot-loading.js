const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'whatsapp_builder'
});

async function testChatbotLoading() {
  try {
    await client.connect();

    // Simulate what the service does
    const result = await client.query(
      'SELECT * FROM chatbots WHERE "isActive" = true ORDER BY "createdAt" ASC LIMIT 1'
    );

    if (result.rows.length === 0) {
      console.log('ERROR: No active chatbot found');
      return;
    }

    const chatbot = result.rows[0];
    console.log('=== FOUND CHATBOT ===');
    console.log('ID:', chatbot.id);
    console.log('Name:', chatbot.name);
    console.log('Nodes:', JSON.stringify(chatbot.nodes, null, 2));

    console.log('\n=== SEARCHING FOR START NODE ===');
    const startNode = chatbot.nodes.find(
      (node) => {
        console.log(`Checking node ${node.id}:`);
        console.log(`  node.type = "${node.type}"`);
        console.log(`  node.data?.type = "${node.data?.type}"`);
        console.log(`  node.type === 'start': ${node.type === 'start'}`);
        console.log(`  node.data?.type === 'start': ${node.data?.type === 'start'}`);
        const match = node.type === 'start' || node.data?.type === 'start';
        console.log(`  MATCH: ${match}`);
        return match;
      }
    );

    if (startNode) {
      console.log('\n=== START NODE FOUND ===');
      console.log('ID:', startNode.id);
      console.log('Type:', startNode.type);
    } else {
      console.log('\nERROR: START node not found!');
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

testChatbotLoading();
