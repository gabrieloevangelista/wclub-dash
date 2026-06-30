import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const studentId = formData.get('studentId') || 'unknown';

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    // 100MB Limit validation (100 * 1024 * 1024 bytes)
    const limit = 100 * 1024 * 1024;
    if (file.size > limit) {
      return NextResponse.json({ error: 'O tamanho do arquivo excede o limite de 100MB.' }, { status: 400 });
    }

    const fileName = `${studentId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Supabase config check
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const isSupabaseEnabled = supabaseUrl && supabaseServiceKey && supabaseUrl !== 'your-supabase-url';

    if (isSupabaseEnabled) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      const fileBuffer = await file.arrayBuffer();
      
      // Upload to 'missions' bucket
      const { data, error } = await supabaseAdmin.storage
        .from('missions')
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          upsert: true
        });

      if (error) {
        return NextResponse.json({ error: `Falha no upload do storage: ${error.message}` }, { status: 400 });
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage.from('missions').getPublicUrl(fileName);
      return NextResponse.json({ 
        success: true, 
        file_url: urlData.publicUrl,
        file_name: file.name
      });
    } else {
      // Mock mode: Write file locally to public/uploads/missions
      const fs = require('fs');
      const path = require('path');
      
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'missions');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const fullPath = path.join(uploadDir, fileName);
      fs.writeFileSync(fullPath, fileBuffer);

      // Return local web URL
      const relativeUrl = `/uploads/missions/${fileName}`;
      return NextResponse.json({
        success: true,
        file_url: relativeUrl,
        file_name: file.name
      });
    }
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
export const config = {
  api: {
    bodyParser: false, // Disables standard body parser to let form-data handle large uploads
  },
};
