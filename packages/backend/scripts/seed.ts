import { DynamoDBClient, CreateTableCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

// Connect to the LOCAL Docker database
const client = new DynamoDBClient({
  region: "us-east-1",
  // FIX: Use the exact container name defined in docker-compose.yml
  endpoint: process.env.DYNAMODB_ENDPOINT || "http://dynamo-local:8000",
  credentials: { accessKeyId: "fake", secretAccessKey: "fake" }
});

const createTables = async () => {
  const tables = [
    { name: "bookings", key: "id" },
    { name: "conference_rooms", key: "id" },
    { name: "locations", key: "id" },
    { name: "pricing_rules", key: "id" }
  ];
  
  for (const table of tables) {
    try {
      await client.send(new CreateTableCommand({
        TableName: table.name,
        KeySchema: [{ AttributeName: table.key, KeyType: "HASH" }],
        AttributeDefinitions: [{ AttributeName: table.key, AttributeType: "S" }],
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      }));
      console.log(`✅ Created table: ${table.name}`);
    } catch (e: any) {
      if (e.name === 'ResourceInUseException') {
        console.log(`⚠️ Table ${table.name} already exists.`);
      } else {
        console.error(`❌ Error creating ${table.name}:`, e.message);
      }
    }
  }
};

const seedData = async () => {
  const rooms = [
    { id: "R1", name: "Executive Suite", location: "Dundee HQ", capacity: 10, basePrice: 120, imageUrl: "/room-1.jpg" },
    { id: "R2", name: "Focus Pod", location: "Glasgow Office", capacity: 4, basePrice: 60, imageUrl: "/room-2.jpg" }
  ];

  for (const room of rooms) {
    try {
      await client.send(new PutItemCommand({
        TableName: "conference_rooms",
        Item: marshall(room)
      }));
      console.log(`🌱 Seeded room: ${room.name}`);
    } catch (e: any) {
      console.error(`❌ Error seeding room ${room.name}:`, e.message);
    }
  }
};

const run = async () => {
  console.log("⏳ Starting Database Seeding...");
  await createTables();
  await seedData();
  console.log("✨ Database Seeding Complete!");
};

run();