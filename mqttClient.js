// mqttClient.js
const mqtt = require("mqtt");

// Set up the connection options
const mqttOptions = {
  host: "192.168.16.191", // Replace 'localhost' with your broker's IP address if needed
  port: 1883,
};

// Connect to the MQTT broker
const client = mqtt.connect(mqttOptions);

client.on("connect", () => {
  console.log("Connected to MQTT broker");
  client.subscribe("weather/temperature", (err) => {
    if (err) {
      console.error("Failed to subscribe:", err);
    } else {
      console.log("Subscribed to weather/temperature topic");
    }
  });
});

client.on("message", (topic, message) => {
  if (topic === "weather/temperature") {
    console.log("Temperature data received:", message.toString());
    // The message is processed by server.js for further handling
  }
});

module.exports = client;
