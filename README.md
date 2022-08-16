# Discordeno Audio Plugin

This plugin enables your bot to send and receive audio.
Play either local files or stream straight from YouTube using [ytdl-core](https://github.com/DjDeveloperr/ytdl_core).
Or create your own audio sources!

No external plugins like FFMPEG required!

## Enable Audio usage

Enabling the plugin is similar to the cache plugin.

After that just connect to a channel and play your songs!

```js
import { enableAudioPlugin } from "https://deno.land/x/discordeno_audio_plugin/mod.ts";

const baseBot = createBot({}); // Create your bot
const bot = enableAudioPlugin(baseBot); // Enable the plugin
await startBot(bot);

// Connect to a channel like normal
bot.helpers.connectToVoiceChannel(
  "your-guildid",
  "channel-id"
);

// Play music :)
const player = bot.helpers.getPlayer("your-guildid");
player.pushQuery("Obi-Wan - Hello there.");
```

## Playing sound

Sound can be enqueued using the helper functions that have been added by `enableAudioPlugin`.
Sounds are managed using a `QueuePlayer`, allowing for multiple to be queued, shuffled, etc.

```js
const player = bot.helpers.getPlayer("your-guildid");

// Pushes a song to the end of the queue
// In this case it will stream directly from youtube
player.pushQuery("Obi-Wan - Hello there.");

// Local files have to be raw pcm files with data in the following format:
// 2 channel, 16bit Little Endian @48kHz
player.pushQuery("./hello/world.pcm"); 

// Interrupts the current sound, resumes when done
player.interruptQuery("rEq1Z0bjdwc"); 
```


## Playing your own source

Given that you have an audio source in the correct format you can play from any source that you want.

IMPORTANT:
The data needs to be PCM 2 channel 16bit Little Endian @48kHz.
```js
// Create and play your own source!
const source = createAudioSource("Title", () => AsyncIterableIterator<Uint8Array>)
player.push(source); 
```
Or pass in your own `loadSource` function when enabling the plugin:
```js
const loadSource = (query: string) => {
  return createAudioSource("Title", () => AsyncIterableIterator<Uint8Array>);
}
const bot = enableAudioPlugin(baseBot, loadSource);
player.pushQuery("Query to pass to loadSource");
```



## Listening

While receiving audio is not officially supported by Discord, it does work for now.

```js
// Audio received is not a single stream!
// Each user is received separately
// Decoded audio is again 2 channel 16bit LE 48kHz pcm data
for await (const { user, decoded } from bot.helpers.onAudio("guildId")) {
  ...
}

// You can also filter out one or more users
for await (const { decoded } from bot.helpers.onAudio("guildId", "userid")) {
  ...
}
```
