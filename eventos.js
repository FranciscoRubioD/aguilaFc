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
    dataForm.rivalNombre,
    dataForm.tipoPartido,
    dataForm.encargado]
  ];

  console.log(valuesForm);

  const queryEvento = 'INSERT INTO evento (evento, id_equipo, fecha, hora, hora_final, descripcion, ubicacion, gol_local, gol_visita, equipo_rival, tipo_partido, encargado) VALUES ?';

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



// router
module.exports = { router };