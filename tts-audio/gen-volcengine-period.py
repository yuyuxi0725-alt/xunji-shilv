#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Batch-generate one story period with a Volcengine/Doubao cloned voice."""
import argparse
import copy
import json
import os
import sys
import time
import uuid
from pathlib import Path
import re

import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

SUBMIT_URL = "https://openspeech.bytedance.com/api/v3/tts/submit"
QUERY_URL = "https://openspeech.bytedance.com/api/v3/tts/query"

def read_json(path):
    with Path(path).open("r", encoding="utf-8") as f:
        return json.load(f)

def read_emotion_plan(path):
    """Load optional per-node TTS directions generated for a manifest.

    Location manifests reuse node IDs across locations, so their lookup key is
    ``location/node``.  Legacy period plans continue to use just ``node``.
    The full entry is retained because location plans may also provide cleaned
    spoken text and a skip marker for action-only/non-character nodes.
    """
    if not path:
        return {}
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"emotion plan not found: {path}")
    payload = read_json(path)
    entries = payload.get("plan", payload) if isinstance(payload, dict) else payload
    if not isinstance(entries, list):
        raise ValueError(f"emotion plan must contain a 'plan' list: {path}")
    result = {}
    for entry in entries:
        if not isinstance(entry, dict) or not entry.get("nodeId"):
            continue
        location_id = entry.get("audioQuestId") or entry.get("locationId")
        key = f"{location_id}/{entry['nodeId']}" if location_id else entry["nodeId"]
        result[key] = entry
    return result

def plan_entry_for(item, emotion_plan):
    location_id = item.get("audioQuestId") or item.get("locationId")
    if location_id:
        entry = emotion_plan.get(f"{location_id}/{item['nodeId']}")
        if entry:
            return entry
    return emotion_plan.get(item["nodeId"], {})

def profile_for_item(profiles, manifest, item):
    character = manifest.get("character") or manifest.get("lineId") or item.get("lineId")
    period = manifest.get("period") or item.get("periodId")
    if character and period:
        key = f"{character}-{period}"
    else:
        location_id = item.get("audioQuestId") or item.get("locationId")
        key = ((profiles.get("_locationProfileMap") or {}).get(character) or {}).get(location_id)
    if not key or key not in profiles:
        raise KeyError(
            f"no voice profile for {character or 'unknown'}/"
            f"{period or item.get('audioQuestId') or item.get('locationId') or 'unknown'}"
        )
    return profiles[key]

def compose_style_prompt(profile, node_prompt):
    """Combine a period-wide voice direction with the node emotion direction."""
    parts = [
        str(profile.get("stylePrompt") or "").strip(),
        str(node_prompt or "").strip(),
    ]
    return " ".join(part for part in parts if part)

def clean_tts_text(text):
    """Remove stage directions in parentheses before sending text to TTS."""
    text = re.sub(r'（[^）]*）', '', text)
    text = re.sub(r'\([^)]*\)', '', text)
    # 在本期语境中“中式”意为“考中”，改写为单一读音，避免多音字误读。
    text = text.replace('中式', '考中')
    return text.strip()

def headers(api_key, request_id, resource_id):
    return {
        "Content-Type": "application/json",
        "X-Api-Key": api_key,
        "X-Api-Resource-Id": os.getenv("VOLCENGINE_RESOURCE_ID", resource_id),
        "X-Api-Request-Id": request_id,
    }

def ensure_api_success(data, response, operation):
    code = str(data.get("code", ""))
    if code not in ("0", "200", "20000000"):
        log_id = response.headers.get("X-Tt-Logid", "unknown")
        message = data.get("message", "unknown error")
        raise RuntimeError(
            f"{operation} failed: code={code or 'missing'} message={message} "
            f"logid={log_id}"
        )

