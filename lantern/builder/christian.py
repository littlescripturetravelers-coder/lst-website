from common import *

# ── Tonight ships with NO external links and NO attributed outside quotes. ──
# Every source domain in the run's source map was refused by this environment's
# network egress proxy, so nothing could be verified. Nothing unverified is printed.

VERSE_REF = 'Proverbs 2:4&ndash;5 (NIV)'

def ref(label, text):
    return f'<div class="bt" style="margin-top:8px;"><strong style="color:var(--amber);">{ent(label)}</strong> &mdash; {ent(text)}</div>'

UNVERIFIED = ("Tonight&rsquo;s edition prints no outside quotations and no outside links. "
              "Every source this run is required to check was unreachable from the machine that built the page, "
              "and nothing goes in front of a family unverified. What follows is scripture, and our own words about it.")

# ───────────────────────── BASE ─────────────────────────
PARENT_HEART = f'''
  <div class="card card-gold pinned-card">
    <div class="card-label lbl-navy">&#9733; A Parent's Heart for Tonight</div>
    <div class="card-title ct-navy">Before the lights go low</div>
    <div class="heart-q"><strong>1.</strong> {ent("When did seeking wisdom — over quick or easy answers — bless your life? Share it.")}</div>
    <div class="heart-q"><strong>2.</strong> {ent("How do you nurture a love of learning and listening in your child? Tell about a treasure you’ve found.")}</div>
    <div class="heart-q"><strong>3.</strong> {ent("Did a grandparent or ancestor pass down wisdom you still treasure? Describe the gift of their counsel.")}</div>
    <div class="atonement-q"><strong>The Gospel:</strong> {ent("Solomon says wisdom is buried treasure, and buried treasure has an uncomfortable implication: somebody has to dig. God could have written what is good and right across the sky. He hid it instead in a place that costs a child something to reach — attention, patience, the humility to ask a grown-up who knows more. That is not stinginess. That is how a person is made wise rather than merely informed. And it is why Jesus is the treasure and not only the map. Paul tells the Colossians that in Christ are hidden all the treasures of wisdom and knowledge, which means the digging in this chapter has a destination and a face. Wisdom that only told you the right thing to do would leave you standing over every wrong thing you had already done. The gospel is what makes wisdom good news instead of a scoreboard. Say it plainly: <em>“God hid the best things where you can find them — and Jesus makes it safe to go looking.”</em>")}</div>
  </div>
'''

HEART_OF_TONIGHT = f'''
  <div class="card card-navy reveal">
    <div class="card-label lbl-white">&#9733; The Heart of Tonight's Story</div>
    <div class="bt-white"><strong>Biblical Principle:</strong> {ent("Wisdom is sought, not stumbled upon. Solomon does not tell his son that understanding will arrive; he tells him to call out for it, to dig for it, to search as a person searches for silver. And then he names where the digging happens — in listening. To God, and to the wise grown-ups He has already put in a child’s life. Wisdom in Proverbs 2 is not a talent some children are born with. It is a treasure, and treasure is found by people who go looking.")}</div>
    <div class="bt-white" style="margin-top:8px;"><strong>Virtue:</strong> {ent("Wisdom &amp; Seeking — because a child who has learned that good answers are worth hunting for will keep hunting long after the bedtime story is over. Tonight’s feeling word is <em>curious</em>, and it is a more useful word than <em>clever</em>. Clever is something you are. Curious is something you do, and it is available to every child in the house tonight.")}</div>
    <div class="bt-white" style="margin-top:8px;"><strong>For young children:</strong> {ent("Wisdom means knowing the good and right thing to do. It is hidden like treasure — and you find it by listening to God and to the grown-ups who love you. Every time you listen and learn, you find a little more.")}</div>
  </div>
'''

VERSE_CARD = f'''
  <div class="card card-verse reveal">
    <div class="card-label lbl-gold">&#10022; Verse of the Day</div>
    <div class="verse-text">"and if you look for it as for silver and search for it as for hidden treasure, then you will understand the fear of the LORD and find the knowledge of God."</div>
    <div class="verse-ref">Proverbs 2:4&ndash;5 (New International Version)</div>
    <div class="soft-div"></div>
    <div class="bt"><strong>Simple truth:</strong> {ent("Read the two verbs before you read anything else. <em>Look for</em>, and <em>search</em>. Solomon does not say wisdom is given to the deserving or dawns on the patient. He says it is hunted, with the same energy a person brings to silver. And then verse 5 tells you what is actually at the bottom of the hole, which is not a fact about life. It is the knowledge of God. The treasure hunt in tonight’s story ends where Solomon said it would: not with a clever child, but with a child who knows God better than they did yesterday.")}</div>
    <div class="bt" style="margin-top:8px;"><strong>A note on tonight&rsquo;s wording:</strong> {ent("The NIV text above is set from memory and could not be re-checked against a Bible source tonight — the network blocked every one. It is worth a glance at your own Bible at Proverbs 2:4–5 before you read it aloud.")}</div>
    <div class="pills">
      <div class="pill">Proverbs 2:1&ndash;5</div>
      <div class="pill">Proverbs 2:6</div>
      <div class="pill">Proverbs 3:13&ndash;15</div>
      <div class="pill">Proverbs 4:7</div>
      <div class="pill">Matthew 13:44</div>
    </div>
  </div>
'''

