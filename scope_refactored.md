# DISCOVER SMEs — WHATSAPP COMMERCE CONVERSATION ENGINE

## Expert Engineering Specification (Refactored for Existing Project)

---

# PROJECT OVERVIEW

Discover Festac currently contains these vendor dashboard features:

* My Bookings
* Edit profile
* Full analytics
* Get verified
* Boost listing
* Income manager
* Expense manager
* Invoice manager
* Financial reports
* CRM manager
* Inventory manager
* Tax manager
* Chatbot settings
* FAQ manager
* Chat monitor
* Cost monitor
* Marketing tools

**EXISTING INFRASTRUCTURE:**
- Rule-based chatbot system (ChatbotSettings, ChatbotRule, ChatbotSession)
- WhatsApp integration via Facebook Cloud API
- Twilio middleware with cost control system
- AI commerce service (OpenAI integration)
- Comprehensive vendor, product, service, FAQ models
- Customer CRM with lead qualification
- Message logging with provider support (Facebook/Twilio)

**PURPOSE OF THIS REFACTOR:**
Enhance the existing conversation engine to be a pure rule-based system that consumes existing Discover Festac data and exposes it through WhatsApp using Twilio as the primary provider. Remove AI dependencies while maintaining the multi-tenant architecture and vendor-programmable rules.

---

# CORE OBJECTIVE

Allow customers to:

* Discover products
* Discover services
* Ask business questions
* Request pricing
* Request images
* View business information
* Contact vendors
* Escalate to human operators

via WhatsApp using a **purely rule-based conversation engine**.

Every vendor should automatically receive a dedicated chatbot instance powered by their existing data.

**NO OpenAI. NO LLMs. NO AI APIs.**

Rule-based architecture only with enhanced fuzzy matching using Fuse.js.

---

# MULTI-TENANT REQUIREMENTS

The system already supports unlimited vendors through the existing vendorId scoping.

Every chatbot interaction must be isolated using:

**vendorId**

Every query, lookup, conversation and response must be scoped to a single vendor.

**CURRENT IMPLEMENTATION:**
- ChatbotRule already has vendorId field
- ChatbotSession already has vendorId field
- ChatbotSettings already has vendorId field
- All services already enforce vendor isolation

**ENHANCEMENT NEEDED:**
- Add vendorId to all conversation-related queries
- Ensure row-level authorization on all conversation endpoints

---

# HIGH LEVEL ARCHITECTURE (ADAPTED)

```
Customer WhatsApp
│
▼
Twilio WhatsApp API (Primary Provider)
│
▼
Webhook Controller (whatsapp/webhook.service.ts)
│
▼
Conversation Engine (chatbot.service.ts - Enhanced)
│
┌──────┼─────────────┬──────────┐
▼      ▼             ▼          ▼
FAQ    Product      Service    Workflow
Engine Engine      Engine     Engine
│
▼
Discover Festac Existing Modules
│
▼
PostgreSQL
```

**EXISTING COMPONENTS TO LEVERAGE:**
- `chatbot.service.ts` - Core rule-based engine
- `whatsapp/webhook.service.ts` - WhatsApp webhook handler
- `twilio.service.ts` - Twilio integration
- `cost-control` module - Message cost control
- Prisma models: Vendor, Product, Service, VendorFaq, Customer, Message

---

# CRITICAL DESIGN PRINCIPLE

**DO NOT DUPLICATE DATA.**

Conversation Engine must query existing modules.

**EXISTING DATA TO CONSUME:**
- Products → Use existing `Product` model
- Services → Use existing `Service` model
- FAQs → Use existing `VendorFaq` model
- Vendors → Use existing `Vendor` model
- Customers → Use existing `Customer` model
- Inventory → Use existing `InventoryItem` model

**CONVERSATION-SPECIFIC TABLES ONLY:**
- ChatbotSettings (already exists)
- ChatbotRule (already exists)
- ChatbotSession (already exists)
- Message (already exists)

---

# DATABASE SCHEMA ENHANCEMENTS

