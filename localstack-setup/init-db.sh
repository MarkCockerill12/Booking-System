#!/bin/bash
echo "Initializing DynamoDB tables..."

# 1. conference-bookings
awslocal dynamodb create-table \
    --table-name conference-bookings \
    --attribute-definitions \
        AttributeName=booking_id,AttributeType=S \
        AttributeName=user_id,AttributeType=S \
        AttributeName=room_id,AttributeType=S \
        AttributeName=booking_date,AttributeType=S \
    --key-schema \
        AttributeName=booking_id,KeyType=HASH \
    --global-secondary-indexes \
        "[
            {
                \"IndexName\": \"user-index\",
                \"KeySchema\": [{\"AttributeName\":\"user_id\",\"KeyType\":\"HASH\"}],
                \"Projection\": {\"ProjectionType\":\"ALL\"}
            },
            {
                \"IndexName\": \"room-date-index\",
                \"KeySchema\": [{\"AttributeName\":\"room_id\",\"KeyType\":\"HASH\"}, {\"AttributeName\":\"booking_date\",\"KeyType\":\"RANGE\"}],
                \"Projection\": {\"ProjectionType\":\"ALL\"}
            }
        ]" \
    --billing-mode PAY_PER_REQUEST

# 2. conference-rooms
awslocal dynamodb create-table \
    --table-name conference-rooms \
    --attribute-definitions \
        AttributeName=room_id,AttributeType=S \
        AttributeName=location_id,AttributeType=S \
    --key-schema \
        AttributeName=room_id,KeyType=HASH \
    --global-secondary-indexes \
        "[
            {
                \"IndexName\": \"location-index\",
                \"KeySchema\": [{\"AttributeName\":\"location_id\",\"KeyType\":\"HASH\"}],
                \"Projection\": {\"ProjectionType\":\"ALL\"}
            }
        ]" \
    --billing-mode PAY_PER_REQUEST

# 3. pricing-rules
awslocal dynamodb create-table \
    --table-name pricing-rules \
    --attribute-definitions \
        AttributeName=rule_id,AttributeType=S \
    --key-schema \
        AttributeName=rule_id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST

# 4. payments
awslocal dynamodb create-table \
    --table-name payments \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=bookingId,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        "[
            {
                \"IndexName\": \"booking-index\",
                \"KeySchema\": [{\"AttributeName\":\"bookingId\",\"KeyType\":\"HASH\"}],
                \"Projection\": {\"ProjectionType\":\"ALL\"}
            }
        ]" \
    --billing-mode PAY_PER_REQUEST

echo "🌱 Seeding Database..."

# Room 1: Azure Conference Room
awslocal dynamodb put-item \
    --table-name conference-rooms \
    --item '{"room_id": {"S": "1"}, "location_id": {"S": "Building A"}, "name": {"S": "Azure Conference Room"}, "description": {"S": "Large conference room with video conferencing capabilities and stunning glass windows"}, "capacity": {"N": "20"}, "location": {"S": "Building A, Floor 3"}, "imageUrl": {"S": "data:image/svg+xml,%3Csvg width=\"600\" height=\"400\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cdefs%3E%3ClinearGradient id=\"g\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"%3E%3Cstop offset=\"0%25\" style=\"stop-color:%233B82F6\"/%3E%3Cstop offset=\"50%25\" style=\"stop-color:%2306B6D4\"/%3E%3Cstop offset=\"100%25\" style=\"stop-color:%2310B981\"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=\"600\" height=\"400\" fill=\"url(%23g)\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" text-anchor=\"middle\" dy=\".3em\" fill=\"white\" font-size=\"48\" font-family=\"Arial\" font-weight=\"bold\"%3EAzure%3C/text%3E%3C/svg%3E"}, "amenities": {"SS": ["Projector", "Whiteboard", "Video Conferencing", "WiFi", "Coffee Machine"]}, "pricePerHour": {"N": "50"}, "available": {"BOOL": true}}'

# Room 2: Vista Meeting Space
awslocal dynamodb put-item \
    --table-name conference-rooms \
    --item '{"room_id": {"S": "2"}, "location_id": {"S": "Building B"}, "name": {"S": "Vista Meeting Space"}, "description": {"S": "Medium-sized meeting room perfect for team collaboration with natural lighting"}, "capacity": {"N": "10"}, "location": {"S": "Building B, Floor 2"}, "imageUrl": {"S": "data:image/svg+xml,%3Csvg width=\"600\" height=\"400\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cdefs%3E%3ClinearGradient id=\"g\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"%3E%3Cstop offset=\"0%25\" style=\"stop-color:%238B5CF6\"/%3E%3Cstop offset=\"50%25\" style=\"stop-color:%23EC4899\"/%3E%3Cstop offset=\"100%25\" style=\"stop-color:%23F59E0B\"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=\"600\" height=\"400\" fill=\"url(%23g)\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" text-anchor=\"middle\" dy=\".3em\" fill=\"white\" font-size=\"48\" font-family=\"Arial\" font-weight=\"bold\"%3EVista%3C/text%3E%3C/svg%3E"}, "amenities": {"SS": ["TV Screen", "Whiteboard", "WiFi", "Air Conditioning"]}, "pricePerHour": {"N": "35"}, "available": {"BOOL": true}}'

# Room 3: Aero Huddle Room
awslocal dynamodb put-item \
    --table-name conference-rooms \
    --item '{"room_id": {"S": "3"}, "location_id": {"S": "Building A"}, "name": {"S": "Aero Huddle Room"}, "description": {"S": "Small intimate space for quick meetings and brainstorming sessions"}, "capacity": {"N": "5"}, "location": {"S": "Building A, Floor 1"}, "imageUrl": {"S": "data:image/svg+xml,%3Csvg width=\"600\" height=\"400\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cdefs%3E%3ClinearGradient id=\"g\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"%3E%3Cstop offset=\"0%25\" style=\"stop-color:%2310B981\"/%3E%3Cstop offset=\"50%25\" style=\"stop-color:%2306B6D4\"/%3E%3Cstop offset=\"100%25\" style=\"stop-color:%233B82F6\"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=\"600\" height=\"400\" fill=\"url(%23g)\"/%3E%3Ctext x=\"50%25\" y=\"50%25\" text-anchor=\"middle\" dy=\".3em\" fill=\"white\" font-size=\"48\" font-family=\"Arial\" font-weight=\"bold\"%3EAero%3C/text%3E%3C/svg%3E"}, "amenities": {"SS": ["TV Screen", "WiFi", "Comfortable Seating"]}, "pricePerHour": {"N": "20"}, "available": {"BOOL": true}}'

# Pricing Rules
awslocal dynamodb put-item \
    --table-name pricing-rules \
    --item '{"rule_id": {"S": "high_temp"}, "type": {"S": "temperature"}, "condition": {"S": "high"}, "surchargePercent": {"N": "20"}}'

awslocal dynamodb put-item \
    --table-name pricing-rules \
    --item '{"rule_id": {"S": "low_temp"}, "type": {"S": "temperature"}, "condition": {"S": "low"}, "surchargePercent": {"N": "10"}}'

echo "DynamoDB initialization complete."
