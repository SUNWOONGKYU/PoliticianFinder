# Database Migration and Seeding Guide

This guide explains how to set up and run database migrations for the PoliticianFinder API project.

## Prerequisites

1. PostgreSQL database server running (version 12+)
2. Python 3.8+ with required packages installed
3. Database created in PostgreSQL

## Database Setup

### 1. Install PostgreSQL

If PostgreSQL is not installed:
- Windows: Download from https://www.postgresql.org/download/windows/
- Mac: `brew install postgresql`
- Linux: `sudo apt-get install postgresql`

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE politician_finder;

# Create user (optional, if not using postgres user)
CREATE USER politician_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE politician_finder TO politician_user;

# Exit
\q
```

### 3. Configure Database Connection

Update the `.env` file with your database credentials:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/politician_finder
```

Example configurations:
- Local with postgres user: `postgresql://postgres:postgres@localhost:5432/politician_finder`
- Custom user: `postgresql://politician_user:your_password@localhost:5432/politician_finder`

## Running Migrations

### 1. Install Dependencies

```bash
cd api
pip install -r requirements.txt
```

### 2. Check Migration Status

```bash
# Using Python module (recommended)
python -c "from alembic.config import Config; from alembic import command; cfg = Config('alembic.ini'); command.current(cfg)"

# Or if alembic is in PATH
alembic current
```

### 3. Run Migrations

```bash
# Apply all migrations
python -c "from alembic.config import Config; from alembic import command; cfg = Config('alembic.ini'); command.upgrade(cfg, 'head')"

# Or if alembic is in PATH
alembic upgrade head
```

### 4. Verify Migration Success

```bash
# Check current version
python -c "from alembic.config import Config; from alembic import command; cfg = Config('alembic.ini'); command.current(cfg)"

# View migration history
python -c "from alembic.config import Config; from alembic import command; cfg = Config('alembic.ini'); command.history(cfg)"
```

## Seeding Test Data

### 1. Run Seed Script

```bash
# Seed with clearing existing data (default)
python -m app.utils.seed_data

# Seed without clearing existing data
python -m app.utils.seed_data --no-clear
```

### 2. Verify Seeded Data

The script will output a summary of created records:
```
Starting database seeding...
[OK] Database cleared
[OK] Created 3 categories
[OK] Created 5 test users
[OK] Created 10 sample politicians
[OK] Created 4 sample ratings
[OK] Created 4 sample comments
[OK] Created 4 sample bookmarks
[OK] Created 5 sample follow relationships
[OK] Created 3 sample notifications

All seed data created successfully!

Database Summary:
  - Categories: 3
  - Users: 5
  - Politicians: 10
  - Ratings: 4
  - Comments: 4
  - Bookmarks: 4
  - User Follows: 5
  - Notifications: 3

Test User Credentials:
  Email: admin@politicianfinder.com | Password: TestPass123
  Email: user1@example.com | Password: TestPass123
  Email: user2@example.com | Password: TestPass123
```

## Migration Files

### Existing Migrations

1. **001_create_politician_evaluations.py**
   - Creates the `politician_evaluations` table for AI evaluation data
   - Includes indexes for performance

2. **002_create_core_tables.py**
   - Creates all core application tables:
     - `users` - User accounts
     - `categories` - Politician categories
     - `politicians` - Politician profiles
     - `ratings` - User ratings for politicians
     - `comments` - User comments
     - `notifications` - User notifications
     - `posts` - Blog/news posts
     - `reports` - Content reports
     - `user_follows` - User follow relationships
     - `politician_bookmarks` - User bookmarks for politicians
     - `ai_evaluations` - AI-generated evaluations
   - Sets up all foreign key relationships and indexes

## Troubleshooting

### Connection Refused Error

If you see:
```
psycopg2.OperationalError: connection to server at "localhost", port 5432 failed: Connection refused
```

Solutions:
1. Start PostgreSQL service:
   - Windows: `net start postgresql-x64-14` (version may vary)
   - Mac: `brew services start postgresql`
   - Linux: `sudo systemctl start postgresql`

2. Check if PostgreSQL is listening on the correct port:
   ```bash
   psql -U postgres -c "SHOW port;"
   ```

3. Verify connection settings in `.env`

### Permission Denied

If you see permission errors:
1. Check database user permissions
2. Grant necessary permissions:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE politician_finder TO your_user;
   ```

### Migration Already Applied

If a migration was partially applied:
```bash
# Downgrade to previous version
python -c "from alembic.config import Config; from alembic import command; cfg = Config('alembic.ini'); command.downgrade(cfg, '-1')"

# Then upgrade again
python -c "from alembic.config import Config; from alembic import command; cfg = Config('alembic.ini'); command.upgrade(cfg, 'head')"
```

## Database Management Commands

### Reset Database (Development Only)

```bash
# Drop all tables (CAUTION: This deletes all data!)
python -c "from app.core.database import Base, engine; Base.metadata.drop_all(bind=engine)"

# Recreate tables with migrations
python -c "from alembic.config import Config; from alembic import command; cfg = Config('alembic.ini'); command.upgrade(cfg, 'head')"

# Seed test data
python -m app.utils.seed_data
```

### Create New Migration

When you modify models:
```bash
# Generate migration automatically
alembic revision --autogenerate -m "description of changes"

# Or create empty migration
alembic revision -m "description of changes"
```

### Rollback Migration

```bash
# Rollback one version
alembic downgrade -1

# Rollback to specific version
alembic downgrade 001

# Rollback all migrations
alembic downgrade base
```

## Production Deployment

For production deployment:

1. Use environment variables for sensitive data
2. Create a production `.env` file with secure credentials
3. Run migrations as part of deployment process
4. Do NOT run seed_data in production
5. Always backup database before running migrations

Example production migration command:
```bash
# In production deployment script
alembic upgrade head
```

## Quick Start Summary

```bash
# 1. Setup PostgreSQL and create database
createdb politician_finder

# 2. Configure .env file
cp .env.example .env
# Edit .env with your database credentials

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run migrations
python -c "from alembic.config import Config; from alembic import command; cfg = Config('alembic.ini'); command.upgrade(cfg, 'head')"

# 5. Seed test data (development only)
python -m app.utils.seed_data

# 6. Start the API server
uvicorn app.main:app --reload
```

## Support

If you encounter issues not covered in this guide:
1. Check the Alembic documentation: https://alembic.sqlalchemy.org/
2. Review SQLAlchemy documentation: https://docs.sqlalchemy.org/
3. Check PostgreSQL logs for database-specific errors