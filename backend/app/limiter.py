import os
from slowapi import Limiter
from slowapi.util import get_remote_address

# Configure rate limiter for CiviConnect API
# In test mode, rate limits can be disabled or widened if needed.
limiter = Limiter(
    key_func=get_remote_address,
    enabled=os.getenv("APP_ENV", "development").lower() != "test",
    default_limits=["120/minute"]
)
