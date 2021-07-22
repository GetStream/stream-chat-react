# Official React SDK for [Stream Chat](https://getstream.io/chat/sdk/react/)

<p align="center">
  <a href="https://getstream.io/chat/react-chat/tutorial/"><img src="https://i.imgur.com/SRkDlFX.png" alt="react native chat" width="60%" /></a>
</p>


## Spawning the react app from cypress startup locally
Replace the path with your react and typescript-app path in the /cypress/cypress/plugins

 sp1 = spawn('npm', ['start'], {cwd:'/Users/ENTER USER HERE/stream-chat-react'});
 
 sp2 = spawn('npm', ['start'], {cwd:'/Users/ENTER USER HERE/stream-chat-react/examples/typescript-app'});

## Running the test 
cd to cypress directory
## With Cypress Dashboard
yarn cypress:open --config experimentalInteractiveRunEvents=true

## Headless chrome
yarn cypress:run --config experimentalInteractiveRunEvents=true
