"use strict";

var embed = require("../src/embed");

var _require = require("../src/checkURL"),
    checkurl = _require.checkurl;

var config = require("../config.json");

var _require2 = require('../src/embed'),
    interactionReply = _require2.interactionReply,
    interactionUpdate = _require2.interactionUpdate;

var img = require('../src/image-main');

var upload = require("../src/upload");

var _require3 = require('@discordjs/builders'),
    SlashCommandBuilder = _require3.SlashCommandBuilder;

var fs = require('fs');

function main(interaction, client) {
  var start, delayTimer, quality, width, height, downloadURL, url, checkedUrl, file;
  return regeneratorRuntime.async(function main$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return regeneratorRuntime.awrap(interactionReply({
            interaction: interaction,
            description: ":arrows_clockwise: Loading..."
          }));

        case 3:
          start = _context2.sent;
          delayTimer = 0;
          quality = interaction.options.getInteger('quality') || 2;
          width = interaction.options.getInteger('width') || null;
          height = interaction.options.getInteger('height') || null;
          _context2.t0 = quality;
          _context2.next = _context2.t0 === 1 ? 11 : _context2.t0 === 2 ? 13 : _context2.t0 === 3 ? 15 : 17;
          break;

        case 11:
          delayTimer = 10000;
          return _context2.abrupt("break", 17);

        case 13:
          delayTimer = 20000;
          return _context2.abrupt("break", 17);

        case 15:
          delayTimer = 30000;
          return _context2.abrupt("break", 17);

        case 17:
          if (!(interaction.options.getSubcommand() == "url")) {
            _context2.next = 38;
            break;
          }

          url = interaction.options.getString('url');

          if (!url.match(/^https:\/\/|^http:\/\//)) {
            _context2.next = 33;
            break;
          }

          _context2.next = 22;
          return regeneratorRuntime.awrap(checkurl(url, 2000));

        case 22:
          checkedUrl = _context2.sent;
          console.log(checkedUrl);

          if (!(checkedUrl.status !== 200 || !checkedUrl.type.startsWith("image/") || checkedUrl.type.startsWith("image/webp"))) {
            _context2.next = 28;
            break;
          }

          _context2.next = 27;
          return regeneratorRuntime.awrap(interactionUpdate({
            interaction: interaction,
            description: ":x: Unable to download an image from this url | Reason: ".concat(checkedUrl.reason)
          }));

        case 27:
          return _context2.abrupt("return", start);

        case 28:
          //message.channel.send(`Url worked! ${msg[1]}`);
          downloadURL = "".concat(config.downloadURL).concat(url);
          _context2.next = 31;
          return regeneratorRuntime.awrap(interactionReply({
            interaction: interaction,
            description: "LINK: ".concat(downloadURL)
          }));

        case 31:
          _context2.next = 36;
          break;

        case 33:
          _context2.next = 35;
          return regeneratorRuntime.awrap(interactionReply({
            interaction: interaction,
            description: ":x: Unknown url. Make sure your url begins with https:// or http://"
          }));

        case 35:
          return _context2.abrupt("return", start);

        case 36:
          _context2.next = 46;
          break;

        case 38:
          if (!(interaction.options.getSubcommand() == "file")) {
            _context2.next = 46;
            break;
          }

          file = interaction.options.getAttachment('file');
          console.log(file);

          if (!(!file.attachment.toLowerCase().endsWith(".png") && !file.attachment.toLowerCase().endsWith(".jpg") && !file.attachment.toLowerCase().endsWith(".jpeg") && !file.attachment.toLowerCase().endsWith(".webp"))) {
            _context2.next = 45;
            break;
          }

          _context2.next = 44;
          return regeneratorRuntime.awrap(embed.interactionReply({
            interaction: interaction,
            description: ":x: Uploaded file must be a **.png** or a **.jpg**"
          }));

        case 44:
          return _context2.abrupt("return", start);

        case 45:
          downloadURL = file.attachment;

        case 46:
          if (!(checkQueue(interaction, delayTimer) == 1)) {
            _context2.next = 48;
            break;
          }

          return _context2.abrupt("return", start);

        case 48:
          _context2.next = 50;
          return regeneratorRuntime.awrap(interactionReply({
            interaction: interaction,
            description: "Starting..."
          }));

        case 50:
          fs.writeFileSync("".concat(__dirname, "/../imagesMade.txt"), (Number(fs.readFileSync("".concat(__dirname, "/../imagesMade.txt"))) + 1).toString());
          img.make({
            "interaction": interaction,
            "downloadURL": downloadURL,
            "quality": quality,
            "width": width,
            "height": height,
            "callback": function callback(path, specialID, imageName) {
              return regeneratorRuntime.async(function callback$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      console.log("[MAKE] Done. Size: ".concat(getFilesizeInBytes(path)));

                      if (getFilesizeInBytes(path) <= 7.9) {
                        uploadTo = "discord";
                      } else {
                        uploadTo = "3rdparty";
                      }

                      console.log("[UPLOAD] Uploading to: ".concat(uploadTo));
                      _context.next = 5;
                      return regeneratorRuntime.awrap(upload.uploadImg({
                        "path": path,
                        "interaction": interaction,
                        "uploadTo": uploadTo,
                        "specialID": specialID,
                        "imageName": imageName,
                        "client": client,
                        "callback": function callback(imageName, code) {
                          console.log("[DONE] Finished: ".concat(imageName, " | Failed to upload: ").concat(code));
                          return start;
                        }
                      } // json
                      ));

                    case 5:
                    case "end":
                      return _context.stop();
                  }
                }
              });
            }
          } // json
          );
          _context2.next = 57;
          break;

        case 54:
          _context2.prev = 54;
          _context2.t1 = _context2["catch"](0);
          throw _context2.t1;

        case 57:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 54]]);
}

