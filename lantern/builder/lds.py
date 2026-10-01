from common import *
from quotes import quotes_card, pick

# Links: linkify() in build() (THE LINKS RULE). Quotes: quotes_card() from the bank (THE QUOTES RULE).
# THE PLAIN WORDS RULE: every sentence LST writes here is short and plain; the story,
# the Traveler, the verse and every quotation keep their own words.

VERSE_REF = 'Isaiah 40:11 (KJV)'

def ref(label, text):
    return f'<div class="bt" style="margin-top:8px;"><strong style="color:var(--amber);">{ent(label)}</strong> &mdash; {ent(text)}</div>'

def heb(word):
    """A Hebrew word as entities, so the file carries no raw non-Latin text."""
    return ''.join(f'&#{ord(c)};' for c in word)


# ───────────────────────── BASE ─────────────────────────
PARENT_HEART = f'''
  <div class="card card-gold pinned-card">
    <div class="card-label lbl-navy">&#9733; A Parent's Heart for Tonight</div>
    <div class="card-title ct-navy">Before the lights go low</div>
    <div class="heart-q"><strong>1.</strong> {ent("When has the Lord carried you through a season you could not walk through alone? Tell about it.")}</div>
    <div class="heart-q"><strong>2.</strong> {ent("How do you comfort your child before you correct them? Tell about a moment you chose holding first.")}</div>
    <div class="heart-q"><strong>3.</strong> {ent("Did a grandparent or ancestor have a gentle, gathering way with tired people? Describe that quality.")}</div>
    <div class="atonement-q"><strong>The Atonement:</strong> {ent("Isaiah’s picture is a shepherd with a lamb against his chest. The lamb is not walking. It is being carried. That is the Atonement at a child’s size. The Savior does not stand at the top of the hill and call down. He comes down, picks up what cannot climb, and carries it close. Alma says He took our pains and sicknesses upon Him so He would know how to help us. He knows what weary feels like. Tonight, before you teach anything, let yourself be the lamb for one minute. Then be the arms.")}</div>
  </div>
'''

HEART_OF_TONIGHT = f'''
  <div class="card card-navy reveal">
    <div class="card-label lbl-white">&#9733; The Heart of Tonight's Story</div>
    <div class="bt-white"><strong>Gospel Principle:</strong> {ent("Comfort comes before correction. Isaiah’s chapter opens with a command to comfort, and the comfort is given before anyone has earned it. The people were tired and sad after years of their own wrong turns. Heavenly Father’s first word to them was still <em>Comfort</em>. Then He told them how He would come: like a shepherd, slow, with the lambs in His arms. The Lord’s strength is real, and verse 10 says so. But verse 11 says what He does with it. He carries.")}</div>
    <div class="bt-white" style="margin-top:8px;"><strong>Virtue:</strong> {ent("Compassion &amp; Tenderness, because a child learns what Heavenly Father is like from the arms that hold them. Tonight’s feeling word is <em>weary</em>. It is a better word than tired. Tired is a body. Weary is a body and a heart at once, and it is how a child feels at the end of a long day. Isaiah names it so a child can name it. Then he gives it somewhere to go.")}</div>
    <div class="bt-white" style="margin-top:8px;"><strong>For young children:</strong> {ent("When you are too tired to walk, Heavenly Father does not hurry you. He picks you up, the way a shepherd picks up a little lamb, and holds you close to His heart. You are one of His lambs.")}</div>
  </div>
'''

VERSE_CARD = f'''
  <div class="card card-verse reveal">
    <div class="card-label lbl-gold">&#10022; Verse of the Day</div>
    <div class="verse-text">"He shall feed his flock like a shepherd: he shall gather the lambs with his arm, and carry them in his bosom, and shall gently lead those that are with young."</div>
    <div class="verse-ref">Isaiah 40:11 (King James Version)</div>
    <div class="soft-div"></div>
    <div class="bt"><strong>Simple truth:</strong> {ent("Read the four verbs. He feeds. He gathers. He carries. He gently leads. None of them is fast. The lambs are gathered with His arm and carried in His bosom, which is the old word for the front of the chest. A lamb carried there hears a heartbeat. The mother sheep get a different verb. They are not carried. They are led, and led gently, at the pace of a tired animal. That is a shepherd who looks at each sheep and gives each one what it needs. He does the same with a family.")}</div>
    <div class="bt" style="margin-top:8px;"><strong>A note on tonight&rsquo;s wording:</strong> {ent("The King James text above is set from memory and was not re-checked against a scripture source tonight. It is worth a glance at your own copy of Isaiah 40:11 before you read it aloud.")}</div>
    <div class="pills">
      <div class="pill">Isaiah 40:1&ndash;2</div>
      <div class="pill">Isaiah 40:3&ndash;5</div>
      <div class="pill">Isaiah 40:9&ndash;11</div>
      <div class="pill">Psalm 23:1&ndash;3</div>
      <div class="pill">John 10:11&ndash;14</div>
    </div>
  </div>
'''

