### Redis Vector Search 


#### Prologue


#### I. Subtext

[Vectors](https://redis.io/docs/latest/develop/interact/search-and-query/advanced-concepts/vectors/)


#### II. [Storing vectors](https://redis.io/docs/latest/develop/interact/search-and-query/advanced-concepts/vectors/#store-and-update-vectors)
```
```

#### III. [Create a vector index](https://redis.io/docs/latest/develop/interact/search-and-query/advanced-concepts/vectors/#create-a-vector-index)


> VECTOR - Allows vector queries against the value in this attribute. This requires [query dialect 2](https://redis.io/docs/latest/develop/interact/search-and-query/advanced-concepts/dialects/#dialect-2) or above (introduced in [RediSearch v2.4](https://github.com/RediSearch/RediSearch/releases/tag/v2.4.3)). For more information, see [Vector Fields](https://redis.io/docs/latest/develop/interact/search-and-query/advanced-concepts/vectors/).


```
FT.CREATE idx:quotes ON JSON PREFIX 1 quote:
  SCHEMA
  $.author as author TEXT NOSTEM SORTABLE
  $.quote as quote TEXT NOSTEM SORTABLE
  $.source as source TEXT NOSTEM SORTABLE
  $.embeddings as embeddings VECTOR FLAT 10
          TYPE FLOAT32
          DIM 768
          DISTANCE_METRIC L2
          INITIAL_CAP 111
          BLOCK_SIZE  111
```

#### IV. [Search with vectors](https://redis.io/docs/latest/develop/interact/search-and-query/advanced-concepts/vectors/#search-with-vectors)
```
```

#### V. Bibliography
1. [Redis as a Vector Database Explained](https://youtu.be/xhLXZ0Hqudk)
2. [Redis as a vector database](https://university.redis.io/course/7e2qbbeg963twz)
3. [Introduction to vector search](https://university.redis.io/course/yz1lretjfpdlew)
4. [Introduction to semantic search](https://university.redis.io/course/9xcwbkijvf4a4k)
5. [How to Perform Vector Similarity Search Using Redis in NodeJS](https://redis.io/learn/howtos/solutions/vector/getting-started-vector)
6. [Redis as a vector database quick start guide](https://redis.io/docs/latest/develop/get-started/vector-database/)
7. [Query data](https://redis.io/docs/latest/develop/interact/search-and-query/query/)
8. [ioredis](https://github.com/redis/ioredis?tab=readme-ov-file)
9. [Transformers.js](https://github.com/huggingface/transformers.js?tab=readme-ov-file#readme)
10. [The Stranger by Albert Camus](https://www.macobo.com/essays/epdf/CAMUS,%20Albert%20-%20The%20Stranger.pdf)


#### Epilogue 


### EOF (2025/02/11)