from pydantic import BaseModel, Field, EmailStr, field_validator, ConfigDict
from typing import Optional

class ProfileLocationUpdate(BaseModel):
    operating_area: Optional[str] = None
    address_label: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_is_public: Optional[bool] = False
    service_radius_km: Optional[float] = None
    service_area_notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator('latitude')
    @classmethod
    def latitude_range(cls, v):
        if v is not None and not (-90 <= v <= 90):
            raise ValueError('Latitude must be between -90 and 90')
        return v

    @field_validator('longitude')
    @classmethod
    def longitude_range(cls, v):
        if v is not None and not (-180 <= v <= 180):
            raise ValueError('Longitude must be between -180 and 180')
        return v

    @field_validator('service_radius_km')
    @classmethod
    def radius_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Service radius must be positive')
        return v
