// 翻譯系統 - 用於 UI 國際化
// 支援多種語言：英語、繁體中文、簡體中文、日語

export interface Translations {
  // 導航
  dashboard: string // 儀表板
  rooms: string // 房間
  categories: string // 分類
  activities: string // 活動
  notifications: string // 通知
  members: string // 成員
  items: string // 物品
  allItems: string // 所有物品
  duplicates: string // 重複項目
  assistant: string // 助理
  assistantDescription: string // 助理描述
  assistantPlaceholder: string // 助理輸入框佔位符
  assistantSend: string // 發送
  assistantVoiceHint: string // 語音提示
  assistantVoiceReady: string // 語音就緒
  assistantSendVoice: string // 發送語音
  assistantProcessing: string // 處理中
  assistantNoResponse: string // 無回應
  assistantSourceAIUI: string // 來源：AIUI
  assistantSourceFallback: string // 來源：備援
  assistantEmptyState: string // 空狀態
  homeAssistantPanelTitle: string // Home Assistant 面板標題
  homeAssistantPanelDescription: string // Home Assistant 面板描述
  homeAssistantStatusLoading: string // 狀態：載入中
  homeAssistantStatusError: string // 狀態：錯誤
  homeAssistantStatusReady: string // 狀態：就緒
  homeAssistantRefresh: string // 刷新
  homeAssistantUnknown: string // 未知
  homeAssistantTurnOn: string // 開啟
  homeAssistantTurnOff: string // 關閉
  homeAssistantToggleOn: string // 切換：開啟
  homeAssistantToggleOff: string // 切換：關閉
  homeAssistantToggleError: string // 切換錯誤
  homeAssistantToggleUnsupported: string // 不支援切換
  homeAssistantPower: string // 電源
  homeAssistantPowerOptionMissing: string // 電源選項缺失
  homeAssistantPowerUnavailable: string // 電源不可用
  homeAssistantLastChanged: string // 最後變更
  homeAssistantClimateSection: string // 氣候區塊
  homeAssistantHumidifierSection: string // 除濕機區塊
  homeAssistantCurrentTemperature: string // 當前溫度
  homeAssistantTargetTemperature: string // 目標溫度
  homeAssistantCurrentHumidity: string // 當前濕度
  homeAssistantTargetHumidity: string // 目標濕度
  homeAssistantModes: string // 模式
  homeAssistantTemperatureUpdated: string // 溫度已更新
  homeAssistantHumidityUpdated: string // 濕度已更新
  homeAssistantModeUpdated: string // 模式已更新
  homeAssistantModeHigh: string // 模式：高
  homeAssistantModeMedium: string // 模式：中
  homeAssistantModeLow: string // 模式：低
  homeAssistantModeOffLabel: string // 模式：關閉標籤
  homeAssistantModeHeat: string // 模式：加熱
  homeAssistantModeCool: string // 模式：冷卻
  homeAssistantModeAuto: string // 模式：自動
  homeAssistantModeDry: string // 模式：除濕
  homeAssistantModeFan: string // 模式：風扇
  homeAssistantModeOff: string // 模式：關閉
  homeAssistantCustomTitle: string // 自訂標題
  homeAssistantCustomDescription: string // 自訂描述
  homeAssistantCustomEntityRequired: string // 自訂實體必填
  homeAssistantCustomFormatError: string // 自訂格式錯誤
  homeAssistantCustomSuccess: string // 自訂成功
  homeAssistantCustomError: string // 自訂錯誤
  homeAssistantSendService: string // 發送服務
  homeAssistantNoEntities: string // 無實體
  homeAssistantNoOptions: string // 無選項
  homeAssistantEntities: string // 實體列表
  homeAssistantEntitiesFound: string // 找到的實體
  homeAssistantEntitiesShown: string // 顯示的實體
  homeAssistantShowLess: string // 顯示較少
  homeAssistantShowAll: string // 顯示全部
  homeAssistantAllDomains: string // 所有類型
  mqttDevices: string // MQTT 設備
  mqttDeviceName: string // 設備名稱
  mqttDeviceId: string // 設備 ID
  mqttVendor: string // 供應商
  mqttStatus: string // 狀態
  mqttOnline: string // 在線
  mqttOffline: string // 離線
  mqttAddDevice: string // 添加設備
  mqttDeleteDevice: string // 刪除設備
  mqttControlDevice: string // 控制設備
  mqttPowerOn: string // 開啟
  mqttPowerOff: string // 關閉
  mqttSetTemperature: string // 設定溫度
  mqttSetMode: string // 設定模式
  mqttSetFanSpeed: string // 設定風速
  mqttCommandSent: string // 命令已發送
  mqttCommandFailed: string // 命令失敗
  mqttDeviceAdded: string // 設備已添加
  mqttDeviceDeleted: string // 設備已刪除
  mqttNoDevices: string // 無設備
  mqttVendorTuya: string // Tuya
  mqttVendorESP: string // ESP
  mqttVendorMidea: string // Midea
  mqttVendorShelly: string // Shelly
  mqttVendorAqara: string // Aqara
  householdSettings: string // 家庭設定
  
  // Facility Reservations
  facilityReservations: string
  reserveBuildingFacilities: string
  newReservation: string
  noFacilitiesAvailable: string
  householdNotInBuilding: string
  floor: string
  capacity: string
  myReservations: string
  purpose: string
  accessCode: string
  date: string
  startTime: string
  endTime: string
  numberOfPeople: string
  numberOfPeoplePlaceholder: string
  optionalLabel: string
  purposePlaceholder: string
  notesPlaceholder: string
  notes: string
  cancelReservation: string
  createReservation: string
  submitting: string
  reservationCreated: string
  
  // Announcements
  announcements: string
  announcement: string
  createAnnouncement: string
  sendAnnouncement: string
  title: string
  message: string
  manageAnnouncements: string
  noAnnouncements: string
  clickToView: string
  unread: string
  system: string
  community: string
  building: string
  from: string
  expires: string
  expirationDate: string
  active: string
  inactive: string
  targetAudience: string
  allHouseholds: string
  specificCommunity: string
  specificBuilding: string
  specificHousehold: string
  communityId: string
  buildingId: string
  householdId: string
  enterCommunityId: string
  enterBuildingId: string
  enterHouseholdId: string
  characters: string
  sending: string
  pleaseFillAllFields: string
  announcementCreated: string
  source: string
  adminAnnouncements: string
  
  // Admin
  adminPanel: string
  adminManagement: string
  adminDashboard: string
  adminCommunities: string
  adminCommunitiesDescription: string
  adminTotalCommunities: string
  adminTotalBuildings: string
  adminTotalMembers: string
  adminTotalWorkgroups: string
  adminCommunityList: string
  adminViewDetails: string
  adminNoCommunities: string
  adminBuildings: string
  adminBuildingsDescription: string
  adminFilterByCommunity: string
  noBuildings: string
  addBuilding: string
  adminBuildingsCount: string
  adminMembersCount: string
  adminWorkgroupsCount: string
  adminTotalHouseholds: string
  adminAllCommunities: string
  adminHouseholds: string
  adminItems: string
  adminUsers: string
  adminRoles: string
  adminAnalytics: string
  adminSettings: string
  adminAdministrator: string
  adminCopyright: string
  adminAccess: string
  adminFilters: string
  filter: string
  adminHousehold: string
  adminSecure: string
  
  // Admin Duplicates
  adminDuplicateManagement: string
  adminDuplicateDescription: string
  adminMaintenance: string
  maintenanceTicketManagement: string
  pendingEvaluation: string
  evaluated: string
  assigned: string
  inProgress: string
  noTickets: string
  chatWithFrontDesk: string
  connecting: string
  frontDesk: string
  maintenanceTickets: string
  createTicket: string
  workCompleted: string
  closed: string
  createFirstTicket: string
  supplier: string
  assignedCrew: string
  workLogs: string
  requested: string
  requestMaintenance: string
  ticketTitlePlaceholder: string
  adminBackToAdmin: string
  adminDuplicateItems: string
  adminDuplicateRooms: string
  adminDuplicateCategories: string
  adminNoDuplicateItems: string
  adminNoDuplicateRooms: string
  adminNoDuplicateCategories: string
  adminAllItemsUnique: string
  adminAllRoomsUnique: string
  adminAllCategoriesUnique: string
  adminSimilar: string
  adminMerge: string
  adminMerging: string
  adminKeepSeparate: string
  adminLevel: string
  adminMergeSuccess: string
  adminMergeFailed: string
  adminKeepSeparateSuccess: string
  adminKeepSeparateFailed: string
  
  // Common
  commonLanguage: string
  commonCurrentLanguage: string
  commonSignOut: string
  commonLoading: string
  commonSettings: string
  commonCopy: string
  commonNotSet: string
  
  // Password Change
  changePassword: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
  editFacility: string
  facilityUpdated: string
  facilityUpdateError: string
  forgotPassword: string
  forgotPasswordDescription: string
  checkYourEmail: string
  passwordResetEmailSent: string
  backToSignIn: string
  sendResetLink: string
  invalidResetLink: string
  passwordsDoNotMatch: string
  passwordTooShort: string
  resetPassword: string
  enterNewPassword: string
  resetting: string
  adminAccessRequired: string
  adminPleaseSignIn: string
  commonSignIn: string
  passwordRequirements: string
  changing: string
  
  // Dashboard Time Filters
  today: string
  pastWeek: string
  all: string
  
  // Household Change Detection
  householdChangesDetected: string
  refreshToSeeChanges: string
  
  // Admin Dashboard
  adminLoading: string
  adminError: string
  retry: string
  adminWelcome: string
  adminOverview: string
  adminTotalUsers: string
  adminTotalItems: string
  adminAvgItems: string
  adminQuickActions: string
  adminManageHouseholds: string
  adminViewAllItems: string
  adminViewAnalytics: string
  adminSystemSettings: string
  adminSystemStatus: string
  adminDatabase: string
  adminAPIServices: string
  adminStorage: string
  adminAuthentication: string
  adminHealthy: string
  adminRecentActivity: string
  adminSystemMonitoring: string
  adminAllServicesRunning: string
  adminJustNow: string
  adminDashboardAccessed: string
  adminSecureAuth: string
  admin2MinutesAgo: string
  adminLastUpdated: string
  
  // Admin Households
  adminSearchHouseholds: string
  adminCleanupDuplicates: string
  adminShowDetails: string
  adminHideDetails: string
  
  // Admin Items
  adminViewManageItems: string
  adminSearchItems: string
  
  // Admin Users
  adminUserManagement: string
  
  // Admin Analytics
  adminAnalyticsDescription: string
  adminFilterByLanguage: string
  adminRolesLanguages: string
  
  // Admin Settings
  adminSettingsDescription: string
  
  // Admin Roles
  adminRoleManagement: string
  adminRoleManagementDescription: string
  
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
  
  // Error handling
  errorOccurred: string
  unexpectedError: string
  refreshPage: string
  goHome: string
  
  // Add Item Modal
  selectRoom: string
  autoCreateDefaultCabinet: string
  checkoutQuantity: string
  reason: string
  moveToRoom: string
  moveConfirmation: string
  moveQuantity: string
  moveFrom: string
  adjustQuantity: string
  currentQuantity: string
  newQuantity: string
  adjustment: string
  noQuantityChange: string
  invalidQuantity: string
  failedToUpdateQuantity: string
  updateQuantity: string
  updating: string
  
  // Voice Comments
  voiceComment: string
  voiceCommentHint: string
  startRecording: string
  stopRecording: string
  pauseRecording: string
  playRecording: string
  deleteRecording: string
  rerecord: string
  voiceCommentMaxDuration: string
  voiceCommentPermissionError: string
  voiceCommentConversionError: string
  playVoiceComment: string
  playingVoiceComment: string
  voiceTranscript: string
  transcribingVoice: string
  voicePromptStart: string
  voicePromptEnd: string
  
  // Category Management
  categoryHierarchy: string
  cleanDuplicateCategories: string
  
  // Missing translations for hardcoded strings
  startAddingItems: string
  forceRefreshPage: string
  whereStored: string
  cabinetShelf: string
  leaveEmptyDefault: string
  addItemButton: string
  switchHousehold: string
  uploadTaiwanInvoicePhoto: string
  unknownItem: string
  unableToRecognize: string
  
  // Duplicate Detection
  potentialDuplicate: string
  newItem: string
  similarItemsFound: string
  similarItems: string
  similar: string
  createNewItem: string
  useExistingItem: string
  location: string
  country: string
  city: string
  district: string
  neighborhood: string
  streetAddress: string
  apartmentNo: string
  telephone: string
  fullAddress: string
  selectCountry: string
  selectCity: string
  selectDistrict: string
  enterCommunity: string
  enterStreetAddress: string
  enterApartmentNo: string
  enterTelephone: string
  completeAddress: string
  setLocationOnMap: string
  updateLocationOnMap: string
  selectLocationOnMap: string
  saveLocation: string
  unlockCity: string
  googleMapsNotAvailable: string
  enterLocationManually: string
  coordinates: string
  enterFullAddressToAutoParse: string
  createNewHousehold: string
  enterHouseholdName: string
  enterDescription: string
  creating: string
  create: string
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
  searchTips: string
  searchByName: string
  searchByDescription: string
  searchByCategory: string
  searchByLocation: string
  useChatGPT: string
  propertyServices: string
  propertyServicesSubtitle: string
  openReservations: string
  openBuildingServices: string
  buildingNotLinked: string
  mailboxNumber: string
  doorBells: string
  doorBellNumber: string
  packageLocker: string
  packageNumber: string
  noMailboxAssigned: string
  noDoorbellsAssigned: string
  noPackages: string
  hasMail: string
  noMail: string
  lastMailAt: string
  lastRungAt: string
  checkedInAt: string
  packageCheckedOut: string
  mailCheckedOut: string
  packageCreated: string
  assignPackage: string
  packageLockerDescription: string
  noPackageLockers: string
  setup: string
  setupPackageLockers: string
  numberOfLockers: string
  packageLockerCountHint: string
  packageLockerSetupSuccess: string
  selectHousehold: string
  enterTrackingNumber: string
  assign: string
  tracking: string
  // Messaging
  messages: string
  chat: string
  conversations: string
  noConversations: string
  noMessages: string
  typeMessage: string
  selectConversation: string
  selectConversationHint: string
  messagesDescription: string
  audioCall: string
  videoCall: string
  meal: string
  taxi: string
  general: string
  mail: string
  package: string
  reservation: string
  locker: string
  empty: string
  createWorkingGroup: string
  editWorkingGroup: string
  enabled: string
  disabled: string
  pending: string
  
  // Image upload
  itemPhoto: string
  addPhoto: string
  changePhoto: string
  removePhoto: string
  uploading: string
  
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
  sideCabinet: string
  
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
  
  // Invitation Codes
  invitationCode: string
  shareInvitationCode: string
  regenerateInvitationCode: string
  copyInvitationCode: string
  invitationCodeInstructions: string
  joinWithInvitationCode: string
  enterInvitationCode: string
  invalidInvitationCode: string
  failedToValidateCode: string
  joinHousehold: string
  joinType: string
  codeScanned: string
  pleaseSignIn: string
  found: string
  householdFound: string
  codePasted: string
  failedToPaste: string
  checking: string
  joining: string
  check: string
  join: string
  joinRequestSent: string
  successfullyJoined: string
  failedToJoin: string
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
  scanQRCodeToJoin: string
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
  
  // Activity descriptions with parameters
  itemCreatedWithQuantity: string
  itemCreated: string
  quantityIncreasedFromTo: string
  quantityDecreasedFromTo: string
  itemMovedFromTo: string
  itemUpdated: string
  itemDeleted: string
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
  household: string
  priority: string
  orEnterCustom: string
  
  // Time
  ago: string
  item: string
  submit: string
  locationPlaceholder: string
  descriptionPlaceholder: string
  
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
  
  // Admin Items Page
  checkDuplicates: string
  backToApp: string
  avgItemsPerHousehold: string
  updatePhoto: string
  tryAdjustingSearch: string
  noItemsCreatedYet: string
  min: string
  photo: string
  
  // Building
  buildingOverview: string
  buildingHouseholds: string
  buildingMailboxes: string
  buildingSettings: string
  buildingSummary: string
  buildingBasicInfo: string
  buildingPackageLockers: string
  buildingCommunity: string
  buildingFloorCount: string
  buildingUnitCount: string
  buildingHouseholdCount: string
  buildingCreatedAt: string
  buildingInvitationCode: string
  buildingCopyCode: string
  buildingShareCode: string
  buildingFloorsSetup: string
  buildingUnitsSetup: string
  buildingSetupComplete: string
  buildingSetupInProgress: string
  buildingSetupFloorsUnits: string
  buildingResetFloorsUnits: string
  buildingResetWarning: string
  buildingViewHouseholds: string
  buildingManageMailboxes: string
  buildingFloor: string
  buildingUnit: string
  buildingMailbox: string
  buildingNoHouseholds: string
  buildingLoading: string
  buildingMembers: string
  buildingItems: string
  buildingRooms: string
  buildingBackToCommunity: string
  buildingNotFound: string
  
  // Front Door
  frontDoorCommonArea: string
  frontDoorLoading: string
  frontDoorLoadError: string
  frontDoorStatsHouseholds: string
  frontDoorStatsMailboxes: string
  frontDoorStatsDoorBells: string
  frontDoorStatsLockers: string
  frontDoorLockerCountLabel: string
  frontDoorLockerCountHint: string
  frontDoorSyncButton: string
  frontDoorSyncing: string
  frontDoorSyncSuccess: string
  frontDoorSyncError: string
  frontDoorLockerUpdateSuccess: string
  frontDoorLockerUpdateError: string
  frontDoorNotifySuccess: string
  frontDoorNotifyError: string
  frontDoorDoorBellError: string
  frontDoorRingSuccess: string
  frontDoorRingError: string
  frontDoorNotifyButton: string
  frontDoorDoorBells: string
  frontDoorEnable: string
  frontDoorDisable: string
  frontDoorRingButton: string
  frontDoorPackageLockers: string
  frontDoorLocker: string
  frontDoorNoMailboxes: string
  frontDoorNoDoorBells: string
  frontDoorNoLockers: string
  
  // Community
  communityBackToList: string
  communityNotFound: string
  communityOverview: string
  communityBasicInfo: string
  communityStats: string
  communityAddress: string
  communityCreatedAt: string
  communityInvitationCode: string
  communityShareInvitation: string
  communityCopyInvitation: string
  communityInvitationCopied: string
  communityWorkingGroups: string
  communityAddMember: string
  communityNoMembers: string
  communityCreateWorkgroup: string
  communityNoWorkgroups: string
  communityNotSet: string
  communityMemberList: string
  communityWorkgroupList: string
  communityWorkgroupType: string
  communityWorkgroupMembers: string
  
  // Household Actions
  householdReservation: string
  householdMaintenance: string
  householdProperty: string
  householdMail: string
  householdPackage: string
  householdVisitorTag: string
  householdInvitationCode: string
  copyHouseholdId: string
  householdActive: string
  
  // Doorbell
  doorBell: string
  doorBellRinging: string
  doorBellConnected: string
  doorBellEnded: string
  doorBellNoActiveCalls: string
  doorBellAnswer: string
  doorBellCallAnswered: string
  doorBellAnswerError: string
  doorBellEndCall: string
  doorBellCallEnded: string
  doorBellUnlockDoor: string
  doorBellDoorUnlocked: string
  doorBellUnlockError: string
  doorBellSendMessage: string
  doorBellMessagePlaceholder: string
  doorBellMessageSent: string
  doorBellMessageError: string
  doorBellCameraOn: string
  doorBellCameraOff: string
  doorBellMicOn: string
  doorBellMicOff: string
  doorBellVideoCall: string
  doorBellCameraActive: string
  doorBellOnlyInBuilding: string
  doorBellVisitorArrived: string
  doorBellVisitorAtDoor: string
  householdInactive: string
  copyError: string
  addHousehold: string
  householdCount: string
  householdUnitLabels: string
  householdCreated: string
  householdCreatedError: string
  
