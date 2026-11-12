const express = require('express');
const router = express.Router();
const cliente = require('../controllers/clienteController');
const { verificarToken } = require('../middlewares/auth');

router.get('/mis-citas', verificarToken, cliente.misCitas);
router.get('/reservar', verificarToken, cliente.mostrarReserva);
router.post('/reservar/disponibilidad', verificarToken, cliente.consultarDisponibilidad);
router.post('/reservar/confirmar', verificarToken, cliente.reservar);
router.post('/mis-citas/:id/cancelar', verificarToken, cliente.cancelarCita);

module.exports = router;