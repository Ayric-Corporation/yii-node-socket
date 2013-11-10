(function () {

	var rooms = {};
	var socket;

	/**
	 * Log manager
	 *
	 * @constructor
	 */
	function Logger() {

		this.isDebugMode = true;

		var console = window.console || {
			info : function () {},
			log : function () {},
			error : function () {}
		};

		if (!console['log']) {
			console.log = function () {}
		}

		if (!console['error']) {
			console.error = function () {}
		}

		if (!console['info']) {
			console.info = function () {}
		}

		this.log = function (message) {
			if (this.isDebugMode) {
				console.log(new Date().getTime() + ': ' + message);
			}
		};

		this.info = function () {
			if (this.isDebugMode) {
				console.info.apply(console, arguments);
			}
		};

		this.error = function () {
			if (this.isDebugMode) {
				console.error.apply(console, arguments);
			}
		};
	}

	var logger = new Logger();



	/**
	 * Hooked event listen manager
	 *
	 * @param scope
	 * @constructor
	 */
	function EventHookManager(scope) {

		var events = {
			before : {},
			after : {}
		};

		this.trigger = function (when, event, data) {
			logger.log('Triggered hook manager, when - ' + when + ', event - ' + event);
			if (events[when] && events[when][event]) {
				for (var i in events[when][event]) {
					var executionResult = events[when][event][i].call(scope, data, event);
					if (executionResult === false) {
						return false;
						break;
					}
				}
			}
			return true;
		};

		/**
		 *
		 * @param event
		 * @param fn
		 * @returns {*}
		 */
		this.before = function (event, fn) {
			if (!events.before[event]) {
				events.before[event] = [];
			}
			logger.log('Add new hook: when - before, event - ' + event);
			events.before[event].push(fn);
			return this;
		};

		/**
		 *
		 * @returns {*}
		 */
		this.after = function (event, fn) {
			if (!events.after[event]) {
				events.after[event] = [];
			}
			logger.log('Add new hook: when - after, event - ' + event);
			events.after[event].push(fn);
			return this;
		};

		var self = this;

		scope.after = function () {
			self.after.apply(self, arguments);
		};
		scope.before = function () {
			self.before.apply(self, arguments);
		};
	}

	/**
	 * Event listen manager
	 *
	 * @param {object} owner
	 * @param eventPrefix
	 * @constructor
	 */
	function EventListener(owner, eventPrefix) {

		/**
		 * Add before event
		 *
		 * @name before
		 * @function
		 * @memberOf EventHookManager
		 */

		/**
		 * Add after event
		 *
		 * @name after
		 * @function
		 * @memberOf EventHookManager
		 */

		eventPrefix = eventPrefix || '';
		var self = this;
		var eventHookListener = new EventHookManager(owner);
		var events = {};

		/**
		 *
		 * @returns {Object}
		 */
		this.getOwner = function () {
			return owner;
		};

		/**
		 *
		 * @returns {*}
		 */
		this.getId = function () {
			if (owner === this) {
				return '';
			}
			return owner.getId();
		};

		this.getHookListener = function () {
			return eventHookListener;
		};

		this.setEventPrefix = function (prefix) {
			logger.log('Set event prefix to: ' + prefix);
			eventPrefix = prefix;
		};

		this.emit = function (event, data) {
			logger.log('Tying to fire event: ' + event);
			if (eventHookListener.trigger('before', event, data)) {
				if (events[event]) {
					var chain = {
						'break' : false
					};
					for (var i in events[event]) {
						events[event][i].call(owner, data, chain);
						if (chain.break === true) {
							logger.log('Handler of event: ' + event + ' break event chain');
							break;
						}
					}
				} else {
					logger.log('Event [' + event + '] has no listeners');
				}
				eventHookListener.trigger('after', event, data);
			}
			logger.log('Event [' + event + '] processed!');
			return owner;
		};

		var getInternalEventName = function (event) {
			var id = self.getId();
			if (id == '') {
				return event;
			}
			return id + ':' + event;
		};

		/**
		 *
		 * @param event
		 * @param fn
		 * @returns {*}
		 */
		this.on = function (event, fn) {
			logger.log('Attach event listener for event: ' + event);
			if (!events[event]) {
				events[event] = [];
			}
			events[event].push(fn);
			var self = this;
			socket.on(getInternalEventName(event), function (data) {
				logger.log('Received data for event: ' + event);
				self.emit(event, data);
			});
			return owner;
		};

		/**
		 *
		 * @param event
		 * @param fn
		 * @returns {*}
		 */
		owner.on = function (event, fn) {
			self.on(event, fn);
		};
	}

	var eventHandlers = {
		'system:invoke' : function (data) {

		}
	};

	function SystemEventsHandler(owner) {

		/**
		 * Attach event handler event
		 *
		 * @name on
		 * @function
		 * @memberOf EventListener
		 */

		var eventListener = new EventListener(this);

		var handlers = {
			'invoke' : function (data) {

			}
		};

		/**
		 *
		 * @returns {string}
		 */
		this.getId = function () {
			return 'system';
		};

		for (var event in handlers) {
			this.on(event, handlers[event]);
		}
	}

	/**
	 * Room object needed for joining into some room and catch room events
	 *
	 * @param id
	 * @constructor
	 */
	function Room(id) {

		/**
		 * Add before event
		 *
		 * @name before
		 * @function
		 * @memberOf EventHookManager
		 */

		/**
		 * Add after event
		 *
		 * @name after
		 * @function
		 * @memberOf EventHookManager
		 */

		/**
		 * Attach event handler event
		 *
		 * @name on
		 * @function
		 * @memberOf EventListener
		 */

		this._eventListener = new EventListener(this, 'room:');
		var systemEventsHandler = new SystemEventsHandler(this);

		this._isJoined = false;
		this._numberOfClients = 0;
		this._error = false;
		this._errorMessage = '';

		this.getId = function () {
			return id;
		};

		this.getMembersCount = function () {
			return this._numberOfClients;
		};

		this.hasError = function () {
			return this._error;
		};

		this.isJoined = function () {
			return this._isJoined;
		};

		/**
		 * Update members count if some socket join to room
		 */
		this.on('system:update.members_count', function (newMembersCount) {
			this._numberOfClients = newMembersCount;
			this._eventListener.emit('join', newMembersCount)
		});

		this.join = function (fn) {
			if (this.isJoined()) {
				if (fn) {
					fn.call(this, this.isJoined(), this.getMembersCount());
				}
				return;
			}
			var self = this;
			logger.log('Tying to join in room ' + this.getId());
			socket.emit('room_join', this.getId(), function (isJoined, numberOfClientsInRoom) {
				self._isJoined = isJoined;
				if (isJoined) {
					logger.log('Joined in room ' + self.getId());
					logger.log('Room members count ' + numberOfClientsInRoom);
					self._numberOfClients = numberOfClientsInRoom;
				} else {
					self._error = true;
					self._errorMessage = numberOfClientsInRoom;
					logger.log('Room join error: room - ' + self.getId() + ', reason - ' + numberOfClientsInRoom);
				}
				if (fn) {
					fn.call(self, isJoined, numberOfClientsInRoom);
				}
			});
		};
	}

	function YiiNodeSocket() {

		/**
		 * Add before event
		 *
		 * @name before
		 * @function
		 * @memberOf EventHookManager
		 */

		/**
		 * Add after event
		 *
		 * @name after
		 * @function
		 * @memberOf EventHookManager
		 */

		/**
		 * Attach event handler event
		 *
		 * @name on
		 * @function
		 * @memberOf EventListener
		 */

		var self = this;

		this._eventListener = new EventListener(this, '');

		socket = io.connect('http://<?php echo $nodeSocket->host;?>:<?php echo $nodeSocket->port;?>/client');

		if (socket) {
			systemEventHandler.bind();
		}

		this.getId = function () {
			return '';
		};

		this.debug = function (flag) {
			logger.isDebugMode = flag;
			return this;
		};

		/**
		 *
		 * @returns {Logger}
		 */
		this.getLogger = function () {
			return logger;
		};

		/**
		 * @param {string} key
		 * @param {function} fn
		 */
		this.getPublicData = function (key, fn) {
			logger.log('Trying to get public data for key: ' + key);
			socket.emit('public_data', key, function (data) {
				logger.log('Received public data for key: ' + key);
				if (fn) {
					fn(data);
				}
			});
		};

		/**
		 *
		 * @param id
		 * @returns Room
		 */
		this.room = function (id) {
			if (rooms[id]) {
				return rooms[id];
			}
			var room = rooms[id] = new Room(id);
			return room;
		};
	}

	window.YiiNodeSocket = YiiNodeSocket;
})();