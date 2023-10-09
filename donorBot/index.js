const config = require("./config.json");

const { interactionReply } = require(`${__dirname}/../src/embed.js`);
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const { addDonor, removeDonor, getDonors, getDonor, getStatus } = require(`${__dirname}/../src/database.js`);
const axios = require('axios');

const client = new Client({
	intents: [
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});

client.login(config.token).then(() => {
	client.user.setPresence({ status: "invisible" });
});

client.on("ready", async () => {
	console.log(`Logged in as ${client.user.tag}!`);
    try {
        await forceUpdateCache();
    } catch(err) {
        console.error(err);
    }
    try {
        const guild = client.guilds.cache.get(config.guildId);
        if (!guild) throw "Unabled to force database update. Guild not found.";
        const [added, removed] = await forceUpdateDatabase(guild);
        console.log(`Forced database update. Added(${added.length}): ${added.join(', ')} | Removed(${removed.length}): ${removed.join(', ')}`);
    } catch(err) {
        console.error(err);
    }
});

client.on("messageCreate", async (message) => {
	try {
		const prefix = "!";

		if (!message.content.startsWith(prefix)) return;

		const args = message.content.trim().toLowerCase().split(/ +/g);
		const cmd = args[0].slice(prefix.length);
        if(message.guild.id !== config.guildId) return;

        const guild = client.guilds.cache.get(config.guildId);
        if (!guild) return;
        const user = guild.members.cache.get(message.author.id);
        if (!user.roles.cache.some((role) => role.name === "Admin")) return;

		if (cmd === "donors") {
            if(args[1] === "force") {
    
                try {
                    await forceUpdateCache();
                } catch(err) {
                    console.error(err);
                }

                let added, removed;
                try {
                    [added, removed] = await forceUpdateDatabase(guild);
                } catch(err) {
                    console.error(err);
                    message.channel.send(err.toString() || "Error!");
                    return;
                }

                const donors = await getDonors();
                let arr = [];
                for(const donor of donors) {
                    const m = guild.members.cache.get(donor.id);
                    arr.push(`${m.user.globalName || m.user.username} | Since: ${new Date(Number(donor.time)).toLocaleString()}`);
                }

                return message.channel.send(`**Forcing donor update...**\nDonors:\n${arr.join('\n')}\nAdded (${added.length}): ${added.join(', ')}\nRemoved (${removed.length}): ${removed.join(', ')}`);

            } else {
                const donors = await getDonors();
                let arr = [];
                for(const donor of donors) {
                    const m = guild.members.cache.get(donor.id);
                    arr.push(`${m.user.globalName || m.user.username} | Since: ${new Date(Number(donor.time)).toLocaleString()}`);
                }
                message.channel.send(`Donors:\n${arr.join('\n')}`);
            }

		} else if (cmd === "donor") {
            if(args[1] === "add") {
                if(!args[2]) return message.channel.send("You didn't supply an ID");
                const member = guild.members.cache.get(args[2]);
                if(!member) return message.channel.send("Unknown user");

                const donor = await getDonor({id: member.user.id });
                if(donor) return message.channel.send("User is already a donor. Please remove them first");

                const role = guild.roles.cache.find(role => role.name === "Bot Supporter");
                if(!role) return message.channel.send("Unable to find role");

                await member.roles.add(role);

                return message.channel.send(`Added ${member.user.globalName || member.user.username}(${member.user.id}) to the donor database`);

            } else if(args[1] === "remove") {
                if(!args[2]) return message.channel.send("You didn't supply an ID");
                const member = guild.members.cache.get(args[2]);
                if(!member) return message.channel.send("Unknown user");

                const donor = await getDonor({id: member.user.id });
                if(!donor) return message.channel.send("User is not a donor. Please add them first or run !donors force");

                const role = guild.roles.cache.find(role => role.name === "Bot Supporter");
                if(!role) return message.channel.send("Unable to find role");

                await member.roles.remove(role);

                return message.channel.send(`Removed ${member.user.globalName || member.user.username}(${member.user.id}) to the donor database`);
            }

        }
	} catch (err) {
		console.error(err);
	}
});

client.on('guildMemberAdd', async (member) => {
    return;
});

client.on('guildMemberRemove', async (member) => {
    try {
        if(!(await getDonor({id: member.user.id}))) return;

        // Member WAS a donor. But not anymore, they left!
        await removeDonor({id: member.user.id});
    } catch(err) {
        console.error(err);
    }
});

client.on('guildMemberUpdate', async (oldMember, newmember) => {
    try {
        if(!oldMember.roles.cache.some((role) => role.name === "Bot Supporter") && newmember.roles.cache.some((role) => role.name === "Bot Supporter")) {
            await addDonor({id: newmember.user.id, tier: 1});

            const dm = await newmember.createDM(true);
            
            const embed = new EmbedBuilder();
            embed.setTitle("Thank you supporter!")
            embed.setAuthor({name: `Minecraft Image Bot`,url: config.webpageURL,iconURL: config.avatarURL})
            embed.setDescription(`Thank you for your support! Without you, we'd have nothing. If you have any questions about your purchase, feel free to ask them within the https://discord.com/channels/740955634287116308/745651285944172615 channel.\n:warning:You **MUST** stay in Minecraft Image Bot server to keep your donor perks!:warning:`);

            await dm.send({embeds: [embed] });


        } else if(oldMember.roles.cache.some((role) => role.name === "Bot Supporter") && !newmember.roles.cache.some((role) => role.name === "Bot Supporter")) {
            await removeDonor({id: newmember.user.id});
        } else {
            return;
        }
    } catch(err) {
        console.error(err);
    }
});

async function forceUpdateCache() {
    const guild = client.guilds.cache.get(config.guildId);
    if (!guild) throw "Unable to find guild";
    await guild.members.fetch();
}

async function forceUpdateDatabase(guild) {
        
    const allDonors = new Map();
    
    // Loop through the Map and filter out items with the 'Bot Supporter' role
    guild.members.cache.forEach((value, key) => {
        if (value.roles.cache.some((role) => role.name === "Bot Supporter")) {
            allDonors.set(key, value); // Add the item to the filtered Map
        }
    });

    const added = [];
    const removed = [];

    let oldDonors;
    oldDonors = await getDonors();

    for(const serverDonor of allDonors) { // Added
        let found = false;
        for(const databaseDonor of oldDonors) {
            if(serverDonor[0] === databaseDonor.id) {
                found = true;
                break;
            }
        }
        if(!found) {
            added.push(serverDonor[0]);
            await addDonor({id: serverDonor[0], tier: 1 }); // Not found. Add donors to database
        }
    }

    oldDonors = await getDonors();

    for(const databaseDonor of oldDonors) { // Removed
        let found = false;
        for(const serverDonor of allDonors) {
            if(serverDonor[0] === databaseDonor.id) {
                found = true;
                break;
            }
        }
        if(!found) {
            removed.push(databaseDonor.id);
            await removeDonor({id: databaseDonor.id }); // Not found. Remove donors from database
        }
    }

    return [added, removed];
}