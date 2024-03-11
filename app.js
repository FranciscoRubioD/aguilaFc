const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');

// conexion a mysql
const mysql = require('mysql');

// usar directorio 
app.use(express.static('static'));

// limite paginacion
const limit = 10;

// conexion a la base de datos
const dbConexion = mysql.createConnection({
  host:'localhost',
  user:'root',
  password:'',
  database:'aguilafc'
})

// manejo de error BD
dbConexion.connect((error)=>{
  if(error){
    console.error('Error conectando a base de datos: '+ error.message);
  }else{
    console.log('Conectado a la base de datos');
  }
})

// Middleware para analizar application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));


// index
app.get('/',(req,res)=>{
  res.sendFile(__dirname + '/templates/index.html');
})


// esta ruta se usar para crear un jugador

// formulario para crear jugador end user

app.get('/formulario/inscripcion',(req,res)=>{
  res.sendFile(__dirname + '/templates/inscripcion.html');
})

// crear jugador admin
app.post('/crear/jugador', async(req, res) => {
  try{
    const {
      Nombre, cedula, telefono, edad,
      posicion, numero_jugador, estado_salud, tajeta_amarilla,estado_cuenta, 
      goles, asistencias,id_equipo
    } = req.body;
  
  
    const cedulaValida = await validarInformacion(cedula,'cedula');
      if (cedulaValida) {
        console.log('La cédula no es válida');
        return res.status(400).json({ error: 'cedula', message: 'La cédula ya existe, por favor ingresa una diferente' });
      }
  
    const numeroJugadorValido = await verificarNumeroJugador(numero_jugador,id_equipo);
      if (numeroJugadorValido) {
        console.log('El número de jugador ya existe');
        return res.status(400).json({ error: 'numero_jugador', message: 'El número de jugador ya existe' });
      }
    
    // Aquí puedes insertar los datos del jugador en la base de datos
    // y luego enviar una respuesta al cliente
    console.log('Datos del jugador:', req.body);
    res.send('Jugador creado exitosamente');

  } catch(error){
    console.error('Error al crear jugador:', error);
    res.status(500).send('Error en el servidor');
  }
});


// Verifica que no hayan numero de jugador duplicado basandose en su division
app.get('/numero-jugador-disponible',(req,res)=>{

  const numeroJugador = req.query.numero_jugador;
  const division = req.query.id_equipo;

 
  verificarNumeroJugador(numeroJugador,division)
    .then(existe =>{
      res.json({ existe });
    })
    .catch(error => {
      console.error('Error al verificar número de jugador:', error);
      res.status(500).json({ error: 'Ha ocurrido un error en el servidor' });
    });

});

// muestra informacion de jugadores
app.get('/jugadores',(req,res)=>{
  res.sendFile(__dirname + '/templates/jugadores.html');
})

// trae el total de jugadores 
app.get('/get-total-jugadores',(req,res) =>{
  const query = 'SELECT COUNT(*) AS total FROM jugadores'; // Consulta SQL para contar el número total de jugadores

  dbConexion.query(query, (error, results) => {
    if (error) {
      console.error('Error al ejecutar la consulta para contar jugadores:', error);
      res.status(500).json({ error: 'Ha ocurrido un error en el servidor' });
    } else {
      const totalJugadores = results[0].total; // Obtener el total de jugadores desde los resultados de la consulta
      res.status(200).json(totalJugadores); // Enviar el total de jugadores al cliente como respuesta
    }
  });
})


// trae los jugadores a la tabla
app.get('/get-jugadores',(req,res)=>{

  const page = parseInt(req.query.page) || 1; // numero de pagina
  const offset = (page -1) * limit; // calcular offset


  const query = `
  SELECT jugadores.*, equipo.nombre AS nombre_division
  FROM jugadores
  INNER JOIN equipo ON jugadores.id_equipo = equipo.id LIMIT ${limit} OFFSET ${offset}
`;

  dbConexion.query(query,(error,results)=>{
    if (error) {
      console.error('Error al ejecutar la consulta para traer jugadores:', error);
      res.status(500).json({ error: 'Ha ocurrido un error en el servidor' });
    }else{
      res.status(200).json(results); // Envía los resultados al cliente como respuesta
    }
  })
})