  // Facilities
  buildingFacilities: string
  facilityAddNew: string
  facilityNameLabel: string
  facilityTypeLabel: string
  facilityFloorLabel: string
  facilityCapacityLabel: string
  facilityCreateButton: string
  facilityCreated: string
  facilityCreateError: string
  facilityLoadError: string
  facilityLoading: string
  facilityNoFacilities: string
  facilityDelete: string
  facilityDeleteConfirm: string
  facilityDeleted: string
  facilityDeleteError: string
  facilityOperatingHours: string
  facilityOpenTime: string
  facilityCloseTime: string
  facilityClosed: string
  facilitySaveHours: string
  facilityHoursSaved: string
  facilityHoursError: string
  use24HourFormat: string
  minimum1Hour: string
  reservationStartTimeMustBeFuture: string
  reservationEndTimeMustBeAfterStart: string
  reservationMinimumDuration: string
  reservationTimeOccupied: string
  adminChatHistory: string
  adminChatHistoryDescription: string
  adminReceiverType: string
  adminStartDate: string
  adminEndDate: string
  adminApplyFilters: string
  adminNoChatHistory: string
  adminTimestamp: string
  adminSender: string
  adminReceiver: string
  adminMessage: string
  adminFormat: string
  adminPrevious: string
  adminNext: string
  callOccupied: string
  wifiAutoFilled: string
  wifiSSIDAutoFilled: string
  wifiPasswordAutoFilled: string
  
  day: string
  status: string
  occupied: string
  available: string
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
  householdSettings: 'Household Settings',
  facilityReservations: 'Facility Reservations',
  reserveBuildingFacilities: 'Reserve building facilities like gym, meeting rooms, etc.',
  newReservation: 'New Reservation',
  noFacilitiesAvailable: 'No Facilities Available',
  householdNotInBuilding: 'This household does not belong to a building with facilities.',
  floor: 'Floor',
  capacity: 'Capacity',
  myReservations: 'My Reservations',
  purpose: 'Purpose',
  accessCode: 'Access Code',
  date: 'Date',
  startTime: 'Start Time',
  endTime: 'End Time',
  numberOfPeople: 'Number of People',
  numberOfPeoplePlaceholder: 'e.g., 5',
  purposePlaceholder: 'e.g., Team meeting, Workout session',
  notesPlaceholder: 'Additional notes...',
  notes: 'Notes',
  cancelReservation: 'Cancel',
  createReservation: 'Create Reservation',
  submitting: 'Submitting...',
  reservationCreated: 'Reservation request created. Waiting for building admin approval.',
  use24HourFormat: 'Use 24-hour format (e.g., 09:00, 21:00)',
  minimum1Hour: 'Minimum 1 hour duration',
  reservationStartTimeMustBeFuture: 'Start time must be in the future',
  reservationEndTimeMustBeAfterStart: 'End time must be after start time',
  reservationMinimumDuration: 'Reservation must be at least 1 hour',
  reservationTimeOccupied: 'Time slot is already occupied by another household. Your reservation has been automatically rejected.',
  adminChatHistory: 'Chat History',
  adminChatHistoryDescription: 'View all text chat messages between households, front desk, and front door visitors',
  adminReceiverType: 'Receiver Type',
  adminStartDate: 'Start Date',
  adminEndDate: 'End Date',
  adminApplyFilters: 'Apply Filters',
  adminNoChatHistory: 'No chat history found',
  adminTimestamp: 'Timestamp',
  adminSender: 'Sender',
  adminReceiver: 'Receiver',
  adminMessage: 'Message',
  adminFormat: 'Format',
  adminPrevious: 'Previous',
  adminNext: 'Next',
  callOccupied: 'Call already active. Existing call initiated by another user. Your call has been automatically rejected.',
  wifiAutoFilled: 'Current WiFi and saved password auto-filled',
  wifiSSIDAutoFilled: 'Current WiFi auto-filled, please enter password',
  wifiPasswordAutoFilled: 'WiFi password auto-filled',
  announcements: 'Announcements',
  announcement: 'Announcement',
  createAnnouncement: 'Create Announcement',
  sendAnnouncement: 'Send Announcement',
  title: 'Title',
  message: 'Message',
  manageAnnouncements: 'Manage Announcements',
  noAnnouncements: 'No announcements',
  clickToView: 'Click to view',
  unread: 'unread',
  system: 'System',
  community: 'Community',
  building: 'Building',
  from: 'From',
  expires: 'Expires',
  expirationDate: 'Expiration Date',
  active: 'Active',
  inactive: 'Inactive',
  targetAudience: 'Target Audience',
  allHouseholds: 'All Households',
  specificCommunity: 'Specific Community',
  specificBuilding: 'Specific Building',
  specificHousehold: 'Specific Household',
  communityId: 'Community ID',
  buildingId: 'Building ID',
  householdId: 'Household ID',
  enterCommunityId: 'Enter community ID',
  enterBuildingId: 'Enter building ID',
  enterHouseholdId: 'Enter household ID',
  characters: 'characters',
  sending: 'Sending...',
  pleaseFillAllFields: 'Please fill all required fields',
  announcementCreated: 'Announcement created successfully',
  source: 'Source',
  adminAnnouncements: 'Announcements',
  items: 'Items',
  allItems: 'All Items',
  duplicates: 'Duplicates',
  assistant: 'Assistant',
  assistantDescription: 'Ask the AIUI voice agent anything about your household or the world.',
  assistantPlaceholder: 'Ask a question...',
  assistantSend: 'Send',
  assistantVoiceHint: 'Prefer voice? Record a question below and send it to the AIUI agent.',
  assistantVoiceReady: 'Voice message ready. Press send to submit.',
  assistantSendVoice: 'Send voice question',
  assistantProcessing: 'Processing...',
  assistantNoResponse: 'No response received. Please try again.',
  assistantSourceAIUI: 'Answered by AIUI',
  assistantSourceFallback: 'Answered by fallback AI',
  assistantEmptyState: 'No conversations yet. Try asking about inventory counts, weather, or anything else.',
  homeAssistantPanelTitle: 'Home Assistant Control',
  homeAssistantPanelDescription: 'View and control your smart home entities directly from Smart Warehouse.',
  homeAssistantStatusLoading: 'Connecting to Home Assistant…',
  homeAssistantStatusError: 'Unable to reach Home Assistant',
  homeAssistantStatusReady: 'Connected',
  homeAssistantRefresh: 'Refresh',
  homeAssistantUnknown: 'Unknown',
  homeAssistantTurnOn: 'Turn On',
  homeAssistantTurnOff: 'Turn Off',
  homeAssistantToggleOn: 'Turned on.',
  homeAssistantToggleOff: 'Turned off.',
  homeAssistantToggleError: 'Failed to trigger action.',
  homeAssistantToggleUnsupported: 'This device cannot be toggled from here.',
  homeAssistantPower: 'Power',
  homeAssistantPowerOptionMissing: 'Power options unavailable.',
  homeAssistantPowerUnavailable: 'Power entity unavailable.',
  homeAssistantLastChanged: 'Last changed',
  homeAssistantClimateSection: 'Humidity Control',
  homeAssistantHumidifierSection: 'Air Circulation',
  homeAssistantCurrentTemperature: 'Current temperature',
  homeAssistantTargetTemperature: 'Target temperature',
  homeAssistantCurrentHumidity: 'Filter remaining (days)',
  homeAssistantTargetHumidity: 'Target humidity',
  homeAssistantModes: 'Modes',
  homeAssistantTemperatureUpdated: 'Temperature updated.',
  homeAssistantHumidityUpdated: 'Humidity updated.',
  homeAssistantModeUpdated: 'Mode updated.',
  homeAssistantModeHigh: 'High',
  homeAssistantModeMedium: 'Medium',
  homeAssistantModeLow: 'Low',
  homeAssistantModeOffLabel: 'Off',
  homeAssistantModeHeat: 'Heat',
  homeAssistantModeCool: 'Cool',
  homeAssistantModeAuto: 'Auto',
  homeAssistantModeDry: 'Dry',
  homeAssistantModeFan: 'Fan',
  homeAssistantModeOff: 'Off',
  homeAssistantCustomTitle: 'Custom service call',
  homeAssistantCustomDescription: 'Enter a domain.service and JSON payload, e.g. light.turn_on, {"entity_id": "light.living_room"}',
  homeAssistantCustomEntityRequired: 'Entity ID required.',
  homeAssistantCustomFormatError: 'Use domain.service format, e.g. light.turn_on',
  homeAssistantCustomSuccess: 'Service call sent.',
  homeAssistantCustomError: 'Failed to call service.',
  homeAssistantSendService: 'Send',
  homeAssistantNoEntities: 'No entities configured. Add NEXT_PUBLIC_HOME_ASSISTANT_ENTITIES or use the custom service call below.',
  homeAssistantNoOptions: 'No options available',
  homeAssistantEntities: 'Entities',
  homeAssistantEntitiesFound: 'entities found',
  homeAssistantEntitiesShown: 'shown',
  homeAssistantShowLess: 'Show Less',
  homeAssistantShowAll: 'Show All',
  homeAssistantAllDomains: 'All Types',
  mqttDevices: 'MQTT Devices',
  mqttDeviceName: 'Device Name',
  mqttDeviceId: 'Device ID',
  mqttVendor: 'Vendor',
  mqttStatus: 'Status',
  mqttOnline: 'Online',
  mqttOffline: 'Offline',
  mqttAddDevice: 'Add Device',
  mqttDeleteDevice: 'Delete Device',
  mqttControlDevice: 'Control Device',
  mqttPowerOn: 'Power On',
  mqttPowerOff: 'Power Off',
  mqttSetTemperature: 'Set Temperature',
  mqttSetMode: 'Set Mode',
  mqttSetFanSpeed: 'Set Fan Speed',
  mqttCommandSent: 'Command sent successfully',
  mqttCommandFailed: 'Failed to send command',
  mqttDeviceAdded: 'Device added successfully',
  mqttDeviceDeleted: 'Device deleted successfully',
  mqttNoDevices: 'No MQTT devices found. Add your first device to get started.',
  mqttVendorTuya: 'Tuya',
  mqttVendorESP: 'ESP',
  mqttVendorMidea: 'Midea',
  mqttVendorShelly: 'Shelly',
  mqttVendorAqara: 'Aqara',
  
  // Admin
  adminPanel: 'Admin Panel',
  adminManagement: 'Smart Warehouse Management',
  adminDashboard: 'Dashboard',
  adminCommunities: 'Communities',
  adminCommunitiesDescription: 'View and manage all communities, buildings, and residents',
  adminTotalCommunities: 'Total Communities',
  adminTotalBuildings: 'Total Buildings',
  adminTotalMembers: 'Total Members',
  adminTotalWorkgroups: 'Total Workgroups',
  adminCommunityList: 'Community List',
  adminViewDetails: 'View Details',
  adminNoCommunities: 'No communities yet',
  adminBuildings: 'Buildings',
  adminBuildingsDescription: 'View and manage all buildings and residents',
  adminFilterByCommunity: 'Filter by Community',
  noBuildings: 'No buildings yet',
  addBuilding: 'Add Building',
  adminBuildingsCount: 'Buildings',
  adminMembersCount: 'Members',
  adminWorkgroupsCount: 'Workgroups',
  adminTotalHouseholds: 'Total Households',
  adminAllCommunities: 'All Communities',
  adminHouseholds: 'Households',
  adminItems: 'Items',
  adminUsers: 'Admin Users',
  adminRoles: 'Roles',
  adminAnalytics: 'Analytics',
  adminSettings: 'Settings',
  adminAdministrator: 'Administrator',
  adminCopyright: 'Smart Warehouse Admin Panel. All rights reserved.',
  adminFilters: 'Filters',
  filter: 'Filter',
  adminHousehold: 'Household',
  adminAccess: 'Admin Access',
  adminSecure: 'Secure',
  
  // Admin Duplicates
  adminDuplicateManagement: 'Duplicate Management',
  adminDuplicateDescription: 'Find and resolve duplicate items, rooms, and categories',
  adminMaintenance: 'Maintenance Tickets',
  maintenanceTicketManagement: 'Maintenance Ticket Management',
  pendingEvaluation: 'Pending Evaluation',
  evaluated: 'Evaluated',
  assigned: 'Assigned',
  inProgress: 'In Progress',
  noTickets: 'No maintenance tickets found',
  chatWithFrontDesk: 'Chat with Front Desk',
  connecting: 'Connecting...',
  frontDesk: 'Front Desk',
  maintenanceTickets: 'Maintenance Tickets',
  createTicket: 'Create Ticket',
  createFirstTicket: 'Create your first ticket',
  workCompleted: 'Work Completed',
  closed: 'Closed',
  supplier: 'Supplier',
  assignedCrew: 'Crew',
  workLogs: 'Work Logs',
  requested: 'Requested',
  requestMaintenance: 'Request Maintenance',
  ticketTitlePlaceholder: 'Brief description of the issue',
  locationPlaceholder: 'Where is the issue located?',
  descriptionPlaceholder: 'Provide detailed description of the issue...',
  adminBackToAdmin: 'Back to Admin',
  adminDuplicateItems: 'Duplicate Items',
  adminDuplicateRooms: 'Duplicate Rooms',
  adminDuplicateCategories: 'Duplicate Categories',
  adminNoDuplicateItems: 'No duplicate items found',
  adminNoDuplicateRooms: 'No duplicate rooms found',
  adminNoDuplicateCategories: 'No duplicate categories found',
  adminAllItemsUnique: 'All items appear to be unique.',
  adminAllRoomsUnique: 'All rooms appear to be unique.',
  adminAllCategoriesUnique: 'All categories appear to be unique.',
  adminSimilar: 'similar',
  adminMerge: 'Merge',
  adminMerging: 'Merging...',
  adminKeepSeparate: 'Keep Separate',
  adminLevel: 'Level',
  adminMergeSuccess: 'Successfully merged {type}',
  adminMergeFailed: 'Failed to merge {type}',
  adminKeepSeparateSuccess: 'Marked {type} as separate',
  adminKeepSeparateFailed: 'Failed to mark {type} as separate',
  
  // Common
  commonLanguage: 'Language',
  commonCurrentLanguage: 'Current Language',
  commonSignOut: 'Sign Out',
  commonLoading: 'Loading...',
  commonSettings: 'Settings',
  commonCopy: 'Copy',
  commonNotSet: 'Not set',
  
  // Password Change
  changePassword: 'Change Password',
  currentPassword: 'Current Password',
  newPassword: 'New Password',
  confirmPassword: 'Confirm New Password',
  passwordRequirements: 'Minimum 6 characters',
  changing: 'Changing...',
  editFacility: 'Edit Facility',
  facilityUpdated: 'Facility updated successfully',
  facilityUpdateError: 'Failed to update facility',
  forgotPassword: 'Forgot Password',
  forgotPasswordDescription: 'Enter your email address and we will send you a password reset link.',
  checkYourEmail: 'Check your email',
  passwordResetEmailSent: 'If an account exists with this email, a password reset link has been sent.',
  backToSignIn: 'Back to Sign In',
  sendResetLink: 'Send Reset Link',
  invalidResetLink: 'Invalid reset link',
  passwordsDoNotMatch: 'Passwords do not match',
  passwordTooShort: 'Password must be at least 6 characters',
  resetPassword: 'Reset Password',
  enterNewPassword: 'Please enter your new password below',
  resetting: 'Resetting...',
  adminAccessRequired: 'Admin access required',
  adminPleaseSignIn: 'Please sign in to access the admin panel',
  commonSignIn: 'Sign In',
  
  // Dashboard Time Filters
  today: 'Today',
  pastWeek: 'Past Week',
  all: 'All',
  
  // Household Change Detection
  householdChangesDetected: 'Changes detected in your household.',
  refreshToSeeChanges: 'Refresh to see the latest changes.',
  
  // Admin Dashboard
  adminLoading: 'Loading admin dashboard...',
  adminError: 'Error Loading Dashboard',
  retry: 'Retry',
  adminWelcome: 'Welcome back',
  adminOverview: 'Here\'s an overview of your Smart Warehouse system',
  adminTotalUsers: 'Total Users',
  adminTotalItems: 'Total Items',
  adminAvgItems: 'Avg Items/Household',
  adminQuickActions: 'Quick Actions',
  adminManageHouseholds: 'Manage Households',
  adminViewAllItems: 'View All Items',
  adminViewAnalytics: 'View Analytics',
  adminSystemSettings: 'System Settings',
  adminSystemStatus: 'System Status',
  adminDatabase: 'Database',
  adminAPIServices: 'API Services',
  adminStorage: 'Storage',
  adminAuthentication: 'Authentication',
  adminHealthy: 'Healthy',
  adminRecentActivity: 'Recent Activity',
  adminSystemMonitoring: 'System monitoring active',
  adminAllServicesRunning: 'All services running normally',
  adminJustNow: 'Just now',
  adminDashboardAccessed: 'Admin dashboard accessed',
  adminSecureAuth: 'Secure authentication successful',
  admin2MinutesAgo: '2 minutes ago',
  adminLastUpdated: 'Last updated',
  
  // Admin Households
  adminSearchHouseholds: 'Search households, members, or descriptions...',
  adminCleanupDuplicates: 'Cleanup Duplicates',
  adminShowDetails: 'Show Details',
  adminHideDetails: 'Hide Details',
  
  // Admin Items
  adminViewManageItems: 'View and manage all items across households',
  adminSearchItems: 'Search items by name...',
  
  // Admin Users
  adminUserManagement: 'Admin User Management',
  
  // Admin Analytics
  adminAnalyticsDescription: 'System performance and usage statistics',
  adminFilterByLanguage: 'Filter by Language',
  adminRolesLanguages: 'Admin Roles & Languages',
  
  // Admin Settings
  adminSettingsDescription: 'Manage system configuration and monitor health',
  
  // Admin Roles
  adminRoleManagement: 'Admin Role Management',
  adminRoleManagementDescription: 'Manage admin user roles and permissions',
  
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
  optionalLabel: 'Optional',
  move: 'Move',
  moving: 'Moving...',
  checkout: 'Checkout',
  checkingOut: 'Checking out...',
  history: 'History',
  editItem: 'Edit Item',
  moveItem: 'Move Item',
  checkoutItem: 'Checkout Item',
  itemHistory: 'Item History',
  
  // Error handling
  errorOccurred: 'Something went wrong',
  unexpectedError: 'An unexpected error occurred. Please try refreshing the page.',
  refreshPage: 'Refresh Page',
  goHome: 'Go Home',
  
  // Add Item Modal
  selectRoom: 'Select a room',
  autoCreateDefaultCabinet: 'Auto-create default cabinet',
  checkoutQuantity: 'Checkout Quantity',
  reason: 'Reason',
  moveToRoom: 'Move to Room',
  moveConfirmation: 'Moving to',
  moveQuantity: 'Quantity to Move',
  moveFrom: 'Move from',
  adjustQuantity: 'Adjust Quantity',
  currentQuantity: 'Current Quantity',
  newQuantity: 'New Quantity',
  adjustment: 'Adjustment',
  noQuantityChange: 'No quantity change specified',
  invalidQuantity: 'Quantity cannot be negative',
  failedToUpdateQuantity: 'Failed to update quantity',
  updateQuantity: 'Update Quantity',
  updating: 'Updating',
  
  // Voice Comments
  voiceComment: 'Voice Comment',
  voiceCommentHint: 'Record a voice note to explain why this item was checked out',
  startRecording: 'Start Recording',
  stopRecording: 'Stop Recording',
  pauseRecording: 'Pause',
  playRecording: 'Play',
  deleteRecording: 'Delete Recording',
  rerecord: 'Record Again',
  voiceCommentMaxDuration: 'Recording stopped at maximum duration',
  voiceCommentPermissionError: 'Microphone permission denied. Please allow microphone access.',
  voiceCommentConversionError: 'Failed to process voice recording',
  playVoiceComment: 'Play Voice Comment',
  playingVoiceComment: 'Playing...',
  voiceTranscript: 'Transcription',
  transcribingVoice: 'Transcribing...',
  voicePromptStart: 'What can I help you?',
  voicePromptEnd: 'Received.',
  
  // Category Management
  categoryHierarchy: 'Category Hierarchy',
  cleanDuplicateCategories: '🗂️ CLEAN DUPLICATE CATEGORIES',
  
  // Missing translations for hardcoded strings
  noItemsFound: 'No items found',
  startAddingItems: 'Start by adding some items to your inventory.',
  forceRefreshPage: 'Force Refresh Page',
  refresh: 'Refresh',
  whereStored: 'Where is this item stored?',
  room: 'Room',
  cabinetShelf: 'Cabinet/Shelf (Optional)',
  leaveEmptyDefault: 'Leave empty to automatically create a default cabinet for this room',
  addItemButton: 'Add Item',
  switchHousehold: 'Switch household',
  cameraNotAvailable: 'Camera not available, please upload Taiwan invoice photo for recognition',
  uploadTaiwanInvoice: 'Upload Taiwan Invoice Photo',
  uploadTaiwanInvoicePhoto: 'Upload Taiwan Invoice Photo',
  unknownItem: 'Unknown Item',
  unableToRecognize: 'Unable to recognize item',
  miscellaneous: 'Miscellaneous',
  
