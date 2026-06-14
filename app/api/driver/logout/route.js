import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  
  // Clear the cookie
  response.cookies.set({
    name: 'driver_token',
    value: '',
    httpOnly: true,
    path: '/',
    expires: new Date(0)
  });

  return response;
}