// Define la nueva ruta para manejar las solicitudes de búsqueda
app.get('/buscar-jugadores', (req, res) => {
  // Obtén los parámetros de búsqueda del query string
  const page = parseInt(req.query.page) || 1; // numero de pagina
  const offset = (page -1) * limit; // calcular offset

  console.log(offset)

  const terminoBusqueda = req.query.termino;
 
  // Construye la consulta SQL para buscar jugadores que coincidan con el término de búsqueda
  const query = `
      SELECT jugadores.*, equipo.nombre AS nombre_division
      FROM jugadores
      INNER JOIN equipo ON jugadores.id_equipo = equipo.id
      WHERE jugadores.Nombre LIKE '%${terminoBusqueda}%'
      OR jugadores.cedula LIKE '%${terminoBusqueda}%'
      OR jugadores.telefono LIKE '%${terminoBusqueda}%'
      OR jugadores.edad LIKE '%${terminoBusqueda}%'
      OR jugadores.posicion LIKE '%${terminoBusqueda}%'
      OR jugadores.numero_jugador LIKE '%${terminoBusqueda}%'
      OR jugadores.estado_salud LIKE '%${terminoBusqueda}%'
      OR jugadores.fecha_creacion LIKE '%${terminoBusqueda}%'
      OR equipo.nombre LIKE '%${terminoBusqueda}%' LIMIT ${limit} OFFSET ${offset}
  `;


  const countQuery = `
  SELECT COUNT(*) AS total FROM jugadores
  INNER JOIN equipo ON jugadores.id_equipo = equipo.id
  WHERE jugadores.Nombre LIKE '%${terminoBusqueda}%'
  OR jugadores.cedula LIKE '%${terminoBusqueda}%'
  OR jugadores.telefono LIKE '%${terminoBusqueda}%'
  OR jugadores.edad LIKE '%${terminoBusqueda}%'
  OR jugadores.posicion LIKE '%${terminoBusqueda}%'
  OR jugadores.numero_jugador LIKE '%${terminoBusqueda}%'
  OR jugadores.estado_salud LIKE '%${terminoBusqueda}%'
  OR jugadores.fecha_creacion LIKE '%${terminoBusqueda}%'
  OR equipo.nombre LIKE '%${terminoBusqueda}%'
`;

  // Ejecuta la consulta SQL en la base de datos
  dbConexion.query(query, (error, results) => {
      if (error) {
          console.error('Error al ejecutar la consulta de búsqueda:', error);
          res.status(500).json({ error: 'Ha ocurrido un error en el servidor' });
      } else {
        dbConexion.query(countQuery,(countError,countResults)=>{
          if (countError) {
            console.error('Error al contar el número total de resultados:', countError);
            res.status(500).json({ error: 'Ha ocurrido un error en el servidor' });
          } else {
            const totalResults = countResults[0].total;
            const totalPages = Math.ceil(totalResults / limit);
            // Devolver los resultados de búsqueda junto con el número total de resultados y el número de página actual
            console.log(results);
            res.status(200).json({ results: results, totalResults: totalResults, totalPages: totalPages, currentPage: page });
          }
        })

      }
  });
});

 // filtrar jugadores
  app.get('/jugadores-filtrados', (req, res) => {
    // Obtener los valores de los filtros desde la solicitud
    const posicion = req.query.posicion; // Ejemplo: 'delantero'
    const id_equipo = req.query.equipo; // Ejemplo: 'sub-12'
    const estadoSalud = req.query.estadoSalud; // Ejemplo: 'lesionado'
    const fecha_creacion = req.query.fecha_creacion;
    const edad = req.query.edad;

   
    // paginacion
    const page = parseInt(req.query.page) || 1; // numero de pagina
    const offset = (page -1) * limit; // calcular offset


    // Construir la consulta base
    let sql = `SELECT jugadores.*, equipo.nombre AS nombre_division FROM jugadores INNER JOIN equipo ON jugadores.id_equipo = equipo.id WHERE 1 = 1`;
    const params = [];  

    
    // Agregar condiciones para cada filtro si se ha proporcionado un valor
    if (posicion) {
        sql += ' AND posicion = ?';
        params.push(posicion);
        
    }
    if (id_equipo) {
        sql += ' AND id_equipo = ?';
        params.push(id_equipo);
    }
    if (estadoSalud) {
        sql += ' AND estado_salud = ?';
        params.push(estadoSalud);
    } 
    if (fecha_creacion) {
        // Obtener los jugadores creados en el año proporcionado
        sql += ' AND YEAR(fecha_creacion) = ?';
        params.push(fecha_creacion);
    }
    if (edad) {
  
      const [minEdad, maxEdad] = edad.split('-');
      sql += ' AND edad BETWEEN ? AND ?';
      params.push(minEdad, maxEdad);
  }

    // Agregar LIMIT y OFFSET al final de la consulta
    const sqlCounter = sql;
   
    sql += ` LIMIT ${limit} OFFSET ${offset}`;
    
    // Ejecutar la consulta con los parámetros construidos
    dbConexion.query(sql, params, (err, result) => {
        if (err) {
            console.error('Error al obtener jugadores:', err);
            res.status(500).json({ error: 'Error al obtener jugadores' });
        } else {
          dbConexion.query(sqlCounter, params, (errorCounter, counterResult) =>{
            if(errorCounter){
              console.error('Error al obtener contador de filtros:', errorCounter);
              res.status(500).json({ error: 'Ha ocurrido un error en el servidor' });
            }else{
        
              const totalResults = counterResult.length;
              res.status(200).json({ result: result, totalResults: totalResults });
           
            }
            
          })

        }
    });
  });


