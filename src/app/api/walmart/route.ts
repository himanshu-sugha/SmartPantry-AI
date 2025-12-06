import { NextRequest, NextResponse } from 'next/server';

// Walmart API proxy route to hide credentials from client
// This runs server-side only

const WALMART_API_BASE = 'https://developer.api.walmart.com/api-proxy/service/affil/product/v2';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const query = searchParams.get('query');
    const itemId = searchParams.get('itemId');
    const upc = searchParams.get('upc');

    const consumerId = process.env.WALMART_CONSUMER_ID;
    const privateKey = process.env.WALMART_PRIVATE_KEY;

    // Check if configured
    if (!consumerId || !privateKey) {
        return NextResponse.json(
            { error: 'Walmart API not configured', configured: false },
            { status: 503 }
        );
    }

    // Generate timestamp for auth
    const timestamp = Date.now().toString();

    // For Walmart Affiliate API v2, we use simple API key auth
    const headers: Record<string, string> = {
        'Accept': 'application/json',
    };

    try {
        let url = '';

        switch (action) {
            case 'search':
                if (!query) {
                    return NextResponse.json({ error: 'Query required' }, { status: 400 });
                }
                url = `${WALMART_API_BASE}/search?apiKey=${consumerId}&query=${encodeURIComponent(query)}&format=json&numItems=20`;
                break;

            case 'lookup':
                if (!itemId) {
                    return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
                }
                url = `${WALMART_API_BASE}/items/${itemId}?apiKey=${consumerId}&format=json`;
                break;

            case 'upc':
                if (!upc) {
                    return NextResponse.json({ error: 'UPC required' }, { status: 400 });
                }
                url = `${WALMART_API_BASE}/items?apiKey=${consumerId}&upc=${upc}&format=json`;
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Walmart API error:', response.status, errorText);
            return NextResponse.json(
                { error: 'Walmart API error', status: response.status },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Walmart API request failed:', error);
        return NextResponse.json(
            { error: 'Failed to fetch from Walmart' },
            { status: 500 }
        );
    }
}
