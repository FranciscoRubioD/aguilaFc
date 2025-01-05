let showSelect = false; // Asegúrate de declarar esta variable globalmente
let modalAbierto = false;
const token = localStorage.getItem('token'); // O el lugar donde guardas el token

console.log(`token sacado ${token}`);

$('.selectBox').on('click', (event) => {
    event.stopPropagation(); // Para evitar que el clic en el div cierre el checkbox
    showCheckbox();
});

function showCheckbox() {
    if (!showSelect) {
        $('#checkBoxEquipo').show();
        showSelect = true;
    } else {
        $('#checkBoxEquipo').hide();
        showSelect = false;
    }
}


// cuando cargue la pagina
$(document).ready(function() {


  $('#addUserbtn2').on('click',function(){
    $('#crearUsuarioModal').fadeIn();
  });

  // cerrar modal crear usuario
  $('.cerrarCrearUsuario').on('click',function(){
    $('.crearUsuario-modal').hide();
  });

  
  poblarTablaUser();

  // trae info de equipos
  $.ajax({
    type:'GET',
    url:'/get/equipo',
    headers: {
      'Authorization': 'Bearer' + token // Agrega el token con "Bearer"
    },
    dataType:'json',
    success: function(response){
      
      // una vez tenemos info de los equipos
   
      // creamos opciones en base a cantidad de equipo
      response.results.forEach(function(equipo) {

        const equipoLabel = $('<label>').addClass('checkmark-user');
        const nombreLabel = $('<p>').text(equipo.nombre);
        const inputEquipo = $('<input>').attr('type','checkbox');
        inputEquipo.val(equipo.id);

        equipoLabel.append(inputEquipo);
        equipoLabel.append(nombreLabel);
        
        $('#checkBoxEquipo').append(equipoLabel);
     

        // si ya tiene no lo agregue
        

        const inputOptionEquipo = $('<option>');
        inputOptionEquipo.text(equipo.nombre);
        inputOptionEquipo.val(equipo.id);
        

        $('#mySelect4').append(inputOptionEquipo);
        

      });
      
     

      NiceSelect.bind(document.getElementById("mySelect4"), {
      });
    

    },
    error: function(xhr, status, error) {
      console.error('Error al obtener informacion de equipo:', error);
    }

  });

  
  // eventos del form
  formUsuarios = $('#crearUsuarioForm');

  formUsuarios.off('submit').on('submit',function(event){

    event.preventDefault();
    event.stopPropagation(); // Evita la propagación del evento

    // validar los checkmarks
    if ($('#checkBoxEquipo input[type="checkbox"]:checked').length === 0) {
      event.preventDefault(); // Evita que el formulario se envíe o se ejecute la acción
      $('#error-message').show(); // Muestra el mensaje de error
    } else {
        $('#error-message').hide(); // Oculta el mensaje si al menos uno está seleccionado
        console.log('Al menos un checkbox está seleccionado');
        // Aquí puedes continuar con la lógica si la validación es exitosa
    }

    // Captura los valores de los checkboxes seleccionados
    let valoresSeleccionados = [];
    $('#checkBoxEquipo input[type="checkbox"]:checked').each(function() {
        valoresSeleccionados.push($(this).val());  // Agregar valor al array
    });


    nombreUsuario = $('#nombreUsuario').val();
    nombrePersona = $('#nombrePersona').val();
    correoUsuario = $('#correoUsuario').val();
    tipoUsuario  = $('#mySelect3').val();
    contrasena  = "aguila2025"

    const dataForm = {
      nombreUsuario : nombreUsuario,
      nombrePersona : nombrePersona,
      correoUsuario : correoUsuario,
      tipoUsuario : tipoUsuario,
      equiposSeleccionados: valoresSeleccionados,
      contrasena : contrasena
    }

    

    $.ajax({
      url: '/signup',
      method: 'POST',
      data: JSON.stringify(dataForm),
      contentType: 'application/json', // Especifica el tipo de contenido JSON
      success: function(response) {
          console.log('Usuario creado:', response);
          alert(response.message); // Muestra un mensaje de éxito

          // Limpiar el formulario después de la creación exitosa
          formUsuarios[0].reset();
          $('#checkBoxEquipo input[type="checkbox"]').prop('checked', false); // Deselecciona los checkboxes
          poblarTablaUser();
      },
      error: function(error) {
          console.error('Error al crear el usuario:', error.responseJSON?.error || error.statusText);
          alert(error.responseJSON?.error || 'Error en el servidor'); // Muestra un mensaje de error
      }
    });


  });



});



