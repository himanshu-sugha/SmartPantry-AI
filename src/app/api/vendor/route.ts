import { NextRequest, NextResponse } from 'next/server';

// Comprehensive product database simulating real vendor catalog
const PRODUCT_DATABASE = [
    // Dairy
    { id: 'prod-001', name: 'Amul Full Cream Milk 1L', category: 'Dairy', price: 68, mrp: 72, brand: 'Amul', stock: 150, rating: 4.5, reviews: 2341, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200' },
    { id: 'prod-002', name: 'Mother Dairy Toned Milk 1L', category: 'Dairy', price: 56, mrp: 58, brand: 'Mother Dairy', stock: 200, rating: 4.3, reviews: 1892, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200' },
    { id: 'prod-003', name: 'Amul Butter 500g', category: 'Dairy', price: 270, mrp: 285, brand: 'Amul', stock: 80, rating: 4.7, reviews: 5621, image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=200' },
    { id: 'prod-004', name: 'Britannia Cheese Slices 200g', category: 'Dairy', price: 125, mrp: 135, brand: 'Britannia', stock: 60, rating: 4.4, reviews: 1234, image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200' },
    { id: 'prod-005', name: 'Eggs (Pack of 12)', category: 'Dairy', price: 84, mrp: 90, brand: 'Farm Fresh', stock: 300, rating: 4.2, reviews: 876, image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=200' },

    // Bread & Bakery
    { id: 'prod-010', name: 'Britannia Brown Bread 400g', category: 'Bakery', price: 45, mrp: 48, brand: 'Britannia', stock: 100, rating: 4.1, reviews: 2156, image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=200' },
    { id: 'prod-011', name: 'Modern White Bread 800g', category: 'Bakery', price: 55, mrp: 60, brand: 'Modern', stock: 120, rating: 4.0, reviews: 1543, image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=200' },
    { id: 'prod-012', name: 'Britannia Cake Rusk 600g', category: 'Bakery', price: 140, mrp: 150, brand: 'Britannia', stock: 45, rating: 4.6, reviews: 3421, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200' },

    // Fruits & Vegetables
    { id: 'prod-020', name: 'Fresh Bananas 1kg', category: 'Produce', price: 45, mrp: 50, brand: 'Fresh', stock: 200, rating: 4.3, reviews: 876, image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200' },
    { id: 'prod-021', name: 'Red Apples 1kg', category: 'Produce', price: 180, mrp: 200, brand: 'Kashmir', stock: 80, rating: 4.5, reviews: 1234, image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200' },
    { id: 'prod-022', name: 'Fresh Tomatoes 1kg', category: 'Produce', price: 40, mrp: 45, brand: 'Local', stock: 150, rating: 4.0, reviews: 567, image: 'https://images.unsplash.com/photo-1546470427-f5d8d1d0e141?w=200' },
    { id: 'prod-023', name: 'Onions 1kg', category: 'Produce', price: 35, mrp: 40, brand: 'Local', stock: 300, rating: 4.2, reviews: 432, image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=200' },
    { id: 'prod-024', name: 'Potatoes 1kg', category: 'Produce', price: 30, mrp: 35, brand: 'Local', stock: 250, rating: 4.1, reviews: 389, image: 'https://images.unsplash.com/photo-1518977676601-b53f82ber634?w=200' },

    // Rice & Grains
    { id: 'prod-030', name: 'India Gate Basmati Rice 5kg', category: 'Grains', price: 750, mrp: 800, brand: 'India Gate', stock: 50, rating: 4.8, reviews: 8765, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200' },
    { id: 'prod-031', name: 'Fortune Chakki Atta 10kg', category: 'Grains', price: 450, mrp: 480, brand: 'Fortune', stock: 100, rating: 4.5, reviews: 4532, image: 'https://images.unsplash.com/photo-1574323347407-f5e1c6d05a36?w=200' },
    { id: 'prod-032', name: 'Toor Dal 1kg', category: 'Grains', price: 160, mrp: 175, brand: 'Tata', stock: 120, rating: 4.4, reviews: 2341, image: 'https://images.unsplash.com/photo-1585996746125-23c8f3c5c2c7?w=200' },

    // Cooking Oil
    { id: 'prod-040', name: 'Fortune Sunflower Oil 5L', category: 'Oils', price: 750, mrp: 800, brand: 'Fortune', stock: 60, rating: 4.6, reviews: 5678, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200' },
    { id: 'prod-041', name: 'Saffola Gold Oil 1L', category: 'Oils', price: 210, mrp: 225, brand: 'Saffola', stock: 80, rating: 4.5, reviews: 3421, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200' },

    // Spices
    { id: 'prod-050', name: 'MDH Garam Masala 100g', category: 'Spices', price: 85, mrp: 95, brand: 'MDH', stock: 150, rating: 4.7, reviews: 6543, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200' },
    { id: 'prod-051', name: 'Everest Turmeric Powder 200g', category: 'Spices', price: 55, mrp: 60, brand: 'Everest', stock: 200, rating: 4.4, reviews: 2341, image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=200' },
    { id: 'prod-052', name: 'Catch Red Chilli Powder 200g', category: 'Spices', price: 70, mrp: 78, brand: 'Catch', stock: 180, rating: 4.3, reviews: 1876, image: 'https://images.unsplash.com/photo-1599909533025-2e4df9ab03c2?w=200' },

    // Beverages
    { id: 'prod-060', name: 'Tata Tea Gold 500g', category: 'Beverages', price: 280, mrp: 295, brand: 'Tata', stock: 100, rating: 4.6, reviews: 7654, image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=200' },
    { id: 'prod-061', name: 'Nescafe Classic Coffee 200g', category: 'Beverages', price: 550, mrp: 580, brand: 'Nescafe', stock: 60, rating: 4.7, reviews: 5432, image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200' },
    { id: 'prod-062', name: 'Bournvita 500g', category: 'Beverages', price: 245, mrp: 260, brand: 'Cadbury', stock: 80, rating: 4.5, reviews: 4321, image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=200' },

    // Snacks
    { id: 'prod-070', name: 'Lays Classic Salted 52g (Pack of 6)', category: 'Snacks', price: 120, mrp: 130, brand: 'Lays', stock: 200, rating: 4.4, reviews: 3456, image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200' },
    { id: 'prod-071', name: 'Kurkure Masala Munch 90g', category: 'Snacks', price: 20, mrp: 20, brand: 'Kurkure', stock: 300, rating: 4.3, reviews: 2341, image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=200' },
    { id: 'prod-072', name: 'Oreo Biscuits 300g', category: 'Snacks', price: 60, mrp: 65, brand: 'Cadbury', stock: 150, rating: 4.6, reviews: 5678, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=200' },

    // Meat & Seafood
    { id: 'prod-080', name: 'Fresh Chicken Breast 500g', category: 'Meat', price: 250, mrp: 280, brand: 'Fresh', stock: 40, rating: 4.2, reviews: 876, image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200' },
    { id: 'prod-081', name: 'Mutton Curry Cut 500g', category: 'Meat', price: 550, mrp: 600, brand: 'Fresh', stock: 25, rating: 4.4, reviews: 543, image: 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=200' },
    { id: 'prod-082', name: 'Fresh Fish Rohu 500g', category: 'Seafood', price: 180, mrp: 200, brand: 'Fresh', stock: 30, rating: 4.3, reviews: 432, image: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=200' },

    // Personal Care
    { id: 'prod-090', name: 'Dove Soap 100g (Pack of 3)', category: 'Personal Care', price: 165, mrp: 180, brand: 'Dove', stock: 100, rating: 4.5, reviews: 4567, image: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=200' },
    { id: 'prod-091', name: 'Colgate MaxFresh 150g', category: 'Personal Care', price: 95, mrp: 105, brand: 'Colgate', stock: 150, rating: 4.4, reviews: 3421, image: 'https://images.unsplash.com/photo-1559304822-9eb2813c9d63?w=200' },

    // Household
    { id: 'prod-100', name: 'Surf Excel Matic 4kg', category: 'Household', price: 750, mrp: 800, brand: 'Surf', stock: 50, rating: 4.6, reviews: 6789, image: 'https://images.unsplash.com/photo-1585441695325-ea13b710d15b?w=200' },
    { id: 'prod-101', name: 'Vim Dishwash Bar 500g', category: 'Household', price: 45, mrp: 50, brand: 'Vim', stock: 200, rating: 4.3, reviews: 2341, image: 'https://images.unsplash.com/photo-1585441695325-ea13b710d15b?w=200' },
];

// In-memory cart storage (would be per-session in real app)
const carts: Map<string, { items: any[], createdAt: number }> = new Map();

// In-memory orders storage
const orders: Map<string, any> = new Map();

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
        case 'search': {
            const query = searchParams.get('query')?.toLowerCase() || '';
            const category = searchParams.get('category');
            const minPrice = parseFloat(searchParams.get('minPrice') || '0');
            const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999');
            const limit = parseInt(searchParams.get('limit') || '20');
            const offset = parseInt(searchParams.get('offset') || '0');

            let results = PRODUCT_DATABASE.filter(p => {
                const matchesQuery = !query ||
                    p.name.toLowerCase().includes(query) ||
                    p.category.toLowerCase().includes(query) ||
                    p.brand.toLowerCase().includes(query);
                const matchesCategory = !category || p.category.toLowerCase() === category.toLowerCase();
                const matchesPrice = p.price >= minPrice && p.price <= maxPrice;
                return matchesQuery && matchesCategory && matchesPrice;
            });

            // SMART FALLBACK: Generate dynamic products if no exact match found
            if (results.length === 0 && query) {
                const capitalizedQuery = query.charAt(0).toUpperCase() + query.slice(1);
                const basePrice = 50 + Math.floor(Math.random() * 200);

                // Detect if it's likely a grocery/food item
                const foodKeywords = ['milk', 'bread', 'rice', 'dal', 'oil', 'sugar', 'salt', 'flour', 'vegetable', 'fruit', 'meat', 'fish', 'egg', 'paneer', 'curd', 'butter', 'ghee', 'masala', 'spice', 'tea', 'coffee', 'atta', 'juice', 'water'];
                const isLikelyFood = foodKeywords.some(kw => query.includes(kw)) || query.length < 8;

                results = [
                    {
                        id: `gen-${query}-001`,
                        name: `${capitalizedQuery} - Premium Quality`,
                        category: 'Pantry',
                        price: basePrice,
                        mrp: Math.round(basePrice * 1.1),
                        brand: 'Best Choice',
                        stock: 50,
                        rating: 4.2,
                        reviews: Math.floor(Math.random() * 500 + 100),
                        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200',
                    },
                    {
                        id: `gen-${query}-002`,
                        name: `${capitalizedQuery} - Value Pack`,
                        category: 'Pantry',
                        price: Math.round(basePrice * 0.85),
                        mrp: basePrice,
                        brand: 'Smart Saver',
                        stock: 100,
                        rating: 4.0,
                        reviews: Math.floor(Math.random() * 300 + 50),
                        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200',
                    },
                    {
                        id: `gen-${query}-003`,
                        name: isLikelyFood ? `Fresh ${capitalizedQuery}` : `${capitalizedQuery} - Premium Edition`,
                        category: isLikelyFood ? 'Fresh' : 'General',
                        price: Math.round(basePrice * 1.3),
                        mrp: Math.round(basePrice * 1.5),
                        brand: isLikelyFood ? 'Farm Fresh' : 'Top Brand',
                        stock: 30,
                        rating: 4.5,
                        reviews: Math.floor(Math.random() * 200 + 50),
                        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200',
                    },
                ];
            }

            const total = results.length;
            results = results.slice(offset, offset + limit);

            return NextResponse.json({
                success: true,
                query,
                total,
                limit,
                offset,
                products: results.map(p => ({
                    ...p,
                    inStock: p.stock > 0,
                    discount: Math.round(((p.mrp - p.price) / p.mrp) * 100),
                })),
            });
        }

        case 'product': {
            const productId = searchParams.get('id');
            const product = PRODUCT_DATABASE.find(p => p.id === productId);

            if (!product) {
                return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
            }

            return NextResponse.json({
                success: true,
                product: {
                    ...product,
                    inStock: product.stock > 0,
                    discount: Math.round(((product.mrp - product.price) / product.mrp) * 100),
                },
            });
        }

        case 'categories': {
            const categories = [...new Set(PRODUCT_DATABASE.map(p => p.category))];
            return NextResponse.json({
                success: true,
                categories: categories.map(cat => ({
                    name: cat,
                    count: PRODUCT_DATABASE.filter(p => p.category === cat).length,
                })),
            });
        }

        case 'trending': {
            const trending = [...PRODUCT_DATABASE]
                .sort((a, b) => b.reviews - a.reviews)
                .slice(0, 10);

            return NextResponse.json({
                success: true,
                products: trending.map(p => ({
                    ...p,
                    inStock: p.stock > 0,
                    discount: Math.round(((p.mrp - p.price) / p.mrp) * 100),
                })),
            });
        }

        case 'cart': {
            const cartId = searchParams.get('cartId');
            if (!cartId) {
                return NextResponse.json({ success: false, error: 'Cart ID required' }, { status: 400 });
            }

            const cart = carts.get(cartId);
            if (!cart) {
                return NextResponse.json({
                    success: true,
                    cart: { id: cartId, items: [], total: 0, itemCount: 0 }
                });
            }

            const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            return NextResponse.json({
                success: true,
                cart: {
                    id: cartId,
                    items: cart.items,
                    total,
                    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
                },
            });
        }

        case 'order': {
            const orderId = searchParams.get('orderId');
            if (!orderId) {
                return NextResponse.json({ success: false, error: 'Order ID required' }, { status: 400 });
            }

            const order = orders.get(orderId);
            if (!order) {
                return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
            }

            return NextResponse.json({ success: true, order });
        }

        default:
            return NextResponse.json({
                success: false,
                error: 'Invalid action. Use: search, product, categories, trending, cart, order'
            }, { status: 400 });
    }
}

export async function POST(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    switch (action) {
        case 'cart/add': {
            const { cartId, productId, quantity = 1 } = body;

            if (!cartId || !productId) {
                return NextResponse.json({ success: false, error: 'cartId and productId required' }, { status: 400 });
            }

            const product = PRODUCT_DATABASE.find(p => p.id === productId);
            if (!product) {
                return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
            }

            if (product.stock < quantity) {
                return NextResponse.json({ success: false, error: 'Insufficient stock' }, { status: 400 });
            }

            let cart = carts.get(cartId);
            if (!cart) {
                cart = { items: [], createdAt: Date.now() };
                carts.set(cartId, cart);
            }

            const existingItem = cart.items.find(item => item.productId === productId);
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.items.push({
                    productId,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity,
                });
            }

            const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            return NextResponse.json({
                success: true,
                message: 'Item added to cart',
                cart: {
                    id: cartId,
                    items: cart.items,
                    total,
                    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
                },
            });
        }

        case 'cart/update': {
            const { cartId, productId, quantity } = body;

            const cart = carts.get(cartId);
            if (!cart) {
                return NextResponse.json({ success: false, error: 'Cart not found' }, { status: 404 });
            }

            const itemIndex = cart.items.findIndex(item => item.productId === productId);
            if (itemIndex === -1) {
                return NextResponse.json({ success: false, error: 'Item not in cart' }, { status: 404 });
            }

            if (quantity <= 0) {
                cart.items.splice(itemIndex, 1);
            } else {
                cart.items[itemIndex].quantity = quantity;
            }

            const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            return NextResponse.json({
                success: true,
                cart: {
                    id: cartId,
                    items: cart.items,
                    total,
                    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
                },
            });
        }

        case 'cart/clear': {
            const { cartId } = body;
            carts.delete(cartId);
            return NextResponse.json({ success: true, message: 'Cart cleared' });
        }

        case 'checkout': {
            const { cartId, shippingAddress, paymentMethod = 'cod' } = body;

            const cart = carts.get(cartId);
            if (!cart || cart.items.length === 0) {
                return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400 });
            }

            const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            const order = {
                id: orderId,
                items: [...cart.items],
                total,
                status: 'confirmed',
                paymentMethod,
                shippingAddress: shippingAddress || 'Default Address',
                createdAt: new Date().toISOString(),
                estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            };

            orders.set(orderId, order);
            carts.delete(cartId); // Clear cart after checkout

            return NextResponse.json({
                success: true,
                message: 'Order placed successfully',
                order,
            });
        }

        default:
            return NextResponse.json({
                success: false,
                error: 'Invalid action. Use: cart/add, cart/update, cart/clear, checkout'
            }, { status: 400 });
    }
}
