from __future__ import annotations

import os
import sys
from logging.config import fileConfig
from pathlib import Path

# Add src/ to path so our models are importable
sys.path.append(str(Path(__file__).resolve().parents[1] / "src"))

from alembic import context
from isdr_api.database import DATABASE_URL, Base
import isdr_api.db_models  # noqa: F401 — ensures models are registered on Base.metadata
import isdr_api.db_models_extended  # noqa: F401 — ensures models are registered on Base.metadata

config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)

# Override sqlalchemy.url from environment
migration_url = DATABASE_URL
if migration_url.startswith("postgres://"):
    migration_url = migration_url.replace("postgres://", "postgresql://", 1)
config.set_main_option("sqlalchemy.url", migration_url)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    from sqlalchemy import engine_from_config, pool

    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
