const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');
const { interactionReply } = require("../src/embed");
const fs = require("fs");
const config = require("../config.json");
const axios = require("axios");

async function main(interaction, client) {
    try {
        const id = interaction.options.getString('id').toLowerCase().replace(/\-| /g, "");

        const json = JSON.parse(fs.readFileSync(`${__dirname}/../src/imgData.json`));

        if(json[id]) {

            if (!el?.author || !el?.interaction || !el?.discordImgID || !interaction?.user?.id) {
              await interactionReply({interaction: interaction, description: ":x: Failed to get image info. Please try again"});
              return;
            }

            if (el?.author !== interaction?.user?.id) {
              await interactionReply({interaction: interaction, description: ":no_entry_sign: Only the original owner can request for image deletion"});
              return;
            }

            if (el.link == "uploading" || fs.readFileSync(`${__dirname}/../candelete.txt`).toString() == "false") {
              await interactionReply({interaction: interaction, description: "Image cannot be removed right now. Try again in a bit"});
              return;
            }
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
                        console.log(
                          `[-][REMOVE ERROR] ${e.toString()}[-]`
                        )
                      );
                    if (message) {
                      message
                        .delete()
                        .catch((e) =>
                          console.log(`[-][REMOVE ERROR] ${e.toString()}`)
                        );
                    }
                  } catch (e) {
                    console.log(e);
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

            // Delete from JSON
            delete json[id];

            // Write to json file
            fs.writeFileSync(`${__dirname}/../src/imgData.json`,JSON.stringify(json));

            // Reply
            await interactionReply({interaction: interaction, description: `:wastebasket: Deleted image ${interaction.options.getString('id').toUpperCase()}`});
            return;

        } else {
            await interactionReply({interaction: interaction, description: ":x: No image with that ID found"});
            return;
        }
    } catch(e) {
        throw e;
    }
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Remove image')
        .addStringOption(option => option.setName('id')
            .setDescription('The id of your image')
            .setRequired(true)
            ),
	 async execute(interaction, client) {
         try {
            let start = await interactionReply({interaction: interaction,description: `:arrows_clockwise: Loading...`});

            await main(interaction, client);
  
            return {startInteraction: start};
         } catch(e){
            throw e;
         }
	},
};