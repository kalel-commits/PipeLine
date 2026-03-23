from pydantic import BaseModel
from typing import Dict, Any, Optional

class WebhookResponse(BaseModel):
    status: str
    prediction: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    reason: Optional[str] = None
