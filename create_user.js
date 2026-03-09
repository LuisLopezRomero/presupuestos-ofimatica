import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://shdhwdjdcpofbethynzr.supabase.co'
const supabaseAnonKey = 'sb_publishable_RafJUDASGl9riAeB8X3gkg_gOJD6L_f'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createUser() {
    console.log("Intentando crear usuario...");
    const { data, error } = await supabase.auth.signUp({
        email: 'info@ofimaticadigital.es',
        password: '19121997Od@-',
    })

    if (error) {
        console.error("Error al crear usuario:", error.message);
    } else {
        console.log("Usuario creado con éxito:", data.user.email);
        console.log("Nota: Si la confirmación de email está activa, deberás confirmarlo.");
    }
}

createUser();
