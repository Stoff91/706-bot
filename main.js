require('dotenv').config();
const { Client, IntentsBitField, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.DirectMessages
  ],
});

// Define configuration variables
const WELCOME_MESSAGE = "Welcome to Server #706! Please follow the instructions to set your nickname and enjoy your stay. (This is curently in dev, if this message is here - disregard the instructions. Real men test in prod.)";
const ROLE_DUPLICATE = "Duplicate";
const ROLE_UNSET_ALLIANCE = "Unset Alliance";
const ROLE_UNSET_NICKNAME = "Unset Nickname";
const ROLE_UNSET_SERVER = "Unset Server";


//This is just for logging when bot comes online
client.once('ready', async () => {
  console.log('✅ Bot is online.');

  // Registering commands when the bot starts 
  const guild = client.guilds.cache.get('1310170318735802398'); // Replace with your guild ID


//List commands for the bot here - here we're talking SLASH COMMANDS
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
    const youtubeLink = 'https://youtu.be/RFcAIQVkgjE'; // Replace with actual YouTube video ID
    await interaction.reply(`Here is the last war video: ${youtubeLink} - and yes, we won.`);
  }
});

client.on('messageCreate', (message) => {
  if (message.author.bot) {
    return;
  } 
  if (message.content.toLowerCase() === 'hello') {
    message.reply('Hello');
  }
});




// Event handler for when a new member joins
client.on('guildMemberAdd', async (member) => {
    try {
        const dmChannel = await member.createDM();
        await dmChannel.send(WELCOME_MESSAGE);

        const server = await askQuestion(dmChannel, "What SERVER are you on?");
        const confirmServer = await askYesNo(dmChannel, `You entered SERVER: ${server}. Is this correct? (yes/no)`);
        if (!confirmServer) return restartProcess(member);

        const alliance = await askQuestion(dmChannel, "What ALLIANCE are you in?");
        const confirmAlliance = await askYesNo(dmChannel, `You entered ALLIANCE: ${alliance}. Is this correct? (yes/no)`);
        if (!confirmAlliance) return restartProcess(member);

        const ingameName = await askQuestion(dmChannel, "What is your INGAME NAME?");
        const confirmName = await askYesNo(dmChannel, `You entered NAME: ${ingameName}. Is this correct? (yes/no)`);
        if (!confirmName) return restartProcess(member);

        await dmChannel.send(`Confirming details:\nServer: ${server}\nAlliance: ${alliance}\nNickname: ${ingameName}`);

        const confirmAll = await askYesNo(dmChannel, "Are these details correct? (yes/no)");
        if (!confirmAll) return restartProcess(member);

        // Set nickname and roles
        const guild = member.guild;
        const allianceRole = guild.roles.cache.find(role => role.name === alliance) || 
                             guild.roles.cache.find(role => role.name === ROLE_UNSET_ALLIANCE);
        if (allianceRole) await member.roles.add(allianceRole);

        const newNickname = `[${alliance}] ${ingameName}`;
        const existingMember = guild.members.cache.find(m => m.nickname === newNickname);

        if (existingMember) {
            const duplicateRole = guild.roles.cache.find(role => role.name === ROLE_DUPLICATE);
            if (duplicateRole) await member.roles.add(duplicateRole);
        } else {
            await member.setNickname(newNickname);
        }

        await dmChannel.send("Your nickname and roles have been successfully updated!");
    } catch (error) {
        console.error("Error handling new member:", error);
    }
});

// Function to ask a question and wait for a response
async function askQuestion(dmChannel, question) {
    await dmChannel.send(question);
    const filter = response => response.author.bot === false;
    const collected = await dmChannel.awaitMessages({ filter, max: 1, time: 60000 });
    return collected.first()?.content;
}

// Function to ask a yes/no question and return true/false
async function askYesNo(dmChannel, question) {
    const answer = await askQuestion(dmChannel, question);
    return answer?.toLowerCase() === 'yes';
}

// Function to restart the process
async function restartProcess(member) {
    const dmChannel = await member.createDM();
    await dmChannel.send("Process restarting. Please follow the instructions again.");
    member.roles.set([]).catch(console.error); // Clear roles
}



















client.login(process.env.BOT_TOKEN);