# Zero-Downtime PostgreSQL Migrations: Avoiding Table Locks at Scale

> [!NOTE]
> **📖 Article Overview**
> Running database migrations in a development environment is trivial. In a high-traffic production system with active write loads, however, a naive migration can easily cause a catastrophic outage. Commands like `ALTER TABLE ADD COLUMN` or `CREATE INDEX` acquire high-level table locks that block all incoming read and write transactions. When your API connections queue up waiting for the lock to release, your server thread pool starves and crashes. This article covers the **PostgreSQL lock hierarchy** and shows you how to run migrations—including column additions, index creations, and foreign key validations—with zero downtime.

---

## The Root Cause: PostgreSQL Lock Hierarchy

Every operation in PostgreSQL acquires a lock. The danger lies in **Exclusive Locks** (specifically `AccessExclusiveLock`), which block all other operations, including simple reads (`SELECT`) and writes (`INSERT`/`UPDATE`).

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': { 'primaryColor': '#ef4444', 'primaryTextColor': '#f3f4f6', 'primaryBorderColor': '#f87171', 'lineColor': '#ef4444', 'secondaryColor': '#111827', 'tertiaryColor': '#0b0f19'}}}%%
flowchart TD
    subgraph ❌ Naive Block Way (Exclusive Lock)
        Migration[ALTER TABLE ADD COLUMN DEFAULT] -->|Acquires AccessExclusiveLock| Table[Users Table]
        Reads[Incoming SELECTs] -->|Blocked| Table
        Writes[Incoming INSERTs] -->|Blocked| Table
        Table -->|Queue fills up, connections timeout| Crash[Server Outage]
    end

    subgraph ✅ Safe Way (Incremental Locks)
        Step1[1. ALTER TABLE ADD COLUMN without default] -->|Short AccessExclusiveLock| Table2[Users Table]
        Step2[2. SET DEFAULT value] -->|Quick Lock metadata update| Table2
        Step3[3. Backfill data in small batches] -->|Low-level RowShareLock| Table2
        Reads2[Incoming SELECTs] -->|Allowed concurrently| Table2
    end
```

If a migration transaction is blocked waiting for an exclusive lock, it blocks the queue. All subsequent queries hitting that table queue up behind it, freezing the app.

---

## 3 Safe Migrations Patterns

### 1. Adding a Column with a Default Value
A naive `ALTER TABLE users ADD COLUMN active BOOLEAN DEFAULT true;` will rewrite the entire table to write the `true` value into every row, holding an `AccessExclusiveLock` the entire time.

#### The Safe Approach:
1. Add the column without the default (instant, metadata-only lock).
2. Set the default value (also instant, affects new rows only).
3. Backfill the existing rows in small batches using a script to avoid lock escalation.

```sql
-- Step 1: Add the column (no default)
ALTER TABLE users ADD COLUMN active BOOLEAN;

-- Step 2: Set the default for new rows
ALTER TABLE users ALTER COLUMN active SET DEFAULT true;

-- Step 3: Backfill data in batches (run via script/transaction loops)
-- UPDATE users SET active = true WHERE id BETWEEN 1 AND 10000;
```

---

### 2. Creating a Vector or Standard Index
Running a standard `CREATE INDEX` locks the table for both reads and writes. On tables with millions of rows, index building can take minutes or hours.

#### The Safe Approach:
Always build indexes concurrently using the `CONCURRENTLY` flag. This executes the index build in the background, utilizing a low-level lock that allows reads and writes to continue.

```sql
-- Step 1: Set a lock timeout so the migration script fails early rather than blocking the queue
SET lock_timeout = '3s';

-- Step 2: Create the index concurrently
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
```

*Note: Concurrent index builds run in two passes and can fail if a duplicate value is inserted during the run. Check the index status afterward; if it is marked as `INVALID`, drop it concurrently and retry.*

---

### 3. Adding a Foreign Key Constraint
Adding a foreign key constraint normally locks both the parent and child tables while it scans the child table to validate all existing records.

#### The Safe Approach:
Split the constraint addition into two steps:
1. Add the constraint as `NOT VALID` (creates the constraint instantly, locking only new rows).
2. Validate the constraint in a separate step (scans existing data using a low-level lock, allowing writes to continue).

```sql
-- Step 1: Add constraint (NOT VALID)
ALTER TABLE orders 
    ADD CONSTRAINT fk_orders_user 
    FOREIGN KEY (user_id) REFERENCES users(id) NOT VALID;

-- Step 2: Validate constraint (Safe, no write lock acquired)
ALTER TABLE orders VALIDATE CONSTRAINT fk_orders_user;
```

---

## Conclusion & Takeaways

Database reliability at scale requires strict lock management:
* [ ] **Always set a `lock_timeout`**: Never let a migration query wait indefinitely; terminate it early to protect the active connection pool.
* [ ] **Use `CONCURRENTLY` for index building**: Standard index creation blocks write queues; concurrent builds run safely in the background.
* [ ] **Split constraint validation**: Add foreign keys and check constraints as `NOT VALID` first, then run validation in a separate transaction block.
* [ ] **Backfill in small batches**: Avoid running large `UPDATE` statements that lock entire tables; batch updates to 5,000–10,000 rows at a time.