function getFilesizeInBytes(filename) {
  try {
    var stats = fs.statSync(filename);
    var fileSizeInBytes = stats["size"] / 1048576;
    return fileSizeInBytes;
  } catch (e) {
    console.error(e);
  }
}

function checkQueue(interaction, delayTimer) {
  try {
    queue = JSON.parse(fs.readFileSync("".concat(__dirname, "/../src/imgQueue.json")));
    var guildID = interaction.guild.id;

    if (queue[guildID] > new Date().getTime()) {
      h = Math.floor((queue[guildID] - new Date().getTime()) / 1000 / 60 / 60);
      m = Math.floor(((queue[guildID] - new Date().getTime()) / 1000 / 60 / 60 - h) * 60);
      s = Math.floor((((queue[guildID] - new Date().getTime()) / 1000 / 60 / 60 - h) * 60 - m) * 60);
      time = "".concat(m > 0 ? m + " minutes and " : "").concat(s, " seconds");
      interactionReply({
        interaction: interaction,
        description: ":x: This is on cooldown for ".concat(time, ".")
      });
      return 1;
    } else {
      queue[guildID] = new Date().getTime() + delayTimer;
    }

    if (typeof queue[guildID] == "undefined") queue[guildID] = new Date().getTime() + delayTimer;
    fs.writeFileSync("".concat(__dirname, "/../src/imgQueue.json"), JSON.stringify(queue));
    return 0;
  } catch (e) {
    console.error(e);
  }
} // 


var MIN_SIZE = 2;
var MAX_SIZE = 350;
module.exports = {
  data: new SlashCommandBuilder().setName('img').setDescription('Change an image into a minecraft image!').addSubcommand(function (subcommand) {
    return subcommand.setName('file').setDescription('Upload a file to be manipulated!').addAttachmentOption(function (option) {
      return option.setName('file').setDescription('The file of an image!').setRequired(true);
    }).addIntegerOption(function (option) {
      return option.setName('quality').setDescription('The quality the minecraft image will be!').addChoices({
        name: 'Low',
        value: 1
      }).addChoices({
        name: 'Average',
        value: 2
      }).addChoices({
        name: 'High',
        value: 3
      });
    }).addIntegerOption(function (option) {
      return option.setName('width').setDescription("Custom block width of the image! (".concat(MIN_SIZE, " - ").concat(MAX_SIZE, ")")).setMinValue(MIN_SIZE).setMaxValue(MAX_SIZE);
    }).addIntegerOption(function (option) {
      return option.setName('height').setDescription("Custom block height of the image! (".concat(MIN_SIZE, " - ").concat(MAX_SIZE, ")")).setMinValue(MIN_SIZE).setMaxValue(MAX_SIZE);
    });
  }).addSubcommand(function (subcommand) {
    return subcommand.setName('url').setDescription('Upload an image from an url to be manipulated!').addStringOption(function (option) {
      return option.setName('url').setDescription('The url of an image!').setRequired(true);
    }).addIntegerOption(function (option) {
      return option.setName('quality').setDescription('Built-in quality for the minecraft image!').addChoices({
        name: 'Low',
        value: 1
      }).addChoices({
        name: 'Average',
        value: 2
      }).addChoices({
        name: 'High',
        value: 3
      });
    }).addIntegerOption(function (option) {
      return option.setName('width').setDescription("Custom block width of the image! (".concat(MIN_SIZE, " - ").concat(MAX_SIZE, ")")).setMinValue(MIN_SIZE).setMaxValue(MAX_SIZE);
    }).addIntegerOption(function (option) {
      return option.setName('height').setDescription("Custom block height of the image! (".concat(MIN_SIZE, " - ").concat(MAX_SIZE, ")")).setMinValue(MIN_SIZE).setMaxValue(MAX_SIZE);
    });
  }),
  execute: function execute(interaction, client) {
    return regeneratorRuntime.async(function execute$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            _context3.next = 3;
            return regeneratorRuntime.awrap(main(interaction, client));

          case 3:
            return _context3.abrupt("return", _context3.sent);

          case 6:
            _context3.prev = 6;
            _context3.t0 = _context3["catch"](0);
            throw _context3.t0;

          case 9:
          case "end":
            return _context3.stop();
        }
      }
    }, null, null, [[0, 6]]);
  }
};