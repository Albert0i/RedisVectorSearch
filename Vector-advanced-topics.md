### [Vector advanced topics](https://university.redis.io/course/i3fv2hbhqnpni8)


#### I. Implementing a text-based recommender system

The idea behind a recommender system using vector search is to transform the relevant information (title, description, date of creation, authors, and more) into the corresponding vector embedding and store it in the same document as the original data. Then, when visualizing an entry (an article from a digital newspaper or any other media from the web), it is possible to leverage the stored vector embedding for that entry and feed into a vector search operation to semantically similar content.

Let's consider the following example.

> If you want to run the example first, jump to the bottom of this article to learn how to do so.

**Writing a recommender system**

- We will use the dataset of books available under [/data/books](https://github.com/redislabs-training/ru402/tree/main/data/books)
- The source code of the example is available as the Jupyter notebook [books.ipynb](https://github.com/redislabs-training/ru402/blob/main/src/jupyter/books.ipynb)

You can refer to the source code for the details to load the books and generate the embeddings. Books will be stored in the following JSON format and using the Redis Stack JSON data type.

```
    {
      "author": "Martha Wells",
      "id": "43",
      "description": "My risk-assessment module predicts a 53 percent chance of a human-on-human massacre before the end of the contract." A short story published in Wired.com magazine on December 17, 2018.",
      "editions": [
        "english"
      ],
      "genres": [
        "adult",
        "artificial intelligence",
        "fantasy",
        "fiction",
        "humor",
        "science fiction",
        "science fiction (dystopia)",
        "short stories",
        "space"
      ],
      "inventory": [
        {
          "status": "available",
          "stock_id": "43_1"
        }
      ],
      "metrics": {
        "rating_votes": 274,
        "score": 4.05
      },
      "pages": 369,
      "title": "Compulsory",
      "url": "https://www.goodreads.com/book/show/56033969-compulsory",
      "year_published": 2018
    }
```

The relevant section in the example is the implementation of semantic search, delivered by this snippet of code:

```
def get_recommendation(key):
embedding = r.json().get(key)
embedding_as_blob = np.array(embedding['embedding'], dtype=np.float32).tobytes()
q = Query("*=>[KNN 5 @embedding $vec AS score]").return_field("$.title").sort_by("score", asc=True).dialect(2).paging(1, 5)
res = r.ft("books_idx").search(q, query_params={"vec": embedding_as_blob})
return res
```

The previous snippet does the following:

- Given a document, it extracts the vector embedding for that document from the JSON entry

- It converts the vector embedding, stored as an array of floats, to a binary array

- It executes Vector Similarity Search to find similarities and get the most similar books

- It pages the results, excluding the first result. Hence, paging starts from 1 rather than 0. In the first position, we would find the entry itself, having a distance from the test vector equal to zero

Launching the execution of the example for the two known movies: ["It"](https://www.goodreads.com/book/show/830502.It) and ["Transformers: The Ultimate Guide"](https://www.goodreads.com/book/show/390032.Transformers) :


```
print(get_recommendation('book:26415'))
print(get_recommendation('book:9'))
```

We obtain the related recommendations:

```
Result{5 total, docs: [Document {'id': 'book:3008', 'payload': None, '$.title': 'Wayward'}, Document {'id': 'book:2706', 'payload': None, '$.title': 'Before the Devil Breaks You'}, Document {'id': 'book:23187', 'payload': None, '$.title': 'Neverwhere'}, Document {'id': 'book:942', 'payload': None, '$.title': 'The Dead'}]}

Result{5 total, docs: [Document {'id': 'book:15', 'payload': None, '$.title': 'Transformers Volume 1: For All Mankind'}, Document {'id': 'book:3', 'payload': None, '$.title': 'Transformers: All Fall Down'}, Document {'id': 'book:110', 'payload': None, '$.title': 'Transformers: Exodus: The Official History of the War for Cybertron (Transformers'}, Document {'id': 'book:2', 'payload': None, '$.title': 'Transformers Generation One, Vol. 1'}]}
```

**Performing range search**

In this example, we executed a KNN search and retrieved the documents with the closest distance from the document being considered. Alternatively, we can perform a vector search range search to retrieve results having the desired distance from the sample vector embedding. The related code is:

```
def get_recommendation_by_range(key):
embedding = r.json().get(key)
embedding_as_blob = np.array(embedding['embedding'], dtype=np.float32).tobytes()
q = Query("@embedding:[VECTOR_RANGE $radius $vec]=>{$YIELD_DISTANCE_AS: score}") \
  .return_fields("title") \
  .sort_by("score", asc=True) \
  .paging(1, 5) \
  .dialect(2)

# Find all vectors within a radius from the query vector
query_params = {
  "radius": 3,
  "vec": embedding_as_blob
}

res = r.ft("books_idx").search(q, query_params)
return res
```

Computing this vector search range search returns similar results.

```
Result{1486 total, docs: [Document {'id': 'book:3008', 'payload': None, 'title': 'Wayward'}, Document {'id': 'book:2706', 'payload': None, 'title': 'Before the Devil Breaks You'}, Document {'id': 'book:23187', 'payload': None, 'title': 'Neverwhere'}, Document {'id': 'book:942', 'payload': None, 'title': 'The Dead'}, Document {'id': 'book:519', 'payload': None, 'title': 'The Last Days of Magic'}]}

Result{1486 total, docs: [Document {'id': 'book:15', 'payload': None, 'title': 'Transformers Volume 1: For All Mankind'}, Document {'id': 'book:3', 'payload': None, 'title': 'Transformers: All Fall Down'}, Document {'id': 'book:110', 'payload': None, 'title': 'Transformers: Exodus: The Official History of the War for Cybertron (Transformers'}, Document {'id': 'book:2', 'payload': None, 'title': 'Transformers Generation One, Vol. 1'}, document {'id': 'book:37', 'payload': None, 'title': 'How to Build a Robot Army: Tips on Defending Planet Earth Against Alien Invaders, Ninjas, and Zombies'}]}
```


#### II. Implementing a face recognition system

Implementing a visual recommender system using vector search follows the same logic as the textual recommender systems. Once the image is modelled as a vector embedding, the implementation is very similar: the main difference resides in the embedding model used to generate the vector from the image file.

In this unit, we will revisit the same concepts learned so far, but rather than text, we will work with images and guide you through implementing a face recognition system.

> If you want to run the example first, jump to the activity to learn how to do so.

**Develop your own face recognition system**

This example delves into modelling and running classification algorithms for human face recognition. While face recognition systems are developed as multi-stage pipelines, including motion detection, image preprocessing, face detection and modeling, classification, and more, in this example, we will put the focus on the modelling and classification algorithms using a pre-trained machine learning model optimized for face recognition, and Redis Stack as a vector database.

Pattern recognition involves the training and testing of a system using data samples. One specific application of pattern recognition is face recognition, which focuses on human faces' unique patterns and features to identify individuals.

We will use the [ORL Database of Faces](https://www.kaggle.com/datasets/tavarez/the-orl-database-for-training-and-testing/), provided by the [AT&T Laboratories Cambridge](http://cam-orl.co.uk/facedatabase.html), to train and test the system. The ORL database is among the simplest face databases, comprised of pictures of 40 individuals taken between April 1992 and April 1994, 10 images each, for a total of 400 photos: 92x112 black and white bitmaps. The faces are aligned, normalized, and ready to be processed by a feature extraction algorithm.

![alt Implementing a face recognition system](img/Implementing-a-face-recognition-system.JPG)

We will split the dataset into training and testing sets.

- Of the 10 photos available per individual, we select 5 to extract vector embeddings and store them in Redis, one per document. This means we will use 200 images to train our system to recognize identities from the ORL database
- The rest of 5 faces are used to test the system. Every test image is vectorized and vector search performed.
- If the identity of the individual matches the result of vector search, we account for a success
- We will present a recognition rate. Testing with different embedding models can be evaluated by the success rate

We can extract the vector embeddings using [Deepface](https://github.com/serengil/deepface), a lightweight library for face recognition and facial attribute analysis. The library supports several models. In the example, we have configured [VGG-Face](https://sefiks.com/2018/08/06/deep-face-recognition-with-keras/), which maps an image to a vector of 2622 elements.

**Working with Hashes**

We propose two different models for this system. We can model a user as a series of Hashes, each containing a vector embedding. An example of an entry would be:

```
HGETALL face:s33:4
1) "person_path"
2) "../../data/orl/s33/4.bmp"
3) "person_id"
4) "s33"
5) "embedding"
6) "...binary_blob...
```

The code sample that implements the logic follows.

```
for person in range(1, 41):
    person = "s" + str(person)
    for face in range(1, 6):
        facepath = '../../data/orl/' + person + "/" + str(face) + '.bmp'
        print ("Training face: " + facepath)
        vec = DeepFace.represent(facepath, model_name=models[0], enforce_detection=False)[0]['embedding']
        embedding = np.array(vec, dtype=np.float32).astype(np.float32).tobytes()
        face_data_values ={ 'person_id':person,
                            'person_path':facepath,
                            'embedding':embedding}
        r.hset('face:'+person+':'+str(face),mapping=face_data_values)
   
```

**Calculating the recognition rate**

Similarly to the training phase, we iterate through the rest of the faces, extract the vector embedding from each facial picture, and perform vector search. If the recognition is successful, and the face belongs to the known identity, we increment a counter to calculate a relative rate.

```
def find_face(facepath):
vec = DeepFace.represent(facepath, model_name=models[0], enforce_detection=False)[0]['embedding']
embedding = np.array(vec, dtype=np.float32).astype(np.float32).tobytes()

q = Query("*=>[KNN 1 @embedding $vec AS score]").return_field("score").dialect(2)
res = r.ft("face_idx").search(q, query_params={"vec": embedding})

for face in res.docs:
    print(face.id.split(":")[1])
    return face.id.split(":")[1]


def test():
success = 0
for person in range(1, 41):
    person = "s" + str(person)
    for face in range(6, 11):
        facepath = '../../data/orl/' + person + "/" + str(face) + '.bmp'
        print ("Testing face: " + facepath)
        found = find_face(facepath)
        if (person == found):
            success = success +1

print(success/200*100)   
```

The default vector search parameters used in the example and the chosen embedding model provide a recognition rate of 99.5%. You can experiment further with different models.

**Working with JSON documents**

Modeling the training set using JSON documents allows a more compact data representation. We can store all the vector embeddings for a person (five, in this example) in the same JSON document rather than one Hash document per vector embedding.

```
JSON.GET face:s11
{"person_id":"s11","embeddings":[[0.006758151110261679,0.018658878281712532,...],[0.006758151110261679,0.018658878281712532,...],[0.006758151110261679,0.018658878281712532,...],[0.006758151110261679,0.018658878281712532,...],[0.006758151110261679,0.018658878281712532,...]]
```

One unique feature of JSON documents is that you can index multiple numeric arrays as VECTOR, use a JSONPath matching multiple numeric arrays using JSONPath operators such as wildcard, filter, union, array slice, and/or recursive descent.

The example proposed so far can be adapted with minor modifications. We can store the training set with the JSON command [JSON.ARRAPPEND](https://redis.io/commands/json.arrappend/) under the $.embedding field as follows:

```
for person in range(1, 41):
    person = "s" + str(person)
    r.json().set(f"face:{person}", "$", {'person_id':person})
    r.json().set(f"face:{person}", "$.embeddings", [])
    for face in range(1, 6):
        facepath = '../../data/orl/' + person + "/" + str(face) + '.bmp'
        print ("Training face: " + facepath)
        vec = DeepFace.represent(facepath, model_name=EMBEDDING_MODEL, enforce_detection=False)[0]['embedding']
        embedding = np.array(vec, dtype=np.float32).astype(np.float32).tolist()
        r.json().arrappend(f"face:{person}",'$.embeddings', embedding)
```

The index definition changes slightly, as well. Here, we define what portion of the JSON document we would like to index using a JSONPath expression.

```
index_def = IndexDefinition(prefix=["face:"], index_type=IndexType.JSON)
schema = (VectorField("$.embeddings[*]", "HNSW", {"TYPE": "FLOAT32", "DIM": 2622, "DISTANCE_METRIC": "COSINE"}, as_name="embeddings"))
r.ft('face_idx').create_index(schema, definition=index_def)
```

> Note how the expression $.embeddings[*] selects all the vectors under the field $.embeddings.

The execution of this example achieves the same recognition rate. You will now have the chance to study the entire notebook and run the examples.


#### III. Lab Guide | Implementing a face recognition system

We have provided you with two Jupyter notebooks, one modeling the training set with Hashes and the other using JSON documents. Follow this procedure to create and activate your Python virtual environment:

```
python -m venv vssvenv
source vssvenv/bin/activate
```

Once done, install the required modules defined by the requirements.txt requirements file, available under /src/jupyter

```
pip install -r requirements.txt
```

Ensure that you have database host, port, username and password for your Redis Cloud database at hand (alternatively, a Redis Stack instance is running). Complete the configuration of the environment by setting the environment variable that configures your Redis instance (default is localhost on port 6379).

1. Connect to the database using RedisInsight or redis-cli and flush the database with FLUSHALL.
2. Configure the environment variable to connect export REDIS_URL=redis://user:password@host:port

Now, you can start the notebooks, execute all the cells, and check the recognition rate presented once all the tests are performed. Execute the following notebook for the example using the Hash data structure:

```
jupyter notebook faces.ipynb
```

And the following one to use the JSON data structure:

```
jupyter notebook faces_json.ipynb
```


#### IV. Large language models


#### V. Fine-tuning and Retrieval Augmented Generation (RAG)


#### VI. LLM conversation memory


#### VII. Semantic caching


#### VIII. Setting up a RAG Chatbot


#### IX. Lab Guide | Setting up a RAG Chatbot


#### X. "The sky is the limit"


#### XI. Take your next step


### EOF (2025/02/22)