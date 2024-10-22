const Discord = require('discord.js');
const { prefix, token} = require('./config.json');
const client = new Discord.Client();
const axios = require('axios');
var schedule = require('node-schedule');

client.once('ready', () => {
    console.log('Ready!');
    client.channels.get('699388090405355620').send(":wave: " + " The Stoff-bot 3001 is out for a spin! Enter these following commands to get the appropriate role: \n\n !bot t2 \n !bot t3 \n !bot t4 \n !fun - (For funchannel access) \n !nofun - (You get it.)\n !nsfw - (For nsfw access) \n !nonsfw - (You get it.)  \n \n This bot is under development by Stoff. Hollar if something is wrong.(this is a trial run and will be ended when we say so)");

})


client.login(process.env.BOT_TOKEN);


