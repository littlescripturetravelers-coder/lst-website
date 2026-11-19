#!/usr/bin/env python3
"""
Search & AI-answer builder for littlescripturetravelers.com  (SEO / AEO / GEO / CTR / CRO)

Run from the repo root:   python3 tools/seo_build.py
It is SAFE TO RUN AGAIN AND AGAIN — every change it makes sits between
<!-- SEO:... --> markers and is replaced, never stacked.

What it does
  1. Writes the four topic pages people search for:
       come-follow-me-for-kids.html   bible-stories-for-kids.html
       lds-parenting.html             christian-parenting.html
     Each one lists every published night (from lantern/*/night.json, only
     nights dated today or earlier), so the pages grow by one story a night.
  2. Puts search tags in the <head> of every public page: canonical, Open Graph,
     Twitter card, the iPhone "Open in App Store" banner, and structured data
     (JSON-LD) that Google and AI assistants read.
  3. Rewrites titles/descriptions on the key pages so the search result earns the click.
  4. Adds a visible "Questions parents ask" block to the three home-page files.
  5. Adds a "For Families" link column to every page footer (internal links).
  6. Writes sitemap.xml, robots.txt and llms.txt.

Rules it keeps (see HANDOFF.md):
  * index.html, index-default.html, index-july.html get identical changes (they are swapped).
  * Never a folder called `public`.
  * Paid nightly content (lantern/*) is NOT put in the sitemap — only titles and
    scripture references appear on the topic pages; the stories stay behind the trial.
"""
import datetime as dt, glob, html, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
SITE = "https://www.littlescripturetravelers.com"
APP_ID = "6793999173"
APP_URL = f"https://apps.apple.com/us/app/little-scripture-travelers/id{APP_ID}"
OG_IMG = f"{SITE}/images/travelers-group.jpg"
TODAY = dt.date.fromisoformat(os.environ["SEO_TODAY"]) if os.environ.get("SEO_TODAY") else dt.datetime.now(dt.timezone(dt.timedelta(hours=-7))).date()
SAME_AS = [
    "https://www.youtube.com/@LittleScriptureTravelers",
    "https://www.instagram.com/scripturetravelers",
    "https://www.facebook.com/profile.php?id=61589835130657",
    "https://www.tiktok.com/@little.scripture",
    APP_URL,
]
E = html.escape

# ---------------------------------------------------------------- facts (keep true!)
FAQ_HOME = [
    ("What is Little Scripture Travelers?",
     "A nightly scripture bedtime story for young children, with a lullaby and a short parent study called the Morning Lantern. A new night is waiting every morning by 5 AM Mountain Time, on the website and in the iPhone app."),
    ("Is it for Latter-day Saint (LDS) families or other Christian families?",
     "Both. There are two editions: one for members of The Church of Jesus Christ of Latter-day Saints that follows the Come, Follow Me reading schedule, and one for Christian families of any church."),
    ("What ages is it for?",
     "The stories are written for children ages one to five, in the smallest words that still carry the meaning."),
    ("How long does a bedtime story take?",
     "About ten quiet minutes. There is nothing to prepare and nothing to look up."),
    ("How much does it cost?",
     "The first 7 days are free. After that it is $6.99 a month or $49 a year, and you can cancel anytime."),
    ("Can I read a story before I sign up?",
     "Yes. A whole night is free to read with nothing to join, on the free sample page."),
]