function editUser(id){

  $('#editUserModal').fadeIn();
  $('.cerrarEditUser').on('click',function(){
    $('.crearUsuario-modal').hide();
  });

  $.ajax({
      type:'GET',
      url:'/user/info/'+id,
      dataType: 'json',
      success: function(response){
        
        console.log(`usuario a editar: ${response.nombre_usuario}`);
        $('#nameEdit').val(response.nombre);
        $('#userEdit').val(response.nombre_usuario);
        $('#estadoUsuario').val(response.estado);

        $('#actualizarDatosUser').off('click').on('click',function(){
          actualizarUsuario(response.id);
        });

        // editar datos
        function actualizarUsuario(usuarioId) {

          const nombreUsuario = $('#userEdit').val();
          const nombre = $('#nameEdit').val();
          const contrasena = $('#passwordEdit').val();
          const estado = $('#estadoUsuario').val();

          $.ajax({
            type: 'PUT',
            url: `/update/usuario/${usuarioId}`,
            data: JSON.stringify({
              nombre_usuario: nombreUsuario,
              nombre: nombre,
              contrasena: contrasena,
              estado: estado
            }),
            contentType: 'application/json',
            success: function(response) {
              alert(response.message); // Mensaje de éxito si la actualización fue correcta
              poblarTablaUser();
            },
            error: function(xhr) {
              alert('Hubo un problema al actualizar la información del usuario');
            }
          });

        };



        // asignar etiquetas
        poblarEtiquetas();
       


        // traer tabla intermedia
        function poblarEtiquetas(){

          $('.divEquipos-inner').empty();

          $.ajax({
            type:'GET',
            url:'/user/equipo/'+id,
            dataType: 'json',
            success: function(response){
            

              if (response.results.length === 0) {
                // Si no hay registros, muestra un mensaje
                $('.divEquipos-inner').append('<p>Sin equipo asignado.</p>');
              } 
  
              response.results.forEach(function(data) {
                //crear container de etiquetas
                const contenedorEtiqueta = $('<div>').addClass('container-team');
                const etiquetaEquipo  = $('<p>').text(data.nombre_equipo);
                const eliminarEquipo = $('<p>').text('X');
                eliminarEquipo.addClass('eliminarEquipoIcon')

                contenedorEtiqueta.append(etiquetaEquipo,eliminarEquipo);
                $('.divEquipos-inner').append(contenedorEtiqueta);  

                eliminarEquipo.on('click',function(){
                  
                  
                const alertEliminarEquipo = confirm(`Seguro quieres eliminar ${data.nombre_equipo}?`);

                if(alertEliminarEquipo){
                  eliminarRelacionEquipo(data.usuario_id,data.equipo_id);
                }else{
                  return
                }

               

                
              });

  
              })
  
  
            },
            error: function(xhr, status, error) {
              console.error('Error al obtener informacion de equipo:', error);
            }
  
          });



        }

        

        // eliminar relacion de usuario / equipo
        function eliminarRelacionEquipo(idUsuario, idEquipo) {
          $.ajax({
              type: 'DELETE',
              url: '/user/equipo/' + idUsuario + '/' + idEquipo, // Separar los parámetros con '/'
              success: function(response) {
                  console.log('Relación eliminada:', response.message);
                  alert('Relación eliminada correctamente');
                  poblarEtiquetas();
              },
              error: function(xhr, status, error) {
                  console.error('Error al eliminar la relación:', error);
                  alert('No se pudo eliminar la relación. Por favor, inténtalo de nuevo.');
              }
          });
        } 


        // agregar team a equipo
        $('#agregarEquipobtn').off('click').on('click', function(){
          const equipoId = $('#mySelect4').val();


          asignarEquipoAUsuario(id,equipoId);

        });



        // asignar una etiqueta
        // Función para asignar un equipo a un usuario
        function asignarEquipoAUsuario(usuario_id, equipo_id) {
          $.ajax({
            type: 'POST',
            url: '/user/equipo',
            data: JSON.stringify({ usuario_id: usuario_id, equipo_id: equipo_id }),
            contentType: 'application/json',
            success: function(response) {
              alert(response.message); // Mensaje de éxito si el equipo fue asignado correctamente
              poblarEtiquetas();
            },
            error: function(xhr) {
              if (xhr.status === 400) {
                // Si el equipo ya está asignado, muestra el mensaje de error
                alert(xhr.responseJSON.error);
              } else {
                // Otro error
                alert('Hubo un problema al asignar el equipo al usuario');
              }
            }
          });
        }

          


      },
      error: function(xhr, status, error) {
        console.error('Error al obtener informacion de equipo:', error);
      }
  });

}

