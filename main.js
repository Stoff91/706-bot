require('dotenv').config();
// Import the discord.js library
const { Client, IntentsBitField, Partials, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { translate } = require('@vitalets/google-translate-api');


const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.DirectMessages
  ],
  partials: [Partials.Channel]
});

let unsetServer; // Declare variables outside
let unsetAlliance;
const CHANNEL_ID = '1323289983246925885'; // Replace with your channel ID
const TRANSLATION_API_URL = 'https://www.lkpgmuaythai.se/translation/';
const QUIZ_TIMEOUT = 600; // Timeout in seconds 


async function translateMessage(messageContent) {
    const sanitizedContent = messageContent.replace(/\//g, ' ');
    const url = `${TRANSLATION_API_URL}${encodeURIComponent(sanitizedContent)}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Translation request failed with status ${response.status}`);
    }

    return response.json();
}

const quizData = {
    name: "New Years Quiz 2024",
    questions: [
        {
            question: "CEST is an abbreviation that a lot of people use daily during summertime. One person in particular hates the use of this, and strikes people down when they say IN CEST. Whom?",
            options: ["Sweettears", "Idlehands", "Putin"],
            correct: "Idlehands",
            attachment: "https://sv.thetimenow.com/img/coordinated_universal_time.jpg" // Attachment URL
        },
        {
            question: "Abbi, queen of the R4's, sometimes sends a thumbs up, or a simple 'ok'. What does this mean?",
            options: ["Ok", "Okay", "Fuck off"],
            correct: "Fuck off",
            attachment: null // No attachment
        },
        {
            question: "Whom does this foot belong to?",
            options: ["Pootang", "Del", "Hulken"],
            correct: "Pootang",
            attachment: "https://lkpgmuaythai.se/public/img/image_3.png" // Attachment URL
        },
        {
            question: "Nirvana once took a pretty awesome cover photo, and this picture was taken as a nod to that. Which HvC member is this?",
            options: ["Texdaddy", "Panco", "Runka"],
            correct: "Runka",
            attachment: "https://lkpgmuaythai.se/public/img/image_4.jpg" // Attachment URL
        },
        {
            question: "WELCOME TO THE CUMZONE - who is the famous player of this discord sound?",
            options: ["Grimm", "Astral", "Loco"],
            correct: "Astral",
            attachment: null // No attachment
        }
        ,
        {
            question: "This person grew up to be a player in server 706. Whom does the face belong to?",
            options: ["Del", "Lilwayne420", "Abbi"],
            correct: "Abbi",
            attachment: "https://lkpgmuaythai.se/public/img/image_6.png"
        }
        ,
        {
            question: "A few months ago, after a alcohol related event - someone gave everyone on discord a tour of the room he stayed in. What person did this?",
            options: ["Dreadblade", "Sweettears", "Ebeny"],
            correct: "Sweettears",
            attachment: "https://lkpgmuaythai.se/public/img/image_7.png"
        }
        ,
        {
            question: "What player in HvC once stated how he was so good at never mentioning his name online, so none would ever find him. Only to have his last name repeated to him in AC 20 seconds later?",
            options: ["Scott", "Harige", "Panco"],
            correct: "Panco",
            attachment: null
        }
        ,
        {
            question: "What player in the below list is the most tech-retarded?",
            options: ["Tysonator", "Bark", "Astral"],
            correct: "Bark",
            attachment: null
        }
        ,
        {
            question: "What player in HvC appeared in Harry Potter?",
            options: ["Abbi", "Junior", "Del"],
            correct: "Del",
            attachment: null
        }
        ,
        {
            question: "This image was made during a day of VS against another alliance. Which one? *Hint - They smell like pigs and you can hear a distant screech of haram*",
            options: ["7RD", "ITP", "GMM"],
            correct: "GMM",
            attachment:  "https://lkpgmuaythai.se/public/img/image_10.png"
        }
        ,
        {
            question: "Whom does this mouth belong to?",
            options: ["Junior", "Pootang", "Kaan"],
            correct: "Kaan",
            attachment: "https://lkpgmuaythai.se/public/img/image_9.png"
        }
         ,
        {
            question: "What kind of business does our very own Xiao have?",
            options: ["IT Company", "Chopstick Factory", "Restaurant"],
            correct: "Restaurant",
            attachment: null
        }
        ,
        {
            question: "Who is known as the HOARDLORD of HvC?",
            options: ["ICE CARMINE", "Hardnips69", "Kamaz"],
            correct: "Kamaz",
            attachment: null
        }
        ,
        {
            question: "Which country is the best in scandinavia?",
            options: ["Sweden"],
            correct: "Sweden",
            attachment: null
        }
        ,
        {
            question: "Whom does this hand belong to?",
            options: ["Hypocriticat", "Idlehands", "OG90"],
            correct: "Hypocriticat",
            attachment: "https://lkpgmuaythai.se/public/img/image_14.png"
        }
        ,
        {
            question: "This specific player is from AUSTRIA. You heard that right. No ALIA. Which person is it on the photo?",
            options: ["Texdaddy", "Stedders", "crapoutou"],
            correct: "Texdaddy",
            attachment: "https://lkpgmuaythai.se/public/img/image_15.png"
        }
        ,
        {
            question: "We have our own private seller of 8balls. Whom is it in this picture?",
            options: ["Gavpimmy", "Lato", "Stedders"],
            correct: "Gavpimmy",
            attachment: "https://lkpgmuaythai.se/public/img/image_16.png"
        }
        ,
        {
            question: "I don't know why, but you just don't like it when some people get angry. Whom is it in this picture?",
            options: ["Grimm", "hulken3d", "CrimsonSpecter"],
            correct: "hulken3d",
            attachment: "https://lkpgmuaythai.se/public/img/image_17.png"
        }
        ,
        {
            question: "Our very own canadian - Whom is it in this picture?",
            options: ["Softnips", "ColdAs1ce", "NoraPure"],
            correct: "Softnips",
            attachment: "https://lkpgmuaythai.se/public/img/image_18.png"
        }
        ,
        {
            question: "The man, the myth the legend - the being of many languages - Whom is it in this picture?",
            options: ["Veps", "Podz", "Panco"],
            correct: "Panco",
            attachment: "https://lkpgmuaythai.se/public/img/image_19.png"
        }
    ]
};

  let activeQuizzes = {}; // Tracks quiz progress


