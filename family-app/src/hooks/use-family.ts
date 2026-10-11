import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Family, SEED_FAMILY } from '@/lib/family';
// When one screen changes the family (faith, names, dates), every open screen reloads it.
const listeners = new Set<() => void>();
export const familyChanged = () => listeners.forEach(f => f());
export function useFamily() {
  const [family, setFamily] = useState<Family | null>(null); const [uid, setUid] = useState<string | null>(null);
  const load = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id ?? null; setUid(userId);
    const { data: me } = await supabase.from('family_members').select('family_id').eq('user_id', userId).maybeSingle();
    if (!me) { setFamily({ id: 'local', ...SEED_FAMILY }); return; }
    const [{ data: f }, { data: ms }] = await Promise.all([supabase.from('families').select('*').eq('id', me.family_id).single(), supabase.from('family_members').select('*').eq('family_id', me.family_id)]);
    setFamily({ id: f.id, surname: f.surname, display_name: f.display_name, faith: f.faith, anniversary: f.anniversary, members: (ms || []).map((m: any) => ({ id: m.slug, name: m.name, full: m.full_name, role: m.role, sex: m.sex, birthday: m.birthday, color: m.color, love_languages: m.love_languages, user_id: m.user_id, can_login: m.can_login, kid_sections: m.kid_sections, private_ok: m.private_ok })) });
  };
  useEffect(() => { load(); listeners.add(load); return () => { listeners.delete(load); }; }, []);
  const saveMember = async (slug: string, patch: { full_name?: string; name?: string; birthday?: string }) => { if (!family) return; await supabase.from('family_members').update(patch).eq('family_id', family.id).eq('slug', slug); load(); };
  const saveAnniversary = async (date: string) => { if (!family) return; await supabase.from('families').update({ anniversary: date }).eq('id', family.id); load(); };
  // Parents always may keep private items; a child only after a parent turns it on.
  const me = family?.members.find((m: any) => uid && m.user_id === uid) as any;
  const canPrivate = !!me && (me.role === 'dad' || me.role === 'mom' || !!me.private_ok);
  const setPrivateOk = async (slug: string, on: boolean) => { if (!family) return; await supabase.from('family_members').update({ private_ok: on }).eq('family_id', family.id).eq('slug', slug); load(); };
  return { family, me, uid, canPrivate, reload: load, saveMember, saveAnniversary, setPrivateOk };
}