## Existing Models (No Changes Needed)

### ChatbotSettings
```prisma
model ChatbotSettings {
  id                  String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  vendorId            String   @unique @db.Uuid
  chatbotEnabled      Boolean  @default(true)
  greetingMessage     String?  @db.Text
  fallbackMessage     String?  @db.Text
  humanHandoffMessage String? @db.Text
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  vendor              Vendor   @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  rules               ChatbotRule[]
  sessions            ChatbotSession[]
}
```

### ChatbotRule
```prisma
model ChatbotRule {
  id                String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  vendorId          String           @db.Uuid
  ruleType          ChatbotRuleType
  keyword           String
  questionPattern   String?          @db.Text
  response          String           @db.Text
  priority          Int              @default(0)
  isActive          Boolean          @default(true)
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  vendor            Vendor           @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  settings          ChatbotSettings  @relation(fields: [vendorId], references: [id], onDelete: Cascade)
}
```

### ChatbotSession
```prisma
model ChatbotSession {
  id                String                @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  vendorId          String                @db.Uuid
  customerPhone     String
  botActive         Boolean               @default(true)
  humanTakeover     Boolean               @default(false)
  sessionStatus     ChatbotSessionStatus  @default(ACTIVE)
  lastMessage       String?               @db.Text
  lastMessageAt     DateTime?
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt
  vendor            Vendor                @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  settings          ChatbotSettings       @relation(fields: [vendorId], references: [id], onDelete: Cascade)
}
```

### Message
```prisma
model Message {
  id             String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  vendorId       String        @db.Uuid
  fromPhone      String
  toPhone        String
  direction      MessageDirection
  content        String
  messageType    String        @default("text")
  whatsappMsgId  String?       @unique
  status         MessageStatus @default(SENT)
  isAiGenerated  Boolean       @default(false)
  intent         String?
  provider       MessageProvider @default(FACEBOOK)
  twilioSid      String?       @unique
  twilioStatus   String?
  priority       MessagePriority @default(NORMAL)
  createdAt      DateTime      @default(now())
  vendor         Vendor        @relation(fields: [vendorId], references: [id])
}
```

## Schema Enhancements Needed

### Add to ChatbotSession
```prisma
model ChatbotSession {
  // ... existing fields
  
  // NEW FIELDS
  currentState    ConversationState  @default(WELCOME)
  assignedOperatorId String?        @db.Uuid
  conversationContext Json?         // Store context for multi-turn conversations
  
  // NEW RELATION
  assignedOperator User?           @relation("SessionOperator", fields: [assignedOperatorId], references: [id])
}
```

### Add to ChatbotSettings
```prisma
model ChatbotSettings {
  // ... existing fields
  
  // NEW FIELDS
  offlineMessage          String?   @db.Text
  handoffEnabled          Boolean   @default(true)
  businessHoursEnabled    Boolean   @default(false)
  businessHours           Json?     // Business hours configuration
  fuzzyMatchingEnabled    Boolean   @default(true)
  fuzzyThreshold         Float     @default(0.3)
}
```

### Add New Enum
```prisma
enum ConversationState {
  WELCOME
  MENU
  FAQ_SEARCH
  PRODUCT_SEARCH
  SERVICE_SEARCH
  WAITING_FOR_OPERATOR
  HUMAN_CHAT
  BOT_RESUMED
  CLOSED
}
```

### Add to User Model
```prisma
model User {
  // ... existing fields
  
  // NEW RELATION
  assignedSessions ChatbotSession[]  @relation("SessionOperator")
}
```

---

# CONVERSATION STATES

Conversation Engine must support:

**WELCOME** - Initial greeting
**MENU** - Main menu navigation
**FAQ_SEARCH** - Searching FAQs
**PRODUCT_SEARCH** - Searching products
**SERVICE_SEARCH** - Searching services
**WAITING_FOR_OPERATOR** - Awaiting human handoff
**HUMAN_CHAT** - Active human conversation
**BOT_RESUMED** - Bot resumed after handoff
**CLOSED** - Conversation ended

