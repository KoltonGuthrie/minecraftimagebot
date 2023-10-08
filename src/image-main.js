//const Jimp = require('jimp');
var fs = require("fs-extra");
const Discord = require("discord.js");
const { Image } = require("image-js");
const axios = require("axios");
const cp = require("child_process");
const { interactionReply, interactionUpdate } = require("./embed");
const { addImage, updateImage, updateUser, deleteImage } = require('./database');

var blockSize = 16;

async function make(json) {
  //console.log("Started make()");

  // interaction, downloadURL, quality, width, height, callback
  let interaction = json.interaction;
  let downloadURL = json.downloadURL;
  let quality = json.quality;
  let width = json.width;
  let height = json.height;
  let callback = json.callback;

  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let specialID = [...Array(12)]
    .map((i) => chars[(Math.random() * chars.length) | 0])
    .join("")
    .match(/.{1,4}/g)
    .join("-");

  await addImage({
    id: specialID.toLowerCase().replace(/\-/g, ""),
    time: (new Date().getTime()),
    name: downloadURL.split("/").pop().split(".")[0].split("#")[0].split("?")[0],
    author: interaction.user.id,
    channel: interaction.channel.id,
    interaction: interaction.id,
    link: "uploading",
  });  
  /*
  let imgData = JSON.parse(fs.readFileSync(`${__dirname}/imgData.json`));

  imgData[specialID.toLowerCase().replace(/\-/g, "")] = {
    time: new Date().getTime(),
    name: downloadURL.split("/").pop().split(".")[0].split("#")[0].split("?")[0],
    author: interaction.user.id,
    channel: interaction.channel.id,
    interaction: interaction.id,
    link: "uploading",
  };

  fs.writeFileSync(`${__dirname}/imgData.json`, JSON.stringify(imgData));
  */

  let maxSize = 0;

  switch (quality) {
    case 1:
      maxSize = 10;
      quality = "Low";
      break;
    case 2:
      maxSize = 5;
      quality = "Average";
      break;
    case 3:
      maxSize = 2;
      quality = "High";
      break;
    default:
      maxSize = 5;
      quality = "Average";
  }

   await  getImage(
    { "interaction": interaction, "downloadURL": downloadURL, "quality": quality, "width": width, "height": height, "maxSize": maxSize, "specialID": specialID, "callback": callback }
    );
}

async function getImage(json)
  {
  //console.log("Started getImage()");
  let interaction = json.interaction;
  let downloadURL = json.downloadURL;
  let quality = json.quality;
  let width = json.width;
  let height = json.height;
  let maxSize = json.maxSize;
  let specialID = json.specialID;
  let callback = json.callback;

  //console.log('Downloading')
  await interactionUpdate({interaction: interaction, description: `Downloading Image...`, footer: quality});

  /*
let download = function(uri, filename, callback){ // download image function)
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    	if(res.headers['content-type'].includes("text/html")) {
       editMessage(sendMessage, `{"info": "Failed to download image"}`);
    	return;
    	}
    console.log('content-length:', res.headers['content-length']);
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });

};
*/

  const download = async (url, image_path) =>
    axios({
      url,
      responseType: "stream",
    })
      .then(
        (response) =>
          new Promise((resolve, reject) => {
            if (
              !response.data.headers["content-type"].startsWith("image/") ||
              response.data.headers["content-type"].startsWith("image/webp")
            ) {
              resolve(0);
              return;
            }
            response.data
              .pipe(fs.createWriteStream(image_path))
              .on("finish", () => resolve(1))
              .on("error", (e) => resolve(0));
          })
      )
      .catch((e) => {
        console.log(e);
        resolve(0);
      });

  let imageName = downloadURL
    .split("/")
    .pop()
    .split(".")[0]
    .split("#")[0]
    .split("?")[0];

  if (imageName.length >= 130) imageName = imageName.slice(0, 130);

  try {
    //console.log("Started download()");
      const status = await download(downloadURL, `${__dirname}/../tmp/${interaction.id}.png`)

      // download
      if (status !== 1) {
        await sleep(1000);
        await interactionUpdate({interaction: interaction, description: `Failed to download image`});
        return;
      } else {
        //console.log('Done downloading.')
        await scanImage(
          { "pathURL": `${__dirname}/../tmp/${interaction.id}.png`, "interaction": interaction, "downloadURL": downloadURL, "quality": quality, "width": width, "height": height, "imageName": imageName, "maxSize": maxSize, "specialID": specialID, "callback": callback }
        );
      }

  } catch (e) {
    // Unlink the file if it fails to download
    try {
      fs.unlinkSync(`${__dirname}/../tmp/${interaction.id}.png`);
    } catch(err) {}

    console.log(`[DOWNLOAD ERROR] ${e.toString()}`);
    await sleep(1000);
    await interactionUpdate({interaction: interaction, description: `Failed to download image`});
    return;
  }
}

