
export type Category = 'Produce' | 'Dairy' | 'Meat' | 'Pantry' | 'Beverages' | 'Household' | 'Other';

export interface InventoryItem {
    id: string;
    name: string;
    category: Category;
    quantity: number;
    unit: string;
    expiry_date?: string;
    image_url?: string;
    user_id: string;
    created_at: string;
    updated_at?: string;
    min_quantity?: number;
}

export interface CreateItemDTO {
    name: string;
    category: Category;
    quantity: number;
    unit: string;
    expiry_date?: string;
    image_url?: string;
    min_quantity?: number;
}
