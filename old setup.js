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
  try {
    const dmChannel = await member.createDM();
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
      time: 60000
    });

    let server;
    if (serverInteraction.customId === "server_other") {
      await dmChannel.send("Please enter the server name:");
      const serverMessage = await dmChannel.awaitMessages({
        filter: msg => msg.author.id === member.id,
        max: 1,
        time: 60000
      });
      server = serverMessage.first().content;
      const auditChannel = guild.channels.cache.find(channel => channel.name === "Audit");
      if (auditChannel) {
        await auditChannel.send(`User ${member} selected other server: ${server}`);
      }
    } else {
      server = serverInteraction.customId.substring(7);
    }
    await serverInteraction.update({ components: [] });

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
      time: 60000
    });

    let alliance;
    if (allianceInteraction.customId === "alliance_other") {
      await dmChannel.send("Please enter the alliance name:");
      const allianceMessage = await dmChannel.awaitMessages({
        filter: msg => msg.author.id === member.id,
        max: 1,
        time: 60000
      });
      alliance = allianceMessage.first().content;
      const auditChannel = guild.channels.cache.find(channel => channel.name === "Audit");
      if (auditChannel) {
        await auditChannel.send(`User ${member} selected other alliance: ${alliance}`);
      }
    } else {
      alliance = allianceInteraction.customId.substring(9);
    }
    await allianceInteraction.update({ components: [] });

    // Step 3: Ask for nickname
    await dmChannel.send("Please enter your in-game nickname:");
    const nicknameMessage = await dmChannel.awaitMessages({
      filter: msg => msg.author.id === member.id,
      max: 1,
      time: 60000
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
      time: 60000
    });

    if (confirmationInteraction.customId === "confirm_yes") {
      // Check for duplicate
      const duplicateRole = guild.roles.cache.find(role => role.name === "Duplicate");
      const hasSrvOrTagRoles = member.roles.cache.some(role => role.name.startsWith("Srv: ") || role.name.startsWith("Tag: "));
      if (hasSrvOrTagRoles) {
        if (duplicateRole) {
          await member.roles.add(duplicateRole);
        }
        const auditChannel = guild.channels.cache.find(channel => channel.name === "Audit");
        if (auditChannel) {
          await auditChannel.send(`Duplicate detected for user ${member}`);
        }
        return;
      }

      // Assign roles
      const serverRole = guild.roles.cache.find(role => role.name.toLowerCase() === `srv: ${server.toLowerCase()}`);
      const allianceRole = guild.roles.cache.find(role => role.name.toLowerCase() === `tag: ${alliance.toLowerCase()}`);
      if (serverRole) await member.roles.add(serverRole);
      if (allianceRole) {
        await member.roles.add(allianceRole);
        const formattedAlliance = allianceRole.name.substring(5); // Remove 'Tag: '
        const newNickname = `[${formattedAlliance}] ${ingameName}`;
        const existingMember = guild.members.cache.find(m => m.nickname === newNickname);
        if (!existingMember) {
          await member.setNickname(newNickname);
        }
      }

      await confirmationInteraction.update({ content: "Roles and nickname updated successfully!", components: [] });
    } else {
      await confirmationInteraction.update({ content: "Process aborted. Please restart if needed.", components: [] });
    }
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

client.on('guildMemberAdd', async member => {
  initiateOnboarding(member, member.guild);
});

client.on('messageCreate', async message => {
  if (message.channel.type === 'DM' && message.content === '!onboard') {
    const guild = client.guilds.cache.get('1310170318735802398');
    if (!guild) {
      await message.reply("Unable to find the server for onboarding.");
      return;
    }
    const member = guild.members.cache.get(message.author.id);
    if (!member) {
      await message.reply("You are not a member of the server.");
      return;
    }
    initiateOnboarding(member, guild);
  }
});

client.login(process.env.BOT_TOKEN);
