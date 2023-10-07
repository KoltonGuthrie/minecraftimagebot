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
        \n<> - required, [] - optional
        \n**Commands:**
        **/img file <FILE>** [low | average | high] [width] [height] - *Main command (Upload with file)*
        **/img url <LINK>** [low | average | high] [width] [height] - *Main command (Upload with link)*
        **/download <ID>** - *View your image without compression*
        **/remove <ID>** - *Remove image*
        **/info <ID>** - *View info of image (used blocks)*
        **/support** - *Get the support link for me*
        **/invite** - *Get the invite link for me*
        **/help** - *Shows this page*
        \n**Info:**
        There are cooldowns whenever a picture is created.
        \n**Cooldowns:**
        Low - **10** seconds
        Average - **20** seconds
        High - **30** seconds
        \n[Rules](${config.rulesURL}) | [TOS](${config.tosURL}) | [Support](${config.supportURL})`})
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