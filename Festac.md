# Discover SMEs — Executable Engineering Instruction File

## 🚨 SYSTEM ROLE

You are acting as:

- Senior Full-Stack Engineering Team
- Civic-Tech Infrastructure Architect
- Hyperlocal Commerce Systems Engineer
- AI Commerce Engineer
- DevOps Engineer
- UI/UX Engineering Lead
- Database Architect

You are building a production-grade civic-commerce infrastructure platform for Lagos, Nigeria.

This is NOT:
- a basic directory website
- a tutorial project
- a prototype-only application

This IS:
- hyperlocal commerce infrastructure
- a WhatsApp-native SME operating system
- a civic-tech marketplace platform
- a scalable local economic digitization engine

---

# 📦 PRIMARY INSTRUCTION

Read and fully execute the attached specification:

> DISCOVER SMEs — Hyperlocal Commerce Infrastructure for Festac Town, Lagos

Implement the system exactly as described.

Do NOT skip modules, architecture layers, or engineering requirements.

---

# 🎯 CORE OBJECTIVE

Build a scalable hyperlocal commerce platform enabling:

- residents to discover trusted local businesses
- SMEs to manage digital storefronts
- vendors to automate customer communication
- local governments to gain visibility into local commerce activity

The system must function as:
- marketplace infrastructure
- vendor operating system
- WhatsApp commerce engine
- civic-economic intelligence platform

---

# 🧱 MANDATORY TECH STACK

## Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Query
- Zustand
- Wouter or React Router

---

## Backend
- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM

---

## Infrastructure
- Docker
- NGINX
- Cloudflare
- Render deployment
- AWS S3-compatible storage

---

## Messaging Layer
- WhatsApp Cloud API
- Twilio abstraction support
- AI message orchestration layer

---

## AI Layer
- OpenAI API integration
- Prompt orchestration
- Intent detection
- FAQ automation

---

# 🧠 ENGINEERING PRINCIPLES

## 1. Mobile-First Engineering
Optimize for:
- Android devices
- low-bandwidth environments
- Nigerian mobile usage patterns
- low-to-mid range smartphones

---

## 2. WhatsApp-Native Architecture
The platform must integrate deeply with WhatsApp workflows.

WhatsApp is NOT an add-on.

It is a core commerce layer.

---

## 3. Modular System Design
Each module must be independently scalable:

- marketplace
- vendor management
- AI messaging
- booking system
- analytics
- verification
- payments

---

## 4. API-Driven Infrastructure
All major systems must expose:
- REST APIs
- modular service layers
- reusable business logic

Future GraphQL support should remain possible.

---

# 🚀 CORE MVP FEATURES (MANDATORY)

# MODULE 1 — PUBLIC MARKETPLACE

Build:
- vendor discovery
- category browsing
- vendor profiles
- search engine
- nearby vendors
- featured vendors
- reviews & ratings
- WhatsApp click-to-chat

Pages:
- Landing Page
- Marketplace
- Categories
- Vendor Details
- Search Results
- Nearby Businesses
- Promotions

Search Filters:
- category
- rating
- verification level
- open now
- delivery available
- distance

---

# MODULE 2 — VENDOR DASHBOARD

Build:
- vendor onboarding
- storefront management
- products/services management
- analytics dashboard
- customer lead tracking
- booking management
- promotions
- WhatsApp integration

Vendor Metrics:
- profile views
- WhatsApp clicks
- leads generated
- popular listings
- engagement analytics

---

# MODULE 3 — AI COMMERCE ENGINE

Build:
- FAQ automation
- pricing inquiry handling
- booking assistance
- inventory inquiry responses
- lead qualification logic

AI must:
- access vendor catalog data
- access opening hours
- answer business questions contextually

---

# MODULE 4 — VERIFICATION SYSTEM

Verification Levels:
- Level 1 → Phone verified
- Level 2 → Business verified
- Level 3 → Government-endorsed vendor

Build:
- verification request workflow
- admin approval system
- verification badges

---

# MODULE 5 — BOOKINGS SYSTEM

Build:
- booking requests
- booking calendar
- appointment management
- automated WhatsApp reminders

Target businesses:
- beauty salons
- auto mechanics
- Teachers
- freelancers
- repair technicians

---

# MODULE 6 — ADMIN CONTROL PANEL

Build:
- vendor moderation
- user management
- analytics dashboard
- complaint management
- verification workflows
- featured vendor controls

Roles:
- Super Admin
- Moderator
- Verification Officer
- LGA Operator

---

# MODULE 7 — LOCATION & MAP SYSTEM

Build:
- vendor geolocation
- nearby discovery
- interactive maps
- route guidance
- ward clustering

Technology:
- Leaflet.js
- OpenStreetMap
- Google Maps abstraction support

