# -*- coding: utf-8 -*-
"""按剧本台词生成语音包（Edge TTS，免费，无需 API Key）
- 旁白：女声 Xiaoxiao（说书感）
- 杜甫按时期变声：p1 青年 Yunxi / p2 中年 Yunjian / p3 战乱 Yunjian 慢速 / p4 老年 Yunye 慢速
输出：tts-audio/{questId}-{nodeId}.mp3
"""
import asyncio, json, os, re, sys
import edge_tts

BASE = r'C:/Users/lzz/Desktop/寻迹古今/tts-audio'
sys.stdout.reconfigure(encoding='utf-8')

with open(os.path.join(BASE, 'texts.json'), encoding='utf-8') as f:
    items = json.load(f)

NARRATOR = 'zh-CN-XiaoxiaoNeural'
DUFU = {
    'p1': ('zh-CN-YunxiNeural', '+0%'),      # 青年：清亮
    'p2': ('zh-CN-YunjianNeural', '-4%'),    # 中年：低沉沉稳
    'p3': ('zh-CN-YunjianNeural', '-10%'),   # 战乱：更沉、更慢
    'p4': ('zh-CN-YunyeNeural', '-14%')      # 老年：苍老平缓
}
FALLBACK_VOICE = 'zh-CN-YunjianNeural'

def clean(t):
    # 去掉舞台提示（低声）等括号内容，避免被读出来
    t = re.sub(r'（[^）]*）', '', t)
    t = re.sub(r'\([^)]*\)', '', t)
    return t.strip()

async def gen(sem, item):
    qid, nid, typ = item['questId'], item['nodeId'], item['type']
    text = clean(item['text'])
    out = os.path.join(BASE, f'{qid}-{nid}.mp3')
    if not text:
        return (qid, nid, 'skip-empty')
    # 已生成且非空文件直接跳过（幂等，方便补跑失败项）
    if os.path.exists(out) and os.path.getsize(out) > 2000:
        return (qid, nid, 'skip-exists')
    voice, rate = (NARRATOR, '+0%') if typ == 'narrate' else DUFU.get(qid, (FALLBACK_VOICE, '+0%'))
    async with sem:
        for voice_try in (voice, FALLBACK_VOICE):
            for attempt in range(3):
                try:
                    tts = edge_tts.Communicate(text, voice_try, rate=rate)
                    await tts.save(out)
                    return (qid, nid, 'ok')
                except Exception as e:
                    err = repr(e)
                    await asyncio.sleep(1.5)
        print('FAIL', qid, nid, err[:120])
        return (qid, nid, 'fail')

async def main():
    sem = asyncio.Semaphore(4)
    results = await asyncio.gather(*[gen(sem, it) for it in items])
    ok = sum(1 for r in results if r[2] == 'ok')
    fail = sum(1 for r in results if r[2] == 'fail')
    print(f'done: ok={ok} fail={fail} total={len(items)}')

if __name__ == '__main__':
    asyncio.run(main())