APPLY_QUICK = f'''
  <div class="card card-gold reveal">
    <div class="card-label lbl-navy">&#10022; Apply It &mdash; For You, Today</div>
    <div class="bt">{ent("Tomorrow, when your child falls apart over something small, try the order Willow used. Hold first. Fix second, or not at all. A hand on the back, no words, until the crying slows. Most of us do it the other way round: explain, correct, then hug. Isaiah’s chapter opens with comfort and gets to the straight road afterwards. A child who is held first learns that Heavenly Father’s first word is <em>Comfort</em>. That lesson is taught by arms, not sentences.")}</div>
  </div>
'''

# ───────────────────────── MEDIUM (tab-deep) ─────────────────────────
WHY_MATTERS = f'''
  <div class="card card-teal reveal">
    <div class="card-label lbl-teal">Why This Story Matters</div>
{paras('bt', [
 "Every child is going to be weary. Not just tired, but worn out in the heart. A friend moves away. A pet dies. School is hard for a long time. Tonight’s story tells a child what Heavenly Father does about that. He does not shout from the hilltop, <em>walk faster</em>. He comes down the hill, picks up the lamb, and carries it. A child who knows that has somewhere to go on the worst day of the year.",
 "Willow’s story is the same lesson at kitchen-floor size. Her cousin’s tower falls, and Willow does not rebuild it. She sits down close and pats her cousin’s back until the crying stops. Notice what she skips. No lecture about building wider towers. No hurry to make the crying end. The story calls this being held, and it calls it the very first comfort. First, before anything else.",
 "Isaiah wrote this to people who had wandered a long way from Heavenly Father. The chapter still opens with <em>Comfort</em>. That order matters more than it looks. Children often think love has to be earned by behaving. Isaiah 40 says the comfort came first, to tired people, before they had fixed anything. Your child needs to hear that from you tonight. They need to feel it from your arms.",
])}
  </div>
'''

HISTORICAL = f'''
  <div class="card card-navy reveal">
    <div class="card-label lbl-white">Historical Background</div>
{paras('bt-white', [
 "Isaiah 40 is a turning point in the book. The first thirty-nine chapters are mostly warnings. Isaiah tells Judah that Babylon will come and carry the people away, and it does. Then chapter 40 opens with a new voice. <em>Comfort ye, comfort ye my people.</em> Many readers call chapters 40 to 55 the Book of Comfort. Isaiah speaks to people in exile, far from home, as if their long punishment is already finished.",
 "The straight road in verse 3 was a real picture. When a king traveled in that part of the world, workers went ahead to fill the holes and level the high places so the road ran smooth. Isaiah says the King who is coming is the Lord Himself. Hundreds of years later John the Baptist read these verses about his own work. He was the voice in the wilderness. The Lord he prepared the way for was Jesus.",
 "Shepherds were everywhere in Isaiah’s world, and kings liked to call themselves shepherds of their people. Most of them did not mean the gentle part. Isaiah does. Verse 10 says the Lord comes with a strong hand, and verse 11 shows what the strong hand does. It gathers lambs. A newborn lamb cannot keep up with the flock. A good shepherd carried it inside his cloak, against his chest. Everyone listening knew exactly what that looked like.",
])}
  </div>
'''

THEMES_TONIGHT = ['trust', 'peace', 'love', 'jesus']
# the bank's shortest on-theme voices: a quotation longer than a parent reads in one
# breath is left for another night (and the plain-words check cannot see past 600 characters)
_SHORT = [q for q in pick('lds', THEMES_TONIGHT, n=12, seed=SLUG)
          if len(q['quote']) <= 560 and not any(ch in q['quote'] for ch in '\u201c\u201d"')][:2]
SOURCES_TONIGHT = quotes_card('lds', THEMES_TONIGHT, n=2, seed=SLUG, extra=_SHORT)

