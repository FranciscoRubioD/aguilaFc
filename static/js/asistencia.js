
$(document).ready(function() {

  let functionRepeater = 0;
  
  let ajaxRequestInProgress = false; // Bandera para evitar solicitudes AJAX duplicadas
  let currentPage = 1;

  // Obtener el token del almacenamiento local o donde lo tengas guardado
  const token = localStorage.getItem('token'); // O el lugar donde guardas el token

  // funcion modal de fechas
  let estadoInicio = '';
  let estadoFinal = '';

  // mostrar asistencias 
   // select asistencia checkmark

   window.generarPaginacionAsist = function (evento,totalPages,funcion){

    $('.numeros-paginacion-asist').empty();

    const btnAnterior = $('#btnAnteriorAsist');
    btnAnterior.off('click');

     // Configuración del botón anterior
    if (currentPage === 1) {
      btnAnterior.prop('disabled', true);
    } else {
      btnAnterior.prop('disabled', false);
      btnAnterior.on('click', function (event) {
        event.preventDefault();
        if (!ajaxRequestInProgress) {
          ajaxRequestInProgress = true;
          currentPage--;
          funcion(evento, currentPage); // Llamar a la función para cargar resultados
        }
      });
    }


    // Configuración del botón siguiente
    const btnSiguiente = $('#btnSiguienteAsist');
    btnSiguiente.off('click');
    if (currentPage === totalPages) {
      btnSiguiente.prop('disabled', true);
    } else {
      btnSiguiente.prop('disabled', false);
      btnSiguiente.on('click', function (event) {
        event.preventDefault();
        if (!ajaxRequestInProgress) {
          ajaxRequestInProgress = true;
          currentPage++;
          funcion(evento,currentPage); // Llamar a la función para cargar resultados
        }
      });
    }

    // Configuración de los botones de números de página
    for (let i = 1; i <= totalPages; i++) {
      const link = $('<a>').attr('href', '#').text(i);
      if (i === currentPage) {
        link.addClass('active');
      }
      (function (page) {
        link.on('click', function (event) {
          event.preventDefault();
          if (currentPage !== page) {
            currentPage = page;
            console.log(currentPage);
            funcion(evento,currentPage); // Llamar a la función para cargar resultados
          }
        });
      })(i);
      $('.numeros-paginacion-asist').append(link);
    }

  }


   window.modalAsistencia =  function (evento,page){

    $.ajax({
      type: 'GET',
      url: '/jugador/evento/asistencia',
      data: {
        evento: evento,
        page: page, // Puedes ajustar esto según sea necesario
        limit: 7 // Ajusta el límite aquí
      },
      dataType: 'json',
      success: function(response) {
        const bodytable = $('.datos-asistencia-modal');
        const table = $('.table-asist-modal');
        const btnTabla = $('#updateList');
        
        bodytable.empty(); // Limpiar la tabla antes de añadir nuevos datos
        table.removeClass('visible');
        $('.enviar-asist-div').removeClass('visible');
        

        console.log(`total pages: ${response.totalPages}`);
        console.log(`total players: ${response.totalPlayers}`);
      

        // Generar la paginación
        generarPaginacionAsist(evento,response.totalPages,modalAsistencia);

        // Verificar si hay resultados
        if (response.players.length === 0) {
          table.hide();
          btnTabla.hide();
          eventExistList(evento); // Función que se debe definir para manejar la falta de datos
        } else {
          table.show();
          $('.table-asist-new').hide();
          $('#newList').hide();
          btnTabla.show();
          
          // Iterar sobre los datos obtenidos y construir filas para cada jugador
          $.each(response.players, function(index, jugador) {
            const fila = $('<tr>').attr('data-jugador-id', jugador.id);
    
            // Columna para el nombre del jugador
            const columnaNombre = $('<td>').text(jugador.Nombre);
            fila.append(columnaNombre);

            
            // columna cedula
            const columnaCedula = $('<td>').text(jugador.cedula);
            fila.append(columnaCedula);
    
            ['presente', 'ausente', 'tardanza', 'justificado'].forEach(function(estado) {
              const columnaEstado = $('<td>');
              const label = $('<label>').addClass('custom-checkbox');
              const input = $('<input>').attr({
                type: 'checkbox',
                name: `${estado}_${jugador.id}`, // Usar un nombre único
                id: estado + jugador.id // Usar algún identificador único para cada checkbox
              });
    
              input.addClass(estado);
              const span = $('<span>').addClass('checkmark');
              label.append(input, span);
              columnaEstado.append(label);
              fila.append(columnaEstado);

              input.change(function() {
                // Obtener la fila (tr) padre del checkbox actual
                var fila = $(this).closest('tr');
              
                
                // Desmarcar todos los checkboxes dentro de la misma fila
                fila.find('input[type="checkbox"]').not(this).prop('checked', false);
        
                var estado = $(this).attr('id').replace(/\d+$/, ''); // Elimina cualquier número al final del id
                
                console.log('Estado seleccionado:', estado);
              });

              // marcar todos presentes
              marcarTodosCheckBox($('.presente-all'),'.datos-asistencia-modal',`${estado}_${jugador.id}`);

            });
    
            // Columna para el textarea de observaciones
            const columnaObservaciones = $('<td>');
            const textarea = $('<textarea>').attr('id', 'observaciones' + jugador.id);
            columnaObservaciones.append(textarea);
            fila.append(columnaObservaciones);

            
            // Agregar la fila al cuerpo de la tabla
            bodytable.append(fila);
    
            // Trae estado de cada jugador
            $.ajax({
              type: 'GET',
              url: '/estado/asistencia',
              data: {
                id_jugador: jugador.id,
                evento: evento
              },
              success: function(response) {
                const estadoJugador = response.estado;
                const descripcionJugador = response.descripcion;
                const nombreCheckbox = `${estadoJugador}_${jugador.id}`;
                
                
    
                // Buscar la fila correspondiente al jugador
                const filaJugador = bodytable.find(`tr[data-jugador-id='${jugador.id}']`);
                
                // Marcar el checkbox en la fila correspondiente al jugador
                filaJugador.find(`input[name='${nombreCheckbox}']`).prop('checked', true);
    
                // Insertar la descripción en el textarea correspondiente
                filaJugador.find(`#observaciones${jugador.id}`).val(descripcionJugador);

               // enviar asistencias
               
                const botonEnviar = $('.enviar-asist-btn');

                botonEnviar.off('click').on('click', function(){
                  const asistencias = [];
                  let allSelected = true;

                  $('.datos-asistencia-modal tr').each(function() {
                    const fila = $(this);
                    // Obtener el id del jugador desde el atributo data-jugador-id
                    const jugadorId = fila.data('jugador-id');
                    
                    // Verificar todos los checkboxes de estado en esta fila
                    let estadoSeleccionado = null;
                    fila.find('input[type="checkbox"]:checked').each(function() {
                      const checkboxId = $(this).attr('id');
                      if (checkboxId) {
                        estadoSeleccionado = checkboxId.replace(/\d+$/, ''); // Extraer el estado
                      }
                    });
                
                    const observaciones = fila.find('textarea').val();
                
                    if (estadoSeleccionado) {
                      asistencias.push({
                        id_jugador: jugadorId,
                        id_evento: evento,
                        estado: estadoSeleccionado,
                        observaciones: observaciones,
                      });
                    } else {
                      allSelected = false; // Si hay al menos un jugador sin estado seleccionado
                    }

                  });
                

                  if (!allSelected) {
                    alert('Por favor, selecciona un estado para todos los jugadores.');
                    return; // Salir si no todos los jugadores tienen un estado
                  }

                  console.log(`estas son las modificaciones, ${asistencias}`);


                  $.ajax({
                    type: 'PUT',
                    url: '/modificar/asistencia',
                    contentType: 'application/json', // Indicar que enviamos JSON
                    data: JSON.stringify(asistencias), // Convertir el arreglo a JSON
                    success:function(response){
                      
                      console.log('Respuesta del servidor:', response);

                      alert('Asistencia guardad con éxito');
                      // $('.modal-asistencia').hide();
                      btnTabla.show();
                    },
                    error: function(xhr, status, error) {
                      console.error('Error al guardar la asistencia:', error);
                      alert('Hubo un error al guardar la asistencia. Por favor, inténtalo de nuevo.');
                      // Habilitar nuevamente el botón en caso de error
                      $('#enviarAsistBtn').prop('disabled', false);
                    }
                  })


                });



              },
              error: function(xhr, status, error) {
                console.error('Error al obtener el estado del jugador:', error);
              }
            });
          });
        }
      },
      error: function(xhr, status, error) {
        console.error('Error al obtener la asistencia de los jugadores:', error);
      }
    });
  }

  function toggleModalAsistencia(){

    const seccion1Info = $('.asistencia-setting');
    const seccion2Tabla  = $('.asistenciaEvento');
    const seccion3Tabla = $('.evento-Info');

    // setea visibilidad inicial
    seccion1Info.show();
    seccion2Tabla.hide();
    seccion3Tabla.hide();
    
    
    const toggleBtn1 = $('#toggleBtn1'); 
    const toggleBtn2 = $('#toggleBtn2');
    const toggleBtn3  = $('#toggleBtn3');

    toggleBtn1.addClass('optSelected');
    toggleBtn2.removeClass('optSelected');
    toggleBtn3.removeClass('optSelected');


    toggleBtn1.on('click',function(){
      seccion1Info.fadeIn(200);
      seccion2Tabla.fadeOut(200);
      seccion3Tabla.fadeOut(200);
 

      toggleBtn1.addClass('optSelected');
      toggleBtn2.removeClass('optSelected');
      toggleBtn3.removeClass('optSelected');
    });

    toggleBtn2.on('click',function(){
      seccion1Info.fadeOut(200);
      seccion2Tabla.fadeIn(200);
      seccion3Tabla.fadeOut(200);

      toggleBtn2.addClass('optSelected');
      toggleBtn1.removeClass('optSelected');
      toggleBtn3.removeClass('optSelected');
    });

    toggleBtn3.on('click',function(){
      seccion1Info.fadeOut(200);
      seccion2Tabla.fadeOut(200);
      seccion3Tabla.fadeIn(200);

      toggleBtn2.removeClass('optSelected');
      toggleBtn1.removeClass('optSelected');
      toggleBtn3.addClass('optSelected');
    });

    

  }





  // calendario 
  const calendar = $('#calendar');


  poblarCalendario();


  function poblarCalendario(){

    if (!token) {
        console.log("No hay token, no se puede acceder a los eventos");
        return;
    }

    $.ajax({
      type: 'GET',
      url: '/eventos',
      headers: {
        'Authorization': `Bearer ${token}` // Enviar el token en el encabezado
      },
      dataType: 'json',
      success: function(response) {
        
        // Aquí puedes manejar la respuesta y actualizar la interfaz de usuario
        // Por ejemplo, mostrar los eventos en una lista o tabla en tu página HTML
        
         // Limpia los eventos existentes en el calendario
        calendar.fullCalendar('removeEvents');

        // Define colores para los tipos de eventos
        const colores = {
          'Entrenamiento': '#ff4800',   // Color para entrenamiento
          'Partido': '#6faad1',          // Color para partido
          'Reunion': '#b442ed'           // Color para reunión
        };

        // Define colores adicionales para los resultados del partido
        const coloresResultado = {
          'W': '#4CAF50',  // Ganado (verde)
          'L': '#F44336',  // Perdido (rojo)
          'D': '#FFC107'   // Empate (amarillo)
        };


        // Itera sobre la respuesta y añade cada evento al calendario
        response.forEach(evento => {

          // Toma la fecha y la hora del evento y combina en formato ISO
          const fechaISO = evento.fecha.split('T')[0]; // Obtiene solo la parte de la fecha
          const fechaHoraISO = `${fechaISO}T${evento.hora}`;

          const fechaISOFinal = evento.fecha.split('T')[0];
          const fechaHoraISOFinal = `${fechaISOFinal}T${evento.hora_final}`;
          
          // Asigna un color basado en el tipo de evento
          let color;
          
          // si esta terminado y estado
          if (evento.estado === 'Terminado') {
            const resultado = evento.resultado; // Suponiendo que 'resultado' es 'W', 'L' o 'D'
            color = coloresResultado[resultado] || color; // Asigna color según resultado
          
          } else if(evento.estado === "Pendiente"){
            color = colores[evento.evento] || 'gray'; // Color por defecto si no coincide
          }



         let tituloEvento;

        // Verifica si el evento es entrenamiento o no
        if (evento.evento.toLowerCase() === 'entrenamiento') {
          tituloEvento = 'Entrenamiento'; // Título para entrenamiento
        }else if(evento.evento.toLowerCase() === "reunion"){
          tituloEvento = "Reunión";
        } 
        else {
          tituloEvento = `${evento.evento} vs ${evento.equipo_rival}`; // Título para otros eventos
        }

  
          $('#calendar').fullCalendar('renderEvent', {
            id: evento.id,
            idEquipo : evento.id_equipo,
            ubicacion: evento.ubicacion,
            title: tituloEvento ,
            start: fechaHoraISO,
            end: fechaHoraISOFinal,
            description: evento.descripcion,
            color: color // Asigna el color al evento
          }, true); // stick? = true
        });
      },
      error: function(xhr, status, error) {
        console.error('Error al obtener eventos:', error);
        // Aquí maneja el error según tus necesidades, por ejemplo, mostrar un mensaje de error al usuario
        alert('Hubo un error al obtener los eventos. Por favor, inténtalo de nuevo.');
      }
    });
  }

  calendar.fullCalendar({
    // Opciones de configuración del calendario
    header: {
      left: 'prev,next today',
      center: 'title',
      right: 'month,agendaWeek,agendaDay'
    },
    height:650,
    defaultDate: '2024-11-02', // Fecha de inicio
    navLinks: true, // Puede hacer clic en los días/semana para navegar
    // editable: true, // Hacer eventos editables
    eventLimit: true, // Permitir "más" link cuando hay demasiados eventos
    events: [],
    eventRender: function(event, element) {

      element.find('.fc-time').remove();

      element.popover({
        title: event.title,
        content: `
        <p>Ubicación: ${event.ubicacion || 'No disponible'}</p>
        <p>Hora de Inicio: ${event.start ? event.start.format('HH:mm') : 'No disponible'}</p>
         <p>Hora de Finalización: ${event.end ? event.end.format('HH:mm') : 'No disponible'}</p>
        <p>Descripción: ${event.description || 'No disponible'}</p>
        `,
        trigger: 'hover',
        placement: 'top',
        container: 'body',
        html: true  // Permite contenido HTML en el popover
      });
    },
    eventClick: function(event){

      console.log(event.id);
      const modalAsistenciaSection = $('.modal-asistencia').show();
      modalAsistencia(event.id);
      eventoInfo(event.id);
      modalInfo(event.id);
      toggleModalAsistencia();

      $('#closeAsistModal').on('click', function(){
        $('.modal-asistencia').hide();
      });

    } 
  });

  // const modalAsistenciaSection = $('.modal-asistencia').show();
  // // modalInfo(1);
  // eventoInfo(26);
  // modalAsistencia(26);

  function flushInfo(){

    // seccion info 
    $('#ubicacionInfo').text('');
    $('#horaShow').text('');
    $('#fechaShow').text('');

    // tabla
    $('.datos-asistencia-modal').empty();
    $('.datos-asistencia-new').empty();


  }

  // toggle tool bar events. 
 
  let marcarTodos = true;
  // loading lotie
  
  const rutaLoadingLottie = '/lottie/lottie.json';
  const contendorLottieLoading = $('#loadingAnimation');
  
  const animation = lottie.loadAnimation({
    container: contendorLottieLoading[0],
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: rutaLoadingLottie // Ruta al archivo JSON de tu animación Lottie
  });


  // seleccionar datos para enviar a la asistencia
    // $.ajax({
    //   type:'GET',
    //   url:'/get/equipo',
    //   headers: {
    //     'Authorization': `Bearer ${token}` // Enviar el token en el encabezado
    //   },
    //   dataType:'json',
    //   success: function(response){


    //     // eventos asistencia
        
    //     // equipo 
    //     const selectEquipo = $('#equipoAsistencia');
    //     selectEquipo.empty();
        
    //     const opcionEquipo = $('<option>').attr('value', '').text('Selecciona equipo');
    //     selectEquipo.append(opcionEquipo);

    //     // entrenador
    //     const entrenadorEquipo = $('#entrenador');
    //     entrenadorEquipo.empty();

    //     const opcionEntrenador = $('<option>').attr('value','').text('Selecciona Entrenador');
    //     entrenadorEquipo.append(opcionEntrenador);

        
        
    //     // Iterar sobre los equipos y agregar opciones al select
    //     response.results.forEach(function(equipo) {
    //       const opcionEquipo = $('<option>').attr('value', equipo.id).text(equipo.nombre);
    //       selectEquipo.append(opcionEquipo);

    //       const opcionEntrenador = $('<option>').attr('value', equipo.entrenador).text(equipo.entrenador);
    //       entrenadorEquipo.append(opcionEntrenador);

    //     })

    //     NiceSelect.bind(document.getElementById("equipoAsistencia"), {
    //     });

    //     NiceSelect.bind(document.getElementById("entrenador"), {
    //     });


       
        
    //   }
    // })



    const crearEventoBtn = $('#crearEvento');

    crearEventoBtn.on('click',function(){
      eventoFetch();
    });
    
    // recopilar informacion
    function eventoFetch(){
  
      // Re-obtén los valores para garantizar que estén actualizados
      const equipo = $('#equipoAsistencia').val();
      const evento = $('#eventoAsistencia').val();
      const estado = $('#estadoAsistencia').val();
      const fecha = $('#fechaEvento').val();
      const hora = $('#horaEvento').val();
      const horaFinalizacion = $('#horaEventoFinal').val();
      const descripcion = $('#descEvento').val();
      const ubicacion = $('#ubicacion').val();
        

      // ENVIAR DATOS DE ASISTENCIA
      if(!equipo || !fecha || !evento || !hora || !horaFinalizacion || !ubicacion){
        alert('Completa todos los campos');
      }
      else{
        $.ajax({
          type: 'POST',
          url: '/asistencia/guardar',
          contentType: 'application/json',
          data: JSON.stringify({ 
            eventos: {
              evento: evento,
              equipoId: equipo,
              fecha:fecha,
              hora:hora,
              horaFinalizacion: horaFinalizacion,
              descripcion:descripcion,
              ubicacion: ubicacion
            }
          
          }),
          success: function(response){
            console.log(response);
            alert('Evento guardado con éxito');
            

            $('#equipoAsistencia').val('');
            $('#eventoAsistencia').val('');
            $('#estadoAsistencia').val('');
            $('#fechaEvento').val('');
            $('#horaEvento').val('');
            $('#horaEventoFinal').val('');
            $('#descEvento').val('');
            $('#ubicacion').val('');
            
          },
          error: function(xhr, status, error) {
            console.error('Error al guardar el evento:', error);
            alert('Hubo un error al guardar el evento. Por favor, inténtalo de nuevo.');
           
          }
        })
      }
      
    }
    
  function eventoInfo(evento){
    $.ajax({
      type:'GET',
      url:'/get/evento',
      data: {
        evento: evento
      },
      dataType: 'json',
      success:function(response){
        console.log(response);

        functionRepeater++;

        console.log(functionRepeater);

        $('#toggleBtn3').off('click').on('click', function() {
          if(response.evento === "Partido") {
            // Acción para partidos
            // Aquí podrías agregar cualquier acción que deba ocurrir cuando el evento es un partido
            toggleModalAsistencia();
          } else {
            // Muestra el mensaje solo para eventos que no son partidos
            $('#mensaje').text("Solo disponible para partidos").fadeIn().delay(1000).fadeOut();
          }
        });

        // si evento es entrenamiento o partido
        if(response.evento === "Partido"){
          $('.inf-partido-info').show();
          $('.partido-inner').show();
          $('.partido-score').show();
          $('.evento-info').show();
          $('.inf-asist-inner').removeClass('noPartido');
        }else{
          $('.inf-partido-info').hide();
          $('.partido-score').hide();
          $('.inf-asist-inner').addClass('noPartido');
        }

        $('#abrirNotas').off('click').on('click',()=>{
          showNotes(evento);
        });

        const ubicacion = $('#ubicacionInfo');
        const fecha = $('#fechaShow');
        const hora = $('#horaShow');
        const equipoRival = $('#rival-show');
      
        

        // si el evento esta cancelado no muestres 
        if(response.estado === "Cancelado") {
          $('#estadoPartido').show();
          $('#estadoPartido').text(response.estado);
          $('#estadoPartido').removeClass('suspendido terminado').addClass('cancelado');
        } else if(response.estado === "Suspendido") {
          $('#estadoPartido').show();
          $('#estadoPartido').text(response.estado);
          $('#estadoPartido').removeClass('cancelado terminado').addClass('suspendido');
        } else if(response.estado === "Terminado") {
          $('#estadoPartido').show();
          $('#estadoPartido').text(response.estado);
          $('#estadoPartido').removeClass('cancelado suspendido').addClass('terminado');
        } else{
          $('#estadoPartido').hide();
          
        }
        

        equipoRival.text('');
        ubicacion.text('');
        fecha.text('');
        hora.text('');

        if(response.ubicacion){
          ubicacion.text(response.ubicacion);
        }else{
          ubicacion.text('Ninguno');  
        }
        
        // formato fecha

        // Establecer el idioma a español
        moment.locale('es');

        // Fecha en formato ISO
        const fechaISO = response.fecha;

        // Convertir la fecha
        const fechaFormateada = moment(fechaISO).format('dddd, MMMM D, YYYY');

        // Imprimir el resultado
        console.log(fechaFormateada); // Viernes, Julio 19, 2024

        //asigna fecha
        fecha.text(fechaFormateada);


        // asignar equipo rival
        if(response.equipo_rival){
          equipoRival.text(response.equipo_rival);
        }else{
          equipoRival.text('No asignado');
        }


        // asignar datos partidos
        $('#scoreTeam').text(response.gol_local);
        $('#scoreRival').text(response.gol_visita);

        if(response.estado === "Terminado"){
            
          if(response.resultado === "W"){
            $('#scoreEstado').text('Victoria').addClass('terminado');
          }else if(response.resultado === "L"){
            $('#scoreEstado').removeClass('terminado');
            $('#scoreEstado').text('Derrota').addClass('cancelado');
          }else if(response.resultado === "D"){
            $('#scoreEstado').text('Empate');
          }
        }else{
          $('#scoreEstado').text('Pendiente');
        }
        
        
        // formato hora
        const horaInicio = response.hora;
        const horaFinal = response.hora_final;
        
        // Convertir las horas al formato deseado
        const horaInicioFormateada = moment(horaInicio, "HH:mm:ss").format('h:mm A');
        const horaFinalFormateada = moment(horaFinal, "HH:mm:ss").format('h:mm A');

        // Formatear el rango de horas
        const rangoHoras = `${horaInicioFormateada} - ${horaFinalFormateada}`;

        // Imprimir el resultado
        console.log(rangoHoras); // 3:00 PM - 9:00 PM

        // asignar hora
        hora.text(rangoHoras);

        // extraer hora
        const horaInicioMoment = moment(horaInicio, "HH:mm:ss");
        const horaFinalMoment = moment(horaFinal, "HH:mm:ss");

        const horaEnviar = horaInicioMoment.format('h');
        const minutoEnviar = horaInicioMoment.format('mm');
        const periodoEnviar = horaInicioMoment.format('A');

        const horaFinalEnviar = horaFinalMoment.format('h'); 
        const minutoFinalEnviar = horaFinalMoment.format('mm'); // Solo los minutos
        const periodoFinalEnviar = horaFinalMoment.format('A'); // AM o PM


        // extraer fecha
        const fechaMoment = moment(fechaISO);

        // Extraer los componentes de día, mes y año
        const dia = fechaMoment.date(); // Obtiene el día del mes (1-31)
        const mes = fechaMoment.month() + 1; // Obtiene el nombre completo del mes
        const anio = fechaMoment.year(); // Obtiene el año

        
        // op cambiar configuracion partido
        $('.btn-configurar-partido').off('click').on('click',function(){
         
          $('.modal-change-date').show();
          $('.changedate-content').hide();
          $('.configurar-content').show();
          $('.change-content').hide();

          configPartido(response.id,response.gol_local,response.gol_visita);
          
        });

        // ganador
        // Limpiar y agregar opción de equipo rival en el select de ganador sin duplicarlo
        $('#mySelectGanador').append(new Option(response.equipo_rival, 'L'));

        if(functionRepeater === 1){
          NiceSelect.bind(document.getElementById("mySelectGanador"));

        }
        

        // op cambiar hora y date
        $('.btn-cambiar-hora').on('click',function(){
          $('.modal-change-date').show();
          $('.changedate-content').show();
          $('.change  -content').hide();

          changeDate(response.id,dia,mes,anio,horaEnviar,minutoEnviar,periodoEnviar,horaFinalEnviar,minutoFinalEnviar,periodoFinalEnviar);
        });
        
        // op cambiar locaiton
        $('#btn-cambiar-ubicacion').on('click',function(){
          $('.modal-change-date').show();
          $('.changelocation-content').show();
          $('.changedate-content').hide();

          changeLocation(response.id,response.ubicacion);
        }); 
        

        }
    });

  }


  $('#amBtn').on('click', function() {
    $('#amBtn').addClass('active-btn-hr').prop('disabled', true);
    $('#pmBtn').removeClass('active-btn-hr').prop('disabled', false);
    estadoInicio = 'AM';
  });

  $('#pmBtn').on('click', function() {
      $('#pmBtn').addClass('active-btn-hr').prop('disabled', true);
      $('#amBtn').removeClass('active-btn-hr').prop('disabled', false);
      estadoInicio = 'PM';
  });

  $('#amBtnFinal').on('click', function() {
      $('#amBtnFinal').addClass('active-btn-hr').prop('disabled', true);
      $('#pmBtnFinal').removeClass('active-btn-hr').prop('disabled', false);
      estadoFinal = 'AM';
  });

  $('#pmBtnFinal').on('click', function() {
      $('#pmBtnFinal').addClass('active-btn-hr').prop('disabled', true);
      $('#amBtnFinal').removeClass('active-btn-hr').prop('disabled', false);
      estadoFinal = 'PM';
  });



  // funcion configurar partido resoluciones y eso
  function configPartido(id,golFavor,golContra){

    // goles
    $('#golFavorSend').val(golFavor);
    $('#golContraSend').val(golContra);

    // cancelar
    $('#cancelarConfig').on('click',function(){
      $('.modal-change-date').hide();
      $('.configurar-content').hide();
    });


    // accion
    $('#enviarResolucionPartido').off('click').on('click',function(){

      const resolucion = $('#mySelectConfig').val();
      const ganador = $('#mySelectGanador').val();
      const golFavor =  $('#golFavorSend').val();
      const golContra = $('#golContraSend').val();

      
      const data = {
        idEvento:id,
        resolucion: resolucion,
        ganador: ganador,
        golFavor: golFavor,
        golContra: golContra
      }      

      $.ajax({
        type: 'POST',
        url: '/evento/configurar',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function (response) {
          alert('Evento configurado correctamente');
          eventoInfo(id);
          poblarCalendario();
          $('.modal-change-date').hide();
          $('.configurar-content').hide();
        },
        error: function (xhr, status, error) {
          console.error('Error al guardar la configuración del evento:', error);
          alert('Hubo un error al configurar el evento.');
        }
      });

    });



  }

  // cambiar fecha de evento
  function changeDate(id, dia, mes, anio, horaDefault, minutoDefault, periodoDefault, horaFinalDefault, minuteFinalDefault, periodoFinalDefault) {

    function addLeadingZero(value) {
        return value.length === 1 ? '0' + value : value;
    }

    dia = addLeadingZero(dia);
    mes = addLeadingZero(mes);
    horaDefault = addLeadingZero(horaDefault);
    minutoDefault = addLeadingZero(minutoDefault);
    horaFinalDefault = addLeadingZero(horaFinalDefault);
    minuteFinalDefault = addLeadingZero(minuteFinalDefault);

    // Limpia los campos
    $('#day').val('');
    $('#month').val('');
    $('#year').val('');
    $('#hour').val('');
    $('#minute').val('');
    $('#hourFinal').val('');
    $('#minuteFinal').val('');

    $('.closeGlobal').off('click').on('click',function(){
      $('.changedate-content').hide();
      $('.modal-change-date').hide();
    });

    // Maneja el periodo de inicio
    estadoInicio = periodoDefault;
    estadoFinal = periodoFinalDefault;

    if (periodoDefault === "PM") {
        $('#pmBtn').trigger("click");
    } else {
        $('#amBtn').trigger("click");
    }

    if (periodoFinalDefault === "PM") {
        $('#pmBtnFinal').trigger("click");
    } else {
        $('#amBtnFinal').trigger("click");
    }

    // Establece los valores en los campos de entrada
    $('#day').val(dia);
    $('#month').val(mes);
    $('#year').val(anio);
    $('#hour').val(horaDefault);
    $('#minute').val(minutoDefault);
    $('#hourFinal').val(horaFinalDefault);
    $('#minuteFinal').val(minuteFinalDefault);

    // Manejo del botón para cambiar la fecha
    $('.changedate-select button:first').off('click').on('click', function() {
        // Extraer y validar los valores de los campos de fecha
        let day = $('#day').val();
        let month = $('#month').val();
        let year = $('#year').val();

        // Validación del año para que tenga al menos 4 dígitos
        if (year.length !== 4) {
            alert('Por favor, introduce un año válido de 4 dígitos.');
            return;
        }

        // Validación de que los días y meses sean válidos
        if (parseInt(day) < 1 || parseInt(day) > 31) {
            alert('Por favor, introduce un día válido (1-31).');
            return;
        }
        if (parseInt(month) < 1 || parseInt(month) > 12) {
            alert('Por favor, introduce un mes válido (1-12).');
            return;
        }

        // Asegurar que el día y el mes tengan dos dígitos
        day = addLeadingZero(day);
        month = addLeadingZero(month);

        // Validar y formatear la hora de inicio
        let hourStart = $('#hour').val();
        let minuteStart = $('#minute').val();

        // Validar que las horas estén entre 1 y 12
        if (parseInt(hourStart) < 1 || parseInt(hourStart) > 12) {
            alert('Por favor, introduce una hora válida (1-12).');
            return;
        }
        // Validar que los minutos estén entre 0 y 59
        if (parseInt(minuteStart) < 0 || parseInt(minuteStart) > 59) {
            alert('Por favor, introduce minutos válidos (0-59).');
            return;
        }

        hourStart = addLeadingZero(hourStart);
        minuteStart = addLeadingZero(minuteStart);

        // Validar y formatear la hora final
        let hourEnd = $('#hourFinal').val();
        let minuteEnd = $('#minuteFinal').val();

        // Validar que las horas estén entre 1 y 12
        if (parseInt(hourEnd) < 1 || parseInt(hourEnd) > 12) {
            alert('Por favor, introduce una hora final válida (1-12).');
            return;
        }
        // Validar que los minutos estén entre 0 y 59
        if (parseInt(minuteEnd) < 0 || parseInt(minuteEnd) > 59) {
            alert('Por favor, introduce minutos finales válidos (0-59).');
            return;
        }

        hourEnd = addLeadingZero(hourEnd);
        minuteEnd = addLeadingZero(minuteEnd);

        // Crear un objeto con los datos extraídos
        const data = {
            id_evento: id,
            dia: day,
            mes: month,
            anio: year,
            hora_inicio: hourStart,
            minuto_inicio: minuteStart,
            periodo_inicio: estadoInicio,
            hora_final: hourEnd,
            minuto_final: minuteEnd,
            periodo_final: estadoFinal
        };

        // Verificar que todos los campos del objeto data tengan valores
        for (const key in data) {
            if (!data[key]) {
                alert(`Por favor, completa el campo: ${key}`);
                return; // Detener el envío si algún campo está vacío
            }
        }

        // Enviar los datos al backend mediante AJAX
        $.ajax({
            type: 'PUT',
            url: '/modificar/fecha/evento',  // Ajusta esta URL según tu ruta en el backend
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                eventoInfo(id);
                poblarCalendario();
                $('.modal-change-date').hide();
                $('.changedate-content').hide();
            },
            error: function(xhr, status, error) {
                console.error('Error al modificar la fecha y horas:', error);
                alert('Hubo un error al modificar la fecha y horas.');
            }
        });
    });
}

function changeLocation(id,location){
  
  // limpiar
  $('#ubicacionChange').val('');
  $('#ubicacionChange').val(location);

  $('.closeGlobal').off('click').on('click',function(){
    $('.modal-change-date').hide();
    $('.changelocation-content').hide();
  });
  
    
  if( $('#ubicacionChange').val() === ""){
    $('#ubicacionChange'.val('Sin definir'));
  }

  $('#updateUbicacion').off('click').on('click', function() {

    const locationChange = $('#ubicacionChange').val();

    const data = {
      id : id,
      lugar : locationChange
    }

    $.ajax({
      type:'PUT',
      url: '/modificar/lugar/evento',
      contentType: 'application/json',
      data: JSON.stringify(data),
      success: function(response){
        eventoInfo(id);
        poblarCalendario();
        $('.modal-change-date').hide();
        $('.changelocation-content').hide();
      },
      error: function(xhr, status, error) {
          console.error('Error al modificar la ubicacion:', error);
          alert('Hubo un error al modificar la ubicacion');
      }
  
    })
  })
  

}
  
  // crear lista de asistencia en evento existente
  window.eventExistList = function (evento,page){
    // 
    $.ajax({
      type:'GET',
      url:'/get/evento',
      data: {
        evento: evento
      },
      dataType: 'json',
      success:function(response){
        // estado
        const estado = 'todos';
        const equipo = response.id_equipo;

        $.ajax({
          type:'GET',
          url:'/get/jugador/asistencia',
          data: {
            equipo: equipo, // Valor del equipo
            estado: estado,     // Valor del estado sano/lesionado/todos
            evento:evento,
            page:page
          },
          dataType: 'json',
          success: function(response){
         
            // paginacion
            generarPaginacionAsist(evento,response.totalPages,eventExistList);


             // tabla 
            const newTable = $('.table-asist-new');
            newTable.show();

            const bodyTable = $('.datos-asistencia-new');

            const btnTabla = $('.update-list');
            btnTabla.show();

            // vaciar tabla
            bodyTable.empty();

            // poblar tabla 

            // si no hay registros
            if (!response || response.length === 0) {
              const noDataRow = $('<tr>').append(
                $('<td>').attr('colspan', '6').text('No se encontraron jugadores.')
              );
              bodyTable.append(noDataRow);
            }

            // ya tenemos los jugadores ahora poblamos la tabla
            $.each(response.jugadores, function(index, jugador) {

              // se crea un row 
              const fila = $('<tr>');
         
              // Columna para el nombre del jugador
              const columnaNombre = $('<td>').text(jugador.Nombre);
              fila.append(columnaNombre);


              // manejamos checkbox
              ['presente', 'ausente', 'tardanza', 'justificado'].forEach(function(estado) {
                const columnaEstado = $('<td>');
                const label = $('<label>').addClass('custom-checkbox');
                const input = $('<input>').attr({
                  type: 'checkbox',
                  name: 'estado', // Usar un nombre único,
                  id: estado + jugador.id // Usar algún identificador único para cada checkbox
                });

                input.addClass(estado);
                const span = $('<span>').addClass('checkmark');
                label.append(input, span);
                columnaEstado.append(label);
                fila.append(columnaEstado);


                input.change(function() {
                  // Obtener la fila (tr) padre del checkbox actual
                  var fila = $(this).closest('tr');
                
                  
                  // Desmarcar todos los checkboxes dentro de la misma fila
                  fila.find('input[type="checkbox"]').not(this).prop('checked', false);
          
                  var estado = $(this).attr('id').replace(/\d+$/, ''); // Elimina cualquier número al final del id
                  
                  console.log('Estado seleccionado:', estado);
                });
  
                // marcar todos presentes
                marcarTodosCheckBox($('.presente-all'),'.datos-asistencia-new','estado');


              });
               // ward2
              // Columna para el textarea de observaciones
             const columnaObservaciones = $('<td>');
             const textarea = $('<textarea>').attr('id', 'observaciones' + jugador.id);
             columnaObservaciones.append(textarea);
             fila.append(columnaObservaciones);
            
             // Agregar la fila al cuerpo de la tabla
             bodyTable.append(fila);

            });

            // enviar informacion 
            const botonEnviar = $('.enviar-asist-btn');


            botonEnviar.on('click', function(){
                 
                // Deshabilitar el botón antes de enviar la solicitud
                botonEnviar.prop('disabled', true).text('Enviando...')
                const asistencias = [];
                let allSelected = true;

              $('.datos-asistencia-new tr').each(function(){
                const fila = $(this);
                const inputChecked = fila.find('input[name="estado"]:checked');
                const jugadorIdAttr = inputChecked.attr('id');
            
                if (jugadorIdAttr) {
                  const jugadorId = jugadorIdAttr.match(/\d+/)[0];
                  const estadoSeleccionado = jugadorIdAttr.replace(/\d+$/, '');
                  const observaciones = fila.find('textarea').val();
            
                  asistencias.push({
                    jugadorId: jugadorId,
                    estado: estadoSeleccionado,
                    observaciones: observaciones,
                  });
                }else{
                  allSelected = false;
                }
            
              });

              console.log(asistencias);

              $.ajax({
                type: 'POST',
                url: '/evento/existente/guardar',
                contentType: 'application/json',
                data: JSON.stringify({ 
                  asistencias: asistencias,
                  evento: evento
                }),
                success:function(response){
                  alert('Asistencia guardad con éxito');
                  newTable.hide();
                  $('.modal-asistencia').hide();
                  botonEnviar.prop('disabled', false).text('Enviar');
                },
                error: function(xhr, status, error) {
                  console.error('Error al guardar la asistencia:', error);
                  alert('Hubo un error al guardar la asistencia. Por favor, inténtalo de nuevo.');
                  // Habilitar nuevamente el botón en caso de error
                  $('.enviar-asist-btn').prop('disabled', false);
                  botonEnviar.prop('disabled', false).text('Enviar');  
                }
              })

            });
          }
        });

      }
    })
  }
  


  // select actualizar informacion
  function modalInfo(evento){
    
    $.ajax({
      type:'GET',
      url:'/get/evento',
      data: {
        evento: evento
      },
      dataType: 'json',
      success:function(response){
        
        $('#golEquipo').val('');
        $('#Rival').val('');
        $('#golRival').val('');

        // asignar gol equipo
        $('#golEquipo').val(response.gol_local);

        // asignar nombre de rival
        $('#Rival').val(response.equipo_rival);

        // asignar goles rival
        $('#golRival').val(response.gol_visita);

        // Remover cualquier evento click previo asignado al botón #btnPartidoUpdate
        $('#btnPartidoUpdate').off('click');


        $('#btnPartidoUpdate').on('click',()=>{

          const nombre_rival =  $('#Rival').val();
          const golEquipo = $('#golEquipo').val();
          const golRival  = $('#golRival').val();

          const data = {
            id:evento,
            nombre_rival: nombre_rival,
            golEquipo: golEquipo,
            golRival: golRival
          }

          $.ajax({
            type:'PUT',
            url: '/modificar/partido',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response){
              alert('Partido actualizado');
              eventoInfo(evento);
            },
            error: function(xhr, status, error) {
                console.error('Error al actualizar partido:', error);
                alert('Hubo un error al actualizar el partido');
            }
        
          })

          

        });

      }

    })


    $('.gol-equipo').on('input', function(){
      let input = $(this).val();

      // Remover cualquier carácter que no sea un número
      input = input.replace(/[^0-9]/g, '');

      // Limitar a dos caracteres
      if (input.length > 2) {
        input = input.slice(0, 2);
      }

      // Actualizar el valor del input
      $(this).val(input);

    })


  }

  // notas
  function showNotes(evento){

    $.ajax({
      type: 'GET',
      url: '/eventos/info',
      data: { id_evento: evento },
      dataType: 'json',
      success: function(response) {
        $('.modal-notas-eventos').show();
        const noteContainer = $('.contenedorNotas');
        noteContainer.empty(); // Limpiar el contenedor antes de agregar las notas
        
        if(response.length === 0){
          noteContainer.text('No hay notas');
          $('#mensaje').text("Aún no hay notas").fadeIn().delay(1000).fadeOut();
        }

        $('.cerrarNotas').off('click').on('click',function(){
          noteContainer.empty(); // Limpiar el contenedor antes de agregar las notas
          $('.modal-notas-eventos').hide();
          $('#notaCrear').val('');
          $('.crear-nota-div').hide();
          $('.right-note').hide();
        });

        // Iterar sobre cada nota y crear el contenido en el front end
        response.forEach(nota => {
          
          const notaDiv = $('<div>').addClass('noteEvento');
          const innerNota = $('<div>').addClass('inner-note');

          const headerNota = $('<p>').addClass('fechaNota');
          const fechaNota = $('<span>').addClass('notaFecha').text(formatFecha(nota.fecha_publicacion,'numeric'));

          const creadorNota = $('<span>').addClass('creador-nota').text(nota.nombre_usuario);

          headerNota.append(fechaNota,creadorNota);

          const notaContenedor = $('<div>').addClass('noteDiv');
          const notaContent = $('<p>').addClass('notaContent').text(nota.notas);

          notaContenedor.append(notaContent);

          notaDiv.append(innerNota);
          innerNota.append(headerNota,notaContenedor);

          noteContainer.append(notaDiv);


          // lado izquierdo
          notaDiv.on('click',()=>{

            $('.right-note').show();
            $('.crear-nota-div').hide();

            $('#creadorNota').text('');
            $('#fechaNotaLong').text(formatFecha(''));
            $('#contentNote').text('');

            $('#creadorNota').text(nota.nombre_usuario);
            $('#fechaNotaLong').text(formatFecha(nota.fecha_publicacion,'long'));
            $('#contentNote').text(nota.notas);


            $('.right-note').hide();
            $('.right-note').fadeIn(800);
          });

          // formato fecha
          function formatFecha(fechaISO,formatMonth) {
            const fecha = new Date(fechaISO);
          
            const opciones = { day: 'numeric', month: `${formatMonth}`, year: 'numeric' };
            // Convierte la fecha a formato "29 de octubre de 2024"
            return fecha.toLocaleDateString('es-ES', opciones);
          }

        });
        
        function adjustOpacityOnScroll() {
          const containerOffset = $('.contenedorNotas').offset().top;
          const containerHeight = $('.contenedorNotas').height();
        
          $('.noteEvento').each(function() {
            const elementOffset = $(this).offset().top - containerOffset;
            const opacity = Math.max(0.3, 1 - (elementOffset / (containerHeight * 1.5))); // Adjusted for a gentler fade
            $(this).css('opacity', opacity); // Ensure opacity doesn't go below 0.6
          });
        }
        
        // Initial adjustment
        adjustOpacityOnScroll();
        
        // Adjust opacity on scroll within contenedorNotas
        $('.contenedorNotas').on('scroll', function() {
          adjustOpacityOnScroll();
        });


      },
      error: function(xhr, status, error) {
        console.error('Error al obtener las notas:', error);
      }
    });

    // agregar nota
    $('#addNote').off('click').on('click',function(){

      $('#creadorNota').text('');
      $('#fechaNotaLong').text('');
      $('#contentNote').text('');
      $('#notaCrear').val('');
    
      $('.right-note').hide();
      $('.crear-nota-div').fadeIn(800);

      $('#enviarNota').prop('disabled', true);

    }); 


    $('#notaCrear').on('input', function() {
      // Check if the textarea is empty
      if ($(this).val().trim() === '') {
          $('#enviarNota').prop('disabled', true); // Disable the button if empty
      } else {
          $('#enviarNota').prop('disabled', false); // Enable the button if not empty
      }
    });


    $('#enviarNota').off('click').on('click',function(){

      const id_evento = evento;
      const notas = $('#notaCrear').val();
      const id_usuario = 74;

      const enviarBtn = $('#enviarNota');
      enviarBtn.prop('disabled',true);


      $.ajax({
        type: 'POST',
        url: '/eventos/info',
        contentType: 'application/json',
        data: JSON.stringify({
            id_evento: id_evento,
            notas: notas,
            id_usuario: id_usuario
        }),
        success: function(response) {
            console.log(response.message); // Handle success
            showNotes(evento);
            $('#notaCrear').val('');
            // Optionally refresh the notes display or show a success message
        },
        error: function(xhr) {
            console.error(xhr.responseJSON.message); // Handle error
            // Optionally show an error message to the user
        },
        complete: function() {
            // Re-enable the button after the AJAX call completes
            $('#enviarNota').prop('disabled', true);
        }
      });

    });
  
  }

  // mostrar asistencia
