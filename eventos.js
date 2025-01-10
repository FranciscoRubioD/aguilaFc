const express = require('express');
const router = express.Router();
const dbConexion = require('./db');

// partidos

// crea un evento de partido
router.post('/crear/partido', (req,res) =>{
  const { dataForm } = req.body;

  // entero 
  const idEquipo = parseInt(dataForm.equipo);

  const valuesForm  = [
    ['Partido',
    idEquipo,
    dataForm.fechaPartido,
    dataForm.horaInicio,
    dataForm.horaFinal,
    dataForm.comentario,
    dataForm.ubicacion,
    dataForm.golFavor,
    dataForm.golContra,
    'Pendiente',
    null,
    dataForm.rivalNombre,
    dataForm.tipoPartido,
    dataForm.encargado]
  ];

  console.log(valuesForm);

  const queryEvento = 'INSERT INTO evento (evento, id_equipo, fecha, hora, hora_final, descripcion, ubicacion, gol_local, gol_visita, estado,resultado ,equipo_rival, tipo_partido, encargado) VALUES ?';

  dbConexion.query(queryEvento, [valuesForm], (error, resultsEvento) => {

    if(error){
      console.error('Error al insertar partido:', error);
      return res.status(500).json({ message: 'Error al guardar partido' });
    }else {
      const partidoId = resultsEvento.insertId; // Obtener el ID del partido insertado
      console.log(`Agragado partido: ${partidoId}`);
      res.status(200).json({ message: 'Partido guardado correctamente' });
    }

  });

});


// resolucion de un partido 
// Ruta en el servidor
router.post('/evento/configurar', (req, res) => {
  const { idEvento, resolucion, ganador, golFavor, golContra } = req.body;

  const query = `
    UPDATE evento 
    SET 
      estado = ?, 
      resultado = ?, 
      gol_local = ?, 
      gol_visita = ? 
    WHERE id = ?
  `;

  

  dbConexion.query(query, [resolucion, ganador, golFavor, golContra, idEvento], (err, results) => {
    if (err) {
      console.error('Error al actualizar la configuración del partido:', err);
      return res.status(500).json({ message: 'Error al actualizar el evento' });
    }
    res.status(200).json({ message: 'Evento actualizado correctamente' });
  });
});


// Ruta para obtener las estadísticas de victorias, derrotas y empates
router.post('/obtener-estadisticas', (req, res) => {
  const { id_equipo } = req.body;

  const query = `
      SELECT 
          SUM(CASE WHEN resultado = 'W' THEN 1 ELSE 0 END) AS victorias,
          SUM(CASE WHEN resultado = 'L' THEN 1 ELSE 0 END) AS derrotas,
          SUM(CASE WHEN resultado = 'D' THEN 1 ELSE 0 END) AS empates,
          COUNT(*) AS partidos_totales,
          COUNT(CASE WHEN estado = 'Terminado' THEN 1 END) AS partidos_jugados
      FROM evento
      WHERE id_equipo = ? AND evento = 'Partido';
  `;

  dbConexion.query(query, [id_equipo], (err, results) => {
      if (err) {
          console.error("Error en la consulta: ", err);
          res.status(500).json({ error: 'Error en la consulta' });
      } else {
          // Enviar los resultados de las estadísticas
          res.json({
              victorias: results[0].victorias,
              derrotas: results[0].derrotas,
              empates: results[0].empates,
              partidos_totales: results[0].partidos_totales,
              partidos_jugados: results[0].partidos_jugados
          });
      }
  });
});


// trae evento por id_Equipo
// Ruta para obtener el próximo partido basado en id_equipo
router.get('/proximo-partido/:id_equipo', (req, res) => {
  const { id_equipo } = req.params;

  // Consulta SQL para obtener el próximo partido
  const query = `
      SELECT *
      FROM evento
      WHERE id_equipo = ?
        AND evento = 'Partido'
        AND estado = 'Pendiente'
        AND fecha > NOW()  -- Solo partidos en el futuro
      ORDER BY fecha ASC
      LIMIT 1;
  `;

  dbConexion.query(query, [id_equipo], (err, results) => {
      if (err) {
          console.error("Error al obtener el próximo partido:", err);
          return res.status(500).json({ error: "Error al obtener el próximo partido" });
      }
      
      // Si no hay partido próximo, envía un mensaje adecuado
      if (results.length === 0) {
          return res.status(404).json({ message: "No hay partidos pendientes próximos" });
      }

      // Devuelve el próximo partido como respuesta en formato JSON
      res.json(results[0]); // Devuelve el primer (y único) resultado
  });
});

router.get('/partido-anterior/:id_equipo', (req, res) => {
  const { id_equipo } = req.params;

  // Consulta SQL para obtener el partido anterior
  const query = `
      SELECT *
      FROM evento
      WHERE id_equipo = ?
        AND evento = 'Partido'
        AND estado = 'Terminado'
        AND fecha < NOW()  -- Solo partidos en el pasado
      ORDER BY fecha DESC
      LIMIT 1;
  `;

  dbConexion.query(query, [id_equipo], (err, results) => {
      if (err) {
          console.error("Error al obtener el partido anterior:", err);
          return res.status(500).json({ error: "Error al obtener el partido anterior" });
      }
      
      // Si no hay partido anterior, envía un mensaje adecuado
      if (results.length === 0) {
          return res.status(404).json({ message: "No hay partidos anteriores terminados" });
      }

      // Devuelve el partido anterior como respuesta en formato JSON
      res.json(results[0]); // Devuelve el primer (y único) resultado
  });
});




// router
module.exports = { router };