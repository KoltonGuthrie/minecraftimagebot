"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

//const Jimp = require('jimp');
var fs = require("fs-extra");

var Discord = require("discord.js");

var _require = require("image-js"),
    Image = _require.Image;

var axios = require("axios");

var cp = require("child_process");

var _require2 = require("./embed"),
    interactionReply = _require2.interactionReply,
    interactionUpdate = _require2.interactionUpdate;

var blockSize = 16;

function make(json) {
  var interaction, downloadURL, quality, width, height, callback, chars, specialID, imgData, maxSize;
  return regeneratorRuntime.async(function make$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          // interaction, downloadURL, quality, width, height, callback
          interaction = json.interaction;
          downloadURL = json.downloadURL;
          quality = json.quality;
          width = json.width;
          height = json.height;
          callback = json.callback;
          chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
          specialID = _toConsumableArray(Array(12)).map(function (i) {
            return chars[Math.random() * chars.length | 0];
          }).join("").match(/.{1,4}/g).join("-");
          imgData = JSON.parse(fs.readFileSync("".concat(__dirname, "/imgData.json")));
          imgData[specialID.toLowerCase().replace(/\-/g, "")] = {
            time: new Date().getTime(),
            name: downloadURL.split("/").pop().split(".")[0].split("#")[0].split("?")[0],
            author: interaction.user.id,
            channel: interaction.channel.id,
            interaction: interaction.id,
            link: "uploading"
          };
          fs.writeFileSync("".concat(__dirname, "/imgData.json"), JSON.stringify(imgData));
          maxSize = 0;
          _context.t0 = quality;
          _context.next = _context.t0 === 1 ? 15 : _context.t0 === 2 ? 18 : _context.t0 === 3 ? 21 : 24;
          break;

        case 15:
          maxSize = 5;
          quality = "Low";
          return _context.abrupt("break", 26);

        case 18:
          maxSize = 4;
          quality = "Average";
          return _context.abrupt("break", 26);

        case 21:
          maxSize = 2;
          quality = "High";
          return _context.abrupt("break", 26);

        case 24:
          maxSize = 4;
          quality = "Average";

        case 26:
          getImage({
            "interaction": interaction,
            "downloadURL": downloadURL,
            "quality": quality,
            "width": width,
            "height": height,
            "maxSize": maxSize,
            "specialID": specialID,
            "callback": callback
          });

        case 27:
        case "end":
          return _context.stop();
      }
    }
  });
}

function getImage(json) {
  var interaction, downloadURL, quality, width, height, maxSize, specialID, callback, download, imageName;
  return regeneratorRuntime.async(function getImage$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          interaction = json.interaction;
          downloadURL = json.downloadURL;
          quality = json.quality;
          width = json.width;
          height = json.height;
          maxSize = json.maxSize;
          specialID = json.specialID;
          callback = json.callback; //console.log('Downloading')

          _context3.next = 10;
          return regeneratorRuntime.awrap(interactionUpdate({
            interaction: interaction,
            description: "Downloading Image...",
            footer: quality
          }));

        case 10:
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
          download = function download(url, image_path, callback) {
            return axios({
              url: url,
              responseType: "stream"
            }).then(function (response) {
              return new Promise(function (resolve, reject) {
                if (!response.data.headers["content-type"].startsWith("image/") || response.data.headers["content-type"].startsWith("image/webp")) {
                  callback(0);
                  return;
                }

                response.data.pipe(fs.createWriteStream(image_path)).on("finish", function () {
                  return callback(1);
                }).on("error", function (e) {
                  return callback(0);
                });
              });
            })["catch"](function (e) {
              console.log(e);
              callback(0);
            });
          };

          imageName = downloadURL.split("/").pop().split(".")[0].split("#")[0].split("?")[0];
          if (imageName.length >= 130) imageName = imageName.slice(0, 130);
          _context3.prev = 13;
          download(downloadURL, "".concat(__dirname, "/../tmp/").concat(interaction.id, ".png"), function _callee(status) {
            return regeneratorRuntime.async(function _callee$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    if (!(status !== 1)) {
                      _context2.next = 8;
                      break;
                    }

                    _context2.next = 3;
                    return regeneratorRuntime.awrap(sleep(1000));

                  case 3:
                    _context2.next = 5;
                    return regeneratorRuntime.awrap(interactionUpdate({
                      interaction: interaction,
                      description: "Failed to download image"
                    }));

                  case 5:
                    return _context2.abrupt("return");

                  case 8:
                    //console.log('Done downloading.')
                    scanImage({
                      "pathURL": "".concat(__dirname, "/../tmp/").concat(interaction.id, ".png"),
                      "interaction": interaction,
                      "downloadURL": downloadURL,
                      "quality": quality,
                      "width": width,
                      "height": height,
                      "imageName": imageName,
                      "maxSize": maxSize,
                      "specialID": specialID,
                      "callback": callback
                    });

                  case 9:
                  case "end":
                    return _context2.stop();
                }
              }
            });
          });
          _context3.next = 26;
          break;

        case 17:
          _context3.prev = 17;
          _context3.t0 = _context3["catch"](13);

          // Unlink the file if it fails to download
          try {
            fs.unlinkSync("".concat(__dirname, "/../tmp/").concat(interaction.id, ".png"));
          } catch (err) {}

          console.log("[DOWNLOAD ERROR] ".concat(_context3.t0.toString()));
          _context3.next = 23;
          return regeneratorRuntime.awrap(sleep(1000));

        case 23:
          _context3.next = 25;
          return regeneratorRuntime.awrap(interactionUpdate({
            interaction: interaction,
            description: "Failed to download image"
          }));

        case 25:
          return _context3.abrupt("return");

        case 26:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[13, 17]]);
}

