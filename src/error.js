const fs = require('fs');

const folder = `${__dirname}/../errors`;

async function main(error, id, interaction) {
    try {
        const channel = interaction.channel;
        console.error(error);
        fs.writeFileSync(`${folder}/${id}.txt`, `${new Date().toString()}\n\n${error.stack}\n\nPermissions: ${channel.permissionsFor(channel.guild.members.me).toArray().join()}`);
    } catch(e) {
        console.error(e);
    }
}

module.exports = {
    create: main,
}