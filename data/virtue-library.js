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
  "storyCount": 147,
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
   "book": 6,
   "month": "June",
   "title": "A Heart That Follows the Lord",
   "amazon": "https://www.amazon.com/Follows-Scripture-Travelers-Bedtime-Stories/dp/B0H3ZDCFSR/"
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
    { "book": 9, "month": "September", "title": "Wonderful Is His Way",
      "amazon": "https://a.co/d/04uVtSA4" },
    { "book": 10, "month": "October", "title": "He Gathers the Lambs",
      "amazon": "https://a.co/d/0iacBH3H" }
 ],
 "stories": [
  {
   "id": "b6-w1-n1",
   "title": "Ruth Stays with Naomi",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 1,
   "night": 1,
   "scripture": "Ruth 1",
   "scriptureBook": "Ruth",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "family-love",
    "keeping-promises",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "family-love",
   "teachingNote": "Reach for this when your child wants to walk away from someone who is sad or struggling instead of staying close.",
   "teaser": "Naomi lived far from home with her husband and two sons. Sadly, her husband died. Then both of her sons died too. Naomi felt very sad and alone. Naomi's daughter-in-law Ruth loved her very much. Naomi said, \"You should go…",
   "wordCount": 117
  },
  {
   "id": "b6-w1-n2",
   "title": "Ruth Works in the Field",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 1,
   "night": 2,
   "scripture": "Ruth 2",
   "scriptureBook": "Ruth",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "diligence",
    "service",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "diligence",
   "teachingNote": "Reach for this when chores feel boring and your child needs a reason to work cheerfully instead of complaining.",
   "teaser": "Ruth and Naomi needed food. Ruth said, \"I will go work in the fields.\" She went to pick up leftover grain that the workers dropped. Ruth worked in a field that belonged to a kind man named Boaz. Boaz saw…",
   "wordCount": 105
  },
  {
   "id": "b6-w1-n3",
   "title": "Boaz Marries Ruth",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 1,
   "night": 3,
   "scripture": "Ruth 3-4",
   "scriptureBook": "Ruth",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "faith",
    "diligence",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child is discouraged during a hard season and needs hope that staying faithful leads somewhere good.",
   "teaser": "Boaz thought Ruth was wonderful. Ruth was kind, hard-working, and loyal. Boaz wanted to take care of Ruth and Naomi. Boaz asked Ruth to marry him. Ruth said yes! They had a beautiful wedding. Now Ruth had a loving husband…",
   "wordCount": 102
  },
  {
   "id": "b6-w1-n4",
   "title": "Hannah Prays for a Baby",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 1,
   "night": 4,
   "scripture": null,
   "scriptureBook": null,
   "traveler": null,
   "feeling": null,
   "virtues": [
    "prayer",
    "faith",
    "keeping-promises"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child wants something very badly, or needs to know that Heavenly Father hears a prayer prayed with a whole heart.",
   "teaser": "Hannah wanted a baby very much. But she didn't have any children. This made her so sad that she cried and cried. Hannah went to the temple to pray. She prayed with all her heart: \"Heavenly Father, please give me…",
   "wordCount": 99
  },
  {
   "id": "b6-w1-n5",
   "title": "Samuel Goes to the Temple",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 1,
   "night": 5,
   "scripture": "1 Samuel 2",
   "scriptureBook": "1 Samuel",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "courage",
    "obedience",
    "keeping-promises"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child faces something new and scary, like a first day somewhere unfamiliar.",
   "teaser": "When Samuel was still a little boy, Hannah kept her promise. She brought Samuel to the temple. An old priest named Eli lived there. Hannah said, \"This is the son I prayed for. Now I'm giving him back to Heavenly…",
   "wordCount": 100
  },
  {
   "id": "b6-w1-n6",
   "title": "The Lord Calls Samuel",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 1,
   "night": 6,
   "scripture": "1 Samuel 3",
   "scriptureBook": "1 Samuel",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "prayer",
    "obedience",
    "heeding-counsel"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when teaching your child to recognize and respond to Heavenly Father's voice, especially at bedtime.",
   "teaser": "One night, Samuel was sleeping at the temple. Suddenly he heard someone call his name: \"Samuel! Samuel!\" He ran to Eli and said, \"Here I am!\" But Eli said, \"I didn't call you. Go back to bed.\" Samuel went back…",
   "wordCount": 108
  },
  {
   "id": "b6-w1-n7",
   "title": "God's Power and the Ark",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 1,
   "night": 7,
   "scripture": "1 Samuel 4-7",
   "scriptureBook": "1 Samuel",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "trust-in-god",
    "reverence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child needs reassurance that Heavenly Father is more powerful than anything that feels scary.",
   "teaser": "Israel had a special golden box called the Ark of the Covenant. It held the Ten Commandments. The Ark showed that Heavenly Father was with His people. Israel's enemies captured the Ark in battle! They took it to their city.…",
   "wordCount": 115
  },
  {
   "id": "b6-w2-n1",
   "title": "Israel Wants a King",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 2,
   "night": 1,
   "scripture": "1 Samuel 8",
   "scriptureBook": "1 Samuel",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "contentment",
    "heeding-counsel",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "contentment",
   "teachingNote": "Reach for this when your child wants something just because a friend has it and needs help feeling grateful instead.",
   "teaser": "The prophet Samuel was getting old. He had been Israel's leader for a long time. The people came to Samuel and said, \"We want a king like all the other nations have!\" Samuel felt sad. He prayed to Heavenly Father.…",
   "wordCount": 116
  },
  {
   "id": "b6-w2-n2",
   "title": "Saul Looks for Donkeys",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 2,
   "night": 2,
   "scripture": "1 Samuel 9",
   "scriptureBook": "1 Samuel",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "trust-in-god",
    "diligence",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child thinks their ordinary chores and small jobs do not matter — Heavenly Father was preparing Saul while he looked for lost donkeys.",
   "teaser": "There was a young man named Saul. He was tall and handsome. One day, his father's donkeys ran away. Saul and his servant went to look for them everywhere. After searching for days, they couldn't find the donkeys. Saul said…",
   "wordCount": 122
  },
  {
   "id": "b6-w2-n3",
   "title": "Saul is Anointed King",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 2,
   "night": 3,
   "scripture": null,
   "scriptureBook": null,
   "traveler": null,
   "feeling": null,
   "virtues": [
    "humility",
    "courage",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child is asked to do something that feels too big and wants to hide, the way Saul hid among the baggage.",
   "teaser": "Samuel took a special bottle of oil. He poured it on Saul's head. This meant Saul was chosen to be king! Samuel said, \"Heavenly Father has anointed you to be the leader of His people.\" Later, Samuel gathered all of…",
   "wordCount": 116
  },
  {
   "id": "b6-w2-n4",
   "title": "Saul Doesn't Wait",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 2,
   "night": 4,
   "scripture": "1 Samuel 13",
   "scriptureBook": "1 Samuel",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "patience",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "patience",
   "teachingNote": "Reach for this when waiting feels unbearable and your child is tempted to act now instead of holding on a little longer.",
   "teaser": "Israel's enemies were coming to attack! King Saul and his soldiers were scared. Samuel told Saul, \"Wait seven days. I'll come and make an offering to Heavenly Father for you.\" Saul waited. Day one, day two, day three... His soldiers…",
   "wordCount": 110
  },
  {
   "id": "b6-w2-n5",
   "title": "Obey is Better Than Sacrifice",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 2,
   "night": 5,
   "scripture": "1 Samuel 15",
   "scriptureBook": "1 Samuel",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "obedience",
    "integrity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child obeys only part of an instruction and needs to learn that halfway isn't really obeying.",
   "teaser": "Heavenly Father told King Saul through Samuel: \"Fight the Amalekites and destroy everything.\" This was a test to see if Saul would obey completely. Saul fought the battle. But he didn't obey all the way! He kept the best animals…",
   "wordCount": 118
  },
  {
   "id": "b6-w2-n6",
   "title": "God Chooses David",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 2,
   "night": 6,
   "scripture": "1 Samuel 16:1-13",
   "scriptureBook": "1 Samuel",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "identity",
    "integrity",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels overlooked for being small or young and needs to know their heart matters most.",
   "teaser": "Heavenly Father told Samuel, \"Go to Jesse's house. I've chosen one of his sons to be the next king.\" Samuel went. Jesse had EIGHT sons! Jesse's oldest son came first. He was tall and handsome! Samuel thought, \"This must be…",
   "wordCount": 129
  },
  {
   "id": "b6-w2-n7",
   "title": "David Plays Music for Saul",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 2,
   "night": 7,
   "scripture": "1 Samuel 16:14-23",
   "scriptureBook": "1 Samuel",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "service",
    "compassion"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child has a talent and needs encouragement to use it to help someone who is struggling.",
   "teaser": "After Saul disobeyed, an evil spirit troubled him. He felt sad and angry all the time. His servants said, \"Let's find someone to play music for you. Music might help!\" Someone said, \"Jesse's son David plays the harp beautifully. He's…",
   "wordCount": 111
  },
  {
   "id": "b6-w3-n1",
   "title": "David and Goliath",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 3,
   "night": 1,
   "scripture": "1 Samuel 17",
   "scriptureBook": "1 Samuel",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "courage",
    "faith",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child feels small next to a big problem and needs courage that Heavenly Father is near.",
   "teaser": "Israel's enemies had a HUGE giant soldier named Goliath. He was over nine feet tall! Every day he yelled, \"Send me a fighter!\" All of Israel's soldiers were too scared. A young shepherd boy named David came to bring food…",
   "wordCount": 120
  },
  {
   "id": "b6-w3-n2",
   "title": "David and Jonathan Are Best Friends",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 3,
   "night": 2,
   "scripture": "1 Samuel 18",
   "scriptureBook": "1 Samuel",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "generosity",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child sees a friend succeed and needs help feeling happy for them instead of jealous.",
   "teaser": "King Saul's son Jonathan saw how brave David was. They became best friends right away! Jonathan loved David like a brother. Jonathan gave David his special royal robe. He gave him his sword and his bow. That was a HUGE…",
   "wordCount": 106
  },
  {
   "id": "b6-w3-n3",
   "title": "Saul Gets Jealous of David",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 3,
   "night": 3,
   "scripture": "1 Samuel 18:6-16",
   "scriptureBook": "1 Samuel",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "self-control",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "self-control",
   "teachingNote": "Reach for this when jealousy is creeping into your child's heart over someone else's praise or good fortune.",
   "teaser": "The people loved David! They sang a song: \"Saul has won thousands, but David has won TENS of thousands!\" Hearing this made King Saul angry. Saul felt jealous. He thought, \"Why do people love David more than me?\" His heart…",
   "wordCount": 96
  },
  {
   "id": "b6-w3-n4",
   "title": "David Forgives Saul in the Cave",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 3,
   "night": 4,
   "scripture": "1 Samuel 24",
   "scriptureBook": "1 Samuel",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "forgiveness",
    "self-control",
    "integrity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "forgiveness",
   "teachingNote": "Reach for this when your child has a chance to get back at someone who was unkind but could choose mercy instead.",
   "teaser": "King Saul was still angry. He chased David with his soldiers! David and his men hid in a big dark cave. Then something amazing happened. King Saul came RIGHT into the same cave! He didn't see David in the dark.…",
   "wordCount": 110
  },
  {
   "id": "b6-w3-n5",
   "title": "Wise Abigail Stops Trouble",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 3,
   "night": 5,
   "scripture": "1 Samuel 25",
   "scriptureBook": "1 Samuel",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "peacemaking",
    "kindness",
    "wisdom"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "peacemaking",
   "teachingNote": "Reach for this when tempers are rising at home and your child could use kind words to calm things down.",
   "teaser": "There was a rich, mean man named Nabal. David and his men had been kind to Nabal's workers. So David asked Nabal politely for some food. But Nabal said meanly, \"Who is David? I won't give him anything!\" David got…",
   "wordCount": 101
  },
  {
   "id": "b6-w3-n6",
   "title": "David Becomes King",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 3,
   "night": 6,
   "scripture": "2 Samuel 5",
   "scriptureBook": "2 Samuel",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "patience",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "patience",
   "teachingNote": "Reach for this when your child wants to rush or grab for something good instead of waiting for the right time.",
   "teaser": "King Saul finally died in a battle. The Israelites came together. They said to David, \"We want YOU to be our king!\" David was 30 years old when he became king. He ruled for 40 years! He was a king…",
   "wordCount": 93
  },
  {
   "id": "b6-w3-n7",
   "title": "David Dances Before the Lord",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 3,
   "night": 7,
   "scripture": "2 Samuel 6",
   "scriptureBook": "2 Samuel",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "reverence",
    "gratitude"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this when your child feels shy about showing joy for Heavenly Father and worries what others will think.",
   "teaser": "The Ark of the Covenant was Heavenly Father's special holy box. David wanted to bring it to Jerusalem! He was SO happy and excited! As the Ark came into the city, David couldn't stop being happy! He danced and danced…",
   "wordCount": 108
  },
  {
   "id": "b6-w4-n1",
   "title": "David Makes a Big Mistake",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 4,
   "night": 1,
   "scripture": "2 Samuel 11",
   "scriptureBook": "2 Samuel",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "self-control",
    "integrity",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "self-control",
   "teachingNote": "Reach for this when your child is tempted by something that isn't theirs and needs help looking away early.",
   "teaser": "King David was a good king who loved Heavenly Father. But one day, he made a very big mistake. He saw something that wasn't his and wanted it. Instead of looking away, David kept thinking about it. He made bad…",
   "wordCount": 105
  },
  {
   "id": "b6-w4-n2",
   "title": "David Says Sorry",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 4,
   "night": 2,
   "scripture": "2 Samuel 12",
   "scriptureBook": "2 Samuel",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "repentance",
    "honesty"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child has done something wrong and needs the words and steps for making it right.",
   "teaser": "Heavenly Father sent the prophet Nathan to talk to King David. Nathan told David a sad story about a rich man who took a poor man's only sheep. David got SO angry! He said, \"That rich man should be punished!\"…",
   "wordCount": 114
  },
  {
   "id": "b6-w4-n3",
   "title": "Solomon Asks for Wisdom",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 4,
   "night": 3,
   "scripture": "1 Kings 3:1-15",
   "scriptureBook": "1 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "wisdom",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wisdom",
   "teachingNote": "Reach for this when talking with your child about what's truly worth praying and asking for.",
   "teaser": "After David, his son Solomon became king. Solomon was young. He wanted to be a good king like his father had been. One night, Solomon had a dream. Heavenly Father said, \"Solomon, ask Me for anything! What do you want?\"…",
   "wordCount": 106
  },
  {
   "id": "b6-w4-n4",
   "title": "Two Mothers and One Baby",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 4,
   "night": 4,
   "scripture": "1 Kings 3:16-28",
   "scriptureBook": "1 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "compassion",
    "wisdom",
    "family-love"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "compassion",
   "teachingNote": "Reach for this when teaching your child that real love means wanting what's best for someone else, even a hard sacrifice.",
   "teaser": "Two mothers came to King Solomon. They were arguing about a baby! Both of them said, \"This baby is MINE!\" They needed Solomon to help them. Solomon thought carefully. Then he said something shocking: \"Bring me a sword! I'll cut…",
   "wordCount": 113
  },
  {
   "id": "b6-w4-n5",
   "title": "Building the Temple",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 4,
   "night": 5,
   "scripture": "1 Kings 6",
   "scriptureBook": "1 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "diligence",
    "reverence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "diligence",
   "teachingNote": "Reach for this when your child is tempted to do a job halfway and needs encouragement to give their very best.",
   "teaser": "King Solomon wanted to build a beautiful temple for Heavenly Father. He gathered the BEST materials — strong cedar wood, smooth stones, and shining gold! Thousands of workers helped. They cut the stones perfectly far away. When they put the…",
   "wordCount": 118
  },
  {
   "id": "b6-w4-n6",
   "title": "Solomon's Prayer at the Temple",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 4,
   "night": 6,
   "scripture": "1 Kings 8",
   "scriptureBook": "1 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "prayer",
    "reverence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when introducing your child to praying for other people, not just for themselves.",
   "teaser": "When the temple was finished, Solomon gathered ALL of Israel together. He stood in front of the new temple. It was time to dedicate it to Heavenly Father! Solomon knelt down. He spread out his hands toward heaven. He prayed…",
   "wordCount": 107
  },
  {
   "id": "b6-w4-n7",
   "title": "Keep Your Heart Close to God",
   "volume": "ot",
   "book": 6,
   "bookTitle": "A Heart That Follows the Lord",
   "month": "June",
   "week": 4,
   "night": 7,
   "scripture": "1 Kings 9; 11",
   "scriptureBook": "1 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "faith",
    "obedience",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when talking about choosing Heavenly Father every day, not just on the easy days.",
   "teaser": "After the beautiful temple was built, Heavenly Father appeared to Solomon again. He had something very important to tell him. Heavenly Father said, \"Solomon, if you keep My commandments and follow Me, you and your family will be blessed forever!…",
   "wordCount": 113
  },
  {
   "id": "b7-w1-n1",
   "title": "Two Kings, One Choice",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 1,
   "night": 1,
   "scripture": "1 Kings 12",
   "scriptureBook": "1 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "heeding-counsel",
    "kindness"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "heeding-counsel",
   "teachingNote": "Reach for this when your child needs to hear why listening to wise parents matters more than listening to peers.",
   "teaser": "Long ago, wise King Solomon died. His son Rehoboam became the new king. The people came to him and said, \"Please be kind and gentle to us.\" Rehoboam said, \"Give me three days to think.\" First he asked the old…",
   "wordCount": 139
  },
  {
   "id": "b7-w1-n2",
   "title": "The Ravens Feed Elijah",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 1,
   "night": 2,
   "scripture": "1 Kings 17",
   "scriptureBook": "1 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "trust-in-god",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child worries whether their needs will be met and needs reassurance that Heavenly Father provides.",
   "teaser": "Elijah was a prophet who loved Heavenly Father. He told the wicked king there would be no rain for a long time. Then Heavenly Father said, \"Go hide by the little brook. I will take care of you.\" Elijah went…",
   "wordCount": 131
  },
  {
   "id": "b7-w1-n3",
   "title": "The Jar That Never Ran Out",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 1,
   "night": 3,
   "scripture": "1 Kings 17",
   "scriptureBook": "1 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "generosity",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child is afraid there isn't enough to share and needs courage to give anyway.",
   "teaser": "Heavenly Father sent Elijah to a poor widow in another town. She had a little boy and almost no food left. She had just a tiny bit of flour and a tiny bit of oil. She thought it was their…",
   "wordCount": 142
  },
  {
   "id": "b7-w1-n4",
   "title": "Elijah Prays for the Little Boy",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 1,
   "night": 4,
   "scripture": "1 Kings 17",
   "scriptureBook": "1 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "prayer",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child faces something that feels too big or scary and needs to know prayer really helps.",
   "teaser": "The widow's little boy got very, very sick. He got so sick that he stopped breathing. His mother was heartbroken and cried. She did not know what to do. Elijah said, \"Give me your son.\" He carried the boy upstairs…",
   "wordCount": 118
  },
  {
   "id": "b7-w1-n5",
   "title": "Fire from Heaven",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 1,
   "night": 5,
   "scripture": "1 Kings 18",
   "scriptureBook": "1 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "trust-in-god",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child is choosing between Heavenly Father and something else that's competing for first place.",
   "teaser": "Many people had forgotten Heavenly Father. They worshiped a pretend god named Baal. Elijah said, \"Let's find out who the real Heavenly Father is!\" He gathered everyone on top of a mountain. The prophets of Baal called and called to…",
   "wordCount": 142
  },
  {
   "id": "b7-w1-n6",
   "title": "The Still, Small Voice",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 1,
   "night": 6,
   "scripture": "1 Kings 19",
   "scriptureBook": "1 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "pondering",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "pondering",
   "teachingNote": "Reach for this when your child is too wound up to notice Heavenly Father's quiet promptings and needs to practice being still.",
   "teaser": "Elijah was tired and scared and ran far away. He sat down all alone and felt very sad. Heavenly Father sent an angel to bring him food and rest. Then Heavenly Father told Elijah to wait on the mountain. First…",
   "wordCount": 140
  },
  {
   "id": "b7-w1-n7",
   "title": "Micaiah Tells the Truth",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 1,
   "night": 7,
   "scripture": "1 Kings 22",
   "scriptureBook": "1 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "stand-for-truth",
    "honesty",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "stand-for-truth",
   "teachingNote": "Reach for this when your child is tempted to say what others want to hear instead of what's true.",
   "teaser": "King Ahab wanted to go to a big battle. He gathered lots of prophets who only said what he wanted to hear. \"You'll win! You'll win!\" they cheered. But that wasn't really true. There was one true prophet named Micaiah.…",
   "wordCount": 143
  },
  {
   "id": "b7-w2-n1",
   "title": "Elijah Goes Up to Heaven",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 2,
   "night": 1,
   "scripture": "2 Kings 2",
   "scriptureBook": "2 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "family-love",
    "faith",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "family-love",
   "teachingNote": "Reach for this when a friendship or family bond is changing and your child needs comfort that loving loyalty carries on.",
   "teaser": "Elijah the prophet was very old. His helper Elisha loved him and stayed close by his side. Elisha would not leave Elijah, no matter what. They walked together as good friends. They came to a river. Elijah rolled up his…",
   "wordCount": 135
  },
  {
   "id": "b7-w2-n2",
   "title": "The Widow's Oil",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 2,
   "night": 2,
   "scripture": "2 Kings 4",
   "scriptureBook": "2 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "obedience",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "obedience",
   "teachingNote": "Reach for this when your child needs to see that cheerfully following instructions can lead to surprising blessings.",
   "teaser": "A kind woman was very sad. Her husband had died, and she owed money she could not pay. All she had left was one little pot of oil. She came to the prophet Elisha for help. Elisha said, \"Go borrow…",
   "wordCount": 138
  },
  {
   "id": "b7-w2-n3",
   "title": "A Special Room for the Prophet",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 2,
   "night": 3,
   "scripture": "2 Kings 4",
   "scriptureBook": "2 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "kindness",
    "generosity",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when encouraging your child to make room for someone else with a quiet, generous gesture.",
   "teaser": "There was a kind woman who loved Heavenly Father. Whenever Elisha walked by, she gave him food. She told her husband, \"Let's make a little room for the prophet.\" So they built him a cozy room with a bed, a…",
   "wordCount": 145
  },
  {
   "id": "b7-w2-n4",
   "title": "Naaman Washes Seven Times",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 2,
   "night": 4,
   "scripture": "2 Kings 5",
   "scriptureBook": "2 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "humility",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child thinks a simple instruction is beneath them and resists doing the easy thing anyway.",
   "teaser": "Naaman was a strong, important soldier. But he was very sick with sores all over his skin. A little servant girl said, \"There's a prophet who can help you!\" So Naaman traveled to find Elisha. Elisha sent a simple message…",
   "wordCount": 136
  },
  {
   "id": "b7-w2-n5",
   "title": "The Floating Axe Head",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 2,
   "night": 5,
   "scripture": "2 Kings 6",
   "scriptureBook": "2 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "trust-in-god",
    "honesty"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child loses something small and needs to know no worry is too little for Heavenly Father.",
   "teaser": "Elisha and his helpers were chopping wood by the river. They were building a new place to live and work. One man was swinging hard with a borrowed axe. Suddenly — splash! — the metal axe head flew off into…",
   "wordCount": 143
  },
  {
   "id": "b7-w2-n6",
   "title": "Horses of Fire All Around",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 2,
   "night": 6,
   "scripture": "2 Kings 6",
   "scriptureBook": "2 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "courage",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child is scared of something they can't see and needs reassurance they're never truly alone.",
   "teaser": "An enemy army wanted to catch Elisha. One morning, Elisha's young helper woke up and saw soldiers all around the city! \"Oh no!\" he cried. \"What are we going to do?\" But Elisha was calm. \"Don't be afraid,\" he said.…",
   "wordCount": 135
  },
  {
   "id": "b7-w2-n7",
   "title": "Good News to Share",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 2,
   "night": 7,
   "scripture": "2 Kings 7",
   "scriptureBook": "2 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "service",
    "generosity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "service",
   "teachingNote": "Reach for this when your child has good news and needs a nudge to share it instead of keeping it to themselves.",
   "teaser": "There was no food in the city, and everyone was hungry. Four men sat outside the gate, hungry too. \"Let's go to the enemy camp,\" they said. \"Maybe they'll give us food.\" But when they got there — the camp…",
   "wordCount": 144
  },
  {
   "id": "b7-w3-n1",
   "title": "Good King Hezekiah Trusts God",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 3,
   "night": 1,
   "scripture": "2 Kings 18",
   "scriptureBook": "2 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "trust-in-god",
    "faith"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child needs a model of choosing Heavenly Father first, ahead of every other distraction.",
   "teaser": "Hezekiah became the king of Judah. He loved Heavenly Father with all his heart. The people had been worshiping pretend gods and idols. Hezekiah said, \"We will follow the true Heavenly Father!\" He took away all the idols and false…",
   "wordCount": 137
  },
  {
   "id": "b7-w3-n2",
   "title": "Hezekiah Shows God the Letter",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 3,
   "night": 2,
   "scripture": "2 Kings 19",
   "scriptureBook": "2 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "prayer",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child is carrying a big worry alone and needs to bring it to Heavenly Father in prayer.",
   "teaser": "A scary enemy king sent King Hezekiah a mean letter. The letter said, \"We're going to win! Your Heavenly Father can't save you!\" Hezekiah felt worried and afraid. What should he do? Hezekiah didn't fight or panic. Instead, he took…",
   "wordCount": 135
  },
  {
   "id": "b7-w3-n3",
   "title": "God Gives Hezekiah More Days",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 3,
   "night": 3,
   "scripture": "2 Kings 20",
   "scriptureBook": "2 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "prayer",
    "trust-in-god",
    "comfort"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child is sick, sad, or scared and needs to know Heavenly Father hears every prayer.",
   "teaser": "One day King Hezekiah got very, very sick. The prophet said he might not get better. Hezekiah was sad. He turned his face to the wall and prayed and cried to Heavenly Father. \"Please, Lord, remember how I have tried…",
   "wordCount": 136
  },
  {
   "id": "b7-w3-n4",
   "title": "The Boy Who Became King",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 3,
   "night": 4,
   "scripture": "2 Kings 22",
   "scriptureBook": "2 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "identity",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child says they're too little to make a good choice — age is no excuse.",
   "teaser": "There was a little boy named Josiah. When he was only eight years old, he became the king! That's younger than some of your friends. But Josiah had a good and tender heart. Even though he was young, Josiah wanted…",
   "wordCount": 135
  },
  {
   "id": "b7-w3-n5",
   "title": "The Lost Book Is Found",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 3,
   "night": 5,
   "scripture": "2 Kings 22",
   "scriptureBook": "2 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "love-of-scripture",
    "obedience"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this when you want your child to treasure scripture time as something special, not just routine.",
   "teaser": "King Josiah wanted to fix up the temple, Heavenly Father's house. The workers cleaned and repaired it carefully. While they were working, they found something amazing. It was a long-lost book — the holy scriptures! The people had forgotten about…",
   "wordCount": 142
  },
  {
   "id": "b7-w3-n6",
   "title": "Huldah Speaks for God",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 3,
   "night": 6,
   "scripture": "2 Kings 22",
   "scriptureBook": "2 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "heeding-counsel",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "heeding-counsel",
   "teachingNote": "Reach for this when helping your child understand why they should listen to trusted teachers and leaders.",
   "teaser": "King Josiah had a big question. He wanted to know what Heavenly Father thought about His people. So he sent his helpers to ask a wise woman named Huldah. Huldah was a prophetess — Heavenly Father spoke through her. The…",
   "wordCount": 144
  },
  {
   "id": "b7-w3-n7",
   "title": "King Josiah Makes a Promise",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 3,
   "night": 7,
   "scripture": "2 Kings 23",
   "scriptureBook": "2 Kings",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "keeping-promises",
    "obedience",
    "worship-together"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "keeping-promises",
   "teachingNote": "Reach for this when your child makes a commitment, like a baptismal or family promise, and needs to understand keeping it matters.",
   "teaser": "After hearing Heavenly Father's words, King Josiah gathered all the people together. He read the holy scriptures out loud so everyone could hear. Then he made a special promise to Heavenly Father. \"We will love Heavenly Father and keep His…",
   "wordCount": 150
  },
  {
   "id": "b7-w4-n1",
   "title": "King Asa Calls on God",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 4,
   "night": 1,
   "scripture": "2 Chronicles 14",
   "scriptureBook": "2 Chronicles",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "trust-in-god",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels outmatched by a problem and needs to know Heavenly Father's help is bigger.",
   "teaser": "Asa was a good king of Judah who loved Heavenly Father. He helped the people get rid of idols and follow Heavenly Father. One day, a HUGE army came to fight against them. There were so many enemies — way…",
   "wordCount": 141
  },
  {
   "id": "b7-w4-n2",
   "title": "Be Strong and Don't Give Up",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 4,
   "night": 2,
   "scripture": "2 Chronicles 15",
   "scriptureBook": "2 Chronicles",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "perseverance",
    "diligence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "perseverance",
   "teachingNote": "Reach for this when your child wants to quit doing something good because it has gotten hard or boring.",
   "teaser": "A man named Azariah had a message from Heavenly Father for King Asa. He said, \"The Lord is with you when you are with Him. If you look for Heavenly Father, you will find Him!\" That was wonderful news. Then…",
   "wordCount": 134
  },
  {
   "id": "b7-w4-n3",
   "title": "When Asa Forgot to Trust",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 4,
   "night": 3,
   "scripture": "2 Chronicles 16",
   "scriptureBook": "2 Chronicles",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "trust-in-god",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child tries to solve everything alone and forgets to ask for help first.",
   "teaser": "King Asa had trusted Heavenly Father for many years. But when a new problem came, Asa forgot to ask Heavenly Father first. Instead, he tried to fix it all by himself. He made a deal with another king for help.…",
   "wordCount": 149
  },
  {
   "id": "b7-w4-n4",
   "title": "Judges Who Are Fair",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 4,
   "night": 4,
   "scripture": "2 Chronicles 19",
   "scriptureBook": "2 Chronicles",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "kindness",
    "wisdom"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child needs to learn about fairness, like taking turns and not leaving anyone out.",
   "teaser": "King Jehoshaphat loved Heavenly Father. He wanted everyone in the land to be treated fairly. So he chose good, wise people to be judges. Judges help decide what is right and fair. Jehoshaphat told the judges something important. \"Be careful…",
   "wordCount": 135
  },
  {
   "id": "b7-w4-n5",
   "title": "Our Eyes Are upon Thee",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 4,
   "night": 5,
   "scripture": "2 Chronicles 20",
   "scriptureBook": "2 Chronicles",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "trust-in-god",
    "prayer",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child doesn't know what to do and needs to look to Heavenly Father instead of panicking.",
   "teaser": "A huge army was coming to fight King Jehoshaphat's people. There were so many enemies! Jehoshaphat felt afraid. But he knew exactly what to do — he gathered everyone to pray. Jehoshaphat prayed a beautiful prayer: \"Heavenly Father, we don't…",
   "wordCount": 141
  },
  {
   "id": "b7-w4-n6",
   "title": "The King Who Forgot to Stay Humble",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 4,
   "night": 6,
   "scripture": "2 Chronicles 26",
   "scriptureBook": "2 Chronicles",
   "traveler": null,
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
   "teachingNote": "Reach for this when success is going to your child's head and they need a reminder that blessings come from Heavenly Father.",
   "teaser": "Uzziah became king when he was just sixteen. He loved Heavenly Father, and as long as he sought the Lord, Heavenly Father helped him do amazing things. He built towers and won battles. He became very strong and famous. But…",
   "wordCount": 150
  },
  {
   "id": "b7-w4-n7",
   "title": "Come Celebrate with God",
   "volume": "ot",
   "book": 7,
   "bookTitle": "There Is a Prophet in Israel",
   "month": "July",
   "week": 4,
   "night": 7,
   "scripture": "2 Chronicles 30",
   "scriptureBook": "2 Chronicles",
   "traveler": null,
   "feeling": null,
   "virtues": [
    "worship-together",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "worship-together",
   "teachingNote": "Reach for this when inviting your child to feel the joy of coming back to Heavenly Father with a humble heart.",
   "teaser": "Good King Hezekiah wanted everyone to come back to Heavenly Father. He sent invitations all across the land. \"Come to Heavenly Father's house! Let's celebrate and remember the Lord together!\" Some people laughed and didn't want to come. That made…",
   "wordCount": 140
  },
  {
   "id": "b8-w1-n1",
   "title": "The King Says, \"You May Go Home!\"",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 1,
   "night": 1,
   "scripture": "Ezra 1; 3–7; Nehemiah 2; 4–6; 8",
   "scriptureBook": "Ezra",
   "traveler": "scout",
   "feeling": "excited",
   "virtues": [
    "trust-in-god",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child needs reassurance that Heavenly Father always keeps His promises, even after a long wait.",
   "teaser": "Long ago, Heavenly Father's people lived far away from home in a land called Babylon. Their beautiful city, Jerusalem, was empty, and Heavenly Father's temple was gone. The people missed home so very much. One day, a mighty king named…",
   "wordCount": 130
  },
  {
   "id": "b8-w1-n2",
   "title": "The First Big Stone",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 1,
   "night": 2,
   "scripture": "Ezra 1; 3– 7; Nehemiah 2; 4–6; 8",
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
   "teachingNote": "Reach for this when your child has big mixed feelings and needs to know it's okay to feel happy and cry together.",
   "teaser": "When the people reached home, the temple ground was just dirt and rubble. But they were not sad for long — they were ready to build Heavenly Father's house! First, they set up an altar so they could pray and…",
   "wordCount": 132
  },
  {
   "id": "b8-w1-n3",
   "title": "The Temple Is Finished!",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 1,
   "night": 3,
   "scripture": "Ezra 1; 3–7; Nehemiah 2; 4–6; 8",
   "scriptureBook": "Ezra",
   "traveler": "beau",
   "feeling": "discouraged",
   "virtues": [
    "perseverance",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "perseverance",
   "teachingNote": "Reach for this when your child feels discouraged partway through a hard task and wants to quit.",
   "teaser": "Building the temple was not always easy. Some unkind neighbors tried to make the people stop, and for a while the work grew quiet and slow. But two of Heavenly Father's prophets, Haggai and Zechariah, cheered the people on. \"Keep…",
   "wordCount": 131
  },
  {
   "id": "b8-w1-n4",
   "title": "Ezra Loves the Scriptures",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 1,
   "night": 4,
   "scripture": "Ezra 1; 3–7; Nehemiah 2; 4–6; 8",
   "scriptureBook": "Ezra",
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
   "teachingNote": "Reach for this when you want your child to slow down and treasure scripture time instead of rushing through it.",
   "teaser": "There was a good man named Ezra who loved Heavenly Father with all his heart. More than almost anything, Ezra loved to read Heavenly Father's holy words, the scriptures. Ezra didn't just read the scriptures once and forget them. He…",
   "wordCount": 118
  },
  {
   "id": "b8-w1-n5",
   "title": "Nehemiah's Brave Idea",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 1,
   "night": 5,
   "scripture": "Ezra 1; 3–7; Nehemiah 2; 4–6; 8",
   "scriptureBook": "Ezra",
   "traveler": "beau",
   "feeling": "worried",
   "virtues": [
    "courage",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child's heart feels heavy or worried and needs prayer to turn worry into bravery.",
   "teaser": "Far away in the king's palace, a man named Nehemiah heard sad news. The walls around Jerusalem were broken down, and his people were not safe. Nehemiah's heart felt so heavy. But he knew just what to do — he…",
   "wordCount": 119
  },
  {
   "id": "b8-w1-n6",
   "title": "\"I Am Doing a Great Work\"",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 1,
   "night": 6,
   "scripture": "Ezra 1; 3–7; Nehemiah 2; 4–6; 8",
   "scriptureBook": "Ezra",
   "traveler": "wren",
   "feeling": "distracted",
   "virtues": [
    "diligence",
    "self-control"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "diligence",
   "teachingNote": "Reach for this when your child is being teased or distracted from a good task and needs to stay focused and finish.",
   "teaser": "As the people built the walls, some grumpy men tried to stop them. They laughed and teased. \"You can't do it!\" they said. But the people just kept building. The workers were wise. They held a building tool in one…",
   "wordCount": 127
  },
  {
   "id": "b8-w1-n7",
   "title": "The Happiest Reading Day",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 1,
   "night": 7,
   "scripture": "Ezra 1; 3–7; Nehemiah 2; 4–6; 8",
   "scriptureBook": "Ezra",
   "traveler": "scout",
   "feeling": "comforted",
   "virtues": [
    "love-of-scripture",
    "comfort"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this when your child feels sorry about a mistake and needs to know scripture brings joy, not just guilt.",
   "teaser": "When the walls were finished, all the people gathered together in one big place. They wanted to hear Heavenly Father's holy words. Good Ezra stood on a tall wooden platform and opened the scriptures. He read out loud from early…",
   "wordCount": 126
  },
  {
   "id": "b8-w2-n1",
   "title": "A Kind Girl Becomes Queen",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 2,
   "night": 1,
   "scripture": "Esther",
   "scriptureBook": "Esther",
   "traveler": "willow",
   "feeling": "nervous",
   "virtues": [
    "kindness",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your shy or quiet child needs to know a kind heart matters more than being noticed or praised.",
   "teaser": "In a faraway kingdom lived a kind young woman named Esther. She had no mommy or daddy, so her good cousin Mordecai took care of her and loved her like his own. One day, the king was looking for a…",
   "wordCount": 118
  },
  {
   "id": "b8-w2-n2",
   "title": "Mordecai Stands Tall",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 2,
   "night": 2,
   "scripture": "Esther",
   "scriptureBook": "Esther",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": [
    "stand-for-truth",
    "courage",
    "reverence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "stand-for-truth",
   "teachingNote": "Reach for this when your child feels pressure to go along with the crowd instead of quietly doing what's right.",
   "teaser": "There was a very proud man named Haman who worked for the king. Haman wanted everyone to bow down low to him whenever he walked by. Everybody bowed — everybody except Mordecai. Mordecai was kind and respectful, but he only…",
   "wordCount": 102
  },
  {
   "id": "b8-w2-n3",
   "title": "For Such a Time as This",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 2,
   "night": 3,
   "scripture": "Esther",
   "scriptureBook": "Esther",
   "traveler": "wren",
   "feeling": "nervous",
   "virtues": [
    "identity",
    "wisdom"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child wonders if they matter and needs to know Heavenly Father placed them there for a reason.",
   "teaser": "Proud Haman made a wicked plan to hurt Heavenly Father's people. Mordecai was very worried. He sent a message to Queen Esther, asking her to help. Esther felt afraid. Going to the king without being called could be dangerous. What…",
   "wordCount": 101
  },
  {
   "id": "b8-w2-n4",
   "title": "Esther's Brave Choice",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 2,
   "night": 4,
   "scripture": "Esther",
   "scriptureBook": "Esther",
   "traveler": "beau",
   "feeling": "worried",
   "virtues": [
    "courage",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child is scared to do a hard, right thing and needs to pray first, then be brave.",
   "teaser": "Esther decided to be brave and help her people. But first, she wanted Heavenly Father's help. She asked everyone to fast and pray with her for three whole days. \"Then I will go to the king,\" she said, \"and if…",
   "wordCount": 109
  },
  {
   "id": "b8-w2-n5",
   "title": "Esther's Wise Plan",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 2,
   "night": 5,
   "scripture": "Esther",
   "scriptureBook": "Esther",
   "traveler": "wren",
   "feeling": "impatient",
   "virtues": [
    "patience",
    "wisdom"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "patience",
   "teachingNote": "Reach for this when your child wants to blurt something out right away and needs help waiting for the right moment.",
   "teaser": "Esther was brave, and she was also wise. She did not rush. She invited the king and Haman to a special dinner she had prepared. Everyone ate the yummy food, and the king asked, \"Esther, what would you like? I…",
   "wordCount": 111
  },
  {
   "id": "b8-w2-n6",
   "title": "The King Saves the People",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 2,
   "night": 6,
   "scripture": "Esther",
   "scriptureBook": "Esther",
   "traveler": "scout",
   "feeling": "brave",
   "virtues": [
    "honesty",
    "courage"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "honesty",
   "teachingNote": "Reach for this when your child is scared to tell the truth but the truth could protect someone they love.",
   "teaser": "At the second dinner, the moment was finally right. Brave Queen Esther spoke the truth to the king. \"Please save me and my people,\" she said. \"A wicked plan has been made to hurt us.\" The king asked, \"Who would…",
   "wordCount": 99
  },
  {
   "id": "b8-w2-n7",
   "title": "A Happy Celebration",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 2,
   "night": 7,
   "scripture": "Esther",
   "scriptureBook": "Esther",
   "traveler": "willow",
   "feeling": "grateful",
   "virtues": [
    "gratitude",
    "generosity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child receives something good and needs to learn that sharing the joy makes it bigger.",
   "teaser": "Heavenly Father's people were safe, and their sadness turned into great joy! They wanted to remember this wonderful day forever. So they made a special holiday called Purim. Every year, families would celebrate that Heavenly Father had saved them through…",
   "wordCount": 99
  },
  {
   "id": "b8-w3-n1",
   "title": "Job Loved Heavenly Father",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 3,
   "night": 1,
   "scripture": "Job 1–3; 12–14; 19; 21–24; 38–40; 42",
   "scriptureBook": "Job",
   "traveler": "willow",
   "feeling": "grateful",
   "virtues": [
    "gratitude",
    "integrity"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when you want your child to thank Heavenly Father every day, not just when things are easy.",
   "teaser": "Long ago there lived a good man named Job. He loved Heavenly Father with all his heart, and he was kind to everyone around him. Job had a happy family and many animals to care for. Every day he thanked…",
   "wordCount": 95
  },
  {
   "id": "b8-w3-n2",
   "title": "Job Keeps Trusting",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 3,
   "night": 2,
   "scripture": "Job 1–3; 12–14; 19; 21–24; 38–40; 42",
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
   "teachingNote": "Reach for this when hard things happen and your child needs to see you can be sad and still trust Heavenly Father.",
   "teaser": "One day, hard things began to happen to Job. He lost his animals, and then his big house was gone too. Soon after, Job did not feel well at all. Job was very sad. So many good things had gone…",
   "wordCount": 103
  },
  {
   "id": "b8-w3-n3",
   "title": "Kind Friends Come to Sit",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 3,
   "night": 3,
   "scripture": "Job 1–3; 12–14; 19; 21–24; 38–40; 42",
   "scriptureBook": "Job",
   "traveler": "willow",
   "feeling": "comforted",
   "virtues": [
    "compassion",
    "comfort"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "compassion",
   "teachingNote": "Reach for this when your child isn't sure how to help a sad friend and needs to know sitting close is enough.",
   "teaser": "When Job was sad and not feeling well, his friends heard about it. They wanted to help, so they came to be with him. At first, Job's friends didn't say a single word. They just sat quietly beside him for…",
   "wordCount": 102
  },
  {
   "id": "b8-w3-n4",
   "title": "Job Tells Heavenly Father His Feelings",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 3,
   "night": 4,
   "scripture": "Job1–3;12–14;19;21–24;38–40;42",
   "scriptureBook": "Job",
   "traveler": "wren",
   "feeling": "confused",
   "virtues": [
    "comfort",
    "prayer",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "comfort",
   "teachingNote": "Reach for this when your child is holding back tears or hard feelings and needs permission to tell Heavenly Father honestly.",
   "teaser": "Job had so many big feelings inside. He felt sad and confused, and he had lots of questions. So Job talked to Heavenly Father about all of it. He didn't hide his feelings — he shared them honestly, just like…",
   "wordCount": 102
  },
  {
   "id": "b8-w3-n5",
   "title": "Heavenly Father Shows His Wonders",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 3,
   "night": 5,
   "scripture": "Job 1–3; 12–14; 19; 21–24; 38–40; 42",
   "scriptureBook": "Job",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": [
    "wonder",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "wonder",
   "teachingNote": "Reach for this when looking at the night sky or nature together, to help your child feel Heavenly Father's greatness.",
   "teaser": "After a long, hard time, Heavenly Father spoke to Job. But He didn't scold him. Instead, He showed Job all the amazing things He had made! \"Job, did you hang the twinkling stars? Did you make the great big sea?…",
   "wordCount": 121
  },
  {
   "id": "b8-w3-n6",
   "title": "Job Trusts Heavenly Father's Wisdom",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 3,
   "night": 6,
   "scripture": "Job 1–3; 12–14; 19; 21–24; 38–40; 42",
   "scriptureBook": "Job",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "trust-in-god",
    "wisdom",
    "humility"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child wants an explanation you can't give and needs peace in trusting Heavenly Father anyway.",
   "teaser": "After seeing all of Heavenly Father's wonderful works, Job understood something important. Heavenly Father knows and sees everything — even the things Job could not understand. \"I trust You,\" Job said humbly. \"You are wise, and You know what is…",
   "wordCount": 104
  },
  {
   "id": "b8-w3-n7",
   "title": "Heavenly Father Blesses Job Again",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 3,
   "night": 7,
   "scripture": "Job 1–3; 12–14; 19; 21–24; 38–40; 42",
   "scriptureBook": "Job",
   "traveler": "beau",
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
   "teachingNote": "Reach for this when your child is in a hard season and needs hope that joy and good days will come again.",
   "teaser": "Job's hard time didn't last forever. After all his trusting and waiting, Heavenly Father blessed Job again — even more than before! Job had a happy home once more, with animals to care for and family all around. His heart…",
   "wordCount": 96
  },
  {
   "id": "b8-w4-n1",
   "title": "The Happy Little Tree",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 4,
   "night": 1,
   "scripture": "Psalms 1–2; 8; 19–33; 40; 46",
   "scriptureBook": "Psalms",
   "traveler": "wren",
   "feeling": "brave",
   "virtues": [
    "love-of-scripture",
    "diligence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this when encouraging a daily habit of scripture time by showing how it helps hearts grow strong.",
   "teaser": "A very long time ago, people wrote beautiful songs and poems to Heavenly Father. We call them Psalms. One of them tells about a happy little tree. The song says a person who loves Heavenly Father's words is like a…",
   "wordCount": 104
  },
  {
   "id": "b8-w4-n2",
   "title": "Look at the Stars!",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 4,
   "night": 2,
   "scripture": "Psalms 1–2; 8; 19–33; 40; 46",
   "scriptureBook": "Psalms",
   "traveler": "scout",
   "feeling": null,
   "virtues": [
    "identity",
    "wonder"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels small or unnoticed and needs to know Heavenly Father knows and loves them personally.",
   "teaser": "One night, a person looked up at the wide, dark sky and saw thousands of twinkling stars. It filled his heart with wonder, so he sang a song to Heavenly Father. \"Heavenly Father, You are so wonderful! You made the…",
   "wordCount": 103
  },
  {
   "id": "b8-w4-n3",
   "title": "The Good Shepherd",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 4,
   "night": 3,
   "scripture": "Psalms 1–2; 8; 19–33; 40; 46",
   "scriptureBook": "Psalms",
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
   "teachingNote": "Reach for this at bedtime when your child is afraid of the dark and needs Heavenly Father's care like a shepherd's.",
   "teaser": "A shepherd boy named David wrote one of the most beautiful songs of all. He knew all about sheep and how a good shepherd takes care of them. \"The Lord is my shepherd,\" David sang. \"He leads me to soft…",
   "wordCount": 108
  },
  {
   "id": "b8-w4-n4",
   "title": "Heavenly Father Is My Light",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 4,
   "night": 4,
   "scripture": "Psalms 1–2; 8; 19–33; 40; 46",
   "scriptureBook": "Psalms",
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
   "teachingNote": "Reach for this when your child is afraid of the dark or of something scary and needs Heavenly Father's light as comfort.",
   "teaser": "Another song says, \"Heavenly Father is my light. Whom shall I fear?\" A light helps us see and chases the scary dark away. When it's nighttime and dark, a little light makes everything feel better. We can see where we're…",
   "wordCount": 98
  },
  {
   "id": "b8-w4-n5",
   "title": "Be Still and Know",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 4,
   "night": 5,
   "scripture": "Psalms 1–2; 8; 19–33; 40; 46",
   "scriptureBook": "Psalms",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": [
    "pondering",
    "trust-in-god"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "pondering",
   "teachingNote": "Reach for this when the day has felt too loud and your child needs to practice slowing down and feeling calm.",
   "teaser": "Sometimes life feels loud and busy and fast. There's a special song for those times that says, \"Be still, and know that Heavenly Father is with you.\" Being still means slowing our bodies down and making our hearts quiet and…",
   "wordCount": 96
  },
  {
   "id": "b8-w4-n6",
   "title": "A Brand-New Song",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 4,
   "night": 6,
   "scripture": "Psalms 1–2; 8; 19–33; 40; 46",
   "scriptureBook": "Psalms",
   "traveler": "willow",
   "feeling": "frustrated",
   "virtues": [
    "hope",
    "prayer"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child feels stuck or frustrated and needs to know calling out to Heavenly Father brings help.",
   "teaser": "One song-writer remembered a hard time when he felt stuck, like he was down in a deep, muddy pit and couldn't get out. So he called out to Heavenly Father for help. And Heavenly Father heard him! He gently lifted…",
   "wordCount": 109
  },
  {
   "id": "b8-w4-n7",
   "title": "Sing with All Your Heart",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 4,
   "night": 7,
   "scripture": "Psalms 1–2; 8; 19–33; 40; 46",
   "scriptureBook": "Psalms",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": [
    "gratitude",
    "reverence"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when helping your child find joyful ways to praise Heavenly Father, like singing or clapping.",
   "teaser": "The Psalms are full of happy songs, and one of them says, \"Sing to Heavenly Father a joyful song! Play music and praise Him!\" Long ago, people praised Heavenly Father with harps and horns and all kinds of joyful sounds.…",
   "wordCount": 101
  },
  {
   "id": "b8-w5-n1",
   "title": "A Clean, New Heart",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 5,
   "night": 1,
   "scripture": "Psalms 49–51; 61–66; 69–72; 77–78; 85–86",
   "scriptureBook": "Psalms",
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
   "teachingNote": "Reach for this when your child feels guilty about a mistake and needs to know saying sorry brings a clean, fresh start.",
   "teaser": "Sometimes we make mistakes or do things we know are wrong, and our hearts feel yucky and sad inside. One of the Psalms is a gentle song about that. The person sang, \"Heavenly Father, please make my heart clean and…",
   "wordCount": 103
  },
  {
   "id": "b8-w5-n2",
   "title": "My Strong, Safe Rock",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 5,
   "night": 2,
   "scripture": "Psalms 49–51; 61–66; 69–72; 77–78; 85–86",
   "scriptureBook": "Psalms",
   "traveler": "beau",
   "feeling": "nervous",
   "virtues": [
    "trust-in-god",
    "hope"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when your child feels shaky or overwhelmed and needs Heavenly Father as a steady rock to lean on.",
   "teaser": "When we feel small or shaky, it helps to stand on something big and strong. One of the Psalms calls Heavenly Father a great big Rock. \"Heavenly Father is my Rock,\" the person sang. \"He is my safe, high place.…",
   "wordCount": 96
  },
  {
   "id": "b8-w5-n3",
   "title": "Thinking of Heavenly Father at Night",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 5,
   "night": 3,
   "scripture": "Psalms 49–51; 61–66; 69–72; 77–78; 85–86",
   "scriptureBook": "Psalms",
   "traveler": "wren",
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
   "teachingNote": "Reach for this at bedtime to help your child fall asleep thinking peacefully about Heavenly Father's love.",
   "teaser": "One song-writer loved Heavenly Father so much that he thought about Him all the time — even when he was lying in bed at night. \"I think about You while I rest,\" he sang. \"My heart wants to be close…",
   "wordCount": 109
  },
  {
   "id": "b8-w5-n4",
   "title": "Come and Hear!",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 5,
   "night": 4,
   "scripture": "Psalms 49–51; 61–66; 69–72; 77–78; 85–86",
   "scriptureBook": "Psalms",
   "traveler": "scout",
   "feeling": "excited",
   "virtues": [
    "gratitude",
    "service"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child experiences something good and needs encouragement to share the happy news with family.",
   "teaser": "When something wonderful happens, we can hardly wait to tell everybody about it! One of the Psalms is exactly like that. \"Come and hear!\" the person sang out. \"Let me tell you all the wonderful things Heavenly Father has done!\"…",
   "wordCount": 96
  },
  {
   "id": "b8-w5-n5",
   "title": "My Hope Since I Was Little",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 5,
   "night": 5,
   "scripture": "Psalms 49–51; 61–66; 69–72; 77–78; 85–86",
   "scriptureBook": "Psalms",
   "traveler": "willow",
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
   "teachingNote": "Reach for this when your child needs the long view that Heavenly Father has cared for them since before they were born.",
   "teaser": "One song-writer had grown old, and he looked back on his whole long life. He remembered that Heavenly Father had been with him the entire time. \"Heavenly Father, You have been my hope since I was very young,\" he sang.…",
   "wordCount": 108
  },
  {
   "id": "b8-w5-n6",
   "title": "Tell the Children",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 5,
   "night": 6,
   "scripture": "Psalms 49–51; 61–66; 69–72; 77–78; 85–86",
   "scriptureBook": "Psalms",
   "traveler": "wren",
   "feeling": "connected",
   "virtues": [
    "family-love",
    "love-of-scripture"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "family-love",
   "teachingNote": "Reach for this when explaining why your family tells scripture stories together night after night.",
   "teaser": "One of the Psalms has a very special job for grown-ups and children alike. It says to remember the wonderful things Heavenly Father has done — and to tell them to the children. \"We will not hide these things from…",
   "wordCount": 115
  },
  {
   "id": "b8-w5-n7",
   "title": "Heavenly Father Is So Good",
   "volume": "ot",
   "book": 8,
   "bookTitle": "I Will Trust and Sing",
   "month": "August",
   "week": 5,
   "night": 7,
   "scripture": "Psalms 49–51; 61–66; 69–72; 77–78; 85–86",
   "scriptureBook": "Psalms",
   "traveler": "scout",
   "feeling": null,
   "virtues": [
    "gratitude",
    "wisdom"
   ],
   "stages": [
    "toddler",
    "preschool"
   ],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child wants to grow kinder and needs to know Heavenly Father helps us become like Him.",
   "teaser": "The very last song this month is full of love and praise. The person sang about how kind and good Heavenly Father is. \"Heavenly Father, You are so good and forgiving,\" he sang. \"You are full of love for everyone…",
   "wordCount": 111
  },
  {
   "id": "b9-w1-n1",
   "title": "Bless the Lord, O My Soul",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 1,
   "night": 1,
   "scripture": "Psalm 103",
   "scriptureBook": "Psalms",
   "traveler": "willow",
   "feeling": "grateful",
   "virtues": ["gratitude", "worship-together", "forgiveness"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child has done something wrong and cannot seem to put it down.",
   "teaser": "Long ago, a man named David wanted to thank Heavenly Father with his whole heart. So he sang a happy song: “Bless Heavenly Father, O my soul! I will remember all the good things He does!” David remembered how kind Heavenly Father is. He…"
  },
  {
   "id": "b9-w1-n2",
   "title": "He Hears My Voice",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 1,
   "night": 2,
   "scripture": "Psalm 116",
   "scriptureBook": "Psalms",
   "traveler": "beau",
   "feeling": "worried",
   "virtues": ["prayer", "faith", "comfort"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "prayer",
   "teachingNote": "Reach for this when your child wonders whether anyone is really listening.",
   "teaser": "There once was a person who felt sad and afraid. Big troubles were all around, and he didn’t know what to do. So he did the best thing of all — he called out to Heavenly Father. “Please help me, Heavenly Father!” he prayed. And guess what?…"
  },
  {
   "id": "b9-w1-n3",
   "title": "This Is the Day!",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 1,
   "night": 3,
   "scripture": "Psalm 118",
   "scriptureBook": "Psalms",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": ["gratitude", "hope", "contentment"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this on a morning that started badly, when the day still needs rescuing.",
   "teaser": "One morning, a happy song-writer woke up and looked at the brand-new day. The sun was shining, the birds were singing, and his heart felt full of joy. “This is the day that Heavenly Father made!” he sang. “I will be happy and glad in it!”…"
  },
  {
   "id": "b9-w1-n4",
   "title": "A Lamp for My Feet",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 1,
   "night": 4,
   "scripture": "Psalm 119",
   "scriptureBook": "Psalms",
   "traveler": "wren",
   "feeling": "confused",
   "virtues": ["love-of-scripture", "obedience", "wisdom"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "love-of-scripture",
   "teachingNote": "Reach for this when your child has a choice to make and does not know how to weigh it.",
   "teaser": "The longest song in all the Psalms is about something very special: Heavenly Father’s words, the scriptures. The song-writer loved them so much! “Your words are like a lamp for my feet,” he sang, “and a bright light for my path.” A lamp…"
  },
  {
   "id": "b9-w1-n5",
   "title": "You Know Me!",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 1,
   "night": 5,
   "scripture": "Psalm 139",
   "scriptureBook": "Psalms",
   "traveler": "wren",
   "feeling": "loved",
   "virtues": ["identity", "wonder", "love-of-scripture"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels ordinary, overlooked, or unsure they matter.",
   "teaser": "One song-writer thought about something amazing: Heavenly Father knows everything about him! He sang a wondering song about it. “Heavenly Father, You know when I sit down and when I stand up. You know my thoughts and every word before I…"
  },
  {
   "id": "b9-w1-n6",
   "title": "Children Are a Gift",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 1,
   "night": 6,
   "scripture": "Psalm 127",
   "scriptureBook": "Psalms",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": ["family-love", "gratitude", "identity"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "family-love",
   "teachingNote": "Reach for this on a night when home has felt hard and needs remembering as a gift.",
   "teaser": "Heavenly Father loves families very much. One of the Psalms is a happy song all about home and children. “Unless Heavenly Father helps build the house, the builders work for nothing,” the song says. That means Heavenly Father is the one…"
  },
  {
   "id": "b9-w1-n7",
   "title": "Let Everything Praise Him!",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 1,
   "night": 7,
   "scripture": "Psalms 148–150",
   "scriptureBook": "Psalms",
   "traveler": "scout",
   "feeling": "excited",
   "virtues": ["worship-together", "gratitude", "reverence"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "worship-together",
   "teachingNote": "Reach for this when your child has more energy than the hour allows — and wants to use it.",
   "teaser": "The very last songs in the Psalms are the happiest of all! They shout, “Praise Heavenly Father!” over and over with joy. The song calls to everyone and everything: “Sun and moon, praise Him! Shining stars, praise Him! Mountains and trees,…"
  },
  {
   "id": "b9-w2-n1",
   "title": "Trust Him to Lead the Way",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 2,
   "night": 1,
   "scripture": "Proverbs 3",
   "scriptureBook": "Proverbs",
   "traveler": "beau",
   "feeling": "nervous",
   "virtues": ["trust-in-god", "faith", "heeding-counsel"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this before something unknown — a new school, a first night away.",
   "teaser": "A wise man named Solomon wrote down lots of good advice to help us live happy lives. We call his sayings Proverbs. One of the very best is about trusting Heavenly Father. “Trust in Heavenly Father with ALL your heart,” Solomon wrote.…"
  },
  {
   "id": "b9-w2-n2",
   "title": "Wisdom, a Hidden Treasure",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 2,
   "night": 2,
   "scripture": "Proverbs 2",
   "scriptureBook": "Proverbs",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": ["wisdom", "curiosity", "heeding-counsel"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "wisdom",
   "teachingNote": "Reach for this when your child is asking good questions and you want to keep them asking.",
   "teaser": "Wise Solomon wanted everyone to have something wonderful called wisdom. Wisdom means knowing the good and right thing to do. “Look for wisdom like you’re searching for hidden treasure!” Solomon said. “Dig for it, hunt for it — it’s more…"
  },
  {
   "id": "b9-w2-n3",
   "title": "A Soft, Kind Answer",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 2,
   "night": 3,
   "scripture": "Proverbs 15",
   "scriptureBook": "Proverbs",
   "traveler": "willow",
   "feeling": "angry",
   "virtues": ["peacemaking", "self-control", "kindness"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "peacemaking",
   "teachingNote": "Reach for this after a shouting match, when the words have already been said.",
   "teaser": "Wise Solomon knew that the words we say are very powerful. They can make a heart happy or a heart hurt. “A soft, kind answer makes angry feelings go away,” Solomon taught. “But mean, grumpy words just make things worse.” Imagine two…"
  },
  {
   "id": "b9-w2-n4",
   "title": "Loving, Helping Hands",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 2,
   "night": 4,
   "scripture": "Proverbs 31",
   "scriptureBook": "Proverbs",
   "traveler": "willow",
   "feeling": "grateful",
   "virtues": ["gratitude", "service", "honoring-parents"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child has taken someone's work for granted.",
   "teaser": "Near the end of Proverbs is a beautiful song about a wonderful woman — a mom who loved her family with all her heart. She worked hard with happy hands. She made yummy food, cared for her home, and helped people who needed her. She was kind…"
  },
  {
   "id": "b9-w2-n5",
   "title": "A Time for Everything",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 2,
   "night": 5,
   "scripture": "Ecclesiastes 3",
   "scriptureBook": "Ecclesiastes",
   "traveler": "wren",
   "feeling": "impatient",
   "virtues": ["patience", "contentment", "trust-in-god"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "patience",
   "teachingNote": "Reach for this when a child wants something now that can only come later.",
   "teaser": "A wise teacher once wrote a thoughtful book called Ecclesiastes. In it, he shared a gentle truth: there is a right time for everything. “There’s a time to plant seeds and a time to pick the fruit,” he said. “A time to laugh and a time to…"
  },
  {
   "id": "b9-w2-n6",
   "title": "Remember Him While You’re Little",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 2,
   "night": 6,
   "scripture": "Ecclesiastes 12",
   "scriptureBook": "Ecclesiastes",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": ["faith", "diligence", "identity"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child thinks the important things are for grown-ups.",
   "teaser": "The wise teacher of Ecclesiastes had one very special piece of advice, just for young people like you. “Remember Heavenly Father now, while you are young!” he said. Don’t wait until you’re big and grown up — start loving Him today. When…"
  },
  {
   "id": "b9-w2-n7",
   "title": "A Good Name",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 2,
   "night": 7,
   "scripture": "Proverbs 22",
   "scriptureBook": "Proverbs",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": ["integrity", "honesty", "stand-for-truth"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "integrity",
   "teachingNote": "Reach for this when nobody would have known — and your child chose right anyway, or did not.",
   "teaser": "Wise Solomon shared one more treasure: he said a good name is better than piles of gold and silver. What is a “good name”? It means being someone people can trust — someone honest, kind, and true. When you do good, your name becomes a good…"
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
   "scripture": "Isaiah 1",
   "scriptureBook": "Isaiah",
   "traveler": "willow",
   "feeling": "guilty",
   "virtues": ["repentance", "forgiveness", "hope"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when a mistake feels too big to be forgiven.",
   "teaser": "Long ago, Heavenly Father sent a prophet named Isaiah to share His messages. One of Isaiah’s most beautiful messages was full of love and hope. Sometimes people made wrong choices, and their hearts felt dark and heavy, like a shirt with…"
  },
  {
   "id": "b9-w3-n2",
   "title": "Here Am I, Send Me",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 3,
   "night": 2,
   "scripture": "Isaiah 6",
   "scriptureBook": "Isaiah",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": ["courage", "service", "obedience"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when there is a hard job nobody wants and your child could be the one.",
   "teaser": "One day, the prophet Isaiah had an amazing experience. In a beautiful vision, he saw Heavenly Father’s shining throne, high and glorious, filling the temple with light. Bright angels flew all around, singing, “Holy, holy, holy!” Everything…"
  },
  {
   "id": "b9-w3-n3",
   "title": "Come to Heavenly Father’s House",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 3,
   "night": 3,
   "scripture": "Isaiah 2",
   "scriptureBook": "Isaiah",
   "traveler": "scout",
   "feeling": "calm",
   "virtues": ["reverence", "worship-together", "peacemaking"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this before a Sunday, or after a restless one.",
   "teaser": "Isaiah shared a happy message about a special place: Heavenly Father’s holy house, the temple. “In the last days,” Isaiah said, “Heavenly Father’s house will stand up high on a mountain, and people from everywhere will want to go there!”…"
  },
  {
   "id": "b9-w3-n4",
   "title": "A Special Baby Is Coming",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 3,
   "night": 4,
   "scripture": "Isaiah 9",
   "scriptureBook": "Isaiah",
   "traveler": "wren",
   "feeling": "amazed",
   "virtues": ["hope", "faith", "wonder"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this in a season of waiting, when something good has been promised but not come.",
   "teaser": "Isaiah shared the happiest secret of all — a promise about a very special baby who would come someday. “Unto us a child will be born!” Isaiah said. “And He will be wonderful. He will be called the Prince of Peace!” This special baby was…"
  },
  {
   "id": "b9-w3-n5",
   "title": "The Peaceful Kingdom",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 3,
   "night": 5,
   "scripture": "Isaiah 11",
   "scriptureBook": "Isaiah",
   "traveler": "willow",
   "feeling": "safe",
   "virtues": ["peacemaking", "kindness", "hope"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "peacemaking",
   "teachingNote": "Reach for this when the world has felt frightening and your child has noticed.",
   "teaser": "Isaiah shared a dream of a beautiful, peaceful world that Heavenly Father is preparing — a world where nothing is scary and everyone is safe. In this happy place, the wolf and the little lamb lie down together as friends. The lion and the…"
  },
  {
   "id": "b9-w3-n6",
   "title": "I Will Trust and Not Be Afraid",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 3,
   "night": 6,
   "scripture": "Isaiah 12",
   "scriptureBook": "Isaiah",
   "traveler": "beau",
   "feeling": "worried",
   "virtues": ["courage", "trust-in-god", "faith"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this at the door of something your child is afraid of.",
   "teaser": "After all his wonderful messages, Isaiah sang a happy song of trust. It’s the song this whole week is named after! “Heavenly Father saves me!” Isaiah sang. “I will trust in Him, and I will not be afraid.” Isaiah knew that when Heavenly…"
  },
  {
   "id": "b9-w3-n7",
   "title": "Wells of Joy",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 3,
   "night": 7,
   "scripture": "Isaiah 12",
   "scriptureBook": "Isaiah",
   "traveler": "scout",
   "feeling": "happy",
   "virtues": ["gratitude", "generosity", "hope"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "gratitude",
   "teachingNote": "Reach for this when your child is happy and you want to teach them to spend it on someone.",
   "teaser": "Isaiah’s happy song had one more joyful part. He sang about drawing up joy like cool water from a deep, wonderful well. “With joy you will draw water from the wells of Heavenly Father’s saving love!” Isaiah sang. Imagine a bucket coming up…"
  },
  {
   "id": "b9-w4-n1",
   "title": "He Wipes Away Every Tear",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 4,
   "night": 1,
   "scripture": "Isaiah 25",
   "scriptureBook": "Isaiah",
   "traveler": "willow",
   "feeling": "sad",
   "virtues": ["comfort", "compassion", "hope"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "comfort",
   "teachingNote": "Reach for this on a night that ended in tears — theirs or yours.",
   "teaser": "Isaiah shared a message so tender and kind that it feels like a warm hug from Heavenly Father. “Someday,” Isaiah said, “Heavenly Father will wipe away the tears from every face. There will be no more crying, and everyone will be happy!”…"
  },
  {
   "id": "b9-w4-n2",
   "title": "Perfect Peace",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 4,
   "night": 2,
   "scripture": "Isaiah 26",
   "scriptureBook": "Isaiah",
   "traveler": "wren",
   "feeling": "worried",
   "virtues": ["peacemaking", "trust-in-god", "pondering"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "peacemaking",
   "teachingNote": "Reach for this when a busy mind will not let your child fall asleep.",
   "teaser": "Isaiah shared a lovely secret about how to feel calm and peaceful inside, even when the world is busy. “Heavenly Father will keep you in perfect peace,” Isaiah said, “when you keep your mind on Him.” That means when we fill our thoughts…"
  },
  {
   "id": "b9-w4-n3",
   "title": "A Sure, Strong Rock",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 4,
   "night": 3,
   "scripture": "Isaiah 26",
   "scriptureBook": "Isaiah",
   "traveler": "beau",
   "feeling": "discouraged",
   "virtues": ["trust-in-god", "perseverance", "faith"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this when something your child counted on has given way.",
   "teaser": "Isaiah taught that Heavenly Father is like the strongest, most reliable rock you could ever build on. “Trust in Heavenly Father forever,” Isaiah said, “for He is like a Rock that lasts always and always.” He also said Heavenly Father is…"
  },
  {
   "id": "b9-w4-n4",
   "title": "A Marvellous Work and a Wonder",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 4,
   "night": 4,
   "scripture": "Isaiah 29",
   "scriptureBook": "Isaiah",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": ["wonder", "faith", "curiosity"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "wonder",
   "teachingNote": "Reach for this when your child has just noticed something astonishing and you want to name it.",
   "teaser": "This week’s book is named after something Isaiah said Heavenly Father would do: “a marvellous work and a wonder!” That means Heavenly Father does amazing, surprising, wonderful things — things so good and clever that they make us say,…"
  },
  {
   "id": "b9-w4-n5",
   "title": "This Is the Way",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 4,
   "night": 5,
   "scripture": "Isaiah 30",
   "scriptureBook": "Isaiah",
   "traveler": "wren",
   "feeling": "confused",
   "virtues": ["heeding-counsel", "pondering", "obedience"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "heeding-counsel",
   "teachingNote": "Reach for this when a decision is close and the answer has not come yet.",
   "teaser": "Isaiah shared a comforting message about how Heavenly Father helps us know which way to go. “When you’re not sure which way to turn,” Isaiah said, “you will hear a gentle voice behind you saying, ‘This is the way — walk in it.’” Heavenly…"
  },
  {
   "id": "b9-w4-n6",
   "title": "The Desert Blooms",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 4,
   "night": 6,
   "scripture": "Isaiah 35",
   "scriptureBook": "Isaiah",
   "traveler": "willow",
   "feeling": "discouraged",
   "virtues": ["hope", "perseverance", "comfort"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this in a long, dry stretch, when nothing seems to be growing.",
   "teaser": "Isaiah painted the most beautiful picture of hope. He told about a dry, empty desert — and then something wonderful happened! “The desert will be glad,” Isaiah said, “and the dry, thirsty ground will burst into bloom with flowers! It will…"
  },
  {
   "id": "b9-w4-n7",
   "title": "Be Strong, Don’t Be Afraid",
   "volume": "ot",
   "book": 9,
   "bookTitle": "Wonderful Is His Way",
   "month": "September",
   "week": 4,
   "night": 7,
   "scripture": "Isaiah 35",
   "scriptureBook": "Isaiah",
   "traveler": "beau",
   "feeling": "brave",
   "virtues": ["courage", "hope", "comfort"],
   "stages": ["toddler", "preschool", "early-elementary"],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this the night before something your child has to be brave for.",
   "teaser": "Isaiah’s beautiful message ended with words of courage and joy — a wonderful way to finish the whole month! “Be strong, and don’t be afraid,” Isaiah said. “Heavenly Father is coming to help you and save you!” In Isaiah’s happy picture,…"
  },
  {
   "id": "b10-w1-n1",
   "title": "He Carries the Lambs",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 1,
   "night": 1,
   "scripture": "Isaiah 40:1–11",
   "scriptureBook": "Isaiah",
   "traveler": "willow",
   "feeling": "comforted",
   "virtues": ["comfort", "trust-in-god"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "comfort",
   "teachingNote": "Reach for this when your child is worn out and needs to hear that being carried is allowed.",
   "teaser": "Long ago the people of Israel were tired and sad. Heavenly Father sent them a message, and it began with the softest word of all: Comfort. Then a voice called out in the wilderness. Make the road straight…",
   "wordCount": 121
  },
  {
   "id": "b10-w1-n2",
   "title": "He Calls the Stars by Name",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 1,
   "night": 2,
   "scripture": "Isaiah 40:12–26",
   "scriptureBook": "Isaiah",
   "traveler": "wren",
   "feeling": "amazed",
   "virtues": ["identity", "wonder"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels small or overlooked and needs to know Heavenly Father knows their name.",
   "teaser": "Isaiah asked the people questions nobody could answer. Who held all the oceans in the hollow of one hand? Who weighed the mountains on a scale? Who spread the sky out like a tent for us to live…",
   "wordCount": 119
  },
  {
   "id": "b10-w1-n3",
   "title": "Wings Like the Eagles",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 1,
   "night": 3,
   "scripture": "Isaiah 40:28–31",
   "scriptureBook": "Isaiah",
   "traveler": "beau",
   "feeling": "discouraged",
   "virtues": ["perseverance", "trust-in-god"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "perseverance",
   "teachingNote": "Reach for this when your child is too tired to keep going and needs to learn where new strength comes from.",
   "teaser": "The people said the long road was too hard and their legs had nothing left in them. Isaiah told them Heavenly Father never gets tired at all. He made the ends of the whole earth, and He is…",
   "wordCount": 122
  },
  {
   "id": "b10-w1-n4",
   "title": "Rivers in the Dry Places",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 1,
   "night": 4,
   "scripture": "Isaiah 41:17–20",
   "scriptureBook": "Isaiah",
   "traveler": "scout",
   "feeling": "comforted",
   "virtues": ["hope", "trust-in-god"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child feels like nothing good is coming and needs a picture of rivers in dry places.",
   "teaser": "The poor and the needy went looking for water. They searched and searched, and there was none, and their tongues were dry with thirst. But Heavenly Father heard them calling. He promised He would never leave them alone…",
   "wordCount": 127
  },
  {
   "id": "b10-w1-n5",
   "title": "I Have Called You by Name",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 1,
   "night": 5,
   "scripture": "Isaiah 43:1–3",
   "scriptureBook": "Isaiah",
   "traveler": "beau",
   "feeling": "worried",
   "virtues": ["courage", "identity"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this the night before something scary, when your child needs to hear 'you are Mine.'",
   "teaser": "Heavenly Father spoke to His people about the hard road up ahead. He did not tell them that the road would be easy. He told them something better. Fear not, He said, for I made you, and I…",
   "wordCount": 118
  },
  {
   "id": "b10-w1-n6",
   "title": "Written on His Hands",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 1,
   "night": 6,
   "scripture": "Isaiah 49:13–16",
   "scriptureBook": "Isaiah",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": ["identity", "comfort"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "identity",
   "teachingNote": "Reach for this when your child feels forgotten, left out, or passed over.",
   "teaser": "Sing, O heavens, Isaiah said. Be joyful, O earth, and break out singing, O mountains, because the Lord has comforted His people. But some of them were certain they had been forgotten. My Lord has left me, they…",
   "wordCount": 114
  },
  {
   "id": "b10-w1-n7",
   "title": "Water from the Rock",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 1,
   "night": 7,
   "scripture": "Isaiah 48:17–21",
   "scriptureBook": "Isaiah",
   "traveler": "wren",
   "feeling": "calm",
   "virtues": ["heeding-counsel", "obedience"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "heeding-counsel",
   "teachingNote": "Reach for this when your child struggles to listen and needs to see that commandments are a kindness.",
   "teaser": "I am the One who teaches you what is good, Heavenly Father told His people, and I lead you in the way that you should go. If only you had listened to me, He said. Then your peace…",
   "wordCount": 121
  },
  {
   "id": "b10-w2-n1",
   "title": "A Word for the Weary",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 2,
   "night": 1,
   "scripture": "Isaiah 50:4–10",
   "scriptureBook": "Isaiah",
   "traveler": "beau",
   "feeling": "worried",
   "virtues": ["faith", "courage"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "faith",
   "teachingNote": "Reach for this when your child is afraid of the dark or of what comes next.",
   "teaser": "Morning by morning, Heavenly Father wakened Isaiah’s ear and taught him what to say. Then Isaiah could speak one gentle word to anyone who was weary. Isaiah was not afraid. He set his face steady as flint and…",
   "wordCount": 111
  },
  {
   "id": "b10-w2-n2",
   "title": "Look to the Rock",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 2,
   "night": 2,
   "scripture": "Isaiah 51:1–3",
   "scriptureBook": "Isaiah",
   "traveler": "wren",
   "feeling": "discouraged",
   "virtues": ["family-love", "gratitude"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "family-love",
   "teachingNote": "Reach for this when your child needs to know the family standing behind them.",
   "teaser": "Isaiah told the people to look at the rock they were cut from. Look back to Abraham your father, he said, and to Sarah who bore you. Heavenly Father called Abraham when he was all alone. Then He…",
   "wordCount": 105
  },
  {
   "id": "b10-w2-n3",
   "title": "Beautiful Feet on the Hills",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 2,
   "night": 3,
   "scripture": "Isaiah 52:7–10",
   "scriptureBook": "Isaiah",
   "traveler": "scout",
   "feeling": "excited",
   "virtues": ["kindness", "service"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child has something kind to share and needs a nudge to carry it.",
   "teaser": "Isaiah saw someone running over the mountains. How beautiful are his feet, Isaiah said, because of what he carries. The runner was bringing good tidings. He was publishing peace, and telling everyone that Heavenly Father reigns. The watchmen…",
   "wordCount": 96
  },
  {
   "id": "b10-w2-n4",
   "title": "He Carried Our Sorrows",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 2,
   "night": 4,
   "scripture": "Isaiah 53:3–6",
   "scriptureBook": "Isaiah",
   "traveler": "willow",
   "feeling": "sad",
   "virtues": ["compassion", "comfort"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "compassion",
   "teachingNote": "Reach for this when your child's heart is heavy and they need to learn that Jesus already knows how it feels.",
   "teaser": "Isaiah saw the Savior long before He came. Isaiah called Him a man of sorrows, One who knew exactly what sadness feels like. Jesus was not afraid of sad things. Surely, Isaiah said, He has borne our griefs…",
   "wordCount": 108
  },
  {
   "id": "b10-w2-n5",
   "title": "Kindness That Never Leaves",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 2,
   "night": 5,
   "scripture": "Isaiah 54:7–10",
   "scriptureBook": "Isaiah",
   "traveler": "wren",
   "feeling": "loved",
   "virtues": ["forgiveness", "comfort"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "forgiveness",
   "teachingNote": "Reach for this after a mistake, when your child is scared that love might leave.",
   "teaser": "For a small moment, Heavenly Father said, I let you go. But with great mercies I will gather you back to Me. With everlasting kindness I will have mercy on you, He said. His kindness had no ending…",
   "wordCount": 103
  },
  {
   "id": "b10-w2-n6",
   "title": "Go Out With Joy",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 2,
   "night": 6,
   "scripture": "Isaiah 55:6–12",
   "scriptureBook": "Isaiah",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": ["hope", "prayer"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this when your child is waiting on something good and needs to keep seeking.",
   "teaser": "Seek the Lord while He may be found, Isaiah said. Call upon Him while He is near. My thoughts are not your thoughts, Heavenly Father said. They are higher, the way the heavens are higher than the earth.…",
   "wordCount": 114
  },
  {
   "id": "b10-w2-n7",
   "title": "A Home for Humble Hearts",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 2,
   "night": 7,
   "scripture": "Isaiah 57:15, 19",
   "scriptureBook": "Isaiah",
   "traveler": "beau",
   "feeling": "guilty",
   "virtues": ["humility", "honesty"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child has hidden something and needs a safe way to tell the truth.",
   "teaser": "Isaiah said Heavenly Father is the high and lofty One who lives forever. I dwell in the high and holy place, He said. But Heavenly Father said He lives somewhere else too. He dwells with anyone who has…",
   "wordCount": 108
  },
  {
   "id": "b10-w3-n1",
   "title": "A Light Like the Morning",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 3,
   "night": 1,
   "scripture": "Isaiah 58:6–11",
   "scriptureBook": "Isaiah",
   "traveler": "willow",
   "feeling": "sad",
   "virtues": ["generosity", "service"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "generosity",
   "teachingNote": "Reach for this when your child has something to share and needs to see what giving does to a heart.",
   "teaser": "Heavenly Father’s people went without food and called it a fast. But their hearts stayed hard, and they wondered why the day never felt holy. So Heavenly Father gave Isaiah a better fast to carry to them. Share…",
   "wordCount": 127
  },
  {
   "id": "b10-w3-n2",
   "title": "The Day Called Delight",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 3,
   "night": 2,
   "scripture": "Isaiah 58:13–14",
   "scriptureBook": "Isaiah",
   "traveler": "wren",
   "feeling": "distracted",
   "virtues": ["reverence", "worship-together"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "reverence",
   "teachingNote": "Reach for this on a Saturday night, when your family wants Sunday to feel different.",
   "teaser": "Isaiah’s people had a holy day, but they filled it with their own errands and their own loud words. It felt like every other day. Heavenly Father asked Isaiah to teach them something quieter. Turn your feet away…",
   "wordCount": 123
  },
  {
   "id": "b10-w3-n3",
   "title": "His Hand Is Not Too Short",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 3,
   "night": 3,
   "scripture": "Isaiah 59:1–2, 20",
   "scriptureBook": "Isaiah",
   "traveler": "beau",
   "feeling": "discouraged",
   "virtues": ["repentance", "prayer"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "repentance",
   "teachingNote": "Reach for this when your child feels far from Heavenly Father and needs to know turning back is easy.",
   "teaser": "The people were afraid that Heavenly Father had stopped listening. Their prayers seemed to rise and disappear like smoke. So Isaiah told them the truth, plain and strong. Heavenly Father’s hand is not too short to save, and…",
   "wordCount": 115
  },
  {
   "id": "b10-w3-n4",
   "title": "Arise, Little Light",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 3,
   "night": 4,
   "scripture": "Isaiah 60:1–3, 19–20",
   "scriptureBook": "Isaiah",
   "traveler": "scout",
   "feeling": "worried",
   "virtues": ["hope", "faith"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this on a dark night, when your child needs to know morning is already on its way.",
   "teaser": "Isaiah called to his people like someone throwing open the curtains at dawn. ‘Arise, shine,’ he said, ‘for thy light is come.’ Darkness lay heavy over the whole earth. But the Lord would rise upon His people, Isaiah…",
   "wordCount": 116
  },
  {
   "id": "b10-w3-n5",
   "title": "Beauty for Ashes",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 3,
   "night": 5,
   "scripture": "Isaiah 61:1–3",
   "scriptureBook": "Isaiah",
   "traveler": "willow",
   "feeling": "sad",
   "virtues": ["comfort", "compassion"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "comfort",
   "teachingNote": "Reach for this when your child is grieving and needs someone to sit close before anything gets fixed.",
   "teaser": "The Spirit of the Lord was upon Isaiah, and Heavenly Father sent him with good news for gentle, tired people. He was sent to bind up hearts that were broken, and to tell everyone shut away that the…",
   "wordCount": 117
  },
  {
   "id": "b10-w3-n6",
   "title": "Clay in Kind Hands",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 3,
   "night": 6,
   "scripture": "Isaiah 64:8",
   "scriptureBook": "Isaiah",
   "traveler": "wren",
   "feeling": "safe",
   "virtues": ["humility", "patience"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "humility",
   "teachingNote": "Reach for this when your child feels unfinished or not good enough yet.",
   "teaser": "Isaiah prayed for his people, and he found gentle words for who they were. ‘O Lord, thou art our father,’ he said. ‘We are the clay, and thou our potter. We all are the work of thy hand.’…",
   "wordCount": 113
  },
  {
   "id": "b10-w3-n7",
   "title": "The Wolf and the Lamb",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 3,
   "night": 7,
   "scripture": "Isaiah 65:17–25",
   "scriptureBook": "Isaiah",
   "traveler": "scout",
   "feeling": "calm",
   "virtues": ["peacemaking", "hope"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "peacemaking",
   "teachingNote": "Reach for this when your child is afraid of someone or something and needs a picture of the peace that is coming.",
   "teaser": "Heavenly Father showed Isaiah something brand new: new heavens and a new earth, so good that the old sorrows would not even come to mind. There would be no more sound of weeping there, He said, and no…",
   "wordCount": 127
  },
  {
   "id": "b10-w4-n1",
   "title": "Before You Were Born",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 4,
   "night": 1,
   "scripture": "Jeremiah 1:4–8",
   "scriptureBook": "Jeremiah",
   "traveler": "beau",
   "feeling": "nervous",
   "virtues": ["courage", "identity"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "courage",
   "teachingNote": "Reach for this when your child says 'I'm too little' and needs to hear that Heavenly Father sends small people.",
   "teaser": "Long ago a young man named Jeremiah heard a quiet voice. It was Heavenly Father, and He said, ‘Before I made you, I knew you.’ Jeremiah looked down at his own small hands. ‘But I am only a…",
   "wordCount": 119
  },
  {
   "id": "b10-w4-n2",
   "title": "When He Touched My Mouth",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 4,
   "night": 2,
   "scripture": "Jeremiah 1:9–10",
   "scriptureBook": "Jeremiah",
   "traveler": "willow",
   "feeling": "confused",
   "virtues": ["kindness", "prayer"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "kindness",
   "teachingNote": "Reach for this when your child wants to help someone but does not know what to say.",
   "teaser": "Jeremiah still felt small. He did not think he had one single good word tucked inside him. Then a gentle touch came to Jeremiah’s mouth. ‘I have put my words in thy mouth,’ Heavenly Father said, soft as…",
   "wordCount": 115
  },
  {
   "id": "b10-w4-n3",
   "title": "The Little Waking Branch",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 4,
   "night": 3,
   "scripture": "Jeremiah 1:11–12",
   "scriptureBook": "Jeremiah",
   "traveler": "scout",
   "feeling": "amazed",
   "virtues": ["wonder", "keeping-promises"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "wonder",
   "teachingNote": "Reach for this when your child is waiting on a promise and needs to learn that Heavenly Father never forgets one.",
   "teaser": "One quiet day Heavenly Father asked Jeremiah a question. ‘Jeremiah, what do you see?’ Jeremiah looked, and then he looked again. ‘I see a branch from an almond tree,’ he said. The almond tree is the very first…",
   "wordCount": 102
  },
  {
   "id": "b10-w4-n4",
   "title": "The Potter’s Gentle Hands",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 4,
   "night": 4,
   "scripture": "Jeremiah 18:1–6",
   "scriptureBook": "Jeremiah",
   "traveler": "wren",
   "feeling": "comforted",
   "virtues": ["hope", "patience"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "hope",
   "teachingNote": "Reach for this after something your child made fell apart, when they need to begin again.",
   "teaser": "Heavenly Father had something to show Jeremiah. ‘Go down to the potter’s house,’ He said, ‘and there I will speak to you.’ So Jeremiah went. The potter’s wheel turned round and round, and wet clay rose up under…",
   "wordCount": 118
  },
  {
   "id": "b10-w4-n5",
   "title": "Come Home, Little Ones",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 4,
   "night": 5,
   "scripture": "Jeremiah 3:12, 14–15",
   "scriptureBook": "Jeremiah",
   "traveler": "willow",
   "feeling": "loved",
   "virtues": ["forgiveness", "family-love"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "forgiveness",
   "teachingNote": "Reach for this when your child has run off to hide and needs to hear 'come home' instead of a lecture.",
   "teaser": "Heavenly Father gave Jeremiah words to call out toward the north. His children had wandered a long way from home. ‘Come back,’ the words said. ‘I am merciful. I will not keep my anger forever.’ He promised to…",
   "wordCount": 107
  },
  {
   "id": "b10-w4-n6",
   "title": "The Tree by the Water",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 4,
   "night": 6,
   "scripture": "Jeremiah 17:7–8",
   "scriptureBook": "Jeremiah",
   "traveler": "beau",
   "feeling": "calm",
   "virtues": ["trust-in-god", "perseverance"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "trust-in-god",
   "teachingNote": "Reach for this on a hard, dry day, when your child needs to keep doing the small good things anyway.",
   "teaser": "Heavenly Father gave Jeremiah a picture to share with everybody. ‘Blessed is the one who trusts in the Lord,’ the words said. ‘He shall be as a tree planted by the waters.’ Jeremiah said it out loud, so…",
   "wordCount": 113
  },
  {
   "id": "b10-w4-n7",
   "title": "A Little Fire Inside",
   "volume": "ot",
   "book": 10,
   "bookTitle": "He Gathers the Lambs",
   "month": "October",
   "week": 4,
   "night": 7,
   "scripture": "Jeremiah 20:9, 13",
   "scriptureBook": "Jeremiah",
   "traveler": "scout",
   "feeling": "eager",
   "virtues": ["worship-together", "courage"],
   "stages": ["toddler", "preschool"],
   "primaryVirtue": "worship-together",
   "teachingNote": "Reach for this when your child has something true and happy inside and needs permission to let it out.",
   "teaser": "Some days were tired days for Jeremiah. People did not want the words he carried, and he thought about staying quiet. But the words would not sit still. They felt like a small warm fire tucked away inside…",
   "wordCount": 119
  }
 ]
};