HUBS = {
 "come-follow-me-for-kids.html": dict(
   title="Come, Follow Me for Kids — Nightly Bedtime Scripture Stories",
   desc="Come, Follow Me for kids made simple: a short scripture bedtime story every night, matched to this year's reading, with a lullaby and three questions for parents. Free for 7 days.",
   eyebrow="COME, FOLLOW ME FOR KIDS",
   h1="Come, Follow Me for Kids, one bedtime story at a time",
   lede="This year's Come, Follow Me reading, told as a short bedtime story your little one can follow. A new night is waiting every morning by 5 AM, so the family's study becomes the last thing your child hears before sleep.",
   body=[
    ("What Come, Follow Me for kids looks like at our house",
     "<p>Come, Follow Me is the home-centered scripture study of The Church of Jesus Christ of Latter-day Saints. For little children, a whole chapter is a lot. So every night we take one moment from the week's reading and tell it as a story in about ten minutes, with one of our four Travelers (Beau, Scout, Willow and Wren) living the same lesson in their own small world.</p>"
     "<p>Each night comes with three parts: the <strong>story</strong> to read aloud, a <strong>lullaby</strong> written for that story, and the <strong>Morning Lantern</strong> for you, the parent, with three questions to ponder through the day so you reach bedtime with your own story or testimony ready to share.</p>"),
    ("Why bedtime works for Come, Follow Me",
     "<p>Little children remember what they hear in the quiet. Ending the day on a scripture story gives the week's reading a home in their heart, and it takes the pressure off a long family study when everyone is tired. Ten minutes, every night, adds up to the whole year.</p>"),
   ],
   faq=[
    ("Does this follow the Come, Follow Me schedule?",
     "Yes. The Latter-day Saint edition follows the Come, Follow Me reading for the year, one story a night."),
    ("What ages is it for?", FAQ_HOME[2][1]),
    ("Is it an official Church product?",
     "No. Little Scripture Travelers is made by a Latter-day Saint dad and family, not by the Church. Scripture links open in the Gospel Library."),
    ("How much does it cost?", FAQ_HOME[4][1]),
   ],
   list_title="Every Come, Follow Me bedtime story so far",
   kw="Come, Follow Me for kids"),
 "bible-stories-for-kids.html": dict(
   title="Bible Stories for Kids — A New Bedtime Bible Story Every Night",
   desc="Short Bible stories for kids ages 1–5, told gently for bedtime: Psalms, Isaiah, Esther, Daniel, Ruth and more. A new story, lullaby and parent guide every night. Try 7 days free.",
   eyebrow="BIBLE STORIES FOR KIDS",
   h1="Bible stories for kids, told softly enough for bedtime",
   lede="One short Bible story every night, in the smallest words that still carry the meaning. Written for children ages one to five, with a lullaby to sing and a few questions to talk about.",
   body=[
    ("Bible stories for little children, not a lecture",
     "<p>Children learn far more from a story than from being told what to do. So every night tells one Bible moment, like Esther finding her courage, Daniel praying anyway, or Ruth choosing to stay, and then shows one of our four Travelers living the same lesson the next day at home or at school.</p>"
     "<p>Every story points back to Jesus Christ and to a Heavenly Father who loves His children. Each night ends with something small to do together, so the story turns into a conversation.</p>"),
    ("For Christian families of every church",
     "<p>There is a Christian edition for families of any denomination, and a Latter-day Saint edition that follows Come, Follow Me. Same stories, same Travelers, with scripture references and study notes that fit your family.</p>"),
   ],
   faq=[
    ("What ages are these Bible stories for?", FAQ_HOME[2][1]),
    ("How long is each Bible story?", FAQ_HOME[3][1]),
    ("Is there a version for non-LDS Christian families?",
     "Yes. The Christian edition is written for Christian families of any church."),
    ("How much does it cost?", FAQ_HOME[4][1]),
   ],
   list_title="Every Bible bedtime story so far",
   kw="Bible stories for kids"),
 "lds-parenting.html": dict(
   title="LDS Parenting — Teaching Kids the Gospel at Bedtime",
   desc="Gentle LDS parenting help for Latter-day Saint families: a nightly Come, Follow Me bedtime story, family testimony questions, and articles on teaching little ones to feel the Spirit.",
   eyebrow="LATTER-DAY SAINT PARENTING",
   h1="LDS parenting help for the hardest, holiest ten minutes of the day",
   lede="Teaching little children the gospel does not need a lesson plan. It needs a story, a quiet moment, and a parent willing to share what they know is true.",
   body=[
    ("Roots before the storm",
     "<p>Children grow resilient hearing their own parents' stories: how Heavenly Father answered a prayer, how a grandparent kept going, how you came to know the Savior. That is why each night's Morning Lantern gives you three questions in <em>A Parent's Heart</em> to ponder during the day, so at bedtime you have a true story of your own to add to the scripture story.</p>"),
    ("Helping kids recognize the Spirit",
     "<p>Little ones can learn to notice the quiet, warm feeling of the Holy Ghost. A calm bedtime story, a lullaby and a short testimony from Mom or Dad give them a place to feel it, again and again, until they know it.</p>"),
   ],
   faq=[
    ("How can I teach my young kids Come, Follow Me without a long lesson?",
     "Keep it to one story and one question at bedtime. Our Latter-day Saint edition gives you a ten-minute story from the week's Come, Follow Me reading every night."),
    ("How do I help my child recognize the Holy Ghost?",
     "Our article \"Teaching Your Child to Recognize the Spirit\" (listed above) walks through simple ways to help little ones notice the Holy Ghost."),
    ("What ages is Little Scripture Travelers for?", FAQ_HOME[2][1]),
   ],
   list_title="Recent Come, Follow Me bedtime stories",
   kw="LDS parenting", blog=True),
 "christian-parenting.html": dict(
   title="Christian Parenting — Raising Kids Who Love God's Word",
   desc="Christian parenting help for busy families: a ten-minute Bible bedtime story every night, a short parent devotional, and articles on raising children with deep roots of faith.",
   eyebrow="CHRISTIAN PARENTING",
   h1="Christian parenting that starts with a story at bedtime",
   lede="You do not have to be a Bible scholar to raise a child who loves God's Word. You need a few quiet minutes, a good story, and your own heart in the room.",
   body=[
    ("The quiet power of bedtime",
     "<p>The last words a child hears before sleep stay with them. A short Bible story, a gentle song and a prayer together turn the end of a busy day into the most meaningful part of it.</p>"),
    ("Your story matters as much as ours",
     "<p>Each morning the Morning Lantern gives parents a short devotional on that night's scripture, with three questions to carry through the day. By bedtime you have a true story of your own, about a prayer answered or a hard day God carried you through, to share after the scripture story. That is how faith is passed down.</p>"),
   ],
   faq=[
    ("How do I start a Bible bedtime routine with a toddler?",
     "Keep it short and the same every night: one story, one song, one prayer. Ten minutes is enough. Our article on starting a scripture bedtime routine has a simple plan for busy nights."),
    ("Is Little Scripture Travelers for all Christian denominations?",
     "Yes. The Christian edition is written for Christian families of any church."),
    ("How much does it cost?", FAQ_HOME[4][1]),
   ],
   list_title="Recent Bible bedtime stories",
   kw="Christian parenting", blog=True),
 "homeschool-bible-stories.html": dict(
   title="Homeschool Bible & Scripture Stories for Kids — Daily & Gentle",
   desc="A gentle daily Bible and scripture time for homeschool families with little ones: a short story, a lullaby, printables and study pages, plus a parent devotional. LDS and Christian editions.",
   eyebrow="FOR HOMESCHOOL FAMILIES",
   h1="A daily scripture story your homeschool can build on",
   lede="Homeschool families already know the best lessons start with a story. Little Scripture Travelers gives you one every day, ready by 5 AM, for morning time, quiet time or bedtime.",
   body=[
    ("Scripture time without the prep",
     "<p>Each day's night has a short scripture story for children ages one to five, a lullaby written for it, and a Morning Lantern study for the parent. Use the story at morning basket or circle time, sing the lullaby at nap, and read it again at bedtime. Little ones love hearing the same story twice.</p>"
     "<p>Inside the subscription are Printables (the story's real book pages), Study &amp; Tests pages, the Virtue Library (every story searchable by what it teaches, like courage, kindness or honesty) and the Sacred World Timeline that places each story in history.</p>"),
    ("Character first",
     "<p>Every story is tagged with the virtues it teaches, and our four Travelers (Beau, Scout, Willow and Wren) show what that virtue looks like in a child's ordinary day. It is an easy, faith-centered way to teach character alongside reading and history.</p>"),
   ],
   faq=[
    ("Is this a full homeschool curriculum?",
     "No. It is a daily scripture story and Bible time that fits alongside any curriculum, with printables, study pages and a timeline to go deeper."),
    ("What ages is it for?", FAQ_HOME[2][1]),
    ("Is there an LDS version and a Christian version?", FAQ_HOME[1][1]),
    ("How much does it cost?", FAQ_HOME[4][1]),
   ],
   list_title="Every daily scripture story so far",
   kw="Homeschool Bible stories"),
 "scripture-study-for-parents.html": dict(
   title="Daily Scripture Study & Devotional for Parents — The Morning Lantern",
   desc="A daily scripture study and devotional for busy moms and dads: Quick, Medium or Deep, ready by 5 AM, with three questions to ponder. Come, Follow Me (LDS) and Christian editions.",
   eyebrow="FOR MOMS & DADS",
   h1="A daily scripture study for grown-ups, in five minutes or fifty",
   lede="The Morning Lantern is a daily devotional and scripture study for parents. It is waiting by 5 AM on the same scripture your child hears at bedtime, so your study and theirs meet at the end of the day.",
   body=[
    ("Quick, Medium or Deep",
     "<p>Pick how much time you have. <strong>Quick</strong> gives you the scripture and the gospel principle behind it in a few minutes. <strong>Medium</strong> adds background that brings the passage to life. <strong>Deep</strong> is a full study with cross-references, word studies, quotes and talks to sit with. Every edition can be read aloud to you in its own recording.</p>"),
    ("A Parent's Heart",
     "<p>Every morning ends with three questions written for you, never a quiz for your child. They sit with you through the day, so by bedtime you have something true of your own to share: a prayer that was answered, an ancestor's courage, your testimony. That is the part your children will remember.</p>"),
    ("Two editions",
     "<p>The Latter-day Saint edition follows Come, Follow Me and draws on the scriptures and words of latter-day prophets. The Christian edition is written for Christian families of any church.</p>"),
   ],
   faq=[
    ("What is the Morning Lantern?",
     "A daily scripture study and devotional for parents, on the same scripture as that night's children's bedtime story, ready by 5 AM Mountain Time."),
    ("How long does it take?",
     "As long as you have: Quick takes a few minutes, Medium a little more, and Deep is a full study."),
    ("Does the LDS edition follow Come, Follow Me?", "Yes."),
    ("How much does it cost?", FAQ_HOME[4][1]),
   ],
   list_title="Recent Morning Lantern studies",
   kw="Scripture study for parents", blog=True),
 "kids-technology-by-age.html": dict(
   title="Kids & Screen Time by Age: A Faith-Filled Parent Guide",
   desc="How to use technology with your kids at every age, from babies to teens: what pediatricians recommend now (the AAP's 5 Cs and WHO limits), plus simple ways to keep faith and family at the center.",
   eyebrow="TECHNOLOGY & YOUR CHILD",
   h1="Kids and technology, age by age",
   lede="Phones, tablets, TV and AI tools are part of family life now. Here is what pediatricians actually recommend at each age, in plain words, and a few simple ways to keep screens serving your family instead of the other way around.",
   no_list=True,
   body=[
    ("The big change: quality and context, not just minutes",
     "<p>The American Academy of Pediatrics (AAP) now guides families with the <strong>5 Cs of Media Use</strong> instead of one hour-count for every child:</p>"
     "<ul><li><strong>Child</strong>: every child is different, and needs shift as they grow.</li>"
     "<li><strong>Content</strong>: what they watch or play matters more than the device.</li>"
     "<li><strong>Calm</strong>: help children learn to calm down without a screen.</li>"
     "<li><strong>Crowding out</strong>: what is the screen replacing, like sleep, play, reading or family time?</li>"
     "<li><strong>Communication</strong>: talk about media early and often.</li></ul>"
     "<p>The AAP also suggests a <strong>Family Media Plan</strong> that covers the whole family, parents too.</p>"),
    ("Babies (0 to 18 months)",
     "<p>The AAP recommends avoiding screen media other than video chatting with family. The World Health Organization (WHO) recommends no screen time at all before age one. Babies learn from faces, voices, touch and play. Singing, talking and reading to your baby are the real \"apps\" at this age.</p>"),
    ("Toddlers and preschoolers (18 months to 5)",
     "<p>WHO recommends no more than one hour a day of sitting screen time for ages two to four, and says less is better. When screens are used, choose slow, high-quality content and watch <em>with</em> your child, talking about what you see. Keep screens out of mealtimes and the hour before bed, and lean on stories, songs and cuddles to wind down.</p>"),
    ("School-age children (5 to 10)",
     "<p>Kids this age are ready to help make family rules and usually follow them well, so build the Family Media Plan together. Keep limits that leave room for schoolwork, outdoor play, chores and sleep, and know what they are watching and playing. The AAP's guidance for this age says children are not ready for social media accounts yet.</p>"),
    ("Young teens (10 to 14)",
     "<p>This is the time for regular, open conversations about their online lives: who they talk to, what they see, and how it makes them feel. Let them help choose and carry out the rules, so they own them. Be ready before saying yes to a first phone, and set up parental controls together.</p>"),
    ("Older teens (15 to 17)",
     "<p>Teens watch whether parents live by the same rules, so avoid \"do as I say, not as I do.\" Invite their input on the family plan, protect sleep by planning when devices go off, and watch for media use that becomes compulsive or crowds out real life.</p>"),
    ("Keeping faith and family at the center",
     "<ul><li><strong>Guard the last ten minutes of the day.</strong> End with a story, a song and a prayer together, not a solo screen.</li>"
     "<li><strong>Use technology together.</strong> If a screen is part of family scripture time, let it be one you share and talk about, not one a child uses alone.</li>"
     "<li><strong>Model it.</strong> Children notice where our phones are during dinner, prayers and bedtime.</li>"
     "<li><strong>Share your own stories.</strong> No app replaces a parent telling a child how God helped them. That is why our Morning Lantern gives parents three questions each day to ponder.</li></ul>"),
    ("Sources",
     "<ul><li><a href=\"https://www.healthychildren.org/English/family-life/Media/Pages/kids-and-screen-time-how-to-use-the-5-cs-of-media-guidance.aspx\" rel=\"noopener\">AAP (HealthyChildren.org): How to Use the 5 C's of Media Guidance</a></li>"
     "<li><a href=\"https://www.aap.org/5Cs\" rel=\"noopener\">AAP: The 5 Cs of Media Use, guides by age</a></li>"
     "<li><a href=\"https://www.healthychildren.org/English/fmp/Pages/MediaPlan.aspx\" rel=\"noopener\">AAP: Make a Family Media Plan</a></li>"
     "<li><a href=\"https://www.who.int/news/item/24-04-2019-to-grow-up-healthy-children-need-to-sit-less-and-play-more\" rel=\"noopener\">WHO: To grow up healthy, children need to sit less and play more (2019)</a></li></ul>"
     "<p style=\"font-size:.9rem;color:var(--ink-55)\">This page shares published guidance in plain words and is not medical advice. Talk with your child's doctor about your own family.</p>"),
   ],
   faq=[
    ("How much screen time is OK for a toddler?",
     "The World Health Organization recommends no more than one hour a day of sitting screen time for children two to four, and less is better. The American Academy of Pediatrics now focuses on quality, watching together, and what screens crowd out, using its 5 Cs of Media Use."),
    ("Should babies have any screen time?",
     "The AAP recommends avoiding screen media other than video chatting before 18 months, and the WHO recommends no screen time before age one."),
    ("At what age can kids have social media?",
     "The AAP's guidance for school-age children (5 to 10) says they are not ready for social media accounts. For young teens it recommends open, regular conversations and family rules they help make."),
    ("What are the AAP's 5 Cs of media use?",
     "Child, Content, Calm, Crowding out and Communication: a simple way to decide how technology fits your family at each age."),
   ],
   list_title="", kw="Kids and technology by age"),
}

