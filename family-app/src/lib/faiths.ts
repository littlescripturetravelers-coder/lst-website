// Every faith a family can choose, with a daily scripture or sacred text, a daily quote, and links to read more.
// Latter-day Saint and Christian families (and Catholic and Orthodox, which use the Christian edition) follow the Morning Lantern:
// its verse and "Remember this" quote for the day come from the server (lantern_nights.texts). These lists are the fallback for them
// and the daily source for every other faith. Texts are short, well-known passages; translations are public domain or widely quoted.
// Never shown to families who chose no faith or turned the faith section off.

export type FaithKey = 'lds' | 'christian' | 'catholic' | 'orthodox' | 'jewish' | 'muslim' | 'hindu' | 'buddhist' | 'sikh' | 'bahai' | 'spiritual' | 'none';
type Text = { text: string; ref: string; url?: string };
type Quote = { text: string; by: string };

export const FAITH_OPTIONS: [FaithKey, string][] = [
  ['lds', 'Latter-day Saint'], ['christian', 'Christian'], ['catholic', 'Catholic'], ['orthodox', 'Orthodox Christian'], ['jewish', 'Jewish'],
  ['muslim', 'Muslim'], ['hindu', 'Hindu'], ['buddhist', 'Buddhist'], ['sikh', 'Sikh'], ['bahai', 'Bahá’í'], ['spiritual', 'Spiritual, no one tradition'], ['none', 'None'],
];
export const faithLabel = (f?: string | null) => FAITH_OPTIONS.find(x => x[0] === f)?.[1] ?? 'None';
/** Which Morning Lantern edition a faith uses (null = no Morning Lantern, couple study or story activity). */
export const lanternEdition = (f?: string | null): 'lds' | 'christian' | null => f === 'lds' ? 'lds' : f === 'christian' || f === 'catholic' || f === 'orthodox' ? 'christian' : null;
export const hasFaith = (f?: string | null) => !!f && f !== 'none';

// ---------- links ----------
const GL: Record<string, [string, string]> = {};
const add = (vol: string, list: [string[], string][]) => list.forEach(([names, code]) => names.forEach(n => { GL[n.toLowerCase()] = [vol, code]; }));
add('ot', [[['Genesis'], 'gen'], [['Exodus'], 'ex'], [['Leviticus'], 'lev'], [['Numbers'], 'num'], [['Deuteronomy'], 'deut'], [['Joshua'], 'josh'], [['Judges'], 'judg'], [['Ruth'], 'ruth'],
  [['1 Samuel'], '1-sam'], [['2 Samuel'], '2-sam'], [['1 Kings'], '1-kgs'], [['2 Kings'], '2-kgs'], [['1 Chronicles'], '1-chr'], [['2 Chronicles'], '2-chr'], [['Ezra'], 'ezra'], [['Nehemiah'], 'neh'],
  [['Esther'], 'esth'], [['Job'], 'job'], [['Psalm', 'Psalms'], 'ps'], [['Proverbs'], 'prov'], [['Ecclesiastes'], 'eccl'], [['Song of Solomon', 'Song of Songs'], 'song'], [['Isaiah'], 'isa'],
  [['Jeremiah'], 'jer'], [['Lamentations'], 'lam'], [['Ezekiel'], 'ezek'], [['Daniel'], 'dan'], [['Hosea'], 'hosea'], [['Joel'], 'joel'], [['Amos'], 'amos'], [['Obadiah'], 'obad'], [['Jonah'], 'jonah'],
  [['Micah'], 'micah'], [['Nahum'], 'nahum'], [['Habakkuk'], 'hab'], [['Zephaniah'], 'zeph'], [['Haggai'], 'hag'], [['Zechariah'], 'zech'], [['Malachi'], 'mal']]);
add('nt', [[['Matthew'], 'matt'], [['Mark'], 'mark'], [['Luke'], 'luke'], [['John'], 'john'], [['Acts'], 'acts'], [['Romans'], 'rom'], [['1 Corinthians'], '1-cor'], [['2 Corinthians'], '2-cor'],
  [['Galatians'], 'gal'], [['Ephesians'], 'eph'], [['Philippians'], 'philip'], [['Colossians'], 'col'], [['1 Thessalonians'], '1-thes'], [['2 Thessalonians'], '2-thes'], [['1 Timothy'], '1-tim'],
  [['2 Timothy'], '2-tim'], [['Titus'], 'titus'], [['Philemon'], 'philem'], [['Hebrews'], 'heb'], [['James'], 'james'], [['1 Peter'], '1-pet'], [['2 Peter'], '2-pet'], [['1 John'], '1-jn'],
  [['2 John'], '2-jn'], [['3 John'], '3-jn'], [['Jude'], 'jude'], [['Revelation'], 'rev']]);
