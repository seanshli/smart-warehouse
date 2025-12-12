// 即時更新工具
// 用於向所有連接的客戶端廣播倉庫變更（物品創建、更新、移動等）

// 儲存活動連接（Server-Sent Events）
// Format: "userEmail-householdId" or "userEmail-buildingId-building"
const connections = new Map<string, ReadableStreamDefaultController>()

// 向家庭內所有連接廣播更新
export function broadcastToHousehold(householdId: string, data: any) {
  const message = JSON.stringify({
    type: 'update', // 更新類型
    data, // 更新資料
    timestamp: new Date().toISOString() // 時間戳
  })
  
  // 查找此家庭的所有連接
  connections.forEach((controller, connectionId) => {
    if (connectionId.endsWith(`-${householdId}`) && !connectionId.includes('-building')) {
      try {
        controller.enqueue(`data: ${message}\n\n`) // 發送 Server-Sent Events 訊息
      } catch (error) {
        console.error('Error sending update to connection:', error)
        connections.delete(connectionId) // 刪除失效的連接
      }
    }
  })
}

// 向建築物內所有連接廣播更新（用於前臺門鈴）
export function broadcastToBuilding(buildingId: string, data: any) {
  const message = JSON.stringify({
    type: 'update', // 更新類型
    data, // 更新資料
    timestamp: new Date().toISOString() // 時間戳
  })
  
  // 查找此建築物的所有連接（包括前臺和住戶）
  connections.forEach((controller, connectionId) => {
    if (connectionId.includes(`-${buildingId}-building`)) {
      try {
        controller.enqueue(`data: ${message}\n\n`) // 發送 Server-Sent Events 訊息
      } catch (error) {
        console.error('Error sending update to building connection:', error)
        connections.delete(connectionId) // 刪除失效的連接
      }
    }
  })
}

// 向特定用戶廣播更新
export function broadcastToUser(userEmail: string, householdId: string, data: any) {
  const connectionId = `${userEmail}-${householdId}` // 連接 ID（用戶電子郵件 + 家庭 ID）
  const controller = connections.get(connectionId)
  
  if (!controller) {
    // Try to find connection with building context
    const buildingConnectionId = `${userEmail}-${householdId}-building`
    const buildingController = connections.get(buildingConnectionId)
    if (buildingController) {
      try {
        const message = JSON.stringify({
          type: 'update',
          data,
          timestamp: new Date().toISOString()
        })
        buildingController.enqueue(`data: ${message}\n\n`)
        return
      } catch (error) {
        console.error('Error sending update to building connection:', error)
        connections.delete(buildingConnectionId)
        return
      }
    }
    return
  }
  
  if (controller) {
    const message = JSON.stringify({
      type: 'update', // 更新類型
      data, // 更新資料
      timestamp: new Date().toISOString() // 時間戳
    })
    
    try {
      controller.enqueue(`data: ${message}\n\n`) // 發送 Server-Sent Events 訊息
    } catch (error) {
      console.error('Error sending update to user:', error)
      connections.delete(connectionId) // 刪除失效的連接
    }
  }
}

// 廣播門鈴事件（同時發送到住戶和前臺）
export function broadcastDoorBellEvent(doorBellId: string, householdId: string | null, buildingId: string, event: any) {
  const eventData = {
    type: 'doorbell', // 門鈴事件類型
    ...event,
    doorBellId,
    buildingId,
  }

  // 發送到住戶
  if (householdId) {
    broadcastToHousehold(householdId, eventData)
  }

  // 發送到前臺（建築物級別）
  broadcastToBuilding(buildingId, eventData)
}

// 添加連接
export function addConnection(connectionId: string, controller: ReadableStreamDefaultController) {
  connections.set(connectionId, controller)
}

// 移除連接
export function removeConnection(connectionId: string) {
  connections.delete(connectionId)
}

// 獲取所有連接
export function getConnections() {
  return connections
}
