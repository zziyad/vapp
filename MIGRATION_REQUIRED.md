# ⚠️ Database Migration Required

## Issue

The VAPP v2 configuration tables don't exist in the database yet. You're seeing errors like:
```
relation "AccessZone" does not exist
```

## Solution

Run the database migration to create all required tables.

### Migration File

The migration file is located at:
```
main-server/database/migrations/20260124_vapp_v2_request_config_tables.sql
```

### How to Run the Migration

**Option 1: Using psql directly**

```bash
# Replace with your database connection details
psql -U your_username -d your_database_name -f main-server/database/migrations/20260124_vapp_v2_request_config_tables.sql
```

**Option 2: Using environment variables**

```bash
# If you have DB connection in environment
psql $DATABASE_URL -f main-server/database/migrations/20260124_vapp_v2_request_config_tables.sql
```

**Option 3: From main-server directory**

```bash
cd main-server
psql -U postgres -d trs -f database/migrations/20260124_vapp_v2_request_config_tables.sql
```

### Tables Created

The migration creates these tables:
- ✅ `Sector` - Event-scoped sectors
- ✅ `FunctionalArea` - Event-scoped functional areas  
- ✅ `VehicleType` - Global + event-specific vehicle types
- ✅ `AccessZone` - Event-scoped access zones
- ✅ `AccessType` - Global + event-specific access types
- ✅ `Validity` - Event-scoped validity periods
- ✅ `Importance` - Global/static importance levels

### Verify Migration

After running the migration, verify tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('Sector', 'FunctionalArea', 'VehicleType', 'AccessZone', 'AccessType', 'Validity', 'Importance');
```

You should see all 7 tables listed.

### Seed Data (Optional)

If you need to seed default Importance values, check for:
```
main-server/database/migrations/20260117_vapp_v2_seed_importance.sql
```

Run it similarly:
```bash
psql -U your_username -d your_database_name -f main-server/database/migrations/20260117_vapp_v2_seed_importance.sql
```

---

**After running the migration, restart your backend server and try accessing the config pages again.**
