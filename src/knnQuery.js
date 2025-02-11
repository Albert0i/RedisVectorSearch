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