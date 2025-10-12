// Translation system for UI internationalization

export interface Translations {
  // Navigation
  dashboard: string
  rooms: string
  categories: string
  activities: string
  notifications: string
  members: string
  items: string
  
  // Common actions
  addItem: string
  search: string
  searching: string
  edit: string
  delete: string
  save: string
  saving: string
  cancel: string
  back: string
  next: string
  close: string
  optional: string
  move: string
  moving: string
  checkout: string
  checkingOut: string
  history: string
  editItem: string
  moveItem: string
  checkoutItem: string
  itemHistory: string
  moveToRoom: string
  checkoutQuantity: string
  reason: string
  moveConfirmation: string
  
  // Duplicate Detection
  potentialDuplicate: string
  newItem: string
  similarItemsFound: string
  similarItems: string
  similar: string
  createNewItem: string
  useExistingItem: string
  location: string
  editCabinet: string
  updateCabinet: string
  deleteCabinet: string
  deleteCabinetConfirmation: string
  deleteCabinetWarning: string
  
  // Search
  searchItems: string
  searchPlaceholder: string
  searchResults: string
  findingSuggestions: string
  filters: string
  allCategories: string
  allRooms: string
  clearFilters: string
  noSuggestionsFound: string
  noItemsFound: string
  lowStock: string
  
  // Room Management
  roomManagement: string
  categoryManagement: string
  masterBedroom: string
  defaultCabinet: string
  mainLivingArea: string
  cabinets: string
  noCabinetsInThisRoom: string
  clickToViewDetails: string
  
  // Cabinet names
  closet: string
  dresser: string
  rightCabinet: string
  middleCabinet: string
  
  // Item Management
  description: string
  minimumQuantity: string
  room: string
  cabinet: string
  barcode: string
  qrCode: string
  
  // Messages
  welcome: string
  signOut: string
  itemAddedSuccessfully: string
  failedToAddItem: string
  loading: string
  
  // Form labels
  itemDetails: string
  whereIsThisItemStored: string
  selectARoom: string
  selectACabinet: string
  autoCreateDefaultCabinet: string
  
  // Invitation Codes
  invitationCode: string
  shareInvitationCode: string
  regenerateInvitationCode: string
  copyInvitationCode: string
  invitationCodeInstructions: string
  joinWithInvitationCode: string
  enterInvitationCode: string
  invalidInvitationCode: string
  householdNotFound: string
  alreadyMemberOfHousehold: string
  alreadyMemberOfAnotherHousehold: string
  
  // AI Recognition
  aiRecognitionResults: string
  pleaseReviewAndEdit: string
  barcodeLearning: string
  willBeAddedToSystemDatabase: string
  lowAIConfidence: string
  aiRecognitionHasLowConfidence: string
  pleaseVerifyAndCorrect: string
  
  // Input Methods
  howWouldYouLikeToAddThisItem: string
  uploadPhoto: string
  takePhoto: string
  scanBarcode: string
  scanQRCode: string
  dragAndDropImage: string
  orClickToSelect: string
  dropImageHere: string
  clickToChangePhoto: string
  openCamera: string
  enterOrScanBarcode: string
  enterOrScanQRCode: string
  aiRecognize: string
  manualInput: string
  recognizeItem: string
  processing: string
  continue: string
  
  // Application
  smartWarehouse: string
  backToRooms: string
  itemsTotal: string
  noItemsInThisCabinet: string
  qty: string
  
  // Room Management
  addNewRoom: string
  addNewCabinet: string
  addNewCategory: string
  roomName: string
  cabinetName: string
  categoryName: string
  level: string
  level1MainCategory: string
  level2Subcategory: string
  level3SubSubcategory: string
  addRoom: string
  addCabinet: string
  addCategory: string
  
  // Activity Log Messages
  itemWasAddedToInventory: string
  roomWasAdded: string
  roomWasRemoved: string
  categoryWasAdded: string
  categoryWasRemoved: string
  by: string
  justNow: string
  minutesAgo: string
  hoursAgo: string
  daysAgo: string
  
  // Activity Actions
  created: string
  moved: string
  quantityUpdated: string
  updated: string
  roomCreated: string
  roomDeleted: string
  categoryCreated: string
  categoryDeleted: string
  itemAdded: string
  itemMoved: string
  testActivity: string
  
  // Activity Descriptions
  itemAddedDescription: string
  itemMovedDescription: string
  quantityUpdatedDescription: string
  testActivityDescription: string
  categoryCreatedDescription: string
  categoryDeletedDescription: string
  roomCreatedDescription: string
  roomDeletedDescription: string
  
  // AI Recognition
  aiConfidence: string
  itemName: string
  quantity: string
  category: string
  subcategory: string
  selectCategory: string
  selectSubcategory: string
  orEnterCustom: string
  
  // Time
  ago: string
  item: string
  
  // Dashboard
  totalItems: string
  lowStockItems: string
  householdMembers: string
  recentActivity: string
  refresh: string
  noRecentActivity: string
  startByAddingFirstItem: string
  noActivities: string
  activitiesWillAppearHere: string
  
  // Taiwan E-Invoice
  taiwanInvoice: string
  scanTaiwanInvoice: string
  uploadTaiwanInvoice: string
  taiwanInvoiceDetected: string
  taiwanInvoiceDecoded: string
  invoiceNumber: string
  invoiceDate: string
  sellerName: string
  totalAmount: string
  taxAmount: string
  invoiceItems: string
  processingTaiwanInvoice: string
  cameraNotAvailable: string
  
  // Default Rooms
  kitchen: string
  livingRoom: string
  kidRoom: string
  garage: string
  
  // Default Cabinets
  mainCabinet: string
  
  // Default Categories
  electronics: string
  tools: string
  clothing: string
  books: string
  miscellaneous: string
  
  // Category Name Translations (for existing categories)
  categoryNameTranslations: {
    [key: string]: string
  }
}

