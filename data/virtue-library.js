/* =============================================================================
   THE VIRTUE LIBRARY  —  Little Scripture Travelers
   -----------------------------------------------------------------------------
   The growing catalog behind virtue-library.html.

   ***************************************************************************
   READ THIS FIRST — a story lives in TWO PLACES (updated 2026-08-19)
   ***************************************************************************
   THIS FILE IS PUBLIC. Anyone on the internet can download it. It holds only
   what we are happy for a stranger to read: titles, scriptures, virtues,
   teaching notes, and a 40-word teaser.

   THE STORY TEXT LIVES IN SUPABASE, in the table `story_texts`. A row is
   returned only to a subscriber (or to anyone, for a free story) because of a
   row-level-security policy on that table. Postgres enforces the paywall, so
   editing the website's JavaScript gets a reader nothing.

   *** NEVER paste story text, the Feeling Moment (fork), Remember This, or  ***
   *** the Parent Prompt into THIS file. Doing so makes it free to everyone. ***

   (Historical note: this used to describe api/_lib/stories-full.json and a
   server at /api/library. That server was never built and no longer exists.
   Ignore any older instructions mentioning it.)

   ---------------------------------------------------------------------------
   HOW TO ADD STORIES — the whole job is two halves
   ---------------------------------------------------------------------------
   HALF 1 (public, here): add one object to the `stories` array below.
   HALF 2 (private, Supabase): insert the text into `story_texts`.
              A ready-made template is in  sql/TEMPLATE-add-story-text.sql
              Levi pastes the finished SQL into the Supabase SQL editor.

   The `id` must be IDENTICAL in both halves — that is the only thing tying
   them together.

   FIELDS for half 1 (note: NO story / fork / rememberThis / prompt here):

     id            "b9-w1-n1"          book / week / night — must be unique
     title         "The Happy Little Tree"
     volume        "ot"                ot | nt | bom | dc
     book          9                   the month number in the series
     bookTitle     "Wonderful Is His Way"
     month         "September"
     week          1
     night         1
     scripture     "Psalm 1"           as printed on the story page
     scriptureBook "Psalm"             just the book — powers the By Scripture axis
     traveler      "beau"              beau | scout | willow | wren
     feeling        "worried"          must match an id in `feelings` below
     teaser         "first 40 words…"  the free taste. Keep it SHORT.
     wordCount      118                whole story, shown as "118 words"
     virtues        ["courage","faith"]   ids from `virtues` — most central FIRST
     primaryVirtue  "courage"
     teachingNote   "Reach for this when..."   ONE sentence, written to the parent
     stages         ["toddler","preschool"]    which stages this story serves

   ...then write half 2 as SQL, keyed by the SAME id — see
   sql/TEMPLATE-add-story-text.sql for a fill-in-the-blanks version:

       insert into public.story_texts (id, story, fork, remember_this, prompt)
       values ('b9-w1-n1',
               '["para 1","para 2"]'::jsonb,
               'The Feeling Moment...', 'Remember this...', 'Parent prompt...')
       on conflict (id) do update set
         story = excluded.story, fork = excluded.fork,
         remember_this = excluded.remember_this, prompt = excluded.prompt;

   ---------------------------------------------------------------------------
   HOW TO CHANGE WHICH STORIES ARE FREE
   ---------------------------------------------------------------------------
   Two places, and BOTH matter:
     1. `meta.freeStoryIds` below — labels the cards as "Free".
     2. `story_texts.is_free` in Supabase — actually unlocks the text:
            update public.story_texts set is_free = true  where id in (...);
            update public.story_texts set is_free = false where id not in (...);
   Number 2 is the one that decides. Keep them in step.

   ---------------------------------------------------------------------------
   HOW TO ADD A NEW VIRTUE  (only when a story teaches something uncovered)
   ---------------------------------------------------------------------------
   Add to `virtues`:  { id, name, category, definition }
   category must be one of: character | heart | faith | family
   Then tag the story with the new id. It appears in the catalog immediately.

   ---------------------------------------------------------------------------
   HOW TO OPEN A NEW AGE STAGE  (when you start writing for older children)
   ---------------------------------------------------------------------------
   In `stages`, change that stage's  status:"planned"  ->  status:"active".
   Then list its id in each story's `stages` array. The stage filter and the
   "Built to Grow With Your Child" strip both update on their own.

   VOICE RULE: always "Heavenly Father" — never the word "God".
   ============================================================================= */

window.LST_LIBRARY = {
 "meta": {
  "version": "2.0",
  "updated": "October 2026",
  "plannedTotal": 1440,
  "storyCount": 728,
  "note": "Old Testament, ages 1-5. Stages beyond preschool are planned, not yet written.",
  "gated": true,
  "freeStoryIds": [
   "b6-w3-n1",
   "b7-w1-n7",
   "b6-w3-n4"
  ]
 },
 "stages": [
  {
   "id": "toddler",
   "name": "Toddler",
   "ages": "1–3",
   "status": "active",
   "shortName": "Ages 1–3",
   "developmental": "Learning that feelings have names and that a grown-up will help. Attention is measured in seconds, not minutes.",
   "teachingNote": "Keep it to one idea and one sentence. Let them move their body. The story is the hug, not the lesson."
  },
  {
   "id": "preschool",
   "name": "Preschool",
   "ages": "3–5",
   "status": "active",
   "shortName": "Ages 3–5",
   "developmental": "Beginning to see cause and choice — that what I do lands on someone else. Loves repetition and being the hero.",
   "teachingNote": "Ask 'what would you have done?' and let the answer be imperfect. The Fork in the Five Stones is your best tool here."
  },
  {
   "id": "early-elementary",
   "name": "Early Elementary",
   "ages": "6–8",
   "status": "planned",
   "shortName": "Ages 6–8",
   "developmental": "Fairness becomes enormous. Wants rules, and wants to know why the rule exists.",
   "teachingNote": "This is where 'because I said so' stops working. Stories that show a consequence unfolding will carry the most weight."
  },
  {
   "id": "late-elementary",
   "name": "Late Elementary",
   "ages": "9–11",
   "status": "planned",
   "shortName": "Ages 9–11",
   "developmental": "Comparing themselves to peers constantly. Starting to hold a private inner life.",
   "teachingNote": "Integrity — who they are when nobody is watching — becomes the central question of this stage."
  },
  {
   "id": "early-teen",
   "name": "Early Adolescence",
   "ages": "12–14",
   "status": "planned",
   "shortName": "Ages 12–14",
   "developmental": "Identity is under construction and belonging feels like survival. Big feelings arrive faster than the words for them.",
   "teachingNote": "Ask more than you tell. A story they get to interpret themselves will outlive one you explain to them."
  },
  {
   "id": "teen",
   "name": "Teen",
   "ages": "15–17",
   "status": "planned",
   "shortName": "Ages 15–17",
   "developmental": "Testing whether what you taught them holds up outside the house. Wants to be treated as capable.",
   "teachingNote": "Bring the hard scriptures — the ones with real cost and real doubt. They can tell when you are protecting them from the text."
  },
  {
   "id": "young-adult",
   "name": "Young Adult",
   "ages": "18+",
   "status": "planned",
   "shortName": "Ages 18+",
   "developmental": "Choosing for themselves what to carry forward. Your influence is now invitation, not instruction.",
   "teachingNote": "You are no longer teaching down. You are studying alongside — and they will notice the difference."
  }
 ],
 "travelers": [
  {
   "id": "beau",
   "name": "Beau the Brave",
   "motto": "Big heart, brave start!",
   "domain": "Courage · Faith · Obedience",
   "virtues": [
    "courage",
    "faith",
    "obedience",
    "stand-for-truth",
    "trust-in-god"
   ]
  },
  {
   "id": "scout",
   "name": "Scout the Seeker",
   "motto": "Look and see — what could it be?",
   "domain": "Curiosity · Wonder · Hope",
   "virtues": [
    "curiosity",
    "wonder",
    "hope",
    "diligence"
   ]
  },
  {
   "id": "willow",
   "name": "Willow the Warm",
   "motto": "Warm hugs, warm hearts!",
   "domain": "Compassion · Kindness · Forgiveness · Gratitude",
   "virtues": [
    "compassion",
    "kindness",
    "forgiveness",
    "gratitude",
    "generosity",
    "service"
   ]
  },
  {
   "id": "wren",
   "name": "Wren the Wonderer",
   "motto": "Pause and ponder — what a wonder!",
   "domain": "Wisdom · Reverence · Humility · Patience",
   "virtues": [
    "wisdom",
    "reverence",
    "humility",
    "patience",
    "pondering",
    "love-of-scripture"
   ]
  }
 ],
 "virtues": [
  {
   "id": "honesty",
   "name": "Honesty & Truth-Telling",
   "category": "character",
   "definition": "Telling the truth even when a lie would be easier, and letting your words match what really happened."
  },
  {
   "id": "obedience",
   "name": "Obedience",
   "category": "character",
   "definition": "Choosing to follow Heavenly Father and the people He has given to guide you — the first time, and with a willing heart."
  },
  {
   "id": "heeding-counsel",
   "name": "Heeding Wise Counsel",
   "category": "character",
   "definition": "Listening to parents, prophets, and teachers who can see further down the road than you can."
  },
  {
   "id": "self-control",
   "name": "Self-Control",
   "category": "character",
   "definition": "Feeling a strong feeling all the way through without letting it choose your hands or your words for you."
  },
  {
   "id": "diligence",
   "name": "Diligence & Hard Work",
   "category": "character",
   "definition": "Staying with a good thing after the excitement wears off, one small step at a time."
  },
  {
   "id": "perseverance",
   "name": "Not Giving Up",
   "category": "character",
   "definition": "Trying again after it did not work, because hard is not the same as impossible."
  },
  {
   "id": "integrity",
   "name": "Integrity",
   "category": "character",
   "definition": "Being the same child when nobody is watching as when everybody is."
  },
  {
   "id": "stand-for-truth",
   "name": "Standing for What's Right",
   "category": "character",
   "definition": "Speaking up for truth kindly, even when you are the only one, and even when your tummy flutters."
  },
  {
   "id": "keeping-promises",
   "name": "Keeping Promises",
   "category": "character",
   "definition": "Doing the thing you said you would do, so people can rest their weight on your word."
  },
  {
   "id": "courage",
   "name": "Courage",
   "category": "heart",
   "definition": "Doing the good and needful thing while you are still afraid — not waiting for the fear to leave first."
  },
  {
   "id": "kindness",
   "name": "Kindness",
   "category": "heart",
   "definition": "Noticing what would make someone's moment softer, and then doing it."
  },
  {
   "id": "compassion",
   "name": "Compassion",
   "category": "heart",
   "definition": "Letting someone else's hurt actually reach your heart, and moving toward them because of it."
  },
  {
   "id": "forgiveness",
   "name": "Forgiveness",
   "category": "heart",
   "definition": "Setting down what someone owes you, the way Heavenly Father sets down what you owe Him."
  },
  {
   "id": "repentance",
   "name": "Repentance & Making It Right",
   "category": "heart",
   "definition": "Turning around, saying the honest words, and repairing what your choice broke."
  },
  {
   "id": "gratitude",
   "name": "Gratitude",
   "category": "heart",
   "definition": "Seeing what you already have clearly enough to say thank you for it out loud."
  },
  {
   "id": "contentment",
   "name": "Contentment",
   "category": "heart",
   "definition": "Being at peace with your own portion instead of measuring it against your brother's."
  },
  {
   "id": "generosity",
   "name": "Sharing & Generosity",
   "category": "heart",
   "definition": "Opening your hands on purpose, because what you hold was given to you first."
  },
  {
   "id": "service",
   "name": "Service",
   "category": "heart",
   "definition": "Using your hands for somebody else's good without being asked and without keeping score."
  },
  {
   "id": "peacemaking",
   "name": "Peacemaking",
   "category": "heart",
   "definition": "Being the one who makes the room calmer instead of louder."
  },
  {
   "id": "patience",
   "name": "Patience",
   "category": "heart",
   "definition": "Waiting well — keeping a soft heart during the part that takes longer than you wanted."
  },
  {
   "id": "comfort",
   "name": "Comfort in Sorrow",
   "category": "heart",
   "definition": "Knowing that sadness is allowed, that it is safe to cry, and that you are held while you do."
  },
  {
   "id": "faith",
   "name": "Faith",
   "category": "faith",
   "definition": "Trusting Heavenly Father enough to take the next step before you can see the whole path."
  },
  {
   "id": "trust-in-god",
   "name": "Trusting Heavenly Father",
   "category": "faith",
   "definition": "Resting in the truth that He is good and He is near, especially when things are hard."
  },
  {
   "id": "prayer",
   "name": "Prayer",
   "category": "faith",
   "definition": "Talking to Heavenly Father like He is really there — because He is — and then listening."
  },
  {
   "id": "reverence",
   "name": "Reverence",
   "category": "faith",
   "definition": "Treating holy things gently, with a quiet body and a soft heart."
  },
  {
   "id": "love-of-scripture",
   "name": "Loving the Scriptures",
   "category": "faith",
   "definition": "Treasuring Heavenly Father's words, returning to them, and letting them shape how you live."
  },
  {
   "id": "pondering",
   "name": "Pondering & Slowing Down",
   "category": "faith",
   "definition": "Stopping long enough for a good thing to sink in instead of rushing to the next page."
  },
  {
   "id": "humility",
   "name": "Humility",
   "category": "faith",
   "definition": "Being teachable — willing to be corrected, and willing to need help."
  },
  {
   "id": "hope",
   "name": "Hope",
   "category": "faith",
   "definition": "Expecting good ahead because of who Heavenly Father is, not because of how today went."
  },
  {
   "id": "wisdom",
   "name": "Wisdom",
   "category": "faith",
   "definition": "Knowing what to do with what you know, and asking Heavenly Father when you don't."
  },
  {
   "id": "wonder",
   "name": "Wonder",
   "category": "faith",
   "definition": "Letting yourself be amazed — the doorway the Spirit most often walks through."
  },
  {
   "id": "curiosity",
   "name": "Curiosity",
   "category": "faith",
   "definition": "Asking the next honest question and trusting that truth can hold it."
  },
  {
   "id": "identity",
   "name": "You Are a Child of Heavenly Father",
   "category": "faith",
   "definition": "Knowing your worth was settled before you got here and cannot be earned or lost today."
  },
  {
   "id": "honoring-parents",
   "name": "Honoring Parents",
   "category": "family",
   "definition": "Treating the people who care for you as though their love has authority in your life."
  },
  {
   "id": "family-love",
   "name": "Family Love & Loyalty",
   "category": "family",
   "definition": "Staying for your people, especially on the days they are hard to stay for."
  },
  {
   "id": "worship-together",
   "name": "Worshipping Together",
   "category": "family",
   "definition": "Gathering with others to learn Heavenly Father's word, because some joy only comes in company."
  }
 ],
 "feelings": [
  {
   "id": "angry",
   "name": "Angry",
   "body": "Hot face, tight fists, hard jaw, loud voice, fast breathing",
   "mind": "“That's not fair.” “I want it now.” “I need to fight.”",
   "response": "Create safety, push against a wall, breathe, use firm words, ask for help",
   "virtues": [
    "self-control",
    "peacemaking",
    "forgiveness"
   ]
  },
  {
   "id": "sad",
   "name": "Sad",
   "body": "Tears, heavy body, slumped shoulders, low energy, tight throat",
   "mind": "“I lost something.” “Nobody cares.” “It won't get better.”",
   "response": "Connection, cry safely, name the loss, ask for comfort, choose one small next thing",
   "virtues": [
    "comfort",
    "hope",
    "trust-in-god"
   ]
  },
  {
   "id": "worried",
   "name": "Worried or Afraid",
   "body": "Fast heart, shaky legs, tummy pain, hiding, freezing",
   "mind": "“Something bad will happen.” “I can't do it.”",
   "response": "Reassure safety, slow exhale, check facts, make a small brave plan",
   "virtues": [
    "courage",
    "faith",
    "trust-in-god",
    "prayer"
   ]
  },
  {
   "id": "nervous",
   "name": "Nervous",
   "body": "Flutter in the tummy, quiet voice, wanting to hide",
   "mind": "“What if they think I'm strange?”",
   "response": "Name the flutter, take one slow breath, say the true thing kindly",
   "virtues": [
    "courage",
    "stand-for-truth",
    "prayer"
   ]
  },
  {
   "id": "disappointed",
   "name": "Disappointed",
   "body": "Drooping face, whining, crying, crossed arms",
   "mind": "“It was supposed to happen my way.”",
   "response": "Name what they hoped for, allow sadness, identify what can still happen",
   "virtues": [
    "patience",
    "contentment",
    "hope"
   ]
  },
  {
   "id": "jealous",
   "name": "Jealous",
   "body": "Tight chest, staring, grabbing, pushing into attention",
   "mind": "“They have more.” “I am being forgotten.”",
   "response": "Reassure connection, name the want, practice gratitude and requesting",
   "virtues": [
    "contentment",
    "gratitude",
    "generosity",
    "identity"
   ]
  },
  {
   "id": "embarrassed",
   "name": "Embarrassed",
   "body": "Hot cheeks, hiding face, looking down, nervous laughter",
   "mind": "“Everyone thinks I'm bad.” “I can't try again.”",
   "response": "Normalize mistakes, offer privacy, repair if needed, practice trying again",
   "virtues": [
    "repentance",
    "humility",
    "honesty",
    "identity"
   ]
  },
  {
   "id": "excited",
   "name": "Excited",
   "body": "Bouncy body, loud voice, fast talking, trouble waiting",
   "mind": "“I need to do it right now.”",
   "response": "Celebrate, then slow the body, practice waiting and gentle hands",
   "virtues": [
    "patience",
    "self-control",
    "gratitude"
   ]
  },
  {
   "id": "frustrated",
   "name": "Frustrated",
   "body": "Grunting, tense hands, throwing materials, giving up",
   "mind": "“I can't do this.” “It has to work now.”",
   "response": "Pause, break the task into one small step, ask for help, try a different way",
   "virtues": [
    "perseverance",
    "diligence",
    "humility",
    "patience"
   ]
  },
  {
   "id": "eager",
   "name": "Eager",
   "body": "Leaning in, bright eyes, reaching, wanting more",
   "mind": "“I want to know!” “Again!”",
   "response": "Feed the hunger, then slow down so the good part can land",
   "virtues": [
    "love-of-scripture",
    "curiosity",
    "pondering",
    "wonder"
   ]
  },
  {
   "id": "calm",
   "name": "Calm",
   "body": "Loose muscles, steady breathing, comfortable tummy",
   "mind": "“I can think.” “I have choices.”",
   "response": "Notice and remember how calm feels",
   "virtues": [
    "reverence",
    "pondering",
    "patience"
   ]
  },
  {
   "id": "happy",
   "name": "Happy",
   "body": "Smiling, open posture, playful energy",
   "mind": "“I like this.” “I want to share this.”",
   "response": "Enjoy it, express gratitude, include others",
   "virtues": [
    "gratitude",
    "generosity",
    "worship-together"
   ]
  },
  {
   "id": "grateful",
   "name": "Grateful",
   "body": "Warm chest, easy smile, relaxed shoulders, wanting to give something back",
   "mind": "“I have enough.” “Somebody thought of me.”",
   "response": "Say it out loud, name the person, thank Heavenly Father by name in prayer",
   "virtues": [
    "gratitude",
    "contentment",
    "worship-together"
   ]
  },
  {
   "id": "brave",
   "name": "Brave",
   "body": "Squared shoulders, steady breath, chin up, heart still pounding a little",
   "mind": "“I’m scared and I’m doing it anyway.”",
   "response": "Name the fear first, then take one small step, then celebrate the step",
   "virtues": [
    "courage",
    "faith",
    "stand-for-truth"
   ]
  },
  {
   "id": "confused",
   "name": "Confused",
   "body": "Furrowed brow, still hands, looking away to think, sometimes tears of frustration",
   "mind": "“I don’t understand.” “Why is it like this?”",
   "response": "Say “that is a good question,” slow down, allow not-knowing, pray about it together",
   "virtues": [
    "wisdom",
    "pondering",
    "faith"
   ]
  },
  {
   "id": "safe",
   "name": "Safe",
   "body": "Loose body, deep slow breathing, leaning in, willing to close their eyes",
   "mind": "“Somebody is watching over me.”",
   "response": "Name what makes it safe, bless them by name, let the moment be quiet",
   "virtues": [
    "trust-in-god",
    "comfort",
    "family-love"
   ]
  },
  {
   "id": "comforted",
   "name": "Comforted",
   "body": "Softening face, slowing tears, body settling into yours",
   "mind": "“I’m not by myself in this.”",
   "response": "Stay longer than feels necessary, say little, let them feel held",
   "virtues": [
    "comfort",
    "compassion",
    "trust-in-god"
   ]
  },
  {
   "id": "connected",
   "name": "Connected",
   "body": "Eye contact, leaning close, wanting to keep talking, unhurried",
   "mind": "“This person is with me.”",
   "response": "Protect the moment, put the phone down, ask one more question",
   "virtues": [
    "family-love",
    "kindness",
    "worship-together"
   ]
  },
  {
   "id": "amazed",
   "name": "Amazed",
   "body": "Wide eyes, open mouth, gone completely still, pointing",
   "mind": "“Look at that!” “How did that happen?”",
   "response": "Look with them, don’t explain it away, tie the wonder back to Heavenly Father",
   "virtues": [
    "wonder",
    "reverence",
    "worship-together"
   ]
  },
  {
   "id": "discouraged",
   "name": "Discouraged",
   "body": "Slumped body, dragging feet, sighing, putting the thing down",
   "mind": "“What’s the point.” “I’ll never be good at this.”",
   "response": "Name how far they already came, shrink the next step, stay next to them for it",
   "virtues": [
    "perseverance",
    "hope",
    "trust-in-god"
   ]
  },
  {
   "id": "distracted",
   "name": "Distracted",
   "body": "Wandering eyes, fidgeting hands, body turning away, starting three things",
   "mind": "“Something else is more interesting.”",
   "response": "Get down to eye level, one instruction at a time, make it a game before making it a rule",
   "virtues": [
    "self-control",
    "diligence",
    "reverence"
   ]
  },
  {
   "id": "guilty",
   "name": "Guilty",
   "body": "Hiding, avoiding your eyes, going very quiet, tummy ache",
   "mind": "“I did something bad.” “They’ll be mad at me.”",
   "response": "Make it safe to tell the truth before asking for it, separate the child from the choice",
   "virtues": [
    "repentance",
    "honesty",
    "forgiveness"
   ]
  },
  {
   "id": "impatient",
   "name": "Impatient",
   "body": "Bouncing, whining, asking again and again, grabbing",
   "mind": "“I want it NOW.” “Waiting is too hard.”",
   "response": "Give the wait a shape — count it, time it, fill it — then praise the waiting itself",
   "virtues": [
    "patience",
    "self-control",
    "trust-in-god"
   ]
  },
  {
   "id": "loved",
   "name": "Loved",
   "body": "Relaxed everything, soft smile, snuggling in, sleepy",
   "mind": "“I belong to somebody.”",
   "response": "Say their name with it, be specific about why, tell them Heavenly Father feels it too",
   "virtues": [
    "identity",
    "family-love",
    "trust-in-god"
   ]
  }
 ],
 "situations": [
  {
   "id": "lied",
   "name": "My child lied to me",
   "virtues": [
    "honesty",
    "repentance",
    "integrity"
   ],
   "feelings": [
    "embarrassed"
   ]
  },
  {
   "id": "hit",
   "name": "My child hit, yelled, or lost their temper",
   "virtues": [
    "self-control",
    "peacemaking",
    "forgiveness"
   ],
   "feelings": [
    "angry"
   ]
  },
  {
   "id": "wont-share",
   "name": "My child won't share",
   "virtues": [
    "generosity",
    "kindness",
    "contentment"
   ],
   "feelings": [
    "jealous"
   ]
  },
  {
   "id": "jealous-sib",
   "name": "My child is jealous of a sibling",
   "virtues": [
    "contentment",
    "gratitude",
    "identity",
    "family-love"
   ],
   "feelings": [
    "jealous"
   ]
  },
  {
   "id": "afraid-dark",
   "name": "My child is afraid of the dark or bedtime",
   "virtues": [
    "courage",
    "faith",
    "trust-in-god",
    "prayer"
   ],
   "feelings": [
    "worried"
   ]
  },
  {
   "id": "wont-listen",
   "name": "My child won't listen or disobeyed",
   "virtues": [
    "obedience",
    "heeding-counsel",
    "honoring-parents"
   ],
   "feelings": [
    "frustrated"
   ]
  },
  {
   "id": "gave-up",
   "name": "My child gave up when it got hard",
   "virtues": [
    "perseverance",
    "diligence",
    "humility"
   ],
   "feelings": [
    "frustrated"
   ]
  },
  {
   "id": "unkind",
   "name": "My child was unkind to a friend",
   "virtues": [
    "kindness",
    "compassion",
    "repentance"
   ],
   "feelings": [
    "embarrassed"
   ]
  },
  {
   "id": "grief",
   "name": "My child is grieving a loss",
   "virtues": [
    "comfort",
    "hope",
    "trust-in-god"
   ],
   "feelings": [
    "sad"
   ]
  },
  {
   "id": "didnt-get-way",
   "name": "My child didn't get their way",
   "virtues": [
    "patience",
    "contentment",
    "gratitude"
   ],
   "feelings": [
    "disappointed"
   ]
  },
  {
   "id": "anxious-new",
   "name": "My child is anxious about something new",
   "virtues": [
    "courage",
    "faith",
    "trust-in-god"
   ],
   "feelings": [
    "worried"
   ]
  },
  {
   "id": "needs-sorry",
   "name": "My child needs to apologize",
   "virtues": [
    "repentance",
    "humility",
    "forgiveness"
   ],
   "feelings": [
    "embarrassed"
   ]
  },
  {
   "id": "ungrateful",
   "name": "My child seems ungrateful",
   "virtues": [
    "gratitude",
    "contentment",
    "generosity"
   ],
   "feelings": [
    "excited"
   ]
  },
  {
   "id": "excluded",
   "name": "My child was left out or picked on",
   "virtues": [
    "compassion",
    "courage",
    "identity",
    "comfort"
   ],
   "feelings": [
    "sad"
   ]
  },
  {
   "id": "comparing",
   "name": "My child is comparing themselves to others",
   "virtues": [
    "identity",
    "contentment",
    "gratitude"
   ],
   "feelings": [
    "jealous"
   ]
  },
  {
   "id": "hard-to-pray",
   "name": "My child struggles to pray",
   "virtues": [
    "prayer",
    "reverence",
    "faith"
   ],
   "feelings": [
    "worried"
   ]
  },
  {
   "id": "cant-wait",
   "name": "My child interrupts and can't wait",
   "virtues": [
    "patience",
    "self-control",
    "reverence"
   ],
   "feelings": [
    "excited"
   ]
  },
  {
   "id": "hid-it",
   "name": "My child broke something and hid it",
   "virtues": [
    "honesty",
    "repentance",
    "integrity"
   ],
   "feelings": [
    "embarrassed"
   ]
  },
  {
   "id": "scripture-boring",
   "name": "My child says scripture time is boring",
   "virtues": [
    "love-of-scripture",
    "pondering",
    "wonder"
   ],
   "feelings": [
    "frustrated"
   ]
  },
  {
   "id": "wants-to-help",
   "name": "My child wants to help someone",
   "virtues": [
    "service",
    "kindness",
    "compassion"
   ],
   "feelings": [
    "happy"
   ]
  }
 ],
 "books": [
  {
   "book": 1,
   "month": "January",
   "title": "Let There Be Light!"
  },
  {
   "book": 2,
   "month": "February",
   "title": "The Rainbow Promise"
  },
  {
   "book": 3,
   "month": "March",
   "title": "Nothing Is Too Hard for the Lord"
  },
  {
   "book": 4,
   "month": "April",
   "title": "Let My People Go!"
  },
  {
   "book": 5,
   "month": "May",
   "title": "Be Strong and Brave!"
  },
  {
   "book": 6,
   "month": "June",
   "title": "The Lord Looks on the Heart"
  },
  {
   "book": 7,
   "month": "July",
   "title": "There Is a Prophet in Israel",
   "amazon": "https://www.amazon.com/dp/B0H745TTNZ"
  },
  {
   "book": 8,
   "month": "August",
   "title": "I Will Trust and Sing",
   "amazon": "https://www.amazon.com/dp/B0HC53FHHP/"
  },
  {
   "book": 9,
   "month": "September",
   "title": "Wonderful Is His Way",
   "amazon": "https://a.co/d/04uVtSA4"
  },
  {
   "book": 10,
   "month": "October",
   "title": "He Gathers the Lambs",
   "amazon": "https://a.co/d/0iacBH3H"
  },
  {
   "book": 11,
   "month": "November",
   "title": "Morning by Morning"
  },
  {
   "book": 12,
   "month": "December",
   "title": "We Have Waited for Him"
  },
  {
   "book": 13,
   "month": "January",
   "title": "Come and See!",
   "volume": "nt"
  },
  {
   "book": 14,
   "month": "February",
   "title": "Let Your Light Shine!",
   "volume": "nt"
  },
  {
   "book": 15,
   "month": "March",
   "title": "Come unto Me",
   "volume": "nt"
  },
  {
   "book": 16,
   "month": "April",
   "title": "The Good Shepherd",
   "volume": "nt"
  },
  {
   "book": 17,
   "month": "May",
   "title": "Let the Little Children Come",
   "volume": "nt"
  },
  {
   "book": 18,
   "month": "June",
   "title": "He Is Risen!",
   "volume": "nt"
  },
  {
   "book": 19,
   "month": "July",
   "title": "Ye Shall Be Witnesses!",
   "volume": "nt"
  },
  {
   "book": 20,
   "month": "August",
   "title": "Overcome Evil with Good!",
   "volume": "nt"
  },
  {
   "book": 21,
   "month": "September",
   "title": "Walk in the Spirit!",
   "volume": "nt"
  },
  {
   "book": 22,
   "month": "October",
   "title": "I Can Do All Things!",
   "volume": "nt"
  },
  {
   "book": 23,
   "month": "November",
   "title": "Be Ye Doers of the Word!",
   "volume": "nt"
  },
  {
   "book": 24,
   "month": "December",
   "title": "Good Tidings of Great Joy!",
   "volume": "nt"
  }
 ],
 "stories": [
  {
   "id": "b1-w1-n1",
   "title": "The Bush That Glowed",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 1,
   "night": 1,
   "scripture": "Exodus 3:1–15",
   "scriptureBook": "Exodus",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "faith",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child asks \"who are you?\" about God and needs to hear that Jesus knows their name.",
   "teaser": "Moses took care of sheep near a big mountain. There Moses saw a bush with fire in it. But the bush did not burn up! Moses said, “I will go and see this great sight.” The Lord called from the bush, “Moses, Moses.”…",
   "wordCount": 122
  },
  {
   "id": "b1-w1-n2",
   "title": "The Little Lamb",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 1,
   "night": 2,
   "scripture": "Exodus 12:3–5",
   "scriptureBook": "Exodus",
   "traveler": "willow",
   "feeling": "calm",
   "virtues": [
    "faith",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child is wondering why we remember Jesus with a lamb and needs a gentle picture.",
   "teaser": "Long ago, Heavenly Father’s people lived in Egypt. The king made them work very hard, and they were not free. The Lord was going to set His people free. He told Moses that every family must get ready for a special…",
   "wordCount": 125
  },
  {
   "id": "b1-w1-n3",
   "title": "Bread from Heaven",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 1,
   "night": 3,
   "scripture": "Exodus 16:4, 11–15, 31",
   "scriptureBook": "Exodus",
   "traveler": "beau",
   "feeling": "grateful",
   "virtues": [
    "gratitude",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child grumbles about what is for dinner and needs to see how God fed His people each morning.",
   "teaser": "Moses led Heavenly Father’s people through a wide, dry land. There were no fields to grow food. Soon the people were hungry and worried. The Lord heard them. He told Moses, “I will rain bread from heaven for you.”…",
   "wordCount": 120
  },
  {
   "id": "b1-w1-n4",
   "title": "Look and Live",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 1,
   "night": 4,
   "scripture": "Numbers 21:4–9",
   "scriptureBook": "Numbers",
   "traveler": "wren",
   "feeling": "comforted",
   "virtues": [
    "faith",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child is hurting and needs to learn that simply looking to Jesus can help.",
   "teaser": "Heavenly Father’s people walked a long, hard way. They got grumpy and spoke unkindly about the Lord and Moses. Then snakes came, and people who were bitten got very sick. They said, “We were wrong. Please pray for…",
   "wordCount": 124
  },
  {
   "id": "b1-w1-n5",
   "title": "A Lamp for My Feet",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 1,
   "night": 5,
   "scripture": "Psalm 119:105",
   "scriptureBook": "Psalm",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "love-of-scripture",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this when your child is afraid of the dark or of what comes next and needs a lamp for the next step.",
   "teaser": "Long ago, there were no streetlights or flashlights. At night, the paths were very dark. So people carried a little clay lamp with oil and a tiny flame. It lit just the next few steps. A man who loved the Lord wrote…",
   "wordCount": 125
  },
  {
   "id": "b1-w1-n6",
   "title": "A Baby Named Immanuel",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 1,
   "night": 6,
   "scripture": "Isaiah 7:14; 9:6",
   "scriptureBook": "Isaiah",
   "traveler": "wren",
   "feeling": "happy",
   "virtues": [
    "hope",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child feels alone and needs to hear that Immanuel means God is with us.",
   "teaser": "Isaiah told the people what Heavenly Father said. Their king and his people were afraid of enemies coming. Isaiah lived long, long before Jesus was born. But Heavenly Father showed Isaiah that a special baby boy…",
   "wordCount": 119
  },
  {
   "id": "b1-w1-n7",
   "title": "Jonah and the Big Fish",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 1,
   "night": 7,
   "scripture": "Jonah 1:1–17; 2:1, 10",
   "scriptureBook": "Jonah",
   "traveler": "willow",
   "feeling": "comforted",
   "virtues": [
    "prayer",
    "repentance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child feels stuck in a hard place and needs to know God hears prayers from anywhere.",
   "teaser": "The Lord told Jonah to go warn the people of Nineveh. They were doing bad things. But Jonah ran away on a ship. The Lord sent a great wind, and the sailors were afraid. Jonah knew the storm came because he ran away…",
   "wordCount": 125
  },
  {
   "id": "b1-w2-n1",
   "title": "Moses on the High Mountain",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 2,
   "night": 1,
   "scripture": "Moses 1:1–7",
   "scriptureBook": "Moses",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "identity",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child wonders if they matter and needs to hear they are God's own child.",
   "teaser": "Moses was taken up onto a very high mountain. There he saw Heavenly Father face to face and talked with Him. Heavenly Father’s glory, His bright, holy light, was on Moses. That light made Moses able to stand near…",
   "wordCount": 109
  },
  {
   "id": "b1-w2-n2",
   "title": "A Son of Heavenly Father",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 2,
   "night": 2,
   "scripture": "Moses 1:12–22",
   "scriptureBook": "Moses",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "courage",
    "stand-for-truth"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child faces something scary or a bad voice and needs to know God makes them strong.",
   "teaser": "Then Satan came to Moses. Satan wants people to choose wrong. He said, “Moses, worship me.” He wanted Moses to love and obey him most. Moses said, “Who are you? I am a son of Heavenly Father!” Then Moses said, “Go…",
   "wordCount": 114
  },
  {
   "id": "b1-w2-n3",
   "title": "Moses Sees Every Person",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 2,
   "night": 3,
   "scripture": "Moses 1:24–29",
   "scriptureBook": "Moses",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "wonder",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wonder",
   "teachingNote": "Reach for this when your child feels lost in a crowd and needs to know God knows every single person.",
   "teaser": "Satan was gone. Moses looked up to heaven. The Holy Ghost, a quiet helper who teaches what is true, filled him. Heavenly Father said, “Moses, I have chosen you. I am with you.” Then Moses saw the whole earth, every…",
   "wordCount": 108
  },
  {
   "id": "b1-w2-n4",
   "title": "Worlds Without Number",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 2,
   "night": 4,
   "scripture": "Moses 1:30–35",
   "scriptureBook": "Moses",
   "traveler": "wren",
   "feeling": "eager",
   "virtues": [
    "curiosity",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "curiosity",
   "teachingNote": "Reach for this when your child asks big questions about the stars and needs to know God made and knows it all.",
   "teaser": "Moses had seen so many things. He prayed, “Why did You make these things? And how did You make them?” Heavenly Father said He made them for His own good reason. He made them through His Son, Jesus. Then Heavenly…",
   "wordCount": 101
  },
  {
   "id": "b1-w2-n5",
   "title": "My Work and My Glory",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 2,
   "night": 5,
   "scripture": "Moses 1:36–39",
   "scriptureBook": "Moses",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "identity",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels not good enough and needs to hear that bringing them home is God's joy.",
   "teaser": "Moses asked Heavenly Father for one more thing. He said, “Please tell me about this earth and the people on it.” Heavenly Father said, “The heavens are many. People cannot count them. But I count them, for they are…",
   "wordCount": 125
  },
  {
   "id": "b1-w2-n6",
   "title": "Abraham Counts the Stars",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 2,
   "night": 6,
   "scripture": "Abraham 3:2–3, 11–14",
   "scriptureBook": "Abraham",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "wonder",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wonder",
   "teachingNote": "Reach for this when your child looks up at the night sky and needs to know the One who made the stars made them too.",
   "teaser": "The Lord talked with Abraham face to face, like one friend talks with another. He told Abraham about the things He had made. Abraham saw many great stars. One was nearest to Heavenly Father’s home. The Lord said its…",
   "wordCount": 118
  },
  {
   "id": "b1-w2-n7",
   "title": "Here Am I, Send Me",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 2,
   "night": 7,
   "scripture": "Abraham 3:22–28",
   "scriptureBook": "Abraham",
   "traveler": "beau",
   "feeling": "eager",
   "virtues": [
    "service",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child hesitates to help and needs the example of Jesus saying, \"Here am I, send me.\"",
   "teaser": "Before we were born, we lived with Heavenly Father as spirits. Your spirit is the real you inside, the part that thinks and loves. The Lord showed Abraham those spirits. He said, “Abraham, you are one of them. You…",
   "wordCount": 124
  },
  {
   "id": "b1-w3-n1",
   "title": "Let There Be Light",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 3,
   "night": 1,
   "scripture": "Genesis 1:1–5; Moses 2:1–5",
   "scriptureBook": "Genesis",
   "traveler": "wren",
   "feeling": "amazed",
   "virtues": [
    "wonder",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wonder",
   "teachingNote": "Reach for this when your child is afraid of the dark and needs to know Jesus made light for every dark place.",
   "teaser": "In the very beginning, the earth had no shape. It was empty and dark, with deep water all around. Heavenly Father had a plan. He told Moses that He made the earth through His Son. So Jesus made the earth for…",
   "wordCount": 122
  },
  {
   "id": "b1-w3-n2",
   "title": "Sky, Sea, Land, and Trees",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 3,
   "night": 2,
   "scripture": "Genesis 1:6–13",
   "scriptureBook": "Genesis",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "wonder",
    "curiosity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wonder",
   "teachingNote": "Reach for this when your child loves looking at trees, sky, and sea and needs to hear that God called it all good.",
   "teaser": "On the second day, Heavenly Father made the sky. It sat between the water below and the water above. He called the sky Heaven. On the third day, He gathered the water into one place. Then dry land showed up! He…",
   "wordCount": 124
  },
  {
   "id": "b1-w3-n3",
   "title": "Sun, Moon, and Stars",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 3,
   "night": 3,
   "scripture": "Genesis 1:14–19",
   "scriptureBook": "Genesis",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "comfort",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "comfort",
   "teachingNote": "Reach for this when your child is scared at bedtime and needs to know the moon and stars are God's night-lights.",
   "teaser": "On the fourth day, Heavenly Father put lights in the sky. He made a big light to rule the day. That is the sun. He made a smaller light for the night. That is the moon. He made the stars too! These lights show when…",
   "wordCount": 125
  },
  {
   "id": "b1-w3-n4",
   "title": "Fish and Birds",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 3,
   "night": 4,
   "scripture": "Genesis 1:20–23",
   "scriptureBook": "Genesis",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "gratitude",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child delights in birds and fish and needs to know God blessed them and blesses the child too.",
   "teaser": "On the fifth day, Heavenly Father filled the water with living things. Fish swam in the seas. Great big whales swam in the deep! Then He made birds. They flew high across the open sky. Heavenly Father saw that it…",
   "wordCount": 110
  },
  {
   "id": "b1-w3-n5",
   "title": "Made Like Heavenly Father",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 3,
   "night": 5,
   "scripture": "Genesis 1:24–31; Moses 2:26–27",
   "scriptureBook": "Genesis",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "identity",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child compares themselves to others and needs to hear they are made like Heavenly Father.",
   "teaser": "On the sixth day, Heavenly Father made animals for the land. Cows, crawling bugs, and wild animals came. Each kind made more of its own kind. Then Heavenly Father spoke to Jesus. “Let us make man in our image,” He…",
   "wordCount": 122
  },
  {
   "id": "b1-w3-n6",
   "title": "A Day to Rest",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 3,
   "night": 6,
   "scripture": "Genesis 2:1–3",
   "scriptureBook": "Genesis",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "reverence",
    "contentment"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child cannot slow down and needs a picture of God's day of rest.",
   "teaser": "Six days had passed. The heavens and the earth were finished. Everything in Heavenly Father’s plan was made. On the seventh day, His work was done. So Heavenly Father rested from all His work. Then He blessed the…",
   "wordCount": 104
  },
  {
   "id": "b1-w3-n7",
   "title": "The Garden of Eden",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 3,
   "night": 7,
   "scripture": "Genesis 2:8–9, 15, 18–24",
   "scriptureBook": "Genesis",
   "traveler": "beau",
   "feeling": "connected",
   "virtues": [
    "family-love",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "family-love",
   "teachingNote": "Reach for this when your child feels left out and needs to hear that family is part of God's plan.",
   "teaser": "Heavenly Father planted a garden in a place called Eden. Beautiful trees grew there, with fruit good to eat. He put Adam there to take care of it. Heavenly Father said, “It is not good for the man to be alone.” He…",
   "wordCount": 121
  },
  {
   "id": "b1-w4-n1",
   "title": "Free to Choose",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 4,
   "night": 1,
   "scripture": "Moses 4:1–4",
   "scriptureBook": "Moses",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "courage",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child is choosing between right and wrong and needs to see Jesus choose to follow the Father.",
   "teaser": "Long before the world was made, we all lived with Heavenly Father. He had a plan for us to come to earth and grow. Satan said, “Send me! Not one person will be lost. Give me Your honor.” He wanted all the praise for…",
   "wordCount": 117
  },
  {
   "id": "b1-w4-n2",
   "title": "The Fruit in the Garden",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 4,
   "night": 2,
   "scripture": "Moses 4:5–13; Genesis 3:1–7",
   "scriptureBook": "Moses",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "wisdom",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wisdom",
   "teachingNote": "Reach for this when your child is tempted to break a rule and needs to learn how God helps us know good from bad.",
   "teaser": "Adam and Eve lived in a beautiful garden called Eden. Heavenly Father said, “You may choose for yourself. But do not eat from this one tree.” Satan, who tries to trick us, spoke through a snake. He told Eve the…",
   "wordCount": 119
  },
  {
   "id": "b1-w4-n3",
   "title": "Where Are You?",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 4,
   "night": 3,
   "scripture": "Genesis 3:8–13",
   "scriptureBook": "Genesis",
   "traveler": "wren",
   "feeling": "nervous",
   "virtues": [
    "honesty",
    "repentance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "honesty",
   "teachingNote": "Reach for this when your child wants to hide after a mistake and needs to know God keeps asking, \"Where are you?\" with love.",
   "teaser": "Adam and Eve had eaten the fruit. Later, in the cool of the day, they heard the Lord in the garden. They felt afraid, so they hid among the trees. The Lord called to Adam, “Where are you?” The Lord already knew. He…",
   "wordCount": 125
  },
  {
   "id": "b1-w4-n4",
   "title": "Coats and a Promise",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 4,
   "night": 4,
   "scripture": "Genesis 3:15, 21–24; Moses 4:21, 27",
   "scriptureBook": "Genesis",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "trust-in-god",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels sorry for a mistake and needs the picture of God making coats and promising a Savior.",
   "teaser": "The Lord made a promise. One day, a child from Eve’s family would win over Satan, the trickster. Prophets teach that this child is Jesus, the Savior. A Savior rescues us. Jesus would help everyone come back to…",
   "wordCount": 107
  },
  {
   "id": "b1-w4-n5",
   "title": "Adam and Eve Pray",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 4,
   "night": 5,
   "scripture": "Moses 5:4–9",
   "scriptureBook": "Moses",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "prayer",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child wonders why we pray and obey and needs to see Adam and Eve do both.",
   "teaser": "Outside the garden, Adam and Eve prayed to Heavenly Father. They heard the Lord’s voice answer them. The Lord asked them to give Him the firstborn lambs of their flocks. This gift, called a sacrifice, was their very…",
   "wordCount": 122
  },
  {
   "id": "b1-w4-n6",
   "title": "Glad and Full of Joy",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 4,
   "night": 6,
   "scripture": "Moses 5:10–12",
   "scriptureBook": "Moses",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "hope",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child feels sad about hard things and needs to hear that God's plan brings joy.",
   "teaser": "Adam praised Heavenly Father. He said, “Because of my choice, my eyes are open. In this life I will have joy!” Eve heard him and was glad. She said, “Without our choice, we would never have had children.” Eve said…",
   "wordCount": 109
  },
  {
   "id": "b1-w4-n7",
   "title": "My Brother’s Keeper",
   "volume": "ot",
   "book": 1,
   "bookTitle": "Let There Be Light!",
   "month": "January",
   "week": 4,
   "night": 7,
   "scripture": "Genesis 4:1–10; Moses 5:16–23, 32–34",
   "scriptureBook": "Genesis",
   "traveler": "willow",
   "feeling": "angry",
   "virtues": [
    "peacemaking",
    "self-control"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "peacemaking",
   "teachingNote": "Reach for this when your child is angry at a brother or sister and needs a better choice than Cain's.",
   "teaser": "Adam and Eve had two sons, Cain and Abel. Cain grew food. Abel took care of sheep. Both brothers brought gifts to the Lord. The Lord was glad for Abel’s gift. But Cain’s heart was not right, and he got very angry…",
   "wordCount": 120
  },
  {
   "id": "b2-w1-n1",
   "title": "Adam’s Big Family",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 1,
   "night": 1,
   "scripture": "Genesis 5:1–5; Moses 6:3–4",
   "scriptureBook": "Genesis",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "family-love",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "family-love",
   "teachingNote": "Reach for this when your child wonders where they fit and needs to know they belong to a big family Heavenly Father loves.",
   "teaser": "Adam and Eve were the first mom and dad on the earth. Heavenly Father blessed them. When Adam was 130 years old, a new baby boy came. They named him Seth. Seth could have gone his own way. But he chose to obey the…",
   "wordCount": 124
  },
  {
   "id": "b2-w1-n2",
   "title": "Enoch Walked Close",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 1,
   "night": 2,
   "scripture": "Genesis 5:21–24; Moses 6:21",
   "scriptureBook": "Genesis",
   "traveler": "wren",
   "feeling": "safe",
   "virtues": [
    "faith",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child feels alone and needs to know they can walk close to Heavenly Father, hand in hand, like Enoch.",
   "teaser": "Long ago, a baby named Enoch was born into Adam’s big family. His dad’s name was Jared. Jared taught Enoch all of Heavenly Father’s ways. Enoch learned the good things Heavenly Father wants us to do. When Enoch grew…",
   "wordCount": 116
  },
  {
   "id": "b2-w1-n3",
   "title": "A Book of Remembrance",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 1,
   "night": 3,
   "scripture": "Moses 6:5–6, 8",
   "scriptureBook": "Moses",
   "traveler": "scout",
   "feeling": "excited",
   "virtues": [
    "love-of-scripture",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this when your child is learning to remember and needs a family book of remembrance to keep Heavenly Father close.",
   "teaser": "Adam’s family kept a special book. They called it a book of remembrance, a book to help them remember. When they prayed, Heavenly Father’s Spirit helped them know what to write. They wrote down the names in their…",
   "wordCount": 107
  },
  {
   "id": "b2-w1-n4",
   "title": "Enoch Is Called",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 1,
   "night": 4,
   "scripture": "Moses 6:26–33",
   "scriptureBook": "Moses",
   "traveler": "beau",
   "feeling": "nervous",
   "virtues": [
    "courage",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child feels too small for a big job and needs to hear the Lord helps the little ones be brave.",
   "teaser": "Enoch was walking among the people. Heavenly Father’s Spirit came down from heaven and stayed with him. Many people had stopped listening to the Lord. So the Lord said, “Enoch, tell them to repent.” To repent is to…",
   "wordCount": 124
  },
  {
   "id": "b2-w1-n5",
   "title": "Enoch’s Eyes Are Opened",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 1,
   "night": 5,
   "scripture": "Moses 6:34–36",
   "scriptureBook": "Moses",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "faith",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child needs help seeing what is good and true, the way Enoch's eyes were opened.",
   "teaser": "The Lord told Enoch, “My Spirit is with you. Walk with Me.” Then the Lord told Enoch to put soft, wet clay on his eyes. “Wash them,” He said, “and you will see.” That might seem like a funny thing to do. But Enoch…",
   "wordCount": 104
  },
  {
   "id": "b2-w1-n6",
   "title": "Enoch Teaches the People",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 1,
   "night": 6,
   "scripture": "Moses 6:37–47",
   "scriptureBook": "Moses",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "courage",
    "stand-for-truth"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child is afraid to speak up for what is true and needs Heavenly Father's help to stand tall like Enoch.",
   "teaser": "Enoch stood on the hills and spoke in a loud voice. He told the people their wrong ways had to stop. Many people were upset. People came out of their tents to hear him. They said, “A wild man has come!” But nobody…",
   "wordCount": 121
  },
  {
   "id": "b2-w1-n7",
   "title": "Adam Is Baptized",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 1,
   "night": 7,
   "scripture": "Moses 6:52, 57–58, 64–68",
   "scriptureBook": "Moses",
   "traveler": "willow",
   "feeling": "calm",
   "virtues": [
    "obedience",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child is learning about baptism and needs to see how following Jesus brings a clean, quiet peace.",
   "teaser": "Enoch told the people what Heavenly Father had taught Adam long before. Heavenly Father told Adam, “Turn from wrong. Be baptized in the name of Jesus Christ.” Baptized means going all the way under the water and…",
   "wordCount": 113
  },
  {
   "id": "b2-w2-n1",
   "title": "Enoch’s Great Faith",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 2,
   "night": 1,
   "scripture": "Moses 7:13",
   "scriptureBook": "Moses",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "faith",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child faces something big and needs to trust that Heavenly Father can do it, as Enoch did.",
   "teaser": "Enoch led the people who loved the Lord. Enoch had great faith, which means he trusted the Lord all the way. One day, an army came to fight against the Lord’s people. Enoch spoke the words the Lord gave him. The…",
   "wordCount": 112
  },
  {
   "id": "b2-w2-n2",
   "title": "The Lord Lived with Them",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 2,
   "night": 2,
   "scripture": "Moses 7:16–17",
   "scriptureBook": "Moses",
   "traveler": "beau",
   "feeling": "happy",
   "virtues": [
    "obedience",
    "reverence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child is choosing the right and needs to know the Lord stays near those who do.",
   "teaser": "In Enoch’s day, many people fought and were unkind. But Enoch’s people chose to follow the Lord. So the Lord came and lived with His people! They lived in righteousness. That is a big word for doing what is right…",
   "wordCount": 111
  },
  {
   "id": "b2-w2-n3",
   "title": "One Heart and One Mind",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 2,
   "night": 3,
   "scripture": "Moses 7:18",
   "scriptureBook": "Moses",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "peacemaking",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "peacemaking",
   "teachingNote": "Reach for this when your child is squabbling with others and needs a picture of one heart and one mind in Zion.",
   "teaser": "The Lord gave Enoch’s people a special name. He called them Zion. He called them Zion because they were of one heart and one mind. They loved each other, and they all wanted to follow the Lord together. They did…",
   "wordCount": 105
  },
  {
   "id": "b2-w2-n4",
   "title": "The City of Holiness",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 2,
   "night": 4,
   "scripture": "Moses 7:19–21",
   "scriptureBook": "Moses",
   "traveler": "scout",
   "feeling": "safe",
   "virtues": [
    "hope",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child wonders what happens to the good and needs to hear the Lord took Zion safely home to heaven.",
   "teaser": "Enoch kept teaching the Lord’s people what was right. Then Enoch built a city. It was called the City of Holiness, and it was also called Zion. Its people followed the Lord, so it was holy, very special to Heavenly…",
   "wordCount": 117
  },
  {
   "id": "b2-w2-n5",
   "title": "Heavenly Father Wept",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 2,
   "night": 5,
   "scripture": "Moses 7:28–33, 37",
   "scriptureBook": "Moses",
   "traveler": "willow",
   "feeling": "sad",
   "virtues": [
    "compassion",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "compassion",
   "teachingNote": "Reach for this when your child is hurt by unkindness and needs to see that Heavenly Father cares how we treat each other.",
   "teaser": "The Lord let Enoch see all the people on the earth. Many of them were being very unkind. Then Enoch saw something surprising. Heavenly Father looked at those people, and He cried. Enoch asked, “How can You cry? You…",
   "wordCount": 109
  },
  {
   "id": "b2-w2-n6",
   "title": "Enoch Sees Jesus",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 2,
   "night": 6,
   "scripture": "Moses 7:47, 53–56",
   "scriptureBook": "Moses",
   "traveler": "wren",
   "feeling": "happy",
   "virtues": [
    "hope",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child needs to know Jesus is coming, as Enoch saw, and that He is the child's own Savior.",
   "teaser": "The Lord showed Enoch things that would happen a long, long time later. Enoch saw the day Jesus would come to live on the earth! Enoch’s heart was full of joy. The Lord said, “I am Messiah, the Rock of Heaven.”…",
   "wordCount": 116
  },
  {
   "id": "b2-w2-n7",
   "title": "Zion Again Someday",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 2,
   "night": 7,
   "scripture": "Moses 7:62–64",
   "scriptureBook": "Moses",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "hope",
    "patience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child is waiting for something good and needs to hear Zion will come again with hugs and joy.",
   "teaser": "The Lord made Enoch a promise about the time before Jesus comes again. He said, “I will send goodness from heaven and truth out of the earth.” That truth will tell about Jesus. Prophets teach that this truth…",
   "wordCount": 104
  },
  {
   "id": "b2-w3-n1",
   "title": "Noah, a Good Man",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 3,
   "night": 1,
   "scripture": "Genesis 6:8–9; Moses 8:13–27",
   "scriptureBook": "Genesis",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "obedience",
    "perseverance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child feels alone in choosing right and needs to see Noah keep walking with Heavenly Father.",
   "teaser": "Noah loved the Lord and listened to Him. His three sons listened too. But many people had stopped listening to the Lord. So the Lord sent Noah to teach them. Noah said, “Believe in Jesus Christ, repent, and be…",
   "wordCount": 123
  },
  {
   "id": "b2-w3-n2",
   "title": "Build a Big Boat",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 3,
   "night": 2,
   "scripture": "Genesis 6:13–22",
   "scriptureBook": "Genesis",
   "traveler": "wren",
   "feeling": "eager",
   "virtues": [
    "obedience",
    "diligence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child is facing a big job and needs to learn to listen, obey, and build it one step at a time.",
   "teaser": "The Lord told Noah to build a very big boat called an ark. A great flood was coming. Water would cover all the land. The Lord told Noah just how to make it. It was longer than a football field! It had three floors…",
   "wordCount": 121
  },
  {
   "id": "b2-w3-n3",
   "title": "Two by Two",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 3,
   "night": 3,
   "scripture": "Genesis 7:1–9",
   "scriptureBook": "Genesis",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "service",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child wonders if Heavenly Father cares about small things and needs to see Him keep every creature safe.",
   "teaser": "When the ark was ready, the Lord spoke to Noah. He said, “Come into the ark with all your family.” He saw that Noah chose what was right. Then the animals came to Noah, two by two. There were big animals, birds, and…",
   "wordCount": 122
  },
  {
   "id": "b2-w3-n4",
   "title": "The Rain Came",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 3,
   "night": 4,
   "scripture": "Genesis 7:11–23; 8:1",
   "scriptureBook": "Genesis",
   "traveler": "beau",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child is scared of a storm and needs to know Heavenly Father remembers them, like Noah on the ark.",
   "teaser": "Noah, his family, and the animals were all inside the ark. Then the Lord Himself shut the door. It rained for forty days and forty nights. Water came up from deep in the earth and down from the sky. The ark floated…",
   "wordCount": 125
  },
  {
   "id": "b2-w3-n5",
   "title": "The Dove and the Leaf",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 3,
   "night": 5,
   "scripture": "Genesis 8:4–12",
   "scriptureBook": "Genesis",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "patience",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "patience",
   "teachingNote": "Reach for this when your child is waiting for something good and needs the picture of Noah sending out the dove and waiting.",
   "teaser": "At last the ark rested on the mountains of Ararat. Noah waited a long time. Then he sent out a big black bird called a raven. Next he sent out a dove. She found no place to rest her feet, so she flew back. Noah…",
   "wordCount": 123
  },
  {
   "id": "b2-w3-n6",
   "title": "The Rainbow Promise",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 3,
   "night": 6,
   "scripture": "Genesis 8:18–20; 9:8–17",
   "scriptureBook": "Genesis",
   "traveler": "willow",
   "feeling": "comforted",
   "virtues": [
    "keeping-promises",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "keeping-promises",
   "teachingNote": "Reach for this when your child doubts that promises last and needs to look up at the rainbow Heavenly Father always keeps.",
   "teaser": "At last everyone came out of the ark onto dry land. Noah built an altar, a special place to thank and worship the Lord. There Noah gave gifts to the Lord. Gifts like these helped people remember that Jesus would…",
   "wordCount": 116
  },
  {
   "id": "b2-w3-n7",
   "title": "The Tall Tower",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 3,
   "night": 7,
   "scripture": "Genesis 11:1–9",
   "scriptureBook": "Genesis",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "humility",
    "wisdom"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child wants to be great on their own and needs to learn that Jesus is the way, not a tall tower.",
   "teaser": "After the flood, Noah’s family grew into many, many people. They all spoke the same words. They baked bricks hard in the fire. They said, “Let us build a city and a tower up to heaven.” They also said, “Let us make…",
   "wordCount": 125
  },
  {
   "id": "b2-w4-n1",
   "title": "Abraham Wants to Follow",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 4,
   "night": 1,
   "scripture": "Abraham 1:1–2",
   "scriptureBook": "Abraham",
   "traveler": "wren",
   "feeling": "eager",
   "virtues": [
    "diligence",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "diligence",
   "teachingNote": "Reach for this when your child wants to grow and needs to see Abraham follow Heavenly Father a little more each day.",
   "teaser": "Long ago, Abraham lived in the land of the Chaldeans. He already loved doing what was right. Abraham saw that Heavenly Father’s blessings bring more happiness, more peace, and more rest. Peace is a calm, quiet…",
   "wordCount": 117
  },
  {
   "id": "b2-w4-n2",
   "title": "The Lord Saves Abraham",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 4,
   "night": 2,
   "scripture": "Abraham 1:15–17",
   "scriptureBook": "Abraham",
   "traveler": "beau",
   "feeling": "safe",
   "virtues": [
    "prayer",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child is frightened and needs to know Jesus heard Abraham's prayer and hears theirs too.",
   "teaser": "Many people in Abraham’s land prayed to statues they had made. These statues could not hear or help anyone. Some men who chose very wrong things tried to hurt Abraham. They tied him up. Abraham lifted up his voice…",
   "wordCount": 114
  },
  {
   "id": "b2-w4-n3",
   "title": "Leaving Home",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 4,
   "night": 3,
   "scripture": "Abraham 2:3–6; Genesis 12:1–5",
   "scriptureBook": "Abraham",
   "traveler": "scout",
   "feeling": "nervous",
   "virtues": [
    "faith",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child must leave something familiar and needs to know the Lord leads the way, as He led Abraham.",
   "teaser": "One day the Lord told Abraham, “Leave your country and your father’s house. Go to a land that I will show you.” Abraham did not know what the new land was like. But he trusted the Lord. His wife, Sarah, and his…",
   "wordCount": 121
  },
  {
   "id": "b2-w4-n4",
   "title": "You Choose First",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 4,
   "night": 4,
   "scripture": "Genesis 13:5–12",
   "scriptureBook": "Genesis",
   "traveler": "willow",
   "feeling": "calm",
   "virtues": [
    "peacemaking",
    "generosity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "peacemaking",
   "teachingNote": "Reach for this when your child is quarreling over who goes first and needs to see Abraham let Lot choose to keep the peace.",
   "teaser": "Abraham and Lot had many sheep, cows, and tents. There was not enough grass and water for all their animals in one place. So the men who cared for Abraham’s animals and Lot’s animals began to quarrel. They argued in…",
   "wordCount": 114
  },
  {
   "id": "b2-w4-n5",
   "title": "Melchizedek’s Blessing",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 4,
   "night": 5,
   "scripture": "Genesis 14:18–20",
   "scriptureBook": "Genesis",
   "traveler": "wren",
   "feeling": "happy",
   "virtues": [
    "generosity",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child is learning to give and needs to see that everything is a gift, so we give back.",
   "teaser": "Abraham had just brought Lot safely home. Then Abraham met Melchizedek, the king of Salem. Melchizedek was a priest who served Heavenly Father. Melchizedek brought out bread and wine to share. Sharing food was a…",
   "wordCount": 109
  },
  {
   "id": "b2-w4-n6",
   "title": "Look at the Stars",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 4,
   "night": 6,
   "scripture": "Genesis 15:1–6",
   "scriptureBook": "Genesis",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "faith",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child doubts the Lord's promises and needs to look at the stars, as Abraham did, and believe.",
   "teaser": "The Lord let Abraham see and hear Him in a vision. He said, “Do not be afraid, Abraham. I am your shield.” A shield is what a soldier holds up to stay safe. So the Lord meant, “I will keep you safe.” But Abraham…",
   "wordCount": 117
  },
  {
   "id": "b2-w4-n7",
   "title": "A New Name",
   "volume": "ot",
   "book": 2,
   "bookTitle": "The Rainbow Promise",
   "month": "February",
   "week": 4,
   "night": 7,
   "scripture": "Genesis 17:1–8, 15–19",
   "scriptureBook": "Genesis",
   "traveler": "willow",
   "feeling": "happy",
   "virtues": [
    "keeping-promises",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "keeping-promises",
   "teachingNote": "Reach for this when your child is learning about covenants and needs to see the Lord keep His, so they can keep theirs.",
   "teaser": "Abraham used to be named Abram. When he was ninety-nine, the Lord came to him. He said, “Walk before Me, and be perfect.” The Lord made a covenant with him. A covenant is a two-way promise. Abram would follow the…",
   "wordCount": 123
  },
  {
   "id": "b3-w1-n1",
   "title": "Three Visitors",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 1,
   "night": 1,
   "scripture": "Genesis 18:1–8",
   "scriptureBook": "Genesis",
   "traveler": "willow",
   "feeling": "happy",
   "virtues": [
    "kindness",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child needs a picture of welcoming a tired guest with water, bread, and a warm smile.",
   "teaser": "Abraham and his wife, Sarah, lived in a tent. One hot afternoon, Abraham sat by his tent door. He looked up and saw three men standing near him. They were holy visitors sent by the Lord. Abraham ran to meet them and…",
   "wordCount": 123
  },
  {
   "id": "b3-w1-n2",
   "title": "Sarah Laughs",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 1,
   "night": 2,
   "scripture": "Genesis 18:9–15",
   "scriptureBook": "Genesis",
   "traveler": "wren",
   "feeling": "amazed",
   "virtues": [
    "faith",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child thinks something is too big or too hard and needs to hear that nothing is too hard for the Lord.",
   "teaser": "The three visitors asked Abraham, “Where is Sarah?” Abraham said, “In the tent.” Then the Lord said, “Sarah will have a baby boy.” Sarah was listening at the tent door. She and Abraham were very, very old. They were…",
   "wordCount": 123
  },
  {
   "id": "b3-w1-n3",
   "title": "Abraham Asks for Mercy",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 1,
   "night": 3,
   "scripture": "Genesis 18:20–33",
   "scriptureBook": "Genesis",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "compassion",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "compassion",
   "teachingNote": "Reach for this when your child wants to pray for someone else and needs to see Abraham asking again and again.",
   "teaser": "The Lord told Abraham about a city called Sodom. The people there kept choosing very wrong things. Their city might be destroyed. Abraham’s nephew Lot lived in Sodom. Abraham cared about the people there. He asked…",
   "wordCount": 116
  },
  {
   "id": "b3-w1-n4",
   "title": "Angels Lead Lot Out",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 1,
   "night": 4,
   "scripture": "Genesis 19:15–17, 26",
   "scriptureBook": "Genesis",
   "traveler": "beau",
   "feeling": "safe",
   "virtues": [
    "heeding-counsel",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "heeding-counsel",
   "teachingNote": "Reach for this when your child hesitates to follow and needs the picture of angels leading Lot out by the hand.",
   "teaser": "Lot lived in a city where people chose very wrong things. Two angels from Heavenly Father came to help. Early in the morning, the angels said, “Hurry! Take your wife and your two daughters.” But Lot was slow. So the…",
   "wordCount": 124
  },
  {
   "id": "b3-w1-n5",
   "title": "Baby Isaac Is Born",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 1,
   "night": 5,
   "scripture": "Genesis 21:1–7",
   "scriptureBook": "Genesis",
   "traveler": "wren",
   "feeling": "happy",
   "virtues": [
    "keeping-promises",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "keeping-promises",
   "teachingNote": "Reach for this when your child is waiting and needs to know the Lord keeps His promises, as He did for Sarah and Abraham.",
   "teaser": "The Lord had made Abraham and Sarah a promise. They would have a baby boy, even though they were very, very old. They waited many, many years. Then, just as the Lord said, Sarah had a baby boy! Abraham was one…",
   "wordCount": 117
  },
  {
   "id": "b3-w1-n6",
   "title": "Water for Hagar",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 1,
   "night": 6,
   "scripture": "Genesis 21:14–20",
   "scriptureBook": "Genesis",
   "traveler": "willow",
   "feeling": "comforted",
   "virtues": [
    "trust-in-god",
    "comfort"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child is crying or feels alone and needs to hear that Heavenly Father hears and sends water.",
   "teaser": "Hagar was Sarah’s helper. Her son Ishmael was Abraham’s son too. The Lord told Abraham to send them away, and promised to bless Ishmael. Abraham gave them bread and water. They walked into a wide, dry land. Soon the…",
   "wordCount": 121
  },
  {
   "id": "b3-w1-n7",
   "title": "Isaac on the Mountain",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 1,
   "night": 7,
   "scripture": "Genesis 22:1–14",
   "scriptureBook": "Genesis",
   "traveler": "scout",
   "feeling": "calm",
   "virtues": [
    "faith",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child wonders how much Heavenly Father loves them and needs the picture of the ram Heavenly Father provided.",
   "teaser": "Heavenly Father asked Abraham to do something very hard. He asked him to offer his son Isaac on a mountain. Abraham loved Isaac, but he trusted Heavenly Father. Isaac carried the wood up the mountain. Isaac asked…",
   "wordCount": 123
  },
  {
   "id": "b3-w2-n1",
   "title": "Rebekah at the Well",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 2,
   "night": 1,
   "scripture": "Genesis 24:10–20",
   "scriptureBook": "Genesis",
   "traveler": "willow",
   "feeling": "eager",
   "virtues": [
    "kindness",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child is ready to help and needs Rebekah's picture of drawing water for the tired camels too.",
   "teaser": "Abraham wanted his son Isaac to marry a good woman from Abraham’s own family. So he sent his helper far away to find her. The helper traveled with ten camels. One evening he stopped by a well, where women got water…",
   "wordCount": 120
  },
  {
   "id": "b3-w2-n2",
   "title": "I Will Go",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 2,
   "night": 2,
   "scripture": "Genesis 24:50–58, 61–67",
   "scriptureBook": "Genesis",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "courage",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child feels nervous about a big change and needs Rebekah's brave words, I will go.",
   "teaser": "Abraham’s helper told Rebekah’s family about his prayer at the well. Her family said, “This is from the Lord.” But Isaac lived far, far away. Going meant leaving her home and her family. Her family asked her, “Will…",
   "wordCount": 120
  },
  {
   "id": "b3-w2-n3",
   "title": "Twin Brothers",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 2,
   "night": 3,
   "scripture": "Genesis 25:21–27",
   "scriptureBook": "Genesis",
   "traveler": "scout",
   "feeling": "grateful",
   "virtues": [
    "gratitude",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child feels different from a brother or sister and needs to know Heavenly Father made each of them special.",
   "teaser": "Isaac and Rebekah wanted a baby, but no baby came. So Isaac prayed to the Lord for Rebekah, and the Lord heard him. Soon two babies were growing inside Rebekah. They pushed and wiggled so much that she asked the…",
   "wordCount": 118
  },
  {
   "id": "b3-w2-n4",
   "title": "Jacob’s Ladder",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 2,
   "night": 4,
   "scripture": "Genesis 28:10–17",
   "scriptureBook": "Genesis",
   "traveler": "wren",
   "feeling": "amazed",
   "virtues": [
    "faith",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child is leaving home or feels far from you and needs the picture of the ladder reaching to heaven.",
   "teaser": "Jacob’s father sent him far away to find a wife. At sunset, Jacob lay down outside, with stones for his pillow. Jacob dreamed of a ladder on the ground. Its top reached heaven! Heavenly Father’s angels went up and…",
   "wordCount": 124
  },
  {
   "id": "b3-w2-n5",
   "title": "Jacob Works for Rachel",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 2,
   "night": 5,
   "scripture": "Genesis 29:9–11, 18–20",
   "scriptureBook": "Genesis",
   "traveler": "wren",
   "feeling": "loved",
   "virtues": [
    "patience",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "patience",
   "teachingNote": "Reach for this when your child is waiting for something good and needs the picture of Jacob working seven years for Rachel.",
   "teaser": "Jacob came to a well in a faraway land. A big, heavy stone covered it. Rachel came, taking care of her father’s sheep. Jacob rolled the big stone away and gave her sheep a drink. Rachel was from Jacob’s mother’s…",
   "wordCount": 112
  },
  {
   "id": "b3-w2-n6",
   "title": "A New Name: Israel",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 2,
   "night": 6,
   "scripture": "Genesis 32:7–11, 24–29",
   "scriptureBook": "Genesis",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "faith",
    "perseverance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child is holding on through a hard night and needs Jacob's picture of wrestling and not letting go until he was blessed.",
   "teaser": "Jacob was going home with his big family. Long ago, he had been unfair to his brother, Esau. Now Esau was coming, and Jacob was afraid. He prayed for help. One night, Jacob was alone. A man came and wrestled with…",
   "wordCount": 122
  },
  {
   "id": "b3-w2-n7",
   "title": "Esau Runs to Hug Jacob",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 2,
   "night": 7,
   "scripture": "Genesis 33:1–4, 9–11",
   "scriptureBook": "Genesis",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "forgiveness",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "forgiveness",
   "teachingNote": "Reach for this when your child is afraid to face someone they hurt and needs the picture of Esau running to hug Jacob.",
   "teaser": "Jacob saw Esau coming. Years before, Jacob had been unfair to Esau, and Esau had been very angry. Would Esau still be mad? Jacob walked out in front of his family. He bowed down to the ground seven times. It showed…",
   "wordCount": 118
  },
  {
   "id": "b3-w3-n1",
   "title": "Joseph’s Special Coat",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 3,
   "night": 1,
   "scripture": "Genesis 37:2–4",
   "scriptureBook": "Genesis",
   "traveler": "wren",
   "feeling": "jealous",
   "virtues": [
    "contentment",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "contentment",
   "teachingNote": "Reach for this when your child feels jealous of a brother or sister and needs to hear Heavenly Father loves every one of His children.",
   "teaser": "Joseph was seventeen years old. He helped his big brothers take care of their father’s sheep. Their father was Jacob. Jacob loved Joseph more than his other sons. Joseph was born when Jacob was old. Jacob made…",
   "wordCount": 113
  },
  {
   "id": "b3-w3-n2",
   "title": "Joseph’s Dreams",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 3,
   "night": 2,
   "scripture": "Genesis 37:5–11",
   "scriptureBook": "Genesis",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "wisdom",
    "pondering"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wisdom",
   "teachingNote": "Reach for this when your child shares big dreams and thoughts and needs to ponder, as Jacob did, how Heavenly Father teaches us.",
   "teaser": "One night Joseph had a dream. He told his brothers, “We were tying bundles of grain in the field.” “My bundle stood up tall. Your bundles bent low around it, like they were bowing to mine.” Then Joseph had another…",
   "wordCount": 110
  },
  {
   "id": "b3-w3-n3",
   "title": "Joseph Goes Far Away",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 3,
   "night": 3,
   "scripture": "Genesis 37:12–14, 23–28",
   "scriptureBook": "Genesis",
   "traveler": "beau",
   "feeling": "sad",
   "virtues": [
    "trust-in-god",
    "comfort"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels lonely or far from home and needs to know Heavenly Father is with them, as with Joseph.",
   "teaser": "Jacob said, “Joseph, please go see if your brothers and the sheep are well.” Joseph said, “Here I am,” and he went. But his brothers were still jealous. When Joseph came, they took off his coat of many colors. They…",
   "wordCount": 122
  },
  {
   "id": "b3-w3-n4",
   "title": "The Lord Was with Joseph",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 3,
   "night": 4,
   "scripture": "Genesis 39:1–6, 20–23",
   "scriptureBook": "Genesis",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "integrity",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "integrity",
   "teachingNote": "Reach for this when your child must keep choosing right while things are unfair, like Joseph, because the Lord is with them.",
   "teaser": "In Egypt, a man named Potiphar bought Joseph. Joseph had to work in Potiphar’s house. Joseph worked hard. The Lord was with Joseph and helped everything he did go well. Potiphar saw that the Lord was with Joseph. So…",
   "wordCount": 125
  },
  {
   "id": "b3-w3-n5",
   "title": "Joseph Helps in Prison",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 3,
   "night": 5,
   "scripture": "Genesis 40:1–13, 21",
   "scriptureBook": "Genesis",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "compassion",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "compassion",
   "teachingNote": "Reach for this when your child could notice a sad face and needs Joseph's picture of asking, why do you look so sad today?",
   "teaser": "The king of Egypt was angry with two of his helpers. One brought the king his drinks. One was his baker. They were put in Joseph’s prison. Joseph took care of them. One morning he looked at them and saw sad faces…",
   "wordCount": 122
  },
  {
   "id": "b3-w3-n6",
   "title": "Pharaoh’s Strange Dream",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 3,
   "night": 6,
   "scripture": "Genesis 41:1–16, 25–32",
   "scriptureBook": "Genesis",
   "traveler": "wren",
   "feeling": "grateful",
   "virtues": [
    "humility",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child is praised for a gift or talent and needs Joseph's words that it comes from Heavenly Father.",
   "teaser": "Pharaoh was the king of Egypt. One night he dreamed of seven fat cows by the river. Then seven skinny cows came and ate them up! He dreamed again. Seven full heads of grain grew on one stalk. Seven thin ones…",
   "wordCount": 125
  },
  {
   "id": "b3-w3-n7",
   "title": "Joseph Saves Food",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 3,
   "night": 7,
   "scripture": "Genesis 41:38–49, 53–57",
   "scriptureBook": "Genesis",
   "traveler": "scout",
   "feeling": "safe",
   "virtues": [
    "wisdom",
    "diligence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wisdom",
   "teachingNote": "Reach for this when your child needs to see that getting ready, like Joseph saving grain, lets Heavenly Father take care of us.",
   "teaser": "Pharaoh asked, “Can we find another man like this, who has Heavenly Father’s Spirit?” So Pharaoh put Joseph in charge of all Egypt. For seven years the fields grew lots and lots of food. Joseph gathered the grain…",
   "wordCount": 119
  },
  {
   "id": "b3-w4-n1",
   "title": "The Brothers Come for Food",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 4,
   "night": 1,
   "scripture": "Genesis 42:1–9",
   "scriptureBook": "Genesis",
   "traveler": "wren",
   "feeling": "amazed",
   "virtues": [
    "trust-in-god",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child sees a surprising turn and needs to know Heavenly Father was helping Joseph's family all along.",
   "teaser": "Far away, where Jacob lived, no food would grow. Jacob’s big family was hungry. Jacob heard there was grain in Egypt. He told his sons, “Go and buy food, so we may live.” Ten brothers went. Jacob did not send…",
   "wordCount": 110
  },
  {
   "id": "b3-w4-n2",
   "title": "Benjamin Comes Too",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 4,
   "night": 2,
   "scripture": "Genesis 43:1–16, 29–30",
   "scriptureBook": "Genesis",
   "traveler": "beau",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child is worried about sending someone they love away and needs to trust Heavenly Father with them.",
   "teaser": "Soon the food from Egypt was all gone. But the ruler had said, “Do not come back without your youngest brother.” Jacob did not want Benjamin to go. Judah said, “I will take care of him. If I do not bring him back…",
   "wordCount": 122
  },
  {
   "id": "b3-w4-n3",
   "title": "Judah Offers Himself",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 4,
   "night": 3,
   "scripture": "Genesis 44:1–2, 12–13, 18, 32–34",
   "scriptureBook": "Genesis",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "courage",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child wants to take the blame or stand in for a sibling and needs the picture of Judah offering himself.",
   "teaser": "The brothers were ready to go home. Joseph told his helper to put his silver cup in Benjamin’s sack of grain. On the road, the helper caught up to them. He looked in every sack. The cup was in Benjamin’s sack! The…",
   "wordCount": 123
  },
  {
   "id": "b3-w4-n4",
   "title": "“I Am Joseph”",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 4,
   "night": 4,
   "scripture": "Genesis 45:1–8, 14–15",
   "scriptureBook": "Genesis",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "forgiveness",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "forgiveness",
   "teachingNote": "Reach for this when your child is carrying a grudge and needs the picture of Joseph weeping, I am Joseph, and forgiving.",
   "teaser": "Joseph could not hold in his feelings anymore. He sent everyone else out. He cried so loud that people outside heard. Joseph said, “I am Joseph! Is my father still alive?” His brothers were so surprised and afraid…",
   "wordCount": 122
  },
  {
   "id": "b3-w4-n5",
   "title": "Jacob Sees Joseph Again",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 4,
   "night": 5,
   "scripture": "Genesis 45:25–28; 46:1–4, 29–30",
   "scriptureBook": "Genesis",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "family-love",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "family-love",
   "teachingNote": "Reach for this when your child is overjoyed to see someone after a long time and needs the picture of Jacob and Joseph's hug.",
   "teaser": "The brothers told Jacob, “Joseph is alive! He is a ruler in Egypt!” At first, Jacob could not believe it. Then Jacob saw the wagons Joseph sent to carry him. His heart felt happy again. He said, “Joseph is alive. I…",
   "wordCount": 122
  },
  {
   "id": "b3-w4-n6",
   "title": "Blessing the Grandsons",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 4,
   "night": 6,
   "scripture": "Genesis 48:8–16",
   "scriptureBook": "Genesis",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "family-love",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "family-love",
   "teachingNote": "Reach for this when your child needs to feel held close and blessed, as Jacob held Ephraim and Manasseh.",
   "teaser": "Jacob was very old, and his eyes could not see well. Joseph brought his two sons to him. Jacob sat up in his bed. Jacob asked, “Who are these?” Joseph said, “My sons, whom Heavenly Father gave me.” Jacob said…",
   "wordCount": 124
  },
  {
   "id": "b3-w4-n7",
   "title": "Meant for Good",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 4,
   "night": 7,
   "scripture": "Genesis 50:15–21",
   "scriptureBook": "Genesis",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "forgiveness",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "forgiveness",
   "teachingNote": "Reach for this when your child fears the worst after a wrong and needs to hear that Heavenly Father can turn hard things into good.",
   "teaser": "Jacob grew old and died, and his family missed him. Joseph’s brothers were afraid. They thought, “Now Joseph may pay us back for the wrong we did.” They sent a message: “Please forgive us.” Joseph cried. The…",
   "wordCount": 122
  },
  {
   "id": "b3-w5-n1",
   "title": "A New King in Egypt",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 5,
   "night": 1,
   "scripture": "Exodus 1:7–14",
   "scriptureBook": "Exodus",
   "traveler": "willow",
   "feeling": "discouraged",
   "virtues": [
    "trust-in-god",
    "perseverance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels worn out by a hard season and needs to know Heavenly Father sees the hard days.",
   "teaser": "Long ago, Jacob’s big family lived in Egypt. Jacob was also called Israel, so they were the Israelites. They grew and grew! Then a new king called Pharaoh ruled Egypt. He did not know Joseph, who had once helped…",
   "wordCount": 123
  },
  {
   "id": "b3-w5-n2",
   "title": "The Brave Midwives",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 5,
   "night": 2,
   "scripture": "Exodus 1:15–21",
   "scriptureBook": "Exodus",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "courage",
    "integrity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child must choose right though it is scary and needs the picture of Shiphrah and Puah standing tall.",
   "teaser": "In Egypt lived two Israelite women named Shiphrah and Puah. They were midwives, who helped mothers when new babies were born. The king of Egypt was afraid of the Israelites. He made a cruel rule against their baby…",
   "wordCount": 120
  },
  {
   "id": "b3-w5-n3",
   "title": "A Baby in a Basket",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 5,
   "night": 3,
   "scripture": "Exodus 2:1–4",
   "scriptureBook": "Exodus",
   "traveler": "scout",
   "feeling": "calm",
   "virtues": [
    "trust-in-god",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child is anxious about someone small and needs the picture of baby Moses in a basket watched over by Heavenly Father.",
   "teaser": "An Israelite mother had a beautiful baby boy. But the king’s cruel rule made Egypt unsafe for baby boys. So she hid him for three months. When she could not hide him anymore, she made a basket. She made it from tall…",
   "wordCount": 121
  },
  {
   "id": "b3-w5-n4",
   "title": "The Princess Finds Moses",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 5,
   "night": 4,
   "scripture": "Exodus 2:5–10",
   "scriptureBook": "Exodus",
   "traveler": "willow",
   "feeling": "eager",
   "virtues": [
    "compassion",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "compassion",
   "teachingNote": "Reach for this when your child could rescue or help a little one and needs the picture of the princess drawing Moses from the water.",
   "teaser": "One day the king’s daughter, a princess, came to the river to wash. Her helpers walked along the river. The princess saw the little basket in the tall grass. She sent her helper to bring it. She opened it, and a…",
   "wordCount": 125
  },
  {
   "id": "b3-w5-n5",
   "title": "Moses Helps at the Well",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 5,
   "night": 5,
   "scripture": "Exodus 2:15–21",
   "scriptureBook": "Exodus",
   "traveler": "beau",
   "feeling": "eager",
   "virtues": [
    "courage",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child sees someone being treated unfairly and needs Moses' picture of standing up and helping at the well.",
   "teaser": "Moses grew up as the princess’s son. Later, the king became angry with him. So Moses went far away to a land called Midian. Moses sat down to rest by a well, a deep hole of water. Seven sisters came to get water for…",
   "wordCount": 119
  },
  {
   "id": "b3-w5-n6",
   "title": "“Who Am I?”",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 5,
   "night": 6,
   "scripture": "Exodus 3:10–12; 4:10–16, 27",
   "scriptureBook": "Exodus",
   "traveler": "wren",
   "feeling": "nervous",
   "virtues": [
    "humility",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child says, I cannot do it, and needs to hear Who am I? answered with, I will be with thee.",
   "teaser": "The Lord, who was Jesus, spoke to Moses. He said, “Go to Pharaoh, the king of Egypt. Bring My people out of Egypt.” But Moses felt very small. He said, “Who am I, that I should go?” The Lord said, “I will be with…",
   "wordCount": 122
  },
  {
   "id": "b3-w5-n7",
   "title": "“I Have Remembered”",
   "volume": "ot",
   "book": 3,
   "bookTitle": "Nothing Is Too Hard for the Lord",
   "month": "March",
   "week": 5,
   "night": 7,
   "scripture": "Exodus 5:1–2; 6:1–8",
   "scriptureBook": "Exodus",
   "traveler": "scout",
   "feeling": "safe",
   "virtues": [
    "keeping-promises",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "keeping-promises",
   "teachingNote": "Reach for this when your child doubts they are remembered and needs to hear the Lord remembers His covenant and His people.",
   "teaser": "Moses and Aaron went to Pharaoh, the king of Egypt. They said, “The Lord says, Let My people go!” But Pharaoh said, “No.” Then Pharaoh made the Israelites’ work even harder. Moses felt sad. He asked the Lord, “Why?”…",
   "wordCount": 120
  },
  {
   "id": "b4-w1-n1",
   "title": "The King on a Donkey",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 1,
   "night": 1,
   "scripture": "Zechariah 9:9; Matthew 21:1–11",
   "scriptureBook": "Zechariah",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "worship-together",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "worship-together",
   "teachingNote": "Reach for this when your child is bursting with joy and needs to know a gentle King is worth welcoming with a loud, happy welcome.",
   "teaser": "Long ago, Zechariah told the people what Heavenly Father said. He spoke of a King who would come. Zechariah said, “Shout for joy! Your King is coming to you, riding on a donkey.” This King would not come proud and…",
   "wordCount": 116
  },
  {
   "id": "b4-w1-n2",
   "title": "He Carried Our Sorrows",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 1,
   "night": 2,
   "scripture": "Isaiah 53:4; Matthew 26:36–39",
   "scriptureBook": "Isaiah",
   "traveler": "willow",
   "feeling": "sad",
   "virtues": [
    "comfort",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "comfort",
   "teachingNote": "Reach for this when your child feels heavy with sadness and needs to hear that Jesus already carries it with them.",
   "teaser": "Long ago, Isaiah wrote that Someone would carry our sorrows, our sad feelings. Isaiah was talking about Jesus. One night, Jesus went to a garden called Gethsemane. He asked Peter, James, and John to wait and watch…",
   "wordCount": 110
  },
  {
   "id": "b4-w1-n3",
   "title": "Quiet Like a Lamb",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 1,
   "night": 3,
   "scripture": "Isaiah 53:7; Mark 14:53–61",
   "scriptureBook": "Isaiah",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "self-control",
    "peacemaking"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "self-control",
   "teachingNote": "Reach for this when your child is wound up or being unfairly blamed and needs a picture of staying quiet and kind.",
   "teaser": "Isaiah wrote that Jesus would be quiet, like a lamb. When a farmer clips a sheep’s wool, it stands still and makes no sound. Isaiah said, “He opened not His mouth.” Isaiah was talking about Jesus. Jesus would not…",
   "wordCount": 115
  },
  {
   "id": "b4-w1-n4",
   "title": "The Most Important Stone",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 1,
   "night": 4,
   "scripture": "Psalm 118:22; Matthew 21:23, 42",
   "scriptureBook": "Psalm",
   "traveler": "wren",
   "feeling": "amazed",
   "virtues": [
    "faith",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child feels unsteady or unimportant and needs to know Jesus is the strong stone everything is built on.",
   "teaser": "Long ago, someone wrote a song of praise to the Lord. It said, “The stone the builders did not want became the corner stone.” A corner stone is the big stone at the corner, where two walls meet. It holds the walls…",
   "wordCount": 122
  },
  {
   "id": "b4-w1-n5",
   "title": "Jesus Gave His Life",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 1,
   "night": 5,
   "scripture": "Isaiah 53:5, 12; John 19:17–18, 25, 30",
   "scriptureBook": "Isaiah",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "trust-in-god",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child wonders how much Jesus loves them and needs to hear He gave His life, and Sunday was coming.",
   "teaser": "Isaiah wrote that Jesus would be hurt for us. Then we could be healed, made well and whole. Isaiah was talking about Jesus. Isaiah also said Jesus would carry the wrong things that many people do. One day, Jesus…",
   "wordCount": 120
  },
  {
   "id": "b4-w1-n6",
   "title": "Joseph’s Gift",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 1,
   "night": 6,
   "scripture": "Isaiah 53:9; Matthew 27:57–60",
   "scriptureBook": "Isaiah",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "generosity",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child wants to give something to Jesus and needs to see Joseph giving his best while waiting.",
   "teaser": "Isaiah wrote that when Jesus died, His grave would be with the rich. Isaiah was talking about Jesus. After Jesus died, a rich man named Joseph came. He was a follower of Jesus. He asked Pilate, the ruler, to let him…",
   "wordCount": 112
  },
  {
   "id": "b4-w1-n7",
   "title": "He Is Risen!",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 1,
   "night": 7,
   "scripture": "Isaiah 25:8; Mark 16:1–6; Luke 24:6",
   "scriptureBook": "Isaiah",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "hope",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child is sad about an ending and needs the happy news that Jesus is alive.",
   "teaser": "Early on Sunday, as the sun came up, three women walked to Jesus’s tomb. They brought sweet spices for His body, to show their love. On the way they wondered, “Who will roll away the big stone?” But when they…",
   "wordCount": 121
  },
  {
   "id": "b4-w2-n1",
   "title": "Aaron’s Staff",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 2,
   "night": 1,
   "scripture": "Exodus 7:8–13",
   "scriptureBook": "Exodus",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "courage",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child is scared to do the right thing and needs a picture of Moses and Aaron standing in front of Pharaoh.",
   "teaser": "Moses and his big brother Aaron went to see Pharaoh, the king of Egypt. The Lord wanted His people to go free. The Lord said Pharaoh would ask them to show a wonder. So Aaron threw down his tall walking stick…",
   "wordCount": 112
  },
  {
   "id": "b4-w2-n2",
   "title": "The River and the Frogs",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 2,
   "night": 2,
   "scripture": "Exodus 7:19–21; 8:1–15",
   "scriptureBook": "Exodus",
   "traveler": "scout",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels small beside big, scary things and needs to know the Lord is stronger than anything.",
   "teaser": "The Lord told Pharaoh, “Let My people go.” But Pharaoh said no. So the Lord sent signs to show His power. Aaron held his staff over the river. The water turned to blood, and no one could drink it. Next, frogs came…",
   "wordCount": 123
  },
  {
   "id": "b4-w2-n3",
   "title": "Pharaoh Says No Again",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 2,
   "night": 3,
   "scripture": "Exodus 8:16–32; 9:1–7",
   "scriptureBook": "Exodus",
   "traveler": "wren",
   "feeling": "confused",
   "virtues": [
    "humility",
    "heeding-counsel"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child keeps saying no to a clear instruction and needs a picture of Pharaoh's hard heart and a soft one.",
   "teaser": "Pharaoh still would not let the Lord’s people go. Aaron hit the dust with his staff, and it became tiny bugs called lice. Pharaoh’s magicians could not do it. They said only Heavenly Father’s power could. Next, the…",
   "wordCount": 116
  },
  {
   "id": "b4-w2-n4",
   "title": "Light in Their Homes",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 2,
   "night": 4,
   "scripture": "Exodus 10:21–23",
   "scriptureBook": "Exodus",
   "traveler": "beau",
   "feeling": "comforted",
   "virtues": [
    "comfort",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "comfort",
   "teachingNote": "Reach for this when your child is afraid of the dark and needs to remember that Israel's homes had light.",
   "teaser": "Pharaoh still would not let the Lord’s people go. So the Lord told Moses, “Stretch out your hand toward heaven.” Moses lifted his hand up to the sky. Then a thick darkness covered all of Egypt for three days. It was…",
   "wordCount": 115
  },
  {
   "id": "b4-w2-n5",
   "title": "The Passover Lamb",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 2,
   "night": 5,
   "scripture": "Exodus 12:3–14, 28",
   "scriptureBook": "Exodus",
   "traveler": "willow",
   "feeling": "safe",
   "virtues": [
    "obedience",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child wants to know why we follow instructions and needs the picture of a family safe inside, under the lamb's blood.",
   "teaser": "The Lord told Moses how families should get ready. Each family chose a perfect little lamb for supper. They put some of its blood on the sides and top of the door. The Lord said, “When I see the blood, I will pass…",
   "wordCount": 122
  },
  {
   "id": "b4-w2-n6",
   "title": "Going Out of Egypt",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 2,
   "night": 6,
   "scripture": "Exodus 12:31–42, 51",
   "scriptureBook": "Exodus",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "trust-in-god",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child is waiting for a promise and needs to hear the Lord kept His word and set His people free.",
   "teaser": "That night, Pharaoh called for Moses and Aaron. He said, “Go! Take your sheep and cows, and serve the Lord.” The people hurried. There was no time to let their bread dough rise. They wrapped the dough bowls in…",
   "wordCount": 115
  },
  {
   "id": "b4-w2-n7",
   "title": "Remember This Day",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 2,
   "night": 7,
   "scripture": "Exodus 13:3, 8–10, 21–22",
   "scriptureBook": "Exodus",
   "traveler": "wren",
   "feeling": "grateful",
   "virtues": [
    "gratitude",
    "love-of-scripture"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child forgets good things quickly and needs a way to remember what the Lord has done.",
   "teaser": "Moses told the people, “Remember this day, when you came out of Egypt.” The Lord’s strong hand had set them free. Every year, moms and dads would tell their children the story. They said, “The Lord brought me out of…",
   "wordCount": 112
  },
  {
   "id": "b4-w3-n1",
   "title": "Stand Still and See",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 3,
   "night": 1,
   "scripture": "Exodus 14:5–14",
   "scriptureBook": "Exodus",
   "traveler": "beau",
   "feeling": "nervous",
   "virtues": [
    "trust-in-god",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child is afraid with trouble close behind and needs to hear that being still can be brave.",
   "teaser": "Heavenly Father’s people had just left Egypt. They set up their tents beside the sea. Then the king of Egypt chased after them with soldiers and horses. Now the sea was in front of them, and the soldiers were…",
   "wordCount": 122
  },
  {
   "id": "b4-w3-n2",
   "title": "A Path Through the Sea",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 3,
   "night": 2,
   "scripture": "Exodus 14:15–22, 28–31",
   "scriptureBook": "Exodus",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "faith",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child sees no way forward and needs a picture of the sea opening into dry ground.",
   "teaser": "The Lord’s tall cloud had always led His people. Now it moved behind them, between them and the soldiers. It gave them light all night. The Lord told Moses, “Lift up your walking stick. Stretch your hand over the…",
   "wordCount": 124
  },
  {
   "id": "b4-w3-n3",
   "title": "Miriam’s Song",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 3,
   "night": 3,
   "scripture": "Exodus 15:1–2, 20–21",
   "scriptureBook": "Exodus",
   "traveler": "willow",
   "feeling": "happy",
   "virtues": [
    "gratitude",
    "worship-together"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child is overflowing with thanks and needs to know a happy song can be a prayer.",
   "teaser": "Heavenly Father’s people were safe on the other side of the sea. They felt so happy that they wanted to sing! Moses and the people sang, “The Lord is my strength and my song.” The Lord had made them strong. He had…",
   "wordCount": 117
  },
  {
   "id": "b4-w3-n4",
   "title": "Sweet Water",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 3,
   "night": 4,
   "scripture": "Exodus 15:22–27",
   "scriptureBook": "Exodus",
   "traveler": "wren",
   "feeling": "frustrated",
   "virtues": [
    "prayer",
    "patience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child is grumbling that nothing is right and needs to learn to pray instead.",
   "teaser": "Moses led the people away from the sea into a wide, dry land. They walked for three days and found no water. At last they found water, but it tasted bitter and yucky. The people grumbled at Moses, “What shall we…",
   "wordCount": 121
  },
  {
   "id": "b4-w3-n5",
   "title": "Bread Every Morning",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 3,
   "night": 5,
   "scripture": "Exodus 16:4, 14–26, 30–31",
   "scriptureBook": "Exodus",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "trust-in-god",
    "contentment"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child worries about tomorrow and needs a picture of just enough bread for today.",
   "teaser": "The Lord said, “I will rain bread from heaven for you.” He wanted to see if they would trust Him. In the morning, tiny round flakes lay on the ground, like frost. The people asked, “What is it?” They called it…",
   "wordCount": 125
  },
  {
   "id": "b4-w3-n6",
   "title": "Water from the Rock",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 3,
   "night": 6,
   "scripture": "Exodus 17:1–7; 1 Corinthians 10:4",
   "scriptureBook": "Exodus",
   "traveler": "scout",
   "feeling": "comforted",
   "virtues": [
    "trust-in-god",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child is thirsty for help and needs to know Jesus is a strong rock who gives what we need.",
   "teaser": "The people came to a dry place with no water. They were thirsty, and so were their children. They argued with Moses, “Give us water!” Moses prayed, “What shall I do?” The Lord said, “Take your walking stick. I will…",
   "wordCount": 124
  },
  {
   "id": "b4-w3-n7",
   "title": "Moses Shares the Work",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 3,
   "night": 7,
   "scripture": "Exodus 18:5–9, 13–26",
   "scriptureBook": "Exodus",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "service",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child tries to do everything alone and needs to see how sharing the work makes it lighter.",
   "teaser": "Jethro, the father of Moses’s wife, came to visit Moses. Moses told him all the Lord had done to save the people. Jethro was so glad! The next day, the people came to Moses with all their problems. They waited from…",
   "wordCount": 121
  },
  {
   "id": "b4-w4-n1",
   "title": "On Eagles’ Wings",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 4,
   "night": 1,
   "scripture": "Exodus 19:1–8",
   "scriptureBook": "Exodus",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "trust-in-god",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child needs to feel carried and held close like young eagles on strong wings.",
   "teaser": "Heavenly Father’s people walked out of Egypt. They came to a tall mountain called Sinai. Moses went up the mountain, and the Lord spoke to him. The Lord was Jesus. He said, “I carried you on eagles’ wings and…",
   "wordCount": 123
  },
  {
   "id": "b4-w4-n2",
   "title": "The Mountain Smoked",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 4,
   "night": 2,
   "scripture": "Exodus 19:9, 16–20; 20:20",
   "scriptureBook": "Exodus",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "reverence",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child is struck quiet by something big and needs to know awe is a good way to feel near God.",
   "teaser": "The Lord told Moses, “I will come to you in a thick cloud. Then the people can hear Me talk with you.” On the third morning, thunder boomed and lightning flashed. A trumpet blew, louder and louder. The whole…",
   "wordCount": 123
  },
  {
   "id": "b4-w4-n3",
   "title": "Ten Commandments, Part 1",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 4,
   "night": 3,
   "scripture": "Exodus 20:1–11",
   "scriptureBook": "Exodus",
   "traveler": "beau",
   "feeling": "loved",
   "virtues": [
    "reverence",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child asks what matters most and needs to hear: love Heavenly Father first.",
   "teaser": "On the mountain, the Lord gave His people ten commandments. They are rules from Heavenly Father that keep us safe and happy. The Lord said, “I am the Lord, who brought you out of Egypt.” First, let nothing be more…",
   "wordCount": 121
  },
  {
   "id": "b4-w4-n4",
   "title": "Ten Commandments, Part 2",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 4,
   "night": 4,
   "scripture": "Exodus 20:12–17; Matthew 22:37–40",
   "scriptureBook": "Exodus",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "honoring-parents",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "honoring-parents",
   "teachingNote": "Reach for this when your child is learning how to treat others and needs to see the commandments as ways to love.",
   "teaser": "The Lord gave six more commandments. These teach us how to treat the people around us. Fifth, honor your father and mother. To honor them is to love them, listen to them, and show respect. Sixth, do not kill…",
   "wordCount": 121
  },
  {
   "id": "b4-w4-n5",
   "title": "Moses on the Mountain",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 4,
   "night": 5,
   "scripture": "Exodus 24:12–18; 31:18",
   "scriptureBook": "Exodus",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "patience",
    "love-of-scripture"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "patience",
   "teachingNote": "Reach for this when your child is waiting for an answer and needs a picture of Moses waiting and listening on the mountain.",
   "teaser": "The Lord said, “Moses, come up to Me on the mountain. I will give you flat stones with My commandments written on them.” Then Moses could teach the people. Moses climbed up with his helper Joshua. A cloud covered…",
   "wordCount": 122
  },
  {
   "id": "b4-w4-n6",
   "title": "The Golden Calf",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 4,
   "night": 6,
   "scripture": "Exodus 32:1–8, 19–20, 30–32",
   "scriptureBook": "Exodus",
   "traveler": "beau",
   "feeling": "guilty",
   "virtues": [
    "repentance",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child forgot what they promised and needs to know saying sorry lets Jesus help them begin again.",
   "teaser": "Moses was up on the mountain a long time. The people asked Aaron to make them something to follow. Aaron melted their gold earrings and made a gold calf, a baby cow. The people bowed down to it. They forgot the…",
   "wordCount": 125
  },
  {
   "id": "b4-w4-n7",
   "title": "Moses’s Shining Face",
   "volume": "ot",
   "book": 4,
   "bookTitle": "Let My People Go!",
   "month": "April",
   "week": 4,
   "night": 7,
   "scripture": "Exodus 33:11; 34:1–4, 28–35",
   "scriptureBook": "Exodus",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "identity",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child wants to feel close to God and needs to see Moses's face shining after being near Him.",
   "teaser": "The Lord talked with Moses face to face, like a friend. He said, “Cut two new flat stones. I will write My words on them again.” Early in the morning, Moses climbed the mountain all alone. He carried the two stones…",
   "wordCount": 125
  },
  {
   "id": "b5-w1-n1",
   "title": "Willing Hearts",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 1,
   "night": 1,
   "scripture": "Exodus 35:4–5, 20–29; 36:3–7",
   "scriptureBook": "Exodus",
   "traveler": "willow",
   "feeling": "happy",
   "virtues": [
    "generosity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child hesitates to share and needs to see how glad giving with a willing heart can feel.",
   "teaser": "Heavenly Father’s people were traveling in the desert. The Lord asked them to build Him a holy tent, called the tabernacle. Then He could be near them. Moses said, “Whoever has a willing heart, bring a gift to the…",
   "wordCount": 122
  },
  {
   "id": "b5-w1-n2",
   "title": "Bezaleel’s Wise Hands",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 1,
   "night": 2,
   "scripture": "Exodus 35:30–35; 36:1–2",
   "scriptureBook": "Exodus",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "humility",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child says \"I can't\" and needs to know Heavenly Father gives gifts to use for helping.",
   "teaser": "The Lord’s holy tent needed a builder. The Lord chose a man named Bezaleel. He even called him by name! The Lord filled Bezaleel with His Spirit. The Spirit made him wise, so he knew how to make beautiful things…",
   "wordCount": 115
  },
  {
   "id": "b5-w1-n3",
   "title": "The Ark of the Covenant",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 1,
   "night": 3,
   "scripture": "Exodus 25:8; 36:8; 37:1–9; 40:20",
   "scriptureBook": "Exodus",
   "traveler": "scout",
   "feeling": "calm",
   "virtues": [
    "reverence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child is wiggly in a holy place and needs a picture of the quiet ark and its golden angels.",
   "teaser": "The Lord said, “Let them make Me a holy place to live among them.” The people were traveling, so they made a holy tent they could carry. Its soft curtains were blue, purple and red, with angels woven in. Bezaleel…",
   "wordCount": 117
  },
  {
   "id": "b5-w1-n4",
   "title": "The Cloud of Glory",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 1,
   "night": 4,
   "scripture": "Exodus 39:30, 43; 40:33–37",
   "scriptureBook": "Exodus",
   "traveler": "wren",
   "feeling": "amazed",
   "virtues": [
    "reverence",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child wonders how to know where to go, and needs the picture of a cloud that led the people.",
   "teaser": "The workers made holy clothes for Aaron, Moses’ brother. Aaron served the Lord at His holy tent. They made a gold plate for Aaron’s hat. On it they wrote, “Holiness to the Lord.” It showed Aaron’s work was just for…",
   "wordCount": 121
  },
  {
   "id": "b5-w1-n5",
   "title": "Offerings Point to Jesus",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 1,
   "night": 5,
   "scripture": "Leviticus 1:1–4; 4:27–35",
   "scriptureBook": "Leviticus",
   "traveler": "wren",
   "feeling": "grateful",
   "virtues": [
    "faith",
    "pondering"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child asks why we remember Jesus, and needs the picture of a perfect lamb pointing to Him.",
   "teaser": "The Lord spoke to Moses from His holy tent. He taught about offerings, gifts the people gave the Lord at His altar. A family could bring a lamb or a young calf. It had to be perfect, with nothing wrong at all. They…",
   "wordCount": 121
  },
  {
   "id": "b5-w1-n6",
   "title": "The Day of Atonement",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 1,
   "night": 6,
   "scripture": "Leviticus 16:21–22, 30",
   "scriptureBook": "Leviticus",
   "traveler": "beau",
   "feeling": "comforted",
   "virtues": [
    "repentance",
    "comfort"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child feels bad about a wrong choice and needs the picture of sins carried far away.",
   "teaser": "Once a year came a special day, the Day of Atonement. It was a day for coming close to the Lord again, clean inside. Everyone makes wrong choices, called sins. Sins can make us feel far from Heavenly Father. Aaron…",
   "wordCount": 123
  },
  {
   "id": "b5-w1-n7",
   "title": "Love Your Neighbor",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 1,
   "night": 7,
   "scripture": "Leviticus 19:2, 9–10, 18, 32",
   "scriptureBook": "Leviticus",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "kindness",
    "generosity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child sees someone in need and needs the picture of grain left in the corners of a field.",
   "teaser": "The Lord told Moses, “Be holy, because I, the Lord, am holy.” He wanted His people to be good and kind, like Him. The Lord said, “When you cut your grain, leave the corners of your field. Leave some grapes on the…",
   "wordCount": 118
  },
  {
   "id": "b5-w2-n1",
   "title": "Seventy Helpers",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 2,
   "night": 1,
   "scripture": "Numbers 11:4–6, 10–17, 24–29; 12:3",
   "scriptureBook": "Numbers",
   "traveler": "willow",
   "feeling": "worried",
   "virtues": [
    "humility",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child feels the job is too big and needs to hear that seventy helpers shared Moses's load.",
   "teaser": "Every morning the Lord sent manna, bread from heaven. But some people cried, “We want meat! We miss the fish and melons we ate in Egypt.” Moses felt tired and sad. He told the Lord, “I cannot carry all these people…",
   "wordCount": 123
  },
  {
   "id": "b5-w2-n2",
   "title": "Grapes on a Pole",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 2,
   "night": 2,
   "scripture": "Numbers 13:1–3, 17–27",
   "scriptureBook": "Numbers",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "wonder",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wonder",
   "teachingNote": "Reach for this when your child doubts good things are coming and needs the picture of grapes so big two men carried them.",
   "teaser": "Heavenly Father’s people came near the land He promised them. The Lord said, “Send men to look at the land.” So Moses sent twelve men, one from each family group. Moses said, “Be brave, and bring back some fruit.”…",
   "wordCount": 118
  },
  {
   "id": "b5-w2-n3",
   "title": "Brave Joshua and Caleb",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 2,
   "night": 3,
   "scripture": "Numbers 13:30–33; 14:1–9, 24, 31, 33",
   "scriptureBook": "Numbers",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "courage",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child feels afraid of something new and needs the picture of Joshua and Caleb standing tall.",
   "teaser": "The twelve men came back. Caleb said, “We can do it!” But most of the men were afraid. They said, “The people there are giants! We felt as small as grasshoppers.” That night the people cried. They wanted to go back…",
   "wordCount": 125
  },
  {
   "id": "b5-w2-n4",
   "title": "Water at Meribah",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 2,
   "night": 4,
   "scripture": "Numbers 20:2–12",
   "scriptureBook": "Numbers",
   "traveler": "wren",
   "feeling": "impatient",
   "virtues": [
    "self-control",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "self-control",
   "teachingNote": "Reach for this when your child gets hot and does things their own way, and needs the picture of Moses hitting the rock.",
   "teaser": "Heavenly Father’s people came to a dry place with no water. Thirsty and grumpy, they argued with Moses and Aaron. So Moses and Aaron bowed low before the Lord. The Lord said, “Take your stick. Speak to the rock in…",
   "wordCount": 120
  },
  {
   "id": "b5-w2-n5",
   "title": "Balaam’s Talking Donkey",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 2,
   "night": 5,
   "scripture": "Numbers 22:1–35",
   "scriptureBook": "Numbers",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "humility",
    "heeding-counsel"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child gets cross at what blocks the way and needs the picture of a donkey who saw the angel first.",
   "teaser": "King Balak was afraid of Heavenly Father’s people. He asked Balaam to curse them, to wish bad things on them. But the Lord told Balaam, “Do not curse them, for they are blessed.” Later, Balaam rode off on his…",
   "wordCount": 121
  },
  {
   "id": "b5-w2-n6",
   "title": "A Star Out of Jacob",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 2,
   "night": 6,
   "scripture": "Numbers 23:1–12; 24:1–17",
   "scriptureBook": "Numbers",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "stand-for-truth",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "stand-for-truth",
   "teachingNote": "Reach for this when your child feels pushed to say unkind things and needs Balaam's picture of blessing instead.",
   "teaser": "King Balak took Balaam up high to look at Israel’s tents. Balak wanted Balaam to curse them, to say bad words against them. But Balaam said, “How can I curse people the Lord has not cursed?” Instead he blessed them…",
   "wordCount": 119
  },
  {
   "id": "b5-w2-n7",
   "title": "Joshua Leads Next",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 2,
   "night": 7,
   "scripture": "Numbers 27:12–23",
   "scriptureBook": "Numbers",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "compassion",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "compassion",
   "teachingNote": "Reach for this when your child worries who will take care of the family and needs the picture of the Good Shepherd.",
   "teaser": "The Lord told Moses, “Climb this mountain. See the land I give My people.” But because Moses hit the rock, he would not lead them into it. Moses cared about the people. He prayed, “Please give them a new leader. Do…",
   "wordCount": 122
  },
  {
   "id": "b5-w3-n1",
   "title": "With All Your Heart",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 3,
   "night": 1,
   "scripture": "Deuteronomy 6:1–9",
   "scriptureBook": "Deuteronomy",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "love-of-scripture",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this when your child asks how to love Heavenly Father and needs the picture of His words talked about all day.",
   "teaser": "Heavenly Father’s people were almost to their new home. First, old Moses gave them some last words to keep. Moses said, “Hear, O Israel. Love the Lord with all your heart, all your soul and all your might.” That…",
   "wordCount": 120
  },
  {
   "id": "b5-w3-n2",
   "title": "More Than Bread",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 3,
   "night": 2,
   "scripture": "Deuteronomy 8:2–4; Matthew 4:4",
   "scriptureBook": "Deuteronomy",
   "traveler": "scout",
   "feeling": "safe",
   "virtues": [
    "love-of-scripture",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this when your child worries about having enough and needs the picture of manna and the Lord's words feeding hearts.",
   "teaser": "Moses said, “Remember the forty years the Lord led you through the wilderness.” It was a wild, dry land. When the people were hungry, the Lord fed them manna. It was a new food, like bread from heaven. And guess…",
   "wordCount": 113
  },
  {
   "id": "b5-w3-n3",
   "title": "Do Not Forget the Lord",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 3,
   "night": 3,
   "scripture": "Deuteronomy 7:7–8; 8:7–14",
   "scriptureBook": "Deuteronomy",
   "traveler": "wren",
   "feeling": "grateful",
   "virtues": [
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child takes good things for granted and needs to name three gifts from Heavenly Father.",
   "teaser": "Moses told the people about their new home. “It is a good land,” he said, “with little rivers and springs.” It had wheat and barley for bread. It had grapes, figs and red pomegranates full of juicy seeds. It had…",
   "wordCount": 115
  },
  {
   "id": "b5-w3-n4",
   "title": "Open Your Hand Wide",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 3,
   "night": 4,
   "scripture": "Deuteronomy 15:7–11, 15",
   "scriptureBook": "Deuteronomy",
   "traveler": "willow",
   "feeling": "happy",
   "virtues": [
    "generosity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child grips a toy tightly and needs the picture of a hand opened wide to share.",
   "teaser": "Moses taught the people how to care for each other. Some families would not have enough food or clothes. Moses said, “Do not shut your hand to a poor person. Open your hand wide, and give what he needs.” A shut hand…",
   "wordCount": 120
  },
  {
   "id": "b5-w3-n5",
   "title": "A Prophet Like Moses",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 3,
   "night": 5,
   "scripture": "Deuteronomy 18:15, 18; Acts 3:22; 3 Nephi 20:23",
   "scriptureBook": "Deuteronomy",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "heeding-counsel",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "heeding-counsel",
   "teachingNote": "Reach for this when your child needs help listening to a leader and needs the picture of Jesus, the Prophet Moses promised.",
   "teaser": "For many years, Moses told the people what Heavenly Father said. Now Moses was old, and he made them a promise. Moses said, “The Lord will send you a Prophet like me. Listen to Him.” The Lord said, “I will put My…",
   "wordCount": 118
  },
  {
   "id": "b5-w3-n6",
   "title": "Choose Life",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 3,
   "night": 6,
   "scripture": "Deuteronomy 29:10–12; 30:14–20",
   "scriptureBook": "Deuteronomy",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "wisdom",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wisdom",
   "teachingNote": "Reach for this when your child faces a choice between right and wrong and needs Moses's words, \"Choose life.\"",
   "teaser": "All of Heavenly Father’s people stood together before the Lord. The moms and dads were there, and the little children too! That day they made a covenant with Heavenly Father. A covenant is a two-way promise, like…",
   "wordCount": 115
  },
  {
   "id": "b5-w3-n7",
   "title": "Moses Sees the Land",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 3,
   "night": 7,
   "scripture": "Deuteronomy 34:1–9",
   "scriptureBook": "Deuteronomy",
   "traveler": "beau",
   "feeling": "comforted",
   "virtues": [
    "comfort",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "comfort",
   "teachingNote": "Reach for this when your child is sad about someone leaving and needs the picture of Moses handing his work to Joshua.",
   "teaser": "Moses was 120 years old, but his eyes saw clearly. He climbed a tall mountain called Nebo. From the top, the Lord showed Moses the promised land. He saw hills and Jericho, the city of palm trees. The Lord said…",
   "wordCount": 125
  },
  {
   "id": "b5-w4-n1",
   "title": "Be Strong and Brave",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 4,
   "night": 1,
   "scripture": "Joshua 1:1–9, 16",
   "scriptureBook": "Joshua",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "courage",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child is scared of a big new job and needs the Lord's words, \"Be strong and of a good courage.\"",
   "teaser": "Moses’s work on earth was done. Now the Lord chose Joshua to lead His people. Joshua had a big new job. He had to lead everyone across a river into the promised land. The Lord said, “Be strong and of a good courage…",
   "wordCount": 117
  },
  {
   "id": "b5-w4-n2",
   "title": "Rahab and the Red Cord",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 4,
   "night": 2,
   "scripture": "Joshua 2:1–21",
   "scriptureBook": "Joshua",
   "traveler": "willow",
   "feeling": "brave",
   "virtues": [
    "courage",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child is afraid to do the kind thing and needs the picture of Rahab's red cord.",
   "teaser": "Joshua sent two men to quietly look at the city of Jericho. A woman named Rahab let them stay at her house. Her house was built right into the city wall. Then the king’s men came looking for Joshua’s two men! Rahab…",
   "wordCount": 124
  },
  {
   "id": "b5-w4-n3",
   "title": "Walking Through the River",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 4,
   "night": 3,
   "scripture": "Joshua 3:5–17",
   "scriptureBook": "Joshua",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "faith",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child faces a big obstacle and needs the picture of priests stepping into the Jordan River.",
   "teaser": "Heavenly Father’s people came to the Jordan River. It was the time for picking crops, and the river was very full. Joshua said, “Get your hearts ready. Tomorrow the Lord will do wonders!” The priests, men chosen for…",
   "wordCount": 119
  },
  {
   "id": "b5-w4-n4",
   "title": "What Do These Stones Mean?",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 4,
   "night": 4,
   "scripture": "Joshua 4:1–9, 20–24",
   "scriptureBook": "Joshua",
   "traveler": "wren",
   "feeling": "grateful",
   "virtues": [
    "gratitude",
    "pondering"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child forgets past help and needs twelve stones to remember what the Lord did.",
   "teaser": "After everyone crossed the river, the Lord told Joshua to choose twelve men. There was one from each of the twelve big families. Each man went to the middle of the dry river, where the priests stood. He lifted a big…",
   "wordCount": 122
  },
  {
   "id": "b5-w4-n5",
   "title": "The Walls Fell Down",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 4,
   "night": 5,
   "scripture": "Joshua 6:1–5, 15–16, 20, 22–25",
   "scriptureBook": "Joshua",
   "traveler": "beau",
   "feeling": "safe",
   "virtues": [
    "faith",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child struggles to trust a plan that seems odd and needs the picture of walls falling after marching.",
   "teaser": "The city of Jericho had tall walls, and its gates were shut tight. The Lord, who was Jesus, gave Joshua a plan. For six days, the people walked around the city once a day. Priests carried the ark. Seven priests blew…",
   "wordCount": 122
  },
  {
   "id": "b5-w4-n6",
   "title": "Joshua Read to Everyone",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 4,
   "night": 6,
   "scripture": "Joshua 8:30–35",
   "scriptureBook": "Joshua",
   "traveler": "scout",
   "feeling": "connected",
   "virtues": [
    "love-of-scripture",
    "reverence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this when your child thinks scripture is only for grown-ups and needs the picture of children hearing every word.",
   "teaser": "Joshua gathered all the people in a valley between two mountains. The priests stood in the middle with the ark. Joshua wrote the Lord’s commandments that Moses taught onto big stones. Everyone watched him write…",
   "wordCount": 108
  },
  {
   "id": "b5-w4-n7",
   "title": "As for Me and My House",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 4,
   "night": 7,
   "scripture": "Joshua 23:1–2, 8; 24:1, 14–15, 24–27",
   "scriptureBook": "Joshua",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "family-love",
    "integrity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "family-love",
   "teachingNote": "Reach for this when your child wonders what your family stands for and needs Joshua's words, \"As for me and my house.\"",
   "teaser": "Many years later, Joshua was very old. He called Heavenly Father’s people together and said, “Hold on tight to the Lord.” Then he gathered them at a place called Shechem. He reminded them of all the good things the…",
   "wordCount": 123
  },
  {
   "id": "b5-w5-n1",
   "title": "The Lord Sent Judges",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 5,
   "night": 1,
   "scripture": "Judges 2:7–18; 3:9",
   "scriptureBook": "Judges",
   "traveler": "wren",
   "feeling": "comforted",
   "virtues": [
    "repentance",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child has forgotten Heavenly Father and needs to know they can always come back to Him.",
   "teaser": "When Joshua was alive, Heavenly Father’s people served the Lord. But their children grew up and forgot the Lord. They bowed down to statues that could not hear or help. Enemies took their things, and the people were…",
   "wordCount": 120
  },
  {
   "id": "b5-w5-n2",
   "title": "Deborah Under the Palm",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 5,
   "night": 2,
   "scripture": "Judges 4:3–9, 14",
   "scriptureBook": "Judges",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "courage",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child feels alone in a hard task and needs the picture of Deborah promising to go with Barak.",
   "teaser": "For twenty years, a king named Jabin was hard on Heavenly Father’s people. They cried to the Lord. Deborah told the people what the Lord said, and she led Israel. People came to her for help under a palm tree…",
   "wordCount": 125
  },
  {
   "id": "b5-w5-n3",
   "title": "The Lord Is with Thee",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 5,
   "night": 3,
   "scripture": "Judges 6:4–6, 11–16",
   "scriptureBook": "Judges",
   "traveler": "willow",
   "feeling": "nervous",
   "virtues": [
    "identity",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels too little or unimportant and needs the picture of Gideon the least called mighty.",
   "teaser": "People from another land, the Midianites, kept taking Israel’s food. So Gideon hid by a grape press to beat the grain from his wheat. An angel of the Lord came and sat under an oak tree. He said to Gideon, “The Lord…",
   "wordCount": 123
  },
  {
   "id": "b5-w5-n4",
   "title": "Gideon’s Wool Fleece",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 5,
   "night": 4,
   "scripture": "Judges 6:36–40",
   "scriptureBook": "Judges",
   "traveler": "scout",
   "feeling": "worried",
   "virtues": [
    "patience",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "patience",
   "teachingNote": "Reach for this when your child keeps asking the same worried question and needs the picture of patient Heavenly Father and the wet fleece.",
   "teaser": "Gideon had a big job to do. He wanted to be sure Heavenly Father would help him save Israel. So he put a fleece, the soft wool from a sheep, on the ground. He asked, “Let only the wool get wet with dew. Let the…",
   "wordCount": 124
  },
  {
   "id": "b5-w5-n5",
   "title": "Trumpets and Lamps",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 5,
   "night": 5,
   "scripture": "Judges 7:2–7, 16–21",
   "scriptureBook": "Judges",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "faith",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child feels too small to matter and needs the picture of three hundred men with trumpets and lamps.",
   "teaser": "Many men came to help Gideon free Israel from the Midianites. The Lord said, “There are too many.” He wanted Israel to know the Lord saved them. Anyone who felt afraid could go home. Then the Lord said, “Bring the…",
   "wordCount": 124
  },
  {
   "id": "b5-w5-n6",
   "title": "An Angel’s Promise",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 5,
   "night": 6,
   "scripture": "Judges 13:2–9, 24",
   "scriptureBook": "Judges",
   "traveler": "wren",
   "feeling": "eager",
   "virtues": [
    "prayer",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child wonders if they were wanted and needs the picture of an angel promising a child.",
   "teaser": "Manoah and his wife wanted a baby, but they had no children. One day an angel of the Lord came to her with happy news. The angel said, “You will have a son.” The boy’s uncut hair would show a promise to Heavenly…",
   "wordCount": 118
  },
  {
   "id": "b5-w5-n7",
   "title": "The Lord Heard Samson",
   "volume": "ot",
   "book": 5,
   "bookTitle": "Be Strong and Brave!",
   "month": "May",
   "week": 5,
   "night": 7,
   "scripture": "Judges 16:17–22, 28",
   "scriptureBook": "Judges",
   "traveler": "willow",
   "feeling": "discouraged",
   "virtues": [
    "repentance",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child feels past a wrong choice is too big to fix and needs the picture of Samson's prayer.",
   "teaser": "Samson grew up very strong. His strength came from the Lord. His long hair showed his special promise to Heavenly Father. But Samson made poor choices. He told his secret to a woman named Delilah, and his hair was…",
   "wordCount": 123
  },
  {
   "id": "b6-w1-n1",
   "title": "Where You Go, I Will Go",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 1,
   "night": 1,
   "scripture": "Ruth 1:1–22",
   "scriptureBook": "Ruth",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "family-love",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "family-love",
   "teachingNote": "Reach for this when your child feels afraid to be left and needs a picture of someone who stays, like Ruth beside Naomi.",
   "teaser": "Long ago, there was no food in Bethlehem. So Naomi’s family moved far away, to a land called Moab. In Moab, Naomi’s husband died. Her two sons married Ruth and Orpah. The sons died too. Naomi was sad and far from…",
   "wordCount": 125,
   "aka": [
    "Ruth Stays with Naomi"
   ]
  },
  {
   "id": "b6-w1-n2",
   "title": "Ruth in Boaz’s Field",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 1,
   "night": 2,
   "scripture": "Ruth 2:2–16; Leviticus 19:9–10",
   "scriptureBook": "Ruth",
   "traveler": "beau",
   "feeling": "grateful",
   "virtues": [
    "generosity",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child is learning to share and needs to see how leftover grain fed Ruth and Naomi.",
   "teaser": "Ruth and Naomi needed food. Ruth said, “Let me go to the field and pick up grain.” The Lord told farmers to leave some grain behind. It was “for the poor and the stranger,” people from far away. Then hungry people…",
   "wordCount": 121,
   "aka": [
    "Ruth Works in the Field"
   ]
  },
  {
   "id": "b6-w1-n3",
   "title": "A Baby Named Obed",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 1,
   "night": 3,
   "scripture": "Ruth 4:13–17; Matthew 1:5",
   "scriptureBook": "Ruth",
   "traveler": "wren",
   "feeling": "comforted",
   "virtues": [
    "trust-in-god",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels forgotten and needs to know Heavenly Father brought joy back to Naomi.",
   "teaser": "Boaz was a good man. He wanted to take care of Ruth and Naomi. So Boaz and Ruth got married. Then the Lord gave them a baby boy! Naomi had been very sad. Now she held the baby close and took care of him. Naomi’s…",
   "wordCount": 125,
   "aka": [
    "Boaz Marries Ruth"
   ]
  },
  {
   "id": "b6-w1-n4",
   "title": "Hannah Prays for a Baby",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 1,
   "night": 4,
   "scripture": "1 Samuel 1:1–18",
   "scriptureBook": "1 Samuel",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "prayer",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child has a worry too big for words and needs to know quiet prayers are heard.",
   "teaser": "Hannah’s husband, Elkanah, loved her very much. But Hannah had no children. She felt so sad that she cried and would not eat. Each year, the family went to the Lord’s house at Shiloh. There, Hannah went to pray…",
   "wordCount": 118
  },
  {
   "id": "b6-w1-n5",
   "title": "My Heart Rejoices",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 1,
   "night": 5,
   "scripture": "1 Samuel 1:20–28; 2:1–2, 19",
   "scriptureBook": "1 Samuel",
   "traveler": "willow",
   "feeling": "happy",
   "virtues": [
    "gratitude",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child has received an answered prayer and needs words to sing thanks like Hannah.",
   "teaser": "The Lord gave Hannah a baby boy! She named him Samuel. She said, “I asked the Lord for him.” When Samuel was a little older, Hannah took him to the Lord’s house. She told Eli, “I prayed for this child, and the Lord…",
   "wordCount": 120,
   "aka": [
    "Samuel Goes to the Temple"
   ]
  },
  {
   "id": "b6-w1-n6",
   "title": "Samuel Hears the Lord",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 1,
   "night": 6,
   "scripture": "1 Samuel 3:1–10",
   "scriptureBook": "1 Samuel",
   "traveler": "scout",
   "feeling": "calm",
   "virtues": [
    "reverence",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child is too busy to listen and needs to practice saying, Speak, for I am listening.",
   "teaser": "Young Samuel helped Eli at the Lord’s house. Eli was old, and his eyes could not see well. One night, the lamp still glowed, and Samuel lay down to sleep. A voice called, “Samuel!” Samuel ran to Eli. “Here I am! You…",
   "wordCount": 125,
   "aka": [
    "The Lord Calls Samuel"
   ]
  },
  {
   "id": "b6-w1-n7",
   "title": "The Stone of Help",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 1,
   "night": 7,
   "scripture": "1 Samuel 3:19–20; 7:3–12",
   "scriptureBook": "1 Samuel",
   "traveler": "wren",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child doubts help will come again and needs a stone that says, Hitherto the Lord has helped us.",
   "teaser": "Samuel grew up, and the Lord was with him. Everyone knew Samuel spoke for the Lord. But the people had been praying to other gods. Samuel said, “Turn your hearts back to the Lord.” So the people put the other gods…",
   "wordCount": 123
  },
  {
   "id": "b6-w2-n1",
   "title": "We Want a King!",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 2,
   "night": 1,
   "scripture": "1 Samuel 8:4–7, 19–22",
   "scriptureBook": "1 Samuel",
   "traveler": "wren",
   "feeling": "sad",
   "virtues": [
    "contentment",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "contentment",
   "teachingNote": "Reach for this when your child wants what everyone else has and needs to remember the Lord is already their King.",
   "teaser": "Samuel was now old. For many years, he had taught the people what Heavenly Father said. One day the leaders of Israel came to him. They said, “Give us a king, like all the other lands have.” This made Samuel sad. So…",
   "wordCount": 122,
   "aka": [
    "Israel Wants a King"
   ]
  },
  {
   "id": "b6-w2-n2",
   "title": "Saul Looks for Donkeys",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 2,
   "night": 2,
   "scripture": "1 Samuel 9:3–6, 15–20",
   "scriptureBook": "1 Samuel",
   "traveler": "scout",
   "feeling": "worried",
   "virtues": [
    "trust-in-god",
    "patience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child is anxious about something lost and needs to know Heavenly Father sees where they are.",
   "teaser": "Saul was a tall young man. One day his father’s donkeys were lost. Saul and a helper went to find them. They walked through many lands, but found no donkeys! Saul said, “Let’s go home, or my father will worry.” The…",
   "wordCount": 125
  },
  {
   "id": "b6-w2-n3",
   "title": "Oil on Saul’s Head",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 2,
   "night": 3,
   "scripture": "1 Samuel 9:27; 10:1, 6, 9",
   "scriptureBook": "1 Samuel",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "identity",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child doubts they matter and needs to hear Heavenly Father chose and knows them.",
   "teaser": "Samuel walked with Saul to the edge of the city. He had a message from Heavenly Father just for Saul. Samuel poured a little bottle of oil on Saul’s head and kissed him. The oil showed the Lord had chosen Saul to…",
   "wordCount": 121,
   "aka": [
    "Saul is Anointed King"
   ]
  },
  {
   "id": "b6-w2-n4",
   "title": "Saul Did Not Wait",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 2,
   "night": 4,
   "scripture": "1 Samuel 10:8; 13:8–14",
   "scriptureBook": "1 Samuel",
   "traveler": "wren",
   "feeling": "impatient",
   "virtues": [
    "patience",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "patience",
   "teachingNote": "Reach for this when your child cannot wait and needs to see why Saul's hurry cost him.",
   "teaser": "Samuel told Saul, “Wait seven days, until I come.” Then Samuel would offer a sacrifice, a gift to the Lord. Those gifts helped people remember that Jesus would come. Saul waited and waited. Enemies gathered close…",
   "wordCount": 125,
   "aka": [
    "Saul Doesn’t Wait"
   ]
  },
  {
   "id": "b6-w2-n5",
   "title": "To Obey Is Best",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 2,
   "night": 5,
   "scripture": "1 Samuel 15:13–15, 22, 24",
   "scriptureBook": "1 Samuel",
   "traveler": "beau",
   "feeling": "nervous",
   "virtues": [
    "obedience",
    "honesty"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child gives in to what others think and needs to know that obeying is better than any offering.",
   "teaser": "The Lord gave King Saul a job and told him how to do it. But Saul did not obey all the way. He kept the best sheep and the big, strong cows called oxen. Then Samuel came. Saul said, “I have done what the Lord said!”…",
   "wordCount": 125,
   "aka": [
    "Obey is Better Than Sacrifice"
   ]
  },
  {
   "id": "b6-w2-n6",
   "title": "The Lord Sees the Heart",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 2,
   "night": 6,
   "scripture": "1 Samuel 16:1, 6–13",
   "scriptureBook": "1 Samuel",
   "traveler": "scout",
   "feeling": "loved",
   "virtues": [
    "identity",
    "wisdom"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels overlooked and needs to know the Lord looks at the heart, as with young David.",
   "teaser": "The Lord sent Samuel to Bethlehem, to a man named Jesse. The Lord said, “I have chosen a king from his sons.” Jesse’s son Eliab came. He was tall and fine-looking. Samuel said, “This must be the one!” But the Lord…",
   "wordCount": 122,
   "aka": [
    "God Chooses David"
   ]
  },
  {
   "id": "b6-w2-n7",
   "title": "David’s Gentle Harp",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 2,
   "night": 7,
   "scripture": "1 Samuel 16:14–23",
   "scriptureBook": "1 Samuel",
   "traveler": "willow",
   "feeling": "calm",
   "virtues": [
    "kindness",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child is upset and needs a gentle song, like David's harp, to settle a hard day.",
   "teaser": "King Saul had stopped following the Lord. Now he often felt troubled and unhappy inside. His helpers said, “Let us find someone who plays the harp well.” When the king felt unhappy, soft music could help him feel…",
   "wordCount": 107,
   "aka": [
    "David Plays Music for Saul"
   ]
  },
  {
   "id": "b6-w3-n1",
   "title": "David Brings Bread",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 3,
   "night": 1,
   "scripture": "1 Samuel 17:4, 10–11, 17–26",
   "scriptureBook": "1 Samuel",
   "traveler": "scout",
   "feeling": "safe",
   "virtues": [
    "courage",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child faces something huge and scary and needs to remember Heavenly Father is bigger.",
   "teaser": "David was the youngest boy in his family. He took care of his father’s sheep. His three big brothers were in the king’s army. His father, Jesse, said, “Take this bread to your brothers. See how they are.” David got…",
   "wordCount": 123
  },
  {
   "id": "b6-w3-n2",
   "title": "The Lion and the Bear",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 3,
   "night": 2,
   "scripture": "1 Samuel 17:32–37",
   "scriptureBook": "1 Samuel",
   "traveler": "wren",
   "feeling": "safe",
   "virtues": [
    "faith",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child doubts they can do hard things and needs to remember how the Lord helped before, like David and the lion.",
   "teaser": "David went to King Saul and said, “Don’t be afraid of the giant. I will go and fight him.” Saul said, “You are only a boy. He has been a soldier since he was young.” David said, “I keep my father’s sheep. A lion and…",
   "wordCount": 115
  },
  {
   "id": "b6-w3-n3",
   "title": "Five Smooth Stones",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 3,
   "night": 3,
   "scripture": "1 Samuel 17:40, 45–50",
   "scriptureBook": "1 Samuel",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "courage",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child must face a giant-sized task and needs to know the battle is the Lord's.",
   "teaser": "David went down to a little stream. He chose five smooth stones from the water. He put them in his shepherd’s bag. He held his sling, a strap for throwing stones far. Then David walked toward the giant. Goliath had…",
   "wordCount": 125,
   "aka": [
    "David and Goliath"
   ]
  },
  {
   "id": "b6-w3-n4",
   "title": "David and Jonathan",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 3,
   "night": 4,
   "scripture": "1 Samuel 18:1–4",
   "scriptureBook": "1 Samuel",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "family-love",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "family-love",
   "teachingNote": "Reach for this when your child is making a new friend and needs a picture of loyal love like David and Jonathan's.",
   "teaser": "After the giant fell, David talked with King Saul. Saul’s son Jonathan, a prince, was there listening. Jonathan’s heart felt tied to David’s heart. Jonathan loved David as much as he loved himself. The two became…",
   "wordCount": 122,
   "aka": [
    "David and Jonathan Are Best Friends"
   ]
  },
  {
   "id": "b6-w3-n5",
   "title": "David Was Kind to Saul",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 3,
   "night": 5,
   "scripture": "1 Samuel 24:2–17; 26:7–12",
   "scriptureBook": "1 Samuel",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "self-control",
    "forgiveness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "self-control",
   "teachingNote": "Reach for this when your child is tempted to get even and needs to see David choose kindness in the cave.",
   "teaser": "King Saul was upset that the people loved David. Saul wanted to hurt him, so David and his men hid. Saul brought soldiers to look for David. One day Saul went into a cave. He did not know David was hiding inside…",
   "wordCount": 124,
   "aka": [
    "David Forgives Saul in the Cave"
   ]
  },
  {
   "id": "b6-w3-n6",
   "title": "Abigail the Peacemaker",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 3,
   "night": 6,
   "scripture": "1 Samuel 25:2–35",
   "scriptureBook": "1 Samuel",
   "traveler": "willow",
   "feeling": "calm",
   "virtues": [
    "peacemaking",
    "wisdom"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "peacemaking",
   "teachingNote": "Reach for this when your child's friends are quarreling and needs to see how Abigail's gentle words stopped a fight.",
   "teaser": "A rich man named Nabal had many sheep. David’s men had kept his shepherds safe, like a wall around them. So David asked for some food. But Nabal said unkind words and gave nothing. David got very angry and set out…",
   "wordCount": 120,
   "aka": [
    "Wise Abigail Stops Trouble"
   ]
  },
  {
   "id": "b6-w3-n7",
   "title": "A King Forever",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 3,
   "night": 7,
   "scripture": "2 Samuel 5:3–4; 6:12–15; 7:4, 12–16",
   "scriptureBook": "2 Samuel",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "gratitude",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child needs to know the Lord keeps His promises, like David's family line forever.",
   "teaser": "The leaders of the people made David their king. David was thirty years old, and he was king for forty years. Then David brought the Lord’s ark, a holy box, into Jerusalem, his city. The ark showed the Lord was with…",
   "wordCount": 115,
   "aka": [
    "David Dances Before the Lord"
   ]
  },
  {
   "id": "b6-w4-n1",
   "title": "The Poor Man’s Little Lamb",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 4,
   "night": 1,
   "scripture": "2 Samuel 12:1–7, 13; Psalm 51:10",
   "scriptureBook": "2 Samuel",
   "traveler": "willow",
   "feeling": "guilty",
   "virtues": [
    "repentance",
    "honesty"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child has done wrong and needs to learn that saying sorry lets the Lord clean the heart.",
   "teaser": "King David made a very wrong choice that hurt others. So the Lord sent Nathan, His prophet, to help David see. Nathan told David a story. A rich man had many sheep. A poor man had one little lamb. It slept in his…",
   "wordCount": 125,
   "aka": [
    "David Says Sorry"
   ]
  },
  {
   "id": "b6-w4-n2",
   "title": "An Understanding Heart",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 4,
   "night": 2,
   "scripture": "1 Kings 3:5–13",
   "scriptureBook": "1 Kings",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "wisdom",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wisdom",
   "teachingNote": "Reach for this when your child faces a hard choice and needs to ask for an understanding heart, as Solomon did.",
   "teaser": "King David grew old, and his son Solomon became king. Solomon was young, with so many people to lead! One night at Gibeon, the Lord came to Solomon in a dream. The Lord was Jesus. He said, “Ask what I shall give…",
   "wordCount": 123,
   "aka": [
    "Solomon Asks for Wisdom"
   ]
  },
  {
   "id": "b6-w4-n3",
   "title": "Two Mothers and a Baby",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 4,
   "night": 3,
   "scripture": "1 Kings 3:16–28",
   "scriptureBook": "1 Kings",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "family-love",
    "wisdom"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "family-love",
   "teachingNote": "Reach for this when your child sees real love wants others safe, like the mother who gave up her baby.",
   "teaser": "Two mothers came to King Solomon with one little baby boy. Each mother said, “This baby is mine!” No one else had been in the house to see. So how could the king know who the real mother was? Solomon gave them a…",
   "wordCount": 120,
   "aka": [
    "Two Mothers and One Baby"
   ]
  },
  {
   "id": "b6-w4-n4",
   "title": "No Hammer Was Heard",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 4,
   "night": 4,
   "scripture": "1 Kings 6:1, 7, 14, 21–22, 29, 38",
   "scriptureBook": "1 Kings",
   "traveler": "scout",
   "feeling": "calm",
   "virtues": [
    "reverence",
    "worship-together"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child is loud in a holy place and needs to hear how quietly the temple was built.",
   "teaser": "King Solomon built a temple, a house for the Lord. It would be a holy place, so it was built with care. The big stones were cut and made ready somewhere else first. Then they were carried to the temple, ready to set…",
   "wordCount": 124,
   "aka": [
    "Building the Temple"
   ]
  },
  {
   "id": "b6-w4-n5",
   "title": "Glory in the Lord’s House",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 4,
   "night": 5,
   "scripture": "1 Kings 8:1–11",
   "scriptureBook": "1 Kings",
   "traveler": "wren",
   "feeling": "amazed",
   "virtues": [
    "reverence",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child needs a sense of awe, picturing the glory filling Solomon's temple.",
   "teaser": "At last the temple was finished! King Solomon called all the people to come together in Jerusalem. The priests, who served in the Lord’s house, carried in the ark. This ark was not a boat. It was a holy box, set in…",
   "wordCount": 119
  },
  {
   "id": "b6-w4-n6",
   "title": "Hear Thou in Heaven",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 4,
   "night": 6,
   "scripture": "1 Kings 8:22–30, 54–57",
   "scriptureBook": "1 Kings",
   "traveler": "beau",
   "feeling": "safe",
   "virtues": [
    "prayer",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child wonders if anyone hears and needs to hear Solomon's prayer: hear thou in heaven.",
   "teaser": "King Solomon stood before the people at the temple. He spread his hands toward heaven and prayed. He said, “Lord, there is no one like You, in heaven or on earth. You keep Your promises.” Solomon knew even the whole…",
   "wordCount": 115,
   "aka": [
    "Solomon’s Prayer at the Temple"
   ]
  },
  {
   "id": "b6-w4-n7",
   "title": "Keep Your Heart Close",
   "volume": "ot",
   "book": 6,
   "bookTitle": "The Lord Looks on the Heart",
   "month": "June",
   "week": 4,
   "night": 7,
   "scripture": "1 Kings 9:1–5; 11:4",
   "scriptureBook": "1 Kings",
   "traveler": "beau",
   "feeling": "connected",
   "virtues": [
    "faith",
    "perseverance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child is drifting and needs to be reminded to keep their heart close to the Lord.",
   "teaser": "When the temple was done, the Lord came to Solomon again. The Lord was Jesus. He said, “I have heard your prayer.” He said, “I have made this house holy for My name forever. My eyes and My heart will always be…",
   "wordCount": 116,
   "aka": [
    "Keep Your Heart Close to God"
   ]
  },
  {
   "id": "b7-w1-n1",
   "title": "Bread from the Ravens",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 1,
   "night": 1,
   "scripture": "1 Kings 12:6–16, 28–30; 17:1–6",
   "scriptureBook": "1 Kings",
   "traveler": "scout",
   "feeling": "grateful",
   "virtues": [
    "gratitude",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child wonders who will provide what they need and needs a picture of ravens bringing bread.",
   "teaser": "Long ago, King Rehoboam would not listen to the wise old men. So his kingdom broke in two. One king made gold calves for people to pray to. Later, many people stopped following the Lord. So Elijah told King Ahab…",
   "wordCount": 120,
   "aka": [
    "The Ravens Feed Elijah"
   ]
  },
  {
   "id": "b7-w1-n2",
   "title": "Flour That Lasted",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 1,
   "night": 2,
   "scripture": "1 Kings 17:7–16",
   "scriptureBook": "1 Kings",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "generosity",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child is afraid to share the little they have and needs to see a jar of flour that never ran out.",
   "teaser": "With no rain, the brook dried up. The Lord sent Elijah to a town called Zarephath. A woman whose husband had died was picking up sticks. Elijah asked her for water and a little bread. She said, “I have only a…",
   "wordCount": 117,
   "aka": [
    "The Jar That Never Ran Out"
   ]
  },
  {
   "id": "b7-w1-n3",
   "title": "See, Your Son Lives",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 1,
   "night": 3,
   "scripture": "1 Kings 17:17–24",
   "scriptureBook": "1 Kings",
   "traveler": "willow",
   "feeling": "comforted",
   "virtues": [
    "prayer",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child is scared for someone they love and needs to know the Lord hears every prayer.",
   "teaser": "One day the woman’s little boy got very, very sick. Then he stopped breathing. His mother was so sad. Elijah said, “Give me your son.” He carried the boy upstairs and laid him on his own bed. Elijah prayed with all…",
   "wordCount": 119,
   "aka": [
    "Elijah Prays for the Little Boy"
   ]
  },
  {
   "id": "b7-w1-n4",
   "title": "Fire on Mount Carmel",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 1,
   "night": 4,
   "scripture": "1 Kings 18:21–24, 30–39",
   "scriptureBook": "1 Kings",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "stand-for-truth",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "stand-for-truth",
   "teachingNote": "Reach for this when your child must choose whom to follow and needs the picture of fire falling on Mount Carmel.",
   "teaser": "Many people prayed to a pretend god named Baal. Elijah called everyone to Mount Carmel. He asked, “How long will you go back and forth? If the Lord is the true one, follow Him!” Elijah said, “The one who answers…",
   "wordCount": 120,
   "aka": [
    "Fire from Heaven"
   ]
  },
  {
   "id": "b7-w1-n5",
   "title": "A Cloud Like a Hand",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 1,
   "night": 5,
   "scripture": "1 Kings 18:41–45",
   "scriptureBook": "1 Kings",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "hope",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child is waiting for an answer and needs the picture of a tiny cloud that grew into rain.",
   "teaser": "There had been no rain for a long, long time. The ground was dry and dusty. Elijah climbed to the top of Mount Carmel. He bowed down low to the ground and prayed. He told his helper, “Go and look toward the sea.”…",
   "wordCount": 122
  },
  {
   "id": "b7-w1-n6",
   "title": "The Still Small Voice",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 1,
   "night": 6,
   "scripture": "1 Kings 19:4–13",
   "scriptureBook": "1 Kings",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "reverence",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child feels the world is too loud and needs to learn the Lord often speaks in a quiet voice.",
   "teaser": "Elijah felt tired and sad. He thought he was all alone. He lay under a desert tree. An angel touched him and said, “Get up and eat.” Bread and water were by his head! Then Elijah walked to a mountain cave. The Lord…",
   "wordCount": 125,
   "aka": [
    "The Still, Small Voice"
   ]
  },
  {
   "id": "b7-w1-n7",
   "title": "Elisha Followed",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 1,
   "night": 7,
   "scripture": "1 Kings 19:16, 19–21",
   "scriptureBook": "1 Kings",
   "traveler": "willow",
   "feeling": "eager",
   "virtues": [
    "obedience",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child hesitates to follow a good call and needs to see Elisha leave his oxen and go.",
   "teaser": "The Lord told Elijah to find Elisha. Elisha would be the next one to speak for the Lord. Elisha was plowing a field, making long rows for seeds. Twelve pairs of big, strong oxen pulled the plows. Elijah walked by…",
   "wordCount": 119
  },
  {
   "id": "b7-w2-n1",
   "title": "The Chariot of Fire",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 2,
   "night": 1,
   "scripture": "2 Kings 2:1–15",
   "scriptureBook": "2 Kings",
   "traveler": "wren",
   "feeling": "amazed",
   "virtues": [
    "wonder",
    "heeding-counsel"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wonder",
   "teachingNote": "Reach for this when your child needs to feel awe and to see how Elisha stayed close to the prophet who guided him.",
   "teaser": "Elijah and Elisha walked together. Elijah said, “Stay here.” But Elisha said, “I will not leave you.” At the Jordan River, Elijah rolled up his big coat, called a mantle. He hit the water with it. The water opened…",
   "wordCount": 125,
   "aka": [
    "Elijah Goes Up to Heaven"
   ]
  },
  {
   "id": "b7-w2-n2",
   "title": "Salt in the Spring",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 2,
   "night": 2,
   "scripture": "2 Kings 2:19–22",
   "scriptureBook": "2 Kings",
   "traveler": "scout",
   "feeling": "comforted",
   "virtues": [
    "faith",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child sees something spoiled and needs to know the Lord can make hard things good again.",
   "teaser": "Elisha told people what Heavenly Father said. One day he came to the city of Jericho. The men of the city said, “Our city is a nice place. But the water is bad, and nothing grows.” They could have just lived with…",
   "wordCount": 124
  },
  {
   "id": "b7-w2-n3",
   "title": "The Oil Kept Pouring",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 2,
   "night": 3,
   "scripture": "2 Kings 4:1–7",
   "scriptureBook": "2 Kings",
   "traveler": "beau",
   "feeling": "comforted",
   "virtues": [
    "trust-in-god",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child hears worry about money or needs at home and needs the picture of oil that kept pouring.",
   "teaser": "A mother came to Elisha, who spoke for Heavenly Father. Her husband had died, and she owed money. A man was coming to take her two sons away to work. Elisha asked, “What do you have in your house?” She said, “Only…",
   "wordCount": 125,
   "aka": [
    "The Widow’s Oil"
   ]
  },
  {
   "id": "b7-w2-n4",
   "title": "A Little Room for Elisha",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 2,
   "night": 4,
   "scripture": "2 Kings 4:8–37",
   "scriptureBook": "2 Kings",
   "traveler": "willow",
   "feeling": "happy",
   "virtues": [
    "kindness",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child wants to welcome someone and needs to see a family make a little room for a guest.",
   "teaser": "In a town called Shunem lived a kind woman. Whenever Elisha came by, she fed him. She told her husband, “He is a holy man who serves the Lord. Let’s make him a little room.” They put in a bed, a table, a stool and a…",
   "wordCount": 125,
   "aka": [
    "A Special Room for the Prophet"
   ]
  },
  {
   "id": "b7-w2-n5",
   "title": "Naaman Washes Seven Times",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 2,
   "night": 5,
   "scripture": "2 Kings 5:1–15",
   "scriptureBook": "2 Kings",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "humility",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child scoffs at a simple instruction and needs the picture of Naaman washing seven times.",
   "teaser": "Naaman led the soldiers of a land called Syria. But he had a sickness on his skin. A little girl from Israel helped Naaman’s wife. She said, “I wish Naaman could see the prophet in Israel! He would heal him.” So…",
   "wordCount": 122
  },
  {
   "id": "b7-w2-n6",
   "title": "The Axe Head That Floated",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 2,
   "night": 6,
   "scripture": "2 Kings 6:1–7",
   "scriptureBook": "2 Kings",
   "traveler": "scout",
   "feeling": "worried",
   "virtues": [
    "prayer",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child is upset over losing something small and needs to know the Lord cares about little worries too.",
   "teaser": "Some young men learned from Elisha, who spoke for Heavenly Father. They said, “Our home is too small. Let’s cut trees by the Jordan River and build more room.” Elisha went with them. They chopped trees with axes…",
   "wordCount": 116,
   "aka": [
    "The Floating Axe Head"
   ]
  },
  {
   "id": "b7-w2-n7",
   "title": "More Are with Us",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 2,
   "night": 7,
   "scripture": "2 Kings 6:13–23",
   "scriptureBook": "2 Kings",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "courage",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child feels outnumbered or alone and needs the picture of fiery horses all around the hill.",
   "teaser": "One night, the king of Syria sent soldiers all around Elisha’s city. They had horses and chariots, carts pulled by horses. In the morning, Elisha’s helper saw them. He was afraid. He said, “Oh no, master! What shall…",
   "wordCount": 120,
   "aka": [
    "Horses of Fire All Around"
   ]
  },
  {
   "id": "b7-w3-n1",
   "title": "Don’t Forget the Promise",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 3,
   "night": 1,
   "scripture": "2 Kings 17:6, 13–14, 37–39",
   "scriptureBook": "2 Kings",
   "traveler": "wren",
   "feeling": "loved",
   "virtues": [
    "keeping-promises",
    "heeding-counsel"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "keeping-promises",
   "teachingNote": "Reach for this when your child forgets a promise and needs to hear how the Lord remembers His and invites us back.",
   "teaser": "Long ago, the Lord sent prophets to His people in Israel. Again and again, they shared His words. The prophets said, “Turn away from your wrong ways. Keep My commandments.” But many people would not listen. They…",
   "wordCount": 113
  },
  {
   "id": "b7-w3-n2",
   "title": "Hezekiah Trusted the Lord",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 3,
   "night": 2,
   "scripture": "2 Kings 18:1–7",
   "scriptureBook": "2 Kings",
   "traveler": "beau",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child needs someone steady to lean on and needs the picture of a king who held tight to the Lord.",
   "teaser": "Hezekiah became king of Judah when he was twenty-five years old. He did what was right in the Lord’s eyes. Many people prayed to statues called idols instead of the Lord. So Hezekiah broke the idols into pieces…",
   "wordCount": 118,
   "aka": [
    "Good King Hezekiah Trusts God"
   ]
  },
  {
   "id": "b7-w3-n3",
   "title": "The Letter Before the Lord",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 3,
   "night": 3,
   "scripture": "2 Kings 19:9–10, 14–19",
   "scriptureBook": "2 Kings",
   "traveler": "willow",
   "feeling": "worried",
   "virtues": [
    "prayer",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child carries a worry that will not go away and needs the picture of spreading it out before the Lord.",
   "teaser": "A big army from far-off Assyria came near Jerusalem. Its king sent King Hezekiah a letter. The letter said, “The Lord you trust will not keep Jerusalem safe.” It was a scary letter. What would Hezekiah do? Hezekiah…",
   "wordCount": 112,
   "aka": [
    "Hezekiah Shows God the Letter"
   ]
  },
  {
   "id": "b7-w3-n4",
   "title": "I Will Save This City",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 3,
   "night": 4,
   "scripture": "2 Kings 19:20, 32–34, 36",
   "scriptureBook": "2 Kings",
   "traveler": "beau",
   "feeling": "comforted",
   "virtues": [
    "prayer",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child has prayed and is waiting, and needs to know the Lord keeps His promises.",
   "teaser": "King Hezekiah had prayed for help, and he waited. Soon a message came from Isaiah, who shared the Lord’s words. The message was from the Lord: “I have heard your prayer.” The Lord had listened to Hezekiah! The Lord…",
   "wordCount": 113
  },
  {
   "id": "b7-w3-n5",
   "title": "Fifteen More Years",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 3,
   "night": 5,
   "scripture": "2 Kings 20:1–6",
   "scriptureBook": "2 Kings",
   "traveler": "willow",
   "feeling": "comforted",
   "virtues": [
    "prayer",
    "comfort"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child is crying and needs to know the Lord sees every tear and hears every prayer.",
   "teaser": "King Hezekiah became very sick. The prophet Isaiah came and told him he would not get well. Hezekiah turned his face to the wall and prayed. “Lord, remember how I have followed You with all my heart.” Then he cried…",
   "wordCount": 113,
   "aka": [
    "God Gives Hezekiah More Days"
   ]
  },
  {
   "id": "b7-w3-n6",
   "title": "The Shadow Went Back",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 3,
   "night": 6,
   "scripture": "2 Kings 20:8–11",
   "scriptureBook": "2 Kings",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "wonder",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wonder",
   "teachingNote": "Reach for this when your child asks for a sign and needs the picture of the sun's shadow going back on the steps.",
   "teaser": "The Lord promised to heal King Hezekiah. Hezekiah asked Isaiah, “What sign will show me it is true?” Long ago, people told time by watching a shadow on a sundial. As the sun moved, the shadow crept across little…",
   "wordCount": 114
  },
  {
   "id": "b7-w3-n7",
   "title": "Josiah and the Found Book",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 3,
   "night": 7,
   "scripture": "2 Kings 22:1–2, 8–11; 23:1–3",
   "scriptureBook": "2 Kings",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "love-of-scripture",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this when your child feels too young to matter and needs the picture of a boy king who loved the found book.",
   "teaser": "Josiah was only eight years old when he became king! Even as a boy, he did what was right in the Lord’s eyes. Years later, workers fixed up the temple, the Lord’s house. There Hilkiah the priest found a lost book of…",
   "wordCount": 124,
   "aka": [
    "The Lost Book Is Found"
   ]
  },
  {
   "id": "b7-w4-n1",
   "title": "We Rest on You",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 4,
   "night": 1,
   "scripture": "2 Chronicles 14:2–4, 11; 15:1–2",
   "scriptureBook": "2 Chronicles",
   "traveler": "beau",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels outnumbered or weak and needs to learn to lean back and rest on the Lord.",
   "teaser": "Asa was a good king of Judah. He asked his people to look for the Lord and keep His commandments. One day a very big army came to fight. Asa’s army was much smaller. So Asa prayed, “Help us, O Lord, for we rest on…",
   "wordCount": 118,
   "aka": [
    "King Asa Calls on God"
   ]
  },
  {
   "id": "b7-w4-n2",
   "title": "The Eyes of the Lord",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 4,
   "night": 2,
   "scripture": "2 Chronicles 16:2–3, 7–9",
   "scriptureBook": "2 Chronicles",
   "traveler": "wren",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child tries to fix everything alone and needs to know the Lord sees and helps hearts that trust Him.",
   "teaser": "Many years later, another king made trouble for King Asa. This time, Asa did not ask the Lord for help. Instead, he sent silver and gold to the king of Syria for help. Then Hanani, a prophet who saw what others…",
   "wordCount": 119,
   "aka": [
    "When Asa Forgot to Trust"
   ]
  },
  {
   "id": "b7-w4-n3",
   "title": "Teachers in Every Town",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 4,
   "night": 3,
   "scripture": "2 Chronicles 17:3–9; 19:4",
   "scriptureBook": "2 Chronicles",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "love-of-scripture",
    "curiosity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this when your child is curious about scripture and needs the picture of teachers carrying the book to every town.",
   "teaser": "Asa’s son Jehoshaphat became king. He kept the Lord’s commandments, and the Lord was with him. He wanted all his people to learn about the Lord. So he sent teachers to the towns. Priests who served the Lord went…",
   "wordCount": 104
  },
  {
   "id": "b7-w4-n4",
   "title": "Our Eyes Are on You",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 4,
   "night": 4,
   "scripture": "2 Chronicles 20:1–5, 12–13",
   "scriptureBook": "2 Chronicles",
   "traveler": "willow",
   "feeling": "worried",
   "virtues": [
    "prayer",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child does not know what to do and needs the words, our eyes are on You.",
   "teaser": "One day King Jehoshaphat heard that a big army was coming. He felt afraid. He asked everyone in Judah to fast: to skip food and pray very hard. People came from every town to the Lord’s house. There Jehoshaphat…",
   "wordCount": 117,
   "aka": [
    "Our Eyes Are upon Thee"
   ]
  },
  {
   "id": "b7-w4-n5",
   "title": "The Singers Went First",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 4,
   "night": 5,
   "scripture": "2 Chronicles 20:14–17, 21–22, 27–28",
   "scriptureBook": "2 Chronicles",
   "traveler": "beau",
   "feeling": "happy",
   "virtues": [
    "trust-in-god",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child faces something hard and needs the picture of singers going first, and the Lord fighting for them.",
   "teaser": "As Judah prayed, the Spirit of the Lord came upon a man named Jahaziel. He gave them the Lord’s words. Jahaziel said, “Do not be afraid. The battle is not yours. It is the Lord’s.” “You will not need to fight. Just…",
   "wordCount": 112
  },
  {
   "id": "b7-w4-n6",
   "title": "King Uzziah Grew Proud",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 4,
   "night": 6,
   "scripture": "2 Chronicles 26:3–5, 10, 15–18",
   "scriptureBook": "2 Chronicles",
   "traveler": "wren",
   "feeling": "discouraged",
   "virtues": [
    "humility",
    "self-control"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child feels proud of what they can do and needs to remember the Lord is the one who makes them strong.",
   "teaser": "Uzziah became king when he was only sixteen years old. He did what was right in the Lord’s eyes. While a wise man named Zechariah lived, Uzziah looked to the Lord. As long as he did, the Lord helped him do well…",
   "wordCount": 120,
   "aka": [
    "The King Who Forgot to Stay Humble"
   ]
  },
  {
   "id": "b7-w4-n7",
   "title": "Everyone Is Invited",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 4,
   "night": 7,
   "scripture": "2 Chronicles 30:1, 5–9, 18–20, 26–27",
   "scriptureBook": "2 Chronicles",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "forgiveness",
    "worship-together"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "forgiveness",
   "teachingNote": "Reach for this when your child fears they have messed up too much and needs the picture of a king inviting everyone to come back.",
   "teaser": "King Hezekiah sent letters through all the land. He invited everyone to the Lord’s house for the Passover. The Passover was a special meal remembering when the Lord set His people free. Prophets teach that its…",
   "wordCount": 120,
   "aka": [
    "Come Celebrate with God"
   ]
  },
  {
   "id": "b8-w1-n1",
   "title": "Time to Go Home!",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 1,
   "night": 1,
   "scripture": "Ezra 1:1–7",
   "scriptureBook": "Ezra",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "hope",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child is far from home or missing something and needs to know Heavenly Father never forgets them.",
   "teaser": "Long ago, Heavenly Father’s people were taken far away to Babylon. Their real home was Jerusalem. The Lord’s house there had been knocked down. Years later, a new king named Cyrus ruled the land. The Lord put a good…",
   "wordCount": 111,
   "aka": [
    "The King Says, \"You May Go Home!\""
   ]
  },
  {
   "id": "b8-w1-n2",
   "title": "A Great Shout of Joy",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 1,
   "night": 2,
   "scripture": "Ezra 3:10–13",
   "scriptureBook": "Ezra",
   "traveler": "willow",
   "feeling": "happy",
   "virtues": [
    "gratitude",
    "worship-together"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child feels happy and sad at once and needs to know both feelings can sit together while we praise.",
   "teaser": "Heavenly Father’s people were home in Jerusalem at last. They began to build the Lord’s house again. First they laid the foundation, the strong bottom part that holds it up. Then the priests, who served in the…",
   "wordCount": 121,
   "aka": [
    "The First Big Stone"
   ]
  },
  {
   "id": "b8-w1-n3",
   "title": "The Work Starts Again",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 1,
   "night": 3,
   "scripture": "Ezra 4:24; 5:1–2; 6:14–16",
   "scriptureBook": "Ezra",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "perseverance",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "perseverance",
   "teachingNote": "Reach for this when your child wants to quit a hard job and needs to hear that the Lord helps us start again.",
   "teaser": "Heavenly Father’s people were building the Lord’s house. But some people nearby did not want it built. They made trouble until the work stopped. For years and years, the Lord’s house sat unfinished. Then the Lord…",
   "wordCount": 116,
   "aka": [
    "The Temple Is Finished!"
   ]
  },
  {
   "id": "b8-w1-n4",
   "title": "Nehemiah Prayed First",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 1,
   "night": 4,
   "scripture": "Nehemiah 2:1–8",
   "scriptureBook": "Nehemiah",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "prayer",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child is scared to ask for something big and needs to know a quick quiet prayer can go up anytime.",
   "teaser": "Nehemiah worked for a great king far away. His job was to bring the king his wine. One day, Nehemiah’s face looked sad. The king asked, “Why is your face so sad?” Nehemiah felt very afraid. Nehemiah said…",
   "wordCount": 116,
   "aka": [
    "Nehemiah’s Brave Idea"
   ]
  },
  {
   "id": "b8-w1-n5",
   "title": "A Mind to Work",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 1,
   "night": 5,
   "scripture": "Nehemiah 4:6, 9, 14–15, 21",
   "scriptureBook": "Nehemiah",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "service",
    "diligence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child faces a big chore and needs to see how working together with the Lord gets it done.",
   "teaser": "Nehemiah came home to Jerusalem. He asked everyone to build the city wall again. It was like a big stone fence to keep them safe. Everyone worked on the wall together. They worked from early morning until the stars…",
   "wordCount": 111
  },
  {
   "id": "b8-w1-n6",
   "title": "I Am Doing a Great Work",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 1,
   "night": 6,
   "scripture": "Nehemiah 6:1–4, 15–16",
   "scriptureBook": "Nehemiah",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "perseverance",
    "integrity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "perseverance",
   "teachingNote": "Reach for this when your child is pulled away from a good job by others and needs to say, I am doing a great work.",
   "teaser": "The wall around Jerusalem was almost done. Only the doors for the gates were left. Some men did not want the wall finished. They sent Nehemiah a message: “Come down and meet with us.” But they wanted to make trouble…",
   "wordCount": 117,
   "aka": [
    "“I Am Doing a Great Work”"
   ]
  },
  {
   "id": "b8-w1-n7",
   "title": "The Joy of the Lord",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 1,
   "night": 7,
   "scripture": "Ezra 7:10; Nehemiah 8:1–12",
   "scriptureBook": "Ezra",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "love-of-scripture",
    "worship-together"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this when your child lights up after understanding something from the scriptures and needs to know that joy is strength.",
   "teaser": "Ezra loved the Lord’s words. He got his heart ready to learn them, live them and teach them. All the people gathered in Jerusalem. Men, women and all who could understand came to listen. Ezra stood up high on a…",
   "wordCount": 123,
   "aka": [
    "The Happiest Reading Day"
   ]
  },
  {
   "id": "b8-w2-n1",
   "title": "Esther Becomes Queen",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 2,
   "night": 1,
   "scripture": "Esther 1:1–2; 2:5–7, 10, 17",
   "scriptureBook": "Esther",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "family-love",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "family-love",
   "teachingNote": "Reach for this when your child is in a new place or home and needs to know Heavenly Father gives them people who care.",
   "teaser": "Long ago, King Ahasuerus ruled a very big land. He lived in a palace in the city of Shushan. In Shushan lived a man named Mordecai. He was a Jew, one of Heavenly Father’s people of Israel. Mordecai’s young cousin…",
   "wordCount": 115,
   "aka": [
    "A Kind Girl Becomes Queen"
   ]
  },
  {
   "id": "b8-w2-n2",
   "title": "Mordecai Helps the King",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 2,
   "night": 2,
   "scripture": "Esther 2:21–23",
   "scriptureBook": "Esther",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "courage",
    "honesty"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child sees a danger or a wrong and needs the courage to tell a trusted grown-up.",
   "teaser": "Mordecai sat at the king’s gate, the big doorway into the palace. Two of the king’s helpers guarded the doors. They grew very angry and made a plan to hurt the king. Mordecai found out about the bad plan. He did not…",
   "wordCount": 107
  },
  {
   "id": "b8-w2-n3",
   "title": "Haman’s Mean Plan",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 2,
   "night": 3,
   "scripture": "Esther 3:1–2, 5–6, 8–11",
   "scriptureBook": "Esther",
   "traveler": "willow",
   "feeling": "angry",
   "virtues": [
    "humility",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child feels better than someone else and needs to learn that Jesus asks us to be kind, not proud.",
   "teaser": "The king made a man named Haman his most important leader. Everyone had to bow low to Haman to show him honor. But Mordecai would not bow. Haman was full of anger and pride. He thought he was better than everyone…",
   "wordCount": 110,
   "aka": [
    "Mordecai Stands Tall"
   ]
  },
  {
   "id": "b8-w2-n4",
   "title": "For Such a Time as This",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 2,
   "night": 4,
   "scripture": "Esther 4:1–14",
   "scriptureBook": "Esther",
   "traveler": "wren",
   "feeling": "worried",
   "virtues": [
    "courage",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child wonders why they are here and needs to hear that Heavenly Father has good work for them.",
   "teaser": "When Mordecai heard about Haman’s plan, he cried a loud, sad cry. Jews in every land cried too. Mordecai sent a message to Queen Esther. “Please go to the king. Ask him to help your people.” But there was a strict…",
   "wordCount": 118
  },
  {
   "id": "b8-w2-n5",
   "title": "The Golden Scepter",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 2,
   "night": 5,
   "scripture": "Esther 4:15–17; 5:1–3",
   "scriptureBook": "Esther",
   "traveler": "beau",
   "feeling": "nervous",
   "virtues": [
    "courage",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child has a hard thing to do and needs to pray first, then step forward shaky but strong.",
   "teaser": "Esther sent a message to Mordecai. “Gather all the Jews here, and fast for me for three days. My helpers and I will fast too.” When people fast, they go without food and drink for a little while. It shows Heavenly…",
   "wordCount": 123,
   "aka": [
    "Esther’s Brave Choice"
   ]
  },
  {
   "id": "b8-w2-n6",
   "title": "The King Could Not Sleep",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 2,
   "night": 6,
   "scripture": "Esther 6:1–3, 6–11",
   "scriptureBook": "Esther",
   "traveler": "scout",
   "feeling": "grateful",
   "virtues": [
    "gratitude",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child feels unnoticed and needs to know Heavenly Father sees every good thing they do.",
   "teaser": "One night, the king could not sleep. So his helpers read to him from his big book of what had happened. They read how Mordecai had saved the king from a bad plan. The king asked, “What did we do to thank Mordecai?”…",
   "wordCount": 122
  },
  {
   "id": "b8-w2-n7",
   "title": "Esther Saves Her People",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 2,
   "night": 7,
   "scripture": "Esther 7:2–6; 8:16; 9:22, 26",
   "scriptureBook": "Esther",
   "traveler": "wren",
   "feeling": "happy",
   "virtues": [
    "hope",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child's sad day has turned around and needs to see how Jesus changes sorrow into joy.",
   "teaser": "Esther made a big, special dinner for the king and Haman. The king asked, “Queen Esther, what do you want? I will give it to you.” Esther said, “Please save my life and my people. Someone has a plan to hurt us all.”…",
   "wordCount": 122,
   "aka": [
    "The King Saves the People"
   ]
  },
  {
   "id": "b8-w3-n1",
   "title": "Blessed Be the Lord’s Name",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 3,
   "night": 1,
   "scripture": "Job 1:1–5, 13–22",
   "scriptureBook": "Job",
   "traveler": "beau",
   "feeling": "sad",
   "virtues": [
    "trust-in-god",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child lost something they loved and needs to know they can still love the Lord on sad days.",
   "teaser": "In the land of Uz lived a good man named Job. He loved the Lord. Job had seven sons and three daughters. Job had many sheep, camels and oxen. Early each morning, he gave gifts to the Lord for his children. Then a…",
   "wordCount": 123,
   "aka": [
    "Job Keeps Trusting"
   ]
  },
  {
   "id": "b8-w3-n2",
   "title": "Friends Who Sat Close",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 3,
   "night": 2,
   "scripture": "Job 2:7–13; 3:1",
   "scriptureBook": "Job",
   "traveler": "willow",
   "feeling": "sad",
   "virtues": [
    "compassion",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "compassion",
   "teachingNote": "Reach for this when your child sees a friend hurting and needs to learn that sitting close and loving is enough.",
   "teaser": "Then Job got very sick, with sore spots from his feet to his head. He sat in the ashes, sad and hurting. Three friends heard about Job’s troubles: Eliphaz, Bildad and Zophar. They came to comfort Job and help him…",
   "wordCount": 118,
   "aka": [
    "Kind Friends Come to Sit"
   ]
  },
  {
   "id": "b8-w3-n3",
   "title": "Yet Will I Trust Him",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 3,
   "night": 3,
   "scripture": "Job 13:15; 23:8–10",
   "scriptureBook": "Job",
   "traveler": "beau",
   "feeling": "worried",
   "virtues": [
    "trust-in-god",
    "perseverance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child cannot see Heavenly Father in a hard time and needs to hold on tight and trust Him anyway.",
   "teaser": "Job’s friends thought his troubles came because he did something wrong. But that was not true. Job felt like he could not find the Lord. He said, “I go forward, but He is not there.” But Job did not stop trusting…",
   "wordCount": 120
  },
  {
   "id": "b8-w3-n4",
   "title": "My Redeemer Lives",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 3,
   "night": 4,
   "scripture": "Job 14:7, 14; 19:23–27",
   "scriptureBook": "Job",
   "traveler": "wren",
   "feeling": "comforted",
   "virtues": [
    "hope",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child is afraid of loss or sadness and needs to hear that Jesus, their Redeemer, lives.",
   "teaser": "Job said that when a tree is cut down, it can sprout again. New green branches can grow! Then Job wondered, “If a person dies, will he live again?” That was his big question. Job wished his words could be carved in…",
   "wordCount": 121,
   "aka": [
    "Job Tells Heavenly Father His Feelings"
   ]
  },
  {
   "id": "b8-w3-n5",
   "title": "When the Stars Sang",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 3,
   "night": 5,
   "scripture": "Job 38:1–7; 40:3–4",
   "scriptureBook": "Job",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "wonder",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wonder",
   "teachingNote": "Reach for this when your child gazes at the stars and needs to feel how big the Lord is and that He still knows them.",
   "teaser": "At last the Lord spoke to Job out of a whirlwind, a spinning wind. The Lord was Jesus, speaking for Heavenly Father. He asked Job, “Where were you when I made the earth?” The Lord had measured it, the way a builder…",
   "wordCount": 125,
   "aka": [
    "Heavenly Father Shows His Wonders"
   ]
  },
  {
   "id": "b8-w3-n6",
   "title": "Who Feeds the Ravens?",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 3,
   "night": 6,
   "scripture": "Job 12:7–10; 38:41; 39:19, 27",
   "scriptureBook": "Job",
   "traveler": "willow",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child worries about having enough and needs to picture the Lord feeding the little ravens.",
   "teaser": "The Lord told Job about the animals He made. He asked, “Who feeds the raven, the big black bird?” When baby ravens are hungry, they cry to Heavenly Father. The Lord gives them food. He asked, “Did you make the horse…",
   "wordCount": 124
  },
  {
   "id": "b8-w3-n7",
   "title": "The Lord Blessed Job",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 3,
   "night": 7,
   "scripture": "Job 42:5, 7–17",
   "scriptureBook": "Job",
   "traveler": "wren",
   "feeling": "happy",
   "virtues": [
    "hope",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child has come through a hard season and needs to see that the Lord brings joy again.",
   "teaser": "Job told the Lord, “I had heard about You. But now I see You with my own eyes.” The Lord told Job’s friends, “You have not said what is right about Me.” He said Job would pray for them. So Job prayed for his…",
   "wordCount": 120,
   "aka": [
    "Heavenly Father Blesses Job Again"
   ]
  },
  {
   "id": "b8-w4-n1",
   "title": "A Tree by the River",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 4,
   "night": 1,
   "scripture": "Psalm 1:1–3",
   "scriptureBook": "Psalm",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "love-of-scripture",
    "pondering"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this when your child wants to grow strong and needs the picture of a tree planted by a river of the Lord's words.",
   "teaser": "The first song in Psalms tells about a happy person. That person loves the Lord’s words and thinks about them “day and night.” He stays away from people who choose wrong. The song says he is “like a tree planted by…",
   "wordCount": 124,
   "aka": [
    "The Happy Little Tree"
   ]
  },
  {
   "id": "b8-w4-n2",
   "title": "The Moon and the Stars",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 4,
   "night": 2,
   "scripture": "Psalm 8:3–5",
   "scriptureBook": "Psalm",
   "traveler": "wren",
   "feeling": "amazed",
   "virtues": [
    "wonder",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wonder",
   "teachingNote": "Reach for this when your child feels small under a big night sky and needs to know the Lord who made the stars thinks of them.",
   "teaser": "Long ago there were no city lights. At night, the whole sky sparkled with stars. David looked up and sang to the Lord. “I see Your heavens, the work of Your fingers, the moon and the stars!” Then David asked, “What…",
   "wordCount": 115,
   "aka": [
    "Look at the Stars!"
   ]
  },
  {
   "id": "b8-w4-n3",
   "title": "Sweeter Than Honey",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 4,
   "night": 3,
   "scripture": "Psalm 19:1, 7–10",
   "scriptureBook": "Psalm",
   "traveler": "willow",
   "feeling": "happy",
   "virtues": [
    "love-of-scripture",
    "wisdom"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this when your child finds scripture time dull and needs to taste the Lord's words as sweeter than honey.",
   "teaser": "David wrote a song that begins with the sky. He sang, “The heavens show how great Heavenly Father is.” Then David sang about the Lord’s words, the things the Lord teaches us. He said they are perfect and true. They…",
   "wordCount": 122
  },
  {
   "id": "b8-w4-n4",
   "title": "The Lord Is My Shepherd",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 4,
   "night": 4,
   "scripture": "Psalm 23:1–2, 4–5",
   "scriptureBook": "Psalm",
   "traveler": "willow",
   "feeling": "comforted",
   "virtues": [
    "comfort",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "comfort",
   "teachingNote": "Reach for this when your child is afraid of the dark or a dark time and needs to hear that Jesus, the Shepherd, is with them.",
   "teaser": "Before David was king, he took care of his father’s sheep. Later he wrote a song: “The Lord is my shepherd.” David sang, “He makes me lie down in green pastures.” Those are the soft grassy fields where sheep eat and…",
   "wordCount": 123,
   "aka": [
    "The Good Shepherd"
   ]
  },
  {
   "id": "b8-w4-n5",
   "title": "Clean Hands, Pure Heart",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 4,
   "night": 5,
   "scripture": "Psalm 24:1, 3–5, 10",
   "scriptureBook": "Psalm",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "integrity",
    "reverence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "integrity",
   "teachingNote": "Reach for this when your child has done the right thing and needs to know clean hands and a pure heart bring them close to the Lord.",
   "teaser": "David wrote a song that begins, “The earth is the Lord’s.” The whole world and everyone in it belong to Him. Then the song asks, “Who may go up the hill of the Lord?” People climbed that hill to pray and sing at His…",
   "wordCount": 120
  },
  {
   "id": "b8-w4-n6",
   "title": "The Lord Is My Light",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 4,
   "night": 6,
   "scripture": "Psalm 27:1, 5",
   "scriptureBook": "Psalm",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "courage",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child is afraid of the dark and needs to know the Lord is their light, so they need not fear.",
   "teaser": "David had some hard, scary days, but he trusted the Lord. He sang, “The Lord is my light. Whom shall I fear?” David meant, “Who should I be afraid of? No one!” When it is dark, we cannot see, and that can feel…",
   "wordCount": 123,
   "aka": [
    "Heavenly Father Is My Light"
   ]
  },
  {
   "id": "b8-w4-n7",
   "title": "Be Still",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 4,
   "night": 7,
   "scripture": "Psalm 46:1–2, 10",
   "scriptureBook": "Psalm",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "trust-in-god",
    "pondering"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels busy or stormy inside and needs to be still and know that Heavenly Father is near.",
   "teaser": "This song was for the sons of Korah, a singing family. It begins, “Heavenly Father is our safe place and our strength.” He is “a very present help in trouble,” always near. So the song says, “We will not fear.” Then…",
   "wordCount": 122,
   "aka": [
    "Be Still and Know"
   ]
  },
  {
   "id": "b8-w5-n1",
   "title": "Every Animal Is His",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 5,
   "night": 1,
   "scripture": "Psalm 50:10–12, 14",
   "scriptureBook": "Psalm",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "gratitude",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child wants to give God something and needs to know He loves their thank-yous best.",
   "teaser": "Asaph led the singing in King David’s day. He wrote a song with words from the Lord, who is Jesus. Back then, people gave the Lord animals as gifts. The gifts helped them remember that Jesus would come. In Asaph’s…",
   "wordCount": 119
  },
  {
   "id": "b8-w5-n2",
   "title": "Whiter Than Snow",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 5,
   "night": 2,
   "scripture": "Psalm 51:7, 10, 12",
   "scriptureBook": "Psalm",
   "traveler": "willow",
   "feeling": "guilty",
   "virtues": [
    "repentance",
    "forgiveness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child feels sorry for a wrong choice and needs to know Jesus can wash a sorry heart whiter than snow.",
   "teaser": "King David made a very wrong choice. Nathan, who spoke for the Lord, helped him see it. David felt so sorry. His heart felt heavy, like a stone inside him. He wanted to feel clean again. So David prayed, “Wash me…",
   "wordCount": 113
  },
  {
   "id": "b8-w5-n3",
   "title": "The Rock Higher Than I",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 5,
   "night": 3,
   "scripture": "Psalm 61:1–3",
   "scriptureBook": "Psalm",
   "traveler": "beau",
   "feeling": "worried",
   "virtues": [
    "trust-in-god",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels worried or far away and needs to call out to Jesus, a rock higher than they are.",
   "teaser": "King David wrote this song as a prayer. He sang, “Hear my cry, Heavenly Father. Listen to my prayer.” David felt far away, and his heart was full of worry. He prayed, “Lead me to the rock that is higher than I.”…",
   "wordCount": 120
  },
  {
   "id": "b8-w5-n4",
   "title": "In the Shadow of His Wings",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 5,
   "night": 4,
   "scripture": "Psalm 63:1, 6–7",
   "scriptureBook": "Psalm",
   "traveler": "wren",
   "feeling": "comforted",
   "virtues": [
    "comfort",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "comfort",
   "teachingNote": "Reach for this when your child lies awake at bedtime and needs to remember the Lord and rest under His wings.",
   "teaser": "King David wrote this song in the wilderness of Judah. It was a wide, dry land with very little water. David was thirsty for the Lord, the way dry land needs water. At night he sang, “I remember You on my bed. I…",
   "wordCount": 121,
   "aka": [
    "Thinking of Heavenly Father at Night"
   ]
  },
  {
   "id": "b8-w5-n5",
   "title": "Come and Hear!",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 5,
   "night": 5,
   "scripture": "Psalms 66:1, 16, 19; 78:4, 7",
   "scriptureBook": "Psalms",
   "traveler": "beau",
   "feeling": "eager",
   "virtues": [
    "gratitude",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child is bursting to share a blessing and needs to tell the family what Heavenly Father has done.",
   "teaser": "This happy song does not say who wrote it. It calls the whole world to shout and sing for joy. Then the singer called, “Come and hear! I will tell what the Lord has done for me.” He told how he prayed out loud. Then…",
   "wordCount": 112
  },
  {
   "id": "b8-w5-n6",
   "title": "Like Rain on the Grass",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 5,
   "night": 6,
   "scripture": "Psalm 72:6, 12",
   "scriptureBook": "Psalm",
   "traveler": "wren",
   "feeling": "comforted",
   "virtues": [
    "hope",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child is dry and weary inside and needs a picture of the kind King coming like gentle rain.",
   "teaser": "This song is a prayer for Solomon, King David’s son. Solomon was the new king, the leader of the whole land. The song asks that the king would help poor people. It asks him to help anyone who had no helper. It says…",
   "wordCount": 113
  },
  {
   "id": "b8-w5-n7",
   "title": "Ready to Forgive",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 5,
   "night": 7,
   "scripture": "Psalm 86:1, 5, 7",
   "scriptureBook": "Psalm",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "forgiveness",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "forgiveness",
   "teachingNote": "Reach for this when your child is holding a grudge and needs to see the Lord ready to forgive, so they can forgive too.",
   "teaser": "King David wrote this prayer. He prayed, “Lord, hear me, for I am poor and need You.” David said, “You, Lord, are good, and ready to forgive.” When the Lord forgives, He lets the wrong go and loves us still. The…",
   "wordCount": 119
  },
  {
   "id": "b9-w1-n1",
   "title": "Like a Loving Father",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 1,
   "night": 1,
   "scripture": "Psalm 103:1–2, 13",
   "scriptureBook": "Psalm",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "trust-in-god",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child wonders whether anyone is gentle with them when they fall, and needs the picture of a dad hurrying to help.",
   "teaser": "King David wrote a happy song. He sang, “Bless the Lord, O my soul.” He was telling the real him, deep inside, to say thank you. David sang, “Forget not all His good gifts.” He did not want to forget one good thing…",
   "wordCount": 119,
   "aka": [
    "Bless the Lord, O My Soul"
   ]
  },
  {
   "id": "b9-w1-n2",
   "title": "This Is the Day",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 1,
   "night": 2,
   "scripture": "Psalm 118:1, 24",
   "scriptureBook": "Psalm",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "gratitude",
    "contentment"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child wakes up flat and needs to hear that today was made by the Lord and can be glad.",
   "teaser": "Long ago, the Lord’s people sang a happy song. It began, “O give thanks to the Lord, for He is good.” Then they sang, “This is the day which the Lord has made. We will be happy and glad in it.” The Lord who made…",
   "wordCount": 112,
   "aka": [
    "This Is the Day!"
   ]
  },
  {
   "id": "b9-w1-n3",
   "title": "Children Are a Gift",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 1,
   "night": 3,
   "scripture": "Psalm 127:2–3",
   "scriptureBook": "Psalm",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "identity",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child needs to hear they are a gift to their family, not a chore, and are dearly loved.",
   "teaser": "Long ago in Israel, parents passed their land down to their children. That land was a precious gift kept in the family. A song in the Bible says children are a gift like that. It sings, “Children are a heritage of…",
   "wordCount": 115
  },
  {
   "id": "b9-w1-n4",
   "title": "His Mercy Lasts Forever",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 1,
   "night": 4,
   "scripture": "Psalm 136:1, 7–9, 26",
   "scriptureBook": "Psalm",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "trust-in-god",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child worries that a mistake might use up the Lord's patience and needs to hear His mercy lasts forever.",
   "teaser": "This happy song says the same words again and again. Every line ends, “For His mercy endures forever.” It says it twenty-six times! His mercy is His kind, forgiving love. It lasts and lasts, and it never, ever…",
   "wordCount": 123
  },
  {
   "id": "b9-w1-n5",
   "title": "Wonderfully Made",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 1,
   "night": 5,
   "scripture": "Psalm 139:9–10, 13–14",
   "scriptureBook": "Psalm",
   "traveler": "beau",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child is afraid of being alone or somewhere new and needs to know the Lord is with them everywhere.",
   "teaser": "King David wrote a song about the Lord being near. He sang, “If I take the wings of the morning.” He pictured flying far across the sea. Morning light spreads across the whole sky so fast. It is like the light has…",
   "wordCount": 114,
   "aka": [
    "You Know Me!"
   ]
  },
  {
   "id": "b9-w1-n6",
   "title": "He Names the Stars",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 1,
   "night": 6,
   "scripture": "Psalm 147:3–4",
   "scriptureBook": "Psalm",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "wonder",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wonder",
   "teachingNote": "Reach for this when your child looks up at the night sky and needs to hear the Lord knows every star and knows them too.",
   "teaser": "This song tells how great and kind the Lord is. It says, “He heals the broken in heart.” When we feel very sad inside, it is like our heart is broken. The song says the Lord wraps up those hurts, like a soft…",
   "wordCount": 113
  },
  {
   "id": "b9-w1-n7",
   "title": "Praise with Every Breath",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 1,
   "night": 7,
   "scripture": "Psalm 150:3–6",
   "scriptureBook": "Psalm",
   "traveler": "beau",
   "feeling": "happy",
   "virtues": [
    "gratitude",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child is bursting with energy and needs a way to turn every breath into praise.",
   "teaser": "The very last psalm is a big, happy song. It says, “Praise Him with the sound of the trumpet. Praise Him with the harp.” It says to praise Him with dancing and a jingly drum called a timbrel. Then come strings…",
   "wordCount": 113,
   "aka": [
    "Let Everything Praise Him!"
   ]
  },
  {
   "id": "b9-w2-n1",
   "title": "Listen to Mom and Dad",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 2,
   "night": 1,
   "scripture": "Proverbs 1:1, 8–9",
   "scriptureBook": "Proverbs",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "honoring-parents",
    "heeding-counsel"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "honoring-parents",
   "teachingNote": "Reach for this when your child pushes back on a parent's guidance and needs to see it as a lovely garland to wear.",
   "teaser": "King Solomon was King David’s son. He asked Heavenly Father to help him be wise. He wrote many short, wise sayings called proverbs. Solomon wrote, “My son, hear what your father teaches. Do not forget what your…",
   "wordCount": 112
  },
  {
   "id": "b9-w2-n2",
   "title": "He Will Show the Way",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 2,
   "night": 2,
   "scripture": "Proverbs 3:5–6",
   "scriptureBook": "Proverbs",
   "traveler": "beau",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels unsure which way to go and needs to trust the Lord to make the path clear.",
   "teaser": "Long ago, people walked everywhere on dusty, rocky paths. A traveler needed someone who knew the way. King Solomon wrote, “Trust in the Lord with all your heart. Do not lean on your own understanding.” The Lord…",
   "wordCount": 109,
   "aka": [
    "Trust Him to Lead the Way"
   ]
  },
  {
   "id": "b9-w2-n3",
   "title": "A Soft Answer",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 2,
   "night": 3,
   "scripture": "Proverbs 15:1; 16:24",
   "scriptureBook": "Proverbs",
   "traveler": "willow",
   "feeling": "calm",
   "virtues": [
    "peacemaking",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "peacemaking",
   "teachingNote": "Reach for this when your child is ready to snap back in anger and needs to know a soft answer can calm the room.",
   "teaser": "King Solomon wrote, “A soft answer turns away anger. But hurting words stir up anger.” When someone feels hot and mad, gentle words help cool them down. Hurting words make the mad feeling grow bigger. Solomon also…",
   "wordCount": 104,
   "aka": [
    "A Soft, Kind Answer"
   ]
  },
  {
   "id": "b9-w2-n4",
   "title": "Train Up a Child",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 2,
   "night": 4,
   "scripture": "Proverbs 22:6",
   "scriptureBook": "Proverbs",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "diligence",
    "heeding-counsel"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "diligence",
   "teachingNote": "Reach for this when your child wants to be good at something big and needs to see that small daily steps keep them on the path.",
   "teaser": "King Solomon wrote, “Train up a child in the way he should go. And when he is old, he will not leave it.” Training means learning the Lord’s good way a little every day, again and again. Long ago, a boy worked…",
   "wordCount": 114
  },
  {
   "id": "b9-w2-n5",
   "title": "A Kind and Wise Mother",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 2,
   "night": 5,
   "scripture": "Proverbs 31:1, 15, 19–20, 26–28",
   "scriptureBook": "Proverbs",
   "traveler": "willow",
   "feeling": "grateful",
   "virtues": [
    "gratitude",
    "honoring-parents"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child takes a mother's daily work for granted and needs a gentle way to say thank you.",
   "teaser": "The last part of Proverbs has words King Lemuel’s mother taught him. It ends with a poem about a good, wise mother. She gets up while it is still dark to make food for her family. She spins soft wool, twisting it…",
   "wordCount": 122,
   "aka": [
    "Loving, Helping Hands"
   ]
  },
  {
   "id": "b9-w2-n6",
   "title": "A Time for Everything",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 2,
   "night": 6,
   "scripture": "Ecclesiastes 1:1; 3:1–8, 11",
   "scriptureBook": "Ecclesiastes",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "patience",
    "contentment"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "patience",
   "teachingNote": "Reach for this when your child feels rushed or restless and needs to hear there is a right time for everything, including rest.",
   "teaser": "The Preacher was a son of King David and a king in Jerusalem. He wrote a book of wise sayings called Ecclesiastes. He wrote, “To every thing there is a season.” There is a right time for everything. Farmers knew…",
   "wordCount": 110
  },
  {
   "id": "b9-w2-n7",
   "title": "Remember Your Creator",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 2,
   "night": 7,
   "scripture": "Ecclesiastes 11:7; 12:1, 13",
   "scriptureBook": "Ecclesiastes",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "love-of-scripture",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this when your child thinks being close to God is for later and needs to remember Him now, while young.",
   "teaser": "The Preacher loved the morning sun. He wrote, “Truly the light is sweet. It is a happy thing to see the sun.” Then he wrote, “Remember now your Creator in the days of your youth.” Remember the One who made you while…",
   "wordCount": 113,
   "aka": [
    "Remember Him While You’re Little"
   ]
  },
  {
   "id": "b9-w3-n1",
   "title": "White as Snow",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 3,
   "night": 1,
   "scripture": "Isaiah 1:1, 16–18",
   "scriptureBook": "Isaiah",
   "traveler": "willow",
   "feeling": "calm",
   "virtues": [
    "repentance",
    "forgiveness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child carries a heavy mistake and needs the picture of a heart made white as fresh snow.",
   "teaser": "Long ago in Jerusalem, many of Heavenly Father’s people had stopped doing good. So the Lord gave Isaiah a message for them: “Wash, and make yourselves clean.” He did not mean a bath! He wanted to wash the wrong…",
   "wordCount": 122
  },
  {
   "id": "b9-w3-n2",
   "title": "The Mountain of the Lord",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 3,
   "night": 2,
   "scripture": "Isaiah 2:1–3",
   "scriptureBook": "Isaiah",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "worship-together",
    "curiosity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "worship-together",
   "teachingNote": "Reach for this when your child is excited to go to church or the temple and needs to know it is the Lord's house of teaching.",
   "teaser": "Isaiah lived long ago in Jerusalem. The Lord showed him the last days, before Jesus comes again. Isaiah saw the Lord’s holy house, the temple, standing on top of the mountains. It stood higher than all the hills…",
   "wordCount": 117,
   "aka": [
    "Come to Heavenly Father’s House"
   ]
  },
  {
   "id": "b9-w3-n3",
   "title": "Swords into Plows",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 3,
   "night": 3,
   "scripture": "Isaiah 2:4–5",
   "scriptureBook": "Isaiah",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "peacemaking",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "peacemaking",
   "teachingNote": "Reach for this when your child is in a squabble with a sibling and needs to learn how to turn fighting into helping.",
   "teaser": "In Isaiah’s day, lands often fought each other. Soldiers carried long, sharp swords and spears. But the Lord showed Isaiah a day when the fighting would stop. People would hammer their swords into plowshares, plow…",
   "wordCount": 115
  },
  {
   "id": "b9-w3-n4",
   "title": "Here Am I; Send Me",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 3,
   "night": 4,
   "scripture": "Isaiah 6:1–8",
   "scriptureBook": "Isaiah",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "service",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child hears a need but hesitates and needs the words, Here am I, send me.",
   "teaser": "In the year King Uzziah died, Isaiah saw the Lord in the temple. The Lord sat high up on a king’s throne. Heavenly helpers named seraphim called out, “Holy, holy, holy is the Lord! The whole earth is full of His…",
   "wordCount": 118,
   "aka": [
    "Here Am I, Send Me"
   ]
  },
  {
   "id": "b9-w3-n5",
   "title": "A Great Light",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 3,
   "night": 5,
   "scripture": "Isaiah 9:1–2",
   "scriptureBook": "Isaiah",
   "traveler": "scout",
   "feeling": "comforted",
   "virtues": [
    "hope",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child is afraid of the dark or a gloomy day and needs to know Jesus is the great light.",
   "teaser": "Isaiah told about a land called Galilee, near the sea. Hard times had come there, and the people felt sad and lost. Isaiah said, “The people that walked in darkness have seen a great light.” Think of walking on a…",
   "wordCount": 120
  },
  {
   "id": "b9-w3-n6",
   "title": "A Little Child Shall Lead",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 3,
   "night": 6,
   "scripture": "Isaiah 11:1, 6–9",
   "scriptureBook": "Isaiah",
   "traveler": "willow",
   "feeling": "calm",
   "virtues": [
    "self-control",
    "peacemaking"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "self-control",
   "teachingNote": "Reach for this when your child has rough hands or loud words and needs the picture of a gentle world with a child leading.",
   "teaser": "Isaiah said a new green branch would grow from the roots of Jesse’s family. Jesse was King David’s father. Jesus was born into that family. Isaiah was talking about Jesus! Isaiah saw a time of peace Jesus will…",
   "wordCount": 124,
   "aka": [
    "The Peaceful Kingdom"
   ]
  },
  {
   "id": "b9-w3-n7",
   "title": "My Strength and My Song",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 3,
   "night": 7,
   "scripture": "Isaiah 12:2–3",
   "scriptureBook": "Isaiah",
   "traveler": "wren",
   "feeling": "happy",
   "virtues": [
    "trust-in-god",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels afraid and needs a song to sing about Jesus being their strength.",
   "teaser": "Isaiah wrote a happy song for a day still to come. It is a song about trusting the Lord. The song says, “I will trust, and not be afraid.” It says, “The Lord Jehovah is my strength and my song.” Jehovah is Jesus’s…",
   "wordCount": 122,
   "aka": [
    "I Will Trust and Not Be Afraid"
   ]
  },
  {
   "id": "b9-w4-n1",
   "title": "A Nail in a Sure Place",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 4,
   "night": 1,
   "scripture": "Isaiah 22:20–23",
   "scriptureBook": "Isaiah",
   "traveler": "wren",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child worries about losing their place or being let go and needs the picture of a strong nail in a sure place.",
   "teaser": "Long ago, kings from King David’s family lived in a big house in Jerusalem. Some people trusted only their strong walls and forgot the Lord. So the Lord told Isaiah about a good helper, Eliakim. The Lord would lay…",
   "wordCount": 122
  },
  {
   "id": "b9-w4-n2",
   "title": "Shelter from the Storm",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 4,
   "night": 2,
   "scripture": "Isaiah 25:1, 4",
   "scriptureBook": "Isaiah",
   "traveler": "beau",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child is scared of a storm, loud noise, or hard day and needs to know Jesus is their shelter.",
   "teaser": "Isaiah loved the Lord. He sang, “I will praise Your name, for You have done wonderful things.” Isaiah said the Lord is “a strength to the poor.” He helps people who do not have much. Isaiah said the Lord is “a…",
   "wordCount": 119
  },
  {
   "id": "b9-w4-n3",
   "title": "He Will Wipe Away Tears",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 4,
   "night": 3,
   "scripture": "Isaiah 25:8–9",
   "scriptureBook": "Isaiah",
   "traveler": "willow",
   "feeling": "comforted",
   "virtues": [
    "comfort",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "comfort",
   "teachingNote": "Reach for this when your child is crying about something sad and needs to hear Jesus will wipe away every tear.",
   "teaser": "Isaiah told about a happy day that will come. On that day, no one will need to be sad anymore. Isaiah said, “The Lord will wipe away tears from off all faces.” Every tear, on every sad face! Think of a mom gently…",
   "wordCount": 111,
   "aka": [
    "He Wipes Away Every Tear"
   ]
  },
  {
   "id": "b9-w4-n4",
   "title": "Perfect Peace",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 4,
   "night": 4,
   "scripture": "Isaiah 26:1–4",
   "scriptureBook": "Isaiah",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "trust-in-god",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child has a busy mind at the end of the day and needs to rest it on Jesus for perfect peace.",
   "teaser": "Isaiah wrote a song for the people to sing someday. It was a song about trusting the Lord. The song says the Lord will keep you “in perfect peace.” That is a calm, quiet feeling, deep in your heart. That peace comes…",
   "wordCount": 110
  },
  {
   "id": "b9-w4-n5",
   "title": "A Marvelous Work",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 4,
   "night": 5,
   "scripture": "Isaiah 29:11–14, 18",
   "scriptureBook": "Isaiah",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "love-of-scripture",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this when your child wonders why the Book of Mormon matters and needs to hear it is part of a marvelous work.",
   "teaser": "The Lord showed Isaiah things far in the future. Isaiah told about a book that was sealed, closed up tight. Someone asked a wise man to read it. He said, “I cannot; for it is sealed.” Some people praised the Lord…",
   "wordCount": 120,
   "aka": [
    "A Marvellous Work and a Wonder"
   ]
  },
  {
   "id": "b9-w4-n6",
   "title": "This Is the Way",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 4,
   "night": 6,
   "scripture": "Isaiah 30:9–10, 18–21",
   "scriptureBook": "Isaiah",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "heeding-counsel",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "heeding-counsel",
   "teachingNote": "Reach for this when your child is unsure which way to go and needs to listen for the voice saying, This is the way.",
   "teaser": "Many people in Isaiah’s day did not want to listen. They told the prophets, “Do not tell us what is right.” But the Lord still loved them. Isaiah said the Lord was waiting, ready to be kind to them. When you cry out…",
   "wordCount": 112
  },
  {
   "id": "b9-w4-n7",
   "title": "The Desert Will Blossom",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 4,
   "night": 7,
   "scripture": "Isaiah 35:1–2, 5–7",
   "scriptureBook": "Isaiah",
   "traveler": "willow",
   "feeling": "happy",
   "virtues": [
    "hope",
    "compassion"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child feels dry, hurting, or stuck and needs the picture of a desert blooming.",
   "teaser": "Much of Isaiah’s land was desert, dry and sandy, with very few plants. Isaiah said, “The desert shall rejoice, and blossom as the rose.” Picture dry sand bursting with roses! Water would break out, and thirsty…",
   "wordCount": 111,
   "aka": [
    "The Desert Blooms"
   ]
  },
  {
   "id": "b10-w1-n1",
   "title": "A Voice in the Wilderness",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 1,
   "night": 1,
   "scripture": "Isaiah 40:1–3",
   "scriptureBook": "Isaiah",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "hope",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child is waiting for something special and needs a way to get ready, like smoothing a road.",
   "teaser": "Isaiah told the people what Heavenly Father said. He knew hard, sad days were coming for them. So the Lord gave Isaiah gentle words: “Comfort, comfort My people.” Comfort is like a warm hug that helps a sad heart…",
   "wordCount": 122
  },
  {
   "id": "b10-w1-n2",
   "title": "Like a Gentle Shepherd",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 1,
   "night": 2,
   "scripture": "Isaiah 40:11",
   "scriptureBook": "Isaiah",
   "traveler": "willow",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "comfort"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels small or tired and needs to picture a shepherd carrying a lamb close to his heart.",
   "teaser": "Isaiah wrote about how the Lord takes care of His people. He used a picture everyone in his land knew. Isaiah said, “He shall feed His flock like a shepherd.” A good shepherd finds green grass and cool water for his…",
   "wordCount": 120,
   "aka": [
    "He Carries the Lambs"
   ]
  },
  {
   "id": "b10-w1-n3",
   "title": "Wings Like Eagles",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 1,
   "night": 3,
   "scripture": "Isaiah 40:28–31",
   "scriptureBook": "Isaiah",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "perseverance",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "perseverance",
   "teachingNote": "Reach for this when your child is worn out and ready to quit and needs to hear where new strength comes from.",
   "teaser": "Sometimes the Lord’s people felt tired and weak. They wanted to give up. So Isaiah reminded them of something wonderful. Isaiah said the Lord made the whole earth, and He never gets tired. He gives strength to…",
   "wordCount": 121,
   "aka": [
    "Wings Like the Eagles"
   ]
  },
  {
   "id": "b10-w1-n4",
   "title": "Fear Not, I Am with You",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 1,
   "night": 4,
   "scripture": "Isaiah 41:10, 13",
   "scriptureBook": "Isaiah",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "courage",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child is afraid and needs to feel a hand holding theirs.",
   "teaser": "Hard and scary times were coming for the Lord’s people. So the Lord gave Isaiah kind words for anyone who feels afraid. The Lord said, “Fear not, for I am with you. I will help you. I will hold you up.” Then He…",
   "wordCount": 114
  },
  {
   "id": "b10-w1-n5",
   "title": "I Called You by Name",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 1,
   "night": 5,
   "scripture": "Isaiah 43:1–2",
   "scriptureBook": "Isaiah",
   "traveler": "wren",
   "feeling": "connected",
   "virtues": [
    "identity",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child wonders if they matter and needs to hear that the Lord knows their name.",
   "teaser": "Isaiah wrote the Lord’s words for His people. Hard times would come, and they might feel all alone. The Lord said, “Fear not. I have called you by your name. You are Mine.” He knows each person, and He loves them…",
   "wordCount": 110,
   "aka": [
    "I Have Called You by Name"
   ]
  },
  {
   "id": "b10-w1-n6",
   "title": "Water for Thirsty Ground",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 1,
   "night": 6,
   "scripture": "Isaiah 44:2–4",
   "scriptureBook": "Isaiah",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "hope",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child feels dry or empty inside and needs the picture of gentle rain on thirsty ground.",
   "teaser": "In Isaiah’s land, summers were hot and dry. Without rain, the ground cracked and the plants drooped. The Lord told Isaiah, “Fear not. I will pour water on the thirsty, and floods on the dry ground.” Then He said, “I…",
   "wordCount": 109
  },
  {
   "id": "b10-w1-n7",
   "title": "Written on His Hands",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 1,
   "night": 7,
   "scripture": "Isaiah 49:14–16",
   "scriptureBook": "Isaiah",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "identity",
    "comfort"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child worries they will be forgotten and needs to see their name written on the Lord's hands.",
   "teaser": "Once the Lord’s people felt sad and all alone. They said, “The Lord has forgotten me.” The Lord answered with a question: “Can a mother forget her baby?” Then He said, “Even if she could, I will not forget you.” He…",
   "wordCount": 109
  },
  {
   "id": "b10-w2-n1",
   "title": "A Kind Word for the Weary",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 2,
   "night": 1,
   "scripture": "Isaiah 50:4",
   "scriptureBook": "Isaiah",
   "traveler": "willow",
   "feeling": "comforted",
   "virtues": [
    "kindness",
    "comfort"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child is tired or discouraged and needs a kind word, or wants to give one to someone else.",
   "teaser": "Isaiah wrote some words as if Jesus Himself were talking. Long before Jesus was born, Isaiah knew about Him. In those words, Jesus says the Lord taught Him how to speak. He would know the right word for someone…",
   "wordCount": 116,
   "aka": [
    "A Word for the Weary"
   ]
  },
  {
   "id": "b10-w2-n2",
   "title": "The Desert Garden",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 2,
   "night": 2,
   "scripture": "Isaiah 51:3",
   "scriptureBook": "Isaiah",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "hope",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child is sad about something dry or broken and needs to know the Lord can make it bloom.",
   "teaser": "Isaiah knew the Lord’s people would have sad times. Their home would have broken, empty places. Picture a hot, dry desert, with dusty rocks and hardly any rain. Few plants can grow there. But Isaiah said the Lord…",
   "wordCount": 106
  },
  {
   "id": "b10-w2-n3",
   "title": "Beautiful Feet",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 2,
   "night": 3,
   "scripture": "Isaiah 52:7",
   "scriptureBook": "Isaiah",
   "traveler": "beau",
   "feeling": "excited",
   "virtues": [
    "service",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child has good news bursting to come out and needs to know that sharing it is beautiful.",
   "teaser": "Long ago, there were no phones or cars. Important news came with a messenger who ran on foot from town to town. People waited and waited to hear the news. Would it be happy news or sad news? Isaiah said the feet…",
   "wordCount": 104,
   "aka": [
    "Beautiful Feet on the Hills"
   ]
  },
  {
   "id": "b10-w2-n4",
   "title": "Kindness That Stays",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 2,
   "night": 4,
   "scripture": "Isaiah 54:10, 13",
   "scriptureBook": "Isaiah",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "trust-in-god",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels like everything is changing and needs to hear that the Lord's kindness stays.",
   "teaser": "Isaiah wrote the Lord’s words for His sad, hurting people. They worried the Lord might leave them. Mountains seem like they will stay forever. What could be bigger or stronger than a mountain? But the Lord said…",
   "wordCount": 108,
   "aka": [
    "Kindness That Never Leaves"
   ]
  },
  {
   "id": "b10-w2-n5",
   "title": "Come to the Waters",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 2,
   "night": 5,
   "scripture": "Isaiah 55:1–3",
   "scriptureBook": "Isaiah",
   "traveler": "scout",
   "feeling": "connected",
   "virtues": [
    "humility",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child thinks they must earn a place and needs to hear that the Lord's best gifts are free.",
   "teaser": "In Isaiah’s land, summers were long, hot and dry. A drink of cool water was a happy gift. At the market, people paid money for bread and milk. Some spent money on things that did not fill them up. But Isaiah shared…",
   "wordCount": 121
  },
  {
   "id": "b10-w2-n6",
   "title": "The Trees Clap Their Hands",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 2,
   "night": 6,
   "scripture": "Isaiah 55:8–9, 12",
   "scriptureBook": "Isaiah",
   "traveler": "wren",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child does not understand why things happen and needs to trust that the Lord knows more.",
   "teaser": "Sometimes the Lord’s people did not understand His plans. So the Lord spoke to them through Isaiah. The Lord said, “My thoughts are not your thoughts.” Look up at the sky. It is so much higher than the ground! The…",
   "wordCount": 122,
   "aka": [
    "Go Out With Joy"
   ]
  },
  {
   "id": "b10-w2-n7",
   "title": "A House of Prayer for All",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 2,
   "night": 7,
   "scripture": "Isaiah 56:6–7",
   "scriptureBook": "Isaiah",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "worship-together",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "worship-together",
   "teachingNote": "Reach for this when your child feels left out and needs to hear that the Lord's house has room for everyone.",
   "teaser": "In Jerusalem stood the temple, the Lord’s holy house, where people came to pray. Some people from other lands had come to love the Lord. They wanted to serve Him and keep His holy day. They worried, “The Lord will…",
   "wordCount": 106
  },
  {
   "id": "b10-w3-n1",
   "title": "Share Your Bread",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 3,
   "night": 1,
   "scripture": "Isaiah 58:6–7, 10–11",
   "scriptureBook": "Isaiah",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "generosity",
    "compassion"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child sees someone hungry or in need and is ready to learn how sharing shows love.",
   "teaser": "Long ago, Isaiah told the people what Heavenly Father said. Some of them would fast. To fast is to go without food for a little while and pray. But while they fasted, they still argued and fought. They were not…",
   "wordCount": 121
  },
  {
   "id": "b10-w3-n2",
   "title": "A Happy Holy Day",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 3,
   "night": 2,
   "scripture": "Isaiah 58:13–14",
   "scriptureBook": "Isaiah",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "reverence",
    "worship-together"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child finds Sunday hard to slow down for and needs to see the Sabbath as a happy gift.",
   "teaser": "Long ago, Isaiah told the people what Heavenly Father said. He taught them about the Sabbath, the Lord’s holy day of rest each week. Some people were using His special day just to do whatever they wanted. So the…",
   "wordCount": 112,
   "aka": [
    "The Day Called Delight"
   ]
  },
  {
   "id": "b10-w3-n3",
   "title": "Arise and Shine",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 3,
   "night": 3,
   "scripture": "Isaiah 60:1–3",
   "scriptureBook": "Isaiah",
   "traveler": "beau",
   "feeling": "happy",
   "virtues": [
    "hope",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child feels dim or discouraged and needs to know the Lord's light can make them shine.",
   "teaser": "Long ago, Isaiah told the people what Heavenly Father said. He gave them happy words: “Arise, shine; for your light has come!” Think of a dark night. Then the sun comes up. People wake up and get up! That is the…",
   "wordCount": 117,
   "aka": [
    "Arise, Little Light"
   ]
  },
  {
   "id": "b10-w3-n4",
   "title": "Beauty for Ashes",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 3,
   "night": 4,
   "scripture": "Isaiah 61:1–3; Luke 4:16–21",
   "scriptureBook": "Isaiah",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "comfort",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "comfort",
   "teachingNote": "Reach for this when your child is sad and needs to hear that Jesus trades beauty for ashes and joy for mourning.",
   "teaser": "Long ago, Isaiah wrote about Someone Heavenly Father would send. That Someone would “bind up the brokenhearted.” He would gently wrap very sad hearts, like a bandage on a knee. He would also give “beauty for ashes.”…",
   "wordCount": 124
  },
  {
   "id": "b10-w3-n5",
   "title": "Carried in His Love",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 3,
   "night": 5,
   "scripture": "Isaiah 63:7–9",
   "scriptureBook": "Isaiah",
   "traveler": "beau",
   "feeling": "safe",
   "virtues": [
    "comfort",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "comfort",
   "teachingNote": "Reach for this when your child is hurting and needs to know Jesus feels it and carries them.",
   "teaser": "Long ago, Isaiah thought about all the good things the Lord had done. He said, “I will tell of the Lord’s loving kindness.” He wanted no one to forget. The Lord had said, “They are My people, My children.” So He…",
   "wordCount": 124
  },
  {
   "id": "b10-w3-n6",
   "title": "We Are the Clay",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 3,
   "night": 6,
   "scripture": "Isaiah 64:8",
   "scriptureBook": "Isaiah",
   "traveler": "wren",
   "feeling": "eager",
   "virtues": [
    "humility",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child is frustrated with their mistakes and needs to remember the Potter is still shaping them.",
   "teaser": "Long ago, Isaiah’s people had turned away from the Lord. Isaiah wanted them to come close to Him again. So he said a prayer. Isaiah prayed, “O Lord, You are our Father. We are the clay, and You are our potter.” In…",
   "wordCount": 112,
   "aka": [
    "Clay in Kind Hands"
   ]
  },
  {
   "id": "b10-w3-n7",
   "title": "Before You Call",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 3,
   "night": 7,
   "scripture": "Isaiah 65:24; 66:13",
   "scriptureBook": "Isaiah",
   "traveler": "willow",
   "feeling": "comforted",
   "virtues": [
    "prayer",
    "comfort"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child wonders whether their prayers are heard and needs to hear the Lord answers before they call.",
   "teaser": "Long ago, Isaiah told the people what Heavenly Father said. The Lord made a sweet promise to His people. He said, “Before they call, I will answer. While they are still speaking, I will hear.” We call to Him when we…",
   "wordCount": 114
  },
  {
   "id": "b10-w4-n1",
   "title": "Known Before You Were Born",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 4,
   "night": 1,
   "scripture": "Jeremiah 1:1, 4–5",
   "scriptureBook": "Jeremiah",
   "traveler": "wren",
   "feeling": "connected",
   "virtues": [
    "identity",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels unknown or unimportant and needs to hear Heavenly Father knew them before they were born.",
   "teaser": "Long ago, Jeremiah grew up in a family of priests who served the Lord. One day the Lord spoke to Jeremiah. The Lord was Jesus, speaking for Heavenly Father. He said, “Before I made you in your mother’s tummy, I knew…",
   "wordCount": 110,
   "aka": [
    "Before You Were Born"
   ]
  },
  {
   "id": "b10-w4-n2",
   "title": "Say Not, I Am a Child",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 4,
   "night": 2,
   "scripture": "Jeremiah 1:6–9",
   "scriptureBook": "Jeremiah",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "courage",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child says I am too little and needs to hear the Lord puts His words in a child's mouth.",
   "teaser": "The Lord chose young Jeremiah to tell people Heavenly Father’s words. Jeremiah felt too little. He said, “Oh, Lord, I cannot speak. I am a child.” The Lord said, “Do not say, ‘I am a child.’ Go where I send you. Say…",
   "wordCount": 121,
   "aka": [
    "When He Touched My Mouth"
   ]
  },
  {
   "id": "b10-w4-n3",
   "title": "The Almond Branch",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 4,
   "night": 3,
   "scripture": "Jeremiah 1:11–12",
   "scriptureBook": "Jeremiah",
   "traveler": "scout",
   "feeling": "safe",
   "virtues": [
    "keeping-promises",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "keeping-promises",
   "teachingNote": "Reach for this when your child doubts a promise will come true and needs the picture of an almond branch waking up.",
   "teaser": "The Lord had just chosen Jeremiah to share His words. Then the Lord asked him, “Jeremiah, what do you see?” Jeremiah looked closely. He said, “I see a branch from an almond tree.” In spring, the almond tree wakes up…",
   "wordCount": 117,
   "aka": [
    "The Little Waking Branch"
   ]
  },
  {
   "id": "b10-w4-n4",
   "title": "A Fountain of Living Water",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 4,
   "night": 4,
   "scripture": "Jeremiah 2:13; 17:7–8",
   "scriptureBook": "Jeremiah",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "faith",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child feels empty after chasing other things and needs the picture of a tree by a stream.",
   "teaser": "Jeremiah lived in a hot, dry land. The best water came from a spring, bubbling up fresh from the ground. Some people cut a big hole in rock, called a cistern, to catch rain. If the rock cracked, the water leaked…",
   "wordCount": 122
  },
  {
   "id": "b10-w4-n5",
   "title": "Fishers and Hunters",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 4,
   "night": 5,
   "scripture": "Jeremiah 3:14; 16:14–16",
   "scriptureBook": "Jeremiah",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "service",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child wants to help and needs to see how Heavenly Father looks for every one of His children.",
   "teaser": "Long ago, many of the Lord’s people had wandered away. They were spread far from home. But the Lord still called them His children. He said, “Come back.” He would bring them to Zion, where His people live together…",
   "wordCount": 122
  },
  {
   "id": "b10-w4-n6",
   "title": "The Pot Made New",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 4,
   "night": 6,
   "scripture": "Jeremiah 18:1–6",
   "scriptureBook": "Jeremiah",
   "traveler": "willow",
   "feeling": "comforted",
   "virtues": [
    "repentance",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child made a mistake and needs to know the Potter can make them new.",
   "teaser": "The Lord told Jeremiah, “Go down to the potter’s house.” So Jeremiah went to see a man who made pots and bowls from clay. The potter sat at his wheel. It spun around and around while his hands shaped the soft, wet…",
   "wordCount": 112,
   "aka": [
    "The Potter’s Gentle Hands"
   ]
  },
  {
   "id": "b10-w4-n7",
   "title": "A Fire in My Bones",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 4,
   "night": 7,
   "scripture": "Jeremiah 7:2, 23; 20:7–9",
   "scriptureBook": "Jeremiah",
   "traveler": "beau",
   "feeling": "excited",
   "virtues": [
    "love-of-scripture",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this when your child feels the Lord's words warm inside and needs courage to share them.",
   "teaser": "The Lord sent Jeremiah to stand at the gate of His house, the temple. Jeremiah gave the people the Lord’s words. “Obey My voice, and you will be My people.” Many people did not want to listen. Some laughed at…",
   "wordCount": 121,
   "aka": [
    "A Little Fire Inside"
   ]
  },
  {
   "id": "b11-w1-n1",
   "title": "New Every Morning",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 1,
   "night": 1,
   "scripture": "Lamentations 3:22–23",
   "scriptureBook": "Lamentations",
   "traveler": "wren",
   "feeling": "sad",
   "virtues": [
    "hope",
    "comfort"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this after a hard day, when your child needs to know tomorrow starts fresh with Heavenly Father’s kindness.",
   "teaser": "Long ago, an army from Babylon came to Jerusalem, the home city of Heavenly Father’s people. Babylon was a big, strong kingdom far away. The people lost their homes, and their hearts felt heavy as stones. The book…",
   "wordCount": 132
  },
  {
   "id": "b11-w1-n2",
   "title": "Loved With an Everlasting Love",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 1,
   "night": 2,
   "scripture": "Jeremiah 31:3–4",
   "scriptureBook": "Jeremiah",
   "traveler": "willow",
   "feeling": "sad",
   "virtues": [
    "identity",
    "comfort"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels lonely or left out and needs to hear that Heavenly Father’s love never stops.",
   "teaser": "Heavenly Father’s people had been taken far from their homes to faraway lands. Far from home, it was easy to feel forgotten and alone. Then Heavenly Father sent a message through Jeremiah, His prophet. A prophet shares Heavenly…",
   "wordCount": 134
  },
  {
   "id": "b11-w1-n3",
   "title": "Call and He Will Answer",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 1,
   "night": 3,
   "scripture": "Jeremiah 33:3",
   "scriptureBook": "Jeremiah",
   "traveler": "scout",
   "feeling": "worried",
   "virtues": [
    "prayer",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child feels stuck and needs to know they can pray from right where they are.",
   "teaser": "The king did not like Jeremiah’s messages, so his guards kept Jeremiah shut in a courtyard. A courtyard is an open yard with walls all around. Jeremiah could not go out. But Heavenly Father’s words can go anywhere…",
   "wordCount": 131
  },
  {
   "id": "b11-w1-n4",
   "title": "A Field for Tomorrow",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 1,
   "night": 4,
   "scripture": "Jeremiah 32:6–15",
   "scriptureBook": "Jeremiah",
   "traveler": "beau",
   "feeling": "discouraged",
   "virtues": [
    "hope",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child feels like giving up on tomorrow and needs one hopeful thing to do today.",
   "teaser": "An army from Babylon was all around Jerusalem, and Jeremiah was kept in the guards’ courtyard. It was a very hard time, and soon the army would take the land. Heavenly Father told Jeremiah, “Your cousin Hanameel will…",
   "wordCount": 141
  },
  {
   "id": "b11-w1-n5",
   "title": "Mourning Turned Into Joy",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 1,
   "night": 5,
   "scripture": "Jeremiah 31:12–13",
   "scriptureBook": "Jeremiah",
   "traveler": "willow",
   "feeling": "sad",
   "virtues": [
    "comfort",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "comfort",
   "teachingNote": "Reach for this when your child has been sad for a long time and needs to know sad times can turn glad.",
   "teaser": "Heavenly Father’s people were very sad. Many had been taken far from home. So He gave them a happy picture of what was coming. “They shall come and sing in the height of Zion,” He said. Zion was…",
   "wordCount": 131
  },
  {
   "id": "b11-w1-n6",
   "title": "Written on Our Hearts",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 1,
   "night": 6,
   "scripture": "Jeremiah 31:31–34",
   "scriptureBook": "Jeremiah",
   "traveler": "wren",
   "feeling": "guilty",
   "virtues": [
    "integrity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "integrity",
   "teachingNote": "Reach for this when your child is good only while someone is watching and needs to know Heavenly Father writes goodness inside the heart.",
   "teaser": "Heavenly Father made a promise through Jeremiah. “I will make a new covenant,” He said. A covenant is a special two-way promise between Heavenly Father and His people. Long before, His law was written on flat stones for…",
   "wordCount": 128
  },
  {
   "id": "b11-w1-n7",
   "title": "The Words Written Again",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 1,
   "night": 7,
   "scripture": "Jeremiah 36:27–32",
   "scriptureBook": "Jeremiah",
   "traveler": "beau",
   "feeling": "disappointed",
   "virtues": [
    "perseverance",
    "love-of-scripture"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "perseverance",
   "teachingNote": "Reach for this when something your child made gets broken and they need the courage to begin again.",
   "teaser": "Jeremiah spoke Heavenly Father’s words out loud. His friend Baruch wrote every word on a scroll. A scroll is a long paper rolled up like a tube. Baruch read the words in the temple, Heavenly Father’s holy house…",
   "wordCount": 131
  },
  {
   "id": "b11-w2-n1",
   "title": "The Sky Opened Wide",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 2,
   "night": 1,
   "scripture": "Ezekiel 1:1, 26–28",
   "scriptureBook": "Ezekiel",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "wonder",
    "reverence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wonder",
   "teachingNote": "Reach for this when your child needs to stop and look with wonder at how bright and kind Heavenly Father is.",
   "teaser": "Ezekiel was a prophet. A prophet is someone Heavenly Father talks to, so he can teach the people. The army of Babylon had taken Ezekiel’s people far from home. One day, by a river in that faraway land…",
   "wordCount": 138
  },
  {
   "id": "b11-w2-n2",
   "title": "Sweet as Honey",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 2,
   "night": 2,
   "scripture": "Ezekiel 3:1–3",
   "scriptureBook": "Ezekiel",
   "traveler": "wren",
   "feeling": "happy",
   "virtues": [
    "love-of-scripture",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this at scripture time, when you want your child to taste how sweet His words are.",
   "teaser": "Heavenly Father held out a scroll to Ezekiel. A scroll is a long paper with writing on it, rolled up like a tube. People wrote on scrolls back then, because there were no books like ours. This was…",
   "wordCount": 136
  },
  {
   "id": "b11-w2-n3",
   "title": "The One Who Watches",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 2,
   "night": 3,
   "scripture": "Ezekiel 33:7, 11",
   "scriptureBook": "Ezekiel",
   "traveler": "beau",
   "feeling": "sad",
   "virtues": [
    "repentance",
    "stand-for-truth"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this after a wrong choice, when your child needs to hear that Heavenly Father is glad when we turn around.",
   "teaser": "Long ago, cities had tall stone walls. A watchman stood high on the wall, looking far, far away over the land. If he saw danger coming, he blew a loud trumpet so everyone could get safe. Heavenly Father…",
   "wordCount": 137
  },
  {
   "id": "b11-w2-n4",
   "title": "The Shepherd Finds His Sheep",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 2,
   "night": 4,
   "scripture": "Ezekiel 34:11–16",
   "scriptureBook": "Ezekiel",
   "traveler": "willow",
   "feeling": "sad",
   "virtues": [
    "comfort",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "comfort",
   "teachingNote": "Reach for this when your child feels alone or lost and needs to know the Shepherd never stops looking.",
   "teaser": "Many families in Israel kept sheep. A shepherd is a person who cares for sheep, finds them food and water, and keeps them safe. The leaders of Israel were supposed to care for the people like shepherds, but…",
   "wordCount": 135
  },
  {
   "id": "b11-w2-n5",
   "title": "A New Heart",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 2,
   "night": 5,
   "scripture": "Ezekiel 36:26",
   "scriptureBook": "Ezekiel",
   "traveler": "willow",
   "feeling": "angry",
   "virtues": [
    "humility",
    "repentance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child’s heart has gone hard and grumpy and needs to know Heavenly Father can make it soft.",
   "teaser": "Heavenly Father’s people had stopped listening to Him. Their hearts had grown hard, like a stone. You can squeeze a stone all day, and it never gets soft. So Heavenly Father made a promise: “A new heart I…",
   "wordCount": 138
  },
  {
   "id": "b11-w2-n6",
   "title": "The Valley That Woke Up",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 2,
   "night": 6,
   "scripture": "Ezekiel 37:1–10",
   "scriptureBook": "Ezekiel",
   "traveler": "beau",
   "feeling": "discouraged",
   "virtues": [
    "hope",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when something feels too late to fix and your child needs to hear that Heavenly Father brings life back.",
   "teaser": "Heavenly Father showed Ezekiel a vision, a picture from Heavenly Father. He saw a wide valley full of very dry bones. Heavenly Father led Ezekiel all around them. Everything was very still and quiet. “Can these bones live…",
   "wordCount": 136
  },
  {
   "id": "b11-w2-n7",
   "title": "The River That Kept Rising",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 2,
   "night": 7,
   "scripture": "Ezekiel 47:1–12",
   "scriptureBook": "Ezekiel",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "curiosity",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "curiosity",
   "teachingNote": "Reach for this when your child is curious and ready to go a little deeper with Heavenly Father.",
   "teaser": "In a vision, a picture from Heavenly Father, Ezekiel saw the temple. A temple is Heavenly Father’s holy house. A little stream came trickling out from under the temple door, flowing east. A man with a measuring line…",
   "wordCount": 136
  },
  {
   "id": "b11-w3-n1",
   "title": "Ten Days and a Cup of Water",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 3,
   "night": 1,
   "scripture": "Daniel 1:8–20",
   "scriptureBook": "Daniel",
   "traveler": "wren",
   "feeling": "nervous",
   "virtues": [
    "obedience",
    "stand-for-truth"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child is somewhere new and wants to fit in, and needs to see that small, faithful choices make a heart strong.",
   "teaser": "Daniel and his three friends were taken far from home to Babylon, a big city with a powerful king. The king sent them rich food from his own table. But Heavenly Father had taught His people which foods…",
   "wordCount": 133
  },
  {
   "id": "b11-w3-n2",
   "title": "The Secret in the Night",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 3,
   "night": 2,
   "scripture": "Daniel 2:16–23, 31–35",
   "scriptureBook": "Daniel",
   "traveler": "scout",
   "feeling": "confused",
   "virtues": [
    "prayer",
    "wisdom"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when a problem has your child puzzled and they need to remember to pray about it.",
   "teaser": "King Nebuchadnezzar had a dream, but when he woke up, he could not remember it. He told his wise men, “Tell me my dream!” Not one of them could. Daniel, a prophet, asked the king for a little…",
   "wordCount": 137
  },
  {
   "id": "b11-w3-n3",
   "title": "The Fourth Walking With Them",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 3,
   "night": 3,
   "scripture": "Daniel 3:19–27",
   "scriptureBook": "Daniel",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "stand-for-truth",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "stand-for-truth",
   "teachingNote": "Reach for this when your child is asked to do something wrong and needs the courage to stand true.",
   "teaser": "King Nebuchadnezzar made a giant golden statue and told everyone to bow down to it. Shadrach, Meshach, and Abed-nego would not. They prayed to and served only Heavenly Father. “Heavenly Father is able to save us,” they said…",
   "wordCount": 139
  },
  {
   "id": "b11-w3-n4",
   "title": "The King Who Looked Up",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 3,
   "night": 4,
   "scripture": "Daniel 4:28–37",
   "scriptureBook": "Daniel",
   "traveler": "willow",
   "feeling": null,
   "virtues": [
    "humility",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child says ‘I did it all by myself’ and needs to learn to look up and give thanks.",
   "teaser": "King Nebuchadnezzar dreamed of a great, tall tree full of fruit. Daniel gently told him what it meant, and asked him to be kind to poor people. But the king walked in his palace, a king’s grand house…",
   "wordCount": 137
  },
  {
   "id": "b11-w3-n5",
   "title": "The Hand Upon the Wall",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 3,
   "night": 5,
   "scripture": "Daniel 5:5–17, 29",
   "scriptureBook": "Daniel",
   "traveler": "wren",
   "feeling": "worried",
   "virtues": [
    "honesty",
    "integrity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "honesty",
   "teachingNote": "Reach for this when your child is tempted to bend the truth to get a prize.",
   "teaser": "King Belshazzar had a great feast, a big party. Suddenly the fingers of a man’s hand appeared and wrote on the wall! No wise man could read it, and the king was afraid. Then the queen remembered Daniel…",
   "wordCount": 132
  },
  {
   "id": "b11-w3-n6",
   "title": "The Lions Lay Down Quiet",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 3,
   "night": 6,
   "scripture": "Daniel 6:10–23",
   "scriptureBook": "Daniel",
   "traveler": "beau",
   "feeling": "safe",
   "virtues": [
    "prayer",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child needs to know Heavenly Father hears their prayers and watches over them all night.",
   "teaser": "King Darius, the new ruler of Babylon, made a new rule: for thirty days, no one could pray to anyone but the king. Daniel loved Heavenly Father, and he would not stop praying. He went home, opened his…",
   "wordCount": 138
  },
  {
   "id": "b11-w3-n7",
   "title": "The Ancient of Days",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 3,
   "night": 7,
   "scripture": "Daniel 7:9–14",
   "scriptureBook": "Daniel",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "wonder",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wonder",
   "teachingNote": "Reach for this when your child wonders about Jesus and needs to hear that His kingdom will never end.",
   "teaser": "One night Daniel had a dream. He saw thrones, big royal chairs, and someone called the Ancient of Days sat down. Ancient of Days means someone who has lived a very long time. His clothes were white as…",
   "wordCount": 127
  },
  {
   "id": "b11-w4-n1",
   "title": "He Taught Me How to Walk",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 4,
   "night": 1,
   "scripture": "Hosea 11:1–3",
   "scriptureBook": "Hosea",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "trust-in-god",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child is learning something new and wobbly and needs to feel held.",
   "teaser": "Long ago, Heavenly Father spoke through Hosea, a prophet. A prophet tells Heavenly Father’s words. Hosea talked about Israel, Heavenly Father’s family, as if they were a little child. “When Israel was a child, then I loved him,”…",
   "wordCount": 135
  },
  {
   "id": "b11-w4-n2",
   "title": "Cords of Love",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 4,
   "night": 2,
   "scripture": "Hosea 11:4",
   "scriptureBook": "Hosea",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "trust-in-god",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when you want your child to see that Heavenly Father leads with love, never a hard tug.",
   "teaser": "Heavenly Father told how He led His people. “I drew them with cords of a man,” He said, “with bands of love.” Cords and bands are ropes. Back then, people used ropes to lead their animals every day…",
   "wordCount": 122
  },
  {
   "id": "b11-w4-n3",
   "title": "Sure as the Morning",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 4,
   "night": 3,
   "scripture": "Hosea 6:1–3",
   "scriptureBook": "Hosea",
   "traveler": "scout",
   "feeling": "sad",
   "virtues": [
    "repentance",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child feels far from Heavenly Father and needs to know He comes as surely as the morning.",
   "teaser": "Heavenly Father’s people had wandered far away from Him. Then they said to each other, “Come, and let us return unto the Lord.” Return means to come back home. “He will heal us,” they said. “He will bind…",
   "wordCount": 123
  },
  {
   "id": "b11-w4-n4",
   "title": "Break Up the Hard Ground",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 4,
   "night": 4,
   "scripture": "Hosea 10:12",
   "scriptureBook": "Hosea",
   "traveler": "beau",
   "feeling": "frustrated",
   "virtues": [
    "humility",
    "diligence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child is frustrated and needs to let their heart go soft so good things can grow.",
   "teaser": "Most people in Hosea’s land were farmers, so Heavenly Father used a farming word. “Break up your fallow ground,” He said. Fallow ground is dirt that sat too long without being planted. It gets hard and crusty, and…",
   "wordCount": 129
  },
  {
   "id": "b11-w4-n5",
   "title": "I Will Love Them Freely",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 4,
   "night": 5,
   "scripture": "Hosea 14:4–7",
   "scriptureBook": "Hosea",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "forgiveness",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "forgiveness",
   "teachingNote": "Reach for this after a mistake, when your child needs to know they are loved freely, just as they are.",
   "teaser": "Hosea’s people had kept wandering away from Heavenly Father. Wandering away is called backsliding. But Heavenly Father made a kind promise. “I will heal their backsliding,” He said. “I will love them freely.” Freely means you do not…",
   "wordCount": 136
  },
  {
   "id": "b11-w4-n6",
   "title": "Slow to Anger, Great in Kindness",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 4,
   "night": 6,
   "scripture": "Joel 2:12–13",
   "scriptureBook": "Joel",
   "traveler": "beau",
   "feeling": "guilty",
   "virtues": [
    "repentance",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child is sorry and needs to know turning back to Heavenly Father is safe.",
   "teaser": "Joel was a prophet, a helper who shared Heavenly Father’s words. Joel’s people were going through a hard, hungry time. Heavenly Father said, “Turn ye even to me with all your heart.” “Rend your heart, and not your…",
   "wordCount": 131
  },
  {
   "id": "b11-w4-n7",
   "title": "The Years Given Back",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 4,
   "night": 7,
   "scripture": "Joel 2:21–28",
   "scriptureBook": "Joel",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "hope",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this after a time of loss, when your child needs to hear that Heavenly Father gives good things back.",
   "teaser": "Joel’s land had a hard time. Locusts, bugs like big grasshoppers, came in huge crowds and ate the plants, and the people were hungry. Then Heavenly Father made a happy promise. “Fear not, O land,” He said. “Be…",
   "wordCount": 129
  },
  {
   "id": "b11-w5-n1",
   "title": "The Shepherd Who Looked Up",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 5,
   "night": 1,
   "scripture": "Amos 5:4, 8; 7:14–15",
   "scriptureBook": "Amos",
   "traveler": "scout",
   "feeling": "loved",
   "virtues": [
    "identity",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels too small or ordinary to be picked for something big.",
   "teaser": "Amos was a herdman, which means he took care of animals. He also picked sycomore fruit, a kind of fig that grows on trees. Amos said he was not a prophet. A prophet is someone Heavenly Father sends…",
   "wordCount": 135
  },
  {
   "id": "b11-w5-n2",
   "title": "The Nest Among the Stars",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 5,
   "night": 2,
   "scripture": "Obadiah 1:3–4",
   "scriptureBook": "Obadiah",
   "traveler": "wren",
   "feeling": null,
   "virtues": [
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child thinks they are better than others and needs to see how good a humble heart is.",
   "teaser": "Obadiah was a prophet, a man Heavenly Father sent to tell His words. His book is the shortest in the Old Testament. It is about Edom, a people who lived high in the mountains. They made homes in…",
   "wordCount": 143
  },
  {
   "id": "b11-w5-n3",
   "title": "The Ship Going the Other Way",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 5,
   "night": 3,
   "scripture": "Jonah 1:1–6",
   "scriptureBook": "Jonah",
   "traveler": "beau",
   "feeling": "worried",
   "virtues": [
    "trust-in-god",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child is running away from something they were asked to do.",
   "teaser": "Jonah was a prophet, a man Heavenly Father sent to tell His words. Heavenly Father said, “Go to Nineveh.” Nineveh was a big city of the Assyrians, who had been enemies of Jonah’s people. Jonah did not want…",
   "wordCount": 135
  },
  {
   "id": "b11-w5-n4",
   "title": "The Fish That Was Prepared",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 5,
   "night": 4,
   "scripture": "Jonah 1:12–17",
   "scriptureBook": "Jonah",
   "traveler": "willow",
   "feeling": "worried",
   "virtues": [
    "trust-in-god",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels alone in a scary place and needs to know Heavenly Father prepares safe places.",
   "teaser": "The wind and waves were very big. Jonah knew it was happening because he had run from Heavenly Father. So he told the sailors the truth: “Put me in the sea, and it will be calm.” The sailors…",
   "wordCount": 130
  },
  {
   "id": "b11-w5-n5",
   "title": "The Prayer in the Dark",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 5,
   "night": 5,
   "scripture": "Jonah 2:1–10",
   "scriptureBook": "Jonah",
   "traveler": "wren",
   "feeling": "worried",
   "virtues": [
    "prayer",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child feels lost or in the dark and needs to know their prayers always reach Heavenly Father.",
   "teaser": "Inside the great fish it was dark and very, very quiet. Jonah could not go anywhere at all. So Jonah prayed. Praying is talking to Heavenly Father. “I cried because of my trouble,” Jonah prayed, “and He heard…",
   "wordCount": 121
  },
  {
   "id": "b11-w5-n6",
   "title": "The Whole City Listened",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 5,
   "night": 6,
   "scripture": "Jonah 3:1–10",
   "scriptureBook": "Jonah",
   "traveler": "beau",
   "feeling": "guilty",
   "virtues": [
    "repentance",
    "forgiveness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child needs to hear that a heart that turns back always gets another chance.",
   "teaser": "Jonah had run away once, but Heavenly Father gave him another chance. He spoke to Jonah a second time. “Go to Nineveh,” He said. And this time, Jonah went. Nineveh was so big it took three days to…",
   "wordCount": 128
  },
  {
   "id": "b11-w5-n7",
   "title": "The Vine and the Little Ones",
   "volume": "ot",
   "book": 11,
   "bookTitle": "Morning by Morning",
   "month": "November",
   "week": 5,
   "night": 7,
   "scripture": "Jonah 4:5–11",
   "scriptureBook": "Jonah",
   "traveler": "willow",
   "feeling": "angry",
   "virtues": [
    "compassion",
    "forgiveness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "compassion",
   "teachingNote": "Reach for this when your child is angry that someone else was shown mercy and needs to know Heavenly Father loves every person.",
   "teaser": "Jonah was not happy that Heavenly Father kept Nineveh safe. The people of Nineveh had been enemies of his people, and Jonah had wanted them punished. So Jonah sat outside the city in the hot sun. Heavenly Father…",
   "wordCount": 134
  },
  {
   "id": "b12-w1-n1",
   "title": "Under the Fig Tree",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 1,
   "night": 1,
   "scripture": "Micah 4:4–5",
   "scriptureBook": "Micah",
   "traveler": "wren",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels unsafe or afraid at bedtime and needs to picture resting under their own fig tree.",
   "teaser": "Micah told the people what Heavenly Father said. He lived long ago, in the same years as Isaiah. In his day there was fighting, and the people felt worried. So Micah told them about a happy day to come. Nobody would…",
   "wordCount": 118
  },
  {
   "id": "b12-w1-n2",
   "title": "Little Bethlehem",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 1,
   "night": 2,
   "scripture": "Micah 5:2",
   "scriptureBook": "Micah",
   "traveler": "scout",
   "feeling": "excited",
   "virtues": [
    "hope",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child thinks small things do not matter and needs to know the Lord chose little Bethlehem.",
   "teaser": "Long before Jesus was born, Micah told the people what Heavenly Father said. He told them a great King would come one day. Micah did not name a big, busy city. He said, “Bethlehem, though thou be little.” Bethlehem…",
   "wordCount": 123
  },
  {
   "id": "b12-w1-n3",
   "title": "Do Justly, Love Mercy",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 1,
   "night": 3,
   "scripture": "Micah 6:6–8",
   "scriptureBook": "Micah",
   "traveler": "willow",
   "feeling": "calm",
   "virtues": [
    "kindness",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child wonders what Heavenly Father really wants and needs three simple things to do.",
   "teaser": "Micah asked a big question: “What can I bring to the Lord?” In those days, people gave animals to the Lord as gifts. Should he bring young calves? Thousands of sheep? Some people brought big gifts but were unkind to…",
   "wordCount": 124
  },
  {
   "id": "b12-w1-n4",
   "title": "Into the Deep Sea",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 1,
   "night": 4,
   "scripture": "Micah 7:18–19",
   "scriptureBook": "Micah",
   "traveler": "beau",
   "feeling": "comforted",
   "virtues": [
    "repentance",
    "forgiveness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child feels sorry about a mistake and needs the picture of sins thrown into the deep sea.",
   "teaser": "Micah told the people what Heavenly Father said. The people had made many wrong choices, called sins. But Micah knew something wonderful. He said the Lord “delighteth in mercy.” The Lord is glad to forgive! Micah…",
   "wordCount": 117
  },
  {
   "id": "b12-w1-n5",
   "title": "A Strong Hold",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 1,
   "night": 5,
   "scripture": "Nahum 1:7",
   "scriptureBook": "Nahum",
   "traveler": "wren",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels frightened and needs to know the Lord is a strong tower to run to.",
   "teaser": "Nahum told the people of Judah what Heavenly Father said. A big, proud city called Nineveh had made trouble for them. Nahum wrote, “The Lord is good, a strong hold in the day of trouble.” Long ago, when trouble…",
   "wordCount": 123
  },
  {
   "id": "b12-w1-n6",
   "title": "Feet Like a Deer’s",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 1,
   "night": 6,
   "scripture": "Habakkuk 3:17–19",
   "scriptureBook": "Habakkuk",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "hope",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child is having a hard time and needs to learn they can still be glad, like a deer on high places.",
   "teaser": "Habakkuk told the people what Heavenly Father said. He knew hard times were coming to his land. So Habakkuk sang a prayer. Maybe the fig trees would not bloom. Maybe no grapes would grow, and the sheep would be…",
   "wordCount": 124
  },
  {
   "id": "b12-w1-n7",
   "title": "He Sings Over You",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 1,
   "night": 7,
   "scripture": "Zephaniah 3:14–17",
   "scriptureBook": "Zephaniah",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "identity",
    "comfort"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child doubts they are loved and needs to hear that the Lord sings over them.",
   "teaser": "Zephaniah told the people what Heavenly Father said. Many people had turned away from the Lord, and hard days were coming. But Zephaniah told of a happy day to come. He said, “Be glad and rejoice with all the…",
   "wordCount": 125
  },
  {
   "id": "b12-w2-n1",
   "title": "Put the Lord’s House First",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 2,
   "night": 1,
   "scripture": "Haggai 1:2–8, 12–14",
   "scriptureBook": "Haggai",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "diligence",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "diligence",
   "teachingNote": "Reach for this when your child is busy with their own things and needs to stop and think what to put first.",
   "teaser": "The people had come home to Jerusalem from far away. They built nice houses for themselves. But the Lord’s house was still not built. “It is not time yet,” they said. So Heavenly Father sent Haggai. “Is it time for…",
   "wordCount": 124
  },
  {
   "id": "b12-w2-n2",
   "title": "Be Strong, and Work",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 2,
   "night": 2,
   "scripture": "Haggai 2:3–5, 9",
   "scriptureBook": "Haggai",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "perseverance",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "perseverance",
   "teachingNote": "Reach for this when your child wants to quit a big, hard job and needs to hear the Lord is with them.",
   "teaser": "The people were building the Lord’s house again. Some old people remembered the first one, so big and beautiful. “How does this house look to you now?” the Lord asked. “Like nothing?” Next to the first one, it…",
   "wordCount": 114
  },
  {
   "id": "b12-w2-n3",
   "title": "Sing, for I Will Come",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 2,
   "night": 3,
   "scripture": "Zechariah 2:1–5, 10",
   "scriptureBook": "Zechariah",
   "traveler": "scout",
   "feeling": "excited",
   "virtues": [
    "hope",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child is waiting for something good and needs a reason to sing while they wait.",
   "teaser": "Zechariah shared Heavenly Father’s words. The people were home in Jerusalem again. But the walls that kept them safe were still broken. Zechariah saw a man with a long rope for measuring. “Where are you going?” he…",
   "wordCount": 122
  },
  {
   "id": "b12-w2-n4",
   "title": "Clean New Clothes",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 2,
   "night": 4,
   "scripture": "Zechariah 3:3–5, 8",
   "scriptureBook": "Zechariah",
   "traveler": "willow",
   "feeling": "comforted",
   "virtues": [
    "repentance",
    "forgiveness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child feels dirty or ashamed inside and needs the picture of clean new clothes.",
   "teaser": "The Lord showed Zechariah a picture. Joshua, the leader of the priests at the Lord’s house, stood before an angel. Joshua’s clothes were dirty, a picture of the wrong things he had done. “Take away the dirty…",
   "wordCount": 119
  },
  {
   "id": "b12-w2-n5",
   "title": "Not by Might",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 2,
   "night": 5,
   "scripture": "Zechariah 4:1–6, 9",
   "scriptureBook": "Zechariah",
   "traveler": "beau",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels too small for a big job and needs to know the Lord's Spirit helps.",
   "teaser": "An angel woke Zechariah. “What do you see?” he asked. Zechariah saw a golden lampstand with seven little lamps. Two olive trees stood beside it. Back then, lamps burned olive oil to make light. “What are these?”…",
   "wordCount": 112
  },
  {
   "id": "b12-w2-n6",
   "title": "Streets Full of Children",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 2,
   "night": 6,
   "scripture": "Zechariah 8:3–5",
   "scriptureBook": "Zechariah",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "family-love",
    "worship-together"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "family-love",
   "teachingNote": "Reach for this when your child feels left out and needs the picture of a city full of children playing safely.",
   "teaser": "Many people had lived far away from Jerusalem. Now some had come home. Zechariah told them about a happy day to come. “I will come back and live in Jerusalem,” said the Lord. It would be a city of truth. His…",
   "wordCount": 116
  },
  {
   "id": "b12-w2-n7",
   "title": "Holiness unto the Lord",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 2,
   "night": 7,
   "scripture": "Zechariah 14:9, 20–21",
   "scriptureBook": "Zechariah",
   "traveler": "wren",
   "feeling": "amazed",
   "virtues": [
    "reverence",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child thinks ordinary things are not special and needs to see everyday work can be holy.",
   "teaser": "Zechariah told about the day Jesus comes again as King. “The Lord shall be king over all the earth,” he said. Even the horses’ bells will say, “Holiness unto the Lord.” Something holy belongs to Heavenly Father and…",
   "wordCount": 100
  },
  {
   "id": "b12-w3-n1",
   "title": "I Have Loved You",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 3,
   "night": 1,
   "scripture": "Malachi 1:2, 11",
   "scriptureBook": "Malachi",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "identity",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child asks if they are really loved and needs to hear the Lord loves them all day long.",
   "teaser": "Long before Jesus was born, Heavenly Father’s people came home to Jerusalem. But many had stopped thinking about the Lord. So the Lord gave Malachi a message to share. It began with four warm words: “I have loved…",
   "wordCount": 124
  },
  {
   "id": "b12-w3-n2",
   "title": "I Will Send My Messenger",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 3,
   "night": 2,
   "scripture": "Malachi 3:1",
   "scriptureBook": "Malachi",
   "traveler": "beau",
   "feeling": "excited",
   "virtues": [
    "pondering",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "pondering",
   "teachingNote": "Reach for this when your child is waiting for a special day and needs to learn how to get ready.",
   "teaser": "Long before Jesus was born, the Lord gave Malachi a happy promise. He said, “I will send my messenger.” This helper would be sent ahead to “prepare the way.” He would help people get ready, like tidying up before a…",
   "wordCount": 109
  },
  {
   "id": "b12-w3-n3",
   "title": "Like a Refiner’s Fire",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 3,
   "night": 3,
   "scripture": "Malachi 3:2–3",
   "scriptureBook": "Malachi",
   "traveler": "wren",
   "feeling": "comforted",
   "virtues": [
    "repentance",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child wants a fresh start and needs the picture of silver made clean and shining.",
   "teaser": "Malachi’s people had stopped following the Lord’s ways. So the Lord called to them, “Return unto me.” Malachi said the Lord would be “like a refiner’s fire.” The refiner heated silver in his fire until it melted…",
   "wordCount": 113
  },
  {
   "id": "b12-w3-n4",
   "title": "The Windows of Heaven",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 3,
   "night": 4,
   "scripture": "Malachi 3:10",
   "scriptureBook": "Malachi",
   "traveler": "beau",
   "feeling": "grateful",
   "virtues": [
    "generosity",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child is learning to give and needs to see how the Lord blesses those who give.",
   "teaser": "In Malachi’s day, people grew their own food. The Lord asked them to pay tithing: one part of every ten, given back. They brought it to the storehouse, a room for food at the Lord’s house. But many people had…",
   "wordCount": 118
  },
  {
   "id": "b12-w3-n5",
   "title": "The Lord’s Jewels",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 3,
   "night": 5,
   "scripture": "Malachi 3:16–17",
   "scriptureBook": "Malachi",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "identity",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels ordinary and needs to hear they are one of the Lord's treasured jewels.",
   "teaser": "In Malachi’s day, many people forgot the Lord. But some loved Him. They talked together often, and they thought about Him. The Lord listened, and He heard every word. So a book was written for them. It was called a…",
   "wordCount": 98
  },
  {
   "id": "b12-w3-n6",
   "title": "Healing in His Wings",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 3,
   "night": 6,
   "scripture": "Malachi 4:2",
   "scriptureBook": "Malachi",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "hope",
    "comfort"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child is sick or sad and needs the picture of warm sunshine with healing in it.",
   "teaser": "Malachi had a happy promise for the people who loved the Lord. The “Sun of righteousness” would rise, the One who is always good and right. Malachi was talking about Jesus. Like the morning sun, Jesus brings light…",
   "wordCount": 109
  },
  {
   "id": "b12-w3-n7",
   "title": "Elijah Will Come",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 3,
   "night": 7,
   "scripture": "Malachi 4:5–6",
   "scriptureBook": "Malachi",
   "traveler": "wren",
   "feeling": "connected",
   "virtues": [
    "family-love",
    "honoring-parents"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "family-love",
   "teachingNote": "Reach for this when your child misses someone or worries about family and needs to know hearts can turn toward each other.",
   "teaser": "At the end of his book, Malachi wrote a promise. The Lord said, “I will send you Elijah the prophet.” Elijah had taught Heavenly Father’s words long before. Then he was taken up to heaven. Elijah would “turn the…",
   "wordCount": 112
  },
  {
   "id": "b12-w4-n1",
   "title": "A Star Out of Jacob",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 4,
   "night": 1,
   "scripture": "Numbers 24:17; Matthew 2:1–2, 9–11",
   "scriptureBook": "Numbers",
   "traveler": "scout",
   "feeling": "excited",
   "virtues": [
    "curiosity",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "curiosity",
   "teachingNote": "Reach for this when your child is searching for answers and needs the picture of wise travelers who followed a star to Jesus.",
   "teaser": "Long ago, Heavenly Father helped a man named Balaam see far ahead. Balaam said, “There shall come a Star out of Jacob.” Jacob’s family was Israel, Heavenly Father’s people. A star shows travelers the way. Balaam was…",
   "wordCount": 120
  },
  {
   "id": "b12-w4-n2",
   "title": "A Branch from Jesse",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 4,
   "night": 2,
   "scripture": "Isaiah 11:1–2; Luke 1:31–32",
   "scriptureBook": "Isaiah",
   "traveler": "wren",
   "feeling": "excited",
   "virtues": [
    "hope",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child is waiting for a promise and needs the picture of a little branch growing from an old stump.",
   "teaser": "Long before Jesus was born, Isaiah told what Heavenly Father showed him. He talked about an old tree stump. A stump looks all done. But Isaiah said a little new branch would grow out of its roots! The stump was a…",
   "wordCount": 123
  },
  {
   "id": "b12-w4-n3",
   "title": "Laid in a Manger",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 4,
   "night": 3,
   "scripture": "Micah 5:2; Luke 2:1–7",
   "scriptureBook": "Micah",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "humility",
    "worship-together"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child feels like there is no room for them and needs to know there is always room for Jesus in their heart.",
   "teaser": "Long ago, Micah told the people what Heavenly Father said. Bethlehem was a little town, but Micah said it would be special. A great Ruler would come from Bethlehem, King David’s town. Micah was talking about Jesus…",
   "wordCount": 121
  },
  {
   "id": "b12-w4-n4",
   "title": "Heavenly Father’s Lamb",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 4,
   "night": 4,
   "scripture": "Genesis 22:8; Exodus 12:5; Luke 2:8–12; John 1:29",
   "scriptureBook": "Genesis",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "trust-in-god",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels afraid and needs to know Heavenly Father sent Jesus, His perfect Lamb, to save us.",
   "teaser": "Long ago, Abraham told Isaac that Heavenly Father would give a lamb. Later, Heavenly Father asked His people for perfect lambs. Those lambs were a picture. They pointed to Jesus, Heavenly Father’s perfect Son. The…",
   "wordCount": 115
  },
  {
   "id": "b12-w4-n5",
   "title": "The Light of the World",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 4,
   "night": 5,
   "scripture": "Isaiah 9:2; Luke 2:9; John 8:12",
   "scriptureBook": "Isaiah",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "wonder",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wonder",
   "teachingNote": "Reach for this when your child sees Christmas lights and needs help connecting them to Jesus, the Light of the World.",
   "teaser": "Long before Jesus was born, Isaiah told what Heavenly Father said. “The people who walked in darkness have seen a great light.” Many people felt sad and lost then, like walking in the dark. Isaiah promised that a…",
   "wordCount": 110
  },
  {
   "id": "b12-w4-n6",
   "title": "Peace on Earth",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 4,
   "night": 6,
   "scripture": "Isaiah 9:6; Luke 2:13–14",
   "scriptureBook": "Isaiah",
   "traveler": "willow",
   "feeling": "calm",
   "virtues": [
    "peacemaking",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "peacemaking",
   "teachingNote": "Reach for this when your home feels loud or upset and your child needs to know Jesus brings peace.",
   "teaser": "Long before Jesus was born, Isaiah said a special child would come. He would be called the Prince of Peace. The night Jesus was born, an angel told the shepherds the happy news. Suddenly, many, many angels were…",
   "wordCount": 116
  },
  {
   "id": "b12-w4-n7",
   "title": "We Have Waited for Him",
   "volume": "ot",
   "book": 12,
   "bookTitle": "We Have Waited for Him",
   "month": "December",
   "week": 4,
   "night": 7,
   "scripture": "Isaiah 25:9; Luke 2:15–20; John 3:16",
   "scriptureBook": "Isaiah",
   "traveler": "beau",
   "feeling": "excited",
   "virtues": [
    "gratitude",
    "generosity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child is bursting with Christmas excitement and needs to know the best gift is Jesus.",
   "teaser": "Long ago, Isaiah told what Heavenly Father said. One day people would say, “This is the Lord; we have waited for Him.” They would say, “He will save us!” The night Jesus was born, the angels went back into heaven…",
   "wordCount": 123
  },
  {
   "id": "b13-w1-n1",
   "title": "An Angel in the Temple",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 1,
   "night": 1,
   "scripture": "Luke 1:5–25",
   "scriptureBook": "Luke",
   "traveler": "wren",
   "feeling": "amazed",
   "virtues": [
    "prayer",
    "patience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child has prayed for something a long time and wonders if Heavenly Father heard, like old Zacharias in the temple.",
   "teaser": "Long ago lived a good old man named Zacharias. He and his wife, Elisabeth, had no children. One day Zacharias went into the temple, Heavenly Father’s holy house. He burned sweet-smelling incense while the people…",
   "wordCount": 125
  },
  {
   "id": "b13-w1-n2",
   "title": "Mary Says Yes",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 1,
   "night": 2,
   "scripture": "Luke 1:26–38",
   "scriptureBook": "Luke",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "faith",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child is asked to do something new and big and needs to see Mary's brave yes to the angel.",
   "teaser": "In the little town of Nazareth lived a young woman named Mary. She was going to marry Joseph. One day the angel Gabriel came to her. “Hello, Mary! The Lord is with you.” Mary was afraid. Gabriel said, “Fear not. You…",
   "wordCount": 119
  },
  {
   "id": "b13-w1-n3",
   "title": "The Baby Who Jumped for Joy",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 1,
   "night": 3,
   "scripture": "Luke 1:39–45",
   "scriptureBook": "Luke",
   "traveler": "willow",
   "feeling": "happy",
   "virtues": [
    "family-love",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "family-love",
   "teachingNote": "Reach for this when your child has happy news to share, like Mary hurrying to Elisabeth and baby John jumping for joy.",
   "teaser": "After the angel left, Mary hurried into the hills to see her cousin Elisabeth. Elisabeth was going to have a baby too, baby John. Mary came in and called hello. The moment Elisabeth heard Mary’s voice, her baby…",
   "wordCount": 107
  },
  {
   "id": "b13-w1-n4",
   "title": "Mary's Thank-You Song",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 1,
   "night": 4,
   "scripture": "Luke 1:46–56",
   "scriptureBook": "Luke",
   "traveler": "wren",
   "feeling": "grateful",
   "virtues": [
    "gratitude",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child is ready for bed and you want to count blessings together, the way Mary sang her thank-you song.",
   "teaser": "Mary stayed with Elisabeth. Her heart was so happy that her words came out like a song. Mary said, “My heart tells how great the Lord is! I am so glad in Him who saves me. He looked kindly on plain, humble me.” She…",
   "wordCount": 113
  },
  {
   "id": "b13-w1-n5",
   "title": "His Name Is John",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 1,
   "night": 5,
   "scripture": "Luke 1:57–66",
   "scriptureBook": "Luke",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "obedience",
    "stand-for-truth"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child knows the right thing while everyone says something else, like Elisabeth and Zacharias saying, \"His name is John.\"",
   "teaser": "At last Elisabeth had her baby, a little boy! Family and neighbors heard how kind Heavenly Father had been, and they were glad. On his eighth day, it was time to name him. Everyone said, “Call him Zacharias, like…",
   "wordCount": 122
  },
  {
   "id": "b13-w1-n6",
   "title": "A Song About the Sunrise",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 1,
   "night": 6,
   "scripture": "Luke 1:67–80",
   "scriptureBook": "Luke",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "hope",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child feels the dark is long and needs Zacharias's song about Jesus coming like the gentle sunrise.",
   "teaser": "When Zacharias could talk again, the Holy Ghost filled him. He praised Heavenly Father with words like a happy song. “Blessed be the Lord!” he said. “He is sending the Savior, just as the prophets promised long…",
   "wordCount": 116
  },
  {
   "id": "b13-w1-n7",
   "title": "Joseph's Dream",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 1,
   "night": 7,
   "scripture": "Matthew 1:18–25",
   "scriptureBook": "Matthew",
   "traveler": "beau",
   "feeling": "worried",
   "virtues": [
    "trust-in-god",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child is worried about what to do and needs to see how Joseph let Heavenly Father show him the way.",
   "teaser": "Joseph was a carpenter who made things from wood. He was going to marry Mary. Then he learned she was going to have a baby, and he was worried. Joseph was a good, kind man. He did not want to hurt Mary. He thought…",
   "wordCount": 117
  },
  {
   "id": "b13-w2-n1",
   "title": "No Room at the Inn",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 2,
   "night": 1,
   "scripture": "Luke 2:1–7",
   "scriptureBook": "Luke",
   "traveler": "willow",
   "feeling": "calm",
   "virtues": [
    "humility",
    "contentment"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child thinks their home or things are too plain and needs the picture of baby Jesus in a simple manger.",
   "teaser": "Caesar, a great ruler, made a rule. Everyone had to go to their family’s home town to be counted. Joseph’s family came from Bethlehem, King David’s town. So Joseph and Mary went from Nazareth to Bethlehem. Mary’s…",
   "wordCount": 115
  },
  {
   "id": "b13-w2-n2",
   "title": "Angels and Shepherds",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 2,
   "night": 2,
   "scripture": "Luke 2:8–20",
   "scriptureBook": "Luke",
   "traveler": "scout",
   "feeling": "nervous",
   "virtues": [
    "trust-in-god",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child is startled or scared and needs the angel's first words to the shepherds: Fear not.",
   "teaser": "That night, shepherds were in the fields near Bethlehem, keeping their sheep safe. Suddenly an angel came, and bright light shone all around! The shepherds were afraid. The angel said, “Fear not! I bring good news…",
   "wordCount": 117
  },
  {
   "id": "b13-w2-n3",
   "title": "Simeon and Anna Wait for Jesus",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 2,
   "night": 3,
   "scripture": "Luke 2:21–38",
   "scriptureBook": "Luke",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "patience",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "patience",
   "teachingNote": "Reach for this when your child is tired of waiting and needs to see how Simeon and Anna waited for Jesus with happy hearts.",
   "teaser": "Mary and Joseph took baby Jesus to the temple in Jerusalem. There they gave thanks for Him. A good old man named Simeon lived in Jerusalem. The Holy Ghost had promised he would see the Savior before he died. He…",
   "wordCount": 116
  },
  {
   "id": "b13-w2-n4",
   "title": "The Wise Men Follow the Star",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 2,
   "night": 4,
   "scripture": "Matthew 2:1–12",
   "scriptureBook": "Matthew",
   "traveler": "scout",
   "feeling": "excited",
   "virtues": [
    "diligence",
    "reverence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "diligence",
   "teachingNote": "Reach for this when your child is partway through a long trip or task and needs the wise men who kept following the star.",
   "teaser": "Wise men in the east saw a new star. It meant a new King was born. They came a long way to worship Him. King Herod heard about them and was upset. He wanted to be the only king. He said, “Find the child, then come…",
   "wordCount": 123
  },
  {
   "id": "b13-w2-n5",
   "title": "Safe in Egypt",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 2,
   "night": 5,
   "scripture": "Matthew 2:13–23",
   "scriptureBook": "Matthew",
   "traveler": "beau",
   "feeling": "safe",
   "virtues": [
    "obedience",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child drags their feet when asked and needs the picture of Joseph leaving for Egypt that very night.",
   "teaser": "After the wise men left, an angel came to Joseph in a dream. “Get up! Take the child and His mother to Egypt. King Herod wants to hurt Him.” Egypt was a land far away. Joseph did not wait until morning. He left that…",
   "wordCount": 108
  },
  {
   "id": "b13-w2-n6",
   "title": "Jesus Grows Up",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 2,
   "night": 6,
   "scripture": "Luke 2:39–40, 51–52",
   "scriptureBook": "Luke",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "honoring-parents",
    "wisdom"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "honoring-parents",
   "teachingNote": "Reach for this when your child wants to be big already and needs to see young Jesus growing up in Nazareth, helping His family.",
   "teaser": "After their visit to the temple, Mary and Joseph took Jesus home to Nazareth. There Jesus grew up. Joseph made things from wood, and Jesus learned to be a carpenter too. He helped His family, the way you help yours…",
   "wordCount": 116
  },
  {
   "id": "b13-w2-n7",
   "title": "Jesus in His Father's House",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 2,
   "night": 7,
   "scripture": "Luke 2:41–52",
   "scriptureBook": "Luke",
   "traveler": "wren",
   "feeling": "comforted",
   "virtues": [
    "reverence",
    "curiosity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child gets wiggly at church and needs twelve-year-old Jesus listening and asking questions in the temple.",
   "teaser": "When Jesus was twelve, His family went to Jerusalem for the Passover. It was a holiday to remember how Heavenly Father saved His people. On the way home, they thought Jesus was in the big group. But at day’s end, He…",
   "wordCount": 121
  },
  {
   "id": "b13-w3-n1",
   "title": "The Light of the World",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 3,
   "night": 1,
   "scripture": "John 1:1–5, 14",
   "scriptureBook": "John",
   "traveler": "wren",
   "feeling": "amazed",
   "virtues": [
    "wonder",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wonder",
   "teachingNote": "Reach for this when your child is afraid of the dark and needs to know the dark can never put out Jesus's light.",
   "teaser": "John was one of Jesus’s best friends. He wrote a book about Jesus. It begins, “In the beginning was the Word.” The Word is a name for Jesus. Our words show what is in our hearts. Jesus shows us Heavenly Father’s…",
   "wordCount": 119
  },
  {
   "id": "b13-w3-n2",
   "title": "Children of Heavenly Father",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 3,
   "night": 2,
   "scripture": "John 1:6–13",
   "scriptureBook": "John",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "identity",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels left out and needs to hear that believing in Jesus makes them part of Heavenly Father's family.",
   "teaser": "Baby John grew up to be John the Baptist. Heavenly Father sent him with a job to do. John’s job was to tell everyone about the Light, and the Light is Jesus. John was not the Light. He pointed to Jesus, like a…",
   "wordCount": 123
  },
  {
   "id": "b13-w3-n3",
   "title": "I Am Not the Christ",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 3,
   "night": 3,
   "scripture": "John 1:19–28",
   "scriptureBook": "John",
   "traveler": "scout",
   "feeling": "calm",
   "virtues": [
    "humility",
    "honesty"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child wants all the praise and needs to see John the Baptist point to Jesus instead of himself.",
   "teaser": "John the Baptist taught by the Jordan River. He told people to repent. To repent is to stop doing wrong and come back to Heavenly Father. Leaders in Jerusalem sent priests to ask him, “Who are you?” John told the…",
   "wordCount": 121
  },
  {
   "id": "b13-w3-n4",
   "title": "The Lamb and the Dove",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 3,
   "night": 4,
   "scripture": "John 1:29–34",
   "scriptureBook": "John",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "reverence",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child asks why Jesus is called the Lamb of God and needs a gentle, holy answer by the river.",
   "teaser": "One day John the Baptist saw Jesus coming toward him. John called out, “Look! The Lamb of God, who takes away the sin of the world!” Why a Lamb? Long ago, people gave Heavenly Father a perfect little lamb. It showed…",
   "wordCount": 116
  },
  {
   "id": "b13-w3-n5",
   "title": "Come and See",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 3,
   "night": 5,
   "scripture": "John 1:35–39",
   "scriptureBook": "John",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "curiosity",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "curiosity",
   "teachingNote": "Reach for this when your child has questions about Jesus and needs to hear His own answer to Andrew: Come and see.",
   "teaser": "The next day John the Baptist stood with two friends who learned from him. One of the two was named Andrew. Jesus walked by. John looked at Him and said, “Look! The Lamb of God!” The two friends heard him, and they…",
   "wordCount": 115
  },
  {
   "id": "b13-w3-n6",
   "title": "Andrew Finds His Brother",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 3,
   "night": 6,
   "scripture": "John 1:40–42",
   "scriptureBook": "John",
   "traveler": "willow",
   "feeling": "eager",
   "virtues": [
    "family-love",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "family-love",
   "teachingNote": "Reach for this when your child finds something wonderful and you want them to share it, like Andrew bringing his brother Simon to Jesus.",
   "teaser": "Andrew had spent the whole day with Jesus. His heart was too full to keep it inside. The first thing he did was find his brother, Simon. Andrew said, “We have found the Messiah!” That was the Savior Heavenly Father…",
   "wordCount": 124
  },
  {
   "id": "b13-w3-n7",
   "title": "Nathanael Under the Fig Tree",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 3,
   "night": 7,
   "scripture": "John 1:43–51",
   "scriptureBook": "John",
   "traveler": "wren",
   "feeling": "confused",
   "virtues": [
    "identity",
    "curiosity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels unsure or unseen and needs to know Jesus saw Nathanael under the fig tree.",
   "teaser": "Jesus said to a man named Philip, “Follow Me.” Philip did, and he hurried to find his friend Nathanael. “We have found Him!” said Philip. “He is the One the prophets wrote about. He is Jesus from Nazareth.”…",
   "wordCount": 125
  },
  {
   "id": "b13-w4-n1",
   "title": "A Voice in the Wilderness",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 4,
   "night": 1,
   "scripture": "Matthew 3:1–6; Mark 1:1–6; Luke 3:1–6",
   "scriptureBook": "Matthew",
   "traveler": "scout",
   "feeling": "brave",
   "virtues": [
    "repentance",
    "diligence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child needs a fresh start and a picture of making a straight path in their heart for Jesus.",
   "teaser": "John the Baptist lived in the wild, empty land by the Jordan River. He wore rough camel’s hair and a leather belt. He ate wild honey and big grasshoppers called locusts. Heavenly Father gave John a job: get people…",
   "wordCount": 125
  },
  {
   "id": "b13-w4-n2",
   "title": "Two Coats",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 4,
   "night": 2,
   "scripture": "Luke 3:7–14",
   "scriptureBook": "Luke",
   "traveler": "willow",
   "feeling": "happy",
   "virtues": [
    "generosity",
    "honesty"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child has two of something while a friend has none, and needs John's words about the two coats.",
   "teaser": "Many people came to the river to be baptized by John. He said, “Show that you have really changed.” A good tree shows it is good by its fruit. The people asked John, “Then what should we do?” He said, “Two coats…",
   "wordCount": 115
  },
  {
   "id": "b13-w4-n3",
   "title": "Someone Greater Is Coming",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 4,
   "night": 3,
   "scripture": "Luke 3:15–18; Matthew 3:11–12",
   "scriptureBook": "Luke",
   "traveler": "wren",
   "feeling": "amazed",
   "virtues": [
    "reverence",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child needs to learn quiet respect, like John saying he was not good enough to untie Jesus's shoes.",
   "teaser": "The people loved to listen to John. They wondered, “Could John be the Christ, the Savior we are waiting for?” John knew what they were thinking. He said, “I baptize you with water. But Someone much greater than I am…",
   "wordCount": 117
  },
  {
   "id": "b13-w4-n4",
   "title": "Jesus Is Baptized",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 4,
   "night": 4,
   "scripture": "Matthew 3:13–17; Mark 1:9–11",
   "scriptureBook": "Matthew",
   "traveler": "beau",
   "feeling": "happy",
   "virtues": [
    "obedience",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child is getting ready for baptism or needs to see that obeying pleases Heavenly Father, like Jesus in the Jordan.",
   "teaser": "Jesus came from Nazareth to the Jordan River. He asked John to baptize Him. John was surprised. “I need You to baptize me!” he said. Jesus said, “Let it be so. It is right to do all that is good.” Jesus had never…",
   "wordCount": 124
  },
  {
   "id": "b13-w4-n5",
   "title": "Fishers of Men",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 4,
   "night": 5,
   "scripture": "Mark 1:14–20",
   "scriptureBook": "Mark",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "obedience",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child hears \"come\" and lags behind, and needs Simon and Andrew leaving their nets right away.",
   "teaser": "Jesus went to Galilee, by a big lake. He taught, “Turn back to Heavenly Father, and believe the good news!” By the water, Jesus saw two brothers, Simon and Andrew. They were fishermen, throwing their net into the…",
   "wordCount": 120
  },
  {
   "id": "b13-w4-n6",
   "title": "Jesus Heals Peter's Family",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 4,
   "night": 6,
   "scripture": "Mark 1:21–34",
   "scriptureBook": "Mark",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "compassion",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "compassion",
   "teachingNote": "Reach for this when your child has someone sick at home and wants to help, like Jesus lifting Peter's wife's mother by the hand.",
   "teaser": "Jesus and His friends came to Capernaum, a town by the lake. On the Sabbath, the day of rest, Jesus taught in the meeting house. The people were amazed. Jesus did not just repeat what others said. He taught like…",
   "wordCount": 121
  },
  {
   "id": "b13-w4-n7",
   "title": "Jesus Prays in the Morning",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 4,
   "night": 7,
   "scripture": "Mark 1:35–39",
   "scriptureBook": "Mark",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "prayer",
    "pondering"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child has had a busy, loud day and needs Jesus's quiet prayer early in the morning while it was still dark.",
   "teaser": "Jesus had helped people all day, until after the sun went down. Very early the next morning, while it was still dark, Jesus got up. He went out to a quiet place, all by Himself. There He prayed to Heavenly Father…",
   "wordCount": 118
  },
  {
   "id": "b13-w5-n1",
   "title": "Jesus Says No",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 5,
   "night": 1,
   "scripture": "Matthew 4:1–11; Luke 4:1–13",
   "scriptureBook": "Matthew",
   "traveler": "beau",
   "feeling": "distracted",
   "virtues": [
    "self-control",
    "love-of-scripture"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "self-control",
   "teachingNote": "Reach for this when your child wants something they should not have and needs to see Jesus say no with Heavenly Father's words.",
   "teaser": "After His baptism, the Spirit led Jesus into the desert. For forty days He ate nothing and grew hungry. Satan came. “If You are the Son of God, turn these stones into bread.” Jesus said no: people need Heavenly…",
   "wordCount": 123
  },
  {
   "id": "b13-w5-n2",
   "title": "The Spirit of the Lord Is upon Me",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 5,
   "night": 2,
   "scripture": "Luke 4:14–22",
   "scriptureBook": "Luke",
   "traveler": "wren",
   "feeling": "comforted",
   "virtues": [
    "comfort",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "comfort",
   "teachingNote": "Reach for this when your child has a hurting heart and needs to hear Jesus read that He came to heal the brokenhearted.",
   "teaser": "Jesus came home to Nazareth, where He grew up. On the Sabbath, He went to the meeting house, like always. There they handed Him a long rolled-up paper called a scroll. It held the words of Isaiah, a prophet from…",
   "wordCount": 123
  },
  {
   "id": "b13-w5-n3",
   "title": "A Great Light",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 5,
   "night": 3,
   "scripture": "Matthew 4:12–17",
   "scriptureBook": "Matthew",
   "traveler": "scout",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child is scared in a dark room and needs Isaiah's picture of a great light shining on the people.",
   "teaser": "John the Baptist was put in prison. So Jesus went to Galilee. He moved to Capernaum, a town beside the lake. Isaiah wrote long ago, “The people who sat in darkness saw a great light.” Isaiah was talking about Jesus…",
   "wordCount": 116
  },
  {
   "id": "b13-w5-n4",
   "title": "Launch Out into the Deep",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 5,
   "night": 4,
   "scripture": "Luke 5:1–11",
   "scriptureBook": "Luke",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "faith",
    "perseverance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child tried and failed and needs Peter's \"because You say so\" to let down the nets one more time.",
   "teaser": "A big crowd pressed close to Jesus by the lake. Nearby, fishermen were washing their nets. Jesus sat in Simon Peter’s boat and taught the people from the water. Then He said, “Go out to the deep water. Let down your…",
   "wordCount": 124
  },
  {
   "id": "b13-w5-n5",
   "title": "I Will. Be Clean.",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 5,
   "night": 5,
   "scripture": "Luke 5:12–15",
   "scriptureBook": "Luke",
   "traveler": "willow",
   "feeling": "sad",
   "virtues": [
    "compassion",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "compassion",
   "teachingNote": "Reach for this when your child notices someone left out and needs to see Jesus reach out and touch the lonely man with leprosy.",
   "teaser": "A man in one town had leprosy, a sickness that made skin sores. People with leprosy had to live away from everyone. Nobody would touch them. That is a lonely way to live. The man saw Jesus and fell on his face…",
   "wordCount": 117
  },
  {
   "id": "b13-w5-n6",
   "title": "Friends on the Roof",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 5,
   "night": 6,
   "scripture": "Luke 5:17–26",
   "scriptureBook": "Luke",
   "traveler": "beau",
   "feeling": "eager",
   "virtues": [
    "service",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child wants to help a friend who is struggling, like the four friends who opened the roof.",
   "teaser": "Jesus was teaching in a packed house. Nobody else could get in the door. Four men carried their friend, who could not walk, on a mat. They believed Jesus could heal him. But the crowd was in the way. So the friends…",
   "wordCount": 124
  },
  {
   "id": "b13-w5-n7",
   "title": "Jesus Calls Matthew",
   "volume": "nt",
   "book": 13,
   "bookTitle": "Come and See!",
   "month": "January",
   "week": 5,
   "night": 7,
   "scripture": "Luke 5:27–32",
   "scriptureBook": "Luke",
   "traveler": "wren",
   "feeling": "connected",
   "virtues": [
    "kindness",
    "repentance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child leaves someone out of play and needs Jesus's welcome at Matthew's big table.",
   "teaser": "Matthew, also called Levi, was a tax collector. He took money from people for the rulers. Some tax collectors took extra, so people did not like them. Jesus walked by and said, “Follow Me.” Matthew left everything…",
   "wordCount": 110
  },
  {
   "id": "b14-w1-n1",
   "title": "Water into Wine",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 1,
   "night": 1,
   "scripture": "John 2:1–11",
   "scriptureBook": "John",
   "traveler": "wren",
   "feeling": "safe",
   "virtues": [
    "obedience",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child does not see why a direction matters and needs the helpers who filled the jars with water because Jesus said so.",
   "teaser": "There was a wedding party in a town called Cana. Jesus, His friends, and His mother, Mary, were there. In the middle of the party, the wine ran out. Mary told Jesus, “They have no wine.” Then Mary said to the…",
   "wordCount": 117
  },
  {
   "id": "b14-w1-n2",
   "title": "My Father's House",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 1,
   "night": 2,
   "scripture": "John 2:13–17",
   "scriptureBook": "John",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "reverence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child is loud or careless in a holy place and needs to see why Jesus cleared the noisy market from the temple.",
   "teaser": "It was Passover, a special holiday for Heavenly Father’s people. Jesus went to Jerusalem, to the temple. It was Heavenly Father’s holy house, a place to pray. But in the temple yard, people were not praying. It was…",
   "wordCount": 124
  },
  {
   "id": "b14-w1-n3",
   "title": "Nicodemus Comes at Night",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 1,
   "night": 3,
   "scripture": "John 3:1–8",
   "scriptureBook": "John",
   "traveler": "scout",
   "feeling": "confused",
   "virtues": [
    "curiosity",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "curiosity",
   "teachingNote": "Reach for this when your child is puzzled about something big and needs to see Nicodemus bring his questions to Jesus at night.",
   "teaser": "Nicodemus was a leader who knew the scriptures well. He had questions about Jesus. One night, Nicodemus went to find Jesus. He said, “Teacher, we know Heavenly Father sent You. No one could do Your miracles alone.”…",
   "wordCount": 125
  },
  {
   "id": "b14-w1-n4",
   "title": "Heavenly Father So Loved the World",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 1,
   "night": 4,
   "scripture": "John 3:16–21, 27–30",
   "scriptureBook": "John",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "identity",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child wonders if they really matter and needs to hear that Heavenly Father loved the world and gave His Son for them.",
   "teaser": "Jesus taught Nicodemus something very important. He said, “Heavenly Father so loved the world, that He gave His only Son.” Everyone who believes in Jesus will not be lost. They will live with Heavenly Father…",
   "wordCount": 123
  },
  {
   "id": "b14-w1-n5",
   "title": "Living Water",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 1,
   "night": 5,
   "scripture": "John 4:1–26",
   "scriptureBook": "John",
   "traveler": "wren",
   "feeling": "connected",
   "virtues": [
    "identity",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels different or judged and needs to see Jesus sitting kindly with the Samaritan woman at the well.",
   "teaser": "Jesus walked through a land called Samaria. Jews and Samaritans did not get along. At noon, Jesus sat by a deep well, tired. A Samaritan woman came to get water. Jesus said, “Will you give Me a drink?” The woman was…",
   "wordCount": 125
  },
  {
   "id": "b14-w1-n6",
   "title": "Come, See a Man!",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 1,
   "night": 6,
   "scripture": "John 4:27–42",
   "scriptureBook": "John",
   "traveler": "scout",
   "feeling": "excited",
   "virtues": [
    "stand-for-truth"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "stand-for-truth",
   "teachingNote": "Reach for this when your child is excited about Jesus and you want them to tell a friend, like the woman who left her water jar and ran.",
   "teaser": "The woman at the well was so excited! She left her water jar right there and ran back to town. She called, “Come, see a Man who told me all I ever did! Is this the Christ?” The people hurried out to see Jesus…",
   "wordCount": 122
  },
  {
   "id": "b14-w1-n7",
   "title": "Go, Your Son Lives",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 1,
   "night": 7,
   "scripture": "John 4:46–54",
   "scriptureBook": "John",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "faith",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child must wait to see a prayer answered, like the father walking home on Jesus's word, \"Your son lives.\"",
   "teaser": "Jesus came back to Cana, where He had turned water into wine. A man who worked for the king had a very sick son. The father went to find Jesus. He begged, “Please come down to my house and heal my child.” Jesus did…",
   "wordCount": 117
  },
  {
   "id": "b14-w2-n1",
   "title": "Jesus Chooses Twelve",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 2,
   "night": 1,
   "scripture": "Luke 6:12–16",
   "scriptureBook": "Luke",
   "traveler": "scout",
   "feeling": "loved",
   "virtues": [
    "identity",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels too small to help and needs to see Jesus pray all night and then choose ordinary fishermen.",
   "teaser": "Jesus went up a mountain and prayed to Heavenly Father all night long. In the morning, Jesus chose twelve of His followers. He named them apostles. An apostle is a helper Jesus sends out to teach about Him. He chose…",
   "wordCount": 111
  },
  {
   "id": "b14-w2-n2",
   "title": "Blessed Are Ye",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 2,
   "night": 2,
   "scripture": "Matthew 5:1–12; Luke 6:20–23",
   "scriptureBook": "Matthew",
   "traveler": "willow",
   "feeling": "happy",
   "virtues": [
    "contentment",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "contentment",
   "teachingNote": "Reach for this when your child thinks happiness comes from having more and needs Jesus's word blessed: happy because Heavenly Father is close.",
   "teaser": "Big crowds followed Jesus. So He went up a mountain, sat down, and began to teach. Jesus started with the word blessed. Blessed means happy because Heavenly Father is close to you. Jesus said, “Blessed are they that…",
   "wordCount": 111
  },
  {
   "id": "b14-w2-n3",
   "title": "Let Your Light Shine",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 2,
   "night": 3,
   "scripture": "Matthew 5:13–16",
   "scriptureBook": "Matthew",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "service",
    "stand-for-truth"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child wants to hide their good and needs the candle that is set up high, not hidden under a basket.",
   "teaser": "Jesus kept teaching on the mountain. He said, “You are the salt of the earth.” Back then, salt kept food from going bad and made it taste good. His followers make the world better, like salt. Then Jesus said, “You…",
   "wordCount": 124
  },
  {
   "id": "b14-w2-n4",
   "title": "Make It Right First",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 2,
   "night": 4,
   "scripture": "Matthew 5:21–24, 38–42",
   "scriptureBook": "Matthew",
   "traveler": "wren",
   "feeling": "angry",
   "virtues": [
    "self-control",
    "peacemaking"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "self-control",
   "teachingNote": "Reach for this when your child is hot and angry and needs Jesus's lesson to leave the gift and make it right first.",
   "teaser": "Long ago, Heavenly Father gave the rule, “Do not kill.” Jesus taught that the rule starts in the heart. He said not to be angry without a reason. Do not call people mean names. Jesus said something surprising…",
   "wordCount": 121
  },
  {
   "id": "b14-w2-n5",
   "title": "Love Your Enemies",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 2,
   "night": 5,
   "scripture": "Matthew 5:43–48; Luke 6:27–36",
   "scriptureBook": "Matthew",
   "traveler": "willow",
   "feeling": "calm",
   "virtues": [
    "kindness",
    "forgiveness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child was treated meanly and needs Heavenly Father's sun that rises on everyone, good and bad.",
   "teaser": "Jesus said, “Love your enemies,” even the people who are unkind to you. Everyone was surprised. Love them? Jesus said, “Do good to them that hate you. Pray for them that hurt you.” Anyone can be nice to people who…",
   "wordCount": 125
  },
  {
   "id": "b14-w2-n6",
   "title": "The Speck and the Log",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 2,
   "night": 6,
   "scripture": "Luke 6:37–42",
   "scriptureBook": "Luke",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "humility",
    "forgiveness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child is quick to point out a sibling's mistake and needs Jesus's funny picture of the log in the eye.",
   "teaser": "Jesus said, “Judge not,” so do not decide other people are bad. He said, “Forgive, and you will be forgiven.” Then Jesus gave a funny picture. Your brother has a tiny speck of dust in his eye. You want to pull it…",
   "wordCount": 120
  },
  {
   "id": "b14-w2-n7",
   "title": "A House on the Rock",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 2,
   "night": 7,
   "scripture": "Luke 6:46–49",
   "scriptureBook": "Luke",
   "traveler": "beau",
   "feeling": "safe",
   "virtues": [
    "obedience",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child hears good teaching and needs the builder who dug deep and built his house on the rock.",
   "teaser": "Jesus asked, “Why call Me Lord and not do what I say?” Then He told a story about two builders. The first builder dug down deep and built his house on rock. A flood came, and the river rushed hard against it. But…",
   "wordCount": 116
  },
  {
   "id": "b14-w3-n1",
   "title": "Your Father Sees in Secret",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 3,
   "night": 1,
   "scripture": "Matthew 6:1–8",
   "scriptureBook": "Matthew",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "integrity",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "integrity",
   "teachingNote": "Reach for this when your child does good only when someone is watching and needs to know Heavenly Father sees in secret.",
   "teaser": "Jesus taught about doing good. He said, “Do not do it just so people will see you.” Some people gave to the poor with a big show. Jesus said, “Do not blow a trumpet when you give.” Give quietly instead. Some people…",
   "wordCount": 114
  },
  {
   "id": "b14-w3-n2",
   "title": "Our Father in Heaven",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 3,
   "night": 2,
   "scripture": "Matthew 6:9–15",
   "scriptureBook": "Matthew",
   "traveler": "willow",
   "feeling": "calm",
   "virtues": [
    "forgiveness",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "forgiveness",
   "teachingNote": "Reach for this when your child is holding on to a hurt and needs the words Jesus taught: forgive us, as we forgive others.",
   "teaser": "Some people thought long prayers with lots of words were best. So Jesus taught a short, simple prayer. It begins, “Our Father which art in heaven, hallowed be thy name.” We say His holy name with love. We ask that…",
   "wordCount": 108
  },
  {
   "id": "b14-w3-n3",
   "title": "Treasures in Heaven",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 3,
   "night": 3,
   "scripture": "Matthew 6:19–24",
   "scriptureBook": "Matthew",
   "traveler": "scout",
   "feeling": "grateful",
   "virtues": [
    "contentment",
    "generosity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "contentment",
   "teachingNote": "Reach for this when your child wants more and more things and needs Jesus's picture of moths, rust and robbers taking earthly treasure.",
   "teaser": "Jesus said, “Do not save up treasures on earth.” Little moths can chew holes in fine clothes. Rust can eat away metal, and robbers can steal. “Instead,” Jesus said, “save up treasures in heaven.” Nothing can spoil…",
   "wordCount": 120
  },
  {
   "id": "b14-w3-n4",
   "title": "Look at the Lilies",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 3,
   "night": 4,
   "scripture": "Matthew 6:25–34",
   "scriptureBook": "Matthew",
   "traveler": "willow",
   "feeling": "worried",
   "virtues": [
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child worries there will not be enough and needs to look at the birds and the lilies Heavenly Father cares for.",
   "teaser": "Jesus said, “Do not worry about food or clothes.” Heavenly Father knows you need them. “Look at the birds,” Jesus said. “They do not plant seeds. Yet your heavenly Father feeds them.” You are worth much more than…",
   "wordCount": 120
  },
  {
   "id": "b14-w3-n5",
   "title": "Ask, Seek, Knock",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 3,
   "night": 5,
   "scripture": "Matthew 7:7–12",
   "scriptureBook": "Matthew",
   "traveler": "beau",
   "feeling": "eager",
   "virtues": [
    "prayer",
    "perseverance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child stops praying because no answer came yet and needs Jesus's words: ask, seek, knock.",
   "teaser": "Jesus said, “Ask, and it shall be given you. Seek, and ye shall find. Knock, and it shall be opened.” Jesus wanted the people to keep praying and never give up. Heavenly Father is always listening. Then Jesus asked…",
   "wordCount": 116
  },
  {
   "id": "b14-w3-n6",
   "title": "The Narrow Gate and Good Fruit",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 3,
   "night": 6,
   "scripture": "Matthew 7:13–20",
   "scriptureBook": "Matthew",
   "traveler": "scout",
   "feeling": "calm",
   "virtues": [
    "wisdom",
    "integrity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wisdom",
   "teachingNote": "Reach for this when your child is tempted to follow the crowd and needs the narrow gate and the tree known by its good fruit.",
   "teaser": "Jesus told about two gates. A wide gate leads to being lost, and many go that way. A narrow gate leads to life. A wide gate is easy, with a big crowd. A narrow gate fits one person at a time. To follow Jesus, we…",
   "wordCount": 122
  },
  {
   "id": "b14-w3-n7",
   "title": "He Taught with Power",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 3,
   "night": 7,
   "scripture": "Matthew 7:21–29",
   "scriptureBook": "Matthew",
   "traveler": "wren",
   "feeling": "amazed",
   "virtues": [
    "heeding-counsel",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "heeding-counsel",
   "teachingNote": "Reach for this when your child knows Jesus's words but needs help doing them, like the wise man who built on the rock.",
   "teaser": "Jesus was finishing His big talk on the mountain. He said not everyone who calls Him “Lord, Lord” will enter heaven. It is those who do what Heavenly Father wants. Nice words are not enough. We need to do what Jesus…",
   "wordCount": 123
  },
  {
   "id": "b14-w4-n1",
   "title": "Speak the Word Only",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 4,
   "night": 1,
   "scripture": "Matthew 8:5–13",
   "scriptureBook": "Matthew",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "humility",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child needs to see the soldier's humble faith that one word from Jesus was enough to heal.",
   "teaser": "Jesus came to Capernaum. A centurion came to Him, a captain over a hundred soldiers. He said, “Lord, my servant is sick at home and hurts badly.” Jesus said, “I will come and heal him.” The centurion said, “Lord, I…",
   "wordCount": 123
  },
  {
   "id": "b14-w4-n2",
   "title": "Peace, Be Still",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 4,
   "night": 2,
   "scripture": "Matthew 8:23–27; Mark 4:35–41",
   "scriptureBook": "Matthew",
   "traveler": "scout",
   "feeling": "nervous",
   "virtues": [
    "trust-in-god",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child is scared by a storm, outside or inside, and needs Jesus saying, \"Peace, be still.\"",
   "teaser": "One evening Jesus and His disciples got into a boat. They sailed across the lake. Jesus lay in the back on a pillow and fell asleep. Then a great wind came. The waves splashed in, and the boat filled with water. His…",
   "wordCount": 112
  },
  {
   "id": "b14-w4-n3",
   "title": "Stretch Out Your Hand",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 4,
   "night": 3,
   "scripture": "Mark 3:1–6",
   "scriptureBook": "Mark",
   "traveler": "beau",
   "feeling": "connected",
   "virtues": [
    "service",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child sees someone who needs help while others say not now, like the man with the dried-up hand.",
   "teaser": "It was the Sabbath, Heavenly Father’s day of rest. Jesus went into the synagogue, where people met to pray. A man there had a hand that was dried up. Some men watched Jesus closely. If He healed on the Sabbath, they…",
   "wordCount": 118
  },
  {
   "id": "b14-w4-n4",
   "title": "The Seed and the Soil",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 4,
   "night": 4,
   "scripture": "Mark 4:1–20",
   "scriptureBook": "Mark",
   "traveler": "wren",
   "feeling": "eager",
   "virtues": [
    "love-of-scripture",
    "pondering"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this when your child hears Heavenly Father's word and you want it to take root, like seeds in good soil.",
   "teaser": "Jesus sat in a boat to teach the crowd by the lake. He told a parable, a little story that teaches something big. A farmer threw seeds. Some fell on the hard path, and birds ate them. Some fell on rocky ground. They…",
   "wordCount": 122
  },
  {
   "id": "b14-w4-n5",
   "title": "The Tiniest Seed",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 4,
   "night": 5,
   "scripture": "Mark 4:21–34",
   "scriptureBook": "Mark",
   "traveler": "scout",
   "feeling": "brave",
   "virtues": [
    "faith",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child feels their faith is too small and needs the tiny mustard seed that grew bigger than the garden.",
   "teaser": "Jesus asked, “Do you hide a candle under a basket or a bed?” No! You set it up high to shine. Jesus’s good news is meant to shine too. Then Jesus told another little story. Heavenly Father’s kingdom is like a…",
   "wordCount": 119
  },
  {
   "id": "b14-w4-n6",
   "title": "The Widow of Nain",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 4,
   "night": 6,
   "scripture": "Luke 7:11–17",
   "scriptureBook": "Luke",
   "traveler": "willow",
   "feeling": "sad",
   "virtues": [
    "comfort",
    "compassion"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "comfort",
   "teachingNote": "Reach for this when your child is sad over a loss and needs to see Jesus come close to the crying mother at Nain.",
   "teaser": "Jesus walked to a town called Nain with His friends and a big crowd. Near the gate, they met people carrying a young man who had died. His mother was there, crying. Her husband had died before, and this was her only…",
   "wordCount": 122
  },
  {
   "id": "b14-w4-n7",
   "title": "Forgiven Much, Loving Much",
   "volume": "nt",
   "book": 14,
   "bookTitle": "Let Your Light Shine!",
   "month": "February",
   "week": 4,
   "night": 7,
   "scripture": "Luke 7:36–50",
   "scriptureBook": "Luke",
   "traveler": "willow",
   "feeling": "guilty",
   "virtues": [
    "repentance",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child feels sorry for something and needs to see the woman at Jesus's feet forgiven and sent in peace.",
   "teaser": "Jesus ate dinner at the house of a man named Simon. A woman came who had done many wrong things. She brought a pretty jar of sweet-smelling oil. She stood at Jesus’s feet and cried, and her tears fell on His feet…",
   "wordCount": 121
  },
  {
   "id": "b15-w1-n1",
   "title": "She Touched His Robe",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 1,
   "night": 1,
   "scripture": "Mark 5:24–34",
   "scriptureBook": "Mark",
   "traveler": "willow",
   "feeling": "eager",
   "virtues": [
    "faith",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child has been sick or hurting a long time and needs the woman who reached through the crowd to touch Jesus's robe.",
   "teaser": "A big crowd pushed close around Jesus as He walked. In the crowd was a woman who had been sick for twelve years. Doctors had not helped her. She only got worse. She thought, “If I can just touch His clothes, I will…",
   "wordCount": 124
  },
  {
   "id": "b15-w1-n2",
   "title": "Only Believe",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 1,
   "night": 2,
   "scripture": "Mark 5:22–24, 35–43",
   "scriptureBook": "Mark",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "faith",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child hears scary news and needs Jesus's words to Jairus: Be not afraid, only believe.",
   "teaser": "Jairus led the place where people met to pray. He fell at Jesus’s feet. “My little daughter is so sick,” he begged. “Please come touch her, so she will live.” Jesus went with him. On the way, people came from…",
   "wordCount": 125
  },
  {
   "id": "b15-w1-n3",
   "title": "Two Men Who Could See",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 1,
   "night": 3,
   "scripture": "Matthew 9:27–31",
   "scriptureBook": "Matthew",
   "traveler": "scout",
   "feeling": "grateful",
   "virtues": [
    "gratitude",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child has received something good and you want them to tell it with thanks, like the two men who could see.",
   "teaser": "Two blind men followed Jesus. Their eyes could not see the sky, or faces, or the path. They called out, “Son of David, have mercy on us!” They were asking for His kind help. They believed He was the Savior promised…",
   "wordCount": 124
  },
  {
   "id": "b15-w1-n4",
   "title": "Not One Sparrow Falls",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 1,
   "night": 4,
   "scripture": "Matthew 10:1, 5–8, 29–31",
   "scriptureBook": "Matthew",
   "traveler": "wren",
   "feeling": "loved",
   "virtues": [
    "identity",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels unimportant and needs to hear that not one sparrow falls without Heavenly Father knowing.",
   "teaser": "Jesus called His twelve apostles, friends He would send to teach. He gave them power to heal the sick. He sent them to the towns of Israel. “Heal the sick,” He said. “You were given good things for free, so give for…",
   "wordCount": 125
  },
  {
   "id": "b15-w1-n5",
   "title": "Five Loaves and Two Fish",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 1,
   "night": 5,
   "scripture": "Luke 9:10–17",
   "scriptureBook": "Luke",
   "traveler": "scout",
   "feeling": "grateful",
   "virtues": [
    "generosity",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child thinks their little bit is too small to share, like five loaves and two fish for thousands.",
   "teaser": "Jesus’s apostles came back from teaching. Jesus took them to a quiet place near Bethsaida. But thousands of people followed. Jesus welcomed the people, taught them, and healed the sick. At evening, the apostles…",
   "wordCount": 124
  },
  {
   "id": "b15-w1-n6",
   "title": "Shining on the Mountain",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 1,
   "night": 6,
   "scripture": "Luke 9:18–20, 28–36",
   "scriptureBook": "Luke",
   "traveler": "wren",
   "feeling": "amazed",
   "virtues": [
    "heeding-counsel",
    "reverence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "heeding-counsel",
   "teachingNote": "Reach for this when your child needs to learn to listen to Jesus, the way Heavenly Father said on the shining mountain.",
   "teaser": "One day Jesus asked His disciples, “Who do you say I am?” Peter answered that Jesus was the Christ, the Savior Heavenly Father sent. Later, Jesus took Peter, James, and John up a mountain to pray. As Jesus prayed…",
   "wordCount": 124
  },
  {
   "id": "b15-w1-n7",
   "title": "The Greatest of All",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 1,
   "night": 7,
   "scripture": "Luke 9:46–48",
   "scriptureBook": "Luke",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "humility",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child argues about who is the best and needs Jesus setting a little child right beside Him.",
   "teaser": "One day Jesus’s disciples started to argue. “Which of us is the greatest?” Each one hoped it was him. Jesus knew what they were thinking. He did not scold them. He took a little child, a small one just like you…",
   "wordCount": 117
  },
  {
   "id": "b15-w2-n1",
   "title": "Go and Tell John",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 2,
   "night": 1,
   "scripture": "Matthew 11:2–6",
   "scriptureBook": "Matthew",
   "traveler": "scout",
   "feeling": "comforted",
   "virtues": [
    "faith",
    "curiosity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child has a hard question about Jesus and needs to know John the Baptist asked one too.",
   "teaser": "John the Baptist was locked in a prison. King Herod put him there because John said the king was doing wrong. John heard what Jesus was doing. So he sent two of his friends with a question. “Are You the One who was…",
   "wordCount": 121
  },
  {
   "id": "b15-w2-n2",
   "title": "I Will Give You Rest",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 2,
   "night": 2,
   "scripture": "Matthew 11:28–30",
   "scriptureBook": "Matthew",
   "traveler": "willow",
   "feeling": "discouraged",
   "virtues": [
    "trust-in-god",
    "comfort"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child is worn out and carrying a heavy load, and needs Jesus's gentle yoke and His promise of rest.",
   "teaser": "Many people around Jesus were tired. They worked hard all day, and some were sad or sick. The leaders’ many extra rules felt like a heavy load, too. Jesus said, “Come unto Me, all you who work hard and carry heavy…",
   "wordCount": 118
  },
  {
   "id": "b15-w2-n3",
   "title": "Lord of the Sabbath",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 2,
   "night": 3,
   "scripture": "Matthew 12:1–8",
   "scriptureBook": "Matthew",
   "traveler": "beau",
   "feeling": "connected",
   "virtues": [
    "compassion",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "compassion",
   "teachingNote": "Reach for this when your child cares more about a rule than a person and needs Jesus's lesson in the grain field: mercy first.",
   "teaser": "On the Sabbath, Heavenly Father’s day of rest, Jesus walked through grain fields. His disciples were hungry. They picked some grain and ate it. Some Pharisees, leaders who cared very much about rules, saw them…",
   "wordCount": 123
  },
  {
   "id": "b15-w2-n4",
   "title": "A Bruised Reed",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 2,
   "night": 4,
   "scripture": "Matthew 12:15–21",
   "scriptureBook": "Matthew",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "comfort",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "comfort",
   "teachingNote": "Reach for this when your child feels bent or broken and needs to know Jesus will not break a bruised reed.",
   "teaser": "Some leaders were angry and made plans against Jesus. So He quietly went away. But a big crowd followed Him, and He healed them all. Long before, the prophet Isaiah talked about Jesus. Isaiah said the Savior would…",
   "wordCount": 122
  },
  {
   "id": "b15-w2-n5",
   "title": "The Friend at Midnight",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 2,
   "night": 5,
   "scripture": "Luke 11:5–13",
   "scriptureBook": "Luke",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "prayer",
    "perseverance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child gives up after asking once and needs the friend who kept knocking at midnight for bread.",
   "teaser": "Jesus’s friends asked Him to teach them to pray. So He told a story. A man’s friend came at midnight, hungry from a long trip. But the man had no bread. He knocked at his neighbor’s door. “Friend, lend me three…",
   "wordCount": 125
  },
  {
   "id": "b15-w2-n6",
   "title": "My Brother, My Sister, My Mother",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 2,
   "night": 6,
   "scripture": "Matthew 12:46–50",
   "scriptureBook": "Matthew",
   "traveler": "wren",
   "feeling": "connected",
   "virtues": [
    "obedience",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child wonders where they belong and needs Jesus pointing to all who follow Heavenly Father as His family.",
   "teaser": "Jesus was teaching the people. His mother and His brothers came and stood outside. They wanted to talk with Him. Someone told Jesus, “Your mother and Your brothers are standing outside.” Jesus looked at His…",
   "wordCount": 118
  },
  {
   "id": "b15-w2-n7",
   "title": "The Sign of Jonah",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 2,
   "night": 7,
   "scripture": "Matthew 12:38–41",
   "scriptureBook": "Matthew",
   "traveler": "beau",
   "feeling": "guilty",
   "virtues": [
    "repentance",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child has done wrong and needs Jonah's three days and the people who changed, to know it is not too late.",
   "teaser": "Some leaders came to Jesus. “Teacher, show us a sign,” they said. They wanted a big miracle to prove who He was. They had already seen Him heal many people. Jesus said they would get only one sign, the sign of the…",
   "wordCount": 121
  },
  {
   "id": "b15-w3-n1",
   "title": "Why Jesus Told Stories",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 3,
   "night": 1,
   "scripture": "Matthew 13:10–17",
   "scriptureBook": "Matthew",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "curiosity",
    "pondering"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "curiosity",
   "teachingNote": "Reach for this when your child hears a story and runs off, and you want to look together for the treasure hidden inside it.",
   "teaser": "One day Jesus’s disciples asked Him, “Why do You teach with parables?” A parable is a little story about everyday things, like seeds and sheep. Inside hides a big lesson, like treasure in a box. Jesus said many…",
   "wordCount": 118
  },
  {
   "id": "b15-w3-n2",
   "title": "Wheat and Weeds",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 3,
   "night": 2,
   "scripture": "Matthew 13:24–30, 36–43",
   "scriptureBook": "Matthew",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "patience",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "patience",
   "teachingNote": "Reach for this when your child wants to fix everyone else's wrongs and needs the farmer who let the wheat and weeds grow until harvest.",
   "teaser": "Jesus told a parable about a farmer. He planted good wheat seeds in his field. But one night, while everyone slept, an enemy sneaked in. He planted weeds in the wheat. When the plants grew, the weeds grew too. The…",
   "wordCount": 125
  },
  {
   "id": "b15-w3-n3",
   "title": "The Hidden Treasure and the Pearl",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 3,
   "night": 3,
   "scripture": "Matthew 13:33, 44–46",
   "scriptureBook": "Matthew",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "faith",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child loves a toy or treasure, and you want to show the treasure in the field that is worth everything.",
   "teaser": "Jesus told three tiny parables about Heavenly Father’s kingdom. First, He said it was like a little yeast a woman hid in flour. Soon the whole dough grew big. Next, He said it was like treasure hidden in a field. A…",
   "wordCount": 120
  },
  {
   "id": "b15-w3-n4",
   "title": "The Women Who Helped Jesus",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 3,
   "night": 4,
   "scripture": "Luke 8:1–3",
   "scriptureBook": "Luke",
   "traveler": "willow",
   "feeling": "happy",
   "virtues": [
    "service",
    "generosity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child wants to help but feels they have little, like the women who helped Jesus with what they had.",
   "teaser": "Jesus went from town to town, telling the good news about Heavenly Father’s kingdom. His twelve apostles went with Him. Some women came too. One was Mary Magdalene. Jesus had made her well. Joanna came, too. Her…",
   "wordCount": 112
  },
  {
   "id": "b15-w3-n5",
   "title": "One More Year",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 3,
   "night": 5,
   "scripture": "Luke 13:6–9",
   "scriptureBook": "Luke",
   "traveler": "willow",
   "feeling": "grateful",
   "virtues": [
    "hope",
    "repentance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child fears they have messed up too many times and needs the gardener asking for one more year.",
   "teaser": "Jesus told a parable about a man with a fig tree in his garden. The man came looking for figs. None! He came the next year. None! He came again the next year. Still none! Three years, and not one fig. The man told…",
   "wordCount": 121
  },
  {
   "id": "b15-w3-n6",
   "title": "Stand Up Straight",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 3,
   "night": 6,
   "scripture": "Luke 13:10–17",
   "scriptureBook": "Luke",
   "traveler": "beau",
   "feeling": "happy",
   "virtues": [
    "hope",
    "compassion"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child has been held down by something a long time and needs the bent woman standing up straight.",
   "teaser": "On the Sabbath, Jesus was teaching where people prayed. A woman there had been bent over for eighteen years. She could not stand up straight. Jesus called her and said, “Woman, you are set free from your sickness.”…",
   "wordCount": 124
  },
  {
   "id": "b15-w3-n7",
   "title": "Like a Hen Gathers Her Chicks",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 3,
   "night": 7,
   "scripture": "Luke 13:31–35",
   "scriptureBook": "Luke",
   "traveler": "wren",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "comfort"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels unsafe and needs Jesus's picture of a hen gathering her chicks under her wings.",
   "teaser": "One day some leaders told Jesus, “Go away. King Herod wants to hurt You.” Jesus was not afraid. He kept on healing people. Then Jesus thought about Jerusalem, the big city with the temple. Many there had hurt…",
   "wordCount": 120
  },
  {
   "id": "b15-w4-n1",
   "title": "Hosanna to the King",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 4,
   "night": 1,
   "scripture": "Matthew 21:1–11",
   "scriptureBook": "Matthew",
   "traveler": "scout",
   "feeling": "excited",
   "virtues": [
    "worship-together",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "worship-together",
   "teachingNote": "Reach for this when your child is getting ready for Palm Sunday or church and needs the crowd crying Hosanna to the humble King on a donkey.",
   "teaser": "Jesus and His disciples came near Jerusalem. Jesus said to two of them, “You will find a donkey and her colt. Bring them to Me.” The prophet Zechariah long ago said a gentle King would ride a donkey. Zechariah was…",
   "wordCount": 116
  },
  {
   "id": "b15-w4-n2",
   "title": "Remember Me",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 4,
   "night": 2,
   "scripture": "Luke 22:14–20; John 13:4–15",
   "scriptureBook": "Luke",
   "traveler": "willow",
   "feeling": "grateful",
   "virtues": [
    "reverence",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child wiggles during the sacrament and needs Jesus washing feet and saying, \"Do this in remembrance of Me.\"",
   "teaser": "The night before He died, Jesus ate the Passover supper with His apostles. At Passover, Israel remembered how Heavenly Father freed them. Jesus tied a towel around Himself and poured water into a bowl. Then He…",
   "wordCount": 125
  },
  {
   "id": "b15-w4-n3",
   "title": "Not My Will, but Thine",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 4,
   "night": 3,
   "scripture": "Luke 22:39–46",
   "scriptureBook": "Luke",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "obedience",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child must do a hard right thing and needs Jesus in the garden praying, \"Not My will, but Thine.\"",
   "teaser": "After supper, Jesus took His apostles to Gethsemane, a garden where He often prayed. He told His friends, “Pray, so you will not give in to wrong.” Then He knelt a little farther away and prayed alone. Something…",
   "wordCount": 122
  },
  {
   "id": "b15-w4-n4",
   "title": "Father, Forgive Them",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 4,
   "night": 4,
   "scripture": "Luke 23:33–34, 44–46",
   "scriptureBook": "Luke",
   "traveler": "wren",
   "feeling": "sad",
   "virtues": [
    "forgiveness",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "forgiveness",
   "teachingNote": "Reach for this when your child has been hurt by someone and needs Jesus praying, \"Father, forgive them,\" from the cross.",
   "teaser": "After the garden, soldiers took Jesus away. Leaders who did not like Him said He had done wrong. But Jesus never did anything wrong. They put Jesus on a cross on a hill called Calvary. His mother, Mary, and His…",
   "wordCount": 118
  },
  {
   "id": "b15-w4-n5",
   "title": "The Quiet Day",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 4,
   "night": 5,
   "scripture": "Luke 23:50–56; 1 Peter 3:18–19",
   "scriptureBook": "Luke",
   "traveler": "willow",
   "feeling": "calm",
   "virtues": [
    "hope",
    "patience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child is waiting through a sad, quiet time and needs to know that Sunday was coming.",
   "teaser": "A good man named Joseph loved Jesus. He went bravely to Pilate, the ruler, and asked for Jesus’s body. Pilate said yes. Joseph gently wrapped Jesus’s body in clean cloth. He laid Him in a new tomb cut in the rock…",
   "wordCount": 123
  },
  {
   "id": "b15-w4-n6",
   "title": "He Is Not Here, He Is Risen",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 4,
   "night": 6,
   "scripture": "Matthew 28:1–8; John 20:1–18",
   "scriptureBook": "Matthew",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "hope",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child asks what happens after someone dies and needs the angel's words at the empty tomb: He is risen.",
   "teaser": "Very early on Sunday morning, Mary Magdalene and another Mary went to Jesus’s tomb. An angel from heaven had rolled the big stone away. He sat on it, shining like lightning, his clothes white as snow. The angel…",
   "wordCount": 122
  },
  {
   "id": "b15-w4-n7",
   "title": "Peace Be unto You",
   "volume": "nt",
   "book": 15,
   "bookTitle": "Come unto Me",
   "month": "March",
   "week": 4,
   "night": 7,
   "scripture": "Luke 24:36–43; John 20:24–29; 1 Corinthians 15:55",
   "scriptureBook": "Luke",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "hope",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child misses someone who died and needs Jesus showing His hands and saying, \"Peace be unto you.\"",
   "teaser": "That Sunday night, Jesus’s disciples were together behind shut doors, afraid. Suddenly Jesus stood with them! He said, “Peace be unto you.” They thought He was a spirit. Jesus said, “Look at My hands and My feet. It…",
   "wordCount": 121
  },
  {
   "id": "b16-w1-n1",
   "title": "Walking on the Water",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 1,
   "night": 1,
   "scripture": "Matthew 14:22–33",
   "scriptureBook": "Matthew",
   "traveler": "beau",
   "feeling": "worried",
   "virtues": [
    "faith",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child feels the waves are too big and needs to look at Jesus, not the storm.",
   "teaser": "After feeding the big crowd, Jesus sent His friends across the lake. He went up a mountain alone to pray. That night, a strong wind tossed their boat. Then they saw someone walking on the water! “It is a ghost!”…",
   "wordCount": 124
  },
  {
   "id": "b16-w1-n2",
   "title": "No Honor at Home",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 1,
   "night": 2,
   "scripture": "Mark 6:1–6",
   "scriptureBook": "Mark",
   "traveler": "willow",
   "feeling": "disappointed",
   "virtues": [
    "integrity",
    "perseverance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "integrity",
   "teachingNote": "Reach for this when your child feels let down that others don't believe them and needs to keep doing good anyway.",
   "teaser": "Jesus went home to Nazareth, the town where He grew up. On the Sabbath, the day of rest, He taught there. At first they were amazed. “Where did He learn all this? How can He do such mighty works?” Then they said…",
   "wordCount": 125
  },
  {
   "id": "b16-w1-n3",
   "title": "Come and Rest a While",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 1,
   "night": 3,
   "scripture": "Mark 6:30–32, 53–56",
   "scriptureBook": "Mark",
   "traveler": "willow",
   "feeling": "calm",
   "virtues": [
    "comfort",
    "patience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "comfort",
   "teachingNote": "Reach for this when your child is worn out from helping and needs to hear that Jesus wants them to rest.",
   "teaser": "Jesus’s twelve helpers came back from teaching in the villages. They told Jesus all they had done and taught. So many people came and went that the helpers had no time to eat. Jesus saw how tired they were. Tired…",
   "wordCount": 124
  },
  {
   "id": "b16-w1-n4",
   "title": "Do You Want to Be Well?",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 1,
   "night": 4,
   "scripture": "John 5:1–9",
   "scriptureBook": "John",
   "traveler": "wren",
   "feeling": "discouraged",
   "virtues": [
    "hope",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child thinks nothing will ever change and needs to hear Jesus say, \"Rise.\"",
   "teaser": "In Jerusalem there was a pool called Bethesda. Many sick people lay around it. They waited for the water to stir. The first one in would be made well. One man had been sick for thirty-eight years. That is a very…",
   "wordCount": 124
  },
  {
   "id": "b16-w1-n5",
   "title": "A Boy's Lunch",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 1,
   "night": 5,
   "scripture": "John 6:5–14",
   "scriptureBook": "John",
   "traveler": "scout",
   "feeling": "grateful",
   "virtues": [
    "generosity",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child thinks what they have is too small and needs the boy's five loaves and two fish.",
   "teaser": "A huge crowd followed Jesus up a hill, about five thousand men! Jesus asked Philip, “Where can we buy bread for all these people?” Philip said, “Even lots of money could not buy each one a bite!” Then Andrew said…",
   "wordCount": 119
  },
  {
   "id": "b16-w1-n6",
   "title": "The Bread of Life",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 1,
   "night": 6,
   "scripture": "John 6:26–35, 48–51",
   "scriptureBook": "John",
   "traveler": "wren",
   "feeling": "eager",
   "virtues": [
    "faith",
    "love-of-scripture"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child feels empty inside and needs to know Jesus is the bread that fills.",
   "teaser": "The next day, the crowd came looking for Jesus again. He said, “You came because you ate and were full. Work for food that lasts forever.” They said, “Long ago, our fathers ate manna in the desert, bread from…",
   "wordCount": 123
  },
  {
   "id": "b16-w1-n7",
   "title": "To Whom Shall We Go?",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 1,
   "night": 7,
   "scripture": "John 6:60–69",
   "scriptureBook": "John",
   "traveler": "beau",
   "feeling": "connected",
   "virtues": [
    "faith",
    "keeping-promises"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child sees others walk away and needs Peter's words: to whom else would we go?",
   "teaser": "Jesus taught that He was the bread of life. Many followers said, “This is hard to hear. Who can listen to this?” So many of them turned around and went away. They did not walk with Jesus anymore. Jesus turned to His…",
   "wordCount": 123
  },
  {
   "id": "b16-w2-n1",
   "title": "Even the Crumbs",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 2,
   "night": 1,
   "scripture": "Matthew 15:21–28",
   "scriptureBook": "Matthew",
   "traveler": "willow",
   "feeling": "brave",
   "virtues": [
    "perseverance",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "perseverance",
   "teachingNote": "Reach for this when your child wants to quit asking and needs the mother who kept asking Jesus for even the crumbs.",
   "teaser": "Near Tyre and Sidon, a woman came to Jesus. She was not one of the children of Israel, His own people. She cried, “Lord, please be kind to me! My daughter is sick.” At first Jesus did not say a word. His friends…",
   "wordCount": 125
  },
  {
   "id": "b16-w2-n2",
   "title": "Thou Art the Christ",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 2,
   "night": 2,
   "scripture": "Matthew 16:13–19",
   "scriptureBook": "Matthew",
   "traveler": "wren",
   "feeling": "safe",
   "virtues": [
    "faith",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child wonders how they can know who Jesus is and needs Peter's answer from Heavenly Father.",
   "teaser": "Jesus and His friends walked near a town called Caesarea Philippi. Jesus asked, “Who do people say that I am?” They said, “Some say John the Baptist. Some say Elias, or Jeremiah, or another prophet.” Then Jesus…",
   "wordCount": 125
  },
  {
   "id": "b16-w2-n3",
   "title": "Help My Unbelief",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 2,
   "night": 3,
   "scripture": "Matthew 17:14–20; Mark 9:17–27",
   "scriptureBook": "Matthew",
   "traveler": "beau",
   "feeling": "safe",
   "virtues": [
    "faith",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child believes and is still scared and needs the father's prayer, \"Help my unbelief.\"",
   "teaser": "A father knelt before Jesus. “Lord, please help my son. He is very sick. Your friends could not heal him.” Jesus said, “Bring him to Me.” The boy had been sick since he was little. The father said, “If You can do…",
   "wordCount": 119
  },
  {
   "id": "b16-w2-n4",
   "title": "A Coin in a Fish",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 2,
   "night": 4,
   "scripture": "Matthew 17:24–27",
   "scriptureBook": "Matthew",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "kindness",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child wonders if they have to be kind when they don't have to, and needs the coin in the fish.",
   "teaser": "Jesus and His friends came to Capernaum, a town by the lake. Each year, men paid money to care for the temple. Some men asked Peter, “Doesn’t your Teacher pay the temple money?” “Yes,” said Peter. Inside, Jesus…",
   "wordCount": 124
  },
  {
   "id": "b16-w2-n5",
   "title": "Honor Your Father and Mother",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 2,
   "night": 5,
   "scripture": "Mark 7:1–13",
   "scriptureBook": "Mark",
   "traveler": "beau",
   "feeling": "connected",
   "virtues": [
    "honoring-parents",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "honoring-parents",
   "teachingNote": "Reach for this when your child forgets that caring for mom and dad is one of Heavenly Father's own commandments.",
   "teaser": "Some leaders came from Jerusalem to watch Jesus. They saw His friends eat without washing their hands the leaders’ special way. These leaders had many extra rules, made by people long ago. They asked, “Why don’t…",
   "wordCount": 123
  },
  {
   "id": "b16-w2-n6",
   "title": "Be Opened",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 2,
   "night": 6,
   "scripture": "Mark 7:31–37",
   "scriptureBook": "Mark",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "wonder",
    "compassion"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wonder",
   "teachingNote": "Reach for this when your child feels unheard and needs to know Jesus came close and said, \"Be opened.\"",
   "teaser": "Jesus came to a land of ten cities. People brought Him a man who could not hear. He could hardly talk, either. Jesus took the man away from the crowd. He put His fingers in the man’s ears and touched his tongue. The…",
   "wordCount": 125
  },
  {
   "id": "b16-w2-n7",
   "title": "A Cup of Cold Water",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 2,
   "night": 7,
   "scripture": "Mark 9:38–41",
   "scriptureBook": "Mark",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "kindness",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child thinks a small kindness doesn't count and needs the cup of cold water Jesus remembers.",
   "teaser": "John, one of Jesus’s friends, came to Him with a worry. “Teacher, a man was doing good in Your name. He was not one of us, so we told him to stop.” Jesus said, “Do not stop him. Whoever is not against us is on our…",
   "wordCount": 122
  },
  {
   "id": "b16-w3-n1",
   "title": "Like a Little Child",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 3,
   "night": 1,
   "scripture": "Matthew 18:1–5, 10",
   "scriptureBook": "Matthew",
   "traveler": "wren",
   "feeling": "loved",
   "virtues": [
    "humility",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child wants to be the greatest and needs to see Jesus set a little child in the middle.",
   "teaser": "Jesus’s friends came to Him with a question. “Who is the greatest in the kingdom of heaven?” Jesus called a little child over. He stood the child right in the middle of them all. Then Jesus said, “Change, and become…",
   "wordCount": 123
  },
  {
   "id": "b16-w3-n2",
   "title": "The Lost Sheep",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 3,
   "night": 2,
   "scripture": "Matthew 18:12–14",
   "scriptureBook": "Matthew",
   "traveler": "willow",
   "feeling": "safe",
   "virtues": [
    "identity",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels lost or left out and needs the shepherd who leaves ninety-nine to find one.",
   "teaser": "Jesus told a little story. A man had a hundred sheep. One sheep wandered away and got lost. A lost sheep cannot find its own way home. So the man left the ninety-nine other sheep. He went up into the hills to look…",
   "wordCount": 124
  },
  {
   "id": "b16-w3-n3",
   "title": "Where Two or Three Gather",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 3,
   "night": 3,
   "scripture": "Matthew 18:15–20",
   "scriptureBook": "Matthew",
   "traveler": "scout",
   "feeling": "comforted",
   "virtues": [
    "peacemaking",
    "worship-together"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "peacemaking",
   "teachingNote": "Reach for this when your child is hurt by a friend and needs to talk kindly, face to face, and make it right.",
   "teaser": "Jesus taught His friends what to do when someone does something wrong to you. He said, “Go and talk to him, just the two of you.” Don’t tell everyone else first, and don’t stay mad. Talk kindly, face to face. Jesus…",
   "wordCount": 108
  },
  {
   "id": "b16-w3-n4",
   "title": "Seventy Times Seven",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 3,
   "night": 4,
   "scripture": "Matthew 18:21–35",
   "scriptureBook": "Matthew",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "forgiveness",
    "compassion"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "forgiveness",
   "teachingNote": "Reach for this when your child is keeping count of wrongs and needs Jesus's answer: seventy times seven.",
   "teaser": "Peter asked Jesus, “How many times should I forgive my brother? Seven times?” Jesus said, “Not seven times. Seventy times seven!” That is more times than you could ever count. Jesus told a story. A servant owed a…",
   "wordCount": 123
  },
  {
   "id": "b16-w3-n5",
   "title": "The Seventy Go Out",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 3,
   "night": 5,
   "scripture": "Luke 10:1–9, 17–20",
   "scriptureBook": "Luke",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "service",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child wants to help Jesus and needs to know they can be a worker in His harvest.",
   "teaser": "Jesus chose seventy more helpers. He sent them out two by two, to every town He would visit. He said, “The harvest is great, but the workers are few.” Many people were ready to hear about Jesus. They were like a…",
   "wordCount": 120
  },
  {
   "id": "b16-w3-n6",
   "title": "The Good Samaritan",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 3,
   "night": 6,
   "scripture": "Luke 10:25–37",
   "scriptureBook": "Luke",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "compassion",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "compassion",
   "teachingNote": "Reach for this when your child is tempted to walk past someone hurting and needs the Samaritan who stopped.",
   "teaser": "A man who knew the scriptures asked Jesus a question. The scriptures say, “Love your neighbor as yourself.” So he asked, “But who is my neighbor?” Jesus told a story. Robbers hurt a man on the road and left him…",
   "wordCount": 125
  },
  {
   "id": "b16-w3-n7",
   "title": "Mary and Martha",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 3,
   "night": 7,
   "scripture": "Luke 10:38–42",
   "scriptureBook": "Luke",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "pondering",
    "reverence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "pondering",
   "teachingNote": "Reach for this when your child is too busy to listen and needs Mary sitting still at Jesus's feet.",
   "teaser": "Jesus came to a village. A woman named Martha welcomed Him into her house. Her sister Mary sat down at Jesus’s feet. She listened to every word He said. But Martha was busy, busy, busy serving. There was so much to…",
   "wordCount": 120
  },
  {
   "id": "b16-w4-n1",
   "title": "If Anyone Is Thirsty",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 4,
   "night": 1,
   "scripture": "John 7:37–39",
   "scriptureBook": "John",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "faith",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child feels dry inside and needs Jesus's call: if anyone is thirsty, come to Me.",
   "teaser": "Every year, Heavenly Father’s people kept a happy feast for seven days. They lived in little huts made of branches. The huts helped them remember long ago. Heavenly Father had cared for their people in the desert…",
   "wordCount": 124
  },
  {
   "id": "b16-w4-n2",
   "title": "Neither Do I Condemn Thee",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 4,
   "night": 2,
   "scripture": "John 8:1–11",
   "scriptureBook": "John",
   "traveler": "willow",
   "feeling": "embarrassed",
   "virtues": [
    "forgiveness",
    "repentance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "forgiveness",
   "teachingNote": "Reach for this when your child wants to hide after doing wrong and needs Jesus, who forgives and says go and do better.",
   "teaser": "One morning, Jesus was teaching in the temple. Some leaders brought a woman who had done something very wrong. They said, “Moses’ law says to punish her with stones. What do You say?” They were trying to trap Jesus…",
   "wordCount": 123
  },
  {
   "id": "b16-w4-n3",
   "title": "The Truth Shall Make You Free",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 4,
   "night": 3,
   "scripture": "John 8:12, 31–36",
   "scriptureBook": "John",
   "traveler": "wren",
   "feeling": "safe",
   "virtues": [
    "faith",
    "honesty"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child feels lost in the dark and needs Jesus, the light that shows where to step.",
   "teaser": "Jesus said, “I am the light of the world. Whoever follows Me will not walk in darkness.” Why did Jesus say light? In the dark, you can’t see the path. You bump into things. A light shows you where to step. Jesus…",
   "wordCount": 124
  },
  {
   "id": "b16-w4-n4",
   "title": "I Was Blind, Now I See",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 4,
   "night": 4,
   "scripture": "John 9:1–11, 24–38",
   "scriptureBook": "John",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "stand-for-truth",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "stand-for-truth",
   "teachingNote": "Reach for this when your child is afraid to say what they know and needs the man who said, \"Now I see.\"",
   "teaser": "Jesus saw a man who had been blind since the day he was born. Jesus spat on the ground and made a little mud. He put the mud on the man’s eyes. “Go wash in the pool of Siloam.” The man went and washed, and he came…",
   "wordCount": 125
  },
  {
   "id": "b16-w4-n5",
   "title": "The Sheep Know His Voice",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 4,
   "night": 5,
   "scripture": "John 10:1–10",
   "scriptureBook": "John",
   "traveler": "beau",
   "feeling": "connected",
   "virtues": [
    "heeding-counsel",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "heeding-counsel",
   "teachingNote": "Reach for this when your child hears many voices and needs to learn which one is the Shepherd's.",
   "teaser": "Jesus told the people about a sheepfold, a safe pen where sheep stayed. It had one door. A robber sneaks in some other way. But the shepherd comes in through the door. He calls each sheep by name and leads them out…",
   "wordCount": 124
  },
  {
   "id": "b16-w4-n6",
   "title": "I Am the Good Shepherd",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 4,
   "night": 6,
   "scripture": "John 10:11–18",
   "scriptureBook": "John",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "identity",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child wonders if anyone would stay for them and needs the shepherd who stays when the wolf comes.",
   "teaser": "Jesus said, “I am the good shepherd.” A shepherd takes care of sheep, and everyone listening knew it. Jesus said a hired man only watches sheep for pay. When a wolf comes, he runs away. He does not really care about…",
   "wordCount": 122
  },
  {
   "id": "b16-w4-n7",
   "title": "No One Can Take Them from My Hand",
   "volume": "nt",
   "book": 16,
   "bookTitle": "The Good Shepherd",
   "month": "April",
   "week": 4,
   "night": 7,
   "scripture": "John 10:22–30",
   "scriptureBook": "John",
   "traveler": "wren",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child is scared of losing their way and needs to know no one can take them from Jesus's hand.",
   "teaser": "It was winter. Jesus was walking in the temple, along a covered porch called Solomon’s porch. Some leaders gathered around Him. “If You are the Christ, tell us plainly.” Jesus said, “I told you, and you did not…",
   "wordCount": 119
  },
  {
   "id": "b17-w1-n1",
   "title": "Keep Your Lamps Burning",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 1,
   "night": 1,
   "scripture": "Luke 12:35–40",
   "scriptureBook": "Luke",
   "traveler": "wren",
   "feeling": "eager",
   "virtues": [
    "diligence",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "diligence",
   "teachingNote": "Reach for this when your child wonders how to get ready for Jesus and needs the picture of a lamp kept burning.",
   "teaser": "Jesus told His friends, “Keep your lamps burning.” Long ago, there were no light switches. People lit little clay lamps of oil to see at night. Jesus said, “Be like servants waiting up for their master. He is coming…",
   "wordCount": 124
  },
  {
   "id": "b17-w1-n2",
   "title": "Take the Lowest Seat",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 1,
   "night": 2,
   "scripture": "Luke 14:7–11",
   "scriptureBook": "Luke",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "humility",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child rushes for the best seat and needs Jesus's story about taking the lowest one.",
   "teaser": "Jesus went to dinner at an important leader’s house. He watched the guests come in. Each one hurried to the best seat, the place for the honored guest. So Jesus told a little story. “At a wedding feast, do not take…",
   "wordCount": 122
  },
  {
   "id": "b17-w1-n3",
   "title": "Come to the Supper",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 1,
   "night": 3,
   "scripture": "Luke 14:12–24",
   "scriptureBook": "Luke",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "kindness",
    "generosity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child leaves someone out and needs the feast where everyone is invited.",
   "teaser": "Jesus said, “When you make a feast, invite the poor. Invite people who cannot walk or see. They cannot pay you back, but you will be blessed.” Then Jesus told a story. A man made a great supper and invited many. At…",
   "wordCount": 125
  },
  {
   "id": "b17-w1-n4",
   "title": "The Lost Coin",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 1,
   "night": 4,
   "scripture": "Luke 15:1–10",
   "scriptureBook": "Luke",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "identity",
    "repentance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels lost or far away and needs the woman who swept until the coin was found.",
   "teaser": "People who had done wrong came close to hear Jesus. Some leaders grumbled, “This man welcomes sinners and even eats with them!” So Jesus told a little story. A woman had ten silver coins, and she lost one! She lit a…",
   "wordCount": 124
  },
  {
   "id": "b17-w1-n5",
   "title": "The Father Ran",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 1,
   "night": 5,
   "scripture": "Luke 15:11–24",
   "scriptureBook": "Luke",
   "traveler": "beau",
   "feeling": "loved",
   "virtues": [
    "repentance",
    "forgiveness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child is scared to come back after doing wrong and needs the father who ran.",
   "teaser": "Jesus told a story. A father had two sons. The younger son said, “Give me my share of your money now.” He went far away and wasted it all. Then food ran out in that land. He got a job feeding pigs. He was so hungry…",
   "wordCount": 124
  },
  {
   "id": "b17-w1-n6",
   "title": "One Came Back",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 1,
   "night": 6,
   "scripture": "Luke 17:11–19",
   "scriptureBook": "Luke",
   "traveler": "wren",
   "feeling": "grateful",
   "virtues": [
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child forgets to say thank you and needs the one man who came back to Jesus.",
   "teaser": "Jesus was walking to Jerusalem. Ten men with a skin sickness called leprosy stood far away. That sickness meant they had to stay away from everyone. They called out, “Jesus, Master, have mercy on us!” Jesus said…",
   "wordCount": 122
  },
  {
   "id": "b17-w1-n7",
   "title": "Lazarus, Come Forth",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 1,
   "night": 7,
   "scripture": "John 11:1–7, 17–44",
   "scriptureBook": "John",
   "traveler": "willow",
   "feeling": "comforted",
   "virtues": [
    "compassion",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "compassion",
   "teachingNote": "Reach for this when your child is sad about someone they miss and needs to know Jesus wept, then called Lazarus out.",
   "teaser": "Jesus loved three friends in Bethany: Mary, Martha, and their brother Lazarus. Then Lazarus got very sick. By the time Jesus came, Lazarus had died. Martha said, “Lord, if You had been here, my brother would not…",
   "wordCount": 123
  },
  {
   "id": "b17-w2-n1",
   "title": "Let the Little Children Come",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 2,
   "night": 1,
   "scripture": "Matthew 19:13–15; Mark 10:13–16",
   "scriptureBook": "Matthew",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "identity",
    "reverence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels too little to matter and needs Jesus's words, \"Let the little children come.\"",
   "teaser": "People brought their little children to Jesus. They wanted Him to put His hands on them and bless them. They were little children, just like you. But Jesus’s disciples, His close friends, told the people to stop…",
   "wordCount": 122
  },
  {
   "id": "b17-w2-n2",
   "title": "What Lack I Yet?",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 2,
   "night": 2,
   "scripture": "Matthew 19:16–22",
   "scriptureBook": "Matthew",
   "traveler": "beau",
   "feeling": "confused",
   "virtues": [
    "contentment",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "contentment",
   "teachingNote": "Reach for this when your child can't let go of a thing they love and needs the young man Jesus loved.",
   "teaser": "A young man asked Jesus, “How can I live with Heavenly Father forever?” Jesus said, “Keep the commandments. Do not hurt anyone. Do not steal or lie. Honor your father and mother. Love your neighbor.” The young man…",
   "wordCount": 123
  },
  {
   "id": "b17-w2-n3",
   "title": "A Camel Through a Needle",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 2,
   "night": 3,
   "scripture": "Matthew 19:23–26",
   "scriptureBook": "Matthew",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "faith",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child thinks something is impossible and needs the camel and the needle's tiny eye.",
   "teaser": "The rich young man went away sad. Jesus said, “It is hard for a rich man to get into heaven.” Then Jesus gave His friends a picture to remember. “It is easier for a camel to go through the eye of a needle.” A camel…",
   "wordCount": 123
  },
  {
   "id": "b17-w2-n4",
   "title": "Workers in the Vineyard",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 2,
   "night": 4,
   "scripture": "Matthew 20:1–16",
   "scriptureBook": "Matthew",
   "traveler": "wren",
   "feeling": "jealous",
   "virtues": [
    "contentment",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "contentment",
   "teachingNote": "Reach for this when your child cries \"not fair\" over what someone else got and needs the generous vineyard owner.",
   "teaser": "Jesus told a little story. A man had a vineyard, a big garden of grapes. One morning, he hired workers and promised each a silver coin. He hired more at nine o’clock, at noon, and at three. At five o’clock, with one…",
   "wordCount": 124
  },
  {
   "id": "b17-w2-n5",
   "title": "The Greatest Is the Servant",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 2,
   "night": 5,
   "scripture": "Matthew 20:20–28",
   "scriptureBook": "Matthew",
   "traveler": "willow",
   "feeling": "happy",
   "virtues": [
    "service",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child wants to be first and needs Jesus's answer: the greatest is the servant.",
   "teaser": "The mother of James and John came to Jesus with her sons. She knelt and asked, “Please let my sons sit by You in Your kingdom.” She wanted them to be most important. Jesus said, “You do not know what you are…",
   "wordCount": 125
  },
  {
   "id": "b17-w2-n6",
   "title": "Bartimaeus Shouts",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 2,
   "night": 6,
   "scripture": "Mark 10:46–52",
   "scriptureBook": "Mark",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "courage",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child is told to hush and needs Bartimaeus, who called to Jesus even louder.",
   "teaser": "Jesus was leaving the city of Jericho with a big crowd. A blind man named Bartimaeus sat by the road, asking for money. He heard that Jesus was passing by. So he shouted, “Jesus, Son of David, have mercy on me!” He…",
   "wordCount": 125
  },
  {
   "id": "b17-w2-n7",
   "title": "Two Men Went to Pray",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 2,
   "night": 7,
   "scripture": "Luke 18:9–14",
   "scriptureBook": "Luke",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "humility",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child compares themselves to others and needs the tax collector's honest prayer.",
   "teaser": "Some people thought they were better than everyone else. So Jesus told a story. “Two men went to the temple, Heavenly Father’s holy house, to pray. One was a Pharisee, a leader who kept many rules. The other was a…",
   "wordCount": 125
  },
  {
   "id": "b17-w3-n1",
   "title": "Out of the Mouths of Children",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 3,
   "night": 1,
   "scripture": "Matthew 21:12–16",
   "scriptureBook": "Matthew",
   "traveler": "beau",
   "feeling": "happy",
   "virtues": [
    "reverence",
    "worship-together"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child thinks their praise is too small and needs the children shouting Hosanna in the temple.",
   "teaser": "Jesus went into the temple, Heavenly Father’s holy house. People were selling things there. Jesus sent them out, because the temple was for prayer. People who could not see or walk came to Him. He made them well…",
   "wordCount": 116
  },
  {
   "id": "b17-w3-n2",
   "title": "The Two Sons",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 3,
   "night": 2,
   "scripture": "Matthew 21:28–32",
   "scriptureBook": "Matthew",
   "traveler": "wren",
   "feeling": "eager",
   "virtues": [
    "obedience",
    "repentance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child says yes but doesn't do it and needs the son who changed his mind and went.",
   "teaser": "Some temple leaders asked Jesus hard questions to trap Him. So Jesus told them a little story. “A man had two sons. He told the first, ‘Go work in my grape field.’ The son said, ‘I will not!’ But later he was sorry…",
   "wordCount": 123
  },
  {
   "id": "b17-w3-n3",
   "title": "The Greatest Commandment",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 3,
   "night": 3,
   "scripture": "Matthew 22:34–40",
   "scriptureBook": "Matthew",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "kindness",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child asks what matters most and needs Jesus's answer: love God and love your neighbor.",
   "teaser": "Some leaders kept trying to trap Jesus with hard questions. One man asked, “Teacher, which commandment is the greatest?” Heavenly Father had given many rules, called commandments. The man was testing Jesus to see…",
   "wordCount": 123
  },
  {
   "id": "b17-w3-n4",
   "title": "Have Faith and Forgive",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 3,
   "night": 4,
   "scripture": "Mark 11:12–14, 20–25",
   "scriptureBook": "Mark",
   "traveler": "beau",
   "feeling": "safe",
   "virtues": [
    "faith",
    "forgiveness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child prays and wonders if it works and needs Jesus's words to believe and forgive.",
   "teaser": "One morning, Jesus was hungry. He saw a fig tree full of leaves. But it had no figs at all. Jesus said to the tree, “No one will eat fruit from you ever again.” His friends heard Him. The next morning, they walked…",
   "wordCount": 113
  },
  {
   "id": "b17-w3-n5",
   "title": "Zacchaeus in the Tree",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 3,
   "night": 5,
   "scripture": "Luke 19:1–10",
   "scriptureBook": "Luke",
   "traveler": "scout",
   "feeling": "loved",
   "virtues": [
    "repentance",
    "honesty"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child feels unseen or in trouble and needs Jesus stopping under Zacchaeus's tree.",
   "teaser": "Jesus came to Jericho. A rich man named Zacchaeus lived there, the boss of the tax collectors. Zacchaeus wanted to see Jesus. But he was short, and the crowd was big. So he ran ahead and climbed a sycamore tree. Now…",
   "wordCount": 125
  },
  {
   "id": "b17-w3-n6",
   "title": "Mary's Gift",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 3,
   "night": 6,
   "scripture": "John 12:1–8",
   "scriptureBook": "John",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "generosity",
    "reverence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child wants to give Jesus something and needs Mary's very best gift of perfume.",
   "teaser": "Jesus came to Bethany to see His friends Mary, Martha, and Lazarus. They made Him a supper. Then Mary did something surprising. She took sweet perfume that cost a lot of money. She poured it on Jesus’s feet. Then…",
   "wordCount": 115
  },
  {
   "id": "b17-w3-n7",
   "title": "A Grain of Wheat",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 3,
   "night": 7,
   "scripture": "John 12:20–26",
   "scriptureBook": "John",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "patience",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "patience",
   "teachingNote": "Reach for this when your child can't see good coming yet and needs the seed that grows in the dark ground.",
   "teaser": "Visitors called Greeks came from far away to Jerusalem for a feast. They told Philip, “Sir, we would like to see Jesus.” Philip and Andrew told Jesus. Jesus knew the time was near for Him to give His life. So Jesus…",
   "wordCount": 118
  },
  {
   "id": "b17-w4-n1",
   "title": "My Words Shall Not Pass Away",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 4,
   "night": 1,
   "scripture": "Joseph Smith—Matthew 1:35–37; Matthew 24:30–35",
   "scriptureBook": "Joseph Smith—Matthew",
   "traveler": "wren",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "love-of-scripture"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child hears scary news and needs Jesus's promise that His words will never pass away.",
   "teaser": "Jesus sat with His friends on a hill called the Mount of Olives. They asked, “When will You come again?” Jesus said hard times would come first. Some people would try to trick others. But He said, “See that you are…",
   "wordCount": 122
  },
  {
   "id": "b17-w4-n2",
   "title": "Ten Lamps",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 4,
   "night": 2,
   "scripture": "Matthew 25:1–13",
   "scriptureBook": "Matthew",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "diligence",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "diligence",
   "teachingNote": "Reach for this when your child wants to get ready all at once and needs the wise ones who brought extra oil.",
   "teaser": "Jesus told a little story about ten young women waiting for a groom. He would come at night, so they carried oil lamps. Five wise ones brought extra oil in jars. Five foolish ones brought none. The groom took a long…",
   "wordCount": 123
  },
  {
   "id": "b17-w4-n3",
   "title": "Well Done, Good and Faithful Servant",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 4,
   "night": 3,
   "scripture": "Matthew 25:14–30",
   "scriptureBook": "Matthew",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "diligence",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "diligence",
   "teachingNote": "Reach for this when your child hides a gift because they're afraid and needs the servants who made theirs grow.",
   "teaser": "Jesus told a little story. A man went on a long trip. He gave his helpers big bags of silver, called talents. One helper got five talents, one got two, and one got one. The first two worked hard and doubled theirs…",
   "wordCount": 123
  },
  {
   "id": "b17-w4-n4",
   "title": "You Did It for Me",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 4,
   "night": 4,
   "scripture": "Matthew 25:31–40",
   "scriptureBook": "Matthew",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "service",
    "compassion"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child sees someone in need and needs to know helping them is helping Jesus.",
   "teaser": "Jesus told His friends about the day He will come again as King. He will say to the good people, “I was hungry, and you fed Me. I was thirsty, and you gave Me a drink.” “I was a stranger, and you took Me in. I…",
   "wordCount": 118
  },
  {
   "id": "b17-w4-n5",
   "title": "The Widow's Two Coins",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 4,
   "night": 5,
   "scripture": "Mark 12:41–44",
   "scriptureBook": "Mark",
   "traveler": "willow",
   "feeling": "grateful",
   "virtues": [
    "generosity",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child thinks a small gift doesn't count and needs the widow's two tiny coins.",
   "teaser": "Jesus sat in the temple, Heavenly Father’s holy house. He watched people put money in the offering box. Many rich people dropped in big handfuls of coins. Clink, clink, clink! Then a poor woman came. Her husband had…",
   "wordCount": 119
  },
  {
   "id": "b17-w4-n6",
   "title": "Watch!",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 4,
   "night": 6,
   "scripture": "Mark 13:32–37",
   "scriptureBook": "Mark",
   "traveler": "beau",
   "feeling": "eager",
   "virtues": [
    "diligence",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "diligence",
   "teachingNote": "Reach for this when your child wonders how to be ready for Jesus and needs the doorkeeper told to watch.",
   "teaser": "Jesus told His friends that He will come again. But no one knows the day or the hour, not even the angels. Only Heavenly Father knows. So Jesus said, “Watch and pray.” Then He told a tiny story. “A man went on a…",
   "wordCount": 118
  },
  {
   "id": "b17-w4-n7",
   "title": "Lift Up Your Heads",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 4,
   "night": 7,
   "scripture": "Luke 21:25–28, 33",
   "scriptureBook": "Luke",
   "traveler": "wren",
   "feeling": "eager",
   "virtues": [
    "hope",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child feels the world is scary and needs Jesus's words: lift up your head.",
   "teaser": "Jesus told His friends about signs that will come before He returns. There will be signs in the sun, moon, and stars. The sea will roar, and many people will be afraid. But then Jesus told the best part. People will…",
   "wordCount": 112
  },
  {
   "id": "b17-w5-n1",
   "title": "She Did What She Could",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 5,
   "night": 1,
   "scripture": "Mark 14:3–9",
   "scriptureBook": "Mark",
   "traveler": "willow",
   "feeling": "grateful",
   "virtues": [
    "generosity",
    "reverence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child hears their gift called a waste and needs the woman who did what she could.",
   "teaser": "Jesus was eating supper at Simon’s house, in a little town called Bethany. A woman came in with a small white stone jar of costly perfume. She broke it open and poured it all on Jesus’s head. Some people there…",
   "wordCount": 120
  },
  {
   "id": "b17-w5-n2",
   "title": "This Is My Body",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 5,
   "night": 2,
   "scripture": "Matthew 26:17–19, 26–30",
   "scriptureBook": "Matthew",
   "traveler": "wren",
   "feeling": "grateful",
   "virtues": [
    "reverence",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child asks why we take the sacrament and needs the bread Jesus broke at supper.",
   "teaser": "It was time for the Passover supper. It helped people remember how Heavenly Father saved them. Jesus’s friends got a room ready in the city. That evening, Jesus sat down to eat with His twelve friends. While they…",
   "wordCount": 116
  },
  {
   "id": "b17-w5-n3",
   "title": "Watch with Me",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 5,
   "night": 3,
   "scripture": "Matthew 26:36–41",
   "scriptureBook": "Matthew",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "prayer",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child is tired but wants to do right and needs Jesus asking His friends to watch with Him.",
   "teaser": "After supper, Jesus took Peter, James, and John into a garden called Gethsemane. Jesus’s heart felt heavy. He said, “Stay here and watch with Me.” Then He went a little farther to pray. He called the hard thing…",
   "wordCount": 119
  },
  {
   "id": "b17-w5-n4",
   "title": "Put Away Your Sword",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 5,
   "night": 4,
   "scripture": "Matthew 26:47–54",
   "scriptureBook": "Matthew",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "self-control",
    "peacemaking"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "self-control",
   "teachingNote": "Reach for this when your child wants to hit back and needs Jesus saying, \"Put your sword away.\"",
   "teaser": "A big crowd came with swords and sticks. Judas, one of Jesus’s twelve friends, came with them. The men grabbed Jesus. One of Jesus’s friends swung his sword and cut off a man’s ear. He wanted to fight for Jesus. But…",
   "wordCount": 124
  },
  {
   "id": "b17-w5-n5",
   "title": "Before the Rooster Crows",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 5,
   "night": 5,
   "scripture": "Mark 14:27–31, 66–72",
   "scriptureBook": "Mark",
   "traveler": "willow",
   "feeling": "guilty",
   "virtues": [
    "repentance",
    "forgiveness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child feels sorry for a choice and needs Peter, who wept and was forgiven.",
   "teaser": "Peter said, “I will never leave You!” Jesus said a rooster would crow two times that night. Before it did, Peter would say three times he did not know Jesus. Later, men took Jesus away. Peter sat outside, warming…",
   "wordCount": 123
  },
  {
   "id": "b17-w5-n6",
   "title": "Happy If You Do Them",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 5,
   "night": 6,
   "scripture": "John 13:1–5, 12–17",
   "scriptureBook": "John",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "service",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child thinks helping is beneath them and needs Jesus kneeling with a towel and bowl.",
   "teaser": "It was almost Passover. Jesus knew He would soon go back to His Father. He loved His friends to the end. So Jesus got up from supper. He tied a towel around His waist and poured water into a bowl. Then He washed His…",
   "wordCount": 118
  },
  {
   "id": "b17-w5-n7",
   "title": "A New Commandment",
   "volume": "nt",
   "book": 17,
   "bookTitle": "Let the Little Children Come",
   "month": "May",
   "week": 5,
   "night": 7,
   "scripture": "John 13:31–35",
   "scriptureBook": "John",
   "traveler": "beau",
   "feeling": "connected",
   "virtues": [
    "kindness",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child finds it hard to love someone and needs Jesus's new commandment: love as I loved you.",
   "teaser": "It was Jesus’s last night with His friends before He died. Judas had gone out into the night. Jesus looked at the friends He loved. He called them “little children,” because He loved them so tenderly. He said, “I…",
   "wordCount": 125
  },
  {
   "id": "b18-w1-n1",
   "title": "Let Not Your Heart Be Troubled",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 1,
   "night": 1,
   "scripture": "John 14:1–6",
   "scriptureBook": "John",
   "traveler": "willow",
   "feeling": "calm",
   "virtues": [
    "trust-in-god",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child's heart feels troubled and needs Jesus's promise of a place made ready.",
   "teaser": "It was Jesus’s last night with His friends. He told them He was going away. Their hearts felt worried and heavy. Jesus said, “Do not let your heart be troubled. Believe in Heavenly Father, and believe in Me.” “In My…",
   "wordCount": 117
  },
  {
   "id": "b18-w1-n2",
   "title": "If You Love Me",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 1,
   "night": 2,
   "scripture": "John 14:15–21",
   "scriptureBook": "John",
   "traveler": "beau",
   "feeling": "safe",
   "virtues": [
    "obedience",
    "keeping-promises"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child asks how to show love for Jesus and needs His answer: keep My commandments.",
   "teaser": "On that same last night, Jesus kept talking with His friends. He said, “If you love Me, keep My commandments.” We show love by doing what He asks, not just by saying it. Then Jesus made a promise. He would ask…",
   "wordCount": 124
  },
  {
   "id": "b18-w1-n3",
   "title": "My Peace I Give You",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 1,
   "night": 3,
   "scripture": "John 14:25–27",
   "scriptureBook": "John",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "comfort",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "comfort",
   "teachingNote": "Reach for this when your child feels afraid inside and needs the peace Jesus gives that stays.",
   "teaser": "Soon Jesus would go away. How would His friends remember everything He had taught them? Jesus told them Heavenly Father would send the Comforter, the Holy Ghost. The Holy Ghost would teach them all things. He would…",
   "wordCount": 124
  },
  {
   "id": "b18-w1-n4",
   "title": "I Am the Vine",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 1,
   "night": 4,
   "scripture": "John 15:1–8",
   "scriptureBook": "John",
   "traveler": "scout",
   "feeling": "connected",
   "virtues": [
    "faith",
    "diligence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child wants to do good and needs the branch that stays close to the vine.",
   "teaser": "Grapevines grew all over the land where Jesus lived. Branches grow from the vine, and grapes grow on the branches. So Jesus used a picture His friends knew well. He said, “I am the vine, and you are the branches.”…",
   "wordCount": 119
  },
  {
   "id": "b18-w1-n5",
   "title": "I Have Called You Friends",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 1,
   "night": 5,
   "scripture": "John 15:9–15",
   "scriptureBook": "John",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "identity",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels alone and needs Jesus calling them His friend.",
   "teaser": "Jesus told His friends, “As the Father loves Me, I love you. Stay in My love.” To stay, they should keep His commandments, as He kept His Father’s. He wanted their joy to be full. Then He said, “Love one another, as…",
   "wordCount": 113
  },
  {
   "id": "b18-w1-n6",
   "title": "Be of Good Cheer",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 1,
   "night": 6,
   "scripture": "John 16:20–22, 33",
   "scriptureBook": "John",
   "traveler": "beau",
   "feeling": "happy",
   "virtues": [
    "hope",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child is sad and needs Jesus's promise that sorrow will turn into joy.",
   "teaser": "Jesus told His friends what was coming. “You will be sad. But your sorrow will be turned into joy.” He used a picture they knew. When a baby is born, the mom hurts. But holding her baby, she is so happy she forgets…",
   "wordCount": 115
  },
  {
   "id": "b18-w1-n7",
   "title": "That They May Be One",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 1,
   "night": 7,
   "scripture": "John 17:1–3, 20–23",
   "scriptureBook": "John",
   "traveler": "wren",
   "feeling": "connected",
   "virtues": [
    "family-love",
    "peacemaking"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "family-love",
   "teachingNote": "Reach for this when your child feels the family pulled apart and needs Jesus praying that we would be one.",
   "teaser": "When Jesus finished teaching, He looked up to heaven and prayed. His friends were right there with Him. He said, “Father, the hour has come.” Then He told what living forever is about. It is truly knowing Heavenly…",
   "wordCount": 107
  },
  {
   "id": "b18-w2-n1",
   "title": "The Man with the Water Jar",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 2,
   "night": 1,
   "scripture": "Luke 22:7–13",
   "scriptureBook": "Luke",
   "traveler": "scout",
   "feeling": "safe",
   "virtues": [
    "obedience",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child is asked to follow before they understand and needs the man with the water jar.",
   "teaser": "At the Passover supper, families remembered how Heavenly Father saved His people long ago. Jesus told Peter and John, “Go and get the Passover supper ready.” They asked, “Where should we get it ready?” Jesus gave…",
   "wordCount": 121
  },
  {
   "id": "b18-w2-n2",
   "title": "I Have Prayed for You",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 2,
   "night": 2,
   "scripture": "Luke 22:24–32",
   "scriptureBook": "Luke",
   "traveler": "willow",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child knows a hard thing is coming and needs to know Jesus prays for them already.",
   "teaser": "At the Passover supper, Jesus’s friends started to argue. Each one wanted to be called the greatest. Jesus said, “Kings boss people around, but not you. The greatest should be like the one who serves.” He said, “I…",
   "wordCount": 124
  },
  {
   "id": "b18-w2-n3",
   "title": "An Angel Came to Strengthen Him",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 2,
   "night": 3,
   "scripture": "Luke 22:39–46",
   "scriptureBook": "Luke",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "prayer",
    "perseverance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child faces something too hard and needs the angel sent to strengthen Jesus.",
   "teaser": "After supper, Jesus went to the Mount of Olives with His friends. He told them, “Pray, so you will not give in to doing wrong.” Then He walked a stone’s throw away, knelt down, and prayed. “Father, if You are…",
   "wordCount": 117
  },
  {
   "id": "b18-w2-n4",
   "title": "The Lord Turned and Looked",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 2,
   "night": 4,
   "scripture": "Luke 22:54–62",
   "scriptureBook": "Luke",
   "traveler": "willow",
   "feeling": "comforted",
   "virtues": [
    "repentance",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child has failed and needs Jesus turning to look at Peter with understanding, not anger.",
   "teaser": "Men took Jesus away to the house of the high priest, the temple’s leader. Peter followed far behind. He sat down by a fire with the people there. A girl looked at Peter in the firelight. “This man was with Jesus!”…",
   "wordCount": 124
  },
  {
   "id": "b18-w2-n5",
   "title": "Ye Say That I Am",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 2,
   "night": 5,
   "scripture": "Luke 22:66–71",
   "scriptureBook": "Luke",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "stand-for-truth",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "stand-for-truth",
   "teachingNote": "Reach for this when your child is afraid to say what they believe and needs Jesus bravely saying who He is.",
   "teaser": "When morning came, the leaders of the people met together. They brought Jesus in to question Him. They said, “If You are the Christ, the promised Savior, tell us.” Jesus said, “If I tell you, you will not believe.”…",
   "wordCount": 113
  },
  {
   "id": "b18-w2-n6",
   "title": "Let These Go Their Way",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 2,
   "night": 6,
   "scripture": "John 18:1–9",
   "scriptureBook": "John",
   "traveler": "scout",
   "feeling": "safe",
   "virtues": [
    "courage",
    "compassion"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child needs to know Jesus steps in front of His friends and says, \"Let these go.\"",
   "teaser": "After His prayer, Jesus crossed a little stream into a garden with His friends. Judas, who had turned against Jesus, knew the place. Jesus often went there. Judas came with soldiers and helpers sent by the temple…",
   "wordCount": 125
  },
  {
   "id": "b18-w2-n7",
   "title": "I Came to Tell the Truth",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 2,
   "night": 7,
   "scripture": "John 18:33–38",
   "scriptureBook": "John",
   "traveler": "wren",
   "feeling": "safe",
   "virtues": [
    "identity",
    "stand-for-truth"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child is unsure who they are and needs Jesus, who was sure, before Pilate.",
   "teaser": "The leaders took Jesus to Pilate, the ruler of the land. Pilate asked Him, “Are You the King of the Jews?” Jesus said, “My kingdom is not of this world. If it were, My helpers would fight for Me.” Jesus was not a…",
   "wordCount": 116
  },
  {
   "id": "b18-w3-n1",
   "title": "That Good Man",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 3,
   "night": 1,
   "scripture": "Matthew 27:11–26",
   "scriptureBook": "Matthew",
   "traveler": "beau",
   "feeling": "angry",
   "virtues": [
    "self-control",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "self-control",
   "teachingNote": "Reach for this when your child is upset that something is unfair and needs Jesus, who chose to save us anyway.",
   "teaser": "Jesus stood before Pilate, the ruler from Rome. The leaders said untrue things about Him. Jesus did not answer. At that holiday, Pilate let one prisoner go free. “Should I free Barabbas or Jesus?” he asked. He knew…",
   "wordCount": 124
  },
  {
   "id": "b18-w3-n2",
   "title": "Simon Carried the Cross",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 3,
   "night": 2,
   "scripture": "Mark 15:20–22; Luke 23:26",
   "scriptureBook": "Mark",
   "traveler": "scout",
   "feeling": "connected",
   "virtues": [
    "service",
    "compassion"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child sees someone's load is too heavy and needs Simon carrying the cross.",
   "teaser": "Soldiers led Jesus out of the city toward a hill called Golgotha. They made Him carry a big, heavy wooden cross. On the road came a man named Simon, from a faraway place called Cyrene. He was walking in from the…",
   "wordCount": 114
  },
  {
   "id": "b18-w3-n3",
   "title": "It Is Finished",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 3,
   "night": 3,
   "scripture": "Mark 15:33–39; John 19:28–30",
   "scriptureBook": "Mark",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "reverence",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child asks why Jesus died and needs the hushed words, \"It is finished.\"",
   "teaser": "Jesus was on the cross. It was a very sad day. But Jesus chose it, because He loved us. At noon the sky went dark for three whole hours. Jesus said, “I am thirsty,” and was given sour wine on a sponge. Then Jesus…",
   "wordCount": 117
  },
  {
   "id": "b18-w3-n4",
   "title": "Today in Paradise",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 3,
   "night": 4,
   "scripture": "Luke 23:39–43",
   "scriptureBook": "Luke",
   "traveler": "willow",
   "feeling": "comforted",
   "virtues": [
    "repentance",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child thinks it is too late to change and needs the man Jesus promised Paradise.",
   "teaser": "Two other men were on crosses beside Jesus. They had done wrong things. Jesus had done nothing wrong at all. One man made fun of Jesus. “If You are the Christ, save Yourself and us!” he said. But the other man said…",
   "wordCount": 124
  },
  {
   "id": "b18-w3-n5",
   "title": "The Women Who Waited",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 3,
   "night": 5,
   "scripture": "Luke 23:49–56",
   "scriptureBook": "Luke",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "patience",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "patience",
   "teachingNote": "Reach for this when your child is sad and waiting and needs the women who did what was right until Sunday came.",
   "teaser": "After Jesus died, His friends and the women from Galilee stood far off. They watched, and they loved Him. Then a good man named Joseph asked Pilate for Jesus’s body. Joseph had not agreed with the leaders. He…",
   "wordCount": 120
  },
  {
   "id": "b18-w3-n6",
   "title": "Behold Thy Mother",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 3,
   "night": 6,
   "scripture": "John 19:25–27",
   "scriptureBook": "John",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "family-love",
    "honoring-parents"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "family-love",
   "teachingNote": "Reach for this when your child wonders how to care for family and needs Jesus caring for His mother from the cross.",
   "teaser": "Near the cross stood Jesus’s mother, Mary, with her sister and Mary Magdalene. John, the friend Jesus loved, stood there too. They stayed close on that very hard day. Jesus looked down and saw His mother. Even in…",
   "wordCount": 124
  },
  {
   "id": "b18-w3-n7",
   "title": "Nicodemus Comes in the Daylight",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 3,
   "night": 7,
   "scripture": "John 19:38–42",
   "scriptureBook": "John",
   "traveler": "scout",
   "feeling": "brave",
   "virtues": [
    "courage",
    "stand-for-truth"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child wants to hide that they follow Jesus and needs Nicodemus coming in the daylight.",
   "teaser": "After Jesus died, Joseph went to Pilate and asked for Jesus’s body. Joseph followed Jesus, but secretly, because he feared the leaders. Then Nicodemus came too. Long ago, he had come to see Jesus at night, in the…",
   "wordCount": 123
  },
  {
   "id": "b18-w4-n1",
   "title": "He Is Risen!",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 4,
   "night": 1,
   "scripture": "Matthew 28:1–10",
   "scriptureBook": "Matthew",
   "traveler": "scout",
   "feeling": "excited",
   "virtues": [
    "hope",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child asks about Easter and needs the angel's news: He is not here, He is risen!",
   "teaser": "Very early Sunday, as the sky grew light, two women went to Jesus’s tomb. They were Mary Magdalene and the other Mary. Suddenly the ground shook! An angel came down from heaven and rolled the big stone away. He sat…",
   "wordCount": 125
  },
  {
   "id": "b18-w4-n2",
   "title": "Tell His Disciples, and Peter",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 4,
   "night": 2,
   "scripture": "Mark 16:1–8",
   "scriptureBook": "Mark",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "hope",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child feels forgotten after a mistake and needs Jesus saying, \"and Peter.\"",
   "teaser": "After the day of rest, three women bought sweet spices for Jesus’s body. Very early on Sunday, as the sun came up, they walked to His tomb. On the way they worried. “Who will roll the stone away for us?” It was much…",
   "wordCount": 125
  },
  {
   "id": "b18-w4-n3",
   "title": "Our Hearts Burned Within Us",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 4,
   "night": 3,
   "scripture": "Luke 24:13–35",
   "scriptureBook": "Luke",
   "traveler": "wren",
   "feeling": "connected",
   "virtues": [
    "love-of-scripture",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this when your child feels warm hearing about Jesus and needs to know that is the Holy Ghost.",
   "teaser": "That same Sunday, two of Jesus’s followers walked to a village called Emmaus. They felt sad and talked about all that had happened. Then Jesus Himself came and walked with them. But they did not know it was Him…",
   "wordCount": 124
  },
  {
   "id": "b18-w4-n4",
   "title": "Carried Up into Heaven",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 4,
   "night": 4,
   "scripture": "Luke 24:44–53",
   "scriptureBook": "Luke",
   "traveler": "beau",
   "feeling": "loved",
   "virtues": [
    "worship-together",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "worship-together",
   "teachingNote": "Reach for this when your child misses Jesus and needs Him lifting His hands to bless His friends.",
   "teaser": "The risen Jesus met with His friends. He said all the scriptures written about Him had to come true. Then He helped them understand. “You are My witnesses,” Jesus said. A witness saw something true and tells others…",
   "wordCount": 125
  },
  {
   "id": "b18-w4-n5",
   "title": "So Send I You",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 4,
   "night": 5,
   "scripture": "John 20:19–23",
   "scriptureBook": "John",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "service",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child feels too small to share Jesus and needs to hear: so send I you.",
   "teaser": "On the first Easter evening, Jesus’s friends sat together in a room. The doors were shut tight, because they were afraid of the leaders. Then Jesus came and stood right in the middle of them! “Peace be unto you,” He…",
   "wordCount": 125
  },
  {
   "id": "b18-w4-n6",
   "title": "It Is the Lord!",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 4,
   "night": 6,
   "scripture": "John 21:1–14",
   "scriptureBook": "John",
   "traveler": "beau",
   "feeling": "eager",
   "virtues": [
    "faith",
    "heeding-counsel"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child tried and caught nothing and needs Jesus saying, \"Cast the net on the right side.\"",
   "teaser": "One day Peter and six of Jesus’s friends went fishing. They fished all night and caught nothing. At sunrise, a man on the shore called, “Children, have you caught any fish?” They did not know it was Jesus. “No,”…",
   "wordCount": 125
  },
  {
   "id": "b18-w4-n7",
   "title": "Feed My Sheep",
   "volume": "nt",
   "book": 18,
   "bookTitle": "He Is Risen!",
   "month": "June",
   "week": 4,
   "night": 7,
   "scripture": "John 21:15–17",
   "scriptureBook": "John",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "service",
    "forgiveness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child messed up and wonders if Jesus still trusts them, and needs \"Feed My sheep.\"",
   "teaser": "After breakfast by the sea, Jesus turned to Peter. Peter had said three times he did not know Jesus. Now Jesus asked him one question, three times. “Peter, do you love Me?” “Yes, Lord. You know I love You.” Jesus…",
   "wordCount": 123
  },
  {
   "id": "b19-w1-n1",
   "title": "Ye Shall Be Witnesses",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 1,
   "night": 1,
   "scripture": "Acts 1:1–11",
   "scriptureBook": "Acts",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "stand-for-truth",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "stand-for-truth",
   "teachingNote": "Reach for this when your child wonders if they are too little to tell others about Jesus, and needs to hear they can be His witness too.",
   "teaser": "After Jesus came back to life, He visited His apostles for forty days. He taught them about Heavenly Father’s kingdom. Then Jesus said, “You will be My witnesses.” A witness sees something true, then tells others…",
   "wordCount": 124
  },
  {
   "id": "b19-w1-n2",
   "title": "The Day of Pentecost",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 1,
   "night": 2,
   "scripture": "Acts 2:1–8, 14, 41",
   "scriptureBook": "Acts",
   "traveler": "beau",
   "feeling": "amazed",
   "virtues": [
    "wonder",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wonder",
   "teachingNote": "Reach for this when your child asks what the Holy Ghost is like, and would love the picture of rushing wind and little flames.",
   "teaser": "Jesus’s friends were all together in one house. It was a feast day called Pentecost. Suddenly a sound came from heaven, like a big rushing wind. It filled the whole house! Then something like little flames of fire…",
   "wordCount": 122
  },
  {
   "id": "b19-w1-n3",
   "title": "What Shall We Do?",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 1,
   "night": 3,
   "scripture": "Acts 2:37–42, 44–47",
   "scriptureBook": "Acts",
   "traveler": "willow",
   "feeling": "happy",
   "virtues": [
    "generosity",
    "worship-together"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child holds tight to their things, and needs to see how sharing made the first believers' hearts glad.",
   "teaser": "Peter told a big crowd all about Jesus. Their hearts felt poked awake inside. They asked Peter, “What shall we do?” Peter said, “Repent, and be baptized.” To repent is to feel sorry, turn around, and choose the…",
   "wordCount": 119
  },
  {
   "id": "b19-w1-n4",
   "title": "Silver and Gold Have I None",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 1,
   "night": 4,
   "scripture": "Acts 3:1–10",
   "scriptureBook": "Acts",
   "traveler": "wren",
   "feeling": "happy",
   "virtues": [
    "generosity",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child thinks they have nothing to give, and needs to hear Peter say, \"Such as I have give I thee.\"",
   "teaser": "Peter and John went to the temple to pray. By a gate called Beautiful sat a man who had never walked. Every day, people carried him there to ask for money. He asked Peter and John for money. Peter said, “Look at…",
   "wordCount": 123
  },
  {
   "id": "b19-w1-n5",
   "title": "We Cannot but Speak",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 1,
   "night": 5,
   "scripture": "Acts 4:1–3, 7–10, 18–20",
   "scriptureBook": "Acts",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "stand-for-truth",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "stand-for-truth",
   "teachingNote": "Reach for this when your child feels shy about saying what is true, and needs Peter and John's brave words: we cannot stop speaking.",
   "teaser": "Peter and John taught that Jesus had risen from the dead. The temple leaders did not like it. They put Peter and John in prison for the night. The next day the leaders asked, “How did you make the man walk?” Peter…",
   "wordCount": 122
  },
  {
   "id": "b19-w1-n6",
   "title": "Of One Heart",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 1,
   "night": 6,
   "scripture": "Acts 4:23–24, 31–37",
   "scriptureBook": "Acts",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "generosity",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child says \"Mine!\" and needs the picture of Barnabas laying all his field money at the apostles' feet.",
   "teaser": "Peter and John went back to their friends. Everyone prayed together, and the place shook! They were all filled with the Holy Ghost. All the believers were of one heart and one soul. They loved each other like one…",
   "wordCount": 120
  },
  {
   "id": "b19-w1-n7",
   "title": "The Angel Opened the Doors",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 1,
   "night": 7,
   "scripture": "Acts 5:17–21, 27–29, 40–42",
   "scriptureBook": "Acts",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "obedience",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child feels pushed to go along with others, and needs to hear the apostles choose to obey Heavenly Father first.",
   "teaser": "The apostles kept teaching about Jesus. The angry high priest put them in prison. But that night an angel of the Lord opened the prison doors! “Go to the temple,” the angel said. “Tell the people all the words of…",
   "wordCount": 122
  },
  {
   "id": "b19-w2-n1",
   "title": "Seven Helpers Are Chosen",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 2,
   "night": 1,
   "scripture": "Acts 6:1–8",
   "scriptureBook": "Acts",
   "traveler": "beau",
   "feeling": "eager",
   "virtues": [
    "service",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child notices someone left out, and needs to see seven helpers chosen so no widow was forgotten.",
   "teaser": "More and more people believed in Jesus. Each day, food was shared with widows, women whose husbands had died. But some of these widows were being forgotten. The twelve apostles called everyone together. “We need to…",
   "wordCount": 120
  },
  {
   "id": "b19-w2-n2",
   "title": "The Face of an Angel",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 2,
   "night": 2,
   "scripture": "Acts 6:8–15; 7:55–60",
   "scriptureBook": "Acts",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "forgiveness",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "forgiveness",
   "teachingNote": "Reach for this when your child has been treated unfairly and wants to get even, and needs to see Stephen look up to Jesus and forgive.",
   "teaser": "Stephen spoke wisely about Jesus. Some men argued with him, but they could not win. So they told lies about him to the leaders. All the leaders looked hard at Stephen. His face looked like the face of an angel! The…",
   "wordCount": 124
  },
  {
   "id": "b19-w2-n3",
   "title": "The Man in the Chariot",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 2,
   "night": 3,
   "scripture": "Acts 8:26–39",
   "scriptureBook": "Acts",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "curiosity",
    "love-of-scripture"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "curiosity",
   "teachingNote": "Reach for this when your child asks a question about the scriptures, and needs to see that asking \"How can I understand?\" brought Philip running.",
   "teaser": "An angel sent a helper named Philip to a desert road. There he saw an important man from far-away Ethiopia, riding in his chariot. The man had come to Jerusalem to worship. He was reading from the prophet Isaiah…",
   "wordCount": 124
  },
  {
   "id": "b19-w2-n4",
   "title": "Saul Sees a Great Light",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 2,
   "night": 4,
   "scripture": "Acts 9:1–9",
   "scriptureBook": "Acts",
   "traveler": "beau",
   "feeling": "guilty",
   "virtues": [
    "humility",
    "repentance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child finds out they were wrong, and needs to see Saul ask Jesus, \"What wilt thou have me to do?\"",
   "teaser": "A man named Saul was mean to the followers of Jesus. He took them away to prison. Then he set out for the city of Damascus. Near Damascus, a light from heaven shone all around him. Saul fell to the ground. A voice…",
   "wordCount": 123
  },
  {
   "id": "b19-w2-n5",
   "title": "Brother Saul",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 2,
   "night": 5,
   "scripture": "Acts 9:10–20",
   "scriptureBook": "Acts",
   "traveler": "willow",
   "feeling": "brave",
   "virtues": [
    "trust-in-god",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child is scared to be kind to someone who was unkind, and needs Ananias walking to Saul and calling him Brother.",
   "teaser": "In Damascus lived Ananias, a follower of Jesus. Jesus spoke to him in a vision. “Go to the street called Straight and find Saul. He is praying.” Ananias was worried. “Lord, this man has hurt Your people! He came…",
   "wordCount": 123
  },
  {
   "id": "b19-w2-n6",
   "title": "Over the Wall in a Basket",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 2,
   "night": 6,
   "scripture": "Acts 9:21–31",
   "scriptureBook": "Acts",
   "traveler": "scout",
   "feeling": "safe",
   "virtues": [
    "kindness",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child feels nobody is on their side, and needs the picture of friends lowering Saul in a basket and Barnabas standing up for him.",
   "teaser": "Saul now taught that Jesus is the Savior Heavenly Father promised. People were amazed. “Didn’t this man hurt Jesus’s followers?” they asked. Some angry men wanted to hurt Saul. They watched the city gates day and…",
   "wordCount": 122
  },
  {
   "id": "b19-w2-n7",
   "title": "Tabitha, Arise",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 2,
   "night": 7,
   "scripture": "Acts 9:36–42",
   "scriptureBook": "Acts",
   "traveler": "wren",
   "feeling": "amazed",
   "virtues": [
    "service",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child wonders if little acts of kindness matter, and needs to see the widows holding up the coats Tabitha made.",
   "teaser": "In Joppa, a town by the sea, lived Tabitha, a follower of Jesus. She was always doing good. She made coats and clothes for widows, women whose husbands had died. One day Tabitha got sick and died. Her friends laid…",
   "wordCount": 121
  },
  {
   "id": "b19-w3-n1",
   "title": "Cornelius's Prayer Is Heard",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 3,
   "night": 1,
   "scripture": "Acts 10:1–8",
   "scriptureBook": "Acts",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "prayer",
    "generosity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child wonders if Heavenly Father hears their prayers, and needs to hear the angel tell Cornelius his prayers were remembered.",
   "teaser": "In a city by the sea lived a man named Cornelius. He was a captain in the Roman army. He and his whole family loved Heavenly Father. Cornelius prayed all the time. He gave lots of help to poor people. One afternoon…",
   "wordCount": 117
  },
  {
   "id": "b19-w3-n2",
   "title": "Peter's Vision of the Sheet",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 3,
   "night": 2,
   "scripture": "Acts 10:9–20",
   "scriptureBook": "Acts",
   "traveler": "wren",
   "feeling": "confused",
   "virtues": [
    "humility",
    "pondering"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child is puzzled by something new, and needs to see Peter think hard about the sheet until he understood.",
   "teaser": "At noon, Peter went up on a flat roof to pray. He was hungry. Heavenly Father showed him a vision, like a dream while awake. Heaven opened, and down came a big sheet, tied at the four corners. Inside were all kinds…",
   "wordCount": 125
  },
  {
   "id": "b19-w3-n3",
   "title": "Everyone Is Welcome",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 3,
   "night": 3,
   "scripture": "Acts 10:24–28, 34–35, 44–48",
   "scriptureBook": "Acts",
   "traveler": "beau",
   "feeling": "connected",
   "virtues": [
    "kindness",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child sees someone who looks or talks differently, and needs to hear Peter learn that Heavenly Father welcomes every nation.",
   "teaser": "Peter went with the men to Cornelius’s house. Cornelius had called his family and friends to listen. Cornelius fell down at Peter’s feet. But Peter lifted him up. “Stand up,” Peter said. “I am just a man, like you.”…",
   "wordCount": 117
  },
  {
   "id": "b19-w3-n4",
   "title": "First Called Christians",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 3,
   "night": 4,
   "scripture": "Acts 11:19–26",
   "scriptureBook": "Acts",
   "traveler": "scout",
   "feeling": "connected",
   "virtues": [
    "identity",
    "worship-together"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child asks what a Christian is, and needs to know the name started in Antioch and belongs to them too.",
   "teaser": "Some of Jesus’s followers moved to a big city called Antioch. They told many people about the Lord Jesus, and a great many believed! The church in Jerusalem heard the happy news. They sent a good man named Barnabas…",
   "wordCount": 115
  },
  {
   "id": "b19-w3-n5",
   "title": "Rhoda Hears Peter Knock",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 3,
   "night": 5,
   "scripture": "Acts 12:1–17",
   "scriptureBook": "Acts",
   "traveler": "willow",
   "feeling": "excited",
   "virtues": [
    "prayer",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child wonders if praying for someone helps, and needs to hear the church pray while the angel led Peter out.",
   "teaser": "King Herod put Peter in prison, with sixteen soldiers to guard him. But the church prayed and prayed for Peter. One night Peter slept between two soldiers, chained up. Suddenly a light shone, and an angel tapped his…",
   "wordCount": 123
  },
  {
   "id": "b19-w3-n6",
   "title": "We Are People Like You",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 3,
   "night": 6,
   "scripture": "Acts 14:8–18",
   "scriptureBook": "Acts",
   "traveler": "wren",
   "feeling": "grateful",
   "virtues": [
    "humility",
    "honesty"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child gets lots of praise, and needs to see Paul say \"We are people like you\" and point everyone to Heavenly Father.",
   "teaser": "Saul, now called Paul, came with Barnabas to a town called Lystra. A man there had never walked. Paul saw that the man had faith to be healed. Paul said loudly, “Stand up on your feet!” The man jumped up and walked…",
   "wordCount": 123
  },
  {
   "id": "b19-w3-n7",
   "title": "Sent by the Holy Ghost",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 3,
   "night": 7,
   "scripture": "Acts 13:1–5, 44–52",
   "scriptureBook": "Acts",
   "traveler": "beau",
   "feeling": "happy",
   "virtues": [
    "obedience",
    "perseverance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child faces a hard day doing something good, and needs to see Barnabas and Saul go when the Holy Ghost sent them.",
   "teaser": "The church in Antioch had good teachers, like Barnabas and Saul. One day they went without food so they could pray. Then the Holy Ghost spoke: “Set apart Barnabas and Saul for My work.” So the church prayed and sent…",
   "wordCount": 119
  },
  {
   "id": "b19-w4-n1",
   "title": "Come Over and Help Us",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 4,
   "night": 1,
   "scripture": "Acts 16:6–15",
   "scriptureBook": "Acts",
   "traveler": "wren",
   "feeling": "eager",
   "virtues": [
    "obedience",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child is disappointed that a plan changed, and needs to see the Spirit say no twice before Paul found where to help.",
   "teaser": "Paul and his friends wanted to teach in one place. But the Holy Ghost said no. They tried another place, and the Spirit said no again. So they came to Troas, by the sea. In a vision that night, Paul saw a man from…",
   "wordCount": 117
  },
  {
   "id": "b19-w4-n2",
   "title": "Songs in the Dark Prison",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 4,
   "night": 2,
   "scripture": "Acts 16:22–34",
   "scriptureBook": "Acts",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "compassion",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "compassion",
   "teachingNote": "Reach for this when your child sees someone hurting, and needs the picture of the jailer gently washing Paul and Silas's hurts.",
   "teaser": "In Philippi, Paul helped a girl, and her masters got angry. Paul and Silas were hurt and put in prison. Their feet were locked in wooden blocks. At midnight, Paul and Silas prayed and sang to Heavenly Father. The…",
   "wordCount": 123
  },
  {
   "id": "b19-w4-n3",
   "title": "They Searched Every Day",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 4,
   "night": 3,
   "scripture": "Acts 17:10–12",
   "scriptureBook": "Acts",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "love-of-scripture",
    "diligence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this when your child hears something and wonders if it is true, and needs to see the Bereans search the scriptures every day.",
   "teaser": "Some people in the city of Thessalonica stirred up trouble. So friends sent Paul and Silas away at night to Berea. In Berea, Paul and Silas taught about Jesus at the meeting house. The people of Berea listened with…",
   "wordCount": 110
  },
  {
   "id": "b19-w4-n4",
   "title": "He Is Not Far from Us",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 4,
   "night": 4,
   "scripture": "Acts 17:22–28, 34",
   "scriptureBook": "Acts",
   "traveler": "beau",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels far from Heavenly Father, and needs to hear Paul tell Athens that He is not far from any one of us.",
   "teaser": "Paul came to Athens, a city full of statues of pretend gods. The people took Paul up a hill. “Tell us your new teaching,” they said. Paul said, “I found an altar here with the words ‘TO THE UNKNOWN GOD.’ You do not…",
   "wordCount": 112
  },
  {
   "id": "b19-w4-n5",
   "title": "Fear Not, Keep Speaking",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 4,
   "night": 5,
   "scripture": "Acts 18:1–11",
   "scriptureBook": "Acts",
   "traveler": "willow",
   "feeling": "brave",
   "virtues": [
    "courage",
    "perseverance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child is afraid to keep trying after unkind words, and needs to hear the Lord tell Paul, \"Be not afraid.\"",
   "teaser": "In the big city of Corinth, Paul met Aquila and his wife, Priscilla. They made tents, and so did Paul! So he stayed and worked with them. Every Sabbath, the day to rest and worship, Paul taught about Jesus. Some…",
   "wordCount": 112
  },
  {
   "id": "b19-w4-n6",
   "title": "The Boy in the Window",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 4,
   "night": 6,
   "scripture": "Acts 20:7–12",
   "scriptureBook": "Acts",
   "traveler": "wren",
   "feeling": "comforted",
   "virtues": [
    "compassion",
    "self-control"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "compassion",
   "teachingNote": "Reach for this when your child is shaken after a scary moment, and needs to see Paul hold Eutychus close and say, \"His life is in him.\"",
   "teaser": "On Sunday in Troas, Jesus’s friends met to break bread and remember Jesus. Paul was leaving the next day. So he taught until midnight. They were upstairs, three floors high, with many lamps. A young man named…",
   "wordCount": 115
  },
  {
   "id": "b19-w4-n7",
   "title": "More Blessed to Give",
   "volume": "nt",
   "book": 19,
   "bookTitle": "Ye Shall Be Witnesses!",
   "month": "July",
   "week": 4,
   "night": 7,
   "scripture": "Acts 20:17–18, 32–38",
   "scriptureBook": "Acts",
   "traveler": "scout",
   "feeling": "loved",
   "virtues": [
    "generosity",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child thinks getting is better than giving, and needs to hear Paul share Jesus's words: more blessed to give.",
   "teaser": "Paul was going far away to Jerusalem. He might never see his friends from Ephesus again. So he asked their church leaders to meet him by the sea. “You know how I lived with you,” Paul said. “I never wanted anyone’s…",
   "wordCount": 116
  },
  {
   "id": "b20-w1-n1",
   "title": "Paul Tells His Story",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 1,
   "night": 1,
   "scripture": "Acts 21:40; 22:1–16",
   "scriptureBook": "Acts",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "stand-for-truth",
    "self-control"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "stand-for-truth",
   "teachingNote": "Reach for this when your child wants to shout back at someone loud, and needs to see Paul wave his hand on the stairs and calmly tell his story.",
   "teaser": "In Jerusalem, an angry crowd grabbed Paul at the temple. Soldiers took him and carried him up the stairs of their fort. Paul stood on the stairs and waved his hand. Everyone grew quiet, and Paul told his story. “I…",
   "wordCount": 115
  },
  {
   "id": "b20-w1-n2",
   "title": "Be of Good Cheer, Paul",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 1,
   "night": 2,
   "scripture": "Acts 23:1–11",
   "scriptureBook": "Acts",
   "traveler": "willow",
   "feeling": "comforted",
   "virtues": [
    "trust-in-god",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels alone after a hard day, and needs to hear that the Lord stood by Paul at night.",
   "teaser": "The captain brought Paul before the leaders. Paul said, “I have tried to do right before Heavenly Father all my life.” Some leaders believed people would live again after they die. Others said no. Paul said, “I am…",
   "wordCount": 121
  },
  {
   "id": "b20-w1-n3",
   "title": "Paul's Nephew Saves the Day",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 1,
   "night": 3,
   "scripture": "Acts 23:12–24",
   "scriptureBook": "Acts",
   "traveler": "scout",
   "feeling": "worried",
   "virtues": [
    "courage",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child knows something is wrong and wonders whether to tell, and needs to see Paul's nephew hurry to the fort.",
   "teaser": "One morning, more than forty men made a mean, secret plan. They promised not to eat or drink until they had hurt Paul. But Paul’s nephew, his sister’s son, heard about the plan. He hurried into the fort and told…",
   "wordCount": 120
  },
  {
   "id": "b20-w1-n4",
   "title": "A Heart Without Offense",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 1,
   "night": 4,
   "scripture": "Acts 24:10–16, 24–25",
   "scriptureBook": "Acts",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "integrity",
    "honesty"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "integrity",
   "teachingNote": "Reach for this when your child is hiding something inside, and needs to hear Paul talk about keeping his conscience clean before everyone.",
   "teaser": "Now Paul stood before Felix, the governor who ruled the land. Men came to say bad things about Paul. “I came to Jerusalem to worship,” Paul said. “I believe what the prophets wrote. I believe the dead will rise…",
   "wordCount": 125
  },
  {
   "id": "b20-w1-n5",
   "title": "Almost Persuaded",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 1,
   "night": 5,
   "scripture": "Acts 26:1–3, 12–18, 27–29",
   "scriptureBook": "Acts",
   "traveler": "beau",
   "feeling": "eager",
   "virtues": [
    "hope",
    "stand-for-truth"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child shared something good and nobody seemed to care, and needs to see Paul keep hoping after King Agrippa said \"almost.\"",
   "teaser": "King Agrippa came to visit the city of Caesarea. Paul was a prisoner there, in chains. The king said, “You may speak.” Paul told about a light brighter than the noon sun. He told about the voice of Jesus. “Jesus…",
   "wordCount": 110
  },
  {
   "id": "b20-w1-n6",
   "title": "The Storm and the Angel",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 1,
   "night": 6,
   "scripture": "Acts 27:13–25, 33–44",
   "scriptureBook": "Acts",
   "traveler": "scout",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "heeding-counsel"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child is scared in a storm, and needs to hear Paul say, \"Be of good cheer,\" because an angel promised none would be lost.",
   "teaser": "Paul sailed toward Rome on a ship with two hundred seventy-six people. Paul warned them it was not safe, but they sailed anyway. Soon a wild wind tossed the ship. For many days there was no sun and no stars…",
   "wordCount": 120
  },
  {
   "id": "b20-w1-n7",
   "title": "Kindness on the Island",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 1,
   "night": 7,
   "scripture": "Acts 28:1–10, 30–31",
   "scriptureBook": "Acts",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "kindness",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child sees someone cold or left out, and needs the picture of the island people building a big fire for strangers.",
   "teaser": "The travelers came to an island called Melita. It was cold and rainy. The kind island people built a big fire for them. Paul gathered sticks for the fire. A snake slid out from the heat and bit his hand! Paul shook…",
   "wordCount": 123
  },
  {
   "id": "b20-w2-n1",
   "title": "A Letter to Rome",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 2,
   "night": 1,
   "scripture": "Romans 1:7–12, 16",
   "scriptureBook": "Romans",
   "traveler": "scout",
   "feeling": "brave",
   "virtues": [
    "stand-for-truth",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "stand-for-truth",
   "teachingNote": "Reach for this when your child feels embarrassed to talk about Jesus, and needs to hear Paul write, \"I am not ashamed of the gospel.\"",
   "teaser": "Paul had not been to Rome yet, but he loved the believers there. So he wrote them a long letter. “Heavenly Father loves you,” Paul wrote. “The whole world is talking about your faith. I pray for you all the time. I…",
   "wordCount": 120
  },
  {
   "id": "b20-w2-n2",
   "title": "While We Were Still Sinners",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 2,
   "night": 2,
   "scripture": "Romans 3:23–24; 5:6–8",
   "scriptureBook": "Romans",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "identity",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child thinks they must be good before they are loved, and needs to hear Christ died for us while we were still sinners.",
   "teaser": "Paul wrote a true thing about every person: “All have sinned.” To sin is to choose something Heavenly Father asked us not to do. Big people and little people all make wrong choices. Nobody is perfect. But Paul had…",
   "wordCount": 116
  },
  {
   "id": "b20-w2-n3",
   "title": "Abraham Believed",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 2,
   "night": 3,
   "scripture": "Romans 4:3, 18–21",
   "scriptureBook": "Romans",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "faith",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child wonders if a promise can really come true, and needs to see old Abraham believe Heavenly Father without wobbling.",
   "teaser": "Paul told the people in Rome about Abraham, from long, long ago. Heavenly Father made Abraham a big promise. Abraham’s family would grow as many as the stars! But Abraham was about one hundred years old. His wife…",
   "wordCount": 121
  },
  {
   "id": "b20-w2-n4",
   "title": "Trouble Grows Patience",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 2,
   "night": 4,
   "scripture": "Romans 5:1–5",
   "scriptureBook": "Romans",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "patience",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "patience",
   "teachingNote": "Reach for this when your child is going through a bumpy time, and needs the picture of hard times as stair steps that grow patience and hope.",
   "teaser": "Paul wrote that because of Jesus, we can have peace with Heavenly Father. Then he said something surprising: “We are glad even in tribulations.” Tribulations are hard, bumpy times. Why would anyone be glad about…",
   "wordCount": 123
  },
  {
   "id": "b20-w2-n5",
   "title": "The Gift",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 2,
   "night": 5,
   "scripture": "Romans 5:15–18; 6:23",
   "scriptureBook": "Romans",
   "traveler": "willow",
   "feeling": "grateful",
   "virtues": [
    "gratitude",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child thinks good things must be earned, and needs to hear that eternal life is a free gift from Heavenly Father.",
   "teaser": "Long ago, Adam, the very first man, made a wrong choice. Because of it, sin and death came into the world. But Paul wrote about a free gift. Jesus Christ gave it, and it is much bigger than Adam’s wrong choice. A…",
   "wordCount": 119
  },
  {
   "id": "b20-w2-n6",
   "title": "Newness of Life",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 2,
   "night": 6,
   "scripture": "Romans 6:3–4, 11",
   "scriptureBook": "Romans",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "repentance",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child asks why people are baptized, and needs the picture of going down like the tomb and coming up new like Easter.",
   "teaser": "Paul wrote to the people about being baptized. A person goes all the way under the water, then comes back up. Going under the water is like Jesus being laid in the tomb. The old you, with its wrong choices, goes…",
   "wordCount": 113
  },
  {
   "id": "b20-w2-n7",
   "title": "His Kindness Leads Us Back",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 2,
   "night": 7,
   "scripture": "Romans 2:4; 1:19–20",
   "scriptureBook": "Romans",
   "traveler": "beau",
   "feeling": "loved",
   "virtues": [
    "repentance",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child is afraid to say sorry, and needs to hear that Heavenly Father's kindness is what pulls us back home.",
   "teaser": "Paul wrote that everyone can see there is a Maker. Look at a mountain, a sunset, or a baby’s tiny fingers. They show us Heavenly Father made them. Then Paul wrote, “The goodness of Heavenly Father leads you to…",
   "wordCount": 112
  },
  {
   "id": "b20-w3-n1",
   "title": "The Good I Want to Do",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 3,
   "night": 1,
   "scripture": "Romans 7:15–25",
   "scriptureBook": "Romans",
   "traveler": "scout",
   "feeling": "brave",
   "virtues": [
    "honesty",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "honesty",
   "teachingNote": "Reach for this when your child keeps making the same mistake, and needs to hear Paul admit his inside tug-of-war and thank Heavenly Father for Jesus.",
   "teaser": "Paul wrote a letter to Jesus’s followers in Rome. He told them something very honest. He wrote, “The good I want to do, I do not do.” And the wrong things he hated? Sometimes he did those instead. Even Paul made…",
   "wordCount": 118
  },
  {
   "id": "b20-w3-n2",
   "title": "Abba, Father",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 3,
   "night": 2,
   "scripture": "Romans 8:14–17",
   "scriptureBook": "Romans",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "identity",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child wonders whose they are, and needs to hear the Spirit whisper they are Heavenly Father's child who can call Him Abba.",
   "teaser": "Paul wrote to Jesus’s followers in Rome. He wanted them to know whose children they were. He said the Holy Ghost leads us and speaks to our hearts. Everyone He leads is a child of Heavenly Father. We do not have to…",
   "wordCount": 119
  },
  {
   "id": "b20-w3-n3",
   "title": "Nothing Can Separate Us",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 3,
   "night": 3,
   "scripture": "Romans 8:31–39",
   "scriptureBook": "Romans",
   "traveler": "beau",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child is afraid something could take Heavenly Father's love away, and needs Paul's list of things that never can.",
   "teaser": "Paul wrote to Jesus’s friends in Rome. Life was hard for them, and some people were cruel to them. So Paul asked a big question. “If Heavenly Father is for us, who can be against us?” He gave us His own Son, Jesus…",
   "wordCount": 121
  },
  {
   "id": "b20-w3-n4",
   "title": "How Beautiful Are the Feet",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 3,
   "night": 4,
   "scripture": "Romans 10:13–15",
   "scriptureBook": "Romans",
   "traveler": "wren",
   "feeling": "eager",
   "virtues": [
    "stand-for-truth",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "stand-for-truth",
   "teachingNote": "Reach for this when your child wants to share good news about Jesus, and needs to hear how beautiful are the feet that carry it.",
   "teaser": "Paul wrote, “Whoever calls on the name of the Lord shall be saved.” Anyone can call on Jesus, and He will save them. But Paul wondered about people who had never heard of Jesus. How could they call on Him? How could…",
   "wordCount": 124
  },
  {
   "id": "b20-w3-n5",
   "title": "Many Members, One Body",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 3,
   "night": 5,
   "scripture": "Romans 12:1–2, 4–8",
   "scriptureBook": "Romans",
   "traveler": "scout",
   "feeling": "connected",
   "virtues": [
    "service",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child thinks their gift is too small, and needs the picture of many body parts each doing their own job.",
   "teaser": "Long ago, people brought animals to the temple as gifts for Heavenly Father. Paul said there was a new kind of gift. He told the believers in Rome, “Give your bodies as a living gift.” Give your hands, your feet…",
   "wordCount": 118
  },
  {
   "id": "b20-w3-n6",
   "title": "Overcome Evil with Good",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 3,
   "night": 6,
   "scripture": "Romans 12:14, 17–21",
   "scriptureBook": "Romans",
   "traveler": "willow",
   "feeling": "calm",
   "virtues": [
    "peacemaking",
    "self-control"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "peacemaking",
   "teachingNote": "Reach for this when your child wants to be mean back, and needs to hear Paul say to overcome evil with good.",
   "teaser": "Paul wrote to the believers in Rome. Some people were being mean to them. Paul told them, “Bless the people who are cruel to you.” That means wish good things for them, not bad things. “If someone is mean to you, do…",
   "wordCount": 124
  },
  {
   "id": "b20-w3-n7",
   "title": "Love Fills Up the Law",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 3,
   "night": 7,
   "scripture": "Romans 13:8–10; 16:1–4",
   "scriptureBook": "Romans",
   "traveler": "wren",
   "feeling": "loved",
   "virtues": [
    "kindness",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child wonders which rule matters most, and needs to hear that loving your neighbor fills up all of them.",
   "teaser": "Paul wrote, “Owe no one anything, except to love each other.” Love is something we always owe. We keep giving it, again and again. Paul remembered Heavenly Father’s rules. Do not steal. Do not hurt anyone. Do not…",
   "wordCount": 123
  },
  {
   "id": "b20-w4-n1",
   "title": "One Team for Jesus",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 4,
   "night": 1,
   "scripture": "1 Corinthians 1:10–13; 3:5–9",
   "scriptureBook": "1 Corinthians",
   "traveler": "beau",
   "feeling": "connected",
   "virtues": [
    "peacemaking",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "peacemaking",
   "teachingNote": "Reach for this when your child is taking sides in a quarrel, and needs to hear Paul say one plants, one waters, and Heavenly Father makes it grow.",
   "teaser": "Paul wrote a letter to Jesus’s followers in Corinth, a city by the sea. Chloe’s family had told him some sad news. The believers were arguing and taking sides. “I follow Paul!” some said. “I follow Apollos!” said…",
   "wordCount": 117
  },
  {
   "id": "b20-w4-n2",
   "title": "Small Things, Big Work",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 4,
   "night": 2,
   "scripture": "1 Corinthians 1:26–29",
   "scriptureBook": "1 Corinthians",
   "traveler": "wren",
   "feeling": "loved",
   "virtues": [
    "identity",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels too small or ordinary to matter, and needs to hear Heavenly Father chooses small things to do big work.",
   "teaser": "The believers in Corinth were not famous. Paul told them to look around at each other. “Not many of you are wise, the way the world thinks,” he said. “Not many are mighty. Not many come from important families.”…",
   "wordCount": 125
  },
  {
   "id": "b20-w4-n3",
   "title": "Eye Hath Not Seen",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 4,
   "night": 3,
   "scripture": "1 Corinthians 2:9–12",
   "scriptureBook": "1 Corinthians",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "wonder",
    "pondering"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wonder",
   "teachingNote": "Reach for this when your child asks what heaven is like, and needs to hear that eye has not seen it, but the Spirit can show our hearts.",
   "teaser": "Paul wrote words people love to say. “Eye has not seen, nor ear heard,” he wrote. Heavenly Father has wonderful things ready for those who love Him. Those things are bigger than anything we have seen or heard, or…",
   "wordCount": 117
  },
  {
   "id": "b20-w4-n4",
   "title": "Milk Before Meat",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 4,
   "night": 4,
   "scripture": "1 Corinthians 3:1–3, 6–7",
   "scriptureBook": "1 Corinthians",
   "traveler": "willow",
   "feeling": "eager",
   "virtues": [
    "humility",
    "patience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child wants to be big right now, and needs the picture of babies drinking milk before they are ready for meat.",
   "teaser": "Paul had taught the believers in Corinth about Jesus. But they were still arguing and jealous, like little children. So Paul wrote, “I could not talk to you as grown-ups. You were like babies in Jesus.” “I fed you…",
   "wordCount": 123
  },
  {
   "id": "b20-w4-n5",
   "title": "You Are a Temple",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 4,
   "night": 5,
   "scripture": "1 Corinthians 3:16–17; 6:19–20",
   "scriptureBook": "1 Corinthians",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "reverence",
    "self-control"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child does not want to take care of their body, and needs to hear that it is a temple of the Holy Ghost.",
   "teaser": "Paul asked the believers in Corinth a question. “Do you not know that you are the temple of Heavenly Father?” A temple is Heavenly Father’s holy house. People keep it clean, quiet, and beautiful, because it is His…",
   "wordCount": 115
  },
  {
   "id": "b20-w4-n6",
   "title": "A Little Leaven",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 4,
   "night": 6,
   "scripture": "1 Corinthians 5:6–8",
   "scriptureBook": "1 Corinthians",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "repentance",
    "integrity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child says a little wrong does not matter, and needs the picture of one pinch of yeast puffing up the whole lump.",
   "teaser": "The believers in Corinth were bragging. But they had let a wrong thing stay among them. Paul asked, “Don’t you know a little leaven leavens the whole lump?” Leaven is yeast, the tiny pinch that makes bread dough…",
   "wordCount": 118
  },
  {
   "id": "b20-w4-n7",
   "title": "Follow Me to Christ",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 4,
   "night": 7,
   "scripture": "1 Corinthians 4:14–17; 11:1",
   "scriptureBook": "1 Corinthians",
   "traveler": "scout",
   "feeling": "safe",
   "virtues": [
    "heeding-counsel",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "heeding-counsel",
   "teachingNote": "Reach for this when your child wonders who to copy, and needs to hear Paul say to follow him as he follows Christ.",
   "teaser": "Paul wrote a tender letter to the believers in Corinth. “I do not write to shame you,” he said. “I warn you as my dear children.” Paul said they might have ten thousand teachers, but not many fathers. Paul had…",
   "wordCount": 124
  },
  {
   "id": "b20-w5-n1",
   "title": "Don't Trip Your Brother",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 5,
   "night": 1,
   "scripture": "1 Corinthians 8:9–13",
   "scriptureBook": "1 Corinthians",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "kindness",
    "self-control"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child wants their way even when it hurts a friend, and needs to hear Paul say he will not make his brother stumble.",
   "teaser": "In Corinth, some meat was first offered to idols, statues that could not help. Some people who loved Jesus said, “Idols are nothing, so the meat is fine.” Others felt it was wrong. Paul agreed the idols were…",
   "wordCount": 124
  },
  {
   "id": "b20-w5-n2",
   "title": "Run the Race",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 5,
   "night": 2,
   "scripture": "1 Corinthians 9:24–27",
   "scriptureBook": "1 Corinthians",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "diligence",
    "self-control"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "diligence",
   "teachingNote": "Reach for this when your child wants to quit a good thing, and needs the picture of a runner who trains hard for a crown that lasts forever.",
   "teaser": "Paul used a running race to teach the people in Corinth. He wrote, “All the runners run, but only one gets the prize. So run to win!” Paul said runners who want to win are careful in everything. They eat well…",
   "wordCount": 118
  },
  {
   "id": "b20-w5-n3",
   "title": "A Way to Escape",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 5,
   "night": 3,
   "scripture": "1 Corinthians 10:12–13",
   "scriptureBook": "1 Corinthians",
   "traveler": "wren",
   "feeling": "brave",
   "virtues": [
    "self-control",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "self-control",
   "teachingNote": "Reach for this when your child feels a pull to do something wrong, and needs to know Heavenly Father always makes a way to escape.",
   "teaser": "Paul sent the people in Corinth a warning and a promise. The warning: “If you think you stand strong, be careful not to fall.” Then the promise. Paul said every person feels temptation, a pull inside to do something…",
   "wordCount": 115
  },
  {
   "id": "b20-w5-n4",
   "title": "In Remembrance of Me",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 5,
   "night": 4,
   "scripture": "1 Corinthians 11:23–26",
   "scriptureBook": "1 Corinthians",
   "traveler": "scout",
   "feeling": "grateful",
   "virtues": [
    "reverence",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child wiggles during the sacrament, and needs the picture of Jesus breaking bread and saying, \"This do in remembrance of me.\"",
   "teaser": "Paul told about the night a false friend turned against Jesus. On that same night, the Lord Jesus took bread. He gave thanks and broke the bread. He said, “Take and eat. This is my body, broken for you. Do this to…",
   "wordCount": 117
  },
  {
   "id": "b20-w5-n5",
   "title": "Many Gifts, One Spirit",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 5,
   "night": 5,
   "scripture": "1 Corinthians 12:4–11",
   "scriptureBook": "1 Corinthians",
   "traveler": "willow",
   "feeling": "happy",
   "virtues": [
    "service",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child wishes they had someone else's gift, and needs to hear the one Spirit gives each person a gift to help everyone.",
   "teaser": "Paul wrote about gifts, but not the kind wrapped in paper. He meant good things a person can do to help others. “There are many kinds of gifts,” Paul said, “but the same Spirit.” The Spirit, the Holy Ghost, gives…",
   "wordCount": 116
  },
  {
   "id": "b20-w5-n6",
   "title": "Ye Are the Body of Christ",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 5,
   "night": 6,
   "scripture": "1 Corinthians 12:12–27",
   "scriptureBook": "1 Corinthians",
   "traveler": "beau",
   "feeling": "connected",
   "virtues": [
    "identity",
    "compassion"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels they do not belong, and needs Paul's funny picture of a foot saying it is not part of the body.",
   "teaser": "Paul wanted Jesus’s followers to care for one another. So he told about a body. “The body has many parts,” he said. “So it is with Christ.” Then Paul made it funny. The foot said, “I am not a hand, so I don’t…",
   "wordCount": 122
  },
  {
   "id": "b20-w5-n7",
   "title": "Charity Never Faileth",
   "volume": "nt",
   "book": 20,
   "bookTitle": "Overcome Evil with Good!",
   "month": "August",
   "week": 5,
   "night": 7,
   "scripture": "1 Corinthians 13:1–8, 13",
   "scriptureBook": "1 Corinthians",
   "traveler": "wren",
   "feeling": "loved",
   "virtues": [
    "kindness",
    "patience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child is being impatient or unkind, and needs to hear that charity is patient and kind, and never fails.",
   "teaser": "Paul wrote about charity, loving others the way Jesus loves. “If I talk like angels but have no charity, I’m a noisy cymbal.” A cymbal is loud, but it cannot love. Paul said, “With faith to move mountains but no…",
   "wordCount": 115
  },
  {
   "id": "b21-w1-n1",
   "title": "Build Each Other Up",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 1,
   "night": 1,
   "scripture": "1 Corinthians 14:1, 3, 12, 26",
   "scriptureBook": "1 Corinthians",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "kindness",
    "worship-together"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child wonders what to say to others, and needs to hear Paul ask that every word at church build each other up.",
   "teaser": "Paul wrote a letter to the believers in Corinth, a city by the sea. He told them, “Follow after charity,” the pure love of Christ. He told them to want the gifts the Holy Ghost gives. At church, everyone had…",
   "wordCount": 120
  },
  {
   "id": "b21-w1-n2",
   "title": "Seen by Five Hundred",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 1,
   "night": 2,
   "scripture": "1 Corinthians 15:1–8",
   "scriptureBook": "1 Corinthians",
   "traveler": "scout",
   "feeling": "safe",
   "virtues": [
    "faith",
    "stand-for-truth"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child asks how we know Jesus really rose, and needs Paul's list of people who saw Him, five hundred at once.",
   "teaser": "Paul wrote down the most important things he ever taught. Christ died for our sins, the wrong things we do. Then He was buried. Then He rose again on the third day, as the scriptures said. But how could people know…",
   "wordCount": 124
  },
  {
   "id": "b21-w1-n3",
   "title": "All Shall Be Made Alive",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 1,
   "night": 3,
   "scripture": "1 Corinthians 15:20–22, 26",
   "scriptureBook": "1 Corinthians",
   "traveler": "beau",
   "feeling": "happy",
   "virtues": [
    "hope",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child is sad about someone who died, and needs to hear that in Christ all shall be made alive.",
   "teaser": "Paul wrote, “Now is Christ risen from the dead.” He called Jesus “the firstfruits.” Firstfruits are the very first ripe fruits picked each year. Farmers were glad to see them. They knew the whole harvest was coming…",
   "wordCount": 122
  },
  {
   "id": "b21-w1-n4",
   "title": "A Seed and a Flower",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 1,
   "night": 4,
   "scripture": "1 Corinthians 15:35–38, 42–44",
   "scriptureBook": "1 Corinthians",
   "traveler": "wren",
   "feeling": "amazed",
   "virtues": [
    "wonder",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wonder",
   "teachingNote": "Reach for this when your child asks what happens after we die, and needs Paul's picture of a plain seed that comes up a tall green plant.",
   "teaser": "Paul knew someone might ask, “How do people rise from the dead? What kind of body will they have?” Paul answered with a garden. A seed is small, plain, and dry, like a grain of wheat. You bury it. Then Heavenly…",
   "wordCount": 121
  },
  {
   "id": "b21-w1-n5",
   "title": "Death Is Swallowed Up",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 1,
   "night": 5,
   "scripture": "1 Corinthians 15:51–55, 57",
   "scriptureBook": "1 Corinthians",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "hope",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child is afraid of death, and needs to hear Paul cheer, \"O death, where is thy sting?\"",
   "teaser": "Paul told the believers a wonderful secret. One day, he said, “we shall all be changed.” It will happen “in the twinkling of an eye,” as fast as a blink! A trumpet will sound. Those who died will rise, never to wear…",
   "wordCount": 111
  },
  {
   "id": "b21-w1-n6",
   "title": "Stand Fast and Be Strong",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 1,
   "night": 6,
   "scripture": "1 Corinthians 15:58; 16:13–14",
   "scriptureBook": "1 Corinthians",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "perseverance",
    "diligence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "perseverance",
   "teachingNote": "Reach for this when your child gets pushed around by hard days, and needs the picture of a rock standing firm in a rushing river.",
   "teaser": "Paul had taught that Jesus rose from the dead. Now he told them what to do about it. “Be ye steadfast, unmoveable,” he said. To be steadfast is to stand firm, like a big rock in a river. The water pushes and pushes…",
   "wordCount": 122
  },
  {
   "id": "b21-w1-n7",
   "title": "Save a Little to Give",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 1,
   "night": 7,
   "scripture": "1 Corinthians 16:1–3",
   "scriptureBook": "1 Corinthians",
   "traveler": "willow",
   "feeling": "calm",
   "virtues": [
    "generosity",
    "diligence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child wants to give but has little, and needs to see the believers set a little aside each Sunday.",
   "teaser": "Paul was gathering a gift of money for the saints. They were believers in Jerusalem who needed help. Other churches were giving too. Paul wanted the Corinthians to help. He told them how. On Sunday, the first day of…",
   "wordCount": 123
  },
  {
   "id": "b21-w2-n1",
   "title": "The Father of Mercies",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 2,
   "night": 1,
   "scripture": "2 Corinthians 1:3–4",
   "scriptureBook": "2 Corinthians",
   "traveler": "wren",
   "feeling": "comforted",
   "virtues": [
    "comfort",
    "compassion"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "comfort",
   "teachingNote": "Reach for this when your child has been comforted and can now help someone else, and needs to hear that comfort is meant to be passed on.",
   "teaser": "Paul wrote a second letter to the believers in Corinth. He started it by praising Heavenly Father. He called Him “the Father of mercies,” because He is so kind. He gives all comfort. Paul said Heavenly Father…",
   "wordCount": 123
  },
  {
   "id": "b21-w2-n2",
   "title": "Forgive and Comfort Him",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 2,
   "night": 2,
   "scripture": "2 Corinthians 2:5–8, 10–11",
   "scriptureBook": "2 Corinthians",
   "traveler": "beau",
   "feeling": "connected",
   "virtues": [
    "forgiveness",
    "compassion"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "forgiveness",
   "teachingNote": "Reach for this when your child is still upset after someone said sorry, and needs to hear Paul ask the church to forgive and comfort the sad man.",
   "teaser": "A man in the church at Corinth had done wrong and made people sad. The church gave him a consequence. Now he felt very, very sad. Paul wrote that the punishment was enough. He told them to forgive the man and…",
   "wordCount": 121
  },
  {
   "id": "b21-w2-n3",
   "title": "A Letter Written on Hearts",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 2,
   "night": 3,
   "scripture": "2 Corinthians 3:2–3",
   "scriptureBook": "2 Corinthians",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "integrity",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "integrity",
   "teachingNote": "Reach for this when your child wonders if others can see Jesus in them, and needs to hear they are a letter written on hearts for everyone to read.",
   "teaser": "Some teachers came to Corinth carrying letters from important people. The letters said, “You can trust this teacher.” Paul did not need a letter like that. “Ye are our epistle,” Paul told the believers. An epistle…",
   "wordCount": 119
  },
  {
   "id": "b21-w2-n4",
   "title": "Treasure in Clay Jars",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 2,
   "night": 4,
   "scripture": "2 Corinthians 4:6–9, 16–18",
   "scriptureBook": "2 Corinthians",
   "traveler": "scout",
   "feeling": "brave",
   "virtues": [
    "perseverance",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "perseverance",
   "teachingNote": "Reach for this when your child feels knocked down, and needs the picture of treasure carried in plain clay jars: cast down, but not destroyed.",
   "teaser": "Heavenly Father once made light shine out of the dark. Paul said He has shined a light in our hearts too. It is the light of knowing Jesus. Paul called that light a treasure. He said we carry it in clay jars, plain…",
   "wordCount": 123
  },
  {
   "id": "b21-w2-n5",
   "title": "We Walk by Faith",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 2,
   "night": 5,
   "scripture": "2 Corinthians 5:1, 6–7, 17",
   "scriptureBook": "2 Corinthians",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "faith",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child is scared of what they cannot see ahead, and needs to hear Paul say we walk by faith, not by sight.",
   "teaser": "Paul said our bodies are like tents. A tent is good for camping, but it does not last forever. When our tent is taken down, Heavenly Father has a forever home for us. It is in heaven, a home no hands built. Then…",
   "wordCount": 114
  },
  {
   "id": "b21-w2-n6",
   "title": "Be Ye Reconciled",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 2,
   "night": 6,
   "scripture": "2 Corinthians 5:18–20",
   "scriptureBook": "2 Corinthians",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "repentance",
    "peacemaking"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child feels far from Heavenly Father after a wrong choice, and needs the picture of friends hugging after a fight.",
   "teaser": "Paul wrote that Heavenly Father has reconciled us to Himself by Jesus Christ. To be reconciled is to be friends again, like friends hugging after a fight. Our wrong choices had put us far away from Heavenly Father…",
   "wordCount": 114
  },
  {
   "id": "b21-w2-n7",
   "title": "Sorrow That Changes You",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 2,
   "night": 7,
   "scripture": "2 Corinthians 7:8–10",
   "scriptureBook": "2 Corinthians",
   "traveler": "wren",
   "feeling": "guilty",
   "virtues": [
    "repentance",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child feels bad about a wrong choice, and needs to hear that sorrow Heavenly Father's way turns you around.",
   "teaser": "Paul had sent the Corinthians a hard letter about their wrong choices. It made them sad. But Paul was glad, because their sadness helped them repent. To repent is to say sorry and turn around to do what is right…",
   "wordCount": 123
  },
  {
   "id": "b21-w3-n1",
   "title": "They Gave Themselves First",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 3,
   "night": 1,
   "scripture": "2 Corinthians 8:1–5",
   "scriptureBook": "2 Corinthians",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "generosity",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child thinks they are too poor or little to give, and needs to see the poor Macedonians give themselves to the Lord first.",
   "teaser": "Paul wrote to his friends in Corinth. He told them about the believers in Macedonia, a land to the north. Those believers were having a very hard time. They were very poor. Yet their hearts were full of joy. They…",
   "wordCount": 123
  },
  {
   "id": "b21-w3-n2",
   "title": "He Became Poor for Us",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 3,
   "night": 2,
   "scripture": "2 Corinthians 8:9",
   "scriptureBook": "2 Corinthians",
   "traveler": "willow",
   "feeling": "grateful",
   "virtues": [
    "gratitude",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child asks how much Jesus loves them, and needs to hear He left the riches of heaven and became poor for us.",
   "teaser": "Paul wanted his friends to know how much Jesus loves them. So he told Jesus’s whole story in one sentence. Before Jesus was born, He lived in heaven with Heavenly Father. He had glory and every beautiful thing in…",
   "wordCount": 123
  },
  {
   "id": "b21-w3-n3",
   "title": "A Cheerful Giver",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 3,
   "night": 3,
   "scripture": "2 Corinthians 9:6–8",
   "scriptureBook": "2 Corinthians",
   "traveler": "wren",
   "feeling": "happy",
   "virtues": [
    "generosity",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child grumbles about sharing, and needs Paul's picture of a farmer planting lots of seeds and a cheerful giver.",
   "teaser": "Paul wanted his friends in Corinth to give to believers who needed help. So he talked about a farmer planting seeds. If a farmer sows, or plants, a few seeds, a little grows. If he sows lots of seeds, lots will…",
   "wordCount": 125
  },
  {
   "id": "b21-w3-n4",
   "title": "Every Thought a Captive",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 3,
   "night": 4,
   "scripture": "2 Corinthians 10:3–5",
   "scriptureBook": "2 Corinthians",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "self-control",
    "wisdom"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "self-control",
   "teachingNote": "Reach for this when your child has a wild or unkind thought stuck in their head, and needs to hear they can catch it and bring it to Christ.",
   "teaser": "Paul wrote about a different kind of fight. It is not a fight with swords or fists. Heavenly Father gives us mighty help for it. What are we fighting? Wrong ideas that are not true. Some proud thoughts puff…",
   "wordCount": 124
  },
  {
   "id": "b21-w3-n5",
   "title": "My Grace Is Sufficient",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 3,
   "night": 5,
   "scripture": "2 Corinthians 12:7–10",
   "scriptureBook": "2 Corinthians",
   "traveler": "willow",
   "feeling": "comforted",
   "virtues": [
    "trust-in-god",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child prayed for something hard to go away and it did not, and needs to hear the Lord tell Paul, \"My grace is sufficient.\"",
   "teaser": "Paul had a problem he called “a thorn in the flesh.” He did not say what it was. It hurt and kept bothering him, like a thorn stuck in your skin. Three times Paul begged the Lord to take it away. He prayed and…",
   "wordCount": 124
  },
  {
   "id": "b21-w3-n6",
   "title": "Shipwrecked and Still Going",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 3,
   "night": 6,
   "scripture": "2 Corinthians 11:23–27",
   "scriptureBook": "2 Corinthians",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "perseverance",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "perseverance",
   "teachingNote": "Reach for this when your child wants to give up after a hard try, and needs to hear Paul was shipwrecked three times and kept going.",
   "teaser": "Some people in Corinth bragged about how great they were. So Paul made a list too. But his list was full of hard things. He listed what happened while he told people about Jesus. “Thrice I suffered shipwreck,” he…",
   "wordCount": 122
  },
  {
   "id": "b21-w3-n7",
   "title": "Live in Peace",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 3,
   "night": 7,
   "scripture": "2 Corinthians 13:5, 11",
   "scriptureBook": "2 Corinthians",
   "traveler": "scout",
   "feeling": "calm",
   "virtues": [
    "peacemaking",
    "pondering"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "peacemaking",
   "teachingNote": "Reach for this when your child is quarreling with someone, and needs to hear Paul say, \"Live in peace,\" and the God of peace will be with you.",
   "teaser": "Paul was finishing his letter to his friends in Corinth. He worried that some of them were quarreling. So he gave them a test, but not with paper and pencil. He said, “Examine yourselves.” He wanted each one to look…",
   "wordCount": 119
  },
  {
   "id": "b21-w4-n1",
   "title": "Christ Lives in Me",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 4,
   "night": 1,
   "scripture": "Galatians 1:11–12; 2:20",
   "scriptureBook": "Galatians",
   "traveler": "wren",
   "feeling": "loved",
   "virtues": [
    "faith",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child wonders if Jesus is really with them, and needs to hear Paul say, \"Christ liveth in me.\"",
   "teaser": "Paul wrote to the believers in Galatia, a land of hills and small towns. He had taught them about Jesus. Now some people were teaching them wrong things. So Paul reminded them where his message came from. No man…",
   "wordCount": 122
  },
  {
   "id": "b21-w4-n2",
   "title": "All One in Christ",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 4,
   "night": 2,
   "scripture": "Galatians 3:26–29",
   "scriptureBook": "Galatians",
   "traveler": "scout",
   "feeling": "connected",
   "virtues": [
    "identity",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels left out or leaves someone out, and needs to hear that all are one in Christ Jesus.",
   "teaser": "Paul told the Galatians they were all Heavenly Father’s children by faith in Jesus. Not just some of them. All of them! He said when people are baptized, they “put on Christ.” It is like putting on a new coat that…",
   "wordCount": 123
  },
  {
   "id": "b21-w4-n3",
   "title": "Walk in the Spirit",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 4,
   "night": 3,
   "scripture": "Galatians 5:16–18, 25",
   "scriptureBook": "Galatians",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "obedience",
    "self-control"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child feels two voices tugging inside, and needs to hear Paul say to walk in the Spirit, one step at a time.",
   "teaser": "Paul wrote to the Galatians about two voices inside every person. One voice wants selfish, wrong things. The other is the Spirit, the Holy Ghost, who whispers what is right. Paul said these two pull opposite ways…",
   "wordCount": 112
  },
  {
   "id": "b21-w4-n4",
   "title": "The Fruit of the Spirit",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 4,
   "night": 4,
   "scripture": "Galatians 5:22–23",
   "scriptureBook": "Galatians",
   "traveler": "wren",
   "feeling": "happy",
   "virtues": [
    "kindness",
    "patience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child wonders how to tell if the Holy Ghost is with them, and needs the picture of good fruit growing on a tree.",
   "teaser": "Paul wanted the Galatians to know if the Holy Ghost was leading them. He said to look at the fruit. You can tell what kind of tree a tree is by its fruit. Apples grow on an apple tree. Peaches grow on a peach tree…",
   "wordCount": 123
  },
  {
   "id": "b21-w4-n5",
   "title": "Bear One Another's Burdens",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 4,
   "night": 5,
   "scripture": "Galatians 6:1–2, 5",
   "scriptureBook": "Galatians",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "compassion",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "compassion",
   "teachingNote": "Reach for this when your child sees someone carrying something heavy, inside or out, and needs to hear Paul say to bear one another's burdens.",
   "teaser": "Paul taught the Galatians what to do when someone does something wrong. Do not laugh at them or be mean. Gently help them get back up. Why be gentle? Paul said to remember that you could slip too. Everyone makes…",
   "wordCount": 108
  },
  {
   "id": "b21-w4-n6",
   "title": "You Reap What You Sow",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 4,
   "night": 6,
   "scripture": "Galatians 6:7–9",
   "scriptureBook": "Galatians",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "diligence",
    "perseverance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "diligence",
   "teachingNote": "Reach for this when your child is tired of doing good, and needs Paul's farming rule: what you plant is what will grow.",
   "teaser": "Paul gave the Galatians a farming rule. “Whatsoever a man soweth, that shall he also reap.” Whatever you plant is what will grow. You cannot plant weeds and pick strawberries! If we plant selfish things, only bad…",
   "wordCount": 125
  },
  {
   "id": "b21-w4-n7",
   "title": "Free to Serve",
   "volume": "nt",
   "book": 21,
   "bookTitle": "Walk in the Spirit!",
   "month": "September",
   "week": 4,
   "night": 7,
   "scripture": "Galatians 5:1, 13–14",
   "scriptureBook": "Galatians",
   "traveler": "wren",
   "feeling": "happy",
   "virtues": [
    "service",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child asks what being free means, and needs to hear Paul say Christ made us free so by love we serve one another.",
   "teaser": "Some people told the Galatians they must keep many old rules to be saved. Paul said no! Jesus had set them free. Paul wrote, “Stand fast in the liberty wherewith Christ hath made us free.” Do not let anyone put a…",
   "wordCount": 112
  },
  {
   "id": "b22-w1-n1",
   "title": "Chosen Before the World",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 1,
   "night": 1,
   "scripture": "Ephesians 1:3–6",
   "scriptureBook": "Ephesians",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels unwanted or like a mistake and needs to hear Heavenly Father chose them before the world was made.",
   "teaser": "Paul wrote a letter to Jesus’s friends in a city called Ephesus. He had lived there and taught them for three years. Paul wrote, “Heavenly Father chose us before the world was made.” Before there was ground or sky…",
   "wordCount": 121
  },
  {
   "id": "b22-w1-n2",
   "title": "By Grace, Not by Works",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 1,
   "night": 2,
   "scripture": "Ephesians 2:8–10",
   "scriptureBook": "Ephesians",
   "traveler": "scout",
   "feeling": "grateful",
   "virtues": [
    "gratitude",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child wants to earn love or brag about being good and needs the picture of a gift nobody can earn.",
   "teaser": "Paul wrote to his friends in Ephesus about the best gift of all. Heavenly Father wants to bring us safely home to Him. We are saved by grace, Paul said, His kind help we can never earn. We trust Jesus, and the gift…",
   "wordCount": 122
  },
  {
   "id": "b22-w1-n3",
   "title": "No More Strangers",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 1,
   "night": 3,
   "scripture": "Ephesians 2:13–14, 19",
   "scriptureBook": "Ephesians",
   "traveler": "wren",
   "feeling": "connected",
   "virtues": [
    "kindness",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child sees someone as different or left out and needs to know Jesus broke down the wall between people.",
   "teaser": "Most of Paul’s friends in Ephesus were not Jewish. For a long time, Jewish people and everyone else had stayed apart. It was like a wall stood between them. Paul said, “You who were once far off are made near.”…",
   "wordCount": 123
  },
  {
   "id": "b22-w1-n4",
   "title": "Rooted and Grounded in Love",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 1,
   "night": 4,
   "scripture": "Ephesians 3:14–19",
   "scriptureBook": "Ephesians",
   "traveler": "willow",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels shaky inside and needs the picture of a tree with deep roots that stays standing in the wind.",
   "teaser": "Paul was a prisoner, but he still prayed for his friends in Ephesus. He knelt down and asked Heavenly Father to make them strong inside. He prayed that Jesus would live in their hearts. He prayed they would be…",
   "wordCount": 121
  },
  {
   "id": "b22-w1-n5",
   "title": "Kind and Tenderhearted",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 1,
   "night": 5,
   "scripture": "Ephesians 4:29–32",
   "scriptureBook": "Ephesians",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "kindness",
    "forgiveness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child is using sharp words or holding a hurt and needs a soft heart that forgives the way Heavenly Father forgives.",
   "teaser": "Paul wrote to his friends in Ephesus about their words. He said, “Let no rotten words come out of your mouth.” He meant mean, hurtful words. Instead, Paul said, use good words that build people up. Kind words help…",
   "wordCount": 118
  },
  {
   "id": "b22-w1-n6",
   "title": "Honor Mom and Dad",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 1,
   "night": 6,
   "scripture": "Ephesians 6:1–4",
   "scriptureBook": "Ephesians",
   "traveler": "scout",
   "feeling": "loved",
   "virtues": [
    "honoring-parents",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "honoring-parents",
   "teachingNote": "Reach for this when your child drags their feet when asked to help and needs to practice a happy yes that honors Mom and Dad.",
   "teaser": "Paul wrote one part of his letter just for children. He said, “Children, obey your parents in the Lord, for this is right.” Then he said, “Honor your father and mother.” To honor someone is to treat them as very…",
   "wordCount": 124
  },
  {
   "id": "b22-w1-n7",
   "title": "The Whole Armor",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 1,
   "night": 7,
   "scripture": "Ephesians 6:10–17",
   "scriptureBook": "Ephesians",
   "traveler": "beau",
   "feeling": "safe",
   "virtues": [
    "courage",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child feels unready for a hard day and needs to put on the armor, one piece at a time, before stepping out.",
   "teaser": "Paul wrote this letter while he was in chains. He knew how soldiers dressed to stay safe. So he used armor to teach. “Put on the whole armor of Heavenly Father,” Paul said. Wear a belt of truth. Wear a breastplate…",
   "wordCount": 125
  },
  {
   "id": "b22-w2-n1",
   "title": "He Will Finish the Work",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 2,
   "night": 1,
   "scripture": "Philippians 1:3–6",
   "scriptureBook": "Philippians",
   "traveler": "wren",
   "feeling": "comforted",
   "virtues": [
    "hope",
    "patience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child feels discouraged about still learning and needs to hear Heavenly Father is not done with them yet.",
   "teaser": "Paul loved his friends in the city of Philippi. That is where Lydia opened her heart to Jesus, and a jailer was baptized. Now Paul was in chains in prison himself. Still, he wrote them a happy letter. “I thank my…",
   "wordCount": 123
  },
  {
   "id": "b22-w2-n2",
   "title": "The Form of a Servant",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 2,
   "night": 2,
   "scripture": "Philippians 2:5–11",
   "scriptureBook": "Philippians",
   "traveler": "beau",
   "feeling": "happy",
   "virtues": [
    "humility",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child wants to be first or biggest and needs to see Jesus came low as a servant to help others.",
   "teaser": "Paul wanted his friends in Philippi to put others first. He told them to think like Jesus. Jesus was great and glorious in heaven. Still, He came to earth as a servant, someone who helps others. Jesus made Himself…",
   "wordCount": 116
  },
  {
   "id": "b22-w2-n3",
   "title": "Shine as Lights",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 2,
   "night": 3,
   "scripture": "Philippians 2:14–16",
   "scriptureBook": "Philippians",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "self-control",
    "contentment"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "self-control",
   "teachingNote": "Reach for this when your child grumbles about chores and needs the picture of one small light that shines in a dark room.",
   "teaser": "Paul gave his friends in Philippi a hard rule. He said, “Do all things without murmurings and disputings.” Murmuring is grumbling, like saying, “Ugh, do I have to?” Paul said to do everything with no grumbling and…",
   "wordCount": 112
  },
  {
   "id": "b22-w2-n4",
   "title": "Be Careful for Nothing",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 2,
   "night": 4,
   "scripture": "Philippians 4:4–7",
   "scriptureBook": "Philippians",
   "traveler": "willow",
   "feeling": "calm",
   "virtues": [
    "prayer",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child is carrying a worry to bed and needs a simple way to hand it to Heavenly Father in prayer.",
   "teaser": "Paul wrote to his friends in Philippi, “Rejoice in the Lord always.” Then he said, “Again I say, rejoice.” He said “rejoice,” be glad, two times, so they would not miss it. Then he reminded them that the Lord is…",
   "wordCount": 123
  },
  {
   "id": "b22-w2-n5",
   "title": "Think on These Things",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 2,
   "night": 5,
   "scripture": "Philippians 4:8",
   "scriptureBook": "Philippians",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "pondering",
    "wisdom"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "pondering",
   "teachingNote": "Reach for this when your child keeps replaying a scary or sad picture and needs to plant a lovely new thought like a seed.",
   "teaser": "Paul had just told his friends in Philippi about Heavenly Father’s peace. Then he told them how to keep their minds peaceful. He said to think on things that are true and honest. Think on things that are fair, pure…",
   "wordCount": 121
  },
  {
   "id": "b22-w2-n6",
   "title": "I Can Do All Things",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 2,
   "night": 6,
   "scripture": "Philippians 4:11–13",
   "scriptureBook": "Philippians",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "contentment",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "contentment",
   "teachingNote": "Reach for this when your child faces something hard, like a shot, and needs to lean on Jesus's strength instead of their own.",
   "teaser": "Paul was in prison when he wrote to his friends in Philippi. They had sent him gifts to help him. Paul thanked them and said, “I have learned to be content.” Content means being happy with what you have, without…",
   "wordCount": 115
  },
  {
   "id": "b22-w2-n7",
   "title": "Put On Kindness",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 2,
   "night": 7,
   "scripture": "Colossians 3:12–14, 23",
   "scriptureBook": "Colossians",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "kindness",
    "diligence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child does a job halfway or snaps at a sibling and needs to put on kindness and work with their whole heart.",
   "teaser": "Paul wrote to Jesus’s followers in a town called Colosse. He had never even seen their faces. Still, he loved them and wanted to help. He told them what to put on their hearts, not their bodies. “Put on kindness,”…",
   "wordCount": 119
  },
  {
   "id": "b22-w3-n1",
   "title": "Gentle as a Nurse",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 3,
   "night": 1,
   "scripture": "1 Thessalonians 2:7–8, 11–12",
   "scriptureBook": "1 Thessalonians",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "kindness",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child needs to feel held close, or needs to learn to be gentle like a nurse with a tiny baby.",
   "teaser": "Paul taught about Jesus in a city called Thessalonica. Then he had to leave quickly. He missed his new friends, so he wrote them a letter. “We were gentle among you,” Paul wrote. He was like a nurse who cherishes…",
   "wordCount": 122
  },
  {
   "id": "b22-w3-n2",
   "title": "Work with Your Own Hands",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 3,
   "night": 2,
   "scripture": "1 Thessalonians 4:9–12",
   "scriptureBook": "1 Thessalonians",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "diligence",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "diligence",
   "teachingNote": "Reach for this when your child would rather watch than help and needs to see their own hands as good helpers.",
   "teaser": "Paul wrote his friends in Thessalonica happy news. They were already good at loving one another. Heavenly Father had taught them how. Paul said, “Love more and more.” Then he gave them three quiet things to do. Try…",
   "wordCount": 119
  },
  {
   "id": "b22-w3-n3",
   "title": "Children of the Light",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 3,
   "night": 3,
   "scripture": "1 Thessalonians 5:4–8",
   "scriptureBook": "1 Thessalonians",
   "traveler": "wren",
   "feeling": "eager",
   "virtues": [
    "faith",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child forgets Jesus in a busy day and needs the picture of a child of the light who stays awake and ready.",
   "teaser": "Paul’s friends wondered when Jesus would come back. Paul said that day would come as a surprise, “as a thief.” But they did not need to be caught by surprise. “Ye are all the children of light,” he wrote. “You are…",
   "wordCount": 120
  },
  {
   "id": "b22-w3-n4",
   "title": "In Everything Give Thanks",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 3,
   "night": 4,
   "scripture": "1 Thessalonians 5:14–18",
   "scriptureBook": "1 Thessalonians",
   "traveler": "beau",
   "feeling": "grateful",
   "virtues": [
    "gratitude",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child is grumpy after a plan was spoiled and needs to go looking for something to thank Heavenly Father for.",
   "teaser": "Paul’s friends in Thessalonica were having hard days. Near the end of his letter, Paul gave them a list. Cheer up the sad ones. Help the weak. Be patient with everyone. Don’t pay back mean with mean, Paul said…",
   "wordCount": 119
  },
  {
   "id": "b22-w3-n5",
   "title": "Comfort One Another",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 3,
   "night": 5,
   "scripture": "1 Thessalonians 4:13–14, 16–18",
   "scriptureBook": "1 Thessalonians",
   "traveler": "willow",
   "feeling": "sad",
   "virtues": [
    "hope",
    "comfort"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child misses someone who has died and needs to hear that sleep in Jesus is not the end.",
   "teaser": "Some of Paul’s friends were very sad. People they loved had died. So Paul wrote them a gentle letter. He said the people who died were “asleep.” He chose that soft word because after sleep, you wake up. Paul did not…",
   "wordCount": 124
  },
  {
   "id": "b22-w3-n6",
   "title": "Not Weary in Well Doing",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 3,
   "night": 6,
   "scripture": "2 Thessalonians 3:6–13",
   "scriptureBook": "2 Thessalonians",
   "traveler": "scout",
   "feeling": "frustrated",
   "virtues": [
    "diligence",
    "perseverance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "diligence",
   "teachingNote": "Reach for this when your child gets tired of doing good or leaves jobs for others and needs to finish their own part.",
   "teaser": "Paul heard that some friends in Thessalonica were not working at all. Instead, they were busybodies, busy poking into everyone else’s business but their own. Paul reminded them how he had lived. He worked hard…",
   "wordCount": 109
  },
  {
   "id": "b22-w3-n7",
   "title": "The Lord Is Faithful",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 3,
   "night": 7,
   "scripture": "2 Thessalonians 2:16–17; 3:3–5",
   "scriptureBook": "2 Thessalonians",
   "traveler": "wren",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "keeping-promises"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels unsure or lost and needs to know the Lord keeps His word every single time.",
   "teaser": "Paul’s friends were going through hard times. So Paul prayed that Jesus and Heavenly Father would comfort their hearts. Then Paul made a promise: “The Lord is faithful.” Being faithful is keeping your word every…",
   "wordCount": 120
  },
  {
   "id": "b22-w4-n1",
   "title": "Grandma Lois's Faith",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 4,
   "night": 1,
   "scripture": "2 Timothy 1:2–5; 3:15",
   "scriptureBook": "2 Timothy",
   "traveler": "willow",
   "feeling": "grateful",
   "virtues": [
    "gratitude",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child asks where faith comes from and needs to hear how Grandma Lois and Mother Eunice passed theirs down.",
   "teaser": "Paul had a young friend named Timothy, who helped him teach about Jesus. Paul loved him so much. He called him “my dearly beloved son.” Paul wrote Timothy a letter. He remembered that Timothy’s faith in Jesus was…",
   "wordCount": 124
  },
  {
   "id": "b22-w4-n2",
   "title": "Be an Example",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 4,
   "night": 2,
   "scripture": "1 Timothy 4:12; Titus 2:7",
   "scriptureBook": "1 Timothy",
   "traveler": "wren",
   "feeling": "brave",
   "virtues": [
    "integrity",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "integrity",
   "teachingNote": "Reach for this when your child feels too little to matter and needs to know younger eyes may be copying their good example.",
   "teaser": "Timothy was young, and he had a big job teaching about Jesus. Paul wrote to him, “Let no man despise thy youth.” To despise someone is to look down on them, as if they don’t matter. “Be thou an example,” Paul said…",
   "wordCount": 115
  },
  {
   "id": "b22-w4-n3",
   "title": "Content with What You Have",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 4,
   "night": 3,
   "scripture": "1 Timothy 6:6–10",
   "scriptureBook": "1 Timothy",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "contentment",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "contentment",
   "teachingNote": "Reach for this when your child wants more and more toys and needs to count what they already have and say it is enough.",
   "teaser": "Some people wanted to be rich more than anything. So Paul wrote Timothy a happy secret. “Godliness with contentment is great gain.” Loving Heavenly Father and being glad with what you have is the real treasure. “We…",
   "wordCount": 118
  },
  {
   "id": "b22-w4-n4",
   "title": "Not the Spirit of Fear",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 4,
   "night": 4,
   "scripture": "2 Timothy 1:6–8",
   "scriptureBook": "2 Timothy",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "courage",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child feels afraid and needs Paul's words that Heavenly Father gives power, love, and a sound mind, not fear.",
   "teaser": "Paul was in prison, and he knew hard days were coming. He wrote to his young friend Timothy to help him be strong. Paul told Timothy to stir up the gift Heavenly Father gave him. It was like poking a campfire until…",
   "wordCount": 119
  },
  {
   "id": "b22-w4-n5",
   "title": "All Scripture Is Given",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 4,
   "night": 5,
   "scripture": "2 Timothy 3:14–17",
   "scriptureBook": "2 Timothy",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "love-of-scripture",
    "wisdom"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this when your child feels mad or stuck and needs to open the scriptures like a toolbox for doing good.",
   "teaser": "Paul told Timothy to hold on to what he had learned. Timothy had known the holy scriptures since he was a little child. The scriptures could make even a child wise, Paul said. They teach how Jesus saves us through…",
   "wordCount": 122
  },
  {
   "id": "b22-w4-n6",
   "title": "I Have Fought a Good Fight",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 4,
   "night": 6,
   "scripture": "2 Timothy 4:6–8",
   "scriptureBook": "2 Timothy",
   "traveler": "beau",
   "feeling": "happy",
   "virtues": [
    "perseverance",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "perseverance",
   "teachingNote": "Reach for this when your child wants to quit before the end and needs Paul's picture of finishing the race and keeping the faith.",
   "teaser": "Paul was in prison, near the end of his life. He wrote some of his last words to Timothy. His words were brave and full of hope. “The time of my departure is at hand,” he wrote. He was ready, like a ship about to…",
   "wordCount": 121
  },
  {
   "id": "b22-w4-n7",
   "title": "Receive Him as a Brother",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 4,
   "night": 7,
   "scripture": "Philemon 1:10–17",
   "scriptureBook": "Philemon",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "forgiveness",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "forgiveness",
   "teachingNote": "Reach for this when your child needs to welcome back someone who left or did wrong, like Philemon welcoming Onesimus as a brother.",
   "teaser": "Paul wrote a short letter to his friend Philemon. Philemon had a servant named Onesimus. One day Onesimus left Philemon and went away. Paul was in chains for teaching about Jesus. While Paul was in chains, Onesimus…",
   "wordCount": 117
  },
  {
   "id": "b22-w5-n1",
   "title": "Spoken by His Son",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 5,
   "night": 1,
   "scripture": "Hebrews 1:1–3",
   "scriptureBook": "Hebrews",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "wonder",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wonder",
   "teachingNote": "Reach for this when your child wonders what Heavenly Father is like and needs to look at Jesus, the brightness of His glory.",
   "teaser": "Long ago, Heavenly Father sent prophets like Moses to tell His people His words. He spoke through them many times, in many ways. Then a letter called Hebrews told something even better. Now, in these last days…",
   "wordCount": 123
  },
  {
   "id": "b22-w5-n2",
   "title": "He Calls Us Family",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 5,
   "night": 2,
   "scripture": "Hebrews 2:9–11, 17–18",
   "scriptureBook": "Hebrews",
   "traveler": "willow",
   "feeling": "comforted",
   "virtues": [
    "identity",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels alone in a hard choice and needs to know Jesus was tempted too and understands.",
   "teaser": "Jesus is the Son of Heavenly Father. Yet He came to earth as a person, just like us. Jesus looks at us and calls us “brethren.” That is an old word for brothers and sisters. He is “not ashamed” to say we are His…",
   "wordCount": 117
  },
  {
   "id": "b22-w5-n3",
   "title": "Today, Hear His Voice",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 5,
   "night": 3,
   "scripture": "Hebrews 3:7–8, 12–13",
   "scriptureBook": "Hebrews",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": [
    "humility",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child feels a nudge to do good and needs to keep a soft heart, like wet clay, and listen today.",
   "teaser": "The letter to the Hebrews shares a message from the Holy Ghost. “Today if you will hear His voice, harden not your hearts.” A hard heart is like dry clay that will not bend. A soft heart is like wet clay that…",
   "wordCount": 121
  },
  {
   "id": "b22-w5-n4",
   "title": "A Rest for His People",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 5,
   "night": 4,
   "scripture": "Hebrews 4:1, 4, 9–11",
   "scriptureBook": "Hebrews",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "trust-in-god",
    "reverence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child is restless and busy and needs to learn the Sabbath rest that comes from trusting Jesus.",
   "teaser": "After Heavenly Father made the world, He “did rest the seventh day.” That is why we have the Sabbath. Each week we stop our busy work and remember Him. The letter to the Hebrews says “there remains” a rest for…",
   "wordCount": 113
  },
  {
   "id": "b22-w5-n5",
   "title": "Sharper Than a Sword",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 5,
   "night": 5,
   "scripture": "Hebrews 4:12–13",
   "scriptureBook": "Hebrews",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "love-of-scripture",
    "pondering"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this when your child heard a scripture that felt just for them and needs to know His word is alive and goes deep.",
   "teaser": "The letter to the Hebrews says Heavenly Father’s word is “quick, and powerful.” Long ago, quick meant alive! His word is “sharper than any two-edged sword,” a sword sharp on both sides. It goes right through, all…",
   "wordCount": 119
  },
  {
   "id": "b22-w5-n6",
   "title": "Come Boldly to the Throne",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 5,
   "night": 6,
   "scripture": "Hebrews 4:14–16",
   "scriptureBook": "Hebrews",
   "traveler": "beau",
   "feeling": "guilty",
   "virtues": [
    "prayer",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child wants to hide a wrong choice and needs to know they can come boldly to Heavenly Father for help.",
   "teaser": "The letter to the Hebrews calls Jesus our “great high priest.” Long ago, a high priest stood before Heavenly Father for the people. Jesus does that for us. Jesus came to earth and felt what we feel. He was tempted…",
   "wordCount": 112
  },
  {
   "id": "b22-w5-n7",
   "title": "An Anchor of the Soul",
   "volume": "nt",
   "book": 22,
   "bookTitle": "I Can Do All Things!",
   "month": "October",
   "week": 5,
   "night": 7,
   "scripture": "Hebrews 6:17–19",
   "scriptureBook": "Hebrews",
   "traveler": "wren",
   "feeling": "safe",
   "virtues": [
    "hope",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child feels tossed by something big and stormy and needs the picture of an anchor that holds the boat steady.",
   "teaser": "Long ago, Heavenly Father promised to bless Abraham. The letter to the Hebrews says Heavenly Father cannot lie. He always keeps His promises. So His promises give us strong comfort. We can hold on tight to the hope…",
   "wordCount": 109
  },
  {
   "id": "b23-w1-n1",
   "title": "Written on Their Hearts",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 1,
   "night": 1,
   "scripture": "Hebrews 8:6, 10–12",
   "scriptureBook": "Hebrews",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "obedience",
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child needs to notice the good they already know to do, the law Heavenly Father writes on their heart.",
   "teaser": "Long ago, Heavenly Father gave His people laws carved on flat stones. But the people did not keep His laws. They kept forgetting. So He promised something new. Hebrews says Jesus brought a better covenant, a promise…",
   "wordCount": 120
  },
  {
   "id": "b23-w1-n2",
   "title": "Once for All",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 1,
   "night": 2,
   "scripture": "Hebrews 9:26, 28; 10:10–12",
   "scriptureBook": "Hebrews",
   "traveler": "beau",
   "feeling": "comforted",
   "virtues": [
    "repentance",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child feels stuck on a wrong choice and needs to hear Jesus paid once for all, so they can say sorry and come back.",
   "teaser": "Long ago, Heavenly Father’s people brought lambs to the temple to give to Him. It was a way to say sorry for wrong choices. The priests gave those gifts again and again, every day. But the gifts could never take…",
   "wordCount": 110
  },
  {
   "id": "b23-w1-n3",
   "title": "What Faith Is",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 1,
   "night": 3,
   "scripture": "Hebrews 11:1, 3, 6",
   "scriptureBook": "Hebrews",
   "traveler": "scout",
   "feeling": "calm",
   "virtues": [
    "faith",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child wonders how to believe what they cannot see and needs the picture of wind moving a kite.",
   "teaser": "Can you see the wind? No. But you can see a kite fly and trees bend. So you know the wind is there. The writer of Hebrews said, “Faith is the evidence of things not seen.” Faith is being sure of something good, even…",
   "wordCount": 114
  },
  {
   "id": "b23-w1-n4",
   "title": "By Faith: Noah and Sarah",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 1,
   "night": 4,
   "scripture": "Hebrews 11:7–8, 11–12",
   "scriptureBook": "Hebrews",
   "traveler": "wren",
   "feeling": "brave",
   "virtues": [
    "faith",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child is going somewhere new and scary and needs Noah, Abraham, and Sarah, who went forward by faith.",
   "teaser": "The writer of Hebrews told about people who trusted Heavenly Father. Each of their stories starts with “By faith.” Heavenly Father warned Noah about a flood no one had seen yet. By faith, Noah built an ark, a giant…",
   "wordCount": 118
  },
  {
   "id": "b23-w1-n5",
   "title": "By Faith: Moses",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 1,
   "night": 5,
   "scripture": "Hebrews 11:23–27, 29",
   "scriptureBook": "Hebrews",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "courage",
    "integrity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child must give up something fun to do right and needs Moses, who chose Heavenly Father over the palace.",
   "teaser": "Long ago in Egypt, the king made a cruel rule about baby boys. But by faith, baby Moses’s parents hid him for three months. They were not afraid of the king. Moses grew up as the son of the king’s daughter. He could…",
   "wordCount": 125
  },
  {
   "id": "b23-w1-n6",
   "title": "A Cloud of Witnesses",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 1,
   "night": 6,
   "scripture": "Hebrews 12:1–3",
   "scriptureBook": "Hebrews",
   "traveler": "scout",
   "feeling": "discouraged",
   "virtues": [
    "perseverance",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "perseverance",
   "teachingNote": "Reach for this when your child feels weighed down in a hard race and needs to set down the heavy bag and look to Jesus.",
   "teaser": "The writer of Hebrews had just told about Noah, Abraham, Sarah, and Moses. Then he said we have “a cloud of witnesses” all around us. He pictured them like a big crowd around a race. They had finished their race of…",
   "wordCount": 123
  },
  {
   "id": "b23-w1-n7",
   "title": "I Will Never Leave Thee",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 1,
   "night": 7,
   "scripture": "Hebrews 13:1–2, 5–6, 8",
   "scriptureBook": "Hebrews",
   "traveler": "willow",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "contentment"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels alone in a quiet room and needs His promise, I will never leave thee.",
   "teaser": "The letter of Hebrews ends with kind words. “Let brotherly love continue.” Keep loving each other like family. Be kind to new people, Hebrews says. Some people have been kind to angels without even knowing it…",
   "wordCount": 114
  },
  {
   "id": "b23-w2-n1",
   "title": "Ask for Wisdom",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 2,
   "night": 1,
   "scripture": "James 1:5–6",
   "scriptureBook": "James",
   "traveler": "wren",
   "feeling": "confused",
   "virtues": [
    "wisdom",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wisdom",
   "teachingNote": "Reach for this when your child does not know what to do and needs to hear Heavenly Father gives wisdom freely to all who ask.",
   "teaser": "James was a helper of Jesus Christ. He wrote good advice to Heavenly Father’s people, far and wide. He wrote, “If any of you lack wisdom, let him ask.” Wisdom is knowing the right thing to do. James promised that…",
   "wordCount": 113
  },
  {
   "id": "b23-w2-n2",
   "title": "Doers of the Word",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 2,
   "night": 2,
   "scripture": "James 1:22–25",
   "scriptureBook": "James",
   "traveler": "beau",
   "feeling": "eager",
   "virtues": [
    "obedience",
    "diligence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child hears good lessons but forgets them and needs James's funny picture of the man and the mirror.",
   "teaser": "James wrote, “Be ye doers of the word, and not hearers only.” A hearer listens. A doer listens and then does it. Then James drew a funny picture. A man looks in a mirror and sees his face. Then he walks away and…",
   "wordCount": 115
  },
  {
   "id": "b23-w2-n3",
   "title": "No Respect of Persons",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 2,
   "night": 3,
   "scripture": "James 2:1–5, 8–9",
   "scriptureBook": "James",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "kindness",
    "compassion"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child notices someone left out or treated as less and needs to offer the good seat to everyone.",
   "teaser": "Some believers were treating poor people badly at church. So James wrote to help them stop. Picture a rich man with a gold ring and fine clothes. He gets the good seat. A poor man in old clothes is told, “Stand over…",
   "wordCount": 115
  },
  {
   "id": "b23-w2-n4",
   "title": "Faith Without Works",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 2,
   "night": 4,
   "scripture": "James 2:14–18",
   "scriptureBook": "James",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "service",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child says nice words but does not help and needs to give their faith hands, like a coat and food.",
   "teaser": "James asked, “What good is faith with no works?” Works are the good things we do. Then he gave a picture. A brother or sister is cold and hungry. Someone says, “Go in peace. Stay warm and eat well!” But he gives…",
   "wordCount": 108
  },
  {
   "id": "b23-w2-n5",
   "title": "The Tongue Is a Little Fire",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 2,
   "night": 5,
   "scripture": "James 3:3–6, 9–10",
   "scriptureBook": "James",
   "traveler": "wren",
   "feeling": "guilty",
   "virtues": [
    "self-control",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "self-control",
   "teachingNote": "Reach for this when your child said something unkind and needs James's pictures of a tiny spark, a rudder, and a horse's bit.",
   "teaser": "James said your tongue, the part of you that talks, is small but strong. He gave three pictures. A small bit in a horse’s mouth turns the whole big horse. A small rudder under the water turns a great big ship. And…",
   "wordCount": 121
  },
  {
   "id": "b23-w2-n6",
   "title": "Draw Near to Him",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 2,
   "night": 6,
   "scripture": "James 4:6–8, 10",
   "scriptureBook": "James",
   "traveler": "beau",
   "feeling": "connected",
   "virtues": [
    "humility",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child feels pulled toward something wrong and needs to say no, then take one step toward Heavenly Father.",
   "teaser": "James wrote that Heavenly Father helps the humble. They are people who know they need Him. Then James gave a plan. “Resist the devil, and he will flee from you.” When you say no to wrong things, the devil runs away…",
   "wordCount": 111
  },
  {
   "id": "b23-w2-n7",
   "title": "The Prayer of Faith",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 2,
   "night": 7,
   "scripture": "James 5:13–18",
   "scriptureBook": "James",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "prayer",
    "compassion"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child knows someone sick or sad and needs to know their prayer of faith really helps.",
   "teaser": "James ended his letter with prayer. “Is anyone in trouble? Let him pray. Is anyone happy? Let him sing.” When someone is sick, James said, call the elders who lead the church. They pray and bless the sick person…",
   "wordCount": 113
  },
  {
   "id": "b23-w3-n1",
   "title": "Joy Unspeakable",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 3,
   "night": 1,
   "scripture": "1 Peter 1:3–8",
   "scriptureBook": "1 Peter",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "faith",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child has hard days and needs to know they can love Jesus now, even without seeing Him, with joy.",
   "teaser": "Peter was one of Jesus’s friends. He wrote to believers far from home who were having a hard time. Peter wrote that Jesus came alive again after He died. So our hope is alive too, and a home in heaven waits for us…",
   "wordCount": 123
  },
  {
   "id": "b23-w3-n2",
   "title": "A Chosen Generation",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 3,
   "night": 2,
   "scripture": "1 Peter 2:4–5, 9",
   "scriptureBook": "1 Peter",
   "traveler": "wren",
   "feeling": "loved",
   "virtues": [
    "identity",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels unimportant and needs to hear they are a living stone, chosen, royal, and loved.",
   "teaser": "Peter wanted the believers to know how much they mattered. Houses then were built of stones. So he used a stone house to teach them. Peter called Jesus a living stone. Some people did not want Him, but Heavenly…",
   "wordCount": 123
  },
  {
   "id": "b23-w3-n3",
   "title": "Follow His Steps",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 3,
   "night": 3,
   "scripture": "1 Peter 2:21–23",
   "scriptureBook": "1 Peter",
   "traveler": "beau",
   "feeling": "angry",
   "virtues": [
    "self-control",
    "forgiveness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "self-control",
   "teachingNote": "Reach for this when your child wants to pay back mean with mean and needs to step in Jesus's footprints and stay kind.",
   "teaser": "Peter walked with Jesus and saw how He treated people. He saw Jesus stay kind, even when people were mean. Peter wrote, “Christ left us an example, that we should follow His steps.” It is like stepping in footprints…",
   "wordCount": 115
  },
  {
   "id": "b23-w3-n4",
   "title": "Ready to Give an Answer",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 3,
   "night": 4,
   "scripture": "1 Peter 3:14–15",
   "scriptureBook": "1 Peter",
   "traveler": "scout",
   "feeling": "nervous",
   "virtues": [
    "stand-for-truth",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "stand-for-truth",
   "teachingNote": "Reach for this when your child feels shy talking about Jesus and needs a simple, gentle answer ready, like Because Jesus loves me.",
   "teaser": "Peter wrote to believers who were sometimes treated badly for doing what was right. He told them, “Be not afraid, neither be troubled.” Instead, Peter said, keep the Lord first and holy in your heart. Then you do…",
   "wordCount": 118
  },
  {
   "id": "b23-w3-n5",
   "title": "Charity Covers a Multitude",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 3,
   "night": 5,
   "scripture": "1 Peter 4:8–10",
   "scriptureBook": "1 Peter",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "forgiveness",
    "generosity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "forgiveness",
   "teachingNote": "Reach for this when your child keeps pointing at someone's mistake and needs to cover it with love like a soft blanket.",
   "teaser": "Peter said, above all, to love each other with a warm, whole heart. He called that love charity, the pure love of Christ. Peter said charity covers lots and lots of sins. Love is like a soft blanket over a mistake…",
   "wordCount": 111
  },
  {
   "id": "b23-w3-n6",
   "title": "Cast Your Care on Him",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 3,
   "night": 6,
   "scripture": "1 Peter 5:6–7",
   "scriptureBook": "1 Peter",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "trust-in-god",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child carries a heavy worry and needs to throw it far, like a net, to Heavenly Father who cares.",
   "teaser": "Peter wrote to believers who had hard days and heavy worries. He gave them two sentences that go together. First, Peter said to be humble, bowing low under Heavenly Father’s mighty hand. Then, at the right time, He…",
   "wordCount": 122
  },
  {
   "id": "b23-w3-n7",
   "title": "Add to Your Faith",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 3,
   "night": 7,
   "scripture": "2 Peter 1:4–8",
   "scriptureBook": "2 Peter",
   "traveler": "beau",
   "feeling": "eager",
   "virtues": [
    "diligence",
    "patience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "diligence",
   "teachingNote": "Reach for this when your child wants to grow better all at once and needs Peter's ladder, adding one good step at a time.",
   "teaser": "Peter wrote another letter to help the believers keep growing. He gave them something like a ladder to climb, one step at a time. The first step is faith in Jesus. Then add goodness, and then learning what is true…",
   "wordCount": 120
  },
  {
   "id": "b23-w4-n1",
   "title": "Walk in the Light",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 4,
   "night": 1,
   "scripture": "1 John 1:5–9",
   "scriptureBook": "1 John",
   "traveler": "scout",
   "feeling": "guilty",
   "virtues": [
    "honesty",
    "repentance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "honesty",
   "teachingNote": "Reach for this when your child is hiding something they feel bad about and needs to bring it into the light and feel clean.",
   "teaser": "John was one of Jesus’s friends. He had seen Jesus and heard Him speak. He wrote so others could know Him too. John wrote, “Heavenly Father is light, and in Him is no darkness at all.” He is all good, without even…",
   "wordCount": 124
  },
  {
   "id": "b23-w4-n2",
   "title": "What Manner of Love",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 4,
   "night": 2,
   "scripture": "1 John 3:1–3",
   "scriptureBook": "1 John",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": [
    "identity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child needs to know, right now, that they are Heavenly Father's own child and He loves them.",
   "teaser": "John wrote words that sound like a happy gasp. “Behold, what manner of love the Father has given us!” Behold means, “Look! Look at this!” John could hardly believe it. Heavenly Father, greater than all the stars…",
   "wordCount": 108
  },
  {
   "id": "b23-w4-n3",
   "title": "Love in Deed and in Truth",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 4,
   "night": 3,
   "scripture": "1 John 3:16–18",
   "scriptureBook": "1 John",
   "traveler": "beau",
   "feeling": "loved",
   "virtues": [
    "service",
    "compassion"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child says I love you easily and needs to learn to show it by helping, sharing, and staying close.",
   "teaser": "John wanted everyone to know what real love looks like. So he pointed to Jesus. Jesus gave His life for us, and that shows us love. John said we should help each other that way too, a little every day. Then John…",
   "wordCount": 120
  },
  {
   "id": "b23-w4-n4",
   "title": "Heavenly Father Is Love",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 4,
   "night": 4,
   "scripture": "1 John 4:7–11, 18–19",
   "scriptureBook": "1 John",
   "traveler": "willow",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels scared at night and needs to know perfect love pushes fear out.",
   "teaser": "John wrote, “Beloved, let us love one another, for love is of Heavenly Father.” Then he wrote a short, big sentence: “Heavenly Father is love.” He does not only love. Love is who He is, the way the sun is full of…",
   "wordCount": 117
  },
  {
   "id": "b23-w4-n5",
   "title": "Children Walking in Truth",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 4,
   "night": 5,
   "scripture": "2 John 1:4–6; 3 John 1:4",
   "scriptureBook": "2 John",
   "traveler": "wren",
   "feeling": "happy",
   "virtues": [
    "integrity",
    "honesty"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "integrity",
   "teachingNote": "Reach for this when your child made a true choice today and needs to know it brings joy to the people who love them.",
   "teaser": "John wrote a very short letter to a lady and her children. He was so happy that he rejoiced greatly. He had found her children walking in truth. They were living the true way Heavenly Father teaches, step by step…",
   "wordCount": 124
  },
  {
   "id": "b23-w4-n6",
   "title": "Gaius the Helper",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 4,
   "night": 6,
   "scripture": "3 John 1:5–8, 11",
   "scriptureBook": "3 John",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "service",
    "generosity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child wants a way to help Jesus's work and needs Gaius, who welcomed and fed the traveling teachers.",
   "teaser": "John wrote a short letter to his friend Gaius. It was mostly a thank-you note. “You do faithfully whatever you do,” John wrote. Some believers went from town to town to teach about Jesus, like missionaries. They…",
   "wordCount": 116
  },
  {
   "id": "b23-w4-n7",
   "title": "Kept from Falling",
   "volume": "nt",
   "book": 23,
   "bookTitle": "Be Ye Doers of the Word!",
   "month": "November",
   "week": 4,
   "night": 7,
   "scripture": "Jude 1:1, 20–21, 24–25",
   "scriptureBook": "Jude",
   "traveler": "wren",
   "feeling": "safe",
   "virtues": [
    "trust-in-god",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels wobbly or afraid of falling short and needs to hear Jesus is able to keep them from falling.",
   "teaser": "Jude was the brother of James. He wrote a short letter to people who belong to Jesus. Jude said they were preserved in Jesus Christ. Preserved means kept safe, like jam sealed tight in a jar. Jude told his friends…",
   "wordCount": 114
  },
  {
   "id": "b24-w1-n1",
   "title": "Fear Not, I Am Alive",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 1,
   "night": 1,
   "scripture": "Revelation 1:9–13, 16–18",
   "scriptureBook": "Revelation",
   "traveler": "beau",
   "feeling": "safe",
   "virtues": [
    "courage",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child feels scared or lost and needs to picture Jesus laying His hand on John and saying, Fear not.",
   "teaser": "John was sent away to a little island called Patmos for teaching about Jesus. One Sunday, he heard a voice behind him, loud like a trumpet. John turned and saw Jesus among seven golden candlesticks. His face shone…",
   "wordCount": 118
  },
  {
   "id": "b24-w1-n2",
   "title": "Your First Love",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 1,
   "night": 2,
   "scripture": "Revelation 2:1–5",
   "scriptureBook": "Revelation",
   "traveler": "willow",
   "feeling": "happy",
   "virtues": [
    "repentance",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child has stopped enjoying good things for Jesus and needs to remember their first love and do it again.",
   "teaser": "Jesus had John write letters to seven groups of people who loved Him. The first went to the church in a city called Ephesus. Jesus began with kind words: “I know your works.” He saw how hard they worked and how…",
   "wordCount": 114
  },
  {
   "id": "b24-w1-n3",
   "title": "An Open Door",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 1,
   "night": 3,
   "scripture": "Revelation 3:7–8, 10–11",
   "scriptureBook": "Revelation",
   "traveler": "scout",
   "feeling": "brave",
   "virtues": [
    "perseverance",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "perseverance",
   "teachingNote": "Reach for this when your child feels too small to matter and needs to hear Jesus opens a door for those with a little strength.",
   "teaser": "Jesus wrote to a small church in Philadelphia, a name meaning brotherly love. The people there were not big or strong. But Jesus had good news for them. “I have set before you an open door,” He said. “No one can…",
   "wordCount": 109
  },
  {
   "id": "b24-w1-n4",
   "title": "I Stand at the Door",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 1,
   "night": 4,
   "scripture": "Revelation 3:14–16, 20",
   "scriptureBook": "Revelation",
   "traveler": "willow",
   "feeling": "connected",
   "virtues": [
    "prayer",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child feels lukewarm or far from Jesus and needs the picture of Him gently knocking and waiting.",
   "teaser": "Jesus sent a letter to a church in a rich city called Laodicea. He told them, “You are not cold, and you are not hot.” Think of a drink that is not cold and not hot, just lukewarm. Nobody wants that! The people had…",
   "wordCount": 122
  },
  {
   "id": "b24-w1-n5",
   "title": "A Rainbow Round the Throne",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 1,
   "night": 5,
   "scripture": "Revelation 4:1–3, 8, 11",
   "scriptureBook": "Revelation",
   "traveler": "wren",
   "feeling": "amazed",
   "virtues": [
    "reverence",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child is ready to worship and needs the picture of a rainbow around the throne and heaven singing holy.",
   "teaser": "Next, John saw a door open in heaven. A trumpet voice said, “Come up here, and I will show you.” John saw a throne, a king’s chair. Heavenly Father sat on it. A rainbow went all around it, green like an emerald…",
   "wordCount": 109
  },
  {
   "id": "b24-w1-n6",
   "title": "The Lamb Is Worthy",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 1,
   "night": 6,
   "scripture": "Revelation 5:1–9",
   "scriptureBook": "Revelation",
   "traveler": "scout",
   "feeling": "comforted",
   "virtues": [
    "hope",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child faces something too hard for anyone and needs to see that Jesus, the Lamb, is worthy and able.",
   "teaser": "John saw Heavenly Father holding a rolled-up book. It was shut with seven wax seals, so no one could peek inside. A strong angel called out, “Who is worthy to open the book?” No one in heaven or on earth could open…",
   "wordCount": 118
  },
  {
   "id": "b24-w1-n7",
   "title": "Worthy Is the Lamb",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 1,
   "night": 7,
   "scripture": "Revelation 5:11–14",
   "scriptureBook": "Revelation",
   "traveler": "beau",
   "feeling": "excited",
   "virtues": [
    "reverence",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child wants to praise Jesus and needs to join the countless angels singing, Worthy is the Lamb.",
   "teaser": "When Jesus, the Lamb, took the book, heaven burst into song. John heard many angels all around the throne. How many angels? Ten thousand times ten thousand, and thousands of thousands! That is more angels than…",
   "wordCount": 114
  },
  {
   "id": "b24-w2-n1",
   "title": "Sealed as His Own",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 2,
   "night": 1,
   "scripture": "Revelation 7:1–4",
   "scriptureBook": "Revelation",
   "traveler": "wren",
   "feeling": "safe",
   "virtues": [
    "identity",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child wonders whether they belong and needs to know Heavenly Father marks His own and misses no one.",
   "teaser": "John saw four angels standing at the four corners of the earth. They held back the winds, so not one leaf on a tree would blow. Another angel came from the east, where the sun comes up. He carried Heavenly Father’s…",
   "wordCount": 116
  },
  {
   "id": "b24-w2-n2",
   "title": "He Wipes Away All Tears",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 2,
   "night": 2,
   "scripture": "Revelation 7:9–10, 13–17",
   "scriptureBook": "Revelation",
   "traveler": "willow",
   "feeling": "comforted",
   "virtues": [
    "comfort",
    "compassion"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "comfort",
   "teachingNote": "Reach for this when your child is crying or sad and needs to know Heavenly Father sees every tear and will wipe them away.",
   "teaser": "John saw a crowd too big to count, from every country and language. They stood before Heavenly Father’s throne and Jesus, the Lamb. They wore white robes and held palm branches. With loud voices, they praised…",
   "wordCount": 113
  },
  {
   "id": "b24-w2-n3",
   "title": "Prayers Like Sweet Smoke",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 2,
   "night": 3,
   "scripture": "Revelation 8:3–4",
   "scriptureBook": "Revelation",
   "traveler": "scout",
   "feeling": "calm",
   "virtues": [
    "prayer",
    "reverence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child wonders whether prayers are heard and needs the picture of sweet smoke rising to Heavenly Father.",
   "teaser": "John saw an angel at the golden altar, a special table before the throne. The angel held a golden cup for burning incense. Incense is something that makes sweet-smelling smoke when it burns. The angel was given lots…",
   "wordCount": 118
  },
  {
   "id": "b24-w2-n4",
   "title": "Sweet as Honey",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 2,
   "night": 4,
   "scripture": "Revelation 10:8–11",
   "scriptureBook": "Revelation",
   "traveler": "wren",
   "feeling": "happy",
   "virtues": [
    "love-of-scripture",
    "pondering"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this when your child finds scripture hard to sit through and needs John's picture of a little book sweet as honey.",
   "teaser": "A mighty angel came down from heaven. A rainbow was on his head, and his face shone like the sun. He held a little open book. A voice from heaven told John to take it. So John said, “Give me the little book.” The…",
   "wordCount": 111
  },
  {
   "id": "b24-w2-n5",
   "title": "They Overcame by the Lamb",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 2,
   "night": 5,
   "scripture": "Revelation 12:10–11",
   "scriptureBook": "Revelation",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "identity",
    "stand-for-truth"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child hears a mean inside voice say they are bad and needs to answer with Jesus and their testimony.",
   "teaser": "Before the world was made, there was a war in heaven. The enemy of all that is good lost, and was thrown out. Then John heard a loud, happy voice in heaven. It said the accuser was thrown down. An accuser points and…",
   "wordCount": 115
  },
  {
   "id": "b24-w2-n6",
   "title": "An Angel with the Gospel",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 2,
   "night": 6,
   "scripture": "Revelation 14:6–7",
   "scriptureBook": "Revelation",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "service",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child wants to share Jesus and needs the angel flying with good news for every person on the earth.",
   "teaser": "John saw another angel flying through the sky! He carried the everlasting gospel, the good news of Jesus that never ends. Who was the good news for? Every nation, every family, and every language. Everyone on the…",
   "wordCount": 104
  },
  {
   "id": "b24-w2-n7",
   "title": "Their Works Do Follow Them",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 2,
   "night": 7,
   "scripture": "Revelation 14:12–13",
   "scriptureBook": "Revelation",
   "traveler": "willow",
   "feeling": "calm",
   "virtues": [
    "perseverance",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "perseverance",
   "teachingNote": "Reach for this when your child wonders whether good deeds matter and needs to hear the good we do follows us and is never lost.",
   "teaser": "John wrote about Heavenly Father’s patient people. They kept His commandments and kept believing in Jesus, even when it was hard. Then John heard a voice from heaven say, “Write.” The voice said that people who die…",
   "wordCount": 103
  },
  {
   "id": "b24-w3-n1",
   "title": "The Song of the Lamb",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 3,
   "night": 1,
   "scripture": "Revelation 15:2–4",
   "scriptureBook": "Revelation",
   "traveler": "beau",
   "feeling": "happy",
   "virtues": [
    "perseverance",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "perseverance",
   "teachingNote": "Reach for this when your child is going through something hard and needs the singers on the sea of glass who stayed true and sang.",
   "teaser": "Jesus’s friend John saw a picture of heaven. He saw a sea of glass glowing with fire, like a shining mirror. On it stood people who had stayed true to Jesus through hard things. They held Heavenly Father’s harps…",
   "wordCount": 118
  },
  {
   "id": "b24-w3-n2",
   "title": "Invited to the Feast",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 3,
   "night": 2,
   "scripture": "Revelation 19:6–9",
   "scriptureBook": "Revelation",
   "traveler": "willow",
   "feeling": "excited",
   "virtues": [
    "identity",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels left out and needs to know Jesus has a seat with their name at His great feast.",
   "teaser": "John heard a huge sound in heaven. It was like a big crowd, rushing water, and thunder all at once. The voices shouted, “Alleluia!” which means “Praise the Lord!” Heavenly Father has all power, and He is King. “Be…",
   "wordCount": 119
  },
  {
   "id": "b24-w3-n3",
   "title": "King of Kings",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 3,
   "night": 3,
   "scripture": "Revelation 19:11–16",
   "scriptureBook": "Revelation",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "faith",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child worries the world is unfair and needs to see Jesus, Faithful and True, riding to make all things right.",
   "teaser": "John wrote this for Jesus’s friends, who were having a hard time. He wanted them to know Jesus will make everything right. John saw heaven open wide. Out came a rider on a white horse. His name was Faithful and…",
   "wordCount": 121
  },
  {
   "id": "b24-w3-n4",
   "title": "No More Tears",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 3,
   "night": 4,
   "scripture": "Revelation 21:1–4",
   "scriptureBook": "Revelation",
   "traveler": "wren",
   "feeling": "sad",
   "virtues": [
    "hope",
    "comfort"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child is sad tonight and needs the promise that one day there will be no more tears or pain.",
   "teaser": "John saw a new heaven and a new earth. The old, broken things were gone. Then John saw a holy city coming down from heaven, called New Jerusalem. It was lovely, like a bride all dressed up for her wedding. A big…",
   "wordCount": 111
  },
  {
   "id": "b24-w3-n5",
   "title": "The City of Gold",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 3,
   "night": 5,
   "scripture": "Revelation 21:10–12, 18–23",
   "scriptureBook": "Revelation",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "wonder",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wonder",
   "teachingNote": "Reach for this when your child asks what heaven is like and needs John's picture of a golden city lit by Jesus.",
   "teaser": "An angel took John up a great, high mountain. From there, John saw the holy city coming down from heaven. It shone like a bright jewel, clear as crystal. It had a high wall with twelve gates, and an angel at every…",
   "wordCount": 117
  },
  {
   "id": "b24-w3-n6",
   "title": "The Tree of Life",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 3,
   "night": 6,
   "scripture": "Revelation 22:1–5",
   "scriptureBook": "Revelation",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "hope",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child is thirsty or worn out and needs the picture of the river and tree of life that make everything well.",
   "teaser": "The angel showed John a river inside the holy city. Its water was clean and clear, like crystal. It was the river of the water of life. The river flowed from the throne of Heavenly Father and of Jesus, the Lamb. On…",
   "wordCount": 117
  },
  {
   "id": "b24-w3-n7",
   "title": "Even So, Come, Lord Jesus",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 3,
   "night": 7,
   "scripture": "Revelation 21:7; 22:12–13, 20–21",
   "scriptureBook": "Revelation",
   "traveler": "beau",
   "feeling": "eager",
   "virtues": [
    "hope",
    "perseverance"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child waits for Jesus to come again and needs to keep going and say, Even so, come, Lord Jesus.",
   "teaser": "John heard a promise for all who keep going, even when it is hard. They will inherit all things, like children sharing all their Father has. Near the end of the Bible, Jesus said, “I am coming soon. I am bringing a…",
   "wordCount": 124
  },
  {
   "id": "b24-w4-n1",
   "title": "Be It unto Me",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 4,
   "night": 1,
   "scripture": "Luke 1:26–38",
   "scriptureBook": "Luke",
   "traveler": "willow",
   "feeling": "brave",
   "virtues": [
    "faith",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child is asked to do something new and big and needs Mary's brave yes to Heavenly Father's word.",
   "teaser": "In a little town called Nazareth lived Mary. She was going to marry a man named Joseph. Heavenly Father sent the angel Gabriel to Mary. “The Lord is with you,” Gabriel said. Mary felt troubled and wondered what he…",
   "wordCount": 125
  },
  {
   "id": "b24-w4-n2",
   "title": "Call His Name Jesus",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 4,
   "night": 2,
   "scripture": "Matthew 1:18–25",
   "scriptureBook": "Matthew",
   "traveler": "beau",
   "feeling": "confused",
   "virtues": [
    "trust-in-god",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child does not understand what is happening and needs Joseph, who trusted, stayed close, and did as the angel said.",
   "teaser": "Joseph was going to marry Mary. She would have a baby, and he did not understand. Joseph was a good, kind man. He thought about quietly going away. While he was thinking, an angel came to him in a dream. “Joseph, do…",
   "wordCount": 124
  },
  {
   "id": "b24-w4-n3",
   "title": "No Room in the Inn",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 4,
   "night": 3,
   "scripture": "Luke 2:1–7",
   "scriptureBook": "Luke",
   "traveler": "wren",
   "feeling": "amazed",
   "virtues": [
    "humility",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child wants Christmas to be big and fancy and needs to see the King of heaven laid in a manger.",
   "teaser": "Long ago, a ruler named Caesar Augustus made a rule. Everyone had to go to their family’s own town to be counted. Joseph’s family came from Bethlehem, King David’s town. So Joseph and Mary went there, a long way…",
   "wordCount": 123
  },
  {
   "id": "b24-w4-n4",
   "title": "Good Tidings of Great Joy",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 4,
   "night": 4,
   "scripture": "Luke 2:8–14",
   "scriptureBook": "Luke",
   "traveler": "scout",
   "feeling": "excited",
   "virtues": [
    "gratitude",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child is bursting about Christmas and needs to hear the angel's good tidings of great joy for all people.",
   "teaser": "That same night, shepherds were out in the fields near Bethlehem. They stayed out all night, keeping their sheep safe. Suddenly an angel came, and the Lord’s bright glory shone all around them. The dark field filled…",
   "wordCount": 124
  },
  {
   "id": "b24-w4-n5",
   "title": "Mary Kept These Things",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 4,
   "night": 5,
   "scripture": "Luke 2:15–20",
   "scriptureBook": "Luke",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "pondering",
    "reverence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "pondering",
   "teachingNote": "Reach for this when your child is rushed by a loud, busy Christmas and needs to be still like Mary and keep Jesus in their heart.",
   "teaser": "When the angels went back into heaven, the shepherds said, “Let’s go to Bethlehem! Let’s see what the Lord told us about.” They hurried and found Mary, Joseph, and baby Jesus lying in a manger. It was just as the…",
   "wordCount": 117
  },
  {
   "id": "b24-w4-n6",
   "title": "Wise Men Follow the Star",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 4,
   "night": 6,
   "scripture": "Matthew 2:1–2, 9–11",
   "scriptureBook": "Matthew",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": [
    "faith",
    "diligence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child wants to find Jesus and needs the wise men, who kept following the star until they found Him.",
   "teaser": "When Jesus was born, wise men came from far away in the east. They had seen His star in the sky. They asked in Jerusalem, “Where is the one born King of the Jews? We saw His star, and we came to worship Him.” On…",
   "wordCount": 125
  },
  {
   "id": "b24-w4-n7",
   "title": "Simeon and Anna See Him",
   "volume": "nt",
   "book": 24,
   "bookTitle": "Good Tidings of Great Joy!",
   "month": "December",
   "week": 4,
   "night": 7,
   "scripture": "Luke 2:25–38",
   "scriptureBook": "Luke",
   "traveler": "willow",
   "feeling": "impatient",
   "virtues": [
    "patience",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "patience",
   "teachingNote": "Reach for this when your child is tired of waiting for something and needs Simeon and Anna, who waited and saw Heavenly Father keep His promise.",
   "teaser": "When Jesus was a tiny baby, Mary and Joseph took Him to Jerusalem. They brought Him to the temple, Heavenly Father’s holy house. An old man named Simeon was good and faithful. The Holy Ghost had promised he would…",
   "wordCount": 125
  }
 ]
};