APPLY_QUICK = f'''
  <div class="card card-gold reveal">
    <div class="card-label lbl-navy">&#10022; Apply It &mdash; For You, Today</div>
    <div class="bt">{ent("Tomorrow, let your child watch you ask somebody a question. Out loud, in front of them: <em>I don’t know how to do this — will you show me?</em> A pharmacist, a neighbour, your own mother on the phone. Children decide very early whether asking is what smart people do or what people do when they have failed, and they decide it by watching you, not by being told. Forty seconds of visible asking teaches Proverbs 2 better than a lecture on it.")}</div>
  </div>
'''

# ───────────────────────── MEDIUM (tab-deep) ─────────────────────────
WHY_MATTERS = f'''
  <div class="card card-teal reveal">
    <div class="card-label lbl-teal">Why This Story Matters</div>
{paras('bt', [
 "There is a moment coming, in every childhood, when a child decides what to do with not knowing. Some children learn that not-knowing is shameful, and they start guessing confidently, or going quiet, or pretending. Others learn that not-knowing is the beginning of a treasure hunt. Nothing you teach tonight will matter more than which of those two a child becomes, and Proverbs 2 is the whole argument in one image: what you do not yet know is not a hole in you. It is buried silver.",
 "Scout’s story is that lesson at sandcastle scale. Scout wanted to build the tallest one and did not know how — and the story turns on the sentence <em>instead of giving up, Scout asked Grandpa</em>. Not instead of crying; instead of giving up. Asking is presented as the brave, resourceful thing a seeker does, and the reward is immediate and physical: wet sand sticks better, and the castle stands. A three-year-old can hold that. It is the same shape as verse 4.",
 "Notice who Solomon puts at the other end of the digging. Not a library and not a clever thought — a voice. <em>Listen to God, and listen to the wise grown-ups who love us.</em> Wisdom in this chapter travels person to person, which means that tonight the treasure in the room is you. That is a heavier thing to hear than it sounds, and a kinder one: you do not have to be wise to hand a child wisdom. You only have to be someone they are in the habit of asking.",
])}
  </div>
'''

HISTORICAL = f'''
  <div class="card card-navy reveal">
    <div class="card-label lbl-white">Historical Background</div>
{paras('bt-white', [
 "Proverbs opens with nine chapters that are not proverbs at all. Before the short, sharp one-line sayings begin in chapter 10, there is a long stretch of fatherly speeches — <em>my son</em>, again and again — addressed to a young man about to leave home. Chapter 2 is one of those speeches, and it is built as a single sentence in Hebrew: a long chain of <em>if</em> clauses in verses 1 to 4, and then the payoff in verse 5. If you accept, and store up, and turn your ear, and apply your heart, and call out, and cry aloud, and look, and search — <em>then</em> you will understand.",
 "That grammar is the teaching. The conditions pile up for four verses before a single promise arrives, and every one of them is something the son has to do. Ancient wisdom writing across the whole region shared this instructional shape — a father or a court official coaching a young man on how to live well — but Proverbs puts something at the centre of it that the neighbouring collections do not: the fear of the Lord, and knowledge that comes out of God’s own mouth rather than out of accumulated experience.",
 "The treasure image would have landed harder then than it does now. Silver was not decoration; it was money, weighed out on scales for a field or a bride-price. And people genuinely did dig for it — buried hoards were how a household survived an invading army, and searching a ruin for a hidden jar was ordinary, exhausting, hopeful work. Solomon is not reaching for a poetic flourish. He is describing sweat, and telling a boy that understanding costs exactly that much and is worth exactly that much.",
])}
  </div>
'''

SOURCES_TONIGHT = f'''
  <div class="card card-conf reveal">
    <div class="card-label lbl-gold">&#9733; About Tonight's Outside Voices</div>
    <div class="card-title ct-gold">Why this edition quotes no one but scripture</div>
    <div class="conf-talk">
      <div class="conf-date" style="color:var(--gold);">September 10, 2026 &middot; A note from the workshop</div>
      <div class="conf-body">{ent(UNVERIFIED)}</div>
      <div class="conf-body" style="margin-top:10px;">Ordinarily this card carries a teacher or pastor whose words sit well beside tonight&rsquo;s chapter, with a link so you can read the whole thing. That could not be done honestly tonight, and a remembered quotation attached to a real person&rsquo;s name is exactly the kind of mistake that is worth missing a card to avoid. The study cards that follow lean on Proverbs itself instead, which is the better half of the reading anyway.</div>
    </div>
  </div>
'''

