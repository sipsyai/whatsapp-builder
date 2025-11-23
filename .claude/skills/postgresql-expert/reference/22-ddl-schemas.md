# 5.10. Schemas

A PostgreSQL database cluster contains one or more named databases. A database contains one or more named **schemas**, which in turn contain tables and other named objects including data types, functions, and operators.

## Key Characteristics

Within a single schema, two objects of the same type cannot share a name. However, "tables, sequences, indexes, views, materialized views, and foreign tables share the same namespace," meaning an index and table must have different names in the same schema. The same object name can be used across different schemas without conflict.

Unlike databases, schemas are not rigidly separated—users can access objects in any schema they have privileges for.

## Primary Uses for Schemas

- Allow multiple users to share one database without interference
- Organize database objects into logical groups
- Isolate third-party applications to prevent name collisions

## Creating Schemas

Use the `CREATE SCHEMA` command:

```sql
CREATE SCHEMA myschema;
```

To create tables within a schema, use qualified names:

```sql
CREATE TABLE myschema.mytable ( ... );
```

To drop an empty schema:

```sql
DROP SCHEMA myschema;
```

To drop a schema and all its contents:

```sql
DROP SCHEMA myschema CASCADE;
```

Create a schema owned by another user:

```sql
CREATE SCHEMA schema_name AUTHORIZATION user_name;
```

## The Public Schema

By default, tables created without specifying a schema go into the "public" schema. These statements are equivalent:

```sql
CREATE TABLE products ( ... );
CREATE TABLE public.products ( ... );
```

## Schema Search Path

Rather than using qualified names, PostgreSQL uses an unqualified search path to locate objects. The command `SHOW search_path;` displays the current path. The default returns:

```
"$user", public
```

This searches for a schema matching the current user first, then the public schema.

Modify the search path with:

```sql
SET search_path TO myschema,public;
```

The first schema in the search path is the "current schema" where new objects are created by default.

## Security Considerations

"The ability to create like-named objects in different schemas complicates writing a query that references precisely the same objects every time." Adding a schema to `search_path` effectively trusts all users with `CREATE` privilege on that schema.

## Privileges

By default, users cannot access objects in schemas they don't own. Schema owners must grant the `USAGE` privilege. Everyone has `USAGE` privilege on the public schema by default.

To allow object creation in another's schema, the owner must grant `CREATE` privilege.

## System Catalog Schema

Each database contains `pg_catalog`, which holds system tables and built-in data types, functions, and operators. It's always effectively part of the search path, either explicitly or implicitly searched before user schemas. This ensures built-in names are always findable.

## Usage Patterns

A **secure schema usage pattern** prevents untrusted users from altering other users' queries. Three common patterns:

1. **User-private schemas**: Ensure no schemas have public `CREATE` privileges, then create per-user schemas (e.g., `CREATE SCHEMA alice AUTHORIZATION alice`)

2. **Remove public schema from search path**: Modify configuration or use `ALTER ROLE ALL SET search_path = "$user"`, then grant public schema privileges selectively

3. **Keep default search path**: Grant public privileges—acceptable only with single or mutually-trusting users

## Portability Notes

The SQL standard doesn't support objects in the same schema being owned by different users. Some implementations treat schemas and users as nearly equivalent. There is no `public` schema concept in standard SQL. For maximum portability, avoid using schemas.
