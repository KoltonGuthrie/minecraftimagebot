const { AsyncDatabase } = require("promised-sqlite3");
const fs = require('fs');
const path = require("path");
const util = require('util');
const zlib = require('zlib');
const deflate = util.promisify(zlib.deflate);

const dir = `${__dirname}/../db`;
const file = '/minecraft_image_bot_database.sqlite';
console.log(dir, file);


init();


async function connect() {

	if (!fs.existsSync(dir)){
		fs.mkdirSync(dir);
	}

	if(!fs.existsSync(path.join(dir, file))) {
		fs.writeFileSync(path.join(dir, file), '');
	}

	const db = await AsyncDatabase.open(path.join(dir, file));
	return db;
}

async function init() {
	const db = await connect();
	await db.run( 'PRAGMA journal_mode = NORMAL;' );
	await db.run(
		`CREATE TABLE IF NOT EXISTS 'images'
            (
            'id' TEXT NOT NULL,
            'time' INTEGER NOT NULL,
            'name' TEXT NOT NULL,
			'author' TEXT NOT NULL,
			'channel' TEXT NOT NULL,
            'interaction' TEXT NOT NULL,
            'link' TEXT NOT NULL,
            'discordImgID' TEXT,
            'fileId' TEXT,
            'folderId' TEXT,
            'blockData' BLOB
			'datapackFolderId' TEXT,
			'datapackLink' TEXT
            );`
	);

	await db.run(
		`CREATE TABLE IF NOT EXISTS 'status'
            (
            'canStart' TEXT NOT NULL,
            'canDelete' TEXT NOT NULL,
            'imagesMade' INTEGER NOT NULL
            );`
	);

    const g = await db.get(`SELECT * FROM status`);
    if(!(await db.get(`SELECT * FROM status`))) {
        await db.run(`INSERT INTO status(canStart, canDelete, imagesMade) VALUES(?,?,?);`,["false", "false", 0]);
    }

	await db.run(
		`CREATE TABLE IF NOT EXISTS 'users'
            (
            'id' TEXT NOT NULL,
            'warned' TEXT NOT NULL,
            'banned' TEXT NOT NULL,
            'queueTime' INTEGER NOT NULL
            );`
	);

	await db.run(
		`CREATE TABLE IF NOT EXISTS 'donors'
            (
            'id' TEXT NOT NULL,
			'tier' INTEGER NOT NULL,
            'time' INTEGER NOT NULL
            );`
	);
	await db.close();
}

async function updateImage({  id = '%', interaction = '%'  , key, value }) {
    if(!key || !value) return null;
    if(id === '%' && interaction === '%') return null;

	if(key === 'blockData') value = await deflate(value);

	const db = await connect();
    await db.run(`UPDATE images SET ${key} = ? WHERE id LIKE ? AND interaction LIKE ?;`,[value, id, interaction]);
	await db.close();

    return await getImage({ id });
}

async function addImage({id, time, name, author, channel, interaction, link, discordImgID, fileId, folderId, blockData}) {

	if(blockData) blockData = await deflate(blockData);

	const db = await connect();
    await db.run(`INSERT INTO images(id, time, name, author, channel, interaction, link, discordImgID, fileId, folderId, blockData) VALUES(?,?,?,?,?,?,?,?,?,?,?);`,[id, time, name, author, channel, interaction, link, discordImgID, fileId, folderId, blockData]);
	await db.close();

	return await getImage({ id });
}

async function getImage({ id = '%', interaction = '%' }) {
    if(id === '%' && interaction === '%') return null;
	const db = await connect();
    const row = await db.get(`SELECT * FROM images WHERE id LIKE ? AND interaction LIKE ?;`,[id, interaction]);
	await db.close();

	return row || null;
}

async function getAllImages() {
	const db = await connect();
    const rows = await db.all(`SELECT * FROM images;`);
	await db.close();

	return rows || null;
}

async function removeImage({ id }) {
    if(!id) return null;
	const db = await connect();
    await db.run(`DELETE FROM images WHERE id = ?;`,[id]);
	await db.close();

	return;
}

async function addUser({ id, warned = "false", banned = "false", queueTime = "0" }) {
    if(!id) return null;
	const db = await connect();

	await db.run(`INSERT INTO users(id, warned, banned, queueTime) VALUES(?,?,?, ?);`,[id, warned, banned, queueTime]);
	await db.close();

	return await getUser({id});
}

async function updateUser({ id , key, value }) {
    if(!key || !value || !id) return null;

	const db = await connect();

	if(!(await getUser({id}))) await addUser({id});
	
    await db.run(`UPDATE users SET ${key} = ? WHERE id LIKE ?;`,[value, id]);
	await db.close();

    return await getUser({ id });
}

async function getUser({ id }) {
    if(!id) return null;
	const db = await connect();
	const row = await db.get(`SELECT * FROM users WHERE id = ?;`, [id]);
	await db.close();

	return row || null;
}

async function updateStatus({ key , value }) {
    if(!value || !key) return null;

	const db = await connect();
    await db.run(`UPDATE status SET ${key} = ?;`,[value]);
	await db.close();

    return await getStatus({ key });
}

async function getStatus() {
	const db = await connect();
    const row = await db.get(`SELECT * FROM status;`);
	await db.close();

    return row || null;
}

async function addDonor({ id, tier, time = (new Date().getTime()) }) {
    if(!id || !tier) return null;
	const db = await connect();

	await db.run(`INSERT INTO donors(id, tier, time) VALUES(?,?,?);`,[id, tier, time]);
	await db.close();

	return await getDonor({id});
}

async function getDonor({ id }) {
    if(!id) return null;
	const db = await connect();
	const row = await db.get(`SELECT * FROM donors WHERE id = ?;`, [id]);
	await db.close();

	return row || null;
}

async function getDonors() {
	const db = await connect();
    const rows = await db.all(`SELECT * FROM donors;`);
	await db.close();

	return rows || null;
}

async function removeDonor({ id }) {
    if(!id) return null;
	const db = await connect();
    await db.run(`DELETE FROM donors WHERE id = ?;`,[id]);
	await db.close();

	return;
}

module.exports = {
	init, updateImage, addImage, getImage, addUser, updateUser, getUser, updateStatus, getStatus, removeImage, getAllImages, addDonor, getDonor, getDonors, removeDonor
}