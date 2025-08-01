require('dotenv').config();

// Simple connection test
const { CosmosClient } = require("@azure/cosmos");

async function testConnection() {
  try {
    console.log("Connecting to Cosmos DB...");
    const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
    
    // List databases to verify connection
    const { resources: databases } = await client.databases.readAll().fetchAll();
    console.log("Connection successful! Found databases:", databases.map(db => db.id));
    
    // Create database if needed
    const databaseId = process.env.COSMOS_DATABASE_NAME || "testcosmos1";
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    console.log(`Using database: ${database.id}`);
    
    // Create container if needed
    const containerId = process.env.COSMOS_USERS_CONTAINER || "Users";
    const { container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { paths: ["/id"] }
    });
    console.log(`Using container: ${container.id}`);
    
  } catch (err) {
    console.error("Connection failed:", err.message);
    console.log("\nTroubleshooting tips:");
    console.log("1. Verify your .env file exists and has correct permissions");
    console.log("2. Check your connection string format");
    console.log("3. Ensure Cosmos DB account is running in Azure portal");
    console.log("4. Make sure you're using the correct API (SQL)");
  }
}

testConnection();