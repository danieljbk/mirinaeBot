require('dotenv').config()

const express = require('express')
const app = express()
const port = process.env.PORT || 8080

const scrapeMirinae = require('./mirinaeScraper.js')
const {
  mirinaeTwitterClient,
  mirinaeTwitterBearer,
} = require('./mirinaeTwitterClient.js')
const {
  emilyTwitterClient,
  emilyTwitterBearer,
} = require('./emilyTwitterClient.js')
const { ETwitterStreamEvent } = require('twitter-api-v2')
const tokenizer = require('sbd')

app.listen(port, async () => {
  console.log('Server running on port ' + port)

  const mirinaeTwitterAccountData = await mirinaeTwitterClient.v2.me()

  // *CURRENT STREAM RULES:
  const rules = await mirinaeTwitterBearer.v2.streamRules()
  console.log(rules)

  // *STREAM:
  const stream = await mirinaeTwitterBearer.v2.searchStream({
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
    const mentionedTweetId = eventData.data.id
    const referencedTweet = eventData.includes.tweets.pop()
    let referencedTweetTextContent = referencedTweet.text

    console.log('Received: ' + referencedTweetTextContent)

    // remove unprocessable words from the tweet before processing.
    referencedTweetTextContent = referencedTweetTextContent
      .split(' ')
      .filter(
        (word) =>
          !(
            word.startsWith('@') ||
            word.startsWith('#') ||
            word.startsWith('http') ||
            word.startsWith('www')
          )
      )
    referencedTweetTextContent = referencedTweetTextContent.join(' ')
    referencedTweetTextContent = referencedTweetTextContent.trim()

    // remove whitespace & empty strings from sentences
    let sentences = tokenizer.sentences(referencedTweetTextContent, {})
    sentences = sentences.map((sentence) => sentence.trim())
    sentences = sentences.filter((sentence) => sentence !== '')

    console.log(sentences)

    console.log('Generating images...')
    const media_ids = []
    for (let sentence of sentences) {
      try {
        const imageBuffer = await scrapeMirinae(sentence)
        const media_id = await emilyTwitterClient.v1.uploadMedia(imageBuffer, {
          mimeType: 'png',
          additionalOwners: [mirinaeTwitterAccountData.data.id],
        })
        media_ids.push(media_id)
      } catch (err) {
        console.log(err)
      }
    }

    console.log('Replying...')
    try {
      await mirinaeTwitterClient.v2.reply(
        "Here's your explanation. You can learn more Korean on mirinae.io!",
        mentionedTweetId,
        {
          media: { media_ids },
        }
      )
    } catch (err) {
      console.log(err)
    }

    console.log('Done!')
    console.log()
  })

  // Enable reconnect feature
  stream.autoReconnect = true
})
