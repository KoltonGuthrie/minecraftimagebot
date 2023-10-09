const CronJob = require('cron').CronJob;
const axios = require('axios');
const fs = require('fs');
const config = require('../config.json')
const { getStatus, getDonors } = require('./database');

let client;

const job = new CronJob('0 */10 * * * *', function() {
  
    update();
 
 }, null, true, 'America/Los_Angeles');
 
 function start(c) {
     client = c;
     job.start();
 }

 async function update() {
    try {

        guildAmount = await client.shard.fetchClientValues('guilds.cache.size').then(results => results.reduce((acc, guildCount) => acc + guildCount, 0))

        userAmount = await client.shard.broadcastEval((client) =>client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0));
        userAmount = userAmount.reduce((acc, userAmount) => acc + userAmount, 0);

        const json = {users: []};
        const donors = await getDonors();
        for(const donor of donors) {
            try {
                const user = await client.users.fetch(donor.id);
                json.users.push({username: (user.globalName || user.username), id: donor.id, avatar: user.avatar, time: donor.time});
            } catch(err) {
                console.error(err);
            }
        }
        //console.log("Updating stats!");
        
        await axios.post("https://minecraftimagebot.glitch.me/saveInfo", {
            auth: config.websiteAuth,
            guilds: guildAmount,
            donors: json,
            imagesMade: Number((await getStatus()).imagesMade),
            users: userAmount,
        });

    } catch(err) {
        console.error(err);
    }


 }

 module.exports = {
    start: start,
}