require('dotenv').config()

const express = require('express')
const app = express()
const port = process.env.PORT || 8080

const scrapeMirinae = require('./mirinae.js')
const { twitterClient, twitterBearer } = require('./twitterClient.js')
const { ETwitterStreamEvent } = require('twitter-api-v2')
const extract_sentences = require('sentence-extractor').extract

app.listen(port, async () => {
  console.log('Server running on port ' + port)

  // *CURRENT STREAM RULES:
  const rules = await twitterBearer.v2.streamRules()
  console.log(rules)

  // *STREAM:
  const stream = await twitterBearer.v2.searchStream({
    expansions: ['referenced_tweets.id'],
  })

  stream.on(
    // Emitted when Node.js {response} emits a 'error' event (contains its payload).
    ETwitterStreamEvent.ConnectionError,
    (err) => console.log('Connection error!', err)
  )

  stream.on(
    // Emitted when Node.js {response} is closed by remote or using .close().
    ETwitterStreamEvent.ConnectionClosed,
    () => console.log('Connection has been closed.')
  )

  stream.on(
    // Emitted when a Twitter sent a signal to maintain connection active
    ETwitterStreamEvent.DataKeepAlive,
    () => console.log('Twitter has a keep-alive packet.')
  )

  stream.on(ETwitterStreamEvent.Data, async (eventData) => {
    const tweetData = eventData
    const mentionedTweetId = eventData.data.id
    const referencedTweet = tweetData.includes.tweets.pop()
    let referencedTweetTextContent = referencedTweet.text

    // if the referenced tweetData is mentioning anyone, remove it from the text before analyzing.
    referencedTweetTextContent.split(' ').forEach((word) => {
      if (word.startsWith('@')) {
        const index = referencedTweetTextContent.indexOf(word)
        referencedTweetTextContent = referencedTweetTextContent.split(' ')
        referencedTweetTextContent.splice(index, 1)
        referencedTweetTextContent = referencedTweetTextContent.join(' ')
      }
    })
    referencedTweetTextContent = referencedTweetTextContent.trim()

    let sentences = extract_sentences(referencedTweetTextContent)

    // remove whitespace from sentences
    sentences = sentences.map((sentence) => sentence.trim())

    // remove empty strings
    sentences = sentences.filter((sentence) => sentence !== '')

    const media_ids = []
    for (let sentence of sentences) {
      const imageBuffer = await scrapeMirinae(sentence)
      media_ids.push(
        await twitterClient.v1.uploadMedia(imageBuffer, {
          type: 'png',
        })
      )
    }

    await twitterClient.v1.reply(
      'Analyzed + ' + referencedTweetTextContent,
      mentionedTweetId,
      {
        media_ids,
      }
    )
  })

  // Enable reconnect feature
  stream.autoReconnect = true
})
