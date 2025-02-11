import { redisClient, disconnect } from "./redis/redisClient.js"
import { generateSentenceEmbeddings } from "./text-vector-gen.js"

import { quotes } from './quotes.js'

async function main() {
  let i, embeddings

  console.log('number of quotes is', quotes.length)
  process.stdout.write('Loading')
  for (i = 0; i < quotes.length; i++) { 
    process.stdout.write(".");
    embeddings = await generateSentenceEmbeddings(quotes[i].quote);
    quotes[i].embeddings = embeddings
    await redisClient.call("JSON.SET", `quote:${i+1}`, "$", JSON.stringify(quotes[i]));
  }
  console.log('Done')
  await disconnect()
}

main()

/*
   ioredis
   https://github.com/redis/ioredis?tab=readme-ov-file
*/


/*  
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


FT.SEARCH idx:bikes_vss "(*)=>[KNN 3 @embeddings $query_vector]" PARAMS 2 "query_vector" "Z\xf8\x15:\xf23\xa1\xbfZ\x1dI>\r\xca9..." SORTBY "__vector_score" ASC RETURN 2 "__vector_score" "description" DIALECT 2

FT.SEARCH idx:quotes "(*)=>[KNN 3 @field $embeddings]" PARAMS 2 embeddings "binary_data" DIALECT 2

*/