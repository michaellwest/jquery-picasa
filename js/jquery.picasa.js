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
// assume browser
/*global clearInterval: false, clearTimeout: false, document: false, event: false, frames: false, history: false, Image: false, location: false, name: false, navigator: false, Option: false, parent: false, screen: false, setInterval: false, setTimeout: false, window: false, XMLHttpRequest: false */

// assume console
/*global alert: false, confirm: false, console: false, Debug: false, opera: false, prompt: false, WSH: false */

// custom globals
/*global google: true, jQuery: true*/

/*jslint vars: true*/

(function ($) {

	'use strict';

	String.prototype.format = function () {
		var content = this,
			i;
		for (i = 0; i < arguments.length; i += 1) {
			var replacement = '{' + i + '}';
			content = content.replace(replacement, arguments[i]);
		}
		return content;
	};

	function Photo(id, title, description, image, thumbs) {
		this.id = id;
		this.title = title;
		this.description = description;
		this.image = image;
		this.thumbs = thumbs;
	}

	var albumUrl = "http://picasaweb.google.com/data/feed/api/user/{0}",
		albumParameters = "?alt=jsonc&hl=en_US&kind=album&access={0}&thumbsize={1}c&callback=?",
		imageUrl = "https://picasaweb.google.com/data/feed/api/user/{0}/albumid/{1}",
		imageParameters = "?alt=jsonc&hl=en_US&kind=photo&thumbsize={0}c&imgmax={1}&callback=?",
		defaultOptions = {
			access: 'visible',
			// 32, 48, 64, 72, 104, 144, 150, 160
			thumbsize: 160,
			// 94, 110, 128, 200, 220, 288, 320, 400, 512, 576, 640, 720, 800, 912, 1024, 1152, 1280, 1440, 1600
			imgmax: 720,
			// path to image placeholder (e.g. images/loader.gif).
			loader: '',
			// set overrideLayout to true if you want to handle the images and markup directly.
			overrideLayout: false
		};

	var methods = {
		init: function (options) {
			$.extend(defaultOptions, options);

			return this;
		},

		images: function (userId, albumId, callback) {

			var parameters = imageParameters.format(defaultOptions.thumbsize, defaultOptions.imgmax);
			var requestUrl = imageUrl.format(userId, albumId) + parameters;

			$.getJSON(requestUrl, function (result) {
				var photo = null,
					photos = [];

				$.each(result.data.items, function (itemIndex, item) {
					photo = new Photo(item.id, item.title, item.description, item.media.image, []);

					$.each(item.media.thumbnails, function (thumbIndex, thumbnail) {
						photo.thumbs[photo.thumbs.length] = thumbnail;
					});

					photos[photos.length] = photo;
				});

				if (callback) {
					callback(photos);
				} else {
					console.log('No callback provided.');
				}
			});
		},

		albums: function (userId, callback) {

			var parameters = albumParameters.format(defaultOptions.access, defaultOptions.thumbsize);
			var requestUrl = albumUrl.format(userId) + parameters;

			$.getJSON(requestUrl, function (result) {
				var photo = null,
					photos = [];

				$.each(result.data.items, function (itemIndex, item) {
					photo = new Photo(item.id, item.title, item.description, item.media.image, []);
					
					$.each(item.media.thumbnails, function (thumbIndex, thumbnail) {
						photo.thumbs[photo.thumbs.length] = thumbnail;
					});

					photo.images = function (callback) {
						methods.images(userId, this.id, callback);
					};

					photos[photos.length] = photo;
				});

				if (callback) {
					callback(photos);
				} else {
					console.log('No callback provided.');
				}
			});
		},

		_image: function (albumId, photo, callback) {
			var ul = $(this);
			var source = defaultOptions.loader;
			var li = $(document.createElement('li')).addClass('picasa-image').attr({
				'rel': 'picasa-album[' + albumId + ']'
			});
			var a = $(document.createElement('a')).addClass('picasa-image-large').attr({
				'href': photo.image.url,
				'rel': 'picasa-album[' + albumId + ']'
			});
			var img = $(document.createElement('img')).addClass('picasa-image-thumb').attr({
				'src': (source) ? source : photo.thumbs[0],
				'rel': 'picasa-album[' + albumId + ']',
				'data-href': photo.thumbs[0]
			});
			if (source) {
				img.addClass('loader');
			}
			a.append(img[0]);
			li.append(a[0]);
			ul.append(li[0]);

			if (photo.images) {
				photo.images(function (images) {
					$.each(images, function (index, image) {
						if (index > 0) {
							a = $(document.createElement('a')).addClass('picasa-image-large').attr({
								'href': image.image.url,
								'rel': 'picasa-album[' + albumId + ']'
							});
							$('li' + "[rel='picasa-album[" + albumId + "]']", ul).append(a[0]);
						}
					});

					if (callback) {
						callback.apply(li);
					}
				});
			}

			return ul;
		},

		gallery: function (userId, albumId, callback) {
			var scope = $(this);

			// if the albumId is a function then we need to swap the values.
			if ($.isFunction(albumId)) {
				callback = albumId;
				albumId = undefined;
			}

			if (albumId) {
				methods.images(userId, albumId, function (photos) {
					if (callback && defaultOptions.overrideLayout) {
						callback.apply(scope, photos);
					} else {
						var ul = $(document.createElement('ul')).addClass('picasa-album');
						$.each(photos, function (index, photo) {
							methods._image.apply(ul, [albumId, photo]);
						});
						scope.append(ul[0]);
						if (callback) {
							callback.apply(scope);
						}
					}
				});
			} else {
				methods.albums(userId, function (photos) {
					if (callback && defaultOptions.overrideLayout) {
						callback.apply(scope, photos);
					} else {
						var ul = $(document.createElement('ul')).addClass('picasa-album');
						$.each(photos, function (index, photo) {
							methods._image.apply(ul, [photo.id, photo, callback]);
						});

						scope.append(ul[0]);
						if (callback) {
							callback.apply(scope);
						}
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

}(jQuery));
