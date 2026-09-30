// The five love languages (Gary Chapman). Our own short quiz (not the official one): 10 either/or choices → ranked languages.
export type LL = 'words' | 'service' | 'gifts' | 'time' | 'touch';
export const LOVE: Record<LL, { name: string; icon: string; ideas: string[] }> = {
  words: { name: 'Words of affirmation', icon: 'message-circle-heart', ideas: ['Text one specific thing you admired today', 'Leave a note on the bathroom mirror', 'Tell the kids, in front of them, what you love about their mom/dad', 'Write a letter for your anniversary box'] },
  service: { name: 'Acts of service', icon: 'hand-helping', ideas: ['Take a chore off their list without being asked', 'Handle bedtime solo tonight', 'Fill up their car with gas', 'Prep tomorrow’s lunches'] },
  gifts: { name: 'Receiving gifts', icon: 'gift', ideas: ['Pick up their favorite treat on the way home', 'A small “saw this and thought of you”', 'Frame a photo of the two of you', 'Let the kids make them a card'] },
  time: { name: 'Quality time', icon: 'clock', ideas: ['20 minutes, phones in another room', 'Walk after the kids are down', 'Cook dinner together', 'Plan a date this week, and you book the sitter'] },
  touch: { name: 'Physical touch', icon: 'hand-heart', ideas: ['A long hug when they get home', 'Hold hands on the walk', 'Back or shoulder rub tonight', 'Sit close on the couch'] },
};
export const QUIZ: [string, LL, string, LL][] = [
  ['Hearing “I’m proud of you”', 'words', 'A long, unhurried talk', 'time'],
  ['Coming home to the dishes done', 'service', 'A hug the second I walk in', 'touch'],
  ['A little surprise “thinking of you” gift', 'gifts', 'A sweet note or text', 'words'],
  ['A whole evening, just us', 'time', 'Help with something I’ve been dreading', 'service'],
  ['Holding hands', 'touch', 'Something thoughtful they picked out', 'gifts'],
  ['Being thanked for what I do', 'words', 'Help without having to ask', 'service'],
  ['A walk together with no phones', 'time', 'Sitting close on the couch', 'touch'],
  ['A gift on an ordinary day', 'gifts', 'Them taking the kids so I can rest', 'service'],
  ['A kiss goodbye', 'touch', 'Hearing what they love about me', 'words'],
  ['Planning a date for us', 'time', 'A souvenir from their trip', 'gifts'],
];
export function score(answers: LL[]) { const s: Record<LL, number> = { words: 0, service: 0, gifts: 0, time: 0, touch: 0 }; answers.forEach(a => s[a]++); return { scores: s, ranked: (Object.keys(s) as LL[]).sort((a, b) => s[b] - s[a]) }; }
