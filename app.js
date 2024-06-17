const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const uuid = require('uuid'); // Para generar identificadores únicos
const crypto = require('crypto');



// Generar un identificador único para el enlace temporal
let uniqueLinkId = uuid.v4();
let linkExpiration = Date.now() + 2 * 60 * 60 * 1000; // El enlace es válido por 2 horas



// funcion para Generar identificador único 
function regenerateLink(){
  uniqueLinkId = uuid.v4();
  let linkExpiration = Date.now() + 2 * 60 * 60 * 1000; // El enlace es válido por 2 horas
  console.log(`Nuevo enlace generado: ${uniqueLinkId}`);
}

// Configurar un intervalo para regenerar el enlace cada 2 horas
setInterval(regenerateLink, 2 * 60 * 60 * 1000);

// llave secreta
const secretKey = crypto.randomBytes(32).toString('hex');
console.log(secretKey);

const app = express();
const port = 3000;
app.use(cookieParser());



// conexion a mysql
const mysql = require('mysql');

// usar directorio 
app.use(express.static('static'));

// Configuración de multer para manejar FormData
const upload = multer();

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
app.use(bodyParser.json());


// index
app.get('/',(req,res)=>{
  res.sendFile(__dirname + '/templates/index.html');
})

// esta ruta se usar para crear un jugador

// formulario para crear jugador end user
app.get('/registro', (req, res) => {
  // Renderiza el HTML con el enlace único y lo envía al cliente
  res.json({ uniqueLinkId: `localhost:3000/formulario/inscripcion/${uniqueLinkId}`});
});

app.post('/regenerar/link/inscripcion',(req,res)=>{
  regenerateLink();
  res.json({ uniqueLinkId: uniqueLinkId });
})

app.get(`/formulario/inscripcion/:uniqueLinkId`,(req,res)=>{
  
  const enlaceTemporal = req.params.uniqueLinkId;
  console.log(enlaceTemporal);
  if(enlaceTemporal === uniqueLinkId && Date.now() < linkExpiration)  {
    res.sendFile(__dirname + '/templates/inscripcion.html');
  }else{
     // Si no coincide o no es válido, devolver un error o una página de error
     res.status(404).send('Enlace temporal no válido o ha expirado');
  }

 
})


// majeo de sesiones
app.use(session({
  secret: secretKey, // Cambia esto por una clave secreta segura
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Debe ser true si usas HTTPS
}))


app.post('/save-personal-info',upload.single('cedulaFoto'),(req,res) =>{
  // Guarda la información personal en la sesión
  req.session.personalInfo = req.body;
  req.session.cedulaFoto = req.file.originalname;
   // Imprime la información recibida en el servidor
   console.log(req.file.originalname)
   console.log('Información personal recibida:', req.body);

  res.send({ message: 'Información personal guardada' });
});

app.post('/save-photo',upload.single('fotoPerfil'),(req,res) =>{

  req.session.fotoPerfil = req.file.originalname;
  // Puedes acceder al nombre original de la foto así
  console.log('Nombre original de la foto:', req.file.originalname);

  // No necesitas acceder a req.body porque multer ya procesa la foto y la coloca en req.file
  console.log('Foto recibida:', req.file);

  res.send({ message: 'Cuenta de usuario guardada' });
});

app.post('/save-user-account', (req, res) => {
  // Guarda el nombre de usuario y contraseña en la sesión
  req.session.userAccount = req.body;
  console.log(req.body);
  res.send({ message: 'Cuenta de usuario guardada' });
});


