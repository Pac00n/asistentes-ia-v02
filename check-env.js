// Script para verificar las variables de entorno
require('dotenv').config({ path: './.env.local' });

console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `Existe (longitud: ${process.env.OPENAI_API_KEY.length})` : 'No existe');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'No existe');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Existe' : 'No existe');
