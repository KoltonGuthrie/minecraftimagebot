const config = require('../config.json');
const { interactionReply, messageCreate } = require('./embed');
const fs = require('fs');
const axios = require('axios');

async function Ban(interaction, client) {
    try {

        const json = JSON.parse(fs.readFileSync(`${__dirname}/imgData.json`));

        const el = json[interaction.message.content.toLowerCase().replace(/\-/g, "")];
      
        let warnsAndBans = JSON.parse(fs.readFileSync(`${__dirname}/blockedIDs.json`));
        let blockedIDs = warnsAndBans["bans"];
        let warnedIDs = warnsAndBans["warns"];

        const user = await client.users.fetch(el.author);

        if (blockedIDs.includes(el.author)) {
            return await interactionReply({interaction: interaction, description: `${user.tag} has already banned`, ephemeral: true});
        }

        await interactionReply({interaction: interaction, title: ":warning: -- BANNED -- :warning:", description: `You have been banned for breaking one of our rules. You can view our rules [here](https://minecraftimagebot.glitch.me/rules)\nIf you think that your ban was unfair you may contact us from our server: ${config.supportURL}`});

        blockedIDs.push(el.author);
        fs.writeFileSync(`${__dirname}/blockedIDs.json`,JSON.stringify(warnsAndBans));

        return await interactionReply({interaction: interaction, title: `🔨 ${user.tag} | ${user.id}`, description: `${user.tag} has been banned`, ephemeral: true})

    } catch(e) {
        throw e;
    }
}

async function Warn(interaction, client) {
    try {

        const json = JSON.parse(fs.readFileSync(`${__dirname}/imgData.json`));
        const el = json[interaction.message.content.toLowerCase().replace(/\-/g, "")];
      
        let warnsAndBans = JSON.parse(fs.readFileSync(`${__dirname}/blockedIDs.json`));
        let blockedIDs = warnsAndBans["bans"];
        let warnedIDs = warnsAndBans["warns"];
      
        const user = await client.users.fetch(el.author);

        if (warnedIDs.includes(el.author)) {
            return await interactionReply({interaction: interaction, description: `:x: ${user.tag} has already warned`, ephemeral: true});
        }

        const dm = await user.createDM();

        await messageCreate({channel: dm, title: ":warning: -- WARNING -- :warning:", description: `You have been warned for breaking one of our rules. You can view our rules [here](${config.rulesURL})\nAlthough it was determined that your violation was not severe enough for a ban, breaking one of these rules again may result in a ban.`});

        warnedIDs.push(el.author);
        fs.writeFileSync(`${__dirname}/blockedIDs.json`,JSON.stringify(warnsAndBans));

        return await interactionReply({interaction: interaction, title: `⚠️ ${user.tag} | ${user.id}`, description: `${user.tag} has been warned`, ephemeral: true})

    } catch(e) {
        throw e;
    }
}

async function Delete(interaction, client, admin = false) {
    try {

        const id = interaction.message.content.toLowerCase().replace(/\-| /g, "");

        const json = JSON.parse(fs.readFileSync(`${__dirname}/imgData.json`));

        const el = json[id];

        if(!json[id]) return await interactionReply({interaction: interaction, description: "Unable to find image...", ephemeral: true});

        if (!el?.author || !el?.interaction || !el?.discordImgID || !interaction?.user?.id) return await interactionReply({interaction: interaction, description: ":x: Failed to get image info. Please try again", ephemeral: true});

        if (el?.author !== interaction?.user?.id && !admin ) return await interactionReply({interaction: interaction, description: ":no_entry_sign: Only the original owner can request for image deletion", ephemeral: true});

        if (el.link == "uploading" || fs.readFileSync(`${__dirname}/../candelete.txt`).toString() == "false") return await interactionReply({interaction: interaction, description: "Image cannot be removed right now. Try again in a bit", ephemeral: true});

            //////////////////////////////////////////////
            // Remove from Minecraft image bot Server Start  
            //////////////////////////////////////////////

        if(admin) await interactionReply({interaction: interaction, description: `:wastebasket: Deleted image ${interaction.message.content}\nLink: ${el.link}`, ephemeral: true});

        async function df4(client, { el, config }) {
            // Get Minecraft Image Bot channel
            const channel = await client.channels.cache.get(config.cacheChannel);
            if (channel) {
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

            const link = el.link;

            // Delete from JSON
            delete json[id];

            // Write to json file
            fs.writeFileSync(`${__dirname}/imgData.json`,JSON.stringify(json));

            // Reply

            if(!admin) return await interactionReply({interaction: interaction, description: `:wastebasket: Deleted image ${interaction.message.content}\nLink: ${el.link}`, ephemeral: true});
            
        } catch(e) {
            throw e;
        }
}

async function Info(interaction, client) {
    try {

        const json = JSON.parse(fs.readFileSync(`${__dirname}/imgData.json`));
        
        const el = json[interaction.message.content.toLowerCase().replace(/\-/g, "")];

        if(!el) return await interactionReply({interaction: interaction, description: "Unable to find image...", ephemeral: true})
    
        const user = await client.users.fetch(el.author);

        const warnsAndBans = JSON.parse(fs.readFileSync(`${__dirname}/blockedIDs.json`));
        const blockedIDs = warnsAndBans["bans"];
        const warnedIDs = warnsAndBans["warns"];

        let message = `:white_check_mark: ${user?.tag} hasn't been banned or warned`;

        if (blockedIDs.includes(el.author)) {
            message = `:hammer: ${user?.tag} is banned`;
        } else if (warnedIDs.includes(el.author)) {
            message = `:warning: ${user?.tag} is warned`;
        }

        return await interactionReply({interaction: interaction, description: `${message}\nBot Message: ${el.interaction}\nLink: ${el.link}`, ephemeral: true})

    } catch(e) {
        throw e;
    }
}

module.exports = {
    ImageBan: Ban,
    ImageWarn: Warn,
    ImageDelete: Delete,
    ImageInfo: Info
}