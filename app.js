const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const uuid = require('uuid'); // Para generar identificadores únicos
const crypto = require('crypto');
const bcrypt = require('bcrypt'); // Para manejar contraseñas encriptadas
const dbConexion = require('./db'); 

// importar login 
const { router: loginRouter, authenticateToken } = require('./login');  
const { router: eventosRouter } = require("./eventos.js");
const { router: cargasRouter } = require("./cargas.js");


// Generar un identificador único para el enlace temporal
let uniqueLinkId = uuid.v4();
let linkExpiration = Date.now() + 2 * 60 * 60 * 1000; // El enlace es válido por 2 horas

app.use(express.static('public'));


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


const { reset } = require('nodemon');
const { Console } = require('console');
// usar directorio 
app.use(express.static('static'));
app.use('/archivos', express.static('uploads'));

// Configuración de multer para almacenar en memoria
const storage = multer.memoryStorage(); 
const upload = multer({ storage:storage });

const uploadFinalPath = path.join(__dirname, 'uploads');  


const finalizarSubida = (fileName, fileBuffer, callback) => {
  // Verificar si el fileBuffer es un Buffer válido
  if (!Buffer.isBuffer(fileBuffer)) {
    callback(new Error('fileBuffer is not a Buffer'));
    return;
  }

  // Función para verificar si el archivo ya existe en el servidor y guardarlo
  const verificarExistenciaYGuardar = (rutaCompleta, intentos = 1) => {
    // Verificar si el archivo ya existe
    if (fs.existsSync(rutaCompleta)) {
      const nombreArchivoSinExtension = path.basename(fileName, path.extname(fileName)); // Nombre del archivo sin extensión
      const extension = path.extname(fileName); // Extensión del archivo

      // Generar un nuevo nombre único agregando un timestamp antes de la extensión
      const nuevoNombre = `${nombreArchivoSinExtension}_${Date.now()}${extension}`;
      rutaCompleta = path.join(uploadFinalPath, nuevoNombre);

      // Verificar nuevamente si el archivo con el nuevo nombre ya existe
      return verificarExistenciaYGuardar(rutaCompleta, intentos + 1);
    }

    // Guardar el archivo en el sistema de archivos
    fs.writeFile(rutaCompleta, fileBuffer, (err) => {
      if (err) {
        callback(err);
      } else {
        callback(null, rutaCompleta); // Llamar al callback con la ruta completa donde se guardó el archivo
      }
    });
  };

  let rutaCompleta = path.join(uploadFinalPath, fileName); // Ruta completa inicial

  // Verificar y guardar el archivo con la función auxiliar
  verificarExistenciaYGuardar(rutaCompleta);
};


// limite paginacion
const limit = 10;


// Middleware para analizar application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// login page 
app.use('/', loginRouter);  // Esto asegura que cualquier ruta definida en login.js sea accesible

// evento
//
app.use("/",eventosRouter);

// carga de jugadores
app.use('/', cargasRouter);


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


app.post('/save-personal-info', upload.single('cedulaFoto'), (req, res) => {
  if (!req.file || !Buffer.isBuffer(req.file.buffer)) {
    res.status(400).send({ message: 'No se ha proporcionado ninguna foto de cédula o el archivo no es válido' });
    return;
  }

  // Save personal info and cedula photo in session
  req.session.personalInfo = req.body;
  req.session.cedulaFotoBuffer = req.file.buffer; // Ensure buffer data is saved directly
  req.session.cedulaFotoName = req.file.originalname;

  console.log(typeof req.session.cedulaFotoBuffer); // Check if buffer is set correctly
  res.send({ message: 'Información personal guardada' });
});

app.post('/save-photo', upload.single('fotoPerfil'), (req, res) => {
  if (!req.file || !Buffer.isBuffer(req.file.buffer)) {
    res.status(400).send({ message: 'No se ha proporcionado ninguna foto de perfil o el archivo no es válido' });
    return;
  }

  req.session.fotoPerfil = req.file.originalname;
  req.session.fotoPerfilBuffer = req.file.buffer;

  console.log('Nombre original de la foto:', req.file.originalname);
  res.send({ message: 'Cuenta de usuario guardada' });
});

app.post('/save-user-account', (req, res) => {
  req.session.userAccount = req.body;
  res.send({ message: 'Cuenta de usuario guardada' });
});

