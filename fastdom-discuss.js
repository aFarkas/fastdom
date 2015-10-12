(function(){
	'use strict';

	var rAF = window.requestAnimationFrame || setTimeout;
	var setImmediate = window.setImmediate || setTimeout;

	var Fastdom = function(){
		this._reads = [];
		this._writes = [];
		this._isWriting = false;
		this._waitsForRead = false;
		this._waitsForWrite = false;

		this._flushWrites = this._flushWrites.bind(this);
		this._flushReads = this._flushReads.bind(this);
	};

	Fastdom.prototype = {
		read: function(fn, ctx, args){
			if(this._isWriting){
				this._reads.push(arguments);
				if(!this._waitsForRead){
					this._waitsForRead = true;
					setImmediate(this._flushReads);
				}
			} else {
				fn.apply(ctx || null, args);
			}
		},
		write: function(fn, ctx, args){
			this._writes.push(arguments);
			if(!this._waitsForWrite){
				this._waitsForWrite = true;
				rAF(this._flushWrites);
			}
		},
		writer: function(fn, ctx){
			var that = this;
			return function(){
				that.write(fn, ctx || this, arguments);
			};
		},
		reader: function(fn, ctx){
			var that = this;
			return function(){
				that.read(fn, ctx || this, arguments);
			};
		},
		_flush: function(list){
			var fns;

			while(list.length){
				fns = list.shift();
				fns[0].apply(fns[1] || null, fns[2] || []);
			}
		},
		_flushReads: function(){
			this._flush(this._reads);
			this._waitsForRead = false;
		},
		_flushWrites: function(){
			this._flush(this._reads);

			this._isWriting = true;
			this._flush(this._writes);
			this._isWriting = false;
			this._waitsForWrite = false;
		},
	};

	window.fastdom = new Fastdom();
})();
