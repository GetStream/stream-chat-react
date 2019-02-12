The date separator between messages.
Here's what it looks like for today.

```js
const date = new Date();
<DateSeparator date={date} />;
```

and for a date in the past:

```js
const date = new Date('December 17, 1995 03:24:00');
<DateSeparator date={date} />;
```
