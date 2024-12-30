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
  partials: [Partials.Channel]
});

let unsetServer; // Declare variables outside
let unsetAlliance;
const CHANNEL_ID = '1323289983246925885'; // Replace with your channel ID
const QUIZ_TIMEOUT = 60; // Timeout in seconds (1 hour)

const quizData = {
    name: "Test Quiz",
    questions: [
        {
            question: "What is the capital of France?",
            options: ["Berlin", "Paris", "Madrid"],
            correct: "Paris"
        },
        {
            question: "What is 2 + 2?",
            options: ["3", "4", "5"],
            correct: "4"
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
    dmChannel = await member.createDM().catch(() => {
      throw new Error("Unable to create a DM channel with the user.");
    });

    await dmChannel.send(
      "Welcome to Server #706! Please follow the instructions to set your nickname and enjoy your stay. " +
      "(This is currently in dev, if this message is here - disregard the instructions. Real men test in prod.)"
    );

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


  if (!message.guild && message.content === '!delete-all') {
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
    if (message.author.bot) return;

    // Initiate quiz in DMs
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

        activeQuizzes[userId] = {
            startTime: new Date(),
            answers: [],
            currentQuestionIndex: 0,
            timeout: setTimeout(() => handleQuizTimeout(userId), QUIZ_TIMEOUT * 1000)
        };

        logQuizStart(message.author);
        return sendNextQuestion(message.author);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const userId = interaction.user.id;
    if (!activeQuizzes[userId]) {
        return interaction.reply({ content: "You don't have an active quiz.", ephemeral: true });
    }

    clearTimeout(activeQuizzes[userId].timeout);

    const quiz = activeQuizzes[userId];
    const answer = interaction.customId;

    // Record the answer
    const currentQuestion = quizData.questions[quiz.currentQuestionIndex];
    quiz.answers.push({
        question: currentQuestion.question,
        selected: answer
    });

    // Disable buttons in the current message
    const updatedRow = new ActionRowBuilder().addComponents(
        currentQuestion.options.map(option =>
            new ButtonBuilder()
                .setCustomId(option)
                .setLabel(option)
                .setStyle(option === answer ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setDisabled(true)
        )
    );

    await interaction.update({ components: [updatedRow] });

    quiz.currentQuestionIndex++;

    // Check if quiz is complete
    if (quiz.currentQuestionIndex >= quizData.questions.length) {
        logQuizEnd(interaction.user, quiz);
        delete activeQuizzes[userId];
        return interaction.followUp({ content: "Thank you for completing the quiz!", ephemeral: true });
    }

    quiz.timeout = setTimeout(() => handleQuizTimeout(userId), QUIZ_TIMEOUT * 1000);
    sendNextQuestion(interaction.user);
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

    user.send({
        content: `Question ${quiz.currentQuestionIndex + 1}: ${currentQuestion.question}`,
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
    } catch (error) {
        console.error("Error calculating timeout duration:", error);
        duration = 999; // Default to timeout duration in case of error
    }

    // Remove active quiz and notify user
    delete activeQuizzes[userId];
    user.send("Your quiz session has timed out. Please reinitialize the quiz by writing !quiz.");
}




















client.login(process.env.BOT_TOKEN);
