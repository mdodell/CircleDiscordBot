import Discord from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import { prefix } from './config.json';

// Configure environment variables so they can be used in our bot.
dotenv.config();
const client = new Discord.Client();
client.commands = new Discord.Collection();


// Create all of the commands based on what is in the "commands" folder.
// Commands are nested into subcategories.
export const initializeCommands = () => {
	const commandFolders = fs.readdirSync('./commands');
	for (const folder of commandFolders) {
		const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			const command = require(`./commands/${folder}/${file}`);
			client.commands.set(command.name, command);
		}
	}
};

// Initialize Events
export const initializeEvents = () => {
	const events = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
	for (const file of events) {
		const event = require(`./events/${file}`);
		if (event.once) {
			client.once(event.name, (...args) => event.execute(...args));
		}
		else {
			client.on(event.name, (...args) => event.execute(...args));
		}
	}
};


export const initializeBot = () => {
	initializeCommands();
	initializeEvents();
};


initializeBot();


client.on('message', (message) => {
	const { author, content, channel } = message;

	if (author.bot) return;
	const args = content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	// If there is no command that goes by this name
	if (!client.commands.has(commandName)) return;
	const command = client.commands.get(commandName);


	// This should be true for commands if the command requires any additional arguments.
	if (command.args && !args.length) {
		return message.channel.send(`You didn't provide any arguments, ${message.author}!`);
	}

	// This should be true if this command should only be used in servers.
	if (command.guildOnly && channel.type === 'dm') {
		return message.reply('I can\'t execute that command inside DMs!');
	}

	try {
		command.execute(message, args);
	}
	catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
});

client.login(process.env.DISCORD_TOKEN);
