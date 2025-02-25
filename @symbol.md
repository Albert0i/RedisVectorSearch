
### `FT.SEARCH` Command:
- **`SORTBY` Clause**: Use the field name directly without the `@` symbol.
  - **Example**:
    ```redis
    FT.SEARCH idx:quotes "Charles Dickens" SORTBY author ASC
    ```
### `FT.AGGREGATE` Command:
- **`GROUPBY` Clause**: Use the `@` symbol to reference the field.
  - **Example**:
    ```redis
    FT.AGGREGATE idx:quotes "*" GROUPBY 1 @author
    ```
### Why the Difference?
- **`FT.SEARCH`**: The `SORTBY` clause in `FT.SEARCH` is designed to be straightforward, allowing you to specify the field name directly for sorting purposes.
- **`FT.AGGREGATE`**: The `GROUPBY` clause in `FT.AGGREGATE` requires the `@` symbol to explicitly indicate that you are referencing a field. This is because `FT.AGGREGATE` can involve more complex operations, and the `@` symbol helps to clearly distinguish field references from other elements in the query.
### Summary:
- **`FT.SEARCH` with `SORTBY`**: Use the field name directly.
  - **Correct**: `FT.SEARCH idx:quotes "Charles Dickens" SORTBY author ASC`
  - **Incorrect**: `FT.SEARCH idx:quotes "Charles Dickens" SORTBY @author ASC`
- **`FT.AGGREGATE` with `GROUPBY`**: Use the `@` symbol before the field name.
  - **Correct**: `FT.AGGREGATE idx:quotes "*" GROUPBY 1 @author`
  - **Incorrect**: `FT.AGGREGATE idx:quotes "*" GROUPBY 1 author`
### Practical Tip:
- **Remember**: Use `@` for `GROUPBY` in `FT.AGGREGATE` and omit `@` for `SORTBY` in `FT.SEARCH`.




### Complex `FT.AGGREGATE` Example
#### Scenario:
Suppose we have an index `idx:quotes` with documents containing quotes, authors, and sources. We want to:
1. Group the quotes by author.
2. Count the number of quotes per author.
3. Calculate the average length of quotes per author.
4. Sort the results by the number of quotes in descending order.
5. Limit the results to the top 5 authors.

#### Example Query:
```redis
FT.AGGREGATE idx:quotes "*" 
  LOAD 1 @quote 
  APPLY "strlen(@quote)" AS quote_length 
  GROUPBY 1 @author 
  REDUCE COUNT 0 AS num_quotes 
  REDUCE AVG 1 @quote_length AS avg_quote_length 
  SORTBY 2 @num_quotes DESC 
  LIMIT 0 5
```
```
1) "6"
2) 1) "author"
   2) "Edgar Allan Poe"
   3) "num_quotes"
   4) "42"
   5) "avg_quote_length"
   6) "71.8095238095"
3) 1) "author"
   2) "Fyodor Dostoevsky"
   3) "num_quotes"
   4) "41"
   5) "avg_quote_length"
   6) "75.6097560976"
4) 1) "author"
   2) "Oscar Wilde"
   3) "num_quotes"
   4) "41"
   5) "avg_quote_length"
   6) "65.756097561"
5) 1) "author"
   2) "Charles Dickens"
   3) "num_quotes"
   4) "41"
   5) "avg_quote_length"
   6) "85.6097560976"
6) 1) "author"
   2) "George Orwell"
   3) "num_quotes"
   4) "40"
   5) "avg_quote_length"
   6) "81.725"
> 
```

#### Reference
1. [APPLY expressions](https://redis.io/docs/latest/develop/interact/search-and-query/advanced-concepts/aggregations/#apply-expressions)
2. [Supported GROUPBY reducers](https://redis.io/docs/latest/develop/interact/search-and-query/advanced-concepts/aggregations/#supported-groupby-reducers)