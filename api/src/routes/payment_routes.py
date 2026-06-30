from fastapi import APIRouter
from src.config.payments import payment_config

router = APIRouter(prefix="/payments", tags=["payments"])

@router.get("/config")
def get_payment_config():
    """
    Returns the single source of truth for payment configuration,
    ensuring frontend and backend are aligned on the destination bank details.
    """
    return {
        "bank_account_number": payment_config.BANK_ACCOUNT_NUMBER,
        "bank_name": payment_config.BANK_NAME,
        "reference_prefix": payment_config.PAYMENT_REFERENCE_PREFIX
    }

@router.get("/methods")
def get_payment_methods():
    """
    Returns the supported payment methods.
    Currently only manual EFT is supported, but this lays the groundwork for Stripe/PayFast later.
    """
    return {
        "supported_methods": ["manual_eft"],
        "default_method": "manual_eft"
    }
