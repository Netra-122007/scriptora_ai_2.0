import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AppSettings, RecognitionResult } from '../types';

let client: SupabaseClient | null = null;
let userIdPromise: Promise<string> | null = null;

function getClient(): SupabaseClient {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect the database.');
  }

  client ??= createClient(url, anonKey);
  return client;
}

async function getUserId(): Promise<string> {
  if (!userIdPromise) {
    userIdPromise = (async () => {
      const supabase = getClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (sessionData.session?.user) return sessionData.session.user.id;

      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      if (!data.user) throw new Error('Supabase did not return a user for anonymous sign-in.');
      return data.user.id;
    })().catch((error: unknown) => {
      userIdPromise = null;
      throw error;
    });
  }

  return userIdPromise;
}

export async function loadUserData(): Promise<{
  settings: AppSettings | null;
  history: RecognitionResult[];
}> {
  const supabase = getClient();
  const userId = await getUserId();
  const [settingsResult, historyResult] = await Promise.all([
    supabase.from('user_settings').select('settings').eq('user_id', userId).maybeSingle(),
    supabase
      .from('recognition_history')
      .select('note')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ]);

  if (settingsResult.error) throw settingsResult.error;
  if (historyResult.error) throw historyResult.error;

  return {
    settings: settingsResult.data?.settings as AppSettings | null,
    history: (historyResult.data ?? []).map((row) => row.note as RecognitionResult),
  };
}

export async function saveUserSettings(settings: AppSettings): Promise<void> {
  const supabase = getClient();
  const userId = await getUserId();
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, settings }, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function saveRecognitionResult(note: RecognitionResult): Promise<void> {
  const supabase = getClient();
  const userId = await getUserId();
  const { error } = await supabase
    .from('recognition_history')
    .upsert({ user_id: userId, id: note.id, note }, { onConflict: 'user_id,id' });
  if (error) throw error;
}

export async function deleteRecognitionResult(id: string): Promise<void> {
  const supabase = getClient();
  const userId = await getUserId();
  const { error } = await supabase
    .from('recognition_history')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
}

export async function clearRecognitionHistory(): Promise<void> {
  const supabase = getClient();
  const userId = await getUserId();
  const { error } = await supabase
    .from('recognition_history')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
}
