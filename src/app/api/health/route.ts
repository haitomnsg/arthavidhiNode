import { NextResponse } from 'next/server';

/**
 * Health check endpoint for cPanel Node.js selector
 * This must respond quickly without any database or heavy dependencies
 */
export async function GET() {
  return NextResponse.json(
    { 
      status: 'ok',
      timestamp: new Date().toISOString(),
      app: 'ArthaVidhi'
    },
    { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );
}

// Also handle HEAD requests (used by some health checks)
export async function HEAD() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}
