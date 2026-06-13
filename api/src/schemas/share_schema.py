from pydantic import BaseModel, ConfigDict
from typing import Literal

class ShareResponseOut(BaseModel):
    share_text: str
    source_type: Literal["profile", "opportunity", "quote", "proof_of_work"]
    source_id: str
    generated_from: Literal["preserved_truth"] = "preserved_truth"

    model_config = ConfigDict(from_attributes=True)
