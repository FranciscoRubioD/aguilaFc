$(document).ready(function() {
  // lotties
  // lottie guardado
  // Ruta al archivo JSON de la animación
  const rutaArchivoJSON = '/lottie/saved.json';

  // contenedor de la animacion
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
  


// manejar info de jugador

function infoJugador(){

  function traerEquipos(){
    $.ajax({
      type:'GET',
      url:'/get/equipo',
      dataType:'json',
      success: function(response){
        
        console.log(response.results);
        $('#categorias').empty();
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
  
    // aparecer seccion de numero de jugador y boton guardar
    setTimeout(function(){
      numeroJugadorConfig.fadeIn(500);
      guardarbtn.fadeIn(500);
    },500);
    
    // deshabilitar click de siguiente
    configJugadorbtn.prop('disabled',true);
  });

  // accion al hacer input
  inputnumeroJugador.on('input',function(){

    if(inputnumeroJugador.val()===''){
      guardarbtn.prop('disabled',true);
    }
  
    numero_jugador = inputnumeroJugador.val();
    guardarbtn.prop('disabled',false);
  
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
  
              $('.guardar-btn').on('click',function(){
                $('.division').text(nombre_equipo);
                $('.numero-jugador').text(numero_jugador);

  
                $('.info-jugador-div').fadeOut(500);
                
                
                setTimeout(function(){
                  mainlottiediv.show();
                  const animacion = lottie.loadAnimation(opciones);
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
// // Cargar la animación

// resultado de manejo de info
// const successInfo = $('.success-config-jugador');
// successInfo.hide();

// // boton de seguir con la otra opcion 
// const configJugadorbtn = $('.config-btn');



// // seccion asignar numero a jugadro
// const numeroJugadorConfig = $('.config-numero-div');
// const inputnumeroJugador =$('#inputNumeroJugador');

// numeroJugadorConfig.hide();


// configJugadorbtn.prop('disabled',true);

// configJugadorbtn.on('click',function(){
//   $('.categoria-div').fadeOut(500);
  

//   configJugadorbtn.fadeOut(500);

  

//   setTimeout(function(){
//     numeroJugadorConfig.fadeIn(500);
//     $('.guardar-btn').fadeIn(500);
//   },500)
  
//   configJugadorbtn.prop('disabled',true);
//   $('.guardar-btn').prop('disabled',true);
// })


// inputnumeroJugador.on('input',function(){

//   if(inputnumeroJugador.val()===''){
//     $('.guardar-btn').prop('disabled',true);
//   }

//   numero_jugador = inputnumeroJugador.val();
//   $('.guardar-btn').prop('disabled',false);

//   validarNumero(numero_jugador,id_equipo);

// });


// boton para editar cambios
const editarJugador = $('.button-editar');

editarJugador.on('click',function(){
  infoJugador();
})




})