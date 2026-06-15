import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function fetchMapplsToken(clientId, clientSecret) {
  const postData = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret
  }).toString();

  const res = await fetch('https://outpost.mapmyindia.com/api/security/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: postData
  });

  if (!res.ok) {
    throw new Error('Failed to fetch Mappls token');
  }

  return res.json();
}

export async function GET() {
  try {
    const activeApi = await prisma.locationApi.findFirst({
      where: { isActive: true, provider: 'mappls' }
    });

    if (!activeApi || !activeApi.apiKey) {
      return NextResponse.json({ error: 'Mappls API is not configured or active' }, { status: 400 });
    }

    let creds;
    try {
      creds = JSON.parse(activeApi.apiKey);
    } catch(e) {
      // Legacy fallback if it was saved as static string
      return NextResponse.json({ access_token: activeApi.apiKey });
    }

    if (!creds.clientId || !creds.clientSecret) {
       return NextResponse.json({ error: 'Invalid Mappls credentials format' }, { status: 400 });
    }

    const tokenData = await fetchMapplsToken(creds.clientId, creds.clientSecret);
    return NextResponse.json(tokenData);

  } catch (error) {
    console.error("Mappls Token API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.clientId || !body.clientSecret) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }
    const tokenData = await fetchMapplsToken(body.clientId, body.clientSecret);
    return NextResponse.json(tokenData);
  } catch(error) {
    return NextResponse.json({ error: 'Failed to fetch Mappls token' }, { status: 500 });
  }
}
