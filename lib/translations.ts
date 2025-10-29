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
  allItems: string
  duplicates: string
  householdSettings: string
  
  // Admin
  adminPanel: string
  adminManagement: string
  adminDashboard: string
  adminHouseholds: string
  adminItems: string
  adminUsers: string
  adminRoles: string
  adminAnalytics: string
  adminSettings: string
  adminAdministrator: string
  adminCopyright: string
  adminAccess: string
  adminSecure: string
  
  // Admin Duplicates
  adminDuplicateManagement: string
  adminDuplicateDescription: string
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
  
  // Password Change
  changePassword: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
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
  community: string
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
  
  // Admin Items Page
  checkDuplicates: string
  backToApp: string
  avgItemsPerHousehold: string
  allHouseholds: string
  updatePhoto: string
  tryAdjustingSearch: string
  noItemsCreatedYet: string
  min: string
  photo: string
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
  items: 'Items',
  allItems: 'All Items',
  duplicates: 'Duplicates',
  
  // Admin
  adminPanel: 'Admin Panel',
  adminManagement: 'Smart Warehouse Management',
  adminDashboard: 'Dashboard',
  adminHouseholds: 'Households',
  adminItems: 'Items',
  adminUsers: 'Admin Users',
  adminRoles: 'Roles',
  adminAnalytics: 'Analytics',
  adminSettings: 'Settings',
  adminAdministrator: 'Administrator',
  adminCopyright: 'Smart Warehouse Admin Panel. All rights reserved.',
  adminAccess: 'Admin Access',
  adminSecure: 'Secure',
  
  // Admin Duplicates
  adminDuplicateManagement: 'Duplicate Management',
  adminDuplicateDescription: 'Find and resolve duplicate items, rooms, and categories',
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
  
  // Password Change
  changePassword: 'Change Password',
  currentPassword: 'Current Password',
  newPassword: 'New Password',
  confirmPassword: 'Confirm New Password',
  passwordRequirements: 'Minimum 6 characters',
  changing: 'Changing...',
  
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
  community: 'Community/Neighborhood',
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
  orEnterCustom: 'Or enter custom',
  
  // Time
  ago: 'ago',
  item: 'Item',
  
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
  allHouseholds: 'All Households',
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
  items: '物品',
  allItems: '所有物品',
  duplicates: '重複項目',
  
  // Admin
  adminPanel: '管理面板',
  adminManagement: '智能倉庫管理',
  adminDashboard: '儀表板',
  adminHouseholds: '家庭',
  adminItems: '物品',
  adminUsers: '管理員用戶',
  adminRoles: '角色',
  adminAnalytics: '分析',
  adminSettings: '設定',
  adminAdministrator: '管理員',
  adminCopyright: '智能倉庫管理面板。版權所有。',
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
  
  // Password Change
  changePassword: '變更密碼',
  currentPassword: '目前密碼',
  newPassword: '新密碼',
  confirmPassword: '確認新密碼',
  passwordRequirements: '至少 6 個字元',
  changing: '變更中...',
  
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
  community: '社區/鄰里',
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
  allHouseholds: '所有家庭',
  updatePhoto: '更新照片',
  tryAdjustingSearch: '請嘗試調整搜尋或篩選條件。',
  noItemsCreatedYet: '尚未建立任何物品。',
  min: '最小',
  photo: '照片',
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
  items: '物品',
  allItems: '所有物品',
  duplicates: '重复项目',
  
  // Admin
  adminPanel: '管理面板',
  adminManagement: '智能仓库管理',
  adminDashboard: '仪表板',
  adminHouseholds: '家庭',
  adminItems: '物品',
  adminUsers: '管理员用户',
  adminRoles: '角色',
  adminAnalytics: '分析',
  adminSettings: '设置',
  adminAdministrator: '管理员',
  adminCopyright: '智能仓库管理面板。版权所有。',
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
  
  // Password Change
  changePassword: '更改密码',
  currentPassword: '当前密码',
  newPassword: '新密码',
  confirmPassword: '确认新密码',
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
  community: '社区/邻里',
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
  allHouseholds: '所有家庭',
  updatePhoto: '更新照片',
  tryAdjustingSearch: '请尝试调整搜索或筛选条件。',
  noItemsCreatedYet: '尚未创建任何物品。',
  min: '最小',
  photo: '照片',
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
  items: 'アイテム',
  allItems: 'すべてのアイテム',
  duplicates: '重複アイテム',
  
  // Admin
  adminPanel: '管理パネル',
  adminManagement: 'スマート倉庫管理',
  adminDashboard: 'ダッシュボード',
  adminHouseholds: '世帯',
  adminItems: 'アイテム',
  adminUsers: '管理者ユーザー',
  adminRoles: 'ロール',
  adminAnalytics: '分析',
  adminSettings: '設定',
  adminAdministrator: '管理者',
  adminCopyright: 'スマート倉庫管理パネル。全著作権所有。',
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
  
  // Password Change
  changePassword: 'パスワードの変更',
  currentPassword: '現在のパスワード',
  newPassword: '新しいパスワード',
  confirmPassword: '新しいパスワードの確認',
  passwordRequirements: '最低6文字',
  changing: '変更中...',
  
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
  
  // Error handling
  errorOccurred: '問題が発生しました',
  unexpectedError: '予期しないエラーが発生しました。ページを更新してください。',
  refreshPage: 'ページを更新',
  goHome: 'ホームに戻る',
  
  // Add Item Modal
  selectRoom: '部屋を選択',
  autoCreateDefaultCabinet: 'デフォルトキャビネットを自動作成',
  
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
  community: 'コミュニティ/近隣',
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
  allHouseholds: 'すべての世帯',
  updatePhoto: '写真を更新',
  tryAdjustingSearch: '検索またはフィルターを調整してみてください。',
  noItemsCreatedYet: 'まだアイテムが作成されていません。',
  min: '最小',
  photo: '写真',
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
