const mysql = require('mysql');


// conexion a la base de datos
const dbConexion = mysql.createConnection({
  host:'viaduct.proxy.rlwy.net',
  user:'root',
  password:'cjiVOjnNolZkWwWUQKnBdcWFouXjkzpt',
  database:'mySqlrailway',
  port: 26491,  // Asegúrate de que el puerto sea el correcto
})

// manejo de error BD
dbConexion.connect((error) => {
  if (error) {
    console.error('Error conectando a la base de datos:', error.message);
    return;
  }
  console.log('Conexión exitosa a la base de datos');
  
  // Cerrar la conexión después de probarla
  dbConexion.end();
});

