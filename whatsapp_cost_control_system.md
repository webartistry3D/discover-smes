🔥 DISCOVER SMEs — WhatsApp COST CONTROL SYSTEM (WCCS)
🎯 Goal

Control and reduce WhatsApp API spending by:

Preventing unnecessary conversations
Reducing message volume per chat
Routing messages intelligently (bot vs human vs cached reply)
Enforcing vendor usage limits
Predicting and blocking cost spikes
1. CORE ARCHITECTURE LAYER

Insert this between chatbot engine and WhatsApp API:

Customer Message
      ↓
Chatbot Engine (rules)
      ↓
COST CONTROL LAYER (WCCS)  ← YOU BUILD THIS
      ↓
WhatsApp API (Meta)
2. MAIN MODULES
/backend/modules/cost-control
cost.service.ts
usage-tracker.service.ts
conversation-meter.service.ts
rule-cache.service.ts
spike-detector.service.ts
vendor-quotas.service.ts
3. CORE STRATEGY (VERY IMPORTANT)

You don’t control WhatsApp cost directly.

You control:

🔥 how often you trigger WhatsApp billable conversations

4. SYSTEM RULES
RULE 1 — Cache-first replies (BIGGEST COST SAVER)

Before sending anything to WhatsApp:

Check:

Has this question been answered recently?
Same vendor + same keyword?

If YES:

👉 respond from cache
👉 DO NOT call WhatsApp API

Example:

Customer A: price?
→ WhatsApp API called (first time)

Customer B: price?
→ cached reply (NO WhatsApp cost)
RULE 2 — Conversation grouping (24h window optimization)

WhatsApp bills per 24h conversation window.

So:

Merge multiple replies into ONE conversation when possible
Avoid reopening conversations repeatedly
RULE 3 — Message bundling

Instead of:

“Price is ₦5000”
“Delivery is ₦1000”

Send:

👉 ONE combined message:

Price: ₦5000
Delivery: ₦1000 in Lagos

✔ reduces message count
✔ reduces cost

RULE 4 — Keyword shortcut engine (bypass WhatsApp API)

If message is simple:

price
location
delivery
hours

DO NOT call WhatsApp API logic multiple times.

Use internal response engine:

Incoming message → match rule → respond directly
(no external API call if already inside active session window)
RULE 5 — Vendor usage quotas

Each vendor gets a monthly limit:

Example tiers:
Plan	Messages/month
Starter	500
Growth	5,000
Pro	20,000

When limit is hit:

bot switches to “reduced mode”
or disables auto-replies temporarily
RULE 6 — Spike detection (anti-bill explosion system)

If sudden traffic spike happens:

Example:

Vendor normally: 50 chats/day
Suddenly: 500 chats/hour

Trigger:

SPikeDetector → alert + throttle

Actions:

Delay replies slightly (batch processing)
Switch some responses to fallback
Notify admin
RULE 7 — Human takeover reduces API usage

When human takeover is active:

BOT STOPS
No WhatsApp API calls from system

This prevents:

bot + human double messaging cost

5. COST TRACKING ENGINE
usage_logs table
vendor_id
message_type
conversation_id
cost_estimate
timestamp
real-time tracking

For every API call:

before_send:
  check vendor balance

after_send:
  log cost
  update usage counter
6. COST GUARD SYSTEM (CRITICAL LAYER)

Before sending message:

if vendor.monthly_usage >= limit:
    block or downgrade response

Fallback options:

“Your chatbot is temporarily limited”
switch to cached replies only
disable marketing messages
7. SMART ROUTING DECISION ENGINE

Every message goes through:

1. Cache check
2. Rule match
3. Conversation window check
4. Cost check
5. WhatsApp API call (ONLY if needed)
8. OPTIONAL OPTIMIZATION (HIGH IMPACT)
Batch responses (advanced)

Instead of 3 API calls:

combine into 1 message
send once
Delay aggregation (micro batching)

Wait 2–5 seconds:

group similar responses
send one message instead of multiple
9. BUSINESS IMPACT

With this system:

Without WCCS:
High WhatsApp bills
unpredictable costs
vendor scaling risk
With WCCS:
30% – 70% cost reduction
predictable SaaS margins
scalable vendor onboarding
10. SIMPLE SUMMARY

Your WhatsApp Cost Control System does 5 things:

Caches responses
Blocks unnecessary API calls
Bundles messages
Limits vendor usage
Detects spikes early
🔥 FINAL INSIGHT

This system is what makes Discover SMEs:

not just a chatbot platform
but a profitable WhatsApp infrastructure business