import sys
import uuid
from pathlib import Path
import pandas as pd

# Ensure the script can import from the src directory
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from src.database import SessionLocal
from src.models.place import Place

RAW_DIR = BASE_DIR / "data" / "raw" / "stats_sa"
PROCESSED_DIR = BASE_DIR / "data" / "processed" / "stats_sa"

def run_import():
    MAIN_PLACE_FILE = RAW_DIR / "MainPlaceLookupTable.xls"
    SUB_PLACE_FILE = RAW_DIR / "SubPlaceLookupTable.xls"

    if not MAIN_PLACE_FILE.exists() or not SUB_PLACE_FILE.exists():
        print(f"Error: Missing raw Excel files in {RAW_DIR}")
        print("Please ensure MainPlaceLookupTable.xls and SubPlaceLookupTable.xls exist.")
        return

    print("Loading Excel files (this may take a moment)...")
    # We load as string to prevent Pandas from turning codes like '10109002' into floats/ints
    df_main = pd.read_excel(MAIN_PLACE_FILE, dtype=str)
    df_sub = pd.read_excel(SUB_PLACE_FILE, dtype=str)

    # Combine to extract higher-level hierarchies universally
    df_all = pd.concat([df_main, df_sub], ignore_index=True)

    places_to_insert = {}

    print("Extracting Provinces...")
    provinces = df_all[['PR_CODE', 'PR_NAME']].drop_duplicates().dropna()
    for _, row in provinces.iterrows():
        code = row['PR_CODE']
        place_code = f"province:{code}"
        places_to_insert[place_code] = Place(
            id=str(uuid.uuid4()),
            place_code=place_code,
            parent_place_code=None,
            name=row['PR_NAME'],
            level="province",
            province_code=code,
            province_name=row['PR_NAME']
        )

    print("Extracting Districts...")
    districts = df_all[['DC_MN_C', 'DC_NAME', 'PR_CODE', 'PR_NAME']].drop_duplicates().dropna(subset=['DC_MN_C'])
    for _, row in districts.iterrows():
        code = row['DC_MN_C']
        place_code = f"district:{code}"
        parent_place_code = f"province:{row['PR_CODE']}"
        places_to_insert[place_code] = Place(
            id=str(uuid.uuid4()),
            place_code=place_code,
            parent_place_code=parent_place_code,
            name=row['DC_NAME'],
            level="district",
            province_code=row['PR_CODE'],
            province_name=row['PR_NAME'],
            district_code=code,
            district_name=row['DC_NAME']
        )

    print("Extracting Municipalities...")
    munis = df_all[['MN_CODE', 'MN_NAME', 'DC_MN_C', 'DC_NAME', 'PR_CODE', 'PR_NAME']].drop_duplicates().dropna(subset=['MN_CODE'])
    for _, row in munis.iterrows():
        code = row['MN_CODE']
        place_code = f"municipality:{code}"
        parent_place_code = f"district:{row['DC_MN_C']}"
        places_to_insert[place_code] = Place(
            id=str(uuid.uuid4()),
            place_code=place_code,
            parent_place_code=parent_place_code,
            name=row['MN_NAME'],
            level="municipality",
            province_code=row['PR_CODE'],
            province_name=row['PR_NAME'],
            district_code=row['DC_MN_C'],
            district_name=row['DC_NAME'],
            municipality_code=code,
            municipality_name=row['MN_NAME']
        )

    print("Extracting Main Places...")
    mains = df_main[['MP_CODE', 'MP_NAME', 'MN_CODE', 'MN_NAME', 'DC_MN_C', 'DC_NAME', 'PR_CODE', 'PR_NAME']].drop_duplicates().dropna(subset=['MP_CODE'])
    for _, row in mains.iterrows():
        code = row['MP_CODE']
        place_code = f"main_place:{code}"
        parent_place_code = f"municipality:{row['MN_CODE']}"
        places_to_insert[place_code] = Place(
            id=str(uuid.uuid4()),
            place_code=place_code,
            parent_place_code=parent_place_code,
            name=row['MP_NAME'],
            level="main_place",
            province_code=row['PR_CODE'],
            province_name=row['PR_NAME'],
            district_code=row['DC_MN_C'],
            district_name=row['DC_NAME'],
            municipality_code=row['MN_CODE'],
            municipality_name=row['MN_NAME']
        )

    print("Extracting Sub Places...")
    subs = df_sub[['SP_CODE', 'SP_NAME', 'MN_CODE', 'MN_NAME', 'DC_MN_C', 'DC_NAME', 'PR_CODE', 'PR_NAME']].drop_duplicates().dropna(subset=['SP_CODE'])
    for _, row in subs.iterrows():
        code = row['SP_CODE']
        # Rule: The first 5 digits of SP_CODE act as the MP_CODE (parent link)
        parent_mp_code = str(code)[:5]
        place_code = f"sub_place:{code}"
        parent_place_code = f"main_place:{parent_mp_code}"

        places_to_insert[place_code] = Place(
            id=str(uuid.uuid4()),
            place_code=place_code,
            parent_place_code=parent_place_code,
            name=row['SP_NAME'],
            level="sub_place",
            province_code=row['PR_CODE'],
            province_name=row['PR_NAME'],
            district_code=row['DC_MN_C'],
            district_name=row['DC_NAME'],
            municipality_code=row['MN_CODE'],
            municipality_name=row['MN_NAME']
        )

    db = SessionLocal()
    try:
        print(f"Clearing old Stats SA data...")
        db.query(Place).filter(Place.source == "stats_sa").delete()
        db.commit()

        print(f"Inserting {len(places_to_insert)} location records...")
        db.bulk_save_objects(list(places_to_insert.values()))
        db.commit()

        print("✅ Stats SA Place Import Complete!")
    except Exception as e:
        db.rollback()
        print(f"❌ Error during DB insertion: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_import()
