import { NextRequest, NextResponse } from 'next/server';

// Flipkart Affiliate API proxy route
const FLIPKART_API_BASE = 'https://affiliate-api.flipkart.net/affiliate';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const query = searchParams.get('query');
    const productId = searchParams.get('productId');

    const affiliateId = process.env.FLIPKART_AFFILIATE_ID;
    const affiliateToken = process.env.FLIPKART_AFFILIATE_TOKEN;

    // Check if configured
    if (!affiliateId || !affiliateToken) {
        return NextResponse.json(
            { error: 'Flipkart API not configured', configured: false },
            { status: 503 }
        );
    }

    const headers: Record<string, string> = {
        'Fk-Affiliate-Id': affiliateId,
        'Fk-Affiliate-Token': affiliateToken,
        'Accept': 'application/json',
    };

    try {
        let url = '';

        switch (action) {
            case 'search':
                if (!query) {
                    return NextResponse.json({ error: 'Query required' }, { status: 400 });
                }
                url = `${FLIPKART_API_BASE}/1.0/search.json?query=${encodeURIComponent(query)}&resultCount=20`;
                break;

            case 'product':
                if (!productId) {
                    return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
                }
                url = `${FLIPKART_API_BASE}/1.0/product.json?id=${productId}`;
                break;

            case 'categories':
                url = `${FLIPKART_API_BASE}/api/pinky_chinky.json`;
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Flipkart API error:', response.status, errorText);
            return NextResponse.json(
                { error: 'Flipkart API error', status: response.status },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Flipkart API request failed:', error);
        return NextResponse.json(
            { error: 'Failed to fetch from Flipkart' },
            { status: 500 }
        );
    }
}
