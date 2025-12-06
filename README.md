# SmartPantry AI - Autonomous Home Shopping Agent

---

## What is SmartPantry AI?

SmartPantry AI is an **autonomous home shopping agent** that:

1. **Tracks inventory** with AI-powered categorization
2. **Predicts needs** using ML forecasting (EMA + Seasonality)
3. **Auto-builds shopping carts** with optimal pricing
4. **Requests user approval** before any purchase
5. **Protects privacy** with AES-256-GCM encryption

---

## Features & Implementation

| Feature | How It Works | File/Service |
|---------|--------------|--------------|
| **Inventory Tracking** | Full CRUD with auto-images from Unsplash | `src/services/inventory.ts` |
| **AI Auto-Categorization** | Gemini AI suggests category & unit when adding items | `src/services/gemini.ts` |
| **ML Prediction** | Exponential Moving Average + Day-of-week seasonality | `src/services/forecasting.ts` |
| **Run-out Forecasting** | Predicts days until item runs out based on usage | `src/services/forecasting.ts` |
| **Autonomous Agent** | Monitors consumption, suggests reorders, shows AI thoughts | `src/services/autonomousAgent.ts` |
| **Auto-Build Carts** | Agent selects best-priced products automatically | `src/app/shopping-list/page.tsx` |
| **Approval Modes** | Auto / Semi-Auto / Manual modes for purchases | `src/services/approvalMode.ts` |
| **Spend Caps** | Daily, weekly, monthly spending limits | `src/services/spendControls.ts` |
| **Vendor Allowlists** | Restrict purchases to approved vendors only | `src/services/spendControls.ts` (allowed_vendors) |
| **Audit Log** | Every agent decision logged with timestamps | `src/services/auditLog.ts` |
| **Blockchain Hash** | Audit entries hashed for integrity verification | `src/services/blockchain.ts` |
| **AES-256-GCM Encryption** | All data encrypted with military-grade encryption | `src/services/encryption.ts` |
| **On-Device Storage** | Data never leaves browser (localStorage) | `src/services/secureStorage.ts` |

---

## 4 Input Sources

| Input Method | Technology | How It Works |
|--------------|------------|--------------|
| **Manual Entry** | Gemini AI | Type item name, AI suggests category & unit |
| **Receipt OCR** | Tesseract.js + Gemini | Upload receipt photo, OCR extracts text, AI parses items |
| **Camera AI** | TensorFlow.js | Point camera at product, ML identifies item |
| **Email Parsing** | Gemini AI | Paste order confirmation email, AI extracts all items |

---

## Vendor Sandbox Architecture

Our `VendorAPIService` is a **sandbox-compatible adapter layer** designed for easy integration with real vendor APIs:

```
+---------------------------------------------+
|           VendorAPIService                  |
|      (Unified Product Search API)           |
+---------------------------------------------+
|  [Amazon]     [Walmart]     [Gemini AI]     |
|  Adapter      Adapter       (Active)        |
|  (stub)       (stub)                        |
+---------------------------------------------+
```

| Adapter | File | Status |
|---------|------|--------|
| **Gemini AI** | `src/services/gemini.ts` | Active - Generates realistic products |
| **Amazon** | `src/services/retailerAPI.ts` | Stub - Ready for real sandbox |
| **Walmart** | `src/services/walmartAPI.ts` | Stub - Ready for real sandbox |
| **Mock Database** | `src/app/api/vendor/route.ts` | Fallback when AI unavailable |

**How it works:**
1. User searches for a product (e.g., "Milk")
2. `VendorAPIService.searchProducts()` is called
3. If Gemini configured: AI generates realistic Indian products with brands/prices
4. If Gemini unavailable: Falls back to mock database
5. When real sandbox credentials available: Just enable the Amazon/Walmart adapters

### Why No Real Amazon/Walmart Sandbox?

We could not use real Amazon/Walmart Product Advertising APIs because:
- **Credential Requirements:** Requires approved affiliate/developer accounts with sales history
- **Regional Restrictions:** APIs not fully available in all regions
- **Approval Time:** Account approval takes weeks, not suitable for hackathon timeline

### Our Sandbox Solution: Gemini AI

Instead, we created a **sandbox-equivalent experience** using Gemini AI:

| Real Sandbox | Our AI Sandbox |
|--------------|----------------|
| Returns real products | AI generates realistic Indian products |
| Real prices | AI generates market-accurate prices |
| Real brands | AI uses actual brand names (Amul, Tata, etc.) |
| Rate limited | Faster response times |
| Requires credentials | Just needs Gemini API key |

> **The architecture is production-ready.** When real sandbox credentials become available, enable the stub adapters and the same `VendorAPIService` interface works seamlessly.

---

## Gemini AI Fallbacks

