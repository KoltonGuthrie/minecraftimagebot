const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');
const { interactionReply } = require("../src/embed");
const fs = require("fs");
const config = require("../config.json");
const { getImage } = require('../src/database');

async function main(interaction, client) {
    try {

        await interactionReply({interaction: interaction, description: ":construction_worker: We are working to improve this command. For now, it has been disabled.", color: '#cf2b0e'});

        return;
        const id = interaction.options.getString('id').toLowerCase().replace(/\-| /g, "");

        const data = await getImage({ id: id });

        if(data) {

            if (data.interaction == undefined) {
                await interactionReply({interaction: interaction, description: ":x: Failed to get image info. Please regenerate the image"});
                return;
            }

            const json = JSON.parse(data.blockData);
            let description = [];
            for(let i = 0; i < json.blocks.length; i++) {
                if(i >= 10) break;
                const b = json.blocks[i];
                description.push(`#${i+1} ${b.n} - **${numberWithCommas(b.a)}**`);
            }

            await interactionReply({interaction: interaction, title: json.name, description: description.join('\n'), footer: `${numberWithCommas(json.blockAmount)} total blocks`, color: '#3489eb', ephemeral: true });
            
            return;
        } else {
            await interactionReply({interaction: interaction, description: ":x: No image with that ID found"});
            return;
        }
    } catch(e) {
        throw e;
    }
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
            let start = await interactionReply({interaction: interaction,description: `:arrows_clockwise: Loading...`, ephemeral: true});

		    await main(interaction, client);

            return {startInteraction: start};
         } catch(e){
            throw e;
         }
	},
};