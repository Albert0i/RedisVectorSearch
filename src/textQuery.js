import { redisClient, disconnect } from "./redis/redisClient.js"

async function main() {
  const results = await redisClient.call( 'FT.SEARCH', 
                                          'idx:quotes', 
                                          '@quote:(dream | love | death)', 
                                          'RETURN', 2, 'quote', 'source', 
                                          'HIGHLIGHT', 'FIELDS', 1, 'quote',
                                          'SORTBY', 'source', 
                                          'LIMIT', 0, 3 )
  console.log(results)
  await disconnect()
}

main()
/*
   FT.SEARCH
   https://redis.io/docs/latest/commands/ft.search/
*/