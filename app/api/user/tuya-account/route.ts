// Tuya Account Management API
// 管理用户的 Tuya 账户信息
// Manage user's Tuya account information

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// GET: 获取当前用户的 Tuya 账户信息
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        tuyaAccount: true,
        tuyaCountryCode: true,
        // Don't return password or token for security
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      hasTuyaAccount: !!user.tuyaAccount,
      tuyaAccount: user.tuyaAccount ? `${user.tuyaAccount.substring(0, 3)}****` : null, // Masked for security
      tuyaCountryCode: user.tuyaCountryCode || '1',
    })
  } catch (error: any) {
    console.error('Error getting Tuya account:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get Tuya account' },
      { status: 500 }
    )
  }
}

// POST: 设置或更新用户的 Tuya 账户
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { tuyaAccount, tuyaPassword, tuyaCountryCode } = body

    if (!tuyaAccount) {
      return NextResponse.json(
        { error: 'Tuya account (email or phone number) is required' },
        { status: 400 }
      )
    }

    if (!tuyaPassword) {
      return NextResponse.json(
        { error: 'Tuya password is required' },
        { status: 400 }
      )
    }

    // Encrypt Tuya password (similar to user credentials)
    const salt = await bcrypt.genSalt(12)
    const encryptedPassword = await bcrypt.hash(tuyaPassword, salt)

    // Update user's Tuya account
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        tuyaAccount: tuyaAccount.trim(),
        tuyaPassword: encryptedPassword,
        tuyaCountryCode: tuyaCountryCode || '1',
        // Clear access token when updating account
        tuyaAccessToken: null,
        tuyaTokenExpiresAt: null,
      },
      select: {
        id: true,
        email: true,
        tuyaAccount: true,
        tuyaCountryCode: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Tuya account saved successfully',
      tuyaAccount: `${updated.tuyaAccount?.substring(0, 3)}****`, // Masked
      tuyaCountryCode: updated.tuyaCountryCode,
    })
  } catch (error: any) {
    console.error('Error saving Tuya account:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save Tuya account' },
      { status: 500 }
    )
  }
}

// DELETE: 删除用户的 Tuya 账户信息
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Clear Tuya account information
    await prisma.user.update({
      where: { id: userId },
      data: {
        tuyaAccount: null,
        tuyaPassword: null,
        tuyaCountryCode: null,
        tuyaAccessToken: null,
        tuyaTokenExpiresAt: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Tuya account removed successfully',
    })
  } catch (error: any) {
    console.error('Error removing Tuya account:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to remove Tuya account' },
      { status: 500 }
    )
  }
}

