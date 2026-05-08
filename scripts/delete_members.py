"""
Delete every member (and their memberships) from the running Tendon Fitness app.

Usage:
    # start the dev server first (npm run dev)
    python scripts/delete_members.py
    python scripts/delete_members.py --base-url http://localhost:3000 --yes
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request


def http_json(url: str, method: str = "GET", payload: dict | None = None) -> dict | list:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {"Content-Type": "application/json"} if data else {}
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = resp.read().decode("utf-8")
        return json.loads(body) if body else {}


def main() -> int:
    p = argparse.ArgumentParser(description="Delete all Tendon Fitness members.")
    p.add_argument("--base-url", default="http://localhost:3000", help="app base URL")
    p.add_argument("--yes", action="store_true", help="skip confirmation prompt")
    args = p.parse_args()

    base = args.base_url.rstrip("/")

    try:
        members = http_json(f"{base}/api/members")
        memberships = http_json(f"{base}/api/memberships")
    except urllib.error.URLError as e:
        print(f"❌  Could not reach {base} — is the dev server running? ({e})")
        return 1

    if not isinstance(members, list):
        print(f"❌  Unexpected response from /api/members: {members!r}")
        return 1

    if not members:
        print("Nothing to delete — no members found.")
        return 0

    print(f"→ Found {len(members)} members and {len(memberships) if isinstance(memberships, list) else 0} memberships.")

    if not args.yes:
        ans = input("Delete ALL of them? Type 'yes' to confirm: ").strip().lower()
        if ans != "yes":
            print("Aborted.")
            return 0

    deleted_memberships = 0
    failed_memberships = 0
    if isinstance(memberships, list):
        for m in memberships:
            mid = m.get("id") or m.get("_id")
            if not mid:
                continue
            try:
                http_json(f"{base}/api/memberships/{mid}", "DELETE")
                deleted_memberships += 1
            except urllib.error.HTTPError as e:
                failed_memberships += 1
                print(f"  ✗ membership {mid}: {e.code} {e.read().decode('utf-8', 'ignore')[:120]}")
            except urllib.error.URLError as e:
                failed_memberships += 1
                print(f"  ✗ membership {mid}: {e}")

    deleted_members = 0
    failed_members = 0
    for member in members:
        mid = member.get("id") or member.get("_id")
        name = member.get("name", "?")
        if not mid:
            continue
        try:
            http_json(f"{base}/api/members/{mid}", "DELETE")
            deleted_members += 1
            if deleted_members % 10 == 0:
                print(f"  ✓ {deleted_members}/{len(members)}")
        except urllib.error.HTTPError as e:
            failed_members += 1
            print(f"  ✗ member {name} ({mid}): {e.code} {e.read().decode('utf-8', 'ignore')[:120]}")
        except urllib.error.URLError as e:
            failed_members += 1
            print(f"  ✗ member {name} ({mid}): {e}")

    print(
        f"\nDone. Deleted {deleted_members} members ({failed_members} failed) "
        f"and {deleted_memberships} memberships ({failed_memberships} failed)."
    )
    return 0 if (failed_members == 0 and failed_memberships == 0) else 2


if __name__ == "__main__":
    sys.exit(main())