client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const guild = client.guilds.cache.get('1310170318735802398');


  if (!guild) {
    console.error("Guild not found!");
    return;
  }

  unsetServer = guild.roles.cache.find(role => role.name === "Unset Server");
  unsetAlliance = guild.roles.cache.find(role => role.name === "Unset Alliance");

  if (!unsetServer) console.error("Unset Server role not found!");
  if (!unsetAlliance) console.error("Unset Alliance role not found!");

  try {
        const user = await client.users.fetch('189751471376564228');
        await user.send("Hello! The bot is now online.");
        console.log("DM sent to user 189751471376564228.");
    } catch (error) {
        console.error("Failed to send DM to user 189751471376564228:", error);
    }
    console.log(translate);
});

function getRolesWithPrefix(guild, prefix) {
  return guild.roles.cache.filter(role => role.name.startsWith(prefix));
}

function splitIntoRows(buttons, maxPerRow = 5) {
  const rows = [];
  for (let i = 0; i < buttons.length; i += maxPerRow) {
    rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + maxPerRow)));
  }
  return rows;
}

function sortButtonsAlphabetically(buttons) {
  const sortedButtons = buttons.sort((a, b) => a.data.label.localeCompare(b.data.label));
  const otherButton = sortedButtons.find(button => button.data.label === "Other");
  const nonOtherButtons = sortedButtons.filter(button => button.data.label !== "Other");
  return [...nonOtherButtons, otherButton];
}

