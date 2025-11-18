import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out' });

  response.cookies.set('social_token', '', {
    httpOnly: true,
    path: '/',
    expires: new Date(0),
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
