# System Architecture

This document provides a technical overview of the Conference Room Booking System architecture.

## Overview

The system follows a **microservices architecture** deployed using a **monorepo pattern**. It implements the design specified in the DevOps report with both local development and AWS production environments.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Next.js Frontend (Vercel)                     │   │
│  │  - Landing Page  - Auth  - Search  - Booking            │   │
│  │  - Frutiger Aero UI with anime.js animations            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API GATEWAY LAYER                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         Amazon API Gateway (Production)                  │   │
│  │         Express.js Server (Local Dev)                    │   │
│  │  - Request routing  - Authentication  - Rate limiting    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┼────────────┐
                 │            │            │
                 ▼            ▼            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    MICROSERVICES LAYER                           │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Booking   │  │    Rooms    │  │   Weather   │            │
│  │   Service   │  │   Service   │  │   Service   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                  │
│         │                                    │                   │
│         │ async (SQS)                        │ sync              │
│         ▼                                    ▼                   │
│  ┌─────────────┐                    ┌─────────────┐            │
│  │  Financial  │                    │ Notification│            │
│  │   Service   │                    │   Service   │            │
│  │  (Payments) │                    │ (SNS + SES) │            │
│  └─────────────┘                    └─────────────┘            │
└──────────────────────────────────────────────────────────────────┘
                 │                              │
                 ▼                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  DynamoDB   │  │ AWS Cognito │  │     S3      │            │
│  │   Tables    │  │ (User Auth) │  │   (Images)  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│  - locations                                                     │
│  - conference_rooms                                              │
│  - bookings                                                      │
│  - pricing_rules                                                 │
│                                                                  │
│  Local: JSON file (backend/data/db.json)                        │
└──────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Monorepo with Independent Deployment

**Rationale:** Provides developer convenience while maintaining microservice scalability.

- **Single repository** contains all services
- **Path-filtered CI/CD** only deploys changed services
- **Independent Lambda functions** scale separately

### 2. Serverless-First Approach

**Rationale:** Cost-effective at variable scale, zero infrastructure management.

- **AWS Lambda** for compute (auto-scaling)
- **DynamoDB** for database (pay-per-request)
- **API Gateway** for routing
- **No EC2 instances** to manage

### 3. Asynchronous Decoupling

**Rationale:** Resilience - failures in payment/notification don't block user requests.

- **SQS** for payment processing queue
- **SNS** for notifications
- User gets immediate booking confirmation
- Payment processes asynchronously

### 4. Weather-Based Dynamic Pricing

**Rationale:** Demonstrates business logic complexity and service integration.

- Optimal temperature: 21°C
- Surcharge based on heating/cooling costs
- Pricing rules stored in database (no code deploy to change)

## Data Flow Examples

### Booking Flow

```
1. User submits booking request
   └─> Frontend: app/booking/[id]/page.tsx

2. Request hits API Gateway
   └─> Local: backend/routes/bookings.ts
   └─> AWS: aws/lambdas/booking/index.ts

3. Booking service fetches room details
   └─> DynamoDB rooms table

4. Booking service calls weather service (sync)
   └─> Gets temperature forecast
   └─> Calculates dynamic pricing

5. Booking saved with status: PENDING
   └─> DynamoDB bookings table

6. Payment message sent to SQS queue
   └─> Financial service picks up async

7. Financial service processes Stripe payment
   └─> Updates booking status: CONFIRMED

8. Notification sent via SNS → SES
   └─> User receives email confirmation
```

### Authentication Flow (Production)

```
1. User submits email/password
   └─> app/auth/page.tsx

2. Request to Cognito
   └─> AWS Cognito User Pool

3. Cognito returns JWT token
   └─> Stored in localStorage

4. Subsequent requests include token
   └─> API Gateway validates with Cognito
   └─> Lambda receives verified user context
```

## Technology Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **anime.js** - Vista-style animations
- **React 19** - UI library

### Backend (Local)
- **Express.js** - HTTP server
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **JSON file** - Database

