const express = require('express');
const router = express.Router();
const dbConexion = require('./db');
const multer = require('multer');
const xlsx = require('xlsx');


const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files


router.post('/import-jugadores', upload.single('file'), (req, res) => {
  const filePath = req.file.path;

  // Parse the Excel file
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);


  const validPositions = [
    "Portero",
    "Defensa",
    "Centrocampista",
    "Delantero"
  ];

  
  const fechaActual = new Date();
  const parseExcelDate = (excelDate) => {
    // Excel's base date is 1900-01-01
    const baseDate = new Date(1900, 0, 1);
    const convertedDate = new Date(baseDate.getTime() + (excelDate - 1) * 86400000);
    
    const year = convertedDate.getFullYear();
    const month = String(convertedDate.getMonth() + 1).padStart(2, '0');
    const day = String(convertedDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  // Insert data into the 'jugadores' table
  const values = data.map(row => {

   

      // Regular expression for a valid phone number format with optional hyphens
    const phonePattern = /^[0-9]{4}-[0-9]{4}$/;
    const telefono = phonePattern.test(row.telefono) ? row.telefono : '0';

    const formattedDate =parseExcelDate(row.fecha_nacimiento)


    // Check if the required fields are present
    if (!row.Nombre || !row.cedula || !row.fecha_nacimiento || !row.posicion) {
      throw new Error('Missing required fields in one or more rows'); // Throw error if required fields are missing
    }
  
    // Set optional fields to default values if they are not provided
    return [
      row.Nombre,
      row.cedula,
      telefono || null,                // Default to null if not provided
      formattedDate,
      row.numero_jugador || null,
      row.posicion,
      row.tarjeta_amarilla || 0,           // Default to 0 for numeric fields
      row.goles || 0,                      // Default to 0
      row.pierna_habil || 'Desconocida',   // Default to 'Desconocida' if not provided
      fechaActual,
      row.id_equipo || null,
      row.instagram || '' ,                 // Default to empty string for text fields
      row.usuario_id || null
    ];
  });

  const query = 'INSERT INTO jugadores (Nombre,cedula,telefono,fecha_nacimiento,numero_jugador, posicion, tarjeta_amarilla,goles,pierna_habil,fecha_creacion,id_equipo,instagram,usuario_id) VALUES ?';
  dbConexion.query(query, [values], (error, results) => {
    if (error) {
      console.error('Error inserting data:', error);
      return res.status(500).json({ message: 'Error inserting data' });
    }
    res.status(200).json({ message: 'Players imported successfully' });
  });
});



// router
module.exports = { router };