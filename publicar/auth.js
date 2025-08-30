// auth.js

// Inicialización de Supabase
const SUPABASE_URL = 'https://gpgxaeynjsvovdzyppoo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HuchtYI9DCe9M70OqefGIg_LM9UDoZm';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Toggle mostrar/ocultar contraseña
document.querySelectorAll('.show-pass').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = btn.parentElement.querySelector('input');
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.textContent = input.type === 'password' ? '👁️' : '🙈';
  });
});

// Manejo del formulario de login
const form = document.getElementById('loginForm');
const msg  = document.getElementById('formMessage');

form.addEventListener('submit', async e => {
  e.preventDefault();
  msg.textContent = '';
  msg.className   = 'form-message';

  const email    = form.email.value.trim();
  const password = form.password.value;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return showError('Ingresa un correo válido.');
  }
  if (!password || password.length < 8) {
    return showError('La contraseña debe tener al menos 8 caracteres.');
  }

  try {
    // 1. Iniciar sesión con correo y contraseña
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const user = data.user;

    // 2. Consultar perfil: rol e id_participantes desde la tabla 'profiles'
    const { data: profile, error: profileError } = await sb
      .from('profiles')
      .select('rol, id_participantes, nombre')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error al obtener perfil:', profileError);
      return showError('No se pudo cargar tu perfil. Contacta al administrador.');
    }

    if (!profile) {
      return showError('Perfil no encontrado.');
    }

    // 3. Guardar datos del usuario en localStorage
    localStorage.setItem('userRole', profile.rol);
    localStorage.setItem('userIdParticipantes', profile.id_participantes);
    localStorage.setItem('userName', profile.nombre || 'Usuario');

    // 4. Mostrar mensaje de éxito y redirigir
    showSuccess('Inicio de sesión correcto. Redirigiendo…');

    // 5. Redirigir según el rol
    setTimeout(() => {
      if (profile.rol === 'estudiante') {
        window.location.href = 'student_dashboard.html';
      } else if (profile.rol === 'supervisor') {
        window.location.href = 'supervisor_dashboard.html';
      } else if (profile.rol === 'evaluado') {
        window.location.href = 'evaluado_dashboard.html';
      } else {
        showError('Rol no reconocido en el sistema.');
      }
    }, 1200);

  } catch (error) {
    console.error('Error de autenticación:', error);
    showError(`Error: ${error.message}`);
  }
});

// Funciones para mostrar mensajes
function showError(text) {
  msg.textContent = text;
  msg.classList.remove('success');
  msg.classList.add('error');
}

function showSuccess(text) {
  msg.textContent = text;
  msg.classList.remove('error');
  msg.classList.add('success');
}