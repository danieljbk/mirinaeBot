const { TwitterApi } = require('twitter-api-v2')

const client = new TwitterApi({
  appKey: process.env.MIRINAE_API_KEY,
  appSecret: process.env.MIRINAE_API_SECRET,
  accessToken: process.env.MIRINAE_ACCESS_TOKEN,
  accessSecret: process.env.MIRINAE_ACCESS_SECRET,
})

const bearer = new TwitterApi(process.env.MIRINAE_BEARER_TOKEN)

const mirinaeTwitterClient = client.readWrite
const mirinaeTwitterBearer = bearer.readOnly

module.exports = { mirinaeTwitterClient, mirinaeTwitterBearer }
