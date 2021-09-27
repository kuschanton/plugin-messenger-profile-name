import '@twilio-labs/serverless-runtime-types'
import {
  Context,
  ServerlessCallback,
  ServerlessFunctionSignature,
} from '@twilio-labs/serverless-runtime-types/types'
import axios from 'axios'

const JWEValidator = require('twilio-flex-token-validator').functionValidator

type Event = {
  psid: string
}

type FacebookContext = {
  FB_ACCESS_TOKEN?: string
}

type FacebookResponse = {
  first_name: string,
  last_name: string
}

export const handler: ServerlessFunctionSignature<FacebookContext, Event> =
  // JWEValidator(
    async function (
      context: Context<FacebookContext>,
      event: Event,
      callback: ServerlessCallback,
    ) {

      let response = await axios.get<FacebookResponse>(
        `https://graph.facebook.com/${event.psid}?fields=first_name,last_name&access_token=${process.env.FB_ACCESS_TOKEN}`,
      )

      let data = await response.data

      callback(null, {
        firstName: data.first_name,
        lastName: data.last_name,
      })
    }
  // )