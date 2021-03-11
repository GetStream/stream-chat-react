Here's an example of an image:

```js
import { Attachment } from './Attachment';

const a = [{
  thumb_url: 'https://media3.giphy.com/media/gw3IWyGkC0rsazTi/giphy.gif',
  type: 'image',
}];

function actionHandler(action) {
  console.log(action);
}

<Attachment attachments={a} actionHandler={actionHandler} />;
```

Or a video element:

```js
import { Attachment } from './Attachment';


const a = [{
  asset_url: 'https://www.youtube.com/embed/7LiyXFYaEAY',
  author_name: 'YouTube',
  image_url: 'https://i.ytimg.com/vi/7LiyXFYaEAY/maxresdefault.jpg',
  og_scrape_url: 'https://www.youtube.com/watch?v=7LiyXFYaEAY',
  text: 'Game of Thrones final season premieres April 14th ...',
  type: 'video',
}];

function actionHandler(action) {
  console.log(action);
}

<Attachment attachments={a} actionHandler={actionHandler} />;
```

Image with more meta information:

```js
import { Attachment } from './Attachment';

const a = [{
  image_url:
    'https://images.unsplash.com/photo-1548256434-c7d2374b1077?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjEyMDd9',
  og_scrape_url: 'https://unsplash.com/photos/lxuB4abGzXc',
  text: 'Download this photo in Addu City...',
  thumb_url:
    'https://images.unsplash.com/photo-1548256434-c7d2374b1077?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjEyMDd9',
  title: 'Cosmic Home photo by Ibrahim Shabil (@shabilphotos) on Unsplash',
  title_link: 'https://unsplash.com/photos/lxuB4abGzXc',
  type: 'image',
}];

function actionHandler(action) {
  console.log(action);
}

<Attachment attachments={a} actionHandler={actionHandler} />;
```