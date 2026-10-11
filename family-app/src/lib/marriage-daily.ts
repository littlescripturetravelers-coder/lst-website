// A love quote and a clean joke for the two of you, new every day. Both spouses see the same ones that day.
// Kept on the phone (no AI, no cost). Scripture quotes only show for families who chose a faith; they display in italics.
import { Family } from './family';

type Quote = { text: string; by: string; scripture?: boolean; lds?: boolean };
export const QUOTES: Quote[] = [
  { text: 'A successful marriage requires falling in love many times, always with the same person.', by: 'Mignon McLaughlin' },
  { text: 'Love does not consist of gazing at each other, but in looking outward together in the same direction.', by: 'Antoine de Saint-Exupéry' },
  { text: 'Grow old along with me! The best is yet to be.', by: 'Robert Browning' },
  { text: 'To love and be loved is to feel the sun from both sides.', by: 'David Viscott' },
  { text: 'A happy marriage is a long conversation which always seems too short.', by: 'André Maurois' },
  { text: 'Whatever our souls are made of, his and mine are the same.', by: 'Emily Brontë' },
  { text: 'I love you not only for what you are, but for what I am when I am with you.', by: 'Roy Croft' },
  { text: 'There is no more lovely, friendly and charming relationship, communion or company than a good marriage.', by: 'Martin Luther' },
  { text: 'Love is friendship that has caught fire.', by: 'Ann Landers' },
  { text: 'The greatest thing you’ll ever learn is just to love and be loved in return.', by: 'eden ahbez' },
  { text: 'Real love stories never have endings.', by: 'Richard Bach' },
  { text: 'Love looks not with the eyes, but with the mind.', by: 'William Shakespeare' },
  { text: 'The best love is the kind that awakens the soul.', by: 'Nicholas Sparks' },
  { text: 'To get the full value of joy you must have someone to divide it with.', by: 'Mark Twain' },
  { text: 'Love is when the other person’s happiness is more important than your own.', by: 'H. Jackson Brown Jr.' },
  { text: 'A good marriage is one which allows for change and growth in the individuals and in the way they express their love.', by: 'Pearl S. Buck' },
  { text: 'The highest happiness on earth is the happiness of marriage.', by: 'William Lyon Phelps' },
  { text: 'Chains do not hold a marriage together. It is threads, hundreds of tiny threads, which sew people together through the years.', by: 'Simone Signoret' },
  { text: 'What greater thing is there for two human souls than to feel that they are joined for life?', by: 'George Eliot' },
  { text: 'Love doesn’t make the world go round. Love is what makes the ride worthwhile.', by: 'Franklin P. Jones' },
  { text: 'Love one another and you will be happy. It’s as simple and as difficult as that.', by: 'Michael Leunig' },
  { text: 'Love is a choice you make from moment to moment.', by: 'Barbara De Angelis' },
  { text: 'Love is not only something you feel, it is something you do.', by: 'David Wilkerson' },
  { text: 'Never above you. Never below you. Always beside you.', by: 'Walter Winchell' },
  { text: 'We are most alive when we’re in love.', by: 'John Updike' },
  { text: 'Where there is love there is life.', by: 'Mahatma Gandhi' },
  { text: 'If I know what love is, it is because of you.', by: 'Hermann Hesse' },
  { text: 'Love is composed of a single soul inhabiting two bodies.', by: 'Aristotle' },
  { text: 'Happiness is only real when shared.', by: 'Christopher McCandless' },
  { text: 'Love is a canvas furnished by nature and embroidered by imagination.', by: 'Voltaire' },
  { text: 'Charity suffereth long, and is kind.', by: '1 Corinthians 13:4', scripture: true },
  { text: 'And now abideth faith, hope, charity, these three; but the greatest of these is charity.', by: '1 Corinthians 13:13', scripture: true },
  { text: 'Two are better than one … For if they fall, the one will lift up his fellow.', by: 'Ecclesiastes 4:9–10', scripture: true },
  { text: 'Many waters cannot quench love, neither can the floods drown it.', by: 'Song of Solomon 8:7', scripture: true },
  { text: 'Be kindly affectioned one to another with brotherly love; in honour preferring one another.', by: 'Romans 12:10', scripture: true },
  { text: 'Beloved, let us love one another: for love is of God.', by: '1 John 4:7', scripture: true },
  { text: 'Let all your things be done with charity.', by: '1 Corinthians 16:14', scripture: true },
  { text: 'Neither is the man without the woman, neither the woman without the man, in the Lord.', by: '1 Corinthians 11:11', scripture: true },
  { text: 'Thou shalt love thy wife with all thy heart, and shalt cleave unto her and none else.', by: 'Doctrine and Covenants 42:22', scripture: true, lds: true },
];

