const mysql = require('mysql2');


// conexion a la base de datos
// const dbConexion = mysql.createConnection({
 
// });

const dbConexion = mysql.createPool({
  host:'viaduct.proxy.rlwy.net',
  user:'root',
  password:'OMNpyPoCjMQJaNVbpdHRVCHIuxHKDvDZ',
  database:'railway',
  port: 48234,  // Asegúrate de que el puerto sea el correcto
  connectionLimit: 10, // Número máximo de conexiones
  waitForConnections: true, // Esperar si no hay conexiones disponibles
  queueLimit: 0, // No limitar la cola de conexiones
  acquireTimeout: 30000, // Tiempo máximo para adquirir una conexión (30 segundos)
});




// const dbConexion = mysql.createConnection({
//   host:'localhost',
//   user:'root',
//   password:'',
//   database:'aguilafc',
//   port: 3306,  // Asegúrate de que el puerto sea el correcto
// });

// Mantén las conexiones activas
setInterval(() => {
  dbConexion.query('SELECT 1', (err) => {
    if (err) {
      console.error('Error en keep-alive:', err);
    } else {
      console.log('Conexión activa');
    }
  });
}, 50000); // Realiza un "ping" cada 50 segundos


// manejo de error BD
dbConexion.connect((error)=>{
  if(error){
    console.error('Error conectando a base de datos: '+ error.message);
  }else{
    console.log('Conectado a la base de datos');
  }
});



// Exportar la conexión
module.exports = dbConexion;