WORD_STUDY = f'''
  <div class="card card-teal reveal">
    <div class="card-label lbl-teal">Word Study &mdash; Isaiah 40:1, 11</div>
    <div class="chips">
      <span class="chip">Nacham ({heb('נָחַם')})</span>
      <span class="chip">Ra&rsquo;ah ({heb('רָעָה')})</span>
      <span class="chip">Cheq ({heb('חֵיק')})</span>
    </div>
{paras('bt', [
 "<strong>Nacham</strong> — “comfort” (v. 1). The word is not a pat on the head. It means to breathe deeply with someone, to sigh beside them, and then to help. In Isaiah’s Hebrew the command is doubled, <em>comfort, comfort</em>, as if once is not enough for people this tired. Tonight it matters because Heavenly Father’s first word to worn-out people was this one. Not <em>hurry</em>. Not <em>try harder</em>. Comfort.",
 "<strong>Ra’ah</strong> — “feed,” or shepherd (v. 11). The same word means to pasture a flock and to be a shepherd at all. It covers finding grass, finding water, and watching for wolves. In short, it is the whole job of keeping a flock alive. When Isaiah says the Lord will feed His flock like a shepherd, he means the Lord takes the whole job. He does not only carry you when you cry. He keeps you.",
 "<strong>Cheq</strong> — “bosom” (v. 11). The front of the chest, the fold of a cloak where something small is kept warm. A shepherd carried a lamb there, inside his robe. The lamb felt the shepherd’s heartbeat and heard his breathing. That is the picture the story turns into <em>close against his heart</em>. For a parent it is the whole point of tonight. The Lord does not carry us at arm’s length.",
])}
  </div>
'''

ISAIAH_AGAIN = f'''
  <div class="card card-conf reveal">
    <div class="card-label lbl-gold">&#9733; Where Isaiah Says It Again</div>
    <div class="card-title ct-gold">The same arms, four more times, across the book</div>
    <div class="conf-talk">
      <div class="conf-date" style="color:var(--amber);">Isaiah 46 &middot; 49 &middot; 63 &middot; 66</div>
      <div class="conf-body">{ent("Isaiah 40 is not the only place Isaiah shows the Lord carrying His people. In chapter 46 the Lord says He has carried Israel from birth and will keep carrying them to old age and gray hairs. In chapter 49 He answers a people who think He has forgotten them. A mother may forget her baby, He says, but I will not forget you. In chapter 63 Isaiah looks back over the whole story of Israel and says the Lord bare them and carried them all the days of old. In chapter 66 the picture turns to a mother. As one whom his mother comforteth, so will I comfort you.")}</div>
      <div class="conf-body" style="margin-top:10px;">{ent("Read the four together and one thing stands out. Every time, the people are small and the Lord is doing the carrying. Nobody climbs. Nobody earns the ride. Isaiah had hard words for Israel, and he never took them back. But when he describes what the Lord is like, he keeps reaching for the same two pictures: a shepherd with a lamb, and a mother with a baby. Those are the pictures a child should fall asleep with tonight.")}</div>
    </div>
  </div>
'''

LINE_TO_CARRY = f'''
  <div class="card card-quote reveal">
    <div class="card-label lbl-amber">The Line to Carry Out of Tonight</div>
    <div class="quote-inner-gold">
      <div class="quote-text">"Heavenly Father never rushes His littlest lambs, He carries them!"</div>
      <div class="quote-attr">&mdash; Remember This, from tonight's story in <em>Little Scripture Travelers</em></div>
    </div>
    <div class="bt" style="margin-top:10px;">{ent("Say it slowly and listen to the two halves. He never rushes. He carries. Most of a child’s day is spent being hurried. Shoes on, eat up, we are late. The Remember line tells a child that Heavenly Father is not like that with them. When they are too small or too tired, He does not speed them up. He picks them up. A child who believes that will pray differently, and will fall asleep differently.")}</div>
  </div>
'''

CONVO = f'''
  <div class="card card-navy reveal">
    <div class="card-label lbl-white">&#128172; Conversation Starter</div>
    <div class="prompt-q">"What soft word did Heavenly Father send first to His tired people?"</div>
    <div class="prompt-q" style="margin-top:8px;">"How does the shepherd carry the little lambs?"</div>
    <div class="prompt-q" style="margin-top:8px;">"What did Willow do when her cousin&rsquo;s block tower fell?"</div>
    <div class="bt-white" style="margin-top:10px;">Then turn it toward them: <em style="color:var(--gold);">"When did your body feel so tired that you wanted somebody to carry you?"</em></div>
  </div>
'''