app.post('/finalize-signup',(req,res) =>{

    const { personalInfo, fotoPerfil, userAccount } = req.session;
    const cedulaPic = req.session.cedulaFoto;

    if (!req.session.personalInfo || !req.session.fotoPerfil || !req.session.userAccount) {
      res.status(400).send({ message: 'Faltan datos en la sesión' });
      return; 
    }

    dbConexion.beginTransaction((err)=>{
      if(err){
        console.error('Error starting transaction', err);
        res.status(500).send({ message: 'Error en la transacción' });
        return;
      }

      const queryUsuarios = 'INSERT INTO usuarios (nombre_usuario, email, contraseña, rol, foto_perfil) VALUES (?, ?, ?, ?,?)';
      const valuesUsuarios = [userAccount.username, userAccount.email, userAccount.contraseña, "jugador",fotoPerfil];
      
      dbConexion.query(queryUsuarios, valuesUsuarios, (error,results)=>{
        if (error) {
          return dbConexion.rollback(() => {
            console.error('Error al insertar datos en usuarios', error);
            res.status(500).send({ message: 'Error al guardar la cuenta de usuario' });
          });
        }
        
        const userId = results.insertId;

        const fechaActual = new Date();
        const edadJugador = calcularEdad(personalInfo.Fecha_Nacimiento);
        const nombreCompleto = personalInfo.Nombre +" "+ personalInfo.Apellido;

        const dataSend = {
          Nombre: nombreCompleto,
          cedula: personalInfo.cedula,
          foto_cedula: cedulaPic,
          telefono: personalInfo.telefono,
          edad: edadJugador,
          fecha_nacimiento: personalInfo.Fecha_Nacimiento,
          pais: personalInfo.pais,
          provincia: personalInfo.provincia,
          distrito: personalInfo.distrito,
          numero_jugador: personalInfo.numeroJugador,
          fecha_creacion: fechaActual,
          id_equipo: personalInfo.categoria,
          instagram: personalInfo.instagram,
          usuario_id: userId
        };
  
        const valuesJugadores = [
          dataSend.Nombre,
          dataSend.cedula,
          dataSend.foto_cedula,
          dataSend.telefono,
          dataSend.edad,
          dataSend.fecha_nacimiento,
          dataSend.pais,
          dataSend.provincia,
          dataSend.distrito,
          'Sano',
          dataSend.numero_jugador,
          dataSend.fecha_creacion,
          dataSend.id_equipo,
          dataSend.instagram,
          dataSend.usuario_id
        ];

        const queryJugadores = "INSERT INTO jugadores(Nombre,cedula,foto_cedula,telefono,edad,fecha_nacimiento,pais,provincia,distrito,estado_salud,numero_jugador,fecha_creacion,id_equipo,instagram,usuario_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?,?,?, ?, ?, ?, ?, ?)";

        dbConexion.query(queryJugadores,valuesJugadores,(error,results) =>{
          if (error) {
            return dbConexion.rollback(() => {
              console.error('Error al insertar datos en jugadores', error);
              res.status(500).send({ message: 'Error al guardar la información personal' });
            });
          }

          dbConexion.commit((err) => {
            if(err){
              return dbConexion.rollback(() => {
                console.error('Error al hacer commit de la transacción', err);
                res.status(500).send({ message: 'Error al finalizar la transacción' });
              });
            }
            console.log('Datos insertados correctamente en ambas tablas');
            res.send({ message: 'Registro completado exitosamente' });
          })
        })

      })
    })
})

// crear jugador inscripcion

// funcion que te calcula la edad
function calcularEdad(fechaNacimiento){

  // Obtener la fecha actual
  const fechaActual = new Date();

  // Convertir la fecha de nacimiento a un objeto de fecha
  const partesFecha = fechaNacimiento.split('-');
  const anioNacimiento = parseInt(partesFecha[0]);
  const mesNacimiento = parseInt(partesFecha[1]) - 1; // Meses en JavaScript son indexados desde 0
  const diaNacimiento = parseInt(partesFecha[2]);
  const fechaNacimientoObj = new Date(anioNacimiento, mesNacimiento, diaNacimiento);

  // Calcular la diferencia en milisegundos entre las dos fechas
  const diferenciaMilisegundos = fechaActual - fechaNacimientoObj;

  // Convertir la diferencia en milisegundos a años
  const edad = Math.floor(diferenciaMilisegundos / (1000 * 60 * 60 * 24 * 365));

  return edad;
}