function scanImage(json) {
  var pathURL, interaction, downloadURL, quality, w, h, imageName, maxSize, specialID, callback, runs, colors, nearestColor, pixels, queue, imgData, width, height, normalDisplay, MAX_SIZE, widthSlices, heightSlices, widthPos, heightPos, totalPixels;
  return regeneratorRuntime.async(function scanImage$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          pathURL = json.pathURL;
          interaction = json.interaction;
          downloadURL = json.downloadURL;
          quality = json.quality;
          w = json.width;
          h = json.height;
          imageName = json.imageName;
          maxSize = json.maxSize;
          specialID = json.specialID;
          callback = json.callback;
          runs = 0;
          colors = JSON.parse(fs.readFileSync("".concat(__dirname, "/savedBlocks.json"))); //console.log(pathURL)

          nearestColor = require("nearest-color").from(colors);
          pixels = []; // make pixel array
          //mainImage = await Image.load(`${dirname}/colors.png`) // read imaage

          _context4.prev = 14;
          _context4.next = 17;
          return regeneratorRuntime.awrap(Image.load(pathURL));

        case 17:
          mainImage = _context4.sent;
          _context4.next = 43;
          break;

        case 20:
          _context4.prev = 20;
          _context4.t0 = _context4["catch"](14);

          if (!_context4.t0.toString().includes("Unsupported filter")) {
            _context4.next = 27;
            break;
          }

          _context4.next = 25;
          return regeneratorRuntime.awrap(interactionUpdate({
            interaction: interaction,
            description: ":x: Error. Image may be corrupt. Try using a different image"
          }));

        case 25:
          _context4.next = 34;
          break;

        case 27:
          if (!_context4.t0.toString().includes("maxResolutionInMP limit exceeded")) {
            _context4.next = 32;
            break;
          }

          _context4.next = 30;
          return regeneratorRuntime.awrap(interactionUpdate({
            interaction: interaction,
            description: ":x: Error. Image may be too large. Try using a different image"
          }));

        case 30:
          _context4.next = 34;
          break;

        case 32:
          _context4.next = 34;
          return regeneratorRuntime.awrap(interactionUpdate({
            interaction: interaction,
            description: ":x: Image must be a **.png** or a **.jpg**"
          }));

        case 34:
          try {
            fs.unlinkSync(pathURL);
          } catch (e) {}

          queue = JSON.parse(fs.readFileSync("".concat(__dirname, "/imgQueue.json")));
          queue[interaction.guild.id] = 0;
          fs.writeFileSync("".concat(__dirname, "/imgQueue.json"), JSON.stringify(queue));
          imgData = JSON.parse(fs.readFileSync("".concat(__dirname, "/imgData.json")));
          delete imgData[specialID.toLowerCase().replace(/\-/g, "")];
          fs.writeFileSync("".concat(__dirname, "/imgData.json"), JSON.stringify(imgData));
          console.log("[ERROR] Image was not supported. URL: ".concat(downloadURL, " Path: ").concat(pathURL));
          return _context4.abrupt("return");

        case 43:
          // get with and height
          width = mainImage.width;
          height = mainImage.height;
          normalDisplay = 750;

          if (!(w === null && h === null)) {
            _context4.next = 58;
            break;
          }

          if (!(width < height)) {
            _context4.next = 53;
            break;
          }

          _context4.next = 50;
          return regeneratorRuntime.awrap(mainImage.resize({
            width: Math.floor(normalDisplay / (height / width)),
            height: normalDisplay,
            preserveAspectRatio: true
          }));

        case 50:
          mainImage = _context4.sent;
          _context4.next = 56;
          break;

        case 53:
          _context4.next = 55;
          return regeneratorRuntime.awrap(mainImage.resize({
            width: normalDisplay,
            height: Math.floor(normalDisplay / (width / height)),
            preserveAspectRatio: true
          }));

        case 55:
          mainImage = _context4.sent;

        case 56:
          _context4.next = 63;
          break;

        case 58:
          // There WAS a custom width or height set
          maxSize = 16;
          MAX_SIZE = 350 * blockSize;
          _context4.next = 62;
          return regeneratorRuntime.awrap(mainImage.resize({
            width: w === null ? mainImage.width > MAX_SIZE ? MAX_SIZE * blockSize : mainImage.width : w * blockSize,
            height: h === null ? mainImage.height > MAX_SIZE ? MAX_SIZE * blockSize : mainImage.height : h * blockSize,
            preserveAspectRatio: true
          }));

        case 62:
          mainImage = _context4.sent;

        case 63:
          // get with and height
          width = mainImage.width;
          height = mainImage.height; // get how many slizes

          widthSlices = Math.floor(mainImage.width / blockSize);
          heightSlices = Math.floor(mainImage.height / blockSize); // set the Pos

          widthPos = 0;
          heightPos = 0;
          totalPixels = mainImage.height * mainImage.width;
          makeWorker({
            "amount": 1,
            "mainImage": mainImage,
            "interaction": interaction,
            "quality": quality,
            "imageName": imageName,
            "maxSize": maxSize,
            "specialID": specialID,
            "callback": callback
          });

        case 71:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[14, 20]]);
}