GO_DEEPER = f'''
  <div class="card card-navy reveal">
    <div class="card-label lbl-white">&#128172; Go-Deeper Conversation</div>
    <div class="prompt-q">"Isaiah&rsquo;s first word to tired people is Comfort. What is my first word when my child is falling apart, and what would it take to make it this one?"</div>
    <div class="prompt-q" style="margin-top:8px;">"Verse 11 says the Lord leads the tired mothers gently. Where in my own life am I being led slowly right now, and have I called it His gentleness or my failure?"</div>
    <div class="prompt-q" style="margin-top:8px;">"Willow held first and fixed second. When did someone do that for me, and who in my house needs me to do it this week?"</div>
  </div>
'''

APPLY_DEEP = f'''
  <div class="card card-gold reveal">
    <div class="card-label lbl-navy">&#10022; Apply It &mdash; For You, Today</div>
{paras('bt', [
 "Start with the order of the chapter, because the order is the teaching. Comfort comes in verse 1. The straight road comes in verse 3. The strong hand comes in verse 10, and the lambs in verse 11. Heavenly Father comforts first and asks for the road afterwards. Most of us parent in the opposite order. We correct, then explain, then hug if there is time. Try reversing it for one week. Hold first. Say nothing for ten seconds. Then talk.",
 "Then do the thing the Five Stones ask, which is to name the feeling. The word is <em>weary</em>. Teach it to your child as a real word they are allowed to use. <em>I am weary</em> is a sentence a four-year-old can say, and it tells you more than <em>I am tired</em>. A child who can name weary can ask to be carried instead of melting down. That one word will save you a hundred bad evenings.",
 "And let yourself be carried too. The Parent’s Heart questions ask when the Lord carried you through a season you could not walk through. Answer it out loud tonight, to your child, in two sentences. Children think grown-ups never get weary. When they hear that you did, and that Heavenly Father carried you, the story stops being about sheep. It becomes about your family.",
])}
  </div>
'''

STORY_CONNECTION = f'''
  <div class="card card-teal reveal">
    <div class="tonight-tag">&#127769; Tonight's Story Connection</div>
{paras('bt', [
 "In tonight’s Little Scripture Travelers story, <strong>Willow the Warm</strong> meets the exact moment Isaiah 40 was written for. Her cousin’s block tower falls and the crying starts. Willow does not fix it. She sits down close and pats her cousin’s back until the crying goes quiet. The story says she learned that being held is the very first comfort. That is Isaiah 40:11 in a living room.",
 "Tonight’s Five Stones do the naming for you. SPOT the people of Israel, worn out and sad. NAME the feeling: <em>weary</em>. FIND the time your child’s body was so tired they wanted to be carried. Then the FORK, which is the whole lesson. Cry alone in the dark, or let someone hold you. The lambs let the Shepherd pick them up. Ask the FIND question exactly as it is written, and then wait for the answer.",
 "Do the Feeling Moment with your whole body, because this one was built for arms. Your child curls up small like a lamb in the grass. You scoop them up and hold them close to your heart, the way the Shepherd does. Then the CALM stone: a hand on the heart, and a whisper, <em style='color:var(--amber);'>Heavenly Father, please carry me tonight.</em> Let that be the last thing said before the light goes off.",
])}
  </div>
'''

# ───────────────────────── DEEP (tab-heavenly) ─────────────────────────
FULL_PASSAGE = f'''
  <div class="card card-navy reveal">
    <div class="card-label lbl-white">The Full Passage in Context</div>
{paras('bt-white', [
 "<strong>What comes before.</strong> Chapter 39 ends with Isaiah telling King Hezekiah that everything in his palace will be carried off to Babylon, and his sons with it. Then the page turns. Chapter 40 opens with the softest command in the book: <em>Comfort ye, comfort ye my people.</em> Jerusalem is told that her warfare is accomplished and her sin is pardoned. The exile is spoken of as already over. Heavenly Father speaks comfort before the hard years have even begun.",
 "<strong>How the chapter builds.</strong> Verses 1 and 2 are the comfort. Verses 3 to 5 are the voice in the wilderness and the road made straight for the Lord. Verses 6 to 8 set the grass that withers against the word of our God, which stands for ever. Verse 9 tells Zion to climb a high mountain and shout, <em>Behold your God</em>. Verse 10 says He comes with a strong hand. Verse 11 says what the strong hand is for: feeding the flock, gathering the lambs, carrying them, leading the mothers gently. Strength and tenderness in two verses, side by side.",
 "<strong>What comes after.</strong> Verses 12 to 26 are tomorrow night’s story. Isaiah asks who measured the waters in His hand and who calls the stars by name. The same Lord who carries a lamb holds the oceans. The chapter ends with verse 31 and the eagles’ wings: they that wait upon the Lord shall renew their strength. Tonight’s lamb and that eagle are the same promise. The weary are not left where they fall.",
])}
  </div>
'''