### Backend (Production)
- **AWS Lambda** - Serverless functions
- **Node.js 20** - Runtime
- **AWS SDK v3** - AWS service clients

### Data
- **Local**: JSON file storage
- **Production**: DynamoDB (NoSQL)
- **Auth**: Local JWT / AWS Cognito
- **Storage**: S3 for images

### DevOps
- **GitHub Actions** - CI/CD
- **AWS SAM** - Infrastructure as Code
- **Docker** - Containerization (optional)
- **Jest** - Testing

## Security Architecture

### Authentication
- **Local**: JWT tokens with bcrypt password hashing
- **Production**: AWS Cognito with OAuth 2.0

### Authorization
- **API Gateway**: Cognito authorizer validates tokens
- **Lambda**: Receives verified user context
- **Database**: User ID attached to all bookings

### Data Protection
- **DynamoDB**: Encryption at rest enabled
- **API Gateway**: HTTPS only
- **Secrets**: AWS Secrets Manager for API keys

### Input Validation
- **Frontend**: Form validation with Zod schemas
- **Backend**: Request body validation
- **Database**: Conditional writes prevent race conditions

## Scalability Strategy

### Current Capacity
- **Concurrent users**: ~10,000
- **Bookings/month**: Unlimited (auto-scaling)
- **API requests/sec**: ~10,000 (Lambda + API Gateway limits)

### Bottlenecks
1. **Weather service synchronous call** - Adds latency to booking
2. **DynamoDB hot partition** - Popular room could throttle
3. **No caching** - Repeated room queries hit database

### Optimization Plan
1. **Pre-fetch weather** - Daily Lambda caches forecasts
2. **API Gateway caching** - Cache room/location data (TTL: 1 hour)
3. **DynamoDB DAX** - In-memory cache for reads
4. **CloudFront CDN** - Cache static content

## Cost Optimization

### Current: Pay-Per-Request
- Low traffic: ~$12/month
- High traffic: Scales linearly

### At Scale: Provisioned Capacity
- Switch DynamoDB to provisioned
- Use Reserved Lambda concurrency
- Estimated savings: 30-40% at steady high load

## Monitoring & Observability

### Metrics
- **CloudWatch**: Lambda invocations, errors, duration
- **API Gateway**: Request count, latency, 4xx/5xx errors
- **DynamoDB**: Consumed capacity, throttles

### Logging
- **All services**: Structured JSON logs to CloudWatch
- **Retention**: 7 days (configurable)
- **Search**: CloudWatch Insights queries

### Tracing (Optional)
- **AWS X-Ray**: Distributed request tracing
- Visualize service dependencies
- Identify slow operations

## Disaster Recovery

### Backup Strategy
- **DynamoDB**: Point-in-time recovery enabled
- **S3**: Versioning enabled
- **Code**: Git repository (GitHub)

### Recovery Objectives
- **RTO** (Recovery Time Objective): 1 hour
- **RPO** (Recovery Point Objective): 5 minutes (DynamoDB PITR)

### High Availability
- **Multi-AZ**: All AWS services are multi-AZ by default
- **No single point of failure**: Serverless architecture
- **Automatic failover**: Managed by AWS

## Testing Strategy

### Unit Tests
- **Framework**: Jest
- **Coverage**: Business logic, pricing calculations
- **Run**: On every commit (GitHub Actions)

### Integration Tests
- **Framework**: Bruno (API testing)
- **Coverage**: Full API endpoints
- **Run**: Before deployment

### E2E Tests (Future)
- **Framework**: Playwright
- **Coverage**: Complete user flows
- **Run**: Pre-production environment

## Future Enhancements

1. **Real-time Availability** - WebSocket connections for live updates
2. **Mobile App** - React Native using same API
3. **Admin Dashboard** - Room management, analytics
4. **Multi-currency** - International pricing
5. **Calendar Integration** - Google Calendar, Outlook sync
6. **Video Conferencing** - Zoom/Teams integration
```

```gitignore file="" isHidden
