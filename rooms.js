/**
 * Rooms
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file tracks information about the rooms that the bot joins.
 *
 * @license MIT license
 */

'use strict';
const request = require('request');
const webhook = '';

class Room {
	/**
	 * @param {string} id
	 */
	constructor(id) {
		this.id = id;
		this.clientId = id === 'lobby' ? '' : id;
		/**@type {Map<User, string>} */
		this.users = new Map();
		/**@type {{[k: string]: Function}} */
		this.listeners = {};
		/**@type {?Game} */
		this.game = null;
		/**@type {?Tournament} */
		this.tour = null;		
	}

	/**
	 * @param {User} user
	 * @param {string} rank
	 */
	onJoin(user, rank) {
		this.users[user.id] = rank;
		let nostaff = Object.keys(this.auth).length === 0;
		if (rank == "#") {
			if (nostaff && this.id === 'lobby') this.say('/modchat ac');
			this.auth[user.id] = user.name;
			global.notified[this.id] = false;
		}
		if (rank == "@") {
          		if (nostaff && this.id === 'lobby') this.say('/modchat ac');
            		this.auth[user.id] = user.name;
            		global.notified[this.id] = false;
		}
		if (rank == "%") {
          		if (nostaff && this.id === 'lobby') this.say('/modchat ac');
            		this.auth[user.id] = user.name;
            		global.notified[this.id] = false;
		}
        	user.ranks[this.id] = rank;
        	user.rooms[this.id] = rank;
        	this.users[user.id] = user.rank;
	}

	/**
	 * @param {User} user
	 */
	onLeave(user) {
        var room = this;
        if (this.auth[user.id]) {
          delete this.auth[user.id];
        }
        if (this.id === 'lobby') {
          const found = Object.keys(this.auth).some(r=> this.auth_list.includes(r));
          if (!found && !this.msgSent) {
            setTimeout(function(){
             const found2 = Object.keys(this.auth).some(r=> this.auth_list.includes(r));
              //if (!found2 && !this.msgSent) {this.say('/helpticket submit Public Room Assistance Request'); this.msgSent = true;}
              }, 1000 * 5 * 60);
          }
          if (found) {this.msgSent = false;}
        }
        let noStaff = Object.keys(this.auth).length == 0;
        if (noStaff && !global.notified[this.id] && global.notifyTime[this.id] !== new Date().getHours()) {
          function complete(id){
            global.notified[this.id] = true;
            global.notifyTime[this.id] = new Date().getHours();
          };
          if (this.id === 'lobby') {
              this.say('/modchat +');
              this.say('/wall Since there are no staff online right now, I have set modchat. Please remain calm and wait until staff come back online.');
                  global.postDiscord('',
			{json: {
                  		embeds: [{
	                  		"title": "Emergency situation!",
	                  		"description": "Lobby has been left unsupervised!"
	                  		}]}
			},
                    complete, this);
  	        }
        	}
        	delete user.rooms[this.id];
        	delete this.users[user.id];
	}

	/**
	 * @param {User} user
	 * @param {string} newName
	 */
	onRename(user, newName) {
        	let rank = newName.charAt(0);
        	newName = Tools.toName(newName);
        	let id = Tools.toId(newName);
        	let oldName = user.name;

        	if (id !== user.id) {
          		if (user.id > id) {
              			var query = `INSERT IGNORE INTO alts (date,old,new) VALUES(NOW(),'` + user.id + `','` + id + `');`; user.alts.push(user.id);
          		} else {
              			var query = `INSERT IGNORE INTO alts (date,old,new) VALUES(NOW(),'` + id + `','` + user.id + `');`; user.alts.push(user.id);
          		}
          		Tools.query(query, function(err) {});
        	}
        	if (id === user.id) {
            		if (["#", "@", "%"].includes(rank)) this.auth[user.id] = newName;
            		user.name = newName;
        	} else {
            		delete this.users[user.id];
            		if (this.auth[user.id]) { delete this.auth[user.id]; }
            		delete Users.users[user.id];
            		if (Users.users[id]) {
                		user = Users.users[id];
                		user.name = newName;
            		} else {
                		user.name = newName;
                		user.id = id;
                		Users.users[id] = user;
            		}
        	}
        	this.users[user.id] = rank;
        	if (["#", "@", "%"].includes(rank)) {
            		global.notified[this.id] = false;
        		this.auth[user.id] = user.name;
        	}
        	user.rooms[this.id] = rank;
        	user.ranks[this.id] = rank;
        	if (this.game) this.game.renamePlayer(user, oldName);
        	if (this.tour && false) this.tour.renamePlayer(user, oldName);
	}

	/**
	 * @param {string} message
	 * @param {boolean} [skipNormalization]
	 */
	say(message, skipNormalization) {
		if (!skipNormalization) message = Tools.normalizeMessage(message, this);
		if (!message) return;
		Client.send(this.clientId + '|' + message);
	}

	/**
	 * @param {string} message
	 * @param {Function} listener
	 */
	on(message, listener) {
		message = Tools.normalizeMessage(message, this);
		if (!message) return;
		this.listeners[Tools.toId(message)] = listener;
	}
}

exports.Room = Room;

class Rooms {
	constructor() {
		this.rooms = {};

		this.Room = Room;
		this.globalRoom = this.add('global');
	}

	/**
	 * @param {Room | string} id
	 * @return {Room}
	 */
	get(id) {
		if (id instanceof Room) return id;
		return this.rooms[id];
	}

	/**
	 * @param {string} id
	 * @return {Room}
	 */
	add(id) {
		let room = this.get(id);
		if (!room) {
			room = new Room(id);
			this.rooms[id] = room;
            		if (id !== 'global') {
                		global.notified[id] = false;
                		global.notifyTime[id] = -1;
            		}
		}
        	/*if (id === 'help-officerjenny' && !room.msgSent) {
          		room.msgSent = true;
          		room.say("I've detected that there are no room staff currently in lobby. Would you mind watching chat?");
        	};*/
		return room;
	}

	/**
	 * @param {Room | string} id
	 */
	destroy(id) {
		let room = this.get(id);
		if (!room) return;
		if (room.game) room.game.forceEnd();
		if (room.tour) room.tour.end();
		room.users.forEach(function (value, user) {
			user.rooms.delete(room);
		});
		delete this.rooms[room.id];
	}

	destroyRooms() {
		for (let i in this.rooms) {
			this.destroy(i);
		}
	}
}

exports.Rooms = new Rooms();