# Title / description rewrites for existing pages (CTR). None = keep what is there.
META = {
 "index.html": ("Scripture Bedtime Stories for Kids | Little Scripture Travelers",
   "A new scripture bedtime story, lullaby and parent study every night. Come, Follow Me (LDS) and Christian editions, for kids ages 1–5. Try 7 days free."),
 "subscribe.html": ("Plans & Free Trial — $6.99/mo or $49/yr | Little Scripture Travelers",
   "Start with 7 days free. Then $6.99 a month or $49 a year for a new scripture bedtime story, lullaby and Morning Lantern every night. Cancel anytime."),
 "bible-bedtime-stories.html": ("Bedtime Bible Stories for Little Children (Ages 1–5)",
   None),
 "bedtime-stories.html": ("Every Scripture Bedtime Story, Book by Book | Little Scripture Travelers", None),
 "books.html": ("Illustrated Scripture Story Books for Kids | Little Scripture Travelers",
   "Illustrated scripture story books for little children: Old and New Testament, Book of Mormon and Church History volumes, in Kindle and paperback on Amazon."),
 "travelers.html": ("Meet Beau, Scout, Willow & Wren | Little Scripture Travelers",
   "Meet the four Little Scripture Travelers (Beau the Brave, Scout the Seeker, Willow the Warm and Wren the Wonderer) who guide every bedtime scripture story."),
 "travelers-lullaby.html": (None,
   "A Little Travelers' Lullaby: a gentle bedtime song from Little Scripture Travelers to sing with your child at the end of the day."),
 "our-story.html": ("Our Story — How a Utah Dad Started Little Scripture Travelers", None),
 "watch.html": ("Watch Scripture Stories for Kids | Little Scripture Travelers", None),
 "blog.html": ("LDS & Christian Parenting Blog | Little Scripture Travelers", None),
 "sample.html": (None, None),
}
META["index-default.html"] = META["index.html"]
META["index-july.html"] = META["index.html"]

