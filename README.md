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
FT.CREATE <index_name>
  ON <storage_type>
  PREFIX 1 <key_prefix>
  SCHEMA ... <field_name> VECTOR <algorithm> <index_attribute_count> <index_attribute_name> <index_attribute_value>
    [<index_attribute_name> <index_attribute_value> ...]
```

| Parameter | Description |
| ----------- | ----------- |
| algorithm | Vector index algorithm (FLAT or HNSW). |
| index_attribute_count | Number of vector field attributes. |
| index_attribute_name | Vector field attribute name.. |
| index_attribute_value | Vector field attribute value. |

> Choose the FLAT index when you have small datasets (< 1M vectors) or when perfect search accuracy is more important than search latency.

| Attribute | Description |
| ----------- | ----------- |
| TYPE | Vector type (BFLOAT16, FLOAT16, FLOAT32, FLOAT64). BFLOAT16 and FLOAT16 require v2.10 or later. |
| DIM | The width, or number of dimensions, of the vector embeddings stored in this field. In other words, the number of floating point elements comprising the vector. DIM must be a positive integer. The vector used to query this field must have the exact dimensions as the field itself. |
| DISTANCE_METRIC | Distance metric (L2, IP, COSINE). |

```
FT.CREATE documents
  ON HASH
  PREFIX 1 docs:
  SCHEMA doc_embedding VECTOR FLAT 6
    TYPE FLOAT32
    DIM 1536
    DISTANCE_METRIC COSINE
```
> In the example above, an index named documents is created over hashes with the key prefix docs: and a FLAT vector field named doc_embedding with three index attributes: TYPE, DIM, and DISTANCE_METRIC.

> Redis supports three popular distance metrics to measure the degree of similarity between two vectors.

![alt Distance metric](img/DistanceMetric.JPG)

- Euclidean distance is a measure of the straight-line distance between two points in Euclidean space. In two-dimensional space, this is the familiar distance we think of in geometry.
- The inner product, also known as the dot product, is a fundamental operation in linear algebra and vector calculus. It is a way to multiply two vectors to produce a scalar (a single number).
- Cosine distance is a measure of the angle between two non-zero vectors in a multi-dimensional space. It is derived from the cosine similarity, which measures the cosine of the angle between two vectors. While cosine similarity ranges from -1 to 1, cosine distance is a measure that ranges from 0 to 1 and represents the angular distance between the vectors.

> The above metrics calculate distance between two vectors, where the smaller the value is, the closer the two vectors are in the vector space.

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