Store current state on `ChatbotSession.currentState`.

---

# MESSAGE FLOW (ENHANCED)

```
Incoming WhatsApp Message (Twilio)
│
▼
Webhook Receives Message (whatsapp/webhook.service.ts)
│
▼
Identify Vendor (via Twilio phone number mapping)
│
▼
Load/Create ChatbotSession
│
▼
Determine Current State (ChatbotSession.currentState)
│
▼
Execute State Handler (chatbot.service.ts - enhanced)
│
▼
Return Response via Twilio
```

---

# VENDOR IDENTIFICATION

**CURRENT IMPLEMENTATION:**
- Uses WhatsApp phone number to identify vendor
- Vendor has `whatsappPhone` field

**ENHANCEMENT:**
- Support dedicated Twilio numbers per vendor
- Support shared Twilio number with vendor context
- Add vendor phone mapping table if needed

**ONLY OPTION: Dedicated Twilio Number**
- Each vendor gets unique Twilio number
- Direct mapping: phone → vendor

---

# FAQ ENGINE (ENHANCED)

**EXISTING DATA:**
- `VendorFaq` model already exists
- FAQ manager in vendor dashboard

**ENHANCEMENT:**
Create `FaqSearchService` in `src/services/faq-search.service.ts`

**Responsibilities:**
- Keyword matching (existing)
- Fuzzy matching using Fuse.js (NEW)
- Synonym matching (NEW)
- Vendor-scoped search (existing)

**Example:**
```
Customer: What time do you open?
System: Searches Vendor FAQs with fuzzy matching
Returns: Opening hours FAQ answer
```

**Implementation:**
```typescript
// src/services/faq-search.service.ts
import Fuse from 'fuse.js';

export class FaqSearchService {
  async searchFaqs(vendorId: string, query: string) {
    const faqs = await prisma.vendorFaq.findMany({
      where: { vendorId }
    });
    
    const fuse = new Fuse(faqs, {
      keys: ['question', 'answer'],
      threshold: 0.3,
      includeScore: true
    });
    
    const results = fuse.search(query);
    return results;
  }
}
```

---

# PRODUCT ENGINE (ENHANCED)

**EXISTING DATA:**
- `Product` model already exists
- Product manager in vendor dashboard

**ENHANCEMENT:**
Create `ProductSearchService` in `src/services/product-search.service.ts`

**Capabilities:**
- Search by name (existing)
- Search by category (existing)
- Search by tags (existing)
- Search by keyword (existing)
- Fuzzy matching using Fuse.js (NEW)

**Example:**
```
Customer: Do you sell rice?
System: Searches Vendor Products with fuzzy matching
Returns: Matching products with prices, images, availability
```

**Implementation:**
```typescript
// src/services/product-search.service.ts
import Fuse from 'fuse.js';

export class ProductSearchService {
  async searchProducts(vendorId: string, query: string) {
    const products = await prisma.product.findMany({
      where: { 
        vendorId,
        isAvailable: true 
      }
    });
    
    const fuse = new Fuse(products, {
      keys: ['name', 'description', 'tags'],
      threshold: 0.3,
      includeScore: true
    });
    
    const results = fuse.search(query);
    return results;
  }
}
```

---

# PRODUCT RESPONSE FORMAT

**EXISTING DATA:**
- Product has: name, price, description, images, isAvailable

**RESPONSE FORMAT:**
```
Product Name: [name]
Price: [price] [currency]
Description: [short description]
Availability: [In Stock / Out of Stock]
[Image URL if available]
```

**Twilio media attachment support required.**

---

# SERVICE ENGINE (ENHANCED)

**EXISTING DATA:**
- `Service` model already exists
- Service manager in vendor dashboard

**ENHANCEMENT:**
Create `ServiceSearchService` in `src/services/service-search.service.ts`

**Capabilities:**
- Search services (existing)
- Retrieve pricing (existing)
- Retrieve descriptions (existing)
- Fuzzy matching using Fuse.js (NEW)