  // Duplicate Detection
  potentialDuplicate: 'Potential Duplicate Item',
  newItem: 'New Item',
  similarItemsFound: 'Similar items found',
  similarItems: 'Similar Items',
  createNewItem: 'Create New Item',
  useExistingItem: 'Use Existing Item',
  location: 'Location',
  country: 'Country',
  city: 'City',
  district: 'District',
  neighborhood: 'Community/Neighborhood',
  streetAddress: 'Street Address',
  apartmentNo: 'Apartment/Building No.',
  telephone: 'Telephone',
  fullAddress: 'Full Address',
  selectCountry: 'Select Country',
  selectCity: 'Select City',
  selectDistrict: 'Select District',
  enterCommunity: 'Enter community or neighborhood',
  enterStreetAddress: 'Enter street address',
  enterApartmentNo: 'e.g., 123, Building A',
  enterTelephone: 'Enter telephone number',
  completeAddress: 'Complete address',
  setLocationOnMap: 'Set Location on Map',
  updateLocationOnMap: 'Update Location on Map',
  selectLocationOnMap: 'Select Location on Map',
  saveLocation: 'Save Location',
  unlockCity: 'Unlock City',
  googleMapsNotAvailable: 'Google Maps not available',
  enterLocationManually: 'Please enter location manually using the form above',
  coordinates: 'Coordinates',
  enterFullAddressToAutoParse: 'Enter full address to automatically parse into components',
  createNewHousehold: 'Create New Household',
  enterHouseholdName: 'Enter household name',
  enterDescription: 'Enter description (optional)',
  creating: 'Creating...',
  create: 'Create',
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
  lowStock: 'Low Stock',
  searchTips: 'Search Tips',
  searchByName: 'Search by item name',
  searchByDescription: 'Search by description',
  searchByCategory: 'Search by category',
  searchByLocation: 'Search by location',
  useChatGPT: 'Use ChatGPT Search',
  
  // Image upload
  itemPhoto: 'Item Photo',
  addPhoto: 'Add Photo',
  changePhoto: 'Change Photo',
  removePhoto: 'Remove',
  uploading: 'Uploading...',
  
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
  sideCabinet: 'Side Cabinet',
  
  // Item Management
  description: 'Description',
  minimumQuantity: 'Minimum Quantity Alert',
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
  scanQRCodeToJoin: 'Scan QR code to join',
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
  
  // Activity descriptions with parameters
  itemCreatedWithQuantity: 'Item "{itemName}" created with quantity {quantity}',
  itemCreated: 'Item created',
  quantityIncreasedFromTo: 'Quantity increased from {from} to {to}',
  quantityDecreasedFromTo: 'Quantity decreased from {from} to {to}',
  itemMovedFromTo: '{itemName} moved from {from} to {to}',
  itemUpdated: 'Item updated',
  itemDeleted: 'Item deleted',
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
  household: 'Household',
  priority: 'Priority',
  orEnterCustom: 'Or enter custom',
  
  // Time
  ago: 'ago',
  item: 'Item',
  submit: 'Submit',
  
  // Dashboard
  totalItems: 'Total Items',
  lowStockItems: 'Low Stock Items',
  householdMembers: 'Household Members',
  recentActivity: 'Recent Activity',
  noRecentActivity: 'No recent activity.',
  startByAddingFirstItem: 'Start by adding your first item!',
  noActivities: 'No activities',
  activitiesWillAppearHere: 'Activities will appear here as you use the system.',
  
  // Taiwan E-Invoice
  taiwanInvoice: 'Taiwan Invoice',
  scanTaiwanInvoice: 'Scan Taiwan Invoice',
  taiwanInvoiceDetected: 'Taiwan invoice detected',
  taiwanInvoiceDecoded: 'Taiwan invoice decoded successfully',
  invoiceNumber: 'Invoice Number',
  invoiceDate: 'Invoice Date',
  sellerName: 'Seller Name',
  totalAmount: 'Total Amount',
  taxAmount: 'Tax Amount',
  invoiceItems: 'Invoice Items',
  processingTaiwanInvoice: 'Processing Taiwan invoice...',
  
  // Building
  buildingOverview: 'Overview',
  buildingHouseholds: 'Households',
  buildingMailboxes: 'Mailboxes',
  buildingSettings: 'Building Settings',
  buildingSummary: 'Building Summary',
  buildingBasicInfo: 'Basic Information',
  buildingPackageLockers: 'Package Lockers',
  buildingCommunity: 'Community',
  buildingFloorCount: 'Floors',
  buildingUnitCount: 'Units',
  buildingHouseholdCount: 'Households',
  buildingCreatedAt: 'Created',
  buildingInvitationCode: 'Invitation Code',
  buildingCopyCode: 'Copy',
  buildingShareCode: 'Share this code with others to join this building',
  buildingFloorsSetup: 'Floors and units set up',
  buildingUnitsSetup: 'Residential units',
  buildingSetupComplete: 'Floors and units set up',
  buildingSetupInProgress: 'Setting up...',
  buildingSetupFloorsUnits: 'Set up Floors and Units',
  buildingResetFloorsUnits: 'Reset Floors and Units',
  buildingResetWarning: 'Resetting will update existing floors and units (will not delete existing data)',
  buildingViewHouseholds: 'View Households',
  buildingManageMailboxes: 'Manage Mailboxes',
  buildingFloor: 'Floor',
  buildingUnit: 'Unit',
  buildingMailbox: 'Mailbox',
  buildingNoHouseholds: 'No households yet',
  buildingLoading: 'Loading...',
  buildingMembers: 'Members',
  buildingItems: 'Items',
  buildingRooms: 'Rooms',
  buildingBackToCommunity: 'Back to Community',
  buildingNotFound: 'Building not found',
  frontDoorCommonArea: 'Front Door & Common Area',
  frontDoorLoading: 'Loading front door data...',
  frontDoorLoadError: 'Unable to load front door data',
  frontDoorStatsHouseholds: 'Households',
  frontDoorStatsMailboxes: 'Mailboxes',
  frontDoorStatsDoorBells: 'Door Bells',
  frontDoorStatsLockers: 'Package Lockers',
  frontDoorLockerCountLabel: 'Package locker count',
  frontDoorLockerCountHint: 'Building/community admins can adjust locker capacity at any time.',
  frontDoorSyncButton: 'Sync with households',
  frontDoorSyncing: 'Syncing...',
  frontDoorSyncSuccess: 'Front door facilities synced',
  frontDoorSyncError: 'Failed to sync front door facilities',
  frontDoorLockerUpdateSuccess: 'Locker count updated',
  frontDoorLockerUpdateError: 'Failed to update locker count',
  frontDoorNotifySuccess: 'Mail notification sent',
  frontDoorNotifyError: 'Unable to send notification',
  frontDoorDoorBellError: 'Failed to update door bell',
  frontDoorRingSuccess: 'Door bell triggered',
  frontDoorRingError: 'Failed to ring door bell',
  frontDoorNotifyButton: 'Notify household',
  frontDoorDoorBells: 'Door Bells',
  frontDoorEnable: 'Enable',
  frontDoorDisable: 'Disable',
  frontDoorRingButton: 'Ring',
  frontDoorPackageLockers: 'Package Lockers',
  frontDoorLocker: 'Locker',
  frontDoorNoMailboxes: 'No mailboxes yet',
  frontDoorNoDoorBells: 'No door bells yet',
  
  // Doorbell
  doorBell: 'Door Bell',
  doorBellRinging: 'Ringing',
  doorBellConnected: 'Connected',
  doorBellEnded: 'Ended',
  doorBellNoActiveCalls: 'No active calls',
  doorBellAnswer: 'Answer',
  doorBellCallAnswered: 'Call answered',
  doorBellAnswerError: 'Failed to answer call',
  doorBellEndCall: 'End Call',
  doorBellCallEnded: 'Call ended',
  doorBellUnlockDoor: 'Unlock Door',
  doorBellDoorUnlocked: 'Door unlocked',
  doorBellUnlockError: 'Failed to unlock door',
  doorBellSendMessage: 'Send',
  doorBellMessagePlaceholder: 'Type a message...',
  doorBellMessageSent: 'Message sent',
  doorBellMessageError: 'Failed to send message',
  doorBellCameraOn: 'Camera On',
  doorBellCameraOff: 'Camera Off',
  doorBellMicOn: 'Mic On',
  doorBellMicOff: 'Mic Off',
  doorBellVideoCall: 'Video Call',
  doorBellCameraActive: 'Camera Active',
  doorBellOnlyInBuilding: 'Doorbell feature is only available for households in a building.',
  doorBellVisitorArrived: 'Doorbell ringing',
  doorBellVisitorAtDoor: 'Someone is at the door',
  frontDoorNoLockers: 'No package lockers yet',
  
  // Household Actions
  householdReservation: 'Reservation',
  householdMaintenance: 'Maintenance',
  householdProperty: 'Property',
  propertyServices: 'Property Services',
  propertyServicesSubtitle: 'Mail / Packages / Door alarms and shared spaces',
  openReservations: 'Reserve shared facilities',
  openBuildingServices: 'View mail / packages / door bells',
  buildingNotLinked: 'This household is not linked to a building yet',
  householdMail: 'Mail',
  householdPackage: 'Package',
  mailboxNumber: 'Mailbox',
  doorBells: 'Door Bells',
  doorBellNumber: 'Door Bell',
  packageLocker: 'Package Locker',
  packageNumber: 'Tracking Number',
  noMailboxAssigned: 'No mailbox assigned to this household',
  noDoorbellsAssigned: 'No doorbells assigned to this household',
  noPackages: 'No packages waiting for pickup',
  hasMail: 'Has Mail',
  noMail: 'No Mail',
  lastMailAt: 'Last mail',
  lastRungAt: 'Last rung',
  checkedInAt: 'Checked in',
  packageCheckedOut: 'Package checked out successfully',
  mailCheckedOut: 'Mail checked out successfully',
  packageCreated: 'Package created successfully',
  assignPackage: 'Assign Package',
  packageLockerDescription: 'Click on an empty locker to assign a package to a household',
  noPackageLockers: 'No package lockers configured',
  setup: 'Setup',
  setupPackageLockers: 'Setup Package Lockers',
  numberOfLockers: 'Number of Package Lockers',
  packageLockerCountHint: 'Set the total number of package lockers for this building (0-100)',
  packageLockerSetupSuccess: 'Package lockers setup successfully',
  selectHousehold: 'Select household',
  enterTrackingNumber: 'Enter tracking number',
  assign: 'Assign Package',
  tracking: 'Tracking',
  locker: 'Locker',
  empty: 'Empty',
  enabled: 'Enabled',
  disabled: 'Disabled',
  // Messaging
  messages: 'Messages',
  chat: 'Chat',
  conversations: 'Conversations',
  noConversations: 'No conversations yet',
  noMessages: 'No messages yet. Start the conversation!',
  typeMessage: 'Type a message...',
  selectConversation: 'Select a conversation',
  selectConversationHint: 'Choose a conversation from the list to start messaging',
  messagesDescription: 'Communicate with households',
  audioCall: 'Audio Call',
  videoCall: 'Video Call',
  meal: 'Meal',
  taxi: 'Taxi',
  general: 'General',
  mail: 'Mail',
  package: 'Package',
  reservation: 'Reservation',
  createWorkingGroup: 'Create Working Group',
  editWorkingGroup: 'Edit Working Group',
  pending: 'Pending',
  householdNotFound: 'Household not found',
  householdVisitorTag: 'Visitor Tag',
  householdInvitationCode: 'Invitation Code',
  copyHouseholdId: 'Copy Household ID',
  householdActive: 'Active',
  householdInactive: 'Inactive',
  copyError: 'Failed to copy',
  addHousehold: 'Add Household',
  householdCount: 'Number of households',
  householdUnitLabels: 'Unit labels',
  householdCreated: 'Households created successfully',
  householdCreatedError: 'Failed to create households',
  buildingFacilities: 'Facilities',
  facilityAddNew: 'Add Facility',
  facilityNameLabel: 'Facility name',
  facilityTypeLabel: 'Facility type',
  facilityFloorLabel: 'Floor',
  facilityCapacityLabel: 'Capacity',
  facilityCreateButton: 'Create facility',
  facilityCreated: 'Facility created successfully',
  facilityCreateError: 'Failed to create facility',
  facilityLoadError: 'Failed to load facilities',
  facilityLoading: 'Loading facilities...',
  facilityNoFacilities: 'No facilities yet',
  facilityDelete: 'Remove facility',
  facilityDeleteConfirm: 'Remove this facility?',
  facilityDeleted: 'Facility removed',
  facilityDeleteError: 'Failed to remove facility',
  facilityOperatingHours: 'Operating Hours',
  facilityOpenTime: 'Open',
  facilityCloseTime: 'Close',
  facilityClosed: 'Closed',
  facilitySaveHours: 'Save hours',
  facilityHoursSaved: 'Operating hours saved',
  facilityHoursError: 'Failed to save operating hours',
  day: 'Day',
  status: 'Status',
  occupied: 'Occupied',
  available: 'Available',
  
  // Community
  communityBackToList: 'Back to Community List',
  communityNotFound: 'Community not found',
  communityOverview: 'Overview',
  communityBasicInfo: 'Basic Information',
  communityStats: 'Statistics',
  communityAddress: 'Address',
  communityCreatedAt: 'Created At',
  communityInvitationCode: 'Invitation Code',
  communityShareInvitation: 'Share this invitation code with others so they can join this community',
  communityCopyInvitation: 'Copy',
  communityInvitationCopied: 'Invitation code copied',
  communityWorkingGroups: 'Working Groups',
  communityAddMember: 'Add Member',
  communityNoMembers: 'No members yet',
  communityCreateWorkgroup: 'Create Workgroup',
  communityNoWorkgroups: 'No workgroups yet',
  communityNotSet: 'Not set',
  communityMemberList: 'Member List',
  communityWorkgroupList: 'Workgroup List',
  communityWorkgroupType: 'Type',
  communityWorkgroupMembers: 'Members',
  
  // Invitation Codes
  invitationCode: 'Invitation Code',
  shareInvitationCode: 'Share this code with others to let them join your household',
  regenerateInvitationCode: 'Regenerate',
  copyInvitationCode: 'Copy to clipboard',
  invitationCodeInstructions: '• Share this code with family members to invite them\n• New users can enter this code during signup to join your household\n• Regenerate if you suspect the code has been compromised',
  joinWithInvitationCode: 'Join with Invitation Code',
  joinHousehold: 'Join Household',
  joinType: 'Join Type',
  codeScanned: 'Code scanned successfully',
  pleaseSignIn: 'Please sign in',
  found: 'Found',
  householdFound: 'Household Found',
  codePasted: 'Code pasted from clipboard',
  failedToPaste: 'Failed to read from clipboard',
  checking: 'Checking...',
  joining: 'Joining...',
  check: 'Check',
  join: 'Join',
  joinRequestSent: 'Join request sent. Waiting for approval.',
  successfullyJoined: 'Successfully joined!',
  failedToJoin: 'Failed to join',
  failedToValidateCode: 'Failed to validate invitation code',
  enterInvitationCode: 'Enter invitation code (optional)',
  invalidInvitationCode: 'Invalid invitation code',
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
  
  // Category Name Translations (for existing categories)
  categoryNameTranslations: {
    'Electronics': 'Electronics',
    'Tools': 'Tools',
    'Clothing': 'Clothing',
    'Books': 'Books',
    'Miscellaneous': 'Miscellaneous'
  },
  
  // Admin Items Page
  checkDuplicates: 'Check Duplicates',
  backToApp: 'Back to App',
  avgItemsPerHousehold: 'Avg Items/Household',
  updatePhoto: 'Update Photo',
  tryAdjustingSearch: 'Try adjusting your search or filters.',
  noItemsCreatedYet: 'No items have been created yet.',
  min: 'Min',
  photo: 'Photo',
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
  householdSettings: '家庭設定',
  facilityReservations: '設施預約',
  reserveBuildingFacilities: '預約大樓設施，如健身房、會議室等',
  newReservation: '新增預約',
  noFacilitiesAvailable: '無可用設施',
  householdNotInBuilding: '此住戶不屬於有設施的大樓',
  floor: '樓層',
  capacity: '容量',
  myReservations: '我的預約',
  purpose: '用途',
  accessCode: '存取碼',
  date: '日期',
  startTime: '開始時間',
  endTime: '結束時間',
  numberOfPeople: '預計人數',
  numberOfPeoplePlaceholder: '例如 : 5',
  purposePlaceholder: '例如：團隊會議、運動時間',
  notesPlaceholder: '其他備註...',
  notes: '備註',
  cancelReservation: '取消',
  createReservation: '建立預約',
  submitting: '提交中...',
  reservationCreated: '預約請求已建立，等待審核',
  use24HourFormat: '使用 24 小時制（例如：09:00、21:00）',
  minimum1Hour: '最少 1 小時',
  reservationStartTimeMustBeFuture: '開始時間必須在未來',
  reservationEndTimeMustBeAfterStart: '結束時間必須在開始時間之後',
  reservationMinimumDuration: '預約時間至少需要 1 小時',
  reservationTimeOccupied: '該時段已被其他住戶預約。您的預約已自動被拒絕。',
  adminChatHistory: '聊天記錄',
  adminChatHistoryDescription: '查看所有住戶、前台和訪客之間的文字聊天訊息',
  adminMaintenance: '報修管理',
  maintenanceTicketManagement: '報修單管理',
  pendingEvaluation: '待評估',
  evaluated: '已評估',
  assigned: '已指派',
  inProgress: '進行中',
  noTickets: '找不到報修單',
  chatWithFrontDesk: '與前台聊天',
  connecting: '連接中...',
  frontDesk: '前台',
  maintenanceTickets: '報修單',
  createTicket: '建立報修單',
  workCompleted: '工作完成',
  closed: '已關閉',
  createFirstTicket: '建立您的第一張報修單',
  supplier: '供應商',
  assignedCrew: '工作團隊',
  location: '位置',
  workLogs: '工作記錄',
  requested: '請求時間',
  requestMaintenance: '請求報修',
  ticketTitlePlaceholder: '問題簡要描述',
  locationPlaceholder: '問題所在位置？',
  descriptionPlaceholder: '提供問題的詳細描述...',
  submit: '提交',
  adminReceiverType: '接收者類型',
  adminStartDate: '開始日期',
  adminEndDate: '結束日期',
  adminApplyFilters: '套用篩選',
  adminNoChatHistory: '找不到聊天記錄',
  adminTimestamp: '時間戳記',
  adminSender: '發送者',
  adminReceiver: '接收者',
  adminMessage: '訊息',
  adminFormat: '格式',
  adminPrevious: '上一頁',
  adminNext: '下一頁',
  callOccupied: '通話已在使用中。現有通話由其他用戶發起。您的通話已自動被拒絕。',
  wifiAutoFilled: '已自動填充當前 WiFi 和保存的密碼',
  wifiSSIDAutoFilled: '已自動填充當前 WiFi，請輸入密碼',
  wifiPasswordAutoFilled: '已自動填充 WiFi 密碼',
  