WORD_STUDY = f'''
  <div class="card card-teal reveal">
    <div class="card-label lbl-teal">Word Study &mdash; Proverbs 2:4&ndash;5</div>
    <div class="chips">
      <span class="chip">Chokmah (&#1495;&#1464;&#1499;&#1456;&#1502;&#1464;&#1492;)</span>
      <span class="chip">Chaphas (&#1495;&#1464;&#1508;&#1463;&#1513;&#1474;)</span>
      <span class="chip">Matmon (&#1502;&#1463;&#1496;&#1456;&#1502;&#1493;&#1465;&#1503;)</span>
    </div>
{paras('bt', [
 "<strong>Chokmah</strong> — “wisdom.” The word is not primarily about intelligence. In Exodus it describes the craftsmen who built the tabernacle: skill in the hands, the know-how of someone who can actually make the thing. Chokmah is competence at living — knowing what to do, in this room, with these people, today. Which is very close to what tonight’s story tells a child in eleven words: wisdom means knowing the good and right thing to do.",
 "<strong>Chaphas</strong> — “search” (v. 4). A rummaging word. It is used of ransacking a house, of turning a place over looking for something, of an enemy searching out hiding places. There is nothing serene about it. Solomon could have chosen a word for quiet contemplation and deliberately did not; he chose the word for pulling the drawers out. The Feeling Moment’s dig-dig-dig is a surprisingly faithful translation.",
 "<strong>Matmon</strong> — “hidden treasure” (v. 4). From a root meaning to bury or conceal. Not treasure on display in a king’s hall — treasure put in the ground on purpose, by someone, to be found later by someone else. That last clause is the one to sit with as a parent. Hidden things imply a hider. The chapter’s whole hope rests on God having buried something good where a child could reasonably be expected to dig it up.",
])}
  </div>
'''

SOLOMON_AGAIN = f'''
  <div class="card card-conf reveal">
    <div class="card-label lbl-gold">&#9733; Where Solomon Says It Again</div>
    <div class="card-title ct-gold">The same idea, four more times, across the book</div>
    <div class="conf-talk">
      <div class="conf-date" style="color:var(--amber);">Proverbs 3 &middot; 4 &middot; 8 &middot; 16</div>
      <div class="conf-body">{ent("Proverbs 2 is not a one-off image; the book keeps coming back to it, and the repetition is itself the argument. In chapter 3 Solomon calls the one who finds wisdom blessed, and puts her worth above silver, gold and rubies. In chapter 4 he compresses the whole of tonight into a single instruction — get wisdom, and though it cost all you have, get understanding — and calls it the beginning of the matter. In chapter 8 Wisdom speaks for herself and asks to be chosen in preference to silver and choice gold. And in chapter 16 the comparison is put as a question of trade: how much better it is to get wisdom than gold, and understanding than silver.")}</div>
      <div class="conf-body" style="margin-top:10px;">{ent("Read the four together and a pattern shows up that is easy to miss in one sitting. Every time Solomon reaches for a comparison, he reaches for money — and every time, he insists on the exchange rate rather than the sentiment. He is not saying wisdom is lovely. He is saying that a person who traded every ounce of silver they owned for understanding would have made a good trade, and would know it afterwards. That is a sturdier thing to hand a child than praise for being smart.")}</div>
    </div>
  </div>
'''

TREASURE_HELD = f'''
  <div class="card card-quote reveal">
    <div class="card-label lbl-amber">The Line to Carry Out of Tonight</div>
    <div class="quote-inner-gold">
      <div class="quote-text">"Wisdom is a treasure worth hunting for &mdash; and you find it by listening to Heavenly Father and the wise people who love you!"</div>
      <div class="quote-attr">&mdash; Remember This, from tonight's story in <em>Little Scripture Travelers</em></div>
    </div>
    <div class="bt" style="margin-top:10px;">{ent("That sentence is doing more work than it looks. It answers the question every treasure story raises and most of them dodge — where, exactly, do I dig? Solomon’s answer in verse 6 is that the Lord gives wisdom, and from His mouth come knowledge and understanding; the story’s answer, sized for a five-year-old, is that you listen. To God, and to the people He has already put within arm’s reach. Ask the Remember This question as they settle tonight and then be quiet long enough to get an answer: <em>what is something wise you learned from a grown-up you love?</em> Whatever a child names is a piece of treasure they did not know they were carrying.")}</div>
  </div>
'''

CONVO = f'''
  <div class="card card-navy reveal">
    <div class="card-label lbl-white">&#128172; Conversation Starter</div>
    <div class="prompt-q">"What did Solomon say to look for like treasure?"</div>
    <div class="prompt-q" style="margin-top:8px;">"How do we find the treasure of wisdom?"</div>
    <div class="bt-white" style="margin-top:10px;">Then turn it toward them: <em style="color:var(--gold);">"What is something wise you learned from a grown-up you love?"</em></div>
  </div>
'''

