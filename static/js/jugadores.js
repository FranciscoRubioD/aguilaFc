$(document).ready(function() {
  $('#mensajeDisponible').hide();

  // controlamos la paginacion
  const limit = 10;
  let currentPage =1;

  let ajaxRequestInProgress = false;



  function generarPaginacion(totalPages, funcion){
    $('.numeros-paginacion').empty();
   
    

    const btnAnterior = $('#btnAnterior');

    btnAnterior.off('click');
    if(currentPage === 1){
      btnAnterior.prop('disabled',true);
    } else {
      btnAnterior.prop('disabled',false);
      btnAnterior.on('click', function(event) {
        event.preventDefault();
        if (!ajaxRequestInProgress) { // Verificar si no hay una solicitud AJAX en curso
          ajaxRequestInProgress = true; // Marcar que la solicitud AJAX está en curso
          currentPage--;
          
          funcion();
        }
      });
    }

    for (let i = 1; i <= totalPages; i++) {
      const link = $('<a>').attr('href', '#').text(i);
      if (i === currentPage) {
        link.addClass('active');
      }
      // Utilizar un cierre para mantener el valor de 'i' en el manejador de eventos
      (function(page) {
        link.on('click', function(event) {
          event.preventDefault();
          currentPage = page;
          funcion();
        });
      })(i);
      
      $('.numeros-paginacion').append(link);
    }
    const btnSiguiente = $('#btnSiguiente');
    btnSiguiente.off();
    if(currentPage === totalPages){
      btnSiguiente.prop('disabled',true);
      btnSiguiente
    }else{
      btnSiguiente.prop('disabled',false);
      btnSiguiente.on('click', function(event) {
        event.preventDefault();
        if (!ajaxRequestInProgress) { // Verificar si no hay una solicitud AJAX en curso
          ajaxRequestInProgress = true; // Marcar que la solicitud AJAX está en curso
          currentPage++;
          funcion();
        }
      });
    }
  }


  // SECCION IMPORTANTE DEL CODIGO
  // aqui traemos todos los jugadores y hacemos la logica con ello 
  getJugadores();

  function getJugadores(){
    $.ajax({
      type: 'GET',
      url: `/get-jugadores?page=${currentPage}`,
      success: function(response){
      
        $('.tabla-jugadores .row-data').remove();
        // vamos a controlar la barra de busqueda
        $('#jugadorBuscar').on('input',()=>{
          const textoBusqueda = $('#jugadorBuscar').val().toLowerCase();
        })

        cargarRowData(response);

        $.ajax({
          type: 'GET',
          url: '/get-total-jugadores',
          success: function(totalJugadores) {
            const totalPages = Math.ceil(totalJugadores / limit);
            generarPaginacion(totalPages,getJugadores);
            ajaxRequestInProgress = false;
          },
          error: function(xhr, status, error) {
            console.error('Error al obtener el número total de jugadores:', error);
          }
        });
      }
    })
  }




  $('.search-bar-container').hide();
  // logica de lupa abrir el search bar
  $('#lupa-search-bar').on('click',function(){
    $('.search-bar-container').show();
    $('.search-bar-container').addClass('show');
    
    $(this).hide();

    $('.search-bar-xmark').on('click',function(){
      $('#lupa-search-bar').show();
      $('.search-bar-container').removeClass('show');
      $('.search-bar-container').hide();
    })
  })


  // SECCION IMPORTANTE DEL CODIGO
  // aqui manejamos el filtrado por el searchBar

  $('#jugadorBuscar').on('input',function(){
    const termino = $(this).val();
    
    if(termino){
      buscarJugadores();
    }else{
      getJugadores();
    }
    
    function buscarJugadores(){
      $.ajax({
        type: 'GET',
        url: `/buscar-jugadores?page=${currentPage}`,
        data: { termino },
        success: function(response){
          console.log(response);
          $('.tabla-jugadores .row-data').remove();
          cargarRowData(response.results);
          
          const totalPages = Math.ceil(response.totalResults / limit);
          generarPaginacion(totalPages,buscarJugadores);
          ajaxRequestInProgress = false;
  
        },error: function(error) {
          console.error('Error al obtener jugador:', error);
        }
      });
    }
    
  })


  // SECCION IMPORTANTE DEL CODIGO 
  // AQUI SE MANEJARAN LOS FILTROS DE LA TABLA
  $('.filter-list-div').hide();
  const filtroIcon = $('#filtrarTablaJugadores');

  filtroIcon.on('click',()=>{
    $('.filter-list-div').toggle();
  })

  // filtrar por estado de salud
  filtrarTabla('#filtroSalud','.secundary-filter-list-salud');
  // filtrar por rango de edad
  filtrarTabla('#filtroEdad','.secundary-filter-list-edad');
  // filtrar por posicion
  filtrarTabla('#filtroPosicion','.secundary-filter-list');

  // filtrar tabla por equipo

  // buscar los equipos disponibles
  $.ajax({
    type:'GET',
    url:'/get/equipo',
    dataType:'json',
    success: function(response){

      console.log(response.results);


      response.results.forEach(function(equipo) {
     
        const opcion = $('<div>').addClass('filter-field-secundary').attr('data-opcion', equipo.id);

        const nombreEquipo = opcion.attr('data-nombre',equipo.nombre);

        const opcionP = $('<p>').text(equipo.nombre);
        


        opcion.append(opcionP);
        $('#opcionContainer').append(opcion);
        filtrar();

        // reponsive
        if($('#selectEquipo').length >0){
          const opcion = $('<option>').attr('value', equipo.id).text(equipo.nombre);
          $('#selectEquipo').append(opcion);
        
        }
        
      });
    }
  })

filtrarTabla('#filtroEquipo', '.secundary-filter-list-equipo');


  // manejar filtros de fecha 
filtrarTabla('#filtroFecha', '.secundary-filter-list-fecha');

fechaFiltro()
function fechaFiltro(){
  $.ajax({
    type:'GET',
    url:'/fechas',
    success: function(response){
   
      response.years.forEach(function(anio) {
        const opcion = $('<div>').addClass('filter-field-secundary').attr('data-opcion', anio);

        const opcionP = $('<p>').text(anio);
        
        opcion.append(opcionP);
        $('#opcionContainerFecha').append(opcion);
        filtrar();

        if($('#selectFechaCreacion').length >0){
          const opcion = $('<option>').attr('value', anio).text(anio);
          $('#selectFechaCreacion').append(opcion);
        }

      });
    }
  })
}

//manejar rango de edad
function rangoEdad(){
  $.ajax({
    type:'GET',
    url:'/rango/edad',
    success: function(response){
    
      const edadMinima = response.minEdad;
      const edadMaxima = response.maxEdad;
      
      const intervalos =[];
      for (let i = edadMinima; i <= edadMaxima; i += 2) {
        const rango = `${i} - ${i + 2}`; // Cada intervalo de 2 años
        intervalos.push(rango);
      }
      
      const opcionContainer = $('#opcionContainerEdad');
      intervalos.forEach(function(intervalo) {
        const opcion = $('<div>').addClass('filter-field-secundary').attr('data-opcion', intervalo);
        const opcionP = $('<p>').text(intervalo);
        opcion.append(opcionP);
        opcionContainer.append(opcion);

        if($('#selectEdadFiltro').length >0){
          const opcionResponsive = $('<option>').attr('value',intervalo).text(intervalo);
          $('#selectEdadFiltro').append(opcionResponsive);
        }
        

    });

    filtrar();

    }
  })
}

rangoEdad();
// esta funcion realiza los filtros en la tabla
  function filtrarTabla(filtro, opciones){
    $(`${filtro}`).on('mouseover',function(){
      $(`${opciones}`).css('display','grid');
    })

    $(`${filtro}`).on('mouseout',function(event){
      if (!$(event.relatedTarget).closest(`${opciones}`).length) {
        $(`${opciones}`).css('display', 'none');
      }
    })
  }

  
  // escucha a que opcion se hizo click
  filtrar();
  function filtrar(){
    let params = {};

    $('.filter-field-secundary').off('click').on('click', function() {
      
      // se recupera la data de donde se hizo click 
      const opcion = $(this).data('opcion');
      const filtro = $(this).closest('.filter-field').data('filtro');
      

      // se crea un objeto filtro con valor de la opcion seleccionada
      params[filtro] = opcion;
      
      // se muestra el contenedor de filtros 
      $('.etiqueta-filtro-div').show();
      $('.filter-list-div').hide();

      // se crea una etiqueta con el filtro 
      const nuevaEtiqueta = $('<div>').addClass('etiquetaFiltro');
      const nombreEtiqueta = $('<p>');

    // 293
      const nombreEquipo = $(this).data('nombre');

      // se agrega el nombre a la etiqueta
      if(nombreEquipo){
        nombreEtiqueta.text(nombreEquipo);
      }else{
        nombreEtiqueta.text(opcion);
      }
    
      // se crea icono para eliminar filtro mediante etiqueta
      const iconoEliminarFiltro = $('<i>').addClass('fa-solid fa-xmark eliminarFiltroIcon');

      // VERIFICA SI HAY UNA ETIQUETA EXSISTENTE Y LA REEMPLAZA
      const etiquetaExistente = $('.etiquetaFiltro').filter(function() {
        console.log($(this).data('filtro'))
        return $(this).data('filtro') === filtro;
      });


      if (etiquetaExistente.length > 0) {
        etiquetaExistente.replaceWith(nuevaEtiqueta);
        nuevaEtiqueta.data('filtro', filtro);
        nuevaEtiqueta.append(nombreEtiqueta, iconoEliminarFiltro);
        $('.inner-etiquetas-div').append(nuevaEtiqueta);
      } else {
          // Si no hay una etiqueta con el mismo filtro, agregar la nueva etiqueta
          nuevaEtiqueta.data('filtro', filtro);
          nuevaEtiqueta.append(nombreEtiqueta, iconoEliminarFiltro);
          $('.inner-etiquetas-div').append(nuevaEtiqueta);
      }

      // Elimina un filtro
      iconoEliminarFiltro.on('click',function(){
        const filtroAEliminar = nuevaEtiqueta.data('filtro');

        delete params[filtroAEliminar];

        nuevaEtiqueta.remove();
        // si no hay etiquetas que vuelva al inicio
        if ($('.etiquetaFiltro').length === 0) {
          $('.etiqueta-filtro-div').hide();
          getJugadores();
      }
      });

      // Llamar a una función para manejar la actualización de params
      $('.filtrar-button').on('click',()=>{
        manejarActualizacionParams(params);
      });


    });

  }

  function manejarActualizacionParams(params) {
    // Colocar aquí cualquier acción adicional que necesites realizar
      $.ajax({
        type:'GET',
        url:`/jugadores-filtrados?page=${currentPage}`,
        data: params,
        success: function(response){
          $('.tabla-jugadores .row-data').remove();

          if(response.length === 0){
            const fila = $('<tr>').addClass('row-data');
            fila.text('no hay datos');
            $('.tabla-jugadores').append(fila);
          }

          cargarRowData(response.result);

          const totalPages = Math.ceil(response.totalResults / limit);
          generarPaginacion(totalPages,manejarActualizacionParams);
          ajaxRequestInProgress = false;

        }
      })      
         
}





// formato para agregar data al row y usar sus funciones editar y eso
  function cargarRowData(response){

    $('.tabla-jugadores .row-data').empty();

    $.each(response,function(index,elemento){
      const fila = $('<tr>').addClass('row-data');

      const toolDiv = $('<div>');
      toolDiv.addClass('tool-div');

      const configurarJugadorIcon = $('<i>');
      configurarJugadorIcon.addClass('fa-solid fa-gear');
      configurarJugadorIcon.data('id-jugador',elemento.id);


      const eliminarJugadorIcon = $('<i>');
      eliminarJugadorIcon.addClass('fa-solid fa-trash');
      eliminarJugadorIcon.data('id-jugador',elemento.id);


      configurarJugadorIcon.on('click',function(){
        const idJugador = $(this).data('id-jugador');
        console.log('mando',idJugador);
        editarJugador(idJugador,response);
      });
      toolDiv.append(configurarJugadorIcon,eliminarJugadorIcon)

      const propiedadesMostradas = ['Nombre', 'cedula', 'telefono','edad','posicion','numero_jugador','estado_salud','fecha_creacion','nombre_division'];

      for (const key in elemento) {
        if (Object.hasOwnProperty.call(elemento, key)) {
          if (propiedadesMostradas.includes(key)) {
            // Si está en la lista, crear elementos dt y dd
            
            if(key === "estado_cuenta" && elemento[key] === 1){
              const td = $('<td>').text('Paz y salvo');
              // Agregar los elementos al contenedor donde deseas mostrarlos
              fila.append(td);
            }else if(key === "estado_cuenta" && elemento[key] === 0){
              const td = $('<td>').text('Moroso');
              // Agregar los elementos al contenedor donde deseas mostrarlos
              fila.append(td);
            }

            if(key !=="estado_cuenta"){
              const td = $('<td>').text(elemento[key]);
              // Agregar los elementos al contenedor donde deseas mostrarlos
              fila.append(td);
            }
            fila.append(toolDiv);
            $('.tabla-jugadores').append(fila);
          }
        }
      }
    })
  }



  // esta funcion edita un jugador
  function editarJugador(idJugador,response){
    $('#Nombre').val('');
    $('#cedula').val('');
    $('#posicion').val('');
    $('#estado_salud').val('');
    $('#telefono').val('');
    $('#edad').val('');
    $('#numero_jugador').val('');
    let ValidarNumeroJugador = true;

    $('.modal').css('display','block');
    // cerrar modal
    $('.modal-x-mark').on('click',()=>{
      $('.modal').css('display','none');
    })

    // jugador a editar
    const jugador = response.find(j => j.id === idJugador);


    const numeroJugadorOriginal =  jugador.numero_jugador;


    // ponemos valores de cada jugador
    $('#Nombre').val(jugador.Nombre);
    $('#cedula').val(jugador.cedula);
    $('#posicion').val(jugador.posicion);
    $('#estado_salud').val(jugador.estado_salud);
    $('#telefono').val(jugador.telefono);
    $('#edad').val(jugador.edad);
    $('#numero_jugador').val(jugador.numero_jugador);


    

    console.log('Segun este es mi jugador: ',jugador);
    console.log('El id jugador con su numero de jugador es: ',jugador.numero_jugador);

    const nombreDivision = jugador.id_equipo;
    const estadoSalud = jugador.estado_salud;
    const posicionJugador = jugador.posicion;

    

    $('#id_equipo option').each(function() {
        const valorOpcion = $(this).val();
        if (valorOpcion.includes(nombreDivision)) { 
            $(this).prop('selected', true); 
        }
    });


    $('#estado_salud option').each(function() {
        const textoOpcion = $(this).text(); // Obtener el texto de la opción actual
        
        if (textoOpcion.includes(estadoSalud)) { // Comprobar si el texto de la opción incluye el valor de estadoSalud
            $(this).prop('selected', true); // Establecer la opción actual como seleccionada
        }
    });

    $('#posicion option').each(function() {
        const textoOpcion = $(this).text(); // Obtener el texto de la opción actual
        
        if (textoOpcion.includes(posicionJugador)) { // Comprobar si el texto de la opción incluye el valor de estadoSalud
            $(this).prop('selected', true); // Establecer la opción actual como seleccionada
        }
    });


    $('#numero_jugador').on('input',()=>{
      const numeroJugador = parseInt($('#numero_jugador').val());
      const equipo = $('#id_equipo').val();
      

      if(numeroJugador === ''){
        $('#mensajeDisponible').text('');
        $('#mensajeDisponible').hide();
      }

      $.ajax({
        type: 'GET',
        url: '/numero-jugador-disponible',
        data: { numero_jugador: numeroJugador , id_equipo: equipo },

          success: function(response){

            labelNumeroJugador = $('#numeroJugadorLabel').text();
            
            if(numeroJugador !== '' ){
              if(response.existe){
                ValidarNumeroJugador = true;
                $('#numeroJugadorLabel').text('Número de jugador').css('color', ''); // Restablece el color a su valor predeterminado
                $('#numero_jugador').css({
                    'color': '', // Restablece el color a su valor predeterminado
                    'border-color': '', // Restablece el color del borde a su valor predeterminado
                    'outline': '' // Restablece el contorno a su valor predeterminado
                });
              }else{
                  if(numeroJugadorOriginal !== numeroJugador){
                    $('#numeroJugadorLabel').text('Número no disponible').css('color', 'red');
                    $('#numero_jugador').css({
                        'color': 'red',
                        'border-color': 'red',
                        'outline': 'none'
                    });
                    ValidarNumeroJugador = false;
                  }
                
              }
            }else{
              $('#numeroJugadorLabel').text('Número de jugador').css('color', ''); // Restablece el color a su valor predeterminado
              $('#numero_jugador').css({
                  'color': '', // Restablece el color a su valor predeterminado
                  'border-color': '', // Restablece el color del borde a su valor predeterminado
                  'outline': '' // Restablece el contorno a su valor predeterminado
              });
            }
          },  
          error: function(xhr, status, error) {
            console.error('Error al verificar número de jugador:', error);
            $('#mensajeNumeroJugador').text('Ha ocurrido un error, por favor intenta nuevamente');
          }
      })
      })


      $('#enviarFormEditar').off('click').on('click',()=>{
        if(ValidarNumeroJugador === true){
         
          console.log('Voy a editar el id de jugador',jugador.id);
          enviarFormEditar(jugador.id);
        }else{
          alert('Elija un número de jugador disponible');
        }
        
      })
  }

  function enviarFormEditar(jugadorId){
    $('#formularioEdicion').off('submit').on('submit',function(event){
      event.preventDefault();
    
      // obtener datos del form
      const nombre = $('#Nombre').val();
      const cedula = $('#cedula').val();
      const posicion = $('#posicion').val();
      const estadoSalud =$('#estado_salud').val();
      const telefono = $('#telefono').val();
      const edad = $('#edad').val();
      const numeroJugador = $('#numero_jugador').val();
      const equipo = $('#id_equipo').val();

      const cambios = {
        Nombre : nombre,
        cedula: cedula,
        telefono: telefono,
        posicion : posicion,
        numero_jugador : numeroJugador,
        estado_salud : estadoSalud,
        edad: edad,
        id_equipo : equipo
      }
    
      // Enviar una solicitud AJAX al servidor para actualizar el jugador
      $.ajax({
        type: 'PUT', // O POST según corresponda
        url: '/editar/jugador/' + jugadorId, // URL del punto final de actualización del jugador en el servidor
        data: cambios,
        success: function(response) {
            // Manejar la respuesta del servidor (opcional)
            console.log('Jugador actualizado con éxito:', response);
            // Cerrar el modal de edición u otra acción necesaria
            $('.modal').hide();
            getJugadores();
        },
        error: function(xhr, status, error) {
            // Manejar errores de la solicitud (opcional)
            console.error('Error al actualizar jugador:', error);
        }
    });

    })
  }


  function responsive(){

    $('#filtrarTablaJugadores').on('click', function(){
      abrirModalFiltro();
      $('.filter-list-div').hide();
    })
    

    $('#addfiltroResponsive').hide();

    $('#lupa-search-bar').hide();
    $('.search-bar-container').show();
  
    $('.search-bar-xmark').hide();
    
    
  }


  if(window.innerWidth < 768){
    responsive();
  }

  function abrirModalFiltro(){
    $('.modal-filtro').css('display', 'block');
    $('.modal-body').addClass('filter');
    $('.modal-content').addClass('filter');

    $('.filtro').hide();
  }


  filtroResponsive();
  function filtroResponsive(){

    let params = {};
    
    // Mostrar el campo de filtro correspondiente al cambiar el valor de #filtrosSelect
    $('#filtrosSelect').change(function() {
        const selectedOption = $(this).val();
        let opcion;

        // conseguir nombre de filtro y valor 
        const filtro = $('#' + selectedOption).find('label').attr('for');
        console.log(filtro);

        $('#' + selectedOption + ' select[name]').on('change', function(){
          opcion = $(this).val(); 
          console.log(opcion);
        }); 
        
        $('#addfiltroResponsive').on('click',()=>{
            // se crea una etiqueta con el filtro 
            const nuevaEtiqueta = $('<div>').addClass('etiquetaFiltro');
            const nombreEtiqueta = $('<p>');

            // filtro equipo para etiqueta
            const nombreEquipo = $('#' + selectedOption + ' select[name]').find('option:selected').text();
           
            params[filtro] = opcion;
            console.log(params);
            // se agrega el nombre a la etiqueta
            nombreEtiqueta.text(nombreEquipo);

            // se crea icono para eliminar filtro mediante etiqueta
            const iconoEliminarFiltro = $('<i>').addClass('fa-solid fa-xmark eliminarFiltroIcon');

            // VERIFICA SI HAY UNA ETIQUETA EXSISTENTE Y LA REEMPLAZA
            const etiquetaExistente = $('.etiquetaFiltro').filter(function() {
              return $(this).text() === filtro;
            });

            if (etiquetaExistente.length > 0) {
              etiquetaExistente.replaceWith(nuevaEtiqueta);
              
              nuevaEtiqueta.data('filtro', filtro);
              nuevaEtiqueta.append(nombreEtiqueta, iconoEliminarFiltro);
              $('.inner-etiquetas-div').append(nuevaEtiqueta);
            } else {
                // Si no hay una etiqueta con el mismo filtro, agregar la nueva etiqueta
                console.log(filtro);
                nuevaEtiqueta.data('filtro', filtro);
                nuevaEtiqueta.append(nombreEtiqueta, iconoEliminarFiltro);
                $('.inner-etiquetas-div').append(nuevaEtiqueta);
            }

            // Elimina un filtro
            iconoEliminarFiltro.on('click',function(){
              const filtroAEliminar = nuevaEtiqueta.data('filtro');
              delete params[filtroAEliminar];

              nuevaEtiqueta.remove();
              // si no hay etiquetas que vuelva al inicio
              if ($('.etiquetaFiltro').length === 0) {
                $('.etiqueta-filtro-div').hide();
                getJugadores();
              }
            });

  
          $('.etiqueta-filtro-div').show();
          $('.modal-filtro').css('display', 'none');
        });
          
       
        $('.filtrar-button').off('click').on('click',()=>{
          console.log(params)
          manejarActualizacionParams(params);
        });

        //esconder boton
        $('#addfiltroResponsive').hide();
        // Ocultar todos los select excepto #filtrosSelect
        $('.filtro').hide();
        
        $('#' + selectedOption).show();

        $('#' + selectedOption).on('change',function(){
          $('#addfiltroResponsive').show(); 
        })

    });

  }

 })


 