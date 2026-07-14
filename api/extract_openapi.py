import os
os.environ["DEPLOYMENT_MODE"] = "dev"
import json
from src.main import app

openapi_schema = app.openapi()
with open("openapi.json", "w", encoding="utf-8") as f:
    json.dump(openapi_schema, f, indent=2)
print("Extracted openapi.json (dev mode)")
