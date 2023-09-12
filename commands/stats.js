
const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');
const { interactionReply } = require("../src/embed");
const config = require("../config.json");

function convertMiliseconds(miliseconds, format) {
    var days, hours, minutes, seconds, total_hours, total_minutes, total_seconds;
  
    total_seconds = parseInt(Math.floor(miliseconds / 1000));
    total_minutes = parseInt(Math.floor(total_seconds / 60));
    total_hours = parseInt(Math.floor(total_minutes / 60));
    days = parseInt(Math.floor(total_hours / 24));
  
    seconds = parseInt(total_seconds % 60);
    minutes = parseInt(total_minutes % 60);
    hours = parseInt(total_hours % 24);
  
    switch (format) {
      case "s":
        return total_seconds;
      case "m":
        return total_minutes;
      case "h":
        return total_hours;
      case "d":
        return days;
      default:
        if (hours === 0 && days === 0 && minutes === 0) return `${seconds}s`;
        else if (hours === 0 && days === 0) return `${minutes}m, ${seconds}s`;
        else if (days === 0) return `${hours}h, ${minutes}m, ${seconds}s`;
        return `${days}d, ${hours}h, ${minutes}m, ${seconds}s`;
    }
  }

async function main(interaction, client) {
    const clocks = [
    1,
    10,
    1030,
    11,
    1130,
    12,
    1230,
    130,
    2,
    230,
    3,
    330,
    4,
    430,
    5,
    530,
    6,
    630,
    7,
    730,
    8,
    830,
    9,
    930,
  ];


  try {
      
    let guildAmount;
    let userAmount;
    let shardCount;
    let usingShard;

    guildAmount = await client.shard.fetchClientValues("guilds.cache.size");
    guildAmount = guildAmount.reduce(
      (acc, guildAmount) => acc + guildAmount,
      0
    );

    userAmount = await client.shard.broadcastEval((client) =>
      client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)
    );

    userAmount = userAmount.reduce((acc, userAmount) => acc + userAmount, 0);

    shardCount = client.options.shardCount;
    usingShard = interaction.guild.shardId;

    const arr = [{name: ":house: Guilds:", value: ` **${guildAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}**`, inline: true}, { name:":busts_in_silhouette: Members:", value:`**${userAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}**`, inline:true }, {name:":hourglass: Ping:", value:` **${client.ws.ping}ms**`, inline: true}, {name:`:clock${clocks[Math.floor(Math.random() * clocks.length)]}: Uptime:`, value:` **${convertMiliseconds(client.uptime)}**`,inline:true }, {name: ":pick: Shards:", value: `#${++usingShard} / ${shardCount}`, inline: true} ];

    return await interactionReply({interaction: interaction, title: "Stats:", fields: arr});
  } catch (e) {
    await interactionReply({interaction: interaction, description: `:x: Unable to retrieve stats. Try again in a bit`});
  }

  /*
  const statsEmbed = new Discord.Embed();
  statsEmbed.setAuthor({
    name: `Minecraft Image Bot`,
    url: config.webpageURL,
    iconURL: config.avatarURL,
  });
  statsEmbed.setTitle("Stats:");
  statsEmbed.addFields(
    {name: ":house: Guilds:", value: ` **${guildAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}**`, inline: true});
  statsEmbed.addFields({
    name:":busts_in_silhouette: Members:",
    value:`**${userAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}**`,
    inline:true
  });
  statsEmbed.addFields({name:":hourglass: Ping:", value:` **${client.ws.ping}ms**`, inline: true});
  statsEmbed.addFields({
    name:`:clock${clocks[Math.floor(Math.random() * clocks.length)]}: Uptime:`,
    value:` **${convertMiliseconds(client.uptime)}**`,
    inline:true
  });

  await interaction.reply({ embeds: [statsEmbed] });
  */

}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Check the stats of the bot'),
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