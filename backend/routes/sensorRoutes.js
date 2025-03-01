const express = require('express');
const router = express.Router();
const db = require('../database');

// Route to receive sensor data
router.post('/api/sensor-data', async (req, res) => {
  try {
    const { temperature, humidity } = req.body;
    
    if (isNaN(temperature) || isNaN(humidity)) {
      return res.status(400).json({ error: 'Invalid sensor data' });
    }
    
    const result = await db.query(
      'INSERT INTO sensor_data (temperature, humidity) VALUES ($1, $2) RETURNING *',
      [temperature, humidity]
    );
    
    res.status(201).json({
      message: 'Sensor data saved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error saving sensor data:', error);
    res.status(500).json({ error: 'Failed to save sensor data' });
  }
});

// Route to get all sensor data
router.get('/api/sensor-data', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 100'
    );
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error retrieving sensor data:', error);
    res.status(500).json({ error: 'Failed to retrieve sensor data' });
  }
});

// Route to get the latest sensor data
router.get('/api/sensor-data/latest', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No sensor data found' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error retrieving latest sensor data:', error);
    res.status(500).json({ error: 'Failed to retrieve latest sensor data' });
  }
});

module.exports = router;