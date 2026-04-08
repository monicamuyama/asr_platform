"""
Database configuration that switches between minimal (legacy) and extended models.

For backward compatibility with existing deployments, we support two schema modes:
1. SCHEMA_MODE=minimal: Uses db_models.py (Phase 1-2 minimal schema)
2. SCHEMA_MODE=extended: Uses db_models_extended.py (Phase 5 research-grade schema)

Set SCHEMA_MODE environment variable to control which models are loaded.
Defaults to 'minimal' for backward compatibility.
"""

import os

SCHEMA_MODE = os.getenv("SCHEMA_MODE", "minimal").lower()

if SCHEMA_MODE == "extended":
    # Research-grade schema with consent, geography, demographics, validation pipeline
    from isdr_api.db_models_extended import *  # noqa: F401, F403
else:
    # Minimal schema (default, backward compatible)
    from isdr_api.db_models import *  # noqa: F401, F403
