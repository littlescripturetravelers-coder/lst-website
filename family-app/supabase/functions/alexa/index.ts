// Alexa Custom Skill endpoint (HTTPS). Account linking uses Supabase Auth (OAuth 2 authorization code) so the access token is a Supabase JWT.
// In production also verify the request signature + timestamp (Alexa "SignatureCertChainUrl") and check applicationId === ALEXA_SKILL_ID.
import { familyFor, ok } from '../_shared/ctx.ts';
import { addReminder, todaySummary, dateIdea, lanternVerse, askAnything, whatsForMeal } from '../_shared/voice-actions.ts';

const speak = (text: string, end = true, reprompt?: string) => ok({ version: '1.0', response: { outputSpeech: { type: 'PlainText', text }, reprompt: reprompt ? { outputSpeech: { type: 'PlainText', text: reprompt } } : undefined, shouldEndSession: end } });
const slot = (i: any, n: string) => i?.slots?.[n]?.value as string | undefined;

Deno.serve(async req => {
  const body = await req.json();
  if (body.context?.System?.application?.applicationId !== Deno.env.get('ALEXA_SKILL_ID')) return new Response('bad app', { status: 403 });
  const token = body.context?.System?.user?.accessToken;
  if (!token) return ok({ version: '1.0', response: { outputSpeech: { type: 'PlainText', text: 'Please link your Lewis Family account in the Alexa app.' }, card: { type: 'LinkAccount' }, shouldEndSession: true } });
  const f = await familyFor(new Request('http://x', { headers: { authorization: 'Bearer ' + token } }));
  const r = body.request;
  if (r.type === 'LaunchRequest') return speak('Hi from the Lewis family app. You can say, what’s today, add a reminder, give us a date idea, or what’s today’s scripture.', false, 'What would you like?');
  if (r.type !== 'IntentRequest') return speak('Goodbye.');
  const i = r.intent;
  switch (i.name) {
    case 'AddReminderIntent': { const what = slot(i, 'task'); if (!what) return speak('What should I remind you about?', false, 'What’s the reminder?');
      const when = [slot(i, 'date'), slot(i, 'time')].filter(Boolean).join(' '); return speak(await addReminder(f, what, when || undefined, slot(i, 'list'))); }
    case 'TodayIntent': return speak(await todaySummary(f));
    case 'DateIdeaIntent': return speak(await dateIdea(f, (slot(i, 'who') || '').match(/girl|kid|daughter/) ? 'girls' : 'couple'));
    case 'LanternIntent': return speak(await lanternVerse(f));
    case 'MealIntent': return speak(await whatsForMeal(f, (slot(i, 'meal') || 'dinner').toLowerCase()));
    case 'ShoppingIntent': { const item = slot(i, 'item'); return item ? speak(await addReminder(f, item, undefined, 'groceries')) : speak('What should I add to the shopping list?', false, 'What should I add?'); }
    case 'AskIntent': return speak(await askAnything(f, slot(i, 'question') ?? ''));
    case 'AMAZON.HelpIntent': return speak('Try: add pick up milk tomorrow at five, or what’s on today.', false, 'What would you like?');
    default: return speak('Okay.');
  }
});
