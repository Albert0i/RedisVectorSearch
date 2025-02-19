### [Vector advanced topics](https://university.redis.io/course/i3fv2hbhqnpni8)


#### I. Implementing a text-based recommender system

The idea behind a recommender system using vector search is to transform the relevant information (title, description, date of creation, authors, and more) into the corresponding vector embedding and store it in the same document as the original data. Then, when visualizing an entry (an article from a digital newspaper or any other media from the web), it is possible to leverage the stored vector embedding for that entry and feed into a vector search operation to semantically similar content.

Let's consider the following example.

> *If you want to run the example first, jump to the bottom of this article to learn how to do so.*

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

In this example, we executed a KNN search and retrieved the documents with the closest distance from the document being considered. Alternatively, we can perform a vector search range search to retrieve results having the **desired distance** from the sample vector embedding. The related code is:

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

> *If you want to run the example first, jump to the activity to learn how to do so.*

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

In this snippet, we iterate through the number of persons and training faces to build the file system path, then feed the model to the DeepFace library and store the dictionary inclusive of the embedding.

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

The default vector search parameters used in the example and the chosen embedding model provide a **recognition rate of 99.5%**. You can experiment further with different models.

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

> *Note how the expression $.embeddings[*] selects all the vectors under the field $.embeddings.*

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

