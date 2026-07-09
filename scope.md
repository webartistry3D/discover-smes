# DISCOVER SMEs

# WHATSAPP COMMERCE CONVERSATION ENGINE

## Expert Engineering Specification

---

# PROJECT OVERVIEW

Discover Festac already containsthese tabs:

* My Bookings
* Edit profile
* full analytics
* get verified
* boost listing
* income manager
* expense manager
* invoice manager
* financial reports
* crm manager
* inventory manager
* tax manager
* chatbot settings
* faq manager
* chat monitor
* cost monitor
* marketing tools



The purpose of this project is NOT to create another chatbot database.

Instead, build a Conversation Engine that consumes existing Discover Festac data and exposes it through WhatsApp using Twilio.

The chatbot must act as an intelligent conversational interface over existing platform resources.

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

via WhatsApp.

Every vendor should automatically receive a dedicated chatbot instance powered by their existing data.

No OpenAI.
No LLMs.
No AI APIs.

Rule-based architecture only.

---

# MULTI-TENANT REQUIREMENTS

The system must support unlimited vendors.

Every chatbot interaction must be isolated using:

vendorId

Every query, lookup, conversation and response must be scoped to a single vendor.

Example:

Customer -> Vendor A Chatbot

Can I buy cement?

Search only Vendor A products.

Never search Vendor B data.

---

# HIGH LEVEL ARCHITECTURE

Customer WhatsApp
│
▼
Twilio WhatsApp API
│
▼
Webhook Controller
│
▼
Conversation Engine
│
┌──────┼─────────────┬──────────┐
▼      ▼             ▼          ▼
FAQ   Product      Service    Workflow
Engine Engine      Engine     Engine
│
▼
Discover Festac Existing Modules
│
▼
PostgreSQL

---

# CRITICAL DESIGN PRINCIPLE

DO NOT DUPLICATE DATA.

Conversation Engine must query existing modules.

Example:

Products already exist.

Conversation Engine must call:

Product and Service

instead of creating:

chatbot_products

table.

Same principle for:

* FAQs
* Services
* Vendors
* Customers
* Inventory

---

# NEW MODULES TO CREATE

Create:

/modules/conversations

Containing:

Conversation Service
Message Service
Twilio Service
Handoff Service
Workflow Service
Keyword Engine
Search Engine

---

# DATABASE TABLES

Only create tables that are genuinely conversation related.

## conversations

id
vendorId
customerPhone
status
assignedOperatorId
createdAt
updatedAt

---

## messages

id
conversationId
senderType
message
mediaUrl
createdAt

senderType:

BOT
CUSTOMER
OPERATOR

---

## handoff_sessions

id
conversationId
operatorId
startedAt
endedAt

---

## chatbot_settings

id
vendorId

welcomeMessage

offlineMessage

handoffEnabled

businessHoursEnabled

createdAt

updatedAt

---

# CONVERSATION STATES

Conversation Engine must support:

WELCOME

MENU

FAQ_SEARCH

PRODUCT_SEARCH

SERVICE_SEARCH

WAITING_FOR_OPERATOR

HUMAN_CHAT

BOT_RESUMED

CLOSED

Store current state on conversation.

---

# MESSAGE FLOW

Incoming WhatsApp Message

↓

Webhook Receives Message

↓

Identify Vendor

↓

Load Conversation

↓

Determine Current State

↓

Execute State Handler

↓

Return Response

---

# VENDOR IDENTIFICATION

Support two approaches.

Option A:

Dedicated WhatsApp number per vendor.

OR

Option B:

Shared WhatsApp number.

Recommended.

Example:

Customer enters:

CEMENT

The system identifies:

Vendor Context

before processing.

---

# FAQ ENGINE

Existing FAQs already exist.

Build:

FaqSearchService

Responsibilities:

* keyword matching
* fuzzy matching
* synonym matching

Example:

Customer:

What time do you open?

Matches:

Opening Hours FAQ

Return FAQ answer.

---

