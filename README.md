# TTLS Controller CLI

Control **TikTok Live Studio (TTLS)** directly from your terminal! 🎬✨

This is a modern Node.js Command Line Interface (CLI) built on top of a reverse-engineered local Socket.IO API that TTLS uses to communicate with its official Elgato Stream Deck plugin. 

## Features

- 🕵️ **Port Scanning**: Automatically finds and connects to the active TTLS local server.
- 🔄 **State Sync**: Retrieve the current scenes and settings from TTLS.
- 🎬 **Scene Switcher**: Switch to any of your scenes with a single command.
- 🖼️ **Source Toggling**: Show or hide sources within your scene.
- 🎛️ **Extensive Triggers**: Over 20+ supported actions, from Mutli-Guest and Co-Host panels to Audio Filters and Treasure Boxes.

---

## Installation

You can install `ttls-cli` globally via npm to make it available anywhere on your system.

```bash
npm install -g @2null/ttls-controller
```

*(Note: If you are running from the source repository, you can use `npm link` instead to install the CLI locally.)*

---

## Command Reference

### `ttls-cli info`
Connects to TTLS, fetches current settings (like active and available scenes), and prints the data.
```bash
ttls-cli info
```

### `ttls-cli scene <scene_name>`
Switch your TTLS layout to a specific scene by name.
```bash
ttls-cli scene "Just Chatting"
```

### `ttls-cli source <source_name>`
Show or hide a specific source by name.
```bash
ttls-cli source "Webcam"
```

### `ttls-cli trigger <action>`
Trigger any simple action, panel, or effect. See the full list of available actions below.
```bash
# Example: Toggle the Microphone
ttls-cli trigger mic

# Example: Open the Co-Host panel
ttls-cli trigger co-host
```

---

## Full List of Supported Triggers

You can use any of the following actions with the `ttls-cli trigger <action>` command:

*   `mic`: Mute / unmute microphone
*   `audio`: Mute / unmute audio output
*   `record`: Start / stop local recording
*   `live`: Go / end LIVE
*   `live-pause`: Pause / resume LIVE
*   `highlight`: Highlight this moment
*   `vibe`: Dynamic effects
*   `say-hi`: Say hi to viewers
*   `sound-effect`: Play sound effect
*   `audio-filter`: Turn on / off audio effect
*   `camera-effect`: Turn on / off camera effect
*   `co-host`: Open "Co-host"
*   `treasure-box`: Open "Treasure Box"
*   `guess-game`: Open "Guessing game"
*   `play-together`: Open "Play Together"
*   `goody-bag`: Open "Goody Bag"
*   `vote`: Open "Poll & Gift vote"
*   `live-goal`: Open "LIVE goal"
*   `multi-guest`: Open "Multi-guest"
*   `team`: Open "Team"
*   `game-rewards`: Open "Game Rewards"
*   `promote`: Open "Promote"
*   `mic-control`: Open "MicControl"
*   `audio-control`: Open "AudioControl"

---

## How It Works 🛠️

TikTok Live Studio hosts a local Socket.IO server designed to communicate with the official Elgato Stream Deck plugin. Here is how `ttls-cli` interacts with it:

1. **Port Scanning**: TTLS runs its Socket.IO server on one of several known ports (e.g., `28189`, `39728`, `34246`, `42205`, `38534`, `40825`, `40622`). The CLI attempts to connect to these until it finds the active one.
2. **The Handshake**: The connection requires a specific subprotocol (`protocols: ["streamdeck_ttls_v1"]`). Once connected, the client emits `stream_deck/join_room` followed by `stream_deck/sync_settings` to initialize state.
3. **Triggering Actions**: To execute a command (like switching scenes), the CLI sends an event `stream_deck/action_emit` containing a stringified JSON payload with specific Action UUIDs (e.g., `com.tiktok.livestudio.scene` for scenes, `com.tiktok.livestudio.mic` for mic toggle, etc.).

---

## Contributing

Contributions are always welcome! If you find new Action UUIDs, or want to add features like macro support, feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under The Unlicense. See `LICENSE` for more information.