// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Configure Neon PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon PostgreSQL
  }
});

// Initialize database
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sensor_data (
        id SERIAL PRIMARY KEY,
        temperature DECIMAL(5,2) NOT NULL,
        humidity DECIMAL(5,2) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized successfully');
    
    // Create index if it doesn't exist
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON sensor_data(timestamp)
    `);
    console.log('Database index created or already exists');
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
}

// API endpoint to receive data from ESP32
app.use(express.json());

app.post('/api/sensor-data', async (req, res) => {
  try {
    const { temperature, humidity } = req.body;
    
    // Validate data - ensure both are numbers before inserting into database
    const tempValue = parseFloat(temperature);
    const humidityValue = parseFloat(humidity);
    
    if (isNaN(tempValue) || isNaN(humidityValue)) {
      return res.status(400).json({ error: 'Invalid sensor data format - temperature and humidity must be numbers' });
    }
    
    // Insert data into database
    const result = await pool.query(
      'INSERT INTO sensor_data (temperature, humidity) VALUES ($1, $2) RETURNING *',
      [tempValue, humidityValue]
    );
    
    const newData = result.rows[0];
    
    // Emit data to all connected clients
    io.emit('sensorData', newData);
    
    res.status(201).json(newData);
  } catch (err) {
    console.error('Error saving sensor data:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Socket.IO connection handler
io.on('connection', async (socket) => {
  console.log('Client connected');
  
  // Send historical data when requested
  socket.on('getHistoricalData', async () => {
    try {
      // Get the last 100 records ordered by timestamp descending
      const result = await pool.query(
        'SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 100'
      );
      socket.emit('historicalData', result.rows);
    } catch (err) {
      console.error('Error fetching historical data:', err);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 3000;

initializeDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}/`);
  });
});