app.post('/finalize-signup', (req, res) => {
  const { personalInfo, fotoPerfil, userAccount, cedulaFotoBuffer, fotoPerfilBuffer, cedulaFotoName } = req.session;

  if (!personalInfo || !cedulaFotoBuffer || !userAccount || !cedulaFotoName || !fotoPerfilBuffer) {
    res.status(400).send({ message: 'Faltan datos en la sesión' });
    return;
  }

  // Ensure buffer is converted correctly to a Buffer instance if needed
  const bufferDataCedula = Buffer.isBuffer(cedulaFotoBuffer) ? cedulaFotoBuffer : Buffer.from(cedulaFotoBuffer);
  const bufferDataFotoPerfil = Buffer.isBuffer(fotoPerfilBuffer) ? fotoPerfilBuffer : Buffer.from(fotoPerfilBuffer);

  dbConexion.beginTransaction((err) => {
    if (err) {
      console.error('Error starting transaction', err);
      res.status(500).send({ message: 'Error en la transacción' });
      return;
    }

    finalizarSubida(fotoPerfil, bufferDataFotoPerfil, (err, rutaCompleta) => {
      if (err) {
        return dbConexion.rollback(() => {
          console.error('Error al guardar la foto de Perfil', err);
          res.status(500).send({ message: 'Error al guardar la foto de perfil' });
        });
      }

      const rutaFotoPerfil = path.basename(rutaCompleta);

      // Cifrar la contraseña
      const saltRounds = 10;
      const hashedPassword = bcrypt.hash(userAccount.contrasena, saltRounds);

      console.log(`password = ${hashedPassword}`);

      const queryUsuarios = 'INSERT INTO usuarios (nombre_usuario, email, contrasena, rol, foto_perfil) VALUES (?, ?, ?, ?, ?)';
      const valuesUsuarios = [userAccount.username, userAccount.email, hashedPassword, "jugador", rutaFotoPerfil];

      dbConexion.query(queryUsuarios, valuesUsuarios, (error, results) => {
        if (error) {
          return dbConexion.rollback(() => {
            console.error('Error al insertar datos en usuarios', error);
            res.status(500).send({ message: 'Error al guardar la cuenta de usuario' });
          });
        }

        const userId = results.insertId;
        const fechaActual = new Date();
        const edadJugador = calcularEdad(personalInfo.Fecha_Nacimiento);
        const nombreCompleto = personalInfo.Nombre + " " + personalInfo.Apellido;

        const dataSend = {
          Nombre: nombreCompleto,
          cedula: personalInfo.cedula,
          foto_cedula: cedulaFotoName,
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

        const queryJugadores = "INSERT INTO jugadores (Nombre, cedula, foto_cedula, telefono, edad, fecha_nacimiento, pais, provincia, distrito, estado_salud, numero_jugador, fecha_creacion, id_equipo, instagram, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        finalizarSubida(cedulaFotoName, bufferDataCedula, (err, rutaCompleta) => {
          if (err) {
            return dbConexion.rollback(() => {
              console.error('Error al guardar la foto de cédula', err);
              res.status(500).send({ message: 'Error al guardar la foto de cédula' });
            });
          }

          dataSend.foto_cedula = path.basename(rutaCompleta);

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

          dbConexion.query(queryJugadores, valuesJugadores, (error, results) => {
            if (error) {
              return dbConexion.rollback(() => {
                console.error('Error al insertar datos en jugadores', error);
                res.status(500).send({ message: 'Error al guardar la información personal' });
              });
            }

            dbConexion.commit((err) => {
              if (err) {
                return dbConexion.rollback(() => {
                  console.error('Error al hacer commit de la transacción', err);
                  res.status(500).send({ message: 'Error al finalizar la transacción' });
                });
              }

              console.log('Datos insertados correctamente en ambas tablas');
              res.send({ message: 'Registro completado exitosamente' });
            });
          });
        });
      });
    });
  });
});



// jugador 



// jugador

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

