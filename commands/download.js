const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');
const { interactionReply } = require("../src/embed");
const fs = require("fs");
const config = require("../config.json");

async function main(interaction, client) {
    try {

        const id = interaction.options.getString('id').toLowerCase().replace(/\-| /g, "");

        const json = JSON.parse(fs.readFileSync(`${__dirname}/../src/imgData.json`));

        if(json[id]) {
            const el = json[id];

            if (el?.link == undefined) return await interactionReply({interaction: interaction, description: ":x: Failed to upload. Please regenerate the image"});

            if (el?.link == "uploading") {
                return await interactionReply({interaction: interaction, description: "Image is being uploaded... Try again in a bit"});
            } else if (el?.link == "failed") {
                return await interactionReply({interaction: interaction, description: ":x: Failed to upload. Please regenerate the image"});
            }

            return await interactionReply({interaction: interaction, title: `${el?.name}.png`, description: `[Download link](${el?.link})`});
        } else {
            return await interactionReply({interaction: interaction, description: ":x: No image with that ID found"});
        }

    } catch(e) {
        throw e;
    }
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('download')
		.setDescription('Download your image in higher quality')
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