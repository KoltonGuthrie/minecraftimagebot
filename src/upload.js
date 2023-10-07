const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const config = require('../config.json');
const { interactionUpdate } = require("./embed");
const { SlashCommandSubcommandBuilder } = require("@discordjs/builders");

async function uploadImg(json)
  {

  let path = json.path;
  let interaction = json.interaction;
  let uploadTo = json.uploadTo;
  let specialID = json.specialID;
  let imageName = json.imageName;
  let client = json.client;
  let callback = json.callback;

  async function f(client, { id, path }) {
    const channel = await client.channels.cache.get("770315195162951721");
    if (channel) {
      console.log("Found channel");
      try {
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId("ban")
              .setLabel('Ban 🔨')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId("warn")
              .setLabel('Warn ⚠️')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId("delete")
              .setLabel('Delete ❌')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId("info")
              .setLabel('Info ℹ️')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId("question")
              .setLabel('Question ❓')
              .setStyle(ButtonStyle.Primary),
        );
        

        //console.log("---------\nCREATE BAN, WARN, DELETE, AND INFO BUTTONS!!!---------");
        let img;

        if(path !== null) {
          img = await channel.send({content: id, files: [path], components: [row] });
        } else {
          img = await channel.send({content: id, components: [row] });
        }

        /*
        try {
          await img.react("🔨");
          await img.react("⚠️");
          await img.react("❌");
          await img.react("ℹ️");
        } catch (e) {
          console.log(e);
        }
        */

        if(path !== null) return [img.attachments.first().url, img.id, channel.id];
        return [img.id, channel.id];
      } catch (e) {
        console.log(e);
        return false;
      }
    }
  }

  path = path.replace(/\\/g, "/");

  if (uploadTo === "discord") {
    // DISCORD UPLOAD START
    let status;
    console.log("FIND");
    const result = await client.shard.broadcastEval(f, {
      context: { id: specialID, path: path },
    });

    result.forEach((m) => {
      if (m) {
        status = m;
      }
    });

    if (!status) {
      console.log(`[UPLOAD ERROR] Failed to upload to discord`);
      //console.log(e);
      await interactionUpdate({interaction: interaction, description: "Error uploading image."});
      try {
        await fs.unlinkSync(path);
        await fs.rmdirSync(`${__dirname}/../images/${interaction.id}`);
      } catch (e) {
        console.log(`[UNLINK ERROR] ${e.toString()}`);
        //console.log(e);
      }
      return;
    }

    await interactionUpdate({interaction: interaction, title: `${imageName}.png`, description: `Download in higher definition using:\n\`/download ${specialID}\`\n[Click here if image doesn't load](${status[0]})`, "url": status[0], "footer": `Image ID: ${specialID}`});

    imgData = JSON.parse(fs.readFileSync(`${__dirname}/imgData.json`));

    if(!imgData[specialID.toLowerCase().replace(/\-/g, "")]) {
      imgData[specialID.toLowerCase().replace(/\-/g, "")] = {};
    }

    imgData[specialID.toLowerCase().replace(/\-/g, "")].discordImgID = status[1];
    fs.writeFileSync(`${__dirname}/imgData.json`, JSON.stringify(imgData));

    //sendMessage.edit(img.attachments.first().url); // discord message
    //console.log(specialID);
    //console.log(imageName);

    // UPLOAD TO 3RD PARTY
    try {
      server = await axios.get("https://api.gofile.io/getServer");
      //console.log(server.data.data);
    } catch (e) {
      //console.log(e);
      failedUpload(specialID, path, interaction, callback);
      return;
    }
    //console.log(server.data);
    if (server.data.status !== "ok") {
      failedUpload(specialID, path, interaction, callback);
      return;
    }

    try {
      file = fs.createReadStream(path);

      const form = new FormData();
      form.append("token", config.GOFILETOKEN);
      form.append("file", file);

      upload = await axios({
        method: "post",
        url: `https://${server.data.data.server}.gofile.io/uploadFile`,
        data: form,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          "content-type": `multipart/form-data; boundary=${form._boundary}`,
        },
      });
    } catch (e) {
      console.log(`[UPLOAD FAILED] ${e.toString()}`);
      failedUpload(specialID, path, interaction, callback);
      return;
    }

    //console.log(upload.data)
    if (upload.data.status !== "ok") {
      failedUpload(specialID, path, interaction, callback);
      return;
    }


    imgData = JSON.parse(fs.readFileSync(`${__dirname}/imgData.json`));

    if(!imgData[specialID.toLowerCase().replace(/\-/g, "")]) {
      imgData[specialID.toLowerCase().replace(/\-/g, "")] = {};
    }

    imgData[specialID.toLowerCase().replace(/\-/g, "")].link = `https://gofile.io/d/${upload.data.data.code}`;
    imgData[specialID.toLowerCase().replace(/\-/g, "")].fileId =
      upload.data.data.fileId;
    imgData[specialID.toLowerCase().replace(/\-/g, "")].folderId =
      upload.data.data.parentFolder;
    fs.writeFileSync(`${__dirname}/imgData.json`, JSON.stringify(imgData));

    //console.log(imgData)

    //console.log('Deleting after upload');
    try {
      await fs.unlinkSync(path);
      await fs.rmdirSync(`${__dirname}/../images/${interaction.id}`);
    } catch (e) {
      //console.log(e);
      console.log(`[UNLINK ERROR] ${e.toString()}`);
    }
    callback(imageName, "false");
    return;
  } else {
    // DISCORD UPLOAD END
    // 3RD PARTY UPLOAD START
    try {
      try {
        server = await axios.get("https://api.gofile.io/getServer");
      } catch (e) {
        //console.log(e);
        failedUpload(specialID, path, interaction, callback);
        await interactionUpdate({interaction: interaction, description: "Error uploading image."});
        return;
      }
      //console.log(server.data);
      if (server.data.status !== "ok") {
        failedUpload(specialID, path, interaction, callback);
        await interactionUpdate({interaction: interaction, description: "Error uploading image."});
        return;
      }

      file = fs.createReadStream(path);

      const form = new FormData();
      form.append("token", config.GOFILETOKEN);
      form.append("file", file);

      upload = await axios({
        method: "post",
        url: `https://${server.data.data.server}.gofile.io/uploadFile`,
        data: form,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          "content-type": `multipart/form-data; boundary=${form._boundary}`,
        },
      });
    } catch (e) {
      //console.log(e);
      console.log(`[UPLOAD ERROR] ${e.toString()}`);
      failedUpload(specialID, path, interaction, callback);
      await interactionUpdate({interaction: interaction, description: "Error uploading image."});
      return;
    }

    //console.log(upload.data)
    if (upload.data.status !== "ok") {
      failedUpload(specialID, path, interaction, callback);
      await interactionUpdate({interaction: interaction, description: "Error uploading image."});
      return;
    }

    imgData = JSON.parse(fs.readFileSync(`${__dirname}/imgData.json`));

    if(!imgData[specialID.toLowerCase().replace(/\-/g, "")]) {
      imgData[specialID.toLowerCase().replace(/\-/g, "")] = {};
    }

    imgData[
      specialID.toLowerCase().replace(/\-/g, "")
    ].link = `https://gofile.io/d/${upload.data.data.code}`;
    imgData[specialID.toLowerCase().replace(/\-/g, "")].fileId =
      upload.data.data.fileId;
    imgData[specialID.toLowerCase().replace(/\-/g, "")].folderId =
      upload.data.data.parentFolder;

    let status;
        
    try {
      const result = await client.shard.broadcastEval(f, {
        context: { id: specialID, path: null },
      });

      result.forEach((m) => {
        if (m) {
          status = m;
        }
      });

    } catch(err) {
      console.log(err);
    }

    imgData[specialID.toLowerCase().replace(/\-/g, "")].discordImgID = status[0];

    fs.writeFileSync(`${__dirname}/imgData.json`, JSON.stringify(imgData));

    await interactionUpdate({interaction: interaction, title: `${imageName}.png`, description: `https://gofile.io/d/${upload.data.data.code}`, footer: `Image ID: ${specialID}`});

    try {
      await fs.unlinkSync(path);
      await fs.rmdirSync(`${__dirname}/../images/${interaction.id}`);
    } catch (e) {
      console.log(`[UNLINK ERROR] ${e.toString()}`);
      //console.log(e);
    }


    callback(imageName, "false");
    return;
  } // 3RD PARTY UPLOAD END
}

async function failedUpload(specialID, path, interaction, callback) {
  imgData = JSON.parse(fs.readFileSync(`${__dirname}/imgData.json`));

  if(!imgData[specialID.toLowerCase().replace(/\-/g, "")]) {
    imgData[specialID.toLowerCase().replace(/\-/g, "")] = {};
  }

  imgData[specialID.toLowerCase().replace(/\-/g, "")].link = "failed";
  fs.writeFileSync(`${__dirname}/imgData.json`, JSON.stringify(imgData));
  try {
    //await file.destroy();
    await fs.unlinkSync(path);
    await fs.rmdirSync(`${__dirname}/../images/${interaction.id}`);
  } catch (e) {
    console.log(`[UNLINK ERROR] ${e.toString()}`);
    //console.log(e);
  }
  callback(undefined, "true");
}

module.exports = { uploadImg: uploadImg };
