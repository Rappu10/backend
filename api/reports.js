const express = require('express');
const Report = require('../models/reporte');

const router = express.Router();

// Obtener todos los reportes
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find();
    res.json(reports);
  } catch (error) {
    console.error('Error al obtener reportes:', error);
    res.status(500).json({ message: 'Error al obtener reportes' });
  }
});

// Crear nuevo reporte
router.post('/', async (req, res) => {
  try {
    const newReport = new Report(req.body);
    await newReport.save();
    res.status(201).json(newReport);
  } catch (error) {
    console.error('Error creando reporte:', error);
    res.status(500).json({ message: 'Error al crear el reporte' });
  }
});

module.exports = router;