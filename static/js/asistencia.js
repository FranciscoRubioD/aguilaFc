$(document).ready(function() {


  

  // calendario 
  const calendar = $('#calendar');
  poblarCalendario();


  function poblarCalendario(){
    $.ajax({
      type: 'GET',
      url: '/eventos',
      dataType: 'json',
      success: function(response) {
        
        // Aquí puedes manejar la respuesta y actualizar la interfaz de usuario
        // Por ejemplo, mostrar los eventos en una lista o tabla en tu página HTML
        
         // Limpia los eventos existentes en el calendario
        calendar.fullCalendar('removeEvents');

        // Define colores para los tipos de eventos
        const colores = {
          'Entrenamiento': '#64bd7f',   // Color para entrenamiento
          'Partido': '#6faad1'           // Color para partido
        };


        // Itera sobre la respuesta y añade cada evento al calendario
        response.forEach(evento => {

        
          // Toma la fecha y la hora del evento y combina en formato ISO
          const fechaISO = evento.fecha.split('T')[0]; // Obtiene solo la parte de la fecha
          const fechaHoraISO = `${fechaISO}T${evento.hora}`;

          const fechaISOFinal = evento.fecha.split('T')[0];
          const fechaHoraISOFinal = `${fechaISO}T${evento.hora_final}`;
          
          // Asigna un color basado en el tipo de evento
          const color = colores[evento.evento] || 'gray'; // Color por defecto si no coincide
  
          $('#calendar').fullCalendar('renderEvent', {
            id: evento.id,
            idEquipo : evento.id_equipo,
            ubicacion: evento.ubicacion,
            title: evento.evento,
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
    defaultDate: '2024-10-02', // Fecha de inicio
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
    $.ajax({
      type:'GET',
      url:'/get/equipo',
      dataType:'json',
      success: function(response){

        // equipo 
        const selectEquipo = $('#equipoAsistencia');
        selectEquipo.empty();
        
        const opcionEquipo = $('<option>').attr('value', '').text('Selecciona equipo');
        selectEquipo.append(opcionEquipo);

        // entrenador
        const entrenadorEquipo = $('#entrenador');
        entrenadorEquipo.empty();

        const opcionEntrenador = $('<option>').attr('value','').text('Selecciona Entrenador');
        entrenadorEquipo.append(opcionEntrenador);

        
        
        // Iterar sobre los equipos y agregar opciones al select
        response.results.forEach(function(equipo) {
          const opcionEquipo = $('<option>').attr('value', equipo.id).text(equipo.nombre);
          selectEquipo.append(opcionEquipo);

          const opcionEntrenador = $('<option>').attr('value', equipo.entrenador).text(equipo.entrenador);
          entrenadorEquipo.append(opcionEntrenador);

        })

        NiceSelect.bind(document.getElementById("equipoAsistencia"), {
        });

        NiceSelect.bind(document.getElementById("entrenador"), {
        });
      }
    })



    const crearListadoButton = $('#crearListadoButton');

    crearListadoButton.on('click',function(){
      eventoFetch();
    });
    
    // recopilar informacion
    function eventoFetch(){
      const equipo = $('#equipoAsistencia').val();
      const estado = $('#estadoAsistencia').val();
  
      
      // traer jugadores con el filtro

      // Mostrar la animación de carga
      $('#loadingAnimation').show();
      animation.play();

      $.ajax({
        type:'GET',
        url:'/get/jugador/asistencia',
        data: {
          equipo: equipo, // Valor del equipo
          estado: estado     // Valor del estado
        },
        dataType: 'json',
        success: function(response){

          const bodytable = $('.datos-asistencia');
          const table = $('.table-asist');
          bodytable.empty();

          $('.asistencia-main').show(); 

          // Asegúrate de que la tabla sea invisible al principio
          table.removeClass('visible');
          $('.enviar-asist-div').removeClass('visible');

          setTimeout(function() {

            if (!response || response.length === 0) {
              const noDataRow = $('<tr>').append(
                $('<td>').attr('colspan', '6').text('No se encontraron jugadores.')
              );
              bodytable.append(noDataRow);
            }
          
          // Iterar sobre los datos obtenidos y construir filas para cada jugador
          $.each(response, function(index, jugador) {
            
            const fila = $('<tr>');
         
            // Columna para el nombre del jugador
            const columnaNombre = $('<td>').text(jugador.Nombre);
            fila.append(columnaNombre);
    
            ['presente', 'ausente', 'tardanza', 'justificado'].forEach(function(estado) {
              const columnaEstado = $('<td>');
              const label = $('<label>').addClass('custom-checkbox');
              const input = $('<input>').attr({
                type: 'checkbox',
                name: 'estado',
                id: estado + jugador.id // Usar algún identificador único para cada checkbox
              });
              input.addClass(estado);
              const span = $('<span>').addClass('checkmark');
              label.append(input, span);
              columnaEstado.append(label);
              fila.append(columnaEstado);
    
            });
    
             // Columna para el textarea de observaciones
             const columnaObservaciones = $('<td>');
             const textarea = $('<textarea>').attr('id', 'observaciones' + jugador.id);
             columnaObservaciones.append(textarea);
             fila.append(columnaObservaciones);
            
             // Agregar la fila al cuerpo de la tabla
             bodytable.append(fila);
          })
    
          // Manejar cambio en el checkbox para permitir solo uno seleccionado
          $('input[name="estado"]').change(function() {
            // Obtener la fila (tr) padre del checkbox actual
            var fila = $(this).closest('tr');
            
            // Desmarcar todos los checkboxes de estado dentro de la misma fila
            fila.find('input[name="estado"]').not(this).prop('checked', false);
    
            var estado = $(this).attr('id').replace(/\d+$/, ''); // Elimina cualquier número al final del id
            console.log('Estado seleccionado:', estado);
          });
// ward1
           // Ocultar la animación de carga
          $('#loadingAnimation').hide();
          animation.stop();
          // Hacer visible la tabla con la transición
          table.addClass('visible');
          $('.enviar-asist-div').addClass('visible');
        },1000);
        

         // Marcar todos como presente / Desmarcar todos
        $('#presenteAllBtn').click(function() {
          if (marcarTodos) {
            $('.datos-asistencia tr').each(function() {
              const fila = $(this);

              // Desmarcar todos los checkboxes en la fila
              fila.find('input[name="estado"]').prop('checked', false);

              // Marcar el checkbox de "presente"
              fila.find('input[name="estado"].presente').prop('checked', true);
            });

            $(this).text('Desmarcar Todos');
          } else {
            $('.datos-asistencia tr').each(function() {
              const fila = $(this);

              // Desmarcar todos los checkboxes en la fila
              fila.find('input[name="estado"]').prop('checked', false);
            });

            $(this).text('Marcar Todos como Presente');
          }

          marcarTodos = !marcarTodos;
        });
        
        
        $('#enviarAsistBtn').on('click',function(){

          // Deshabilitar el botón para evitar clics múltiples
          $(this).prop('disabled', true);

          const asistencias = [];
          let allSelected = true;

          // Re-obtén los valores para garantizar que estén actualizados
          const equipo = $('#equipoAsistencia').val();
          const evento = $('#eventoAsistencia').val();
          const estado = $('#estadoAsistencia').val();
          const fecha = $('#fechaEvento').val();
          const hora = $('#horaEvento').val();
          const horaFinalizacion = $('#horaEventoFinal').val();
          const descripcion = $('#descEvento').val();
          const ubicacion = $('#ubicacion').val();


          $('.datos-asistencia tr').each(function(){
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
                asistencias: asistencias,
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
                alert('Asistencia guardad con éxito');
                // actualizar interfaz de usuario
                $('.inner-asistencia').hide();
                // $('.asistencia-enviada').show();
                // Habilitar nuevamente el botón en caso de error
                $('#enviarAsistBtn').prop('disabled', false);
              },
              error: function(xhr, status, error) {
                console.error('Error al guardar la asistencia:', error);
                alert('Hubo un error al guardar la asistencia. Por favor, inténtalo de nuevo.');
                // Habilitar nuevamente el botón en caso de error
                $('#enviarAsistBtn').prop('disabled', false);
              }
            })
          }

          

        })
        

        }
      })

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

        // si evento es entrenamiento o partido
        if(response.evento === "Entrenamiento"){
          $('.partido-inner').hide();
        }else{
          $('.partido-inner').show();
        }

        const ubicacion = $('#ubicacionInfo');
        const fecha = $('#fechaShow');
        const hora = $('#horaShow');
        const equipoRival = $('#rival-show');


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


        console.log(`Hora: ${horaEnviar}`);
        console.log(`Minuto: ${minutoEnviar}`);
        console.log(`periodo: ${periodoEnviar}`);
        // sacar hora de response horas y minutos

        // extraer fecha
        const fechaMoment = moment(fechaISO);

        // Extraer los componentes de día, mes y año
        const dia = fechaMoment.date(); // Obtiene el día del mes (1-31)
        const mes = fechaMoment.month() + 1; // Obtiene el nombre completo del mes
        const anio = fechaMoment.year(); // Obtiene el año


        // op cambiar hora y date
        $('.btn-cambiar-hora').on('click',function(){
          $('.modal-change-date').show();
          $('.changedate-content').show();
          $('.change  -content').hide();

          changeDate(response.id,dia,mes,anio,horaEnviar,minutoEnviar,periodoEnviar,horaFinalEnviar,minutoFinalEnviar,periodoFinalEnviar);
        })
        
        // op cambiar locaiton
        $('#btn-cambiar-ubicacion').on('click',function(){
          $('.modal-change-date').show();
          $('.changelocation-content').show();
          $('.changedate-content').hide();

          changeLocation(response.id,response.ubicacion);
        }); 
        

        }
    })
  }

  // funcion modal de fechas
  let estadoInicio = '';
  let estadoFinal = '';

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
  function eventExistList(evento){
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
            evento:evento
          },
          dataType: 'json',
          success: function(response){
            console.log(`para nuevo evento ${response}`);

             // tabla 
            const newTable = $('.table-asist-new');
            newTable.show();

            const bodyTable = $('.datos-asistencia-new');

            const btnTabla = $('#newList');
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
            $.each(response, function(index, jugador) {

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
                  name: 'estado',
                  id: estado + jugador.id // Usar algún identificador único para cada checkbox
                });
                input.addClass(estado);
                const span = $('<span>').addClass('checkmark');
                label.append(input, span);
                columnaEstado.append(label);
                fila.append(columnaEstado);
      
              });
               // ward2
              // Columna para el textarea de observaciones
             const columnaObservaciones = $('<td>');
             const textarea = $('<textarea>').attr('id', 'observaciones' + jugador.id);
             columnaObservaciones.append(textarea);
             fila.append(columnaObservaciones);
            
             // Agregar la fila al cuerpo de la tabla
             bodyTable.append(fila);

             // Manejar cambio en el checkbox para permitir solo uno seleccionado
              $('input[name="estado"]').change(function() {
                // Obtener la fila (tr) padre del checkbox actual
                var fila = $(this).closest('tr');
                
                // Desmarcar todos los checkboxes de estado dentro de la misma fila
                fila.find('input[name="estado"]').not(this).prop('checked', false);
        
                var estado = $(this).attr('id').replace(/\d+$/, ''); // Elimina cualquier número al final del id
                console.log('Estado seleccionado:', estado);
              });

              // marcar todos presentes
              marcarTodosCheckBox($('#presenteAllBtnNew'),'.datos-asistencia-new');

            });

            // enviar informacion 
            const botonEnviar = $('#enviarNewAsist');

            botonEnviar.on('click', function(){
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

              // if (!allSelected) {
              //   alert('Por favor, asegúrate de que todos los jugadores tengan un estado de asistencia marcado.');
              //   return; // Salir de la función si falta alguna selección
              // }
              // enviar datos
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
                },
                error: function(xhr, status, error) {
                  console.error('Error al guardar la asistencia:', error);
                  alert('Hubo un error al guardar la asistencia. Por favor, inténtalo de nuevo.');
                  // Habilitar nuevamente el botón en caso de error
                  $('#enviarAsistBtn').prop('disabled', false);
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



  let ajaxRequestInProgress = false; // Bandera para evitar solicitudes AJAX duplicadas
  let currentPage = 1;

  
  function generarPaginacionAsist(evento,totalPages){

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
          modalAsistencia(evento, currentPage); // Llamar a la función para cargar resultados
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
          modalAsistencia(evento,currentPage); // Llamar a la función para cargar resultados
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
            modalAsistencia(evento,currentPage); // Llamar a la función para cargar resultados
          }
        });
      })(i);
      $('.numeros-paginacion-asist').append(link);
    }

  }


  // select asistencia checkmark
  function modalAsistencia(evento,page){

    $.ajax({
      type: 'GET',
      url: '/jugador/evento/asistencia',
      data: {
        evento: evento,
        page: page, // Puedes ajustar esto según sea necesario
        limit: 5 // Ajusta el límite aquí
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
        generarPaginacionAsist(evento,response.totalPages);


        // Verificar si hay resultados
        if (response.players.length === 0) {
          table.hide();
          btnTabla.hide();
          eventExistList(evento); // Función que se debe definir para manejar la falta de datos
        } else {
          table.show();
          $('#newList').hide();
          btnTabla.show();
          
          // Iterar sobre los datos obtenidos y construir filas para cada jugador
          $.each(response.players, function(index, jugador) {
            const fila = $('<tr>').attr('data-jugador-id', jugador.id);
    
            // Columna para el nombre del jugador
            const columnaNombre = $('<td>').text(jugador.Nombre);
            fila.append(columnaNombre);
    
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
              marcarTodosCheckBox($('#presenteAllBtnModal'),'.datos-asistencia-modal',`${estado}_${jugador.id}`);

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
               
                const botonEnviar = $('#updateAsistBtn');

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

                  $.ajax({
                    type: 'PUT',
                    url: '/modificar/asistencia',
                    contentType: 'application/json', // Indicar que enviamos JSON
                    data: JSON.stringify(asistencias), // Convertir el arreglo a JSON
                    success:function(response){
                      
                      alert('Asistencia guardad con éxito');
                      $('.modal-asistencia').hide();
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

  // mostrar asistencia
  function determinarAMPM(horaMilitar) {
    const hora = parseInt(horaMilitar.split(':')[0]);
    const minutos = horaMilitar.split(':')[1];
    
    if (hora === 0 || hora === 24) {
        return `12:${minutos} AM`; // 00:00 y 24:00 se consideran 12:00 AM
    } else if (hora === 12) {
        return `12:${minutos} PM`; // 12:00 es 12:00 PM
    } else if (hora < 12) {
        return `${hora}:${minutos} AM`; // Horas de 1 a 11 son AM
    } else {
        return `${hora - 12}:${minutos} PM`; // Horas de 13 a 23 son PM
    }
} 

  // formatear fecha
  function formatDate(fecha) {
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }

})

// funcion que selecciona presente a todos
function marcarTodosCheckBox(obj, tableBody,nombreInput){
  let marcarTodos = true;
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


//funcion side bar secciones
sectionNav();
function sectionNav(){



  // seccion
  const seccionEventos = $('#asistenciaMain');
  const seccionJugadores = $('#seccionJugadores');
  const seccionUsuarios = $('#seccionUsuarios');
    
  // seccion debug
  seccionEventos.show();
  seccionJugadores.hide();
  seccionUsuarios.hide();

  // boton de seleccion
  const jugadoresOpcion = $('#jugadorOpt');
  const eventosOpcion = $('#asistenciaOpt');
  const usuariosOpcion = $('#usuariosOpt');

  jugadoresOpcion.on('click',function(){
    seccionEventos.hide();
    seccionJugadores.show();
    seccionUsuarios.hide();
  });

  eventosOpcion.on('click',function(){
    seccionEventos.show();
    seccionJugadores.hide();
    seccionUsuarios.hide();
  });

  usuariosOpcion.on('click',function(){
    seccionEventos.hide();
    seccionJugadores.hide();
    seccionUsuarios.show();
  });


}


// función side bar evento sub seccion
subSection();
function subSection(){

  const optionAsistencia = $('#asistenciaOpt');
  const divAbrir = $('.eventos-options');

  // abrir div
  optionAsistencia.on('mouseover', function(){
    divAbrir.show();
    
  });

  optionAsistencia.on('mouseout', function(){
    divAbrir.hide();
  });

  // mantener div
  divAbrir.on('mouseover', function(){
    divAbrir.show();
  });

  divAbrir.on('mouseout',function(){
    divAbrir.hide();
  })

  // Abrir calendario
  const btnCalendario = $('#calendar-opt');
  const btnCrearEvento = $('#crearEvento-opt');
  const btnCrearPartido = $('#crearPartido-opt');

  // secciones dentro de asistenc ica
  const sectionCalendario = $('.calendar-div');
  const sectionCrearEvento = $('.inner-asistencia');


  // seccion aparte
  const sectionCrearPartido = $('#partidoEvento');

  // para abrir calendario hay que cerrar otras
  btnCalendario.on('click',function(){
    sectionCalendario.show();
    sectionCrearEvento.hide();
    sectionCrearPartido.hide();
  });

  // para abrir creador de evento
  btnCrearEvento.on('click',function(){
    sectionCalendario.hide();
    sectionCrearEvento.show();
    sectionCrearPartido.hide();
  });

  // para abrir creador de partido
  btnCrearPartido.on('click',function(){
    sectionCalendario.hide();
    sectionCrearEvento.hide();
    sectionCrearPartido.show();
  });


}