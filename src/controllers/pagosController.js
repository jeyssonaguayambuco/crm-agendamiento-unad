const pool = require('../config/db');

async function detalleCita(req, res) {
  const { id } = req.params;
  try {
    const [citas] = await pool.query(`
      SELECT c.id, c.fecha, c.hora_inicio, c.hora_fin, c.estado, c.observaciones,
             u.nombre AS cliente_nombre, u.apellido AS cliente_apellido, u.telefono,
             s.nombre AS servicio_nombre, s.precio
      FROM citas c
      JOIN usuarios u ON c.cliente_id = u.id
      JOIN servicios s ON c.servicio_id = s.id
      WHERE c.id = ?
    `, [id]);

    if (citas.length === 0) {
      return res.status(404).send('La cita no existe');
    }

    const [pagos] = await pool.query(
      'SELECT id, monto, medio, fecha_pago FROM pagos WHERE cita_id = ? ORDER BY fecha_pago ASC',
      [id]
    );

    const totalPagado = pagos.reduce(function (suma, p) {
      return suma + Number(p.monto);
    }, 0);
    const saldo = Number(citas[0].precio) - totalPagado;

    res.render('detalle-cita', {
      cita: citas[0], pagos, totalPagado, saldo, usuario: req.usuario, error: null
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al consultar el detalle de la cita');
  }
}

async function registrarPago(req, res) {
  const { id } = req.params;
  const { monto, medio } = req.body;
  try {
    await pool.query(
      'INSERT INTO pagos (cita_id, monto, medio) VALUES (?, ?, ?)',
      [id, monto, medio]
    );
    res.redirect('/agenda/' + id + '/detalle');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al registrar el pago');
  }
}

async function historialCliente(req, res) {
  try {
    const [citas] = await pool.query(`
      SELECT c.id, c.fecha, c.estado, s.nombre AS servicio_nombre, s.precio,
             COALESCE(SUM(p.monto), 0) AS pagado
      FROM citas c
      JOIN servicios s ON c.servicio_id = s.id
      LEFT JOIN pagos p ON p.cita_id = c.id
      WHERE c.cliente_id = ?
      GROUP BY c.id, c.fecha, c.estado, s.nombre, s.precio
      ORDER BY c.fecha DESC
    `, [req.usuario.id]);

    let totalServicios = 0;
    let totalPagado = 0;
    citas.forEach(function (c) {
      if (c.estado !== 'cancelada') {
        totalServicios += Number(c.precio);
        totalPagado += Number(c.pagado);
      }
    });

    res.render('mi-historial', {
      citas, totalServicios, totalPagado,
      saldoTotal: totalServicios - totalPagado,
      usuario: req.usuario
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al consultar su historial');
  }
}

module.exports = { detalleCita, registrarPago, historialCliente };