WORD_STUDY2 = f'''
  <div class="card card-teal reveal">
    <div class="card-label lbl-teal">Second Word Study &mdash; Isaiah 40:3, 11</div>
    <div class="chips">
      <span class="chip">Qol qore ({heb('קוֹל קוֹרֵא')})</span>
      <span class="chip">Nahal ({heb('נָהַל')})</span>
      <span class="chip">&rsquo;Aloth ({heb('עָלוֹת')})</span>
    </div>
{paras('bt', [
 "<strong>Qol qore</strong> — “a voice crying” (v. 3). Not a whisper. A herald’s shout, the cry that ran ahead of a king’s procession to get the road ready. The Gospels give the voice a name, John the Baptist, and the King he announced was Jesus. Tonight it matters because comfort in this chapter is not vague. It has a road and a direction. The Lord is coming to His people, on purpose.",
 "<strong>Nahal</strong> — “gently lead” (v. 11). The word is used of leading an animal to water and of guiding someone who cannot go fast. It is the opposite of driving a flock from behind with a stick. The mother sheep with lambs are not carried. They are led at their own pace. A parent will know which nights they are the lamb and which nights they are the tired mother. The Lord has a verb for both.",
 "<strong>’Aloth</strong> — “those that are with young” (v. 11). Ewes that are nursing or about to give birth. They are the slowest animals in the flock and the easiest to lose. Isaiah puts them in the last line of the picture on purpose. The shepherd sets the pace of the whole flock by its weakest members. If you are the slow one tonight, you are the one the chapter was written for.",
])}
  </div>
'''

CROSS_REFS = f'''
  <div class="card card-teal reveal">
    <div class="card-label lbl-teal">Cross-References</div>
    <div class="bt">{ent("Eight passages that carry tonight’s idea, described in our own words. Open your own copy beside them.")}</div>
{ref('Isaiah 46:3–4', "The Lord says He has carried Israel from the womb and will carry them to old age and gray hairs. Tonight’s lamb, grown up, and still carried.")}
{ref('Isaiah 63:9', "In all their affliction He was afflicted. He bare them and carried them all the days of old. Isaiah looking back over the whole story and finding the same arms.")}
{ref('Psalm 23:1–4', "The Lord is my shepherd. Green pastures, still waters, a restored soul, and company in the dark valley. The song every child should know by heart.")}
{ref('Ezekiel 34:11–16', "The Lord Himself promises to search for His sheep, bring back the lost, bind up the broken, and strengthen the sick. The shepherd’s whole job, in His own words.")}
{ref('Luke 15:4–6', "The Savior’s story of the one lost sheep. The shepherd finds it and lays it on his shoulders, rejoicing. Isaiah 40:11 with a smile on it.")}
{ref('John 10:11–15', "I am the good shepherd. The good shepherd gives His life for the sheep, and knows each one by name. The carrying in Isaiah cost Him everything.")}
{ref('Alma 7:11–12', "The Savior took upon Him our pains and sicknesses so He would know how to help us. The reason the Shepherd knows exactly how weary feels.")}
{ref('Mosiah 24:14–15', "Alma’s people are not freed from their burdens at once. The Lord strengthens them so they can carry them with ease. Sometimes He carries the lamb, and sometimes He carries the lamb’s load.")}
  </div>
'''

COMMENTARY = f'''
  <div class="card card-navy reveal">
    <div class="card-label lbl-white">Commentary &mdash; What Has Been Taught</div>
{paras('bt-white', [
 "Readers have long noticed that Isaiah 40 sounds like a new beginning. The voice changes from warning to comfort, and the people seem to be in Babylon rather than Jerusalem. Some scholars think these later chapters were written by a prophet after the exile. Others, including most Latter-day Saint teachers, read the whole book as Isaiah’s, seeing the exile ahead of time. Faithful readers differ on this. None of it changes what the chapter asks of a family tonight.",
 "Latter-day Saint teaching has always read the shepherd as the Savior. The Book of Mormon calls Him the good shepherd who calls His sheep by name, and Alma asks his people whether they will hear the shepherd’s voice. The Church’s reading of Isaiah 40:3 follows the Gospels: the voice in the wilderness is John the Baptist, and the Lord whose road he straightened is Jesus Christ. Handel set these verses to music at the opening of <em>Messiah</em>. For generations, <em>Comfort ye</em> has been the first words of the story of Christ.",
 "<strong>Where faithful readers differ.</strong> Some hear verse 11 as a picture of the Second Coming. Others hear it as the Lord’s daily care for His people in every age. Both readings are old, and both are held by good people. For a child, the two are one. The Lord who will come again is the Lord who carries them tonight.",
])}
  </div>
'''

