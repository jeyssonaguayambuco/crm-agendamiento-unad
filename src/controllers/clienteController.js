const pool = require('../config/db');

async function misCitas(req, res) {
  try {
    const [citas] = await pool.query(`
      SELECT c.id, c.fecha, c.hora_inicio, c.hora_fin, c.estado, c.observaciones,
             s.nombre AS servicio_nombre, s.precio
      FROM citas c
      JOIN servicios s ON c.servicio_id = s.id
      WHERE c.cliente_id = ?
      ORDER BY c.fecha DESC, c.hora_inicio ASC
    `, [req.usuario.id]);
    res.render('mis-citas', { citas, usuario: req.usuario });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al consultar sus citas');
  }
}

async function mostrarReserva(req, res) {
  try {
    const [servicios] = await pool.query(
      'SELECT id, nombre, duracion_minutos, precio FROM servicios WHERE activo = TRUE ORDER BY nombre'
    );
    res.render('reservar', { servicios, usuario: req.usuario, error: null, disponibles: null, datos: null });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cargar el formulario de reserva');
  }
}

async function consultarDisponibilidad(req, res) {
  const { servicio_id, fecha } = req.body;
  try {
    const [servicios] = await pool.query(
      'SELECT id, nombre, duracion_minutos, precio FROM servicios WHERE activo = TRUE ORDER BY nombre'
    );
    const [servicio] = await pool.query(
      'SELECT duracion_minutos FROM servicios WHERE id = ?', [servicio_id]
    );
    const duracion = servicio[0].duracion_minutos;

    const [ocupadas] = await pool.query(
      "SELECT hora_inicio, hora_fin FROM citas WHERE fecha = ? AND estado NOT IN ('cancelada')",
      [fecha]
    );

    const disponibles = [];
    for (let minutos = 8 * 60; minutos + duracion <= 18 * 60; minutos += 30) {
      const inicio = minutos;
      const fin = minutos + duracion;
      let libre = true;
      ocupadas.forEach(function (c) {
        const [oh, om] = c.hora_inicio.split(':').map(Number);
        const [fh, fm] = c.hora_fin.split(':').map(Number);
        const ocupadaInicio = oh * 60 + om;
        const ocupadaFin = fh * 60 + fm;
        if (inicio < ocupadaFin && fin > ocupadaInicio) {
          libre = false;
        }
      });
      if (libre) {
        const hh = String(Math.floor(inicio / 60)).padStart(2, '0');
        const mm = String(inicio % 60).padStart(2, '0');
        disponibles.push(`${hh}:${mm}`);
      }
    }

    res.render('reservar', {
      servicios, usuario: req.usuario, error: null,
      disponibles, datos: { servicio_id, fecha }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al consultar la disponibilidad');
  }
}

async function reservar(req, res) {
  const { servicio_id, fecha, hora_inicio } = req.body;
  try {
    const [servicio] = await pool.query(
      'SELECT duracion_minutos FROM servicios WHERE id = ?', [servicio_id]
    );
    const duracion = servicio[0].duracion_minutos;
    const [ih, im] = hora_inicio.split(':').map(Number);
    const total = ih * 60 + im + duracion;
    const horaFin = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}:00`;

    const [cruce] = await pool.query(`
      SELECT id FROM citas
      WHERE fecha = ? AND estado NOT IN ('cancelada')
        AND (? < hora_fin AND ? > hora_inicio)
    `, [fecha, hora_inicio, horaFin]);

    if (cruce.length > 0) {
      return res.redirect('/reservar');
    }

    await pool.query(
      'INSERT INTO citas (cliente_id, servicio_id, fecha, hora_inicio, hora_fin, estado) VALUES (?, ?, ?, ?, ?, ?)',
      [req.usuario.id, servicio_id, fecha, hora_inicio, horaFin, 'agendada']
    );
    res.redirect('/mis-citas');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al reservar la cita');
  }
}

async function cancelarCita(req, res) {
  const { id } = req.params;
  try {
    await pool.query(
      "UPDATE citas SET estado = 'cancelada' WHERE id = ? AND cliente_id = ?",
      [id, req.usuario.id]
    );
    res.redirect('/mis-citas');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al cancelar la cita');
  }
}

module.exports = { misCitas, mostrarReserva, consultarDisponibilidad, reservar, cancelarCita };