// English translations (default)
const en: Translations = {
  // Navigation
  dashboard: 'Dashboard',
  rooms: 'Rooms',
  categories: 'Categories',
  activities: 'Activities',
  notifications: 'Notifications',
  members: 'Members',
  items: 'Items',
  
  // Common actions
  addItem: 'Add Item',
  search: 'Search',
  searching: 'Searching...',
  edit: 'Edit',
  delete: 'Delete',
  save: 'Save',
  saving: 'Saving...',
  cancel: 'Cancel',
  back: 'Back',
  next: 'Next',
  close: 'Close',
  optional: 'Optional',
  move: 'Move',
  moving: 'Moving...',
  checkout: 'Checkout',
  checkingOut: 'Checking out...',
  history: 'History',
  editItem: 'Edit Item',
  moveItem: 'Move Item',
  checkoutItem: 'Checkout Item',
  itemHistory: 'Item History',
  moveToRoom: 'Move to Room',
  checkoutQuantity: 'Checkout Quantity',
  reason: 'Reason',
  moveConfirmation: 'Moving to',
  
  // Duplicate Detection
  potentialDuplicate: 'Potential Duplicate Item',
  newItem: 'New Item',
  similarItemsFound: 'Similar items found',
  similarItems: 'Similar Items',
  createNewItem: 'Create New Item',
  useExistingItem: 'Use Existing Item',
  location: 'Location',
  editCabinet: 'Edit Cabinet',
  updateCabinet: 'Update Cabinet',
  deleteCabinet: 'Delete Cabinet',
  deleteCabinetConfirmation: 'Are you sure you want to delete the cabinet',
  deleteCabinetWarning: 'This action cannot be undone and will also delete all items in this cabinet.',
  
  // Search
  searchItems: 'Search Items',
  searchPlaceholder: 'Search by name, description, barcode, or QR code...',
  searchResults: 'Search Results',
  findingSuggestions: 'Finding suggestions...',
  filters: 'Filters',
  allCategories: 'All Categories',
  allRooms: 'All Rooms',
  clearFilters: 'Clear Filters',
  similar: 'Similar',
  noSuggestionsFound: 'No suggestions found',
  noItemsFound: 'No items found matching your search.',
  lowStock: 'Low Stock',
  
  // Room Management
  roomManagement: 'Room Management',
  categoryManagement: 'Category Management',
  defaultCabinet: 'Default Cabinet',
  mainLivingArea: 'Main living area',
  cabinets: 'Cabinets',
  noCabinetsInThisRoom: 'No cabinets in this room.',
  clickToViewDetails: 'Click to view details',
  
  // Cabinet names
  closet: 'Closet',
  dresser: 'Dresser',
  rightCabinet: 'Right Cabinet',
  middleCabinet: 'Middle Cabinet',
  
  // Item Management
  description: 'Description',
  minimumQuantity: 'Minimum Quantity Alert',
  room: 'Room',
  cabinet: 'Cabinet/Shelf (Optional)',
  barcode: 'Barcode/UPC Code',
  qrCode: 'QR Code',
  
  // Messages
  welcome: 'Welcome',
  signOut: 'Sign out',
  itemAddedSuccessfully: 'Item added successfully!',
  failedToAddItem: 'Failed to add item',
  loading: 'Loading...',
  
  // Form labels
  itemDetails: 'Item Details',
  whereIsThisItemStored: 'Where is this item stored?',
  selectARoom: 'Select a room',
  selectACabinet: 'Select a cabinet',
  autoCreateDefaultCabinet: 'Auto-create default cabinet',
  
  // AI Recognition
  aiRecognitionResults: 'AI Recognition Results',
  pleaseReviewAndEdit: 'Please review and edit the AI-recognized information below. This data will be saved to the barcode database for future use.',
  barcodeLearning: 'Barcode Learning',
  willBeAddedToSystemDatabase: 'will be added to the system database for faster recognition next time.',
  lowAIConfidence: 'Low AI Confidence',
  aiRecognitionHasLowConfidence: 'The AI recognition has low confidence',
  pleaseVerifyAndCorrect: 'Please verify and correct the information below.',
  
  // Input Methods
  howWouldYouLikeToAddThisItem: 'How would you like to add this item?',
  uploadPhoto: 'Upload Photo',
  takePhoto: 'Take Photo',
  scanBarcode: 'Scan Barcode',
  scanQRCode: 'Scan QR Code',
  dragAndDropImage: 'Drag & drop an image here, or click to select',
  orClickToSelect: 'or click to select',
  dropImageHere: 'Drop the image here...',
  clickToChangePhoto: 'Click to change photo',
  openCamera: 'Open Camera',
  enterOrScanBarcode: 'Enter or scan barcode',
  enterOrScanQRCode: 'Enter or scan QR code',
  aiRecognize: 'AI Recognize',
  manualInput: 'Manual Input',
  recognizeItem: 'Recognize Item',
  processing: 'Processing...',
  continue: 'Continue',
  
  // Application
  smartWarehouse: 'Smart Warehouse',
  backToRooms: 'Back to Rooms',
  itemsTotal: 'items total',
  noItemsInThisCabinet: 'No items in this cabinet',
  qty: 'Qty',
  
  // Room Management
  addNewRoom: 'Add New Room',
  addNewCabinet: 'Add New Cabinet',
  addNewCategory: 'Add New Category',
  roomName: 'Room Name',
  cabinetName: 'Cabinet Name',
  categoryName: 'Category Name',
  level: 'Level',
  level1MainCategory: 'Level 1 (Main Category)',
  level2Subcategory: 'Level 2 (Subcategory)',
  level3SubSubcategory: 'Level 3 (Sub-subcategory)',
  addRoom: 'Add Room',
  addCabinet: 'Add Cabinet',
  addCategory: 'Add Category',
  
  // Activity Log Messages
  itemWasAddedToInventory: 'was added to the inventory',
  roomWasAdded: 'Room was added',
  roomWasRemoved: 'Room was removed',
  categoryWasAdded: 'Category was added',
  categoryWasRemoved: 'Category was removed',
  by: 'by',
  justNow: 'Just now',
  minutesAgo: 'm ago',
  hoursAgo: 'h ago',
  daysAgo: 'd ago',
  
  // Activity Actions
  created: 'created',
  moved: 'moved',
  quantityUpdated: 'quantity updated',
  updated: 'updated',
  roomCreated: 'room created',
  roomDeleted: 'room deleted',
  categoryCreated: 'category created',
  categoryDeleted: 'category deleted',
  itemAdded: 'item added',
  itemMoved: 'item moved',
  testActivity: 'test activity',
  
  // Activity Descriptions
  itemAddedDescription: 'Item was added to inventory',
  itemMovedDescription: 'Item was moved to a different location',
  quantityUpdatedDescription: 'Item quantity was updated',
  testActivityDescription: 'Test activity to verify activities API',
  categoryCreatedDescription: 'Category was created',
  categoryDeletedDescription: 'Category was deleted',
  roomCreatedDescription: 'Room was created',
  roomDeletedDescription: 'Room was deleted',
  
  // AI Recognition
  aiConfidence: 'AI Confidence',
  itemName: 'Item Name',
  quantity: 'Quantity',
  category: 'Category',
  subcategory: 'Subcategory',
  selectCategory: 'Select Category',
  selectSubcategory: 'Select Subcategory',
  orEnterCustom: 'Or enter custom',
  
  // Time
  ago: 'ago',
  item: 'Item',
  
  // Dashboard
  totalItems: 'Total Items',
  lowStockItems: 'Low Stock Items',
  householdMembers: 'Household Members',
  recentActivity: 'Recent Activity',
  refresh: 'Refresh',
  noRecentActivity: 'No recent activity.',
  startByAddingFirstItem: 'Start by adding your first item!',
  noActivities: 'No activities',
  activitiesWillAppearHere: 'Activities will appear here as you use the system.',
  
  // Taiwan E-Invoice
  taiwanInvoice: 'Taiwan Invoice',
  scanTaiwanInvoice: 'Scan Taiwan Invoice',
  uploadTaiwanInvoice: 'Upload Taiwan Invoice Photo',
  taiwanInvoiceDetected: 'Taiwan invoice detected',
  taiwanInvoiceDecoded: 'Taiwan invoice decoded successfully',
  invoiceNumber: 'Invoice Number',
  invoiceDate: 'Invoice Date',
  sellerName: 'Seller Name',
  totalAmount: 'Total Amount',
  taxAmount: 'Tax Amount',
  invoiceItems: 'Invoice Items',
  processingTaiwanInvoice: 'Processing Taiwan invoice...',
  cameraNotAvailable: 'Camera not available, please upload photo',
  
  // Invitation Codes
  invitationCode: 'Invitation Code',
  shareInvitationCode: 'Share this code with others to let them join your household',
  regenerateInvitationCode: 'Regenerate',
  copyInvitationCode: 'Copy to clipboard',
  invitationCodeInstructions: '• Share this code with family members to invite them\n• New users can enter this code during signup to join your household\n• Regenerate if you suspect the code has been compromised',
  joinWithInvitationCode: 'Join with Invitation Code',
  enterInvitationCode: 'Enter invitation code (optional)',
  invalidInvitationCode: 'Invalid invitation code',
  householdNotFound: 'Household not found',
  alreadyMemberOfHousehold: 'You are already a member of this household',
  alreadyMemberOfAnotherHousehold: 'You are already a member of another household',
  
  // Default Rooms
  kitchen: 'Kitchen',
  livingRoom: 'Living Room',
  masterBedroom: 'Master Bedroom',
  kidRoom: 'Kids Room',
  garage: 'Garage',
  
  // Default Cabinets
  mainCabinet: 'Main Cabinet',
  
  // Default Categories
  electronics: 'Electronics',
  tools: 'Tools',
  clothing: 'Clothing',
  books: 'Books',
  miscellaneous: 'Miscellaneous',
  
  // Category Name Translations (for existing categories)
  categoryNameTranslations: {
    'Electronics': 'Electronics',
    'Tools': 'Tools',
    'Clothing': 'Clothing',
    'Books': 'Books',
    'Miscellaneous': 'Miscellaneous'
  },
}

