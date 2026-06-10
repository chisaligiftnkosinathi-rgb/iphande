from fastapi import Header

# Note: The function name is temporarily kept as 'get_current_firebase_user'
# so it doesn't break dependencies in other existing routing files.
async def get_current_firebase_user(authorization: str | None = Header(default=None)):
    """
    Temporary V1 development auth bypass.

    Returns a stable, hardcoded user object to allow UI development
    without requiring a valid JWT. This should be removed before
    final production deployment.
    """
    print("⚠️ AUTH BYPASSED: Using mock development user.")
    return {
        "uid": "nN1Yv9Mh36exRJyNPEWKo8oMRFH3",
        "sub": "nN1Yv9Mh36exRJyNPEWKo8oMRFH3",
        "email": "glegacey97@gmail.com",
        "is_mock": True,
    }