  // Announcements
  announcements: '公告',
  announcement: '公告',
  createAnnouncement: '建立公告',
  sendAnnouncement: '發送公告',
  title: '標題',
  message: '訊息',
  manageAnnouncements: '管理公告',
  noAnnouncements: '無公告',
  propertyServices: '物業服務',
  propertyServicesSubtitle: '信箱 / 包裹 / 門鈴與共用空間',
  openReservations: '預約共用設施',
  openBuildingServices: '查看信箱 / 包裹 / 門鈴',
  buildingNotLinked: '此家庭尚未連結大樓資料',
  clickToView: '點擊查看',
  unread: '未讀',
  system: '系統',
  community: '社區',
  building: '大樓',
  from: '來自',
  expires: '到期',
  expirationDate: '到期日期',
  active: '啟用',
  inactive: '停用',
  targetAudience: '目標受眾',
  allHouseholds: '所有家庭',
  specificCommunity: '特定社區',
  specificBuilding: '特定大樓',
  specificHousehold: '特定住戶',
  communityId: '社區 ID',
  buildingId: '大樓 ID',
  householdId: '住戶 ID',
  enterCommunityId: '輸入社區 ID',
  enterBuildingId: '輸入大樓 ID',
  enterHouseholdId: '輸入住戶 ID',
  characters: '字元',
  sending: '發送中...',
  pleaseFillAllFields: '請填寫所有必填欄位',
  announcementCreated: '公告已建立',
  source: '來源',
  householdMail: '信箱',
  householdPackage: '包裹',
  mailboxNumber: '信箱號碼',
  doorBells: '門鈴',
  doorBellNumber: '門鈴號碼',
  packageLocker: '包裹櫃',
  packageNumber: '追蹤號碼',
  packageCheckedOut: '包裹已領取',
  mailCheckedOut: '郵件已領取',
  packageCreated: '包裹已建立',
  assignPackage: '分配包裹',
  packageLockerDescription: '點擊空置的包裹櫃以分配包裹給住戶',
  noPackageLockers: '尚未設置包裹櫃',
  setup: '設置',
  setupPackageLockers: '設置包裹櫃',
  numberOfLockers: '包裹櫃數量',
  packageLockerCountHint: '設置此大樓的包裹櫃總數（0-100）',
  packageLockerSetupSuccess: '包裹櫃設置成功',
  selectHousehold: '選擇住戶',
  enterTrackingNumber: '輸入追蹤號碼',
  assign: '分配包裹',
  tracking: '追蹤',
  locker: '包裹櫃',
  empty: '空置',
  // Messaging
  messages: '訊息',
  chat: '聊天',
  conversations: '對話',
  noConversations: '尚無對話',
  noMessages: '尚無訊息。開始對話吧！',
  typeMessage: '輸入訊息...',
  selectConversation: '選擇對話',
  selectConversationHint: '從列表中選擇對話以開始訊息',
  messagesDescription: '與住戶溝通',
  audioCall: '語音通話',
  videoCall: '視訊通話',
  meal: '餐點',
  taxi: '計程車',
  general: '一般',
  mail: '郵件',
  package: '包裹',
  reservation: '預約',
  createWorkingGroup: '創建工作組',
  editWorkingGroup: '編輯工作組',
  noMailboxAssigned: '此家庭尚未分配信箱',
  noDoorbellsAssigned: '此家庭尚未分配門鈴',
  noPackages: '目前沒有待領取的包裹',
  hasMail: '有郵件',
  noMail: '無郵件',
  lastMailAt: '最後郵件時間',
  lastRungAt: '最後響鈴時間',
  checkedInAt: '登記時間',
  enabled: '啟用',
  disabled: '停用',
  pending: '待領取',
  items: '物品',
  allItems: '所有物品',
  duplicates: '重複項目',
  assistant: '語音助理',
  assistantDescription: '向 AIUI 語音助手提問，瞭解家庭狀況或其他資訊。',
  assistantPlaceholder: '請輸入問題...',
  assistantSend: '送出',
  assistantVoiceHint: '想使用語音嗎？在下方錄製問題並傳送給 AIUI 助理。',
  assistantVoiceReady: '語音訊息已就緒，按送出提交。',
  assistantSendVoice: '送出語音問題',
  assistantProcessing: '思考中...',
  assistantNoResponse: '尚未取得回應，請再試一次。',
  assistantSourceAIUI: '由 AIUI 回答',
  assistantSourceFallback: '由備援 AI 回答',
  assistantEmptyState: '目前尚無對話。試著詢問庫存、天氣或其他問題。',
  homeAssistantPanelTitle: 'Home Assistant 控制',
  homeAssistantPanelDescription: '直接在 Smart Warehouse 檢視與控制智慧家庭裝置。',
  homeAssistantStatusLoading: '正在連線 Home Assistant…',
  homeAssistantStatusError: '無法連線到 Home Assistant',
  homeAssistantStatusReady: '連線正常',
  homeAssistantRefresh: '重新整理',
  homeAssistantUnknown: '未知',
  homeAssistantTurnOn: '開啟',
  homeAssistantTurnOff: '關閉',
  homeAssistantToggleOn: '已開啟。',
  homeAssistantToggleOff: '已關閉。',
  homeAssistantToggleError: '操作失敗。',
  homeAssistantToggleUnsupported: '此裝置不支援快速開關控制。',
  homeAssistantPower: '電源',
  homeAssistantPowerOptionMissing: '無法取得電源選項。',
  homeAssistantPowerUnavailable: '找不到電源控制。',
  homeAssistantLastChanged: '最後更新',
  homeAssistantClimateSection: '濕度控制',
  homeAssistantHumidifierSection: '空氣循環',
  homeAssistantCurrentTemperature: '目前溫度',
  homeAssistantTargetTemperature: '目標溫度',
  homeAssistantCurrentHumidity: '濾網剩餘（天）',
  homeAssistantTargetHumidity: '目標濕度',
  homeAssistantModes: '模式',
  homeAssistantTemperatureUpdated: '溫度已更新。',
  homeAssistantHumidityUpdated: '濕度已更新。',
  homeAssistantModeUpdated: '模式已更新。',
  homeAssistantModeHigh: '高',
  homeAssistantModeMedium: '中',
  homeAssistantModeLow: '低',
  homeAssistantModeOffLabel: '關閉',
  homeAssistantModeHeat: '暖氣',
  homeAssistantModeCool: '冷氣',
  homeAssistantModeAuto: '自動',
  homeAssistantModeDry: '除濕',
  homeAssistantModeFan: '送風',
  homeAssistantModeOff: '關閉',
  homeAssistantCustomTitle: '自訂服務呼叫',
  homeAssistantCustomDescription: '輸入 domain.service 與 JSON 載荷，例如：light.turn_on，{"entity_id": "light.living_room"}',
  homeAssistantCustomEntityRequired: '需填寫實體 ID。',
  homeAssistantCustomFormatError: '請使用 domain.service 格式，例如 light.turn_on',
  homeAssistantCustomSuccess: '已送出服務呼叫。',
  homeAssistantCustomError: '服務呼叫失敗。',
  homeAssistantSendService: '送出',
  homeAssistantNoEntities: '尚未設定常用實體。可在 NEXT_PUBLIC_HOME_ASSISTANT_ENTITIES 環境變數中加入 entity_id，或直接使用下方自訂服務控制裝置。',
  homeAssistantNoOptions: '無可用選項',
  homeAssistantEntities: '實體列表',
  homeAssistantEntitiesFound: '個實體已找到',
  homeAssistantEntitiesShown: '個顯示中',
  homeAssistantShowLess: '顯示較少',
  homeAssistantShowAll: '顯示全部',
  homeAssistantAllDomains: '所有類型',
  mqttDevices: 'MQTT 設備',
  mqttDeviceName: '設備名稱',
  mqttDeviceId: '設備 ID',
  mqttVendor: '供應商',
  mqttStatus: '狀態',
  mqttOnline: '在線',
  mqttOffline: '離線',
  mqttAddDevice: '添加設備',
  mqttDeleteDevice: '刪除設備',
  mqttControlDevice: '控制設備',
  mqttPowerOn: '開啟',
  mqttPowerOff: '關閉',
  mqttSetTemperature: '設定溫度',
  mqttSetMode: '設定模式',
  mqttSetFanSpeed: '設定風速',
  mqttCommandSent: '命令已發送',
  mqttCommandFailed: '命令發送失敗',
  mqttDeviceAdded: '設備已添加',
  mqttDeviceDeleted: '設備已刪除',
  mqttNoDevices: '未找到 MQTT 設備。添加您的第一個設備以開始使用。',
  mqttVendorTuya: 'Tuya（塗鴉）',
  mqttVendorESP: 'ESP',
  mqttVendorMidea: 'Midea（美的）',
  mqttVendorShelly: 'Shelly',
  mqttVendorAqara: 'Aqara（綠米）',
  
  // Admin
  adminPanel: '管理面板',
  adminAnnouncements: '公告',
  adminManagement: '智能倉庫管理',
  adminDashboard: '儀表板',
  adminCommunities: '社區',
  adminCommunitiesDescription: '查看和管理所有社區、建築和住戶',
  adminTotalCommunities: '總社區數',
  adminTotalBuildings: '總建築數',
  adminTotalMembers: '總成員數',
  adminTotalWorkgroups: '總工作組數',
  adminCommunityList: '社區列表',
  adminViewDetails: '查看詳情',
  adminNoCommunities: '暫無社區',
  adminBuildings: '建築',
  adminBuildingsDescription: '查看和管理所有建築和住戶',
  adminFilterByCommunity: '篩選社區',
  noBuildings: '尚無建築',
  addBuilding: '新增建築',
  adminBuildingsCount: '建築',
  adminMembersCount: '成員',
  adminWorkgroupsCount: '工作組',
  adminTotalHouseholds: '總住戶數',
  adminAllCommunities: '所有社區',
  adminHouseholds: '家庭',
  adminItems: '物品',
  adminUsers: '管理員用戶',
  adminRoles: '角色',
  adminAnalytics: '分析',
  adminSettings: '設定',
  adminAdministrator: '管理員',
  adminCopyright: '智能倉庫管理面板。版權所有。',
  adminFilters: '篩選',
  filter: '篩選',
  adminHousehold: '住戶',
  adminAccess: '管理員存取',
  adminSecure: '安全',
  
  // Admin Duplicates
  adminDuplicateManagement: '重複項目管理',
  adminDuplicateDescription: '尋找並解決重複的物品、房間和分類',
  adminBackToAdmin: '返回管理員',
  adminDuplicateItems: '重複物品',
  adminDuplicateRooms: '重複房間',
  adminDuplicateCategories: '重複分類',
  adminNoDuplicateItems: '未找到重複物品',
  adminNoDuplicateRooms: '未找到重複房間',
  adminNoDuplicateCategories: '未找到重複分類',
  adminAllItemsUnique: '所有物品看起來都是唯一的。',
  adminAllRoomsUnique: '所有房間看起來都是唯一的。',
  adminAllCategoriesUnique: '所有分類看起來都是唯一的。',
  adminSimilar: '相似',
  adminMerge: '合併',
  adminMerging: '合併中...',
  adminKeepSeparate: '保持分離',
  adminLevel: '層級',
  adminMergeSuccess: '成功合併{type}',
  adminMergeFailed: '合併{type}失敗',
  adminKeepSeparateSuccess: '已標記{type}為分離',
  adminKeepSeparateFailed: '標記{type}為分離失敗',
  
  // Common
  commonLanguage: '語言',
  commonCurrentLanguage: '目前語言',
  commonSignOut: '登出',
  commonLoading: '載入中...',
  commonSettings: '設定',
  commonCopy: '複製',
  commonNotSet: '未設定',
  
  // Password Change
  changePassword: '變更密碼',
  currentPassword: '目前密碼',
  newPassword: '新密碼',
  confirmPassword: '確認新密碼',
  passwordRequirements: '至少 6 個字元',
  changing: '變更中...',
  editFacility: '編輯設施',
  facilityUpdated: '設施更新成功',
  facilityUpdateError: '更新設施失敗',
  forgotPassword: '忘記密碼',
  forgotPasswordDescription: '輸入您的電子郵件地址，我們將發送重置密碼連結給您。',
  checkYourEmail: '檢查您的電子郵件',
  passwordResetEmailSent: '如果此電子郵件存在帳戶，已發送密碼重置連結。',
  backToSignIn: '返回登入',
  sendResetLink: '發送重置連結',
  invalidResetLink: '無效的重置連結',
  passwordsDoNotMatch: '密碼不相符',
  passwordTooShort: '密碼至少需要 6 個字元',
  resetPassword: '重置密碼',
  enterNewPassword: '請在下方輸入您的新密碼',
  resetting: '重置中...',
  adminAccessRequired: '需要管理員權限',
  adminPleaseSignIn: '請登入以存取管理面板',
  commonSignIn: '登入',
  
  // Dashboard Time Filters
  today: '今天',
  pastWeek: '過去一週',
  all: '全部',
  
  // Household Change Detection
  householdChangesDetected: '檢測到您的家庭有變更。',
  refreshToSeeChanges: '刷新以查看最新變更。',
  
  // Admin Dashboard
  adminLoading: '載入管理面板中...',
  adminError: '載入儀表板錯誤',
  retry: '重試',
  adminWelcome: '歡迎回來',
  adminOverview: '這是您的智能倉庫系統概覽',
  adminTotalUsers: '總用戶數',
  adminTotalItems: '總物品數',
  adminAvgItems: '平均物品/家庭',
  adminQuickActions: '快速操作',
  adminManageHouseholds: '管理家庭',
  adminViewAllItems: '查看所有物品',
  adminViewAnalytics: '查看分析',
  adminSystemSettings: '系統設定',
  adminSystemStatus: '系統狀態',
  adminDatabase: '資料庫',
  adminAPIServices: 'API 服務',
  adminStorage: '儲存',
  adminAuthentication: '身份驗證',
  adminHealthy: '健康',
  adminRecentActivity: '最近活動',
  adminSystemMonitoring: '系統監控啟用',
  adminAllServicesRunning: '所有服務正常運行',
  adminJustNow: '剛剛',
  adminDashboardAccessed: '管理面板已存取',
  adminSecureAuth: '安全身份驗證成功',
  admin2MinutesAgo: '2 分鐘前',
  adminLastUpdated: '最後更新',
  
  // Admin Households
  adminSearchHouseholds: '搜尋家庭、成員或描述...',
  adminCleanupDuplicates: '清理重複項目',
  adminShowDetails: '顯示詳情',
  adminHideDetails: '隱藏詳情',
  
  // Admin Items
  adminViewManageItems: '查看和管理所有家庭的物品',
  adminSearchItems: '按名稱搜尋物品...',
  
  // Admin Users
  adminUserManagement: '管理員用戶管理',
  
  // Admin Analytics
  adminAnalyticsDescription: '系統性能和使用統計',
  adminFilterByLanguage: '按語言篩選',
  adminRolesLanguages: '管理員角色和語言',
  
  // Admin Settings
  adminSettingsDescription: '管理系統配置和監控健康狀態',
  
  // Admin Roles
  adminRoleManagement: '管理員角色管理',
  adminRoleManagementDescription: '管理管理員用戶角色和權限',
  
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
  optionalLabel: '選填',
  move: '移動',
  moving: '移動中...',
  checkout: '結帳',
  checkingOut: '結帳中...',
  history: '歷史',
  editItem: '編輯物品',
  moveItem: '移動物品',
  checkoutItem: '結帳物品',
  itemHistory: '物品歷史',
  
  // Error handling
  errorOccurred: '出了點問題',
  unexpectedError: '發生意外錯誤。請嘗試刷新頁面。',
  refreshPage: '重新整理頁面',
  goHome: '回家',
  
  // Add Item Modal
  selectRoom: '選擇房間',
  autoCreateDefaultCabinet: '自動創建默認櫥櫃',
  checkoutQuantity: '結帳數量',
  reason: '原因',
  moveToRoom: '移動到房間',
  moveConfirmation: '移動到',
  moveQuantity: '移動數量',
  moveFrom: '從哪裡移動',
  adjustQuantity: '調整數量',
  currentQuantity: '目前數量',
  newQuantity: '新數量',
  adjustment: '調整量',
  noQuantityChange: '未指定數量變更',
  invalidQuantity: '數量不能為負數',
  failedToUpdateQuantity: '更新數量失敗',
  updateQuantity: '更新數量',
  updating: '更新中',
  
  // Voice Comments
  voiceComment: '語音備註',
  voiceCommentHint: '錄製語音備註以說明此物品被取出的原因',
  startRecording: '開始錄音',
  stopRecording: '停止錄音',
  pauseRecording: '暫停',
  playRecording: '播放',
  deleteRecording: '刪除錄音',
  rerecord: '重新錄製',
  voiceCommentMaxDuration: '錄音已達最大時長',
  voiceCommentPermissionError: '麥克風權限被拒絕。請允許麥克風存取。',
  voiceCommentConversionError: '處理語音錄音失敗',
  playVoiceComment: '播放語音備註',
  playingVoiceComment: '播放中...',
  voiceTranscript: '轉錄文字',
  transcribingVoice: '轉錄中...',
  voicePromptStart: '我可以為你做什麼？',
  voicePromptEnd: '收到。',
  
  // Category Management
  categoryHierarchy: '分類層次',
  cleanDuplicateCategories: '🗂️ 清理重複分類',
  
  // Missing translations for hardcoded strings
  noItemsFound: '找不到物品',
  startAddingItems: '開始添加一些物品到您的庫存中。',
  forceRefreshPage: '強制刷新頁面',
  refresh: '刷新',
  whereStored: '這個物品存放在哪裡？',
  room: '房間',
  cabinetShelf: '櫥櫃/架子（可選）',
  leaveEmptyDefault: '留空以自動為此房間創建默認櫥櫃',
  addItemButton: '添加物品',
  switchHousehold: '切換家庭',
  cameraNotAvailable: '相機不可用，請上傳台灣發票照片進行識別',
  uploadTaiwanInvoice: '上傳台灣發票照片',
  uploadTaiwanInvoicePhoto: '上傳台灣發票照片',
  unknownItem: '未知物品',
  unableToRecognize: '無法識別物品',
  miscellaneous: '雜項',
  
  // Duplicate Detection
  potentialDuplicate: '可能的重複物品',
  newItem: '新物品',
  similarItemsFound: '找到相似物品',
  similarItems: '相似物品',
  similar: '相似',
  createNewItem: '創建新物品',
  useExistingItem: '使用現有物品',
  location: '位置',
  country: '國家',
  city: '城市',
  district: '區域',
  neighborhood: '社區/鄰里',
  streetAddress: '街道地址',
  apartmentNo: '公寓/建築物號碼',
  telephone: '電話',
  fullAddress: '完整地址',
  selectCountry: '選擇國家',
  selectCity: '選擇城市',
  selectDistrict: '選擇區域',
  enterCommunity: '輸入社區或鄰里',
  enterStreetAddress: '輸入街道地址',
  enterApartmentNo: '例如：123號，A棟',
  enterTelephone: '輸入電話號碼',
  completeAddress: '完整地址',
  setLocationOnMap: '在地圖上設定位置',
  updateLocationOnMap: '在地圖上更新位置',
  selectLocationOnMap: '在地圖上選擇位置',
  saveLocation: '儲存位置',
  unlockCity: '解鎖城市',
  googleMapsNotAvailable: 'Google 地圖不可用',
  enterLocationManually: '請使用上方表單手動輸入位置',
  coordinates: '座標',
  enterFullAddressToAutoParse: '輸入完整地址以自動解析為各個組件',
  createNewHousehold: '創建新家庭',
  enterHouseholdName: '輸入家庭名稱',
  enterDescription: '輸入描述（可選）',
  creating: '創建中...',
  create: '創建',
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
  lowStock: '庫存不足',
  searchTips: '搜尋提示',
  searchByName: '依物品名稱搜尋',
  searchByDescription: '依描述搜尋',
  searchByCategory: '依分類搜尋',
  searchByLocation: '依位置搜尋',
  useChatGPT: '使用 ChatGPT 搜尋',
  
  // Image upload
  itemPhoto: '物品照片',
  addPhoto: '新增照片',
  changePhoto: '更換照片',
  removePhoto: '移除',
  uploading: '上傳中...',
  
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
  sideCabinet: '側櫥櫃',
  
  // Item Management
  description: '描述',
  minimumQuantity: '最低庫存警報',
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
  scanQRCodeToJoin: '掃描 QR 碼加入',
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
  
  // Activity descriptions with parameters
  itemCreatedWithQuantity: '物品「{itemName}」已建立，數量為 {quantity}',
  itemCreated: '物品已建立',
  quantityIncreasedFromTo: '數量從 {from} 增加到 {to}',
  quantityDecreasedFromTo: '數量從 {from} 減少到 {to}',
  itemMovedFromTo: '{itemName} 從 {from} 移動到 {to}',
  itemUpdated: '物品已更新',
  itemDeleted: '物品已刪除',
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
  household: '住戶',
  priority: '優先級',
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
  noRecentActivity: '沒有最近的活動。',
  startByAddingFirstItem: '開始新增您的第一個物品！',
  noActivities: '沒有活動',
  activitiesWillAppearHere: '當您使用系統時，活動將會出現在這裡。',
  
  // Taiwan E-Invoice
  taiwanInvoice: '台灣發票',
  scanTaiwanInvoice: '掃描台灣發票',
  taiwanInvoiceDetected: '已檢測到台灣發票',
  taiwanInvoiceDecoded: '台灣發票解析成功',
  invoiceNumber: '發票號碼',
  invoiceDate: '發票日期',
  sellerName: '賣方名稱',
  totalAmount: '總金額',
  taxAmount: '稅額',
  invoiceItems: '發票項目',
  processingTaiwanInvoice: '正在處理台灣發票...',
  
