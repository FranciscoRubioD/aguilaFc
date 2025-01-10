$(document).ready(function() {

  let currentPage = 1;

  // 


  // pop up 
  // Mostrar el popup con animación rápida
$('.picProfile').on('click', function() {
  var $popup = $('.popUp-profile');
  
  // Alterna entre mostrar y ocultar con animación rápida
  if ($popup.is(':visible')) {
      $popup.slideUp(200); // Oculta con animación rápida
  } else {
      $popup.stop(true, true).slideDown(200); // Muestra con animación rápida
  }
});

// Cerrar el popup al hacer clic fuera de él
$(document).on('click', function(event) {
  if (!$(event.target).closest('.popUp-profile, .picProfile').length) {
      $('.popUp-profile').slideUp(200); // Cierra el popup con animación rápida
  }

  if (!$(event.target).closest('.tablaContent').length) {
    // $('.asistenciaQuick').fadeOut(); // Cierra el popup con animación rápida
  }
});



// fecha 
// Obtener la fecha actual
const fecha = new Date();
    
// Opciones para formatear la fecha
const opciones = {
  weekday: 'long', // Día de la semana
  month: 'long',   // Mes
  day: 'numeric',  // Día del mes
  year: 'numeric'  // Año
};

// Formatear la fecha
const fechaFormateada = fecha.toLocaleDateString('es-ES', opciones);

// Actualizar el contenido del elemento con id "fecha"
$('#fechaActual').text(fechaFormateada);

$('.opcionesJuego').on('click', function (e) {
  e.stopPropagation(); // Evita que el evento se propague

  // Obtiene el contenedor de tareas relacionado al ícono clickeado
  const tareasAcciones = $(this).siblings('.tareas-acciones');

  // Oculta todos los demás menús
  $('.tareas-acciones').not(tareasAcciones).hide();

  // Alterna la visibilidad del menú relacionado
  tareasAcciones.toggle();
});


window.anteriorPartido = function(id_Equipo){
  $.ajax({
    type:'GET',
    url: `/partido-anterior/${id_equipo}`, // Ruta al backend
    success:function(response){
      console.log(response);
    }
  })
}


window.partidoHistorial = function (id_equipo){
  $.ajax({
    type:'GET',
    url:'/eventos/divison',
    data: { id_equipo : id_equipo }, // Pasar la categoría como parámetro de consulta
    success:function(response){
      const ahora = new Date(); // Fecha y hora actuales

  let proximoPartido = null;
  let ultimoPartido = null;

  let proximoEntrenamiento = null;
  let ultimoEntrenamiento  = null;

  // Filtramos los eventos para obtener el próximo y el último partido
  response.forEach(evento => {
    const fechaEvento = new Date(evento.fecha); // Suponiendo que 'fecha' es el campo de fecha del evento
    
    // Si el evento es un partido
    if (evento.evento.toLowerCase().includes('partido')) {  
      
      // Filtrar el próximo partido solo si está pendiente
      if (evento.estado.toLowerCase() === 'pendiente') {
        // Verificar si el evento es posterior a la fecha actual
        if (fechaEvento > ahora) {
          if (!proximoPartido || fechaEvento < new Date(proximoPartido.fecha)) {
            proximoPartido = evento;
          }
        }
      }


       if (evento.estado.toLowerCase() === 'pendiente') {
        // Verificar si el evento es posterior a la fecha actual
        if (fechaEvento > ahora) {
          if (!proximoPartido || fechaEvento < new Date(proximoPartido.fecha)) {
            proximoPartido = evento;
          }
        }
      }

      // Asignar el último partido independientemente de su estado
      if (fechaEvento < ahora) {
        if (!ultimoPartido || fechaEvento > new Date(ultimoPartido.fecha)) {
          ultimoPartido = evento;
        }
      }
    }

    // Si el evento es un entrenamiento
    if (evento.evento.toLowerCase().includes('entrenamiento')) { 

      // Filtrar el próximo entrenamiento solo si está pendiente (opcional)
      // Si no te importa el estado, puedes omitir este bloque
      if (fechaEvento > ahora) {
        if (!proximoEntrenamiento || fechaEvento < new Date(proximoEntrenamiento.fecha)) {
          proximoEntrenamiento = evento;
        }
      }

      // Asignar el último entrenamiento independientemente de su estado
      if (fechaEvento < ahora) {
        if (!ultimoEntrenamiento || fechaEvento > new Date(ultimoEntrenamiento.fecha)) {
          ultimoEntrenamiento = evento;
        }
      }
    }
  });
        // Muestra los resultados
        console.log('Próximo partido:', proximoPartido);
        console.log('Último partido:', ultimoPartido);
        

        // dom for proximo partido 
        if (proximoPartido) {
          $('#rivalProximo').text(`Aguila FC vs ${proximoPartido.equipo_rival}`);
          $('#horaProximo').text(`${formatTime(proximoPartido.hora)} - ${formatTime(proximoPartido.hora_final)}`);
          $('#fechaProximo').text(formatDatePartido(proximoPartido.fecha));

          $('#listaPartido').css({
            'pointer-events': 'auto', // Reactiva clics
            'opacity': '1'            // Restaura el aspecto visual
          })

          // mostrar asistencia
          // menu next eventos
          $('#listaPartido').off('click').on('click', function(){
            $('.asistenciaQuick').fadeIn();
            $('.tareas-acciones').hide();
            console.log(`hicimos click y abrimos ${proximoPartido.id}`);
            modalAsistenciaQuick(proximoPartido.id);

          });
        }else if(!proximoPartido){
          $('#rivalProximo').text('No hay partido próximos');
          $('#horaProximo').text('');
          $('#fechaProximo').text('');

          $('#listaPartido').css({
            'pointer-events': 'none', // Deshabilita clics
            'opacity': '0.5'          // Cambia el aspecto visual para indicar que está desactivado
          });

        }

        if (ultimoPartido) {
          $('#rivalAnterior').text(`Aguila FC vs ${ultimoPartido.equipo_rival}`);
          $('#horaAnterior').text(`${formatTime(ultimoPartido.hora)} - ${formatTime(ultimoPartido.hora_final)}`);
          $('#fechaAnterior').text(formatDatePartido(ultimoPartido.fecha));

          $('#listaPartidoAnterior').css({
            'pointer-events': 'auto', // Reactiva clics
            'opacity': '1'            // Restaura el aspecto visual
          })


          $('#listaPartidoAnterior').on('click', function(){
            $('.asistenciaQuick').fadeIn();
            $('.tareas-acciones').hide();
            modalAsistenciaQuick(ultimoPartido.id);

          });
        }else if(!ultimoPartido){
          $('#rivalAnterior').text('No hay partidos jugados');
          $('#horaAnterior').text('');
          $('#fechaAnterior').text('');

          $('#listaPartidoAnterior').off('click'); // Elimina cualquier evento asignado
          $('#listaPartidoAnterior').css({
            'pointer-events': 'none', // Deshabilita clics
            'opacity': '0.5'          // Cambia el aspecto visual para indicar que está desactivado
          });

      }


      // dom for proximo entrenamiento
      if (proximoEntrenamiento) {
        $('#entrenamientoPr').text('Aguila FC')
        $('#horaProxEn').text(`${formatTime(proximoEntrenamiento.hora)} - ${formatTime(proximoEntrenamiento.hora_final)}`);
        $('#fechaProEn').text(formatDatePartido(proximoEntrenamiento.fecha));
        // mostrar asistencia
        // menu next eventos
        $('#listaEntrenamiento').css({
          'pointer-events': 'auto', // Reactiva clics
          'opacity': '1'            // Restaura el aspecto visual
        })

        $('#listaEntrenamiento').off('click').on('click', function(){
          $('.asistenciaQuick').fadeIn();
          $('.tareas-acciones').hide();
          modalAsistenciaQuick(proximoEntrenamiento.id);
        });
      }else if(!proximoEntrenamiento){
        $('#entrenamientoPr').text('No hay entrenamientos próximos');
        $('#horaProxEn').text('');
        $('#fechaProEn').text('');

        // Desactivar interacción para 'listaEntrenamientoAn'
        $('#listaEntrenamiento').off('click'); // Elimina cualquier evento asignado
        $('#listaEntrenamiento').css({
          'pointer-events': 'none', // Deshabilita clics
          'opacity': '0.5'          // Cambia el aspecto visual para indicar que está desactivado
        });

      }

      if (ultimoEntrenamiento) {
        $('#entrenamientoAn').text(`Aguila FC`);
        $('#horaAntEn').text(`${formatTime(ultimoEntrenamiento.hora)} - ${formatTime(ultimoEntrenamiento.hora_final)}`);
        $('#fechaEnAnt').text(formatDatePartido(ultimoEntrenamiento.fecha));

        // Reactivar interacción si hay entrenamientos próximos
        $('#listaEntrenamientoAn').css({
          'pointer-events': 'auto', // Reactiva clics
          'opacity': '1'            // Restaura el aspecto visual
        });
        
        $('#listaEntrenamientoAn').on('click', function(){
          $('.asistenciaQuick').fadeIn();
          $('.tareas-acciones').hide();
          modalAsistenciaQuick(ultimoEntrenamiento.id);
        });

      }else if(!ultimoEntrenamiento){
        $('#entrenamientoAn').text('No hay entrenamientos');
        $('#horaAntEn').text('');
        $('#fechaEnAnt').text('');

        // Desactivar interacción para 'listaEntrenamientoAn'
        $('#listaEntrenamientoAn').off('click'); // Elimina cualquier evento asignado
        $('#listaEntrenamientoAn').css({
          'pointer-events': 'none', // Deshabilita clics
          'opacity': '0.5'          // Cambia el aspecto visual para indicar que está desactivado
        });
        
      }
      
      
        
  
    }
  
  })
  
}

// partidoHistorial(1);




// fechas y horas
function formatDatePartido(dateString) {
  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  
  const date = new Date(dateString); // Crear un objeto Date a partir de la cadena de fecha

  // Obtener el día de la semana, el día del mes, el mes y el año
  const dayOfWeek = daysOfWeek[date.getDay()];
  const dayOfMonth = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  // Formatear la fecha en el formato deseado
  return `${dayOfWeek}, ${dayOfMonth} ${month} ${year}`;
}


function formatTime(hora) {
  // Convertir la hora a un objeto Date
  const date = new Date(`1970-01-01T${hora}Z`);

  // Obtener las horas y minutos
  let hours = date.getUTCHours();
  let minutes = date.getUTCMinutes();

  // Determinar AM o PM
  const ampm = hours >= 12 ? 'PM' : 'AM';

  // Convertir a formato de 12 horas (si es mayor que 12, restar 12)
  hours = hours % 12;
  hours = hours ? hours : 12; // El 0 debería ser 12

  // Formatear los minutos para tener siempre 2 dígitos
  minutes = minutes < 10 ? '0' + minutes : minutes;

  // Retornar el formato final
  return `${hours}:${minutes} ${ampm}`;
}



// eventExistList(31);




// mimic table
function modalAsistenciaQuick(evento,page){

  $.ajax({
    type: 'GET',
    url: '/jugador/evento/asistencia',
    data: {
      evento: evento,
      page: page, // Puedes ajustar esto según sea necesario
      limit: 50 // Ajusta el límite aquí
    },
    dataType: 'json',
    success: function(response) {
      const table = $('#quickTable');
      const bodytable = $('#quickTableData');
      const btnTabla = $('#updateQuickList');
      
      bodytable.empty(); // Limpiar la tabla antes de añadir nuevos datos
      table.removeClass('visible');
      // $('.enviar-asist-div').removeClass('visible');
    
      console.log(`total pages: ${response.totalPages}`);
      console.log(`total players: ${response.totalPlayers}`);
    

      // Generar la paginación
      generarPaginacionAsist(evento,response.totalPages,modalAsistenciaQuick,'btnSiguienteAsist','btnAnteriorAsistQuick');


      // borrar asistencia
      deleteAsistencia(evento,'reiniciarLista');


      // cerrar modal
      $('.quick-asist-x').on('click',function(){
          $('.asistenciaQuick').fadeOut();
          $('#quickTable').hide();
          $('.table-asist-new').hide();
      });

      // Verificar si hay resultados
      if (response.players.length === 0) {
        
        // botones
        $('#reiniciarLista').hide();
        $('#marcarTodosQuick').hide();


        table.hide();
        btnTabla.hide();
        
        eventExistList(evento); // Función que se debe definir para manejar la falta de datos
      } else {

        $('#reiniciarLista').show();
        $('#marcarTodosQuick').show();
        table.show();
        // $('.table-asist-new').hide();
        // $('#newList').hide();
        btnTabla.show();
        
        // Iterar sobre los datos obtenidos y construir filas para cada jugador
        $.each(response.players, function(index, jugador) {
          const fila = $('<tr>').attr('data-jugador-id-quick', jugador.id);
  
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
            marcarTodosCheckBox($('#marcarTodosQuick'),'#quickTableData',`${estado}_${jugador.id}`);

          });
  
          // Columna para el textarea de observaciones
          const columnaObservaciones = $('<td>');
          const textarea = $('<textarea>').attr('id', 'observacionesQuick' + jugador.id);
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
              const filaJugador = bodytable.find(`tr[data-jugador-id-quick='${jugador.id}']`);
              
              // Marcar el checkbox en la fila correspondiente al jugador
              filaJugador.find(`input[name='${nombreCheckbox}']`).prop('checked', true);
  
              // Insertar la descripción en el textarea correspondiente
              filaJugador.find(`#observacionesQuick${jugador.id}`).val(descripcionJugador);

             // enviar asistencias
             
              const botonEnviar = $('#enviarAsistQuick');

              botonEnviar.off('click').on('click', function(){
                const asistencias = [];
                let allSelected = true;

                $('#quickTableData tr').each(function() {
                  const fila = $(this);
                  // Obtener el id del jugador desde el atributo data-jugador-id
                  const jugadorId = fila.data('jugador-id-quick');
                  
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

                // Deshabilitar el botón antes de enviar la solicitud
                botonEnviar.prop('disabled', true).text('Enviando...')


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
                    // Rehabilitar el botón y restablecer el texto
                    botonEnviar.prop('disabled', false).text('Enviar');
                  },
                  error: function(xhr, status, error) {
                    console.error('Error al guardar la asistencia:', error);
                    alert('Hubo un error al guardar la asistencia. Por favor, inténtalo de nuevo.');
                    //  Rehabilitar el botón y restablecer el texto en caso de error
                    botonEnviar.prop('disabled', false).text('Enviar');  
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


// eliminar asistencia
function deleteAsistencia(evento,btnDelete){
  
  const deleteBtn = $(`#${btnDelete}`);

  deleteBtn.off('click').on('click', function(){

    const confirmacion = window.confirm('¿Estás seguro de que deseas eliminar las asistencias para este evento?');

    if (!confirmacion) {
      return      
    }


    $.ajax({
      type: 'DELETE',
      url: '/asistencia/evento',
      contentType: 'application/json',
      data: JSON.stringify({ id_evento: evento }), // El id_evento que quieres eliminar
      success: function(response) {
        console.log(response.message);
        alert('asistencia borrada exitosamente');
        modalAsistenciaQuick(evento);
        
      },
      error: function(xhr, status, error) {
        console.error('Error al eliminar las asistencias:', error);
      }
    });

  });

}






});