GO_DEEPER = f'''
  <div class="card card-navy reveal">
    <div class="card-label lbl-white">&#128172; Go-Deeper Conversation</div>
    <div class="prompt-q">"Solomon assumes his son will have to dig. Where in my own life am I waiting for understanding to arrive instead of going after it &mdash; and what would digging actually look like this week?"</div>
    <div class="prompt-q" style="margin-top:8px;">"Verse 6 says the Lord gives wisdom. When did I last ask God for wisdom about something specific, rather than asking Him to fix the situation?"</div>
    <div class="prompt-q" style="margin-top:8px;">"Scout asked Grandpa. Who are the wise voices my children have within reach &mdash; and am I building the kind of week in which they can actually reach them?"</div>
  </div>
'''

APPLY_DEEP = f'''
  <div class="card card-gold reveal">
    <div class="card-label lbl-navy">&#10022; Apply It &mdash; For You, Today</div>
{paras('bt', [
 "Start with the grammar, because it is the sermon. Proverbs 2:1–4 is a stack of conditions — accept, store up, turn your ear, apply your heart, call out, cry aloud, look, search — and verse 5 is the only promise in the paragraph. Read it aloud once and hear how long you have to wait for the <em>then</em>. That delay is not God being withholding. It is the difference between a child who has been handed an answer and a child who has become the sort of person who finds them.",
 "Then do the thing the chapter actually asks, which is embarrassingly practical: pick one question you have been carrying and ask a wiser person about it this week. Not a search engine. A person, by name, who knows more than you do. Tell your child you are going to do it, and tell them afterwards what you learned. Proverbs 2 hands wisdom down through voices, and a child who never sees a parent ask will quietly conclude that adults are supposed to already know.",
 "And keep the ask small enough to repeat. The story’s promise is <em>one good lesson at a time</em>, not a transformation. A family that asks one real question a week has a habit; a family that resolves to pursue wisdom has an intention. Solomon, who wrote a whole book of one-line instructions, clearly knew which of the two survives contact with a Tuesday.",
])}
  </div>
'''

STORY_CONNECTION = f'''
  <div class="card card-teal reveal">
    <div class="tonight-tag">&#127769; Tonight's Story Connection</div>
{paras('bt', [
 "In tonight’s Little Scripture Travelers story, <strong>Scout the Seeker</strong> meets the exact problem Proverbs 2 was written for: Scout wanted to build the tallest sandcastle and <em>didn’t know how</em>. The story’s hinge is one sentence — <em>instead of giving up, Scout asked Grandpa</em> — and the treasure turns out to be four words long: wet sand sticks better. Scout listened, tried it, and the castle stood. That is verse 4 acted out by somebody who cannot yet read verse 4.",
 "Tonight’s Five Stones do the naming for you. Looking for wisdom, we can feel curious and eager to learn; that want-to-know-more feeling is called <em>curious</em>; and the fork is the whole lesson — we can shrug and not bother, or hunt for wisdom like treasure, because Solomon taught us to search for it eagerly. Ask the FIND question exactly as it is written and then wait: <em>when have you felt curious and excited to learn something new?</em> A child answering that out loud is learning that curiosity has a name and is a good thing to be.",
 "Do the Feeling Moment with the whole body, because this one is built for it: a hand above the eyes to search all around, then dig-dig-dig with both hands, then — <em style='color:var(--amber);'>I found it!</em> — the sparkly treasure of wisdom held up high. Finish with the CALM stone: one slow breath, and a whisper, <em>help me grow wise, Heavenly Father.</em> Let that be the last thing said before the light goes off.",
])}
  </div>
'''

# ───────────────────────── DEEP (tab-heavenly) ─────────────────────────
FULL_PASSAGE = f'''
  <div class="card card-navy reveal">
    <div class="card-label lbl-white">The Full Passage in Context</div>
{paras('bt-white', [
 "<strong>What comes before.</strong> Chapter 1 has already made the offer and had it refused. Wisdom is pictured calling aloud in the street, asking how long the simple will love their simple ways, and the chapter ends badly for those who would not listen. Chapter 2 opens quietly after that noise, turning from the crowd to one child: <em>my son</em>. The shift is deliberate. Public appeal did not work; a father sitting down with his own boy might.",
 "<strong>How the chapter builds.</strong> Verses 1 to 4 are the conditions, verse 5 the promise, and verse 6 the reason the whole arrangement works — the Lord gives wisdom, and from His mouth come knowledge and understanding. That verse quietly resolves the tension in the treasure image. If wisdom must be dug for, is it earned? Verse 6 says no: it is given, and the digging is how a person becomes able to receive it. From verse 7 the chapter turns protective — wisdom entering the heart, discretion protecting, understanding guarding — and the second half describes at length the two roads a young person walks away from when they have it.",
 "<strong>What comes after.</strong> Chapter 3 picks up the same thread and pushes it to the line most families know by heart: trust in the Lord with all your heart, and lean not on your own understanding. Which is last night’s story, and it is not a coincidence that it follows this one. Proverbs 2 says go and dig for understanding; Proverbs 3 says and then do not lean on the pile you dug up. Both are true, and a child needs them in that order.",
])}
  </div>
'''

