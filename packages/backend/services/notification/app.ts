import { SNSEvent } from 'aws-lambda';

export const handler = async (event: SNSEvent): Promise<void> => {
  for (const record of event.Records) {
    const msg = JSON.parse(record.Sns.Message);
    // In a real app, use AWS SES here. For now, log it.
    console.log(`[EMAIL SENT] Subject: Booking Confirmed. Body: ${msg.message} (ID: ${msg.bookingId})`);
  }
};