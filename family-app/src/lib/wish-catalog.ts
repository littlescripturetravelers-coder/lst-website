// Starter ideas for "Our list". Each parent answers privately (Yes / Maybe / No thanks); only ideas you BOTH said yes to
// show on the shared list. Keys are stable: never change one, or people lose their answers. Add new ideas with new keys.
// Intimacy ideas are text only, tasteful, for a married couple, and never shown to children (parents-only RLS, migration 0016).

export type WishKind = 'date' | 'trip' | 'project' | 'intimacy';
export type Wish = { key: string; title: string; detail?: string; group?: string; custom?: boolean; mine?: boolean };

export const KINDS: { kind: WishKind; name: string; icon: string; blurb: string }[] = [
  { kind: 'date', name: 'Date nights', icon: 'heart', blurb: 'Dates you’d both enjoy' },
  { kind: 'trip', name: 'Trips', icon: 'map', blurb: 'Getaways and yearly trips' },
  { kind: 'project', name: 'Home projects', icon: 'hammer', blurb: 'Things to build or fix together' },
  { kind: 'intimacy', name: 'Intimacy', icon: 'flame', blurb: 'Just between the two of you' },
];

export const CATALOG: Record<WishKind, Wish[]> = {
  date: [
    { key: 'd:picnic-sunset', title: 'Sunset picnic', detail: 'Simple food, a blanket, and a view.' },
    { key: 'd:cook-new', title: 'Cook a new recipe together', detail: 'Pick a cuisine neither of you has made.' },
    { key: 'd:first-date', title: 'Recreate our first date', detail: 'Same place or the closest thing to it.' },
    { key: 'd:stargaze', title: 'Stargazing', detail: 'Drive out of town, bring cocoa and a blanket.' },
    { key: 'd:dance-class', title: 'Take a dance class', detail: 'Salsa, swing or line dancing.' },
    { key: 'd:game-night', title: 'Board game night for two', detail: 'Loser plans the next date.' },
    { key: 'd:hike', title: 'Hike to a lookout', detail: 'Pack a snack for the top.' },
    { key: 'd:movie-fort', title: 'Living room movie fort', detail: 'Blankets, pillows and a favorite movie.' },
    { key: 'd:breakfast-out', title: 'Breakfast date', detail: 'Before the day gets busy.' },
    { key: 'd:temple-walk', title: 'Walk the temple grounds or a garden', detail: 'Slow, quiet and talking.' },
    { key: 'd:concert', title: 'Live music or a local concert' },
    { key: 'd:service', title: 'Serve someone together', detail: 'Bring a meal, rake a neighbor’s leaves.' },
    { key: 'd:painting', title: 'Paint-and-sip at home', detail: 'Same picture, side by side.' },
    { key: 'd:bucket', title: 'Write our bucket list', detail: 'Ten things each, then compare.' },
  ],
  trip: [
    { key: 't:cabin', title: 'Cabin weekend', detail: 'Fireplace, books and no schedule.' },
    { key: 't:beach', title: 'Beach trip' },
    { key: 't:city', title: 'City weekend', detail: 'Museums, food and walking.' },
    { key: 't:national-park', title: 'A national park', detail: 'Pick one neither of us has seen.' },
    { key: 't:road-trip', title: 'Road trip with no plan', detail: 'Choose a direction and go.' },
    { key: 't:anniversary', title: 'Yearly anniversary getaway', detail: 'Same weekend every year.' },
    { key: 't:hot-springs', title: 'Hot springs or a spa' },
    { key: 't:family-trip', title: 'Big family trip with the kids' },
    { key: 't:camping', title: 'Camping under the stars' },
    { key: 't:abroad', title: 'A trip abroad someday', detail: 'Start saving a little each month.' },
  ],
  project: [
    { key: 'p:garden', title: 'Plant a garden', detail: 'Start with herbs or tomatoes.' },
    { key: 'p:paint-room', title: 'Paint a room' },
    { key: 'p:declutter', title: 'Declutter one room a month' },
    { key: 'p:backyard', title: 'Make the backyard cozy', detail: 'String lights, chairs, a fire pit.' },
    { key: 'p:photo-wall', title: 'Family photo wall' },
    { key: 'p:reading-nook', title: 'A reading nook for the kids' },
    { key: 'p:garage', title: 'Organize the garage' },
    { key: 'p:bedroom-refresh', title: 'Refresh our bedroom', detail: 'New bedding, calm colors, no clutter.' },
    { key: 'p:build', title: 'Build something together', detail: 'A bench, a shelf, a planter box.' },
    { key: 'p:budget', title: 'Set up a family budget we both like' },
  ],
  intimacy: [
    { key: 'i:long-kiss', group: 'Connection', title: 'A slow kiss for a full minute', detail: 'No rushing, no phones.' },
    { key: 'i:massage', group: 'Connection', title: 'Massage night', detail: 'Warm oil, take turns, no agenda.' },
    { key: 'i:shower', group: 'Connection', title: 'Shower or bath together' },
    { key: 'i:candles', group: 'Connection', title: 'Candles and our own playlist' },
    { key: 'i:undress', group: 'Connection', title: 'Undress each other slowly' },
    { key: 'i:compliments', group: 'Connection', title: 'Say what you love about each other’s body', detail: 'One thing each, out loud.' },
    { key: 'i:morning', group: 'Connection', title: 'Morning time before the kids wake up' },
    { key: 'i:touch-only', group: 'Something new', title: 'A night of touch only', detail: 'Go slow and see where it leads.' },
    { key: 'i:new-position', group: 'Something new', title: 'Try a new position', detail: 'Pick one together beforehand.' },
    { key: 'i:new-room', group: 'Something new', title: 'Somewhere other than the bedroom', detail: 'At home, kids asleep, door locked.' },
    { key: 'i:blindfold', group: 'Something new', title: 'Blindfold for the one receiving' },
    { key: 'i:in-charge', group: 'Something new', title: 'Take turns being in charge', detail: 'One of you leads the whole night.' },
    { key: 'i:hotel', group: 'Something new', title: 'A hotel night without the kids' },
    { key: 'i:all-day-tease', group: 'Something new', title: 'Build anticipation all day', detail: 'Notes, texts and a plan for tonight.' },
    { key: 'i:strangers', group: 'Role play and fantasy', title: 'Meet as strangers', detail: 'Arrive separately and “pick each other up”.' },
    { key: 'i:share-fantasy', group: 'Role play and fantasy', title: 'Share one fantasy each', detail: 'Just talk about it. No judgment, no pressure.' },
    { key: 'i:dress-up', group: 'Role play and fantasy', title: 'Dress up for each other' },
    { key: 'i:outfit', group: 'Role play and fantasy', title: 'An outfit chosen by your spouse' },
    { key: 'i:letter', group: 'Role play and fantasy', title: 'Write each other a steamy letter' },
    { key: 'i:role-play', group: 'Role play and fantasy', title: 'A role play you choose together' },
    { key: 'i:truth-dare', group: 'Playful', title: 'Truth or dare, couples edition' },
    { key: 'i:dice', group: 'Playful', title: 'A dice game for what comes next' },
    { key: 'i:strip-game', group: 'Playful', title: 'A strip version of a card game' },
    { key: 'i:slow-dance', group: 'Playful', title: 'Slow dance in the dark' },
  ],
};