// Traditional Chinese translations (zh-TW)
const zhTW: Translations = {
  // Navigation
  dashboard: '儀表板',
  rooms: '房間',
  categories: '分類',
  activities: '活動',
  notifications: '通知',
  members: '成員',
  items: '物品',
  
  // Common actions
  addItem: '新增物品',
  search: '搜尋',
  searching: '搜尋中...',
  edit: '編輯',
  delete: '刪除',
  save: '儲存',
  saving: '儲存中...',
  cancel: '取消',
  back: '返回',
  next: '下一步',
  close: '關閉',
  optional: '可選',
  move: '移動',
  moving: '移動中...',
  checkout: '結帳',
  checkingOut: '結帳中...',
  history: '歷史',
  editItem: '編輯物品',
  moveItem: '移動物品',
  checkoutItem: '結帳物品',
  itemHistory: '物品歷史',
  moveToRoom: '移動到房間',
  checkoutQuantity: '結帳數量',
  reason: '原因',
  moveConfirmation: '移動到',
  
  // Duplicate Detection
  potentialDuplicate: '可能的重複物品',
  newItem: '新物品',
  similarItemsFound: '找到相似物品',
  similarItems: '相似物品',
  similar: '相似',
  createNewItem: '創建新物品',
  useExistingItem: '使用現有物品',
  location: '位置',
  editCabinet: '編輯櫥櫃',
  updateCabinet: '更新櫥櫃',
  deleteCabinet: '刪除櫥櫃',
  deleteCabinetConfirmation: '您確定要刪除櫥櫃',
  deleteCabinetWarning: '此操作無法撤銷，並且會同時刪除此櫥櫃中的所有物品。',
  
  // Search
  searchItems: '搜尋物品',
  searchPlaceholder: '依名稱、描述、條碼或 QR 碼搜尋...',
  searchResults: '搜尋結果',
  findingSuggestions: '正在尋找建議...',
  filters: '篩選',
  allCategories: '全部分類',
  allRooms: '全部房間',
  clearFilters: '清除篩選',
  noSuggestionsFound: '未找到建議',
  noItemsFound: '未找到符合搜尋條件的物品。',
  lowStock: '庫存不足',
  
  // Room Management
  roomManagement: '房間管理',
  categoryManagement: '分類管理',
  defaultCabinet: '預設櫥櫃',
  mainLivingArea: '主要起居區域',
  cabinets: '櫥櫃',
  noCabinetsInThisRoom: '此房間沒有櫥櫃。',
  clickToViewDetails: '點擊查看詳情',
  
  // Cabinet names
  closet: '衣櫃',
  dresser: '梳妝台',
  rightCabinet: '右櫥櫃',
  middleCabinet: '中櫥櫃',
  
  // Item Management
  description: '描述',
  minimumQuantity: '最低庫存警報',
  room: '房間',
  cabinet: '櫥櫃/架子（可選）',
  barcode: '條碼/UPC 碼',
  qrCode: 'QR 碼',
  
  // Messages
  welcome: '歡迎',
  signOut: '登出',
  itemAddedSuccessfully: '物品新增成功！',
  failedToAddItem: '新增物品失敗',
  loading: '載入中...',
  
  // Form labels
  itemDetails: '物品詳情',
  whereIsThisItemStored: '此物品存放在哪裡？',
  selectARoom: '選擇房間',
  selectACabinet: '選擇櫥櫃',
  autoCreateDefaultCabinet: '自動建立預設櫥櫃',
  
  // AI Recognition
  aiRecognitionResults: 'AI 識別結果',
  pleaseReviewAndEdit: '請檢閱並編輯下方 AI 識別的資訊。此資料將儲存到條碼資料庫以供日後使用。',
  barcodeLearning: '條碼學習',
  willBeAddedToSystemDatabase: '將被新增到系統資料庫中，以便下次更快識別。',
  lowAIConfidence: 'AI 信心度低',
  aiRecognitionHasLowConfidence: 'AI 識別的信心度較低',
  pleaseVerifyAndCorrect: '請驗證並修正下方資訊。',
  
  // Input Methods
  howWouldYouLikeToAddThisItem: '您想要如何新增此物品？',
  uploadPhoto: '上傳照片',
  takePhoto: '拍攝照片',
  scanBarcode: '掃描條碼',
  scanQRCode: '掃描 QR 碼',
  dragAndDropImage: '拖放圖片到這裡，或點擊選擇',
  orClickToSelect: '或點擊選擇',
  dropImageHere: '將圖片拖放到這裡...',
  clickToChangePhoto: '點擊更換照片',
  openCamera: '開啟相機',
  enterOrScanBarcode: '輸入或掃描條碼',
  enterOrScanQRCode: '輸入或掃描 QR 碼',
  aiRecognize: 'AI 識別',
  manualInput: '手動輸入',
  recognizeItem: '識別物品',
  processing: '處理中...',
  continue: '繼續',
  
  // Application
  smartWarehouse: '智慧倉庫',
  backToRooms: '返回房間',
  itemsTotal: '個物品',
  noItemsInThisCabinet: '此櫥櫃中沒有物品',
  qty: '數量',
  
  // Room Management
  addNewRoom: '新增房間',
  addNewCabinet: '新增櫥櫃',
  addNewCategory: '新增分類',
  roomName: '房間名稱',
  cabinetName: '櫥櫃名稱',
  categoryName: '分類名稱',
  level: '層級',
  level1MainCategory: '層級 1 (主要分類)',
  level2Subcategory: '層級 2 (子分類)',
  level3SubSubcategory: '層級 3 (子子分類)',
  addRoom: '新增房間',
  addCabinet: '新增櫥櫃',
  addCategory: '新增分類',
  
  // Activity Log Messages
  itemWasAddedToInventory: '已新增到庫存中',
  roomWasAdded: '房間已新增',
  roomWasRemoved: '房間已移除',
  categoryWasAdded: '分類已新增',
  categoryWasRemoved: '分類已移除',
  by: '由',
  justNow: '剛剛',
  minutesAgo: '分鐘前',
  hoursAgo: '小時前',
  daysAgo: '天前',
  
  // Activity Actions
  created: '已建立',
  moved: '已移動',
  quantityUpdated: '數量已更新',
  updated: '已更新',
  roomCreated: '房間已建立',
  roomDeleted: '房間已刪除',
  categoryCreated: '分類已建立',
  categoryDeleted: '分類已刪除',
  itemAdded: '物品已新增',
  itemMoved: '物品已移動',
  testActivity: '測試活動',
  
  // Activity Descriptions
  itemAddedDescription: '物品已新增到庫存中',
  itemMovedDescription: '物品已移動到不同位置',
  quantityUpdatedDescription: '物品數量已更新',
  testActivityDescription: '測試活動以驗證活動 API 功能',
  categoryCreatedDescription: '分類已建立',
  categoryDeletedDescription: '分類已刪除',
  roomCreatedDescription: '房間已建立',
  roomDeletedDescription: '房間已刪除',
  
  // AI Recognition
  aiConfidence: 'AI 信心度',
  itemName: '物品名稱',
  quantity: '數量',
  category: '分類',
  subcategory: '子分類',
  selectCategory: '選擇分類',
  selectSubcategory: '選擇子分類',
  orEnterCustom: '或輸入自訂',
  
  // Time
  ago: '前',
  item: '物品',
  
  // Dashboard
  totalItems: '總物品數',
  lowStockItems: '低庫存物品',
  householdMembers: '家庭成員',
  recentActivity: '最近活動',
  refresh: '重新整理',
  noRecentActivity: '沒有最近的活動。',
  startByAddingFirstItem: '開始新增您的第一個物品！',
  noActivities: '沒有活動',
  activitiesWillAppearHere: '當您使用系統時，活動將會出現在這裡。',
  
  // Taiwan E-Invoice
  taiwanInvoice: '台灣發票',
  scanTaiwanInvoice: '掃描台灣發票',
  uploadTaiwanInvoice: '上傳台灣發票照片',
  taiwanInvoiceDetected: '已檢測到台灣發票',
  taiwanInvoiceDecoded: '台灣發票解析成功',
  invoiceNumber: '發票號碼',
  invoiceDate: '發票日期',
  sellerName: '賣方名稱',
  totalAmount: '總金額',
  taxAmount: '稅額',
  invoiceItems: '發票項目',
  processingTaiwanInvoice: '正在處理台灣發票...',
  cameraNotAvailable: '相機不可用，請上傳照片',
  
  // Invitation Codes
  invitationCode: '邀請碼',
  shareInvitationCode: '分享此代碼給其他人讓他們加入您的家庭',
  regenerateInvitationCode: '重新生成',
  copyInvitationCode: '複製到剪貼板',
  invitationCodeInstructions: '• 與家庭成員分享此代碼以邀請他們\n• 新用戶可以在註冊時輸入此代碼加入您的家庭\n• 如果懷疑代碼已洩露，請重新生成',
  joinWithInvitationCode: '使用邀請碼加入',
  enterInvitationCode: '輸入邀請碼（可選）',
  invalidInvitationCode: '無效的邀請碼',
  householdNotFound: '找不到家庭',
  alreadyMemberOfHousehold: '您已經是此家庭的成員',
  alreadyMemberOfAnotherHousehold: '您已經是另一個家庭的成員',
  
  // Default Rooms
  kitchen: '廚房',
  livingRoom: '客廳',
  masterBedroom: '主臥室',
  kidRoom: '兒童房',
  garage: '車庫',
  
  // Default Cabinets
  mainCabinet: '主櫥櫃',
  
  // Default Categories
  electronics: '電子產品',
  tools: '工具',
  clothing: '服裝',
  books: '書籍',
  miscellaneous: '其他',
  
  // Category Name Translations (for existing categories)
  categoryNameTranslations: {
    'Electronics': '電子產品',
    'Tools': '工具',
    'Clothing': '服裝',
    'Books': '書籍',
    'Miscellaneous': '其他'
  },
}

