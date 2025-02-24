
# Direct Support for Insert on Duplicate Key by Databases

## Summary

Here is a summary of three databases with direct support for handling duplicate key conflicts during insert operations, along with examples:

| Database     | Statement                                   | Example                                                                                                                                                              |
|--------------|---------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **MySQL**    | `INSERT ... ON DUPLICATE KEY UPDATE`        | ```sql<br>INSERT INTO word_counts (word, count) VALUES ('example', 5)<br>ON DUPLICATE KEY UPDATE count = count + 1;<br>```                                            |
| **PostgreSQL**| `INSERT ... ON CONFLICT`                   | ```sql<br>INSERT INTO word_counts (word, count) VALUES ('example', 5)<br>ON CONFLICT (word) DO UPDATE SET count = EXCLUDED.count + 1;<br>```                          |
| **SQLite**   | `INSERT OR REPLACE`                         | ```sql<br>INSERT OR REPLACE INTO word_counts (word, count) VALUES ('example', 5);<br>```                                                                              |

## Explanation

- **MySQL**:
  - **Statement**: `INSERT ... ON DUPLICATE KEY UPDATE`
  - **Example**:
    ```sql
    INSERT INTO word_counts (word, count) VALUES ('example', 5)
    ON DUPLICATE KEY UPDATE count = count + 1;
    ```
  - **Explanation**: If a row with the same `word` already exists, the `count` column of that row is updated.

- **PostgreSQL**:
  - **Statement**: `INSERT ... ON CONFLICT`
  - **Example**:
    ```sql
    INSERT INTO word_counts (word, count) VALUES ('example', 5)
    ON CONFLICT (word) DO UPDATE SET count = EXCLUDED.count + 1;
    ```
  - **Explanation**: If a row with the same `word` already exists, the `count` column is updated using the value from the `EXCLUDED` pseudo-table, which represents the row that would have been inserted.

- **SQLite**:
  - **Statement**: `INSERT OR REPLACE`
  - **Example**:
    ```sql
    INSERT OR REPLACE INTO word_counts (word, count) VALUES ('example', 5);
    ```
  - **Explanation**: If a row with the same `word` already exists, it is replaced with the new row. If no such row exists, a new row is inserted.
