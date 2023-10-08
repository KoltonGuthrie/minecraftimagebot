const readline = require('readline');
const fs = require('fs');
const {Client, GatewayIntentBits} = require('discord.js');
const config = require(`${__dirname}/../config.json`);
const axios = require('axios');

// DISCORD CLIENT
let client = null;
let delete_images = null;

const prompt = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("This has not been updated to use the Sqlite database!");
return;

prompt.question('\x1b[33m Would you like to delete the images from Discord & 3rd-party servers? (y/n)\x1b[0m\n', (response) => { 
    const res = response.toLowerCase();

    if (res != "y" && res != "yes" && res != "n" && res != "no") {
        console.log('\x1b[33m Unknown response: \x1b[0m' + res);
        process.exit();
    } else if(res == "n" || res == "no") {
        delete_images = false;
    } else {
        delete_images = true;
    }

    console.log(`\x1b[33m Remove from Discord & 3rd-party servers: ${delete_images === true ? "\x1b[31mYES\x1b[0m" : "\x1b[32mNO\x1b[0m" }\x1b[0m`)

    prompt.question('\x1b[31m You are aboout to remove ALL data from the database.\x1b[0m\n\x1b[31m Are you sure you want to continue? (y/n)\x1b[0m\n', async (response) => { 

            const res = response.toLowerCase();

            if(res == "n" || res == "no") {
                console.log('\x1b[32m Canceled\x1b[0m')
                process.exit();
            } else if (res != "y" && res != "yes") {
                console.log('\x1b[33m Unknown response: \x1b[0m' + res);
                process.exit();
            }
            
            console.log('\x1b[33m Logging into Discord bot...\x1b[0m');

            client = new Client({
                intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] ,
            });

            await client.login(config.token);

            console.log(`\x1b[33m Logged into Discord bot ${client.user.username}\x1b[0m`);

            console.log('\x1b[33m Removing data...\x1b[0m');

            const json = JSON.parse(fs.readFileSync(`${__dirname}/../src/imgData.json`));
            const size = Object.keys(json).length;

            for(const key in json) {
                //console.log(key, delete_images);
                await Delete(key, delete_images);
            }

            console.log(`\x1b[32m${size} images have been removed\x1b[0m`);
            process.exit();

    });

    return;
});

async function Delete(id, deleteFromDiscordAnd3rdPartyServers = true) {
    try {

        //const id = interaction.message.content.toLowerCase().replace(/\-| /g, "");

        const json = JSON.parse(fs.readFileSync(`${__dirname}/../src/imgData.json`));

        if(!json[id]) return console.log(`\x1b[31m Unable to find image with ID: [33m${id}\x1b[0m`);

        const el = json[id];

        if (!el?.author || !el?.interaction || !el?.discordImgID) return console.log(`\x1b[31m Image with ID: \x1b[33m${id}\x1b[31m is missing needed data\x1b[0m`)

        if (el.link == "uploading") return console.log(`\x1b[31m Image ID: [33m${id}\x1b[31m is still uploading.\x1b[0m`)

            //////////////////////////////////////////////
            // Remove from Minecraft image bot Server Start  
            //////////////////////////////////////////////

        const channel = await client.channels.fetch(config.cacheChannel);
        
        if(channel == undefined) return console.log(`\x1b[31m Unable to find Discord Channel to delete images\x1b[0m`)

        if(deleteFromDiscordAnd3rdPartyServers) {

                try {
                    const message = await channel.messages
                    .fetch(el.discordImgID)
                    .catch((e) =>
                        console.log(`[-][REMOVE ERROR] ${e.toString()}[-]`));
                    if (message) {
                        message
                        .delete();
                    }
                } catch (e) {
                    console.log(`[-][REMOVE ERROR] ${e.toString()}`);
                  }

      
            //////////////////////////////////////////////
            // Remove from Minecraft image bot Server End 
            //////////////////////////////////////////////

            //////////////////////////////////////////////
            // Remove from Minecraft image bot Website Start 
            //////////////////////////////////////////////

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

            }

            // Delete from JSON
            delete json[id];

            // Write to json file
            fs.writeFileSync(`${__dirname}/imgData.json`,JSON.stringify(json));

            // Reply
            console.log(`\x1b[32m Removed image ID: \x1b[33m${id}\x1b[0m`)
        } catch(e) {
            throw e;
        }
}