# Database Migration Guide

This guide explains how to push your database schema and seed data to Supabase.

## Option 1: Using Supabase Dashboard (Recommended - Easiest)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the contents of each migration file in order and click **Run**:
   - `001_create_schema.sql` - Creates database schema
   - `002_seed_data.sql` - Seeds initial data
   - `003_fix_timestamps_utc.sql` - Fixes timestamp timezone issues
   - `004_remove_versions_separate_code_attachments.sql` - Migration to separate code files from attachments
   - `005_add_performance_indexes.sql` - Adds performance indexes
   - `006_create_sessions_table.sql` - Creates sessions table for JWT authentication
   - `007_add_session_cleanup.sql` - Adds session cleanup function (optional but recommended)

## Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

## Option 3: Using psql (PostgreSQL client)

If you have `psql` installed and have your database connection string:

```bash
# Get your connection string from Supabase Dashboard
# Settings > Database > Connection string > URI

# Run schema
psql "YOUR_CONNECTION_STRING" -f scripts/001_create_schema.sql

# Run seed data
psql "YOUR_CONNECTION_STRING" -f scripts/002_seed_data.sql
```

## Option 4: Using the Migration Script

We've created a script that automatically connects to your Supabase database:

```bash
# Install dependencies
npm install

# Run migration
npm run db:migrate
```

### Configuration

The script will try multiple connection methods automatically. If it fails:

1. **Get your connection string from Supabase Dashboard:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Navigate to **Settings → Database**
   - Scroll to **"Connection string"** section
   - Copy the **"URI"** or **"Connection pooling"** connection string

2. **Add it to `.env.local`:**
   ```env
   DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST]:[PORT]/postgres
   ```

3. **Run the migration again:**
   ```bash
   npm run db:migrate
   ```

**Note:** If the script still fails, use Option 1 (Dashboard SQL Editor) which is the most reliable method.

## Database Backup

This script provides professional-grade database backups using industry-standard methods.

### Quick Start

```bash
# Run backup with default settings (custom format - recommended)
npm run db:backup
```

### Backup Formats

The script supports three professional backup methods:

#### 1. Custom Format (Default - Recommended)
Uses `pg_dump -Fc` which is the **recommended format** for PostgreSQL backups:
- ✅ Automatically compressed
- ✅ Faster backup and restore
- ✅ Allows selective restore with `pg_restore`
- ✅ Supports parallel restore operations

```bash
# Uses custom format by default
npm run db:backup

# Or explicitly set format
BACKUP_FORMAT=custom npm run db:backup
```

**Output:** `backup_YYYY-MM-DD_HH-MM-SS.dump`

**Restore:**
```bash
# Full restore
pg_restore -h <host> -U <user> -d <database> -c backup_YYYY-MM-DD_HH-MM-SS.dump

# Selective restore (specific table)
pg_restore -h <host> -U <user> -d <database> -t <table_name> backup_YYYY-MM-DD_HH-MM-SS.dump
```

#### 2. Plain SQL Format
Creates a readable SQL file (useful for version control or manual inspection):

```bash
BACKUP_FORMAT=plain npm run db:backup
```

**Output:** `backup_YYYY-MM-DD_HH-MM-SS.sql`

**Restore:**
```bash
psql "YOUR_CONNECTION_STRING" -f backups/backup_YYYY-MM-DD_HH-MM-SS.sql
```

#### 3. Supabase CLI Format (Structured)
Uses Supabase CLI to create separate dumps for roles, schema, and data:

```bash
BACKUP_FORMAT=supabase-cli npm run db:backup
```

**Output:**
- `backup_YYYY-MM-DD_HH-MM-SS_roles.sql`
- `backup_YYYY-MM-DD_HH-MM-SS_schema.sql`
- `backup_YYYY-MM-DD_HH-MM-SS_data.sql`

**Restore:**
```bash
# Restore in order: roles → schema → data
psql <connection> -f backup_YYYY-MM-DD_HH-MM-SS_roles.sql
psql <connection> -f backup_YYYY-MM-DD_HH-MM-SS_schema.sql
psql <connection> -f backup_YYYY-MM-DD_HH-MM-SS_data.sql
```

**Note:** Requires Supabase CLI installed: `npm install -g supabase`

### Configuration

The backup script uses the same configuration as the migration script:

1. **Using DATABASE_URL (Recommended):**
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

2. **Using DATABASE_PASSWORD:**
   ```env
   DATABASE_PASSWORD=your-database-password
   ```

3. **Backup Format (Optional):**
   ```env
   BACKUP_FORMAT=custom  # or 'plain' or 'supabase-cli'
   ```

### How It Works

The script follows this priority order:

1. **Supabase CLI** (if `BACKUP_FORMAT=supabase-cli`)
   - Creates structured dumps (roles, schema, data separately)
   - Best for CI/CD integration

2. **pg_dump with Custom Format** (default)
   - Uses `pg_dump -Fc` (compressed, efficient)
   - Industry standard for PostgreSQL backups

3. **pg_dump with Plain SQL** (if custom format fails)
   - Falls back to readable SQL format

4. **Node.js Fallback** (last resort)
   - Only used if `pg_dump` is not available
   - Not recommended for production

### Prerequisites

For best results, install PostgreSQL client tools:

**Windows:**
- Download from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
- Or use [Chocolatey](https://chocolatey.org/): `choco install postgresql`

**macOS:**
```bash
brew install postgresql
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# Fedora/RHEL
sudo dnf install postgresql
```

### Restoring Backups

#### Custom Format (.dump)
```bash
# Full restore
pg_restore -h db.[PROJECT-REF].supabase.co -U postgres -d postgres -c backup.dump

# Selective restore
pg_restore -h db.[PROJECT-REF].supabase.co -U postgres -d postgres -t table_name backup.dump
```

#### Plain SQL Format (.sql)
```bash
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -f backup.sql
```

#### Using Supabase Dashboard
1. Open the backup file
2. Copy its contents
3. Go to Supabase Dashboard → SQL Editor
4. Paste and run the query

### Best Practices

1. **Use Custom Format** for production backups (smaller, faster, more flexible)
2. **Schedule Regular Backups** using cron jobs or CI/CD pipelines
3. **Store Backups Securely** - backups contain sensitive data
4. **Test Restores** periodically to ensure backups are valid
5. **Keep Multiple Backups** - follow the 3-2-1 rule (3 copies, 2 different media, 1 offsite)

### Automation Example

Add to your `.env.local`:
```env
BACKUP_FORMAT=custom
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

Then schedule with cron (Linux/macOS):
```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/project && npm run db:backup
```

**Note:** The `backups/` directory is automatically ignored by git (see `.gitignore`).


