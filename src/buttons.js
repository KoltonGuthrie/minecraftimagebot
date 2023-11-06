const config = require('../config.json');
const { interactionReply, messageCreate } = require('./embed');
const fs = require('fs');
const axios = require('axios');
const { getImage, getUser, updateUser, getStatus, removeImage } = require('./database');

async function Ban(interaction, client) {
    try {

        //const json = JSON.parse(fs.readFileSync(`${__dirname}/imgData.json`));

        //const el = json[interaction.message.content.toLowerCase().replace(/\-/g, "")];
        const id = interaction.message.content.toLowerCase().replace(/\-/g, "");
        const user_id = (await getImage({id: id})).author;
        const author = (await getUser({id: user_id}));
        let unableToSendDM = false;
      
        /*
        let warnsAndBans = JSON.parse(fs.readFileSync(`${__dirname}/blockedIDs.json`));
        let blockedIDs = warnsAndBans["bans"];
        let warnedIDs = warnsAndBans["warns"];
        */

        const user = await client.users.fetch(author.id);

        if (author.banned === "true") {
            return await interactionReply({interaction: interaction, description: `${user.tag} has already been banned`, ephemeral: true});
        }

        const dm = await user.createDM();

        try {

        await messageCreate({channel: dm, title: ":warning: -- BANNED -- :warning:", description: `You have been banned for breaking one of our rules. You can view our rules [here](https://minecraftimagebot.glitch.me/rules)\nIf you think that your ban was unfair you may contact us from our server: ${config.supportURL}`});
        
        } catch(err) {
            unableToSendDM = true;
            console.error(err);
        }

        await updateUser({id: user_id, key: 'banned', value: 'true'});
        //blockedIDs.push(el.author);
        //fs.writeFileSync(`${__dirname}/blockedIDs.json`,JSON.stringify(warnsAndBans));

        return await interactionReply({interaction: interaction, title: `🔨 ${user.tag} | ${user.id}`, description: `${user.tag} has been banned${unableToSendDM ? "\n**Unable to send DM to user**" : ""}`, ephemeral: true})

    } catch(e) {
        throw e;
    }
}

async function Warn(interaction, client) {
    try {

        /*
        const json = JSON.parse(fs.readFileSync(`${__dirname}/imgData.json`));
        const el = json[interaction.message.content.toLowerCase().replace(/\-/g, "")];
      
        let warnsAndBans = JSON.parse(fs.readFileSync(`${__dirname}/blockedIDs.json`));
        let blockedIDs = warnsAndBans["bans"];
        let warnedIDs = warnsAndBans["warns"];
        */
        const id = interaction.message.content.toLowerCase().replace(/\-/g, "");
        const user_id = (await getImage({id: id})).author;
        const author = (await getUser({id: user_id}));
        let unableToSendDM = false;
      
        const user = await client.users.fetch(author.id);

        if (author.warned === "true") {
            return await interactionReply({interaction: interaction, description: `:x: ${user.tag} has already been warned`, ephemeral: true});
        }

        const dm = await user.createDM();

        try {

            await messageCreate({channel: dm, title: ":warning: -- WARNING -- :warning:", description: `You have been warned for breaking one of our rules. You can view our rules [here](${config.rulesURL})\nAlthough it was determined that your violation was not severe enough for a ban, breaking one of these rules again may result in a ban.`});

        } catch(err) {
            unableToSendDM = true;
            console.error(err);
        }

        await updateUser({id: user_id, key: 'warned', value: 'true'});
        //warnedIDs.push(el.author);
        //fs.writeFileSync(`${__dirname}/blockedIDs.json`,JSON.stringify(warnsAndBans));

        return await interactionReply({interaction: interaction, title: `⚠️ ${user.tag} | ${user.id}`, description: `${user.tag} has been warned${unableToSendDM ? "\n**Unable to send DM to user**" : ""}`, ephemeral: true})

    } catch(e) {
        throw e;
    }
}

