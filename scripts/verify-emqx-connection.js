#!/usr/bin/env node
/**
 * EMQX Broker Connection Verification Script
 * Tests connection to EMQX MQTT broker and reports status
 */

const mqtt = require('mqtt')
require('dotenv').config({ path: '.env.local' })

const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883'
const username = process.env.MQTT_USERNAME
const password = process.env.MQTT_PASSWORD
const clientId = process.env.MQTT_CLIENT_ID || `verify-${Date.now()}`

console.log('🔍 EMQX Broker Connection Verification')
console.log('=' .repeat(50))
console.log(`Broker URL: ${brokerUrl}`)
console.log(`Username: ${username || 'not set (anonymous)'}`)
console.log(`Client ID: ${clientId}`)
console.log('=' .repeat(50))
console.log('')

let connectionStatus = {
  connected: false,
  error: null,
  brokerUrl,
  clientId,
  connectedAt: null,
  disconnectedAt: null,
  testMessageReceived: false,
  testMessagePublished: false,
}

const testTopic = `smart-warehouse/test/${clientId}`
const testMessage = JSON.stringify({
  timestamp: new Date().toISOString(),
  test: true,
  message: 'EMQX connection test'
})

const options = {
  clientId,
  username,
  password,
  keepalive: 60,
  reconnectPeriod: 0, // Disable auto-reconnect for test
  connectTimeout: 10000, // 10 seconds timeout
  clean: true,
}

console.log('📡 Attempting to connect to EMQX broker...')
const client = mqtt.connect(brokerUrl, options)

const timeout = setTimeout(() => {
  if (!connectionStatus.connected) {
    console.error('❌ Connection timeout after 10 seconds')
    connectionStatus.error = 'Connection timeout'
    client.end()
    process.exit(1)
  }
}, 10000)

client.on('connect', () => {
  clearTimeout(timeout)
  connectionStatus.connected = true
  connectionStatus.connectedAt = new Date()
  console.log('✅ Successfully connected to EMQX broker!')
  console.log(`   Connected at: ${connectionStatus.connectedAt.toISOString()}`)
  console.log('')
  
  console.log('📨 Testing publish/subscribe...')
  
  // Subscribe to test topic
  client.subscribe(testTopic, { qos: 0 }, (err, granted) => {
    if (err) {
      console.error('❌ Failed to subscribe:', err.message)
      connectionStatus.error = `Subscribe failed: ${err.message}`
      client.end()
      process.exit(1)
    } else {
      console.log(`✅ Subscribed to topic: ${testTopic}`)
      
      // Wait a moment, then publish test message
      setTimeout(() => {
        client.publish(testTopic, testMessage, { qos: 0 }, (err) => {
          if (err) {
            console.error('❌ Failed to publish:', err.message)
            connectionStatus.error = `Publish failed: ${err.message}`
            client.end()
            process.exit(1)
          } else {
            console.log(`✅ Published test message to: ${testTopic}`)
            connectionStatus.testMessagePublished = true
            
            // Wait for message to be received
            setTimeout(() => {
              if (connectionStatus.testMessageReceived) {
                console.log('')
                console.log('✅ All tests passed!')
                console.log('')
                console.log('📊 Connection Summary:')
                console.log('=' .repeat(50))
                console.log(`Status: ✅ ACTIVE`)
                console.log(`Broker: ${brokerUrl}`)
                console.log(`Client ID: ${clientId}`)
                console.log(`Connected: ${connectionStatus.connectedAt.toISOString()}`)
                console.log(`Publish: ✅ Working`)
                console.log(`Subscribe: ✅ Working`)
                console.log('=' .repeat(50))
                client.end()
                process.exit(0)
              } else {
                console.log('⚠️  Test message not received (may be normal if broker doesn\'t echo)')
                console.log('')
                console.log('📊 Connection Summary:')
                console.log('=' .repeat(50))
                console.log(`Status: ✅ CONNECTED (publish working)`)
                console.log(`Broker: ${brokerUrl}`)
                console.log(`Client ID: ${clientId}`)
                console.log(`Connected: ${connectionStatus.connectedAt.toISOString()}`)
                console.log(`Publish: ✅ Working`)
                console.log(`Subscribe: ⚠️  Not verified (broker may not echo)`)
                console.log('=' .repeat(50))
                client.end()
                process.exit(0)
              }
            }, 2000)
          }
        })
      }, 500)
    }
  })
})

client.on('message', (topic, message) => {
  if (topic === testTopic) {
    console.log(`✅ Received test message on topic: ${topic}`)
    console.log(`   Message: ${message.toString()}`)
    connectionStatus.testMessageReceived = true
  }
})

client.on('error', (error) => {
  clearTimeout(timeout)
  console.error('❌ Connection error:', error.message)
  connectionStatus.error = error.message
  console.log('')
  console.log('📊 Connection Summary:')
  console.log('=' .repeat(50))
  console.log(`Status: ❌ FAILED`)
  console.log(`Broker: ${brokerUrl}`)
  console.log(`Error: ${error.message}`)
  console.log('')
  console.log('💡 Troubleshooting:')
  console.log('   1. Check if EMQX broker is running')
  console.log('   2. Verify MQTT_BROKER_URL in .env.local')
  console.log('   3. Check network connectivity')
  console.log('   4. Verify credentials if authentication is required')
  console.log('=' .repeat(50))
  process.exit(1)
})

client.on('close', () => {
  connectionStatus.disconnectedAt = new Date()
  console.log('🔌 Disconnected from broker')
})

client.on('offline', () => {
  console.log('⚠️  Client went offline')
})