The rise of conversational Artificial Intelligence (AI) has taken the world by storm in the early months of 2023, thanks to the advent of powerful Large Language Models (LLMs) such as ChatGPT [latest releases](https://openai.com/research/gpt-4). ChatGPT versions 3.5 and 4, presented around March 2023, have surprised users with unprecedented quality answers, the ability to solve complex and structured problems, produce ideas, organize and edit texts, and generate source code, all of this using natural and conversational questions in the desired language have impressed the world in a wide variety of scenarios and use cases. While such a paradigm shift has been driven by the [ChatGPT assistant](https://chat.openai.com/) available for free to the public, the possibility of turning the usual applications and services into smart assistants has been accelerated by pay-as-you-go service models by OpenAI and other providers, democratizing the access to such advanced capabilities.

Running LLMs on-premise is hard. Besides the massive amount of resources to hold billions of parameters in memory required to generate an almost real-time answer to a question (which is referred to as *prompt*), designing such systems for scalability and elasticity requires a non-negligible effort. Making such services available to developers for rapid prototyping is another factor contributing to the vast adoption of LLMs and the surge of many heterogeneous services in different areas where a user requires dedicated and customized attention, such as recommendations, assistance, financial advisory, troubleshooting, and more.

Finally, factors that have influenced the rapid ascent of conversational AI services and have led to the release of increasingly advanced algorithms are massive datasets available for training (the Internet), computational power and efficiency provided by modern Graphical Processing Units (GPUs), and the advance of distributed systems and architectures. Training such systems is extremely time-consuming and resource-intensive. For example, training ChatGPT 4 took over a month and dozens of GPUs, which led to freezing the training set in time and cutting off forthcoming knowledge. This intrinsic feature of LLMs poses a constraint on several kinds of applications: working with fresh data is not possible when integrating an LLM technology into a service. Given this background, new techniques are becoming popular to circumvent such limitations and enable LLMs to assist the user even in the case of recent updates to the corpus of knowledge and provide answers when the model was not trained on specific content.

**The challenge of outdated information**

If you have ever asked ChatGPT the following question:

```
❓ What is the newest data ChatGPT is trained on?
```

You may already have realized that ChatGPT training happened at some point in the past, which means that the newest data may already be quite in the past (and the same is true for other LLMs).

```
❗ My training is based on the GPT-3.5 architecture, and my knowledge is current up until September 2021. Therefore, any events, information, or developments that have occurred after that date are outside my training data, and I may not have the most up-to-date information on them.
```

This is why it is impossible to answer questions like:

```
❓ What are the relevant facts of 2023?❗ I apologize for any inconvenience, but as of my last knowledge update in September 2021, I do not have access to information or events that have occurred in 2023 or beyond. My training data only goes up to that point, and I am not able to browse the internet or access real-time information. To get information about events and facts relevant to 2023, I would recommend checking reliable news sources, websites, or databases that provide up-to-date information on current events and developments.
```

Retraining LLMs to include the latest and fresh knowledge is expensive and not viable in the immediate term, even in the case of resorting to a custom LLM trained on-premise, so two principal methods are gaining traction to overcome this limitation and enable the latest information in the system: fine-tuning and Retrieval Augmented Generation (RAG).

**Redis, the Vector Database for conversational AI use cases**

Redis, as a high-performance, in-memory data platform, can play a pivotal role in addressing the challenges of LLM-based use cases. Here's how:

- **Context Retrieval for RAG**. Pairing Redis Enterprise with LLMs enables these models to access external contextual knowledge. This contextual knowledge is crucial for providing accurate and context-aware responses, preventing the model from generating incorrect or 'hallucinated' answers. By storing and indexing vectors that model unstructured data, Redis Enterprise ensures that the LLM can retrieve relevant information quickly and effectively, enhancing its response quality.

- **LLM Conversation Memory**. Redis Enterprise allows the persistence of all conversation history (memories) as embeddings in a vector database to improve model quality and personalization. When a conversational agent interacts with the LLM, it can check for relevant memories to aid or personalize the LLM's behavior. This feature enables seamless topic transitions during conversations and reduces misunderstandings.

- **Semantic Caching**. LLM completions can be computationally expensive. Redis Enterprise helps reduce the overall costs of ML-powered applications by caching input prompts and evaluating cache hits based on semantic similarity using vector search. This caching mechanism ensures that frequently requested information is readily available, optimizing response times and resource utilization.


#### V. Fine-tuning and Retrieval Augmented Generation (RAG)

General purpose LLMs can be extended and turned into a specific purpose model by training part of the model (which does not imply nor require retraining the model in its entirety, but merely adjusting some model's parameters, while most remain unchanged). Fine-tuning involves training the model with specific data (typically prepared following a conversation format), which results in higher task-specific training. However, this approach comes with drawbacks, such as the need for retraining when fresh knowledge is required. Conversely, RAG represents a simplified and convenient way to instruct the model with the desired information when an interaction with the model is required.

RAG, [presented by Meta](https://research.facebook.com/publications/retrieval-augmented-generation-for-knowledge-intensive-nlp-tasks/) in 2020, allows LLMs to incorporate external knowledge sources through retrieval mechanisms, extending the model capabilities with the latest information. This method enables language models to perform similarly to humans, with little information collected from the environment and in real-time. RAG has been demonstrated to be very effective. However, it requires careful prompt engineering, management of fresh knowledge, and the orchestration of different components. The following picture summarizes the flow when a user interacts with a chatbot assistant by asking a question.

![alt RAG](img/RAG.JPG)

We can simplify the architecture by considering the following three phases:

1. **Preparation**. The knowledge we want to make available to increase the expertise of our LLM assistant is collected, transformed, ingested, and indexed. This requires a specific data preprocessing pipeline, with connectors to the data source and downstream connectors to the target database. In the implementation we will explore in this article, Redis is the chosen Vector Database. The data can be represented by articles, documents, books, and any textual source to specialize our chat. Of the many indexing strategies available, vector databases have been demonstrated to be effective at indexing and searching unstructured data stored in vectorial format.

2. **Retrieval**. In this phase, the information (or context) relevant to the user's question is retrieved. Database semantic search assists in this task: the question is converted to a vector embedding, and vector search is performed to retrieve the relevant results from the database. vector search can be configured and performed with hybrid or range search strategies to determine what results best describe the question and can likely contain an answer. The assumption is that the question and the answer will be semantically similar.

3. **Generation**. Time of [prompt engineering:](https://en.wikipedia.org/wiki/Prompt_engineering) with the relevant context and the question in our hands, we proceed to create a prompt and instruct the LLM to elaborate and return a response. Composing the right prompt to leverage the provided context (and eventually the previous historical interactions in the chat) is crucial to getting a relevant answer to the question and guardrail the output.


#### VI. LLM conversation memory

Current LLM services do not store any conversation history. So, conversations are stateless, which is the same. This means that once a question is asked and the answer generated, we cannot refer to previous passages in the conversation. Keeping the context of the conversation in memory and providing the LLM with the entire conversation (as a list of pairs question + response) together with the new question is the responsibility of the client application.

> *Review the body of the OpenAI [chat completion API](https://platform.openai.com/docs/api-reference/chat), which accepts messages: the list of messages comprising the ongoing conversation. However, sending back to the LLM the entire conversation may not be convenient for two main reasons.*

First, we should filter out **irrelevant interactions** from the current conversation when these do not relate to the last question. So, in practice, imagine a conversation about food interrupted by a few questions about coding and then additional questions about the former food context. Storing all the questions and responses and their corresponding vector embeddings in the user's session enables vector search to find those semantically similar interactions to the last question. Using this method, we can pick the relevant portion of the conversation.

The second reason that motivates smart conversation history management is **cost reduction**. LLM-as-a-service models charge the user based on the number of tokens in the question and the answer. This means that the longer the context, the more expensive the LLM service.

The idea behind the **LLM Conversation Memory** is to improve the model quality and personalization through an adaptive memory.

- Persist all conversation history (memories) as embeddings in a vector database.
- A conversational agent checks for relevant memories to aid or personalize the LLM behavior.
- Allows users to change topics without misunderstandings seamlessly.


#### VII. Semantic caching

Semantic caching is used with large user bases or commonly asked questions. As usual with caching, this use case is about improving the application's responsiveness and reducing costs when using LLM-as-a-service. Because LLM completions are expensive, it helps to reduce the overall costs of the ML-powered application.

In practical terms, if a semantic cache is in place, whenever a new question is asked, this will be vectorized, and semantic search will be executed to find out if this question was already asked (we may use vector search with range search and establish a radius to refine the results). If the same question has already been asked, the LLM does not intervene to generate the answer, and the cached response is returned. Otherwise, the LLM produces a new response, which is cached for future searches.

- Use vector database to cache input prompts
- Cache hits evaluated by semantic similarity

> *Note that the [RedisVL](https://github.com/RedisVentures/redisvl) client library makes semantic caching available out-of-the-box.*


#### VIII. Setting up a RAG Chatbot

Prototyping an ML-powered chatbot is not an impossible mission. The many frameworks and libraries available, together with the simplicity of getting an API token from the chosen LLM service provider, can assist you in setting up a proof-of-concept in a few hours and lines of code. Sticking to the three phases mentioned earlier (preparation, generation, and retrieval), let's proceed to create a chatbot assistant, a **movie expert** you can consult to get recommendations from and ask for specific movies.

> *If you want to run the example first, jump to the bottom of this article to learn how to do so.*

**Preparation**

Imagine a movie expert who may answer questions or recommend movies based on criteria (genre, your favorite cast, or rating). A smart, automated chatbot will be trained on a corpus of popular films, which, for this example, we have downloaded from Kaggle: the [IMDB movies dataset](https://www.kaggle.com/datasets/ashpalsingh1525/imdb-movies-dataset), with more than 10,000 movies and plenty of relevant information. An entry in the dataset stores the following information:

```
{
  "names": "The Super Mario Bros. Movie",
  "date_x": "04/05/2023",
  "score": 76.0,
  "genre": "Animation, Adventure, Family, Fantasy, Comedy",
  "overview": "While working underground to fix a water main, Brooklyn plumbers—and brothers—Mario and Luigi are transported down a mysterious pipe and wander into a magical new world. But when the brothers are separated, Mario embarks on an epic quest to find Luigi.",
  "crew": [
    "Chris Pratt, Mario (voice)",
    "Anya Taylor-Joy, Princess Peach (voice)",
    "Charlie Day, Luigi (voice)",
    "Jack Black, Bowser (voice)",
    "Keegan-Michael Key, Toad (voice)",
    "Seth Rogen, Donkey Kong (voice)",
    "Fred Armisen, Cranky Kong (voice)",
    "Kevin Michael Richardson, Kamek (voice)",
    "Sebastian Maniscalco, Spike (voice)"
  ],
  "status": "Released",
  "orig_lang": "English",
  "budget_x": 100000000.0,
  "revenue": 724459031.0,
  "country": "AU"
}
```

As mentioned, to enable context retrieval, we will capture the semantics of the data using an embedding model and we will store the embedding vector in the database, which will perform indexing using the desired method (FLAT or HNSW), distance (L2, IP or COSINE) and the required vector dimension. In particular, the index definition depends on the dimension of the vector specified by DIM, which is set by the chosen embedding model. The chosen embedding model we will use along this example is the open-source all-MiniLM-L6-v2 sentence transformer, which converts the provided paragraphs to a 384 dimensional dense vector space.

> *Note that embedding models support the conversion of texts up to a certain size. The chosen model warns that "input text longer than 256-word pieces is truncated". This is not an issue for our movie dataset because we expect to convert paragraphs whose length is shorter than the limit. However, a text chunking strategy to map a document to multiple vector embeddings is needed for longer texts or even entire books.*

Now we can parse the CSV dataset and import it in JSON format into Redis so that we can read a movie entry with:

```
JSON.GET moviebot:movie:2 $.names $.overview
{"$.overview":["While working underground to fix a water main, Brooklyn plumbers—and brothers—Mario and Luigi are transported down a mysterious pipe and wander into a magical new world. But when the brothers are separated, Mario embarks on an epic quest to find Luigi."],"$.names":["The Super Mario Bros. Movie"]}
```

We can read any nested entry or multiple entries in JSON documents stored in Redis Enterprise using the [JSONPath](https://redis.io/docs/data-types/json/path/) syntax. However, we need an index to perform searches. So, we will proceed to create an index for this dataset, define the schema aligned to the data structure, and specify the embedding model and distance metric to be used for semantic search with vector search as long as the vector dimension set by the chosen embedding model, 384 in this case. A possible index definition could be:

```
FT.CREATE movie_idx ON JSON PREFIX 1 moviebot:movie: SCHEMA $.crew AS crew TEXT $.overview AS overview TEXT $.genre AS genre TAG SEPARATOR , $.names AS names TAG SEPARATOR , $.overview_embedding AS embedding VECTOR HNSW 6 TYPE FLOAT32 DIM 384 DISTANCE_METRIC COSINE
```

This definition enables searches on several fields. As an example, we can perform a full-text search:

```
FT.SEARCH movie_idx @overview:'While working underground' RETURN 1 names
1) (integer) 1
2) "moviebot:movie:2"
3) 1) "names"
   2) "The Super Mario Bros. Movie"
```

Or retrieve a movie by exact title match:

```
FT.SEARCH movie_idx @names:{Interstellar} RETURN 1 overview
    1) (integer) 1
    2) "moviebot:movie:190"
    3) 1) "overview"
       2) "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage."
```

Secondary index search is certainly relevant to assist the retrieval of contextual information or additional details, or even when the codebase is tightly coupled to the LLM using [function calling](https://platform.openai.com/docs/guides/gpt/function-calling) capabilities. We want to answer questions using information that spans the entire dataset (such as the average rating of all the movies of a specific genre). However, for this proof-of-concept, we will resort to vector search only, and the index defined accordingly.

The final step to complete the preparation phase is deciding what will be indexed by the database; for that, we need to prepare the paragraph to be transformed by the embedding model. We can capture as much information as we want. In the following Python excerpt, we will extract one entry and format the string movie.

```
result = conn.json().get(key, "$.names", "$.overview", "$.crew", "$.score", "$.genre")
movie = f"movie title is: {result['$.names'][0]}\n"
movie += f"movie genre is: {result['$.genre'][0]}\n"
movie += f"movie crew is: {result['$.crew'][0]}\n"
movie += f"movie score is: {result['$.score'][0]}\n"
movie += f"movie overview is: {result['$.overview'][0]}\n"
```

Now, we can transform this string to a vector using the chosen model and store the vector in the same JSON entry, so the vector is packed together with the original entry in a compact object.

```
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
embedding = model.encode(movie).astype(np.float32).tolist()
conn.json().set(key, "$.overview_embedding", embedding)
```

Repeating the operation for all the movies in the dataset completes the preparation phase.

**Retrieval**

In this phase, we deal with the question from the user. The interaction is usually collected in the front end of a web application, using a standard input form, so you can capture it and forward it to the back end for processing. As anticipated, the question and the context will be semantically similar, so a proven technique to instruct the LLM with a context is to transform the question to vector embedding, then perform vector search to collect the desired number of outputs, and finally construct the prompt. A Python sample code to perform vector search in Redis follows:

```
context = ""
q = Query("@embedding:[VECTOR_RANGE $radius $vec]=>{$YIELD_DISTANCE_AS: score}") \
    .sort_by("score", asc=True) \
    .return_fields("overview", "names", "score", "$.crew", "$.genre", "$.score") \
    .paging(0, 3) \
    .dialect(2)

# Find all vectors within VSS_MINIMUM_SCORE of the query vector
query_params = {
    "radius": VSS_MINIMUM_SCORE,
    "vec": model.encode(query).astype(np.float32).tobytes()
}

res = conn.ft("movie_idx").search(q, query_params)

if (res is not None) and len(res.docs):
    it = iter(res.docs[0:])
    for x in it:
        movie = f"movie title is: {x['names']}\n"
        movie += f"movie genre is: {x['$.genre']}\n"
        movie += f"movie crew is: {x['$.crew']}\n"
        movie += f"movie score is: {x['$.score']}\n"
        movie += f"movie overview is: {x['overview']}\n"
        context += movie + "\n"
```

The search command performs a vector search range search and filters results exceeding a certain score specified by VSS_MINIMUM_SCORE and collects three samples. In the example, we extract the desired metadata from the results and concatenate it to create a context for the interaction.

*In our example, the dataset provides a short overview of the movie and other information, so we can construct the context by concatenating the information in a string. However, the context window supported by LLMs is limited by a maximum number of tokens (learn more from the [OpenAI tokenizer page](https://platform.openai.com/tokenizer)). In addition, the LLM service provider charges you by the overall number of input and output tokens, so limiting the number of tokens provided in the context and instructing the model to return an output limited in size may be convenient.*

Having retrieved the required information, the prompt you construct should include the knowledge you want the LLM to use for generating responses. It should provide clear instructions for handling user queries and accessing the indexed data. An example might be:

```
prompt = '''Use the provided information to answer the search query the user has sent. 
The information in the database provides three movies, choose the one or the ones that fit most.
If you can't answer the user's question, say "Sorry, I am unable to answer the question, 
try to refine your question". Do not guess. You must deduce the answer exclusively 
from the information provided. 
The answer must be formatted in markdown or HTML.
Do not make things up. Do not add personal opinions. Do not add any disclaimer.

Search query: 

{}

Information in the database: 

{}
'''.format(query, context)
```

Formatting the prompt with the context and the query from the user completes the retrieval phase, and we are ready to interact with the LLM.

**Generation**

In the final phase, which concludes this example, we will forward the prompt to the LLM. We will use an OpenAI endpoint to leverage the GPT-3.5 model [gpt-3.5-turbo-0613](https://platform.openai.com/docs/models/gpt-3-5), but we may have used the desired model. Whatever the choice, using an LLM-as-a-service is the best way to set up and prepare a demonstration without major efforts, which a local LLM will imply. To go ahead with GPT-3.5, create your OpenAI token and specify it using the environment variable OPENAI_API_KEY.

```
export OPENAI_API_KEY="1234567890abcdefghijklmnopqrstuvwxyz"
```

Using the OpenAI [ChatCompletion API](https://platform.openai.com/docs/guides/gpt/chat-completions-api) is straightforward, refer to the [API documentation](https://platform.openai.com/docs/api-reference/chat) to learn the details. To send the request you will need to specify, besides the chosen model, at least:

- **The system message** sets the context and the tone of the conversation. It is typically the first message in the interaction and guides the model's behavior during the conversation. For example, you may specify here that you would like the interaction customized for primary school students. This would tune the tone accordingly and produce responses suitable for youngsters.

- **The stream behavior**. If you have used the ChatGPT online chatbot, you have noticed how the first word is returned almost immediately after submitting the question. This happens because the response is built and streamed as it is produced on the server. This creates a good user experience but requires managing a stream of information and updating the user interface accordingly. In this example, we will go for a batched response, so the time to the first word equals the time to get the full response, which is easier to implement.

- **The messages in the conversation**. In this example, we are submitting the prompt just produced, but note that you won't be able to ask the LLM questions such as *Can you refine the previous response to be shorter? or make a summary of the conversation kept so far*. Conversations with the LLM are stateless, so the model does not keep track of any interaction. It is delegated to the client application to store the messages, search for them when required, and forward them as a list of messages.

```
system_msg = 'You are a smart and knowledgeable AI assistant with expertise in all kinds of movies. You are a very friendly and helpful AI. You are empowered to recommend movies based on the provided context. Do NOT make anything up. Do NOT engage in topics that are not about movies.';
try:
    response = openai.ChatCompletion.create(model="gpt-3.5-turbo-0613",
                                            stream=False,
                                            messages=[{"role": "system", "content": system_msg},
                                                        {"role": "user", "content": prompt}])
    return response["choices"][0]["message"]["content"]
except openai.error.OpenAIError as e:
    # Handle the error here
    if "context window is too large" in str(e):
        print("Error: Maximum context length exceeded. Please shorten your input.")
        return "Maximum context length exceeded"
    else:
        print("An unexpected error occurred:", e)
        return "An unexpected error occurred"
```

Congratulations, you have completed the setup of a movie expert chatbot! Now follow the activity proposed in the next unit to run the complete implementation.


#### IX. Lab Guide | Setting up a RAG Chatbot

We have provided you with a Jupyter notebook that includes the entire example and opens an input form to chat with the Generative AI within the notebook. Follow this procedure to create and activate your Python virtual environment:

```
python -m venv vssvenv
source vssvenv/bin/activate
```

Once done, install the required modules defined by the requirements.txt requirements file, available under [/src/jupyter](https://github.com/redislabs-training/ru402/tree/main/src/jupyter)

```
pip install -r requirements.txt
```

Ensure that you have database host, port, username and password for your Redis Cloud database at hand (alternatively, a Redis Stack instance is running). Complete the configuration of the environment by setting the environment variable that configures your Redis instance (default is localhost on port 6379) and your [OpenAI token](https://platform.openai.com/docs/quickstart/account-setup): the chatbot leverages the OpenAI ChatGPT ChatCompletion API.

1. Connect to the database using RedisInsight or redis-cli and flush the database with FLUSHALL.
2. Configure the environment variable to connect export REDIS_URL=redis://user:password@host:port
3. Configure the OpenAI token using the environment variable: export OPENAI_API_KEY="your-openai-token"

Now, you can start the notebook and execute all the cells.

```
jupyter notebook moviebot.ipynb
```

The execution of the notebook will open an input field. Type your question (e.g., *Recommend three science fiction movies*) and check the result!


#### X. "The sky is the limit"

In this course, we have explored how semantic search can help implement popular use cases at the well-known real-time speed of Redis. However, recommender systems based on pattern recognition (such as face recognition) and smart generative AI chatbots are only a subset of what can be implemented with Redis using the Redis Stack capabilities.

- **Fraud detection**. Vector search can be used to classify user behaviors when these are properly modeled as vectors, so we can deduce if user interactions resemble previously known fraud attempts
- **Personalization of product description**. Based on semantic matching, the user will read a product description that highlights aspects of the product matching user preferences
- **User segmentation**. Semantic matching enables the creation of categories of users to boost the relevance of recommendations
- **Contact center analytics**. Vector search helps retrieve historical tickets to assist with incoming tickets. When paired with speech-to-text, this is especially useful to store phone conversations as text and have them indexed by Redis.
- **Customer support**. Semantic search can significantly reduce the flow of new tickets if the customer, based on the problem description, gets a relevant document that solves the problem

You can think of many more use cases to improve services, processes, and workflows. The ability to provide contextually relevant results takes database search to a new level.


#### XI. Take your next step

In this course, we have introduced semantic search and discovered how vector embeddings can model unstructured data in a convenient format to perform vector search. You have had the chance to run code examples in your favorite programming language and use free pre-trained embedding models.

Additional examples written in Python and delivered as Jupyter notebooks have been provided. They show how simple it can be to implement a recommender system and a face recognition system.

We have explored what happens when a user interacts with an LLM-based chatbot. We have discovered how the system follows a pipeline that includes turning the user's question into an embedding, retrieving relevant content from the database, constructing a prompt for the LLM, and sending the prompt to the model. By leveraging Redis Stack's capabilities for context retrieval, conversation memory, and semantic caching, you can create more responsive, accurate, and context-aware conversational AI systems that deliver a superior user experience. In conclusion, Redis Stack, Redis Enterprise, and Redis Cloud offer an invaluable solution for enhancing semantic search and conversational AI systems.

Redis Enterprise's and Redis Cloud's ability to handle large-scale data enables the next generation of fraud detection and recommender systems, conversational AI applications, and tools to improve productivity. Whether you're developing customer support bots, virtual assistants, or knowledge-sharing platforms, Redis is a full-fledged Vector Database that will take your services to the next level, providing users with more accurate and relevant results and reducing the costs when used as a semantic cache.

**Next Steps**

As learned along the course, you can design your next service relying on Redis Stack. You can install it using native packages, as a Docker container, or as a free Redis Cloud subscription. Redis Stack also offers basic configurations for high availability and scalability. Redis Stack is the perfect fit for the development and testing environment.

**Planning for production**

Redis Enterprise and Redis Enterprise Cloud include the same Redis Stack capabilities and are the natural choice for production environments. Redis Enterprise 7.2 enables a higher query throughput, including vector search and full-text search exclusively as part of the company's commercial offerings. Redis Enterprise achieves superior search performance by blending sharding for seamless data expansion with efficient vertical scaling. This ensures optimal distributed processing across the cluster and ,improves query throughput by up to 16x compared to what was previously possible.

At the time of writing, Redis is integrated with IaaS providers and SDK frameworks so that you can configure Redis as the preferred Vector Database in a few steps. The list of service providers and frameworks is growing as time goes by, so it is a good idea to follow the [Redis blog](https://redis.com/blog/) for the news.

**Integration with 3rd party service providers**

Redis Enterprise Cloud has integrated its vector database capabilities with Amazon Bedrock, simplifying generative AI application development via API. This integration caters to the unique challenges of generative AI, offering flexibility in storing vector embeddings and providing a high-performance search engine for low latency needs. Additionally, Redis Enterprise Cloud integrates with various AI application development frameworks and libraries. Amazon Bedrock, on the other hand, is a managed service supporting generative AI applications with foundation models from multiple providers, eliminating the need to create custom models or share proprietary data with commercial LLM providers.

For Azure, [Azure Cache for Redis Enterprise](https://azure.microsoft.com/en-us/pricing/details/cache/) is utilized to store vector embeddings and perform vector search. Still, it requires the Enterprise tiers of Azure Cache for Redis. You can build powerful AI Apps combining [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service/) using the [Semantic Kernel](https://learn.microsoft.com/en-us/semantic-kernel/overview/) SDK, which supports Redis as the Vector Database for the [Semantic Memory]https://github.com/microsoft/semantic-kernel/blob/main/python/semantic_kernel/connectors/memory/redis/README.md

On GCP, you can leverage Google's Vertex AI platform's generative AI capabilities, including the [Palm 2](https://ai.google/discover/palm2/) chat model and an in-console generative AI studio. Using Redis as the preferred Vector Database is a natural choice, especially if running as close to Google services as possible with [Redis Enterprise Cloud on Google Cloud](https://redis.com/cloud-partners/google/)

The [NVIDIA Triton Inference Server](https://developer.nvidia.com/triton-inference-server) is a versatile software platform developed by NVIDIA to serve as a production-grade deep learning inference server. Triton can leverage [Redis as cache](https://github.com/triton-inference-server/redis_cache) to supercharge NVIDIA Triton instances.

**Integrations with frameworks**

You can build your application without any third-party library, but frameworks are there to make your life simpler. This is why you will find Redis well-integrated in the most popular frameworks to leverage the vector capabilities out-of-the-box. Popular frameworks are:

- [LangChain](https://python.langchain.com/docs/integrations/vectorstores/redis)
- [OpenAI Retrieval Plugin](https://github.com/openai/chatgpt-retrieval-plugin)
- [LlamaIndex](https://gpt-index.readthedocs.io/en/latest/examples/vector_stores/RedisIndexDemo.html)
- [FeatureForm](https://www.featureform.com/post/announcing-featureform-0-9)
- [Triton Inference Server](https://github.com/triton-inference-server/redis_cache)

**References**

- [Vector Similarity: From Basics to Production](https://mlops.community/vector-similarity-search-from-basics-to-production/)
- [Redis Enterprise Cloud Integration With Amazon Bedrock Now Available](https://redis.com/blog/amazon-bedrock-integration-with-redis-enterprise/)
- [Building LLM Applications with Redis on Google's Vertex AI Platform](https://redis.com/blog/building-llm-applications-with-redis-on-googles-vertex-ai-platform/)
- [Build an E-commerce Chatbot With Redis, LangChain, and OpenAI](https://redis.com/blog/build-ecommerce-chatbot-with-redis/)
- [Using Redis VSS as a Retrieval Step in an LLM Chain](https://redis.com/blog/using-redis-vss-in-llm-chain/)
- [How to Build a Distributed Inference Cache with NVIDIA Triton and Redis](https://developer.nvidia.com/blog/how-to-build-a-distributed-inference-cache-with-nvidia-triton-and-redis/)


### EOF (2025/02/15)