**The app works 100% without Gemini API key.** Every AI feature has a fallback:

| Feature | With Gemini | Without Gemini (Fallback) |
|---------|-------------|---------------------------|
| **Auto-Categorization** | AI suggests category | User selects manually |
| **Receipt OCR** | AI parses items | Tesseract.js OCR shows raw text |
| **Camera Scan** | AI identifies product | TensorFlow.js returns detected text |
| **Email Parsing** | AI extracts items | Pre-parsed sample data used |
| **Vendor Products** | AI generates realistic products | Mock database returns products |
| **Agent Thoughts** | AI witty commentary | Static messages displayed |
| **Shopping Suggestions** | AI recommendations | ML-based suggestions (no AI needed) |

> **Core features (inventory, forecasting, agent, spend caps, audit log, encryption) work fully without any AI.**

---

## Privacy & Security

| Feature | Implementation |
|---------|----------------|
| **Encryption Algorithm** | AES-256-GCM (military-grade) |
| **Key Derivation** | PBKDF2 with 100,000 iterations |
| **Storage Location** | Browser localStorage only |
| **Cloud Dependency** | None - fully offline capable |
| **Data Export** | User can export/delete anytime |

---

## AI Methods (GeminiService)

| Method | Purpose |
|--------|---------|
| `categorizeItem()` | Auto-suggest category & unit for new items |
| `suggestReorderQuantity()` | Calculate optimal reorder amounts |
| `getAgentThought()` | Generate AI commentary for agent panel |
| `parseReceiptText()` | Extract items from OCR text |
| `identifyProduct()` | Identify product from camera scan |
| `enhanceSearchQuery()` | Optimize vendor search queries |
| `getShoppingSuggestions()` | Smart shopping list suggestions |
| `explainPriceValue()` | Explain if product is good value |
| `generateProducts()` | Create realistic vendor products |
| `parseGroceryEmail()` | Parse order confirmation emails |
| `getProductRecommendations()` | Cross-selling suggestions |
| `findSubstitutes()` | Suggest alternatives when out of stock |
| `analyzePriceValue()` | Determine if price is good value (Indian market) |
| `getMealSuggestions()` | Recipe ideas from inventory |
| `parseNaturalCommand()` | Parse natural language commands |

---

## Architecture

```
+-------------------------------------------------------------+
|                    SmartPantry AI                           |
+-------------------------------------------------------------+
|  UI Layer                                                   |
|  [Dashboard] [Inventory] [Shopping List] [Agent Sidebar]    |
+-------------------------------------------------------------+
|  AI Layer (Gemini 2.5 Flash)                               |
|  GeminiService: 15 AI methods with fallbacks               |
+-------------------------------------------------------------+
|  Agent Layer                                                |
|  AutonomousAgentService                                     |
|  - Monitors consumption -> Triggers reorder                 |
|  - Runs ML predictions -> Calculates runout                 |
|  - Checks spend caps -> Validates purchases                 |
|  - Logs all decisions -> Audit trail + Blockchain           |
+-------------------------------------------------------------+
|  Storage Layer (AES-256-GCM Encrypted)                      |
|  localStorage - All data encrypted, never leaves device     |
+-------------------------------------------------------------+
```

---

## Project Structure

```
src/
├── app/                      # Next.js pages
│   ├── page.tsx             # Dashboard
│   ├── inventory/           # Inventory management
│   ├── shopping-list/       # AI shopping
│   └── settings/           # Controls & audit
├── components/
│   ├── agent/              # Agent sidebar
│   ├── inventory/          # Add dialogs, scanners
│   └── layout/             # Header, navigation
├── services/
│   ├── gemini.ts           # 15 AI methods
│   ├── autonomousAgent.ts  # Agent brain
│   ├── forecasting.ts      # ML predictions
│   ├── inventory.ts        # CRUD
│   ├── vendorAPI.ts        # AI sandbox
│   ├── spendControls.ts    # Limits
│   └── secureStorage.ts    # Encryption
└── types/                  # TypeScript
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | Next.js 14, React 18, TypeScript |
| AI | Google Gemini 2.5 Flash |
| ML | Browser-based EMA + Seasonality |
| OCR | Tesseract.js (on-device) |
| Computer Vision | TensorFlow.js |
| Encryption | Web Crypto API (AES-256-GCM) |
| Styling | Tailwind CSS, shadcn/ui |

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/himanshu-sugha/SmartPantry-AI

# 2. Install dependencies
npm install

# 3. Set up Gemini API (optional but recommended)
echo "NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key" > .env.local

# 4. Run development server
npm run dev

# 5. Open http://localhost:3000
```

---

## License

MIT License

---

## Author

Built by Himanshu Sugha

Contact: himanshusugha@gmail.com