  // Invitation Codes
  invitationCode: '邀請碼',
  shareInvitationCode: '分享此代碼給其他人讓他們加入您的家庭',
  regenerateInvitationCode: '重新生成',
  copyInvitationCode: '複製到剪貼板',
  invitationCodeInstructions: '• 與家庭成員分享此代碼以邀請他們\n• 新用戶可以在註冊時輸入此代碼加入您的家庭\n• 如果懷疑代碼已洩露，請重新生成',
  joinWithInvitationCode: '使用邀請碼加入',
  joinHousehold: '加入住戶',
  joinType: '加入類型',
  codeScanned: '代碼掃描成功',
  pleaseSignIn: '請登入',
  found: '找到',
  householdFound: '找到住戶',
  codePasted: '已從剪貼簿貼上代碼',
  failedToPaste: '無法從剪貼簿讀取',
  checking: '檢查中...',
  joining: '加入中...',
  check: '檢查',
  join: '加入',
  joinRequestSent: '加入請求已發送，等待審核',
  successfullyJoined: '成功加入！',
  failedToJoin: '加入失敗',
  failedToValidateCode: '驗證邀請碼失敗',
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
  
  // Category Name Translations (for existing categories)
  categoryNameTranslations: {
    'Electronics': '電子產品',
    'Tools': '工具',
    'Clothing': '服裝',
    'Books': '書籍',
    'Miscellaneous': '其他',
    'Kitchen': '廚房',
    'Food': '食物',
    'Beverages': '飲料',
    'Medicine': '藥品',
    'Toiletries': '盥洗用品',
    'Cleaning': '清潔用品',
    'Office': '辦公用品',
    'Sports': '運動用品',
    'Toys': '玩具',
    'Garden': '園藝用品'
  },
  
  // Admin Items Page
  checkDuplicates: '檢查重複項目',
  backToApp: '返回應用程式',
  avgItemsPerHousehold: '平均每戶物品數',
  updatePhoto: '更新照片',
  tryAdjustingSearch: '請嘗試調整搜尋或篩選條件。',
  noItemsCreatedYet: '尚未建立任何物品。',
  min: '最小',
  photo: '照片',
  
  // Building
  buildingOverview: '概覽',
  buildingHouseholds: '住戶',
  buildingMailboxes: '郵箱',
  buildingSettings: '建築設置',
  buildingSummary: '建築摘要',
  buildingBasicInfo: '基本信息',
  buildingPackageLockers: '包裹櫃',
  buildingCommunity: '所屬社區',
  buildingFloorCount: '樓層數',
  buildingUnitCount: '單元數',
  buildingHouseholdCount: '住戶數量',
  buildingCreatedAt: '創建時間',
  buildingInvitationCode: '邀請碼',
  buildingCopyCode: '複製',
  buildingShareCode: '分享此邀請碼給其他人，讓他們可以加入此建築',
  buildingFloorsSetup: '樓層和單元已設置',
  buildingUnitsSetup: '住戶單元',
  buildingSetupComplete: '樓層和單元已設置',
  buildingSetupInProgress: '設置中...',
  buildingSetupFloorsUnits: '設置樓層和單元',
  buildingResetFloorsUnits: '重新設置樓層和單元',
  buildingResetWarning: '重新設置將更新現有樓層和單元（不會刪除已有數據）',
  buildingViewHouseholds: '查看住戶',
  buildingManageMailboxes: '管理郵箱',
  buildingFloor: '樓層',
  buildingUnit: '單元',
  buildingMailbox: '郵箱',
  buildingNoHouseholds: '暫無住戶',
  buildingLoading: '載入中...',
  buildingMembers: '成員',
  buildingItems: '物品',
  buildingRooms: '房間',
  buildingBackToCommunity: '返回社區',
  buildingNotFound: '找不到建築',
  frontDoorCommonArea: '大門與公共區域',
  frontDoorLoading: '正在載入公共區域資料...',
  frontDoorLoadError: '無法載入公共區域資料',
  frontDoorStatsHouseholds: '住戶',
  frontDoorStatsMailboxes: '郵箱',
  frontDoorStatsDoorBells: '門鈴',
  frontDoorStatsLockers: '包裹櫃',
  frontDoorLockerCountLabel: '包裹櫃數量',
  frontDoorLockerCountHint: '建築或社區管理員可隨時調整包裹櫃容量。',
  frontDoorSyncButton: '與住戶同步',
  frontDoorSyncing: '同步中...',
  frontDoorSyncSuccess: '公共區域資料已同步',
  frontDoorSyncError: '同步公共區域資料失敗',
  frontDoorLockerUpdateSuccess: '包裹櫃數量已更新',
  frontDoorLockerUpdateError: '更新包裹櫃數量失敗',
  frontDoorNotifySuccess: '郵件通知已送出',
  frontDoorNotifyError: '無法送出郵件通知',
  frontDoorDoorBellError: '更新門鈴狀態失敗',
  frontDoorRingSuccess: '門鈴已觸發',
  frontDoorRingError: '門鈴觸發失敗',
  frontDoorNotifyButton: '通知住戶',
  frontDoorDoorBells: '門鈴',
  frontDoorEnable: '啟用',
  frontDoorDisable: '停用',
  frontDoorRingButton: '敲門',
  frontDoorPackageLockers: '包裹櫃',
  frontDoorLocker: '櫃號',
  frontDoorNoMailboxes: '尚未建立郵箱',
  frontDoorNoDoorBells: '尚未建立門鈴',
  frontDoorNoLockers: '尚未建立包裹櫃',
  
  // Doorbell
  doorBell: '門鈴',
  doorBellRinging: '響鈴中',
  doorBellConnected: '已連接',
  doorBellEnded: '已結束',
  doorBellNoActiveCalls: '目前沒有來電',
  doorBellAnswer: '接聽',
  doorBellCallAnswered: '已接聽來電',
  doorBellAnswerError: '接聽失敗',
  doorBellEndCall: '結束通話',
  doorBellCallEnded: '通話已結束',
  doorBellUnlockDoor: '開門',
  doorBellDoorUnlocked: '門已開啟',
  doorBellUnlockError: '開門失敗',
  doorBellSendMessage: '發送',
  doorBellMessagePlaceholder: '輸入訊息...',
  doorBellMessageSent: '訊息已發送',
  doorBellMessageError: '發送訊息失敗',
  doorBellCameraOn: '攝影機開啟',
  doorBellCameraOff: '攝影機關閉',
  doorBellMicOn: '麥克風開啟',
  doorBellMicOff: '麥克風關閉',
  doorBellVideoCall: '視訊通話',
  doorBellCameraActive: '攝影機運作中',
  doorBellOnlyInBuilding: '門鈴功能僅適用於建築物內的住戶。',
  doorBellVisitorArrived: '門鈴響了',
  doorBellVisitorAtDoor: '有人在門口',
  
  // Household Actions
  householdReservation: '預定',
  householdMaintenance: '報修',
  householdProperty: '物業',
  householdVisitorTag: '訪客標籤',
  householdInvitationCode: '邀請碼',
  copyHouseholdId: '複製住戶 ID',
  householdActive: '已啟用',
  householdInactive: '未啟用',
  copyError: '複製失敗',
  addHousehold: '新增住戶',
  householdCount: '住戶數量',
  householdUnitLabels: '單元代號',
  householdCreated: '住戶建立成功',
  householdCreatedError: '建立住戶失敗',
  buildingFacilities: '公共設施',
  facilityAddNew: '新增設施',
  facilityNameLabel: '設施名稱',
  facilityTypeLabel: '設施類型',
  facilityFloorLabel: '樓層',
  facilityCapacityLabel: '容納人數',
  facilityCreateButton: '建立設施',
  facilityCreated: '設施建立成功',
  facilityCreateError: '建立設施失敗',
  facilityLoadError: '載入設施失敗',
  facilityLoading: '載入設施資料中...',
  facilityNoFacilities: '尚未設定設施',
  facilityDelete: '移除設施',
  facilityDeleteConfirm: '確定要移除這個設施？',
  facilityDeleted: '設施已移除',
  facilityDeleteError: '移除設施失敗',
  facilityOperatingHours: '營運時段',
  facilityOpenTime: '開放時間',
  facilityCloseTime: '結束時間',
  facilityClosed: '休息',
  facilitySaveHours: '儲存時段',
  facilityHoursSaved: '營運時段已更新',
  facilityHoursError: '更新營運時段失敗',
  day: '星期',
  status: '狀態',
  occupied: '使用中',
  available: '可用',
  
  // Community
  communityBackToList: '返回社區列表',
  communityNotFound: '找不到社區',
  communityOverview: '概覽',
  communityBasicInfo: '基本信息',
  communityStats: '統計信息',
  communityAddress: '地址',
  communityCreatedAt: '創建時間',
  communityInvitationCode: '邀請碼',
  communityShareInvitation: '分享此邀請碼給其他人，讓他們可以加入此社區',
  communityCopyInvitation: '複製',
  communityInvitationCopied: '邀請碼已複製',
  communityWorkingGroups: '工作組',
  communityAddMember: '添加成員',
  communityNoMembers: '暫無成員',
  communityCreateWorkgroup: '創建工作組',
  communityNoWorkgroups: '暫無工作組',
  communityNotSet: '未設置',
  communityMemberList: '成員列表',
  communityWorkgroupList: '工作組列表',
  communityWorkgroupType: '類型',
  communityWorkgroupMembers: '成員',
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
  householdSettings: '家庭设置',
  facilityReservations: '设施预约',
  reserveBuildingFacilities: '预约大楼设施，如健身房、会议室等',
  newReservation: '新增预约',
  noFacilitiesAvailable: '无可用设施',
  householdNotInBuilding: '此住户不属于有设施的大楼',
  floor: '楼层',
  capacity: '容量',
  myReservations: '我的预约',
  purpose: '用途',
  accessCode: '存取码',
  date: '日期',
  startTime: '开始时间',
  endTime: '结束时间',
  numberOfPeople: '预计人数',
  numberOfPeoplePlaceholder: '例如 : 5',
  optionalLabel: '选填',
  purposePlaceholder: '例如：团队会议、运动时间',
  notesPlaceholder: '其他备注...',
  notes: '备注',
  cancelReservation: '取消',
  createReservation: '建立预约',
  submitting: '提交中...',
  reservationCreated: '预约请求已建立，等待审核',
  use24HourFormat: '使用 24 小时制（例如：09:00、21:00）',
  minimum1Hour: '最少 1 小时',
  reservationStartTimeMustBeFuture: '开始时间必须在未来',
  reservationEndTimeMustBeAfterStart: '结束时间必须在开始时间之后',
  reservationMinimumDuration: '预约时间至少需要 1 小时',
  reservationTimeOccupied: '该时段已被其他住户预约。您的预约已自动被拒绝。',
  adminChatHistory: '聊天记录',
  adminChatHistoryDescription: '查看所有住户、前台和访客之间的文字聊天消息',
  adminMaintenance: '报修管理',
  maintenanceTicketManagement: '报修单管理',
  pendingEvaluation: '待评估',
  evaluated: '已评估',
  assigned: '已指派',
  inProgress: '进行中',
  noTickets: '找不到报修单',
  chatWithFrontDesk: '与前台聊天',
  connecting: '连接中...',
  frontDesk: '前台',
  maintenanceTickets: '报修单',
  createTicket: '创建报修单',
  workCompleted: '工作完成',
  closed: '已关闭',
  createFirstTicket: '创建您的第一张报修单',
  supplier: '供应商',
  assignedCrew: '工作团队',
  workLogs: '工作记录',
  requested: '请求时间',
  requestMaintenance: '请求报修',
  ticketTitlePlaceholder: '问题简要描述',
  locationPlaceholder: '问题所在位置？',
  descriptionPlaceholder: '提供问题的详细描述...',
  submit: '提交',
  adminReceiverType: '接收者类型',
  adminStartDate: '开始日期',
  adminEndDate: '结束日期',
  adminApplyFilters: '应用筛选',
  adminNoChatHistory: '找不到聊天记录',
  adminTimestamp: '时间戳',
  adminSender: '发送者',
  adminReceiver: '接收者',
  adminMessage: '消息',
  adminFormat: '格式',
  adminPrevious: '上一页',
  adminNext: '下一页',
  callOccupied: '通话已在使用中。现有通话由其他用户发起。您的通话已自动被拒绝。',
  wifiAutoFilled: '已自动填充当前 WiFi 和保存的密码',
  wifiSSIDAutoFilled: '已自动填充当前 WiFi，请输入密码',
  wifiPasswordAutoFilled: '已自动填充 WiFi 密码',
  
  // Announcements
  announcements: '公告',
  announcement: '公告',
  createAnnouncement: '创建公告',
  sendAnnouncement: '发送公告',
  title: '标题',
  message: '消息',
  propertyServices: '物业服务',
  propertyServicesSubtitle: '信箱 / 包裹 / 门铃与共用空间',
  openReservations: '预约共用设施',
  openBuildingServices: '查看信箱 / 包裹 / 门铃',
  buildingNotLinked: '此家庭尚未连接大楼资料',
  householdMail: '信箱',
  householdPackage: '包裹',
  mailboxNumber: '信箱号码',
  doorBells: '门铃',
  doorBellNumber: '门铃号码',
  packageLocker: '包裹柜',
  packageNumber: '追踪号码',
  packageCheckedOut: '包裹已领取',
  mailCheckedOut: '邮件已领取',
  packageCreated: '包裹已创建',
  assignPackage: '分配包裹',
  packageLockerDescription: '点击空置的包裹柜以分配包裹给住户',
  noPackageLockers: '尚未设置包裹柜',
  setup: '设置',
  setupPackageLockers: '设置包裹柜',
  numberOfLockers: '包裹柜数量',
  packageLockerCountHint: '设置此大楼的包裹柜总数（0-100）',
  packageLockerSetupSuccess: '包裹柜设置成功',
  selectHousehold: '选择住户',
  enterTrackingNumber: '输入追踪号码',
  assign: '分配包裹',
  tracking: '追踪',
  locker: '包裹柜',
  empty: '空置',
  noMailboxAssigned: '此家庭尚未分配信箱',
  noDoorbellsAssigned: '此家庭尚未分配门铃',
  noPackages: '目前没有待领取的包裹',
  hasMail: '有邮件',
  noMail: '无邮件',
  lastMailAt: '最后邮件时间',
  lastRungAt: '最后响铃时间',
  checkedInAt: '登记时间',
  enabled: '启用',
  disabled: '停用',
  // Messaging
  messages: '消息',
  chat: '聊天',
  conversations: '对话',
  noConversations: '尚无对话',
  noMessages: '尚无消息。开始对话吧！',
  typeMessage: '输入消息...',
  selectConversation: '选择对话',
  selectConversationHint: '从列表中选择对话以开始消息',
  messagesDescription: '与住户沟通',
  audioCall: '语音通话',
  videoCall: '视频通话',
  meal: '餐点',
  taxi: '出租车',
  general: '一般',
  mail: '邮件',
  package: '包裹',
  reservation: '预约',
  createWorkingGroup: '创建工作组',
  editWorkingGroup: '编辑工作组',
  pending: '待领取',
  householdNotFound: '找不到家庭资料',
  manageAnnouncements: '管理公告',
  noAnnouncements: '无公告',
  clickToView: '点击查看',
  unread: '未读',
  system: '系统',
  community: '社区',
  building: '大楼',
  from: '来自',
  expires: '到期',
  expirationDate: '到期日期',
  active: '启用',
  inactive: '停用',
  targetAudience: '目标受众',
  allHouseholds: '所有家庭',
  specificCommunity: '特定社区',
  specificBuilding: '特定大楼',
  specificHousehold: '特定住户',
  communityId: '社区 ID',
  buildingId: '大楼 ID',
  householdId: '住户 ID',
  enterCommunityId: '输入社区 ID',
  enterBuildingId: '输入大楼 ID',
  enterHouseholdId: '输入住户 ID',
  characters: '字符',
  sending: '发送中...',
  pleaseFillAllFields: '请填写所有必填字段',
  announcementCreated: '公告已创建',
  source: '来源',
  
  items: '物品',
  allItems: '所有物品',
  duplicates: '重复项目',
  assistant: '语音助手',
  assistantDescription: '向 AIUI 语音助手提问，了解家庭状况或其他信息。',
  assistantPlaceholder: '请输入问题...',
  assistantSend: '发送',
  assistantVoiceHint: '想使用语音吗？在下方录制问题并发送给 AIUI 助手。',
  assistantVoiceReady: '语音消息已就绪，点击发送提交。',
  assistantSendVoice: '发送语音问题',
  assistantProcessing: '思考中...',
  assistantNoResponse: '暂未收到响应，请再试一次。',
  assistantSourceAIUI: '由 AIUI 回答',
  assistantSourceFallback: '由备用 AI 回答',
  assistantEmptyState: '目前还没有对话。试着询问库存、天气或其他问题。',
  homeAssistantPanelTitle: 'Home Assistant 控制',
  homeAssistantPanelDescription: '在 Smart Warehouse 中查看和控制智能家居实体。',
  homeAssistantStatusLoading: '正在连接 Home Assistant…',
  homeAssistantStatusError: '无法连接到 Home Assistant',
  homeAssistantStatusReady: '连接正常',
  homeAssistantRefresh: '刷新',
  homeAssistantUnknown: '未知',
  homeAssistantTurnOn: '开启',
  homeAssistantTurnOff: '关闭',
  homeAssistantToggleOn: '已开启。',
  homeAssistantToggleOff: '已关闭。',
  homeAssistantToggleError: '执行失败。',
  homeAssistantToggleUnsupported: '此设备不支持快速开关。',
  homeAssistantPower: '电源',
  homeAssistantPowerOptionMissing: '无法获取电源选项。',
  homeAssistantPowerUnavailable: '找不到电源控制。',
  homeAssistantLastChanged: '最后更新',
  homeAssistantClimateSection: '湿度控制',
  homeAssistantHumidifierSection: '空气循环',
  homeAssistantCurrentTemperature: '当前温度',
  homeAssistantTargetTemperature: '目标温度',
  homeAssistantCurrentHumidity: '滤网剩余（天）',
  homeAssistantTargetHumidity: '目标湿度',
  homeAssistantModes: '模式',
  homeAssistantTemperatureUpdated: '温度已更新。',
  homeAssistantHumidityUpdated: '湿度已更新。',
  homeAssistantModeUpdated: '模式已更新。',
  homeAssistantModeHigh: '高',
  homeAssistantModeMedium: '中',
  homeAssistantModeLow: '低',
  homeAssistantModeOffLabel: '关闭',
  homeAssistantModeHeat: '制热',
  homeAssistantModeCool: '制冷',
  homeAssistantModeAuto: '自动',
  homeAssistantModeDry: '除湿',
  homeAssistantModeFan: '送风',
  homeAssistantModeOff: '关闭',
  homeAssistantCustomTitle: '自定义服务调用',
  homeAssistantCustomDescription: '输入 domain.service 与 JSON 负载，例如：light.turn_on，{"entity_id": "light.living_room"}',
  homeAssistantCustomEntityRequired: '需要填写实体 ID。',
  homeAssistantCustomFormatError: '请使用 domain.service 格式，例如 light.turn_on',
  homeAssistantCustomSuccess: '服务调用已发送。',
  homeAssistantCustomError: '服务调用失败。',
  homeAssistantSendService: '发送',
  homeAssistantNoEntities: '尚未配置常用实体。可以在 NEXT_PUBLIC_HOME_ASSISTANT_ENTITIES 环境变量中添加 entity_id，或直接使用下面的自定义服务调用。',
  homeAssistantNoOptions: '无可用选项',
  homeAssistantEntities: '实体列表',
  homeAssistantEntitiesFound: '个实体已找到',
  homeAssistantEntitiesShown: '个显示中',
  homeAssistantShowLess: '显示较少',
  homeAssistantShowAll: '显示全部',
  homeAssistantAllDomains: '所有类型',
  mqttDevices: 'MQTT 设备',
  mqttDeviceName: '设备名称',
  mqttDeviceId: '设备 ID',
  mqttVendor: '供应商',
  mqttStatus: '状态',
  mqttOnline: '在线',
  mqttOffline: '离线',
  mqttAddDevice: '添加设备',
  mqttDeleteDevice: '删除设备',
  mqttControlDevice: '控制设备',
  mqttPowerOn: '开启',
  mqttPowerOff: '关闭',
  mqttSetTemperature: '设置温度',
  mqttSetMode: '设置模式',
  mqttSetFanSpeed: '设置风速',
  mqttCommandSent: '命令已发送',
  mqttCommandFailed: '命令发送失败',
  mqttDeviceAdded: '设备已添加',
  mqttDeviceDeleted: '设备已删除',
  mqttNoDevices: '未找到 MQTT 设备。添加您的第一个设备以开始使用。',
  mqttVendorTuya: 'Tuya（涂鸦）',
  mqttVendorESP: 'ESP',
  mqttVendorMidea: 'Midea（美的）',
  mqttVendorShelly: 'Shelly',
  mqttVendorAqara: 'Aqara（绿米）',
  