def submit(session, api_key, item, profile, timeout, plan_entry=None, speech_rate_override=None):
    override = (profile.get("nodeOverrides") or {}).get(item["nodeId"], {})
    audio = dict(profile.get("audio", {}))
    audio.update(override.get("audio", {}))
    if speech_rate_override is not None:
        audio["speech_rate"] = speech_rate_override
    model = override.get("model", profile.get("model", "seed-tts-2.0-standard"))
    voice_id = override.get("voiceId", profile["voiceId"])
    req_params = {
        "text": clean_tts_text((plan_entry or {}).get("ttsText") or item["text"]),
        "model": model,
        "speaker": voice_id,
        "audio_params": audio
    }
    additions = override.get("additions", profile.get("additions"))
    if additions:
        additions = copy.deepcopy(additions)
    emotion_prompt = compose_style_prompt(
        profile,
        (plan_entry or {}).get("emotionPrompt"),
    )
    if emotion_prompt and speech_rate_override is not None:
        emotion_prompt = (
            f"本次试听语速以{speech_rate_override}为基准，保持自然流畅，不拖沓。"
            + emotion_prompt
        )
    if emotion_prompt:
        # context_texts is carried inside the additions JSON string. The
        # service currently uses only the first context instruction.
        additions = additions or {}
        additions["context_texts"] = [emotion_prompt]
    if additions:
        req_params["additions"] = json.dumps(additions, ensure_ascii=False, separators=(",", ":"))
    uid_line = item.get("character") or item.get("lineId") or "tts"
    uid_quest = item.get("period") or item.get("periodId") or item.get("audioQuestId") or "story"
    req = {"user": {"uid": f"{uid_line}-{uid_quest}"},
           "unique_id": str(uuid.uuid4()),
           "req_params": req_params}
    resource_id = profile.get("resourceId", "seed-icl-2.0")
    r = session.post(
        SUBMIT_URL,
        headers=headers(api_key, str(uuid.uuid4()), resource_id),
        json=req,
        timeout=timeout,
    )
    if r.status_code >= 400:
        raise RuntimeError(f"HTTP {r.status_code}: {r.text[:1000]}")
    data = r.json()
    ensure_api_success(data, r, "submit")
    body = data.get("data") if isinstance(data.get("data"), dict) else data
    task_id = (body.get("task_id") or body.get("taskId") or body.get("id")
               or data.get("task_id") or data.get("taskId") or data.get("id"))
    if not task_id:
        raise RuntimeError(f"submit returned no task id: {data}")
    return task_id

def query(session, api_key, task_id, profile, timeout):
    resource_id = profile.get("resourceId", "seed-icl-2.0")
    r = session.post(
        QUERY_URL,
        headers=headers(api_key, str(uuid.uuid4()), resource_id),
        json={"task_id": task_id},
        timeout=timeout,
    )
    if r.status_code >= 400:
        raise RuntimeError(f"HTTP {r.status_code}: {r.text[:1000]}")
    data = r.json()
    ensure_api_success(data, r, "query")
    return data

def find_url(data):
    for key in ("audio_url", "audioUrl", "url"):
        if data.get(key): return data[key]
    for key in ("data", "result", "task_result"):
        if isinstance(data.get(key), dict):
            found = find_url(data[key])
            if found: return found
    return None

def get_status(data):
    value = data.get("status") or data.get("task_status") or data.get("state")
    if isinstance(data.get("data"), dict):
        value = value or data["data"].get("status") or data["data"].get("task_status")
    return str(value or "").lower()