WORD_STUDY2 = f'''
  <div class="card card-teal reveal">
    <div class="card-label lbl-teal">Second Word Study &mdash; Proverbs 2:1&ndash;6</div>
    <div class="chips">
      <span class="chip">Tsaphan (&#1510;&#1464;&#1508;&#1463;&#1503;)</span>
      <span class="chip">Qashab (&#1511;&#1464;&#1513;&#1473;&#1463;&#1489;)</span>
      <span class="chip">Yir'ah (&#1497;&#1460;&#1512;&#1456;&#1488;&#1464;&#1492;)</span>
    </div>
{paras('bt', [
 "<strong>Tsaphan</strong> — “store up” (v. 1). The same root family as the treasure image four verses later, and that is the joke at the centre of the chapter. God hides wisdom; the son is told to store the commands <em>within him</em>. To lay away against a hard season, the way you bury grain before a famine. Tonight’s story says it in a child’s words: keep my good words close.",
 "<strong>Qashab</strong> — “turning your ear” (v. 2). To prick up the ears, to attend sharply. It is what an animal does at a sound in the grass, not what a student does in a chair. The verb implies leaning in physically. When the story tells a child to listen to God and to the wise grown-ups who love them, this is the listening it means: the alert kind, the kind Scout did when Grandpa started talking about wet sand.",
 "<strong>Yir&rsquo;ah</strong> — “fear” (v. 5), as in the fear of the Lord. Not fright. The word covers reverence, awe, the settled seriousness of standing before someone far greater than you — much closer to how a child feels at the edge of the ocean than to how a child feels in the dark. Verse 5 makes this, and not cleverness, the thing at the bottom of the treasure hole: the digging ends in knowing God, and everything else in the chapter follows from that.",
])}
  </div>
'''

CROSS_REFS = f'''
  <div class="card card-teal reveal">
    <div class="card-label lbl-teal">Cross-References</div>
    <div class="bt">{ent("Eight passages that carry tonight’s idea. They are given as references, described in our own words, because no Bible text could be re-checked at its source tonight — open your own Bible alongside them.")}</div>
{ref('Proverbs 2:6', "The verse that keeps the treasure hunt from becoming a self-help programme: the Lord is the one who gives wisdom, and from His mouth come knowledge and understanding. Digging is how we receive, not how we earn.")}
{ref('Proverbs 3:13–15', "Solomon calls the one who finds wisdom blessed and rates her profit above silver, gold and rubies. The same exchange-rate argument as chapter 2, made warmer.")}
{ref('Proverbs 4:7', "The compression of the whole book into one instruction: get wisdom, and though it cost all you have, get understanding. Worth memorising as a family this week.")}
{ref('Proverbs 9:9–10', "Instruct a wise person and they grow wiser still — and the fear of the Lord is named as the beginning of wisdom. Both halves matter to a parent: wisdom compounds, and it starts somewhere specific.")}
{ref('Matthew 13:44', "Jesus’ own treasure-in-a-field parable, where a man sells everything he has in his joy over what he has found. The nearest thing in the New Testament to Proverbs 2:4, and it names the emotion Solomon leaves out.")}
{ref('James 1:5', "If any of you lacks wisdom, ask God, who gives generously to all without finding fault. The verse that turns Proverbs 2 into a prayer, and the one a child can carry into adulthood unaided.")}
{ref('Colossians 2:2–3', "Paul says that in Christ are hidden all the treasures of wisdom and knowledge. The word <em>hidden</em> is deliberate: Proverbs 2 finally gets an address.")}
{ref('1 Corinthians 1:24, 30', "Christ named as the wisdom of God, and made wisdom for us from God. The end of the treasure hunt is a person, not a principle.")}
  </div>
'''