// manda datos personales a la base de datos
app.post('/inscripcion',upload.single('cedulaFoto'),(req,res) =>{
  // obtener datos del form
    const formData = req.body; 

    console.log(formData);
    const fechaActual = new Date();

    const edadJugador = calcularEdad(formData.Fecha_Nacimiento);

    const nombreCompleto = formData.Nombre +" "+ formData.Apellido;
 
    const dataSend = {
      Nombre : nombreCompleto,
      cedula: formData.cedula,
      foto_cedula: req.file.originalname,
      telefono: formData.telefono,
      edad: edadJugador,
      fecha_nacimiento: formData.Fecha_Nacimiento,
      pais: formData.pais,
      provincia: formData.provincia,
      distrito: formData.distrito,
      numero_jugador: formData.numeroJugador,
      fecha_creacion: fechaActual,
      id_equipo: formData.categoria,
      instagram: formData.instagram,
      usuario_id: 1
    }

    const values = [
      dataSend.Nombre,
      dataSend.cedula,
      dataSend.foto_cedula,
      dataSend.telefono,
      dataSend.edad,
      dataSend.fecha_nacimiento,
      dataSend.pais,
      dataSend.provincia,
      dataSend.distrito,
      'Sano',
      dataSend.numero_jugador,
      dataSend.fecha_creacion,
      dataSend.id_equipo,
      dataSend.instagram,
      dataSend.usuario_id
    ]

    const query = "INSERT INTO jugadores(Nombre,cedula,foto_cedula,telefono,edad,fecha_nacimiento,pais,provincia,distrito,estado_salud,numero_jugador,fecha_creacion,id_equipo,instagram,usuario_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?)";

    dbConexion.query(query,values,(error,results,fields)=>{
      if(error){
        console.error('Error al insertar datos',error);
        return;
      }
      console.log('datos insertados correctamente!');
    })

  // if (req.file) {
  //   console.log(req.file.originalname);
  // }
  // Responder al cliente
  res.send('Datos del formulario recibidos correctamente.');

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

// trae informacion de jugadores
app.get('/info/jugadores/:id',(req,res)=>{
  const playerId = req.params.id;
  const query = 'SELECT * FROM jugadores WHERE id = ?';

  dbConexion.query(query, [playerId], (error, results) => {
    if (error) {
        console.error('Error al traer jugadores:', error);
        return res.status(500).json({ error: 'Ha ocurrido un error en el servidor' });
    }
    
    if (results.length === 0) {
        return res.status(404).json({ error: 'Jugador no encontrado' });
    }

    res.status(200).json(results[0]); // Devuelve solo el primer jugador encontrado (asumiendo que el ID es único)
  });
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


app.delete('/eliminar/jugador/:id/:userid', (req, res) => {
  const idjugador = req.params.id;
  const userid = req.params.userid;


  dbConexion.beginTransaction((err)=>{
    if (err) {
      console.error('Error starting transaction', err);
      res.status(500).send({ message: 'Error en la transacción' });
      return;
    }

    const queryJugador = 'DELETE FROM jugadores WHERE id = ?'; 
    


    dbConexion.query(queryJugador, [idjugador], (error, results, fields) => {
      if (error) {
        return dbConexion.rollback(() => {
          console.error('Error al borrar jugador', error);
          res.status(500).send({ message: 'Error al borrar jugador' });
        });
      }

      const queryUsuario = 'DELETE FROM usuarios WHERE id= ?';

      dbConexion.query(queryUsuario,[userid],(error,results)=>{
        if (error) {
          return dbConexion.rollback(() => {
            console.error('Error al borrar usuario', error);
            res.status(500).send({ message: 'Error al borrar usuario' });
          });
        }

        dbConexion.commit((err)=>{
          if (err) {
            return dbConexion.rollback(() => {
              console.error('Error al hacer commit de la transacción', err);
              res.status(500).send({ message: 'Error al finalizar la transacción' });
            });
          }

          console.log('Datos eliminados correctamente en ambas tablas');
          res.send({ message: 'Usuario eliminado' });
        })
      })


    });

  })
  // Example with MySQL
  
});


app.put('/editar/jugador/:id',(req,res)=>{
  const idJugador = req.params.id;
  const cambios = req.body;


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


// USUARIOS


// RUTA BASE TRAE USUARIO E INFO
app.get('/user/:id',(req,res)=>{

  const userId = req.params.id;


  const query = "SELECT nombre_usuario, email, rol, foto_perfil FROM usuarios WHERE id = ?";

  dbConexion.query(query,userId,(error,results)=>{
    if (error) {
      console.error('Error al ejecutar la consulta:', error);
      res.status(500).json({ error: 'Error al obtener los datos del usuario' });
      return;
    }

    // Verificar si se encontraron resultados
    if (results.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Obtener el primer resultado (debería ser único por el ID)
    const usuario = results[0];
    
    // Enviar los datos del usuario como respuesta
    res.json(usuario);
  })
})


// const middleware de autorizacion
const authorize = (req,res,next)=>{
  if(req.cookies && req.cookies.username){
    next();
  }else{
    res.status(401).send('No autorizado');
  }
}

app.get('/ruta-protegida',authorize,(req,res)=>{
  res.send('Bievenido a la ruta protegida')
});


// creacion de usuario jugador
app.post('/signup',(req,res)=>{
  const { username, email, contraseña } = req.body;

  const values = [
    username,
    contraseña,
    email,
    'jugador'
  ]

  console.log(values);
  const query = "INSERT INTO usuarios(nombre_usuario,contraseña,email,rol) VALUES(?,?,?,?)";

  dbConexion.query(query,values,(error,results) =>{
    if(error){
      console.log('Error al crear usuario dentro de la base de datos',error);
    }
    
    const lastInsertId = results.insertId;

    console.log('Se ha creado el usuario con ID:', lastInsertId);

    res.json({ message: 'Se ha creado el usuario con ID: ' + lastInsertId, userId: lastInsertId });
  })
})


app.get('/correo/existente/:correo',(req,res) =>{
  const correo = req.params.correo;

  const query ='SELECT COUNT(*) AS numUsuarios FROM usuarios WHERE email = ?';

  // ejecutar consulta
  dbConexion.query(query, [correo] ,(error,results,fields)=>{
    if(error){
      console.error('Error al ejecutar la consulta',error);
      res.status(500).json({ error: 'Error al buscar correos existentes' });
      return;
    }

    // obtener numero de usuarios encontrados
    const numUsuarios = results[0].numUsuarios;

    if (numUsuarios > 0) {
      // Si hay usuarios encontrados, el usuario ya existe
      res.json({ existe: true });
    } else {
        // Si no hay usuarios encontrados, el usuario no existe
        res.json({ existe: false });
    }

  })

})


app.get('/usuario/existente/:user',(req,res) => {
  const usuario = req.params.user;

  const query ='SELECT COUNT(*) AS numUsuarios FROM usuarios WHERE nombre_usuario = ?';

  // ejecutar consulta
  dbConexion.query(query, [usuario] ,(error,results,fields)=>{
    if(error){
      console.error('Error al ejecutar la consulta',error);
      res.status(500).json({ error: 'Error al buscar usuarios existentes' });
      return;
    }

    // obtener numero de usuarios encontrados
    const numUsuarios = results[0].numUsuarios;

    if (numUsuarios > 0) {
      // Si hay usuarios encontrados, el usuario ya existe
      res.json({ existe: true });
    } else {
        // Si no hay usuarios encontrados, el usuario no existe
        res.json({ existe: false });
    }

  })
})


// Dashboard

  // total de jugadores
  app.get('/jugadores/total',(req,res)=>{
    // query
    const query = 'SELECT COUNT(*) AS totalJugadores FROM jugadores';
    dbConexion.query(query,(error,results)=>{
      if(error){
        console.error('Error al ejecutar la consulta',error);
        res.status(500).json({ error: 'Error al buscar jugadores existentes' });
        return;
      }

      const totalJugadores = results[0].totalJugadores;
      res.json({ jugadores: totalJugadores });
      
    })
  })

  // jugdores disponibles
  app.get('/jugadores/disponibles',(req,res)=>{
    // query
    const query = "SELECT COUNT(*) AS jugadoresDisponibles FROM jugadores WHERE estado_salud = 'Sano'";

    dbConexion.query(query,(error,results)=>{
      if(error){
        console.error('Error al ejecutar la consulta',error);
        res.status(500).json({ error: 'Error al buscar jugadores existentes' });
        return;
      }

      const jugadoresDisponibles = results[0].jugadoresDisponibles;
      res.json({ jugadores: jugadoresDisponibles });
    
    })

  })



// Dashboard
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



