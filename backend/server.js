const express = require('express');
const bodyParser = require('body-parser');
const sensorRoutes = require('./routes/sensorRoutes');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use(sensorRoutes);

// EJS Routes
app.get('/', async (req, res) => {
  res.render('index');
});

app.get('/dashboard', async (req, res) => {
  res.render('dashboard');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});