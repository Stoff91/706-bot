require('dotenv').config();
const { Client, IntentsBitField, GatewayIntentBits } = require('discord.js');
const { Player } = require('discord-player');

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

client.once('ready', () => {
  console.log(`✅ ${client.user.tag} is online.`);
  
  // Registering commands (if using guild-based commands)
  const guild = client.guilds.cache.get('YOUR_GUILD_ID'); // Replace with your guild ID
  if (guild) {
    const commands = [
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

    // Try to connect to the voice channel and play the requested song
    const queue = player.createQueue(interaction.guild, {
      metadata: {
        channel: interaction.channel,
      },
    });

    try {
      if (!queue.connection) await queue.connect(voiceChannel);
    } catch {
      queue.destroy();
      return interaction.reply('Could not join your voice channel!');
    }

    await interaction.reply(`Searching for **${query}**...`);

    const track = await player
      .search(query, {
        requestedBy: interaction.user,
        searchEngine: 'youtube',
      })
      .then((x) => x.tracks[0]);

    if (!track) return interaction.followUp('No results found!');

    queue.addTrack(track);
    if (!queue.playing) await queue.play();
    interaction.followUp(`Now playing: **${track.title}**`);
  }

  if (commandName === 'stop') {
    const queue = player.getQueue(interaction.guildId);
    if (!queue) return interaction.reply('There is no music playing currently!');

    queue.destroy(); // Stop the music and clear the queue
    return interaction.reply('Stopped the music and left the voice channel!');
  }
});

// Handle message commands like 'hello'
client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  if (message.content.toLowerCase() === 'hello') {
    message.reply('hello');
  }
});

// Login to Discord with your bot token
client.login(process.env.BOT_TOKEN);