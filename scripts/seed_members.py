"""
Seed 130 random members + memberships against the running Tendon Fitness app.

All members get phone = 9600309140 (per request).
Each member is assigned one membership using one of the existing plans
(fetched live from /api/plans), with a randomized start date so the
resulting set spans expired, expiring-soon, and healthy memberships.

Usage:
    # start the dev server first (npm run dev)
    python scripts/seed_members.py
    python scripts/seed_members.py --count 50 --base-url http://localhost:3000
"""

from __future__ import annotations

import argparse
import json
import random
import sys
import urllib.error
import urllib.request
from datetime import date, timedelta

PHONE = "9600309140"

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna",
    "Ishaan", "Shaurya", "Atharv", "Kabir", "Anaya", "Aadhya", "Ananya", "Pari",
    "Diya", "Myra", "Saanvi", "Ira", "Riya", "Kiara", "Priya", "Neha",
    "Rohan", "Karan", "Yash", "Dev", "Manav", "Veer", "Ayaan", "Aryan",
    "Tara", "Meera", "Aisha", "Zara", "Naina", "Sara", "Ishita", "Mira",
    "Rahul", "Vikram", "Siddharth", "Nikhil", "Aniket", "Harsh", "Pranav", "Tanmay",
    "Lakshmi", "Pooja", "Divya", "Shreya", "Anjali", "Kavya", "Sneha", "Tanvi",
]

LAST_NAMES = [
    "Sharma", "Verma", "Iyer", "Nair", "Reddy", "Kumar", "Singh", "Patel",
    "Gupta", "Mehta", "Desai", "Jain", "Khanna", "Rao", "Bose", "Banerjee",
    "Chatterjee", "Mishra", "Pandey", "Yadav", "Joshi", "Pillai", "Menon", "Kapoor",
    "Malhotra", "Shetty", "Bhat", "Naidu", "Saxena", "Tripathi",
]


def http_json(url: str, method: str = "GET", payload: dict | None = None) -> dict | list:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {"Content-Type": "application/json"} if data else {}
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def membership_id() -> str:
    return f"TF-{random.randint(10000, 99999)}"


def random_email(name: str, idx: int) -> str:
    slug = name.lower().replace(" ", ".").replace("'", "")
    return f"{slug}{idx}@example.com"


def add_months(d: date, months: int) -> date:
    """Match JS `Date.setMonth(getMonth() + months)` semantics well enough."""
    month_idx = d.month - 1 + months
    year = d.year + month_idx // 12
    month = month_idx % 12 + 1
    # clamp day to month length
    day = min(d.day, [31, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28,
                       31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1])
    return date(year, month, day)


def main() -> int:
    p = argparse.ArgumentParser(description="Seed Tendon Fitness with random members.")
    p.add_argument("--count", type=int, default=130, help="number of members to create")
    p.add_argument("--base-url", default="http://localhost:3000", help="app base URL")
    p.add_argument("--seed", type=int, default=None, help="random seed for reproducibility")
    args = p.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    base = args.base_url.rstrip("/")

    # Fetch plans from the running app — we need real plan IDs.
    try:
        plans = http_json(f"{base}/api/plans")
    except urllib.error.URLError as e:
        print(f"❌  Could not reach {base}/api/plans — is the dev server running? ({e})")
        return 1

    if not plans:
        print("❌  No plans exist yet. Create at least one plan in the UI before seeding.")
        return 1

    print(f"→ Found {len(plans)} plans. Seeding {args.count} members…")

    today = date.today()
    used_membership_ids: set[str] = set()
    used_emails: set[str] = set()

    # Distribute start dates so we get a healthy mix:
    #   ~15% already-expired, ~15% expiring within 7 days, rest healthy/active
    def pick_start_date(months: int) -> date:
        bucket = random.random()
        if bucket < 0.15:
            # ended 1–60 days ago → start = end - duration
            days_past = random.randint(1, 60)
            end = today - timedelta(days=days_past)
            return add_months(end, -months)
        if bucket < 0.30:
            # ends in 0–7 days
            days_left = random.randint(0, 7)
            end = today + timedelta(days=days_left)
            return add_months(end, -months)
        # ends comfortably in the future (8–{months*30} days out)
        max_days = max(months * 30 - 7, 14)
        days_left = random.randint(8, max_days)
        end = today + timedelta(days=days_left)
        return add_months(end, -months)

    created = 0
    failures = 0

    for i in range(args.count):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        name = f"{first} {last}"

        # Unique-ish email
        email = random_email(name, i)
        while email in used_emails:
            i += 1
            email = random_email(name, i)
        used_emails.add(email)

        mid = membership_id()
        while mid in used_membership_ids:
            mid = membership_id()
        used_membership_ids.add(mid)

        plan = random.choice(plans)
        months = int(plan["durationMonths"])
        start = pick_start_date(months)
        end = add_months(start, months)

        member_payload = {
            "name": name,
            "email": email,
            "phone": PHONE,
            "photo": "",
            "membershipId": mid,
            "lastVisit": today.isoformat(),
            "attendance": random.randint(0, 80),
            "streak": random.randint(0, 30),
            "createdAt": start.isoformat(),
        }

        try:
            member = http_json(f"{base}/api/members", "POST", member_payload)
        except urllib.error.HTTPError as e:
            failures += 1
            print(f"  ✗ member {i + 1} ({name}): {e.code} {e.read().decode('utf-8', 'ignore')[:120]}")
            continue
        except urllib.error.URLError as e:
            failures += 1
            print(f"  ✗ member {i + 1} ({name}): {e}")
            continue

        membership_payload = {
            "memberId": member["id"],
            "planId": plan["id"],
            "startDate": start.isoformat(),
            "endDate": end.isoformat(),
        }

        try:
            http_json(f"{base}/api/memberships", "POST", membership_payload)
        except urllib.error.HTTPError as e:
            failures += 1
            print(f"  ✗ membership for {name}: {e.code} {e.read().decode('utf-8', 'ignore')[:120]}")
            continue

        created += 1
        if created % 10 == 0:
            print(f"  ✓ {created}/{args.count}")

    print(f"\nDone. Created {created} members + memberships, {failures} failures.")
    return 0 if failures == 0 else 2


if __name__ == "__main__":
    sys.exit(main())