**Implementation:**
```typescript
// src/services/service-search.service.ts
import Fuse from 'fuse.js';

export class ServiceSearchService {
  async searchServices(vendorId: string, query: string) {
    const services = await prisma.service.findMany({
      where: { 
        vendorId,
        isAvailable: true 
      }
    });
    
    const fuse = new Fuse(services, {
      keys: ['name', 'description'],
      threshold: 0.3,
      includeScore: true
    });
    
    const results = fuse.search(query);
    return results;
  }
}
```

---

# KEYWORD ENGINE (ENHANCED)

**EXISTING IMPLEMENTATION:**
- ChatbotRule has keyword field
- Simple exact/partial matching in chatbot.service.ts

**ENHANCEMENT:**
Enhance keyword matching in `chatbot.service.ts` with:
- Fuzzy matching using Fuse.js
- Synonym support
- Multi-keyword matching

**Example mappings:**
```
PRODUCT, PRODUCTS, BUY, PRICE, ITEM → PRODUCT_SEARCH
SERVICE, SERVICES, BOOK, CONSULTATION → SERVICE_SEARCH
HELP, AGENT, HUMAN, SUPERVISOR → HANDOFF
```

---

# FUZZY MATCHING (NEW)

**IMPLEMENTATION:**
Add Fuse.js to project:

```bash
npm install fuse.js
npm install --save-dev @types/fuse.js
```

**Use for:**
- Products (ProductSearchService)
- Services (ServiceSearchService)
- FAQs (FaqSearchService)
- Keywords (enhanced in ChatbotService)

**Configuration:**
```typescript
{
  threshold: 0.3,
  includeScore: true,
  keys: ['name', 'description', 'tags']
}
```

---

# MEDIA DELIVERY

**EXISTING CAPABILITY:**
- Message model supports mediaUrl
- Twilio service can handle media

**SUPPORT:**
- Images (Product.images, Service.images)
- PDFs (catalogs, price lists)
- Videos (product demos)

**Use Twilio Media API.**

---

# HUMAN HANDOFF SYSTEM (ENHANCED)

**EXISTING IMPLEMENTATION:**
- ChatbotSession has humanTakeover field
- ChatbotService has takeoverSession/resumeSession methods
- Vendor dashboard has handoff controls

**ENHANCEMENT:**
- Add assignedOperatorId to ChatbotSession
- Add operator assignment logic
- Add business hours check
- Add operator availability tracking

**Customer triggers:**
- Types: AGENT, HUMAN, HELP, SUPPORT
- Or clicks button (interactive messages)

**System flow:**
```
customer requests human
→ conversation.status = WAITING_FOR_OPERATOR
→ Assign least busy operator
→ Notify operator via dashboard
→ Operator accepts → HUMAN_CHAT
```

---

# OPERATOR ASSIGNMENT

**EXISTING ROLES:**
- VENDOR (business owner)
- MODERATOR (platform moderator)
- SUPER_ADMIN

**ENHANCEMENT:**
Add operator roles and assignment logic:

**Roles:**
- Owner (Vendor)
- Staff (Vendor staff)
- Support Agent (Vendor support)
- Manager (Vendor manager)

**Assignment strategies:**
- Least Busy Operator
- Round Robin Assignment
- Skill-based Assignment

---

# OPERATOR DASHBOARD (ENHANCEMENT)

**EXISTING:**
- Vendor dashboard with chat monitor
- Chatbot settings page
- FAQ manager

**ENHANCEMENT:**
Create dedicated operator dashboard at `/dashboard/messages`:

**Features:**
- Conversation List (per vendor)
- Unread Count
- Live Chat Interface
- Media Support
- Customer Profile (link to existing CRM)
- Transfer Chat
- Resume Bot
- Close Conversation
- Operator Status (online/offline)

---

# REALTIME REQUIREMENTS (NEW)

**IMPLEMENTATION:**
Add Socket.IO for realtime updates:

```bash
npm install socket.io
npm install --save-dev @types/socket.io
```