COMMENTARY = f'''
  <div class="card card-navy reveal">
    <div class="card-label lbl-white">Commentary &mdash; What Has Been Taught</div>
{paras('bt-white', [
 "Readers have argued for centuries about what kind of book Proverbs is, and chapter 2 sits at the centre of the argument. One long tradition reads it as practical instruction — this is how a sensible young man avoids ruin — and finds in it a sober, almost secular common sense that Israel shared with its neighbours. Another reads the personified Wisdom of these early chapters as pointing beyond good sense altogether, toward the Word by whom all things were made; Christian readers from the earliest centuries heard chapter 8 in particular that way.",
 "Most teachers today hold both readings together, and Colossians 2:3 is why. Paul writes that in Christ are hidden all the treasures of wisdom and knowledge, using the same vocabulary of hiddenness and treasure that Solomon uses here. That does not turn Proverbs 2 into an allegory; the chapter still means what it says about listening to your father and choosing your road. It means the digging has a destination the son could not yet have named.",
 "<strong>Where faithful readers differ.</strong> How much of Proverbs comes from Solomon himself is genuinely disputed — the book names several collectors, and chapters 30 and 31 name other authors outright. Readers also differ on whether personified Wisdom is a poetic figure or something more. None of that touches tonight. Every reading agrees on what chapter 2 asks a family to do, and a five-year-old digging for treasure in the living room is not waiting on the outcome of the debate.",
])}
  </div>
'''

DOCTRINAL_THREAD = f'''
  <div class="card card-teal reveal">
    <div class="card-label lbl-teal">A Biblical Thread &mdash; Wisdom Sought, Wisdom Given</div>
{paras('bt', [
 "<strong>Genesis 3.</strong> The first wrong turn in the Bible is a shortcut to wisdom — fruit that promises knowing without listening. Everything Proverbs says about digging is a correction of that one moment, and it is worth naming: the danger is never wanting to be wise. It is wanting it on terms that skip the Giver.",
 "<strong>1 Kings 3.</strong> Solomon, newly king and frightened of the job, asks for a discerning heart rather than long life or riches, and is given what he asked for and the rest besides. The man writing Proverbs 2 had personally received what he is telling his son to go after, which is why the chapter reads like testimony rather than theory.",
 "<strong>Proverbs 2.</strong> Tonight. The conditions in verses 1 to 4, the promise in verse 5, and the reason in verse 6. Wisdom is dug for and also given, and the chapter refuses to choose between those.",
 "<strong>Job 28.</strong> An entire chapter on mining — shafts, darkness, ore torn out of rock — asking where wisdom can be found, and answering that no mine holds it. The passage that keeps Proverbs 2 humble: the digging is real, but the treasure was never buried where human effort alone could reach it.",
 "<strong>Matthew 13:44&ndash;46.</strong> Jesus tells it back as a story with joy in it — a man who finds treasure in a field and sells everything he has, not grimly but gladly. Solomon supplies the effort; Jesus supplies the gladness.",
 "<strong>1 Corinthians 1:24, 30.</strong> Christ called the wisdom of God, and made wisdom for us from God. The thread stops being a search for a quality and becomes a relationship with a person.",
 "<strong>Colossians 2:2&ndash;3; James 1:5.</strong> All the treasures of wisdom and knowledge hidden in Christ — and an open invitation to ask God for wisdom, given generously and without fault-finding. The thread ends where a parent hoped it would: the treasure has an address, and the asking is welcome.",
])}
  </div>
'''

THREE_QUESTIONS = f'''
  <div class="card card-navy reveal">
    <div class="card-label lbl-white">Three Questions to Sit With This Week</div>
    <div class="prompt-q">1. Solomon stacks eight things his son must do before a single promise arrives. Which of the eight &mdash; accepting, storing up, turning the ear, applying the heart, calling out, crying aloud, looking, searching &mdash; is the one I have quietly stopped doing?</div>
    <div class="prompt-q" style="margin-top:10px;">2. Verse 5 says the treasure at the bottom is the knowledge of God, not competence. When did I last go after understanding because I wanted to know God better, rather than because I wanted a decision made?</div>
    <div class="prompt-q" style="margin-top:10px;">3. Scout&rsquo;s treasure came through Grandpa. Whose wisdom in my family has never been written down &mdash; and what would it cost me to go and ask for it before it is gone?</div>
  </div>
'''

CONNECT_DOTS = f'''
  <div class="card card-navy reveal">
    <div class="card-label lbl-white">&#10022; Connecting the Dots</div>
    <div class="card-title ct-white">Where this truth begins, how it grows, and how it reaches your kitchen table</div>
{paras('bt-white', [
 "The idea in tonight’s chapter starts with a failure. In the garden, wisdom is offered as a shortcut — eat this and you will know — and the whole of the Bible afterwards is, in one sense, the long correction of that offer. Proverbs 2 is that correction stated positively. You may have wisdom. You may have all of it. But you will go and dig for it, and the digging will be listening, and the listening will be to God.",
 "Solomon is the right man to say it because he was given it. A young king, out of his depth, asks for a discerning heart instead of the things kings usually ask for. The book he leaves behind is not a clever man showing his work; it is a man who received something telling his son how to go and get it. That is why the chapter sounds urgent rather than smug.",
 "Job 28 keeps the whole thing from tipping into self-improvement. It is a chapter about mining — real shafts, real darkness — that asks where wisdom is found and concludes that no amount of digging reaches it, because it is not in the ground. Hold Job 28 and Proverbs 2 together and you have the truth of it: dig like everything depends on it, and know that what you find was placed there.",
 "Then the New Testament gives the treasure an address. Jesus tells the parable back with joy in it, a man selling everything for a field. Paul writes that in Christ are hidden all the treasures of wisdom and knowledge, and calls Christ the wisdom of God. James makes the asking explicit and easy — ask God, who gives generously without finding fault. Solomon told his son to dig; the gospel tells him where.",
 "So it arrives at your kitchen table in a form small enough to use tonight. Wisdom is hidden on purpose, by Someone, where a child can find it. It is found by listening — to God, and to the grown-ups who love them. And it comes one good lesson at a time, which means tonight counts, and so does tomorrow, and no single evening has to carry the whole weight.",
])}
  </div>
'''

