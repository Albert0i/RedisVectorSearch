import { redisClient, disconnect } from "./redis/redisClient.js"
import { generateSentenceEmbeddings } from "./text-vector-gen.js"

const float32Buffer = (arr) => {
    const floatArray = new Float32Array(arr);
    const float32Buffer = Buffer.from(floatArray.buffer);
    return float32Buffer;
  };

//A KNN query will give us the top n documents that best match the query vector.
/*  sample raw query

    FT.SEARCH idx:products
    "*=>[KNN 5 @productDescriptionEmbeddings $searchBlob AS score]"
    RETURN 4 score brandName productDisplayName imageURL
    SORTBY score
    PARAMS 2 searchBlob "6\xf7\..."
    DIALECT 2
*/
const queryQuoteEmbeddingsByKNN = async (
      _searchTxt,
      _resultCount,
    ) => {
    console.log(`queryQuotesEmbeddingsByKNN started`);
    let results = {};
    if (_searchTxt) {
      _resultCount = _resultCount ?? 3;
      const searchTxtVectorArr = await generateSentenceEmbeddings(_searchTxt);
      const searchQuery = `*=>[KNN ${_resultCount} @embeddings $searchBlob AS score]`;
  
      results = await redisClient.call('FT.SEARCH', 
                                       'idx:quotes', 
                                       searchQuery, 
                                       'RETURN', '3', 'score', 'quote', 'source', 
                                       'SORTBY', 'score', 
                                       'PARAMS', '2', 'searchBlob', 
                                       float32Buffer(searchTxtVectorArr), 'DIALECT', '2');
    } else {
      throw 'Search text cannot be empty';
    }
  
    return results;
  };

async function main() {
  const results = await queryQuoteEmbeddingsByKNN('dream love death')
  console.log(results)
  await disconnect()
}

main()
/*
   FT.SEARCH
   https://redis.io/docs/latest/commands/ft.search/
*/
  //https://redis.io/docs/interact/search-and-query/query/
  //   results = await redisClient.ft.search(PRODUCTS_INDEX_KEY, searchQuery, {
  //     PARAMS: {
  //       searchBlob: float32Buffer(searchTxtVectorArr),
  //     },
  //     RETURN: ['score', 'author', 'quote', 'source'],
  //     SORTBY: {
  //       BY: 'score',
  //       // DIRECTION: "DESC"
  //     },
  //     DIALECT: 2,
  //   });
  // FT.SEARCH index "(*)=>[KNN num_neighbours @field $vector]" PARAMS 2 vector "binary_data" DIALECT 2
  // FT.SEARCH idx:bikes_vss "(*)=>[KNN 3 @vector $query_vector]" PARAMS 2 "query_vector" "Z\xf8\x15:\xf23\xa1\xbfZ\x1dI>\r\xca9..." SORTBY "__vector_score" ASC RETURN 2 "__vector_score" "description" DIALECT 2  
  // FT.SEARCH idx:quotes "(*)=>[KNN 3 @field $embeddings]" PARAMS 2 embeddings "insane" DIALECT 2
  // FT.SEARCH idx:quotes "(*)=>[KNN 3 @field $embeddings]" PARAMS 2 embeddings "insane" DIALECT 2
  // FT.SEARCH idx:quotes "(*)=>[KNN 3 @field $embeddings]" PARAMS 2 embeddings "insane" DIALECT 2
  // results = await redisClient.call('FT.SEARCH', 'idx:quotes', '"(*)=>[KNN 3 @field $embeddings]"', 'PARAMS', '2', 'embeddings', float32Buffer(searchTxtVectorArr), 'DIALECT', '2')
  // //results = await redisClient.call('FT._LIST')