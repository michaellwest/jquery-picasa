// Michael West
// 03.27.2012
// Picasa plug-in
//https://code.google.com/apis/picasaweb/docs/2.0/developers_guide_protocol.html
//
// album query
// http://picasaweb.google.com/data/feed/api/user/userID
// album image query
// http://picasaweb.google.com/data/feed/api/user/userID/albumid/albumID
// Picasa API
// http://code.google.com/apis/picasaweb/docs/2.0/reference.html#Parameters
//
(function ($, window) {

	'use strict';

	// assume browser
	/*global clearInterval: false, clearTimeout: false, document: false, event: false, frames: false, history: false, Image: false, location: false, name: false, navigator: false, Option: false, parent: false, screen: false, setInterval: false, setTimeout: false, window: false, XMLHttpRequest: false */

	// assume console
	/*global alert: false, confirm: false, console: false, Debug: false, opera: false, prompt: false, WSH: false */

	// custom globals
	/*global google: true, jQuery: true*/

	/*jslint vars: true*/

	if (!String.format) {
		String.prototype.format = function () {
			var content = this,
				i;
			for (i = 0; i < arguments.length; i += 1) {
				var replacement = '{' + i + '}';
				content = content.replace(replacement, arguments[i]);
			}
			return content;
		};
	}

	if (!Array.indexOf) {
		Array.prototype.indexOf = function (item) {
			var i;
			for (i = 0; i < this.length; i++) {
				if (this[i] === item) {
					return i;
				}
			}
			return -1;
		};
	}

	function Photo(id, title, description, image, thumbs) {
		this.id = id;
		this.title = (title === "[UNSET]") ? "" : title;
		this.description = description;
		this.image = image;
		this.thumbs = thumbs;
	}

	function createImage(album, photo) {
		var imageDiv = $(document.createElement('div')).addClass('picasa-image');
		var imageA = $(document.createElement('a')).addClass('picasa-image-large').attr({
			'href': photo.image.url,
			'rel': 'picasa-album[' + album + ']'
		})
		var imageImg = $(document.createElement('img')).addClass('picasa-image-thumb').attr({
			'src': photo.thumbs[0],
			'rel': 'picasa-album[' + album + ']'
		});
		imageA.append(imageImg[0]);

		var titleDiv = $(document.createElement('div')).addClass('picasa-image-title').html(photo.title);

		imageDiv.append(imageA[0]);
		imageDiv.append(titleDiv[0]);

		return imageDiv;
	}

	function wait(options) {
		options = $.extend({
			until: function () {
				return false;
			},
			success: function () {},
			error: function () {
				if (console) {
					console.log("There was a problem completing the wait function.");
				}
			},
			timeout: 3000
		}, options);

		var start = (new Date()).getTime(),
			elapsed, now, func = function () {
				now = (new Date()).getTime();
				elapsed = now - start;
				if (options.until(elapsed)) {

					var data = options.until();
					if (data && data.error) {
						options.error();
					} else {
						options.success();
					}
					return false;
				}

				if (typeof options.timeout === 'number' && now >= start + options.timeout) {
					options.error();
					return false;
				}

				window.setTimeout(func, 10);
			};

		window.setTimeout(func, 10);
	}

	var defaultOptions = {
		access: 'visible',
		// 32, 48, 64, 72, 104, 144, 150, 160
		thumbsize: 160,
		// 94, 110, 128, 200, 220, 288, 320, 400, 512, 576, 640, 720, 800, 912, 1024, 1152, 1280, 1440, 1600
		imagesize: 720,
		// path to image placeholder (e.g. images/loader.gif).
		loader: '',
		// maximum number of photos to return (0 indicates all).
		max: 30,
		// set overrideLayout to true if you want to handle the images and markup directly.
		overrideLayout: false
	};

	var methods = {
		init: function (options) {
			$.extend(defaultOptions, options);

			return this;
		},

		_parse: function (data, callback) {
			var that = this,
				photo = null,
				photos = [];

			$.each(data.items, function (itemIndex, item) {
				photo = new Photo(item.id, item.title, item.description, item.media.image, []);

				$.each(item.media.thumbnails, function (thumbIndex, thumbnail) {
					photo.thumbs[photo.thumbs.length] = thumbnail;
				});

				if (item.kind === "album") {
					photo.images = function (callback) {
						methods.images(item.username, item.id, callback);
					};
				}

				photos[photos.length] = photo;
			});

			callback.call(that, photos);
		},

		_call: function (type, url, params, callback) {

			url = 'https://picasaweb.google.com/data/feed/api/' + url + '?';

			if (typeof params === 'function') {
				callback = params;
				params = {};
			}

			params = $.extend({
				'kind': 'photo',
				'access': 'public',
				'max-results': defaultOptions.max,
				'thumbsize': defaultOptions.thumbsize + "c",
				'imgmax': defaultOptions.imagesize,
				'alt': 'jsonc',
				'callback': '?'
			}, params);

			var that = this;

			$.each(params, function (key, value) {
				url += '&' + key + '=' + value;
			});

			var data = false;

			wait({
				until: function () {
					return data;
				},
				success: function () {
					methods._parse.call(that, data.data, callback);
				},
				error: function () {
					if (console) {
						console.log(["There was an error with Picasa.", data.error]);
					}
				},
				timeout: 5000
			});

			$.getJSON(url, function (result) {
				data = result;
			});

			return that;
		},

		images: function (username, album, params, callback) {
			return this._call('useralbum', "user/{0}/albumid/{1}".format(username, album), params, callback);
		},

		albums: function (username, callback) {
			return this._call('user', "user/{0}".format(username), {
				'kind': 'album'
			}, callback);
		},

		gallery: function (username, album, callback) {
			var scope = $(this);

			// if the albumId is a function then we need to swap the values.
			if ($.isFunction(album)) {
				callback = album;
				album = undefined;
			}

			if (album && !(album instanceof Array)) {
				methods.images(username, album, function (photos) {
					if (callback && defaultOptions.overrideLayout) {
						callback.apply(scope, photos);
					} else {
						var div = $(document.createElement('div')).addClass('picasa-album');
						$.each(photos, function (index, photo) {
							var imageDiv = createImage(album, photo).attr({
								'rel': 'picasa-album[' + photo.id + ']'
							});
							div.append(imageDiv[0]);
						});
						scope.append(div[0]);
						if (callback) {
							callback.apply(scope, [album]);
						}
					}
				});
			} else {
				methods.albums(username, function (photos) {
					if (callback && defaultOptions.overrideLayout) {
						callback.apply(scope, photos);
					} else {
						$.each(photos, function (index, photo) {
							if (!album || album.indexOf(photo.id) !== -1) {
								var div = $(document.createElement('div')).addClass('picasa-album').attr({
									'rel': 'picasa-album[' + photo.id + ']'
								});
								var albumCover = createImage(photo.id, photo).attr({
									'rel': 'picasa-album[' + photo.id + ']'
								});
								div.append(albumCover[0]);
								if (photo.images) {
									photo.images(function (images) {
										$.each(images, function (index, image) {
											var imageDiv = createImage(photo.id, image).attr({
												'rel': 'picasa-album[' + photo.id + ']'
											}).css({
												'display': 'none'
											});
											div.append(imageDiv[0]);
										});
										if (callback) {
											callback.apply(scope, [photo.id]);
										}
									});
								}
								scope.append(div[0]);
							}
						});
					}
				});
			}

			return scope;
		}
	};

	$.fn.picasa = function (method) {
		// Method calling logic
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist on jQuery.picasa');
		}
	};

}(jQuery, window));
