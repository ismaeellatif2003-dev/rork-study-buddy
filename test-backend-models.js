// Test script to check which models work with your current backend
const BACKEND_URL = 'https://rork-study-buddy-production-eeeb.up.railway.app';

// Test different models for OCR
const MODELS_TO_TEST = [
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'openai/gpt-4-turbo',
  'openai/gpt-3.5-turbo',
  'anthropic/claude-3-5-sonnet',
  'anthropic/claude-3-haiku'
];

async function testBackendModel(modelName) {
  try {
    console.log(`\n🧪 Testing backend with model: ${modelName}`);
    
    const response = await fetch(`${BACKEND_URL}/ai/ocr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        imageBase64: 'test-image-data',
        model: modelName
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${modelName} - SUCCESS`);
      console.log(`   Status: ${data.success}`);
      console.log(`   Note: ${data.note}`);
      if (data.error) {
        console.log(`   Error: ${data.error}`);
      }
      return { model: modelName, status: 'success', data };
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

async function runBackendTests() {
  console.log('🚀 Testing Backend Models');
  console.log('==========================');
  console.log(`🌐 Backend: ${BACKEND_URL}`);
  
  const results = [];
  
  for (const model of MODELS_TO_TEST) {
    const result = await testBackendModel(model);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
  }

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
    successful.forEach(r => {
      console.log(`   - ${r.model}`);
      if (r.data.note && !r.data.note.includes('mock')) {
        console.log(`     ✅ Real OCR working!`);
      } else {
        console.log(`     ⚠️  Mock response (API issue)`);
      }
    });
  }

  if (failed.length > 0) {
    console.log('\n🚫 Failed Models:');
    failed.forEach(r => console.log(`   - ${r.model}: ${r.statusCode}`));
  }
}

// Run the tests
runBackendTests().catch(console.error);
