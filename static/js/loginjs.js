$(document).ready(function() {

  const btnLogin = $('#btnLogin');

  $('#loginForm').on('submit', function(e) {
    e.preventDefault(); // Prevenir la recarga de la página

    const username = $('#username').val();
    const password = $('#contrasena').val();

    if(!username || !password) {
      alert('Ingrese usuario o contraseña');
      return;
    }

    $.ajax({
      url: '/admin/login', // Ruta del servidor para el login
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        username: username,
        password: password
      }),
      success: function(response) {
        alert('Login exitoso');
        // Redirigir o hacer algo después del login exitoso
        
        const token = response.token;
        // Guardar el token en localStorage
        localStorage.setItem('token', token);
        // Redirigir a la página principal
        window.location.href = '/jugadores'; // production

      },
      error: function(error) {
        // Mostrar el mensaje de error si ocurre un fallo en el login
        // Mostrar el mensaje de error si ocurre un fallo en el login
        const errorMessage = error.responseJSON?.error;
        $('#errorMsg').text('');

        if (errorMessage === 'Contraseña incorrecta') {
            $('#errorMsg').text('Usuario o contraseña incorrecta. intente otra vez').show();   
        } else if (errorMessage === 'Usuario bloqueado. Contacte al administrador.') {
            $('#errorMsg').text('Tu cuenta está bloqueada. Contacta al administrador.').show();
        }else if(errorMessage === "Usuario no encontrado"){
          $('#errorMsg').text('Usuario o contraseña incorrecta. intente otra vez').show(); 
        } 
        else {
            // Mensaje genérico para otros errores
            $('#errorMsg').text('Ocurrió un error. Inténtalo nuevamente.').show();
        }

        console.error('Error de autenticación: ', errorMessage);

      }
    });
  });
});