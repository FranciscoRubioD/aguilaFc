let showSelect = false; // Asegúrate de declarar esta variable globalmente
let modalAbierto = false;


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

  // trae info de usuarios

  // plantilla
  // $.ajax({
  //   type:'GET',
  //   url:'/get/equipo',
  //   dataType: 'json',
  //   success: function(response){

  //   },
  //   error: function(xhr, status, error) {
  //     console.error('Error al obtener informacion de equipo:', error);
  //   }
  // });
  poblarTablaUser();



  
  

  // trae info de equipos
  $.ajax({
    type:'GET',
    url:'/get/equipo',
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
        console.log(`estos son: ${equipo.id}`);

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

    console.log(dataForm);

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
              console.log(response);

              if (response.results.length === 0) {
                // Si no hay registros, muestra un mensaje
                $('.divEquipos-inner').append('<p>Sin equipo asignado.</p>');
              } 
  
              response.results.forEach(function(data) {
  
                console.log(data.equipo_id);
                
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
                  eliminarRelacionEquipo(data.equipo_id);
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
        function eliminarRelacionEquipo(idEquipo){
          $.ajax({
            type:'DELETE',
            url:'/user/equipo/'+idEquipo,
            dataType: 'json',
            success: function(response){
              
            
              poblarEtiquetas();
              
  
            },
            error: function(xhr, status, error) {
              console.error('Error al obtener informacion de equipo:', error);
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

function poblarTablaUser(){

  // borramos la lista
  $('.tabla-usuarios').empty();
  
  $.ajax({
    type:'GET',
    url:'/get/user',
    dataType: 'json',
    success: function(response){
      
      
      response.results.forEach(function(usuario){

        // creamos los usuarios disponibles
        const user = $('<div>').addClass('user');
        const userInner = $('<div>').addClass('user-inner');

        // left
        const userInnerl = $('<div>').addClass('user-inner-l');
        const userInnerlinner = $('<div>').addClass('user-inner-l-inner');
        const userProfilePic = $('<div>').addClass('user-profile-pic');
        const d3Image = $('<div>').addClass('d3-profile');
        const nombeUsuario  =$('<p>').text(usuario.nombre_usuario);
        const rolUsuario  =$('<p>').text(usuario.rol).addClass('rol-usuario');

        // append left
        userInnerl.append(userInnerlinner);
        userProfilePic.append(d3Image);
        userInnerlinner.append(userProfilePic);
        userInnerlinner.append(nombeUsuario,rolUsuario);
        

        // right
        const userInnerR = $('<div>').addClass('user-inner-r');
        const userInnerRInner = $('<div>').addClass('user-inner-r-inner');
        
        const editUserIcon = $('<i>').addClass('fa-regular fa-pen-to-square');
        const deleteUserIcon  = $('<i>').addClass('fa-solid fa-trash');

        // locked or not
        const unlockedUser = $('<i>').addClass('fa-solid fa-lock-open');
        unlockedUser.attr('style','color:#63E6BE');

        const lockedUser = $('<i>').addClass('fa-solid fa-lock');
        lockedUser.attr('style','color:#bf1818');

        if(usuario.estado === 0){
          userInnerRInner.append(unlockedUser);
        }else{
          userInnerRInner.append(lockedUser);
        }

        // locked or not

        userInnerR.append(userInnerRInner);
        userInnerRInner.append(editUserIcon,deleteUserIcon);

        user.append(userInner);
        userInner.append(userInnerl,userInnerR);

        $('.tabla-usuarios').append(user);

        editUserIcon.on('click',function(){
          editUser(usuario.id);
        });

        deleteUserIcon.on('click',function(){

          const confirmarEliminar = confirm('Seguro deseas eliminar Jugador');

          if(confirmarEliminar){
            deleteUser(usuario.id);
          }else{
            return
          }

         
        });
        

      });
    },
    error: function(xhr, status, error) {
      console.error('Error al obtener informacion de equipo:', error);
    }
  })
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