//   function determinarAMPM(horaMilitar) {
//     const hora = parseInt(horaMilitar.split(':')[0]);
//     const minutos = horaMilitar.split(':')[1];
    
//     if (hora === 0 || hora === 24) {
//         return `12:${minutos} AM`; // 00:00 y 24:00 se consideran 12:00 AM
//     } else if (hora === 12) {
//         return `12:${minutos} PM`; // 12:00 es 12:00 PM
//     } else if (hora < 12) {
//         return `${hora}:${minutos} AM`; // Horas de 1 a 11 son AM
//     } else {
//         return `${hora - 12}:${minutos} PM`; // Horas de 13 a 23 son PM
//     }
// } 

//   // formatear fecha
//   function formatDate(fecha) {
//     const dia = fecha.getDate().toString().padStart(2, '0');
//     const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
//     const anio = fecha.getFullYear();
//     return `${dia}/${mes}/${anio}`;
//   }

})

// funcion que selecciona presente a todos
window.marcarTodosCheckBox = function (obj, tableBody,nombreInput){
  let marcarTodos = true;

  // console.log('se marco')
  
  obj.click(function(){
    if (marcarTodos) {
      $(`${tableBody} tr`).each(function() {
        const fila = $(this);

        // Desmarcar todos los checkboxes en la fila
        fila.find(`input[name=${nombreInput}]`).prop('checked', false);

        // Marcar el checkbox de "presente"
        fila.find(`input[name=${nombreInput}].presente`).prop('checked', true);
      });

      $(this).text('Desmarcar Todos');
  
    } else {
      $(`${tableBody} tr`).each(function() {
        const fila = $(this);
        
        // Desmarcar todos los checkboxes en la fila
        fila.find(`input[name=${nombreInput}]`).prop('checked', false);
      });

      $(this).text('Marcar Todos como Presente');
    }

    marcarTodos = !marcarTodos;
  });
}


