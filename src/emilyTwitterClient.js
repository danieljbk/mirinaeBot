const { TwitterApi } = require('twitter-api-v2')

const client = new TwitterApi({
  appKey: process.env.EMILY_API_KEY,
  appSecret: process.env.EMILY_API_SECRET,
  accessToken: process.env.EMILY_ACCESS_TOKEN,
  accessSecret: process.env.EMILY_ACCESS_SECRET,
})

const bearer = new TwitterApi(process.env.EMILY_BEARER_TOKEN)

const emilyTwitterClient = client.readWrite
const emilyTwitterBearer = bearer.readOnly

module.exports = { emilyTwitterClient, emilyTwitterBearer }