TEN_PASSAGES = f'''
  <div class="card card-quote reveal">
    <div class="card-label lbl-amber">&#10022; Ten Places Scripture Says It</div>
    <div class="card-title ct-gold">The treasure of wisdom, traced from Genesis to the letters</div>
    <div class="bt" style="margin-bottom:4px;">{ent("This card normally carries ten quotations from teachers of the faith. Tonight it carries ten references instead, described rather than quoted, because no source could be verified — see the note earlier in this reading. Open them yourself; the descriptions are ours, the words are not.")}</div>
{ref('Proverbs 2:1–6', "The chapter itself: eight conditions, one promise, and then the reason — the Lord gives wisdom.")}
{ref('Proverbs 3:13–18', "Wisdom rated above silver, gold and rubies, and called a tree of life to those who take hold of her.")}
{ref('Proverbs 4:5–9', "Get wisdom, get understanding, and do not forget it; she will honour you if you embrace her.")}
{ref('Proverbs 8:10–11', "Wisdom speaking for herself, asking to be chosen in preference to silver and choice gold.")}
{ref('Proverbs 9:10', "The fear of the Lord as the beginning of wisdom — where the digging starts, not where it ends.")}
{ref('Proverbs 16:16', "The trade stated as arithmetic: how much better to get wisdom than gold.")}
{ref('Job 28:12–28', "An entire chapter of mining imagery concluding that wisdom is not in the ground — and that the fear of the Lord is where it is.")}
{ref('Matthew 13:44–46', "Treasure hidden in a field, and a pearl of great price; a man who sells all he has, for joy.")}
{ref('James 1:5–6', "Ask God, who gives generously without finding fault — the verse that turns the whole chapter into a prayer.")}
{ref('Colossians 2:2–3', "All the treasures of wisdom and knowledge, hidden in Christ. The treasure hunt is given a destination.")}
    <div class="bt" style="margin-top:12px;">{ent("Read them in order and watch what does not move. Proverbs argues the exchange rate; Job insists the treasure was never ours to mine; Jesus supplies the joy; James supplies the asking; and Paul supplies the address. Different centuries, one instruction: go and look, and ask while you are looking.")}</div>
  </div>
'''

PASSAGES_TO_SIT_WITH = f'''
  <div class="card card-conf reveal">
    <div class="card-label lbl-gold">&#10022; Three Passages to Sit With</div>
    <div class="card-title ct-gold">Longer readings matched to tonight's text</div>
    <div class="conf-talk">
      <div class="conf-date" style="color:var(--gold);">Reading one &middot; twenty minutes</div>
      <div class="conf-speaker">Proverbs 1&ndash;4, read straight through</div>
      <div class="conf-body">{ent("Tonight’s chapter is a middle movement, and it changes when you hear the movements on either side of it. Chapter 1 is Wisdom calling aloud in the street and being ignored. Chapter 2 is the same appeal made privately to one child. Chapter 3 is the trust passage most families already know by heart. Chapter 4 is a grandfather’s memory of being taught the same way, which is the moment the book quietly reveals that this instruction has already been handed down once. Four chapters is about twenty minutes and it will reframe the single verse you read to your child tonight.")}</div>
    </div>
    <div class="conf-talk" style="margin-top:14px;">
      <div class="conf-date" style="color:var(--amber);">Reading two &middot; ten minutes</div>
      <div class="conf-speaker">Job 28, the mining chapter</div>
      <div class="conf-body">{ent("The best commentary on Proverbs 2 is in another book entirely. Job 28 describes men cutting shafts into rock, hanging in the dark far from any road, turning mountains over for silver and sapphire — and then asks, with the whole picture in view, where wisdom is to be found. The answer keeps every parent honest. Read it after Proverbs 2 and the treasure image acquires the humility it needs.")}</div>
    </div>
    <div class="conf-talk" style="margin-top:14px;">
      <div class="conf-date" style="color:var(--gold);">Reading three &middot; five minutes</div>
      <div class="conf-speaker">Matthew 13:44&ndash;46 with Colossians 2:1&ndash;3 and James 1:1&ndash;8</div>
      <div class="conf-body">{ent("Three short passages that finish Solomon’s sentence. Jesus puts joy into the digging; Paul says where the treasure is kept; James says you may simply ask for it. Five minutes, read in that order, and tonight’s chapter stops being good advice for a young man and becomes an invitation addressed to the person holding the book.")}</div>
    </div>
  </div>
'''

