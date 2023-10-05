const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');
const { interactionReply } = require("../src/embed");
const config = require("../config.json");

async function main(interaction, client) {
    try {
        await interactionReply({interaction: interaction, description: `You can invite me using this link: [Invite](${config.inviteURL})`});
    } catch(e) {
        throw e;
    }
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('invite')
		.setDescription('Get the link to invite me!'),
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