// Simplified Chinese translations (zh)
const zh: Translations = {
  // Navigation
  dashboard: '仪表板',
  rooms: '房间',
  categories: '分类',
  activities: '活动',
  notifications: '通知',
  members: '成员',
  items: '物品',
  
  // Common actions
  addItem: '添加物品',
  search: '搜索',
  searching: '搜索中...',
  edit: '编辑',
  delete: '删除',
  save: '保存',
  saving: '保存中...',
  cancel: '取消',
  back: '返回',
  next: '下一步',
  close: '关闭',
  optional: '可选',
  move: '移动',
  moving: '移动中...',
  checkout: '结账',
  checkingOut: '结账中...',
  history: '历史',
  editItem: '编辑物品',
  moveItem: '移动物品',
  checkoutItem: '结账物品',
  itemHistory: '物品历史',
  moveToRoom: '移动到房间',
  checkoutQuantity: '结账数量',
  reason: '原因',
  moveConfirmation: '移动到',
  
  // Duplicate Detection
  potentialDuplicate: '可能的重复物品',
  newItem: '新物品',
  similarItemsFound: '找到相似物品',
  similarItems: '相似物品',
  similar: '相似',
  createNewItem: '创建新物品',
  useExistingItem: '使用现有物品',
  location: '位置',
  editCabinet: '编辑橱柜',
  updateCabinet: '更新橱柜',
  deleteCabinet: '删除橱柜',
  deleteCabinetConfirmation: '您确定要删除橱柜',
  deleteCabinetWarning: '此操作无法撤销，并且会同时删除此橱柜中的所有物品。',
  
  // Search
  searchItems: '搜索物品',
  searchPlaceholder: '按名称、描述、条码或二维码搜索...',
  searchResults: '搜索结果',
  findingSuggestions: '正在寻找建议...',
  filters: '筛选',
  allCategories: '所有分类',
  allRooms: '所有房间',
  clearFilters: '清除筛选',
  noSuggestionsFound: '未找到建议',
  noItemsFound: '未找到符合搜索条件的物品。',
  lowStock: '库存不足',
  
  // Room Management
  roomManagement: '房间管理',
  categoryManagement: '分类管理',
  defaultCabinet: '默认橱柜',
  mainLivingArea: '主要起居区域',
  cabinets: '橱柜',
  noCabinetsInThisRoom: '此房间没有橱柜。',
  clickToViewDetails: '点击查看详情',
  
  // Cabinet names
  closet: '衣柜',
  dresser: '梳妆台',
  rightCabinet: '右橱柜',
  middleCabinet: '中橱柜',
  
  // Item Management
  description: '描述',
  minimumQuantity: '最低库存警报',
  room: '房间',
  cabinet: '橱柜/架子（可选）',
  barcode: '条码/UPC 码',
  qrCode: 'QR 码',
  
  // Messages
  welcome: '欢迎',
  signOut: '登出',
  itemAddedSuccessfully: '物品添加成功！',
  failedToAddItem: '添加物品失败',
  loading: '加载中...',
  
  // Form labels
  itemDetails: '物品详情',
  whereIsThisItemStored: '此物品存放在哪里？',
  selectARoom: '选择房间',
  selectACabinet: '选择橱柜',
  autoCreateDefaultCabinet: '自动创建默认橱柜',
  
  // AI Recognition
  aiRecognitionResults: 'AI 识别结果',
  pleaseReviewAndEdit: '请检阅并编辑下方 AI 识别的信息。此数据将保存到条码数据库以供日后使用。',
  barcodeLearning: '条码学习',
  willBeAddedToSystemDatabase: '将被添加到系统数据库中，以便下次更快识别。',
  lowAIConfidence: 'AI 置信度低',
  aiRecognitionHasLowConfidence: 'AI 识别的置信度较低',
  pleaseVerifyAndCorrect: '请验证并修正下方信息。',
  
  // Input Methods
  howWouldYouLikeToAddThisItem: '您想要如何添加此物品？',
  uploadPhoto: '上传照片',
  takePhoto: '拍摄照片',
  scanBarcode: '扫描条码',
  scanQRCode: '扫描 QR 码',
  dragAndDropImage: '拖放图片到这里，或点击选择',
  orClickToSelect: '或点击选择',
  dropImageHere: '将图片拖放到这里...',
  clickToChangePhoto: '点击更换照片',
  openCamera: '开启相机',
  enterOrScanBarcode: '输入或扫描条码',
  enterOrScanQRCode: '输入或扫描 QR 码',
  aiRecognize: 'AI 识别',
  manualInput: '手动输入',
  recognizeItem: '识别物品',
  processing: '处理中...',
  continue: '继续',
  
  // Application
  smartWarehouse: '智能仓库',
  backToRooms: '返回房间',
  itemsTotal: '个物品',
  noItemsInThisCabinet: '此橱柜中没有物品',
  qty: '数量',
  
  // Room Management
  addNewRoom: '添加房间',
  addNewCabinet: '添加橱柜',
  addNewCategory: '添加分类',
  roomName: '房间名称',
  cabinetName: '橱柜名称',
  categoryName: '分类名称',
  level: '层级',
  level1MainCategory: '层级 1 (主要分类)',
  level2Subcategory: '层级 2 (子分类)',
  level3SubSubcategory: '层级 3 (子子分类)',
  addRoom: '添加房间',
  addCabinet: '添加橱柜',
  addCategory: '添加分类',
  
  // Activity Log Messages
  itemWasAddedToInventory: '已添加到库存中',
  roomWasAdded: '房间已添加',
  roomWasRemoved: '房间已移除',
  categoryWasAdded: '分类已添加',
  categoryWasRemoved: '分类已移除',
  by: '由',
  justNow: '刚刚',
  minutesAgo: '分钟前',
  hoursAgo: '小时前',
  daysAgo: '天前',
  
  // Activity Actions
  created: '已创建',
  moved: '已移动',
  quantityUpdated: '数量已更新',
  updated: '已更新',
  roomCreated: '房间已创建',
  roomDeleted: '房间已删除',
  categoryCreated: '分类已创建',
  categoryDeleted: '分类已删除',
  itemAdded: '物品已添加',
  itemMoved: '物品已移动',
  testActivity: '测试活动',
  
  // Activity Descriptions
  itemAddedDescription: '物品已添加到库存中',
  itemMovedDescription: '物品已移动到不同位置',
  quantityUpdatedDescription: '物品数量已更新',
  testActivityDescription: '测试活动以验证活动 API 功能',
  categoryCreatedDescription: '分类已创建',
  categoryDeletedDescription: '分类已删除',
  roomCreatedDescription: '房间已创建',
  roomDeletedDescription: '房间已删除',
  
  // AI Recognition
  aiConfidence: 'AI 信心度',
  itemName: '物品名称',
  quantity: '数量',
  category: '分类',
  subcategory: '子分类',
  selectCategory: '选择分类',
  selectSubcategory: '选择子分类',
  orEnterCustom: '或输入自定义',
  
  // Time
  ago: '前',
  item: '物品',
  
  // Dashboard
  totalItems: '总物品数',
  lowStockItems: '低库存物品',
  householdMembers: '家庭成员',
  recentActivity: '最近活动',
  refresh: '刷新',
  noRecentActivity: '没有最近的活动。',
  startByAddingFirstItem: '开始添加您的第一个物品！',
  noActivities: '没有活动',
  activitiesWillAppearHere: '当您使用系统时，活动将会出现在这里。',
  
  // Taiwan E-Invoice
  taiwanInvoice: '台湾发票',
  scanTaiwanInvoice: '扫描台湾发票',
  uploadTaiwanInvoice: '上传台湾发票照片',
  taiwanInvoiceDetected: '已检测到台湾发票',
  taiwanInvoiceDecoded: '台湾发票解析成功',
  invoiceNumber: '发票号码',
  invoiceDate: '发票日期',
  sellerName: '卖方名称',
  totalAmount: '总金额',
  taxAmount: '税额',
  invoiceItems: '发票项目',
  processingTaiwanInvoice: '正在处理台湾发票...',
  cameraNotAvailable: '相机不可用，请上传照片',
  
  // Invitation Codes
  invitationCode: '邀请码',
  shareInvitationCode: '分享此代码给其他人让他们加入您的家庭',
  regenerateInvitationCode: '重新生成',
  copyInvitationCode: '复制到剪贴板',
  invitationCodeInstructions: '• 与家庭成员分享此代码以邀请他们\n• 新用户可以在注册时输入此代码加入您的家庭\n• 如果怀疑代码已泄露，请重新生成',
  joinWithInvitationCode: '使用邀请码加入',
  enterInvitationCode: '输入邀请码（可选）',
  invalidInvitationCode: '无效的邀请码',
  householdNotFound: '找不到家庭',
  alreadyMemberOfHousehold: '您已经是此家庭的成员',
  alreadyMemberOfAnotherHousehold: '您已经是另一个家庭的成员',
  
  // Default Rooms
  kitchen: '厨房',
  livingRoom: '客厅',
  masterBedroom: '主卧室',
  kidRoom: '儿童房',
  garage: '车库',
  
  // Default Cabinets
  mainCabinet: '主橱柜',
  
  // Default Categories
  electronics: '电子产品',
  tools: '工具',
  clothing: '服装',
  books: '书籍',
  miscellaneous: '其他',
  
  // Category Name Translations (for existing categories)
  categoryNameTranslations: {
    'Electronics': '电子产品',
    'Tools': '工具',
    'Clothing': '服装',
    'Books': '书籍',
    'Miscellaneous': '其他'
  },
}

