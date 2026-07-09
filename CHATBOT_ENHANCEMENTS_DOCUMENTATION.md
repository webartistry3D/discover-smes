# Chatbot Enhancements Documentation

## Overview

This document describes the enhancements made to the Discover SMEs chatbot system as part of the refactored scope implementation. The enhancements include state machine logic, fuzzy matching, business hours checking, Socket.IO integration, and conversation analytics.

## Backend Enhancements

### 1. Database Schema Changes

#### ChatbotSettings Model
Added new fields to support enhanced chatbot functionality:
- `offlineMessage`: Message shown when chatbot is offline
- `handoffEnabled`: Enable/disable human handoff
- `businessHoursEnabled`: Enable/disable business hours checking
- `businessHours`: JSON field for business hours configuration
- `fuzzyMatchingEnabled`: Enable/disable fuzzy matching
- `fuzzyThreshold`: Threshold for fuzzy matching (0-1)

#### ChatbotSession Model
Added new fields for conversation state tracking:
- `currentState`: Current conversation state (WELCOME, MENU, FAQ_SEARCH, PRODUCT_SEARCH, SERVICE_SEARCH, WAITING_FOR_OPERATOR, HUMAN_CHAT, BOT_RESUMED, CLOSED)
- `assignedOperatorId`: ID of assigned human operator
- `conversationContext`: JSON field for multi-turn conversation context

