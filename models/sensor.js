const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
  tipo: String,
  valor: String,
  estado: String,
});

module.exports = mongoose.model('Sensor', sensorSchema, 'sensor_readings');