function poblarTablaUser() {
  // Borramos la lista y aplicamos el skeleton loading
  $('.tabla-usuarios').empty();

  // Agrega temporalmente los skeleton loaders para simular la carga
  for (let i = 0; i < 4; i++) { // Puedes ajustar el número de skeleton loaders
    const skeletonLoader = $('<div>').addClass('user-inner skeleton');
    $('.tabla-usuarios').append(skeletonLoader);
  }

  // Realiza la solicitud AJAX después de 3 segundos
  setTimeout(() => {
    $.ajax({
      type: 'GET',
      url: '/get/user',
      dataType: 'json',
      success: function(response) {
        // Limpia los skeleton loaders antes de agregar el contenido real
        $('.tabla-usuarios').empty();

        response.results.forEach(function(usuario) {
          // Creación del contenido real del usuario
          const user = $('<div>').addClass('user');
          const userInner = $('<div>').addClass('user-inner');

          // Parte izquierda
          const userInnerl = $('<div>').addClass('user-inner-l');
          const userInnerlinner = $('<div>').addClass('user-inner-l-inner');
          const userProfilePic = $('<div>').addClass('user-profile-pic');
          const d3Image = $('<div>').addClass('d3-profile');
          const nombreUsuario = $('<p>').text(usuario.nombre_usuario);
          const rolUsuario = $('<p>').text(usuario.rol).addClass('rol-usuario');

          // Append de la parte izquierda
          userInnerl.append(userInnerlinner);
          userProfilePic.append(d3Image);
          userInnerlinner.append(userProfilePic);
          userInnerlinner.append(nombreUsuario, rolUsuario);

          // Parte derecha
          const userInnerR = $('<div>').addClass('user-inner-r');
          const userInnerRInner = $('<div>').addClass('user-inner-r-inner');

          const editUserIcon = $('<i>').addClass('fa-regular fa-pen-to-square');
          const deleteUserIcon = $('<i>').addClass('fa-solid fa-trash');

          // Estado bloqueado/desbloqueado
          const unlockedUser = $('<i>').addClass('fa-solid fa-lock-open').css('color', '#63E6BE');
          const lockedUser = $('<i>').addClass('fa-solid fa-lock').css('color', '#bf1818');

          userInnerRInner.append(usuario.estado === 0 ? unlockedUser : lockedUser);

          userInnerR.append(userInnerRInner);
          userInnerRInner.append(editUserIcon, deleteUserIcon);

          user.append(userInner);
          userInner.append(userInnerl, userInnerR);

          $('.tabla-usuarios').append(user);

          editUserIcon.on('click', function() {
            editUser(usuario.id);
          });

          deleteUserIcon.on('click', function() {
            if (confirm('¿Seguro deseas eliminar Jugador?')) {
              deleteUser(usuario.id);
            }
          });
        });
      },
      error: function(xhr, status, error) {
        console.error('Error al obtener información de equipo:', error);
      }
    });
  }, 3000); // 3 segundos de retraso antes de cargar el contenido real
}



function deleteUser(id){
  $.ajax({
    url: `/user/${id}`,
    type: 'DELETE',
    success: function(response) {
        console.log(response.message); // Mensaje de éxito
        poblarTablaUser();
        // Aquí puedes actualizar la interfaz de usuario según sea necesario
    },
    error: function(xhr) {
        console.error('Error al eliminar el usuario:', xhr.responseJSON.error);
        // Aquí puedes mostrar un mensaje de error al usuario
    }
  });
}



// Detectar clics fuera del div y cerrar el checkbox
$(document).on('click', function(event) {
    // Si el clic no es en .selectBox o en #checkBoxEquipo, ocultar el checkbox
    if (!$(event.target).closest('.selectBox, #checkBoxEquipo').length) {
        $('#checkBoxEquipo').hide();
        showSelect = false;
    }

   






});