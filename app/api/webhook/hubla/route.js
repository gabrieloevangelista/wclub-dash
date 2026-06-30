import { NextResponse } from 'next/server';
import { getLocalDbSync, saveLocalDbSync } from '@/lib/db';

export async function POST(request) {
  try {
    const headers = request.headers;
    const clientToken = headers.get('x-hubla-token');
    const serverToken = process.env.HUBLA_WEBHOOK_TOKEN || 'hubla-mock-secret-token';

    // 1. Authenticate webhook request
    if (!clientToken || clientToken !== serverToken) {
      return NextResponse.json({ error: 'Não autorizado. Token de webhook inválido.' }, { status: 401 });
    }

    const payload = await request.json();
    const eventType = payload.event_type;
    const customerData = payload.data || {};
    const email = customerData.email;

    if (!email) {
      return NextResponse.json({ error: 'E-mail do comprador é obrigatório.' }, { status: 400 });
    }

    const fs = require('fs');
    const path = require('path');
    
    // Path to the requested simulated members.json
    const membersJsonPath = path.join(process.cwd(), 'members.json');
    let standaloneMembers = [];
    if (fs.existsSync(membersJsonPath)) {
      try {
        standaloneMembers = JSON.parse(fs.readFileSync(membersJsonPath, 'utf-8'));
      } catch (err) {
        standaloneMembers = [];
      }
    }

    const db = getLocalDbSync();
    
    // Log log records to webhook_logs database table
    if (db) {
      db.webhook_logs = db.webhook_logs || [];
      db.webhook_logs.push({
        id: 'weblog-' + Date.now(),
        type: eventType,
        email,
        payload,
        created_at: new Date().toISOString()
      });
      saveLocalDbSync(db);
    }

    if (eventType === 'customer.member_added') {
      const name = customerData.name || email.split('@')[0];
      const initials = (name.trim().split(/\s+/).map(x => x[0]).join('')).toUpperCase().substring(0, 2);
      const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '');

      // 1. Sync in wclub_local_db.json
      if (db) {
        db.members = db.members || [];
        const index = db.members.findIndex(m => m.email.toLowerCase() === email.toLowerCase());
        
        if (index !== -1) {
          db.members[index].status = 'Ativo';
          db.members[index].deactivated_at = null;
        } else {
          db.members.push({
            id: 'hubla-user-' + Date.now(),
            name,
            email,
            role: 'Mentorado (Hubla)',
            company: '',
            initials,
            member_type: 'mentor',
            status: 'Ativo',
            username,
            added_at: new Date().toISOString()
          });
        }
        saveLocalDbSync(db);
      }

      // 2. Sync in members.json
      const indexS = standaloneMembers.findIndex(m => m.email.toLowerCase() === email.toLowerCase());
      if (indexS !== -1) {
        standaloneMembers[indexS].status = 'Ativo';
        standaloneMembers[indexS].deactivated_at = null;
      } else {
        standaloneMembers.push({
          name,
          email,
          initials,
          member_type: 'mentor',
          status: 'Ativo',
          username,
          added_at: new Date().toISOString()
        });
      }
      fs.writeFileSync(membersJsonPath, JSON.stringify(standaloneMembers, null, 2), 'utf-8');

      return NextResponse.json({ success: true, message: 'Membro ativado com sucesso.' });
    }

    if (eventType === 'customer.member_removed') {
      const deactDate = new Date().toISOString();

      // 1. Sync in wclub_local_db.json
      if (db) {
        db.members = db.members || [];
        const index = db.members.findIndex(m => m.email.toLowerCase() === email.toLowerCase());
        if (index !== -1) {
          db.members[index].status = 'Inativo';
          db.members[index].deactivated_at = deactDate;
          saveLocalDbSync(db);
        }
      }

      // 2. Sync in members.json
      const indexS = standaloneMembers.findIndex(m => m.email.toLowerCase() === email.toLowerCase());
      if (indexS !== -1) {
        standaloneMembers[indexS].status = 'Inativo';
        standaloneMembers[indexS].deactivated_at = deactDate;
        fs.writeFileSync(membersJsonPath, JSON.stringify(standaloneMembers, null, 2), 'utf-8');
      }

      return NextResponse.json({ success: true, message: 'Membro desativado com sucesso.' });
    }

    return NextResponse.json({ error: 'Tipo de evento de webhook inválido.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
