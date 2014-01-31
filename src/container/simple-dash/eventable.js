var SimpleDash = SimpleDash || {};

(function( SimpleDash ) {

	var Eventable = function() {

		this._events = {};
	};

	Eventable.prototype.on = function( type, fn, context ) {

		var types = type.split(' '),
			i = types.length,
			listeners;

		while( i-- ) {

			listeners = this._events[type];

			if( !listeners ) {
				listeners = this._events[type] = [];
			}

			listeners.push({
				fn: fn,
				context: context
			});
		}
	};

	Eventable.prototype.off = function( type, fn ) {

		var listeners = this._events[type],
			i;

		// Remove all listeners
		if( !type ) {

			this._events = {};
			return;
		}

		// No listeners attached
		if( !listeners ) {

			return;
		}

		// Remove all listening to `type`
		if( !fn ) {

			listeners.length = 0;
			return;
		}

		i = listeners.length;

		while( i-- ) {

			if( listeners[i].fn === fn ) {

				listeners.splice(i, 1);
				break;
			}

		}

		if( !listeners.length ) {
			delete this._events[type];
		}
	};

	Eventable.prototype.emit = function( type ) {

		var listeners = this._events[type],
			listener,
			args = Array.prototype.slice.call(arguments, 1),
			i = 0;

		if( !listeners ) {

			return;
		}

		// Might cause issues if a listener is removed while triggering it
		for( ; i < listeners.length; i++ ) {

			listener = listeners[i];
			listener.fn.apply(listener.context, args);
		}
	};

	SimpleDash.Eventable = Eventable;

})(SimpleDash);