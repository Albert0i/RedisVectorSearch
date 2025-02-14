### [Redis as a vector database](https://university.redis.io/course/7e2qbbeg963twz/submodule/pdeyytvexwjcpy/)


#### I. Accelerating semantic search

Pre-trained machine learning models simplify the job of data scientists and avoid lengthy and complex operations to turn objects into the corresponding vector embedding. However, managing massive datasets for development and production environments becomes challenging, especially when real-time throughput, scalability, and high availability are not negotiable requirements.

The availability of machine learning models has boosted the rise of modern use cases and, consequently, the development and adoption of vector databases. Vector databases can store vectors and index and search the vector space efficiently.

Vector databases resolve the problem of managing vectors and their operations, so they must meet specific throughput requirements, ensuring they can handle increasing volumes of data and queries. Hence, it is crucial to ensure the scalability of the data layer and guarantee high availability, with high uptime and uninterrupted access to the stored vector data in case of disaster or maintenance operations.

![alt Accelerating semantic search](img/Accelerating-semantic-searchJPG.JPG)

In the following units, we will learn how Redis Stack is designed to perform vector search across millions of vectors with real-time performance. In addition, we will discover how Redis Enterprise and Redis Cloud are designed for high availability and scalability and allow the design of production-ready modern applications.

#### II. Modeling vectors in Redis

