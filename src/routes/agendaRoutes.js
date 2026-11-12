const express = require('express');
const router = express.Router();
const agenda = require('../controllers/agendaController');
const { verificarToken, soloAdministrador } = require('../middlewares/auth');

router.get('/agenda', verificarToken, soloAdministrador, agenda.listarAgenda);
router.get('/agenda/nueva', verificarToken, soloAdministrador, agenda.mostrarFormularioCita);
router.post('/agenda/nueva', verificarToken, soloAdministrador, agenda.crearCita);
router.post('/agenda/:id/estado', verificarToken, soloAdministrador, agenda.cambiarEstado);

module.exports = router;