**Events:**
- message_received
- message_sent
- conversation_assigned
- operator_joined
- operator_left
- conversation_closed
- bot_resumed
- operator_status_changed

**Implementation:**
```typescript
// src/services/socket.service.ts
import { Server } from 'socket.io';

export class SocketService {
  private io: Server;
  
  constructor() {
    this.io = new Server(server, {
      cors: { origin: process.env.FRONTEND_URL }
    });
  }
  
  emitToVendor(vendorId: string, event: string, data: any) {
    this.io.to(`vendor:${vendorId}`).emit(event, data);
  }
}
```

---

# RESUME BOT FEATURE (ENHANCED)

**EXISTING:**
- resumeSession method in ChatbotService
- Resume Bot button in dashboard

**ENHANCEMENT:**
- Add state transition logic
- Clear operator assignment
- Reset conversation state to MENU

**Flow:**
```
Operator clicks "Resume Automation"
→ conversation.status = BOT_RESUMED
→ conversation.assignedOperatorId = null
→ Conversation Engine takes over
```

---

# BUSINESS HOURS SUPPORT (NEW)

**IMPLEMENTATION:**
Add to ChatbotSettings:
```prisma
businessHoursEnabled Boolean @default(false)
businessHours Json? // Business hours configuration
```

**Configuration:**
```json
{
  "monday": { "open": "09:00", "close": "18:00" },
  "tuesday": { "open": "09:00", "close": "18:00" },
  // ... etc
  "timezone": "Africa/Lagos"
}
```

**Logic:**
```typescript
// src/services/business-hours.service.ts
export class BusinessHoursService {
  isWithinBusinessHours(vendorId: string): boolean {
    const settings = await prisma.chatbotSettings.findUnique({
      where: { vendorId }
    });
    
    if (!settings.businessHoursEnabled) return true;
    
    // Check current time against business hours
    // Return true/false
  }
}
```

**If outside business hours:**
- Return offline message
- Offer lead capture

---

# ANALYTICS (ENHANCEMENT)

**EXISTING:**
- AnalyticsEvent model
- Vendor analytics in dashboard

**ENHANCEMENT:**
Create Conversation Analytics Module:

**Metrics:**
- Total Conversations (per vendor)
- Bot Resolution Rate
- Human Handoff Rate
- Average Response Time
- Most Asked Questions (from FAQ searches)
- Most Viewed Products (from product searches)
- Most Requested Services (from service searches)
- Daily Conversations
- Monthly Conversations

**Implementation:**
```typescript
// src/services/conversation-analytics.service.ts
export class ConversationAnalyticsService {
  async getVendorMetrics(vendorId: string, period: string) {
    // Query ChatbotSession, Message, and usage logs
    // Return analytics metrics
  }
}
```

---

# SECURITY

**EXISTING:**
- Vendor authentication middleware
- Row-level authorization on vendor data

**ENHANCEMENT:**
- Ensure every query verifies vendorId
- Never allow cross-tenant data access
- Apply row-level authorization checks on all conversation endpoints
- Add rate limiting on webhook endpoints (existing in cost-control)

---

# PERFORMANCE

**EXISTING:**
- Cost control system with caching
- ResponseCache model for cached responses

**TARGETS:**
- Conversation responses: < 1 second
- Product searches: < 500 ms
- FAQ searches: < 200 ms

**OPTIMIZATIONS:**
- Use existing ResponseCache for FAQ responses
- Use existing VendorQuota for rate limiting
- Add Redis for session caching (optional)
- Index all vendor-scoped queries

---

# PHASE 1 MVP (ENHANCED)

**EXISTING (Already Implemented):**
✓ Twilio Integration (twilio.service.ts)
✓ Conversation Engine (chatbot.service.ts)
✓ FAQ Search (via ChatbotRule)
✓ Product Search (via existing Product model)
✓ Service Search (via existing Service model)
✓ Human Handoff (takeoverSession/resumeSession)
✓ Vendor Dashboard (chat monitor, settings)
✓ Cost Control System (WCCS)