# PRODUCT ENGINE

Do NOT create product storage.

Use existing Product Module.

Create:

ProductSearchService

Capabilities:

* search by name
* search by category
* search by tags
* search by keyword

Example:

Customer:

Do you sell rice?

System:

Search Vendor Products

Return matching products.

---

# PRODUCT RESPONSE FORMAT

Product Name

Price

Short Description

Availability

Product Image

Twilio media attachment support required.

---

# SERVICE ENGINE

Do NOT create service storage.

Use existing Service Module.

Create:

ServiceSearchService

Capabilities:

* search services
* retrieve pricing
* retrieve descriptions

---

# KEYWORD ENGINE

Create central keyword processor.

Example mappings:

PRODUCT

PRODUCTS

BUY

PRICE

ITEM

→ PRODUCT_SEARCH

---

SERVICE

SERVICES

BOOK

CONSULTATION

→ SERVICE_SEARCH

---

HELP

AGENT

HUMAN

SUPERVISOR

→ HANDOFF

---

# FUZZY MATCHING

Implement:

Fuse.js

Use for:

Products

Services

FAQs

Configuration:

threshold: 0.3

includeScore: true

---

# MEDIA DELIVERY

Support:

Images

PDFs

Catalogs

Price Lists

Videos

Use Twilio Media API.

---

# HUMAN HANDOFF SYSTEM

Customer can type:

AGENT

HUMAN

HELP

SUPPORT

OR click button.

System:

conversation.status

=

WAITING_FOR_OPERATOR

---

# OPERATOR ASSIGNMENT

Vendors can have:

Owner

Staff

Support Agent

Manager

System assigns:

Least Busy Operator

or

Round Robin Assignment

---

# OPERATOR DASHBOARD

Create:

/dashboard/messages

Features:

Conversation List

Unread Count

Live Chat

Media Support

Customer Profile

Transfer Chat

Resume Bot

Close Conversation

---

# REALTIME REQUIREMENTS

Implement:

Socket.IO

Events:

message_received

message_sent

conversation_assigned

operator_joined

operator_left

conversation_closed

bot_resumed

---

# RESUME BOT FEATURE

Operator clicks:

Resume Automation

System:

conversation.status = BOT_RESUMED

Conversation Engine takes over.

---

# BUSINESS HOURS SUPPORT

Vendor configuration:

Monday-Sunday

Open Time

Close Time

Timezone

If outside business hours:

Return Offline Message

Offer Lead Capture

---

# ANALYTICS

Create:

Conversation Analytics Module

Metrics:

Total Conversations

Bot Resolution Rate

Human Handoff Rate

Average Response Time

Most Asked Questions

Most Viewed Products

Most Requested Services

Daily Conversations

Monthly Conversations

---

# SECURITY

Every query must verify:

vendorId

Never allow cross-tenant data access.

Apply row-level authorization checks everywhere.

---

# PERFORMANCE

Conversation responses should return:

< 1 second

Product searches:

< 500 ms

FAQ searches:

< 200 ms

Use caching.

Redis recommended.

---

# PHASE 1 MVP

Twilio Integration

Conversation Engine

FAQ Search

Product Search

Service Search

Human Handoff

Operator Dashboard

Socket.IO

Analytics

---

# PHASE 2

WhatsApp Interactive Buttons

Catalog Navigation

Workflow Builder

Advanced Routing

Lead Qualification

---

# PHASE 3

Voice Notes

Multi-language Support

Pidgin English Support

Vendor-defined Workflows

Campaign Broadcasting

Automated Follow-ups

---

# SUCCESS CRITERIA

A vendor already using Discover Festac should be able to:

1. Enable chatbot.
2. Connect WhatsApp.
3. Immediately serve existing products.
4. Immediately serve existing services.
5. Immediately serve existing FAQs.
6. Receive human handoffs.
7. Manage chats from dashboard.

No duplicate data entry required.
The Conversation Engine must function as a conversational layer over existing Discover Festac business data.