async function scanImage(json) {
  //console.log("Started scanImage");
  let pathURL = json.pathURL;
  let interaction = json.interaction;
  let downloadURL = json.downloadURL;
  let quality = json.quality;
  let w = json.width;
  let h = json.height;
  let imageName = json.imageName;
  let maxSize = json.maxSize;
  let specialID = json.specialID;
  let callback = json.callback;

  let runs = 0;
  let colors = JSON.parse(fs.readFileSync(`${__dirname}/savedBlocks.json`));

  //console.log(pathURL)
  let nearestColor = require("nearest-color").from(colors);

  let pixels = []; // make pixel array

  //mainImage = await Image.load(`${dirname}/colors.png`) // read imaage
  try {
    mainImage = await Image.load(pathURL);
  } catch (err) {
    if (err.toString().includes("Unsupported filter")) {
      await interactionUpdate({interaction: interaction, description: `:x: Error. Image may be corrupt. Try using a different image`});
    } else if (err.toString().includes("maxResolutionInMP limit exceeded")) {
      await interactionUpdate({interaction: interaction, description: `:x: Error. Image may be too large. Try using a different image`});
    } else {
      await interactionUpdate({interaction: interaction, description: ":x: Image must be a **.png** or a **.jpg**"});
    }

    try {
      fs.unlinkSync(pathURL);
    } catch(e) {}

    await updateUser({id: interaction.user.id, key: 'queueTime', value: 0});
    await deleteImage({id: specialID.toLowerCase().replace(/\-/g, "")});
    /*
    let queue = JSON.parse(fs.readFileSync(`${__dirname}/imgQueue.json`));
    queue[interaction.guild.id] = 0;
    fs.writeFileSync(`${__dirname}/imgQueue.json`, JSON.stringify(queue));

    let imgData = JSON.parse(fs.readFileSync(`${__dirname}/imgData.json`));
    delete imgData[specialID.toLowerCase().replace(/\-/g, "")];
    fs.writeFileSync(`${__dirname}/imgData.json`, JSON.stringify(imgData));
    */

    console.log(
      `[ERROR] Image was not supported. URL: ${downloadURL} Path: ${pathURL}`
    );
    return;
  }

  // get with and height
  let width = mainImage.width;
  let height = mainImage.height;

  let normalDisplay = 750;

  if(w === null && h === null) { // There was no custom width or height set
    if (width < height) {
      mainImage = await mainImage.resize({
        width: Math.floor(normalDisplay / (height / width)),
        height: normalDisplay,
        preserveAspectRatio: true,
      });
    } else {
      mainImage = await mainImage.resize({
        width: normalDisplay,
        height: Math.floor(normalDisplay / (width / height)),
        preserveAspectRatio: true,
      });
    }
  } else { // There WAS a custom width or height set
    maxSize = 16;

    const MAX_SIZE = 350 * blockSize;

    mainImage = await mainImage.resize({
      width: w === null ? mainImage.width > MAX_SIZE ? MAX_SIZE * blockSize : mainImage.width : w * blockSize,
      height: h === null ? mainImage.height > MAX_SIZE ? MAX_SIZE * blockSize : mainImage.height : h * blockSize,
      preserveAspectRatio: true,
    });

  }

  // get with and height
  width = mainImage.width;
  height = mainImage.height;

  // get how many slizes
  let widthSlices = Math.floor(mainImage.width / blockSize);
  let heightSlices = Math.floor(mainImage.height / blockSize);

  // set the Pos
  let widthPos = 0;
  let heightPos = 0;

  let totalPixels = mainImage.height * mainImage.width;

  await makeWorker(
    {"amount": 1, "mainImage": mainImage, "interaction": interaction, "quality": quality, "imageName": imageName, "maxSize": maxSize, "specialID": specialID, "callback": callback}
  );
}
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

async function makeWorker(json) {
  //console.log("Started makeWorker()");
  let amount = json.amount;
  let mainImage = json.mainImage;
  let interaction = json.interaction;
  let quality = json.quality;
  let imageName = json.imageName;
  let maxSize = json.maxSize;
  let specialID = json.specialID;
  let callback = json.callback;

  let w = mainImage.width;
  let totalPixels =
    (mainImage.width / amount - ((mainImage.width / amount) % blockSize)) *
    amount *
    mainImage.height;

  let amountDone = 0;
  let oldWPos = 0;
  await interactionUpdate({interaction: interaction, description: `Running...`, footer: quality});
  for (i = 0; amount > i; i++) {
    await mainImage.save(`${__dirname}/../tmp/${interaction.id}_tmp.png`);
    oldWPos += w / amount - ((w / amount) % blockSize);

    let path = `${__dirname}/../tmp/${interaction.id}_tmp.png`.replace(/\\/g, "/");

    await makeImage(
      {"path": path, "blockSize": blockSize, "interaction": interaction, "imageName": imageName, "quality": quality, "maxSize": maxSize, "specialID": specialID, "callback": callback, "anothercallback":
    
      async function( json ) {
        await finished( {"amount": json.amount, "interaction": json.interaction, "imageName": json.imageName, "quality": json.quality, "specialID": json.specialID, "callback": json.callback } );
      }

    }
      /*
      path,
      blockSize,
      interaction,
      imageName,
      quality,
      maxSize,
      specialID,
      callback,
      function (
        amount,
        interaction,
        imageName,
        quality,
        specialID,
        callback
      ) {
        finished(
          amount,
          interaction,
          imageName,
          quality,
          specialID,
          callback
        );
      }
      */
    );
  }
}

