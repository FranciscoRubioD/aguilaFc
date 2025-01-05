$(document).ready(function() {

  $('#info-section').addClass('select');
  $('.documentos').hide();
  
  function seleccionarOpcion(seleccionado){
    $('.select').removeClass('select');
    seleccionado.addClass('select');
  }

  $('#document-section').on('click',function(){
    seleccionarOpcion($('#document-section'));
    $('.documentos').fadeIn();
    $('.stats-player').hide();
  })


  $('#info-section').on('click',function(){
    seleccionarOpcion($('#info-section'));
    $('.stats-player').fadeIn();
    $('.documentos').hide();
  })
  


})