export const JOKES: string[] = [
  'My spouse told me to stop impersonating a flamingo. I had to put my foot down.',
  'I asked my husband if he’d seen the dog bowl. He said he didn’t know the dog could bowl.',
  'What do you call two birds in love? Tweethearts.',
  'What did the stamp say to the envelope? “I’m stuck on you.”',
  'Marriage is mostly texting each other “Do we need anything from the store?” for the rest of your lives.',
  'What did one volcano say to the other? “I lava you.”',
  'Love is sharing your popcorn. True love is letting them have the last handful.',
  'Our marriage counselor says we should argue less. We disagree.',
  'How do you know your spouse is your best friend? They eat the crusts you left and say thank you.',
  'I told my wife she should embrace her mistakes. She gave me a hug.',
  'The secret to a long marriage is two words: “You’re right.” Bonus points for “I’ll do the dishes.”',
  'We promised we’d never be the couple with matching outfits. Then we both showed up in sweatpants.',
  'Why did the scarecrow get married? He was outstanding in his field, and she noticed.',
  'What did the paper clip say to the magnet? “I find you very attractive.”',
  'Every couple needs a shared hobby. Ours is standing in front of the open fridge deciding what to eat.',
  'What do you call two chickens who love each other? Hen-separable.',
  'I asked my spouse what they wanted for our anniversary. They said “nothing.” So I wrapped up a beautiful empty box.',
  'What did the bee say to its sweetheart? “You’re the bee’s knees, honey.”',
  'Why do couples make great teams? One loses the keys, the other finds them still in the door.',
  'We’ve been married so long we can have a whole conversation with just our eyebrows.',
  'How did the telephone propose? He gave her a ring.',
  'What did the pickle say to its sweetheart? “You mean a great dill to me.”',
  'Why did the two 4s skip dinner on date night? They already 8.',
  'What do you call two octopuses in love? A couple holding hands, hands, hands, hands…',
  'Our love language is sending each other funny videos from opposite ends of the couch.',
  'What did one plate say to the other? “Dinner’s on me.”',
  'Why did the couple bring a ladder on their date? They heard things were going to the next level.',
  'What did the coffee say to the cream? “You make me a better latte.”',
  'Being married means always having someone to blame for eating the last cookie, even when it was you.',
  'What do you call a spouse who is “just resting their eyes”? Asleep.',
  'Romance is checking the weather for your spouse before they even ask.',
  'What did the boy owl say to the girl owl? “Owl always love you.”',
  'Why did the banana go on a date? Because it had a peel.',
  'Marriage is finding the one person you want to annoy for the rest of your life.',
  'What did the cow say to her sweetheart? “I’m so into moo.”',
];

const dayNumber = (d = new Date()) => Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);

/** Today's quote and joke. Same for both spouses; quotes and jokes cycle on their own so pairs don't repeat together. */
export function marriageDaily(family?: Family | null, d = new Date()) {
  const faith = family?.faith && family.faith !== 'none';
  const quotes = QUOTES.filter(q => !q.scripture || (faith && (!q.lds || family?.faith === 'lds')));
  const n = dayNumber(d);
  return { quote: quotes[n % quotes.length], joke: JOKES[(n * 7) % JOKES.length] };
}
