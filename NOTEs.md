# Notes

- UI AI library used: https://ai-sdk.dev/elements

# TODO

## Features

- [x] let AI update the canvas if the users wants to (using a tool)
- [ ] let AI start the conversation
- [x] when thinking display which agent is thinking
- [x] add a collapsed thinking section to the UI
- [ ] add voice
- [ ] when it is clear that the user doesnt know well the proposition, switch to "value proposition mode"
- [ ] when it is clear the user doesnt know well the user, switch to "know your customer mode"

## tech debt

- [x] use single object in localStorage for the canvas state instead of multiple keys

## Bugs

- [x] **HIGH**: while using mastra studio I can see the conversation with the subagents, in the chat I just see huge response and very ofter the sub agents are called multiple times. Need beter UI.
- [x] when a new canvas is ceated, there are two calls to the API using two different canvas IDs
