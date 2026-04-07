const { Versera, VerseraError } = require('./dist/index.js')

async function test() {
  console.log('Testing Versera SDK...')

  // Test 1: invalid key format
  try {
    new Versera({ apiKey: 'invalid' })
    console.log('FAIL: Should have thrown')
  } catch (e) {
    console.log('PASS: Invalid key rejected')
  }

  // Test 2: missing key
  try {
    new Versera({ apiKey: '' })
    console.log('FAIL: Should have thrown')
  } catch (e) {
    console.log('PASS: Missing key rejected')
  }

  // Test 3: valid instantiation
  try {
    const v = new Versera({
      apiKey: 'vrs_live_test123'
    })
    console.log('PASS: Valid key accepted')
  } catch (e) {
    console.log('FAIL:', e.message)
  }

  console.log('SDK tests complete.')
}

test()
