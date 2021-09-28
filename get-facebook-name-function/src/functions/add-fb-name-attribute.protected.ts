import {
  Context,
  ServerlessCallback,
  ServerlessFunctionSignature,
} from '@twilio-labs/serverless-runtime-types/types'
import axios from 'axios'

export const handler: ServerlessFunctionSignature<FacebookContext, Event> = async function (
  context: Context<FacebookContext>,
  event: Event,
  callback: ServerlessCallback,
) {

  // early return for other task event types
  if (event.EventType !== 'task.created') {
    callback(null, {})
    return
  }

  let taskAttributes: TaskAttributes = JSON.parse(event.TaskAttributes)

  // early return for not facebook channels
  if (taskAttributes.channelType !== 'facebook') {
    callback(null, {})
    return
  }

  // get facebook name
  let psid = taskAttributes.name.split(':')[1]
  let fbName = await getFacebookProfileName(psid, context.FB_ACCESS_TOKEN)
    .catch(error => console.log(error))

  if (!fbName) {
    callback('Error getting FB name')
    return
  }

  let newAttributes = Object.assign(taskAttributes, {
    ['name']: `${fbName.first_name} ${fbName.last_name}`,
    ['original_name']: taskAttributes.name,
  })

  // update task
  await context.getTwilioClient().taskrouter
    .workspaces(event.WorkspaceSid)
    .tasks(event.TaskSid)
    .update({
      attributes: JSON.stringify(newAttributes),
    })
    .then(task => callback(null, {}))
    .catch(error => {
      console.log(error)
      callback('Error updating task')
    })
}

const getFacebookProfileName = async (psid: string, accessToken: string): Promise<FacebookResponse> =>
  axios.get<FacebookResponse>(
    `https://graph.facebook.com/${psid}?fields=first_name,last_name&access_token=${accessToken}`,
  ).then(response => response.data)

type Event = {
  EventType: string,
  TaskSid: string,
  TaskAttributes: string,
  WorkspaceSid: string,
}

type TaskAttributes = {
  channelType: string,
  name: string,
}

type FacebookContext = {
  FB_ACCESS_TOKEN: string
}

type FacebookResponse = {
  first_name: string,
  last_name: string,
}
