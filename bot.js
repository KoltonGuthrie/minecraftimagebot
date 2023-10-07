require( 'console-stamp' )( console );
const config = require(`${__dirname}/config.json`);
const fs = require("fs");
const { interactionReply } = require(`${__dirname}/src/embed.js`);
const errorHandler = require(`${__dirname}/src/error.js`);
const axios = require("axios");
const { ImageBan, ImageWarn, ImageDelete, ImageInfo, ImageQuestion } = require(`${__dirname}/src/buttons.js`);
const { Options, Client, Collection, GatewayIntentBits, PermissionsBitField, ActivityType } = require('discord.js');
const { stringify } = require('querystring');
let monitoringInstance;

const client = new Client(
  {
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages] ,
    /*
    sweepers: {
      ...Options.DefaultSweeperSettings,
      messages: {
        interval: 3600, // Every hour...
        lifetime: 1800,	// Remove messages older than 30 minutes.
      },
    },
    
    makeCache: 
      Options.cacheWithLimits({
		  ...Options.DefaultMakeCacheSettings,
		  GuildMemberManager: {
        maxSize: 0,
        keepOverLimit: member => member.id === client.user.id,
      }
      }),
  
  */ 
  }
  );
client.login(config.token).then(() => {
  
  client.user.setPresence(
    {
    activities: [{ name: '/img', type: ActivityType.Listening }],
    status: 'online'
    }
  );
})

const { AutoPoster } = require("topgg-autoposter");

AutoPoster("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijc0MDMwODgzOTI5NDgyODU3NSIsImJvdCI6dHJ1ZSwiaWF0IjoxNjAxMDY1OTQ3fQ._519gd3ZozkqoeiVwUb2MfsvpNo22PZo9eYwtqHPh8Y", client).on("posted", () => {
  console.log("Posted stats to Top.gg!");
});

// COMMANDS 

client.commands = new Collection();
const commandFiles = fs.readdirSync(`${__dirname}/commands`).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`${__dirname}/commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

client.on("shardReady", async (id, unavailableGuilds) => {

    const Monitoring = require(`${__dirname}/src/monitoring.js`);
    monitoringInstance = Monitoring(id);
    updateMonitoring();
    monitoringInstance.startClientHeartbeat(client);
    monitoringInstance.setShardCount(client.options.shardCount);

    console.log(
      `[SHARD] Shard ${id} ready! Unavailable guilds: ${
        unavailableGuilds?.size === undefined ? 0 : unavailableGuilds?.size
      }`
    );
  
    const channel = client.channels.cache.get("770315195162951721");
  
    if (channel) {
      console.log(`[PHOTO CHANNEL] Task given to Shard #${id}`);
      fs.writeFileSync(`${__dirname}/canstart.txt`, "true");
    }
    //if(channel) { console.log(`[CACHING PHOTOS] Task given to Shard #${id}`); console.log(`[GET DONORS] Task given to Shard #${id}`); fs.writeFileSync(`${process.mainModule.path}/canstart.txt`, "true"); cachePhotos(); }
  
    if (id === client.shard.client.options.shardCount - 1) {
      console.log(`[UPDATE LOOP] Task given to Shard #${id}`);
      //updateLoopLoop();
      fs.writeFileSync(`${__dirname}/candelete.txt`, "true");

      const cron = require(`${__dirname}/src/removeOldPhotos`);
      cron.start(client);

      const updateStats = require(`${__dirname}/src/updateStats.js`);
      updateStats.start(client);

    }
});

