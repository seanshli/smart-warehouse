// AI 識別模組
// 使用 OpenAI GPT-4 Vision 進行圖像識別和條碼/QR 碼識別

import OpenAI from 'openai'
import { getLanguageSpecificPrompt } from './language'
import { decodeTaiwanEInvoice, isTaiwanEInvoice, extractItemsFromTaiwanInvoice } from './taiwan-einvoice-decoder'

// 延遲初始化 OpenAI 客戶端以避免客戶端問題
let openai: OpenAI | null = null

// 獲取 OpenAI 客戶端實例（單例模式）
export function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

// AI 模型配置
const AI_CONFIG = {
  // 圖像識別的視覺模型
  VISION_MODEL: process.env.OPENAI_VISION_MODEL || 'gpt-4o', // 已更新至最新模型
  // 條碼/QR 碼識別的文字模型
  TEXT_MODEL: process.env.OPENAI_TEXT_MODEL || 'gpt-4o-mini', // 已更新至最新模型
  // 回應的最大 token 數
  MAX_TOKENS: parseInt(process.env.OPENAI_MAX_TOKENS || '500'),
  // 創造性溫度（0-1）
  TEMPERATURE: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
}

// 物品識別結果介面
export interface ItemRecognitionResult {
  name: string // 物品名稱
  description: string // 物品描述
  category: string // 分類
  subcategory?: string // 子分類（可選）
  confidence: number // 信心度（0-100）
  language?: string // 識別內容的語言
}

export async function recognizeItemFromImage(imageBase64: string, userLanguage: string = 'en'): Promise<ItemRecognitionResult> {
  // Check if API key is configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
    console.warn('OpenAI API key not configured')
    return {
      name: 'Unknown Item',
      description: 'AI recognition not available. Please configure your OpenAI API key.',
      category: 'Miscellaneous',
      confidence: 0
    }
  }

  try {
    const response = await getOpenAI().chat.completions.create({
      model: AI_CONFIG.VISION_MODEL,
      messages: [
        {
          role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image and identify the item. IMPORTANT: Include key identifying features in the name such as brand, color, size, material, or distinctive features for easy searching later. Provide a name, description, and suggest a category based on the ITEM TYPE (like Electronics, Drinkware, Cookware, Tools, Clothing, Books, etc. - NOT the location where it's stored). Also suggest a subcategory if applicable. 

CRITICAL: ${getLanguageSpecificPrompt(userLanguage)} ALL fields (name, description, category, subcategory) MUST be in the specified language. Do not mix languages.

Respond in JSON format with fields: name (include brand/color/features), description, category (item type), subcategory (specific item type), confidence (0-100). For example: if it's a red Nike cup, name should be 'Nike Red Sports Cup' not just 'Cup'.`
              },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: AI_CONFIG.MAX_TOKENS,
      temperature: AI_CONFIG.TEMPERATURE,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    // Try to parse JSON response
    try {
      // First, try to extract JSON from the response
      let jsonString = content.trim()

      // Look for JSON object in the response
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonString = jsonMatch[0]
      }

      console.log('Attempting to parse JSON:', jsonString)
      const result = JSON.parse(jsonString)
      console.log('Parsed JSON result:', result)

      return {
        name: result.name || 'Unknown Item',
        description: result.description || 'No description available',
        category: result.category || 'Miscellaneous',
        subcategory: result.subcategory,
        confidence: result.confidence || 50
      }
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError)
      console.log('Raw content:', content)

      // Fallback if JSON parsing fails
      return {
        name: 'Unknown Item',
        description: content,
        category: 'Miscellaneous',
        confidence: 30
      }
    }
  } catch (error) {
    console.error('AI recognition error:', error)
    return {
      name: 'Unknown Item',
      description: 'Unable to recognize item',
      category: 'Miscellaneous',
      confidence: 0
    }
  }
}

// Function to save successful barcode recognition to local database
async function saveBarcodeToDatabase(barcode: string, result: ItemRecognitionResult): Promise<void> {
  try {
    const response = await fetch('/api/warehouse/barcodes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        barcode,
        name: result.name,
        description: result.description,
        category: result.category,
        subcategory: result.subcategory,
        confidence: result.confidence,
        source: 'ai',
        isVerified: false // AI results need user verification
      })
    })
    
    if (response.ok) {
      console.log(`Barcode saved to database: ${barcode} -> ${result.name}`)
    } else {
      console.log(`Failed to save barcode to database: ${barcode}`)
    }
  } catch (error) {
    console.error('Failed to save barcode to database:', error)
  }
}

