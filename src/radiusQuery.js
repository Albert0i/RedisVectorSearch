import { redisClient, disconnect } from "./redis/redisClient.js"
import { generateSentenceEmbeddings } from "./text-vector-gen.js"

const float32Buffer = (arr) => {
    const floatArray = new Float32Array(arr);
    const float32Buffer = Buffer.from(floatArray.buffer);
    return float32Buffer;
  };

// FT.SEARCH index "@field:[VECTOR_RANGE radius $vector]" PARAMS 2 vector "binary_data" DIALECT 2
// FT.SEARCH index "@field:[VECTOR_RANGE radius $vector]=>{$YIELD_DISTANCE_AS: dist_field}" PARAMS 2 vector "binary_data" SORTBY dist_field DIALECT 2
// FT.SEARCH idx:bikes_vss "@vector:[VECTOR_RANGE 0.5 $query_vector]=>{$YIELD_DISTANCE_AS: vector_dist}" PARAMS 2 "query_vector" "Z\xf8\x15:\xf23\xa1\xbfZ\x1dI>\r\xca9..." SORTBY vector_dist ASC RETURN 2 vector_dist description DIALECT 2
const queryQuoteEmbeddingsByRange = async (
      _searchTxt,
      _radius,
    ) => {
    console.log(`queryQuotesEmbeddingsByRange started`);
    let results = {};
    if (_searchTxt) {
      _radius = _radius ?? 0.5;
      const searchTxtVectorArr = await generateSentenceEmbeddings(_searchTxt);      
      const searchQuery = `@embeddings:[VECTOR_RANGE ${_radius} $searchBlob]=>{$YIELD_DISTANCE_AS: vector_dist}`;      
      results = await redisClient.call('FT.SEARCH', 
                                       'idx:quotes', 
                                       searchQuery, 
                                       'PARAMS', 2, 'searchBlob', 
                                                    float32Buffer(searchTxtVectorArr), 
                                       'SORTBY', 'vector_dist', 'ASC', 
                                       'RETURN', 4, 'vector_dist', 'author', 'quote', 'source', 
                                       'DIALECT', 2);
    } else {
      throw 'Search text cannot be empty';
    }
  
    return results;
  };

async function main() {
  const results = await queryQuoteEmbeddingsByRange('dream love death')
  console.log(results)
  await disconnect()
}

main()
/*
   FT.SEARCH
   https://redis.io/docs/latest/commands/ft.search/

   Vector search
   https://redis.io/docs/latest/develop/interact/search-and-query/query/vector-search/

  FT.SEARCH index "(*)=>[KNN num_neighbours @field $vector]" PARAMS 2 vector "binary_data" DIALECT 2

  1. Pre-filter: The first expression within the round brackets is a filter. It allows you to decide which vectors should be taken into account before the vector search is performed. The expression (*) means that all vectors are considered.

  2. Next step: The => arrow indicates that the pre-filtering happens before the vector search.

  3. KNN query: The expression [KNN num_neighbours @field $vector] is a parameterized query expression. A parameter name is indicated by the $ prefix within the query string.

  4. Vector binary data: You need to use the PARAMS argument to substitute $vector with the binary representation of the vector. The value 2 indicates that PARAMS is followed by two arguments, the parameter name vector and the parameter value.

  5. Dialect: The vector search feature has been available since version two of the query dialect.
*/