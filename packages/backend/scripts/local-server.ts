import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { handler as bookingHandler } from '../services/booking/app';
import { handler as financialHandler } from '../services/financial/app';
import { handler as refundHandler } from '../services/refund/app';
import { handler as weatherHandler } from '../services/weather/app';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- 1. MOCK API GATEWAY ROUTES ---

// POST /book -> Booking Service
app.post('/book', async (req, res) => {
  console.log('📍 [Local API] Request: POST /book');
  
  // Construct a fake Lambda event
  const event: any = {
    httpMethod: 'POST',
    body: JSON.stringify(req.body),
    requestContext: { authorizer: { claims: { sub: 'local-user-123' } } }
  };

  try {
    // Call the TypeScript handler directly
    const result = await bookingHandler(event);
    res.status(result.statusCode).set(result.headers).send(result.body);
    
    // SIMULATE SQS: If booking was successful, trigger Financial Service immediately
    if (result.statusCode === 202) {
        const body = JSON.parse(result.body as string);
        console.log('🔄 [Local Bus] Simulating SQS Message to Financial Service...');
        
        // Create a fake SQS Event
        const sqsEvent: any = {
            Records: [{ body: JSON.stringify({ 
                bookingId: body.bookingId, 
                price: 100, // simplified for mock
                userId: 'local-user-123',
                isBypass: true 
            }) }]
        };
        // Run Financial Service in background
        financialHandler(sqsEvent); 
    }

  } catch (e: any) {
    console.error(e);
    res.status(500).send(e.message);
  }
});

// GET /search/rooms -> Mock Data (Since we don't have a Lambda for this in the plan, we mock it here)
app.get('/search/rooms', (req, res) => {
    console.log('📍 [Local API] Request: GET /search/rooms');
    res.json([
        { id: 'R1', name: 'Executive Suite', capacity: 10, location: 'Dundee HQ', price: 120, description: 'Luxury suite.' },
        { id: 'R2', name: 'Focus Pod', capacity: 4, location: 'Glasgow', price: 60, description: 'Quiet pod.' }
    ]);
});

// --- 2. START SERVER ---
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`
  🚀 LOCAL CLOUD ENVIRONMENT STARTED
  ----------------------------------
  Endpoint: http://localhost:${PORT}
  DynamoDB: http://dynamodb-local:8000
  ----------------------------------
  `);
});