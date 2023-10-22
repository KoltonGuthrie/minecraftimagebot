const CronJob = require('cron').CronJob;
const fs = require('fs');
const axios = require('axios');

const config = require('../config.json');
const { getAllImages, removeImage } = require('./database');

let client;

// 0 */10 * * * * 10 mins

const job = new CronJob('0 */10 * * * *', function() {
  
   remove();

}, null, true, 'America/Los_Angeles');

function start(c) {
    client = c;
    job.start();
}

async function remove() {

    //let json = JSON.parse(fs.readFileSync(`${__dirname}/imgData.json`));
    const data = await getAllImages();
    
    //let keys = Object.keys(json);
    
    for (let i = 0; data.length > i; i++) {
        const el = data[i];
        //604800000
        if (!el.time || new Date().getTime() - el.time > 604800000) {
          //console.log("removing: " + el.id);
  
            //////////////////////////////////////////////
            // Remove from Minecraft image bot Server Start  
            //////////////////////////////////////////////

            async function df4(client, { el, config }) {
                // Get Minecraft Image Bot channel
                const channel = await client.channels.cache.get(config.cacheChannel);
                if (channel) {
                    try {
                        const message = await channel.messages.fetch(el.discordImgID).catch((e) => console.log(`[-][REMOVE ERROR] ${e.toString()}[-]`));

                        if (message) {
                            message.delete();
                        }
                    } catch (e) {
                        console.log(`[-][REMOVE ERROR] ${e.toString()}`);
                      }
                    }
                  }
          
                  await client.shard.broadcastEval(df4, {
                    context: { el: el, config: config },
                  });
    
                //////////////////////////////////////////////
                // Remove from Minecraft image bot Server End 
                //////////////////////////////////////////////
    
                //////////////////////////////////////////////
                // Remove from Minecraft image bot Website Start 
                //////////////////////////////////////////////
                  
                /*
                try {
                    await axios.post(
                      "https://minecraftimagebot.glitch.me/deleteimage",
                      JSON.stringify({ id: el.interaction }),
                      {
                        headers: {
                          auth: config.websiteAuth,
                          "Content-Type": "application/json",
                        },
                      }
                    );
                } catch (e) {
                    console.log(e);
                }
                */
    
                //////////////////////////////////////////////
                // Remove from Minecraft image bot Website End 
                //////////////////////////////////////////////
    
                //////////////////////////////////////////////
                // Remove from GoFile Servers Start 
                //////////////////////////////////////////////
                
                try {
                    if (el.link?.includes("https://gofile.io/d")) {
                    axios({
                        method: "delete",
                        url: `https://api.gofile.io/deleteContent`,
                        data: { contentsId: el?.folderId, token: config.GOFILETOKEN },
                    }).then(function (res) {
                        //console.log(res);
                    });
                    }
                } catch (e) {
                    console.log(e);
                }
    
                //////////////////////////////////////////////
                // Remove from GoFile Servers End 
                //////////////////////////////////////////////

                // Delete from JSON
                await removeImage({id: el.id})
                //delete json[keys[i]];
    
                // Write to json file
                //fs.writeFileSync(`${__dirname}/imgData.json`,JSON.stringify(json));

        }
    }
}


module.exports = {
  start: start,
}