  // Admin
  adminPanel: '管理面板',
  adminAnnouncements: '公告',
  adminManagement: '智能仓库管理',
  adminDashboard: '仪表板',
  adminCommunities: '社区',
  adminCommunitiesDescription: '查看和管理所有社区、建筑和住户',
  adminTotalCommunities: '总社区数',
  adminTotalBuildings: '总建筑数',
  adminTotalMembers: '总成员数',
  adminTotalWorkgroups: '总工作组数',
  adminCommunityList: '社区列表',
  adminViewDetails: '查看详情',
  adminNoCommunities: '暂无社区',
  adminBuildings: '建筑',
  adminBuildingsDescription: '查看和管理所有建筑和住户',
  adminFilterByCommunity: '筛选社区',
  noBuildings: '尚无建筑',
  addBuilding: '新增建筑',
  adminBuildingsCount: '建筑',
  adminMembersCount: '成员',
  adminWorkgroupsCount: '工作组',
  adminTotalHouseholds: '总住户数',
  adminAllCommunities: '所有社区',
  adminHouseholds: '家庭',
  adminItems: '物品',
  adminUsers: '管理员用户',
  adminRoles: '角色',
  adminAnalytics: '分析',
  adminSettings: '设置',
  adminAdministrator: '管理员',
  adminCopyright: '智能仓库管理面板。版权所有。',
  adminFilters: '筛选',
  filter: '筛选',
  adminHousehold: '住户',
  adminAccess: '管理员访问',
  adminSecure: '安全',
  
  // Admin Duplicates
  adminDuplicateManagement: '重复项目管理',
  adminDuplicateDescription: '查找并解决重复的物品、房间和分类',
  adminBackToAdmin: '返回管理员',
  adminDuplicateItems: '重复物品',
  adminDuplicateRooms: '重复房间',
  adminDuplicateCategories: '重复分类',
  adminNoDuplicateItems: '未找到重复物品',
  adminNoDuplicateRooms: '未找到重复房间',
  adminNoDuplicateCategories: '未找到重复分类',
  adminAllItemsUnique: '所有物品看起来都是唯一的。',
  adminAllRoomsUnique: '所有房间看起来都是唯一的。',
  adminAllCategoriesUnique: '所有分类看起来都是唯一的。',
  adminSimilar: '相似',
  adminMerge: '合并',
  adminMerging: '合并中...',
  adminKeepSeparate: '保持分离',
  adminLevel: '层级',
  adminMergeSuccess: '成功合并{type}',
  adminMergeFailed: '合并{type}失败',
  adminKeepSeparateSuccess: '已标记{type}为分离',
  adminKeepSeparateFailed: '标记{type}为分离失败',
  
  // Common
  commonLanguage: '语言',
  commonCurrentLanguage: '当前语言',
  commonSignOut: '登出',
  commonLoading: '加载中...',
  commonSettings: '设置',
  commonCopy: '复制',
  commonNotSet: '未设置',
  
  // Password Change
  changePassword: '更改密码',
  currentPassword: '当前密码',
  newPassword: '新密码',
  confirmPassword: '确认新密码',
  editFacility: '编辑设施',
  facilityUpdated: '设施更新成功',
  facilityUpdateError: '更新设施失败',
  forgotPassword: '忘记密码',
  forgotPasswordDescription: '输入您的电子邮件地址，我们将发送重置密码链接给您。',
  checkYourEmail: '检查您的电子邮件',
  passwordResetEmailSent: '如果此电子邮件存在账户，已发送密码重置链接。',
  backToSignIn: '返回登录',
  sendResetLink: '发送重置链接',
  invalidResetLink: '无效的重置链接',
  passwordsDoNotMatch: '密码不匹配',
  passwordTooShort: '密码至少需要 6 个字符',
  resetPassword: '重置密码',
  enterNewPassword: '请在下方输入您的新密码',
  resetting: '重置中...',
  adminAccessRequired: '需要管理员权限',
  adminPleaseSignIn: '请登录以访问管理面板',
  commonSignIn: '登录',
  passwordRequirements: '至少 6 个字符',
  changing: '更改中...',
  
  // Dashboard Time Filters
  today: '今天',
  pastWeek: '过去一周',
  all: '全部',
  
  // Household Change Detection
  householdChangesDetected: '检测到您的家庭有变更。',
  refreshToSeeChanges: '刷新以查看最新变更。',
  
  // Admin Dashboard
  adminLoading: '加载管理面板中...',
  adminError: '加载仪表板错误',
  retry: '重试',
  adminWelcome: '欢迎回来',
  adminOverview: '这是您的智能仓库系统概览',
  adminTotalUsers: '总用户数',
  adminTotalItems: '总物品数',
  adminAvgItems: '平均物品/家庭',
  adminQuickActions: '快速操作',
  adminManageHouseholds: '管理家庭',
  adminViewAllItems: '查看所有物品',
  adminViewAnalytics: '查看分析',
  adminSystemSettings: '系统设置',
  adminSystemStatus: '系统状态',
  adminDatabase: '数据库',
  adminAPIServices: 'API 服务',
  adminStorage: '存储',
  adminAuthentication: '身份验证',
  adminHealthy: '健康',
  adminRecentActivity: '最近活动',
  adminSystemMonitoring: '系统监控启用',
  adminAllServicesRunning: '所有服务正常运行',
  adminJustNow: '刚刚',
  adminDashboardAccessed: '管理面板已访问',
  adminSecureAuth: '安全身份验证成功',
  admin2MinutesAgo: '2 分钟前',
  adminLastUpdated: '最后更新',
  
  // Admin Households
  adminSearchHouseholds: '搜索家庭、成员或描述...',
  adminCleanupDuplicates: '清理重复项目',
  adminShowDetails: '显示详情',
  adminHideDetails: '隐藏详情',
  
  // Admin Items
  adminViewManageItems: '查看和管理所有家庭的物品',
  adminSearchItems: '按名称搜索物品...',
  
  // Admin Users
  adminUserManagement: '管理员用户管理',
  
  // Admin Analytics
  adminAnalyticsDescription: '系统性能和使用统计',
  adminFilterByLanguage: '按语言筛选',
  adminRolesLanguages: '管理员角色和语言',
  
  // Admin Settings
  adminSettingsDescription: '管理系统配置和监控健康状态',
  
  // Admin Roles
  adminRoleManagement: '管理员角色管理',
  adminRoleManagementDescription: '管理管理员用户角色和权限',
  
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
  
  // Error handling
  errorOccurred: '出了点问题',
  unexpectedError: '发生意外错误。请尝试刷新页面。',
  refreshPage: '刷新页面',
  goHome: '回家',
  
  // Add Item Modal
  selectRoom: '选择房间',
  autoCreateDefaultCabinet: '自动创建默认橱柜',
  checkoutQuantity: '结账数量',
  reason: '原因',
  moveToRoom: '移动到房间',
  moveConfirmation: '移动到',
  moveQuantity: '移动数量',
  moveFrom: '从哪里移动',
  adjustQuantity: '调整数量',
  currentQuantity: '当前数量',
  newQuantity: '新数量',
  adjustment: '调整量',
  noQuantityChange: '未指定数量变更',
  invalidQuantity: '数量不能为负数',
  failedToUpdateQuantity: '更新数量失败',
  updateQuantity: '更新数量',
  updating: '更新中',
  
  // Voice Comments
  voiceComment: '语音备注',
  voiceCommentHint: '录制语音备注以说明此物品被取出的原因',
  startRecording: '开始录音',
  stopRecording: '停止录音',
  pauseRecording: '暂停',
  playRecording: '播放',
  deleteRecording: '删除录音',
  rerecord: '重新录制',
  voiceCommentMaxDuration: '录音已达最大时长',
  voiceCommentPermissionError: '麦克风权限被拒绝。请允许麦克风访问。',
  voiceCommentConversionError: '处理语音录音失败',
  playVoiceComment: '播放语音备注',
  playingVoiceComment: '播放中...',
  voiceTranscript: '转录文字',
  transcribingVoice: '转录中...',
  voicePromptStart: '我可以帮你做什么？',
  voicePromptEnd: '收到。',
  
  // Category Management
  categoryHierarchy: '分类层次',
  cleanDuplicateCategories: '🗂️ 清理重复分类',
  
  // Missing translations for hardcoded strings
  noItemsFound: '找不到物品',
  startAddingItems: '开始添加一些物品到您的库存中。',
  forceRefreshPage: '强制刷新页面',
  refresh: '刷新',
  whereStored: '这个物品存放在哪里？',
  room: '房间',
  cabinetShelf: '橱柜/架子（可选）',
  leaveEmptyDefault: '留空以自动为此房间创建默认橱柜',
  addItemButton: '添加物品',
  switchHousehold: '切换家庭',
  cameraNotAvailable: '相机不可用，请上传台湾发票照片进行识别',
  uploadTaiwanInvoice: '上传台湾发票照片',
  uploadTaiwanInvoicePhoto: '上传台湾发票照片',
  unknownItem: '未知物品',
  unableToRecognize: '无法识别物品',
  miscellaneous: '杂项',
  
  // Duplicate Detection
  potentialDuplicate: '可能的重复物品',
  newItem: '新物品',
  similarItemsFound: '找到相似物品',
  similarItems: '相似物品',
  similar: '相似',
  createNewItem: '创建新物品',
  useExistingItem: '使用现有物品',
  location: '位置',
  country: '国家',
  city: '城市',
  district: '区域',
  neighborhood: '社区/邻里',
  streetAddress: '街道地址',
  apartmentNo: '公寓/建筑物号码',
  telephone: '电话',
  fullAddress: '完整地址',
  selectCountry: '选择国家',
  selectCity: '选择城市',
  selectDistrict: '选择区域',
  enterCommunity: '输入社区或邻里',
  enterStreetAddress: '输入街道地址',
  enterApartmentNo: '例如：123号，A栋',
  enterTelephone: '输入电话号码',
  completeAddress: '完整地址',
  setLocationOnMap: '在地图上设定位置',
  updateLocationOnMap: '在地图上更新位置',
  selectLocationOnMap: '在地图上选择位置',
  saveLocation: '保存位置',
  unlockCity: '解锁城市',
  googleMapsNotAvailable: 'Google 地图不可用',
  enterLocationManually: '请使用上方表单手动输入位置',
  coordinates: '坐标',
  enterFullAddressToAutoParse: '输入完整地址以自动解析为各个组件',
  createNewHousehold: '创建新家庭',
  enterHouseholdName: '输入家庭名称',
  enterDescription: '输入描述（可选）',
  creating: '创建中...',
  create: '创建',
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
  lowStock: '库存不足',
  searchTips: '搜索提示',
  searchByName: '按物品名称搜索',
  searchByDescription: '按描述搜索',
  searchByCategory: '按分类搜索',
  searchByLocation: '按位置搜索',
  useChatGPT: '使用 ChatGPT 搜索',
  
  // Image upload
  itemPhoto: '物品照片',
  addPhoto: '添加照片',
  changePhoto: '更换照片',
  removePhoto: '移除',
  uploading: '上传中...',
  
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
  sideCabinet: '侧橱柜',
  
  // Item Management
  description: '描述',
  minimumQuantity: '最低库存警报',
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
  scanQRCodeToJoin: '扫描 QR 码加入',
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
  itemCreatedWithQuantity: '物品「{itemName}」已创建，数量为 {quantity}',
  itemCreated: '物品已创建',
  quantityIncreasedFromTo: '数量从 {from} 增加到 {to}',
  quantityDecreasedFromTo: '数量从 {from} 减少到 {to}',
  itemMovedFromTo: '{itemName} 从 {from} 移动到 {to}',
  itemUpdated: '物品已更新',
  itemDeleted: '物品已删除',
  categoryCreatedDescription: '分类已创建',
  categoryDeletedDescription: '分类已删除',
  roomCreatedDescription: '房间已创建',
  roomDeletedDescription: '房间已删除',
  
  // AI Recognition
  aiConfidence: 'AI 信心度',
  itemName: '物品名称',
  quantity: '数量',
  category: '分类',
  household: '住户',
  priority: '优先级',
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
  noRecentActivity: '没有最近的活动。',
  startByAddingFirstItem: '开始添加您的第一个物品！',
  noActivities: '没有活动',
  activitiesWillAppearHere: '当您使用系统时，活动将会出现在这里。',
  
  // Taiwan E-Invoice
  taiwanInvoice: '台湾发票',
  scanTaiwanInvoice: '扫描台湾发票',
  taiwanInvoiceDetected: '已检测到台湾发票',
  taiwanInvoiceDecoded: '台湾发票解析成功',
  invoiceNumber: '发票号码',
  invoiceDate: '发票日期',
  sellerName: '卖方名称',
  totalAmount: '总金额',
  taxAmount: '税额',
  invoiceItems: '发票项目',
  processingTaiwanInvoice: '正在处理台湾发票...',
  
  // Invitation Codes
  invitationCode: '邀请码',
  shareInvitationCode: '分享此代码给其他人让他们加入您的家庭',
  regenerateInvitationCode: '重新生成',
  copyInvitationCode: '复制到剪贴板',
  invitationCodeInstructions: '• 与家庭成员分享此代码以邀请他们\n• 新用户可以在注册时输入此代码加入您的家庭\n• 如果怀疑代码已泄露，请重新生成',
  joinWithInvitationCode: '使用邀请码加入',
  joinHousehold: '加入住户',
  joinType: '加入类型',
  codeScanned: '代码扫描成功',
  pleaseSignIn: '请登录',
  found: '找到',
  householdFound: '找到住户',
  codePasted: '已从剪贴板粘贴代码',
  failedToPaste: '无法从剪贴板读取',
  checking: '检查中...',
  joining: '加入中...',
  check: '检查',
  join: '加入',
  joinRequestSent: '加入请求已发送，等待审核',
  successfullyJoined: '成功加入！',
  failedToJoin: '加入失败',
  failedToValidateCode: '验证邀请码失败',
  enterInvitationCode: '输入邀请码（可选）',
  invalidInvitationCode: '无效的邀请码',
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
  
  // Category Name Translations (for existing categories)
  categoryNameTranslations: {
    'Electronics': '电子产品',
    'Tools': '工具',
    'Clothing': '服装',
    'Books': '书籍',
    'Miscellaneous': '其他',
    'Kitchen': '厨房',
    'Food': '食物',
    'Beverages': '饮料',
    'Medicine': '药品',
    'Toiletries': '盥洗用品',
    'Cleaning': '清洁用品',
    'Office': '办公用品',
    'Sports': '运动用品',
    'Toys': '玩具',
    'Garden': '园艺用品'
  },
  
  // Admin Items Page
  checkDuplicates: '检查重复项目',
  backToApp: '返回应用',
  avgItemsPerHousehold: '平均每户物品数',
  updatePhoto: '更新照片',
  tryAdjustingSearch: '请尝试调整搜索或筛选条件。',
  noItemsCreatedYet: '尚未创建任何物品。',
  min: '最小',
  photo: '照片',
  
  // Building
  buildingOverview: '概览',
  buildingHouseholds: '住户',
  buildingMailboxes: '邮箱',
  buildingSettings: '建筑设置',
  buildingSummary: '建筑摘要',
  buildingBasicInfo: '基本信息',
  buildingPackageLockers: '包裹柜',
  buildingCommunity: '所属社区',
  buildingFloorCount: '楼层数',
  buildingUnitCount: '单元数',
  buildingHouseholdCount: '住户数量',
  buildingCreatedAt: '创建时间',
  buildingInvitationCode: '邀请码',
  buildingCopyCode: '复制',
  buildingShareCode: '分享此邀请码给其他人，让他们可以加入此建筑',
  buildingFloorsSetup: '楼层和单元已设置',
  buildingUnitsSetup: '住户单元',
  buildingSetupComplete: '楼层和单元已设置',
  buildingSetupInProgress: '设置中...',
  buildingSetupFloorsUnits: '设置楼层和单元',
  buildingResetFloorsUnits: '重新设置楼层和单元',
  buildingResetWarning: '重新设置将更新现有楼层和单元（不会删除已有数据）',
  buildingViewHouseholds: '查看住户',
  buildingManageMailboxes: '管理邮箱',
  buildingFloor: '楼层',
  buildingUnit: '单元',
  buildingMailbox: '邮箱',
  buildingNoHouseholds: '暂无住户',
  buildingLoading: '加载中...',
  buildingMembers: '成员',
  buildingItems: '物品',
  buildingRooms: '房间',
  buildingBackToCommunity: '返回社区',
  buildingNotFound: '找不到建筑',
  frontDoorCommonArea: '大门与公共区域',
  frontDoorLoading: '正在载入公共区域资料...',
  frontDoorLoadError: '无法载入公共区域资料',
  frontDoorStatsHouseholds: '住户',
  frontDoorStatsMailboxes: '邮箱',
  frontDoorStatsDoorBells: '门铃',
  frontDoorStatsLockers: '包裹柜',
  frontDoorLockerCountLabel: '包裹柜数量',
  frontDoorLockerCountHint: '建筑或社区管理员可随时调整包裹柜容量。',
  frontDoorSyncButton: '与住户同步',
  frontDoorSyncing: '同步中...',
  frontDoorSyncSuccess: '公共区域数据已同步',
  frontDoorSyncError: '同步公共区域数据失败',
  frontDoorLockerUpdateSuccess: '包裹柜数量已更新',
  frontDoorLockerUpdateError: '更新包裹柜数量失败',
  frontDoorNotifySuccess: '邮件通知已发送',
  frontDoorNotifyError: '无法发送邮件通知',
  frontDoorDoorBellError: '更新门铃状态失败',
  frontDoorRingSuccess: '门铃已触发',
  frontDoorRingError: '门铃触发失败',
  frontDoorNotifyButton: '通知住户',
  frontDoorDoorBells: '门铃',
  frontDoorEnable: '启用',
  frontDoorDisable: '停用',
  frontDoorRingButton: '敲门',
  frontDoorPackageLockers: '包裹柜',
  frontDoorLocker: '柜号',
  frontDoorNoMailboxes: '尚未建立邮箱',
  frontDoorNoDoorBells: '尚未建立门铃',
  frontDoorNoLockers: '尚未建立包裹柜',
  
  // Doorbell
  doorBell: '门铃',
  doorBellRinging: '响铃中',
  doorBellConnected: '已连接',
  doorBellEnded: '已结束',
  doorBellNoActiveCalls: '目前没有来电',
  doorBellAnswer: '接听',
  doorBellCallAnswered: '已接听来电',
  doorBellAnswerError: '接听失败',
  doorBellEndCall: '结束通话',
  doorBellCallEnded: '通话已结束',
  doorBellUnlockDoor: '开门',
  doorBellDoorUnlocked: '门已开启',
  doorBellUnlockError: '开门失败',
  doorBellSendMessage: '发送',
  doorBellMessagePlaceholder: '输入消息...',
  doorBellMessageSent: '消息已发送',
  doorBellMessageError: '发送消息失败',
  doorBellCameraOn: '摄像头开启',
  doorBellCameraOff: '摄像头关闭',
  doorBellMicOn: '麦克风开启',
  doorBellMicOff: '麦克风关闭',
  doorBellVideoCall: '视频通话',
  doorBellCameraActive: '摄像头运作中',
  doorBellOnlyInBuilding: '门铃功能仅适用于建筑物内的住户。',
  doorBellVisitorArrived: '门铃响了',
  doorBellVisitorAtDoor: '有人在门口',
  
  // Household Actions
  householdReservation: '预定',
  householdMaintenance: '报修',
  householdProperty: '物业',
  householdVisitorTag: '访客标签',
  householdInvitationCode: '邀请码',
  copyHouseholdId: '复制住户 ID',
  householdActive: '已启用',
  householdInactive: '未启用',
  copyError: '复制失败',
  addHousehold: '新增住户',
  householdCount: '住户数量',
  householdUnitLabels: '单元代号',
  householdCreated: '住户建立成功',
  householdCreatedError: '建立住户失败',
  buildingFacilities: '公共设施',
  facilityAddNew: '新增设施',
  facilityNameLabel: '设施名称',
  facilityTypeLabel: '设施类型',
  facilityFloorLabel: '楼层',
  facilityCapacityLabel: '容量',
  facilityCreateButton: '建立设施',
  facilityCreated: '设施建立成功',
  facilityCreateError: '建立设施失败',
  facilityLoadError: '载入设施失败',
  facilityLoading: '载入设施中...',
  facilityNoFacilities: '尚未设置设施',
  facilityDelete: '移除设施',
  facilityDeleteConfirm: '确定移除此设施？',
  facilityDeleted: '设施已移除',
  facilityDeleteError: '移除设施失败',
  facilityOperatingHours: '营运时段',
  facilityOpenTime: '开门',
  facilityCloseTime: '关闭',
  facilityClosed: '休息',
  facilitySaveHours: '保存时段',
  facilityHoursSaved: '营运时段已更新',
  facilityHoursError: '更新营运时段失败',
  day: '星期',
  status: '状态',
  occupied: '使用中',
  available: '可用',
  
