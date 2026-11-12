const jwt = require('jsonwebtoken');
require('dotenv').config();

function verificarToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login');
  }
  try {
    const datos = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = datos;
    next();
  } catch (error) {
    res.clearCookie('token');
    return res.redirect('/login');
  }
}

function soloAdministrador(req, res, next) {
  if (req.usuario && req.usuario.rol === 'administrador') {
    return next();
  }
  return res.status(403).send('Acceso denegado: se requiere rol de administrador');
}

module.exports = { verificarToken, soloAdministrador };