const readline = require('readline');
const fs = require('fs');
const path = require('path');

const prompt = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const dataPath = path.join(__dirname, '../OLD_DATA');
const dbPath = path.join(__dirname , '../db/minecraft_image_bot_database.sqlite');

const filenames = fs.readdirSync(dataPath); 

if(!filenames.includes('blockedIDs.json')) console.log('\x1b[31mMissing file: blockedIDs.json\x1b[0m');
if(!filenames.includes('imagesMade.txt')) console.log('\x1b[31mMissing file: imagesMade.txt\x1b[0m');
if(!filenames.includes('imgData.json')) console.log('\x1b[31mMissing file: imgData.json\x1b[0m');

const imgData = JSON.parse(fs.readFileSync(path.join(dataPath, 'imgData.json')));
const userData = JSON.parse(fs.readFileSync(path.join(dataPath, 'blockedIDs.json')));

prompt.question(`\x1b[33m Have you turning the Discord bot \x1b[31mOFF\x1b[33m? \x1b[31m(y/n)\x1b[0m\n`, (response) => { 
    const res = response.toLowerCase();

    if (res != "y" && res != "yes" && res != "n" && res != "no") {
        console.log('\x1b[33m Unknown response: \x1b[0m' + res);
        process.exit();
    } else if(res == "n" || res == "no") {
        console.log('\x1b[33m Okay! Exiting process.\x1b[0m');
        process.exit();
    }

    prompt.question(`\x1b[33m Do you understand that you will be adding \x1b[34m${Object.keys(imgData).length + Object.keys(userData).length}\x1b[33m images to the \x1b[34m${path.basename(dbPath)}\x1b[33m database? \x1b[31m(y/n)\x1b[0m\n`, (response) => { 
        const res = response.toLowerCase();

        if (res != "y" && res != "yes" && res != "n" && res != "no") {
            console.log('\x1b[33m Unknown response: \x1b[0m' + res);
            process.exit();
        } else if(res == "n" || res == "no") {
            console.log('\x1b[33m Okay! Exiting process.\x1b[0m');
            process.exit();
        }

        prompt.question(`\x1b[33m Do you understand \x1b[31mALL\x1b[33m data from \x1b[34m${path.basename(dbPath)}\x1b[33m will be \x1b[31mLOST\x1b[33m? \x1b[31m(y/n)\x1b[0m\n`, async (response) => { 
            const res = response.toLowerCase();
        
            if (res != "y" && res != "yes" && res != "n" && res != "no") {
                console.log('\x1b[33m Unknown response: \x1b[0m' + res);
                process.exit();
            } else if(res == "n" || res == "no") {
                console.log('\x1b[33m Okay! Exiting process.\x1b[0m');
                process.exit();
            }
        
            console.log(`\x1b[32m Starting process...\x1b[0m`);

            console.log(`\x1b[31m Deleting \x1b[34m${path.basename(dbPath)}\x1b[31m database...\x1b[0m`);

            try {
                fs.unlinkSync(dbPath);
            } catch(err) {
                console.error(err);
                console.log(`\x1b[31m Failed to delete \x1b[34m${path.basename(dbPath)}\x1b[31m database...\x1b[0m`);
                process.exit();
            }

            const { init, addImage, addUser, updateUser, updateStatus } = require('../src/database');
            await init();
        
            console.log(`\x1b[32m Adding images...\x1b[0m`);

            for(id of Object.keys(imgData)) {
                const el = imgData[id];
                await addImage({id: id, time: el.time, name: el.name, author: el.author, channel: el.channel, interaction: el.interaction, link: el.link, fileId: el.fileId, folderId: el.folderId, discordImgID: el.discordImgID});
            }

            console.log(`\x1b[32m Adding warned users...\x1b[0m`);
            for(id of userData.warns) {  
                await addUser({id});

                await updateUser({id: id, key: 'warned', value: 'true'});
            }

            console.log(`\x1b[32m Adding banned users...\x1b[0m`);
            for(id of userData.bans) {
                await addUser({id});

                await updateUser({id: id, key: 'banned', value: 'true'});
            }

            console.log(`\x1b[32m Adding imagesMade...\x1b[0m`);
            const imagesMade = Number(fs.readFileSync(path.join(dataPath, 'imagesMade.txt')));
            await updateStatus({key: 'imagesMade', value: imagesMade});
            
            console.log(`\x1b[32m Done!\x1b[0m`);

        });

    });
});