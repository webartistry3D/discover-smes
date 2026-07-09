# DISCOVER SMEs — RULE-BASED VENDOR-PROGRAMMABLE CHATBOT SYSTEM
 
## PROJECT UPDATE DIRECTIVE
 
Implement a rule-based vendor-programmable chatbot system into the existing Discover SMEs monorepo architecture.
 
This is a **purely rule-based chatbot engine** with NO AI, NO machine learning, NO OpenAI integration, NO external AI services.
 
Each vendor can program their own chatbot responses using simple keyword matching and predefined rules.
 
The chatbot must support:
 
* Vendor-configurable FAQ responses
* Pricing responses
* Delivery responses
* Business hours responses
* Payment method responses
* Greeting messages
* Fallback responses
* Automatic chatbot-to-human handoff
* Human takeover / resume bot controls
* Multi-customer concurrent handling
* Per-vendor chatbot isolation (multi-tenant)
 
---
 
## CORE BUSINESS OBJECTIVE
 
Each vendor on Discover SMEs should be able to program their own chatbot behavior using simple keyword rules.
 
Example:
 
Vendor programs:
 
Keyword:
`delivery`
 
Response:
`Yes, we deliver within Festac Town. Delivery fee depends on location.`
 
Customer sends message to vendor WhatsApp:
 
> Do you deliver?
 
System matches keyword "delivery" and responds:
 
> Yes, we deliver within Festac Town. Delivery fee depends on location.
 
---
 
## SYSTEM ARCHITECTURE UPDATE
 
Integrate into existing monorepo:
 
