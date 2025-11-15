# Database Migration Guide

This guide explains how to push your database schema and seed data to Supabase.

## Option 1: Using Supabase Dashboard (Recommended - Easiest)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the contents of `001_create_schema.sql` and click **Run**
6. Once the schema is created, copy and paste the contents of `002_seed_data.sql` and click **Run**

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