window.obtenerProximoPartido = function (id_equipo) {
  $('#proximoPartidoInfo').text('');
  $('#proximoPartidoEquipo').text('');
  $('#messageNoGames').hide();
  $('.gameInfo').hide();
  
  setTimeout(() => {
    $.ajax({
      url: `/proximo-partido/${id_equipo}`, // Ruta al backend
      method: 'GET',
      success: function(data) {
          $('.gameInfo').fadeIn();
          
          // Extrae los datos y ajusta el formato
          const tipoPartido = data.tipo_partido; // Ejemplo: "Amistoso"
          const fecha = data.fecha; // Solo la fecha (ej. "2024-11-16")
          const hora = data.hora; // Solo la hora (ej. "22:30")

          // Combina la fecha y la hora en un solo valor
          const fechaHoraPartido = formatFechaHora(fecha, hora);

           // Muestra la información en el DOM en el formato solicitado
           $('#proximoPartidoInfo').text(`${tipoPartido} | ${fechaHoraPartido}`);
          
          $('#proximoPartidoEquipo').text(data.equipo_rival); // Ejemplo de cómo mostrar el rival
      
      },
      error: function(xhr) {
          // Muestra un mensaje de error si no hay partido próximo
          if (xhr.status === 404) {
              $('.gameInfo').hide();
              $('#messageNoGames').text("No hay partidos pendientes próximos").fadeIn();
          } else {
              console.error("Error al obtener el próximo partido:", xhr.responseText);
              $('#proximoPartidoContenedor').text("Error al cargar el próximo partido").fadeIn();
          }
      }
  });


  },200);

  
}