  // Community
  communityBackToList: '返回社区列表',
  communityNotFound: '找不到社区',
  communityOverview: '概览',
  communityBasicInfo: '基本信息',
  communityStats: '统计信息',
  communityAddress: '地址',
  communityCreatedAt: '创建时间',
  communityInvitationCode: '邀请码',
  communityShareInvitation: '分享此邀请码给其他人，让他们可以加入此社区',
  communityCopyInvitation: '复制',
  communityInvitationCopied: '邀请码已复制',
  communityWorkingGroups: '工作组',
  communityAddMember: '添加成员',
  communityNoMembers: '暂无成员',
  communityCreateWorkgroup: '创建工作组',
  communityNoWorkgroups: '暂无工作组',
  communityNotSet: '未设置',
  communityMemberList: '成员列表',
  communityWorkgroupList: '工作组列表',
  communityWorkgroupType: '类型',
  communityWorkgroupMembers: '成员',
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
  householdSettings: '家庭設定',
  facilityReservations: '施設予約',
  reserveBuildingFacilities: 'ジム、会議室などの建物施設を予約',
  newReservation: '新しい予約',
  noFacilitiesAvailable: '利用可能な施設がありません',
  householdNotInBuilding: 'この世帯は施設のある建物に属していません',
  floor: '階',
  capacity: '収容人数',
  myReservations: '私の予約',
  purpose: '目的',
  accessCode: 'アクセスコード',
  date: '日付',
  startTime: '開始時間',
  endTime: '終了時間',
  numberOfPeople: '予定人数',
  numberOfPeoplePlaceholder: '例：5',
  optional: 'オプション',
  optionalLabel: 'オプション',
  purposePlaceholder: '例：チームミーティング、ワークアウトセッション',
  notesPlaceholder: '追加のメモ...',
  notes: 'メモ',
  cancelReservation: 'キャンセル',
  createReservation: '予約を作成',
  submitting: '送信中...',
  reservationCreated: '予約リクエストが作成されました。建物管理者の承認を待っています。',
  use24HourFormat: '24時間形式を使用（例：09:00、21:00）',
  minimum1Hour: '最低1時間',
  reservationStartTimeMustBeFuture: '開始時間は未来である必要があります',
  reservationEndTimeMustBeAfterStart: '終了時間は開始時間より後である必要があります',
  reservationMinimumDuration: '予約は最低1時間必要です',
  reservationTimeOccupied: 'この時間帯は既に他の世帯によって予約されています。ご予約は自動的に拒否されました。',
  adminChatHistory: 'チャット履歴',
  adminChatHistoryDescription: '世帯、フロントデスク、訪問者間のすべてのテキストチャットメッセージを表示',
  adminMaintenance: 'メンテナンスチケット',
  maintenanceTicketManagement: 'メンテナンスチケット管理',
  pendingEvaluation: '評価待ち',
  evaluated: '評価済み',
  assigned: '割り当て済み',
  inProgress: '進行中',
  noTickets: 'メンテナンスチケットが見つかりません',
  chatWithFrontDesk: 'フロントデスクとチャット',
  connecting: '接続中...',
  frontDesk: 'フロントデスク',
  maintenanceTickets: 'メンテナンスチケット',
  createTicket: 'チケットを作成',
  workCompleted: '作業完了',
  closed: '閉鎖',
  createFirstTicket: '最初のチケットを作成',
  supplier: 'サプライヤー',
  assignedCrew: 'クルー',
  workLogs: '作業ログ',
  requested: 'リクエスト',
  requestMaintenance: 'メンテナンスをリクエスト',
  ticketTitlePlaceholder: '問題の簡単な説明',
  locationPlaceholder: '問題の場所はどこですか？',
  descriptionPlaceholder: '問題の詳細な説明を提供してください...',
  submit: '送信',
  adminReceiverType: '受信者タイプ',
  adminStartDate: '開始日',
  adminEndDate: '終了日',
  adminApplyFilters: 'フィルターを適用',
  adminNoChatHistory: 'チャット履歴が見つかりません',
  adminTimestamp: 'タイムスタンプ',
  adminSender: '送信者',
  adminReceiver: '受信者',
  adminMessage: 'メッセージ',
  adminFormat: 'フォーマット',
  adminPrevious: '前へ',
  adminNext: '次へ',
  callOccupied: '通話は既にアクティブです。既存の通話は別のユーザーによって開始されました。ご通話は自動的に拒否されました。',
  wifiAutoFilled: '現在のWiFiと保存されたパスワードを自動入力しました',
  wifiSSIDAutoFilled: '現在のWiFiを自動入力しました。パスワードを入力してください',
  wifiPasswordAutoFilled: 'WiFiパスワードを自動入力しました',
  
  // Announcements
  announcements: 'お知らせ',
  announcement: 'お知らせ',
  createAnnouncement: 'お知らせを作成',
  sendAnnouncement: 'お知らせを送信',
  title: 'タイトル',
  propertyServices: '物件サービス',
  propertyServicesSubtitle: '郵便 / 荷物 / ドアベルと共用スペース',
  packageCheckedOut: '荷物を受け取りました',
  mailCheckedOut: '郵便を受け取りました',
  packageCreated: '荷物が作成されました',
  assignPackage: '荷物を割り当て',
  packageLockerDescription: '空いているロッカーをクリックして、世帯に荷物を割り当てます',
  noPackageLockers: '荷物ロッカーが設定されていません',
  setup: '設定',
  setupPackageLockers: 'パッケージロッカーの設定',
  numberOfLockers: 'パッケージロッカーの数',
  packageLockerCountHint: 'この建物のパッケージロッカーの総数を設定します（0-100）',
  packageLockerSetupSuccess: 'パッケージロッカーの設定が完了しました',
  selectHousehold: '世帯を選択',
  enterTrackingNumber: '追跡番号を入力',
  assign: '荷物を割り当て',
  tracking: '追跡',
  locker: 'ロッカー',
  empty: '空',
  // Messaging
  messages: 'メッセージ',
  chat: 'チャット',
  conversations: '会話',
  noConversations: '会話はまだありません',
  noMessages: 'メッセージはまだありません。会話を始めましょう！',
  typeMessage: 'メッセージを入力...',
  selectConversation: '会話を選択',
  selectConversationHint: 'リストから会話を選択してメッセージを開始',
  messagesDescription: '世帯とコミュニケーション',
  audioCall: '音声通話',
  videoCall: 'ビデオ通話',
  meal: '食事',
  taxi: 'タクシー',
  general: '一般',
  mail: 'メール',
  package: 'パッケージ',
  reservation: '予約',
  createWorkingGroup: '作業グループを作成',
  editWorkingGroup: '作業グループを編集',
  openReservations: '共用施設を予約',
  openBuildingServices: '郵便 / 荷物 / ドアベルを表示',
  buildingNotLinked: 'この世帯はまだ建物にリンクされていません',
  householdMail: '郵便',
  householdPackage: '荷物',
  mailboxNumber: '郵便受け番号',
  doorBells: 'ドアベル',
  doorBellNumber: 'ドアベル番号',
  packageLocker: '荷物ロッカー',
  packageNumber: '追跡番号',
  noMailboxAssigned: 'この世帯には郵便受けが割り当てられていません',
  noDoorbellsAssigned: 'この世帯にはドアベルが割り当てられていません',
  noPackages: '受け取り待ちの荷物はありません',
  hasMail: '郵便あり',
  noMail: '郵便なし',
  lastMailAt: '最後の郵便',
  lastRungAt: '最後の鳴動',
  checkedInAt: 'チェックイン時間',
  enabled: '有効',
  disabled: '無効',
  pending: '保留中',
  message: 'メッセージ',
  manageAnnouncements: 'お知らせを管理',
  noAnnouncements: 'お知らせなし',
  clickToView: 'クリックして表示',
  unread: '未読',
  system: 'システム',
  community: 'コミュニティ',
  building: '建物',
  from: '送信元',
  expires: '有効期限',
  expirationDate: '有効期限',
  active: '有効',
  inactive: '無効',
  targetAudience: '対象',
  allHouseholds: 'すべての世帯',
  specificCommunity: '特定のコミュニティ',
  specificBuilding: '特定の建物',
  specificHousehold: '特定の世帯',
  communityId: 'コミュニティ ID',
  buildingId: '建物 ID',
  householdId: '世帯 ID',
  enterCommunityId: 'コミュニティ ID を入力',
  enterBuildingId: '建物 ID を入力',
  enterHouseholdId: '世帯 ID を入力',
  characters: '文字',
  sending: '送信中...',
  pleaseFillAllFields: 'すべての必須フィールドを入力してください',
  announcementCreated: 'お知らせが作成されました',
  source: '送信元',
  
  items: 'アイテム',
  allItems: 'すべてのアイテム',
  duplicates: '重複アイテム',
  assistant: 'ボイスアシスタント',
  assistantDescription: 'AIUI ボイスエージェントに質問して、家庭状況やさまざまな情報を取得しましょう。',
  assistantPlaceholder: '質問を入力してください...',
  assistantSend: '送信',
  assistantVoiceHint: '音声で質問しますか？下で録音して AIUI エージェントに送信できます。',
  assistantVoiceReady: '音声メッセージの準備ができました。送信を押してください。',
  assistantSendVoice: '音声質問を送信',
  assistantProcessing: '処理中...',
  assistantNoResponse: '応答がありませんでした。もう一度お試しください。',
  assistantSourceAIUI: 'AIUI による回答',
  assistantSourceFallback: '代替 AI による回答',
  assistantEmptyState: 'まだ会話がありません。在庫数や天気など、気になることを聞いてみましょう。',
  homeAssistantPanelTitle: 'Home Assistant 制御',
  homeAssistantPanelDescription: 'Smart Warehouse からスマートホームのエンティティを表示・操作します。',
  homeAssistantStatusLoading: 'Home Assistant に接続中…',
  homeAssistantStatusError: 'Home Assistant に接続できません',
  homeAssistantStatusReady: '接続中',
  homeAssistantRefresh: '更新',
  homeAssistantUnknown: '不明',
  homeAssistantTurnOn: 'オン',
  homeAssistantTurnOff: 'オフ',
  homeAssistantToggleOn: 'オンにしました。',
  homeAssistantToggleOff: 'オフにしました。',
  homeAssistantToggleError: '操作に失敗しました。',
  homeAssistantToggleUnsupported: 'このデバイスはここからオン/オフできません。',
  homeAssistantPower: '電源',
  homeAssistantPowerOptionMissing: '電源オプションを取得できません。',
  homeAssistantPowerUnavailable: '電源制御が見つかりません。',
  homeAssistantLastChanged: '最終更新',
  homeAssistantClimateSection: '湿度コントロール',
  homeAssistantHumidifierSection: '空気循環',
  homeAssistantCurrentTemperature: '現在の温度',
  homeAssistantTargetTemperature: '目標温度',
  homeAssistantCurrentHumidity: 'フィルター残り（日）',
  homeAssistantTargetHumidity: '目標湿度',
  homeAssistantModes: 'モード',
  homeAssistantTemperatureUpdated: '温度を更新しました。',
  homeAssistantHumidityUpdated: '湿度を更新しました。',
  homeAssistantModeUpdated: 'モードを更新しました。',
  homeAssistantModeHigh: '高',
  homeAssistantModeMedium: '中',
  homeAssistantModeLow: '低',
  homeAssistantModeOffLabel: 'オフ',
  homeAssistantModeHeat: '暖房',
  homeAssistantModeCool: '冷房',
  homeAssistantModeAuto: '自動',
  homeAssistantModeDry: '除湿',
  homeAssistantModeFan: '送風',
  homeAssistantModeOff: 'オフ',
  homeAssistantCustomTitle: 'カスタムサービス呼び出し',
  homeAssistantCustomDescription: 'domain.service と JSON ペイロードを入力します。例: light.turn_on, {"entity_id": "light.living_room"}',
  homeAssistantCustomEntityRequired: 'エンティティ ID が必要です。',
  homeAssistantCustomFormatError: 'domain.service 形式（例: light.turn_on）で入力してください',
  homeAssistantCustomSuccess: 'サービス呼び出しを送信しました。',
  homeAssistantCustomError: 'サービス呼び出しに失敗しました。',
  homeAssistantSendService: '送信',
  homeAssistantNoEntities: '表示するエンティティが設定されていません。NEXT_PUBLIC_HOME_ASSISTANT_ENTITIES に entity_id を設定するか、下のカスタムサービス呼び出しを使用してください。',
  homeAssistantNoOptions: '利用可能なオプションがありません',
  homeAssistantEntities: 'エンティティ一覧',
  homeAssistantEntitiesFound: '個のエンティティが見つかりました',
  homeAssistantEntitiesShown: '個表示中',
  homeAssistantShowLess: '少なく表示',
  homeAssistantShowAll: 'すべて表示',
  homeAssistantAllDomains: 'すべてのタイプ',
  mqttDevices: 'MQTT デバイス',
  mqttDeviceName: 'デバイス名',
  mqttDeviceId: 'デバイス ID',
  mqttVendor: 'ベンダー',
  mqttStatus: 'ステータス',
  mqttOnline: 'オンライン',
  mqttOffline: 'オフライン',
  mqttAddDevice: 'デバイスを追加',
  mqttDeleteDevice: 'デバイスを削除',
  mqttControlDevice: 'デバイスを制御',
  mqttPowerOn: '電源オン',
  mqttPowerOff: '電源オフ',
  mqttSetTemperature: '温度を設定',
  mqttSetMode: 'モードを設定',
  mqttSetFanSpeed: 'ファン速度を設定',
  mqttCommandSent: 'コマンドが正常に送信されました',
  mqttCommandFailed: 'コマンドの送信に失敗しました',
  mqttDeviceAdded: 'デバイスが正常に追加されました',
  mqttDeviceDeleted: 'デバイスが正常に削除されました',
  mqttNoDevices: 'MQTT デバイスが見つかりません。最初のデバイスを追加して開始してください。',
  mqttVendorTuya: 'Tuya',
  mqttVendorESP: 'ESP',
  mqttVendorMidea: 'Midea',
  mqttVendorShelly: 'Shelly',
  mqttVendorAqara: 'Aqara',
  
  // Admin
  adminPanel: '管理パネル',
  adminAnnouncements: 'お知らせ',
  adminManagement: 'スマート倉庫管理',
  adminDashboard: 'ダッシュボード',
  adminCommunities: 'コミュニティ',
  adminCommunitiesDescription: 'すべてのコミュニティ、建物、住民を表示および管理',
  adminTotalCommunities: '総コミュニティ数',
  adminTotalBuildings: '総建物数',
  adminTotalMembers: '総メンバー数',
  adminTotalWorkgroups: '総作業グループ数',
  adminCommunityList: 'コミュニティリスト',
  adminViewDetails: '詳細を表示',
  adminNoCommunities: 'コミュニティがありません',
  adminBuildings: '建物',
  adminBuildingsDescription: 'すべての建物と住民を表示および管理',
  adminFilterByCommunity: 'コミュニティでフィルター',
  noBuildings: '建物はまだありません',
  addBuilding: '建物を追加',
  adminBuildingsCount: '建物',
  adminMembersCount: 'メンバー',
  adminWorkgroupsCount: '作業グループ',
  adminTotalHouseholds: '総世帯数',
  adminAllCommunities: 'すべてのコミュニティ',
  adminHouseholds: '世帯',
  adminItems: 'アイテム',
  adminUsers: '管理者ユーザー',
  adminRoles: 'ロール',
  adminAnalytics: '分析',
  adminSettings: '設定',
  adminAdministrator: '管理者',
  adminCopyright: 'スマート倉庫管理パネル。全著作権所有。',
  adminFilters: 'フィルター',
  filter: 'フィルター',
  adminHousehold: '世帯',
  adminAccess: '管理者アクセス',
  adminSecure: 'セキュア',
  
  // Admin Duplicates
  adminDuplicateManagement: '重複項目管理',
  adminDuplicateDescription: '重複するアイテム、部屋、カテゴリを見つけて解決',
  adminBackToAdmin: '管理者に戻る',
  adminDuplicateItems: '重複アイテム',
  adminDuplicateRooms: '重複部屋',
  adminDuplicateCategories: '重複カテゴリ',
  adminNoDuplicateItems: '重複アイテムが見つかりません',
  adminNoDuplicateRooms: '重複部屋が見つかりません',
  adminNoDuplicateCategories: '重複カテゴリが見つかりません',
  adminAllItemsUnique: 'すべてのアイテムが一意のようです。',
  adminAllRoomsUnique: 'すべての部屋が一意のようです。',
  adminAllCategoriesUnique: 'すべてのカテゴリが一意のようです。',
  adminSimilar: '類似',
  adminMerge: 'マージ',
  adminMerging: 'マージ中...',
  adminKeepSeparate: '分離を維持',
  adminLevel: 'レベル',
  adminMergeSuccess: '{type}のマージに成功しました',
  adminMergeFailed: '{type}のマージに失敗しました',
  adminKeepSeparateSuccess: '{type}を分離としてマークしました',
  adminKeepSeparateFailed: '{type}を分離としてマークできませんでした',
  
  // Common
  commonLanguage: '言語',
  commonCurrentLanguage: '現在の言語',
  commonSignOut: 'サインアウト',
  commonLoading: '読み込み中...',
  commonSettings: '設定',
  commonCopy: 'コピー',
  commonNotSet: '未設定',
  
  // Password Change
  changePassword: 'パスワードの変更',
  currentPassword: '現在のパスワード',
  newPassword: '新しいパスワード',
  confirmPassword: '新しいパスワードの確認',
  passwordRequirements: '最低6文字',
  changing: '変更中...',
  editFacility: '施設を編集',
  facilityUpdated: '施設の更新に成功しました',
  facilityUpdateError: '施設の更新に失敗しました',
  forgotPassword: 'パスワードを忘れた場合',
  forgotPasswordDescription: 'メールアドレスを入力してください。パスワードリセットリンクをお送りします。',
  checkYourEmail: 'メールを確認してください',
  passwordResetEmailSent: 'このメールアドレスにアカウントが存在する場合、パスワードリセットリンクが送信されました。',
  backToSignIn: 'サインインに戻る',
  sendResetLink: 'リセットリンクを送信',
  invalidResetLink: '無効なリセットリンク',
  passwordsDoNotMatch: 'パスワードが一致しません',
  passwordTooShort: 'パスワードは少なくとも6文字である必要があります',
  resetPassword: 'パスワードをリセット',
  enterNewPassword: '以下に新しいパスワードを入力してください',
  resetting: 'リセット中...',
  adminAccessRequired: '管理者アクセスが必要です',
  adminPleaseSignIn: '管理パネルにアクセスするにはサインインしてください',
  commonSignIn: 'サインイン',
  
  // Dashboard Time Filters
  today: '今日',
  pastWeek: '過去一週間',
  all: 'すべて',
  
  // Household Change Detection
  householdChangesDetected: '世帯に変更が検出されました。',
  refreshToSeeChanges: '最新の変更を確認するために更新してください。',
  
  // Admin Dashboard
  adminLoading: '管理パネルを読み込み中...',
  adminError: 'ダッシュボード読み込みエラー',
  retry: '再試行',
  adminWelcome: 'おかえりなさい',
  adminOverview: 'スマート倉庫システムの概要です',
  adminTotalUsers: '総ユーザー数',
  adminTotalItems: '総アイテム数',
  adminAvgItems: '平均アイテム/世帯',
  adminQuickActions: 'クイックアクション',
  adminManageHouseholds: '世帯管理',
  adminViewAllItems: 'すべてのアイテムを表示',
  adminViewAnalytics: '分析を表示',
  adminSystemSettings: 'システム設定',
  adminSystemStatus: 'システムステータス',
  adminDatabase: 'データベース',
  adminAPIServices: 'API サービス',
  adminStorage: 'ストレージ',
  adminAuthentication: '認証',
  adminHealthy: '健全',
  adminRecentActivity: '最近のアクティビティ',
  adminSystemMonitoring: 'システム監視がアクティブ',
  adminAllServicesRunning: 'すべてのサービスが正常に実行中',
  adminJustNow: '今すぐ',
  adminDashboardAccessed: '管理ダッシュボードにアクセス',
  adminSecureAuth: 'セキュア認証が成功',
  admin2MinutesAgo: '2分前',
  adminLastUpdated: '最終更新',
  
