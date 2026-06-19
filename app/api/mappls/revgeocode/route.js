import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const token = searchParams.get('token');

  if (!lat || !lng || !token) {
    return NextResponse.json({ error: 'Missing lat, lng, or token' }, { status: 400 });
  }

  try {
    const url = `https://atlas.mappls.com/api/places/rev_geocode?lat=${lat}&lng=${lng}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `bearer ${token}`
      }
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
