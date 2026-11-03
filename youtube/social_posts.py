#!/usr/bin/env python3
"""
Writes youtube/posts/<date>.json: the day's read-along posts for every platform (Levi, 3 Nov 2026:
"create these and post them to each account each day"), with the public links of the video files.
The "Lantern Daily Posts" scheduled task reads this file each morning and schedules the posts in
Metricool (YouTube full video + Short, Instagram Reel, Facebook Reel, TikTok, Pinterest video pin).

usage: social_posts.py <slug> <out dir> <base url of the published files>
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from upload_youtube import build_metadata, first_sentences

def main():
    slug, out, base = sys.argv[1], sys.argv[2], sys.argv[3].rstrip('/')
    m = json.load(open(os.path.join(out, f'{slug}-meta.json'), encoding='utf-8'))
    title, scripture, trav = m['title'], m['scripture'], m.get('traveler') or ''
    chap = re.match(r'^(.*?\d+)', scripture); chap = chap.group(1) if chap else scripture
    book_name = re.sub(r'\s*\d.*$', '', scripture).strip()
    yt_title, yt_desc, yt_tags = build_metadata(m)
    hook = first_sentences(m.get('story_text', ''), 1)
    site = 'https://www.littlescripturetravelers.com/tonight.html'
    amazon = m.get('amazon') or ''
    book_line = f"📖 {m['book_title']}, our {m['month']} book: {amazon}" if amazon else ''
    app_line = f"📱 Every night's story in the Little Scripture Travelers app: {m['app']}"
    year = m['date'][:4]

    short_title = f"{title} | Bible Story for Kids ({chap}) #Shorts"
    if len(short_title) > 100: short_title = f"{title} | Bible Story for Kids #Shorts"
    insta = '\n\n'.join(x for x in [
        f"Bedtime Bible story for kids: {title} 💛 ({scripture})",
        hook,
        "Read along together tonight. The pages turn as the story is read, with bedtime questions at the end.",
        f"Little Scripture Travelers: a story a day that lines up with Come, Follow Me. Full read-along, the app and the {m['month']} paperback: link in bio.",
        f"#ComeFollowMe #ComeFollowMeForKids #BibleStoriesForKids #BedtimeStory #LDSKids #FamilyHomeEvening #ChristianMom #LittleScriptureTravelers",
    ] if x)
    fb = '\n\n'.join(x for x in [
        f"Tonight's bedtime scripture story for kids: {title} ({scripture}) 💛",
        hook + " Read along with your little ones, then answer the bedtime questions together.",
        "It goes along with Come, Follow Me, one story for every day.",
        book_line, app_line,
        "#ComeFollowMe #BibleStoriesForKids #BedtimeStory",
    ] if x)
    tiktok = f"Bible story for kids at bedtime: {title} 💛 {chap} for little ones, a Come Follow Me story a day. Full read-along in bio.\n\n#ComeFollowMe #BibleStoriesForKids #BedtimeStory #ChristianMom #LittleScriptureTravelers"
    pin_title = f"{chap} Bible Story for Kids: {title} (Come Follow Me)"
    if len(pin_title) > 100: pin_title = f"{title}: Bible Story for Kids"
    pin_desc = (f"A read-aloud bedtime Bible story for kids ages 3–8 from {scripture}. {hook} "
                f"Includes a calming feelings activity and bedtime questions. A simple Come Follow Me for kids idea for {year} "
                f"and family home evening. From Little Scripture Travelers, the {m['book_title']} book.")
    posts = {
        'date': m['date'], 'slug': slug, 'title': title, 'scripture': scripture, 'traveler': trav,
        'media': {'full': f'{base}/{slug}.mp4', 'reel': f'{base}/{slug}-reel.mp4',
                  'reel_cover': f'{base}/{slug}-reel-cover.jpg', 'thumb': f'{base}/{slug}-thumb.jpg'},
        'times_mountain': {'reel': '10:00', 'youtube': '16:00', 'pinterest': '20:30'},
        'youtube_full': {'title': yt_title, 'description': yt_desc, 'tags': yt_tags, 'madeForKids': True, 'category': 'EDUCATION'},
        'youtube_short': {'title': short_title, 'description': f"{hook} Full read-along on our channel.\n#ComeFollowMe #BibleStoriesForKids #Shorts",
                          'tags': [f'{chap} for kids', 'bible story for kids', 'come follow me for kids', 'bedtime story', 'Little Scripture Travelers'],
                          'madeForKids': True, 'category': 'EDUCATION'},
        'instagram': {'text': insta, 'alt': f"Illustrated children's picture book page for the Bible story {title}, {scripture}, read aloud with captions. Bible bedtime story for kids.",
                      'first_comment': f"Bedtime question for your little one: what was your favorite part of {title}? 💛"},
        'facebook': {'text': fb, 'title': f"{title} | Bedtime Bible Story for Kids"},
        'tiktok': {'text': tiktok, 'title': f"{title}: Bible story for kids ({chap})"[:90]},
        'pinterest': {'title': pin_title, 'text': pin_desc, 'link': site, 'board': 'Bible Bedtime Stories for Kids',
                      'alt': f"Animated children's picture book page for the Bible story {title}, {scripture}, read aloud with captions."},
    }
    os.makedirs(os.path.join(HERE, 'posts'), exist_ok=True)
    p = os.path.join(HERE, 'posts', f"{m['date']}.json")
    json.dump(posts, open(p, 'w'), indent=1, ensure_ascii=False)
    print('wrote', p)

if __name__ == '__main__':
    main()