// crear jugador admin
// Ruta para crear un jugador con subida de foto
app.post('/crear/jugador', upload.single('fotoJugador'), async (req, res) => {
  try {
    const {
      Nombre,
      apellido,
      cedula,
      telefonoJugador,
      Correo,
      fechaJugador,
      nacionalidadJugador,
      id_equipo,
      posicion,
      numeroJugador,
    } = req.body;

    let savedFileName = null; // Variable para la foto, por defecto será null

    if (req.file) {
      // Si se subió una imagen, guárdala
      const fileName = req.file.originalname;
      const fileBuffer = req.file.buffer;

      finalizarSubida(fileName, fileBuffer, async (err, savedPath) => {
        if (err) {
          console.error('Error al guardar la imagen:', err);
          return res.status(500).json({ error: 'Error al guardar la imagen' });
        }
        savedFileName = path.basename(savedPath); // Guardar solo el nombre del archivo
        console.log('Foto guardada en:', savedPath);
        insertarJugador(); // Llamar a la función de inserción
      });
    } else {
      insertarJugador(); // Llamar a la función de inserción si no hay foto
    }

    // Función para insertar jugador
    const insertarJugador = () => {
      // Obtener la fecha de creación
      const fechaCreacion = new Date();

      // Nombre completo
      const nombreCompleto = Nombre + " " + apellido;

      // Query de inserción
      const query = `
        INSERT INTO jugadores 
        (Nombre, cedula, telefono, fecha_nacimiento, pais, id_equipo, posicion, numero_jugador, foto_jugador, fecha_creacion, correo) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        nombreCompleto,
        cedula,
        telefonoJugador,
        fechaJugador,
        nacionalidadJugador,
        id_equipo,
        posicion,
        numeroJugador,
        savedFileName, // Puede ser null si no hay foto
        fechaCreacion,
        Correo,
      ];

      dbConexion.query(query, values, (error, results) => {
        if (error) {
          console.error('Error al insertar jugador:', error);
          return res.status(500).json({ error: 'Error al guardar jugador en la base de datos' });
        }

        res.status(200).json({ message: 'Jugador creado exitosamente', jugadorId: results.insertId });
      });
    };
  } catch (error) {
    console.error('Error al crear jugador:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// app.post('/crear/jugador', upload.single('fotoJugador') ,async(req, res) => {
//   try{
//     const {
//       Nombre,
//       cedula,
//       telefono,
//       fecha_nacimiento,
//       nacionalidad,
//       id_equipo,
//       posicion,
//       numero_jugador
//     } = req.body;

//     // Verifica si se subió una imagen
//     if (!req.file) {
//       return res.status(400).json({ error: 'foto', message: 'Por favor, sube una foto válida.' });
//     }

//     const fileName = req.file.originalname;
//     const fileBuffer = req.file.buffer;


  
  
//     const cedulaValida = await validarInformacion(cedula,'cedula');
//       if (cedulaValida) {
//         console.log('La cédula no es válida');
//         return res.status(400).json({ error: 'cedula', message: 'La cédula ya existe, por favor ingresa una diferente' });
//       }


    
//     // Aquí puedes insertar los datos del jugador en la base de datos
//     // y luego enviar una respuesta al cliente
//     console.log('Datos del jugador:', req.body);
//     res.send('Jugador creado exitosamente');

//     // Consulta SQL para insertar el jugador
//     const query = `
//       INSERT INTO jugadores 
//       (Nombre, cedula, telefono, fecha_nacimiento, nacionalidad, id_equipo, posicion, numero_jugador) 
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//     `;

  



      

//   } catch(error){
//     console.error('Error al crear jugador:', error);
//     res.status(500).send('Error en el servidor');
//   }
// });


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
app.get('/jugadores', (req,res) =>{
  res.sendFile(__dirname + '/templates/jugadores.html');
});

// prueba 
// muestra informacion de jugadores
app.get('/jugadores/prueba', (req,res) =>{
  res.sendFile(__dirname + '/templates/jugadores.html');
});


// middleware para verificar token
app.get('/verify-token', authenticateToken, (req, res) => {
  // Verifica los datos del usuario en la consola para depuración
  console.log('User from token verification: ', req.user); 

  // Si el token es válido, se envía una respuesta positiva
  res.json({
    message: 'Token verificado',
    user: req.user // Aquí, req.user contiene los datos del usuario si el token es válido
  });
});

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


// trae archivo del servidor 
app.get('/archivo/:file',(req,res)=>{
  const fileName = req.params.file;
  const filePath  = path.join(__dirname, 'uploads', fileName);

  
  // Verificar si el archivo existe en el servidor
  if (fs.existsSync(filePath)) {
    // Si existe, enviar el archivo como respuesta
    
    res.sendFile(filePath);
  } else {
    // Si no existe, enviar respuesta de archivo no encontrado
    res.status(404).send({ message: 'Archivo no encontrado' });
  }

})

// JUGADORES SECCION 

// Middleware para obtener los equipos permitidos del usuario
function verificarEquiposUsuario(req, res, next) {
  const usuario = req.session.usuario || {}; // Supongamos que los datos del usuario están en la sesión

  if (!usuario.id) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  // Consulta para obtener los equipos asignados al usuario
  const query = `
    SELECT id 
    FROM equipo 
    WHERE entrenador_id = ?`; // Ajusta el filtro según tu estructura de base de datos

  dbConexion.query(query, [usuario.id], (error, results) => {
    if (error) {
      console.error('Error al obtener equipos del usuario:', error);
      return res.status(500).json({ error: 'Error al cargar permisos' });
    }

    // Almacena los equipos en req o en la sesión
    req.session.equipos = results.map(equipo => equipo.id); // IDs de equipos permitidos
    next();
  });
}


// trae el total de jugadores 
app.get('/get-total-jugadores', authenticateToken, (req, res) => {
  const user = req.user; // Usuario autenticado
  const equiposAsignados = user.equipos; // Equipos asignados al usuario

  if (!equiposAsignados || equiposAsignados.length === 0) {
    return res.status(403).json({ error: 'No tienes equipos asignados' });
  }


  // Crear la consulta para contar jugadores de los equipos asignados
  const query = `
    SELECT COUNT(*) AS total 
    FROM jugadores 
    WHERE id_equipo IN (${equiposAsignados.join(',')})
  `;

  dbConexion.query(query, (error, results) => {
    if (error) {
      console.error('Error al ejecutar la consulta para contar jugadores:', error);
      res.status(500).json({ error: 'Ha ocurrido un error en el servidor' });
    } else {
      const totalJugadores = results[0].total; // Obtener el total de jugadores desde los resultados de la consulta
      res.status(200).json(totalJugadores); // Enviar el total de jugadores al cliente como respuesta
    }
  });
});


// trae los jugadores a la tabla
app.get('/get-jugadores', authenticateToken, (req, res) => {
  const user = req.user; // Usuario autenticado
  const equiposAsignados = user.equipos; // Equipos asignados al usuario

  console.log('funcion');
  console.log(equiposAsignados);


  if (!equiposAsignados || equiposAsignados.length === 0) {
    return res.status(403).json({ error: 'No tienes equipos asignados' });
  }


  const page = parseInt(req.query.page) || 1; // Número de página (por defecto 1)
  const limit = 10; // Número de resultados por página
  const offset = (page - 1) * limit; // Calcular el offset basado en la página solicitada

  // Consulta SQL para traer los jugadores filtrados por los equipos asignados
  const query = `
    SELECT jugadores.*, equipo.nombre AS nombre_division
    FROM jugadores
    INNER JOIN equipo ON jugadores.id_equipo = equipo.id
    WHERE equipo.id IN (?)
    LIMIT ${limit} OFFSET ${offset}
  `;

  dbConexion.query(query, [equiposAsignados], (error, results) => {
    if (error) {
      console.error('Error al ejecutar la consulta para traer jugadores:', error);
      return res.status(500).json({ error: 'Ha ocurrido un error en el servidor' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No hay jugadores para los equipos asignados' });
    }

    console.log(results);
    res.status(200).json(results); // Devuelve los jugadores filtrados
  });
});


// TRAE JUGADORES EN BASE A EVENTO
app.get('/jugador/evento', (req,res) =>{
    const eventoId = req.query.evento;
 

    const query = (`SELECT * FROM asistencias WHERE id_evento = ${eventoId}`)

    dbConexion.query(query,(error,results) =>{
      if(error){
        console.error('Error al ejecutar la consulta para traer jugadores:', error);
        res.status(500).json({ error: 'Ha ocurrido un error en el servidor' });
      }else {
        res.status(200).json(results);
        
      }
    })

});

// Traer asistencia de jugador en base a evento y id de jugador
app.get('/estado/asistencia', (req,res) => {
  const idJugador = req.query.id_jugador;
  const evento = req.query.evento;
  
  // Verifica que los parámetros estén presentes
  if (!idJugador || !evento) {
    return res.status(400).json({ message: 'Faltan parámetros requeridos: id_jugador e id_evento' });
  }
  
  const query = 'SELECT estado, descripcion_asist FROM asistencias WHERE id_jugador = ? AND id_evento = ?';

  dbConexion.query(query, [idJugador,evento], (error,results) => {

    if (error) {
      console.error('Error al obtener el estado de asistencia:', error);
      return res.status(500).json({ message: 'Error al obtener el estado de asistencia' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'No se encontró estado de asistencia para los parámetros proporcionados' });
    }


    res.status(200).json({ estado: results[0].estado, descripcion: results[0].descripcion_asist });

  })

});


// TRAE JUGADORES EN BASE A EVENTO
app.get('/jugador/evento/asistencia', (req, res) => {
  const evento = req.query.evento; // Asegúrate de que el parámetro evento sea recibido
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 7;
  const offset = (page - 1) * limit;

  // Inicia una transacción
  dbConexion.beginTransaction((error) => {
    if (error) {
      console.error('Error al iniciar la transacción:', error);
      return res.status(500).json({ error: 'Ha ocurrido un error en el servidor' });
    }

    // Verifica si el evento existe
    const queryEvento = 'SELECT id FROM evento WHERE id = ?';
    dbConexion.query(queryEvento, [evento], (error, results) => {
      if (error) {
        return dbConexion.rollback(() => {
          console.error('Error al verificar el evento:', error);
          res.status(500).json({ error: 'Ha ocurrido un error en el servidor' });
        });
      }

      if (results.length === 0) {
        return dbConexion.rollback(() => {
          res.status(404).json({ error: 'Evento no encontrado' });
        });
      }

      const query = `
        SELECT j.id, j.Nombre, j.cedula
        FROM jugadores j
        JOIN asistencias a ON j.id = a.id_jugador
        WHERE a.id_evento = ?
        LIMIT ? OFFSET ?
      `;
      const params = [evento, limit, offset];

      dbConexion.query(query, params, (error, results) => {
        if (error) {
          return dbConexion.rollback(() => {
            console.error('Error al ejecutar la consulta para traer jugadores:', error);
            res.status(500).json({ error: 'Ha ocurrido un error en el servidor' });
          });
        }


        // paginacion 
        const totalQuery = 'SELECT COUNT(*) AS total FROM asistencias WHERE id_evento = ?';
        dbConexion.query(totalQuery, [evento], (error, countResults) => {


          if (error) {
            return dbConexion.rollback(() => {
              console.error('Error al contar asistencias:', error);
              res.status(500).json({ error: 'Ha ocurrido un error en el servidor' });
            });
          }


          const total = countResults[0].total; // Total de asistencias
          const totalPages = Math.ceil(total / limit); // Total de páginas

           // Commit de la transacción
          dbConexion.commit((error) => {
            if (error) {
              return dbConexion.rollback(() => {
                console.error('Error al realizar el commit de la transacción:', error);
                res.status(500).json({ error: 'Ha ocurrido un error en el servidor' });
              });
            }

            // Enviar la respuesta con los resultados
           
            // Enviar la respuesta con los resultados y la paginación
            res.status(200).json({
              players: results,
              totalPages: totalPages,
              currentPage: page,
              totalPlayers: total
            });

        });
      })

  
      });
    });
  });
});

// TRAE JUGADORES EN BASE ASISTENCIA

// eventoExist
app.get('/get/jugador/asistencia', (req, res) => {
  const equipo = req.query.equipo;
  const estado = req.query.estado;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

    // Si el evento existe, realiza la consulta para traer jugadores
    let query = `
      SELECT *
      FROM jugadores
      WHERE id_equipo = ?
    `;


    if (estado !== "todos") {
      query += " AND estado_salud = ?";
    }

    query += " LIMIT ? OFFSET ?";

    const params = estado === "todos" ? [equipo, limit, offset] : [equipo, estado, limit, offset];

    dbConexion.query(query, params, (error, results) => {
      if (error) {
        console.error('Error al ejecutar la consulta para traer jugadores:', error);
        res.status(500).json({ error: 'Ha ocurrido un error en el servidor' });
      } else {

        // paginacion 
        const totalQuery = 'SELECT COUNT(*) AS total FROM jugadores WHERE id_equipo = ?';
        dbConexion.query(totalQuery, [equipo], (error, countResults) => {

          if (error) {
            return dbConexion.rollback(() => {
              console.error('Error al contar jugadores:', error);
              res.status(500).json({ error: 'Ha ocurrido un error en el servidor' });
            });
          }


          const total = countResults[0].total; // Total de asistencias
          const totalPages = Math.ceil(total / limit); // Total de páginas
          
          console.log(total);
          console.log(totalPages);
          
          res.status(200).json({
            jugadores: results,
            totalPages: totalPages,
            currentPage: page,
            totalPlayers: total
          });
        });

        
      }
    });
  });

// MODIFICA LA ASISTENCIA DE UN EVENTO
app.put('/modificar/asistencia', (req, res) => {
  const asistencias = req.body; // Expecting an array of records

  console.log(asistencias);

  if (!Array.isArray(asistencias) || asistencias.length === 0) {
    return res.status(400).json({ message: 'El cuerpo de la solicitud debe ser un arreglo de objetos de asistencia.' });
  }


  const queries = asistencias.map(asistencia => {
    const { id_jugador, id_evento, estado, observaciones } = asistencia;

    if (!id_jugador || !id_evento || !estado) {
      return Promise.reject('Faltan parámetros requeridos en uno de los registros.');
    }


    const query = 'UPDATE asistencias SET estado = ?, descripcion_asist = ? WHERE id_jugador = ? AND id_evento = ?';
    
    return new Promise((resolve, reject) => {
      console.log('Consulta preparada:', query, [estado, observaciones, id_jugador, id_evento]);
      dbConexion.query(query, [estado, observaciones, id_jugador, id_evento], (error, results) => {

       
        if (error) {
          return reject(error);
        }

        if (results.affectedRows === 0) {
          return reject('No se encontró el registro de asistencia para uno de los parámetros proporcionados.');
        }
        

        resolve();
      });
    });
  });

  Promise.all(queries)
    .then(() => res.status(200).json({ message: 'Asistencias modificadas exitosamente' }))
    .catch(error => {
      console.error('Error al modificar la asistencia:', error);
      res.status(500).json({ message: 'Error al modificar la asistencia' });
    });
});


// BORRA ASISTENCIA DEL EVENTO 
app.delete('/asistencia/evento', (req, res) => {
  const { id_evento } = req.body; // Se espera que el id_evento se pase en el cuerpo de la solicitud

  if (!id_evento) {
    return res.status(400).json({ message: 'El id_evento es requerido' });
  }

  const query = 'DELETE FROM asistencias WHERE id_evento = ?';

  dbConexion.query(query, [id_evento], (error, results) => {
    if (error) {
      console.error('Error al eliminar las asistencias:', error);
      return res.status(500).json({ message: 'Error al eliminar las asistencias' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'No se encontraron asistencias para eliminar.' });
    }

    res.status(200).json({ message: 'Asistencias eliminadas exitosamente' });
  });
});


// trae la informacion de un evento 
app.get('/get/evento', (req, res) => {
  const evento = req.query.evento;

  // Verificar si el parámetro 'evento' está presente
  if (!evento) {
    return res.status(400).json({ message: 'El parámetro evento es requerido' });
  }

  const query = "SELECT * FROM evento WHERE id = ?";

  dbConexion.query(query, [evento], (error, results) => {
    if (error) {
      console.error('Error al obtener el evento:', error);
      return res.status(500).json({ message: 'Error al obtener el evento' });
    }

    // Verificar si se encontraron resultados
    if (results.length === 0) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    // Enviar los resultados al cliente
    res.status(200).json(results[0]);
  });
});


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
            
            res.status(200).json({ results: results, totalResults: totalResults, totalPages: totalPages, currentPage: page });
          }
        })

      }
  });
});


  
 // filtrar jugadores
  app.get('/jugadores-filtrados', authenticateToken, (req, res) => {

    const user = req.user; // Usuario autenticado
    const equiposAsignados = user.equipos; // Equipos asignados al usuario


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
    if (id_equipo && id_equipo !== '0') {
      sql += ' AND id_equipo = ?';
      params.push(id_equipo);
    } else {
      // Si id_equipo es 0, filtra solo los equipos asignados al usuario
      if (equiposAsignados && equiposAsignados.length > 0) {
        // No usamos map si equiposAsignados ya es un arreglo de IDs
        sql += ` AND id_equipo IN (${equiposAsignados})`;
      } else {
        return res.status(403).json({ error: 'No tienes equipos asignados' });
      }
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

// borrar usuario y jugador

app.delete('/eliminar/jugador/:id/:userid', (req, res) => {
  const idJugador = req.params.id;
  const userId = req.params.userid;

  // Iniciar transacción
  dbConexion.beginTransaction((err) => {
    if (err) {
      console.error('Error al iniciar la transacción:', err);
      return res.status(500).send({ message: 'Error al iniciar la transacción' });
    }

    // 1. Obtener las fotos del jugador
    const queryFotosJugador = 'SELECT foto_jugador, foto_cedula FROM jugadores WHERE id = ?';
    dbConexion.query(queryFotosJugador, [idJugador], (error, results) => {
      if (error) {
        return dbConexion.rollback(() => {
          console.error('Error al obtener las fotos del jugador:', error);
          res.status(500).send({ message: 'Error al obtener las fotos del jugador' });
        });
      }

      if (results.length === 0) {
        return dbConexion.rollback(() => {
          console.error('Jugador no encontrado');
          res.status(404).send({ message: 'Jugador no encontrado' });
        });
      }

      const { foto_jugador, foto_cedula } = results[0];
      const filePathJugador = foto_jugador ? path.join(uploadFinalPath, foto_jugador) : null;
      const filePathCedula = foto_cedula ? path.join(uploadFinalPath, foto_cedula) : null;

      // Función para eliminar un archivo del servidor
      const deleteFile = (filePath, callback) => {
        if (filePath) {
          fs.unlink(filePath, (err) => {
            if (err) {
              return dbConexion.rollback(() => {
                console.error('Error al eliminar archivo del servidor:', err);
                res.status(500).send({ message: 'Error al eliminar archivo del servidor' });
              });
            }
            callback();
          });
        } else {
          callback(); // Si no hay archivo, continuar
        }
      };

      // 2. Eliminar las fotos del servidor
      deleteFile(filePathJugador, () => {
        deleteFile(filePathCedula, () => {
          // 3. Eliminar al jugador de la tabla jugadores
          const queryEliminarJugador = 'DELETE FROM jugadores WHERE id = ?';
          dbConexion.query(queryEliminarJugador, [idJugador], (error) => {
            if (error) {
              return dbConexion.rollback(() => {
                console.error('Error al eliminar al jugador:', error);
                res.status(500).send({ message: 'Error al eliminar al jugador' });
              });
            }

            // 4. Obtener la foto del usuario
            const queryFotoUsuario = 'SELECT foto_perfil FROM usuarios WHERE id = ?';
            dbConexion.query(queryFotoUsuario, [userId], (error, results) => {
              if (error) {
                return dbConexion.rollback(() => {
                  console.error('Error al obtener la foto del usuario:', error);
                  res.status(500).send({ message: 'Error al obtener la foto del usuario' });
                });
              }

              const fotoPerfil = results.length > 0 ? results[0].foto_perfil : null;
              const filePathUsuario = fotoPerfil ? path.join(uploadFinalPath, fotoPerfil) : null;

              // 5. Eliminar la foto del usuario
              deleteFile(filePathUsuario, () => {
                // 6. Eliminar al usuario de la tabla usuarios
                const queryEliminarUsuario = 'DELETE FROM usuarios WHERE id = ?';
                dbConexion.query(queryEliminarUsuario, [userId], (error) => {
                  if (error) {
                    return dbConexion.rollback(() => {
                      console.error('Error al eliminar al usuario:', error);
                      res.status(500).send({ message: 'Error al eliminar al usuario' });
                    });
                  }

                  // 7. Confirmar la transacción
                  dbConexion.commit((err) => {
                    if (err) {
                      return dbConexion.rollback(() => {
                        console.error('Error al confirmar la transacción:', err);
                        res.status(500).send({ message: 'Error al confirmar la transacción' });
                      });
                    }

                    console.log('Jugador y usuario eliminados correctamente, incluyendo archivos');
                    res.send({ message: 'Jugador y usuario eliminados correctamente' });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

// app.delete('/eliminar/jugador/:id/:userid', (req, res) => {
//   const idjugador = req.params.id;
//   const userid = req.params.userid;

//   dbConexion.beginTransaction((err) => {
//     if (err) {
//       console.error('Error starting transaction', err);
//       return res.status(500).send({ message: 'Error en la transacción' });
//     }

//     // Step 1: Get `foto_cedula` for the player
//     const queryJugadorCedula = 'SELECT foto_cedula FROM jugadores WHERE id = ?';
//     dbConexion.query(queryJugadorCedula, [idjugador], (error, results) => {
//       if (error) {
//         return dbConexion.rollback(() => {
//           console.error('Error al obtener la ruta del archivo desde la base de datos', error);
//           res.status(500).send({ message: 'Error al obtener la ruta del archivo desde la base de datos' });
//         });
//       }

//       if (results.length === 0) {
//         return dbConexion.rollback(() => {
//           console.error('No se encontró el jugador con el ID especificado');
//           res.status(404).send({ message: 'No se encontró el jugador con el ID especificado' });
//         });
//       }

//       const fotoCedula = results[0].foto_cedula;
//       const filePathCedula = fotoCedula ? path.join(uploadFinalPath, fotoCedula) : null;

//       // Step 2: Delete `foto_cedula` file if it exists
//       const deleteCedulaFile = (callback) => {
//         if (filePathCedula) {
//           fs.unlink(filePathCedula, (err) => {
//             if (err) {
//               return dbConexion.rollback(() => {
//                 console.error('Error al eliminar archivo del servidor', err);
//                 res.status(500).send({ message: 'Error al eliminar archivo del servidor' });
//               });
//             }
//             callback();
//           });
//         } else {
//           callback(); // Skip deletion if no file path
//         }
//       };

//       deleteCedulaFile(() => {
//         // Step 3: Delete the player
//         const queryEliminarJugador = 'DELETE FROM jugadores WHERE id = ?';
//         dbConexion.query(queryEliminarJugador, [idjugador], (error) => {
//           if (error) {
//             return dbConexion.rollback(() => {
//               console.error('Error al borrar jugador', error);
//               res.status(500).send({ message: 'Error al borrar jugador' });
//             });
//           }

//           // Step 4: Get `foto_perfil` for the user
//           const queryUsuarioFoto = 'SELECT foto_perfil FROM usuarios WHERE id = ?';
//           dbConexion.query(queryUsuarioFoto, [userid], (error, results) => {
//             if (error) {
//               return dbConexion.rollback(() => {
//                 console.error('Error al obtener la ruta del archivo desde la base de datos', error);
//                 res.status(500).send({ message: 'Error al obtener la ruta del archivo desde la base de datos' });
//               });
//             }

//             const fotoUsuario = results.length > 0 ? results[0].foto_perfil : null;
//             const filePathUsuario = fotoUsuario ? path.join(uploadFinalPath, fotoUsuario) : null;

//             // Step 5: Delete `foto_perfil` file if it exists
//             const deleteUsuarioFile = (callback) => {
//               if (filePathUsuario) {
//                 fs.unlink(filePathUsuario, (err) => {
//                   if (err) {
//                     return dbConexion.rollback(() => {
//                       console.error('Error al eliminar archivo del servidor', err);
//                       res.status(500).send({ message: 'Error al eliminar archivo del servidor' });
//                     });
//                   }
//                   callback();
//                 });
//               } else {
//                 callback(); // Skip deletion if no file path
//               }
//             };

//             deleteUsuarioFile(() => {
//               // Step 6: Delete the user if they exist
//               const queryUsuario = 'DELETE FROM usuarios WHERE id= ?';
//               dbConexion.query(queryUsuario, [userid], (error) => {
//                 if (error) {
//                   return dbConexion.rollback(() => {
//                     console.error('Error al borrar usuario', error);
//                     res.status(500).send({ message: 'Error al borrar usuario' });
//                   });
//                 }

//                 dbConexion.commit((err) => {
//                   if (err) {
//                     return dbConexion.rollback(() => {
//                       console.error('Error al hacer commit de la transacción', err);
//                       res.status(500).send({ message: 'Error al finalizar la transacción' });
//                     });
//                   }

//                   console.log('Datos eliminados correctamente en ambas tablas');
//                   res.send({ message: 'Usuario y jugador eliminados correctamente' });
//                 });
//               });
//             });
//           });
//         });
//       });
//     });
//   });
// });


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


app.get('/get/equipo', authenticateToken, (req, res) => {
  // Acceder a los equipos asignados del usuario autenticado
  const equiposAsignados = req.user.equipos;

  if (!equiposAsignados || equiposAsignados.length === 0) {
    return res.status(403).json({ error: 'No tienes equipos asignados' });
  }

  // Extraer solo los IDs de los equipos asignados
  const equiposIds = equiposAsignados.map(equipo => equipo.id);

  // Construir la consulta para obtener solo los equipos asignados al usuario
  const query = `SELECT * FROM equipo WHERE id IN (?)`;

  dbConexion.query(query, [equiposIds], (error, results) => {
    if (error) {
      console.error('Error al traer equipos:', error);
      return res.status(500).json({ error: 'Error al traer equipos' });
    }

    // Si no hay resultados, significa que no hay equipos asignados
    if (results.length === 0) {
      return res.status(404).json({ error: 'No se encontraron equipos asignados' });
    }

    // Responder con los equipos asignados
    res.status(200).json({ results });
  });
});


app.get('/auth/equipo/:userId', (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT e.id, e.nombre
    FROM usuario_equipos ue
    JOIN equipo e ON ue.equipo_id = e.id
    WHERE ue.usuario_id = ?
  `;

  dbConexion.query(query, [userId], (error, results) => {
    if (error) {
      console.error('Error al obtener los equipos:', error);
      res.status(500).json({ error: 'Error al obtener los equipos' });
    } else {
      res.status(200).json({ results });
    }
  });
});

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


// ASISTENCIA
app.post('/asistencia/guardar', (req, res) => {
  const { eventos } = req.body; // Se espera un objeto con los datos del evento

  // Iniciar la transacción
  dbConexion.beginTransaction((err) => {
    if (err) {
      console.error('Error al iniciar la transacción:', err);
      return res.status(500).json({ message: 'Error al guardar el evento' });
    }

    // Paso 1: Insertar el evento
    const valuesEvento = [
      [eventos.evento, eventos.equipoId, eventos.fecha, eventos.hora, eventos.horaFinalizacion, eventos.descripcion, eventos.ubicacion]
    ];

    const queryEvento = 'INSERT INTO evento (evento, id_equipo, fecha, hora, hora_final, descripcion, ubicacion) VALUES ?';

    dbConexion.query(queryEvento, [valuesEvento], (errorEventos, resultsEvento) => {
      if (errorEventos) {
        dbConexion.rollback(() => {
          console.error('Error al insertar el evento:', errorEventos);
          return res.status(500).json({ message: 'Error al guardar el evento' });
        });
      } else {
        // Si el evento se ha insertado correctamente, hacer commit
        dbConexion.commit((err) => {
          if (err) {
            dbConexion.rollback(() => {
              console.error('Error al hacer commit de la transacción:', err);
              res.status(500).json({ message: 'Error al guardar el evento' });
            });
          } else {
            console.log('Evento guardado correctamente');
            res.status(200).json({ message: 'Evento guardado correctamente' });
          }
        });
      }
    });
  });
});


// guardar jugadores en evento ya creado
app.post('/evento/existente/guardar', (req,res) => {
  const {asistencias, evento} = req.body;
  // const evento = req.query.evento;

  console.log(asistencias);
  console.log(evento);

  // Paso 1: Query 
  const queryAsistencia = 'INSERT INTO asistencias (id_jugador, estado, descripcion_asist, id_evento) VALUES ?';

  // Paso 2: Insertar asistencias con el ID del evento
  const valuesAsistencias = asistencias.map(a => [
    a.jugadorId,
    a.estado,
    a.observaciones,
    evento // Asignar el ID del evento a cada asistencia
  ]);


  // commit
  dbConexion.query(queryAsistencia, [valuesAsistencias], (errorAsistencia, resultsAsistencia) => {

    if (errorAsistencia) {   
      res.status(500).json({ message: 'Error al guardar la asistencia' });
    }else{
      console.log('Asistencia y evento guardados correctamente');
      res.status(200).json({ message: 'Asistencia y evento guardados correctamente' });
    }
  })


})
+

// EVENTOS ------- SECCION-EVENTO
// traer eventos
app.get('/eventos', authenticateToken, (req, res) => {
  // Obtener el usuario autenticado
  const user = req.user;
  const equiposAsignados = user.equipos; // Equipos asignados al usuario
  const id_equipo = req.query.id_equipo; // Parámetro de id_equipo enviado en la solicitud

  // Construir la consulta base
  let query = "SELECT * FROM evento";
  const params = [];

  // Filtrar los eventos según el id_equipo si se proporciona y no es '0'
  if (id_equipo && id_equipo !== '0') {
    query += ' WHERE id_equipo = ?';
    params.push(id_equipo);
  } else {
    // Si id_equipo es '0', filtrar solo por los equipos asignados al usuario
    if (equiposAsignados && equiposAsignados.length > 0) {
      query += ` WHERE id_equipo IN (${equiposAsignados})`;
    } else {
      return res.status(403).json({ error: 'No tienes equipos asignados' });
    }
  }

  // Ejecutar la consulta
  dbConexion.query(query, params, (error, results) => {
    if (error) {
      console.error('Error al obtener eventos:', error);
      return res.status(500).json({ message: 'Error al obtener eventos' });
    }

    res.status(200).json(results);
  });
});

// evento-division
app.get('/eventos/divison', (req, res) => {
  const id_equipo = req.query.id_equipo;

  // Modificar la consulta para filtrar por la categoría del equipo
  const query = `
    SELECT * FROM evento 
    WHERE id_equipo = ?
  `;

  dbConexion.query(query, [id_equipo], (error, results) => {
    if (error) {
      console.error('Error al obtener eventos:', error);
      return res.status(500).json({ message: 'Error al obtener eventos' });
    }

    res.status(200).json(results);
  });
});


// TRAE informacion de tabla intermedia eventos
app.get('/eventos/info', (req, res) => {
  const id_evento = req.query.id_evento; // Cambié a `req.query` para un GET request
  const query = `
  SELECT ei.*, u.nombre_usuario 
  FROM evento_intermedia ei
  JOIN usuarios u ON ei.id_usuario = u.id
  WHERE ei.id_evento = ?
  ORDER BY ei.fecha_publicacion DESC
`;


  dbConexion.query(query, [id_evento], (error, results) => {
    if (error) {
      console.error('Error al obtener la información del evento:', error);
      return res.status(500).json({ message: 'Error al obtener la información del evento' });
    }
    res.status(200).json(results);
  });
});

// crear una nota a un evento
app.post('/eventos/info', (req, res) => {
  const { id_evento, notas, id_usuario } = req.body; // Destructure the necessary fields from the request body

  // Ensure all required fields are provided
  if (!id_evento || !notas || !id_usuario) {
    return res.status(400).json({ message: 'Faltan parámetros requeridos.' });
  }

  const query = "INSERT INTO evento_intermedia (id_evento, notas, id_usuario, fecha_publicacion) VALUES (?, ?, ?, NOW())";

  dbConexion.query(query, [id_evento, notas, id_usuario], (error, results) => {
    if (error) {
      console.error('Error al guardar la nota:', error);
      return res.status(500).json({ message: 'Error al guardar la nota.' });
    }

    res.status(201).json({ message: 'Nota guardada exitosamente.' });
  });
});

// resolucion de un partido 

app.get('/eventos/page', (req, res) => {
  const page = parseInt(req.query.page) || 1; // Obtener la página de la query, por defecto 1
  const limit = 5; // Número de eventos por página
  const offset = (page - 1) * limit; // Calcular el offset

  const query = `SELECT * FROM evento ORDER BY fecha DESC LIMIT ? OFFSET ?`;

  dbConexion.query(query, [limit, offset], (error, results) => {
    if (error) {
      console.error('Error al obtener eventos:', error);
      return res.status(500).json({ message: 'Error al obtener eventos' });
    }

    res.status(200).json(results);
  });
});

// modificar fecha de evento
app.put('/modificar/fecha/evento', (req,res) => {
  const { id_evento, dia, mes, anio, hora_inicio, minuto_inicio, periodo_inicio,hora_final, minuto_final,periodo_final } = req.body;

  if (!id_evento || !dia || !mes || !anio || !hora_inicio || !minuto_inicio || !periodo_inicio || !hora_final || !minuto_final || !periodo_final) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos' });
  }

  // Convertir la hora de inicio a formato 24 horas
  let horaInicio24 = parseInt(hora_inicio);
  if (periodo_inicio.toLowerCase() === 'pm' && horaInicio24 < 12) {
    horaInicio24 += 12;
  } else if (periodo_inicio.toLowerCase() === 'am' && horaInicio24 === 12) {
    horaInicio24 = 0; // Medianoche
  }

  // Convertir la hora final a formato 24 horas
  let horaFinal24 = parseInt(hora_final);
  if (periodo_final.toLowerCase() === 'pm' && horaFinal24 < 12) {
    horaFinal24 += 12;
  } else if (periodo_final.toLowerCase() === 'am' && horaFinal24 === 12) {
    horaFinal24 = 0; // Medianoche
  }

  // Crear la fecha en formato 'YYYY-MM-DD'
  const fecha = `${anio}-${mes}-${dia}`;

  // Crear las horas en formato 'HH:MM:SS'
  const horaInicio = `${horaInicio24}:${minuto_inicio}:00`;
  const horaFinal = `${horaFinal24}:${minuto_final}:00`;

   // Consulta para actualizar la fecha, hora de inicio y hora final del evento
   const query = 'UPDATE evento SET fecha = ?, hora = ?, hora_final = ? WHERE id = ?';

   dbConexion.query(query, [fecha, horaInicio, horaFinal, id_evento], (error, results) => {
    if (error) {
      console.error('Error al modificar la fecha y horas del evento:', error);
      return res.status(500).json({ error: 'Ha ocurrido un error en el servidor' });
    }

    res.status(200).json({ message: 'Fecha y horas del evento modificadas correctamente' });
  });

});


// modificar location del evento
app.put('/modificar/lugar/evento',(req,res)=>{
  const {id, lugar} = req.body;

  if (!id || !lugar ) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos' });
  }
  console.log(lugar);

  // Consulta para actualizar la ubicacion del evento
  const query = 'UPDATE evento SET ubicacion = ? WHERE id = ?';

  dbConexion.query(query, [lugar, id], (error, results) => {
    if (error) {
      console.error('Error al modificar la ubicacion del evento:', error);
      return res.status(500).json({ error: 'Ha ocurrido un error en el servidor' });
    }

    res.status(200).json({ message: 'ubicacion del evento modificadas correctamente' });
  });
});



// PARTIDOS

// modificar partido
app.put('/modificar/partido',(req,res)=>{
  const {id, nombre_rival, golEquipo, golRival} = req.body;

  if (!id || !nombre_rival || !golEquipo || !golRival ) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos' });
  }

  console.log(id);
  // Definir la consulta de actualización
  const query = `UPDATE evento SET equipo_rival = ?, gol_local = ?, gol_visita = ? WHERE id = ?`;

  dbConexion.query(query, [nombre_rival, golEquipo, golRival, id], (error, results) => {
    if (error) {
      console.error('Error al actualizar el partido:', error);
      return res.status(500).json({ error: 'Error del servidor' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'No se encontró el partido con el ID proporcionado' });
    }

    // Si la actualización fue exitosa
    res.status(200).json({ message: 'Partido actualizado con éxito' });
  });
 
});




// USUARIOS---- SECCION-USUARIO

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
  const query = "INSERT INTO usuarios(nombre_usuario,contrasena,email,rol) VALUES(?,?,?,?)";

  dbConexion.query(query,values,(error,results) =>{
    if(error){
      console.log('Error al crear usuario dentro de la base de datos',error);
    }
    
    const lastInsertId = results.insertId;

    console.log('Se ha creado el usuario con ID:', lastInsertId);

    res.json({ message: 'Se ha creado el usuario con ID: ' + lastInsertId, userId: lastInsertId });
  })
})

// revisa si el correo ya existe
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

// checkea username existente
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
  app.get('/jugadores/total', authenticateToken, (req, res) => {
    // Obtener el usuario autenticado
    const user = req.user;
    const equiposAsignados = user.equipos; // Equipos asignados al usuario
    const id_equipo = req.query.id_equipo; // El id_equipo enviado en la solicitud

    // Construir la consulta base
    let query = 'SELECT COUNT(*) AS totalJugadores FROM jugadores';
    const params = [];

    // Filtrar por id_equipo proporcionado si no es '0'
    if (id_equipo && id_equipo !== '0') {
        query += ' WHERE id_equipo = ?';
        params.push(id_equipo);
    } else {
        // Si id_equipo es '0', solo filtrar por los equipos asignados al usuario
        if (equiposAsignados && equiposAsignados.length > 0) {
            query += ` WHERE id_equipo IN (${equiposAsignados})`;
        } else {
            return res.status(403).json({ error: 'No tienes equipos asignados' });
        }
    }

    // Ejecutar la consulta
    dbConexion.query(query, params, (error, results) => {
        if (error) {
            console.error('Error al ejecutar la consulta', error);
            res.status(500).json({ error: 'Error al buscar jugadores existentes' });
            return;
        }

        // Extraer el total de jugadores
        const totalJugadores = results[0].totalJugadores;
        res.json({ jugadores: totalJugadores });
    });
});


  // jugdores disponibles
  app.get('/jugadores/disponibles', authenticateToken, (req, res) => {
    // Obtener el usuario autenticado
    const user = req.user;
    const equiposAsignados = user.equipos; // Equipos asignados al usuario
    const id_equipo = req.query.id_equipo; // El id_equipo enviado en la solicitud

    // Construir la consulta base
    let query = "SELECT COUNT(*) AS jugadoresDisponibles FROM jugadores WHERE estado_salud = 'Sano'";
    const params = [];

    // Filtrar por id_equipo proporcionado si no es '0'
    if (id_equipo && id_equipo !== '0') {
        query += ' AND id_equipo = ?';
        params.push(id_equipo);
    } else {
        // Si id_equipo es '0', solo filtrar por los equipos asignados al usuario
        if (equiposAsignados && equiposAsignados.length > 0) {
            query += ` AND id_equipo IN (${equiposAsignados.join(',')})`;
        } else {
            return res.status(403).json({ error: 'No tienes equipos asignados' });
        }
    }

    // Ejecutar la consulta
    dbConexion.query(query, params, (error, results) => {
        if (error) {
            console.error('Error al ejecutar la consulta', error);
            res.status(500).json({ error: 'Error al buscar jugadores disponibles' });
            return;
        }

        // Extraer el total de jugadores disponibles
        const jugadoresDisponibles = results[0].jugadoresDisponibles;
        res.json({ jugadores: jugadoresDisponibles });
    });
});



  




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





