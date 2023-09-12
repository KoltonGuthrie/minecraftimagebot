require( 'console-stamp' )( console );
const { ShardingManager } = require("discord.js");
const fs = require("fs");
const config = require(`${__dirname}/config.json`);

const manager = new ShardingManager(`${__dirname}/bot.js`, { execArgv: ['--expose-gc'], totalShards: "auto" , token: config.token });
fs.writeFileSync(`${__dirname}/canstart.txt`, "false");
fs.writeFileSync(`${__dirname}/candelete.txt`, "false");

manager.on("shardCreate", (shard) =>
  console.log(`[SHARD] Launching shard ${shard.id}...`)
);
manager.spawn().catch((e) => console.error(e));