// Enhanced barcode lookup database - matches ChatGPT knowledge
const BARCODE_LOOKUP: Record<string, ItemRecognitionResult> = {
  // Taiwan products (471 prefix)
  '4710901898748': { 
    name: 'Taiwan Pure Water Wet Wipes', 
    description: 'Taiwan-made pure water wet wipes with ultra-high filtration, no fluorescent agents, no harmful chemicals. Safe for babies and household use.', 
    category: 'Personal Care', 
    subcategory: 'Wet Wipes',
    confidence: 95 
  },
  
  // International products (762 prefix - various brands)
  '7622300761349': {
    name: 'Mini Oreo Original Cookies',
    description: 'Mini Oreo Original Cookies - bite-sized chocolate cookies with vanilla cream filling. Perfect for snacking.',
    category: 'Food & Beverages',
    subcategory: 'Cookies',
    confidence: 95
  },
  
  // Common UPC/EAN patterns for better recognition
  '0123456789012': {
    name: 'Generic Consumer Product',
    description: 'Standard EAN-13 consumer product. Please verify product details manually.',
    category: 'Miscellaneous',
    subcategory: 'General',
    confidence: 60
  },
  
  // Add more common barcodes as we discover them
}

// Helper function to detect barcode format
function detectBarcodeFormat(barcode: string): string {
  const length = barcode.length
  const isNumeric = /^\d+$/.test(barcode)
  
  if (length === 13 && isNumeric) {
    return 'EAN-13'
  } else if (length === 12 && isNumeric) {
    return 'UPC-A'
  } else if (length === 8 && isNumeric) {
    return 'EAN-8'
  } else if (length <= 6 && isNumeric) {
    return 'UPC-E'
  } else if (length > 0 && /^[A-Z0-9]+$/.test(barcode)) {
    return 'Code 39'
  } else {
    return 'Unknown'
  }
}

export async function recognizeItemFromBarcodeImage(imageBase64: string): Promise<ItemRecognitionResult> {
  // Check if API key is configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
    console.warn('OpenAI API key not configured')
    return {
      name: 'Unknown Item',
      description: 'AI recognition not available. Please configure your OpenAI API key.',
      category: 'Miscellaneous',
      confidence: 0
    }
  }

  try {
    const response = await getOpenAI().chat.completions.create({
      model: AI_CONFIG.VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image that contains a barcode. Please: 1) Read the barcode number if visible, 2) Analyze the product packaging, text, and visual elements, 3) Identify the product type based on both barcode and visual information. Consider that barcodes starting with 471 are Taiwan-produced products. Provide detailed analysis of what you see on the packaging (text, images, features mentioned). Respond in JSON format with fields: barcode (if readable), name, description, category (item type), subcategory (specific item type), confidence (0-100), packagingAnalysis (what you see on the packaging)."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: AI_CONFIG.MAX_TOKENS,
      temperature: AI_CONFIG.TEMPERATURE,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    try {
      let jsonString = content.trim()
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonString = jsonMatch[0]
      }

      console.log('Vision model barcode analysis:', jsonString)
      const result = JSON.parse(jsonString)
      console.log('Parsed vision result:', result)

      return {
        name: result.name || 'Unknown Item',
        description: result.description || 'No description available',
        category: result.category || 'Miscellaneous',
        subcategory: result.subcategory,
        confidence: result.confidence || 50
      }
    } catch (parseError) {
      console.error('Vision JSON parsing failed:', parseError)
      return {
        name: 'Unknown Item',
        description: content,
        category: 'Miscellaneous',
        confidence: 30
      }
    }
  } catch (error) {
    console.error('Vision barcode recognition error:', error)
    return {
      name: 'Unknown Item',
      description: 'Unable to recognize item from image',
      category: 'Miscellaneous',
      confidence: 0
    }
  }
}

