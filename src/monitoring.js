const http = require('http');
const url = require('url');
const client = require('prom-client');

const os = require("os-utils");
const pidusage = require('pidusage');
// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({app: 'Minecraft Image Bot'});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

const guilds = new client.Gauge({ name: 'guilds', help: 'Total amount of guilds the bot is currently in' });
const members = new client.Gauge({ name: 'members', help: 'Total amount of members in all guilds' });
let clientAPIPing = null;
const shardCount = new client.Gauge({ name: 'shard_count', help: 'Total count of all the shards being used' });

const download_command_usage = new client.Gauge({ name: 'download_command_usage', help: 'Usage of the download command' });
const help_command_usage = new client.Gauge({ name: 'help_command_usage', help: 'Usage of the help command' });
const image_command_usage = new client.Gauge({ name: 'image_command_usage', help: 'Usage of the image command' });
const info_command_usage = new client.Gauge({ name: 'info_command_usage', help: 'Usage of the info command' });
const remove_command_usage = new client.Gauge({ name: 'remove_command_usage', help: 'Usage of the remove command' });
const stats_command_usage = new client.Gauge({ name: 'stats_command_usage', help: 'Usage of the stats command' });
const generate_command_usage = new client.Gauge({ name: 'stats_command_usage', help: 'Usage of the generate command' });

const download_command_delay = new client.Histogram({name: 'download_command_delay', help: 'Amount of delay for the download command', buckets: [0.1, 5, 15, 50, 100, 500] });
const help_command_delay = new client.Histogram({name: 'help_command_delay', help: 'Amount of delay for the help command', buckets: [0.1, 5, 15, 50, 100, 500] });
const image_command_delay = new client.Histogram({name: 'image_command_delay', help: 'Amount of delay for the image command', buckets: [0.1, 5, 15, 50, 100, 500] });
const info_command_delay = new client.Histogram({name: 'info_command_delay', help: 'Amount of delay for the info command', buckets: [0.1, 5, 15, 50, 100, 500] });
const remove_command_delay = new client.Histogram({name: 'remove_command_delay', help: 'Amount of delay for the remove command', buckets: [0.1, 5, 15, 50, 100, 500] });
const stats_command_delay = new client.Histogram({name: 'stats_command_delay', help: 'Amount of delay for the stats command', buckets: [0.1, 5, 15, 50, 100, 500] });
const generate_command_delay = new client.Histogram({name: 'stats_command_delay', help: 'Amount of delay for the generate command', buckets: [0.1, 5, 15, 50, 100, 500] });

const process_cpu_usage = new client.Histogram({name: 'process_cpu_usage', help: 'cpu usage', buckets: [0.1, 15, 30, 50, 75, 100] });
const process_rss_memory = new client.Histogram({name: 'process_rss_memory', help: 'rss memory usage', buckets: [0.1, 25, 75, 150, 300, 100] });
const process_heap_total_memory = new client.Histogram({name: 'process_heap_total_memory', help: 'heap total memory', buckets: [0.1, 25, 75, 150, 300, 1000] });
const process_heap_used_memory = new client.Histogram({name: 'process_heap_used_memory', help: 'heap memory usage', buckets: [0.1, 25, 75, 150, 300, 1000] });
const process_external_memory = new client.Histogram({name: 'process_external_memory', help: 'external memory usage', buckets: [0.1, 25, 75, 150, 300, 1000] });

const image_size = new client.Histogram({name: 'image_size', help: 'external memory usage', buckets: [0.1, 2, 5, 10, 15, 20] });

register.registerMetric(guilds);
register.registerMetric(members);
register.registerMetric(shardCount);

register.registerMetric(download_command_usage);
register.registerMetric(help_command_usage);
register.registerMetric(image_command_usage);
register.registerMetric(info_command_usage);
register.registerMetric(remove_command_usage);
register.registerMetric(stats_command_usage);
register.registerMetric(generate_command_usage);

register.registerMetric(download_command_delay);
register.registerMetric(help_command_delay);
register.registerMetric(image_command_delay);
register.registerMetric(info_command_delay);
register.registerMetric(remove_command_delay);
register.registerMetric(stats_command_delay);
register.registerMetric(generate_command_delay);

register.registerMetric(process_cpu_usage);
register.registerMetric(process_rss_memory);
register.registerMetric(process_heap_total_memory);
register.registerMetric(process_heap_used_memory);
register.registerMetric(process_external_memory);

