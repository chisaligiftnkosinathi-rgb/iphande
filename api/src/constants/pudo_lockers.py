"""
Pudo Locker Directory for South Africa
Provides discoverable smart locker pickup points across major townships and metro centers.
"""
from typing import List, Dict, Any

PUDO_LOCKERS: List[Dict[str, Any]] = [
    {
        "id": "pudo-jhb-soweto-jabulani",
        "name": "Pudo Locker - Jabulani Mall",
        "city": "Johannesburg",
        "suburb": "Soweto",
        "address": "Jabulani Mall, 2601 Koma St, Jabulani, Soweto",
        "postal_code": "1868",
        "operating_hours": "24/7 Access",
        "coordinates": {"lat": -26.2415, "lng": 27.8596}
    },
    {
        "id": "pudo-jhb-soweto-maponya",
        "name": "Pudo Locker - Maponya Mall",
        "city": "Johannesburg",
        "suburb": "Klipspruit / Pimville",
        "address": "Maponya Mall, 2127 Chris Hani Rd, Klipspruit, Soweto",
        "postal_code": "1809",
        "operating_hours": "08:00 - 18:00",
        "coordinates": {"lat": -26.2625, "lng": 27.9022}
    },
    {
        "id": "pudo-jhb-braamfontein",
        "name": "Pudo Locker - Braamfontein Centre",
        "city": "Johannesburg",
        "suburb": "Braamfontein",
        "address": "Jorissen St & Bertha St, Braamfontein",
        "postal_code": "2001",
        "operating_hours": "24/7 Access",
        "coordinates": {"lat": -26.1929, "lng": 28.0348}
    },
    {
        "id": "pudo-ekurhuleni-thembisa",
        "name": "Pudo Locker - Tembisa Megamart",
        "city": "Ekurhuleni",
        "suburb": "Tembisa",
        "address": "Rev RTJ Namane Dr & Andrew Mapheto Dr, Tembisa",
        "postal_code": "1632",
        "operating_hours": "08:00 - 19:00",
        "coordinates": {"lat": -25.9982, "lng": 28.2256}
    },
    {
        "id": "pudo-ptown-mamelodi",
        "name": "Pudo Locker - Denlyn Shopping Centre",
        "city": "Pretoria",
        "suburb": "Mamelodi",
        "address": "Tsweu St & Stormvoel Rd, Mamelodi West",
        "postal_code": "0122",
        "operating_hours": "08:00 - 18:00",
        "coordinates": {"lat": -25.7088, "lng": 28.3496}
    },
    {
        "id": "pudo-cpt-khayelitsha",
        "name": "Pudo Locker - Khayelitsha Mall",
        "city": "Cape Town",
        "suburb": "Khayelitsha",
        "address": "Walter Sisulu Rd, Village V1 South, Khayelitsha",
        "postal_code": "7784",
        "operating_hours": "08:00 - 18:00",
        "coordinates": {"lat": -34.0378, "lng": 18.6749}
    },
    {
        "id": "pudo-dbn-umlazi",
        "name": "Pudo Locker - KwaMnyandu Shopping Centre",
        "city": "Durban",
        "suburb": "Umlazi",
        "address": "Griffiths Mxenge Hwy, Umlazi V, Umlazi",
        "postal_code": "4066",
        "operating_hours": "08:00 - 18:00",
        "coordinates": {"lat": -29.9678, "lng": 30.9168}
    }
]

def get_lockers(city: str = None) -> List[Dict[str, Any]]:
    if city:
        return [l for l in PUDO_LOCKERS if city.lower() in l["city"].lower() or city.lower() in l["suburb"].lower()]
    return PUDO_LOCKERS
