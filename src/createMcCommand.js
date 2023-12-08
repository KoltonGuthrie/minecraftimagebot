const fs = require('fs');
const path = require('path');
const zipper = require('zip-local');
const { getImage } = require('./database');
const util = require('util');
const zlib = require('zlib');
const inflate = util.promisify(zlib.inflate);

const tempFolder = path.join(__dirname, "..", "tmp");

function createDatapackZip(id, commands) {
    const welcome = 'tellraw @a ["",{"text":"                      Minecraft Image Generator","color":"gold","clickEvent":{"action":"open_url","value":"https://minecraftimagebot.glitch.me/"},"hoverEvent":{"action":"show_text","contents":[{"text":"Click to visit our website","color":"green"}]}},"\\n",{"text":"This feature is currently in ","color":"aqua"},{"text":"BETA","color":"red"},{"text":"!","color":"aqua"},"\\n",{"text":"If you run into any errors, please report them ","color":"aqua"},{"text":"here","underlined":true,"color":"gold","clickEvent":{"action":"open_url","value":"https://minecraftimagebot.glitch.me/support"},"hoverEvent":{"action":"show_text","contents":[{"text":"Click to visit our support page","color":"green"}]}},"\\n",{"text":"To generate your image, run the following command: ","color":"green"},{"text":"\\"/function image:create\\"","color":"gold","clickEvent":{"action":"run_command","value":"/function image:create"},"hoverEvent":{"action":"show_text","contents":[{"text":"Run command","color":"green"}]}},"\\n","\\n",{"text":"It is recommended that you do not run this in a world you care about. Images can take up a large amount of space and this process can not be undone.","bold":true,"color":"dark_red"}]\ngamerule maxCommandChainLength 999999999';

	const folder = path.join(tempFolder, "MC_IMAGE_BOT_" + id);
	fs.mkdirSync(folder);
	fs.writeFileSync(path.join(folder, "pack.mcmeta"), JSON.stringify({pack: {pack_format: 18, description: "Minecraft Image Bot Datapack"} }));
	fs.mkdirSync(path.join(folder, "data", "image", "functions"), { recursive: true });
	fs.writeFileSync(path.join(folder, "data", "image", "functions", "welcome.mcfunction"), welcome);
	fs.writeFileSync(path.join(folder, "data", "image", "functions", "create.mcfunction"), commands);
	fs.mkdirSync(path.join(folder, "data", "minecraft", "tags", "functions"), { recursive: true });
	fs.writeFileSync(path.join(folder, "data", "minecraft", "tags", "functions", "load.json"), JSON.stringify({values: ["image:welcome"]}));

	const saveTo = path.join(tempFolder, "MC_IMAGE_BOT_" + id + ".zip");
	zipper.sync.zip(folder).compress().save(saveTo);
	return saveTo;
}

async function getCommandPath(id) {
	const commands = [];

	const json = JSON.parse( await inflate((await getImage({id: id})).blockData) );

	commands.push(`gamerule maxCommandChainLength 999999999`);
	commands.push(`tellraw @s [{"text":"Placing blocks... This could take a while...\\n","color":"green"},{"text":"It is recommended that you turn ", "color":"aqua"},{"text":"OFF", "bold":true, "color":"red"},{"text":" Smooth Lighting","color":"aqua"},{"text":"\\nThis can be done from:","color":"aqua"},{"text":" Options > Video Settings > Smooth Lighting", "color":"gold"}]`);

	for(block of json.blocks) {
		commands.push(`setblock ~${block.pos.x} ~-1 ~${block.pos.y} dirt`);
		if(block.block === "dried_kelp") commands.push(`setblock ~${block.pos.x} ~ ~${block.pos.y} ${block.block}_block`);
		else if(block.block === "piston_sticky") commands.push(`setblock ~${block.pos.x} ~ ~${block.pos.y} sticky_piston[facing=up]`);
		else if(block.block === "piston") commands.push(`setblock ~${block.pos.x} ~ ~${block.pos.y} piston[facing=up]`);
		else if(block.block === "farmland_moist") commands.push(`setblock ~${block.pos.x} ~ ~${block.pos.y} farmland[moisture=7]`);
		else if(block.block === "mushroom_block") commands.push(`setblock ~${block.pos.x} ~ ~${block.pos.y} brown_mushroom_block`);
		else commands.push(`setblock ~${block.pos.x} ~ ~${block.pos.y} ${block.block}`);
	}

	commands.push(`tellraw @s {"text":"Done!","color":"green"}`);
	
	return createDatapackZip(id, commands.join('\n'));
}

module.exports = {
	getCommandPath
}