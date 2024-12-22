require('dotenv').config();
// Import the discord.js library
const { Client, IntentsBitField, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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
const ROLE_NOT_VERIFIED = "Not Verified";
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
  if (message.member.bot) {
    return;
  } 
  if (message.content.toLowerCase() === 'hello') {
    message.reply('Hello');
  }
  if (message.content.toLowerCase() === '!restart onboarding') {
    message.reply('Lets go!');
    initiateProcess(initiateProcess(message.author.id));
  }
});


// Event handler for when a new member joins
client.on('guildMemberAdd', async (member) => {
  try {
    // Pass the userId to the initiateProcess function
    await initiateProcess(member.user.id);
  } catch (error) {
    console.error("Error handling new member:", error);
  }
});


async function initiateProcess(userId) {
    const dmChannel = await member.createDM();
    await dmChannel.send(WELCOME_MESSAGE);

    try {
    // Predefined guild object
    const guild = client.guilds.cache.get('1310170318735802398'); // Your guild ID here

    // Fetch the GuildMember using the user ID
    const member = await guild.members.fetch(userId);

    // Now you have the member object with full guild-specific data
    console.log(member.roles.cache.map(role => role.name)); // Logs all roles of the member

    // Continue with your logic using the member object
    // For example, setting a nickname or roles
    // member.setNickname('NewNickname');

  } catch (error) {
    console.error('Error fetching member:', error);
  }

    try {
        const server = await askQuestion(dmChannel, "What SERVER are you on?");
        if (!server) return; // If timeout occurs, exit

        const confirmServer = await askYesNoWithButtons(dmChannel, `You entered SERVER: ${server}. \nIs this correct? (yes/no)`);
        if (!confirmServer) return initiateProcess(member); // If no response, restart the process

        const alliance = await askQuestion(dmChannel, "What ALLIANCE are you in?");
        if (!alliance) return; // If timeout occurs, exit

        const confirmAlliance = await askYesNoWithButtons(dmChannel, `You entered ALLIANCE: ${alliance}. \nIs this correct? (yes/no)`);
        if (!confirmAlliance) return initiateProcess(member); // If no response, restart the process

        const ingameName = await askQuestion(dmChannel, "What is your INGAME NAME?");
        if (!ingameName) return; // If timeout occurs, exit

        const confirmName = await askYesNoWithButtons(dmChannel, `You entered NAME: ${ingameName}. \nIs this correct? (yes/no)`);
        if (!confirmName) return initiateProcess(member); // If no response, restart the process

        await dmChannel.send(`Thank you for following the prompt.\n Now, Confirming details:\n\nServer: ${server}\nAlliance: ${alliance}\nNickname: ${ingameName}`);

        const confirmAll = await askYesNoWithButtons(dmChannel, "Are these details correct? (yes/no)");
        if (!confirmAll) return initiateProcess(member); // If no response, restart the process

        const guild = member.guild;

        if (!guild) {
            await dmChannel.send("Error: Couldn't fetch the guild. Setting again...");
            const guild = client.guilds.cache.get('1310170318735802398')
        }

        // Handle server role assignment
        const serverRole = guild.roles.cache.find(role => role.name.toLowerCase() === `srv: ${server.toLowerCase()}`) ||
                           guild.roles.cache.find(role => role.name === ROLE_UNSET_SERVER);
        if (!serverRole) {
            await dmChannel.send("Error: Could not find server role.");
        } else {
            await member.roles.add(serverRole);
        }

        // Handle alliance role assignment
        const allianceRole = guild.roles.cache.find(role => role.name.toLowerCase() === `tag: ${alliance.toLowerCase()}`) ||
                             guild.roles.cache.find(role => role.name === ROLE_UNSET_ALLIANCE);

        if (!allianceRole) {
            await dmChannel.send("Error: Could not find alliance role.");
        } else {
            await member.roles.add(allianceRole);
            const formattedAlliance = allianceRole.name; // Ensure correct case from role name
            const newNickname = `[${formattedAlliance}] ${ingameName}`;
            const existingMember = guild.members.cache.find(m => m.nickname === newNickname);

            if (existingMember) {
                const duplicateRole = guild.roles.cache.find(role => role.name === ROLE_DUPLICATE);
                if (duplicateRole) await member.roles.add(duplicateRole);
            } else {
                await member.setNickname(newNickname);
            }
        }

        await dmChannel.send("Your nickname and roles have been successfully updated!");
    } catch (error) {
        console.error("Error during process:", error);
        await dmChannel.send("An error occurred. Restarting the process.");
        return initiateProcess(member);
    }
}



// Function to ask a question and wait for a response
async function askQuestion(dmChannel, question) {
    await dmChannel.send(question);
    const filter = response => response.author.bot === false;
    const collected = await dmChannel.awaitMessages({ filter, max: 1, time: 60000 }); // 30 minutes timeout (30 * 60 * 1000)
    
    if (collected.size === 0) {
        await dmChannel.send("You took too long to respond. Please type `!restart onboarding` to restart the onboarding process.");
        return null;  // Return null to indicate the timeout
    }
    
    return collected.first()?.content;
}
// Function to ask a yes/no question using buttons and return true/false
async function askYesNoWithButtons(dmChannel, question) {
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('yes')
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('no')
            .setLabel('No')
            .setStyle(ButtonStyle.Danger)
    );

    const message = await dmChannel.send({ content: question, components: [row] });

    const filter = interaction => ['yes', 'no'].includes(interaction.customId) && interaction.user.id === dmChannel.recipient.id;
    const collected = await message.awaitMessageComponent({ filter, time: 60000 });

    if (collected.customId === 'yes') {
        await collected.reply({ content: 'You selected Yes.', ephemeral: true });
        return true;
    } else if (collected.customId === 'no') {
        await collected.reply({ content: 'You selected No.', ephemeral: true });
        return false;
    }
}


















client.login(process.env.BOT_TOKEN);