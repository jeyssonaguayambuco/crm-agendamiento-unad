const express = require('express');
const router = express.Router();
const pagos = require('../controllers/pagosController');
const { verificarToken, soloAdministrador } = require('../middlewares/auth');

router.get('/agenda/:id/detalle', verificarToken, soloAdministrador, pagos.detalleCita);
router.post('/agenda/:id/pago', verificarToken, soloAdministrador, pagos.registrarPago);
router.get('/mi-historial', verificarToken, pagos.historialCliente);

module.exports = router;