STUDY_TACTICS = f'''
  <div class="card card-gold reveal">
    <div class="card-label lbl-navy">&#10022; Study Tactics &mdash; Going to Another Level</div>
    <div class="card-title ct-navy">Four study methods, sized for tonight</div>
    <div class="bt"><strong>1 &middot; SOAP &mdash; twenty minutes, one page.</strong> {ent("Scripture, Observation, Application, Prayer. Copy Proverbs 2:1–5 out by hand; note that verses 1 to 4 are all conditions and verse 5 is the only promise; write one thing you will actually do about it this week; then pray verse 6 back to God. Handwriting slows you to the speed of the sentence, which is the point.")}</div>
    <div class="bt" style="margin-top:10px;"><strong>2 &middot; Verse mapping &mdash; fifteen minutes.</strong> {ent("Take verse 4 alone. Circle every verb. Look up <em>search</em> and <em>hidden treasure</em> in a concordance or study Bible and write what you find in the margin. Then map where else the same words appear — Job 28 and Matthew 13 will both turn up, and the chapter will have grown a set of roots.")}</div>
    <div class="bt" style="margin-top:10px;"><strong>3 &middot; A memorisation plan &mdash; ten minutes a day, seven days.</strong> {ent("Proverbs 2:6 is one sentence and the engine of the whole chapter. Say it at breakfast for a week, one more clause each morning, everybody in the house together. Children memorise faster than adults and enjoy proving it, which is a resource most families under-use.")}</div>
    <div class="bt" style="margin-top:10px;"><strong>4 &middot; Two translations, side by side &mdash; ten minutes.</strong> {ent("Read Proverbs 2:1–5 in the NIV and then in the King James, and mark where the wording parts company — <em>look for</em> beside <em>seekest</em>, <em>store up</em> beside <em>hide</em>. The differences are small and they are exactly where the meaning lives, and comparing them is the cheapest study skill there is.")}</div>
  </div>
'''

ONE_INVITATION = f'''
  <div class="card card-gold reveal">
    <div class="card-label lbl-navy">&#10022; One Invitation This Week</div>
{paras('bt', [
 "<strong>Send every person in the house to ask one wise person one real question.</strong> Not a search engine — a person, with a name, who knows something you do not. A grandparent, a neighbour, a teacher, the one uncle who can fix anything. Children pick their own person and their own question; so do the adults, and the adults report back first, out loud, at dinner. Tonight’s chapter hands wisdom down through voices, and a household that practises asking is a household that has understood it.",
 "Then, on the seventh day, ask each person the FIND question from tonight’s Feeling Moment: <em>when did you feel curious and excited to learn something new this week?</em> Write the answers on one page and keep it. Wisdom arrives, as the story says, one good lesson at a time — and a page of small found things is what a treasure hunt actually looks like from the inside.",
])}
  </div>
'''

# ───────────────────────── COMPOSE ─────────────────────────
RES = resources_card(); STORYC = story_card(); TRAV = traveler_card()
BASE = [RES, PARENT_HEART, STORYC, TRAV, HEART_OF_TONIGHT, VERSE_CARD]   # Resources first, then A Parent's Heart (10 Sep)
QUICK = BASE + [APPLY_QUICK]
DEEP = BASE + [WHY_MATTERS, HISTORICAL, SOURCES_TONIGHT, WORD_STUDY, SOLOMON_AGAIN, TREASURE_HELD,
               CONVO, GO_DEEPER, APPLY_DEEP, STORY_CONNECTION]
HEAVENLY = BASE + [WHY_MATTERS, HISTORICAL, SOURCES_TONIGHT, WORD_STUDY, SOLOMON_AGAIN,
                   FULL_PASSAGE, WORD_STUDY2, CROSS_REFS, COMMENTARY, DOCTRINAL_THREAD,
                   TREASURE_HELD, CONVO, GO_DEEPER, APPLY_DEEP, STORY_CONNECTION, THREE_QUESTIONS,
                   CONNECT_DOTS, TEN_PASSAGES, PASSAGES_TO_SIT_WITH, STUDY_TACTICS, ONE_INVITATION]

if __name__ == '__main__':
    print('tiers', len(QUICK), len(DEEP), len(HEAVENLY))
    build({'quick': QUICK, 'deep': DEEP, 'heavenly': HEAVENLY},
          VERSE_REF, f'{OUT_DIR}/morning-lantern-christian.html', TITLE)
    print('built morning-lantern-christian.html')
