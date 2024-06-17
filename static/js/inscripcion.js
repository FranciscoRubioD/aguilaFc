$(document).ready(function() {
  
  // informacion que se guardara 
  var formData;

  // lotties
  // lottie guardado
  // Ruta al archivo JSON de la animación
  const rutaArchivoJSON = '/lottie/saved.json';

  // contenedor de la animacion
  let animacion;
  const mainlottiediv =$('.lottieDiv');
  const contenedorLottie = $('#animacion');

  mainlottiediv.hide();


  //opciones lottie
  const opciones = {
    container: contenedorLottie[0], // Convertir el objeto jQuery en un elemento DOM
    renderer: 'svg',
    loop: false,
    autoplay: true,
    path: rutaArchivoJSON // Ruta al archivo JSON de la animación
  };
  //lotties


// manejar orden de la inscripcion

// opciones del header del formulario
const infoPersonalOpcion = $('#opcionInfoPersonal');

const CrearCuentaOpcion = $('#opcionCrearCuenta');

const editarPerfilOpcion = $('#opcionEditarPerfil');


infoPersonalOpcion.removeClass('option-form');
infoPersonalOpcion.addClass('active');

editarPerfilOpcion.on('click',function(){
  divFormInfo.hide();
  crearCuentaSection.hide();
  seccionEditarPerfil.fadeIn(500);

  editarPerfilOpcion.removeClass('option-form');
  editarPerfilOpcion.addClass('active');

  infoPersonalOpcion.removeClass('active');
  infoPersonalOpcion.addClass('option-form');

  CrearCuentaOpcion.removeClass('active');
  CrearCuentaOpcion.addClass('option-form');
})

function opcionEditarPerfil (){
  divFormInfo.hide();
  crearCuentaSection.hide();
  seccionEditarPerfil.fadeIn(500);

  editarPerfilOpcion.removeClass('option-form');
  editarPerfilOpcion.addClass('active');

  infoPersonalOpcion.removeClass('active');
  infoPersonalOpcion.addClass('option-form');

  CrearCuentaOpcion.removeClass('active');
  CrearCuentaOpcion.addClass('option-form');
}


function OpcionCrearCuenta (){
  divFormInfo.hide();
  seccionEditarPerfil.hide();
  crearCuentaSection.fadeIn(500);

  // quitar clase active y añadir el default
  infoPersonalOpcion.removeClass('active');
  infoPersonalOpcion.addClass('option-form');

  // agregar clase active y elimianr el default
  CrearCuentaOpcion.removeClass('option-form');
  CrearCuentaOpcion.addClass('active');

  editarPerfilOpcion.removeClass('active');
  editarPerfilOpcion.addClass('option-form');
}



CrearCuentaOpcion.on('click',function(){
  divFormInfo.hide();
  seccionEditarPerfil.hide();
  crearCuentaSection.fadeIn(500);

  // quitar clase active y añadir el default
  infoPersonalOpcion.removeClass('active');
  infoPersonalOpcion.addClass('option-form');

  // agregar clase active y elimianr el default
  CrearCuentaOpcion.removeClass('option-form');
  CrearCuentaOpcion.addClass('active');

  editarPerfilOpcion.removeClass('active');
  editarPerfilOpcion.addClass('option-form');
});


infoPersonalOpcion.on('click',function(){
  divFormInfo.fadeIn(500);
  seccionEditarPerfil.hide();
  crearCuentaSection.fadeOut();

  CrearCuentaOpcion.removeClass('active');
  CrearCuentaOpcion.addClass('option-form');

  infoPersonalOpcion.removeClass('option-form');
  infoPersonalOpcion.addClass('active');

  editarPerfilOpcion.removeClass('active');
  editarPerfilOpcion.addClass('option-form');

})


// editar perfil
//seccion
const seccionEditarPerfil = $('#sectionEditarPerfil');

// subir imagen
let formDataFotoPerfil = new FormData();


const subirImagenContainer =$('.subir-imagen');
const subirImagenBtn = $('.subir-imagen-btn');
const inputFotoPerfil = $('#fotoPerfil');

// boton siguiente, omitir y guardar info
const siguienteBtn = $('#siguienteEdit');
const omitirBtn  =$('#omitir');
const guardarEditBtn = $('#guardarEdit');


subirImagenBtn.on('click',function(){
  inputFotoPerfil.click();
})

// cuando se detecte un cambio que la agregue al contenedor de imagen
inputFotoPerfil.on('change',function(event){
  const archivoSeleccionado = event.target.files[0];
  if(archivoSeleccionado){
    const urlImagen = URL.createObjectURL(archivoSeleccionado);
    
    $('#perfil').attr({
      src:`${urlImagen}`
    })

    formDataFotoPerfil.append('fotoPerfil',archivoSeleccionado);

    siguienteBtn.show();
  }
})

// se controla que viene la otra seccion de editar
siguienteBtn.on('click',function(){

  // console.log("Contenido de formData:");
  //   formDataFotoPerfil.forEach((value, key) => {
  //     if (value instanceof File) {
  //       console.log(`${key}: ${value.name} (${value.type}, ${value.size} bytes)`);
  //     } else {
  //       console.log(`${key}: ${value}`);
  //     }
  //   });
  $.ajax({
    type: 'POST',
    url: '/save-photo',
    data: formDataFotoPerfil,
    processData: false,
    contentType: false,
    success: function(response) {
      console.log('Perfil guardado:', response);
      // Puedes mostrar un mensaje de éxito o realizar otras acciones aquí
    },
    error: function(error) {
      console.error('Error al guardar perfil:', error);
      // Puedes mostrar un mensaje de error o realizar otras acciones aquí
    }
  });
    
  subirImagenContainer.hide();
  piernaSection.fadeIn(1000);
  omitirBtn.hide();
  siguienteBtn.hide();


});

omitirBtn.on('click',function(){
  subirImagenContainer.hide();
  piernaSection.fadeIn(1000);
  omitirBtn.hide();
  siguienteBtn.hide();
})

function opcionView(opcion,opanterior){
  opcion.removeClass('option-form');
  opcion.addClass('active');

  opanterior.removeClass('active');
  opanterior.addClass('option-form');

}

guardarEditBtn.on('click',function(){
  seccionEditarPerfil.hide();
  crearCuentaSection.fadeIn(500);
  opcionView(CrearCuentaOpcion,editarPerfilOpcion);
})


// SECCION PIERNA HABIL

// eleccion
let eleccion;
// main div
const piernaSection = $('.pierna-habil');
// pierna habil
const izquierda = $('.izquierda');
const derecha = $('.derecha');

//contendor al elegir una decision
const eleccionPierna = $('.decision-pierna');

// boton de cambiar eleccion y siguiente 
const cambiarPierna = $('#cambiarPiernaHabil');


// al hacer click a cambiar elecion de pierna
cambiarPierna.on('click',function(){

  //esconder botones 
  cambiarPierna.hide();
  guardarEditBtn.hide();

  // mostrar opciones
  izquierda.show();
  derecha.show();

  // esconder decision anterior div
  eleccionPierna.hide();

  // quitar clase para agregar la anterior
  $('.div-pregunta-pierna').removeClass('nogrid');

})

izquierda.on('click',function(){
  eleccion = "";
  elegirPiernaHabil('IZQUIERDA');
  eleccion = izquierda.data('pierna');
  console.log(eleccion);
})

derecha.on('click',function(){
  eleccion = "";
  elegirPiernaHabil('DERECHA');
  eleccion = derecha.data('pierna');
  console.log(eleccion);
})


function elegirPiernaHabil(pierna){
  // agregar pierna habil al texto
  $('#piernaHabil').text(pierna);

  // elimianr elecciones
  izquierda.fadeOut(400);
  derecha.fadeOut(400);

  // if(formData.has('pierna_habil')){
  //   formData.set('pierna_habil',pierna);
  // }


  setTimeout(function(){
    $('.div-pregunta-pierna').addClass('nogrid');
    // entra el success div 
    eleccionPierna.fadeIn();
    // se muestran los botones
    cambiarPierna.show();
    $('#guardarEdit').show();
  },400)



}

// creacion de cuenta
// main div
const crearCuentaSection = $('#crearCuentaSection');
crearCuentaSection.hide();

// form registro
const formRegistro = $('.form-registro');

// parametros para crear usuario inputs
const usuarioInput = $('#usuario');
const correoInput  =$('#correo');
const passwordInput = $('#password');

// lastrowId
let lastrowId;

const crearUsuariobtn = $('#crearUsuarioBtn');


usuarioInput.on('input',function(){
  if(usuarioInput.val() !== ''){
    usuarioExiste(usuarioInput.val());
  }
});

correoInput.on('input',function(){
  if(correoInput.val() !== ''){
    correoExistente(correoInput.val());
  }
});


formRegistro.on('submit', function(event) {
  event.preventDefault(); // Evitar que el formulario se envíe de manera tradicional

  if(isPasswordSecure(passwordInput.val())){
     // Obtener los datos del formulario como un array de objetos clave-valor
    var formDataArray = $(this).serializeArray();

    $.ajax({
      type:'POST',
      url:'/save-user-account',  
      data: formDataArray,
      success: function(response){
        $.ajax({
          type:'POST',
          url:'/finalize-signup',
          success:function(response){
            console.log(response);
            alert('informacion guardada');
          },error:function(error){
            alert('error');
          }
        })

      
      },error:function(error){
        console.error('Error al crear usuario',error);
      }
    })
  }else{
    alert('La contraseña debe tener al menos 8 caracteres, contener al menos una letra mayúscula y una letra minúscula, al menos un número, y al menos un carácter especial')
  }

});
 

function isPasswordSecure(password) {
  // Mínimo 8 caracteres
  if (password.length < 8) {
    return false;
  }

  // Al menos una letra mayúscula y una letra minúscula
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
    return false;
  }

  // Al menos un número
  if (!/\d/.test(password)) {
    return false;
  }

  // Al menos un carácter especial
  if (!/[!@#$%^&*()-_=+{};:,<.>]/.test(password)) {
    return false;
  }

  return true;
}

function usuarioExiste(usuario){
  $.ajax({
    type:'GET',
    url:'/usuario/existente/'+usuario,
    success: function(response){
      console.log(response);
      if(response.existe === true){
        $('.error-user').show();
      }else{
        $('.error-user').hide();
      }
    },error:function(error){
      console.error('Error al traer usuario',error);
    }
  });

}

function correoExistente(correo){
  $.ajax({
    type:'GET',
    url:'/correo/existente/'+correo,
    success: function(response){
      console.log(response);
      if(response.existe === true){
        $('.error-correo').show();
      }else{
        $('.error-correo').hide();
      }
    },error:function(error){
      console.error('Error al traer correo',error);
    }
  });
}

// manejar form inicial 

// main div
const divFormInfo = $('.información-personal-form');

// debug
// divFormInfo.hide();
crearCuentaSection.hide();

// form
const formJugador = $('.form-jugador'); 

// input foto de cedula
const fotoCedulaDiv = $('.cedula-adjuntar');
const inputFotoCedula = $('#subirCedula');

// boton Enviar formulario
const enviarFormJugadores = $('#enviarFormulario');
// enviarFormJugadores.prop('disabled',true);


// traer el usuario ID
const userId = $('#usuarioid');

// pierna habil
const jugadorPiernaHabil = $('#piernaJugador');


function asignarCampos(){
  if(eleccion){
    jugadorPiernaHabil.val(eleccion);
    console.log(`Se agrego, ${eleccion} como valor a pierna habil`);
  }
}


function EnviarInfoPersonal(data){
  $.ajax({
    type:'POST',
    url: '/save-personal-info',
    processData: false, // No procesar los datos (FormData se encarga de ello)
    contentType: false, // No especificar el tipo de contenido (FormData lo maneja)
    data: data, // Pasar directamente el objeto FormData
    success: function(response){
      console.log(response);
      

    },error:function(error){
      console.log('Error al enviar datos del jugador',error);
    }
  })
}



formJugador.on('submit', function(event) {
  event.preventDefault(); // Evitar que el formulario se envíe de manera tradicional
  formData = new FormData(formJugador [0]);
  
  EnviarInfoPersonal(formData);

  // if(!formData.has('pierna_habil')){
  //   formData.append('pierna_habil',pierna)
  // }
 
 
  // PASAR A SIGUIENTE PAGINA
  opcionEditarPerfil();

});




fotoCedulaDiv.off('click').on('click',function(){

  inputFotoCedula.click();
  // nombre del archivo seleccionado
  inputFotoCedula.on('change',function(){
    const archivos = inputFotoCedula[0].files;

    if (archivos.length > 0) {
      // Obtener el nombre del primer archivo seleccionado
      var nombreArchivo = archivos[0].name;   
      $('.cedula-adjuntar p').empty().text(nombreArchivo);

    }
  })
});


function infoJugador(){

  function traerEquipos(){
    $.ajax({
      type:'GET',
      url:'/get/equipo',
      dataType:'json',
      success: function(response){
        
        console.log(response.results);
        $('#categorias').empty();

        var opcionPlaceholder = $('<option>', {
          text: 'Seleccionar una opción',
          value: '', // Valor vacío
          disabled: true, // Deshabilitada
          selected: true, // Seleccionada por defecto
          hidden: true // Oculta para que no sea seleccionable
        });

        // Agregar la opción de placeholder al elemento select con id 'miSelect'
        $('#categorias').prepend(opcionPlaceholder);

        response.results.forEach(function(equipo) {
          console.log(equipo.nombre);

          // creamos el elemento html opcion con nombre de equipo
          const opcion = $('<option>').text(equipo.nombre);

          // asignar valor al campo
          opcion.val(equipo.id);
          // lo agregamos a la lista
          $('#categorias').append(opcion);
        });

        $('#categorias').on('change',function(){
          const seleccion = $(this).val();
          const nombreSeleccion = $(this).find('option:selected').text();
          
          nombre_equipo = nombreSeleccion;
          id_equipo = seleccion;
          
          configJugadorbtn.prop('disabled',false);
        })
      }
    })
  }

  traerEquipos();
  let id_equipo = null;
  let numero_jugador = null;
  let nombre_equipo = null;
  

  // crear botones
  const guardarbtn =$('.guardar-btn');
  const configJugadorbtn = $('.config-btn');

  // se deshabilita hasta que se elija una opcion
  configJugadorbtn.prop('disabled',true);
  guardarbtn.prop('disabled',true);

  // que boton se muestra al inicio
  configJugadorbtn.show();
  guardarbtn.hide();

  // contenedor principal
  const InfoConfigMain = $('.info-jugador-div');
  InfoConfigMain.show();

  // contenedor Seleccionar equipo
  const equipoDiv = $('.categoria-div');
  equipoDiv.show();

  // contenedor seleccionar nuemro
  const numeroJugadorConfig = $('.config-numero-div');
  numeroJugadorConfig.hide();
  // input para seleccionar numero
  const inputnumeroJugador =$('#inputNumeroJugador');
  inputnumeroJugador.val('');

  numeroJugadorConfig.hide();

  // una vez se hizo el form
  const successInfo = $('.success-config-jugador');
  successInfo.hide();   
  

  // pasar a seccion elegir numero de jugador
  configJugadorbtn.on('click',function(){
    // desaparecer la seleccion de equipo
    equipoDiv.fadeOut(500);
    // desaparecer boton de siguiente
    configJugadorbtn.fadeOut(500);
  
    // aparecer seccion de numero de jugador yus boton guardar
    setTimeout(function(){
      numeroJugadorConfig.fadeIn(500);
      guardarbtn.fadeIn(500);
    },500);
    
    // deshabilitar click de siguiente
    configJugadorbtn.prop('disabled',true);
  });


  // reglas 1. que solo permita teclear numeros
  inputnumeroJugador.on('keypress', function(event) {
    // Obtener el código de la tecla presionada
    var keyCode = event.which ? event.which : event.keyCode;

    // Permitir solo números (códigos de teclas del 48 al 57)
    if (keyCode < 48 || keyCode > 57) {
        // Prevenir la acción predeterminada si la tecla no es un número
        event.preventDefault();
    }

    
  // reglas 2 Limite de digitos (3)
    if(this.value.length >= 2){
      event.preventDefault();
    }
  });


  // accion al hacer input
  inputnumeroJugador.on('input',function(){

    if(inputnumeroJugador.val()===''){
      guardarbtn.prop('disabled',true);
    }
  
    numero_jugador = inputnumeroJugador.val();
    guardarbtn.prop('disabled',false);

    if(inputnumeroJugador)
  
    validarNumero(numero_jugador,id_equipo);
  
  });


  function validarNumero(jugador,equipo){
    $.ajax({
      type: 'GET',
      url: '/numero-jugador-disponible',
      data: { numero_jugador: jugador , id_equipo: equipo },
  
        success: function(response){
         
          if(jugador !== ''){
            if(response.existe){
              console.log('disponible');
              $('.jugadornodisponible').remove();
  
              $('.guardar-btn').off('click').on('click',function(){
                $('.division').text(nombre_equipo);
                $('.numero-jugador').text(numero_jugador);

  
                $('.info-jugador-div').fadeOut(500);
                
                
                setTimeout(function(){
                  mainlottiediv.show();
                  if (animacion) {
                    animacion.destroy();
                  }
                  animacion = lottie.loadAnimation(opciones);
                },500);
  
                setTimeout(function(){
                  mainlottiediv.hide();
                  successInfo.fadeIn(500);
                },1500);
  
              });
  
            }else{
              $('.guardar-btn').prop('disabled',true);
              console.log('No disponible');
              const mensajeDisponibilidad =$('<p>').text('El número de jugador no está disponible. Por favor, elija otro número.');
              mensajeDisponibilidad.addClass('jugadornodisponible');
              $('.config-numero-div').append(mensajeDisponibilidad);
            }
          }
        },  
        error: function(xhr, status, error) {
          console.error('Error al verificar número de jugador:', error);
          $('#mensajeNumeroJugador').text('Ha ocurrido un error, por favor intenta nuevamente');
        }
    })
  }
  
}

infoJugador();



// boton para editar cambios
const editarJugador = $('.button-editar');

editarJugador.on('click',function(){
  infoJugador();
})


})