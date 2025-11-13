# Smart Warehouse - AI-Powered Inventory Management

A comprehensive warehouse-like inventory management system that uses AI to recognize items from photos, barcodes, and QR codes. Perfect for household inventory management with multi-user support.

## Features

### 🤖 AI-Powered Item Recognition
- **Photo Recognition**: Upload photos or take pictures with your camera
- **Native Barcode Scanning**: iOS uses AVFoundation, Android uses ML Kit for superior performance
- **Web Barcode Scanning**: Fallback to Quagga.js for browser-based scanning
- **QR Code Scanning**: Support for QR code-based item identification
- **OpenAI Integration**: Uses GPT-4 Vision for intelligent item recognition
- **Taiwan E-Invoice**: Automatic decoding of Taiwan e-invoice QR codes

### 🏠 Multi-User Household Management
- **User Authentication**: Secure login with Google OAuth or email/password
- **Household Sharing**: Multiple users can access the same household inventory
- **Role Management**: Admin and member roles for household management

### 📍 Location Management
- **Room Organization**: Create and manage rooms within your household
- **Cabinet System**: Organize items within cabinets and shelves
- **Flexible Structure**: Add new rooms and cabinets as needed

### 🏷️ Hierarchical Categories
- **3-Level Categories**: Organize items with up to 3 levels of categorization
- **Custom Categories**: Create your own category structure
- **Smart Suggestions**: AI suggests categories based on item recognition

### 🔍 Advanced Search
- **Multi-Field Search**: Search by name, description, barcode, or QR code
- **Filter by Category**: Narrow down results by category
- **Filter by Location**: Find items by room or cabinet
- **Real-time Results**: Instant search results as you type

### 📊 Inventory Tracking
- **Quantity Management**: Track item quantities
- **Low Stock Alerts**: Set custom thresholds for inventory notifications
- **Automatic Notifications**: Get notified when items are running low
- **Activity Tracking**: Monitor recent additions and changes

