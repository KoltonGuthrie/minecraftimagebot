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

            if (el?.interaction == undefined) {
                await interactionReply({interaction: interaction, description: ":x: Failed to get image info. Please regenerate the image"});
                return;
            }

            await interactionReply({interaction: interaction, title: `${el?.name}.png`, description: `[Click here to view the info](https://minecraftimagebot.glitch.me/image?id=${el?.interaction})`});
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
		.setName('info')
		.setDescription('View info of image (used blocks)')
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