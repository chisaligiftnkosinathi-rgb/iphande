import requests

BASE_URL = "http://127.0.0.1:8001/api/v1"

def search_place(q):
    res = requests.get(f"{BASE_URL}/places/search", params={"q": q})
    return res.json().get("results", [])

def migrate_profile(profile):
    old_location = profile.get("city") or profile.get("location")

    if not old_location:
        return None

    matches = search_place(old_location)

    if not matches:
        print(f"NO MATCH: {old_location}")
        return None

    best = matches[0]

    payload = {
        "place_id": best["id"],
        "canonical_name": best["full_name"],
        "province": best["province"],
        "municipality": best["municipality"],
        "lat": best["lat"],
        "lng": best["lng"]
    }

    return payload


def run():
    res = requests.get(f"{BASE_URL}/profiles")
    if res.status_code != 200:
        print(f"Failed to fetch profiles: {res.text}")
        return
        
    profiles = res.json()

    for p in profiles:
        update = migrate_profile(p)

        if update:
            # Note: Changed to PATCH as per the existing endpoint
            patch_res = requests.patch(
                f"{BASE_URL}/profiles/{p['id']}/location",
                json=update
            )
            if patch_res.status_code in [200, 201]:
                print(f"MIGRATED: {p['id']} to {update['canonical_name']}")
            else:
                print(f"FAILED TO PATCH {p['id']}: {patch_res.text}")
        else:
            print(f"SKIPPED: {p['id']}")

if __name__ == "__main__":
    run()
