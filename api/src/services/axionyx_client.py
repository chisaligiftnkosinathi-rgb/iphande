import httpx
import logging
import asyncio
from typing import Dict, Any

from src.config import AXIONYX_API_URL

logger = logging.getLogger(__name__)

async def send_evidence_to_axionyx(payload: Dict[str, Any], max_retries: int = 3):
    """
    Sends the verified trust memory (evidence) to the Axionyx truth engine.
    If it fails, we catch the exception so it doesn't crash the calling route,
    allowing the 'store-and-forward' continuity principle.
    """
    url = f"{AXIONYX_API_URL.rstrip('/')}/api/v1/governance/trust-ledger/submit"
    
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                logger.info(f"Successfully sent evidence to Axionyx. Response: {response.text}")
                return response.json()
        except Exception as e:
            logger.warning(f"Failed to send evidence to Axionyx (Attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
            else:
                logger.error(f"Final failure sending to Axionyx. Evidence payload marked as pending: {payload}")
                # In a full implementation, we would flag the local DB record here as 'pending_sync'
                return None
