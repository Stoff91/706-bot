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

client.on('ready', () => {
  console.log(`Bot is ready as ${client.user.tag}`);
});

client.on('guildMemberAdd', async member => {
  try {
    const dmChannel = await member.createDM();
    await dmChannel.send(
      "Welcome to Server #706! Please follow the instructions to set your nickname and enjoy your stay. " +
      "(This is currently in dev, if this message is here - disregard the instructions. Real men test in prod.)"
    );

    const guild = member.guild;

    // Step 1: Ask for the server role
    const serverRoles = getRolesWithPrefix(guild, "Srv: ");
    const serverButtons = serverRoles.map(role => new ButtonBuilder()
      .setLabel(role.name.substring(5))
      .setCustomId(`server_${role.name}`)
      .setStyle(ButtonStyle.Primary));

    const otherServerButton = new ButtonBuilder()
      .setLabel("Other")
      .setCustomId("server_other")
      .setStyle(ButtonStyle.Danger);

    const serverRow = new ActionRowBuilder().addComponents([...serverButtons, otherServerButton]);
    await dmChannel.send({ content: "What SERVER are you on?", components: [serverRow] });

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
    await serverInteraction.deferUpdate();

    // Step 2: Ask for the alliance role
    const allianceRoles = getRolesWithPrefix(guild, "Tag: ");
    const allianceButtons = allianceRoles.map(role => new ButtonBuilder()
      .setLabel(role.name.substring(5))
      .setCustomId(`alliance_${role.name}`)
      .setStyle(ButtonStyle.Primary));

    const otherAllianceButton = new ButtonBuilder()
      .setLabel("Other")
      .setCustomId("alliance_other")
      .setStyle(ButtonStyle.Danger);

    const allianceRow = new ActionRowBuilder().addComponents([...allianceButtons, otherAllianceButton]);
    await dmChannel.send({ content: "What ALLIANCE are you in?", components: [allianceRow] });

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
    await allianceInteraction.deferUpdate();

    // Step 3: Ask for nickname
    await dmChannel.send("Please enter your in-game nickname:");
    const nicknameMessage = await dmChannel.awaitMessages({
      filter: msg => msg.author.id === member.id,
      max: 1,
      time: 60000
    });
    const ingameName = nicknameMessage.first().content;

    // Confirmation
    await dmChannel.send(
      `Thank you for following the prompt.\nNow, Confirming details:\n\nServer: ${server}\nAlliance: ${alliance}\nNickname: ${ingameName}\n\nIs this correct? (Yes/No)`
    );

    const confirmationMessage = await dmChannel.awaitMessages({
      filter: msg => msg.author.id === member.id,
      max: 1,
      time: 60000
    });

    if (confirmationMessage.first().content.toLowerCase() === "yes") {
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
      const serverRole = guild.roles.cache.find(role => role.name === `Srv: ${server}`);
      const allianceRole = guild.roles.cache.find(role => role.name === `Tag: ${alliance}`);
      if (serverRole) await member.roles.add(serverRole);
      if (allianceRole) await member.roles.add(allianceRole);

      // Update nickname
      await member.setNickname(`[${alliance}] ${ingameName}`);
      await dmChannel.send("Roles and nickname updated successfully!");
    } else {
      await dmChannel.send("Process aborted. Please restart if needed.");
    }
  } catch (error) {
    console.error(`Error: ${error}`);
  }
});

client.login(process.env.BOT_TOKEN);
