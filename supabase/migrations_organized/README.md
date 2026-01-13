# Migration Organization

This directory contains organized migration files, categorized by purpose.

## Categories

### Schema Migrations
Database structure changes (tables, indexes, constraints)
- Located in: `schema/`
- Files: 7

### Data Quality Migrations
Data cleanup and normalization operations
- Located in: `data_quality/`
- Files: 4

### Security Migrations
Row Level Security (RLS), permissions, and access controls
- Located in: `security/`
- Files: 8

### Maintenance Migrations
Ongoing data maintenance and filtering operations
- Located in: `maintenance/`
- Files: 31

## Execution Order

Migrations should be executed in chronological order within each category:

1. **Schema** (first - establishes database structure)
2. **Security** (second - sets up access controls)
3. **Data Quality** (third - cleans existing data)
4. **Maintenance** (ongoing - filters and maintains data quality)

## Best Practices

- Always backup before running migrations
- Test migrations on staging environment first
- Run schema/security migrations sequentially
- Data quality/maintenance migrations can run in parallel
- Monitor execution time and success/failure rates

## Recent Migrations

- 20260110000000: remove unused api tables (schema)\n- 20260110000001: add missing constraints (schema)\n- unknown: create guaranteed matching tables (schema)\n- unknown: DAILY MAINTENANCE (security)\n- unknown: FILTER NON BUSINESS ROLES (maintenance)\n- unknown: FIX ALL EXISTING DATA (maintenance)\n- unknown: FIX TRIGGER SYNTAX (data_quality)\n- unknown: MIGRATION FIX DUPLICATE CATEGORIES (maintenance)\n- unknown: MIGRATION TO APPLY NOW (maintenance)\n- unknown: MIGRATION TO PASTE (maintenance)

---

*Generated on: 2026-01-13T15:29:28.303Z*
*Total migrations: 52*
