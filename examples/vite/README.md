## Deploying the Threads Demo

1. Build and link `stream-chat` and `stream-chat-css` from the `feat/threads-v2` branch
2. Link to the demo Vercel project and pull default environment variables:

```sh
yarn vercel link --yes --scope getstreamio --project stream-threads-demo
yarn vercel pull
```

3. Build and deploy:

```sh
yarn vercel build
yarn vercel deploy --prebuilt
```

The deployed app will use the app, user and token specified in Vercel environment variables. You can override these values in URL search params:

- `key` to override app key
- `uid` to override user id
- `ut` to override token