// Database barcode lookup - check our own database first
async function lookupDatabaseBarcode(barcode: string): Promise<ItemRecognitionResult | null> {
  try {
    const response = await fetch(`/api/warehouse/barcodes?barcode=${encodeURIComponent(barcode)}`)
    
    if (response.ok) {
      const result = await response.json()
      if (result.found && result.data) {
        const data = result.data
        return {
          name: data.name,
          description: data.description || '',
          category: data.category,
          subcategory: data.subcategory || '',
          confidence: data.confidence || 90 // Database records are high confidence
        }
      }
    }
  } catch (error) {
    console.log('Database barcode lookup failed:', error)
  }
  
  return null
}

// External barcode API integration for better coverage
async function lookupExternalBarcode(barcode: string): Promise<ItemRecognitionResult | null> {
  try {
    // Try OpenFoodFacts API (free, comprehensive)
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    
    if (response.ok) {
      const data = await response.json()
      if (data.status === 1 && data.product) {
        const product = data.product
        return {
          name: product.product_name || product.product_name_en || 'Unknown Product',
          description: product.generic_name || product.product_name || `Product with barcode ${barcode}`,
          category: product.categories_tags?.[0]?.replace(/-/g, ' ') || 'Miscellaneous',
          subcategory: product.categories_tags?.[1]?.replace(/-/g, ' ') || 'General',
          confidence: 85
        }
      }
    }
  } catch (error) {
    console.log('External barcode lookup failed:', error)
  }
  
  return null
}

