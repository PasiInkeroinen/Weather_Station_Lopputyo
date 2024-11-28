// server.js
const express = require("express");
const mqttClient = require("./mqttClient");
const path = require("path");
const { MongoClient } = require("mongodb");

// Set up MongoDB connection
const uri = "mongodb://localhost:27017"; // Local MongoDB server URI
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db;

// Connect to MongoDB
client
  .connect()
  .then(() => {
    console.log("Connected successfully to MongoDB");
    db = client.db("weather_station"); // Database name: 'weather_station'
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });

const app = express();
const port = 3000;

// Initialize a variable to store the latest temperature data
let temperatureData = "No data received yet";

// Handle incoming MQTT messages and store temperature data
mqttClient.on("message", async (topic, message) => {
  if (topic === "weather/temperature") {
    temperatureData = message.toString();
    console.log("Temperature data received:", temperatureData);

    // Save the temperature data to MongoDB
    try {
      if (db) {
        const collection = db.collection("temperature_readings");
        const result = await collection.insertOne({
          temperature: parseFloat(temperatureData),
          timestamp: new Date(),
        });
        console.log("Temperature data inserted:", result.insertedId);
      }
    } catch (err) {
      console.error("Failed to insert temperature data:", err);
    }
  }
});

// REST API endpoint to retrieve the latest temperature data
app.get("/clients/1/data.json", (req, res) => {
  res.json({
    temperature: temperatureData,
    status: "active", // Placeholder for additional status info
  });
});

// REST API endpoint to retrieve all historical data
app.get("/clients/1/data/history", async (req, res) => {
  try {
    if (db) {
      const collection = db.collection("temperature_readings");
      const history = await collection
        .find()
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();
      res.json(history);
    } else {
      res.status(500).send("Database not initialized");
    }
  } catch (err) {
    console.error("Failed to retrieve data:", err);
    res.status(500).send("Failed to retrieve data");
  }
});

// REST API endpoint to retrieve historical data for a specific date range
app.get("/clients/1/data/history/range", async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).send("Please provide both start and end dates");
  }

  try {
    if (db) {
      const collection = db.collection("temperature_readings");
      const history = await collection
        .find({
          timestamp: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        })
        .sort({ timestamp: 1 })
        .toArray();

      res.json(history);
    } else {
      res.status(500).send("Database not initialized");
    }
  } catch (err) {
    console.error("Failed to retrieve data:", err);
    res.status(500).send("Failed to retrieve data");
  }
});

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Start the Express server
app.listen(port, () => {
  console.log(`Weather station server is running at http://localhost:${port}`);
});
