import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // x-forwarded-for 헤더에서 클라이언트 IP 가져오기
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : ''

  // localhost IPv4, IPv6 둘 다 허용
//  if (ip !== '127.0.0.1' && ip !== '::1') {
//    return new Response('접근 금지', { status: 403 })
//  }

  return NextResponse.next()
}

