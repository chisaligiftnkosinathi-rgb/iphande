"""Verify Railway deployment and new API fields after Visibility Engine V1 deploy."""
import urllib.request
import json

BASE = 'https://iphande-production.up.railway.app/api/v1'

slugs = [
    'global-it-and-business-solutions-pty-ltd',
    'antigravity-tech',
]

for slug in slugs:
    print(f'=== GET /public/{slug} ===')
    try:
        with urllib.request.urlopen(f'{BASE}/public/{slug}') as r:
            d = json.load(r)
            status = r.status if hasattr(r, 'status') else 200
            print(f'STATUS: {status} OK')
            for key in ['availability', 'province', 'city', 'suburb', 'proof_of_work_items', 'whatsapp_number', 'business_line']:
                print(f'  {key}: {repr(d.get(key))}')
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f'STATUS: {e.code}')
        print(f'  BODY: {body[:300]}')
    except Exception as ex:
        print(f'ERROR: {ex}')
    print()

print('=== HEALTH CHECK ===')
try:
    root = BASE.replace('/api/v1', '')
    with urllib.request.urlopen(f'{root}/health') as r:
        print(f'STATUS: {r.status if hasattr(r, "status") else 200} OK')
        print(f'  BODY: {r.read().decode()[:100]}')
except Exception as ex:
    try:
        with urllib.request.urlopen(f'{BASE}/health') as r:
            print(f'STATUS: OK - {r.read().decode()[:100]}')
    except Exception as ex2:
        print(f'Health endpoint: {ex2}')