async function initiateOnboarding(member, guild) {
  let dmChannel;
  try {

    // Create a DM channel with the member
    const dmChannel = await member.createDM();

    // Create the embed message
    const welcomeEmbed = new EmbedBuilder()
      .setColor('#00FFAA') // Set a cool color for the embed
      .setTitle('🌟 Welcome to Server #706! 🌟')
      .setDescription(
        "👋 We're thrilled to have you here! Please follow the onboarding instructions to set your nickname and dive into the fun. 🛠️\n\n" +
        "⚠️ **Heads up!** This feature is currently in development, so things might not be perfect. If you encounter any hiccups, just restart the onboarding process by typing `!onboard`.\n\n" +
        "🚀 *Remember, real heroes test in production!* 💪"
      )
      .setFooter({ text: 'Enjoy your stay!', iconURL: 'https://www.pockettactics.com/wp-content/sites/pockettactics/2024/10/Last-War-codes-1.jpg' }) // Optional: Add a footer icon
      .setTimestamp(); // Adds a timestamp

    // Send the embed in the DM channel
    await dmChannel.send({ embeds: [welcomeEmbed] });


    // Step 1: Ask for the server role
    const serverRoles = getRolesWithPrefix(guild, "Srv: ");
    let serverButtons = serverRoles.map(role => new ButtonBuilder()
      .setLabel(role.name.substring(5))
      .setCustomId(`server_${role.name}`)
      .setStyle(ButtonStyle.Primary));

    const otherServerButton = new ButtonBuilder()
      .setLabel("Other")
      .setCustomId("server_other")
      .setStyle(ButtonStyle.Danger);

    serverButtons.push(otherServerButton);
    serverButtons = sortButtonsAlphabetically(serverButtons);
    const serverRows = splitIntoRows(serverButtons);
    await dmChannel.send({ content: "What SERVER are you on?", components: serverRows });

    // Wait for server selection
    const serverInteraction = await dmChannel.awaitMessageComponent({
      filter: interaction => interaction.user.id === member.id && interaction.customId.startsWith("server_"),
      time: 300000 // 5 minutes
    }).catch(() => {
      dmChannel.send("Server selection timed out. You can restart the onboarding process by typing `!onboard`.").catch(console.error);
      throw new Error("Server selection timed out.");
    });

    let server;
    if (serverInteraction.customId === "server_other") {
      await serverInteraction.deferUpdate(); // Acknowledge the interaction immediately

      try {
        const serverPromptMessage = await dmChannel.send("Please enter the server name:");
        const serverMessage = await dmChannel.awaitMessages({
          filter: msg => msg.author.id === member.id,
          max: 1,
          time: 300000 // 5 minutes
        });

        server = serverMessage.first().content;
        await member.roles.add(unsetServer).catch(console.error);

        const auditChannel = guild.channels.cache.find(channel => channel.name === "audit");
        if (auditChannel) {
          await auditChannel.send(`User ${member} selected other server: ${server}`);
        }

        if (serverPromptMessage.deletable) await serverPromptMessage.delete().catch(console.error); // Clean up
        if (serverMessage.first() && serverMessage.first().deletable) await serverMessage.first().delete().catch(console.error); // Clean up
      } catch (error) {
        console.error(`Error handling 'server_other': ${error.message}`);
        await dmChannel.send("You did not provide a server name in time. Please restart the onboarding process by typing `!onboard`.");
        return;
      }
    } else {
      server = serverInteraction.customId.substring(7);
      await serverInteraction.update({ components: [] }); // Remove buttons
    }

    // Step 2: Ask for the alliance role
    const allianceRoles = getRolesWithPrefix(guild, "Tag: ");
    let allianceButtons = allianceRoles.map(role => new ButtonBuilder()
      .setLabel(role.name.substring(5))
      .setCustomId(`alliance_${role.name}`)
      .setStyle(ButtonStyle.Primary));

    const otherAllianceButton = new ButtonBuilder()
      .setLabel("Other")
      .setCustomId("alliance_other")
      .setStyle(ButtonStyle.Danger);

    allianceButtons.push(otherAllianceButton);
    allianceButtons = sortButtonsAlphabetically(allianceButtons);
    const allianceRows = splitIntoRows(allianceButtons);
    await dmChannel.send({ content: "What ALLIANCE are you in?", components: allianceRows });

    // Wait for alliance selection
    const allianceInteraction = await dmChannel.awaitMessageComponent({
      filter: interaction => interaction.user.id === member.id && interaction.customId.startsWith("alliance_"),
      time: 300000 // 5 minutes
    }).catch(() => {
      dmChannel.send("Alliance selection timed out. You can restart the onboarding process by typing `!onboard`.").catch(console.error);
      throw new Error("Alliance selection timed out.");
    });

    let alliance;
    if (allianceInteraction.customId === "alliance_other") {
      await allianceInteraction.deferUpdate(); // Acknowledge the interaction

      try {
        const alliancePromptMessage = await dmChannel.send("Please enter the alliance name:");
        const allianceMessage = await dmChannel.awaitMessages({
          filter: msg => msg.author.id === member.id,
          max: 1,
          time: 300000 // 5 minutes
        });

        alliance = allianceMessage.first().content;
        await member.roles.add(unsetAlliance).catch(console.error);

        const auditChannel = guild.channels.cache.find(channel => channel.name === "audit");
        if (auditChannel) {
          await auditChannel.send(`User ${member} selected other alliance: ${alliance}`);
        }

        if (alliancePromptMessage.deletable) await alliancePromptMessage.delete().catch(console.error); // Clean up
        if (allianceMessage.first() && allianceMessage.first().deletable) await allianceMessage.first().delete().catch(console.error); // Clean up
      } catch (error) {
        console.error(`Error handling 'alliance_other': ${error.message}`);
        await dmChannel.send("You did not provide an alliance name in time. Please restart the onboarding process by typing `!onboard`.");
        return;
      }
    } else {
      alliance = allianceInteraction.customId.substring(9);
      await allianceInteraction.update({ components: [] }); // Remove buttons
    }

    // Step 3: Ask for nickname
    await dmChannel.send("Please enter your in-game nickname:");
    const nicknameMessage = await dmChannel.awaitMessages({
      filter: msg => msg.author.id === member.id,
      max: 1,
      time: 300000 // 5 minutes
    }).catch(() => {
      dmChannel.send("Nickname input timed out. You can restart the onboarding process by typing `!onboard`.").catch(console.error);
      throw new Error("Nickname input timed out.");
    });
    const ingameName = nicknameMessage.first().content;

    // Confirmation
    const yesButton = new ButtonBuilder()
      .setLabel("Yes")
      .setCustomId("confirm_yes")
      .setStyle(ButtonStyle.Success);

    const noButton = new ButtonBuilder()
      .setLabel("No")
      .setCustomId("confirm_no")
      .setStyle(ButtonStyle.Danger);

    const confirmationRow = new ActionRowBuilder().addComponents(yesButton, noButton);

    await dmChannel.send({
      content: `Thank you for following the prompt.\nNow, Confirming details:\n\nServer: ${server}\nAlliance: ${alliance}\nNickname: ${ingameName}\n\nIs this correct?`,
      components: [confirmationRow]
    });

    const confirmationInteraction = await dmChannel.awaitMessageComponent({
      filter: interaction => interaction.user.id === member.id && interaction.customId.startsWith("confirm_"),
      time: 300000 // 5 minutes
    }).catch(() => {
      dmChannel.send("Confirmation timed out. You can restart the onboarding process by typing `!onboard`.").catch(console.error);
      throw new Error("Confirmation timed out.");
    });

    if (confirmationInteraction.customId === "confirm_yes") {
      await confirmationInteraction.update({ content: "Processing your choices...", components: [] }).catch(console.error);

      try {
        const duplicateRole = guild.roles.cache.find(role => role.name === "Duplicate");
        const hasSrvOrTagRoles = member.roles.cache.some(role => role.name.startsWith("Srv: ") || role.name.startsWith("Tag: "));

        if (hasSrvOrTagRoles) {
          const auditChannel = guild.channels.cache.find(channel => channel.name === "audit");
          if (auditChannel) {
            await auditChannel.send(`Duplicate detected for user ${member}`);
          }
        }

        const srvRolesToRemove = member.roles.cache.filter((role) =>
          role.name.startsWith("Srv: ") || role.name.startsWith("Tag: ")
        );

        try {
          await member.roles.remove(srvRolesToRemove);
        } catch (err) {
          console.error(err);
        }


        server = server.replace("Srv: ", "");
        alliance = alliance.replace("Tag: ", "");

        const serverRole = guild.roles.cache.find(role => role.name === `Srv: ${server}`);
        const allianceRole = guild.roles.cache.find(role => role.name === `Tag: ${alliance}`);

        if (!serverRole) {
          console.error(`Server role not found: Srv: ${server}`);
          await dmChannel.send(`Server role not found: ${server}`);
        } else {
          await member.roles.remove(unsetServer).catch(console.error);
          await member.roles.add(serverRole);
        }

        if (!allianceRole) {
          console.error(`Alliance role not found: Tag: ${alliance}`);
          await dmChannel.send(`Alliance role not found: ${alliance}`);
          const newNickname = `${ingameName}`;
          const existingMember = guild.members.cache.find(m => m.nickname === newNickname);
          if (!existingMember) {
            await member.setNickname(newNickname).catch(console.error);
          }
        } else {
          await member.roles.remove(unsetAlliance).catch(console.error);
          await member.roles.add(allianceRole);
          const formattedAlliance = allianceRole.name.substring(5); // Remove 'Tag: '
          const newNickname = `[${formattedAlliance}] ${ingameName}`;
          const existingMember = guild.members.cache.find(m => m.nickname === newNickname);
          if (!existingMember) {
            await member.setNickname(newNickname).catch(console.error);
          }
        }

        await dmChannel.send("Roles and nickname updated successfully!");
      } catch (error) {
        console.error(`Error updating roles and nickname: ${error.message}`);
        await dmChannel.send("An error occurred while updating your roles or nickname. Please contact support.");
      }
    } else {
      await confirmationInteraction.update({ content: "Process aborted. Please restart if needed.", components: [] }).catch(console.error);
    }
  } catch (error) {
    console.error(`Error: ${error}`);
    if (dmChannel) {
      await dmChannel.send(`An error occurred: ${error.message}`).catch(() => {
        console.error("Failed to send error message in DM channel.");
      });
    }
  }
}

