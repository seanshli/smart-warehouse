// 即時更新工具
// 用於向所有連接的客戶端廣播倉庫變更（物品創建、更新、移動等）

// 儲存活動連接（Server-Sent Events）
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
    if (connectionId.endsWith(`-${householdId}`)) {
      try {
        controller.enqueue(`data: ${message}\n\n`) // 發送 Server-Sent Events 訊息
      } catch (error) {
        console.error('Error sending update to connection:', error)
        connections.delete(connectionId) // 刪除失效的連接
      }
    }
  })
}

// 向特定用戶廣播更新
export function broadcastToUser(userEmail: string, householdId: string, data: any) {
  const connectionId = `${userEmail}-${householdId}` // 連接 ID（用戶電子郵件 + 家庭 ID）
  const controller = connections.get(connectionId)
  
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