var sleep = function sleep(delay) {
  return new Promise(function (resolve) {
    return setTimeout(resolve, delay);
  });
};

function makeWorker(json) {
  var amount, mainImage, interaction, quality, imageName, maxSize, specialID, callback, w, totalPixels, amountDone, oldWPos, path;
  return regeneratorRuntime.async(function makeWorker$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          amount = json.amount;
          mainImage = json.mainImage;
          interaction = json.interaction;
          quality = json.quality;
          imageName = json.imageName;
          maxSize = json.maxSize;
          specialID = json.specialID;
          callback = json.callback;
          w = mainImage.width;
          totalPixels = (mainImage.width / amount - mainImage.width / amount % blockSize) * amount * mainImage.height;
          amountDone = 0;
          oldWPos = 0;
          _context5.next = 14;
          return regeneratorRuntime.awrap(interactionUpdate({
            interaction: interaction,
            description: "Running...",
            footer: quality
          }));

        case 14:
          i = 0;

        case 15:
          if (!(amount > i)) {
            _context5.next = 24;
            break;
          }

          _context5.next = 18;
          return regeneratorRuntime.awrap(mainImage.save("".concat(__dirname, "/../tmp/").concat(interaction.id, "_tmp.png")));

        case 18:
          oldWPos += w / amount - w / amount % blockSize;
          path = "".concat(__dirname, "/../tmp/").concat(interaction.id, "_tmp.png").replace(/\\/g, "/");
          makeImage({
            "path": path,
            "blockSize": blockSize,
            "interaction": interaction,
            imageName: imageName,
            quality: quality,
            maxSize: maxSize,
            specialID: specialID,
            callback: callback,
            anothercallback: function anothercallback(_ref) {
              var amount = _ref["amount"],
                  interaction = _ref["interaction"],
                  imageName = _ref["imageName"],
                  quality = _ref["quality"],
                  specialID = _ref["specialID"],
                  callback = _ref["callback"];
              finished({
                "amount": amount,
                "interaction": interaction,
                "imageName": imageName,
                "quality": quality,
                "specialID": specialID,
                "callback": callback
              });
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

        case 21:
          i++;
          _context5.next = 15;
          break;

        case 24:
        case "end":
          return _context5.stop();
      }
    }
  });
}

