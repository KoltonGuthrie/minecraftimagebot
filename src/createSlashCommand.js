const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { token } = require('../config.json');
const fs = require('fs');

const config = require(`../config.json`);

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

// Place your client and guild ids here
//const clientId = '639522950709510154';
const clientId = '740308839294828575';

for (const file of commandFiles) {
	const command = require(`../commands/${file}`);
	commands.push(command.data.toJSON());
	console.log(command.data.toJSON().name)
}

const rest = new REST({ version: '9' }).setToken(config.token);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		/*
		await rest.put(
			Routes.applicationGuildCommands(clientId, "636313625094651906"),
			{ body: commands },
		);
		*/

		
		await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);
        
		

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();