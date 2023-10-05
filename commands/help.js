const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');
const { interactionReply } = require("../src/embed");
const config = require("../config.json");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(interaction, client) {
    try {
        await interactionReply({interaction: interaction, description: `
        [Our Webpage](${config.webpageURL}) | [Invite Me](${config.inviteURL})
        \n\n<> - required, [] - optional
        \n\n**Commands:**
        \n/img file <FILE> [low | average | high] - *Main command (Upload with file)*
        \n/img url <LINK> [low | average | high] - *Main command (Upload with link)*
        \n/download <ID> - *View your image without compression*
        \n/remove <ID> - *Remove image*\n/info <ID> - *View info of image (used blocks)*
        \n/help - *Shows this page*\n\n**Info:**\nThere are cooldowns whenever a picture is created.
        \n\n**Cooldowns:**
        \nLow - **10** seconds
        \nAverage - **20** seconds
        \nHigh - **30** seconds
        \n\n[Rules](${config.rulesURL}) | [TOS](${config.tosURL}) | [Support](${config.supportURL})`})
    } catch(e) {
        throw e;
    }
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('See all the commands I have!'),
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