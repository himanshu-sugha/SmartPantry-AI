// Smart Appliance API Service (Simulated Samsung SmartThings / LG ThinQ)

export interface SmartApplianceData {
    device_id: string;
    device_type: 'refrigerator' | 'pantry_cam' | 'smart_scale';
    device_name: string;
    last_updated: string;
    items: DetectedItem[];
}

export interface DetectedItem {
    name: string;
    quantity: number;
    unit: string;
    confidence: number;
    location: string; // 'fridge', 'freezer', 'pantry'
    expiry_estimate?: string;
}

// Mock smart appliance data
const MOCK_DEVICES: SmartApplianceData[] = [
    {
        device_id: 'fridge-001',
        device_type: 'refrigerator',
        device_name: 'Samsung Family Hub Refrigerator',
        last_updated: new Date().toISOString(),
        items: [
            {
                name: 'Milk',
                quantity: 1,
                unit: 'gallon',
                confidence: 0.95,
                location: 'fridge',
                expiry_estimate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
            {
                name: 'Eggs',
                quantity: 8,
                unit: 'pcs',
                confidence: 0.92,
                location: 'fridge',
                expiry_estimate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
            {
                name: 'Yogurt',
                quantity: 4,
                unit: 'cups',
                confidence: 0.88,
                location: 'fridge',
                expiry_estimate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
            {
                name: 'Chicken Breast',
                quantity: 2,
                unit: 'lbs',
                confidence: 0.85,
                location: 'freezer',
            },
        ],
    },
    {
        device_id: 'pantry-cam-001',
        device_type: 'pantry_cam',
        device_name: 'Smart Pantry Camera',
        last_updated: new Date().toISOString(),
        items: [
            {
                name: 'Rice',
                quantity: 3,
                unit: 'lbs',
                confidence: 0.90,
                location: 'pantry',
            },
            {
                name: 'Pasta',
                quantity: 2,
                unit: 'boxes',
                confidence: 0.87,
                location: 'pantry',
            },
            {
                name: 'Cereal',
                quantity: 1,
                unit: 'box',
                confidence: 0.93,
                location: 'pantry',
            },
        ],
    },
];

export const SmartApplianceService = {
    // Get all connected devices
    async getDevices(): Promise<SmartApplianceData[]> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 600));
        return MOCK_DEVICES;
    },

    // Get device by ID
    async getDevice(deviceId: string): Promise<SmartApplianceData | null> {
        await new Promise(resolve => setTimeout(resolve, 400));
        return MOCK_DEVICES.find(d => d.device_id === deviceId) || null;
    },

    // Sync inventory from smart appliances
    async syncInventory(): Promise<DetectedItem[]> {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const allItems: DetectedItem[] = [];
        for (const device of MOCK_DEVICES) {
            allItems.push(...device.items);
        }

        return allItems;
    },

    // Get items from specific location
    async getItemsByLocation(location: 'fridge' | 'freezer' | 'pantry'): Promise<DetectedItem[]> {
        await new Promise(resolve => setTimeout(resolve, 500));

        const allItems = MOCK_DEVICES.flatMap(d => d.items);
        return allItems.filter(item => item.location === location);
    },

    // Check device connection status
    async checkDeviceStatus(deviceId: string): Promise<{ connected: boolean; last_sync: string }> {
        await new Promise(resolve => setTimeout(resolve, 300));

        const device = MOCK_DEVICES.find(d => d.device_id === deviceId);
        return {
            connected: !!device,
            last_sync: device?.last_updated || '',
        };
    },

    // Simulate real-time update (webhook simulation)
    async subscribeToUpdates(callback: (item: DetectedItem) => void): Promise<void> {
        // Simulate periodic updates
        setInterval(() => {
            const randomDevice = MOCK_DEVICES[Math.floor(Math.random() * MOCK_DEVICES.length)];
            const randomItem = randomDevice.items[Math.floor(Math.random() * randomDevice.items.length)];
            callback(randomItem);
        }, 30000); // Every 30 seconds
    },
};
