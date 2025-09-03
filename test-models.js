// Test script to check which OpenRouter models are accessible
const API_KEY = process.env.OPENROUTER_API_KEY || 'YOUR_API_KEY_HERE';
const BASE_URL = 'https://openrouter.ai/api/v1';

// List of models to test
const MODELS_TO_TEST = [
  'openai/gpt-4o',
  'openai/gpt-4o-mini', 
  'openai/gpt-4-turbo',
  'openai/gpt-3.5-turbo',
  'anthropic/claude-3-5-sonnet',
  'anthropic/claude-3-haiku',
  'google/gemini-pro',
  'meta-llama/llama-3.1-8b-instruct',
  'meta-llama/llama-3.1-70b-instruct'
];

async function testModel(modelName) {
  try {
    console.log(`\n🧪 Testing model: ${modelName}`);
    
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://rork-study-buddy-production-eeeb.up.railway.app',
        'X-Title': 'Study Buddy App'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: 'Hello! This is a test message to check if this model is accessible.'
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${modelName} - SUCCESS`);
      console.log(`   Response: ${data.choices[0]?.message?.content?.substring(0, 100)}...`);
      return { model: modelName, status: 'success', response: data };
    } else {
      const errorText = await response.text();
      console.log(`❌ ${modelName} - FAILED (${response.status})`);
      console.log(`   Error: ${errorText.substring(0, 200)}...`);
      return { model: modelName, status: 'failed', error: errorText, statusCode: response.status };
    }
  } catch (error) {
    console.log(`❌ ${modelName} - ERROR`);
    console.log(`   Error: ${error.message}`);
    return { model: modelName, status: 'error', error: error.message };
  }
}

async function testMultimodalModels() {
  console.log('\n🖼️ Testing Multimodal Models (Image Support)');
  
  const multimodalModels = [
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
    'anthropic/claude-3-5-sonnet'
  ];

  for (const model of multimodalModels) {
    try {
      console.log(`\n📸 Testing multimodal: ${model}`);
      
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://rork-study-buddy-production-eeeb.up.railway.app',
          'X-Title': 'Study Buddy App'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'What do you see in this image?'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
                  }
                }
              ]
            }
          ],
          max_tokens: 100,
          temperature: 0.1
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${model} - MULTIMODAL SUCCESS`);
        console.log(`   Response: ${data.choices[0]?.message?.content?.substring(0, 100)}...`);
      } else {
        const errorText = await response.text();
        console.log(`❌ ${model} - MULTIMODAL FAILED (${response.status})`);
        console.log(`   Error: ${errorText.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`❌ ${model} - MULTIMODAL ERROR`);
      console.log(`   Error: ${error.message}`);
    }
  }
}

async function runTests() {
  console.log('🚀 Starting OpenRouter Model Tests');
  console.log('=====================================');
  
  if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
    console.log('❌ No API key found. Please set OPENROUTER_API_KEY environment variable.');
    return;
  }

  console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...`);
  
  const results = [];
  
  // Test basic models
  for (const model of MODELS_TO_TEST) {
    const result = await testModel(model);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }

  // Test multimodal models
  await testMultimodalModels();

  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');
  const errors = results.filter(r => r.status === 'error');

  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`💥 Errors: ${errors.length}`);

  if (successful.length > 0) {
    console.log('\n🎯 Working Models:');
    successful.forEach(r => console.log(`   - ${r.model}`));
  }

  if (failed.length > 0) {
    console.log('\n🚫 Failed Models:');
    failed.forEach(r => console.log(`   - ${r.model}: ${r.statusCode}`));
  }
}

// Run the tests
runTests().catch(console.error);
