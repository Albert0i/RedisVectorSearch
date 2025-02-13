### [Introduction to vector search](https://university.redis.io/course/yz1lretjfpdlew/submodule/dpe4lodhlalpxa/)


#### I. The vector space

Vector search is based on determining how similar or dissimilar two vectors are. In order to do this consistently, there needs to be some kind of an quantifiable and objective score. These scores are called **Distance Metrics**.

There's more than one way to determine the similarity of two vectors, thus, we can talk about multiple distance metrics. They are not just different means to the same result though, they measure different things in reality. Currently, we support three distance metrics:

- Euclidian distance (L2)

- Cosine similarity of two vectors (COSINE)

- Internal product of two vectors (IP)

**Euclidian distance**

Euclidean distance is one of the most used distance metrics and it calculates the distance between two data points on a plane.

![alt Euclidian distance](img/Euclidian-distance.JPG)

If we expand this logic to the numerical values in a vector, we can use the same formula to calculate the distance between vectors in the two-dimensional space. Imagine that **A** and **B** are two observations from our data set, with x1, and y1 being the two features of observation **A**, and x2, and y2 being the two features of observation **B**. Calculating the Euclidean Distance would tell us how similar A and B are, and we could use this similarity to make predictions or group our observations.

The example is easily expandable to N-dimensions.

Euclidian distance is default distance metric used by many algorithms and it generally gives good results. Conceptually, it should be used whenever we are comparing observations which features are continuous, numeric variables like height, weight, or salaries for example, although, it should be noted that it works best with low-dimensional data and where the magnitude of the vectors is important to be measured.

**Internal product of two vectors**

To determine similarity **internal product looks at both angle and magnitude of vectors**. It's found by projecting one vector on the other and multiplying the result with the magnitude of the second vector. Let's look at this in two-dimensional space:

![alt Internal product](img/Internal-product.JPG)

