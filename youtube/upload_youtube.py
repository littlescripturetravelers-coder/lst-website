#!/usr/bin/env python3
"""
Uploads the day's read-along video (made by readalong.py) to the Little Scripture Travelers YouTube channel.

Needs three repo secrets (see youtube/README.md, "One-time YouTube setup"):
  YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN
Optional: YT_PLAYLIST_ID (each video is also added to that playlist).

Every video is marked "made for kids" (children's content must be, by YouTube's rules and COPPA).
youtube/published.json records each upload by slug, so a night is never uploaded twice.
"""
import json, os, sys, time, re

HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.join(HERE, 'published.json')

def log(*a): print('[upload]', *a, flush=True)

def first_sentences(text, n=2):
    s = re.split(r'(?<=[.!?])\s+|(?<=[.!?][”"’])\s+', text.strip())
    return ' '.join(s[:n])

def build_metadata(m):
    title = f"{m['title']} | Bedtime Scripture Story for Kids | {m['scripture']}"
    if len(title) > 100: title = f"{m['title']} | Bedtime Scripture Story | {m['scripture']}"
    if len(title) > 100: title = m['title'][:100]
    lines = [f"{m['title']}: a bedtime scripture story for kids from {m['scripture']}.", '',
             first_sentences(m.get('story_text', '')), '']
    if m.get('traveler'): lines += [f"Tonight's Scripture Traveler: {m['traveler']}.", '']
    lines += ["Read along as the pages turn, then answer the bedtime questions together.", '']
    if len(m.get('chapters') or []) >= 3: lines += list(m['chapters']) + ['']
    if m.get('amazon'):
        lines.append(f"📖 {m['book_title']} paperback ({m['month']} book), a story a day that lines up with Come, Follow Me: {m['amazon']}")
    lines += [f"📱 Read every story in the Little Scripture Travelers app: {m['app']}",
              f"🌙 Website: {m['site']}", '',
              "👍 If you enjoyed tonight's story, please like, share, and subscribe for more bedtime scripture stories!", '',
              '#ComeFollowMe #BedtimeStories #BibleStoriesForKids']
    book_name = re.sub(r'\s*\d.*$', '', m['scripture']).strip()
    chap = re.match(r'^(.*?\d+)', m['scripture']); chap = chap.group(1) if chap else book_name
    tags = ['Little Scripture Travelers', 'bedtime stories', 'bible stories for kids', 'scripture stories for kids',
            'come follow me', 'come follow me for kids', 'kids bible story', 'bedtime story', 'read aloud',
            'christian kids', 'LDS kids', f'{chap} for kids', f"come follow me {m['date'][:4]}", 'family home evening',
            'christian bedtime story', m['title'], m['book_title'], book_name]
    tags = [t for i, t in enumerate(tags) if t and t not in tags[:i]]
    while sum(len(t) + 2 for t in tags) > 480: tags.pop()
    return title, '\n'.join(lines), tags

def main():
    slug = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'out')
    privacy = os.environ.get('YT_PRIVACY', 'public').strip() or 'public'
    pub = json.load(open(PUB)) if os.path.exists(PUB) else {}
    if slug in pub: log(slug, 'already on YouTube:', pub[slug].get('url')); return 0
    need = ['YT_CLIENT_ID', 'YT_CLIENT_SECRET', 'YT_REFRESH_TOKEN']
    missing = [k for k in need if not os.environ.get(k, '').strip()]
    if missing:
        log('YouTube is not connected yet (missing secrets:', ', '.join(missing) + ') - the video was made but not uploaded.')
        return 4
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    from googleapiclient.errors import HttpError
    creds = Credentials(None, refresh_token=os.environ['YT_REFRESH_TOKEN'].strip(), token_uri='https://oauth2.googleapis.com/token',
                        client_id=os.environ['YT_CLIENT_ID'].strip(), client_secret=os.environ['YT_CLIENT_SECRET'].strip(),
                        scopes=['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube'])
    yt = build('youtube', 'v3', credentials=creds, cache_discovery=False)
    m = json.load(open(os.path.join(out, f'{slug}-meta.json'), encoding='utf-8'))
    title, desc, tags = build_metadata(m)
    body = {'snippet': {'title': title, 'description': desc, 'tags': tags, 'categoryId': '27',
                        'defaultLanguage': 'en', 'defaultAudioLanguage': 'en'},
            'status': {'privacyStatus': privacy, 'selfDeclaredMadeForKids': True, 'embeddable': True, 'license': 'youtube'}}
    media = MediaFileUpload(os.path.join(out, f'{slug}.mp4'), mimetype='video/mp4', chunksize=8 * 1024 * 1024, resumable=True)
    req = yt.videos().insert(part='snippet,status', body=body, media_body=media)
    resp = None; tries = 0
    while resp is None:
        try:
            status, resp = req.next_chunk()
            if status: log(f'uploaded {int(status.progress() * 100)}%')
        except HttpError as e:
            if e.resp.status in (500, 502, 503, 504) and tries < 6:
                tries += 1; time.sleep(2 ** tries); continue
            raise
    vid = resp['id']; url = f'https://youtu.be/{vid}'; log('uploaded:', url, privacy)
    thumb = os.path.join(out, f'{slug}-thumb.jpg')
    if os.path.exists(thumb):
        try: yt.thumbnails().set(videoId=vid, media_body=MediaFileUpload(thumb, mimetype='image/jpeg')).execute(); log('thumbnail set')
        except HttpError as e: log('thumbnail not set (the channel may need phone verification for custom thumbnails):', e.resp.status)
    pl = os.environ.get('YT_PLAYLIST_ID', '').strip()
    if pl:
        try:
            yt.playlistItems().insert(part='snippet', body={'snippet': {'playlistId': pl, 'resourceId': {'kind': 'youtube#video', 'videoId': vid}}}).execute()
            log('added to playlist', pl)
        except HttpError as e: log('playlist add failed:', e.resp.status)
    pub[slug] = {'videoId': vid, 'url': url, 'date': m['date'], 'title': m['title'], 'privacy': privacy}
    json.dump(pub, open(PUB, 'w'), indent=1, ensure_ascii=False)
    gh = os.environ.get('GITHUB_STEP_SUMMARY')
    if gh: open(gh, 'a').write(f'### Uploaded to YouTube\n[{m["title"]}]({url}) ({privacy})\n')
    return 0

if __name__ == '__main__':
    sys.exit(main())
