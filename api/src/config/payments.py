import os
from dataclasses import dataclass

@dataclass(frozen=True)
class PaymentConfig:
    BANK_ACCOUNT_NUMBER: str = "63172952260"
    BANK_NAME: str = "FNB"
    PAYMENT_REFERENCE_PREFIX: str = "IPHANDE"

    PAYFAST_BASE_URL: str = os.getenv("PAYFAST_BASE_URL", "https://sandbox.payfast.co.za/eng/process")
    PAYFAST_MERCHANT_ID: str | None = os.getenv("PAYFAST_MERCHANT_ID")
    PAYFAST_MERCHANT_KEY: str | None = os.getenv("PAYFAST_MERCHANT_KEY")
    PAYFAST_RETURN_URL: str | None = os.getenv("PAYFAST_RETURN_URL")
    PAYFAST_CANCEL_URL: str | None = os.getenv("PAYFAST_CANCEL_URL")
    PAYFAST_NOTIFY_URL: str | None = os.getenv("PAYFAST_NOTIFY_URL")

payment_config = PaymentConfig()
