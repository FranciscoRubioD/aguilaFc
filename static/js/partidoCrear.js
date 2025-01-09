$(document).ready(function() {


    // pasar a siguiente form
    let vuelta = false;

    const btnSiguienteFormPartido =  $('.btn-sig-partido');
    const btnAnteriorFormPartido = $('.btn-ant-partido');

    btnSiguienteFormPartido.on('click',function(){

      // hide current page
      $('.form-part-col1').hide();
      $('.form-part-col2').show();

      btnSiguienteFormPartido.text('Guardar');
      canSubmit = true;

    });

    btnAnteriorFormPartido.on('click',function(){
      $('.form-part-col1').show();
      $('.form-part-col2').hide();

      btnSiguienteFormPartido.text('Siguiente');
    });
   

    // controlamos el partido de vuelta toggle
    $('.jtoggler').jtoggler();
    $(document).on('jt:toggled',function(event, target) {
      
      console.log(event, target);
      console.info($(target).prop('checked'));
      const golFavor = $('#golFavor');
      const golContra = $('#golContra');
      if($(target).prop('checked')){
        // do something if its on. 
  
        $('.partidoVuelta').show();
        golFavor.attr('required','true');
        golContra.attr('required','true');
        vuelta = true;

      }else{
        $('.partidoVuelta').hide();
        golFavor.val('');
        golContra.val('');
        golFavor.attr('required','false');
        golContra.attr('required','false');

        vuelta = false;
      }
   
    });

    
    // una vez tenemos todos los datos los mandamos para crear el evento partido
    // lo podemos mandar como un objeto 

  // step 1: traer datos a categoría
  $('.partidoForm').on('submit',()=>{
    
    event.preventDefault();

    // data form
    const equipo = $('#mySelect').val();
    const tipoPartido = $('#mySelect1').val();
    const fechaPartido = $('#fechaPartido').val();
    const horaInicio = $('#horaInicio').val();
    const horaFinal  = $('#horaFinal').val();
    const ubicacion  = $('#ubicacionPartido').val();
    const rivalNombre = $('#rivalPartido').val();

    // en caso de partido de vuelta
    let golContra = 0;
    let golFavor = 0;

    if(vuelta){
      golContra =  $('#golFavor').val();
      golFavor = $('#golContra').val();
    }
    

    const encargado = $('#mySelect2').val();
    const comentario = $('#comentarioPartido').val();

    
    const dataForm = {
      equipo : equipo,
      tipoPartido: tipoPartido,
      fechaPartido : fechaPartido,
      horaInicio : horaInicio,
      horaFinal : horaFinal,
      ubicacion : ubicacion,
      rivalNombre : rivalNombre,
      golFavor : golFavor,
      golContra : golContra,
      encargado: encargado,
      comentario: comentario
    }

    $.ajax({
      type:'POST',
          url:'/crear/partido',
          contentType: 'application/json',
          data: JSON.stringify({ 
            dataForm
          }),
          success: function(){

            $('.partidoCreado').show();

            $('#aceptResetForm').on('click',function(){


              document.getElementById('formPartido').reset();

              // cerrar modal, volver a form
              $('.partidoCreado').hide();
              $('.form-part-col1').show();
              $('.form-part-col2').hide();
              
              // reset partido de vuelta
              $('.partidoVuelta').hide();
              golFavor.val('');
              golContra.val('');
              golFavor.attr('required','false');
              golContra.attr('required','false');
              vuelta = false;

              btnSiguienteFormPartido.text('Siguiente');
            });
            



          },
          error: function(xhr, status, error) {
            console.error('Error al guardar partido:', error);
            alert('Hubo un error al guardar el partido. Por favor, inténtalo de nuevo.');
          }
    });
    

  })

  // trae categorias disponibles
  $.ajax({
    type:'GET',
    url:'/get/equipo',
    dataType:'json',
    success: function(response){
      
      // una vez tenemos info de los equipos

      // creamos opciones en base a cantidad de equipo
      response.results.forEach(function(equipo) {


        // subdivision ------------- section crear partido-------------------
        const opcion = $('<option>');
        // const nombreEquipo = opcion.attr('data-nombre',equipo.nombre);
        opcion.text(equipo.nombre);
        opcion.val(equipo.id);
        $('#mySelect').append(opcion);

        
      });

      // get usuarios
      NiceSelect.bind(document.getElementById("mySelect2"), {
      });
      

      // cargar select de plugin
      NiceSelect.bind(document.getElementById("mySelect"), {
      });

   ;


    },
    error: function(xhr, status, error) {
      console.error('Error al obtener informacion de equipo:', error);
    }

  });


  // step: Al completar form, desaparecer y pasar siguiente div
  
  

})

