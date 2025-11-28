## Features

- let AI update the canvas if the users wants to (using a tool)
- for a new canvas, let AI start the conversation
- when thinking display which agent is thinking
- add a collapsed thinking section to the UI
- add voice
- when it is clear that the user doesnt know well the proposition, switch to "value proposition mode"
- when it is clear the user doesnt know well the user, switch to "know your customer mode"

## tech debt

- use single object in localStorage for the canvas state instead of multiple keys


## Bugs

- when a new canvas is ceated, there are two calls to the API using two different canvas IDs
