# Local Development Setup Script

echo "🔧 Setting up local development environment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Installation failed"
    exit 1
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env.local.example .env.local 2>/dev/null || echo "⚠️  Please create .env.local manually"
fi

# Create backend data directory
echo "📁 Creating data directory..."
mkdir -p backend/data

# Initialize database
echo "🗄️  Initializing local database..."
cat > backend/data/db.json << 'EOF'
{
  "users": [],
  "locations": [
    {
      "location_id": "loc-1",
      "name": "London Office",
      "address": "123 Tech Street, London, UK"
    },
    {
      "location_id": "loc-2",
      "name": "Manchester Hub",
      "address": "456 Innovation Drive, Manchester, UK"
    },
    {
      "location_id": "loc-3",
      "name": "Edinburgh Center",
      "address": "789 Business Park, Edinburgh, UK"
    }
  ],
  "conference_rooms": [
    {
      "room_id": "room-1",
      "location_id": "loc-1",
      "name": "Thames Conference Room",
      "capacity": 12,
      "description": "Spacious room with video conferencing facilities",
      "base_price": 150,
      "image_url": "/images/room1.jpg"
    },
    {
      "room_id": "room-2",
      "location_id": "loc-1",
      "name": "Big Ben Meeting Room",
      "capacity": 8,
      "description": "Modern meeting space with whiteboard",
      "base_price": 100,
      "image_url": "/images/room2.jpg"
    },
    {
      "room_id": "room-3",
      "location_id": "loc-2",
      "name": "Northern Quarter Room",
      "capacity": 15,
      "description": "Large conference room with projector",
      "base_price": 180,
      "image_url": "/images/room3.jpg"
    }
  ],
  "bookings": [],
  "pricing_rules": [
    {
      "rule_id": "rule-1",
      "name": "Optimal Temperature",
      "description": "No surcharge within 2°C of 21°C",
      "temperature_min": 19,
      "temperature_max": 23,
      "surcharge_percentage": 0
    }
  ]
}
EOF

echo "✅ Local setup complete!"
echo ""
echo "🚀 To start the development server:"
echo "   npm run dev"
echo ""
echo "This will start:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:3001"