app.get('/filtro-jugadores',(req,res) =>{
  const opcion = req.query.opcion;
  const filtro = req.query.filtro;

  console.log(opcion);
  console.log(filtro);
  const query = `SELECT jugadores.*, equipo.nombre AS nombre_division
  FROM jugadores
  INNER JOIN equipo ON jugadores.id_equipo = equipo.id WHERE ?? = ?`;
  const values = [filtro,opcion];

  dbConexion.query(query, values,(error,results)=>{
    if(error){
      console.error('Error al ejecutar la consulta:', error);
    }else{
      console.log(results);
      res.status(200).json(results);
    }
  })
})


app.put('/editar/jugador/:id',(req,res)=>{
  const idJugador = req.params.id;
  const cambios = req.body;
  console.log(cambios);

  // Construir la consulta de actualización basada en los campos modificados
  let sql = 'UPDATE jugadores SET ';
  const params = [];
  const campos = Object.keys(cambios);
  campos.forEach((campo, index) => {
      sql += campo + ' = ?';
      params.push(cambios[campo]);
      if (index < campos.length - 1) {
          sql += ', ';
      }
  });
  sql += ' WHERE id = ?';
  params.push(idJugador);

  // Ejecutar la consulta de actualización
  dbConexion.query(sql, params, (err, result) => {
      if (err) {
          console.error('Error al actualizar el jugador:', err);
          res.status(500).json({ error: 'Error al actualizar el jugador' });
      } else {
          console.log('Jugador actualizado:', result);
          res.status(200).json({ message: 'Jugador actualizado correctamente' });
      }
  });
})


app.get('/get/equipo',(req,res) => {
  const query = "SELECT * FROM equipo"

  dbConexion.query(query,(error,results) => {
    if(error){
      console.error('Error al actualizar el jugador:', err);
      res.status(500).json({ error: 'Error al actualizar el jugador' });
    }else{
      res.status(200).json({ results });
    
    }
  })
})

app.get('/fechas', (req, res) => {
    const sql = 'SELECT YEAR(fecha_creacion) AS year_creacion FROM jugadores';
    
    // Ejecutar la consulta SQL
    dbConexion.query(sql, (err, result) => {
        if (err) {
            console.error('Error al obtener años de creación:', err);
            res.status(500).json({ error: 'Error al obtener años de creación' });
        } else {
            // Extraer los años de creación de los resultados y eliminar duplicados
            const years = result.map(row => row.year_creacion);
            const uniqueYears = Array.from(new Set(years));
            res.status(200).json({ years: uniqueYears });
        }
    });
});


app.get('/rango/edad',(req,res)=>{
  const sql = 'SELECT MIN(edad) AS min_edad, MAX(edad) AS max_edad FROM jugadores';

    dbConexion.query(sql, (err, result) => {
        if (err) {
            console.error('Error al obtener el rango de edad:', err);
            res.status(500).json({ error: 'Error al obtener el rango de edad' });
        } else {
            const minEdad = result[0].min_edad;
            const maxEdad = result[0].max_edad;
            res.status(200).json({ minEdad: minEdad, maxEdad: maxEdad });
        }
    });
})






app.listen(port, () => {
  console.log(`Servidor Express escuchando en el puerto http://localhost:${port}`);
});


// comprueba si una cedula existe o no en la base de datos
const validarInformacion = (valor,buscar)=>{
  return new Promise((resolve,reject)=>{
    const query = `SELECT * FROM jugadores WHERE ${buscar} = ?`;
    
    dbConexion.query(query, valor, (error, results) => {
      if (error) {
        console.error('Error al ejecutar la consulta:', error);
        reject(error);
      }
      
      if (results.length > 0) {
        resolve(true); // Record exists
      } else {
        resolve(false); // Record doesn't exist
      }
    });
  })
}

// esta funcion cuenta cuantos jugadores de la misma division tienen un numero especifico (si el contador cuenta mas de 0 entonces ese numero ya existe y no está disponible)
const verificarNumeroJugador = (numeroJugador, division)=>{
  return new Promise((resolve,reject)=>{
    
    const query = `SELECT COUNT(*) AS cantidad 
    FROM jugadores 
    WHERE numero_jugador = ? AND id_equipo = ?`;
  
    dbConexion.query(query, [numeroJugador, division], (error, results) => {
      if (error) {
        reject(error);
      } else {
        // Si la cantidad es 0, el número de jugador está disponible; de lo contrario, no está disponible
        resolve(results[0].cantidad === 0);
      }
    });
  })
} 