client.on('messageCreate', (message) => {
  console.log(
    `[Message Log] channelType=${message.channel.type}, content="${message.content}"`
  );
});

client.on('guildMemberAdd', async member => {
  initiateOnboarding(member, member.guild);
  try {
  const channel = await member.guild.channels.fetch('1310174085036118027');
    if (channel && channel.isTextBased()) {
      await channel.send(
        `Welcome <@${member.id}> to the server! 🎉 Please check your DM conversation with the bot to complete onboarding. If the onboarding process hasn't started, send \`!onboard\` to the bot to begin.`
      );
    } else {
      console.error("Channel not found or not text-based.");
    }
  } catch (error) {
    console.error("Failed to handle guild member add:", error);
  }
});

client.on('messageCreate', async message => {

  if (message.channel.type === 1 && message.content.trim().toLowerCase() === '!onboard') {
    const guild = client.guilds.cache.get('1310170318735802398');
    if (!guild) {
      await message.reply("Unable to find the server for onboarding.");
      return;
    }

    let member;
    try {
      // This fetch ensures we get the member from the API if not in cache
      member = await guild.members.fetch(message.author.id);
    } catch (error) {
      // If user is not found or an error occurs
      console.error('Failed to fetch member:', error);
      await message.reply("You are not a member of the server.");
      return;
    }

    // If fetching is successful, 'member' will be defined
    await message.reply("Onboarding sequence initiated!");
    initiateOnboarding(member, guild);
  }

  if (message.content.startsWith('!whohasaccess')) {
    const args = message.content.split(' ');
    const channelId = args[1]; // The channel ID is passed as a second argument

    if (!channelId) {
      return message.reply('Please provide a channel ID.');
    }

    const beforeFilter = await getUsersWithChannelAccess(channelId, message.guild.id);

        // Filter out members with the "Admin" role
    const membersWithAccess = beforeFilter.filter(
      member => !member.roles.cache.has('1310174590449877053') // Exclude members with the Admin role
    );

    if (membersWithAccess.length === 0) {
      return message.reply('No members have access to this channel.');
    }

    // Format the message with mentions and IDs
    const mentions = membersWithAccess.map(member => `<@${member.id}> (ID: ${member.id})`).join('\n');

    // Send the message in the channel
    await message.reply(
      `Users with access to <#${channelId}>:\n${mentions}\n\nHELLO to everyone listed above! 🎉`
    );

    // Send a DM to each member
    for (const member of membersWithAccess) {
      try {
        await member.send(`HELLO, <@${member.id}>! You have access to the channel <#${channelId}>. 🎉`);
        console.log(`DM sent to ${member.user.tag}`);
      } catch (error) {
        console.error(`Failed to send DM to ${member.user.tag || member.id}:`, error);
      }
    }
  }


  if (!message.guild && message.content === '!delete-all') {
      //this one needs to be manually killed.
        console.log(`Received !delete-all command from ${message.author.tag}`);

        const dmChannel = message.channel;

        try {
            let fetchedMessages;
            do {
                // Fetch up to 50 messages in the DM channel
                fetchedMessages = await dmChannel.messages.fetch({ limit: 50 });

                // Iterate through fetched messages and delete them one by one
                for (const msg of fetchedMessages.values()) {
                    if (msg.deletable) {
                        await msg.delete().catch(err => console.error(`Failed to delete message: ${err.message}`));
                    } else {
                        console.warn(`Message ${msg.id} is not deletable.`);
                    }
                }
            } while (fetchedMessages.size > 0); // Continue until no more messages are left

            console.log(`All deletable messages in the DM with ${message.author.tag} have been deleted.`);
            await dmChannel.send("All deletable messages have been cleared.");
        } catch (error) {
            console.error('Error deleting messages in DM:', error);
            await dmChannel.send("An error occurred while trying to delete messages.");
        }
    }


    if (message.content.toLowerCase() === '!lesbo') {
        const embed = {
            title: "Rock, Paper, Scissors!",
            description: "Choose your move by clicking one of the buttons below:",
            color: 0x0099ff
        };

        const rockButton = new ButtonBuilder()
            .setLabel("Rock 🪨")
            .setCustomId("rps_rock")
            .setStyle(ButtonStyle.Primary);

        const paperButton = new ButtonBuilder()
            .setLabel("Paper 📄")
            .setCustomId("rps_paper")
            .setStyle(ButtonStyle.Primary);

        const scissorsButton = new ButtonBuilder()
            .setLabel("Scissors ✂️")
            .setCustomId("rps_scissors")
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(rockButton, paperButton, scissorsButton);

        await message.reply({ embeds: [embed], components: [row] });
    }
    //TRANSLATE SECTION
    if (message.author.bot || message.channel.id !== '1325950212086300804') return;
/*
    try {
        const response = await translate(message.content, {
            to: 'en',
            fetchOptions: { agent: null }, // Adjust or configure as necessary
        });

        // Determine the source language
        const srcLanguage = response.raw?.ld_result?.srclangs?.[0] || response.raw?.ld_result?.extended_srclangs?.[0] || 'unknown';

        console.log(`Detected source language: ${srcLanguage}`);

        // If the detected language is not English, reply with translation to English
        if (srcLanguage !== 'en') {
            await message.reply(`Translated to English: ${response.text}`);
        } else {
            // If the message is already in English, translate to French
            const frenchResponse = await translate(message.content, {
                to: 'fr',
                fetchOptions: { agent: null },
            });

            console.log('French translation response:', JSON.stringify(frenchResponse, null, 2));

            const { text: frenchText } = frenchResponse;
            await message.reply(`Translated to French: ${frenchText}`);
        }
    } catch (error) {
        console.error('Translation error:', error);
          if (error.name === 'TooManyRequestsError') {
              console.error('Too many requests - consider retrying with a proxy.');
          } */
          try {
          console.log('Attempting proxy-translation for:', message.content);

          // Use the API to translate the message
          const translationResponse = await translateMessage(message.content);
          const translatedText = translationResponse.translatedText;
          const sourceLanguage = translationResponse.sourceLanguage;

          console.log('Detected PROXY source language:', sourceLanguage);
          console.log('Translated text:', translatedText);

          if (sourceLanguage !== 'en') {
              // If the source language is not English, translate to English
              await message.reply(`Translated to English: ${translatedText}`);
          } else {
               // If the source language is not English, translate to English
              await message.reply(`Translated to French: ${translatedText}`);
          }
      } catch (error) {
          console.error('Translation error:', error);
          await message.react('😢'); // Add a crying reaction if translation fails
      }
   // } 

});

