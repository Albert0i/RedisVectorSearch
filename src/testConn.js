import { redisClient, disconnect } from "./redis/redisClient.js"

async function main() {
    const info = await redisClient.info()
    console.log(info)
    await redisClient.set('hello', 'world')
    console.log(await redisClient.get('hello'))
    await disconnect()
}

main()