add('bofm', [[['1 Nephi'], '1-ne'], [['2 Nephi'], '2-ne'], [['Jacob'], 'jacob'], [['Enos'], 'enos'], [['Jarom'], 'jarom'], [['Omni'], 'omni'], [['Words of Mormon'], 'w-of-m'], [['Mosiah'], 'mosiah'],
  [['Alma'], 'alma'], [['Helaman'], 'hel'], [['3 Nephi'], '3-ne'], [['4 Nephi'], '4-ne'], [['Mormon'], 'morm'], [['Ether'], 'ether'], [['Moroni'], 'moro']]);
add('dc-testament', [[['Doctrine and Covenants', 'D&C'], 'dc']]);
add('pgp', [[['Moses'], 'moses'], [['Abraham'], 'abr'], [['Joseph Smith—Matthew', 'Joseph Smith-Matthew'], 'js-m'], [['Joseph Smith—History', 'Joseph Smith-History'], 'js-h'], [['Articles of Faith'], 'a-of-f']]);

/** "Psalm 139:14 (KJV)" -> book, chapter, first and last verse. */
export function parseRef(ref: string) {
  const m = ref.replace(/\s*\(.*?\)\s*$/, '').trim().match(/^(.+?)\s+(\d+)(?::(\d+)(?:\s*[-–]\s*(\d+))?)?$/);
  return m ? { book: m[1], ch: m[2], v1: m[3], v2: m[4] } : null;
}
/** Opens the passage in the Gospel Library app (or the Church website if the app isn't installed). */
export function gospelLibraryUrl(ref: string) {
  const r = parseRef(ref); const b = r && GL[r.book.toLowerCase()];
  if (!r || !b) return 'https://www.churchofjesuschrist.org/study/scriptures?lang=eng';
  const id = r.v1 ? '&id=p' + r.v1 + (r.v2 ? '-p' + r.v2 : '') + '#p' + r.v1 : '';
  return 'https://www.churchofjesuschrist.org/study/scriptures/' + b[0] + '/' + b[1] + '/' + r.ch + '?lang=eng' + id;
}
const BIBLE_VERSION: Record<string, string> = { christian: 'NIV', catholic: 'NABRE', orthodox: 'NKJV', lds: 'KJV' };
export const bibleUrl = (ref: string, faith = 'christian') => 'https://www.biblegateway.com/passage/?search=' + encodeURIComponent(ref.replace(/\s*\(.*?\)\s*$/, '')) + '&version=' + (BIBLE_VERSION[faith] ?? 'KJV');
/** Where a passage opens, by faith. */
export function readUrl(faith: string, ref: string, url?: string): string | undefined {
  if (url) return url;
  if (faith === 'lds') return gospelLibraryUrl(ref);
  if (lanternEdition(faith)) return bibleUrl(ref, faith);
  return undefined; // other traditions only link when the passage has its own link
}
/** A second link to that faith's own teachings, shown under the daily text. */
export const TEACHINGS: Partial<Record<FaithKey, [string, string]>> = {
  lds: ['Open Gospel Library', 'https://www.churchofjesuschrist.org/study?lang=eng'],
  christian: ['Read the Bible', 'https://www.biblegateway.com/'],
  catholic: ['Today’s Mass readings', 'https://bible.usccb.org/daily-bible-reading'],
  orthodox: ['Today’s readings', 'https://www.goarch.org/chapel'],
  jewish: ['Learn on Sefaria', 'https://www.sefaria.org/texts'],
  muslim: ['Read the Quran', 'https://quran.com/'],
  hindu: ['Read the Bhagavad Gita', 'https://www.holy-bhagavad-gita.org/'],
  buddhist: ['Read the Dhammapada', 'https://www.accesstoinsight.org/tipitaka/kn/dhp/index.html'],
  sikh: ['Read Gurbani', 'https://www.sikhitothemax.org/'],
  bahai: ['Bahá’í Reference Library', 'https://www.bahai.org/library/'],
};

