Perfect. Here is a **Claude/Windsurf-ready `.md` update spec** for your existing **Discover SMEs monorepo project**.

---

# DISCOVER SMEs — RULE-BASED MULTI-VENDOR CHATBOT SYSTEM UPDATE

## PROJECT UPDATE DIRECTIVE

Read the current Discover SMEs codebase carefully and implement the following feature update into the existing monorepo architecture.

This is **NOT an AI/OpenAI chatbot**.

This is a **multi-tenant rule-based chatbot engine** that allows each vendor on the platform to configure chatbot responses for customer inquiries via their WhatsApp business channel.

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

# CORE BUSINESS OBJECTIVE

Each vendor on Discover SMEs should be able to configure their own chatbot behavior without requiring AI.

Example:

Vendor configures:

Question:
`Do you deliver?`

Bot response:
`Yes, we deliver within Lagos. Delivery fee depends on location.`

Customer sends message to vendor WhatsApp:

> Do you deliver?

System automatically responds with vendor-configured answer.

---

# SYSTEM ARCHITECTURE UPDATE

Integrate into existing monorepo:

```text
/apps
   /frontend
   /backend
```

Extend backend:

```text
/backend/modules/chatbot
   chatbot.controller.ts
   chatbot.service.ts
   keyword.matcher.ts
   handoff.service.ts
   chatbot.routes.ts
```

Extend frontend:

```text
/frontend/src/pages/vendor/chatbot
   ChatbotSettings.tsx
   FAQManager.tsx
   HandoffControl.tsx
   ChatMonitor.tsx
```

---

# DATABASE SCHEMA UPDATE

Create new tables.

---

## chatbot_settings

Purpose:

Stores chatbot configuration per vendor.

```sql
id
vendor_id
chatbot_enabled BOOLEAN DEFAULT true
greeting_message TEXT
fallback_message TEXT
human_handoff_message TEXT
created_at
updated_at
```

---

## vendor_chatbot_rules

Purpose:

Stores vendor FAQ/keyword response rules.

```sql
id
vendor_id
rule_type
keyword
question_pattern
response
priority
is_active BOOLEAN DEFAULT true
created_at
updated_at
```

---

### rule_type values

Allowed:

* FAQ
* PRICING
* DELIVERY
* HOURS
* PAYMENT
* LOCATION
* CUSTOM

---

## active_chat_sessions

Purpose:

Tracks current conversations and handoff state.

```sql
id
vendor_id
customer_phone
bot_active BOOLEAN DEFAULT true
human_takeover BOOLEAN DEFAULT false
session_status
last_message
created_at
updated_at
```

---

# CHATBOT ENGINE LOGIC

## Incoming message flow

System receives message from WhatsApp webhook.

Flow:

```text
Incoming WhatsApp Message
      ↓
Identify vendor
      ↓
Check if chatbot enabled
      ↓
Check if human takeover active
      ↓
Normalize customer message
      ↓
Search vendor chatbot rules
      ↓
Keyword/pattern match
      ↓
Respond automatically
```

---

## Example logic

Customer sends:

> How much is herbal mix?

System normalizes:

```text
how much herbal mix
```

Search rules:

```text
keyword = herbal mix
rule_type = PRICING
```

Response:

> Herbal Mix costs ₦3,500. Delivery available within Lagos.

---

# KEYWORD MATCHING ENGINE

Implement lightweight matching logic.

Rules:

1. Convert incoming message to lowercase
2. Remove punctuation
3. Normalize spacing
4. Search vendor rules by:

Priority:

* Exact keyword match
* Question pattern match
* Partial keyword match
* Rule priority order

---

## Example matching

Rule:

```text
keyword: delivery
```

Matches:

* Do you deliver?
* Delivery fee?
* Can you deliver to Surulere?

---

# FALLBACK LOGIC

If no match found:

Use vendor-configured fallback:

Example:

> Thank you for your message. A human agent will assist you shortly.

---

# HUMAN HANDOFF SYSTEM

If:

* No rule matched after configurable attempts
* Customer requests “human”
* Vendor manually takes over

Then:

Set:

```text
human_takeover = true
bot_active = false
```

Bot stops responding.

Customer receives:

> A human agent is now attending to you.

---

# HUMAN TAKEOVER DASHBOARD CONTROL

Vendor dashboard must include:

### Take Over Chat button

Action:

```text
Disable bot for this customer session
```

### Resume Bot button

Action:

```text
Enable bot for this customer session
```

---

# FRONTEND VENDOR DASHBOARD FEATURES

Create chatbot management UI.

---

## Chatbot Settings Page

Vendor should be able to:

* Enable / disable chatbot
* Configure greeting message
* Configure fallback message
* Configure handoff message

---

## FAQ Manager

Vendor should be able to:

* Add rule
* Edit rule
* Delete rule
* Assign rule type
* Add keyword
* Add response
* Set priority
* Toggle active/inactive

---

## Live Chat Monitor

Vendor should see:

* Customer phone
* Last message
* Bot active status
* Human takeover status
* Take over button
* Resume bot button

---

# API ENDPOINTS

Implement backend APIs.

---

## Chatbot settings

```text
GET    /api/chatbot/settings/:vendorId
PUT    /api/chatbot/settings/:vendorId
```

---

## Chatbot rules

```text
GET    /api/chatbot/rules/:vendorId
POST   /api/chatbot/rules
PUT    /api/chatbot/rules/:id
DELETE /api/chatbot/rules/:id
```

---

## Chat session controls

```text
POST /api/chatbot/session/takeover
POST /api/chatbot/session/resume
GET  /api/chatbot/sessions/:vendorId
```

---

## Incoming message processor

```text
POST /api/chatbot/process-message
```

This route should:

* Receive incoming customer message
* Match vendor rules
* Return correct response
* Trigger fallback if needed
* Respect handoff state

---

# PERFORMANCE REQUIREMENTS

System must support:

* Multiple vendors
* Multiple customers chatting simultaneously
* Fast keyword lookup
* Isolated vendor responses
* No cross-vendor rule leakage

---

# SECURITY REQUIREMENTS

Enforce:

* Vendor authentication
* Vendor-only access to own chatbot rules
* Session isolation
* Input sanitization
* Rate limiting on webhook endpoints

---

# UX REQUIREMENTS

Vendor experience should feel simple.

Vendor flow:

```text
Login
→ Open Chatbot Settings
→ Add FAQs / responses
→ Enable bot
→ Monitor chats
→ Take over when needed
```

No technical complexity should be exposed to vendors.

---

# IMPLEMENTATION RULES

Critical:

* Integrate into existing Discover SMEs monorepo
* Do NOT rewrite existing architecture
* Follow existing project coding conventions
* Use existing backend stack
* Use existing frontend stack
* Ensure full TypeScript typing
* Ensure mobile responsiveness
* Ensure production-ready code
* No mock implementations
* No pseudo-code
* Build complete working feature

---

# EXECUTION DIRECTIVE

Implement this update incrementally:

1. Database schema
2. Backend chatbot module
3. Message matching engine
4. Human handoff logic
5. API routes
6. Frontend vendor dashboard
7. Chat monitoring
8. Full integration into existing Discover SMEs flow

Do not skip files.

Build production-grade implementation with engineering precision.
