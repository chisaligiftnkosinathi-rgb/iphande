# Diagnostic Lesson: Schema Mismatch Masked as CORS/Auth
**Date:** 2026-06-10
**System Layer:** API / Database / Frontend Gateway

## The Symptom
The mobile application repeatedly threw a `TypeError: Failed to fetch` when attempting to call the authenticated `/api/v1/profiles/me` endpoint. The browser console reported a **CORS policy violation** (`No 'Access-Control-Allow-Origin' header is present`).

## The False Trails
Because the error presented as an authentication and networking failure, hours were spent investigating the wrong layers:

1. **Supabase JWT Algorithms:** We identified that Supabase issues `ES256` tokens instead of Firebase's `RS256`, and implemented a JWKS verifier. (A valid fix, but not the blocker).
2. **Service Account Credentials:** We assumed the backend lacked the credentials to verify the token.
3. **CORS Configuration:** We patched `main.py` with explicit allowed origins (`http://localhost:8081`).

Despite fixing all of these, the "Failed to fetch" and CORS errors persisted.

## The Breakthrough
To isolate the issue, we **temporarily bypassed the authentication dependency** (`get_current_firebase_user`), forcing the API to use a hardcoded mock `owner_id`.

This allowed the request to bypass the JWT verification logic and hit the database query directly. The Railway backend logs immediately revealed the true error:

```text
psycopg2.errors.UndefinedColumn: column profiles.is_public does not exist
```

## The Root Cause
The true failure was a **database schema mismatch**:
1. New columns (like `is_public`) were added to the SQLAlchemy `Profile` model.
2. SQLAlchemy's `Base.metadata.create_all(bind=engine)` creates *new* tables but **does not alter existing tables**.
3. Our startup script included a patcher (`ensure_sqlite_profiles_schema`), but it was explicitly restricted to SQLite and ignored the live PostgreSQL database on Railway.

Because the database query crashed, FastAPI threw a `500 Internal Server Error`. However, when a server crashes, it often fails to append the CORS headers to the error response. **The browser saw the missing CORS headers and reported a CORS error, completely hiding the 500 error from the mobile app.**

## The Solution
We introduced an explicit PostgreSQL schema patcher during the FastAPI startup sequence (`lifespan` event):

```python
def ensure_postgres_profiles_schema():
    if engine.dialect.name != "postgresql":
        return
    # ... inspect table ...
    with engine.begin() as connection:
        if "is_public" not in columns:
            connection.execute(text("ALTER TABLE profiles ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT TRUE"))
```

## Core Lessons Learned

1. **Browser CORS Errors Can Mask Server Crashes:** If a request reaches the server but triggers an unhandled exception (like a database crash), the server's error response often lacks CORS headers. The browser will report a CORS failure, sending you on a wild goose chase.
2. **Verify with cURL:** To see the *true* response, bypass the browser completely. Running a manual `curl.exe` request revealed the clean `200 OK` once the schema was fixed, proving the network bridge was healthy.
3. **Schema Migrations are Not Automatic:** SQLAlchemy `create_all()` is not a migration tool. For production PostgreSQL environments, structural changes (adding columns) require explicit `ALTER TABLE` commands or a migration framework like Alembic.
4. **Isolate to Illuminate:** When multiple systems (Auth, CORS, Database) are interacting, hardcode/bypass the early gates (like Auth) to see if the deeper gates (like Database) are actually the ones failing.
