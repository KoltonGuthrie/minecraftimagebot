require( 'console-stamp' )( console );
const { Image } = require("image-js");
const cp = require("child_process");
const fs = require("fs");
const axios = require("axios");
const { updateImage } = require(`${__dirname}/database.js`);

(async () => {
  //console.log(process.argv)

  let path = process.argv[2];
  let runs = 0;
  let blockSize = process.argv[3];
  let sendMessageID = process.argv[4];
  let imageName = process.argv[5] + ".png";
  let minecraftBlockSize = 16;

  let blocks = JSON.parse(fs.readFileSync(`${__dirname}/savedBlocks.json`));

  // Get all blocks for that mc version
  const MC_VERSION = '1.19';
  blocks = blocks[MC_VERSION];

  // Convert to proper format to get nearestColor
  const colors = {};
  for (const key in blocks) {
      if(key.includes("shulker")) continue; // Shulkers vanish out whenever viewed at a distance in mc
      if(key.includes("tnt")) continue; // Tnt will have the chance to explode in mc!
      if(blocks[key].top !== "true") continue;
      colors[key] = blocks[key].color;
  }

  let nearestColor = require("nearest-color").from(colors);

  let pixels = []; // make pixel array
  let cachedPhotos = new Map();

  for (i = 0; Object.keys(colors).length > i; i++) {
    const key = Object.keys(colors)[i];
    
    let mc = await Image.load(
      `${__dirname}/../versions/${MC_VERSION}/assets/minecraft/textures/block/${key}`
    );
    cachedPhotos.set(key, mc);
  }

  let mainImage = await Image.load(path); // read imaage

  if (mainImage.width - (mainImage.width % blockSize) > blockSize) {
    if (mainImage.height - (mainImage.height % blockSize) > blockSize) {
      if (mainImage.width % blockSize !== 0) {
        mainImage = await mainImage.resize({
          width: mainImage.width - (mainImage.width % blockSize),
          height: mainImage.height,
          preserveAspectRatio: false,
        });
        //console.log('Resized width ' + blockSize)
      }

      if (mainImage.height % blockSize !== 0) {
        mainImage = await mainImage.resize({
          width: mainImage.width,
          height: mainImage.height - (mainImage.height % blockSize),
          preserveAspectRatio: false,
        });
        //console.log('Resized height ' + blockSize)
      }
    } else {
      //console.log("[ERROR] Image is too small");
      process.send(["An error has occurred. Your image may be too small"]);
      return;
    }
  } else {
    //console.log("[ERROR] Image is too small");
    process.send(["An error has occurred. Your image may be too small"]);
    return;
  }

  // get with and height
  let width = mainImage.width;
  let height = mainImage.height;

  //console.log(width);
  //console.log(height)

  let mcImage = new Image(
    Math.floor(mainImage.width / blockSize) * minecraftBlockSize,
    Math.floor(mainImage.height / blockSize) * minecraftBlockSize
  );

  //console.log(mcImage.width);
  //console.log(mcImage.height)

  // get how many slizes
  let widthSlices = Math.floor(mainImage.width / blockSize);
  let heightSlices = Math.floor(mainImage.height / blockSize);

  start = new Date();

  const blockData = {width: widthSlices, height: heightSlices, blocks: []};

  for (let w = 0; widthSlices > w; w++) {
    // loop width
    for (let h = 0; heightSlices > h; h++) {
      // loop height

      let histograms = await mainImage
        .crop({
          x: blockSize * w,
          y: blockSize * h,
          width: blockSize,
          height: blockSize,
        })
        .colorDepth(8)
        .getHistograms({ maxSlots: mainImage.maxValue + 1 });
      let result = new Array(histograms.length);
      for (let c = 0; c < histograms.length; c++) {
        let histogram = histograms[c];
        result[c] = Math.floor(mean(histogram));
      }

      try {
        let blockImage = cachedPhotos.get(nearestColor(rgbToHex(result[0], result[1], result[2])).name);

        blockData.blocks.push({pos: {x: w, y: h} , block: nearestColor(rgbToHex(result[0], result[1], result[2])
        ).name.replace(
          /\.png|_top|_side|_bottom|_front|_end|_inside|_vertical|_open|_back|_on|_honey|_inverted|_lock|_off|_corner|_save|_load|_data|0|1|2|3|4|5|6|7|8|9/g,
          ""
        ) });

        await mcImage.insert(await blockImage, {
          x: minecraftBlockSize * w,
          y: minecraftBlockSize * h,
          inPlace: true,
        });
      } catch (e) {
        console.log(`[IMAGE INSERT ERROR] ${e.toString()}`);
        await process.send([
          `Error creating image. If this continues, report it on our server ${config.supportURL}`,
        ]);
        try {
          fs.unlinkSync(path);
          fs.unlinkSync(path.replace("_tmp", ""));
        } catch {
          console.log(e);
        }
        process.exit();
      }

      runs++;
    }
  }

  end = new Date();

  //console.log(end.getTime() - start.getTime() + "ms\nRuns: " + runs);

  await mcImage.save(path);

  /*
try {
size = getFilesizeInBytes(path).toFixed(2);
fs.writeFileSync(`${__dirname}/data/${messageID}.json`, `{"size":${size}, "width": ${mcImage.width}, "height": ${mcImage.height}, "blockAmount": ${runs}, "name":${imageName}, "blocks":${JSON.stringify(usedBlocks)}}`);
} catch(e) {
    console.log(e);
}
*/

try {

  await updateImage({interaction: sendMessageID, key: 'blockData', value: JSON.stringify(blockData)});

} catch(err) {
  console.error(err);
}
/*
  try {
    size = getFilesizeInBytes(path).toFixed(2);
    const res = await axios.post(
      `https://minecraftimagebot.glitch.me/saveimage`,
      JSON.stringify({
        id: sendMessageID,
        size: size,
        width: mcImage.width,
        height: mcImage.height,
        blockAmount: runs,
        name: imageName,
        blocks: JSON.stringify(usedBlocks),
      }),
      {
        headers: {
          auth: "Q4JsH0mQrWfkTmHJ4pfR",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (e) {
    console.log(e);
  }
  */

  await process.send(["done", path]);
})();

function getFilesizeInBytes(filename) {
  var stats = fs.statSync(filename);
  var fileSizeInBytes = stats["size"] / 1048576;
  return fileSizeInBytes;
}

function sortArr(prop) {
  return function (a, b) {
    if (a[prop] < b[prop]) {
      return 1;
    } else if (a[prop] > b[prop]) {
      return -1;
    }
    return 0;
  };
}

function searchArr(arr, name) {
  for (let i = 0; arr.length > i; i++) {
    if (arr[i].n === name) return true;
  }
  return false;
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function mean(histogram) {
  let total = 0;
  let sum = 0;

  for (let i = 0; i < histogram.length; i++) {
    total += histogram[i];
    sum += histogram[i] * i;
  }
  if (total === 0) {
    return 0;
  }

  return sum / total;
}
