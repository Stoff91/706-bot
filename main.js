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

client.once("ready", () => {
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

        try {
          const rolesToRemove = message.guild.roles.cache.filter(
            (role) => role.name.startsWith('Tag: ') || role.name.startsWith('Srv: ')
          );

          // Delete each matching role
          let deletedCount = 0;
          for (const [roleId, role] of rolesToRemove) {
            try {
              await role.delete('Removing roles with Tag: or Srv: prefix');
              deletedCount++;
            } catch (error) {
              console.error(`Failed to delete role "${role.name}":`, error);
            }
          }
          } catch (error) {
              console.error(`FAILED and stuff.`);
            }

        server = server.replace("Srv: ", "");
        alliance = alliance.replace("Tag: ", "");

        const serverRole = guild.roles.cache.find(role => role.name === `Srv: ${server}`);
        const allianceRole = guild.roles.cache.find(role => role.name === `Tag: ${alliance}`);

        if (!serverRole) {
          console.error(`Server role not found: Srv: ${server}`);
          await dmChannel.send(`Server role not found: ${server}`);
        } else {
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
    `[DM Test] channelType=${message.channel.type}, content="${message.content}"`
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
});

client.login(process.env.BOT_TOKEN);
