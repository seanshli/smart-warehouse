import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { decodeTaiwanEInvoice, decodeTaiwanReceipt, isTaiwanEInvoice, extractItemsFromTaiwanInvoice } from '@/lib/taiwan-einvoice-decoder'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

/**
 * Extract QR codes and barcode from base64 image data
 * Based on Taiwan e-invoice specification from iReceipt library
 * Reference: https://github.com/kf99916/iReceipt
 */
async function extractQRCodesFromImage(imageBase64: string): Promise<{
  leftQRCode?: string;
  rightQRCode?: string;
  barcode?: string;
}> {
  // Remove data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
  
  // Taiwan e-invoice receipt format from iReceipt:
  // - Left QR Code: Main invoice info (AES encrypted)
  //   Format: [InvoiceNumber][InvoiceDate][RandomNumber][SalesAmount][TotalAmount][BuyerIdentifier][SellerIdentifier][AESEncrypted]
  // - Right QR Code: Item details (unencrypted)
  // - 1D Barcode: Invoice number (unencrypted)
  
  console.log('Processing Taiwan e-invoice receipt...');
  console.log('Image size:', base64Data.length, 'bytes');
  
  // TODO: Implement actual QR code and barcode extraction using:
  // - jsQR for QR code detection
  // - @zxing/library for comprehensive barcode/QR code reading
  // - opencv4nodejs for advanced image processing
  
  // For now, return empty result to indicate no extraction
  // This will trigger the "No QR codes found" error message
  return {
    leftQRCode: '',
    rightQRCode: '',
    barcode: ''
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { qrData, imageBase64, analyzeMultipleCodes, receiptAnalysis } = body

    // Handle Taiwan receipt analysis with multiple QR codes and barcode
    if (receiptAnalysis && analyzeMultipleCodes) {
      return handleTaiwanReceiptAnalysis(body)
    }

    // Handle single QR code analysis (legacy)
    if (!qrData) {
      return NextResponse.json({ error: 'QR code data is required' }, { status: 400 })
    }

    // Check if it's a Taiwan e-invoice
    const isTaiwanInvoice = isTaiwanEInvoice(qrData)
    
    if (!isTaiwanInvoice) {
      return NextResponse.json({
        isTaiwanEInvoice: false,
        message: 'This does not appear to be a Taiwan e-invoice QR code'
      })
    }

    // Decode the Taiwan e-invoice
    const invoiceData = decodeTaiwanEInvoice(qrData)
    
    if (!invoiceData.isValid) {
      return NextResponse.json({
        isTaiwanEInvoice: true,
        isValid: false,
        error: invoiceData.error
      })
    }

    // Extract items for warehouse
    const items = extractItemsFromTaiwanInvoice(invoiceData)

    return NextResponse.json({
      isTaiwanEInvoice: true,
      isValid: true,
      invoiceData: {
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceDate: invoiceData.invoiceDate,
        sellerName: invoiceData.sellerName,
        sellerTaxId: invoiceData.sellerTaxId,
        totalAmount: invoiceData.totalAmount,
        taxAmount: invoiceData.taxAmount
      },
      extractedItems: items,
      message: 'Taiwan e-invoice decoded successfully'
    })

  } catch (error) {
    console.error('Error processing Taiwan e-invoice:', error)
    return NextResponse.json(
      { error: 'Failed to process Taiwan e-invoice' },
      { status: 500 }
    )
  }
}

/**
 * Handle Taiwan receipt analysis with multiple QR codes and barcode
 */
async function handleTaiwanReceiptAnalysis(body: any) {
  const { imageBase64, leftQRCode, rightQRCode, barcode } = body

  try {
    // If we have image data, we would need to extract QR codes and barcode from the image
    // For now, we'll simulate the extraction and use the provided codes
    let extractedCodes = {
      leftQRCode: leftQRCode || '',
      rightQRCode: rightQRCode || '',
      barcode: barcode || ''
    }

    // If we have image data but no extracted codes, try to extract them
    if (imageBase64 && !leftQRCode && !rightQRCode && !barcode) {
      console.log('Processing uploaded image for QR code extraction...')
      console.log('Image data length:', imageBase64.length)
      
      try {
        // Extract QR codes from the uploaded image
        const extractedCodes = await extractQRCodesFromImage(imageBase64)
        
        if (extractedCodes.leftQRCode || extractedCodes.rightQRCode || extractedCodes.barcode) {
          console.log('Successfully extracted codes from image:', extractedCodes)
          extractedCodes.leftQRCode = extractedCodes.leftQRCode || leftQRCode || ''
          extractedCodes.rightQRCode = extractedCodes.rightQRCode || rightQRCode || ''
          extractedCodes.barcode = extractedCodes.barcode || barcode || ''
        } else {
          // No QR codes found in image
          return NextResponse.json({
            isTaiwanEInvoice: true,
            isValid: false,
            error: 'No QR codes found in the uploaded image. Please ensure the image contains clear Taiwan invoice QR codes.',
            message: 'The uploaded image does not contain recognizable QR codes. Please try with a clearer image or enter QR code data manually.'
          })
        }
      } catch (error) {
        console.error('Error processing image:', error)
        return NextResponse.json({
          isTaiwanEInvoice: true,
          isValid: false,
          error: 'Failed to process uploaded image. Please try with a different image or enter QR code data manually.',
          message: 'Image processing failed. Please ensure the image is clear and contains Taiwan invoice QR codes.'
        })
      }
    }

    // Decode the Taiwan receipt with multiple codes
    const receiptData = decodeTaiwanReceipt(extractedCodes)
    
    if (!receiptData.invoiceData.isValid) {
      return NextResponse.json({
        isTaiwanEInvoice: true,
        isValid: false,
        error: receiptData.invoiceData.error,
        extractedCodes,
        message: 'Taiwan receipt analysis completed but no valid invoice data found'
      })
    }

    // Extract items for warehouse
    const items = extractItemsFromTaiwanInvoice(receiptData.invoiceData)

    return NextResponse.json({
      isTaiwanEInvoice: true,
      isValid: true,
      receiptData: {
        leftQRCode: receiptData.leftQRCode,
        rightQRCode: receiptData.rightQRCode,
        barcode: receiptData.barcode
      },
      invoiceData: {
        invoiceNumber: receiptData.invoiceData.invoiceNumber,
        invoiceDate: receiptData.invoiceData.invoiceDate,
        sellerName: receiptData.invoiceData.sellerName,
        sellerTaxId: receiptData.invoiceData.sellerTaxId,
        buyerName: receiptData.invoiceData.buyerName,
        buyerTaxId: receiptData.invoiceData.buyerTaxId,
        totalAmount: receiptData.invoiceData.totalAmount,
        taxAmount: receiptData.invoiceData.taxAmount,
        items: receiptData.invoiceData.items
      },
      extractedItems: items,
      message: 'Taiwan receipt with multiple QR codes and barcode decoded successfully'
    })

  } catch (error) {
    console.error('Error processing Taiwan receipt:', error)
    return NextResponse.json(
      { error: 'Failed to process Taiwan receipt' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Taiwan e-invoice decoder API',
    usage: 'POST with { "qrData": "your_qr_code_data" }',
    features: [
      'Detects Taiwan e-invoice QR codes',
      'Decodes invoice information',
      'Extracts items for warehouse inventory',
      'Supports base64 and raw text formats'
    ]
  })
}
