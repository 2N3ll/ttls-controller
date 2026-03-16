#!/usr/bin/env node
import { Command } from 'commander';
import { io } from 'socket.io-client';
import chalk from 'chalk';

const PORTS = [28189, 39728, 34246, 42205, 38534, 40825, 40622];

const ACTIONS = {
  scene: 'com.tiktok.livestudio.scene',
  mic: 'com.tiktok.livestudio.mic',
  audio: 'com.tiktok.livestudio.audio',
  record: 'com.tiktok.livestudio.recording',
  live: 'com.tiktok.livestudio.livestartend'
};

const program = new Command();

/**
 * Attempts to connect to the TTLS local socket server across known ports.
 * @returns {Promise<import("socket.io-client").Socket>}
 */
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
      // Continue to next port
    }
  }

  throw new Error('Could not connect to TTLS. Ensure TikTok Live Studio is running.');
}

/**
 * Perform the initial handshake sequence.
 * @param {import("socket.io-client").Socket} socket
 */
function performHandshake(socket) {
  return new Promise((resolve) => {
    socket.once('stream_deck/sync_settings', (data) => {
      resolve(data);
    });
    
    socket.emit('stream_deck/join_room');
    socket.emit('stream_deck/sync_settings');
  });
}

/**
 * Emits an action to TTLS.
 * @param {import("socket.io-client").Socket} socket
 * @param {string} actionId
 * @param {object} settings
 */
function emitAction(socket, actionId, settings = {}) {
  const payload = {
    action: actionId,
    context: `cli_command_${Date.now()}`,
    payload: {
      settings
    }
  };
  socket.emit('stream_deck/action_emit', JSON.stringify(payload));
}

program
  .name('ttls-cli')
  .description('Control TikTok Live Studio from your terminal')
  .version('1.0.0');

program
  .command('info')
  .description('Get current TTLS state and available scenes')
  .action(async () => {
    try {
      const socket = await connectToTTLS();
      const settings = await performHandshake(socket);

      // We parse the stringified JSON payload returned in sync_settings if needed,
      // but assuming the payload structure contains current scene info.
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
      
      console.log(chalk.green(`✔ Command sent!`));
      
      setTimeout(() => {
        socket.close();
        process.exit(0);
      }, 500); // give it a brief moment to send
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program
  .command('toggle <target>')
  .description('Toggle a specific state (mic, audio, record, live)')
  .action(async (target) => {
    const actionId = ACTIONS[target.toLowerCase()];
    if (!actionId) {
      console.error(chalk.red(`Unknown target: ${target}. Allowed targets: mic, audio, record, live`));
      process.exit(1);
    }

    try {
      const socket = await connectToTTLS();
      await performHandshake(socket);

      console.log(chalk.yellow(`Toggling ${target}...`));
      emitAction(socket, actionId);

      console.log(chalk.green(`✔ Command sent!`));

      setTimeout(() => {
        socket.close();
        process.exit(0);
      }, 500);
    } catch (err) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program.parse();
