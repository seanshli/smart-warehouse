# AI Configuration Guide

This guide will help you set up OpenAI integration for the Smart Warehouse app.

## 🚀 Quick Setup

### 1. Get Your OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the API key (starts with `sk-`)

### 2. Update Your Configuration
```bash
# Update OpenAI configuration to latest models
npm run update-openai
```

### 3. Add Your API Key
Edit `.env.local` and replace `your-openai-api-key` with your actual key:
```env
OPENAI_API_KEY="sk-your-actual-api-key-here"
```

### 4. Restart the Server
```bash
# Stop the current server (Ctrl+C) and restart
npm run dev
```

## 🤖 AI Models Used

### Vision Model: `gpt-4o`
- **Purpose**: Image recognition for photos
- **Features**: 
  - Identifies items from photos
  - Suggests names, descriptions, and categories
  - Provides confidence scores
- **Cost**: ~$0.01 per image

### Text Model: `gpt-4o-mini`
- **Purpose**: Barcode/QR code recognition
- **Features**:
  - Analyzes barcode patterns
  - Suggests product information
  - Fast and cost-effective
- **Cost**: ~$0.0001 per request

## ⚙️ Configuration Options

You can customize the AI behavior by editing these variables in `.env.local`:

```env
# Model Selection
OPENAI_VISION_MODEL="gpt-4o"          # For image recognition
OPENAI_TEXT_MODEL="gpt-4o-mini"       # For barcode/QR recognition

# Response Settings
OPENAI_MAX_TOKENS="500"               # Maximum response length
OPENAI_TEMPERATURE="0.3"              # Creativity level (0-1)
```

### Model Options

#### Vision Models (for photos):
- `gpt-4o` - Latest, most accurate (recommended)
- `gpt-4-vision-preview` - Older version
- `gpt-4-turbo` - Fast but less accurate

#### Text Models (for barcodes):
- `gpt-4o-mini` - Latest, cost-effective (recommended)
- `gpt-4o` - More accurate but expensive
- `gpt-3.5-turbo` - Older, cheaper option

### Temperature Settings:
- `0.0` - Very consistent, factual responses
- `0.3` - Balanced (recommended)
- `0.7` - More creative, varied responses
- `1.0` - Maximum creativity

## 💰 Cost Estimation

### Typical Usage Costs:
- **Photo Recognition**: ~$0.01 per item
- **Barcode Recognition**: ~$0.0001 per item
- **Monthly Estimate**: $5-20 for moderate household use

### Cost Optimization:
1. Use `gpt-4o-mini` for text tasks
2. Set lower `MAX_TOKENS` for shorter responses
3. Use lower `TEMPERATURE` for consistent results

## 🔧 Troubleshooting

### Common Issues:

**"Invalid API Key"**
- Check your API key is correct
- Ensure you have credits in your OpenAI account
- Verify the key starts with `sk-`

**"Rate Limit Exceeded"**
- You've hit OpenAI's rate limits
- Wait a few minutes and try again
- Consider upgrading your OpenAI plan

**"Model Not Available"**
- The model might be temporarily unavailable
- Try switching to a different model
- Check OpenAI's status page

**"No Response from AI"**
- Check your internet connection
- Verify your API key has sufficient credits
- Try reducing `MAX_TOKENS` setting

### Testing Your Setup:

1. **Test Image Recognition**:
   - Go to the app
   - Click "Add Item"
   - Upload a photo of any household item
   - Check if AI recognizes it correctly

2. **Test Barcode Recognition**:
   - Click "Add Item"
   - Choose "Scan Barcode"
   - Enter any barcode number
   - Check if AI suggests a product

## 🚀 Advanced Configuration

### Custom Prompts
You can modify the AI prompts in `lib/ai.ts` to customize how the AI responds:

```typescript
// Example: More detailed product analysis
const prompt = "Analyze this image and provide detailed information including:
- Product name and brand
- Category and subcategory
- Estimated value
- Common storage locations
- Care instructions"
```

### Error Handling
The app includes fallback responses when AI fails:
- Default category: "Miscellaneous"
- Default confidence: 30%
- Graceful degradation to manual entry

## 📊 Monitoring Usage

### Check Your OpenAI Usage:
1. Go to [OpenAI Usage Dashboard](https://platform.openai.com/usage)
2. Monitor your API calls and costs
3. Set up usage alerts if needed

### App Analytics:
- The app logs AI recognition attempts
- Check browser console for detailed logs
- Monitor success rates and response times

## 🔒 Security Notes

- Never commit your API key to version control
- Use environment variables for all sensitive data
- Consider using OpenAI's organization features for team access
- Monitor usage to prevent unexpected charges

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Review the console logs
3. Test with the demo account
4. Check OpenAI's documentation
5. Open an issue on GitHub

---

**Ready to start using AI-powered inventory management!** 🎉

