// auth.js

// --- Inicialización Supabase (única) ---
const SUPABASE_URL = 'https://gpgxaeynjsvovdzyppoo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HuchtYI9DCe9M70OqefGIg_LM9UDoZm';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Hacer sb accesible globalmente
window.sb = sb;

// --- Pequeño helper para evitar errores si un elemento no existe ---
function el(id) { return document.getElementById(id); }

// --- Toggle "mostrar contraseña" (si existen botones) ---
document.addEventListener('click', (ev) => {
  const t = ev.target;
  if (t && t.classList && t.classList.contains('show-pass')) {
    const input = t.parentElement && t.parentElement.querySelector('input');
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    t.textContent = input.type === 'password' ? '👁️' : '🙈';
  }
});

// --- Login handler: solo enganchar si existe el formulario loginForm ---
(function attachLoginHandlerIfPresent(){
  const form = document.getElementById('loginForm');
  const msgEl = document.getElementById('formMessage'); // puede ser null si no está en la página

  if (!form) return; // no hacemos nada si no existe el formulario

  function showError(text){
    if(msgEl) {
      msgEl.textContent = text;
      msgEl.classList.remove('success');
      msgEl.classList.add('error');
    } else {
      alert(text);
    }
  }
  function showSuccess(text){
    if(msgEl) {
      msgEl.textContent = text;
      msgEl.classList.remove('error');
      msgEl.classList.add('success');
    } else {
      console.log('SUCCESS:', text);
    }
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (msgEl) { msgEl.textContent = ''; msgEl.className = 'form-message'; }

    const email = (form.email && form.email.value || '').trim();
    const password = form.password && form.password.value || '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return showError('Ingresa un correo válido.');
    }
    if (!password || password.length < 8) {
      return showError('La contraseña debe tener al menos 8 caracteres.');
    }

    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const user = data.user;
      if(!user) throw new Error('No se obtuvo el usuario del servidor.');

      // obtener perfil
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

      // Guardar en localStorage para usar en paneles (si deseas mantenerlo)
      localStorage.setItem('userRole', profile.rol);
      localStorage.setItem('userIdParticipantes', profile.id_participantes || '');
      localStorage.setItem('userName', profile.nombre || 'Usuario');

      showSuccess('Inicio de sesión correcto. Redirigiendo…');

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
      }, 900);

    } catch (error) {
      console.error('Error de autenticación:', error);
      showError(error?.message || 'Error en autenticación.');
    }
  });
})();

// ----------------- Helpers para uso desde los frontends ------------------

// Obtiene el usuario actual (supabase v2)
async function getCurrentUser() {
  const { data, error } = await sb.auth.getUser();
  if (error) throw error;
  return data?.user || null; // puede ser null si no hay sesión
}

// Busca un perfil por id_participantes (código del estudiante de 10 dígitos)
// Devuelve la respuesta completa { data, error } para manejo flexible
async function getProfileByIdParticipantes(id_participantes) {
  return await sb
    .from('profiles')
    .select('id, id_participantes, nombre, institucion')
    .eq('id_participantes', id_participantes)
    .maybeSingle();
}

// Actualiza el campo id_est_ev del perfil de un evaluado
async function setIdEstEvForEvaluado(evaluadoUserId, id_est_ev_value) {
  const { data, error } = await sb
    .from('profiles')
    .update({ id_est_ev: id_est_ev_value })
    .eq('id', evaluadoUserId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Actualiza comentarios y recomendaciones del perfil del evaluado
async function updateComentariosRecomendaciones(evaluadoUserId, comentarios, recomendaciones) {
  const { data, error } = await sb
    .from('profiles')
    .update({ comentarios, recomendaciones })
    .eq('id', evaluadoUserId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Crear perfil (usado en registro).
// profileData: { numero_id, nombre, apellidos, rol, institucion, grado, id_est_ev? }
async function createProfileForUser(userId, profileData) {
  const toInsert = {
    id: userId,
    ...profileData
  };
  const { data, error } = await sb.from('profiles').insert([toInsert]).select().single();
  if (error) throw error;
  return data;
}

// Exponer helpers a window para que otros scripts puedan usarlos
window.getCurrentUser = getCurrentUser;
window.getProfileByIdParticipantes = getProfileByIdParticipantes;
window.setIdEstEvForEvaluado = setIdEstEvForEvaluado;
window.updateComentariosRecomendaciones = updateComentariosRecomendaciones;
window.createProfileForUser = createProfileForUser;

// ----------------- Fin de auth.js -----------------