async function makeImage(json) {
  //console.log("Started makeImage()");
  let path = json.path;
  let blockSize = json.blockSize;
  let interaction = json.interaction;
  let imageName = json.imageName;
  let quality = json.quality;
  let maxSize = json.maxSize;
  let specialID = json.specialID;
  let callback = json.callback;
  let anothercallback = json.anothercallback;

  // MAKE THREAD SENDING PATH

  const makeImagePromise = (path, maxSize, interactionId, imageName) => {
    return new Promise((resolve, reject) => {
      const maker = cp.fork(`${__dirname}/image-maker.js`, [
        path,
        maxSize,
        interactionId,
        imageName,
      ]);
  
      maker.on("message", async (msg) => {
        // Process the received message
        try {
          // You can perform any necessary processing here
          // and then resolve the promise with the desired result
          if (msg[0].toLowerCase().startsWith("done")) {
            resolve({"amount": 1, "interaction": interaction, "imageName": imageName, "quality": quality, "specialID": specialID, "callback": callback });
          } else {
            resolve({"interaction": interaction, "description": msg[0]});
            console.log(`[WORKER ERROR] ${msg[0]}`);
            return;
          }
        } catch (error) {
          // If an error occurs during processing, reject the promise
          reject(error);
        }
      });
  
      // Handle errors during fork creation
      maker.on("error", (error) => {
        reject(error);
      });
  
      // Handle process exit
      maker.on("exit", (code) => {
        if (code !== 0) {
          reject(new Error(`Child process exited with code ${code}`));
        }
      });
    });
  };

  try {
    const msg = await makeImagePromise(path, maxSize, interaction.id, imageName);
    
    if(msg?.description) {
      await interactionUpdate({"interaction": msg.interaction, "description": msg.description});
    } else {
      console.log(msg);
      await anothercallback(msg);
      return;
    }

  } catch (err) {
    console.error(err);
    await interactionUpdate({interaction: interaction, description: `Failed to convert image.`});
    return;
  }


  /*
  const maker = cp.fork(`${__dirname}/image-maker.js`, [
    path,
    maxSize,
    interaction.id,
    imageName,
  ]);

  maker.on("message", async (msg) => {
    //console.log(msg);

    if (msg[0].toLowerCase().startsWith("done")) {
      //console.log('FINISHED MAKING IMAGE');
      //console.log(msg)
      await anothercallback(
        {"amount": 1, "interaction": interaction, "imageName": imageName, "quality": quality, "specialID": specialID, "callback": callback }
        );
    } else {
      await interactionUpdate({interaction: interaction, description: msg[0]});
      console.log(`[WORKER ERROR] ${msg[0]}`);
      return;
    }
  });
  */
}

async function finished(json) {
  //console.log("Started finished()");
  let amount = json.amount;
  let interaction = json.interaction;
  let imageName = json.imageName;
  let quality = json.quality;
  let specialID = json.specialID;
  let callback = json.callback;

  //console.log(message.id)
  try {
    //console.log(`Stitching images together...`)
    let mcImage = await Image.load(`${__dirname}/../tmp/${interaction.id}_tmp.png`);

    //console.log(`Uploading Image...`);
    await interactionUpdate({interaction: interaction, description: "Uploading Image...", footer: quality});

    if (!fs.existsSync(`$${__dirname}/../images/${interaction.id}`)) {
      fs.mkdirSync(`${__dirname}/../images/${interaction.id}`);
    }
    await mcImage.save(`${__dirname}/../images/${interaction.id}/${imageName}.png`);

    await deleteOldFiles(
      {"amount": amount, "savedID": interaction.id, "callback": callback, "path": `${__dirname}/../images/${interaction.id}/${imageName}.png`, "specialID": specialID, "imageName": imageName}
    );

    //console.log(`100.00%`);
    //console.log("DONE");
  } catch (err) {
    console.log(err);
  }
}

async function deleteOldFiles(json) {
  //console.log("Started deleteOldFiles()");
  let amount = json.amount;
  let savedID = json.savedID;
  let callback = json.callback;
  let path = json.path;
  let specialID = json.specialID;
  let imageName = json.imageName;
  
  //console.log(`Deleting old files...`);

  try {
    fs.unlinkSync(`${__dirname}/../tmp/${savedID}.png`);
  } catch(e) {
    console.log(`[DELETE ERROR] ${__dirname}/../tmp/${savedID}.png | ${e.toString()}`);
  }

  try {
    fs.unlinkSync(`${__dirname}/../tmp/${savedID}_tmp.png`);
  } catch (e) {
    console.log(`[DELETE ERROR] ${__dirname}/../tmp/${savedID}_tmp.png | ${e.toString()}`);
  }
  
  await callback(path, specialID, imageName);
}

module.exports = { make: make };