  // Admin Households
  adminSearchHouseholds: '世帯、メンバー、または説明を検索...',
  adminCleanupDuplicates: '重複をクリーンアップ',
  adminShowDetails: '詳細を表示',
  adminHideDetails: '詳細を非表示',
  
  // Admin Items
  adminViewManageItems: 'すべての世帯のアイテムを表示・管理',
  adminSearchItems: '名前でアイテムを検索...',
  
  // Admin Users
  adminUserManagement: '管理者ユーザー管理',
  
  // Admin Analytics
  adminAnalyticsDescription: 'システムパフォーマンスと使用統計',
  adminFilterByLanguage: '言語でフィルター',
  adminRolesLanguages: '管理者ロールと言語',
  
  // Admin Settings
  adminSettingsDescription: 'システム設定の管理とヘルスモニタリング',
  
  // Admin Roles
  adminRoleManagement: '管理者ロール管理',
  adminRoleManagementDescription: '管理者ユーザーロールと権限の管理',
  
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
  move: '移動',
  moving: '移動中...',
  checkout: 'チェックアウト',
  checkingOut: 'チェックアウト中...',
  history: '履歴',
  editItem: 'アイテムを編集',
  moveItem: 'アイテムを移動',
  checkoutItem: 'アイテムをチェックアウト',
  itemHistory: 'アイテム履歴',
  
  // Error handling
  errorOccurred: '問題が発生しました',
  unexpectedError: '予期しないエラーが発生しました。ページを更新してください。',
  refreshPage: 'ページを更新',
  goHome: 'ホームに戻る',
  
  // Add Item Modal
  selectRoom: '部屋を選択',
  autoCreateDefaultCabinet: 'デフォルトキャビネットを自動作成',
  checkoutQuantity: 'チェックアウト数量',
  reason: '理由',
  moveToRoom: '部屋に移動',
  moveConfirmation: '移動先',
  moveQuantity: '移動数量',
  moveFrom: '移動元',
  adjustQuantity: '数量を調整',
  currentQuantity: '現在の数量',
  newQuantity: '新しい数量',
  adjustment: '調整量',
  noQuantityChange: '数量変更が指定されていません',
  invalidQuantity: '数量は負の値にできません',
  failedToUpdateQuantity: '数量の更新に失敗しました',
  updateQuantity: '数量を更新',
  updating: '更新中',
  
  // Voice Comments
  voiceComment: '音声コメント',
  voiceCommentHint: 'このアイテムが取り出された理由を説明する音声メモを録音します',
  startRecording: '録音開始',
  stopRecording: '録音停止',
  pauseRecording: '一時停止',
  playRecording: '再生',
  deleteRecording: '録音を削除',
  rerecord: '再録音',
  voiceCommentMaxDuration: '最大録音時間に達しました',
  voiceCommentPermissionError: 'マイクのアクセス許可が拒否されました。マイクへのアクセスを許可してください。',
  voiceCommentConversionError: '音声録音の処理に失敗しました',
  playVoiceComment: '音声コメントを再生',
  playingVoiceComment: '再生中...',
  voiceTranscript: '文字起こし',
  transcribingVoice: '文字起こし中...',
  voicePromptStart: '何をお手伝いできますか？',
  voicePromptEnd: '受け取りました。',
  
  // Category Management
  categoryHierarchy: 'カテゴリ階層',
  cleanDuplicateCategories: '🗂️ 重複カテゴリをクリーンアップ',
  
  // Missing translations for hardcoded strings
  noItemsFound: 'アイテムが見つかりません',
  startAddingItems: 'インベントリにアイテムを追加してください。',
  forceRefreshPage: 'ページを強制更新',
  refresh: '更新',
  whereStored: 'このアイテムはどこに保管されていますか？',
  room: '部屋',
  cabinetShelf: 'キャビネット/棚（オプション）',
  leaveEmptyDefault: '空のままにすると、この部屋のデフォルトキャビネットが自動作成されます',
  addItemButton: 'アイテムを追加',
  switchHousehold: '世帯を切り替え',
  cameraNotAvailable: 'カメラが利用できません。台湾の請求書写真をアップロードして認識してください',
  uploadTaiwanInvoice: '台湾請求書写真をアップロード',
  uploadTaiwanInvoicePhoto: '台湾請求書写真をアップロード',
  unknownItem: '不明なアイテム',
  unableToRecognize: 'アイテムを認識できません',
  miscellaneous: 'その他',
  
  // Duplicate Detection
  potentialDuplicate: '重複の可能性があるアイテム',
  newItem: '新しいアイテム',
  similarItemsFound: '類似のアイテムが見つかりました',
  similarItems: '類似アイテム',
  similar: '類似',
  createNewItem: '新しいアイテムを作成',
  useExistingItem: '既存のアイテムを使用',
  location: '場所',
  country: '国',
  city: '都市',
  district: '地区',
  neighborhood: 'コミュニティ/近隣',
  streetAddress: '住所',
  apartmentNo: 'アパート/建物番号',
  telephone: '電話',
  fullAddress: '完全な住所',
  selectCountry: '国を選択',
  selectCity: '都市を選択',
  selectDistrict: '地区を選択',
  enterCommunity: 'コミュニティまたは近隣を入力',
  enterStreetAddress: '住所を入力',
  enterApartmentNo: '例：123号、A棟',
  enterTelephone: '電話番号を入力',
  completeAddress: '完全な住所',
  setLocationOnMap: '地図で位置を設定',
  updateLocationOnMap: '地図で位置を更新',
  selectLocationOnMap: '地図で位置を選択',
  saveLocation: '位置を保存',
  unlockCity: '都市のロックを解除',
  googleMapsNotAvailable: 'Google マップが利用できません',
  enterLocationManually: '上記のフォームを使用して手動で位置を入力してください',
  coordinates: '座標',
  enterFullAddressToAutoParse: '完全な住所を入力して自動的にコンポーネントに解析',
  createNewHousehold: '新しい家庭を作成',
  enterHouseholdName: '家庭名を入力',
  enterDescription: '説明を入力（任意）',
  creating: '作成中...',
  create: '作成',
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
  lowStock: '在庫不足',
  searchTips: '検索のヒント',
  searchByName: 'アイテム名で検索',
  searchByDescription: '説明で検索',
  searchByCategory: 'カテゴリで検索',
  searchByLocation: '場所で検索',
  useChatGPT: 'ChatGPT 検索を使用',
  
  // Image upload
  itemPhoto: 'アイテム写真',
  addPhoto: '写真を追加',
  changePhoto: '写真を変更',
  removePhoto: '削除',
  uploading: 'アップロード中...',
  
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
  sideCabinet: 'サイドキャビネット',
  
  // Item Management
  description: '説明',
  minimumQuantity: '最小在庫アラート',
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
  scanQRCodeToJoin: 'QRコードをスキャンして参加',
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
  itemCreatedWithQuantity: 'アイテム「{itemName}」が作成されました（数量: {quantity}）',
  itemCreated: 'アイテムが作成されました',
  quantityIncreasedFromTo: '数量が {from} から {to} に増加しました',
  quantityDecreasedFromTo: '数量が {from} から {to} に減少しました',
  itemMovedFromTo: '{itemName} が {from} から {to} に移動されました',
  itemUpdated: 'アイテムが更新されました',
  itemDeleted: 'アイテムが削除されました',
  categoryCreatedDescription: 'カテゴリが作成されました',
  categoryDeletedDescription: 'カテゴリが削除されました',
  roomCreatedDescription: '部屋が作成されました',
  roomDeletedDescription: '部屋が削除されました',
  
  // AI Recognition
  aiConfidence: 'AI 信頼度',
  itemName: 'アイテム名',
  quantity: '数量',
  category: 'カテゴリ',
  household: '世帯',
  priority: '優先度',
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
  noRecentActivity: '最近のアクティビティはありません。',
  startByAddingFirstItem: '最初のアイテムを追加してください！',
  noActivities: 'アクティビティなし',
  activitiesWillAppearHere: 'システムを使用すると、ここにアクティビティが表示されます。',
  
  // Taiwan E-Invoice
  taiwanInvoice: '台湾インボイス',
  scanTaiwanInvoice: '台湾インボイスをスキャン',
  taiwanInvoiceDetected: '台湾インボイスが検出されました',
  taiwanInvoiceDecoded: '台湾インボイスが正常にデコードされました',
  invoiceNumber: 'インボイス番号',
  invoiceDate: 'インボイス日付',
  sellerName: '販売者名',
  totalAmount: '総額',
  taxAmount: '税金額',
  invoiceItems: 'インボイス項目',
  processingTaiwanInvoice: '台湾インボイスを処理中...',
  
  // Invitation Codes
  invitationCode: '招待コード',
  shareInvitationCode: 'このコードを他の人と共有して、あなたの世帯に参加してもらいます',
  regenerateInvitationCode: '再生成',
  copyInvitationCode: 'クリップボードにコピー',
  invitationCodeInstructions: '• このコードを家族と共有して招待してください\n• 新しいユーザーはサインアップ時にこのコードを入力してあなたの世帯に参加できます\n• コードが漏洩した疑いがある場合は再生成してください',
  joinWithInvitationCode: '招待コードで参加',
  joinHousehold: '世帯に参加',
  joinType: '参加タイプ',
  codeScanned: 'コードがスキャンされました',
  pleaseSignIn: 'サインインしてください',
  found: '見つかりました',
  householdFound: '世帯が見つかりました',
  codePasted: 'クリップボードからコードが貼り付けられました',
  failedToPaste: 'クリップボードから読み取れませんでした',
  checking: '確認中...',
  joining: '参加中...',
  check: '確認',
  join: '参加',
  joinRequestSent: '参加リクエストが送信されました。承認を待っています。',
  successfullyJoined: '正常に参加しました！',
  failedToJoin: '参加に失敗しました',
  failedToValidateCode: '招待コードの検証に失敗しました',
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
  
  // Category Name Translations (for existing categories)
  categoryNameTranslations: {
    'Electronics': '電子機器',
    'Tools': '工具',
    'Clothing': '衣類',
    'Books': '本',
    'Miscellaneous': 'その他',
    'Kitchen': 'キッチン',
    'Food': '食品',
    'Beverages': '飲料',
    'Medicine': '薬品',
    'Toiletries': '洗面用品',
    'Cleaning': '清掃用品',
    'Office': '事務用品',
    'Sports': 'スポーツ用品',
    'Toys': 'おもちゃ',
    'Garden': '園芸用品'
  },
  
  // Admin Items Page
  checkDuplicates: '重複項目をチェック',
  backToApp: 'アプリに戻る',
  avgItemsPerHousehold: '世帯あたりの平均アイテム数',
  updatePhoto: '写真を更新',
  tryAdjustingSearch: '検索またはフィルターを調整してみてください。',
  noItemsCreatedYet: 'まだアイテムが作成されていません。',
  min: '最小',
  photo: '写真',
  
  // Building
  buildingOverview: '概要',
  buildingHouseholds: '世帯',
  buildingMailboxes: 'メールボックス',
  buildingSettings: '建物設定',
  buildingSummary: '建物サマリー',
  buildingBasicInfo: '基本情報',
  buildingPackageLockers: 'パッケージロッカー',
  buildingCommunity: 'コミュニティ',
  buildingFloorCount: '階数',
  buildingUnitCount: 'ユニット数',
  buildingHouseholdCount: '世帯数',
  buildingCreatedAt: '作成日',
  buildingInvitationCode: '招待コード',
  buildingCopyCode: 'コピー',
  buildingShareCode: 'このコードを他の人と共有して、この建物に参加させることができます',
  buildingFloorsSetup: '階とユニットが設定されました',
  buildingUnitsSetup: '居住ユニット',
  buildingSetupComplete: '階とユニットが設定されました',
  buildingSetupInProgress: '設定中...',
  buildingSetupFloorsUnits: '階とユニットを設定',
  buildingResetFloorsUnits: '階とユニットをリセット',
  buildingResetWarning: 'リセットすると既存の階とユニットが更新されます（既存のデータは削除されません）',
  buildingViewHouseholds: '世帯を表示',
  buildingManageMailboxes: 'メールボックスを管理',
  buildingFloor: '階',
  buildingUnit: 'ユニット',
  buildingMailbox: 'メールボックス',
  buildingNoHouseholds: '世帯がありません',
  buildingLoading: '読み込み中...',
  buildingMembers: 'メンバー',
  buildingItems: 'アイテム',
  buildingRooms: '部屋',
  buildingBackToCommunity: 'コミュニティに戻る',
  buildingNotFound: '建物が見つかりません',
  frontDoorCommonArea: 'エントランス／共用エリア',
  frontDoorLoading: '共用エリアの情報を読み込み中...',
  frontDoorLoadError: '共用エリアの情報を取得できませんでした',
  frontDoorStatsHouseholds: '世帯',
  frontDoorStatsMailboxes: 'メールボックス',
  frontDoorStatsDoorBells: 'ドアベル',
  frontDoorStatsLockers: '宅配ボックス',
  frontDoorLockerCountLabel: '宅配ボックスの台数',
  frontDoorLockerCountHint: '建物・コミュニティ管理者はいつでも台数を調整できます。',
  frontDoorSyncButton: '世帯情報と同期',
  frontDoorSyncing: '同期中...',
  frontDoorSyncSuccess: '共用エリアを同期しました',
  frontDoorSyncError: '共用エリアの同期に失敗しました',
  frontDoorLockerUpdateSuccess: '宅配ボックス数を更新しました',
  frontDoorLockerUpdateError: '宅配ボックス数の更新に失敗しました',
  frontDoorNotifySuccess: '郵便のお知らせを送信しました',
  frontDoorNotifyError: '郵便のお知らせを送信できませんでした',
  frontDoorDoorBellError: 'ドアベルの更新に失敗しました',
  frontDoorRingSuccess: 'ドアベルを鳴らしました',
  frontDoorRingError: 'ドアベルを鳴らせませんでした',
  frontDoorNotifyButton: '住戸へ通知',
  frontDoorDoorBells: 'ドアベル',
  frontDoorEnable: '有効化',
  frontDoorDisable: '無効化',
  frontDoorRingButton: '呼び出す',
  frontDoorPackageLockers: '宅配ボックス',
  frontDoorLocker: 'ボックス',
  frontDoorNoMailboxes: 'メールボックスはまだありません',
  frontDoorNoDoorBells: 'ドアベルはまだありません',
  frontDoorNoLockers: '宅配ボックスはまだありません',
  
  // Doorbell
  doorBell: 'ドアベル',
  doorBellRinging: '呼び出し中',
  doorBellConnected: '接続済み',
  doorBellEnded: '終了',
  doorBellNoActiveCalls: 'アクティブな通話はありません',
  doorBellAnswer: '応答',
  doorBellCallAnswered: '通話に応答しました',
  doorBellAnswerError: '応答に失敗しました',
  doorBellEndCall: '通話終了',
  doorBellCallEnded: '通話が終了しました',
  doorBellUnlockDoor: 'ドアを開ける',
  doorBellDoorUnlocked: 'ドアが開きました',
  doorBellUnlockError: 'ドアの開錠に失敗しました',
  doorBellSendMessage: '送信',
  doorBellMessagePlaceholder: 'メッセージを入力...',
  doorBellMessageSent: 'メッセージを送信しました',
  doorBellMessageError: 'メッセージの送信に失敗しました',
  doorBellCameraOn: 'カメラオン',
  doorBellCameraOff: 'カメラオフ',
  doorBellMicOn: 'マイクオン',
  doorBellMicOff: 'マイクオフ',
  doorBellVideoCall: 'ビデオ通話',
  doorBellCameraActive: 'カメラ動作中',
  doorBellOnlyInBuilding: 'ドアベル機能は建物内の世帯でのみ利用できます。',
  doorBellVisitorArrived: 'ドアベルが鳴りました',
  doorBellVisitorAtDoor: '誰かがドアにいます',
  
  // Household Actions
  householdReservation: '予約',
  householdMaintenance: '修理',
  householdProperty: '物件',
  householdVisitorTag: '訪問者タグ',
  householdInvitationCode: '招待コード',
  copyHouseholdId: '世帯 ID をコピー',
  householdActive: 'アクティブ',
  householdInactive: '非アクティブ',
  copyError: 'コピーに失敗しました',
  addHousehold: '世帯を追加',
  householdCount: '世帯数',
  householdUnitLabels: 'ユニット記号',
  householdCreated: '世帯を作成しました',
  householdCreatedError: '世帯の作成に失敗しました',
  buildingFacilities: '共用施設',
  facilityAddNew: '施設を追加',
  facilityNameLabel: '施設名',
  facilityTypeLabel: '種類',
  facilityFloorLabel: '階数',
  facilityCapacityLabel: '定員',
  facilityCreateButton: '施設を作成',
  facilityCreated: '施設を作成しました',
  facilityCreateError: '施設の作成に失敗しました',
  facilityLoadError: '施設の読み込みに失敗しました',
  facilityLoading: '施設を読み込み中...',
  facilityNoFacilities: '施設はまだありません',
  facilityDelete: '施設を削除',
  facilityDeleteConfirm: 'この施設を削除しますか？',
  facilityDeleted: '施設を削除しました',
  facilityDeleteError: '施設の削除に失敗しました',
  facilityOperatingHours: '営業スケジュール',
  facilityOpenTime: '開始',
  facilityCloseTime: '終了',
  facilityClosed: '休館',
  facilitySaveHours: 'スケジュールを保存',
  facilityHoursSaved: '営業スケジュールを保存しました',
  facilityHoursError: 'スケジュールの保存に失敗しました',
  day: '曜日',
  status: 'ステータス',
  occupied: '使用中',
  available: '空き',
  
  // Community
  communityBackToList: 'コミュニティリストに戻る',
  communityNotFound: 'コミュニティが見つかりません',
  communityOverview: '概要',
  communityBasicInfo: '基本情報',
  communityStats: '統計情報',
  communityAddress: '住所',
  communityCreatedAt: '作成日時',
  communityInvitationCode: '招待コード',
  communityShareInvitation: 'この招待コードを他の人と共有して、このコミュニティに参加できるようにします',
  communityCopyInvitation: 'コピー',
  communityInvitationCopied: '招待コードをコピーしました',
  communityWorkingGroups: '作業グループ',
  communityAddMember: 'メンバーを追加',
  communityNoMembers: 'メンバーはまだいません',
  communityCreateWorkgroup: '作業グループを作成',
  communityNoWorkgroups: '作業グループはまだありません',
  communityNotSet: '未設定',
  communityMemberList: 'メンバーリスト',
  communityWorkgroupList: '作業グループリスト',
  communityWorkgroupType: 'タイプ',
  communityWorkgroupMembers: 'メンバー',
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
  
  // First try direct mapping (English to Chinese)
  if (t.categoryNameTranslations[categoryName]) {
    return t.categoryNameTranslations[categoryName]
  }
  
  // Then try reverse mapping (Chinese to English)
  // If current language is English, translate Chinese names to English
  if (languageCode === 'en') {
    const chineseToEnglish: Record<string, string> = {
      '電子產品': 'Electronics',
      '工具': 'Tools', 
      '服裝': 'Clothing',
      '衣服': 'Clothing',
      '書籍': 'Books',
      '其他': 'Miscellaneous',
      '廚房': 'Kitchen',
      '食物': 'Food',
      '飲料': 'Beverages',
      '藥品': 'Medicine',
      '盥洗用品': 'Toiletries',
      '清潔用品': 'Cleaning',
      '辦公用品': 'Office',
      '運動用品': 'Sports',
      '玩具': 'Toys',
      '園藝用品': 'Garden',
      // Sub-level categories
      '上衣': 'Upper Garment',
      'T-shirt': 'T-shirt'
    }
    
    if (chineseToEnglish[categoryName]) {
      return chineseToEnglish[categoryName]
    }
  }
  
  // If no translation found, return original name
  return categoryName
}

// Get a specific translation key
export function t(languageCode: string, key: keyof Translations): string {
  const translation = getTranslations(languageCode)
  const value = translation[key]
  if (typeof value === 'string') {
    return value
  }
  // Fallback to English translation
  const englishValue = translations['en'][key]
  if (typeof englishValue === 'string') {
    return englishValue
  }
  return key
}

// Hook for React components
export function useTranslations(languageCode: string) {
  return {
    t: (key: keyof Translations) => t(languageCode, key),
    translations: getTranslations(languageCode)
  }
}
