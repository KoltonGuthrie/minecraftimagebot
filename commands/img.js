const embed = require("../src/embed");
const {checkurl} = require("../src/checkURL");
const config = require("../config.json");
const {interactionReply, interactionUpdate} = require('../src/embed');
const img = require('../src/image-main')
const upload = require("../src/upload");

const {SlashCommandBuilder} = require('@discordjs/builders');
const fs = require('fs');

async function main(interaction, client) {
    try {

        let delayTimer = 0;

        const quality = interaction.options.getInteger('quality') || 2;
        const width = interaction.options.getInteger('width') || null;
        const height = interaction.options.getInteger('height') || null;

        switch(quality) {
            case 1:
                delayTimer = 10000;
                break;
            case 2:
                delayTimer = 20000;
                break;
            case 3:
                delayTimer = 30000;
                break;
            default:
        }

        let downloadURL;

        if (interaction.options.getSubcommand() == "url") {
            const url = interaction.options.getString('url');
            if (url.match(/^https:\/\/|^http:\/\//)) {
                //console.log(`PING: ${sent.createdTimestamp - interaction.createdTimestamp}ms`);
                // is start of link
                const checkedUrl = await checkurl(url, 5000);
                console.log(checkedUrl);
                if (checkedUrl.status !== 200 || !checkedUrl.type.startsWith("image/") || checkedUrl.type.startsWith("image/webp")) {
                    // not an image or error
                    return await interactionUpdate({
                        interaction: interaction,
                        description: `:x: Unable to download an image from this url | Reason: ${checkedUrl.reason}`
                    });
                }
                //message.channel.send(`Url worked! ${msg[1]}`);
                downloadURL = `${config.downloadURL}${url}`;
                await interactionReply({
                    interaction: interaction,
                    description: `LINK: ${downloadURL}`
                })
            } else {
                return await interactionReply({interaction: interaction, description: `:x: Unknown url. Make sure your url begins with https:// or http://`});
            }
        } else if (interaction.options.getSubcommand() == "file") {
            const file = interaction.options.getAttachment('file');
            console.log(file);
            //if (!file.attachment.toLowerCase().endsWith(".png") && !file.attachment.toLowerCase().endsWith(".jpg") && !file.attachment.toLowerCase().endsWith(".jpeg") && !file.attachment.toLowerCase().endsWith(".webp")) {
            if(file.contentType !== 'image/jpeg' && file.contentType !== 'image/jpg' && file.contentType !== 'image/png') {
                return await embed.interactionReply({
                    interaction: interaction,
                    description: ":x: Uploaded file must be a **.png** or a **.jpg**"
                });
            }
            downloadURL = file.attachment;
        }
        
        if(checkQueue(interaction, delayTimer) == 1) return;

        await interactionReply({interaction: interaction, description: "Starting..."});

        fs.writeFileSync(`${__dirname}/../imagesMade.txt`,(Number(fs.readFileSync(`${__dirname}/../imagesMade.txt`)) +1).toString());

            const makeImageAndUpload = async (options) => {
            return new Promise((resolve, reject) => {
              img.make({
                interaction: options.interaction,
                downloadURL: options.downloadURL,
                quality: options.quality,
                width: options.width,
                height: options.height,
                callback: async function (path, specialID, imageName) {
                  try {
                    let size = getFilesizeInMegaBytes(getFilesizeInBytes(path));
                    console.log(`[MAKE] Done. Size: ${size}`);
          
                    if (size <= 7.9) {
                      uploadTo = "discord";
                    } else {
                      uploadTo = "3rdparty";
                    }
                    console.log(`[UPLOAD] Uploading to: ${uploadTo}`);
          
                    await upload.uploadImg({
                      path: path,
                      interaction: options.interaction,
                      uploadTo: uploadTo,
                      specialID: specialID,
                      imageName: imageName,
                      client: options.client,
                      callback: function (imageName, code) {
                        console.log(`[DONE] Finished: ${imageName} | Failed to upload: ${code}`);
                        return;
                      },
                    });
          
                    //console.log("RETURNING SIZE: " + size);
                    resolve(size); // Resolve the Promise with the size
                  } catch (error) {
                    reject(error); // Reject the Promise if an error occurs
                  }
                },
              });
            });
          };
          
          // Usage
          const size = await makeImageAndUpload({
            interaction: interaction,
            downloadURL: downloadURL,
            quality: quality,
            width: width,
            height: height,
            client: client,
          });
          //console.log("IMAGE SIZE IS: " + size);

          return {"imgSize": size};
          

        /*
        imgSize = await img.make(
                { "interaction": interaction, "downloadURL": downloadURL, "quality": quality, "width": width, "height": height, "callback": async function(path, specialID, imageName) {
                    let size = getFilesizeInBytes(path);
                    console.log(`[MAKE] Done. Size: ${size}`);
                    if (size <= 7.9) {
                        uploadTo = "discord";
                    } else {
                        uploadTo = "3rdparty";
                    }
                    console.log(`[UPLOAD] Uploading to: ${uploadTo}`);
                    await upload.uploadImg(
                        { "path": path, "interaction": interaction, "uploadTo": uploadTo, "specialID": specialID, "imageName": imageName, "client": client, "callback": function(imageName, code) {
                            console.log(`[DONE] Finished: ${imageName} | Failed to upload: ${code}`);
                            return;
                            }
                        } // json
                    
                    );
                    console.log("RETURNING SISE: " + size)
                    return size;
                }
            } // json
        );
            console.log("IMAGE SIZE IS:" + imgSize);
        return imgSize;
        */
    } catch (e) {
        throw e;
    }
}

function getFilesizeInBytes(filename) {
    try {
        const stats = fs.statSync(filename);
        const fileSizeInBytes = stats.size; // Size in bytes
        return fileSizeInBytes;
    } catch(e) {
        console.error(e);
        return -1;
    }
  }

  function getFilesizeInMegaBytes(bytes) {
    try {
        const fileSizeInKiloBytes = bytes / 1000;
        const fileSizeInMegaBytes = fileSizeInKiloBytes / 1000;
        return fileSizeInMegaBytes;
    } catch (e) {
        console.error(e);
        return -1; // Return a default value or throw the error here
    }
}

function checkQueue(interaction, delayTimer) {
    try {
        queue = JSON.parse(fs.readFileSync(`${__dirname}/../src/imgQueue.json`));
        const guildID = interaction.guild.id;

        if (queue[guildID] > new Date().getTime()) {
            h = Math.floor((queue[guildID] - new Date().getTime()) / 1000 / 60 / 60);
            m = Math.floor(((queue[guildID] - new Date().getTime()) / 1000 / 60 / 60 - h) * 60);
            s = Math.floor((((queue[guildID] - new Date().getTime()) / 1000 / 60 / 60 - h) * 60 - m) * 60);
            time = `${m > 0 ? m + " minutes and " : ""}${s} seconds`;

            interactionReply({interaction:interaction, description: `:x: This is on cooldown for ${time}.`})
            return 1;

        } else {
            queue[guildID] = new Date().getTime() + delayTimer;
        }

        if (typeof queue[guildID] == "undefined")
        
        queue[guildID] = new Date().getTime() + delayTimer;

        fs.writeFileSync(`${__dirname}/../src/imgQueue.json`,JSON.stringify(queue));

        return 0;
        
    } catch (e) {
        console.error(e);
    }
}

// 


const MIN_SIZE = 2;
const MAX_SIZE = 350;

module.exports = {
    data: new SlashCommandBuilder().setName('img').setDescription('Change an image into a minecraft image!').addSubcommand(subcommand => subcommand.setName('file').setDescription('Upload a file to be manipulated!')
    .addAttachmentOption(option => option.setName('file').setDescription('The file of an image!').setRequired(true)).addIntegerOption(option => option.setName('quality').setDescription('The quality the minecraft image will be!')
    .addChoices({
        name: 'Low',
        value: 1
    }).addChoices({
        name: 'Average',
        value: 2
    }).addChoices({
        name: 'High',
        value: 3
    }))
    .addIntegerOption(option => option.setName('width').setDescription(`Custom block width of the image! (${MIN_SIZE} - ${MAX_SIZE})`).setMinValue(MIN_SIZE).setMaxValue(MAX_SIZE))
    .addIntegerOption(option => option.setName('height').setDescription(`Custom block height of the image! (${MIN_SIZE} - ${MAX_SIZE})`).setMinValue(MIN_SIZE).setMaxValue(MAX_SIZE))
    ).addSubcommand(subcommand => subcommand.setName('url').setDescription('Upload an image from an url to be manipulated!')
    .addStringOption(option => option.setName('url').setDescription('The url of an image!').setRequired(true))
    .addIntegerOption(option => option.setName('quality').setDescription('Built-in quality for the minecraft image!')
    .addChoices({
        name: 'Low',
        value: 1
    }).addChoices({
        name: 'Average',
        value: 2
    }).addChoices({
        name: 'High',
        value: 3
    }))
    .addIntegerOption(option => option.setName('width').setDescription(`Custom block width of the image! (${MIN_SIZE} - ${MAX_SIZE})`).setMinValue(MIN_SIZE).setMaxValue(MAX_SIZE))
    .addIntegerOption(option => option.setName('height').setDescription(`Custom block height of the image! (${MIN_SIZE} - ${MAX_SIZE})`).setMinValue(MIN_SIZE).setMaxValue(MAX_SIZE))
    )
    ,
    async execute(interaction, client) {
        try {
            let start = await interactionReply({interaction: interaction,description: `:arrows_clockwise: Loading...`});

            let json = await main(interaction, client);

            return {"startInteraction": start, "imageSize": json?.imgSize};
        } catch (e) {
            throw e;
        }
    },
};