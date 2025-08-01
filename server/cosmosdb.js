const { CosmosClient } = require("@azure/cosmos");

// Make sure this matches your actual connection string format
const connectionString = process.env.COSMOS_CONNECTION_STRING || 
  "AccountEndpoint=https://localhost:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";

const client = new CosmosClient(connectionString); // Pass the string directly
const database = client.database(process.env.COSMOS_DATABASE_NAME || "test1cosmos ");
const usersContainer = database.container(process.env.COSMOS_USERS_CONTAINER || "Users");
const questionsContainer = database.container('questions');
module.exports = { usersContainer ,questionsContainer};