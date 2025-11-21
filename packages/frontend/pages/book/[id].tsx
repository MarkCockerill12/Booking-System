// packages/frontend/pages/book/[id].tsx
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { AeroCard } from '../components/AeroCard';
import { useApi } from '../hooks/useApi';
import styles from '../styles/AeroTheme.module.css';

// Mock Room Data for Display (assuming data came from the search page)
const DUMMY_ROOM = {
  id: 'R1-MOCK',
  name: 'Executive Suite - Dundee',
  capacity: 10,
  location: 'Dundee HQ',
  basePrice: 100.00,
  description: 'Premium room for executive meetings. Great view of the Tay.',
  imageUrl: 'placeholder.jpg',
  temp: 28, // Simulating the weather service has returned this forecast
};

const BookingPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { callApi, isLoading, error, data } = useApi();
  
  const [bookingStatus, setBookingStatus] = useState<'IDLE' | 'PROCESSING' | 'CONFIRMED' | 'ERROR'>('IDLE');
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [totalPrice, setTotalPrice] = useState(DUMMY_ROOM.basePrice);

  useEffect(() => {
    // 1. Initial Logic (Simulate Sync calls for price calculation)
    // In a real flow, the frontend would call an API endpoint to get 
    // the final calculated price *before* showing the "Book" button.
    
    // For this demo, we'll calculate the surcharge on the frontend based on the mock temp.
    const tempDiff = Math.abs(DUMMY_ROOM.temp - 21); // Diff from 21°C
    let surcharge = 0;
    if (tempDiff >= 2 && tempDiff < 5) surcharge = 0.10;
    else if (tempDiff >= 5 && tempDiff < 10) surcharge = 0.20;
    else if (tempDiff >= 10 && tempDiff < 20) surcharge = 0.30;
    else if (tempDiff >= 20) surcharge = 0.50;

    const finalPrice = DUMMY_ROOM.basePrice * (1 + surcharge);
    setTotalPrice(finalPrice);
  }, []);

  const handleBook = async () => {
    setBookingStatus('PROCESSING');
    
    // 2. Call the Booking Service (Orchestrator)
    const bookingPayload = {
      roomId: id, 
      date: new Date().toISOString().split('T')[0],
      // Note: The service itself recalculates the price by calling the Weather Service
      // and then initiating the SQS payment process.
    };

    const result = await callApi<any>('/book', 'POST', bookingPayload);

    if (result && result.status === 'PENDING') {
      setBookingDetails(result);
      // The Booking Service returns PENDING, confirming ASYNC payment handoff.
      setBookingStatus('PROCESSING'); 

      // 3. Optional: Start Polling the DB for CONFIRMED status (best practice for async)
      // We skip the polling loop here for demo simplicity, but would check /book/{id}
      // until the status changes from PENDING to CONFIRMED.

    } else {
      setBookingStatus('ERROR');
      setBookingDetails(null);
    }
  };
  
  const renderStatus = () => {
    if (error) {
      return (
        <p className="text-red-700 font-semibold mb-4">
          ⚠️ {error}
        </p>
      );
    }
    if (bookingStatus === 'PROCESSING') {
      return (
        <div className="bg-yellow-100 p-3 rounded border border-yellow-400">
          <p className="text-yellow-700 font-semibold">
            ⏳ Processing Payment Asynchronously... 
            <span className="block text-sm font-normal mt-1">
              (Booking Service -> SQS -> Financial Service)
            </span>
          </p>
          {bookingDetails && (
            <p className="text-xs mt-2">Booking ID: {bookingDetails.bookingId}</p>
          )}
        </div>
      );
    }
    if (bookingStatus === 'CONFIRMED') {
      return (
        <div className="bg-green-100 p-3 rounded border border-green-400 text-green-700 font-semibold">
          ✅ Booking CONFIRMED! Notification email sent via SNS/SES.
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center justify-center pt-10">
      <AeroCard title={`Booking: ${DUMMY_ROOM.name}`} className="max-w-xl p-8 relative">
        <div className="absolute top-2 right-2 flex space-x-2 text-3xl">
          <span className="text-yellow-600">📧</span>
          <span className="text-purple-600">👤</span>
        </div>

        <div className="h-40 bg-gray-300 mb-4 mx-auto w-3/4">
          <p className="text-sm p-1 text-center">Room Image Placeholder</p>
        </div>

        <h3 className="text-xl font-bold mb-2">Room Details</h3>
        <p className="mb-2 text-gray-700">Description: {DUMMY_ROOM.description}</p>
        <p className="mb-2 text-gray-700">Capacity: {DUMMY_ROOM.capacity}</p>
        <p className="mb-4 text-gray-700">Location: {DUMMY_ROOM.location}</p>

        <div className="border-t border-gray-300 pt-4">
          <h3 className="text-xl font-bold mb-2 text-red-600">Pricing Breakdown</h3>
          <p className="text-lg">Base Price: £{DUMMY_ROOM.basePrice.toFixed(2)}</p>
          <p className="text-lg">Weather Surcharge: +£{(totalPrice - DUMMY_ROOM.basePrice).toFixed(2)}</p>
          <p className="text-2xl font-extrabold mt-2 text-blue-800">Total Price: £{totalPrice.toFixed(2)}</p>
          <p className="text-xs mt-1 text-gray-500 italic">
            (Based on simulated {DUMMY_ROOM.temp}°C forecast. Surcharge accounts for cooling costs.)
          </p>
        </div>

        <div className="mt-6">
          {renderStatus()}
        </div>

        <button 
          className={`${styles.aeroButton} w-full py-3 text-lg font-semibold mt-4`} 
          onClick={handleBook}
          disabled={isLoading || bookingStatus === 'PROCESSING'}
        >
          {isLoading ? 'Checking Availability...' : 'Book Room'}
        </button>
      </AeroCard>
    </div>
  );
};

export default BookingPage;