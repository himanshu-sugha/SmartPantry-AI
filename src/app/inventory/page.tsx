
import { InventoryList } from '@/components/inventory/InventoryList';

export const dynamic = 'force-dynamic';

export default function InventoryPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Pantry Inventory</h1>
                    <p className="text-gray-500">Manage your household items and track expiration dates.</p>
                </div>
            </div>
            <InventoryList />
        </div>
    );
}
