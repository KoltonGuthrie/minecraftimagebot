const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');
const { interactionReply } = require("../src/embed");
const config = require("../config.json");
const { getDonor } = require('../src/database');

async function main(interaction, client) {
    try {

        const FREE_COOLDOWNS = {low: 10, average: 20, high: 5};
        const DONOR_COOLDOWNS = {low: 5, average: 5, high: 5};

        const ISDONOR = await getDonor({id: interaction.user.id});

        await interactionReply({interaction: interaction, description: `
        [Our Webpage](${config.webpageURL}) | [Invite Me](${config.inviteURL})
        \n<> - required, [] - optional
        \n**Commands:**
        **/img file <FILE>** [low | average | high] [width] [height] - *Main command (Upload with file)*
        **/img url <LINK>** [low | average | high] [width] [height] - *Main command (Upload with link)*
        **NEW!** **/generate <ID>** - *Generate a datapack to load your image in Minecraft!*
        **/download <ID>** - *View your image without compression*
        **/remove <ID>** - *Remove image*
        **/support** - *Get the support link for me*
        **/invite** - *Get the invite link for me*
        **/help** - *Shows this page*
        \n**Info:**
        There are cooldowns whenever a picture is created.
        \n**Cooldowns:**
        Low - **${ISDONOR ? DONOR_COOLDOWNS.low : FREE_COOLDOWNS.low}** seconds
        Average - **${ISDONOR ? DONOR_COOLDOWNS.average : FREE_COOLDOWNS.average}** seconds
        High - **${ISDONOR ? DONOR_COOLDOWNS.high : FREE_COOLDOWNS.high}** seconds
        \n[Rules](${config.rulesURL}) | [TOS](${config.tosURL}) | [Support](${config.supportURL})`});
        //**/info <ID>** - *View info of image (used blocks)*
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