### 📱 Cross-Platform Support
- **Native iOS App**: Full native app with Capacitor (iOS 14+)
- **Native Android App**: Full native app with Capacitor (Android 5.0+)
- **Progressive Web App**: Install as a native app on mobile devices
- **Responsive Design**: Optimized for phones, tablets (including 10" tablets), and desktops
- **Touch-Friendly**: Optimized for touch interactions with proper viewport handling

### 🎤 Voice Assistant
- **AIUI Integration**: Native voice assistant powered by iFLYTEK AIUI
- **OpenAI Fallback**: Automatic fallback to OpenAI for voice interactions
- **Multi-Language Support**: English, Traditional Chinese, Simplified Chinese, Japanese
- **Voice Commands**: Ask questions about inventory, weather, and more

### 🏠 Home Assistant Integration
- **Smart Home Control**: Control Home Assistant devices directly from the app
- **Real-Time Sync**: Automatic status updates when devices are controlled elsewhere
- **HomeKit-Style UI**: Beautiful, intuitive controls for smart home devices
- **Device Management**: Power controls, mode selection, and status monitoring

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Headless UI
- **Database**: PostgreSQL (Supabase) / SQLite with Prisma ORM
- **Authentication**: NextAuth.js
- **AI Integration**: 
  - OpenAI GPT-4 Vision API (image recognition)
  - OpenAI GPT-4o-mini (text processing)
  - OpenAI Whisper (speech-to-text fallback)
- **Voice**: 
  - iFLYTEK AIUI (primary - native iOS/Android)
  - OpenAI Whisper (fallback)
- **Native Mobile**: Capacitor 7 (iOS & Android)
- **Barcode Scanning**: 
  - Native: AVFoundation (iOS), ML Kit (Android)
  - Web: Quagga.js (fallback)
- **Home Assistant**: WebSocket API integration
- **Image Processing**: React Dropzone, Canvas API

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key
- (Optional) iFLYTEK API credentials for native voice features
- (Optional) Home Assistant instance for smart home integration

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-warehouse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your configuration:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   OPENAI_API_KEY="your-openai-api-key"
   OPENAI_VISION_MODEL="gpt-4o"
   OPENAI_TEXT_MODEL="gpt-4o-mini"
   
   # Optional: iFLYTEK for native voice features
   IFLYTEK_APP_KEY="your-iflytek-app-key"
   IFLYTEK_APP_SECRET="your-iflytek-app-secret"
   AIUI_DEVICE_SERIAL="SMARTPAD000037"
   
   # Optional: Home Assistant integration
   HOME_ASSISTANT_BASE_URL="https://your-home-assistant-instance.com"
   HOME_ASSISTANT_ACCESS_TOKEN="your-long-lived-access-token"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Adding Items

1. **Click "Add Item"** on the dashboard
2. **Choose input method**:
   - Upload a photo
   - Take a photo with camera
   - Scan a barcode (native on iOS/Android, web fallback on browsers)
   - Scan a QR code
   - Upload Taiwan e-invoice
3. **Review AI suggestions** for name, description, and category
4. **Set quantity and location** (room and cabinet)
5. **Configure low stock alerts** if needed

### Using Voice Assistant

1. **Go to "Assistant" tab** on the dashboard
2. **Type or speak** your question
3. **Get AI-powered responses** about your inventory or general questions
4. **Multi-language support** - works in English, Chinese, and Japanese

### Home Assistant Integration

1. **Configure Home Assistant** in environment variables
2. **Go to "Home Assistant" tab** on the dashboard
3. **View and control** your smart home devices
4. **Real-time updates** when devices are controlled elsewhere

### Managing Locations

1. **Go to "Rooms" tab**
2. **Add new rooms** (Kitchen, Living Room, Garage, etc.)
3. **Add cabinets** within each room
4. **Organize items** by assigning them to specific locations

### Setting Up Categories

1. **Go to "Categories" tab**
2. **Create level 1 categories** (Electronics, Kitchen, Tools, etc.)
3. **Add subcategories** (Level 2 and 3) as needed
4. **Organize items** using the hierarchical structure

### Search and Find Items

1. **Click "Search"** on the dashboard
2. **Enter search terms** (name, description, barcode, QR code)
3. **Apply filters** by category or room
4. **View results** with location information

## API Endpoints

### Items
- `GET /api/items` - Get all items with optional search/filter
- `POST /api/items` - Create a new item

### Rooms
- `GET /api/rooms` - Get all rooms
- `POST /api/rooms` - Create a new room

### Cabinets
- `POST /api/cabinets` - Create a new cabinet

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create a new category

### Notifications
- `GET /api/notifications` - Get all notifications
- `PATCH /api/notifications/[id]` - Mark notification as read
- `PATCH /api/notifications/mark-all-read` - Mark all notifications as read

## Database Schema

The application uses a relational database with the following main entities:

- **Users**: User accounts with authentication
- **Households**: Multi-user household groups
- **Rooms**: Physical locations within households
- **Cabinets**: Storage areas within rooms
- **Categories**: Hierarchical item categorization (3 levels)
- **Items**: Inventory items with AI-generated metadata
- **Notifications**: Low stock and system alerts

## Deployment

### Vercel (Recommended)

1. **Push to GitHub**
2. **Connect to Vercel**
3. **Set environment variables** in Vercel dashboard
4. **Deploy automatically**

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub or contact the development team.

## Current Versions

- **Web**: 0.1.2
- **iOS**: 1.0.5 (Build 24)
- **Android**: 1.0.15 (Build 15)

## Roadmap

- [ ] Barcode/QR code generation
- [ ] Advanced analytics and reporting
- [ ] Integration with shopping lists
- [ ] Enhanced offline support
- [ ] Additional language support
- [ ] Export/Import functionality


# Force redeploy Fri Oct 10 18:39:00 CST 2025
# Force deployment Fri Oct 10 18:55:02 CST 2025
# Force Prisma client update Fri Oct 10 23:54:47 CST 2025
# Schema cleanup completed
