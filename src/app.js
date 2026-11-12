const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public')));
const authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes);
const agendaRoutes = require('./routes/agendaRoutes');
app.use('/', agendaRoutes);
const clienteRoutes = require('./routes/clienteRoutes');
app.use('/', clienteRoutes);
app.get('/', (req, res) => {
  res.redirect('/login');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});