DOCTRINAL_THREAD = f'''
  <div class="card card-teal reveal">
    <div class="card-label lbl-teal">A Doctrinal Thread &mdash; The Shepherd Who Carries</div>
{paras('bt', [
 "<strong>Genesis 48:15.</strong> Old Jacob, blessing his grandsons, calls the Lord the God which fed me all my life long. The word is shepherd. It is the first time anyone in scripture calls Heavenly Father that, and he says it at the end of a hard life.",
 "<strong>Psalm 23.</strong> David, who had been a shepherd, writes the song every child should know. The Lord is my shepherd. The valley is dark, and He is in it.",
 "<strong>Isaiah 40:11.</strong> Tonight. The lambs gathered, carried, held against the heart, and the tired mothers led slowly.",
 "<strong>Ezekiel 34.</strong> The Lord takes the job away from the bad shepherds of Israel and promises to do it Himself. Search, bring back, bind up, strengthen.",
 "<strong>John 10:11&ndash;16.</strong> Jesus says the words out loud. I am the good shepherd. The carrying costs Him His life, and He gives it.",
 "<strong>Alma 5:37&ndash;38, 59&ndash;60.</strong> Alma says the good shepherd is calling you by name. He asks whether you will hear Him, and warns that the wolf waits for the sheep who wander.",
 "<strong>3 Nephi 17:21&ndash;24.</strong> The risen Savior takes the Nephite children one by one, blesses them, and weeps. The lambs gathered in His arms, in the Americas, in person.",
 "<strong>Doctrine and Covenants 84:88.</strong> I will go before your face. I will be on your right hand and on your left, and mine angels round about you, to bear you up. The promise in the Restoration’s own words. Bearing up is carrying.",
])}
  </div>
'''

THREE_QUESTIONS = f'''
  <div class="card card-navy reveal">
    <div class="card-label lbl-white">Three Questions to Sit With This Week</div>
    <div class="prompt-q">1. Isaiah puts Comfort before the straight road. In my parenting this week, which came first, and what did my child learn from the order?</div>
    <div class="prompt-q" style="margin-top:10px;">2. Verse 11 gives the mother sheep a slower verb. Where is the Lord leading me gently right now, and have I been angry at the pace?</div>
    <div class="prompt-q" style="margin-top:10px;">3. The Remember line says He never rushes His littlest lambs. Who in my house is a littlest lamb this week, and am I rushing them?</div>
  </div>
'''

CONNECT_DOTS = f'''
  <div class="card card-navy reveal">
    <div class="card-label lbl-white">&#10022; Connecting the Dots</div>
    <div class="card-title ct-white">Where this doctrine begins, how it grows, and how it reaches your child&rsquo;s bed</div>
{paras('bt-white', [
 "The idea in tonight’s chapter starts at the end of Jacob’s life. An old man blesses two grandsons and calls the Lord the God which fed me all my life long. The Hebrew word is shepherd. Jacob had cheated, run away, wrestled, and buried a wife. At the end he looked back and saw a shepherd who had carried him the whole way.",
 "David picked the word up because he had done the job. He had carried lambs and fought off the lion. When he wrote <em>The Lord is my shepherd</em>, he knew what the shepherd’s arms were for. Isaiah 40 takes David’s song and turns it toward a whole nation. Not one sheep but all of them, and the smallest carried closest.",
 "Then the Shepherd stepped into the story Himself. Jesus said <em>I am the good shepherd</em> and told the crowd what it would cost: His life. The Gospels read Isaiah’s voice in the wilderness as John the Baptist, and the coming Lord as Jesus. The lamb carried against the heart in Isaiah is carried by nail-marked hands in John.",
 "The Restoration adds the part Isaiah could only promise. In 3 Nephi the risen Savior takes children one by one and blesses them, and the record says He wept. Alma teaches that He took our pains and sicknesses upon Him so He would know how to carry us. The Doctrine and Covenants promises angels round about you, to bear you up. Bearing up is carrying.",
 "So it arrives at your child’s bed in a form small enough to use tonight. When a child is weary, the Lord does not hurry them. He gathers them, carries them close to His heart, and leads the tired slowly. You are the arms He is using tonight. Hold first. Then tell the story.",
])}
  </div>
'''

