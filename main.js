require('dotenv').config();
const { Client, IntentsBitField, GatewayIntentBits } = require('discord.js');
const { Player } = require('discord-player');
const { useMasterPlayer, extractors } = require('@discord-player/extractor');  // Import extractors

// Create a new client instance
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    GatewayIntentBits.GuildVoiceStates,  // Required for voice functionality
  ],
});

// Create a new Player instance
const player = new Player(client);

// Register the extractors
(async () => {
  await player.extractors.loadDefault();
  console.log('✅ Extractors loaded and registered.');
})();

client.once('ready', () => {
  console.log(`✅ ${client.user.tag} is online.`);

  // Registering commands (if using guild-based commands)
  const guild = client.guilds.cache.get('1297681436882505769'); // Replace with your guild ID
  if (guild) {
    const commands = [
      { 
        name: 'lastwar',
        description: 'Get the last war YouTube link of our SVS.',
      },
      {
        name: 'play',
        description: 'Play a song from YouTube',
        options: [
          {
            name: 'query',
            type: 3, // STRING type
            description: 'The song you want to play (URL or search query)',
            required: true,
          },
        ],
      },
      {
        name: 'stop',
        description: 'Stop the current song and leave the voice channel',
      },
    ];

    guild.commands.set(commands);
    console.log('✅ Slash commands registered.');
  }
});

// Handle music commands
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'play') {
    const query = interaction.options.getString('query');

    // Ensure the user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply('You need to be in a voice channel to play music!');
    }

    // Create a queue for the guild and connect to the voice channel
    let queue = player.nodes.create(interaction.guild, {
      metadata: {
        channel: interaction.channel,
      },
    });

    // Try to connect to the voice channel
    try {
      if (!queue.connection) await queue.connect(voiceChannel);
    } catch (error) {
      queue.delete();
      return interaction.reply('Could not join your voice channel!');
    }

    await interaction.reply(`Searching for **${query}**...`);

    const searchResult = await player.search(query, {
      requestedBy: interaction.user,
      searchEngine: 'youtube',  // Ensure this is the correct engine
    });

    if (!searchResult || !searchResult.tracks.length) {
      return interaction.followUp('No results found!');
    }

    const track = searchResult.tracks[0];
    queue.addTrack(track);

    // Play the track if not already playing
    if (!queue.playing) await queue.node.play();
    
    interaction.followUp(`Now playing: **${track.title}**`);
  }

  if (commandName === 'stop') {
    const queue = player.nodes.get(interaction.guildId);
    if (!queue) return interaction.reply('There is no music playing currently!');

    queue.delete(); // Stop the music and clear the queue
    return interaction.reply('Stopped the music and left the voice channel!');
  }

  // /lastwar command
  if (commandName === 'lastwar') {
    const youtubeLink = 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID'; // Replace with actual YouTube video ID
    await interaction.reply(`Here is the last war video: ${youtubeLink}`);
  }
});

// Handle message commands like 'hello'
client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  if (message.content.toLowerCase() === 'hello') {
    message.reply('Hello');
  }
});

// Login to Discord with your bot token
client.login(process.env.BOT_TOKEN);