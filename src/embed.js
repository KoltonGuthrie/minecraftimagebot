const { EmbedBuilder } = require('discord.js');
const { PermissionsBitField } = require('discord.js');

const config = require("../config.json");

async function interactionReply({interaction = null, title = " ", description = " ", url = null, fields = null, footer = ` `,  color = "#0099ff", ephemeral = false}) {
    try {
        if(interaction == null) throw new Error("No interaction in Embed");

        if(interaction.replied == true) {
            await interactionUpdate({interaction: interaction, title: title, description: description, fields: fields, footer: footer, color: color, ephemeral: ephemeral});
            return;
        }

        const channel = interaction.channel;
        /*
        if(!channel.permissionsFor(channel.guild.members.me).has([PermissionsBitField.Flags.ViewChannel])) {
            //await interaction.reply({content: "I do not have the proper permissions! I need the SEND_MESSAGES and VIEW_CHANNEL permissions", ephemeral: true});
            throw "No permissions";
        }
        */

        const embed = new EmbedBuilder();
        //embed.setColor(color)
        embed.setTitle(title)
        //embed.setURL('https://discord.js.org/')
        //embed.setAuthor({ name: 'Some name', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
        embed.setAuthor({name: `Minecraft Image Bot`,url: config.webpageURL,iconURL: config.avatarURL});
        if(description.length > 4096) description = description.slice(description.length-4096);
        embed.setDescription(description);
        //embed.setThumbnail('https://i.imgur.com/AfFp7pu.png')
        if(fields !== null) {
            for(let i = 0; i < fields.length; i++) {
                embed.addFields(fields[i]);
            }
        }
        //embed.addField('Inline field title', 'Some value here', true)
        if(url !== null) {
            embed.setImage(url)
        }
        //embed.setTimestamp()
        embed.setFooter({ text: footer });

        return await interaction.reply({embeds: [embed], ephemeral: ephemeral, fetchReply: true });
    } catch(e) {
        throw e;
    }
}


async function interactionUpdate({interaction = null, title = " ", description = " ", url = null, fields = null, footer = " ",  color = "#0099ff", ephemeral = false}) {
    try {
        if(interaction == null) throw new Error("No interaction in Embed");

        const channel = interaction.channel;
        /*
        if(!channel.permissionsFor(channel.guild.me).has([PermissionsBitField.Flags.ViewChannel])) {
            await interaction.editReply({content: "I do not have the proper permissions! I need the SEND_MESSAGES and VIEW_CHANNEL permissions", ephemeral: true});
            throw "No permissions";
        }
        */

        const embed = new EmbedBuilder();
        //embed.setColor(color)
        embed.setTitle(title)
        //embed.setURL('https://discord.js.org/')
        embed.setAuthor({name: `Minecraft Image Bot`,url: config.webpageURL,iconURL: config.avatarURL})
        if(description.length > 4096) description = description.slice(description.length-4096);
        embed.setDescription(description);
        //embed.setThumbnail('https://i.imgur.com/AfFp7pu.png')
        //embed.addField('Inline field title', 'Some value here', true)
        if(fields !== null) {
            for(let i = 0; i < fields.length; i++) {
                embed.addFields(fields[i]);
            }
        }
        
        if(url !== null) {
            embed.setImage(url)
        }
        //embed.setTimestamp()
        embed.setFooter({ text: footer });

        await interaction.editReply({embeds: [embed], ephemeral: ephemeral });
    } catch(e) {
        throw e;
    }
}

async function messageCreate({channel = null, title = " ", description = " ", footer = " ", components = [], color = "#0099ff", interaction = null}) {
    try {
        if(channel == null) throw new Error("No channel in Embed");

        // Channel type 1 is type of DM
        /*
        if(channel.type != 1 && !channel.permissionsFor(channel.guild?.me).has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel])) {
            try {
            await channel.send({content: "I do not have the proper permissions! I need the SEND_MESSAGES and VIEW_CHANNEL permissions"});
            } catch (e) {};
            throw "No permissions";
        }
        */

        const embed = new EmbedBuilder();
        //embed.setColor(color)
        embed.setTitle(title)
        //embed.setURL('https://discord.js.org/')
        embed.setAuthor({name: `Minecraft Image Bot`,url: config.webpageURL,iconURL: config.avatarURL})
        if(description.length > 4096) description = description.slice(description.length-4096);
        embed.setDescription(description);
        //embed.setThumbnail('https://i.imgur.com/AfFp7pu.png')
        //embed.addField('Inline field title', 'Some value here', true)
        //embed.setImage('https://i.imgur.com/AfFp7pu.png')
        //embed.setTimestamp()
        embed.setFooter({ text: footer });

        await channel.send({embeds: [embed] , components: components});

    } catch(e) {
        throw e;
    }
}

async function messageEdit({message = null, title = " ", description = " ", footer = " ",  color = "#0099ff", components = []}) {
    try {
        if(message == null) throw new Error("No message in Embed");

        /*
        const channel = message.channel;
        if(!channel.permissionsFor(channel.guild.members.me).has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel])) {
            await message.edit({content: "I do not have the proper permissions! I need the SEND_MESSAGES and VIEW_CHANNEL permissions"});
            throw "No permissions";
        }
        */

        const embed = new EmbedBuilder();
        //embed.setColor(color)
        embed.setTitle(title)
        //embed.setURL('https://discord.js.org/')
        embed.setAuthor({name: `Minecraft Image Bot`,url: config.webpageURL,iconURL: config.avatarURL})
        if(description.length > 4096) description = description.slice(description.length-4096);
        embed.setDescription(description);
        //embed.setThumbnail('https://i.imgur.com/AfFp7pu.png')
        //embed.addField('Inline field title', 'Some value here', true)
        //embed.setImage('https://i.imgur.com/AfFp7pu.png')
        //embed.setTimestamp()
        embed.setFooter({ text: footer });

        await message.edit({embeds: [embed] , components: components});
    } catch(e) {
        throw e;
    }
}

module.exports = {
    interactionReply: interactionReply,
    interactionUpdate: interactionUpdate,
    messageCreate, messageCreate,
    messageEdit: messageEdit,
}