function makeImage(path, blockSize, interaction, imageName, quality, maxSize, specialID, callback, anothercallback) {
  var maker;
  return regeneratorRuntime.async(function makeImage$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          // MAKE THREAD SENDING PATH
          maker = cp.fork("".concat(__dirname, "/image-maker.js"), [path, maxSize, interaction.id, imageName]);
          maker.on("message", function _callee2(msg) {
            return regeneratorRuntime.async(function _callee2$(_context6) {
              while (1) {
                switch (_context6.prev = _context6.next) {
                  case 0:
                    if (!msg[0].toLowerCase().startsWith("done")) {
                      _context6.next = 4;
                      break;
                    }

                    //console.log('FINISHED MAKING IMAGE');
                    //console.log(msg)
                    anothercallback(1, interaction, imageName, quality, specialID, callback);
                    _context6.next = 8;
                    break;

                  case 4:
                    _context6.next = 6;
                    return regeneratorRuntime.awrap(interactionUpdate({
                      interaction: interaction,
                      description: msg[0]
                    }));

                  case 6:
                    console.log("[WORKER ERROR] ".concat(msg[0]));
                    return _context6.abrupt("return");

                  case 8:
                  case "end":
                    return _context6.stop();
                }
              }
            });
          });

        case 2:
        case "end":
          return _context7.stop();
      }
    }
  });
}

function finished(amount, interaction, imageName, quality, specialID, callback) {
  var mcImage;
  return regeneratorRuntime.async(function finished$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          _context8.prev = 0;
          _context8.next = 3;
          return regeneratorRuntime.awrap(Image.load("".concat(__dirname, "/../tmp/").concat(interaction.id, "_tmp.png")));

        case 3:
          mcImage = _context8.sent;
          _context8.next = 6;
          return regeneratorRuntime.awrap(interactionUpdate({
            interaction: interaction,
            description: "Uploading Image...",
            footer: quality
          }));

        case 6:
          if (!fs.existsSync("$".concat(__dirname, "/../images/").concat(interaction.id))) {
            fs.mkdirSync("".concat(__dirname, "/../images/").concat(interaction.id));
          }

          _context8.next = 9;
          return regeneratorRuntime.awrap(mcImage.save("".concat(__dirname, "/../images/").concat(interaction.id, "/").concat(imageName, ".png")));

        case 9:
          _context8.next = 11;
          return regeneratorRuntime.awrap(deleteOldFiles(amount, interaction.id, callback, "".concat(__dirname, "/../images/").concat(interaction.id, "/").concat(imageName, ".png"), specialID, imageName));

        case 11:
          _context8.next = 16;
          break;

        case 13:
          _context8.prev = 13;
          _context8.t0 = _context8["catch"](0);
          console.log(_context8.t0);

        case 16:
        case "end":
          return _context8.stop();
      }
    }
  }, null, null, [[0, 13]]);
}

function deleteOldFiles(amount, savedID, callback, path, specialID, imageName) {
  return regeneratorRuntime.async(function deleteOldFiles$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          //console.log(`Deleting old files...`);
          try {
            fs.unlinkSync("".concat(__dirname, "/../tmp/").concat(savedID, ".png"));
          } catch (e) {
            console.log("[DELETE ERROR] ".concat(__dirname, "/../tmp/").concat(savedID, ".png | ").concat(e.toString()));
          }

          try {
            fs.unlinkSync("".concat(__dirname, "/../tmp/").concat(savedID, "_tmp.png"));
          } catch (e) {
            console.log("[DELETE ERROR] ".concat(__dirname, "/../tmp/").concat(savedID, "_tmp.png | ").concat(e.toString()));
          }

          callback(path, specialID, imageName);

        case 3:
        case "end":
          return _context9.stop();
      }
    }
  });
}

module.exports = {
  make: make
};