### [Working with node-redis](https://university.redis.io/course/eavvi5k9jdggnb/submodule/weyvds6cp5yidi/)


We've provided you with a small example program that uses the [node-redis](https://github.com/redis/node-redis) client for Node.js to store and manipulate data in Redis.

The code is located in the [src/nodejs/](https://github.com/redislabs-training/ru402/tree/main/src/nodejs) folder in the course GitHub repository. You should have already cloned this repository to your machine as part of the initial course setup step.

Follow the instructions in the [README.md](https://github.com/redislabs-training/ru402/blob/main/src/nodejs/README.md) file if you'd like to run the code in your local environment.


#### I. **Code Walkthrough**

The example is a JavaScript version of the simple vector search example already introduced along the course, where we:

1. Instantiate the proper embedding model
2. Create the index with the desired fields
3. Create vectors from the three sentences using the model, and store them
4. Consider a sample sentence, calculate the embedding, and perform VSS


#### II. **Embedding model creation**

The embedding model we will be using in this example proceeds from the [Transformers.js](https://www.npmjs.com/package/@xenova/transformers) library. The dependencies can be added to the project as follows:

```
npm install redis
npm install @xenova/transformers
```

The chosen model is [all-distilroberta-v1](https://huggingface.co/sentence-transformers/all-distilroberta-v1), which maps sentences and paragraphs to a 768-dimensional dense vector space.

```
async function generateSentenceEmbeddings(sentence) {
    let modelName = 'Xenova/all-distilroberta-v1';
    let pipe = await transformers.pipeline('feature-extraction', modelName);
    let vectorOutput = await pipe(sentence, { 
                                                pooling: 'mean',
                                                normalize: true,
                                            });
    const embedding = Object.values(vectorOutput?.data);
    return embedding;
}
```


#### III. **Index creation**

In this example, we are modelling simple documents having this structure:

```
{
    "content": "This is a content",
    "genre": "just-a-genre",
    "embedding": "..."
}
```

Provided there is no nested information in our document, the Hash data type fulfills the purpose. In addition to creating an index for the vector embedding, we will also create a full-text index of type TEXT for the content field and an index of type TAG for the genre field. The relevant options for the VECTOR index type, such as the Euclidean distance and the vector dimension, are also specified. You can learn more about the rest of the options from the [documentation](https://redis.io/docs/interact/search-and-query/advanced-concepts/vectors/).

```
async function createIndex() {
    const schema = {
        'content': {
            type: SchemaFieldTypes.TEXT,
            sortable: false
        },
        'genre': {
            type: SchemaFieldTypes.TAG,
            sortable: false
        },
        'embedding': {
            type: SchemaFieldTypes.VECTOR,
            TYPE: 'FLOAT32',
            ALGORITHM: VectorAlgorithms.HNSW,
            DIM: 768,
            DISTANCE_METRIC: 'L2',
            INITIAL_CAP: 3,
            AS: 'embedding',
        }
    }

    try {
        const client = await getNodeRedisClient();
        await client.ft.create('vector_idx', schema, {
        ON: 'HASH',
        PREFIX: 'doc:'
        });
    }
    catch (e) {
        if (e.message === 'Index already exists') {
            console.log('Index exists already, skipped creation.');
        } else {
            console.error(e);
            process.exit(1);
        }
    }
}
```


#### IV. **Vector embedding generation**

Vector embeddings can be created using the model created before. Note that embeddings are stored in Hashes using the binary blob format used in the example.

```
const sentence1 = { "content":"That is a very happy person", 
                    "genre":"persons", 
                    "embedding":float32Buffer(await generateSentenceEmbeddings("That is a very happy person"))}

client.hSet('doc:1', sentence1);
```

> The function float32Buffer, defined in the example, converts the array of floats to a binary blob.


#### V. **Perform the search**

Finally, considering the test sentence "That is a happy person", we perform the KNN search and return the score of the search and the content of the best matches. In this example, we are returning the three documents so you can analyze the score.

```
async function vss() {
    const client = await getNodeRedisClient();

    const similar = await client.ft.search(
        'vector_idx',
        '*=>[KNN 3 @embedding $B AS score]',{
            "PARAMS": 
                {
                    B: float32Buffer(await generateSentenceEmbeddings("That is a happy person")),
                },
            "RETURN": ['score', 'content'],
            "DIALECT": "2"
        },
    );
    
    console.log(`Vector search results found: ${similar.total}.`);
    for (const doc of similar.documents) {
        console.log(`${doc.id}: ${doc.value.content} with score ${doc.value.score}`);
    }
}
```


### EOF (2025/02/15)