// Función para formatear fecha y hora
function formatFechaHora(fechaUTC, hora) {
  // Convierte la fecha UTC a un objeto Date
  const fechaObj = new Date(fechaUTC); 

  // Verifica si la fecha es inválida
  if (isNaN(fechaObj)) {
    console.error("Fecha inválida:", fechaUTC);
    return "Fecha o hora inválida";
  }

  // Descompón la hora recibida en hora y minutos
  const [hours, minutes] = hora.split(':'); // Asumiendo que hora es un string "HH:mm"

  // Actualiza el objeto Date con la hora recibida (añadiendo la hora y minutos)
  fechaObj.setHours(hours);
  fechaObj.setMinutes(minutes);

  // Configuración para el formato de fecha y hora
  const opcionesFecha = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
  const opcionesHora = { hour: 'numeric', minute: '2-digit', hour12: true };

  // Formatea la fecha y hora en el formato adecuado
  return `${fechaObj.toLocaleDateString('es-ES', opcionesFecha)}, ${fechaObj.toLocaleTimeString('es-ES', opcionesHora)}`;
}


function actualizarEstadisticas(g, e, p) {
  // Convierte los valores a números
  g = parseInt(g, 10);  // Utiliza parseInt para convertir a enteros
  e = parseInt(e, 10);  // Si necesitas decimales, usa parseFloat en lugar de parseInt
  p = parseInt(p, 10);

  const total = g + e + p;  // Total de partidos

  const porcentajeGanadas = Math.max((g / total) * 100);
  const porcentajeEmpates = Math.max((e / total) * 100);
  const porcentajePerdidas = Math.max((p / total) * 100);

  // Asigna los anchos de cada segmento basado en los porcentajes
  document.getElementById('ganadas').style.width = porcentajeGanadas + '%';
  document.getElementById('empates').style.width = porcentajeEmpates + '%';
  document.getElementById('perdidas').style.width = porcentajePerdidas + '%';

  // Actualiza las etiquetas de texto
  document.getElementById('textoGanadas').innerText = `Ganadas: ${g}`;
  document.getElementById('textoEmpates').innerText = `Empates: ${e}`;
  document.getElementById('textoPerdidas').innerText = `Perdidas: ${p}`;
}


