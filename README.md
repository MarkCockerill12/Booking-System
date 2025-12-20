# Conference Room Booking System

A full-stack **microservices** booking system with AWS backend and Vercel frontend.

## 🏗️ Architecture

**Frontend**: Next.js on Vercel  
**Backend**: 5 AWS Lambda microservices + API Gateway

```
Vercel (Frontend) → AWS API Gateway → Lambda Functions
                                      ├─ Auth (Cognito)
                                      ├─ Bookings (DynamoDB)
                                      ├─ Rooms (DynamoDB)
                                      ├─ Weather (OpenWeather)
                                      ├─ Financial (Stripe)
                                      └─ Notifications (SES)
```

## 🚀 Quick Start

**See [MICROSERVICES-DEPLOYMENT.md](MICROSERVICES-DEPLOYMENT.md) for complete deployment instructions.**

### 1. Deploy AWS Backend
```bash
sam build --template-file aws/template.yaml
sam deploy --guided
```

### 2. Deploy Frontend to Vercel
```bash
# Add AWS API Gateway URL to .env.local
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.amazonaws.com/prod

# Deploy
vercel --prod
```

---

## 🎯 Features

- 🔐 **Authentication**: AWS Cognito (production) / JWT (local dev)
- 🔍 **Room Search**: Filter by capacity, location, availability
- 🌡️ **Dynamic Pricing**: Weather-based price adjustments
- 💳 **Payments**: Stripe integration via Financial Lambda
- 📧 **Notifications**: Email confirmations via SES
- 🎨 **UI Design**: Frutiger Aero / Windows Vista glassmorphism

## 📦 Tech Stack

**Frontend** (Vercel):
- Next.js 15 + React 19 + TypeScript
- TailwindCSS v4 + anime.js
- Vercel deployment

**Backend** (AWS):
- 5 Lambda Functions (Node.js 20)
- API Gateway + Cognito
- DynamoDB (4 tables)
- Stripe + SES + SNS + SQS

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Run development server (uses local /app/api routes)
npm run dev

# Open http://localhost:3000
```

**Note**: Local dev uses `app/api/` routes with JSON database. These won't be deployed to production (AWS backend is used instead).

---

## 📝 License

MIT


This will start:
- Frontend on http://localhost:3000
- Backend API on http://localhost:3001

### Project Structure

```
/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── auth/              # Authentication pages
│   ├── search/            # Room search
│   └── booking/           # Booking flow
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── vista/            # Vista-styled components
---

## 📝 License

MIT
