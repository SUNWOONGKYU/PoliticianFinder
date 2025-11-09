#!/bin/bash
# Task ID: P2D1
# Script: Run all database migrations in order
# Description: Executes all migration files for PoliticianFinder database

set -e  # Exit on error

echo "=========================================="
echo "PoliticianFinder Database Migration Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Supabase project configuration
PROJECT_REF="ooddlafwdpzgxfefgsrx"
MIGRATIONS_DIR="./migrations"

echo -e "${YELLOW}Project Reference:${NC} $PROJECT_REF"
echo -e "${YELLOW}Migrations Directory:${NC} $MIGRATIONS_DIR"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo -e "${RED}Error: Supabase CLI is not installed${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✓${NC} Supabase CLI found"
echo ""

# Ask for confirmation
read -p "Do you want to run all migrations? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Migration cancelled."
    exit 0
fi

echo ""
echo "Linking to Supabase project..."
supabase link --project-ref $PROJECT_REF

echo ""
echo "=========================================="
echo "Running Migrations"
echo "=========================================="
echo ""

# Migration files in order
migrations=(
    "001_create_users_table.sql"
    "002_create_politicians_table.sql"
    "003_create_careers_table.sql"
    "004_create_pledges_table.sql"
    "005_create_posts_table.sql"
    "006_create_comments_table.sql"
    "007_create_likes_tables.sql"
    "008_create_follows_table.sql"
    "009_create_notifications_table.sql"
    "010_create_user_favorites_table.sql"
    "011_create_ai_evaluations_table.sql"
    "012_create_reports_table.sql"
    "013_create_shares_table.sql"
    "014_create_politician_verification_table.sql"
    "015_create_audit_logs_table.sql"
    "016_create_advertisements_table.sql"
    "017_create_policies_table.sql"
    "018_create_notification_templates_table.sql"
    "019_create_system_settings_table.sql"
    "020_create_admin_actions_table.sql"
    "030_create_triggers.sql"
    "031_create_functions.sql"
    "040_create_storage_buckets.sql"
    "041_create_rls_policies.sql"
)

# Counter
total=${#migrations[@]}
current=0
failed=0

# Run each migration
for migration in "${migrations[@]}"
do
    current=$((current + 1))
    echo -e "${YELLOW}[$current/$total]${NC} Running: $migration"

    if [ -f "$MIGRATIONS_DIR/$migration" ]; then
        if supabase db push --file "$MIGRATIONS_DIR/$migration"; then
            echo -e "${GREEN}✓${NC} Success: $migration"
        else
            echo -e "${RED}✗${NC} Failed: $migration"
            failed=$((failed + 1))
        fi
    else
        echo -e "${RED}✗${NC} File not found: $migration"
        failed=$((failed + 1))
    fi
    echo ""
done

echo "=========================================="
echo "Migration Summary"
echo "=========================================="
echo -e "Total migrations: $total"
echo -e "${GREEN}Successful: $((total - failed))${NC}"
if [ $failed -gt 0 ]; then
    echo -e "${RED}Failed: $failed${NC}"
else
    echo -e "${GREEN}All migrations completed successfully!${NC}"
fi
echo ""

# Verification queries
echo "=========================================="
echo "Verification"
echo "=========================================="
echo ""
echo "Run these queries in Supabase SQL Editor to verify:"
echo ""
echo "-- Check all tables"
echo "SELECT table_name FROM information_schema.tables"
echo "WHERE table_schema = 'public' ORDER BY table_name;"
echo ""
echo "-- Check RLS is enabled"
echo "SELECT tablename, rowsecurity FROM pg_tables"
echo "WHERE schemaname = 'public';"
echo ""
echo "-- Check triggers"
echo "SELECT trigger_name, event_object_table"
echo "FROM information_schema.triggers"
echo "WHERE trigger_schema = 'public';"
echo ""
echo "-- Check storage buckets"
echo "SELECT * FROM storage.buckets;"
echo ""

if [ $failed -eq 0 ]; then
    exit 0
else
    exit 1
fi
