const mysql = require('mysql2');


// conexion a la base de datos
const dbConexion = mysql.createConnection({
  host:'viaduct.proxy.rlwy.net',
  user:'root',
  password:'OMNpyPoCjMQJaNVbpdHRVCHIuxHKDvDZ',
  database:'railway',
  port: 48234,  // Asegúrate de que el puerto sea el correcto
});


// const dbConexion = mysql.createConnection({
//   host:'localhost',
//   user:'root',
//   password:'',
//   database:'aguilafc',
//   port: 3306,  // Asegúrate de que el puerto sea el correcto
// });





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