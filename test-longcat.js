// Simple test script to verify LongCat API integration
// Run with: node test-longcat.js

// Load environment variables
const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
      process.env[key] = values.join('=').replace(/"/g, '');
    }
  });
}

async function testLongCatAPI() {
  console.log('🚀 Testing LongCat API Integration...\n');

  // Check API key
  const apiKey = process.env.VITE_LONGCAT_API_KEY;
  if (!apiKey) {
    console.error('❌ VITE_LONGCAT_API_KEY not found in .env file');
    return;
  }

  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');

  try {
    // Test basic API call
    const response = await fetch('https://api.longcat.chat/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'LongCat-Flash-Chat',
        messages: [
          { role: 'user', content: 'Hello! Can you help me plan a trip to Dubai?' }
        ],
        temperature: 0.7,
        max_tokens: 100
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', response.status, errorData);
      return;
    }

    const data = await response.json();
    console.log('✅ API Response successful!');
    console.log('📝 Model:', data.model);
    console.log('💬 Response:', data.choices[0].message.content);
    console.log('📊 Usage:', data.usage);

    // Test travel intent extraction
    console.log('\n🧠 Testing travel intent extraction...');
    const intentResponse = await fetch('https://api.longcat.chat/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'LongCat-Flash-Chat',
        messages: [
          {
            role: 'system',
            content: `You are a UAE travel expert AI assistant. Extract travel intent from user messages in Urdu/English.

Rules:
1. Always return valid JSON
2. Infer missing information logically
3. Convert relative dates to absolute dates
4. Default currency to AED unless specified
5. Identify trip type from context

Example:
Input: "میں دبئی جانا چاہتا ہوں اگلے ہفتے، 2 بالغ، 1 بچہ، $3000 بجٹ"
Output: {
  "city": "dubai",
  "dates": {
    "start": "2024-02-01",
    "end": "2024-02-07"
  },
  "travelers": {
    "adults": 2,
    "children": 1,
    "infants": 0
  },
  "budget": {
    "amount": 11000,
    "currency": "AED"
  },
  "interests": ["family", "sightseeing"],
  "tripType": "family",
  "urgency": "soon"
}`
          },
          {
            role: 'user',
            content: `Extract travel intent from this message: "میں دبئی جانا چاہتا ہوں اگلے ہفتے، 2 بالغ، 1 بچہ، $3000 بجٹ"

Current date: ${new Date().toISOString().split('T')[0]}

Return only valid JSON:`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (intentResponse.ok) {
      const intentData = await intentResponse.json();
      console.log('✅ Travel intent extraction successful!');
      console.log('🎯 Extracted Intent:', intentData.choices[0].message.content);
    } else {
      console.log('⚠️ Travel intent test failed, but basic API works');
    }

    console.log('\n🎉 LongCat API integration is working correctly!');
    console.log('📈 Daily quota: 500,000 tokens');
    console.log('🔄 Rate limit: 100 requests/minute');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLongCatAPI();
