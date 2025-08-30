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
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return showError(error.message);

    // Verificar el rol del usuario
    const user = data.user;
    const userId = user.id;

    // Consultar perfil en la tabla profiles
    const { data: profile, error: profileError } = await sb
      .from('profiles')
      .select('rol')
      .eq('id', userId)
      .single();

    if (profileError) {
      showError('Error al consultar rol del usuario');
      return;
    }

    const userRole = profile.rol;
    localStorage.setItem('userRole', userRole);

    if (userRole === 'estudiante') {
      showSuccess('Inicio correcto. Redirigiendo…');
      setTimeout(() => window.location.href = 'student_dashboard.html', 1000);
    } else if (userRole === 'supervisor') {
      showSuccess('Inicio correcto. Redirigiendo…');
      setTimeout(() => window.location.href = 'supervisor_dashboard.html', 1000);
    } else if (userRole === 'evaluado') {
      showSuccess('Inicio correcto. Redirigiendo…');
      setTimeout(() => window.location.href = 'evaluado_dashboard.html', 1000);
    } else {
      showError('Rol de usuario no reconocido');
    }
  } catch (error) {
    showError('Error al conectar con el servidor: ' + error.message);
  }
});

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