export async function recognizeItemFromBarcode(barcode: string, userLanguage: string = 'en'): Promise<ItemRecognitionResult> {
  console.log('Processing barcode:', barcode, 'Format:', detectBarcodeFormat(barcode))
  
  // Check if this is a Taiwan e-invoice QR code
  if (isTaiwanEInvoice(barcode, userLanguage)) {
    console.log('Detected Taiwan e-invoice QR code, decoding...')
    try {
      const invoiceData = decodeTaiwanEInvoice(barcode)
      if (invoiceData.isValid) {
        const items = extractItemsFromTaiwanInvoice(invoiceData)
        if (items.length > 0) {
          const item = items[0] // Use first item
          console.log('Successfully decoded Taiwan e-invoice:', item.name)
          return {
            name: item.name,
            description: item.description,
            category: item.category,
            confidence: 95, // High confidence for successfully decoded invoices
            language: userLanguage
          }
        }
      } else {
        console.log('Taiwan e-invoice decode failed:', invoiceData.error)
      }
    } catch (error) {
      console.log('Error decoding Taiwan e-invoice:', error)
    }
  }
  
  // First, try our own database (highest priority)
  console.log('Checking local database...')
  const databaseResult = await lookupDatabaseBarcode(barcode)
  if (databaseResult) {
    console.log('Found barcode in local database:', databaseResult)
    return databaseResult
  }
  
  // Second, try the enhanced lookup table
  if (BARCODE_LOOKUP[barcode]) {
    console.log('Found barcode in lookup table:', barcode)
    return BARCODE_LOOKUP[barcode]
  }
  
  // Third, try external barcode database
  console.log('Trying external barcode lookup...')
  const externalResult = await lookupExternalBarcode(barcode)
  if (externalResult) {
    console.log('Found barcode in external database:', externalResult)
    return externalResult
  }
  
  console.log('Barcode not found in any database, proceeding to AI recognition...')

  // Check if API key is configured
  console.log('OpenAI API key check:', {
    hasKey: !!process.env.OPENAI_API_KEY,
    keyValue: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
    isDefault: process.env.OPENAI_API_KEY === 'your-openai-api-key'
  })
  
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key') {
    console.warn('OpenAI API key not configured')
    return {
      name: `Barcode: ${barcode}`,
      description: 'AI recognition not available. Please configure your OpenAI API key.',
      category: 'Miscellaneous',
      confidence: 0
    }
  }

  try {
    const response = await getOpenAI().chat.completions.create({
      model: AI_CONFIG.TEXT_MODEL,
        messages: [
          {
            role: "system",
            content: `You are an expert barcode analyst with access to comprehensive product databases. You can identify products by their barcodes with high accuracy using your knowledge of:
- GS1 country codes and manufacturer prefixes
- Common consumer products and brands
- Product categories and subcategories
- Regional product variations

When analyzing a barcode, provide specific, accurate product information when possible. Use your full knowledge base to identify products, similar to how ChatGPT would analyze barcodes.`
          },
          {
            role: "user",
            content: `Analyze this barcode: ${barcode} (Format: ${detectBarcodeFormat(barcode)}).

Use your comprehensive knowledge to identify this product accurately. Consider:

**GS1 Country Codes:**
- 471 = Taiwan
- 762 = International (various countries)
- 690-699 = China
- 00-13 = USA/Canada
- 20-29 = Restricted circulation
- 30-37 = France
- 400-440 = Germany
- 450-459, 490-499 = Japan
- 460-469 = Russia
- 500-509 = UK
- 520 = Greece
- 530 = Ireland
- 535 = Malta
- 539 = Ireland
- 54 = Belgium/Luxembourg
- 560 = Portugal
- 569 = Iceland
- 57 = Denmark
- 590 = Poland
- 594 = Romania
- 599 = Hungary
- 600-601 = South Africa
- 603 = Ghana
- 608 = Bahrain
- 609 = Mauritius
- 611 = Morocco
- 613 = Algeria
- 616 = Kenya
- 618 = Ivory Coast
- 619 = Tunisia
- 621 = Syria
- 622 = Egypt
- 624 = Libya
- 625 = Jordan
- 626 = Iran
- 627 = Kuwait
- 628 = Saudi Arabia
- 629 = UAE
- 64 = Finland
- 70 = Norway
- 729 = Israel
- 73 = Sweden
- 740 = Guatemala
- 741 = El Salvador
- 742 = Honduras
- 743 = Nicaragua
- 744 = Costa Rica
- 745 = Panama
- 746 = Dominican Republic
- 750 = Mexico
- 759 = Venezuela
- 76 = Switzerland
- 770 = Colombia
- 773 = Uruguay
- 775 = Peru
- 777 = Bolivia
- 779 = Argentina
- 780 = Chile
- 784 = Paraguay
- 786 = Ecuador
- 789-790 = Brazil
- 80-83 = Italy
- 84 = Spain
- 850 = Cuba
- 858 = Slovakia
- 859 = Czech Republic
- 860 = Serbia
- 865 = Mongolia
- 867 = North Korea
- 868-869 = Turkey
- 87 = Netherlands
- 880 = South Korea
- 885 = Thailand
- 888 = Singapore
- 890 = India
- 893 = Vietnam
- 896 = Pakistan
- 899 = Indonesia
- 90-91 = Austria
- 93 = Australia
- 94 = New Zealand
- 955 = Malaysia
- 958 = Macau

**Product Categories to Consider:**
- Food & Beverages (snacks, drinks, packaged foods)
- Personal Care (cosmetics, toiletries, health products)
- Household Items (cleaning products, tools, electronics)
- Health & Beauty (medicines, supplements, skincare)
- Baby Products (formula, diapers, toys)
- Pet Products (food, toys, supplies)

**Instructions:**
1. If you recognize the specific product, provide detailed information including brand, color, size, flavor, or other key features in the name
2. If you can identify the brand/category but not the exact product, provide what you know with key attributes
3. If you can only identify the country of origin, provide that information
4. Always be as specific as your knowledge allows and include distinguishing features in the name for easy searching

IMPORTANT: Include key identifying features in the name such as brand, color, size, flavor, material, or distinctive features for easy searching later.

CRITICAL: ${getLanguageSpecificPrompt(userLanguage)} ALL fields (name, description, category, subcategory) MUST be in the specified language. Do not mix languages.

Respond in JSON format with fields: name (include brand/color/features), description, category, subcategory, confidence (0-100).

Example: {"name": "Head & Shoulders Classic Clean Shampoo 400ml", "description": "Anti-dandruff shampoo for normal hair, 400ml bottle", "category": "Personal Care", "subcategory": "Shampoo", "confidence": 90}`
          }
        ],
      max_tokens: AI_CONFIG.MAX_TOKENS,
      temperature: AI_CONFIG.TEMPERATURE,
    })

    const content = response.choices[0]?.message?.content
    console.log('AI response content:', content)
    if (!content) {
      throw new Error('No response from AI')
    }

    try {
      // First, try to extract JSON from the response
      let jsonString = content.trim()

      // Look for JSON object in the response
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonString = jsonMatch[0]
      }

      console.log('Attempting to parse barcode JSON:', jsonString)
      const result = JSON.parse(jsonString)
      console.log('Parsed barcode JSON result:', result)

      const finalResult = {
        name: result.name || 'Unknown Item',
        description: result.description || 'No description available',
        category: result.category || 'Miscellaneous',
        subcategory: result.subcategory,
        confidence: result.confidence || 50
      }
      
      // Save successful recognition to database for future use
      if (finalResult.confidence > 70) {
        await saveBarcodeToDatabase(barcode, finalResult)
      }
      
      return finalResult
    } catch (parseError) {
      console.error('Barcode JSON parsing failed:', parseError)
      console.log('Raw barcode content:', content)

      // Fallback: Try to create a reasonable response from the content
      const fallbackResult = createFallbackFromContent(content, barcode)
      return fallbackResult
    }
  } catch (error) {
    console.error('Barcode recognition error:', error)
    
    // Ultimate fallback: Create a reasonable response based on barcode format
    const fallbackResult = createFallbackFromBarcode(barcode)
    return fallbackResult
  }
}

