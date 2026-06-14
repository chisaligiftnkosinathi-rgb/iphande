from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Union

class TestModel(BaseModel):
    supporting_image_urls: Union[List[str], str, None] = None
    model_config = ConfigDict(from_attributes=True)

# Simulate what happens with None value (antigravity-tech case)
class FakeObj:
    supporting_image_urls = None
    services = None
    short_bio = None
    location_is_public = True
    id = "test"
    name = "Antigravity Tech"
    slug = "antigravity-tech"
    created_at = None

result = TestModel.model_validate(FakeObj())
print("None case PASS:", result.supporting_image_urls)

# Test with empty JSON string
class FakeObj2:
    supporting_image_urls = '""'

result2 = TestModel.model_validate(FakeObj2())
print("Double-quoted empty string PASS:", result2.supporting_image_urls)
