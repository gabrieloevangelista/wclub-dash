import { NextResponse } from 'next/server';
import { getLocalDbSync, saveLocalDbSync } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

// Generates avatar initials (e.g. "Lucas Silva" -> "LS")
function getInitials(name) {
  if (!name) return 'WC';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    const initials = getInitials(name);
    
    // Check Supabase configurations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const isSupabaseEnabled = supabaseUrl && supabaseServiceKey && supabaseUrl !== 'your-supabase-url';

    if (isSupabaseEnabled) {
      // Initialize Supabase Admin Client
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // 1. Create Auth User
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name }
      });

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      const userId = authData.user.id;

      // 2. Insert Profile in members table
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('members')
        .insert({
          id: userId,
          name,
          email,
          initials,
          member_type: 'mentor',
          status: 'Ativo',
          username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '')
        })
        .select()
        .single();

      if (profileError) {
        // Rollback created Auth User on profile insertion failure
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return NextResponse.json({ error: `Falha ao salvar dados adicionais: ${profileError.message}` }, { status: 400 });
      }

      return NextResponse.json({ success: true, user: profileData });
    } else {
      // Mock Mode persistence
      const db = getLocalDbSync();
      if (!db) {
        return NextResponse.json({ error: 'Banco de dados simulado indisponível' }, { status: 500 });
      }

      db.members = db.members || [];
      const emailExists = db.members.some(m => m.email.toLowerCase() === email.toLowerCase());

      if (emailExists) {
        return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 400 });
      }

      const mockId = 'user-mentorado-' + Date.now();
      const cleanUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '');
      
      const newMember = {
        id: mockId,
        name,
        email,
        role: 'Mentorado',
        company: '',
        industry: '',
        location: '',
        initials,
        img: '',
        bio: '',
        username: cleanUsername,
        member_type: 'mentor',
        theme: 'dark',
        status: 'Ativo',
        added_at: new Date().toISOString()
      };

      db.members.push(newMember);
      saveLocalDbSync(db);

      return NextResponse.json({ success: true, user: newMember });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
