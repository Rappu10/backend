const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  reportType: {
    type: String,
    enum: ['URGENTE', 'Comun'],
    required: true, // Ahora el usuario debe escoger el tipo
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (val) => val.length === 2,
        message: 'Coordenadas inválidas',
      },
    },
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  status: {
    type: String,
    enum: ['PENDIENTE', 'EN_PROCESO', 'RESUELTO'],
    required: true, // Ahora el usuario debe escoger el estado
  },
  createDate: { type: Date, default: () => new Date() },
  solutionDate: { type: Date, default: null },
});

reportSchema.index({ location: '2dsphere' });

module.exports = mongoose.models.Report || mongoose.model('Report', reportSchema, 'reports');