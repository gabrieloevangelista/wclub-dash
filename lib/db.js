import { createClient } from '@supabase/supabase-js';
import * as mockSeeds from './mockData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isSupabaseEnabled = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your-supabase-url';

export const supabase = isSupabaseEnabled 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Helper to interact with the local file database on the server
function getLocalDb() {
  if (typeof window !== 'undefined') {
    // In client, we retrieve via window or mock if server didn't provide
    return null;
  }
  
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(process.cwd(), 'wclub_local_db.json');
  
  if (!fs.existsSync(filePath)) {
    const defaultDb = {
      members: mockSeeds.initialMembers,
      courses: mockSeeds.initialCourses,
      modules: mockSeeds.initialModules,
      lessons: mockSeeds.initialLessons,
      resources: mockSeeds.initialResources,
      events: mockSeeds.initialCalendarEvents,
      posts: mockSeeds.initialCommunityPosts,
      opportunities: mockSeeds.initialOpportunities,
      projects: mockSeeds.initialProjects,
      missions: mockSeeds.initialMissions,
      submissions: mockSeeds.initialSubmissions,
      connections: mockSeeds.initialMemberConnections,
      notifications: mockSeeds.initialNotifications,
      banners: mockSeeds.initialBanners,
      progress: []
    };
    fs.writeFileSync(filePath, JSON.stringify(defaultDb, null, 2), 'utf-8');
    return defaultDb;
  }
  
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading local db file, returning empty state", err);
    return {};
  }
}

function saveLocalDb(data) {
  if (typeof window !== 'undefined') return;
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(process.cwd(), 'wclub_local_db.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Global server data fetch helper to bypass client bundle compile issues
export async function getCollection(collectionName) {
  if (isSupabaseEnabled) {
    const { data, error } = await supabase.from(collectionName).select('*');
    if (error) throw error;
    return data;
  } else {
    const db = getLocalDb();
    return db ? db[collectionName] || [] : [];
  }
}

export async function saveDocument(collectionName, document) {
  if (isSupabaseEnabled) {
    const { data, error } = await supabase.from(collectionName).insert(document).select();
    if (error) throw error;
    return data[0];
  } else {
    const db = getLocalDb();
    if (!db) return document;
    if (!document.id) {
      document.id = Math.random().toString(36).substring(2, 11) + '-' + Date.now();
    }
    document.created_at = new Date().toISOString();
    db[collectionName] = db[collectionName] || [];
    db[collectionName].push(document);
    saveLocalDb(db);
    return document;
  }
}

export async function updateDocument(collectionName, id, updates) {
  if (isSupabaseEnabled) {
    const { data, error } = await supabase.from(collectionName).update(updates).eq('id', id).select();
    if (error) throw error;
    return data[0];
  } else {
    const db = getLocalDb();
    if (!db) return null;
    db[collectionName] = db[collectionName] || [];
    const index = db[collectionName].findIndex(item => item.id === id);
    if (index !== -1) {
      db[collectionName][index] = { ...db[collectionName][index], ...updates, updated_at: new Date().toISOString() };
      saveLocalDb(db);
      return db[collectionName][index];
    }
    return null;
  }
}

export async function deleteDocument(collectionName, id) {
  if (isSupabaseEnabled) {
    const { error } = await supabase.from(collectionName).delete().eq('id', id);
    if (error) throw error;
    return true;
  } else {
    const db = getLocalDb();
    if (!db) return false;
    db[collectionName] = db[collectionName] || [];
    const initialLen = db[collectionName].length;
    db[collectionName] = db[collectionName].filter(item => item.id !== id);
    saveLocalDb(db);
    return db[collectionName].length < initialLen;
  }
}

export async function deleteDocumentsBatch(collectionName, ids) {
  if (isSupabaseEnabled) {
    const { error } = await supabase.from(collectionName).delete().in('id', ids);
    if (error) throw error;
    return true;
  } else {
    const db = getLocalDb();
    if (!db) return false;
    db[collectionName] = db[collectionName] || [];
    db[collectionName] = db[collectionName].filter(item => !ids.includes(item.id));
    saveLocalDb(db);
    return true;
  }
}

// Specialised helper for Hubla webhook and custom registration logic
export function getLocalDbSync() {
  return getLocalDb();
}
export function saveLocalDbSync(data) {
  saveLocalDb(data);
}