SKIP = {"googlea5f8bfd252ef63cf.html", "link-check.html", "read.html", "reset-password.html"}
NO_SITEMAP = {"index-default.html", "index-july.html", "delete-account.html", "cancel.html", "privacy.html"}
TRAVELER = {"beau": "Beau", "scout": "Scout", "willow": "Willow", "wren": "Wren"}


def nights():
    out = []
    for f in glob.glob("lantern/*/night.json"):
        try:
            n = json.load(open(f, encoding="utf-8"))
            d = dt.date.fromisoformat(n.get("publish_date", "")[:10])
        except Exception:
            continue
        if d <= TODAY and n.get("title"):
            n["_date"] = d
            out.append(n)
    return sorted(out, key=lambda n: n["_date"], reverse=True)


def blog_posts():
    posts = []
    for f in sorted(glob.glob("blog-*.html")):
        s = open(f, encoding="utf-8").read()
        t = re.search(r"<title>(.*?)</title>", s, re.S)
        d = re.search(r'<meta name="description" content="(.*?)"', s, re.S)
        title = html.unescape(t.group(1)).split(" — Little Scripture")[0].split(" &mdash;")[0].strip() if t else f
        posts.append((f, title, html.unescape(d.group(1)) if d else ""))
    return posts


def jsonld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False).replace("</", "<\\/") + "</script>"