client.on('interactionCreate', async interaction => {

	if (interaction.isCommand()) {
    
		const command = client.commands.get(interaction.commandName);

		if (!command) return;

        /*
        const perms = checkPerms(interaction, ["EmbedLinks", "AttachFiles"]);

        if(perms?.length > 0) {
            await interaction.reply({content: "I am missing the following permissions: " + perms.toString()});
            return;
        }
        */

        let warnsAndBans = JSON.parse(fs.readFileSync(`${__dirname}/src/blockedIDs.json`));
        let blockedIDs = warnsAndBans["bans"];
        let warnedIDs = warnsAndBans["warns"];
        
        if (blockedIDs.includes(interaction.user.id)) return await interactionReply({interaction: interaction, description: `:x: You have broken one of our rules and have been banned from using the bot. [Rules](${config.rulesURL})\nIf you think that your ban was unfair, you may contact us from our server: ${config.supportURL}`});


		try {

      monitoringInstance.incCommandUsage(interaction.commandName);

      const interaction_timestamp = interaction?.createdTimestamp;

			let json = await command.execute(interaction, client);

      monitoringInstance.observeCommandDelay(interaction.commandName, (json?.startInteraction?.createdTimestamp - interaction_timestamp));

      if(interaction.commandName === "img" && json?.imageSize) {

        const size = Math.ceil(json.imageSize);
        //console.log(size);
        if(size > 0) {
          monitoringInstance.observeImageSize(size);
        }
      }
      
		} catch (error) {

			try {
                const id = Math.random().toString(36).slice(2, 10+2).toUpperCase();
                try {
                    errorHandler.create(error, id, interaction);
                } catch (e) {
                    console.error(e);
                }
                await interactionReply({ interaction: interaction, description: 'There was an error while executing this command!', footer: `If you continue to get their error please report it in our support server. ID:${id}`, ephemeral: true });
            } catch(err) {
                console.error(err);
            }
        }
    } else if(interaction.isButton()) {
        try {

            switch(interaction.customId) {
                case "ban":
                    await ImageBan(interaction, client);
                    break;
                case "warn":
                    await ImageWarn(interaction, client);
                    break;
                case "delete":
                    await ImageDelete(interaction, client, true);
                    break;
                case "info":
                    await ImageInfo(interaction, client);
                    break;
                case "question":
                    await ImageQuestion(interaction, client);
                    break;
                default:
                    await interactionReply({interaction: interaction, description: "Error."});
                    break;
            }
            
        } catch(error) {
            try {
                const id = Math.random().toString(36).slice(2, 10+2).toUpperCase();
                try {
                    errorHandler.create(error, id, interaction);
                } catch (e) {
                    console.error(e);
                }

                await interactionReply({ interaction: interaction, description: 'There was an error while executing this command!', footer: `If you continue to get their error please report it in our support server. ID:${id}`, ephemeral: true });
            } catch(err) {
                console.error(err);
            }
        }
    }
});

async function updateMonitoring() {
  try {
    guildAmount = await client.guilds.cache.size;
    monitoringInstance.setGuilds(guildAmount);

    userAmount = await client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

    monitoringInstance.setMembers(userAmount);
  } catch(err) {
    console.error(err);
  }
}


client.on("guildDelete", async (guild) => {
    if (guild.name == undefined) return;

    updateMonitoring();

    return sendWebhook(guild, 0);
  });

client.on("guildCreate", async (guild) => {

    updateMonitoring();

    sendWebhook(guild, 1);
  
    const channel = guild.channels.cache.find(
      (channel) =>
        channel.type === 0 &&
        channel.permissionsFor(guild.members.me)?.has([PermissionsBitField.Flags.SendMessages]) && channel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.ViewChannel)
    );
    if (channel) {
      channel
        .send(
          "**Thank you for inviting me!** :smiley:\n`+`You can find all my commands by using `/help`\n`+`Need help? Join our server **" +
            config.supportURL +
            "**\n**By having Minecraft Image Bot in your server and using Minecraft Image Bot, you agree to the following Terms of Servivce: " +
            config.tosURL +
            "**"
        )
        .catch((e) =>
          console.log(`[-][ERROR WELCOME MESSAGE][-] ${e.toString()}`)
        );
    }
    return;
  });

  client.on("shardDisconnect", async (event, id) => {
    console.log(`Shard #${id} disconnected with event code: ${event.code}`);
    
  });

  client.on("shardError", async (error, id) => {
    console.log(`Shard #${id} failed to connect with the error: ${error}`);
  });

  client.on("shardReconnecting", async (id) => {
    console.log(`Shard #${id} is reconnecting`);
    
    try {
      if (global.gc) {global.gc();}
      console.log(`Garbage Collected`)
    } catch (e) {
      console.log(`Unable to collect`)
    }
  });

  client.on("shardResume", async (id, replayedEvents) => {
    console.log(`Shard #${id} resumed successfully. ${replayedEvents} events were replayed`);
  });

  client.on("warn", async (str) => {
    console.log(str);
  });

  client.on("error", async (str) => {
    console.log(str);
  });

  async function sendWebhook(guild, type) {
    let title;
    let color;
  
    if (type === 0) {
      title = "Removed from guild";
      color = "16711680";
    } else {
      title = "Added to guild";
      color = "4718336";
    }
  
    const json = JSON.stringify({
      embeds: [
        {
          title: `${title}`,
          description: `Name: ${guild.name}\nID: ${guild.id}\nMembers: ${guild.memberCount}`,
          color: color,
          footer: { text: `${new Date().toLocaleString()}` },
        },
      ],
    });
  
    const res = await axios.post(
      "https://discord.com/api/webhooks/770445072797401108/F4G8VmDkiBuLtdCVRmk5i_jVow8t40FMnntltToFlHtDxGXQgWACKFgEv1k2I8vK7K5I",
      json,
      {
        headers: {
          // Overwrite Axios's automatically set Content-Type
          "Content-Type": "application/json",
        },
      }
    );
  }