// Email receipt parser service (simulated Gmail API)

export interface EmailReceipt {
    id: string;
    from: string;
    subject: string;
    date: string;
    items: ParsedItem[];
    total: number;
    retailer: 'Amazon' | 'Walmart' | 'Other';
}

export interface ParsedItem {
    name: string;
    quantity: number;
    price: number;
    category?: string;
}

// Mock email receipts
const MOCK_EMAILS: EmailReceipt[] = [
    {
        id: 'email-1',
        from: 'auto-confirm@amazon.com',
        subject: 'Your Amazon.com order #123-4567890-1234567',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        retailer: 'Amazon',
        total: 45.97,
        items: [
            { name: 'Organic Whole Milk', quantity: 2, price: 5.99, category: 'Dairy' },
            { name: 'Large Eggs', quantity: 1, price: 6.99, category: 'Dairy' },
            { name: 'Whole Wheat Bread', quantity: 2, price: 3.99, category: 'Pantry' },
            { name: 'Bananas', quantity: 1, price: 2.49, category: 'Produce' },
        ],
    },
    {
        id: 'email-2',
        from: 'noreply@walmart.com',
        subject: 'Walmart Order Confirmation - Order #9876543210',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        retailer: 'Walmart',
        total: 32.45,
        items: [
            { name: 'Great Value Milk', quantity: 1, price: 4.49, category: 'Dairy' },
            { name: 'Fresh Chicken Breast', quantity: 2, price: 6.99, category: 'Meat' },
            { name: 'Gala Apples', quantity: 1, price: 5.99, category: 'Produce' },
        ],
    },
];

export const EmailParserService = {
    // Fetch recent email receipts (simulated Gmail API)
    async fetchRecentReceipts(days: number = 7): Promise<EmailReceipt[]> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return MOCK_EMAILS.filter(email => new Date(email.date) >= cutoffDate);
    },

    // Parse email content to extract items
    parseEmailContent(emailBody: string): ParsedItem[] {
        // Simulate parsing logic
        const items: ParsedItem[] = [];

        // Simple regex patterns for common receipt formats
        const itemPatterns = [
            /(.+?)\s+\$?([\d.]+)\s+x\s*(\d+)/gi,  // "Item $5.99 x 2"
            /(\d+)\s+x\s+(.+?)\s+\$?([\d.]+)/gi,  // "2 x Item $5.99"
            /(.+?)\s+Qty:\s*(\d+)\s+\$?([\d.]+)/gi, // "Item Qty: 2 $5.99"
        ];

        for (const pattern of itemPatterns) {
            let match;
            while ((match = pattern.exec(emailBody)) !== null) {
                items.push({
                    name: match[1].trim(),
                    quantity: parseInt(match[3] || match[2]),
                    price: parseFloat(match[2] || match[3]),
                });
            }
        }

        return items;
    },

    // Import items from email receipt
    async importFromEmail(emailId: string): Promise<ParsedItem[]> {
        const email = MOCK_EMAILS.find(e => e.id === emailId);
        if (!email) throw new Error('Email not found');

        return email.items;
    },

    // Get all available emails
    async getAvailableEmails(): Promise<EmailReceipt[]> {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_EMAILS;
    },
};
