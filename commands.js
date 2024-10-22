const Discord = require('discord.js');
const { prefix, token, token2} = require('./config.json');
const client = new Discord.Client();
const axios = require('axios');


client.once('ready', () => {
    console.log('Ready for trial run!');
   })

client.on('message', message => {
    if(message.guild !== null) {
            console.log(message.author.id+ message.author.username+ ': ' + message.content + ' - ' + message.channel);
    }
})



client.on('message', message => {
    if(message.guild !== null) {
        if (message.content.toLowerCase().startsWith("!dm")) {
            if(message.member.roles.find(r => r.name === "Admin" || r.name === "Rallymaster")){

            }
        }
    }
})



client.login("SHIT");

