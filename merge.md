
The `MERGE` statement in Oracle is a powerful tool that allows you to perform `INSERT`, `UPDATE`, and `DELETE` operations in a single statement. It's especially useful for synchronizing tables or handling situations where you want to insert new records or update existing ones based on certain conditions.

### MERGE Statement Syntax
Here's the basic syntax for the `MERGE` statement in Oracle:

```sql
MERGE INTO target_table USING source_table
ON (condition)
WHEN MATCHED THEN
    UPDATE SET column1 = value1, column2 = value2, ...
WHEN NOT MATCHED THEN
    INSERT (column1, column2, ...) VALUES (value1, value2, ...);
```

### Example
Let's assume you have two tables: `employees` and `employees_updates`. You want to update the `employees` table with data from `employees_updates`. If an employee exists, their data will be updated; if they don't exist, a new record will be inserted.

```sql
MERGE INTO employees e
USING employees_updates u
ON (e.employee_id = u.employee_id)
WHEN MATCHED THEN
    UPDATE SET
        e.first_name = u.first_name,
        e.last_name = u.last_name,
        e.department = u.department
WHEN NOT MATCHED THEN
    INSERT (employee_id, first_name, last_name, department)
    VALUES (u.employee_id, u.first_name, u.last_name, u.department);
```

### Handling `INSERT ON DUPLICATE` Issue
Oracle does not have an `INSERT ... ON DUPLICATE KEY UPDATE` clause like MySQL. However, the `MERGE` statement can be used to achieve similar functionality.

### Example of Handling Duplicates with `MERGE`
Suppose you have a table `products`, and you want to insert a new product or update the price if the product already exists.

```sql
MERGE INTO products p
USING (SELECT 101 AS product_id, 'Laptop' AS product_name, 1500 AS price FROM dual) new_data
ON (p.product_id = new_data.product_id)
WHEN MATCHED THEN
    UPDATE SET p.price = new_data.price
WHEN NOT MATCHED THEN
    INSERT (product_id, product_name, price)
    VALUES (new_data.product_id, new_data.product_name, new_data.price);
```

### Key Components
- **`MERGE INTO target_table`**: Specifies the table that will be merged into.
- **`USING source_table`**: Specifies the source table or subquery that provides the data to merge.
- **`ON (condition)`**: Defines the condition for matching rows between the target and source tables.
- **`WHEN MATCHED THEN`**: Specifies the actions to take when a match is found (usually an `UPDATE`).
- **`WHEN NOT MATCHED THEN`**: Specifies the actions to take when no match is found (usually an `INSERT`).

### Practical Considerations
- The `MERGE` statement is ideal for upserting data (update existing records, insert new records).
- It is efficient because it combines multiple operations into a single statement.
- The `MERGE` statement helps avoid duplication and ensures data consistency.

By using the `MERGE` statement, you can efficiently handle both updates and inserts in a single operation, providing a robust solution for managing data synchronization and handling duplicates.

