from app.core.database import Base, engine
from app import models
import os

print('Creating database with SQLite...')
print(f'Database location: {os.path.abspath("politician_finder.db")}')
Base.metadata.create_all(bind=engine)
print('Database tables created successfully')

# List created tables
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f'Created {len(tables)} tables')
for table in tables:
    print(f'  - {table}')