**NEW ENHANCEMENTS:**
- Add Fuse.js for fuzzy matching
- Add Socket.IO for realtime
- Add conversation analytics
- Add business hours support
- Add operator assignment logic
- Enhance ChatbotSession with state tracking
- Create dedicated operator dashboard

---

# PHASE 2

- WhatsApp Interactive Buttons
- Catalog Navigation
- Workflow Builder
- Advanced Routing
- Lead Qualification (enhanced from existing)

---

# PHASE 3

- Voice Notes
- Multi-language Support
- Pidgin English Support
- Vendor-defined Workflows
- Campaign Broadcasting (existing WhatsAppCampaigns)
- Automated Follow-ups

---

# SUCCESS CRITERIA

A vendor already using Discover Festac should be able to:

1. Enable chatbot (✓ existing)
2. Connect WhatsApp (✓ existing)
3. Immediately serve existing products (✓ existing, enhance with fuzzy search)
4. Immediately serve existing services (✓ existing, enhance with fuzzy search)
5. Immediately serve existing FAQs (✓ existing, enhance with fuzzy search)
6. Receive human handoffs (✓ existing, enhance with operator assignment)
7. Manage chats from dashboard (✓ existing, enhance with operator dashboard)

**No duplicate data entry required.**
**The Conversation Engine functions as a conversational layer over existing Discover Festac business data.**

---

# IMPLEMENTATION ROADMAP

## Step 1: Schema Enhancements
- Add currentState to ChatbotSession
- Add assignedOperatorId to ChatbotSession
- Add business hours fields to ChatbotSettings
- Add ConversationState enum
- Run Prisma migration

## Step 2: Install Dependencies
```bash
npm install fuse.js socket.io
npm install --save-dev @types/fuse.js @types/socket.io
```

## Step 3: Create Search Services
- src/services/faq-search.service.ts
- src/services/product-search.service.ts
- src/services/service-search.service.ts
- src/services/business-hours.service.ts

## Step 4: Enhance Chatbot Service
- Add state machine logic
- Integrate Fuse.js for fuzzy matching
- Add business hours check
- Enhance keyword matching

## Step 5: Add Socket.IO
- src/services/socket.service.ts
- Integrate with chatbot service
- Add to server.ts

## Step 6: Create Analytics Service
- src/services/conversation-analytics.service.ts
- Add analytics endpoints

## Step 7: Enhance Frontend
- Create operator dashboard at /dashboard/messages
- Add realtime chat interface
- Add operator status indicators
- Enhance chat monitor with state display

## Step 8: Testing
- Test fuzzy matching
- Test state transitions
- Test handoff flow
- Test business hours logic
- Test realtime updates

## Step 9: Documentation
- Update API documentation
- Update vendor dashboard guide
- Document operator dashboard usage

---

# TECHNICAL NOTES

**LEVERAGE EXISTING CODE:**
- Do not rewrite existing chatbot.service.ts - enhance it
- Use existing cost-control system
- Use existing Message model for logging
- Use existing authentication middleware
- Use existing vendor dashboard components

**FOLLOW EXISTING PATTERNS:**
- Use existing service pattern
- Use existing controller pattern
- Use existing Prisma patterns
- Use existing TypeScript patterns
- Use existing React Query hooks

**MAINTAIN BACKWARD COMPATIBILITY:**
- Existing chatbot rules continue to work
- Existing vendor settings preserved
- Existing message history preserved
- Gradual migration to enhanced features

---

# CONCLUSION

This refactored scope adapts the original WhatsApp Commerce Conversation Engine specification to the existing Discover Festac project. It leverages the substantial infrastructure already in place while adding the requested enhancements (fuzzy matching, realtime, analytics, operator dashboard) without requiring a complete rewrite.

The key principle is: **enhance, don't replace**. The existing rule-based chatbot, cost control system, and vendor dashboard provide a solid foundation. The enhancements add sophistication (fuzzy matching, state machine, realtime) while maintaining the core architecture.