TEN_PASSAGES = f'''
  <div class="card card-quote reveal">
    <div class="card-label lbl-amber">&#10022; Ten Places Scripture Says It</div>
    <div class="card-title ct-gold">The Shepherd who carries, traced across the standard works</div>
    <div class="bt" style="margin-bottom:4px;">{ent("Ten references, described in our own words rather than quoted, so nothing here is set from memory. Open them yourself; the descriptions are ours, the words are not.")}</div>
{ref('Genesis 48:15', "Jacob at the end of his life: the God which fed me all my life long. The first shepherd in scripture, named by an old man looking back.")}
{ref('Psalm 23:1–4', "The Lord is my shepherd. The pastures, the water, the valley, and the rod and staff that comfort.")}
{ref('Isaiah 40:11', "Tonight’s verse. Fed, gathered, carried in His bosom, and the mothers gently led.")}
{ref('Isaiah 46:3–4', "Carried from the womb, and carried still in old age. The Lord does not put His people down.")}
{ref('Ezekiel 34:11–16', "The Lord will search, seek out, bring back, bind up and strengthen. He takes the shepherd’s job Himself.")}
{ref('Luke 15:4–7', "The lost sheep found and carried home on the shepherd’s shoulders, and heaven rejoicing.")}
{ref('John 10:11–16', "I am the good shepherd. He knows His sheep by name and lays down His life for them.")}
{ref('Alma 7:11–12', "He took upon Him our pains and sicknesses, that He might know how to succor His people.")}
{ref('3 Nephi 17:21–24', "The risen Savior takes the children one by one, blesses them, weeps, and angels come down among them.")}
{ref('Doctrine and Covenants 84:88', "Mine angels round about you, to bear you up. The Restoration’s promise of carrying.")}
    <div class="bt" style="margin-top:12px;">{ent("Read them in order and watch what never changes. The sheep is small and the Shepherd does the carrying. Jacob at the end of his life, David with his harp, Isaiah to a nation in exile, Jesus on the road, the Nephite children on His knee, and a promise to bear you up. One Shepherd, one way of holding.")}</div>
  </div>
'''

PASSAGES_TO_SIT_WITH = f'''
  <div class="card card-conf reveal">
    <div class="card-label lbl-gold">&#10022; Three Passages to Sit With</div>
    <div class="card-title ct-gold">Longer readings matched to tonight's text</div>
    <div class="conf-talk">
      <div class="conf-date" style="color:var(--gold);">Reading one &middot; ten minutes</div>
      <div class="conf-speaker">Isaiah 40, read straight through</div>
      <div class="conf-body">{ent("Read the whole chapter once, out loud if you can. It opens with Comfort and ends with eagles’ wings. In between, the Lord who carries a lamb measures the oceans in His hand and calls every star by name. Tonight’s story is verses 1 to 11. Tomorrow night’s is verses 12 to 26. Reading the chapter whole shows you why the two belong together: the One strong enough to hold the stars is gentle enough to hold your child.")}</div>
    </div>
    <div class="conf-talk" style="margin-top:14px;">
      <div class="conf-date" style="color:var(--amber);">Reading two &middot; fifteen minutes</div>
      <div class="conf-speaker">Ezekiel 34 and John 10:1&ndash;18</div>
      <div class="conf-body">{ent("Ezekiel 34 is the Lord’s complaint against the shepherds of Israel who fed themselves and let the flock scatter. Then He says He will do the job Himself. John 10 is Jesus saying He is the one Ezekiel promised. Read them back to back. Every verb Ezekiel gives the Lord, search, bring back, bind up, strengthen, Jesus claims in person, and adds one more. He lays down His life.")}</div>
    </div>
    <div class="conf-talk" style="margin-top:14px;">
      <div class="conf-date" style="color:var(--gold);">Reading three &middot; ten minutes</div>
      <div class="conf-speaker">3 Nephi 17</div>
      <div class="conf-body">{ent("The risen Savior in the Americas, and a crowd too tired to take in any more. He sees it. He tells them to go home and rest, and then He cannot leave. He heals the sick, prays with them, and takes the children one by one. Read it slowly and count how often He weeps. This is Isaiah 40:11 with the Shepherd’s own face in it.")}</div>
    </div>
  </div>
'''