async function Delete(interaction, client, admin = false) {
    try {

        const id = interaction.message.content.toLowerCase().replace(/\-| /g, "");

        //const json = JSON.parse(fs.readFileSync(`${__dirname}/imgData.json`));

        //const el = json[id];

        const data = await getImage({id: id});

        if(!data) return await interactionReply({interaction: interaction, description: "Unable to find image...", ephemeral: true});

        if (!data.author || !data.interaction || !data.discordImgID || !interaction?.user?.id) return await interactionReply({interaction: interaction, description: ":x: Failed to get image info. Please try again", ephemeral: true});

        if (data.author !== interaction?.user?.id && !admin ) return await interactionReply({interaction: interaction, description: ":no_entry_sign: Only the original owner can request for image deletion", ephemeral: true});

        if (data.link == "uploading" || (await getStatus()).canDelete == "false") return await interactionReply({interaction: interaction, description: "Image cannot be removed right now. Try again in a bit", ephemeral: true});

            //////////////////////////////////////////////
            // Remove from Minecraft image bot Server Start  
            //////////////////////////////////////////////

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
                context: { el: data, config: config },
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
                if (data.link?.includes("https://gofile.io/d")) {
                axios({
                    method: "delete",
                    url: `https://api.gofile.io/deleteContent`,
                    data: { contentsId: data.folderId, token: config.GOFILETOKEN },
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

            await removeImage({id: id});
            // Delete from JSON
            //delete json[id];

            // Write to json file
            //fs.writeFileSync(`${__dirname}/imgData.json`,JSON.stringify(json));

            // Reply

            return await interactionReply({interaction: interaction, description: `:wastebasket: Deleted image ${interaction.message.content}\nLink: ${data.link}`, ephemeral: true});
            
        } catch(e) {
            throw e;
        }
}

async function Info(interaction, client) {
    try {

        //const json = JSON.parse(fs.readFileSync(`${__dirname}/imgData.json`));
        
        //const el = json[interaction.message.content.toLowerCase().replace(/\-/g, "")];

        const id = interaction.message.content.toLowerCase().replace(/\-| /g, "");

        const data = await getImage({id: id});
        const author = (await getUser({id: data.author}));

        if(!data) return await interactionReply({interaction: interaction, description: "Unable to find image...", ephemeral: true})
    
        const user = await client.users.fetch(author.id);

        /*
        const warnsAndBans = JSON.parse(fs.readFileSync(`${__dirname}/blockedIDs.json`));
        const blockedIDs = warnsAndBans["bans"];
        const warnedIDs = warnsAndBans["warns"];
        */

        let message = `:white_check_mark: ${user?.tag} hasn't been banned or warned`;

        if (author.banned === "true") {
            message = `:hammer: ${user?.tag} is banned`;
        } else if (author.warned === "true") {
            message = `:warning: ${user?.tag} is warned`;
        }

        return await interactionReply({interaction: interaction, description: `${message}\nBot Message: ${data.interaction}\nLink: ${data.link}`, ephemeral: true})

    } catch(e) {
        throw e;
    }
}

async function Question(interaction, client) {
    try {

        //const json = JSON.parse(fs.readFileSync(`${__dirname}/imgData.json`));
        
        //const el = json[interaction.message.content.toLowerCase().replace(/\-/g, "")];
        //el.id = interaction.message.content.toLowerCase().replace(/\-/g, "");
        const id = interaction.message.content.toLowerCase().replace(/\-| /g, "");

        const data = await getImage({id: id});

        if(!data) return await interactionReply({interaction: interaction, description: "Unable to find image...", ephemeral: true})

        await interactionReply({interaction: interaction, description: `Questioning ${id}`, ephemeral: true});

        const channel = await client.channels.fetch(config.questionChannel);
        if (channel) {
            try {
                const link = `https://discord.com/channels/${interaction.message.guildId}/${interaction.message.channelId}/${interaction.message.id}`;
                await messageCreate({channel: channel, title: `${interaction.user.globalName} is questioning an image`, description: link, footer: `ID: ${id}`});
            } catch(err) {
                console.error(err);
            }
        }

        return;

    } catch(e) {
        throw e;
    }
}

module.exports = {
    ImageBan: Ban,
    ImageWarn: Warn,
    ImageDelete: Delete,
    ImageInfo: Info,
    ImageQuestion: Question
}