ORG = {"@type": "Organization", "@id": SITE + "/#org", "name": "Little Scripture Travelers",
       "legalName": "Little Scripture Travelers Bedtime Stories, LLC", "url": SITE + "/",
       "logo": SITE + "/images/logo-badge.jpg", "email": "littlescripturetravelers@gmail.com",
       "founder": {"@type": "Person", "name": "Levi Lewis"}, "sameAs": SAME_AS}


def faq_ld(faq):
    return {"@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq]}


def home_ld():
    return jsonld({"@context": "https://schema.org", "@graph": [
        ORG,
        {"@type": "WebSite", "@id": SITE + "/#site", "url": SITE + "/", "name": "Little Scripture Travelers",
         "publisher": {"@id": SITE + "/#org"}},
        {"@type": "MobileApplication", "name": "Little Scripture Travelers", "operatingSystem": "iOS",
         "applicationCategory": "EducationalApplication", "url": APP_URL, "installUrl": APP_URL,
         "description": "Bedtime scripture stories for families: a new story, lullaby and parent study every night.",
         "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
         "publisher": {"@id": SITE + "/#org"}},
        {"@type": "Product", "name": "Little Scripture Travelers subscription",
         "description": "A new scripture bedtime story, lullaby and Morning Lantern parent study every night. First 7 days free.",
         "brand": {"@id": SITE + "/#org"}, "image": OG_IMG,
         "offers": [
           {"@type": "Offer", "name": "Monthly", "price": "6.99", "priceCurrency": "USD", "url": SITE + "/subscribe.html#plans", "availability": "https://schema.org/InStock"},
           {"@type": "Offer", "name": "Yearly", "price": "49.00", "priceCurrency": "USD", "url": SITE + "/subscribe.html#plans", "availability": "https://schema.org/InStock"}]},
        faq_ld(FAQ_HOME),
    ]})


# ---------------------------------------------------------------- head block
def strip_tags_in_head(head):
    pats = [r'\s*<link[^>]+rel=["\']canonical["\'][^>]*>',
            r'\s*<meta[^>]+property=["\']og:[^"\']+["\'][^>]*>',
            r'\s*<meta[^>]+name=["\']twitter:[^"\']+["\'][^>]*>',
            r'\s*<meta[^>]+name=["\']apple-itunes-app["\'][^>]*>',
            r'\s*<!-- SEO:HEAD -->[\s\S]*?<!-- /SEO:HEAD -->']
    for p in pats:
        head = re.sub(p, "", head, flags=re.I)
    return head


def set_title_desc(head, title, desc):
    if title:
        head = re.sub(r"<title>[\s\S]*?</title>", "<title>" + E(title, quote=False) + "</title>", head, count=1)
    if desc:
        tag = '<meta name="description" content="' + E(desc) + '" />'
        if re.search(r'<meta[^>]+name=["\']description["\']', head, re.I):
            head = re.sub(r'<meta[^>]+name=["\']description["\'][^>]*>', lambda m: tag, head, count=1, flags=re.I)
        else:
            head = re.sub(r"(</title>)", r"\1\n  " + tag.replace("\\", "\\\\"), head, count=1)
    return head


def head_block(page, title, desc, extra=""):
    path = "/" if page.startswith("index") else "/" + page
    url = SITE + path
    t = E(html.unescape(title)); d = E(html.unescape(desc or ""))
    lines = [
        f'<link rel="canonical" href="{url}" />',
        f'<meta property="og:type" content="{"article" if page.startswith("blog-") else "website"}" />',
        '<meta property="og:site_name" content="Little Scripture Travelers" />',
        f'<meta property="og:url" content="{url}" />',
        f'<meta property="og:title" content="{t}" />',
        f'<meta property="og:description" content="{d}" />',
        f'<meta property="og:image" content="{OG_IMG}" />',
        '<meta name="twitter:card" content="summary_large_image" />',
        f'<meta name="twitter:title" content="{t}" />',
        f'<meta name="twitter:description" content="{d}" />',
        f'<meta name="twitter:image" content="{OG_IMG}" />',
        # iPhone Safari shows a one-tap "Open / Get" App Store banner at the top of the page (CRO)
        f'<meta name="apple-itunes-app" content="app-id={APP_ID}" />',
    ]
    if extra:
        lines.append(extra)
    return "\n  <!-- SEO:HEAD -->\n  " + "\n  ".join(lines) + "\n  <!-- /SEO:HEAD -->\n"


def page_ld(page, title, desc):
    if page.startswith("index"):
        return home_ld()
    if page.startswith("blog-"):
        return jsonld({"@context": "https://schema.org", "@type": "BlogPosting",
                       "headline": html.unescape(title).split(" — Little Scripture")[0][:110],
                       "description": html.unescape(desc or ""), "image": OG_IMG,
                       "mainEntityOfPage": SITE + "/" + page,
                       "author": {"@type": "Person", "name": "Levi Lewis"},
                       "publisher": ORG})
    if page in HUBS:
        h = HUBS[page]
        crumbs = {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": h["kw"], "item": SITE + "/" + page}]}
        return jsonld({"@context": "https://schema.org", "@graph": [
            {"@type": "CollectionPage", "name": h["title"], "description": h["desc"], "url": SITE + "/" + page,
             "isPartOf": {"@id": SITE + "/#site"}, "publisher": {"@id": SITE + "/#org"}},
            crumbs, faq_ld(h["faq"])]})
    return ""


# ---------------------------------------------------------------- body inserts
FOOTER_COL = """<!-- SEO:FOOTER -->
      <div class="footer-col">
        <h4>For Families</h4>
        <ul role="list">
          <li><a href="come-follow-me-for-kids.html">Come, Follow Me for Kids</a></li>
          <li><a href="bible-stories-for-kids.html">Bible Stories for Kids</a></li>
          <li><a href="lds-parenting.html">LDS Parenting</a></li>
          <li><a href="christian-parenting.html">Christian Parenting</a></li>
          <li><a href="homeschool-bible-stories.html">For Homeschool Families</a></li>
          <li><a href="scripture-study-for-parents.html">Scripture Study for Parents</a></li>
          <li><a href="kids-technology-by-age.html">Kids &amp; Technology by Age</a></li>
          <li><a href="sample.html">Read a Free Story</a></li>
        </ul>
      </div>
      <!-- /SEO:FOOTER -->
      """


def add_footer(s):
    s = re.sub(r"<!-- SEO:FOOTER -->[\s\S]*?<!-- /SEO:FOOTER -->\s*", "", s)
    m = re.search(r'<div class="footer-col">\s*<h4>About</h4>', s)
    if m:
        s = s[:m.start()] + FOOTER_COL + s[m.start():]
    return s


def faq_html(faq, heading="Questions parents ask"):
    items = "\n".join(
        f'<details class="seo-faq-q"><summary>{E(q)}</summary><p>{E(a)}</p></details>' for q, a in faq)
    return f"""<section class="seo-faq" aria-labelledby="seo-faq-h">
  <div class="seo-faq-in">
    <h2 id="seo-faq-h">{E(heading)}</h2>
    {items}
  </div>
</section>"""


SEO_CSS = """<style>
  .seo-faq{background:linear-gradient(160deg,var(--page-2),var(--page));padding:3.5rem 1.25rem}
  .seo-faq-in{max-width:46rem;margin:0 auto}
  .seo-faq h2{font-family:var(--font-display);font-weight:600;color:var(--ink);font-size:clamp(1.6rem,3.5vw,2.2rem);margin:0 0 1.2rem;text-align:center}
  .seo-faq-q{background:var(--fill-06);border:1px solid var(--edge-12);border-radius:14px;padding:.9rem 1.1rem;margin:0 0 .7rem}
  .seo-faq-q summary{cursor:pointer;font-weight:800;color:var(--ink);font-family:var(--font-body)}
  .seo-faq-q p{color:var(--ink-85);line-height:1.7;margin:.6rem 0 0}
  .seo-faq-links{display:flex;flex-wrap:wrap;gap:.5rem;justify-content:center;margin-top:1.4rem}
  .seo-faq-links a{border:1.5px solid var(--gold-ink);color:var(--gold-ink);border-radius:999px;padding:.4rem .9rem;font-weight:700;text-decoration:none;font-size:.9rem}
  .hub-sec{margin:0 0 2rem}.hub-sec h2{font-family:var(--font-display);font-weight:600;color:var(--ink);font-size:1.5rem;margin:0 0 .6rem}
  .hub-sec p{color:var(--ink-85);line-height:1.75;margin:0 0 .8rem}
  .hub-cta{display:flex;flex-wrap:wrap;gap:.7rem;margin:1.4rem 0 2.2rem}
  .hub-list{list-style:none;padding:0;margin:0}
  .hub-list li{border-bottom:1px solid var(--edge-12);padding:.65rem 0;color:var(--ink-85)}
  .hub-list strong{color:var(--ink)} .hub-list span{color:var(--teal-ink);font-size:.85rem;font-weight:700}
  .hub-month{font-family:var(--font-accent);letter-spacing:.14em;text-transform:uppercase;font-size:.75rem;color:var(--gold-ink);margin:1.4rem 0 .3rem}
</style>"""


def home_faq(s):
    s = re.sub(r"<!-- SEO:FAQ -->[\s\S]*?<!-- /SEO:FAQ -->\s*", "", s)
    links = ('<div class="seo-faq-links"><a href="come-follow-me-for-kids.html">Come, Follow Me for Kids</a>'
             '<a href="bible-stories-for-kids.html">Bible Stories for Kids</a>'
             '<a href="lds-parenting.html">LDS Parenting</a><a href="christian-parenting.html">Christian Parenting</a>'
             '<a href="homeschool-bible-stories.html">Homeschool</a><a href="scripture-study-for-parents.html">Scripture study for parents</a>'
             '<a href="kids-technology-by-age.html">Kids &amp; technology by age</a>'
             '<a href="sample.html">Read a free story</a></div>')
    block = "<!-- SEO:FAQ -->\n" + SEO_CSS + "\n" + faq_html(FAQ_HOME).replace("</div>\n</section>", links + "\n  </div>\n</section>") + "\n<!-- /SEO:FAQ -->\n  "
    i = s.find('<footer class="site-footer"')
    return s[:i] + block + s[i:] if i > 0 else s


# ---------------------------------------------------------------- hub pages
def build_hub(page, h, all_nights, posts, template):
    head_end = template.find("</head>")
    head = template[:head_end]
    body = template[head_end:]
    # keep the site header, drop the template's own hero/body, keep footer
    hdr_end = body.find('<header class="mp-hero">')
    foot = body.find('<footer class="site-footer"')
    foot_end = body.find("</footer>", foot) + len("</footer>")
    top, footer = body[:hdr_end], body[foot:foot_end]

    lst = []
    shown = all_nights if not h.get("blog") else all_nights[:14]
    month = None
    for n in shown:
        m = n["_date"].strftime("%B %Y")
        if m != month:
            lst.append(f'</ul><div class="hub-month">{m}</div><ul class="hub-list">')
            month = m
        who = TRAVELER.get(n.get("traveler", ""), "")
        lst.append(f'<li><strong>{E(n["title"])}</strong> &middot; <span>{E(n.get("scripture",""))}</span>'
                   + (f' &middot; with {who}' if who else "") + "</li>")
    stories = '<ul class="hub-list">' + "".join(lst) + "</ul>"
    stories = stories.replace('<ul class="hub-list"></ul>', "", 1)

    sections = "".join(f'<div class="hub-sec"><h2>{E(t)}</h2>{b}</div>' for t, b in h["body"])
    blog = ""
    if h.get("blog"):
        blog = '<div class="hub-sec"><h2>Articles for parents</h2><ul class="hub-list">' + "".join(
            f'<li><a href="{f}"><strong>{E(t)}</strong></a>' + (f"<br>{E(d)}" if d else "") + "</li>" for f, t, d in posts) + "</ul></div>"
    cta = ('<div class="hub-cta"><a class="mp-btn mp-btn-gold" href="/subscribe.html#plans" onclick="return openTrialSignup()">Try the First 7 Days Free</a>'
           '<a class="mp-btn" href="sample.html">Read a whole night free</a>'
           f'<a class="mp-btn" href="{APP_URL}" rel="noopener">Get the iPhone app</a></div>')
    stories_block = "" if h.get("no_list") else f'''<div class="hub-sec"><h2>{E(h['list_title'])}</h2>
        <p>{len(all_nights)} nights so far, newest first, and a new one every morning by 5 AM Mountain Time. Each one has the story, its lullaby and the Morning Lantern.</p>
        {stories}
      </div>'''
    others = " &middot; ".join(f'<a href="{p}">{E(HUBS[p]["kw"])}</a>' for p in HUBS if p != page)
    main = f"""
  <header class="mp-hero">
    <div class="mp-hero-in">
      <span class="mp-eyebrow">&#10022; {E(h['eyebrow'])}</span>
      <h1>{E(h['h1'])}</h1>
      <p>{E(h['lede'])}</p>
    </div>
  </header>

  <section class="mp-body">
    <div class="mp-in">
      {cta}
      {sections}
      {blog}
      {stories_block}
      {cta}
      <p style="color:var(--ink-55);font-size:.9rem">Also see: {others}</p>
    </div>
  </section>

  {faq_html(h['faq'])}

  """
    head = set_title_desc(strip_tags_in_head(head), h["title"], h["desc"])
    head = head.replace("</head>", "")
    head += head_block(page, h["title"], h["desc"], page_ld(page, h["title"], h["desc"])) + SEO_CSS + "\n"
    scripts = '\n  <script src="main.js"></script>\n  <script src="js/lst-signup.js"></script>\n  <script src="js/lst-signed-in.js"></script>\n</body>\n</html>\n'
    out = head + "</head>" + top + main + add_footer(footer) + scripts
    open(page, "w", encoding="utf-8").write(out)


# ---------------------------------------------------------------- main
def main():
    all_nights = nights()
    posts = blog_posts()
    template = open("bedtime-stories.html", encoding="utf-8").read()
    template = re.sub(r"\s*<!-- SEO:HEAD -->[\s\S]*?<!-- /SEO:HEAD -->\s*", "\n", template)
    for page, h in HUBS.items():
        build_hub(page, h, all_nights, posts, template)

    indexable = []
    for page in sorted(glob.glob("*.html")):
        if page in SKIP or page in HUBS:
            if page in HUBS:
                indexable.append(page)
            continue
        s = open(page, encoding="utf-8").read()
        hi = s.lower().find("</head>")
        if hi < 0:
            continue
        head, rest = s[:hi], s[hi:]
        noindex = re.search(r'<meta[^>]+name=["\']robots["\'][^>]*noindex', head, re.I)
        t, d = META.get(page, (None, None))
        head = set_title_desc(strip_tags_in_head(head), t, d)
        if not noindex:
            title = re.search(r"<title>([\s\S]*?)</title>", head)
            desc = re.search(r'<meta[^>]+name=["\']description["\'][^>]*content=["\']([^"\']*)', head, re.I)
            title = html.unescape(title.group(1).strip()) if title else "Little Scripture Travelers"
            desc = html.unescape(desc.group(1)) if desc else ""
            head = head.rstrip() + "\n" + head_block(page, title, desc, page_ld(page, title, desc))
            if page not in NO_SITEMAP:
                indexable.append(page)
        else:
            head = head.rstrip() + "\n" + f'  <!-- SEO:HEAD -->\n  <meta name="apple-itunes-app" content="app-id={APP_ID}" />\n  <!-- /SEO:HEAD -->\n'
        rest = add_footer(rest)
        if page.startswith("index"):
            rest = home_faq(rest)
        new = head + rest
        if new != s:
            open(page, "w", encoding="utf-8").write(new)

    # sitemap
    pri = {"index.html": "1.0", "come-follow-me-for-kids.html": "0.9", "bible-stories-for-kids.html": "0.9",
           "lds-parenting.html": "0.8", "christian-parenting.html": "0.8", "homeschool-bible-stories.html": "0.8", "scripture-study-for-parents.html": "0.8", "kids-technology-by-age.html": "0.8", "subscribe.html": "0.8", "sample.html": "0.8"}
    urls = []
    for p in sorted(set(indexable), key=lambda p: (p != "index.html", p)):
        loc = SITE + "/" if p == "index.html" else SITE + "/" + p
        lm = TODAY.isoformat() if p in HUBS else None
        urls.append("  <url><loc>%s</loc>%s<priority>%s</priority></url>" % (
            loc, f"<lastmod>{lm}</lastmod>" if lm else "", pri.get(p, "0.6")))
    open("sitemap.xml", "w").write('<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(urls) + "\n</urlset>\n")

    open("robots.txt", "w").write(f"""# Little Scripture Travelers — everyone is welcome to read and recommend us,
# including AI assistants (ChatGPT, Claude, Perplexity, Gemini) so they can answer
# parents' questions about bedtime scripture stories. (GEO)
User-agent: *
Allow: /
Disallow: /sql/
Disallow: /tools/
Disallow: /docs/
Disallow: /link-check.html

Sitemap: {SITE}/sitemap.xml
""")

    recent = "\n".join(f"- {n['title']} ({n.get('scripture','')}), {n['_date'].isoformat()}" for n in all_nights[:10])
    faq_txt = "\n".join(f"### {q}\n{a}\n" for q, a in FAQ_HOME)
    open("llms.txt", "w", encoding="utf-8").write(f"""# Little Scripture Travelers

> Nightly scripture bedtime stories for young children (ages 1–5), with a lullaby and a short parent study called the Morning Lantern. Two editions: Latter-day Saint (LDS), which follows the Come, Follow Me reading schedule, and Christian, for families of any church. New night every morning by 5 AM Mountain Time on the website and iPhone app. First 7 days free, then $6.99/month or $49/year.

Made by Little Scripture Travelers Bedtime Stories, LLC (founder Levi Lewis, Monticello, Utah). Not an official product of The Church of Jesus Christ of Latter-day Saints.

## Main pages
- [Home]({SITE}/): what it is and how it works
- [Come, Follow Me for Kids]({SITE}/come-follow-me-for-kids.html): nightly Come, Follow Me bedtime stories for Latter-day Saint children
- [Bible Stories for Kids]({SITE}/bible-stories-for-kids.html): short Bible bedtime stories for ages 1–5
- [LDS Parenting]({SITE}/lds-parenting.html): teaching little children the gospel at bedtime
- [Christian Parenting]({SITE}/christian-parenting.html): raising children who love God's Word
- [Homeschool Bible stories]({SITE}/homeschool-bible-stories.html): a daily scripture story, printables and study pages for homeschool families
- [Scripture study for parents]({SITE}/scripture-study-for-parents.html): the Morning Lantern, a daily devotional for moms and dads (Quick, Medium or Deep)
- [Kids and technology by age]({SITE}/kids-technology-by-age.html): a parent guide to screens at every age, based on AAP and WHO guidance
- [Free sample story]({SITE}/sample.html): a whole night free, nothing to join
- [Plans and free trial]({SITE}/subscribe.html)
- [Meet the Travelers]({SITE}/travelers.html): Beau the Brave, Scout the Seeker, Willow the Warm, Wren the Wonderer
- [Books]({SITE}/books.html): illustrated scripture story books on Amazon
- [Blog]({SITE}/blog.html): LDS and Christian parenting articles
- [iPhone app]({APP_URL})

## Questions parents ask
{faq_txt}
## Most recent bedtime stories
{recent}
""")
    print(f"nights={len(all_nights)} indexable={len(set(indexable))} hubs={len(HUBS)}")


if __name__ == "__main__":
    main()
