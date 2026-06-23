from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from pydantic import BaseModel, ConfigDict

from src.database import get_db
from src.models.place import Place

router = APIRouter(prefix="/api/v1/places", tags=["places"])

class PlaceOut(BaseModel):
    id: str
    place_code: str
    parent_place_code: str | None = None
    name: str
    level: str
    province_name: str | None = None
    district_name: str | None = None
    municipality_name: str | None = None

    model_config = ConfigDict(from_attributes=True)


@router.get("/search", response_model=List[PlaceOut])
def search_places(
    q: str = Query(..., min_length=3, description="Search query for place names"),
    db: Session = Depends(get_db)
):
    """
    Search for places by name across all levels.
    """
    search_term = f"%{q.lower()}%"
    results = (
        db.query(Place)
        .filter(Place.name.ilike(search_term))
        .order_by(Place.level, Place.name)
        .limit(50)
        .all()
    )
    return results


@router.get("/provinces", response_model=List[PlaceOut])
def get_provinces(db: Session = Depends(get_db)):
    """
    Get a list of all provinces.
    """
    return db.query(Place).filter(Place.level == "province").order_by(Place.name).all()


@router.get("/municipalities", response_model=List[PlaceOut])
def get_municipalities(
    province_code: str = Query(..., description="The 'province:{code}' of the parent province"),
    db: Session = Depends(get_db)
):
    """
    Get municipalities for a given province.
    """
    return (
        db.query(Place)
        .filter(Place.level == "municipality", Place.province_code == province_code.split(":")[-1])
        .order_by(Place.name)
        .all()
    )


@router.get("/main-places", response_model=List[PlaceOut])
def get_main_places(
    municipality_code: str = Query(..., description="The 'municipality:{code}' of the parent municipality"),
    db: Session = Depends(get_db)
):
    """
    Get main places for a given municipality.
    """
    raw_code = municipality_code.split(":")[-1]
    return (
        db.query(Place)
        .filter(Place.level == "main_place", Place.municipality_code == raw_code)
        .order_by(Place.name)
        .all()
    )


@router.get("/sub-places", response_model=List[PlaceOut])
def get_sub_places(
    main_place_code: str = Query(..., description="The 'main_place:{code}' of the parent main place"),
    db: Session = Depends(get_db)
):
    """
    Get sub-places for a given main place.
    """
    raw_code = main_place_code.split(":")[-1]
    return (
        db.query(Place)
        .filter(
            Place.level == "sub_place",
            Place.parent_place_code.in_([
                main_place_code,
                f"main_place:{raw_code}",
                raw_code,
            ])
        )
        .order_by(Place.name)
        .all()
    )
