require('dotenv').config();
const { Client, IntentsBitField, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

// This is where you define your slash commands
client.once('ready', async () => {
  console.log(`✅ ${client.user.tag} is online.`);

  // Registering commands when the bot starts (you may want to move this to a separate command handler)
  const guild = client.guilds.cache.get('1297681436882505769'); // Replace with your guild ID

  if (guild) {
    const commands = [
      {
        name: 'lastwar',
        description: 'Get the last war YouTube link of our SVS.',
      },
    ];

    await guild.commands.set(commands);
    console.log('✅ Slash commands registered.');
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'lastwar') {
    // Replace with the actual YouTube link you want to return
    const youtubeLink = 'https://youtu.be/RFcAIQVkgjE'; // Replace with actual YouTube video ID

    await interaction.reply(`Here is the last war video: ${youtubeLink} - and yes, we won.`);
  }
});

client.on('messageCreate', (message) => {
  if (message.author.bot) {
    return;
  }

  if (message.content === 'hello') {
    message.reply('hello');
  }
});

client.login(process.env.BOT_TOKEN);