```text
/apps
   /frontend
   /backend
Extend backend:

text
/apps/backend/src/controllers/chatbot.controller.ts
/apps/backend/src/services/chatbot.service.ts
/apps/backend/src/services/keyword-matcher.service.ts
/apps/backend/src/services/handoff.service.ts
/apps/backend/src/routes/index.ts (add chatbot routes)
Extend frontend:

text
/apps/frontend/src/features/chatbot/ChatbotSettings.tsx
/apps/frontend/src/features/chatbot/FAQManager.tsx
/apps/frontend/src/features/chatbot/HandoffControl.tsx
/apps/frontend/src/features/chatbot/ChatMonitor.tsx
/apps/frontend/src/hooks/useChatbot.ts
DATABASE SCHEMA UPDATE
Add to existing Prisma schema at apps/backend/prisma/schema.prisma.

ChatbotRuleType enum
prisma
enum ChatbotRuleType {
  FAQ
  PRICING
  DELIVERY
  HOURS
  PAYMENT
  LOCATION
  CUSTOM
}
ChatbotSessionStatus enum
prisma
enum ChatbotSessionStatus {
  ACTIVE
  HUMAN_TAKEOVER
  CLOSED
}
ChatbotSettings model
Purpose: Stores chatbot configuration per vendor.

prisma
model ChatbotSettings {
  id                  String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  vendorId            String   @db.Uuid
  chatbotEnabled      Boolean  @default(true)
  greetingMessage     String?  @db.Text
  fallbackMessage     String?  @db.Text
  humanHandoffMessage String? @db.Text
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
 
  // Relations
  vendor              Vendor   @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  rules               ChatbotRule[]
  sessions            ChatbotSession[]
 
  @@unique([vendorId])
  @@index([vendorId])
  @@map("chatbot_settings")
}
ChatbotRule model
Purpose: Stores vendor-programmed keyword response rules.

prisma
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
 
  // Relations
  vendor            Vendor           @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  settings          ChatbotSettings  @relation(fields: [vendorId], references: [id], onDelete: Cascade)
 
  @@index([vendorId])
  @@index([ruleType])
  @@index([isActive])
  @@map("chatbot_rules")
}
ChatbotSession model
Purpose: Tracks current conversations and handoff state.

prisma
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
 
  // Relations
  vendor            Vendor                @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  settings          ChatbotSettings       @relation(fields: [vendorId], references: [id], onDelete: Cascade)
 
  @@index([vendorId])
  @@index([customerPhone])
  @@index([sessionStatus])
  @@map("chatbot_sessions")
}
Add relations to Vendor model
prisma
model Vendor {
  // ... existing fields
  
  // New relations
  chatbotSettings    ChatbotSettings?
  chatbotRules       ChatbotRule[]
  chatbotSessions    ChatbotSession[]
}
CHATBOT ENGINE LOGIC
Incoming message flow
System receives message from WhatsApp webhook.

Flow:

text
Incoming WhatsApp Message
      ↓
Identify vendor
      ↓
Check if chatbot enabled
      ↓
Check if human takeover active
      ↓
Normalize customer message (lowercase, remove punctuation)
      ↓
Search vendor-programmed rules
      ↓
Keyword/pattern match
      ↓
Respond with programmed response
Example logic
Customer sends:

How much is herbal mix?

System normalizes:

text
how much herbal mix
Search rules:

text
keyword = herbal mix
rule_type = PRICING
Response:

Herbal Mix costs ₦3,500. Delivery available within Festac Town.

KEYWORD MATCHING ENGINE
Implement lightweight matching logic in keyword-matcher.service.ts.

Rules:

Convert incoming message to lowercase
Remove punctuation
Normalize spacing
Search vendor rules by:
Priority:

Exact keyword match
Question pattern match
Partial keyword match
Rule priority order
Example matching
Rule:

text
keyword: delivery
Matches:

Do you deliver?
Delivery fee?
Can you deliver to Festac?
FALLBACK LOGIC
If no match found:

Use vendor-programmed fallback:

Example:

Thank you for your message. A human agent will assist you shortly.

HUMAN HANDOFF SYSTEM
If:

No rule matched after configurable attempts
Customer requests "human"
Vendor manually takes over
Then:

Set:

text
human_takeover = true
bot_active = false
Bot stops responding.

Customer receives:

A human agent is now attending to you.

HUMAN TAKEOVER DASHBOARD CONTROL
Vendor dashboard must include:

Take Over Chat button
Action:

text
Disable bot for this customer session
Resume Bot button
Action:

text
Enable bot for this customer session
FRONTEND VENDOR DASHBOARD FEATURES
Create chatbot management UI in apps/frontend/src/features/chatbot/.

ChatbotSettings.tsx
Vendor should be able to:

Enable / disable chatbot
Configure greeting message
Configure fallback message
Configure handoff message
FAQManager.tsx
Vendor should be able to:

Add rule
Edit rule
Delete rule
Assign rule type
Add keyword
Add response
Set priority
Toggle active/inactive
ChatMonitor.tsx
Vendor should see:

Customer phone
Last message
Bot active status
Human takeover status
Take over button
Resume bot button
HandoffControl.tsx
Component for taking over/resuming bot for specific sessions.

API ENDPOINTS
Implement backend APIs following existing pattern in apps/backend/src/routes/index.ts.

Chatbot settings
text
GET    /api/v1/chatbot/settings
PUT    /api/v1/chatbot/settings
Chatbot rules
text
GET    /api/v1/chatbot/rules
POST   /api/v1/chatbot/rules
PUT    /api/v1/chatbot/rules/:id
DELETE /api/v1/chatbot/rules/:id
Chat session controls
text
POST /api/v1/chatbot/session/takeover
POST /api/v1/chatbot/session/resume
GET  /api/v1/chatbot/sessions
Incoming message processor
text
POST /api/v1/chatbot/process-message
This route should:

Receive incoming customer message
Match vendor-programmed rules
Return correct response
Trigger fallback if needed
Respect handoff state
REACT QUERY HOOKS
Create in apps/frontend/src/hooks/useChatbot.ts:

typescript
useChatbotSettings()
useUpdateChatbotSettings()
useChatbotRules()
useCreateChatbotRule()
useUpdateChatbotRule()
useDeleteChatbotRule()
useChatbotSessions()
useTakeoverSession()
useResumeSession()
useProcessMessage()
SHARED TYPES
Add to packages/shared/src/types/domain.types.ts:

typescript
// Chatbot Rule Types
export enum ChatbotRuleType {
  FAQ = 'FAQ',
  PRICING = 'PRICING',
  DELIVERY = 'DELIVERY',
  HOURS = 'HOURS',
  PAYMENT = 'PAYMENT',
  LOCATION = 'LOCATION',
  CUSTOM = 'CUSTOM',
}
 
// Chatbot Session Status
export enum ChatbotSessionStatus {
  ACTIVE = 'ACTIVE',
  HUMAN_TAKEOVER = 'HUMAN_TAKEOVER',
  CLOSED = 'CLOSED',
}
 
// Chatbot Settings Interface
export interface ChatbotSettings {
  id: string;
  vendorId: string;
  chatbotEnabled: boolean;
  greetingMessage: string | null;
  fallbackMessage: string | null;
  humanHandoffMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}
 
// Chatbot Rule Interface
export interface ChatbotRule {
  id: string;
  vendorId: string;
  ruleType: ChatbotRuleType;
  keyword: string;
  questionPattern: string | null;
  response: string;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
 
// Chatbot Session Interface
export interface ChatbotSession {
  id: string;
  vendorId: string;
  customerPhone: string;
  botActive: boolean;
  humanTakeover: boolean;
  sessionStatus: ChatbotSessionStatus;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
 
// Chatbot Rule Request
export interface CreateChatbotRuleRequest {
  ruleType: ChatbotRuleType;
  keyword: string;
  questionPattern?: string;
  response: string;
  priority?: number;
}
 
export interface UpdateChatbotRuleRequest {
  ruleType?: ChatbotRuleType;
  keyword?: string;
  questionPattern?: string;
  response?: string;
  priority?: number;
  isActive?: boolean;
}
 
// Chatbot Settings Request
export interface UpdateChatbotSettingsRequest {
  chatbotEnabled?: boolean;
  greetingMessage?: string;
  fallbackMessage?: string;
  humanHandoffMessage?: string;
}
 
// Session Control Request
export interface TakeoverSessionRequest {
  sessionId: string;
}
 
export interface ResumeSessionRequest {
  sessionId: string;
}
 
// Message Processing Request
export interface ProcessMessageRequest {
  vendorId: string;
  customerPhone: string;
  message: string;
}
 
// Message Processing Response
export interface ProcessMessageResponse {
  response: string;
  shouldHandoff: boolean;
  matchedRule?: ChatbotRule;
}
PERFORMANCE REQUIREMENTS
System must support:

Multiple vendors
Multiple customers chatting simultaneously
Fast keyword lookup
Isolated vendor responses
No cross-vendor rule leakage
SECURITY REQUIREMENTS
Enforce:

Vendor authentication (use existing auth middleware)
Vendor-only access to own chatbot rules
Session isolation
Input sanitization
Rate limiting on webhook endpoints
Use existing vendor middleware
UX REQUIREMENTS
Vendor experience should feel simple.

Vendor flow:

text
Login
→ Open Chatbot Settings
→ Program FAQs / responses with keywords
→ Enable bot
→ Monitor chats
→ Take over when needed
No technical complexity should be exposed to vendors.

Use existing UI components (Button, Badge, etc.) from apps/frontend/src/components/ui/.

IMPLEMENTATION RULES
Critical:

Integrate into existing Discover SMEs monorepo
Do NOT rewrite existing architecture
Follow existing project coding conventions
Use existing backend stack (Express.js, Prisma)
Use existing frontend stack (React, TypeScript, React Query)
Ensure full TypeScript typing
Ensure mobile responsiveness
Ensure production-ready code
No mock implementations
No pseudo-code
Build complete working feature
Use existing authentication middleware
Use existing vendor middleware
Follow existing API route pattern (/api/v1/...)
Follow existing React Query hooks pattern
Use existing UI components
NO AI, NO machine learning, NO external AI services
Purely rule-based keyword matching engine
EXECUTION DIRECTIVE
Implement this update incrementally:

Database schema (add to Prisma schema)
Run Prisma migration
Backend chatbot controller
Backend chatbot service
Backend keyword matcher service (pure string matching, no AI)
Backend handoff service
API routes (add to routes/index.ts)
Shared types (add to packages/shared)
Frontend React Query hooks
Frontend ChatbotSettings component
Frontend FAQManager component
Frontend ChatMonitor component
Frontend HandoffControl component
Add chatbot navigation to vendor dashboard
Full integration into existing Discover SMEs flow
Test end-to-end
Do not skip files.

Build production-grade implementation with engineering precision.