How do we generalise this for the n-dimensional space? First of all, to apply the inner product to two vectors, they need to be of the same size (in our example we'll work with two four-dimensional vectors). Then we multiply element-wise the ordered vectors, element by element, and in the end we sum the products. The result of a dot product of two vectors is a scalar.

a = (3, 6, 1, 8) 

b = (3, 2, 2, 1) 

a⋅b = 3x3 + 6x2 + 1x2 +8x1 = 9 + 12 + 2 + 8 = 31

The generalised formula for this product is:

![alt Internal product formula](img/Internal-product-formula.JPG)

**Cosine similarity of two vectors**

Cosine similarity is usually the first metric you would reach to, since it gives consistently good results, especially for high dimensional vector spaces. It is a good choice for use cases like document similarity, image comparison, pose comparison (in computer vision) and much more.

Differently from Internal product, cosine similarity looks only at the angle between two vectors to determine similarity. Specifically, it looks at the cosine of the angle.

![alt Cosine similarity](img/Cosine-similarity.JPG)

In the image of three vectors in two-dimensional space above we can see that the vectors U1 and U3 have a small angle between them, which means they're more similar. U1 and U2 however have a bigger angle between their vectors, which means the vectors are less similar. Two vectors with exactly the same orientation have a cosine similarity of 1, whereas two vectors diametrically opposed to each other have a similarity of -1. Their magnitude is not of importance as this is a measure of orientation.

If we move to an n-dimensional space with vectors a and b, using the cosine measure as a similarity function, we have

![alt Cosine similarity formula](img/Cosine-similarity-formula.JPG)

where a⋅b is the dot product of the two vectors and ||a|| is the Euclidean norm of vector a=(a1,a2,…,an), conceptually - the length of the vector. Similarly, ||b|| is the Euclidean norm of vector y. The measure computes the cosine of the angle between vectors a and b. A cosine value of 0 means that the two vectors are at 90 degrees to each other (orthogonal) and have no match. The closer the cosine value to 1, the smaller the angle and the greater the match between vectors.

If you normalize the vectors, cosine similarity and internal product give the same result, which makes the intuition behind using it as a metric very similar to internal product, but the cosine distance should be chosen when magnitude is not relevant.

> *Normalised vectors are vectors with a magnitude of 1, so to normalise a vector means to set its magnitude to one, but keep it's direction. This is done by dividing each of the vector's components by its magnitude*.


#### II. Vector search in practice

Vector search is a key function that can be performed between *pairs of vectors*.

- It is the process of finding data points that are similar to a given query vector in a set of vectors.

- Popular vector search uses include recommendation systems, image and video search, natural language processing, and anomaly detection.

- For example, if you build a recommendation system, you can use vector search to find (and suggest) products that are similar to a product in which a user previously showed interest.

![alt Vector search in practice](img/Vector-search-in-practice.JPG)

**Vector search in practice**

Calculating the distance between vectors is a trivial operation using some math. Let's consider a simple example using sentences.

1. The following example in the cartesian plane defines three sentences

2. First, we calculate the vector embedding corresponding to each of the three sentences and store them

3. We define the test sentence "That is a happy person" and calculate the corresponding vector embedding

4. Finally, we compute the distance between the embedding of the test sentence and the three stored vector embeddings
Here's a graphical representation of the embeddings in a bi-dimensional vector space.

Here's a graphical representation of the embeddings in a bi-dimensional vector space.

![alt Vector search in practice 2](img/Vector-search-in-practice-2.JPG)

Let's now introduce the most popular distances that can be used in the comparison between the test sentence and the stored vectors.


#### III. Using the right distance

Vector search is based on determining how similar or dissimilar two vectors are. To do this consistently, some quantifiable and objective score must be obtained. These scores are called **Distance Metrics**. There's more than one method to determine the similarity of two vectors; thus, we can consider multiple distance metrics. These are not just different means to the same result: different distances measure different things, such as the length of the vector representing the difference, or the angle between the two vectors.

![alt Using the right distance](img/Using-the-right-distance.JPG)

In this unit, we'll introduce three of the most popular distances:

- Euclidian distance

- Internal product

- Cosine similarity

**Euclidian distance**

The Euclidean distance is one of the most used distance metrics, and it calculates the distance between two data points on a plane.

![alt Euclidian distance](img/Euclidian-distance.JPG)

If we expand this logic to the numerical values in a vector, we can use the same formula to calculate the distance between vectors in the two-dimensional space. Imagine that **A** and **B** are two observations from our data set, with x1, and y1 being the two features of observation **A**, and x2, and y2 being the two features of observation **B**. Calculating the Euclidean Distance would tell us how similar A and B are, and we could use this similarity to make predictions or group our observations. The example is easily expandable to N-dimensions.

The Euclidean distance is the default distance metric used by many algorithms and generally gives good results. Conceptually, it should be used whenever we are comparing observations in which features are continuous, numeric variables like height, weight, or salaries, for example, although it should be noted that it works best with low-dimensional data and where the magnitude of the vectors is essential to be measured.

**Internal product**

To determine similarity, the **internal product looks at both the angle and magnitude of vectors**. It's found by projecting one vector on the other and multiplying the result with the magnitude of the second vector. Let's look at this in two-dimensional space:

![alt Internal product](img/Internal-product.JPG)

How do we generalize this for the n-dimensional space? First, to apply the inner product to two vectors, they must be the same size (in our example, we'll work with two four-dimensional vectors). Then, we multiply element-wise the ordered vectors, element by element, and sum the products in the end. The result of a dot product of two vectors is a scalar.

a = (3, 6, 1, 8) 

b = (3, 2, 2, 1) 

a⋅b = 3x3 + 6x2 + 1x2 +8x1 = 9 + 12 + 2 + 8 = 31

The generalized formula for this product is:

![alt Internal product formula](img/Internal-product-formula.JPG)

**Cosine similarity**

Cosine similarity is the first metric you would reach since it gives consistently good results, especially for high dimensional vector spaces. It is a good choice for use cases like document similarity, image comparison, pose comparison (in computer vision), and much more. Unlike the internal product, cosine similarity looks only at the angle between two vectors to determine similarity. Specifically, it looks at the cosine of the angle.

![alt Cosine similarity](img/Cosine-similarity.JPG)

In the image of three vectors in the two-dimensional space above, we can see that the vectors U1 and U3 have a slight angle between them, which means they're more similar. U1 and U2, however, have a more significant angle between their vectors, which means the vectors are less similar. Two vectors with the same orientation have a cosine similarity of 1, whereas two vectors opposed to each other have a similarity of -1. Their magnitude is not of importance as this is a measure of orientation. If we move to an n-dimensional space with vectors a and b, using the cosine measure as a similarity function, we have:

![alt Cosine similarity formula](img/Cosine-similarity-formula.JPG)

where a⋅b is the dot product of the two vectors and ||a|| is the Euclidean norm of vector a=(a1,a2,…,an): conceptually, the length of the vector. Similarly, ||b|| is the Euclidean norm of vector y. The measure computes the cosine of the angle between vectors a and b. A cosine value of 0 means that the two vectors are at 90 degrees to each other (orthogonal) and have no match. The closer the cosine value to 1, the smaller the angle and the greater the match between vectors.

If you normalize the vectors, cosine similarity and internal product give the same result, which makes the intuition behind using it as a metric very similar to the internal product. Still, cosine similarity should be chosen when magnitude doesn't play a high role in similarity.

> *Normalized vectors are vectors with a magnitude of 1, so normalizing a vector means setting its magnitude to one but keeping its direction. This is done by dividing each of the vector's components by its magnitude*.


#### IV. Lab Guide | Compute vector similarity

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

- Define a distance that will be used to compute the similarity of the vectors (　)

- Sort the vectors based on their length (　)

- Create a full-text search index and perform data indexation (　)

2. What does cosine similarity primarily focus on in vector search?

- The magnitude of vectors (　)

- The Euclidean distance between vectors (　)

- The angle between vectors (　)

- The internal product of vectors (　)


### EOF (2025/02/15)
