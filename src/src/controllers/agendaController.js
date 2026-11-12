const pool = require('../config/db');

async function listarAgenda(req, res) {
  try {
    const [citas] = await pool.query(`
      SELECT c.id, c.fecha, c.hora_inicio, c.hora_fin, c.estado, c.observaciones,
             u.nombre AS cliente_nombre, u.apellido AS cliente_apellido, u.telefono,
             s.nombre AS servicio_nombre, s.precio
      FROM citas c
      JOIN usuarios u ON c.cliente_id = u.id
      JOIN servicios s ON c.servicio_id = s.id
      ORDER BY c.fecha DESC, c.hora_inicio ASC
    `);
    res.render('agenda', { citas, usuario: req.usuario, mensaje: null });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al consultar la agenda');
  }
}

async function mostrarFormularioCita(req, res) {
  try {
    const [clientes] = await pool.query(
      "SELECT id, nombre, apellido FROM usuarios WHERE rol = 'cliente' AND activo = TRUE ORDER BY nombre"
    );
    const [servicios] = await pool.query(
      'SELECT id, nombre, duracion_minutos, precio FROM servicios WHERE activo = TRUE ORDER BY nombre'
    );
    res.render('nueva-cita', { clientes, servicios, usuario: req.usuario, error: null });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar el formulario');
  }
}

async function crearCita(req, res) {
  const { cliente_id, servicio_id, fecha, hora_inicio, observaciones } = req.body;
  try {
    const [servicio] = await pool.query(
      'SELECT duracion_minutos FROM servicios WHERE id = ?', [servicio_id]
    );
    const duracion = servicio[0].duracion_minutos;

    const [inicioHoras, inicioMinutos] = hora_inicio.split(':').map(Number);
    const totalMinutos = inicioHoras * 60 + inicioMinutos + duracion;
    const horaFin = `${String(Math.floor(totalMinutos / 60)).padStart(2, '0')}:${String(totalMinutos % 60).padStart(2, '0')}:00`;

    const [cruce] = await pool.query(`
      SELECT id FROM citas
      WHERE fecha = ? AND estado NOT IN ('cancelada')
        AND (? < hora_fin AND ? > hora_inicio)
    `, [fecha, hora_inicio, horaFin]);

    if (cruce.length > 0) {
      const [clientes] = await pool.query(
        "SELECT id, nombre, apellido FROM usuarios WHERE rol = 'cliente' AND activo = TRUE ORDER BY nombre"
      );
      const [servicios] = await pool.query(
        'SELECT id, nombre, duracion_minutos, precio FROM servicios WHERE activo = TRUE ORDER BY nombre'
      );
      return res.render('nueva-cita', {
        clientes, servicios, usuario: req.usuario,
        error: 'Ya existe una cita en ese horario. Seleccione otra hora.'
      });
    }

    await pool.query(
      'INSERT INTO citas (cliente_id, servicio_id, fecha, hora_inicio, hora_fin, estado, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [cliente_id, servicio_id, fecha, hora_inicio, horaFin, 'agendada', observaciones]
    );
    res.redirect('/agenda');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al crear la cita');
  }
}

async function cambiarEstado(req, res) {
  const { id } = req.params;
  const { estado } = req.body;
  try {
    await pool.query('UPDATE citas SET estado = ? WHERE id = ?', [estado, id]);
    res.redirect('/agenda');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al actualizar el estado de la cita');
  }
}

module.exports = { listarAgenda, mostrarFormularioCita, crearCita, cambiarEstado };