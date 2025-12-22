#!/bin/bash
# aws/seed-prod.sh

echo "🌱 Seeding Pricing Rules..."
# 1. Pricing Rules (Critical for the app to calculate costs)
aws dynamodb put-item --table-name pricing-rules --item '{"rule_id": {"S": "high_temp"}, "type": {"S": "temperature"}, "condition": {"S": "high"}, "surchargePercent": {"N": "20"}}' --region us-east-1
aws dynamodb put-item --table-name pricing-rules --item '{"rule_id": {"S": "low_temp"}, "type": {"S": "temperature"}, "condition": {"S": "low"}, "surchargePercent": {"N": "10"}}' --region us-east-1

echo "🌱 Seeding 9 Conference Rooms..."

# Room 1: The Azure (Large)
aws dynamodb put-item \
    --table-name conference-rooms \
    --item '{"room_id": {"S": "1"}, "location_id": {"S": "Building A"}, "name": {"S": "Azure Executive Suite"}, "description": {"S": "Premium boardroom with panoramic views and video conferencing."}, "capacity": {"N": "20"}, "imageUrl": {"S": "https://conference-room-images-689221034271.s3.us-east-1.amazonaws.com/meetRoom1.webp"}, "pricePerHour": {"N": "100"}, "available": {"BOOL": true}}' \
    --region us-east-1

# Room 2: The Vista (Medium)
aws dynamodb put-item \
    --table-name conference-rooms \
    --item '{"room_id": {"S": "2"}, "location_id": {"S": "Building B"}, "name": {"S": "Vista Collaborative Space"}, "description": {"S": "Open plan meeting space perfect for creative workshops."}, "capacity": {"N": "12"}, "imageUrl": {"S": "https://conference-room-images-689221034271.s3.us-east-1.amazonaws.com/meetRoom2.webp"}, "pricePerHour": {"N": "60"}, "available": {"BOOL": true}}' \
    --region us-east-1

# Room 3: The Aero (Small)
aws dynamodb put-item \
    --table-name conference-rooms \
    --item '{"room_id": {"S": "3"}, "location_id": {"S": "Building A"}, "name": {"S": "Aero Huddle Room"}, "description": {"S": "Quiet space for quick syncs and interviews."}, "capacity": {"N": "4"}, "imageUrl": {"S": "https://conference-room-images-689221034271.s3.us-east-1.amazonaws.com/meetRoom3.webp"}, "pricePerHour": {"N": "30"}, "available": {"BOOL": true}}' \
    --region us-east-1

# Room 4: The Summit (Large)
aws dynamodb put-item \
    --table-name conference-rooms \
    --item '{"room_id": {"S": "4"}, "location_id": {"S": "Building C"}, "name": {"S": "Summit Hall"}, "description": {"S": "Spacious hall for town halls and large presentations."}, "capacity": {"N": "50"}, "imageUrl": {"S": "https://conference-room-images-689221034271.s3.us-east-1.amazonaws.com/meetRoom4.webp"}, "pricePerHour": {"N": "150"}, "available": {"BOOL": true}}' \
    --region us-east-1

# Room 5: The Pixel (Creative)
aws dynamodb put-item \
    --table-name conference-rooms \
    --item '{"room_id": {"S": "5"}, "location_id": {"S": "Building B"}, "name": {"S": "Pixel Lab"}, "description": {"S": "Equipped with whiteboards and design tools for brainstorming."}, "capacity": {"N": "8"}, "imageUrl": {"S": "https://conference-room-images-689221034271.s3.us-east-1.amazonaws.com/meetRoom5.webp"}, "pricePerHour": {"N": "45"}, "available": {"BOOL": true}}' \
    --region us-east-1

# Room 6: The Quantum (Tech)
aws dynamodb put-item \
    --table-name conference-rooms \
    --item '{"room_id": {"S": "6"}, "location_id": {"S": "Building A"}, "name": {"S": "Quantum Data Room"}, "description": {"S": "High-tech room with multiple screens and high-speed ethernet."}, "capacity": {"N": "10"}, "imageUrl": {"S": "https://conference-room-images-689221034271.s3.us-east-1.amazonaws.com/meetRoom6.webp"}, "pricePerHour": {"N": "75"}, "available": {"BOOL": true}}' \
    --region us-east-1

# Room 7: The Nexus (Standard)
aws dynamodb put-item \
    --table-name conference-rooms \
    --item '{"room_id": {"S": "7"}, "location_id": {"S": "Building C"}, "name": {"S": "Nexus Meeting Room"}, "description": {"S": "Standard efficient room for daily standups."}, "capacity": {"N": "6"}, "imageUrl": {"S": "https://conference-room-images-689221034271.s3.us-east-1.amazonaws.com/meetRoom7.webp"}, "pricePerHour": {"N": "40"}, "available": {"BOOL": true}}' \
    --region us-east-1

# Room 8: The Echo (Private)
aws dynamodb put-item \
    --table-name conference-rooms \
    --item '{"room_id": {"S": "8"}, "location_id": {"S": "Building B"}, "name": {"S": "Echo Pod"}, "description": {"S": "Soundproof pod for confidential calls."}, "capacity": {"N": "2"}, "imageUrl": {"S": "https://conference-room-images-689221034271.s3.us-east-1.amazonaws.com/meetRoom8.webp"}, "pricePerHour": {"N": "20"}, "available": {"BOOL": true}}' \
    --region us-east-1

# Room 9: The Horizon (View)
aws dynamodb put-item \
    --table-name conference-rooms \
    --item '{"room_id": {"S": "9"}, "location_id": {"S": "Building A"}, "name": {"S": "Horizon Lounge"}, "description": {"S": "Relaxed seating with a view of the city skyline."}, "capacity": {"N": "15"}, "imageUrl": {"S": "https://conference-room-images-689221034271.s3.us-east-1.amazonaws.com/meetRoom9.webp"}, "pricePerHour": {"N": "80"}, "available": {"BOOL": true}}' \
    --region us-east-1

echo "✅ Production Database Seeded Successfully!"