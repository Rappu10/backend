require('dotenv').config();
const PORT = process.env.PORT || 3000; 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');

// Importación de rutas externas
const reportRoutes = require('./api/reports');
const sensorRoutes = require('./routes/sensores'); 

// ✅ Instancia de Express primero
const app = express();

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// ✅ Rutas
app.use('/api/reports', reportRoutes);
app.use('/api/sensores', sensorRoutes);

// ✅ Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch((err) => console.error('❌ Error al conectar a MongoDB:', err));

// ✅ Modelo de Usuario
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
});
const User = mongoose.model('User', userSchema);

// ✅ Registro de usuario
app.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Usuario ya existe' });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashed, role });
    await newUser.save();

    res.status(201).json({ message: 'Usuario creado' });
  } catch (err) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// ✅ Login de usuario
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Usuario no encontrado' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Contraseña incorrecta' });

    res.json({ message: 'Login exitoso', userId: user._id, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Reemplaza app.listen() por esto:
if (require.main === module) {
 app.listen(PORT, () => {  // ← Así debe quedar
  console.log(`Servidor en puerto ${PORT}`);
});
module.exports = app; }