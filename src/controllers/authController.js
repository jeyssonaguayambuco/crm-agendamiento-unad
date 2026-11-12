const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

async function mostrarRegistro(req, res) {
  res.render('registro', { error: null });
}

async function registrar(req, res) {
  const { nombre, apellido, correo, telefono, password } = req.body;
  try {
    const [existe] = await pool.query('SELECT id FROM usuarios WHERE correo = ?', [correo]);
    if (existe.length > 0) {
      return res.render('registro', { error: 'El correo ya se encuentra registrado' });
    }
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO usuarios (nombre, apellido, correo, telefono, password_hash, rol) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, apellido, correo, telefono, hash, 'cliente']
    );
    res.redirect('/login');
  } catch (error) {
    console.error(error);
    res.render('registro', { error: 'Ocurrió un error al registrar el usuario' });
  }
}

async function mostrarLogin(req, res) {
  res.render('login', { error: null });
}

async function iniciarSesion(req, res) {
  const { correo, password } = req.body;
  try {
    const [filas] = await pool.query('SELECT * FROM usuarios WHERE correo = ? AND activo = TRUE', [correo]);
    if (filas.length === 0) {
      return res.render('login', { error: 'Credenciales incorrectas' });
    }
    const usuario = filas[0];
    const coincide = await bcrypt.compare(password, usuario.password_hash);
    if (!coincide) {
      return res.render('login', { error: 'Credenciales incorrectas' });
    }
    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );
    res.cookie('token', token, { httpOnly: true });
    if (usuario.rol === 'administrador') {
      return res.redirect('/agenda');
    }
    return res.redirect('/mis-citas');
  } catch (error) {
    console.error(error);
    res.render('login', { error: 'Ocurrió un error al iniciar sesión' });
  }
}

function cerrarSesion(req, res) {
  res.clearCookie('token');
  res.redirect('/login');
}

module.exports = { mostrarRegistro, registrar, mostrarLogin, iniciarSesion, cerrarSesion };