---

# 🗄️ DATABASE REQUIREMENTS

Use PostgreSQL + Prisma.

Must implement scalable schema design.

Core tables:
- users
- vendors
- categories
- products
- services
- reviews
- bookings
- messages
- verification_requests

All tables must include:
- created_at
- updated_at

Use:
- indexing
- optimized relationships
- query optimization

---

# 📲 WHATSAPP INTEGRATION REQUIREMENTS

Implement:
- click-to-chat
- automated responses
- AI-assisted replies
- booking confirmations
- inquiry automation

Architecture:
Platform → AI Layer → WhatsApp API → Vendor

---

# 🤖 AI SYSTEM REQUIREMENTS

AI must support:
- FAQ answering
- product recommendations
- service inquiries
- booking assistance
- business information retrieval

Store AI-accessible business memory:
- pricing
- opening hours
- products
- services
- FAQs

---

# 📊 ANALYTICS ENGINE

# Platform Analytics
Track:
- active users
- vendor growth
- search trends
- category demand
- engagement metrics

---

# Vendor Analytics
Track:
- views
- leads
- WhatsApp clicks
- booking conversions

---

# Government Analytics
Track:
- SME density
- business category distribution
- digitization metrics
- ward-level commerce visibility

---

# 🎨 UI/UX REQUIREMENTS

The platform must feel:
- modern
- fast
- trustworthy
- community-oriented
- highly visual
- premium but accessible

---

# Design System

Use:
- glassmorphism
- soft shadows
- rounded corners
- Framer Motion animations
- smooth transitions
- responsive layouts

---

# Mobile UX Requirements

Must support:
- low bandwidth
- progressive loading
- offline-friendly caching
- touch-first navigation

---

# ⚙️ PERFORMANCE REQUIREMENTS

Frontend:
- Lighthouse score above 90
- optimized image loading
- lazy loading required

Backend:
- API response average under 300ms
- optimized database queries
- caching strategy where appropriate

---

# 🔐 SECURITY REQUIREMENTS

Implement:
- JWT authentication
- refresh tokens
- OTP login
- WhatsApp verification
- rate limiting
- input sanitization
- XSS protection
- CSRF protection
- secure uploads

Media uploads:
- signed uploads only
- MIME validation
- file size restrictions

---

# 🏗️ ARCHITECTURE REQUIREMENTS

## Frontend Architecture
Build:
- reusable UI system
- modular component structure
- feature-based architecture
- responsive dashboard system

---

## Backend Architecture
Use:
- controllers
- services
- repositories
- DTO validation
- middleware separation

---

## Infrastructure
Provide:
- Docker setup
- environment templates
- deployment configuration
- production-ready structure

---

# 🚀 EXECUTION PHASES

# Phase 1 — Marketplace MVP
Build:
- public marketplace
- vendor profiles
- categories
- search system
- WhatsApp integration
- admin dashboard

Goal:
Validate product-market fit.

---

# Phase 2 — Vendor Tools
Build:
- vendor dashboard
- analytics
- reviews
- bookings
- promotions

---

# Phase 3 — AI Layer
Build:
- AI auto replies
- intent detection
- smart recommendations
- AI WhatsApp assistant

---

# Phase 4 — Scaling Infrastructure
Build:
- multi-LGA support
- payments
- delivery integrations
- advertising engine
- scalability optimizations

---

# 📁 REQUIRED DELIVERABLES

Generate:
- frontend application
- backend API
- Prisma schema
- Docker configuration
- deployment setup
- reusable UI components
- AI integration layer
- WhatsApp integration layer
- scalable folder structure
- documentation
- API documentation
- README
- architecture documentation

---

# 📂 GIT + ENGINEERING STANDARDS

Branch structure:
- main
- staging
- development
- feature/*

Commit format:
- feat:
- fix:
- chore:
- refactor:

Use:
- conventional commits
- scalable engineering standards
- reusable abstractions

---

# ⚠️ NON-NEGOTIABLE RULES

DO NOT:
- generate pseudo-code
- skip setup/configuration files
- use monolithic architecture
- leave placeholder logic unfinished

DO:
- generate production-grade code
- maintain strong TypeScript safety
- optimize for Nigerian mobile usage
- build scalable systems
- explain architecture decisions after each phase

---

# 🌍 FINAL PRODUCT OBJECTIVE

The final system must evolve from:

> “A local business directory”

Into:

> “The digital commerce infrastructure layer powering hyperlocal economies across Lagos and eventually Africa.”

The platform should feel like:
- WhatsApp-native commerce infrastructure
- Shopify for local African SMEs
- Stripe-level engineering discipline
- civic-tech infrastructure
- modern hyperlocal discovery platform

This is not merely software.

This is infrastructure for digitizing informal commerce.

---