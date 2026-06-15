import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

let cachedToken = null;
let tokenExpiry = null;

export async function GET() {
  try {
    const activeApi = await prisma.locationApi.findFirst({
      where: { isActive: true, provider: 'mappls' }
    });

    if (!activeApi || !activeApi.apiKey) {
      return NextResponse.json({ error: 'Mappls API is not configured or active' }, { status: 400 });
    }

    let credentials;
    try {
      credentials = JSON.parse(activeApi.apiKey);
    } catch(e) {
      return NextResponse.json({ error: 'Invalid Mappls API credentials format' }, { status: 400 });
    }

    const { clientId, clientSecret } = credentials;
    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Missing Mappls Client ID or Secret' }, { status: 400 });
    }

    // Check if we have a valid cached token
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
      return NextResponse.json({ access_token: cachedToken });
    }

    // Fetch new token from Mappls
    const response = await fetch('https://outpost.mapmyindia.com/api/security/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      }).toString()
    });

    const data = await response.json();

    if (data.access_token) {
      cachedToken = data.access_token;
      // Subtract 5 minutes from expiry for safety margin
      tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
      return NextResponse.json({ access_token: cachedToken });
    } else {
      console.error("Mappls token error:", data);
      return NextResponse.json({ error: 'Failed to generate Mappls token', details: data }, { status: 500 });
    }

  } catch (error) {
    console.error("Mappls Token API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
