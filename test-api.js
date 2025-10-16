// Test API endpoints for translation functionality
const fetch = require('node-fetch')

async function testAPI() {
  console.log('Testing API Endpoints:')
  console.log('================================')
  
  try {
    // Test search API
    console.log('\n1. Testing Search API...')
    const searchResponse = await fetch('http://localhost:3001/api/search?q=Panasonic', {
      headers: {
        'Cookie': 'next-auth.session-token=test' // Mock session
      }
    })
    
    if (searchResponse.ok) {
      const data = await searchResponse.json()
      console.log('Search API Response:', JSON.stringify(data, null, 2))
    } else {
      console.log('Search API Error:', searchResponse.status, searchResponse.statusText)
    }
    
    // Test items API
    console.log('\n2. Testing Items API...')
    const itemsResponse = await fetch('http://localhost:3001/api/items/grouped-direct-cached', {
      headers: {
        'Cookie': 'next-auth.session-token=test' // Mock session
      }
    })
    
    if (itemsResponse.ok) {
      const data = await itemsResponse.json()
      console.log('Items API Response (first item):', JSON.stringify(data[0], null, 2))
    } else {
      console.log('Items API Error:', itemsResponse.status, itemsResponse.statusText)
    }
    
  } catch (error) {
    console.error('API Test Error:', error.message)
  }
}

testAPI()
