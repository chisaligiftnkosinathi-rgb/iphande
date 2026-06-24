from pydantic import BaseModel
from typing import Optional, List


class PublicProfileCard(BaseModel):
    id: str
    name: str
    slug: str

    provider_type: Optional[str] = None
    business_category_key: Optional[str] = None

    short_bio: Optional[str] = None
    location: Optional[str] = None

    latitude: Optional[float] = None
    longitude: Optional[float] = None

    logo_url: Optional[str] = None
    cover_photo_url: Optional[str] = None

    services: Optional[str] = None

    is_verified: Optional[bool] = False


class PublicProfilesResponse(BaseModel):
    count: int
    results: List[PublicProfileCard]
