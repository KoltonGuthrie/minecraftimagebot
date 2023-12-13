const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');
const { interactionReply } = require("../src/embed");
const fs = require('fs');
const config = require("../config.json");
const { getImage, getDonor } = require('../src/database');

async function main(interaction, client) {
    try {

        const id = interaction.options.getString('id').toLowerCase().replace(/\-| /g, "");

        //const donor = await getDonor({ id: interaction.user.id });

        //if(!donor) return await interactionReply({interaction: interaction, url: config.generateExampleURL, description: `:x: Only a donor can use this command. Become a donor by donating [here](${config.donateURL})`});

        const data = await getImage({ id: id });

        if(data) {

            if (data.interaction == undefined) {
                await interactionReply({interaction: interaction, description: ":x: Failed to get image info. Please regenerate the image"});
                return;
            }

            if (!data.blockData || data.datapackLink == undefined) {
                await interactionReply({interaction: interaction, description: ":x: This image did not create a datapack file. Please regenerate the image"});
                return;
            }

            if(!(await getDonor({id: interaction.user.id}))) { // Not donor
                await interactionReply({interaction: interaction, title: data.name + ".png", description: `[Datapack Download Link](${data.datapackLink})\n\nClick [here](${config.generateCommandTutorial}) for a tutorial on how to use this command\n\n*This command is available to all for a limited time. Become a donor [here](${config.donateURL}) to not lose access.*`, color: '#3489eb', ephemeral: true });
            } else {
                await interactionReply({interaction: interaction, title: data.name + ".png", description: `[Datapack Download Link](${data.datapackLink})\n\nClick [here](${config.generateCommandTutorial}) for a tutorial on how to use this command`, color: '#3489eb', ephemeral: true });
            }

            
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
		.setName('generate')
		.setDescription('Generate a datapack to load your image in Minecraft!')
        .addStringOption(option => option.setName('id')
            .setDescription('The id of your image')
            .setRequired(true)
            ),
	 async execute(interaction, client) {
         try {
            let start = await interactionReply({interaction: interaction,description: `:arrows_clockwise: Loading...`, ephemeral: true});

		    await main(interaction, client);

            return {startInteraction: start};
         } catch(e){
            throw e;
         }
	},
};