// Llama a la función con los valores de ejemplo

window.obtenerResultados = function (id_equipo){
  $('#pjAmount').empty();
  $.ajax({
      url: '/obtener-estadisticas', // Cambia esto por la ruta de tu backend
      type: 'POST',
      data: { id_equipo: id_equipo },
      success: function(response) {
          // 'response' debería contener los resultados de la consulta SQL 
          actualizarEstadisticas(response.victorias,response.empates, response.derrotas)
          $('#pjAmount').text(response.partidos_jugados);
      },
      error: function(err) {
          console.error("Error en la consulta: ", err);
      }
  });
}


$('#dashboardTeamView').on('change', function() {

  const id_equipo = $(this).val();
  obtenerResultados(id_equipo);
  obtenerProximoPartido(id_equipo);
  partidoHistorial(id_equipo);
  
  

});


// Funcion sidebar secciones
// sectionNav();




$('.nav-btn').on('click',function(){
  
    // Ocultar todas las secciones
    $('.seccion').removeClass('activo');

    // Remover la clase de todos los botones
    $('.nav-btn').removeClass('activeOpt');

    // Agregar la clase solo al botón clicado
    $(this).addClass('activeOpt');
    
    // Obtener la sección a mostrar
    const seccion = $(this).data('seccion');
    
    // Mostrar la sección correspondiente
    $('#' + seccion).addClass('activo');

     // Si es la sección del calendario, actualiza su tamaño
     if (seccion === 'eventos') {
      const calendar = $('#calendar').fullCalendar('getCalendar'); // Reemplazar según versión
      calendar.render(); // Para FullCalendar v5+
    }
  
});



