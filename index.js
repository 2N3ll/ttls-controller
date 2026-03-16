#!/usr/bin/env node
import { Command } from 'commander';
import { io } from 'socket.io-client';
import chalk from 'chalk';

const PORTS = [28189, 39728, 34246, 42205, 38534, 40825, 40622];

const ACTIONS = {
  // Original toggles
  mic: 'com.tiktok.livestudio.mic',
  audio: 'com.tiktok.livestudio.audio',
  record: 'com.tiktok.livestudio.recording',
  live: 'com.tiktok.livestudio.livestartend',

  // Scene and Source require special commands
  scene: 'com.tiktok.livestudio.scene',
  source: 'com.tiktok.livestudio.source',

  // New simple triggers
  'live-pause': 'com.tiktok.livestudio.livepauseresume',
  highlight: 'com.tiktok.livestudio.highlight',
  vibe: 'com.tiktok.livestudio.vibe',
  'say-hi': 'com.tiktok.livestudio.sayhi',
  'sound-effect': 'com.tiktok.livestudio.soundeffect',
  'audio-filter': 'com.tiktok.livestudio.audiofilter',
  'camera-effect': 'com.tiktok.livestudio.cameraeffects',
  
  // "Open" panel actions
  'co-host': 'com.tiktok.livestudio.cohost',
  'treasure-box': 'com.tiktok.livestudio.treasurebox',
  'guess-game': 'com.tiktok.livestudio.guessgame',
  'play-together': 'com.tiktok.livestudio.playtogether',
  'goody-bag': 'com.tiktok.livestudio.goodybag',
  vote: 'com.tiktok.livestudio.vote',
  'live-goal': 'com.tiktok.livestudio.livegoal',
  'multi-guest': 'com.tiktok.livestudio.multiguest',
  team: 'com.tiktok.livestudio.team',
  'game-rewards': 'com.tiktok.livestudio.gamepad',
  promote: 'com.tiktok.livestudio.promote',
  'mic-control': 'com.tiktok.livestudio.MicControl',
  'audio-control': 'com.tiktok.livestudio.audiocontrol'
};

const program = new Command();

async function connectToTTLS() {
  console.log(chalk.blue('Scanning for active TikTok Live Studio (TTLS) ports...'));
  for (const port of PORTS) {
    try {
      const socket = await new Promise((resolve, reject) => {
        const url = `ws://127.0.0.1:${port}`;
        const s = io(url, {
          transports: ['websocket'],
          protocols: ['streamdeck_ttls_v1'],
          reconnection: false,
          timeout: 1000,
        });
        s.on('connect', () => resolve(s));
        s.on('connect_error', (err) => {
          s.close();
          reject(err);
        });
      });
      console.log(chalk.green(`✔ Connected to TTLS on port ${port}`));
      return socket;
    } catch (error) {
      // Continue
    }
  }
  throw new Error('Could not connect to TTLS. Ensure TikTok Live Studio is running.');
}

function performHandshake(socket) {
  return new Promise((resolve) => {
    socket.once('stream_deck/sync_settings', (data) => resolve(data));
    socket.emit('stream_deck/join_room');
    socket.emit('stream_deck/sync_settings');
  });
}

function emitAction(socket, actionId, settings = {}) {
  const payload = {
    action: actionId,
    context: `cli_command_${Date.now()}`,
    payload: { settings },
  };
  socket.emit('stream_deck/action_emit', JSON.stringify(payload));
  console.log(chalk.green(`✔ Command sent!`));
  setTimeout(() => {
    socket.close();
    process.exit(0);
  }, 500);
}

program
  .name('ttls-cli')
  .description('Control TikTok Live Studio from your terminal')
  .version('1.1.0'); // Bump version for new features

program
  .command('info')
  .description('Get current TTLS state and available scenes')
  .action(async () => {
    try {
      const socket = await connectToTTLS();
      const settings = await performHandshake(socket);
      let parsedSettings;
      try {
        parsedSettings = typeof settings === 'string' ? JSON.parse(settings) : settings;
      } catch (e) {
        parsedSettings = settings;
      }
      console.log(chalk.cyan('\n--- TTLS Info ---'));
      console.log(chalk.white(JSON.stringify(parsedSettings, null, 2)));
      socket.close();
      process.exit(0);
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('scene <scene_name>')
  .description('Switch to a specified scene by name')
  .action(async (scene_name) => {
    try {
      const socket = await connectToTTLS();
      await performHandshake(socket);
      console.log(chalk.yellow(`Switching scene to "${scene_name}"...`));
      emitAction(socket, ACTIONS.scene, { scene: scene_name });
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('source <source_name>')
  .description('Show or hide a source by name')
  .action(async (source_name) => {
    try {
      const socket = await connectToTTLS();
      await performHandshake(socket);
      console.log(chalk.yellow(`Toggling source "${source_name}"...`));
      // Assuming the payload structure is similar to scenes
      emitAction(socket, ACTIONS.source, { source: source_name });
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

const simpleActions = Object.keys(ACTIONS).filter(a => !['scene', 'source'].includes(a));

program
  .command('trigger <action>')
  .description(`Triggers a simple action. Available: ${simpleActions.join(', ')}`)
  .action(async (action) => {
    const actionId = ACTIONS[action.toLowerCase()];
    if (!actionId || ['scene', 'source'].includes(action.toLowerCase())) {
      console.error(chalk.red(`Unknown or invalid action: ${action}.`));
      console.error(chalk.yellow(`Available simple actions: ${simpleActions.join(', ')}`));
      console.error(chalk.yellow(`For scenes or sources, use the 'scene' or 'source' commands.`));
      process.exit(1);
    }

    try {
      const socket = await connectToTTLS();
      await performHandshake(socket);
      console.log(chalk.yellow(`Triggering action: ${action}...`));
      emitAction(socket, actionId);
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program.parse();
