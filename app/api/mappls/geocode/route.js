import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');
  const token = searchParams.get('token');

  if (!query || !token) {
    return NextResponse.json({ error: 'Missing query or token' }, { status: 400 });
  }

  try {
    const url = `https://atlas.mappls.com/api/places/search/json?query=${encodeURIComponent(query)}&region=IND`;
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