// Japanese translations (ja)
const ja: Translations = {
  // Navigation
  dashboard: 'ダッシュボード',
  rooms: '部屋',
  categories: 'カテゴリ',
  activities: 'アクティビティ',
  notifications: '通知',
  members: 'メンバー',
  items: 'アイテム',
  
  // Common actions
  addItem: 'アイテムを追加',
  search: '検索',
  searching: '検索中...',
  edit: '編集',
  delete: '削除',
  save: '保存',
  saving: '保存中...',
  cancel: 'キャンセル',
  back: '戻る',
  next: '次へ',
  close: '閉じる',
  optional: 'オプション',
  move: '移動',
  moving: '移動中...',
  checkout: 'チェックアウト',
  checkingOut: 'チェックアウト中...',
  history: '履歴',
  editItem: 'アイテムを編集',
  moveItem: 'アイテムを移動',
  checkoutItem: 'アイテムをチェックアウト',
  itemHistory: 'アイテム履歴',
  moveToRoom: '部屋に移動',
  checkoutQuantity: 'チェックアウト数量',
  reason: '理由',
  moveConfirmation: '移動先',
  
  // Duplicate Detection
  potentialDuplicate: '重複の可能性があるアイテム',
  newItem: '新しいアイテム',
  similarItemsFound: '類似のアイテムが見つかりました',
  similarItems: '類似アイテム',
  similar: '類似',
  createNewItem: '新しいアイテムを作成',
  useExistingItem: '既存のアイテムを使用',
  location: '場所',
  editCabinet: 'キャビネットを編集',
  updateCabinet: 'キャビネットを更新',
  deleteCabinet: 'キャビネットを削除',
  deleteCabinetConfirmation: 'キャビネットを削除してもよろしいですか',
  deleteCabinetWarning: 'この操作は取り消せず、このキャビネット内のすべてのアイテムも削除されます。',
  
  // Search
  searchItems: 'アイテムを検索',
  searchPlaceholder: '名前、説明、バーコード、またはQRコードで検索...',
  searchResults: '検索結果',
  findingSuggestions: '提案を検索中...',
  filters: 'フィルター',
  allCategories: 'すべてのカテゴリ',
  allRooms: 'すべての部屋',
  clearFilters: 'フィルターをクリア',
  noSuggestionsFound: '提案が見つかりません',
  noItemsFound: '検索条件に一致するアイテムが見つかりません。',
  lowStock: '在庫不足',
  
  // Room Management
  roomManagement: '部屋管理',
  categoryManagement: 'カテゴリ管理',
  defaultCabinet: 'デフォルトキャビネット',
  mainLivingArea: 'メインリビングエリア',
  cabinets: 'キャビネット',
  noCabinetsInThisRoom: 'この部屋にはキャビネットがありません。',
  clickToViewDetails: '詳細を表示するにはクリック',
  
  // Cabinet names
  closet: 'クローゼット',
  dresser: 'ドレッサー',
  rightCabinet: '右キャビネット',
  middleCabinet: '中央キャビネット',
  
  // Item Management
  description: '説明',
  minimumQuantity: '最小在庫アラート',
  room: '部屋',
  cabinet: 'キャビネット/棚（オプション）',
  barcode: 'バーコード/UPCコード',
  qrCode: 'QRコード',
  
  // Messages
  welcome: 'ようこそ',
  signOut: 'サインアウト',
  itemAddedSuccessfully: 'アイテムが正常に追加されました！',
  failedToAddItem: 'アイテムの追加に失敗しました',
  loading: '読み込み中...',
  
  // Form labels
  itemDetails: 'アイテム詳細',
  whereIsThisItemStored: 'このアイテムはどこに保管されていますか？',
  selectARoom: '部屋を選択',
  selectACabinet: 'キャビネットを選択',
  autoCreateDefaultCabinet: 'デフォルトキャビネットを自動作成',
  
  // AI Recognition
  aiRecognitionResults: 'AI認識結果',
  pleaseReviewAndEdit: '以下にAIが認識した情報を確認・編集してください。このデータは今後の使用のためにバーコードデータベースに保存されます。',
  barcodeLearning: 'バーコード学習',
  willBeAddedToSystemDatabase: '次回の認識を高速化するため、システムデータベースに追加されます。',
  lowAIConfidence: 'AI信頼度が低い',
  aiRecognitionHasLowConfidence: 'AI認識の信頼度が低いです',
  pleaseVerifyAndCorrect: '以下の情報を確認・修正してください。',
  
  // Input Methods
  howWouldYouLikeToAddThisItem: 'このアイテムをどのように追加しますか？',
  uploadPhoto: '写真をアップロード',
  takePhoto: '写真を撮影',
  scanBarcode: 'バーコードをスキャン',
  scanQRCode: 'QRコードをスキャン',
  dragAndDropImage: '画像をここにドラッグ&ドロップするか、クリックして選択',
  orClickToSelect: 'またはクリックして選択',
  dropImageHere: '画像をここにドロップ...',
  clickToChangePhoto: 'クリックして写真を変更',
  openCamera: 'カメラを開く',
  enterOrScanBarcode: 'バーコードを入力またはスキャン',
  enterOrScanQRCode: 'QRコードを入力またはスキャン',
  aiRecognize: 'AI認識',
  manualInput: '手動入力',
  recognizeItem: 'アイテムを認識',
  processing: '処理中...',
  continue: '続行',
  
  // Application
  smartWarehouse: 'スマート倉庫',
  backToRooms: '部屋に戻る',
  itemsTotal: '個のアイテム',
  noItemsInThisCabinet: 'このキャビネットにアイテムがありません',
  qty: '数量',
  
  // Room Management
  addNewRoom: '新しい部屋を追加',
  addNewCabinet: '新しいキャビネットを追加',
  addNewCategory: '新しいカテゴリを追加',
  roomName: '部屋名',
  cabinetName: 'キャビネット名',
  categoryName: 'カテゴリ名',
  level: 'レベル',
  level1MainCategory: 'レベル1 (メインカテゴリ)',
  level2Subcategory: 'レベル2 (サブカテゴリ)',
  level3SubSubcategory: 'レベル3 (サブサブカテゴリ)',
  addRoom: '部屋を追加',
  addCabinet: 'キャビネットを追加',
  addCategory: 'カテゴリを追加',
  
  // Activity Log Messages
  itemWasAddedToInventory: 'が在庫に追加されました',
  roomWasAdded: '部屋が追加されました',
  roomWasRemoved: '部屋が削除されました',
  categoryWasAdded: 'カテゴリが追加されました',
  categoryWasRemoved: 'カテゴリが削除されました',
  by: 'によって',
  justNow: 'たった今',
  minutesAgo: '分前',
  hoursAgo: '時間前',
  daysAgo: '日前',
  
  // Activity Actions
  created: '作成済み',
  moved: '移動済み',
  quantityUpdated: '数量更新済み',
  updated: '更新済み',
  roomCreated: '部屋作成済み',
  roomDeleted: '部屋削除済み',
  categoryCreated: 'カテゴリ作成済み',
  categoryDeleted: 'カテゴリ削除済み',
  itemAdded: 'アイテム追加済み',
  itemMoved: 'アイテム移動済み',
  testActivity: 'テストアクティビティ',
  
  // Activity Descriptions
  itemAddedDescription: 'アイテムが在庫に追加されました',
  itemMovedDescription: 'アイテムが別の場所に移動されました',
  quantityUpdatedDescription: 'アイテムの数量が更新されました',
  testActivityDescription: 'アクティビティ API の機能を検証するテスト',
  categoryCreatedDescription: 'カテゴリが作成されました',
  categoryDeletedDescription: 'カテゴリが削除されました',
  roomCreatedDescription: '部屋が作成されました',
  roomDeletedDescription: '部屋が削除されました',
  
  // AI Recognition
  aiConfidence: 'AI 信頼度',
  itemName: 'アイテム名',
  quantity: '数量',
  category: 'カテゴリ',
  subcategory: 'サブカテゴリ',
  selectCategory: 'カテゴリを選択',
  selectSubcategory: 'サブカテゴリを選択',
  orEnterCustom: 'またはカスタム入力',
  
  // Time
  ago: '前',
  item: 'アイテム',
  
  // Dashboard
  totalItems: '総アイテム数',
  lowStockItems: '在庫不足アイテム',
  householdMembers: '世帯メンバー',
  recentActivity: '最近のアクティビティ',
  refresh: '更新',
  noRecentActivity: '最近のアクティビティはありません。',
  startByAddingFirstItem: '最初のアイテムを追加してください！',
  noActivities: 'アクティビティなし',
  activitiesWillAppearHere: 'システムを使用すると、ここにアクティビティが表示されます。',
  
  // Taiwan E-Invoice
  taiwanInvoice: '台湾インボイス',
  scanTaiwanInvoice: '台湾インボイスをスキャン',
  uploadTaiwanInvoice: '台湾インボイス写真をアップロード',
  taiwanInvoiceDetected: '台湾インボイスが検出されました',
  taiwanInvoiceDecoded: '台湾インボイスが正常にデコードされました',
  invoiceNumber: 'インボイス番号',
  invoiceDate: 'インボイス日付',
  sellerName: '販売者名',
  totalAmount: '総額',
  taxAmount: '税金額',
  invoiceItems: 'インボイス項目',
  processingTaiwanInvoice: '台湾インボイスを処理中...',
  cameraNotAvailable: 'カメラが利用できません。写真をアップロードしてください',
  
  // Invitation Codes
  invitationCode: '招待コード',
  shareInvitationCode: 'このコードを他の人と共有して、あなたの世帯に参加してもらいます',
  regenerateInvitationCode: '再生成',
  copyInvitationCode: 'クリップボードにコピー',
  invitationCodeInstructions: '• このコードを家族と共有して招待してください\n• 新しいユーザーはサインアップ時にこのコードを入力してあなたの世帯に参加できます\n• コードが漏洩した疑いがある場合は再生成してください',
  joinWithInvitationCode: '招待コードで参加',
  enterInvitationCode: '招待コードを入力（オプション）',
  invalidInvitationCode: '無効な招待コード',
  householdNotFound: '世帯が見つかりません',
  alreadyMemberOfHousehold: 'あなたは既にこの世帯のメンバーです',
  alreadyMemberOfAnotherHousehold: 'あなたは既に別の世帯のメンバーです',
  
  // Default Rooms
  kitchen: 'キッチン',
  livingRoom: 'リビングルーム',
  masterBedroom: 'マスターベッドルーム',
  kidRoom: '子供部屋',
  garage: 'ガレージ',
  
  // Default Cabinets
  mainCabinet: 'メインキャビネット',
  
  // Default Categories
  electronics: '電子機器',
  tools: '工具',
  clothing: '衣類',
  books: '本',
  miscellaneous: 'その他',
  
  // Category Name Translations (for existing categories)
  categoryNameTranslations: {
    'Electronics': '電子機器',
    'Tools': '工具',
    'Clothing': '衣類',
    'Books': '本',
    'Miscellaneous': 'その他'
  },
}

// Translation registry
const translations: Record<string, Translations> = {
  'en': en,
  'zh-TW': zhTW,
  'zh': zh,
  'ja': ja,
}

// Get translations for a specific language
export function getTranslations(languageCode: string): Translations {
  return translations[languageCode] || translations['en']
}

// Helper function to translate category names
export function translateCategoryName(categoryName: string, languageCode: string): string {
  const t = getTranslations(languageCode)
  return t.categoryNameTranslations[categoryName] || categoryName
}

// Get a specific translation key
export function t(languageCode: string, key: keyof Translations): string {
  const translation = getTranslations(languageCode)
  return translation[key] || translations['en'][key] || key
}

// Hook for React components
export function useTranslations(languageCode: string) {
  return {
    t: (key: keyof Translations) => t(languageCode, key),
    translations: getTranslations(languageCode)
  }
}
