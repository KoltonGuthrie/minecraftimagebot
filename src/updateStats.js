const CronJob = require('cron').CronJob;
const axios = require('axios');
const fs = require('fs');

let client;

const job = new CronJob('0 */10 * * * *', function() {
  
    update();
 
 }, null, true, 'America/Los_Angeles');
 
 function start(c) {
     client = c;
     job.start();
 }

 async function update() {

    guildAmount = await client.shard.fetchClientValues('guilds.cache.size').then(results => results.reduce((acc, guildCount) => acc + guildCount, 0))

    userAmount = await client.shard.broadcastEval((client) =>client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0));
    userAmount = userAmount.reduce((acc, userAmount) => acc + userAmount, 0);

    //console.log("Updating stats!");
    try {
        await axios.post("https://minecraftimagebot.glitch.me/saveInfo", {
            auth: "Q4JsH0mQrWfkTmHJ4pfR",
            guilds: guildAmount,
            donors: "undefined",
            imagesMade: Number(fs.readFileSync(`${process.mainModule.path}/imagesMade.txt`)),
            users: userAmount,
        });
    } catch(err) {
        console.error(err);
    }


 }

 module.exports = {
    start: start,
}