#### ConversationState Enum
New enum defining conversation states:
```typescript
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

### 2. New Search Services

#### FAQ Search Service (`faq-search.service.ts`)
- Fuzzy search for FAQs using Fuse.js
- Exact match by keyword
- Get all FAQs for a vendor
- Configurable threshold for fuzzy matching

#### Product Search Service (`product-search.service.ts`)
- Fuzzy search for products using Fuse.js
- Search by category/name
- Get all available products
- Format product information for WhatsApp responses
- Price conversion from Prisma Decimal to number

#### Service Search Service (`service-search.service.ts`)
- Fuzzy search for services using Fuse.js
- Get bookable services
- Format service information for WhatsApp responses
- Price conversion from Prisma Decimal to number

#### Business Hours Service (`business-hours.service.ts`)
- Check if current time is within business hours
- Timezone-aware business hours checking
- Get business hours configuration
- Update business hours
- Enable/disable business hours
- Calculate next opening time

### 3. Enhanced Chatbot Service (`chatbot.service.ts`)

#### State Machine Logic
Implemented state machine in `processMessage` method:
- **WELCOME**: Initial state, sends greeting message
- **MENU**: Main menu state
- **FAQ_SEARCH**: Search FAQs with fuzzy matching
- **PRODUCT_SEARCH**: Search products with fuzzy matching
- **SERVICE_SEARCH**: Search services with fuzzy matching
- **WAITING_FOR_OPERATOR**: Waiting for human operator
- **HUMAN_CHAT**: Human operator is handling the conversation
- **BOT_RESUMED**: Bot resumed after human handoff
- **CLOSED**: Conversation closed

#### Business Hours Check
- Checks if current time is within configured business hours
- Returns offline message if outside business hours
- Integrates with business hours service

#### Human Handoff
- Detects when customer requests human (keywords: "human", "agent", "person")
- Sets session state to HUMAN_CHAT
- Assigns operator if provided
- Emits Socket.IO events for realtime updates

#### Cost Control Integration
- Integrates with existing cost control system
- Caches responses to reduce API costs
- Delays messages to prevent rate limiting

### 4. Socket.IO Integration (`socket.service.ts`)

#### Socket.IO Service
- Manages Socket.IO server instance
- Vendor room management
- Event handlers for:
  - Join/leave vendor rooms
  - Operator status updates
  - Typing indicators
  - Message received/sent events
  - Conversation assignment
  - Operator joined/left events
  - Bot resumed events
  - Session state changed events

#### Server Integration
- Integrated with `server.ts`
- Socket.IO initialized with HTTP server
- CORS configuration for frontend

### 5. Conversation Analytics Service (`conversation-analytics.service.ts`)

#### Metrics Provided
- Total conversations
- Bot resolution rate
- Human handoff rate
- Average response time
- Most asked questions
- Most viewed products
- Most requested services
- Daily conversation counts
- Monthly conversation counts
- Active sessions
- Closed sessions
- Average session duration

#### API Endpoints
- `GET /api/v1/chatbot/analytics?period={period}` - Get vendor analytics
- `GET /api/v1/admin/conversation-analytics?period={period}` - Get global analytics (admin only)

## Frontend Enhancements

### 1. Operator Dashboard (`OperatorDashboard.tsx`)

#### Features
- Real-time session monitoring via Socket.IO
- Conversation state display with color-coded badges
- Operator status indicator (online/offline)
- Session list with filtering
- Take over/resume bot functionality
- Real-time message updates
- Connection status indicator
- Session assignment tracking

#### Socket.IO Integration
- Joins vendor room on connection
- Emits operator status updates
- Listens for message received events
- Listens for session state changes
- Listens for conversation assignments

### 2. Updated Types (`shared.ts`)

#### New Types
- `ConversationState` enum
- Updated `ChatbotSession` interface with new fields
- Updated `UpdateChatbotSettingsRequest` with new fields
- Updated `TakeoverSessionRequest` with `assignedOperatorId`

### 3. Updated Hooks (`useChatbot.ts`)

#### New Hook
- `useChatbotAnalytics(period)` - Fetch conversation analytics

#### Updated API
- `chatbotApi.getAnalytics(period)` - Get analytics endpoint

## API Documentation

### Chatbot Settings

#### Get Settings
```
GET /api/v1/chatbot/settings
```
Returns chatbot settings for the authenticated vendor.

#### Update Settings
```
PUT /api/v1/chatbot/settings
```
Body:
```json
{
  "chatbotEnabled": boolean,
  "greetingMessage": string,
  "fallbackMessage": string,
  "humanHandoffMessage": string,
  "offlineMessage": string,
  "handoffEnabled": boolean,
  "businessHoursEnabled": boolean,
  "businessHours": object,
  "fuzzyMatchingEnabled": boolean,
  "fuzzyThreshold": number
}
```

### Chatbot Rules

#### Get Rules
```
GET /api/v1/chatbot/rules
```
Returns all chatbot rules for the authenticated vendor.

#### Create Rule
```
POST /api/v1/chatbot/rules
```
Body:
```json
{
  "ruleType": "FAQ | PRICING | DELIVERY | HOURS | PAYMENT | LOCATION | CUSTOM",
  "keyword": string,
  "questionPattern": string,
  "response": string,
  "priority": number
}
```

#### Update Rule
```
PUT /api/v1/chatbot/rules/:id
```
Body:
```json
{
  "ruleType": string,
  "keyword": string,
  "questionPattern": string,
  "response": string,
  "priority": number,
  "isActive": boolean
}
```

#### Delete Rule
```
DELETE /api/v1/chatbot/rules/:id
```

### Chatbot Sessions

#### Get Sessions
```
GET /api/v1/chatbot/sessions
```
Returns all chatbot sessions for the authenticated vendor.

#### Takeover Session
```
POST /api/v1/chatbot/session/takeover
```
Body:
```json
{
  "sessionId": string,
  "assignedOperatorId": string
}
```

#### Resume Session
```
POST /api/v1/chatbot/session/resume
```
Body:
```json
{
  "sessionId": string
}
```

### Conversation Analytics

#### Get Analytics
```
GET /api/v1/chatbot/analytics?period={period}
```
Query parameters:
- `period`: `day | week | month | year | all` (default: all)

Returns conversation metrics for the authenticated vendor.

#### Get Global Analytics (Admin)
```
GET /api/v1/admin/conversation-analytics?period={period}
```
Query parameters:
- `period`: `day | week | month | year | all` (default: all)

Returns aggregated conversation metrics across all vendors (admin only).

### Message Processing

#### Process Message
```
POST /api/v1/chatbot/process-message
```
Body:
```json
{
  "vendorId": string,
  "customerPhone": string,
  "message": string
}
```

Response:
```json
{
  "response": string,
  "shouldHandoff": boolean,
  "matchedRule": object,
  "newState": string
}
```

## Socket.IO Events

### Client → Server

#### Join Vendor Room
```javascript
socket.emit('join_vendor_room', vendorId)
```

#### Leave Vendor Room
```javascript
socket.emit('leave_vendor_room', vendorId)
```

#### Operator Status
```javascript
socket.emit('operator_status', {
  vendorId: string,
  operatorId: string,
  status: 'online' | 'offline'
})
```

#### Typing Indicator
```javascript
socket.emit('typing', {
  vendorId: string,
  sessionId: string,
  isTyping: boolean
})
```

### Server → Client

#### Message Received
```javascript
socket.on('message_received', (data) => {
  // { sessionId, message, timestamp }
})
```

#### Message Sent
```javascript
socket.on('message_sent', (data) => {
  // { sessionId, message, timestamp }
})
```

#### Conversation Assigned
```javascript
socket.on('conversation_assigned', (data) => {
  // { sessionId, operatorId, timestamp }
})
```

#### Operator Joined
```javascript
socket.on('operator_joined', (data) => {
  // { sessionId, operatorId, timestamp }
})
```

#### Operator Left
```javascript
socket.on('operator_left', (data) => {
  // { sessionId, operatorId, timestamp }
})
```

#### Conversation Closed
```javascript
socket.on('conversation_closed', (data) => {
  // { sessionId, timestamp }
})
```

#### Bot Resumed
```javascript
socket.on('bot_resumed', (data) => {
  // { sessionId, timestamp }
})
```

#### Session State Changed
```javascript
socket.on('session_state_changed', (data) => {
  // { sessionId, newState, timestamp }
})
```

#### Operator Status Changed
```javascript
socket.on('operator_status_changed', (data) => {
  // { operatorId, status }
})
```

#### Typing Indicator
```javascript
socket.on('typing_indicator', (data) => {
  // { sessionId, isTyping }
})
```

## Business Hours Configuration

### Format
```json
{
  "monday": { "open": "09:00", "close": "18:00", "isClosed": false },
  "tuesday": { "open": "09:00", "close": "18:00", "isClosed": false },
  "wednesday": { "open": "09:00", "close": "18:00", "isClosed": false },
  "thursday": { "open": "09:00", "close": "18:00", "isClosed": false },
  "friday": { "open": "09:00", "close": "18:00", "isClosed": false },
  "saturday": { "open": "10:00", "close": "15:00", "isClosed": false },
  "sunday": { "open": "00:00", "close": "00:00", "isClosed": true }
}
```

### Timezone
Business hours are checked in the vendor's configured timezone. The service handles timezone conversion automatically.

## Fuzzy Matching Configuration

### Threshold Values
- `0.0`: Exact match required
- `0.3`: Default threshold (good balance)
- `0.5`: More lenient matching
- `1.0`: Match anything

### Recommended Settings
- FAQs: `0.3` (default)
- Products: `0.4` (slightly more lenient)
- Services: `0.4` (slightly more lenient)

## Testing

### Backend Build
```bash
cd apps/backend
npm run build
```

### Frontend Build
```bash
cd apps/frontend
npm run build
```

Both builds completed successfully with no TypeScript errors.

## Deployment Considerations

### Environment Variables
- `VITE_API_URL`: Frontend API URL for Socket.IO connection

### Dependencies
- Backend: `fuse.js`, `socket.io`
- Frontend: `socket.io-client`

### Database Migration
Run the Prisma migration to apply schema changes:
```bash
cd apps/backend
npx prisma migrate dev
```

## Future Enhancements

### Potential Improvements
1. Add message history API endpoint
2. Implement file upload for business hours configuration
3. Add conversation export functionality
4. Implement operator performance metrics
5. Add sentiment analysis for conversations
6. Create conversation templates for common scenarios
7. Implement multi-language support
8. Add voice message support

### Known Limitations
1. FAQ search hits tracking requires additional analytics table
2. Product/service search history tracking requires additional table
3. Message history is not fully implemented in the dashboard
4. Socket.IO reconnection logic could be improved

## Support

For issues or questions about the chatbot enhancements, refer to the main project documentation or contact the development team.
