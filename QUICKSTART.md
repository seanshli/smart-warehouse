# Quick Start Guide

Get your Smart Warehouse app running in 5 minutes!

## 🚀 Quick Setup

1. **Run the setup script**
   ```bash
   npm run setup
   ```

2. **Add your OpenAI API key**
   Edit `.env.local` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY="sk-your-openai-api-key-here"
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Go to [http://localhost:3000](http://localhost:3000)

## 🎯 First Steps

1. **Sign up/Login** - Create an account or use Google OAuth
2. **Add your first item** - Click "Add Item" and try uploading a photo
3. **Create rooms** - Go to "Rooms" tab and add your first room
4. **Set up categories** - Go to "Categories" tab and create your category structure

## 📱 Mobile Usage

- **Native Apps**: Full native iOS and Android apps available
- **Install as PWA**: Click the install button in your mobile browser
- **Camera access**: Allow camera permissions for photo capture and barcode scanning
- **Native Barcode Scanning**: iOS and Android use native libraries for better performance
- **Voice Assistant**: Use the Assistant tab for voice interactions (iOS/Android)
- **Home Assistant**: Control smart home devices from the app

## 🔧 Troubleshooting

### Common Issues

**"OpenAI API Error"**
- Make sure your API key is correct in `.env.local`
- Check your OpenAI account has credits

**"Database Error"**
- Run `npm run db:push` to reset the database
- Check that SQLite is working properly

**"Authentication Issues"**
- Clear browser cookies and try again
- Make sure `NEXTAUTH_SECRET` is set in `.env.local`

### Getting Help

- Check the full [README.md](README.md) for detailed documentation
- Open an issue on GitHub for bugs
- Check the console for error messages

## 🎉 You're Ready!

Your Smart Warehouse is now running! Start adding items and organizing your household inventory with AI-powered recognition.


