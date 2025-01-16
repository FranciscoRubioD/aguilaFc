  const express = require('express');
  const path = require('path');
  const router = express.Router();
  const bcrypt = require('bcrypt'); // Para manejar contraseñas encriptadas
  const jwt = require('jsonwebtoken');
  const dbConexion = require('./db'); // Asegúrate de tener la conexión a tu DB
  const crypto = require('crypto');

  // secret token 
  const secretKeyToken = crypto.randomBytes(32).toString('hex');
  console.log(secretKeyToken); 


  // Ruta para servir el archivo de login HTML
  router.get('/login/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'login.html'));
  });


  // ruta para crear un usuario
  // router.post('/signup', async (req,res) =>{
  //   const { username, contrasena, email, rol  } = req.body;

  //   if(!username || !contrasena || !email || !rol){
  //     return res.status(400).json({ error: 'Se requieren mas datos' });
  //   }

  //   try{
  //     // Verifica si el usuario ya existe
  //     const queryCheck = 'SELECT * FROM usuarios WHERE nombre_usuario = ?';

  //     dbConexion.query(queryCheck, [username], async (error,results) =>{
  //       if(error){
  //         console.error('Error verificando el usuario:', error);
  //         return res.status(500).json({ error: 'Error del servidor' });
  //       }

  //       if (results.length > 0) {
  //         return res.status(400).json({ error: 'El usuario ya existe' });
  //       }

  //       // Cifrar la contraseña
  //       const saltRounds = 10;
  //       const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

  //       // Insertar nuevo usuario en la base de datos
  //       const queryInsert = 'INSERT INTO usuarios (nombre_usuario, contrasena, email, rol) VALUES (?, ?, ?, ?)';

  //       dbConexion.query(queryInsert, [username, hashedPassword, email, rol], (error,results) =>{
  //         if(error){
  //           console.error('Error insertando el usuario:', error);
  //           return res.status(500).json({ error: 'Error del servidor' });
  //         }

  //         res.status(201).json({ message: 'Usuario registrado con éxito' });
  //       }); 



  //     });
  //   } catch (error) {
  //     console.error('Error en el registro:', error);
  //     res.status(500).json({ error: 'Error en el servidor' });
  //   }

  // });

  router.post('/signup', async (req, res) => {
    const { nombreUsuario, nombrePersona, correoUsuario, tipoUsuario, equiposSeleccionados, contrasena } = req.body;

    if (!nombreUsuario || !nombrePersona || !correoUsuario || !tipoUsuario || !equiposSeleccionados || equiposSeleccionados.length === 0 || !contrasena) {
        return res.status(400).json({ error: 'Se requieren más datos o seleccionar al menos un equipo' });
    }

    try {
        // Verifica si ya existen menos de 4 usuarios
        const countQuery = 'SELECT COUNT(*) AS count FROM usuarios WHERE rol != "jugador"';
        dbConexion.query(countQuery, async (error, result) => {
            if (error) {
                console.error('Error al contar usuarios:', error);
                return res.status(500).json({ error: 'Error del servidor' });
            }

            if (result[0].count >= 4) {
                return res.status(400).json({ error: 'Ya existe el máximo de usuarios permitidos (4)' });
            }

            // Verifica si el nombre de usuario ya existe
            const queryCheck = 'SELECT * FROM usuarios WHERE nombre_usuario = ?';
            dbConexion.query(queryCheck, [nombreUsuario], async (error, results) => {
                if (error) {
                    console.error('Error verificando el usuario:', error);
                    return res.status(500).json({ error: 'Error del servidor' });
                }

                if (results.length > 0) {
                    return res.status(400).json({ error: 'El usuario ya existe' });
                }

                // Cifrar la contraseña
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

                // Inserta el nuevo usuario con contraseña cifrada
                const insertUserQuery = 'INSERT INTO usuarios (nombre_usuario, nombre, email, rol, contrasena) VALUES (?, ?, ?, ?, ?)';
                dbConexion.query(insertUserQuery, [nombreUsuario, nombrePersona, correoUsuario, tipoUsuario, hashedPassword], (error, results) => {
                    if (error) {
                        console.error('Error al insertar usuario:', error);
                        return res.status(500).json({ error: 'Error del servidor' });
                    }

                    const userId = results.insertId; // ID del usuario recién creado

                    // Inserta cada relación en la tabla intermedia
                    const insertRelationQuery = 'INSERT INTO usuario_equipos (usuario_id, equipo_id) VALUES ?';
                    const values = equiposSeleccionados.map(equipoId => [userId, equipoId]);

                    dbConexion.query(insertRelationQuery, [values], (error, results) => {
                        if (error) {
                            console.error('Error al insertar relación usuario-equipo:', error);
                            return res.status(500).json({ error: 'Error del servidor' });
                        }

                        res.status(201).json({ message: 'Usuario y equipos asociados con éxito' });
                    });
                });
            });
        });
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

  // borrar un usuario
  router.delete('/user/:id', (req, res) => {
    const userId = req.params.id;

    // Primero, eliminar las relaciones en la tabla usuarios_equipos
    const deleteRelationsQuery = 'DELETE FROM usuario_equipos WHERE usuario_id = ?';

    dbConexion.query(deleteRelationsQuery, [userId], (error) => {
        if (error) {
            console.error('Error al eliminar relaciones de usuario:', error);
            return res.status(500).json({ error: 'Error al eliminar relaciones de usuario' });
        }

        // Ahora, eliminar el usuario de la tabla usuarios
        const deleteUserQuery = 'DELETE FROM usuarios WHERE id = ?';

        dbConexion.query(deleteUserQuery, [userId], (error) => {
            if (error) {
                console.error('Error al eliminar usuario:', error);
                return res.status(500).json({ error: 'Error al eliminar usuario' });
            }

            res.status(200).json({ message: 'Usuario y sus relaciones eliminadas correctamente' });
        });
    });
  });


  // ruta para traer los usuarios disponibles
    router.get('/get/user',(req,res) =>{
      const query = "SELECT * FROM usuarios WHERE rol != 'jugador'"

      dbConexion.query(query,(error,results) => {
        if(error){
          console.error('Error al traer usuarios', err);
          res.status(500).json({ error: 'Error al traer usuarios' });
        }else{
          res.status(200).json({ results });
        }
      })
    });

// usuario por id
router.get('/user/info/:id',(req,res)=>{

  const userId = req.params.id;

  const query = "SELECT * FROM usuarios WHERE id = ?";

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
});

// modificar datos usuario
// Ruta para actualizar la información del usuario
router.put('/update/usuario/:id', async (req, res) => {
  const usuario_id = req.params.id;
  const { nombre_usuario, nombre, contrasena,estado } = req.body;

  // Cifrar la contraseña
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(contrasena, saltRounds);


  const query = `
    UPDATE usuarios 
    SET nombre_usuario = ?, nombre = ?, contrasena = ?, estado = ?
    WHERE id = ?
  `;

  dbConexion.query(query, [nombre_usuario, nombre, hashedPassword, estado ,usuario_id], (error, results) => {
    if (error) {
      console.error('Error al actualizar el usuario:', error);
      res.status(500).json({ error: 'Error al actualizar el usuario' });
    } else {
      res.status(200).json({ message: 'Usuario actualizado correctamente' });
    }
  });
});



// tabla intermedia de equipos / usuarios
router.get('/user/equipo/:id', (req, res) => {
  const userId = req.params.id;

  const query = `
      SELECT ue.usuario_id, u.nombre_usuario, e.id AS equipo_id, e.nombre AS nombre_equipo
      FROM usuario_equipos ue
      JOIN usuarios u ON ue.usuario_id = u.id
      JOIN equipo e ON ue.equipo_id = e.id
      WHERE ue.usuario_id = ?
  `;

  dbConexion.query(query, [userId], (error, results) => {
      if (error) {
          console.error('Error al obtener datos:', error);
          res.status(500).json({ error: 'Error al obtener datos' });
      } else {
          res.status(200).json({ results });
      }
  });
});

// verificar a que equipos tiene accesso 
router.get('/user/equipos/:id', (req, res) => {
  const userId = req.params.id;

  const query = `
      SELECT e.id AS equipo_id, e.nombre AS nombre_equipo
      FROM usuario_equipos ue
      JOIN equipo e ON ue.equipo_id = e.id
      WHERE ue.usuario_id = ?
  `;

  dbConexion.query(query, [userId], (error, results) => {
      if (error) {
          console.error('Error al obtener los equipos:', error);
          res.status(500).json({ error: 'Error en el servidor al obtener los equipos' });
      } else if (results.length === 0) {
          res.status(404).json({ message: 'El usuario no tiene acceso a ningún equipo' });
      } else {
          const equipos = results.map(row => ({
              equipo_id: row.equipo_id,
              nombre_equipo: row.nombre_equipo
          }));

          res.status(200).json({
              message: `El usuario con ID ${userId} tiene acceso a los siguientes equipos.`,
              equipos
          });
      }
  });
});



// Ruta para asignar un equipo a un usuario, verificando si ya existe la relación
router.post('/user/equipo', (req, res) => {
  const { usuario_id, equipo_id } = req.body;


  // Verificación básica de los parámetros
  if (!usuario_id || !equipo_id) {
    return res.status(400).json({ error: 'Falta el ID de usuario o equipo' });
  }

  // Consulta para verificar si ya existe la relación
  const checkQuery = `
    SELECT * FROM usuario_equipos 
    WHERE usuario_id = ? AND equipo_id = ?
  `;

  dbConexion.query(checkQuery, [usuario_id, equipo_id], (error, results) => {
    if (error) {
      console.error('Error al verificar la relación existente:', error);
      return res.status(500).json({ error: 'Error al verificar la relación' });
    }

    // Si la relación ya existe, envía un mensaje de error
    if (results.length > 0) {
      return res.status(400).json({ error: 'El equipo ya está asignado al usuario' });
    }

    // Si la relación no existe, se inserta la nueva relación
    const insertQuery = `
      INSERT INTO usuario_equipos (usuario_id, equipo_id)
      VALUES (?, ?)
    `;

    dbConexion.query(insertQuery, [usuario_id, equipo_id], (insertError, insertResults) => {
      if (insertError) {
        console.error('Error al asignar equipo al usuario:', insertError);
        res.status(500).json({ error: 'Error al asignar equipo al usuario' });
      } else {
        res.status(200).json({ message: 'Equipo asignado correctamente al usuario' });
      }
    });
  });
});

router.delete('/user/equipo/:userId/:equipoId', (req, res) => {
  const userId = req.params.userId; // Usuario ID
  const equipoId = req.params.equipoId; // Equipo ID

  console.log(`Eliminando relación usuario: ${userId}, equipo: ${equipoId}`);

  const query = `
      DELETE FROM usuario_equipos
      WHERE usuario_id = ? AND equipo_id = ?
  `;

  dbConexion.query(query, [userId, equipoId], (error, results) => {
      if (error) {
          console.error('Error al eliminar la relación:', error);
          res.status(500).json({ error: 'Error al eliminar la relación' });
      } else {
          if (results.affectedRows === 0) {
              // No se encontró ninguna relación que eliminar
              res.status(404).json({ message: 'No se encontró la relación para eliminar' });
          } else {
              res.status(200).json({ message: 'Relación eliminada correctamente' });
          }
      }
  });
});





  // ruta procesar inicio de sesion
  router.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
  
    // Consultar en la base de datos para obtener los datos del usuario
    const query = 'SELECT id, nombre_usuario, nombre, contrasena, rol, email, estado FROM usuarios WHERE nombre_usuario = ?';
  
    dbConexion.query(query, [username], async (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Error en el servidor' });
      }
  
      if (results.length === 0) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }
  
      const user = results[0]; // Aquí obtienes los datos del usuario
  
      // Verificar si el usuario está bloqueado
      if (user.estado === 1) {
        return res.status(403).json({ error: 'Usuario bloqueado. Contacte al administrador.' });
      }
  
      // Comparar la contraseña del usuario con la almacenada en la base de datos
      const passwordMatch = await bcrypt.compare(password, user.contrasena);
  
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }
  
      // Realizar consulta adicional para obtener los equipos asignados al usuario
      const equiposQuery = `
        SELECT equipo_id 
        FROM usuario_equipos 
        WHERE usuario_id = ?
      `;
  
      dbConexion.query(equiposQuery, [user.id], (equiposError, equiposResults) => {
        if (equiposError) {
          return res.status(500).json({ error: 'Error al obtener los equipos del usuario' });
        }
  
        // Extraer los IDs de los equipos
        const equiposAsignados = equiposResults.map(row => row.equipo_id);
  
        // Agregar los equipos asignados al objeto usuario
        user.equiposAsignados = equiposAsignados;
  
        // Generar el JWT token incluyendo los equipos asignados
        const token = generateAccessToken(user);
  
        // Enviar el token al cliente
        res.json({ token });
      });
    });
  });
  


  router.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'Welcome to the protected route!', user: req.user });
  });


  // funciones
  function generateAccessToken(user) {
    const payload = {
      id: user.id,               // ID del usuario
      username: user.nombre_usuario,  // Incluye el username en el payload
      nombre: user.nombre,  // Asegúrate de incluir 'nombre' en el payload
      rol: user.rol,
      email: user.email,
      equipos: user.equiposAsignados
    };
  
    const secret = secretKeyToken;
    const options = { expiresIn: '1h' };
  
    return jwt.sign(payload, secret, options);
  }

  function verifyAccessToken(token){
    const secret = secretKeyToken;

    try {
      const decoded = jwt.verify(token, secret);
      return { success: true, data: decoded };
    } catch (error) {
      return { success: false, error: error.message };
    }

  }

  function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    
    console.log('Authorization header:', authHeader);  // Agregar este log para verificar el encabezado
    const token = authHeader && authHeader.split(' ')[1];
  
    if (!token) {
      return res.sendStatus(401); // Si no hay token, retornar error 401
    }
  
    // Verificar el token
    jwt.verify(token, secretKeyToken, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Token inválido' }); // Si el token no es válido
      }
  
      req.user = user; // Asigna el usuario decodificado al objeto req
      next(); // Llama al siguiente middleware o controlador
    });
  }
    
  module.exports = { router, authenticateToken }; // Exportar el router
