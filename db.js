const mysql = require('mysql');


// conexion a la base de datos
const dbConexion = mysql.createConnection({
  host:'localhost',
  user:'fran',
  password:'franWinston@2518!!',
  database:'aguilafc',
})

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