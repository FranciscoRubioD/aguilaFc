$(document).ready(function() {

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
        
        const selectEquipo = $('#equipoAsistencia');
        selectEquipo.empty();
        
        const opcionEquipo = $('<option>').attr('value', '').text('Selecciona equipo');
        selectEquipo.append(opcionEquipo);
        
        // Iterar sobre los equipos y agregar opciones al select
        response.results.forEach(function(equipo) {
          const opcionEquipo = $('<option>').attr('value', equipo.id).text(equipo.nombre);
          selectEquipo.append(opcionEquipo);
        })

        
      

      }
    })


    const crearListadoButton = $('#crearListadoButton');

    crearListadoButton.on('click',function(){
      eventoFetch();
    })
    
    // recopilar informacion
    function eventoFetch(){
      const equipo = $('#equipoAsistencia').val();
      const evento = $('#eventoAsistencia').val();
      const estado = $('#estadoAsistencia').val();
      const fecha = $('#fechaEvento').val();
      const hora = $('#horaEvento').val();
      const descripcion = $('#descEvento').val();

      console.log(equipo);
      console.log(evento);
      console.log(estado);
      console.log(fecha);
      console.log(hora);
      console.log(descripcion);

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

          // Asegúrate de que la tabla sea invisible al principio
          bodytable.removeClass('visible');
          table.removeClass('visible');

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

           // Ocultar la animación de carga
          $('#loadingAnimation').hide();
          animation.stop();

          // Hacer visible la tabla con la transición
          table.addClass('visible');
          bodytable.addClass('visible');
        },1000);
    
          
          
    
        }
      })

    }



  // select asistencia checkmark
  


})