STUDY_TACTICS = f'''
  <div class="card card-gold reveal">
    <div class="card-label lbl-navy">&#10022; Study Tactics &mdash; Going to Another Level</div>
    <div class="card-title ct-navy">Four Latter-day Saint study methods, sized for tonight</div>
    <div class="bt"><strong>1 &middot; Scripture journaling &mdash; twenty minutes, one page.</strong> {ent("Copy Isaiah 40:11 by hand and underline the four verbs: feed, gather, carry, lead. Beside each one write the name of a person in your home who needs that verb from you this week. One verse, four names. Then write the name of the person who did that for you.")}</div>
    <div class="bt" style="margin-top:10px;"><strong>2 &middot; Footnote and Topical Guide chains &mdash; fifteen minutes.</strong> {ent("Open Isaiah 40:11 in your own scriptures and follow the footnotes. Then look up Shepherd in the Topical Guide. It is one of the richest entries in the book. Read it slowly from Genesis to the Doctrine and Covenants and count how often the Lord is the one doing the carrying.")}</div>
    <div class="bt" style="margin-top:10px;"><strong>3 &middot; Liken the scriptures &mdash; ten minutes, out loud.</strong> {ent("Read verses 1 to 11 aloud and put your child’s name where it says <em>my people</em>. Then read it again with your own name. Nephi said to liken all scripture to ourselves. This chapter was written to tired people far from home, and most parents have been there.")}</div>
    <div class="bt" style="margin-top:10px;"><strong>4 &middot; Pondering and recording impressions &mdash; five minutes, tonight, before you sleep.</strong> {ent("Ask one question: <em>where is the Lord carrying me right now, that I have been calling my own strength?</em> Write the first thing that comes, without fixing the words. Verse 11 says He carries. Recording is how you notice the arms.")}</div>
  </div>
'''

ONE_INVITATION = f'''
  <div class="card card-gold reveal">
    <div class="card-label lbl-navy">&#10022; One Invitation This Week</div>
{paras('bt', [
 "<strong>Hold first, all week.</strong> Every time a child in your house falls apart, over anything, your first move is arms, not words. Count ten slow breaths before you say a sentence. Tell the children this is the week’s rule and let them catch you breaking it. Isaiah’s chapter opens with Comfort, and so will your house.",
 "Then, on the seventh night, ask the FIND question from tonight’s Feeling Moment one more time: <em>when did your body feel so tired that you wanted somebody to carry you?</em> Listen to every answer. Then tell your own. A family that can say <em>I was weary, and I was carried</em> has learned Isaiah 40.",
])}
  </div>
'''

# ───────────────────────── COMPOSE ─────────────────────────
RES = resources_card(); STORYC = story_card(); TRAV = traveler_card()
BASE = [RES, PARENT_HEART, STORYC, TRAV, HEART_OF_TONIGHT, VERSE_CARD]   # Resources first, then A Parent's Heart (10 Sep)
QUICK = BASE + [APPLY_QUICK]
DEEP = BASE + [WHY_MATTERS, HISTORICAL, SOURCES_TONIGHT, WORD_STUDY, ISAIAH_AGAIN, LINE_TO_CARRY,
               CONVO, GO_DEEPER, APPLY_DEEP, STORY_CONNECTION]
HEAVENLY = BASE + [WHY_MATTERS, HISTORICAL, SOURCES_TONIGHT, WORD_STUDY, ISAIAH_AGAIN,
                   FULL_PASSAGE, WORD_STUDY2, CROSS_REFS, COMMENTARY, DOCTRINAL_THREAD,
                   LINE_TO_CARRY, CONVO, GO_DEEPER, APPLY_DEEP, STORY_CONNECTION, THREE_QUESTIONS,
                   CONNECT_DOTS, TEN_PASSAGES, PASSAGES_TO_SIT_WITH, STUDY_TACTICS, ONE_INVITATION]

if __name__ == '__main__':
    print('tiers', len(QUICK), len(DEEP), len(HEAVENLY))
    build({'quick': QUICK, 'deep': DEEP, 'heavenly': HEAVENLY},
          VERSE_REF, f'{OUT_DIR}/morning-lantern-lds.html', TITLE)
    print('built morning-lantern-lds.html')