register.registerMetric(image_size);

let discord_client;
let loop;


function setGuilds(n) {
    guilds.set(n);
}

function setMembers(n) {
    members.set(n);
}

function setShardCount(n) {
    shardCount.set(n);
}

function observeClientAPIPing(n, s) {
    clientAPIPing.observe(n);
}

function observeImageSize(n) {
    image_size.observe(n);
}

function observeCommandDelay(str, n) {
    switch(str) {
        case "download":
            download_command_delay.observe(n);
        break;
        case "help":
            help_command_delay.observe(n);
        break;
        case "img":
            image_command_delay.observe(n);
        break;
        case "info":
            info_command_delay.observe(n);
        break;
        case "remove":
            remove_command_delay.observe(n);
        break;
        case "stats":
            stats_command_delay.observe(n);
        break;
        case "generate":
            generate_command_delay.observe(n);
        break;
    }
}

function incCommandUsage(str) {
    switch(str) {
        case "download":
            download_command_usage.inc();
        break;
        case "help":
            help_command_usage.inc();
        break;
        case "img":
            image_command_usage.inc();
        break;
        case "info":
            info_command_usage.inc();
        break;
        case "remove":
            remove_command_usage.inc();
        break;
        case "stats":
            stats_command_usage.inc();
        break;
        case "generate":
            generate_command_usage.inc();
        break;
    }
}

function startClientHeartbeat(c) {
    if(c == undefined) return;
    if(loop != undefined) {
        clearInterval(loop);
        loop = null;
    }
    discord_client = c;
    loop = setInterval(heartbeat, 10000);
}

function heartbeat() {
    //console.log(discord_client?.ws?.ping);
    getMemoryUsage();
    if(discord_client?.ws?.ping == undefined || discord_client?.ws?.ping < 0) return;
    observeClientAPIPing(discord_client.ws.ping, discord_client.shard.ids[0]);
}

async function getMemoryUsage() {

    const memoryUsage = process.memoryUsage();
    /*
  const memoryUsage = process.memoryUsage();
  console.log('Memory Usage:');
  console.log('  RSS:', formatBytes(memoryUsage.rss));
  console.log('  Heap Total:', formatBytes(memoryUsage.heapTotal));
  console.log('  Heap Used:', formatBytes(memoryUsage.heapUsed));
  console.log('  External:', formatBytes(memoryUsage.external));
  console.log('  System Free Memory:', formatBytes(os.freemem()));
  console.log('  Total System Memory:', formatBytes(os.totalmem()));
  console.log('--------------------------------');
  */

    
    const cpu_usage = Math.round((await pidusage(process.pid)).cpu);
    if(cpu_usage >= 0) process_cpu_usage.observe(cpu_usage);

    process_rss_memory.observe(memoryUsage.rss);
    process_heap_total_memory.observe(memoryUsage.heapTotal);
    process_heap_used_memory.observe(memoryUsage.heapUsed);
    process_external_memory.observe(memoryUsage.external);
}

function initializeMonitoring(id) {
    

    clientAPIPing = new client.Histogram({name: `shard_${id}_api_ping`, help: 'Ping to the Discord API', buckets: [0.1, 5, 15, 50, 100, 500] });
    register.registerMetric(clientAPIPing);

    const server = http.createServer(async (req, res) => {
        try {

            // Retrieve route from request object
            const route = url.parse(req.url).pathname;
            
            if (route === '/metrics') {
                // Return all metrics the Prometheus exposition format
                res.setHeader('Content-Type', register.contentType);

                // Wait for the promise to resolve and then send the metrics as a response
                const metrics = await register.metrics();

                res.end(metrics);
            } else {
                // Handle other routes or requests here
                res.statusCode = 404;
                res.end('Not Found');
            }
        } catch (error) {
            console.error('Error:', error);
            res.statusCode = 500;
            res.end('Internal Server Error');
        }
    });

    // Start the HTTP server which exposes the metrics on http://localhost:8000/metrics
    server.listen(8000 + id);
    
    return {
        setGuilds: setGuilds,
        setMembers: setMembers,
        observeCommandDelay: observeCommandDelay,
        incCommandUsage: incCommandUsage,
        observeClientAPIPing: observeClientAPIPing,
        startClientHeartbeat: startClientHeartbeat,
        setShardCount: setShardCount,
        observeImageSize: observeImageSize,
    }
    
}

module.exports = initializeMonitoring;