All the Redis database flavors can store, index, and search vectors. This means that you can work with vectors using the [Redis Stack](https://redis.io/docs/about/about-stack/) distribution in your development environment and also for functional testing. Redis Enterprise and Redis Enterprise Cloud are built upon the Redis Stack capabilities, but they also offer a robust set of features to work efficiently with vectors at scale.

![alt Modeling vectors in Redis](img/Modeling-vectors-in-Redis.JPG)

First, it is important to highlight that before the native support for vectors was introduced in Redis Stack Server 6.2.2-v1 in 2022, vectors would be stored in Redis as a string, so serializing the vector and storing it in the desired data structure. An example using the String:

```
SET vec "0.00555776,0.06124274,-0.05503812,-0.08395513,-0.09052192,-0.01091553,-0.06539601,0.01099653,-0.07732834,0.0536432"
```

Redis can store any arbitrary object once serialization and deserialization routines are available. A vector is just another object that Redis can store when serialized to the String type. However, Redis has no awareness of the intrinsic nature of the stored object and does not offer any feature to search through the space of vectors.

Since Redis Stack Server 6.2.2-v1, vectors can be stored as Hash or JSON documents, providing flexibility in how data is structured and accessed. Multiple indexing methods are supported, including FLAT and HNSW, enabling users to choose the most suitable approach for their specific use cases. Users can privilege precision over speed with the FLAT method or ensure high throughput with a little compromise on accuracy using HNSW. Additionally, Redis offers support for various distance metrics such as L2, IP, and COSINE, further enhancing the precision and efficiency of vector searches for specific types of embeddings. With these features, Redis becomes a flexible solution for businesses seeking to harness the power of vector data in diverse applications, from recommendation engines to similarity search tasks.

#### III. Storing vectors: the HASH and JSON data types

Both the Hash and the JSON data types are suitable vector containers. In the following examples, we will show how to work with such data types. Let's calculate the vector embedding first, using the free [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) embedding model from the HuggingFace library. This model maps texts of up to 256 words to a 384-dimensional dense vector space.

```
text = "Understanding vector search is easy, but understanding all the mathematics behind a vector is not!"
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
embedding = model.encode(text)
```

> Note that Redis does not generate vectors; this is the responsibility of the client application to choose the desired library (HuggingFace, OpenAI, Cohere, and more)

Next, we will store the vector embedding using the desired data structure and learn the syntax to create the index on the vector field stored in the document of choice. If you have already worked with Redis secondary indexing capabilities, you know how to use the commands [FT.CREATE](https://redis.io/commands/ft.create/) and [FT.SEARCH](https://redis.io/commands/ft.search/). Vectors can be indexed using the VECTOR data type, which adds to the existing TEXT, TAG, NUMERIC, GEO and GEOSHAPE types.

#### IV. Working with hashes

The vector embedding we have just generated can be stored in a Hash as a **binary blob** within the document itself, together with the rest of the fields. This means that if our document is structured as follows:

```
{
    "content": "Understanding vector search is easy, but understanding all the mathematics behind a vector is not!",
    "genre": "technical"
}
```

then we will include the vector embedding in the document itself:

```
{
    "content": "Understanding vector search is easy, but understanding all the mathematics behind a vector is not!",
    "genre": "technical",
    "embedding": "..."
}
```

In the following Python code sample, the utility astype from the [numPy](https://numpy.org/) library for scientific computing is used: it casts the vector to the desired binary blob format, required by Redis for indexing purposes.

```
blob = embedding.astype(np.float32).tobytes()
r.hset('doc:1', mapping = {'embedding': blob,
                           'genre': 'technical',
                           'content': text})
```

Hash documents can be indexed with FT.CREATE using the VECTOR index type. We can also index other fields in the same index definition, like the TEXT and TAG fields in the following instructions. Indexing several fields in the same index enables hybrid searches, which we'll show later.

```
FT.CREATE doc_idx ON HASH PREFIX 1 doc: SCHEMA content AS content TEXT genre AS genre TAG embedding VECTOR HNSW 6 TYPE FLOAT32 DIM 384 DISTANCE_METRIC COSINE
```

Note how we have specified:

- the dimension of the vectors, set by the specific embedding model [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)

- the indexing method, HNSW

- the vector type, FLOAT32 in the example

- the distance, COSINE in the example

Refer to the [documentation](https://redis.io/docs/interact/search-and-query/advanced-concepts/vectors/) to learn more about these options.

#### V. Working with JSON documents

When using the JSON type to store the vectors, differently from the hash, vectors must be stored as **arrays of floats** instead of binary blobs. In this Python code sample, the numPy library converts the vector embedding to a list and stores it with the original text and the desired data.

```
vector = embedding.tolist()
doc = {
    'embedding': vector,
    'genre': 'technical',
    'content': text
}
r.json().set("doc:1", '$', doc)
```

Redis long-time users are familiar with the Hash data type and may opt for it based on its simplicity, speed, and reduced memory footprint. Users that have experience with document stores, instead, may privilege the JSON format for better interoperability.

> Note that one JSON document can store and index multiple vector embeddings. Certain data models may benefit from this feature for specific data representations and document searches. For example, if a large document is split into several chunks, these can all be stored under the same JSON document together with their associated representation as a vector.

Indexing the JSON document can be achieved similarly to the hash:

```
FT.CREATE doc_idx ON JSON PREFIX 1 doc: SCHEMA $.content as content TEXT $.genre AS genre TAG $.embedding VECTOR HNSW 6 TYPE FLOAT32 DIM 384 DISTANCE_METRIC COSINE
```

Once the data is inserted and the index created using the desired data type, searching for similarity is straightforward.

#### VI. Lab Guide | Searching vectors

We know how to generate vector embeddings and create the corresponding index on the vector field. Let's go back to the former example when we introduced the concept of cosine similarity, and let's run the example to store the sentences once they are vectorized and search them.

You can create a Python environment and install the required libraries to run the example as follows:

```
python -m venv redisvenv
source ./redisvenv/bin/activate

pip install numpy
pip install sentence_transformers
pip install redis
```

Once your virtual environment is configured, you can move on to the rest of the tasks.

1. Download the code provided in the file [vector_search.py](https://github.com/redislabs-training/ru402/blob/main/courseware/activities/section_3/vector_search.py).

2. Study the code example. In particular, focus on the conversion of the embedding to binary blob and how it is stored in the hash data structure.

3. Configure your Redis Cloud (or local instance) database host, port, username and password in the file.

4. Connect to the database using RedisInsight or redis-cli and flush the database with FLUSHALL.

5. Execute the example. The first time the sample is executed, the requested embedding model all-MiniLM-L6-v2 is downloaded and stored. Wait patiently, this can take a few seconds.

The former script will print on the terminal the two closest results using the [k-nearest neighbors algorithm (KNN)](https://en.wikipedia.org/wiki/K-nearest_neighbors_algorithm):

```
Result{2 total, docs: [Document {'id': 'doc:1', 'payload': None, 'score': '0.0570845603943', 'content': 'That is a very happy person'}, Document {'id': 'doc:2', 'payload': None, 'score': '0.305422723293', 'content': 'That is a happy dog'}]}
```
Expectedly, the best match is "That is a very happy person", having a shorter distance from the test sentence "That is a happy person".

> Note that the cosine distance is complementary to cosine similarity and can be obtained by subtracting the value of the cosine similarity from 1.

#### VII. Data types, distances and indexing methods

Using Redis as a Vector Database, you have several options to make at design time that will influence your data model, the correctness of the results, and the overall performance of your application. The three main aspects you will evaluate in this unit are:

- The data type
- The distance
- The indexing methods

Let's cover the main points to consider when designing your application.

**Choosing the right data type**

Redis can store and manage vectors in Hash or JSON data types, as discussed. Besides the intrinsic structural differences between the Hash and the JSON, let's make some considerations.

First, the JSON data type supports the same features as the Hash data type when performing VSS. There are some slight differences, though, to take into account when working with a determined type.

- **Searching**
1. When using **Hashes**, storing and searching vectors requires using the binary blob format.
2. For **JSON documents**, formats used for storing and searching are asymmetric: vectors must be stored as lists rather than binary blobs 
```
(model.encode(text).astype(np.float32).tolist()), but to perform VSS, JSON requires the binary blob format model.encode(text).astype(np.float32).tobytes()
```
- **Indexing**. The Hash can index a single vector, defined by the FT.CREATE command. The JSON format, instead, can store and have multiple vectors indexed, identified by a JSONPath expression
- **Footprint**. JSON has a larger memory footprint compared to the Hash

**Choosing the right distance**

We mentioned that similarity between vectors can be measured through different methods; currently, we support three among the most popular: Euclidean distance, Internal product, and Cosine similarity.

- **L2**. The Euclidean distance is the default distance metric used by many algorithms, and it generally gives good results. Conceptually, it should be used when we compare observations whose features are continuous: numeric variables like height, weight, or salaries, for example, although it should be noted that it works best with low-dimensional data and where the magnitude of the vectors is important to be measured.

- **COSINE**. Cosine similarity considers the cosine of the angle formed by two vectors (when the angle is close to 0, the cosine tends to 1, representing the maximum similarity). The cosine similarity does not account for the magnitude of the vectors being compared. The cosine distance is complementary to cosine similarity (obtained by subtracting the cosine similarity value from 1). This distance is appropriate when the magnitude of the vectors is not important in the description of the unstructured data

- **IP**. The inner product looks at both the angle between the vectors and their magnitude. Note that this distance is equivalent to cosine similarity if vectors are normalized.

Depending on the model used to represent the unstructured data, one distance may fit better than the others.

**Choosing the indexing method**

When a new vector is added to Redis, it can be indexed by one of the two indexing methods:

- Flat index (FLAT)<br />
You can use the FLAT indexing method for smaller datasets. This method compares the test vector to all the vectors in the index, one by one. This is a more accurate but much slower and compute-intensive approach
- Hierarchical Navigable Small World graphs (HNSW)<br />
For more extensive datasets, it becomes difficult to compare the test vector to every single vector in the index, so a probabilistic approach is adopted through the HNSW algorithm. This method provides speedy search results. This approach trades some accuracy for significant performance improvements.

#### VIII. Lab Guide | Vector search with range queries

#### IX. Lab Guide | Vector search with hybrid queries


#### X. Quiz | Redis as a Vector Database 


In this activity you will run a simple example to model the sentences considered before:

- "That is a very happy person"

- "That is a happy dog"

- "Today is a sunny day"

Then, you will test the similarity of the sentence "That is a happy person" to the three sentences. You can create a Python environment and install the required libraries to run the example as follows:

python -m venv redisvenv source ./redisvenv/bin/activate pip install numpy pip install sentence_transformers

Once your virtual environment is configured, you can move on to the rest of the tasks.

1. Download the code provided in the file [cosine_distance.py](https://github.com/redislabs-training/ru402/blob/main/courseware/activities/section_2/cosine_distance.py).

2. Study the code example. In particular, focus on the vector embedding generation and the algorithm that computes cosine similarity in the function cosine_similarity(a, b)

3. Execute the example. The first time the sample is executed, the requested embedding model all-MiniLM-L6-v2 is downloaded and stored. Wait patiently, this can take a few seconds.

Running this example returns the following output:

Query: That is a happy person That is a very happy person  -> similarity score =  0.9429151 That is a happy dog  -> similarity score =  0.6945774 Today is a sunny day  -> similarity score =  0.256876

We could have expected that the sentences "That is a happy person" and "That is a very happy person" represent the pair having the highest similarity score. In the example, we are comparing the angles between pairs of vectors in a 384-dimensional vector space using the cosine distance.

![alt Lab Guide](img/Lab-Guide.JPG)

The closest the angle between the two vectors to zero, the closest is the cosine to one, which indicates a higher similarity between the two sentences.

Congratulations! You are now able to calculate the similarity of vectors to retrieve semantically relevant results!


#### V. Quiz | Introduction to Vector Search

1. What operation must be executed in preparation for performing vector search?

- Vectorize the documents in a two-dimensional vector space (　)

- Define a distance that will be used to compute the similarity of the vectors ( &#10003;
 )

- Sort the vectors based on their length (　)

- Create a full-text search index and perform data indexation (　)

2. What does cosine similarity primarily focus on in vector search?

- The magnitude of vectors (　)

- The Euclidean distance between vectors (　)

- The angle between vectors ( &#10003;
 )

- The internal product of vectors (　)


### EOF (2025/02/21)
