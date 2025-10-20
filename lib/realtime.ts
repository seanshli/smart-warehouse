// Real-time update utilities

// Store active connections
const connections = new Map<string, ReadableStreamDefaultController>()

// Function to broadcast updates to all connections in a household
export function broadcastToHousehold(householdId: string, data: any) {
  const message = JSON.stringify({
    type: 'update',
    data,
    timestamp: new Date().toISOString()
  })
  
  // Find all connections for this household
  connections.forEach((controller, connectionId) => {
    if (connectionId.endsWith(`-${householdId}`)) {
      try {
        controller.enqueue(`data: ${message}\n\n`)
      } catch (error) {
        console.error('Error sending update to connection:', error)
        connections.delete(connectionId)
      }
    }
  })
}

// Function to broadcast to specific user
export function broadcastToUser(userEmail: string, householdId: string, data: any) {
  const connectionId = `${userEmail}-${householdId}`
  const controller = connections.get(connectionId)
  
  if (controller) {
    const message = JSON.stringify({
      type: 'update',
      data,
      timestamp: new Date().toISOString()
    })
    
    try {
      controller.enqueue(`data: ${message}\n\n`)
    } catch (error) {
      console.error('Error sending update to user:', error)
      connections.delete(connectionId)
    }
  }
}

// Function to add a connection
export function addConnection(connectionId: string, controller: ReadableStreamDefaultController) {
  connections.set(connectionId, controller)
}

// Function to remove a connection
export function removeConnection(connectionId: string) {
  connections.delete(connectionId)
}

// Function to get all connections
export function getConnections() {
  return connections
}