// ---------- daily texts ----------
const CHRISTIAN: Text[] = [
  { text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.', ref: 'John 3:16' },
  { text: 'I can do all things through Christ which strengtheneth me.', ref: 'Philippians 4:13' },
  { text: 'The Lord is my shepherd; I shall not want.', ref: 'Psalm 23:1' },
  { text: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding.', ref: 'Proverbs 3:5' },
  { text: 'And we know that all things work together for good to them that love God.', ref: 'Romans 8:28' },
  { text: 'Be strong and of a good courage; be not afraid, neither be thou dismayed: for the Lord thy God is with thee whithersoever thou goest.', ref: 'Joshua 1:9' },
  { text: 'They that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles.', ref: 'Isaiah 40:31' },
  { text: 'Blessed are the peacemakers: for they shall be called the children of God.', ref: 'Matthew 5:9' },
  { text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.', ref: 'Matthew 11:28' },
  { text: 'Be still, and know that I am God.', ref: 'Psalm 46:10' },
  { text: 'And let us not be weary in well doing: for in due season we shall reap, if we faint not.', ref: 'Galatians 6:9' },
  { text: 'And above all these things put on charity, which is the bond of perfectness.', ref: 'Colossians 3:14' },
  { text: 'This is the day which the Lord hath made; we will rejoice and be glad in it.', ref: 'Psalm 118:24' },
  { text: 'Charity suffereth long, and is kind.', ref: '1 Corinthians 13:4' },
];
export const TEXTS: Partial<Record<FaithKey, Text[]>> = {
  lds: [
    { text: 'Adam fell that men might be; and men are, that they might have joy.', ref: '2 Nephi 2:25' },
    { text: 'I will go and do the things which the Lord hath commanded.', ref: '1 Nephi 3:7' },
    { text: 'When ye are in the service of your fellow beings ye are only in the service of your God.', ref: 'Mosiah 2:17' },
    { text: 'Look unto me in every thought; doubt not, fear not.', ref: 'Doctrine and Covenants 6:36' },
    { text: 'Be thou humble; and the Lord thy God shall lead thee by the hand, and give thee answer to thy prayers.', ref: 'Doctrine and Covenants 112:10' },
    { text: 'Remember the worth of souls is great in the sight of God.', ref: 'Doctrine and Covenants 18:10' },
    { text: 'By small and simple things are great things brought to pass.', ref: 'Alma 37:6' },
    { text: 'Counsel with the Lord in all thy doings, and he will direct thee for good.', ref: 'Alma 37:37' },
    { text: 'Charity never faileth.', ref: 'Moroni 7:46' },
    { text: 'Let virtue garnish thy thoughts unceasingly; then shall thy confidence wax strong in the presence of God.', ref: 'Doctrine and Covenants 121:45' },
    { text: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding.', ref: 'Proverbs 3:5' },
    { text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.', ref: 'Matthew 11:28' },
    { text: 'Be still, and know that I am God.', ref: 'Psalm 46:10' },
    { text: 'I will praise thee; for I am fearfully and wonderfully made.', ref: 'Psalm 139:14' },
  ],
  christian: CHRISTIAN, catholic: CHRISTIAN, orthodox: CHRISTIAN,
  jewish: [
    { text: 'Hear, O Israel: the LORD our God, the LORD is one.', ref: 'Deuteronomy 6:4', url: 'https://www.sefaria.org/Deuteronomy.6.4' },
    { text: 'And thou shalt teach them diligently unto thy children.', ref: 'Deuteronomy 6:7', url: 'https://www.sefaria.org/Deuteronomy.6.7' },
    { text: 'Thou shalt love thy neighbour as thyself.', ref: 'Leviticus 19:18', url: 'https://www.sefaria.org/Leviticus.19.18' },
    { text: 'What doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?', ref: 'Micah 6:8', url: 'https://www.sefaria.org/Micah.6.8' },
    { text: 'Behold, how good and how pleasant it is for brethren to dwell together in unity!', ref: 'Psalms 133:1', url: 'https://www.sefaria.org/Psalms.133.1' },
    { text: 'This is the day which the LORD hath made; we will rejoice and be glad in it.', ref: 'Psalms 118:24', url: 'https://www.sefaria.org/Psalms.118.24' },
    { text: 'Train up a child in the way he should go, and even when he is old, he will not depart from it.', ref: 'Proverbs 22:6', url: 'https://www.sefaria.org/Proverbs.22.6' },
    { text: 'If I am not for myself, who will be for me? But if I am only for myself, what am I? And if not now, when?', ref: 'Pirkei Avot 1:14', url: 'https://www.sefaria.org/Pirkei_Avot.1.14' },
    { text: 'The world stands on three things: on Torah, on service, and on acts of loving-kindness.', ref: 'Pirkei Avot 1:2', url: 'https://www.sefaria.org/Pirkei_Avot.1.2' },
    { text: 'Who is wise? One who learns from every person.', ref: 'Pirkei Avot 4:1', url: 'https://www.sefaria.org/Pirkei_Avot.4.1' },
    { text: 'It is not your duty to finish the work, but neither are you free to neglect it.', ref: 'Pirkei Avot 2:16', url: 'https://www.sefaria.org/Pirkei_Avot.2.16' },
    { text: 'Be strong and of good courage.', ref: 'Joshua 1:9', url: 'https://www.sefaria.org/Joshua.1.9' },
  ],
  muslim: [
    { text: 'Indeed, with hardship comes ease.', ref: 'Quran 94:6', url: 'https://quran.com/94/6' },
    { text: 'Allah does not burden a soul beyond that it can bear.', ref: 'Quran 2:286', url: 'https://quran.com/2/286' },
    { text: 'So remember Me; I will remember you.', ref: 'Quran 2:152', url: 'https://quran.com/2/152' },
    { text: 'Indeed, Allah is with the patient.', ref: 'Quran 2:153', url: 'https://quran.com/2/153' },
    { text: 'And of His signs is that He created for you from yourselves mates that you may find tranquillity in them; and He placed between you affection and mercy.', ref: 'Quran 30:21', url: 'https://quran.com/30/21' },
    { text: 'And speak to people good words.', ref: 'Quran 2:83', url: 'https://quran.com/2/83' },
    { text: 'Indeed, Allah will not change the condition of a people until they change what is in themselves.', ref: 'Quran 13:11', url: 'https://quran.com/13/11' },
    { text: 'And whoever relies upon Allah, then He is sufficient for him.', ref: 'Quran 65:3', url: 'https://quran.com/65/3' },
    { text: 'My Lord, increase me in knowledge.', ref: 'Quran 20:114', url: 'https://quran.com/20/114' },
    { text: 'Unquestionably, by the remembrance of Allah hearts are assured.', ref: 'Quran 13:28', url: 'https://quran.com/13/28' },
    { text: 'And He is with you wherever you are.', ref: 'Quran 57:4', url: 'https://quran.com/57/4' },
    { text: 'And He found you lost and guided you.', ref: 'Quran 93:7', url: 'https://quran.com/93/7' },
  ],
  hindu: [
    { text: 'You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions.', ref: 'Bhagavad Gita 2.47', url: 'https://www.holy-bhagavad-gita.org/chapter/2/verse/47' },
    { text: 'Perform your duty with evenness of mind, giving up attachment to success and failure. Such evenness of mind is called yoga.', ref: 'Bhagavad Gita 2.48', url: 'https://www.holy-bhagavad-gita.org/chapter/2/verse/48' },
    { text: 'The soul is never born, nor does it ever die.', ref: 'Bhagavad Gita 2.20', url: 'https://www.holy-bhagavad-gita.org/chapter/2/verse/20' },
    { text: 'Lift yourself up by your own mind, and do not let yourself be dragged down.', ref: 'Bhagavad Gita 6.5', url: 'https://www.holy-bhagavad-gita.org/chapter/6/verse/5' },
    { text: 'For one who has conquered the mind, the mind is the best of friends.', ref: 'Bhagavad Gita 6.6', url: 'https://www.holy-bhagavad-gita.org/chapter/6/verse/6' },
    { text: 'Whatever you do, whatever you eat, whatever you offer, whatever you give, do it as an offering to Me.', ref: 'Bhagavad Gita 9.27', url: 'https://www.holy-bhagavad-gita.org/chapter/9/verse/27' },
    { text: 'Those who see Me everywhere and see all things in Me, I am never lost to them, nor are they ever lost to Me.', ref: 'Bhagavad Gita 6.30', url: 'https://www.holy-bhagavad-gita.org/chapter/6/verse/30' },
    { text: 'Lead me from the unreal to the real, from darkness to light, from death to immortality.', ref: 'Brihadaranyaka Upanishad 1.3.28' },
  ],
  buddhist: [
    { text: 'Hatred is never appeased by hatred in this world. By non-hatred alone is hatred appeased. This is a law eternal.', ref: 'Dhammapada 5', url: 'https://www.accesstoinsight.org/tipitaka/kn/dhp/dhp.01.budd.html' },
    { text: 'Mind precedes all mental states. Mind is their chief; they are all mind-wrought.', ref: 'Dhammapada 1', url: 'https://www.accesstoinsight.org/tipitaka/kn/dhp/dhp.01.budd.html' },
    { text: 'As a solid rock is not shaken by the storm, even so the wise are not affected by praise or blame.', ref: 'Dhammapada 81', url: 'https://www.accesstoinsight.org/tipitaka/kn/dhp/dhp.06.budd.html' },
    { text: 'Better than a thousand useless words is one useful word, hearing which one attains peace.', ref: 'Dhammapada 100', url: 'https://www.accesstoinsight.org/tipitaka/kn/dhp/dhp.08.budd.html' },
    { text: 'Though one may conquer a thousand times a thousand men in battle, yet he indeed is the noblest victor who conquers himself.', ref: 'Dhammapada 103', url: 'https://www.accesstoinsight.org/tipitaka/kn/dhp/dhp.08.budd.html' },
    { text: 'Health is the highest gain and contentment the greatest wealth.', ref: 'Dhammapada 204', url: 'https://www.accesstoinsight.org/tipitaka/kn/dhp/dhp.15.budd.html' },
    { text: 'Overcome the angry by non-anger; overcome the wicked by goodness; overcome the miser by generosity; overcome the liar by truth.', ref: 'Dhammapada 223', url: 'https://www.accesstoinsight.org/tipitaka/kn/dhp/dhp.17.budd.html' },
  ],
  sikh: [
    { text: 'There is but One God. Truth is His Name. The Creator, without fear, without hate.', ref: 'Mool Mantar, Japji Sahib (Ang 1)', url: 'https://www.sikhitothemax.org/ang?ang=1&source=G' },
    { text: 'Truth is higher than everything; but higher still is truthful living.', ref: 'Sri Raag (Ang 62)', url: 'https://www.sikhitothemax.org/ang?ang=62&source=G' },
    { text: 'Recognize the Lord’s Light within all, and do not consider social class or status.', ref: 'Raag Aasaa (Ang 349)', url: 'https://www.sikhitothemax.org/ang?ang=349&source=G' },
    { text: 'May the Name bring ever-rising spirits; by Your will, may all be blessed.', ref: 'Ardas' },
    { text: 'I tell the truth, listen all: those who love, they alone realize the Lord.', ref: 'Guru Gobind Singh' },
  ],
  bahai: [
    { text: 'The earth is but one country, and mankind its citizens.', ref: 'Bahá’u’lláh, Gleanings CXVII', url: 'https://www.bahai.org/library/authoritative-texts/bahaullah/gleanings-writings-bahaullah/' },
    { text: 'Let your vision be world-embracing, rather than confined to your own self.', ref: 'Bahá’u’lláh, Gleanings XLIII', url: 'https://www.bahai.org/library/authoritative-texts/bahaullah/gleanings-writings-bahaullah/' },
    { text: 'Be generous in prosperity, and thankful in adversity.', ref: 'Bahá’u’lláh, Gleanings CXXX', url: 'https://www.bahai.org/library/authoritative-texts/bahaullah/gleanings-writings-bahaullah/' },
    { text: 'Regard man as a mine rich in gems of inestimable value. Education can, alone, cause it to reveal its treasures.', ref: 'Bahá’u’lláh, Gleanings CXXII', url: 'https://www.bahai.org/library/authoritative-texts/bahaullah/gleanings-writings-bahaullah/' },
    { text: 'So powerful is the light of unity that it can illuminate the whole earth.', ref: 'Bahá’u’lláh, Epistle to the Son of the Wolf', url: 'https://www.bahai.org/library/authoritative-texts/bahaullah/epistle-son-wolf/' },
  ],
  spiritual: [
    { text: 'The journey of a thousand miles begins with a single step.', ref: 'Tao Te Ching 64' },
    { text: 'Knowing others is intelligence; knowing yourself is true wisdom.', ref: 'Tao Te Ching 33' },
    { text: 'Waste no more time arguing about what a good man should be. Be one.', ref: 'Marcus Aurelius, Meditations 10.16' },
    { text: 'Wherever there is a human being, there is an opportunity for a kindness.', ref: 'Seneca' },
    { text: 'Be kind whenever possible. It is always possible.', ref: 'The Dalai Lama' },
  ],
};

// ---------- daily quotes ----------
export const QUOTES_BY_FAITH: Partial<Record<FaithKey, Quote[]>> = {
  lds: [
    { text: 'Joy has little to do with the circumstances of our lives and everything to do with the focus of our lives.', by: 'Russell M. Nelson' },
    { text: 'Never let a problem to be solved become more important than a person to be loved.', by: 'Thomas S. Monson' },
    { text: 'Try a little harder to be a little better.', by: 'Gordon B. Hinckley' },
    { text: 'Don’t you quit. You keep walking. You keep trying. There is help and happiness ahead.', by: 'Jeffrey R. Holland' },
    { text: 'Choose your love; love your choice.', by: 'Thomas S. Monson' },
  ],
  christian: [
    { text: 'Darkness cannot drive out darkness; only light can do that. Hate cannot drive out hate; only love can do that.', by: 'Martin Luther King Jr.' },
    { text: 'There is no pit so deep that God’s love is not deeper still.', by: 'Betsie ten Boom, in The Hiding Place' },
    { text: 'Thou hast made us for Thyself, and our heart is restless, until it repose in Thee.', by: 'Augustine, Confessions' },
    { text: 'We can do little things for God.', by: 'Brother Lawrence' },
  ],
  catholic: [
    { text: 'Have patience with all things, but first of all with yourself.', by: 'Francis de Sales' },
    { text: 'Thou hast made us for Thyself, and our heart is restless, until it repose in Thee.', by: 'Augustine, Confessions' },
    { text: 'Do small things with great love.', by: 'Mother Teresa' },
  ],
  orthodox: [
    { text: 'Acquire the spirit of peace, and thousands around you will be saved.', by: 'Seraphim of Sarov' },
    { text: 'Thou hast made us for Thyself, and our heart is restless, until it repose in Thee.', by: 'Augustine, Confessions' },
  ],
  jewish: [
    { text: 'When I was young, I admired clever people. Now that I am old, I admire kind people.', by: 'Abraham Joshua Heschel' },
    { text: 'The whole world is a very narrow bridge, and the main thing is not to be afraid at all.', by: 'Rebbe Nachman of Breslov' },
    { text: 'What is hateful to you, do not do to your fellow. That is the whole Torah; the rest is commentary.', by: 'Hillel, Shabbat 31a' },
  ],
  muslim: [
    { text: 'None of you truly believes until he loves for his brother what he loves for himself.', by: 'Prophet Muhammad, Sahih al-Bukhari' },
    { text: 'The best of you are those who are best to their families.', by: 'Prophet Muhammad, Jami at-Tirmidhi' },
    { text: 'A good word is charity.', by: 'Prophet Muhammad, Sahih al-Bukhari' },
  ],
  hindu: [
    { text: 'Arise, awake, and stop not till the goal is reached.', by: 'Swami Vivekananda' },
    { text: 'Where there is love there is life.', by: 'Mahatma Gandhi' },
  ],
  buddhist: [
    { text: 'Smile, breathe and go slowly.', by: 'Thich Nhat Hanh' },
    { text: 'Be kind whenever possible. It is always possible.', by: 'The Dalai Lama' },
  ],
  sikh: [
    { text: 'Truth is higher than everything; but higher still is truthful living.', by: 'Guru Nanak' },
  ],
  bahai: [
    { text: 'Be ye as the fingers of one hand, the members of one body.', by: '‘Abdu’l-Bahá' },
    { text: 'Love gives life to the lifeless.', by: '‘Abdu’l-Bahá, Paris Talks' },
  ],
  spiritual: [
    { text: 'The happiness of your life depends upon the quality of your thoughts.', by: 'Marcus Aurelius' },
    { text: 'Nature does not hurry, yet everything is accomplished.', by: 'Lao Tzu' },
  ],
};

const dayNumber = (d = new Date()) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
/** Today's text and quote for a faith (from the lists; the Morning Lantern overrides both for LDS and Christian families). */
export function faithDaily(faith?: string | null, d = new Date()) {
  if (!hasFaith(faith)) return null;
  const f = faith as FaithKey; const texts = TEXTS[f] ?? []; const quotes = QUOTES_BY_FAITH[f] ?? [];
  const n = dayNumber(d); const t = texts.length ? texts[n % texts.length] : null;
  return { text: t ? { ...t, url: readUrl(f, t.ref, t.url) } : null, quote: quotes.length ? quotes[(n * 3) % quotes.length] : null, teachings: TEACHINGS[f] ?? null };
}