def generate_one(session, api_key, item, profile, out_path, args, plan_entry=None):
    if out_path.exists() and out_path.stat().st_size > 2000 and not args.overwrite:
        print(f"SKIP {item['nodeId']} (exists)")
        return
    task_id = submit(
        session, api_key, item, profile, args.timeout, plan_entry,
        args.speech_rate,
    )
    print(f"SUBMIT {item['nodeId']} task={task_id}")
    deadline = time.time() + args.max_wait
    url = None
    while time.time() < deadline:
        data = query(session, api_key, task_id, profile, args.timeout)
        url = find_url(data)
        if url: break
        current = get_status(data)
        print(f"POLL   {item['nodeId']} status={current or 'running'} response={data}", flush=True)
        if current in {"failed", "error", "canceled", "cancelled", "3", "failure"}:
            raise RuntimeError(f"task failed: {data}")
        time.sleep(args.poll)
    if not url: raise TimeoutError(f"task {task_id} timed out")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with session.get(url, timeout=args.timeout, stream=True) as r:
        if r.status_code >= 400:
            raise RuntimeError(f"download HTTP {r.status_code}: {r.text[:300]}")
        with out_path.open("wb") as f:
            for chunk in r.iter_content(65536):
                if chunk: f.write(chunk)
    if out_path.stat().st_size <= 2000: raise RuntimeError(f"file too small: {out_path}")
    print(f"OK     {item['nodeId']} -> {out_path}")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", required=True, type=Path)
    ap.add_argument("--profile", default=Path("tts-audio/voice-profiles.json"), type=Path)
    ap.add_argument("--out", default=Path("tts-audio/output"), type=Path)
    ap.add_argument("--overwrite", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--poll", type=float, default=2.0)
    ap.add_argument("--max-wait", type=int, default=300)
    ap.add_argument("--timeout", type=int, default=60)
    ap.add_argument("--limit", type=int, default=0, help="only process the first N items")
    ap.add_argument("--nodes", default="",
                    help="comma-separated node IDs or location/node IDs, for example n8,taishan/n11a")
    ap.add_argument("--locations", default="",
                    help="comma-separated location IDs to process for a location manifest")
    ap.add_argument("--emotion-plan", type=Path, default=None,
                    help="optional JSON file containing per-node TTS directions; default auto-discovers <manifest>-emotion-plan.json")
    ap.add_argument("--no-emotion-plan", action="store_true",
                    help="do not auto-load or apply an emotion plan")
    ap.add_argument("--speech-rate", type=int, default=None,
                    help="temporary per-request speech_rate override; does not modify voice-profiles.json")
    ap.add_argument("--use-env-proxy", action="store_true",
                    help="use HTTP(S)_PROXY from the environment; default bypasses system proxy")
    args = ap.parse_args()
    manifest = read_json(args.manifest)
    profiles = read_json(args.profile)
    emotion_plan_path = None
    if not args.no_emotion_plan:
        emotion_plan_path = args.emotion_plan
        if emotion_plan_path is None:
            candidate = args.manifest.with_name(f"{args.manifest.stem}-emotion-plan.json")
            if candidate.exists():
                emotion_plan_path = candidate
    emotion_plan = read_emotion_plan(emotion_plan_path) if emotion_plan_path else {}
    if emotion_plan_path:
        print(f"EMOTION PLAN: {emotion_plan_path}")
    items = manifest["items"]
    if args.locations:
        requested_locations = {value.strip() for value in args.locations.split(",") if value.strip()}
        available_locations = {
            item.get("audioQuestId") or item.get("locationId") for item in items
        }
        missing_locations = sorted(requested_locations - available_locations)
        if missing_locations:
            raise SystemExit(f"Unknown location ID(s): {', '.join(missing_locations)}")
        items = [
            item for item in items
            if (item.get("audioQuestId") or item.get("locationId")) in requested_locations
        ]
    if args.nodes:
        requested_nodes = [node.strip() for node in args.nodes.split(",") if node.strip()]
        def item_labels(item):
            location_id = item.get("audioQuestId") or item.get("locationId")
            labels = {item["nodeId"]}
            if location_id:
                labels.add(f"{location_id}/{item['nodeId']}")
            return labels
        matched = {
            node for node in requested_nodes
            if any(node in item_labels(item) for item in items)
        }
        missing_nodes = [node for node in requested_nodes if node not in matched]
        if missing_nodes:
            raise SystemExit(f"Unknown node ID(s): {', '.join(missing_nodes)}")
        requested_set = set(requested_nodes)
        items = [item for item in items if item_labels(item) & requested_set]
    if args.limit:
        items = items[:args.limit]
    prepared = []
    for item in items:
        entry = plan_entry_for(item, emotion_plan)
        location_id = item.get("audioQuestId") or item.get("locationId")
        label = f"{location_id}/{item['nodeId']}" if location_id else item["nodeId"]
        if entry.get("skipTts"):
            print(f"SKIP   {label}: {entry.get('skipReason') or 'marked skipTts'}")
            continue
        profile = profile_for_item(profiles, manifest, item)
        spoken_text = entry.get("ttsText") or item["text"]
        print(f"{label}: {spoken_text}")
        effective_prompt = compose_style_prompt(
            profile,
            entry.get("emotionPrompt"),
        )
        if effective_prompt:
            print(f"EMOTION {label}: {effective_prompt}")
        prepared.append((item, profile, entry))
    if args.dry_run: return
    api_key = os.getenv("VOLCENGINE_API_KEY")
    if not api_key: raise SystemExit("Set VOLCENGINE_API_KEY first; no audio was generated.")
    if not api_key.isascii():
        bad = [c for c in api_key if not c.isascii()]
        raise SystemExit(
            "VOLCENGINE_API_KEY 含非 ASCII 字符（如中文引号、全角符号或空格），"
            f"共 {len(bad)} 个：{bad!r}。请重新复制纯英文 Key，"
            "注意不要带引号或多余空格。"
        )
    session = requests.Session()
    # Some Windows/Python installations inject a stale proxy which causes
    # SSLEOFError against openspeech.bytedance.com. Direct is the default;
    # opt in to the configured proxy when the network requires it.
    session.trust_env = args.use_env_proxy
    failures = 0
    for item, profile, entry in prepared:
        try:
            character = manifest.get("character") or manifest.get("lineId") or item.get("lineId")
            quest_id = manifest.get("period") or item.get("periodId") or item.get("audioQuestId")
            target = args.out / character / quest_id
            generate_one(
                session, api_key, item, profile, target / item["fileName"], args,
                entry,
            )
        except Exception as exc:
            failures += 1
            print(f"FAIL   {item['nodeId']}: {exc}", file=sys.stderr)
    if failures: raise SystemExit(f"Finished with {failures} failed item(s). Re-run to retry.")

if __name__ == "__main__": main()
