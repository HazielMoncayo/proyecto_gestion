import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://wfjmgqejoycktthcjrxa.supabase.co',
  // la que empieza con sb_secret_...
)

async function crearUsuario() {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'david@gmail.com',
    password: '123456',
    email_confirm: true, // lo marca como confirmado directamente
    user_metadata: {
      nombre: 'David Guato',
      rol: 'estudiante',
    },
  })

  if (error) {
    console.error('Error:', error.message)
  } else {
    console.log('Usuario creado:', data.user.email)
  }
}

crearUsuario()