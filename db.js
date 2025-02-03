const mysql = require('mysql2');


// conexion a la base de datos
const dbConexion = mysql.createPool({
  host:'viaduct.proxy.rlwy.net',
  user:'root',
  password:'OMNpyPoCjMQJaNVbpdHRVCHIuxHKDvDZ',
  database:'railway',
  port: 48234,  // Asegúrate de que el puerto sea el correcto
  connectionLimit: 10, // Número máximo de conexiones en el pool
});



// const dbConexion = mysql.createPool({
//   host:'localhost',
//   user:'root',
//   password:'',
//   database:'aguiladev',
//   port: 3306,  // Asegúrate de que el puerto sea el correcto
// });

// pool
dbConexion.on('connection', () => {
  console.log('Nueva conexión establecida con el pool');
});

dbConexion.on('error', (err) => {
  console.error('Error en la conexión del pool:', err);
});

// Mantén las conexiones activas
// setInterval(() => {
//   dbConexion.query('SELECT 1', (err) => {
//     if (err) {
//       console.error('Error en keep-alive:', err);
//     } else {
//       console.log('Conexión activa');
//     }
//   });
// }, 50000); // Realiza un "ping" cada 50 segundos


// // manejo de error BD
// dbConexion.connect((error)=>{
//   if(error){
//     console.error('Error conectando a base de datos: '+ error.message);
//   }else{
//     console.log('Conectado a la base de datos');
//   }
// });


// Exportar la conexión
module.exports = dbConexion;