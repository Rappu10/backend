const express = require('express');
const router = express.Router();
const Sensor = require('../models/sensor');

// Crear un nuevo sensor
router.post('/', async (req, res) => {
  try {
    const nuevoSensor = new Sensor(req.body);
    const guardado = await nuevoSensor.save();
    res.status(201).json(guardado);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Obtener todos los sensores
router.get('/', async (req, res) => {
  try {
    const sensores = await Sensor.find();
    res.json(sensores);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;