client.on('messageCreate', async (message) => {
    // Check if the message content is "!delete-bot" and the author is the server owner
    if (message.content === '!delete-bot') {
        try {
            const guildOwnerId = message.guild.ownerId; // Get server owner's ID

            if (message.author.id !== guildOwnerId) {
                return message.reply("Only the server owner can use this command.");
            }

            // Fetch messages in the channel
            const messages = await message.channel.messages.fetch();

            // Filter messages to only include those sent by the bot
            const botMessages = messages.filter(msg => msg.author.id === client.user.id);

            // Bulk delete the bot's messages
            for (const botMessage of botMessages.values()) {
                await botMessage.delete();
            }

            // Notify the owner
            await message.channel.send("All bot messages in this channel have been deleted.");
        } catch (error) {
            console.error("Error deleting bot messages:", error);
            message.channel.send("An error occurred while trying to delete bot messages.");
        }
    }
});

client.on('messageCreate', async (message) => {
    if (message.channel.isDMBased() && message.content.toLowerCase() === '!quiz') {
        const userId = message.author.id;

        const channel = client.channels.cache.get(CHANNEL_ID);
        const messages = await channel.messages.fetch({ limit: 100 });
        const hasCompleted = messages.some(msg => msg.content.includes(`<@${userId}>`) && msg.content.includes(`- end -`) && msg.content.includes(quizData.name));

        if (hasCompleted) {
            channel.send(`<@${userId}> - attempted to start another quiz but already completed ${quizData.name}.`);
            return message.reply(`You have already completed the quiz "${quizData.name}" and cannot start it again.`);
        }

        if (activeQuizzes[userId]) {
            return message.reply("You already have an active quiz!");
        }

        // Embed with Start Quiz confirmation
        const embed = {
            title: `Quiz: ${quizData.name}`,
            description: `Welcome to the quiz "${quizData.name}"! Here's how it works:\n\n` +
                         `- The quiz consists of ${quizData.questions.length} questions.\n` +
                         `- You have ${QUIZ_TIMEOUT} seconds to complete the quiz.\n` +
                         `- Each question will have multiple options, and you need to select the correct one.\n\n` +
                         `Click the "Start Quiz" button to begin!`,
            color: 0x0099ff
        };

        const startButton = new ButtonBuilder()
            .setLabel("Start Quiz")
            .setCustomId("start_quiz")
            .setStyle(ButtonStyle.Primary);

        const waitButton = new ButtonBuilder()
            .setLabel("Wait")
            .setCustomId("wait_quiz")
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(startButton, waitButton);

        await message.reply({ embeds: [embed], components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const userId = interaction.user.id;

        // Check if the interaction is for the RPS game
    if (interaction.customId.startsWith("rps_")) {

      const choices = ["rock", "paper", "scissors"];
      const emojis = { rock: "🪨", paper: "📄", scissors: "✂️" };
      const botChoice = choices[Math.floor(Math.random() * choices.length)];
      const userChoice = interaction.customId.split("_")[1];

      let result;
      if (userChoice === botChoice) {
          result = "It's a tie!";
      } else if (
          (userChoice === "rock" && botChoice === "scissors") ||
          (userChoice === "paper" && botChoice === "rock") ||
          (userChoice === "scissors" && botChoice === "paper")
      ) {
          result = "You win! 🎉";
      } else {
          result = "You lose! 😢";
      }


      await interaction.update({
          content: `<@${userId}> chose ${emojis[userChoice]} and I chose ${emojis[botChoice]}. ${result}`,
          embeds: [], // Clears the embed
          components: []
      });
    }

    // Handle quiz start confirmation
    if (interaction.customId === "start_quiz") {
        if (activeQuizzes[userId]) {
            return interaction.reply({ content: "You already have an active quiz!", ephemeral: true });
        }

        activeQuizzes[userId] = {
            startTime: new Date(),
            answers: [],
            currentQuestionIndex: 0,
            timeout: setTimeout(() => handleQuizTimeout(userId), QUIZ_TIMEOUT * 1000)
        };

        logQuizStart(interaction.user);
        await interaction.update({ content: "Starting your quiz...", components: [] });
        return sendNextQuestion(interaction.user);
    } else if (interaction.customId === "wait_quiz") {
        await interaction.update({ content: "You can start the quiz anytime by sending !quiz again.", components: [] });
    }

    // Existing button interaction handling for quiz questions
    if (activeQuizzes[userId] && quizData.questions[activeQuizzes[userId].currentQuestionIndex].options.includes(interaction.customId)) {
        clearTimeout(activeQuizzes[userId].timeout);

        const quiz = activeQuizzes[userId];
        const answer = interaction.customId;

        const currentQuestion = quizData.questions[quiz.currentQuestionIndex];
        quiz.answers.push({
            question: currentQuestion.question,
            selected: answer
        });

        const updatedRow = new ActionRowBuilder().addComponents(
            currentQuestion.options.map(option =>
                new ButtonBuilder()
                    .setCustomId(option)
                    .setLabel(option)
                    .setStyle(option === answer ? ButtonStyle.Success : ButtonStyle.Secondary)
                    .setDisabled(true)
            )
        );

        const updatedEmbed = {
            title: `Question ${quiz.currentQuestionIndex + 1}`,
            description: currentQuestion.question,
            color: 0x0099ff
        };

        // If the current question had an image, remove it from the embed
        if (currentQuestion.attachment) {
            updatedEmbed.image = null;
        }

        await interaction.update({
            content: `You answered: ${answer}`,
            embeds: [updatedEmbed], // Update the embed without the image
            components: [updatedRow]
        });
        quiz.currentQuestionIndex++;

        if (quiz.currentQuestionIndex >= quizData.questions.length) {
            logQuizEnd(interaction.user, quiz);
            delete activeQuizzes[userId];
            return interaction.followUp({ content: "Thank you for completing the quiz!", ephemeral: true });
        }

        quiz.timeout = setTimeout(() => handleQuizTimeout(userId), QUIZ_TIMEOUT * 1000);
        sendNextQuestion(interaction.user);
    }
});

function sendNextQuestion(user) {
    const quiz = activeQuizzes[user.id];
    const currentQuestion = quizData.questions[quiz.currentQuestionIndex];

    const buttons = currentQuestion.options.map(option => 
        new ButtonBuilder()
            .setCustomId(option)
            .setLabel(option)
            .setStyle(ButtonStyle.Primary)
    );

    const row = new ActionRowBuilder().addComponents(buttons);

    // Create the embed
    const embed = {
        title: `Question ${quiz.currentQuestionIndex + 1}`,
        description: currentQuestion.question,
        color: 0x0099ff, // You can change the color as needed
    };

    if (currentQuestion.attachment) {
        embed.image = { url: currentQuestion.attachment }; // Add image URL to embed
    }

    user.send({
        embeds: [embed],
        components: [row]
    });
}

async function logQuizStart(user) {
    const channel = client.channels.cache.get(CHANNEL_ID);
    const guild = channel.guild;
    const member = await guild.members.fetch(user.id);
    const startTime = new Date().toLocaleString("en-US", { timeZone: "CET" });

    if (channel) {
        channel.send(`<@${user.id}> (${member.displayName}) - start - ${startTime} - ${quizData.name}`);
    }
}

async function logQuizEnd(user, quiz) {
    const channel = client.channels.cache.get(CHANNEL_ID);
    const guild = channel.guild;
    const member = await guild.members.fetch(user.id);
    const endTime = new Date().toLocaleString("en-US", { timeZone: "CET" });

    let score = 0;
    const results = quiz.answers.map((answer, index) => {
        if (answer.selected === quizData.questions[index].correct) {
            score++;
        }
        return `Q${index + 1}: ${answer.selected}`;
    }).join(', ');

    const duration = await handleQuizEndTime(user.id);

    if (channel) {
        channel.send(`<@${user.id}> (${member.displayName}) - end - ${endTime} - ${results} - Score: ${score}/${quizData.questions.length} - Duration: ${duration} seconds - ${quizData.name}`);
    }
}

async function handleQuizEndTime(userId) {
    const channel = client.channels.cache.get(CHANNEL_ID);
    const user = await client.users.fetch(userId);
    let duration = 0;
    let startTime;

    try {
        const messages = await channel.messages.fetch({ limit: 100 });
        
        // Find the start message for the user and quiz
        const startMessage = messages.reverse().find(msg =>
            msg.content.includes(userId) &&
            msg.content.includes(`- start -`) &&
            msg.content.includes(quizData.name)
        );

        console.log(startMessage);

        if (startMessage) {
            startTime = new Date(startMessage.createdTimestamp);
        } else if (activeQuizzes[userId]) {
            // Fallback to active quiz start time
            startTime = activeQuizzes[userId].startTime;
        } else {
            // Default to current time if all else fails
            startTime = new Date();
        }

        // Calculate duration
        duration = Math.round((Date.now() - startTime.getTime()) / 1000);
        return duration;
    } catch (error) {
      console.error("Error calculating timeout duration:", error);
    } return 999;
}

async function handleQuizTimeout(userId) {
    const channel = client.channels.cache.get(CHANNEL_ID);
    const user = await client.users.fetch(userId);
    
    let duration = 0;
    let startTime;

    try {
        const messages = await channel.messages.fetch({ limit: 100 });
        
        // Find the start message for the user and quiz
        const startMessage = messages.find(msg =>
            msg.content.includes(`<@${userId}>`) &&
            msg.content.includes(`- start -`) &&
            msg.content.includes(quizData.name)
        );

        if (startMessage) {
            startTime = new Date(startMessage.createdTimestamp);
        } else if (activeQuizzes[userId]) {
            // Fallback to active quiz start time
            startTime = activeQuizzes[userId].startTime;
        } else {
            // Default to current time if all else fails
            startTime = new Date();
        }

        // Calculate duration
        duration = Math.round((Date.now() - startTime.getTime()) / 1000);

        // Log timeout message in the channel
        if (channel) {
            channel.send(`<@${userId}> - timeout after ${duration} seconds. Quiz "${quizData.name}" was not completed.`);
        }

        if (!activeQuizzes[userId]) return;

        const quiz = activeQuizzes[userId];
        const currentQuestion = quizData.questions[quiz.currentQuestionIndex];

        // Create a disabled button row
        const disabledRow = new ActionRowBuilder().addComponents(
            currentQuestion.options.map(option =>
                new ButtonBuilder()
                    .setCustomId(option)
                    .setLabel(option)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            )
        );

        // Update the embed to indicate timeout and remove the image if any
        const updatedEmbed = {
            title: `Question ${quiz.currentQuestionIndex + 1}`,
            description: `${currentQuestion.question}\n\nTime's up! You did not answer in time. Reinitialize the quiz by writing !quiz.`,
            color: 0xff0000 // Red to indicate timeout
        };

        if (currentQuestion.attachment) {
            updatedEmbed.image = null;
        }

        try {
            // Fetch the user and send the timeout message
            const user = await client.users.fetch(userId);
            await user.send({
                content: "Time's up!",
                embeds: [updatedEmbed],
                components: [disabledRow]
        });
    } catch (error) {
        console.error(`Failed to notify user ${userId} of timeout:`, error);
    }

    } catch (error) {
        console.error(`Random error...:`, error);
    }

    // Clean up active quiz
    delete activeQuizzes[userId];
  }






async function getUsersWithChannelAccess(channelId, guildId) {
  try {
    const guild = await client.guilds.fetch(guildId);
    const channel = await guild.channels.fetch(channelId);

    if (!channel) {
      throw new Error("Channel not found");
    }

    // Fetch all members to ensure they're cached
    await guild.members.fetch();

    const membersWithAccess = [];

    guild.members.cache.forEach((member) => {
      if (channel.permissionsFor(member).has('ViewChannel')) {
        membersWithAccess.push(member); // Push full member objects
      }
    });

    return membersWithAccess;
  } catch (error) {
    console.error("Error fetching users with access:", error);
    return [];
  }
}














let gameState = {};

// Function to draw a card
function drawCard() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const value = values[Math.floor(Math.random() * values.length)];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    return { value, suit };
}

// Function to calculate hand value
function calculateHandValue(hand) {
    let value = 0;
    let aces = 0;

    for (const card of hand) {
        if (['J', 'Q', 'K'].includes(card.value)) {
            value += 10;
        } else if (card.value === 'A') {
            value += 11;
            aces += 1;
        } else {
            value += parseInt(card.value, 10);
        }
    }

    // Adjust for aces
    while (value > 21 && aces > 0) {
        value -= 10;
        aces -= 1;
    }

    return value;
}

// Function to display a hand
function displayHand(hand) {
    return hand.map(card => `${card.value}${card.suit}`).join(', ');
}

// Start the Blackjack game
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'blackjack') {
        if (gameState[message.author.id]) {
    return message.reply(
        `You are already in a game! Finish it before starting a new one. Type \`!hit\` to draw another card or \`!stay\` to finish your turn.`
    );
    }
    
    const playerHand = [drawCard(), drawCard()];
    const dealerHand = [drawCard(), drawCard()];
    
    const timeout = setTimeout(() => {
        delete gameState[message.author.id];
        message.channel.send(
            `<@${message.author.id}>, your game has been canceled due to inactivity. Start a new game with \`!blackjack\`.`
        );
    }, 120000); // 2 minutes
    
    gameState[message.author.id] = {
        playerHand,
        dealerHand,
        inProgress: true,
        timeout,
    };

        const playerHandValue = calculateHandValue(playerHand);
        message.reply(
            `Your hand: ${displayHand(playerHand)} (Value: ${playerHandValue})
Dealer's visible card: ${dealerHand[0].value}${dealerHand[0].suit}
Type \`!hit\` to draw another card or \`!stay\` to end your turn.`
        );
    }

    if (command === 'hit') {
        const game = gameState[message.author.id];
        if (!game || !game.inProgress) {
            return message.reply('You are not in a game! Start a new one with `!blackjack`.');
        }

        const newCard = drawCard();
        game.playerHand.push(newCard);
        const playerHandValue = calculateHandValue(game.playerHand);

        if (playerHandValue > 21) {
            delete gameState[message.author.id];
            return message.reply(
                `You drew ${newCard.value}${newCard.suit}.
Your hand: ${displayHand(game.playerHand)} (Value: ${playerHandValue})
**BUSTED!** You lose.`
            );
        }

        message.reply(
            `You drew ${newCard.value}${newCard.suit}.
Your hand: ${displayHand(game.playerHand)} (Value: ${playerHandValue})
Type \`!hit\` to draw another card or \`!stay\` to end your turn.`
        );
    }

    if (command === 'stay') {
        const game = gameState[message.author.id];
        if (!game || !game.inProgress) {
            return message.reply('You are not in a game! Start a new one with `!blackjack`.');
        }

        const playerHandValue = calculateHandValue(game.playerHand);
        let dealerHandValue = calculateHandValue(game.dealerHand);

        // Dealer's turn: hit until value >= 17
        while (dealerHandValue < 17) {
            game.dealerHand.push(drawCard());
            dealerHandValue = calculateHandValue(game.dealerHand);
        }

        const dealerHandDisplay = displayHand(game.dealerHand);
        delete gameState[message.author.id];

        if (dealerHandValue > 21 || playerHandValue > dealerHandValue) {
          if (game.timeout) {
            clearTimeout(game.timeout);
        }
            return message.reply(
                `Your hand: ${displayHand(game.playerHand)} (Value: ${playerHandValue})
Dealer's hand: ${dealerHandDisplay} (Value: ${dealerHandValue})
**You win!** 🎉`
            );
        } else if (playerHandValue === dealerHandValue) {
            return message.reply(
                `Your hand: ${displayHand(game.playerHand)} (Value: ${playerHandValue})
Dealer's hand: ${dealerHandDisplay} (Value: ${dealerHandValue})
**It's a tie!**`
            );
        } else {
            return message.reply(
                `Your hand: ${displayHand(game.playerHand)} (Value: ${playerHandValue})
Dealer's hand: ${dealerHandDisplay} (Value: ${dealerHandValue})
**You lose!** 😢`
            );
        }
    }



    // If the command is "message"
    if (command === 'message') {
        // Ensure proper arguments are provided
        if (args.length < 2) {
            return message.reply('Usage: !message <channelId> <message>');
        }

        // Check if the message author is the server owner
        const guild = message.guild;
        if (!guild || message.author.id !== guild.ownerId) {
            return message.reply('You do not have permission to use this command. Only the server owner can use it.');
        }

        const channelId = args.shift(); // Extract the channel ID
        const channelMessage = args.join(' '); // Combine the rest into the message

        try {
            // Fetch the channel by ID
            const channel = await client.channels.fetch(channelId);

            // Ensure the channel is a text-based channel
            if (!channel || !channel.isTextBased()) {
                return message.reply('Invalid channel ID or channel is not a text-based channel.');
            }

            // Send the message to the channel
            await channel.send(channelMessage);
            message.reply(`Message sent to channel: ${channelId}`);
        } catch (error) {
            console.error(error);
            message.reply('An error occurred. Ensure the bot has access to the channel and the ID is correct.');
        }
    }
});




client.login(process.env.BOT_TOKEN);
