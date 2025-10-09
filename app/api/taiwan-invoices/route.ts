import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseTaiwanInvoiceToDatabase } from '@/lib/taiwan-einvoice-decoder'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { invoiceData } = body

    if (!invoiceData) {
      return NextResponse.json({ error: 'Invoice data is required' }, { status: 400 })
    }

    // Parse invoice data to database format
    const parsedInvoice = parseTaiwanInvoiceToDatabase(invoiceData)
    
    if (!parsedInvoice) {
      return NextResponse.json({ error: 'Invalid invoice data' }, { status: 400 })
    }

    // Get user's household
    const household = await prisma.household.findFirst({
      where: {
        members: {
          some: {
            userId: (session?.user as any)?.id
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    // Create Taiwan invoice record (for now, we'll store it as a regular item with special category)
    const invoiceItem = await prisma.item.create({
      data: {
        name: `台灣發票 - ${parsedInvoice.sellerName}`,
        description: `發票號碼: ${parsedInvoice.invoiceNumber}, 日期: ${parsedInvoice.invoiceDate}, 總金額: $${parsedInvoice.totalAmount}`,
        quantity: 1,
        minQuantity: 0,
        qrCode: `TAIWAN_INVOICE_${parsedInvoice.invoiceNumber}`, // Store as QR code for reference
        householdId: household.id,
        addedById: (session?.user as any)?.id,
        aiDescription: JSON.stringify({
          type: 'taiwan_invoice',
          invoiceData: parsedInvoice,
          originalData: invoiceData
        })
      }
    })

    // Log the invoice creation

    return NextResponse.json({
      success: true,
      item: invoiceItem,
      invoiceData: parsedInvoice,
      message: 'Taiwan invoice saved successfully'
    })

  } catch (error) {
    console.error('Error saving Taiwan invoice:', error)
    return NextResponse.json(
      { error: 'Failed to save Taiwan invoice' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's household
    const household = await prisma.household.findFirst({
      where: {
        members: {
          some: {
            userId: (session?.user as any)?.id
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    // Get Taiwan invoice items
    const taiwanInvoices = await prisma.item.findMany({
      where: {
        householdId: household.id,
        qrCode: {
          startsWith: 'TAIWAN_INVOICE_'
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Parse the invoice data from aiDescription
    const parsedInvoices = taiwanInvoices.map(item => {
      try {
        const parsed = JSON.parse(item.aiDescription || '{}')
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          createdAt: item.createdAt,
          invoiceData: parsed.invoiceData
        }
      } catch (error) {
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          createdAt: item.createdAt,
          invoiceData: null
        }
      }
    })

    return NextResponse.json({
      invoices: parsedInvoices,
      count: parsedInvoices.length
    })

  } catch (error) {
    console.error('Error fetching Taiwan invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Taiwan invoices' },
      { status: 500 }
    )
  }
}
