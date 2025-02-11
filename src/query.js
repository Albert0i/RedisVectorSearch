

/*
   Vector search
   https://redis.io/docs/latest/develop/interact/search-and-query/query/vector-search/

   FT.SEARCH idx:quotes "(*)=>[KNN num_neighbours @field $embeddings]" PARAMS 2 embeddings "binary_data" DIALECT 2

   FT.SEARCH idx:quotes
      "*=>[KNN 5 @embeddings $searchBlob AS score]"
      RETURN 4 score author quote source 
      SORTBY score
      PARAMS 2 searchBlob "6\xf7\..."
      DIALECT 2
*/
/*
  A KNN query will give us the top n documents that best match the query vector.

  sample raw query

FT.SEARCH idx:quotes 
    "*=>[KNN 5 @embeddings $searchBlob AS score]"
    RETURN 3 author quote source
    SORTBY author
    PARAMS 2 searchBlob "6\xf7\..."
    DIALECT 2

  
  https://redis.io/docs/interact/search-and-query/query/
*/