$('#goToCalendar').on('click', function() {
  // Oculta todas las secciones y remueve la clase activo
  $('.seccion').removeClass('activo');
  
  // Muestra la sección del calendario (eventos)
  $('#eventos').addClass('activo');
  
  // Actualiza el estado del botón en el menú de navegación
  $('.nav-btn').removeClass('activeOpt');
  $('.nav-btn[data-seccion="eventos"]').addClass('activeOpt');
  
  // Asegúrate de renderizar correctamente el calendario si es necesario
  const calendar = $('#calendar').fullCalendar('getCalendar'); // Cambiar según tu versión
  calendar.render();
});




// función side bar evento sub seccion
subSection();
function subSection() {
  const optionAsistencia = $('#asistenciaOpt');
  const divAbrir = $('.eventos-options');
  let timeoutId; // Variable para manejar el temporizador

  // Abrir div
  optionAsistencia.on('mouseover', function () {
    clearTimeout(timeoutId); // Cancelar cualquier temporizador de cierre
    divAbrir.show(); // Mostrar inmediatamente
  });

  optionAsistencia.on('mouseout', function () {
    timeoutId = setTimeout(function () {
      divAbrir.hide(); // Ocultar después del retraso
    }, 300); // Retraso de 300ms (puedes ajustarlo)
  });

  // Mantener div abierto
  divAbrir.on('mouseover', function () {
    clearTimeout(timeoutId); // Cancelar el temporizador al pasar el mouse por el div
    divAbrir.show(); // Asegurarse de que el div esté visible
  });

  divAbrir.on('mouseout', function () {
    timeoutId = setTimeout(function () {
      divAbrir.hide(); // Ocultar después del retraso
    }, 300); // Retraso de 300ms
  });

  // Abrir calendario
  const btnCalendario = $('#calendar-opt');
  const btnCrearEvento = $('#crearEvento-opt');
  const btnCrearPartido = $('#crearPartido-opt');

  // Secciones dentro de asistencia
  const sectionCalendario = $('.calendar-div');
  const sectionCrearEvento = $('.inner-asistencia');

  // Sección aparte
  const sectionCrearPartido = $('#partidoEvento');

  // Para abrir calendario hay que cerrar otras
  btnCalendario.on('click', function () {
    sectionCalendario.show();
    sectionCrearEvento.hide();
    sectionCrearPartido.hide();
  });

  // Para abrir creador de evento
  btnCrearEvento.on('click', function () {
    sectionCalendario.hide();
    sectionCrearEvento.show();
    sectionCrearPartido.hide();
  });

  // Para abrir creador de partido
  btnCrearPartido.on('click', function () {
    sectionCalendario.hide();
    sectionCrearEvento.hide();
    sectionCrearPartido.show();
  });
}