// Helper function to create fallback response from AI content
function createFallbackFromContent(content: string, barcode: string): ItemRecognitionResult {
  // Try to extract useful information from the content
  const lowerContent = content.toLowerCase()
  
  if (lowerContent.includes('taiwan') || lowerContent.includes('wet wipe') || lowerContent.includes('tissue')) {
    return {
      name: 'Taiwan Product',
      description: content,
      category: 'Personal Care',
      subcategory: 'Wet Wipes',
      confidence: 60
    }
  }
  
  return {
    name: `Product ${barcode}`,
    description: content,
    category: 'Miscellaneous',
    confidence: 40
  }
}

// Helper function to create fallback response from barcode format
function createFallbackFromBarcode(barcode: string): ItemRecognitionResult {
  const format = detectBarcodeFormat(barcode)
  
  if (barcode.startsWith('471')) {
    return {
      name: `Taiwan Product (${barcode})`,
      description: `Taiwan-produced product with barcode ${barcode}. 471 prefix indicates Taiwan origin.`,
      category: 'Miscellaneous',
      subcategory: 'Taiwan Product',
      confidence: 70
    }
  } else if (barcode.startsWith('762')) {
    return {
      name: `Consumer Product (${barcode})`,
      description: `International consumer product with barcode ${barcode}. 762 prefix indicates major brand products across various categories.`,
      category: 'Miscellaneous',
      subcategory: 'General',
      confidence: 75
    }
  }
  
  return {
    name: `Product ${barcode}`,
    description: `${format} barcode product. Please verify product details manually.`,
    category: 'Miscellaneous',
    confidence: 50
  }
}

