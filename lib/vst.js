/**
 * Video Streaming Test
 * for API driven video streaming site
 * 
 * @since 2018-01-07
 * @modified 2018-06-11
 * @version 3.10
 */
var Vst = function(){};

/**
 * Cache object
 */
Vst.prototype.cache = {
	params: {},
	elements: {
		menu: null,
		content: null
	},
	sdvUrl: 'http://sdv.string.tokyo',
	showBitrate: false,
	musicPlayer: null,
	currentMusic: null,
	shuffle: false,
	repeat: false,
	events: {
		musicEnded: false,
		musicTimeupdate: false,
		musicVolumechange: false,
		musicControllerFade: false,
		videoTimeupdate: false,
		videoVolumeChange: false,
		videoEnded: false,
		videoControllTimer: false,
		fullScreenChange: false
	},
	musicControllTimer: 0,
	stateTimer: 0,
	realTimeTv: {}
};

/**
 * 各ページの初期化
 */
Vst.prototype.init = function() {
	var obj = this;

	obj.authenticate(function() {
		obj.parseParams();
		obj.setPage();
		obj.menuEvents();
		obj.pageUpDown();
		if (
			obj.cache.params.p === 'tv' &&
			obj.isset(obj.cache.params, 'a') &&
			obj.cache.params.a === 'r'
		) {
			obj.writeRules();
		} else if (
			obj.cache.params.p === 'tv' &&
			obj.isset(obj.cache.params, 'a') &&
			obj.cache.params.a === 's'
		) {
			obj.writePrograms();
		} else if (obj.cache.params.p === 'music') {
			obj.writeMusicPlayer();
		} else {
			obj.writeList();
			obj.videoEvents('#player');
		}
		if (!obj.isMobile()) {
			obj.writeVersion('#logo');
		}
	});
};

/**
 * 認証
 * @param Function callback
 */
Vst.prototype.authenticate = function(callback) {
	var obj = this;
	var modal = $('#auth');
	var authed = $.cookie('k');
	var auth = function(k) {
		return $.ajax({
			url: '/auth/',
			data: {k: k},
			dataType: 'text',
			type: 'POST',
			async: false
		});
	};
	var ok = function(val, callback) {
		$.cookie('k', val, {
			expires: 14,
			path: '/'
		});
		$('#container').css('display', '');
		if ($(modal).is(':visible')) {
			$(modal).modal('hide');
		}
		callback();
	};
	var ng = function() {
		$(modal).modal({
			closable: false,
			transition: 'fade',
			onHidden: function() {
				$('#container').css('display', '');
				callback();
				$('#attention').modal({
					transition: 'fade',
					closable: true
				}).modal('show');
			}
		}).modal('show');
	};
	if ($(modal).is(':visible')) {
		$(modal).css('display', 'none');
	}
	$(modal).find('input').val('');
	if (typeof(authed) === 'undefined') {
		authed = '';
	}

	auth(authed).done(function(res) {
		if (res === 'OK') {
			ok(authed, callback);
		} else {
			ng();
		}
	}).fail(function(res) {
		ng();
	});
	$(modal).find('input').unbind('change').change(function() {
		var val = $(this).val();
		auth(val).done(function(res) {
			if (res === 'OK') {
				ok(val, callback);
			} else {
				ng();
			}
		}).fail(function(res) {
			ng();
		});
	});
};

/**
 * クエリパラメータのパース
 * /?key1=value&key2=value
 * をパースしてVst.cache.paramsに設定
 */
Vst.prototype.parseParams = function() {
	var obj = this;
	var str = window.location.search.replace('?', '');
	var arr = str.split('&');
	var params = {};
	var tmp = [];

	for (var i = 0; i < arr.length; ++i) {
		tmp = arr[i].split('=');
		params[tmp[0]] = tmp[1];
	}
	obj.cache.params = $.extend({}, params);

	if (
		typeof(obj.cache.params.n) === 'undefined' ||
		obj.cache.params.n === ''
	) {
		obj.cache.params.n = 1;
	}
};

/**
 * keyで指定された値を変更し、新しいクエリパラメータを作成
 * @param String key
 * @aram String value
 * @return String
 */
Vst.prototype.getNewUrl = function(key, val) {
	var obj = this;
	var url = '';
	var tmp = [];
	var params = $.extend(true, {}, obj.cache.params);

	params[key] = val;
	for (var k in params) {
		tmp.push(k + '=' + params[k]);
	}
	url = tmp.join('&');
	return '/?' + url + location.hash;
};

/**
 * 現在のページを設定・認識
 */
Vst.prototype.setPage = function() {
	var obj = this;
	var ac = ['anime', 'tv', 'music'];
	var selectSubmenu = function() {
		var a = 'c';

		if (
			typeof(obj.cache.params.a) !== 'undefined' &&
			obj.cache.params.a !== ''
		) {
			a = obj.cache.params.a;
		}
		$('div.tv.menu.secondary').find('a.item').removeClass('active');
		$('div.tv.menu.secondary').find('a.item').each(function() {
			if ($(this).attr('data-a') === a) {
				$(this).addClass('active');
			}
		});
	};

	$(obj.cache.elements.menu).find('a.item').removeClass('active');
	obj.loading(true);
	if (
		typeof(obj.cache.params.p) === 'string' &&
		ac.indexOf(obj.cache.params.p) >= 0
	) {
		$(obj.cache.elements.menu).find('a.item').each(function() {
			if ($(this).attr('data-page') === obj.cache.params.p) {
				$(this).addClass('active');
				document.title = 'On - ' + $(this).text();
				if (obj.cache.params.p === 'tv') {
					selectSubmenu();
				}
			}
		});
	} else {
		$(obj.cache.elements.menu).find('a.item').eq(0).addClass('active');
		obj.cache.params.p = 'anime';
		document.title = 'On - アニメ';
	}
};

/**
 * メニューのイベントを定義
 */
Vst.prototype.menuEvents = function() {
	var obj = this;

	$(obj.cache.elements.menu).find('a.item').click(function() {
		obj.cache.params.p = $(this).attr('data-page');
		obj.setPage();
	});
	if (
		typeof(obj.cache.params.s) === 'string' &&
		obj.cache.params.s.length > 0
	) {
		$(obj.cache.elements.menu).find('input').val(
			decodeURIComponent(obj.cache.params.s)
		);
	}
	$('#searchHistory').empty();
	var history = localStorage.getItem('search');
	if (history === null) {
		history = [];
	} else {
		history = JSON.parse(history);
	}
	for (var i = 0; i < history.length; ++i) {
		$('#searchHistory').append(
			'<option value="' + history[i] + '" />'
		);
	}
	$(obj.cache.elements.menu)
	.find('input').change(function() {
		if ($(this).val() !== '') {
			history.push($(this).val());
		}
		history = history.filter(function(x, i, s) {
			return s.indexOf(x) === i;
		});
		localStorage.setItem(
			'search', JSON.stringify(history)
		);
		if (obj.cache.params.p == 'music') {
			if (typeof(obj.cache.params.n) === 'string') {
				obj.cache.params.n = '1';
			}
		}
		location.href = obj.getNewUrl(
			's', encodeURIComponent($(this).val())
		);
	});
	if (!obj.isMobile()) {
		obj.writeTags();
	}
};

/**
 * TV番組の検索タグを出力
 */
Vst.prototype.writeTags = function() {
	var obj = this;
	var e = $('div.popup.tags');

	if (obj.cache.params.p !== 'tv') {
		return false;
	}
	$.ajax({
		url: '/tv/tags/',
		type: 'GET',
		dataType: 'json',
		success: function(res) {
			var str = [];

			for (var i = 0; i < res.length; ++i) {
				str.push(
					'<a class="ui button basic gray tiny left floated"',
					' style="margin-bottom: 2px;" ',
					'href="/?p=tv&s=',
					encodeURIComponent(res[i].tag),
					'">', res[i].tag, '</a>'
				);
			}
			$(e).html(str.join(''));
			$('div.item.tags').show();
		}
	});
};

/**
 * loadingのdimmerを表示・非表示
 */
Vst.prototype.loading = function(state, message) {
	var obj = this;
	var e = obj.cache.elements.content;

	if (typeof(message) === 'string' && message.length > 0) {
		var loader = [
			'<div id="loader" class="ui text loader" style="height:',
			'100%;">', message, '</div>'
		];
	} else {
		var loader = [
			'<div id="loader" class="ui loader" style="height:',
			'100%;"></div>'
		];
	}

	if ($(e).find('#loader').length > 0) {
		// loader有り
		$(e).find('#loader').remove();
		if (state) {
			// loader ON
			$(e).append(loader.join(''));
			$(e).addClass('loading');
		} else {
			$(e).removeClass('loading');
		}
	} else {
	 // loader無し
		if (state) {
			// loader ON
			$(e).append(loader.join(''));
			$(e).addClass('loading');
		} else {
			$(e).removeClass('loading');
		}
	}
};

/**
 * ブラウザの高さを返す
 */
Vst.prototype.windowHeight = function() {
	return $(window).height();
};

/**
 * page=anime/page=tvの一覧を生成
 */
Vst.prototype.writeList = function() {
	var obj = this;

	obj.loading(true);
	obj.getList(function(res) {
		var str = [
			'<table class="ui files">',
			'<colgroup>',
			'<col style="width: auto;">',
			'<col style="width: ',
			obj.isMobile()? '42px;">': '170px;">',
			'<col style="width: 90px;">',
			'</colgroup>',
			'<thead>',
			'<tr>',
			'<th colspan="3">', obj.pageName(true), '</th>',
			'</tr>',
			'<tr><th class="title">タイトル</th>',
			'<th class="date">更新日時</th>',
			'<th class="size">サイズ</th>',
			'</tr></thead>',
			'<tbody>'
		];

		for (var i = 0; i < res.count; ++i) {
			str.push(obj.createRow(res.titles[i]));
		}
		str.push(
			'</tbody>',
			'<tfoot>',
			obj.createPaginator(res, 3),
			'</tfoot>',
			'</table>'
		);
		obj.loading(false);
		$(obj.cache.elements.content).html(str.join(''));
		$(obj.cache.elements.content).find('a').click(function() {
			if ($(this).hasClass('play')) {
				$(this).addClass('played');
				obj.savePlayedVideo(
					obj.cache.params.sub,
					$(this).attr('data-play')
				);
				$('#video').find('div.loading').hide();
				obj.cache.showBitrate = false;
				obj.playVideo(this);
			} else if ($(this).attr('target') === '_blank') {
			} else {
				obj.init();
			}
		});
		if (
			obj.cache.params.p === 'tv' &&
			!obj.isset(obj.cache.params, 'a')
		) {
			obj.realTimeTv();
		}
	});
};

/**
 * page=anime/page=tvの行を生成
 * @param Object rec
 * @return String
 */
Vst.prototype.createRow = function(rec) {
	var obj = this;
	var str = [];
	var link = '';
	var dlLink = '';
	var reLink = '';
	var uid = (new Date()).getTime();
	var isPlayed = false;

	if (rec.isFile) {
		playLink = rec.playUrl;
		link = 'javascript:void(0);';
		dlLink = rec.playUrl + '&m=dl&name='
			+ encodeURIComponent(rec.name);
	} else {
		link = '/?p=' + obj.cache.params.p + '&sub=';
		if (typeof(obj.cache.params.sub) === 'string') {
			link += obj.cache.params.sub + '%2F';
		}
		link += encodeURIComponent(rec.name);
	}
	str.push(
		'<tr><td class="titles">'
	);
	if (rec.isFile) {
		if (rec.isPlayable) {
			isPlayed = obj.getPlayedVideo(
				obj.cache.params.sub, playLink
			);
			str.push(
				'<a href="', link,
				'" class="item ',
				(isPlayed? 'played ': ''),
				'play" data-dl="',
				dlLink,
				'" data-play="',
				playLink,
				'"><div class="ui content">',
				'<img class="ui image middle aligned bordered" src="',
				obj.imageUrl(rec.playUrl),
				'" width="80" height="45"/><span>',
				rec.name,
				'</span><span class="subName">',
				(rec.subName !== null? rec.subName: ''),
				'</span></div></a>',
				'</td>'
			);
		} else {
			reLink = rec.realAnimeUrl;
			isPlayed = obj.getPlayedVideo(
				obj.cache.params.sub, reLink
			);
			if (!rec.fullPath.match('.ts')) {
				str.push(
					'<a href="', link, '" class="item play ',
					(isPlayed? 'played ': ''),
					'" data-dl="',
					dlLink, '" data-play="', reLink,
					'"><div class="ui content">',
					'<img class="ui image middle aligned bordered" src="',
					obj.imageUrl(rec.playUrl),
					'" width="80" height="45"/><span>',
					rec.name,
					'</span></div></a>',
					'</td>'
				);
			} else {
				str.push(
					'<span class="item " data-dl="',
					dlLink,
					'"><div class="ui content">',
					'<img class="ui image middle aligned bordered" src="',
					obj.imageUrl(rec.playUrl),
					'" width="80" height="45"/><span>',
					rec.name,
					'</span></div></span>',
					'</td>'
				);
			}
		}
		str.push(
			'<td>', rec.updateDate, '</td>',
			'<td style="text-align: right;">',
			'<a href="',
			dlLink,
			'" target="movieDownload"><div class="ui content">',
			'<i class="icon cloud download"></i>',
			rec.size,
			' MB</div></a></td></tr>'
		);
	} else {
		str.push(
			'<a href="',
			link,
			'" class="item sub" data-name="',
			rec.name, '">',
			'<div class="ui content">',
			'<i class="ui icon folder"></i>',
			rec.name,
			'</div></a>',
			'</td>',
			'<td>', rec.updateDate, '</td>',
			'<td style="text-align: right;">',
			rec.size,
			' MB</td></tr>'
		);
	}
	return str.join('');
};

/**
 * page=anime/page=tvの一覧を取得
 * @Function callback
 * @return Object|Array
 */
Vst.prototype.getList = function(callback) {
	var obj = this;
	var tmp = [];

	if (typeof(obj.cache.params.sub) === 'string') {
		tmp.push('p=' + obj.cache.params.sub);
	}
	if (typeof(obj.cache.params.s) === 'string') {
		tmp.push('s=' + obj.cache.params.s);
		tmp.push('n=1');
	} else {
		tmp.push('n=' + obj.cache.params.n);
	}

	$.ajax({
		url: '/' + obj.cache.params.p + '/?' + tmp.join('&'),
		type: 'GET',
		dataType: 'json',
		success: function(res) {
			callback(res);
		}
	});
};

/**
 * ページネータを生成
 * @param Object res
 * @param Numeric colspan
 * @return String
 */
Vst.prototype.createPaginator = function(res, colspan) {
	var obj = this;
	var str = [
		'<tr><th colspan="',colspan,'">',
		'<div class="ui right floated pagination menu">',
		'<a class="item',
		res.page == 1? ' disabled': '',
		'" href="',obj.getNewUrl('n', 1), '">',
		'<i class="icon angle double left"></i>',
		'</a>',
		'<a class="item',
		res.page == 1? ' disabled': '',
		'" href="',obj.getNewUrl('n', res.page - 1), '">',
		'<i class="icon angle left"></i>',
		'</a>',
		'<div class="item">',
		res.page,' / ',res.pages, '</div>',
		'<a class="item',
		res.page == res.pages? ' disabled': '',
		'" href="',obj.getNewUrl('n', Number(res.page) + 1), '">',
		'<i class="icon angle right"></i>',
		'</a>',
		'<a class="item',
		res.page == res.pages? ' disabled': '',
		'" href="',obj.getNewUrl('n', res.pages), '">',
		'<i class="icon angle double right"></i>',
		'</a>'
	];
	str.push('</div></th></tr>');
	return str.join('');
};

/**
 * 動画の再生・停止を切り替え
 * @param boolean fourceStop
 * @return boolean
 */
Vst.prototype.toggleState = function(fourceStop) {
	var v = $('#player').find('video').get(0);
	var btn = $('#player').find('#controller > i').eq(0);

	if (v.paused) {
		if (!fourceStop) { 
			v.play();
			$(btn).removeClass('play').addClass('pause');
		}
	} else {
		v.pause();
		$(btn).removeClass('pause').addClass('play');
	}
	if (fourceStop) {
		$('#player').find('video')
			.removeAttr('src');
		v.load();
	}
	return false;
};

/**
 * 動画を再生
 * @param jQueryObject|String elem
 */
Vst.prototype.playVideo = function(elem) {
	var obj = this;
	var playUrl = $(elem).attr('data-play');
	var name = (function() {
		var tmp = $(elem).find('span');
		var strArray = [];
		
		$(tmp).each(function() {
			strArray.push($(this).text());
		});
		return strArray.join('&nbsp;&nbsp;');
	})(elem);
	var modal = $('#player');
	var exUrl = null;

	$('#seekbar > #gage').width('0%');
	if (playUrl.match('.webm')) {
		exUrl = $(elem).attr('data-dl').replace('&m=dl', '');
	}

	$(modal).find('.videoTitle').html(
		obj.pageName(false)
		+ '&nbsp;>&nbsp;' + name
	);
	if (obj.isRealTimeAnime(playUrl)) {
		$(modal).find('i.signal').addClass('disabled');
	} else {
		$(modal).find('i.signal').removeClass('disabled');
	}
	$(modal).find('i.signal').unbind('click').click(function() {
		if ($(this).hasClass('disabled')) {
			return false;
		}
		if (obj.cache.showBitrate) {
			obj.cache.showBitrate = false;
			$('#player').find('#bitrate').hide();
		} else {
			obj.cache.showBitrate = true;
			$('#player').find('#bitrate').show();
		}
	});
	$('#videoInfo').remove();
	$('#controller').find('i.forward,i.backward').addClass('disabled');
	obj.setPlayer(modal, playUrl, exUrl);
	if (!obj.isMobile()) {
		//obj.getCaption(playUrl);
		if ($(modal).is(':hidden')) {
			$(modal)
			.modal({
				closable: true,
				onHidden: function() {
					obj.toggleState(true);
					obj.cache.showBitrate = false;
					$(modal).find('#bitrate').hide();
					$('.videoTitle > i').hide();
				}
			}).modal('show');
		}
	}
};

/**
 * 動画プレーヤが表示されているかを返す
 * @param jQueryObject|String elem
 * @return boolean
 */
Vst.prototype.isVisiblePlayer = function(target) {
	if ($(target).attr('src') !== '') {
		return true;
	}
	return false;
};

/**
 * 再生URLから画像URLを生成
 * @param String playUrl
 * @return String
 */
Vst.prototype.imageUrl = function(playUrl) {
	if (playUrl.match('/poster/')) {
		return playUrl.replace('/poster/', '/play/');
	}
	return playUrl.replace('/play/', '/poster/');
};

/**
 * fullPathからリアルタイムエンコードのアニメURLに変換
 * @param String fullPath
 * @return String
 */
Vst.prototype.realAnimeUrl = function(fullPath) {
	var path = fullPath.replace('/mnt/anime/', '')
		.replace('/', '##');
	var link = '/realanime/'
		+ encodeURIComponent(path) + '/watch.webm';
	return link;
};

/**
 * 動画プレーヤの初期化
 * @param jQueryObject|String modal
 * @param String url
 * @param String exUrl
 */
Vst.prototype.setPlayer = function(modal, url, exUrl) {
	var obj = this;
	var v = $(modal).find('video').get(0);
	var timer = false;
	var sdvUrl = obj.cache.sdvUrl + url;
	var sdvCUrl = sdvUrl.replace('/play/', '/play/exists.php');
	var isMobile = obj.isMobile();
	var isRealAnime = false;

	if (obj.isRealTimeAnime(url)) {
		$(modal).find('video').attr('type', 'video/webm');
		isRealAnime = true;
	} else {
		$(modal).find('video').attr('type', 'video/mp4');
	}

	if (!isMobile) {
		v.controls = false;
		setTimeout(function() {
			obj.setVideoSize(modal);
		}, 50);
	}
	if (isRealAnime) {
		if (isMobile) {
			location.href = sdvUrl;
		} else {
			obj.sizeSelector(modal, sdvUrl, false);
		}
	} else {
		$('#controller,#thumbnail').css('display', 'none');
		$.ajax({
			url: sdvCUrl,
			type: 'GET',
			dataType: 'text',
			success: function(res) {
				if (res === '1') {
					// SD有り
					if (isMobile) {
						location.href = sdvUrl;
					} else {
						obj.sizeSelector(modal, url, sdvUrl);
					}
				} else {
					if (isMobile) {
						location.href = url;
					} else {
						obj.sizeSelector(modal, url, false);
					}
				}
			}
		});
	}
	if (!isMobile) {
		$(modal).find('video, div.state').unbind('click').click(function(e) {
			if ($('video').attr('src') !== '') {
				return obj.toggleState(false);
			}
		});
		$(window).unbind('keyup').keyup(function(ev) {
			if (ev.which == 32 && $('video').attr('src') !== '') {
				ev.preventDefault();
				obj.toggleState(false);
				return false;
			}
		});
	}
};

/**
 * 独自のビデオコントローラを動作させる
 */
Vst.prototype.videoController = function() {
	var obj = this;
	var video = $('#player').find('video').get(0);
	var controller = $('#player').find('#controller');
	var timer = false;
	var showController = function(timeout) {
		clearTimeout(timer);
		if (timeout) {
			$(controller).slideDown(300);
			$('#player').find('video').css('cursor', 'default');
			timer = setTimeout(function() {
				hideController();
			}, 6300);
		} else {
			$(controller).slideDown(300);
		}
	};
	var hideController = function() {
		$(controller).slideUp(300, function() {
			$('#player').find('video').css('cursor', 'none');
		});
		if ($('#player').find('#thumbnail').is(':visible')) {
			$('#player').find('#thumbnail').fadeOut(300, function() {
			})
		}
	};

	showController(true);
	obj.updateVideoSeekbar(video);
	$('#player').find('video').unbind('mousemove')
	.bind('mousemove', function() {
		$('#player').find('video').css('cursor', 'default');
		if ($('#sizeSelector,#channelSelector').is(':visible')) {
			$(controller).css('display', 'none');
		} else {
			showController(true);
		}
	});
	$('#controller').bind('mouseover', function() {
		showController(false);
	}).bind('mouseout', function(e) {
		showController(true);
		if ($('#player').find('#thumbnail').is(':visible')) {
			if ($(e.target).is('#seekbar,#seekbarOuter,#gage')) {
				return;
			}
			$('#player').find('#thumbnail').fadeOut(300);
		}
	});
	// 再生ボタン
	$('#controller > i').eq(0).unbind('click').click(function() {
		obj.toggleState(false);
	});
	// フルスクリーン
	$('#controller > i.expand').unbind('click').click(function() {
		if (!obj.isFullscreen()) {
			obj.requestFullscreen($('#full').get(0));
		} else {
			obj.exitFullscreen();
		}
	});
	// フルスクリーン切替時
	if (!obj.cache.events.fullScreenChange) {
		obj.bindFullscreenChange(function() {
			$('#player').find('.videoTitle').css('display', 'none');
			obj.setFullScreenVideoStyle();
		}, function() {
			$('#player').find('.videoTitle').css('display', 'block');
			obj.setVideoSize('#player');
			setTimeout(function() {
				obj.setVideoSize('#player');
			}, 80);
			obj.unsetFullScreenVideoStyle();
		});
		obj.cache.events.fullScreenChange = true;
	}
	// 次へ・前へ
	setTimeout(function() {
		if (obj.videoHasNext(video)) {
			$('#controller').find('i.forward').removeClass('disabled');
		} else {
			$('#controller').find('i.forward').addClass('disabled');
		}
		if (obj.videoHasPrev(video)) {
			$('#controller').find('i.backward').removeClass('disabled');
		} else {
			$('#controller').find('i.backward').addClass('disabled');
		}
		$('#controller').find('i.forward')
			.unbind('click').click(function() {
				if ($(this).not('.disabled')) {
					obj.playNextVideo(video);
				}
			});
		$('#controller').find('i.backward')
			.unbind('click').click(function() {
				if ($(this).not('.disabled')) {
					obj.playPrevVideo(video);
				}
			});
	}, 40);
};

/**
 * timeupdateイベントでVideoControllerのシークバーを更新
 */
Vst.prototype.updateVideoSeekbar = function(video) {
	var obj = this;
	var player = $('#player').get(0);
	var thumbnail = $('#player').find('#thumbnail');
	
	$('#seekbar > #age').width('0%');
	$('#controller > #time').html(
		'00:00:00&nbsp;/&nbsp;00:00:00'
	);
	if (!obj.cache.events.videoTimeupdate) {
		obj.cache.events.videoTimeupdate = true;
		video.addEventListener('timeupdate', function() {
			var d = video.duration;
			var df = obj.formatTime(d, true);
			var c = video.currentTime;
			var p = obj.calcPart(c, d);
			$('#seekbar > #gage').width(p + '%');

			$('#controller > #time').html(
				obj.formatTime(c, true) + '&nbsp;/&nbsp;' + df
			);
			obj.videoVolume(video);
		});
	}
	$('#seekbarOuter').unbind('click').click(function(e) {
		var d = $(this).width();
		var c = e.originalEvent.layerX;
		var p = obj.calcPart(c, d);
		var dx = video.duration;
		
		if (obj.isRealTimeAnime(video.src)) {
			return false;
		}
		video.currentTime = dx * (p / 100);
	});
	var tTimer = true;
	var img = $(thumbnail).find('img');
	$(img).bind('load', function() {
		tTimer = true;
	});
	$('#seekbarOuter').bind('mousemove', function(e) {
		var left = e.layerX - 112;
		var d = $(this).width();
		var c = e.originalEvent.layerX;
		var p = obj.calcPart(c, d);
		var dx = video.duration;
		var t = Math.floor(dx * (p / 100));
		var url = video.src.replace('/play/', '/play/thumbnail/')
			+ '&t=' + t;
		$(thumbnail)
			.css('left', c + 'px')
			.css('display', 'block');
		if (tTimer &&
			obj.cache.params.p === 'anime' &&
			video.src.match('on.string.tokyo')
		) {
			$(img).attr('src', url);
			tTimer = false;
		} else if (obj.cache.params.p === 'tv') {
			$(img).attr('src', '/img/thumbnails/p/black.png');
			tTimer = false;
		}
		$(thumbnail).find('#targetTime')
			.text(obj.formatTime(t, true));
	});
};

/**
 * 次の動画を再生
 * @param jQueryObject video
 */
Vst.prototype.playNextVideo = function(video) {
	var obj = this;
	var playUrl = $(video).attr('src').replace(
		obj.cache.sdvUrl, ''
	);
	var list = $('#content').find('a.item.play');

	obj.toggleState(true);
	$('#player').find('div.loading').show();
	setTimeout(function() {
		for (var i = 0; i < list.length; ++i) {
			cur = $(list).eq(i);
			if ($(cur).attr('data-play') === playUrl) {
				if (i < list.length - 1) {
					obj.savePlayedVideo(
						obj.cache.params.sub,
						$(list).eq(i + 1).attr('data-play')
					);
					$(list).eq(i + 1).addClass('played');
					return obj.playVideo($(list).eq(i + 1));
				}
			}
		}
	}, 80);
};

/**
 * 前の動画を再生
 * @param jQueryObject video
 */
Vst.prototype.playPrevVideo = function(video) {
	var obj = this;
	var playUrl = $(video).attr('src').replace(
		obj.cache.sdvUrl, ''
	);
	var list = $('#content').find('a.item.play');
	
	obj.toggleState(true);
	$('#player').find('div.loading').show();
	setTimeout(function() {
		for (var i = (list.length - 1); i >= 0; --i) {
			cur = $(list).eq(i);
			if ($(cur).attr('data-play') === playUrl) {
				if (i > 0) {
					obj.savePlayedVideo(
						obj.cache.params.sub,
						$(list).eq(i - 1).attr('data-play')
					);
					$(list).eq(i - 1).addClass('played');
					return obj.playVideo($(list).eq(i - 1));
				}
			}
		}
	}, 80);
};

/**
 * 動画コントローラの次へボタンを有効にするか
 * @param jQueryObject video
 * @return boolean
 */
Vst.prototype.videoHasNext = function(video) {
	var obj = this;
	var playUrl = $(video).attr('src').replace(
		obj.cache.sdvUrl, ''
	);
	var list = $('#content').find('a.item.play');

	for (var i = 0; i < list.length; ++i) {
		cur = $(list).eq(i);
		if ($(cur).attr('data-play') === playUrl) {
			if (i < list.length - 1) {
				return true;
			}
		}
	}
	return false;
};

/**
 * 動画コントローラの前へボタンを有効にするか
 * @param jQueryObject video
 * @return boolean
 */
Vst.prototype.videoHasPrev = function(video) {
	var obj = this;
	var playUrl = $(video).attr('src').replace(
		obj.cache.sdvUrl, ''
	);
	var list = $('#content').find('a.item.play');

	for (var i = (list.length - 1); i >= 0; --i) {
		cur = $(list).eq(i);
		if ($(cur).attr('data-play') === playUrl) {
			if (i > 0) {
				return true;
			}
		}
	}
	return false;
};

/**
 * 指定のtargetのフルスクリーン開始
 * @param HTMLElement target
 */
Vst.prototype.requestFullscreen = function(target) {
	if (target.webkitRequestFullscreen) {
		target.webkitRequestFullscreen(); //Chrome,Safari,Opera
	} else if (target.mozRequestFullScreen) {
		target.mozRequestFullScreen(); //FF10+
	} else if (target.msRequestFullscreen) {
		target.msRequestFullscreen(); //IE11+
	} else if (target.requestFullscreen) {
		target.requestFullscreen(); // HTML5 Fullscreen API仕様
	}
};

/**
 * フルスクリーンを終了
 */
Vst.prototype.exitFullscreen = function() {
	if (document.webkitCancelFullScreen) {
		document.webkitCancelFullScreen(); // Chrome,Safari,Opera
	} else if (document.mozCancelFullScreen) {
		document.mozCancelFullScreen(); //FF10+
	} else if (document.msExitFullscreen) {
		document.msExitFullscreen(); //IE11+
	} else if(document.cancelFullScreen) {
		document.cancelFullScreen(); //Gecko:FullScreenAPI仕様
	} else if(document.exitFullscreen) {
		document.exitFullscreen(); // HTML5 Fullscreen API仕様
	}
};

/**
 * フルスクリーンが有効の場合true
 * @return boolean
 */
Vst.prototype.isFullscreen = function() {
	var isFull = document.fullScreen ||
		document.mozFullScreen ||
		document.webkitIsFullScreen ||
		document.msFullscreenEnabled;
	
	return isFull;
};

/**
 * フルスクリーンの開始・終了でイベントをバインド
 * @param Function onEnter
 * @param Function onExit
 */
Vst.prototype.bindFullscreenChange = function(onEnter, onExit) {
	var obj = this;
	var eventNames = [
		'webkitfullscreenchange',
		'mozfullscreenchange',
		'fulscreenchange'
	];

	$(document).bind(
		eventNames.join(' '),
		function() {
			var isFull = obj.isFullscreen();
			if (isFull) {
				onEnter();
			} else {
				onExit();
			}
		}
	);
};

/**
 * 動画の音量を設定・変更
 * @param HTMLVideoElement
 */
Vst.prototype.videoVolume = function(video) {
	var obj = this;
	var clickEv = function(e) {
		var d = $(this).width();
		var c = e.originalEvent.offsetX;
		var p = obj.calcPart(c, d);
		
		if (p > 100) {
			p = 100;
		} else if (p < 0) {
			p = 0;
		}
		setVolume(p / 100);
	};
	var setVolume = function(volume) {
		volume = parseFloat(volume);
		video.volume = volume;
		localStorage.setItem('volume', getVolume());
		$('#volumeController > #volumeGage').css(
			'width', (volume * 100) + '%'
		);
	};
	var getVolume = function() {
		return video.volume;
	};

	if (localStorage.getItem('volume') !== null) {
		setVolume(localStorage.getItem('volume'));
	} else {
		setVolume(1.0);
	}
	$('#volumeController > #volumeGage').css(
		'width', (getVolume() * 100) + '%'
	);
	$('#volumeOuter').unbind('mouseup').mouseup(clickEv);
	$('#volumeContainer > i.volume').click(function() {
		if (video.muted) {
			video.muted = false;
			$(this).removeClass('off').addClass('up');
		} else {
			video.muted = true;
			$(this).removeClass('up').addClass('off');
		}
	});
};

/**
 * TV番組のHD/SDを選択するボタンを表示
 * @param jQueryObject modal
 * @param String hdUrl
 * @param String sdUrl
 */
Vst.prototype.sizeSelector = function(modal, hdUrl, sdUrl) {
	var obj = this;
	var str = [
		'<div id="sizeSelector" style="',
		'width: 258px; height: 42px; ',
		'background-color: rgba(0,0,0,0.0.6); ',
		'color: #ffffff; ',
		'position: absolute; ',
		'top: calc(50% - 20px); ',
		'left: calc(50% - 129px); opacity: 0.8;">',
		'<div class="ui buttons large">',
		'<div class="ui button hd" data-url="',
		hdUrl,
		'">',
		'高画質(HD)</div><div class="ui button sd" data-url="',
		sdUrl,
		'">',
		'低負荷(SD)</div></div>',
		'</div>'
	];

	$(modal).find('#sizeSelector').remove();
	$(modal).find('.state').css('display', 'none');
	if (sdUrl !== false) {
		$(modal).find('div.loading').hide();
		$(modal).find('video').after(str.join(''));
		$(modal).find('div.hd, div.sd').click(function() {
			if ($(this).hasClass('sd')) {
				$(modal).find('video').attr('src', sdUrl)
					.attr('data-size', 'SD');
				obj.showDetail(sdUrl);
			} else {
				$(modal).find('video').attr('src', hdUrl)
					.attr('data-size', 'HD');
				obj.showDetail(hdUrl);
			}
			$(modal).find('#sizeSelector').fadeOut(200, function() {
				$(this).remove();
			});
		});
	} else {
		$(modal).find('video').attr('src', hdUrl)
			.attr('data-size', 'HD');
		if (obj.isRealTimeAnime(hdUrl)) {
			obj.showDetailForRealTimeAnime();
		} else {
			obj.showDetail(hdUrl);
		}
	}
};

/**
 * 動画の詳細を表示
 * @param String url
 */
Vst.prototype.showDetail = function(url) {
	var infoUrl = url.replace('/play/', '/info/');
	var str = [
		'<div id="videoInfo">',
		'<img src="" width="50" height="50" />',
		'__TABLE__',
		'</div>'
	];
	
	$('#videoInfo').remove();
	this.cache.stateTimer = setTimeout(function() {
		$.ajax({
			url: infoUrl,
			type: 'GET',
			dataType: 'json',
			success: function(res) {
				var table = [
					'<table><tr>',
					'<th>Profile</th>',
					'<td>', res.profile, ' @ Level ',
					res.level,
					'</td></tr><tr>',
					'<th>Resolution</th><td>', res.size['width'], ' x ',
					res.size['height'],
					(res.size['width'] == 1440 && res.size['height'] == 1080)?
						' @ 16:9': '',
					'</td></tr><tr>',
					'<th>FPS</th><td>',
					res.fps, '</td></tr><tr>',
					'<th>Bitrate</th><td>',
					res.bitrate, '</td></tr>',
					'</table>'
				];
				$('#player > div.dimmable').append(
					str.join('').replace('__TABLE__', table.join(''))
				);
				$('#videoInfo > img')
					.attr('src', '/img/' + res.type.toLowerCase() + '.png')
				$('#videoInfo').fadeIn(200, function() {
					setTimeout(function() {
						$('#videoInfo').fadeOut(200);
					}, 12000);
				});
			}
		});
	}, 2500);
};

/**
 * リアルタイム変換動画の詳細を表示
 * @param String url
 */
Vst.prototype.showDetailForRealTimeAnime = function() {
	var str = [
		'<div id="videoInfo">',
		'<img src="" width="50" height="50" />',
		'__TABLE__',
		'</div>'
	];
	
	$('#videoInfo').remove();
	this.cache.stateTimer = setTimeout(function() {
		var table = [
			'<table><tr>',
			'<th>Profile</th>',
			'<td>VP9 @ High</td></tr><tr>',
			'<th>Resolution</th><td>720 x 540 @ 16:9</td></tr><tr>',
			'<th>FPS</th><td>',
			'24 (23.98)</td></tr><tr>',
			'<th>Bitrate</th><td>',
			'リアルタイム変換中</td></tr>',
			'</table>'
		];
		$('#player > div.dimmable').append(
			str.join('').replace('__TABLE__', table.join(''))
		);
		$('#videoInfo > img').attr('src', '/img/sd.png')
		$('#videoInfo').fadeIn(200, function() {
			setTimeout(function() {
				$('#videoInfo').fadeOut(200);
			}, 12000);
		});
	}, 2500);
};

/**
 * 動画プレーヤのサイズを自動設定
 * @param jQueryObject|String modal
 */
Vst.prototype.setVideoSize = function(modal) {
	var obj = this;
	var width = $(document).width();
	var height = Math.floor(width * 0.5625);
	var dHeight = $(window).height();
	var mTop = 0;
	
	if (height > dHeight - 200) {
		height = dHeight - 200;
	}
	mTop = Math.ceil((height + 38) / 2);

	$(modal)
		.css('margin-top', '-' + mTop + 'px')
		.css('width', width + 'px')
		.css('height', (height + 38) + 'px');
	if (obj.isFullscreen()) {
		$(modal).find('video')
			.css('width', '100vw')
			.css('height', '100vh');
	} else {
		$(modal).find('video')
			.css('width', width + 'px')
			.css('height', height + 'px')
			.attr('width', width)
			.attr('height', height);
	}
};

/**
 * 動画プレーヤのイベントを定義
 * @param jQueryObject|String modal
 */
Vst.prototype.videoEvents = function(modal) {
	var obj = this;
	var video = $(modal).find('video').get(0);
	var timer = false;
	var interval = false;
	var isRealTimeAnime = false;
	var timeout = 0;

	video.controls = false;
	video.autoplay = false;
	video.addEventListener('loadstart', function() {
		$(modal).find('div.loading').show();
	});
	video.addEventListener('contextmenu', function(e) {
		e.preventDefault();
	});
	video.addEventListener('waiting', function() {
		if (video.src !== '') {
			$(modal).find('div.loading').show();
		}
	});
	video.addEventListener('canplay', function() {
		$(modal).find('div.loading').hide();
	});
	video.addEventListener('canplaythrough', function() {
		isRealTimeAnime = obj.isRealTimeAnime(video.src);
		if (isRealTimeAnime) {
			timeout = 80;
		} else {
			timeout = 1500;
		}
		if (localStorage.getItem('volume') !== null) {
			video.volume = localStorage.getItem('volume');
		}
		setTimeout(function() {
			video.play();
			$('#player')
				.find('#controller > i').eq(0)
				.removeClass('play').addClass('pause');
			obj.videoController();
		}, timeout);
		$('.videoTitle > i').show();
	});
	video.addEventListener('play', function() {
		$(modal).find('div.loading').hide();
		$(modal).find('div.state').fadeOut(200);
		if (interval !== false) {
			clearInterval(interval);
			interval = false;
		}
		/*
		if ($(modal).find('#videoInfo').is(':visible')) {
			$(modal).find('#videoInfo').fadeOut(200);
		}
		*/
		interval = setInterval(function() {
			var time = Math.round(video.currentTime);
			try {
				var content = $(modal).find('video').attr('src').replace(
					'/play/', '/info/bitrate/'
				);
				if (obj.cache.showBitrate) {
					obj.getCurrentBitrate(content, time, obj.showBitrate);
				}
			} catch (e) {}
		}, 1300);
	});
	video.addEventListener('pause', function() {
		clearTimeout(obj.cache.stateTimer);
		obj.cache.stateTimer = 0;
		$(modal).find('#videoInfo').fadeIn(200, function() {
			setTimeout(function() {
				$(modal).find('#videoInfo').fadeOut(200);
			}, 12000);
		});
		$(modal).find('div.state > i')
			.removeClass('play')
			.addClass('pause');
		$(modal).find('div.state').fadeIn(200);
		if (interval !== false) {
			clearInterval(interval);
			interval = false;
		}
	});
	video.addEventListener('volumechange', function() {
		localStorage.setItem('volume', video.volume);
	});
	$(window).resize(function() {
		clearTimeout(timer);
		obj.setVideoSize(modal);
		timer = setTimeout(function() {
			obj.setVideoSize(modal);
		}, 80);
	});
};

/**
 * 各ページのページ名を返す
 * @param boolean createLink
 * @return String
 */
Vst.prototype.pageName = function(createLink) {
	var obj = this;
	var base = '';
	if (this.cache.params.p === 'anime') {
		if (createLink) {
			base = '<a href="/?p=anime">' + 'アニメ' + '</a>';
		} else {
			base = 'アニメ';
		}
	} else {
		if (createLink) {
			base = '<a href="/?p=tv">' + 'TV番組' + '</a>';
		} else {
			base = 'TV番組';
		}
	}
	var name = (function(o) {
		var tmp = decodeURIComponent(o.params.sub);
		var split = tmp.split('/');
		var link = '/?p=' + o.params.p;
		var links = [];

		for (var i = 0; i < split.length; ++i) {
			if (split[i] === 'undefined') {
				continue;
			}
			if (i == 0) {
				link += '&sub=';
			} else {
				link += '/';
			}
			link += encodeURIComponent(split[i]);
			links.push(
				['<a href="', link, '">', split[i], '</a>'].join('')
			);
		}
		if (links.length == 0) {
			return undefined;
		}
		if (createLink) {
			return links.join('&nbsp;>&nbsp;');
		} else {
			return split.join('&nbsp;>&nbsp;');
		}
	})(obj.cache);
	
	if (
		obj.cache.params.p === 'tv' &&
		obj.isset(obj.cache.params, 'a')
	) {
		if (obj.cache.params.a === 'r') {
			base += '&nbsp;>&nbsp;キーワード予約';
		} else if (obj.cache.params.a === 's') {
			base += '&nbsp;>&nbsp;番組検索';
		}
	}
	if (name === 'undefined' || name === undefined) {
		return base;
	}
	return base + '&nbsp;>&nbsp;' + name;
};

/**
 * Object内のキーに値があるかをチェック
 * @param Object obj
 * @param String k
 * @return boolean
 */
Vst.prototype.isset = function(obj, k) {
	if (
		typeof(obj[k]) === 'undefined' ||
		typeof(obj[k]) !== 'string' ||
		obj[k] === 'undefined' ||
		obj[k].length == 0
	) {
		return false;
	}
	return true;
};

/**
 * キーワード予約の一覧を出力
 */
Vst.prototype.writeRules = function() {
	var obj = this;

	obj.loading(true);
	obj.getRules(function(res) {
		var str = [
			'<table class="ui files">',
			'<colgroup>',
			'<col style="width: calc(100% - 220px);">',
			'<col style="width: 220px;">',
			'</colgroup>',
			'<thead>',
			'<tr>',
			'<th colspan="2">', obj.pageName(false), '</th></tr><tr>',
			'<th>キーワード</th>',
			'<th class="four wide">チャンネル</th>',
			'</tr>',
			'</thead>',
			'<tbody>'
		];

		for (var i = 0; i < res.count; ++i) {
			str.push(
				'<tr><td>', res.titles[i].name, '</td>',
				'<td class="keywords">',
				'<div class="ui content">',
				'<img class="ui image middle aligned bordered" src="',
				res.titles[i].channel.logo,
				'" width="64" height="36"/><span>',
				res.titles[i].channel.name,
				'</span></div>',
				'</td></tr>'
			);
		}
		str.push(
			'</tbody>',
			'<tfoot>',
			obj.createPaginator(res, 2),
			'</tfoot>',
			'</table>'
		);
		obj.loading(false);
		$(obj.cache.elements.content).html(str.join(''));
		$('#addKeyword').unbind('click').click(function() {
			obj.addKeyword(null);
		});
	});
};

/**
 * キーワード予約の一覧を取得
 * @param Function callback
 */
Vst.prototype.getRules = function(callback) {
	var obj = this;
	var tmp = [];

	if (obj.isset(obj.cache.params, 's')) {
		tmp.push('s=' + obj.cache.params.s);
		tmp.push('n=1');
	} else {
		tmp.push('n=' + obj.cache.params.n);
	}

	$.ajax({
		url: '/tv/rules/?' + tmp.join('&'),
		type: 'GET',
		dataType: 'json',
		success: function(res) {
			callback(res);
		}
	});
};

/**
 * 番組検索の一覧を出力
 */
Vst.prototype.writePrograms = function() {
	var obj = this;
	var typeName = function(type) {
		if (type === 'GR') {
			return '地上';
		} else if (type === 'BS') {
			return 'BS';
		}
		return '-';
	};

	obj.loading(true);
	obj.getPrograms(function(res) {
		var str = [
			'<table class="ui files">',
			'<colgroup>',
			'<col style="width: calc(100% - 150px - 220px);">',
			'<col style="width: ',
			obj.isMobile()? '42px;">': '150px;">',
			'<col style="width: 220px;">',
			'</colgroup>',
			'<thead>',
			'<tr>',
			'<th colspan="3">', obj.pageName(false), '</th>',
			'</tr>',
			'<tr>',
			'<th class="title">タイトル</th>',
			'<th class="date">日時</th>',
			'<th class="channel">チャンネル</th>',
			'</tr></thead>',
			'<tbody>'
		];

		for (var i = 0; i < res.count; ++i) {
			str.push(
				'<tr class="',
				res.titles[i].isReserve? 'reserved': '',
				'"><td class="keywords">', 
				'<a href="javascript:void(0);" ',
				'class="item ',
				'reserve" data-id="',
				res.titles[i].id,
				'" data-reserve="',
				res.titles[i].isReserve? '1" title="予約済"': '0" title="予約"',
				'><div class="ui content">',
				res.titles[i].isReserve? '<i class="icon video play large"></i>': '',
				'<span>',
				res.titles[i].name,
				'</span></div></a></td>',
				'<td>', res.titles[i].date.start, '</td>',
				'<td class="keywords">',
				'<div class="ui content">',
				'<img class="ui image middle aligned bordered" src="',
				res.titles[i].channel.logo,
				'" width="64" height="36"/><span>',
				res.titles[i].channel.name,
				'</span></div>',
				'</td>',
				'</tr>'
			);
		}
		str.push(
			'</tbody>',
			'<tfoot>',
			obj.createPaginator(res, 3),
			'</tfoot>',
			'</table>'
		);
		obj.loading(false);
		$(obj.cache.elements.content).html(str.join(''));
		$(obj.cache.elements.content).find('a.reserve').click(function() {
			obj.reserveEvents(this);
		});
	});
};

/**
 * 番組検索の一覧を取得
 * @param Function callback
 */
Vst.prototype.getPrograms = function(callback) {
	var obj = this;
	var tmp = [];

	if (obj.isset(obj.cache.params, 's')) {
		tmp.push('s=' + obj.cache.params.s);
		tmp.push('n=1');
	} else {
		tmp.push('n=' + obj.cache.params.n);
	}

	$.ajax({
		url: '/tv/programs/?' + tmp.join('&'),
		type: 'GET',
		dataType: 'json',
		success: function(res) {
			callback(res);
		}
	});
};

/**
 * 録画予約用モーダル表示
 * @param jQueryObject|String elem
 */
Vst.prototype.reserveEvents = function(elem) {
	var obj = this;
	var id = $(elem).attr('data-id');
	var url = '/tv/program/?id=' + id;

	$.ajax({
		url: url,
		dataType: 'json',
		type: 'GET',
		success: function(res) {
			var chStr = [
				'<div class="ui content">',
				'<img class="ui image middle aligned bordered" src="',
				res.channel.logo,
				'" width="64" height="36"/><span style="',
				'padding-left: 10px; display: inline-block; ',
				'width: calc(100% - 90px); height: 36px; ',
				'vertical-align: middle; line-height: 36px; ',
				'overflow: hidden; white-space: nowrap;">',
				res.channel.name,
				'</span></div>'
			];

			$('#reserve').find('td.title').text(res.name);
			$('#reserve').find('td.date').text(res.date.start);
			$('#reserve').find('td.duration').text(res.duration);
			$('#reserve').find('td.channel').html(chStr.join(''));
			$('#reserve').find('td.detail').html(res.detail);
			if (res.isReserve) {
			$('#reserve').find('td.reserveStat').text('予約済');
				$('#reserve').find('div.button').addClass('disabled');
			} else {
				$('#reserve').find('td.reserveStat').text('無し');
				$('#reserve').find('div.button').removeClass('disabled');
			}
			obj.autoLink($('#reserve').find('td.detail'));
			$('#reserve').modal({
				closablse: true
			}).modal('show');
		}
	});
	$('#reserve').find('div.button').unbind('click').click(function() {
		if ($(this).not('.disabled')) {
			obj.reserve(id);		
		}
	});
};

/**
 * 録画実行
 * @param String id
 */
Vst.prototype.reserve = function(id) {
	var url = '/tv/reserve/';

	$('#reserve').find('div.button').addClass('disabled');
	$.ajax({
		url: url,
		type: 'POST',
		dataType: 'text',
		data: {id: id},
		success: function(res) {
			if (res === 'OK') {
				$('#reserve').find('td.reserveStat').text('予約済');
			} else {
				$('#reserve').find('td.reserveStat').text('エラー');
			}
		},
		error: function() {
			$('#reserve').find('td.reserveStat').text('エラー');
		}
	});
};

/**
 * 指定の要素内のhttp://等の文字列にaタグを付加
 * @param jQueryObject|String target
 */
Vst.prototype.autoLink = function(target) {
	$(target).each(function() {
		var html = $(this).html();

		$(this).html(html.replace(
			/(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig,
			"<a rel=\"noreferrer\" href=\"$1\" target=\"_blank\">$1</a>"
		));
	});
};

/**
 * キーワード予約追加(!!!!後処理未実装!!!!)
 * @param String kwd
 */
Vst.prototype.addKeyword = function(kwd) {
	var obj = this;

	if (kwd !== null) {
		$('#ruleEditor').find('.keyword > input').val(kwd);
	}
	obj.getChannels(function(res) {
		$('#ruleEditor').find('.dropdown').html(
			'<option value=""></option>'
		);
		for (var k in res) {
			$('#ruleEditor').find('.dropdown').append(
				'<option value="' + k + '">'
				+ res[k].name + '</option>'
			);
		}

		$('#ruleEditor').find('.dropdown').dropdown();
		$('#ruleEditor').find('.button').addClass('disabled');
		$('#ruleEditor').find('.keyword').val('');
		$('#ruleEditor').modal({
			closable: true
		}).modal('show');
		$('#ruleEditor').find('.keyword').unbind('change')
		.change(function() {
			if ($(this).val().length >= 4) {
				$('#ruleEditor').find('.button').removeClass('disabled');
			} else {
				$('#ruleEditor').find('.button').addClass('disabled');
			}
		});
	});
	$('#ruleEditor').find('.button').unbind('click').click(function() {

	});
};

/**
 * 既知のチャンネル一覧を取得
 * @param Function callback
 */
Vst.prototype.getChannels = function(callback) {
	var url = '/tv/channels/';

	$.ajax({
		url: url,
		type: 'GET',
		dataType: 'json',
		success: function(res) {
			callback(res);
		}
	});
};

/**
 * iPhone/iPad/Android判定
 * @return boolean
 */
Vst.prototype.isMobile = function() {
	var ua = navigator.userAgent;
	var targets = [
		'Android',
		'iPhone',
		'iPad'
	];
	for (var k in targets) {
		if (ua.indexOf(targets[k]) >= 0) {
			return true;
		}
	}
	return false;
};

/**
 * バージョンと履歴を描画
 * @param String|jQueryObject target
 */
Vst.prototype.writeVersion = function(target) {
	var obj = this;
	var str = [
		'<div class="ui popup hidden history">',
		'<table class="ui table">',
		'<thead><tr><th>更新日</th>',
		'<th>バージョン</th>',
		'<th>内容</th></tr></thead>',
		'<tbody>'
	];

	$('div.popup.history').remove();
	$.ajax({
		url: '/lib/histories.json',
		type: 'GET',
		cache: false,
		dataType: 'json',
		success: function(res) {
			res.reverse();
			for (var i = 0; i < res.length; ++i) {
				str.push(
					'<tr><td>', res[i].date,
					'</td><td>', res[i].version,
					'</td><td>',
					res[i].description.join('<br>'), '</td></tr>'
				);
				if (i >= 5 && i < res.length - 1) {
					str.push(
						'<tr><td colspan="3" ',
						'style="text-align: center;">...</td></tr>'
					);
					i = res.length - 2;
				}
			}
			str.push('</tbody></table></div>');
			$(target).after(str.join(''));
			$(target).popup({
				popup: 'div.popup.history',
				delay: {
					show: 20,
					hide: 800
				},
				position: 'bottom left',
				hoverable: true,
				inline: true,
				transition: 'slide down'
			});
		}
	});
};

/**
 * コンテンツのビットレートを取得
 * @param String content
 * @param Numeric time
 * @param Function callback
 */
Vst.prototype.getCurrentBitrate = function(content, time, callback) {
	var url = content + '&s=' + time;

	$.ajax({
		url: url,
		type: 'GET',
		dataType: 'text',
		timeout: 600,
		success: function(res) {
			callback(res);
		},
		error: function() {
			callback(false);
		}
	});
};

/**
 * 動画のリアルタイムビットレートを表示
 * @param String rate
 */
Vst.prototype.showBitrate = function(rate) {
	var obj = this;
	var target = $('#bitrate');

	if (rate === false) {
		rate = '0.00 kbps';
	}
	$(target).text(rate);
};

/**
 * 動画の字幕取得
 */
Vst.prototype.getCaption = function(playUrl) {
	var obj = this;
	var tmp = playUrl.split('?c=');
	var md5 = tmp[1];
	var url = '/caption/?c=' + md5;
	var video = $('#player').find('video');
	var vttTag = '<track label="日本語" kind="captions" srclang="ja" src="';
	
	$(video).find('track').remove();
	$.ajax({
		url: url + '&e=0',
		type: 'GET',
		dataType: 'text',
		timeout: 1000,
		success: function() {
			vttTag = vttTag + url + '" />';
			$(video).append(vttTag);
		}
	});
};

/**
 * MusicPlayerを作成
 */
Vst.prototype.writeMusicPlayer = function() {
	var obj = this;
	var playlistUrl = '/music/';
	var params = [];
	
	if (typeof(obj.cache.params.n) === 'string') {
		params.push('n=' + obj.cache.params.n);
	}
	if (typeof(obj.cache.params.s) === 'string') {
		params.push('s=' + encodeURIComponent(obj.cache.params.s));

	}
	if (params.length > 0) {
		playlistUrl += '?' + params.join('&');
	}

	$('#musicPlaylist').remove();
	$.ajax({
		url: playlistUrl,
		type: 'GET',
		dataType: 'html',
		success: function(res) {
			$('#content').append(res);
			obj.loading(false);
			setTimeout(function() {
				obj.musicPlayEvents();
			}, 400);
			obj.writeMusicPaginator();
		}
	});
};

/**
 * Musicのイベント定義
 */
Vst.prototype.musicPlayEvents = function() {
	var obj = this;
	var items = $('#musicPlaylist').find('td.title');
	
	$(items).click(function() {
		$('#musicPlaylist').find('tr').removeClass('plaing');
		if (obj.equalMusic(this)) {
			if (obj.cache.musicPlayer.paused) {
				$(this).closest('tr').addClass('plaing');
				obj.playMusic(this);
				obj.musicStates(true, this);
			} else {
				obj.pauseMusic(true);
				obj.musicStates(false, this);
			}
		} else {
			$(this).closest('tr').addClass('plaing');
			obj.playMusic(this);
			obj.musicStates(true, this);
		}
	});
	$(window).unbind('keydown').keydown(function(ev) {
		if (ev.which == 32) {
			ev.preventDefault();
			return false;
		}
	});
	$(window).unbind('keyup').keyup(function(ev) {
		if (ev.which == 32 &&
				ev.ctrlKey == false &&
				ev.shiftKey == false &&
				obj.cache.musicPlayer instanceof Audio
		) {
			obj.pauseMusic(obj.cache.musicPlayer);
		}
	});

	$('#controller').find('i.backward').unbind('click').click(function() {
		if (obj.cache.musicPlayer instanceof Audio) {
			obj.playPrevMusic();
		}
	});
	$('#controller').find('i.forward').unbind('click').click(function() {
		if (obj.cache.musicPlayer instanceof Audio) {
			obj.playNextMusic();
		}
	});
	$('#controller').find('#miniCover').unbind('click').click(function() {
		obj.scrollToMusic();
	});
	$('#controller').find('i.random').unbind('click').click(function() {
		obj.cache.repeat = false;
		$('#controller').find('i.undo').removeClass('active');
		localStorage.setItem('musicRepeat', false);
		if (obj.cache.shuffle) {
			obj.cache.shuffle = false;
			$(this).removeClass('active');
			localStorage.setItem('musicShuffle', false);
		} else {
			obj.cache.shuffle = true;
			$(this).addClass('active');
			localStorage.setItem('musicShuffle', true);
		}
	});
	$('#controller').find('i.undo').unbind('click').click(function() {
		obj.cache.shuffle = false;
		$('#controller').find('i.random').removeClass('active');
		localStorage.setItem('musicShuffle', false);
		if (obj.cache.repeat) {
			obj.cache.repeat = false;
			$(this).removeClass('active');
			localStorage.setItem('musicRepeat', false);
		} else {
			obj.cache.repeat = true;
			$(this).addClass('active');
			localStorage.setItem('musicRepeat', true);
		}
	});
	if (localStorage.getItem('musicShuffle') !== null) {
		obj.cache.shuffle = JSON.parse(localStorage.getItem('musicShuffle'));
		if (obj.cache.shuffle) {
			$('#controller').find('i.random').addClass('active');
		} else {
			$('#controller').find('i.random').removeClass('active');
		}
	}
	if (localStorage.getItem('musicRepeat') !== null) {
		obj.cache.repeat = JSON.parse(localStorage.getItem('musicRepeat'));
		if (obj.cache.repeat) {
			$('#controller').find('i.undo').addClass('active');
		} else {
			$('#controller').find('i.undo').removeClass('active');
		}
	}
	obj.musicDownloadEvent();
};

/**
 * Musicページでアルバムヘッダ右のアイコンクリックで
 * ダウンロードを実施、AjaxでZIP作成リクエスト後にダウンロード実行
 */
Vst.prototype.musicDownloadEvent = function() {
	var obj = this;
	var buttons = $('#musicPlaylist').find('i.dl');
	var frame = $('#musicDownload');
	var reset = function() {
		$(buttons).filter('.loading')
			.removeClass('loading')
			.removeClass('circle')
			.removeClass('notched')
			.addClass('cloud')
			.addClass('download');
	};
	var loading = function(t) {
		$(t)
			.removeClass('cloud')
			.removeClass('download')
			.addClass('notched')
			.addClass('loading')
			.addClass('circle');
	};

	$(buttons).click(function() {
		var album = $(this).closest('.album');
		var id = $(album).attr('data-id');
		var url = '/music/download/create/?c=' + id;
		
		if ($(this).is('.download')) {
			loading(this);
			$.ajax({
				type: 'GET',
				url: url,
				dataType: 'text',
				success: function(t) {
					var dlUrl = '/music/download/?c=' + t;
					reset();
					$(frame).attr('src', dlUrl);
				},
				error: function() {
					reset();
				}
			});
		}
	});
};

/**
 * MusicController用の情報を取得
 */
Vst.prototype.getMusicInfo = function(e) {
	return {
		title: $(e).text(),
		artist: $(e).attr('data-artist'),
		bitrate: $(e).attr('data-bitrate'),
		type: $(e).attr('data-type'),
		image: $(e).closest('div.album').find('img.coverImage').attr('src')
	};
};

/**
 * MusicController内の情報を作成
 */
Vst.prototype.writeMusicInfo = function(info) {
	var width = 0;

	$('#controller').find('img').attr('src', info.image);
	$('#controller').find('#musicTitle').html(
		info.title + '<span id="artist">&nbsp;&nbsp;&nbsp;'
		+ info.artist + '</span>'
	);
	$('#controller').find('#musicType').html(
		info.type + '&nbsp;' + info.bitrate + 'kbps'
	);
};

/**
 * MusicController内の情報を削除
 */
Vst.prototype.removeMusicInfo = function(resetCover) {
	if (resetCover) {
		$('#controller').find('img').attr('src', '/img/cover/unknown.png');
	}
	$('#controller').find('#musicTitle').text('');
	$('#controller').find('#musicType').text('');
};

/**
 * MusicControllerをfadeIn/Out
 * @param boolena state
 */
Vst.prototype.musicControllerFade = function(state) {
	var obj = this;
	var controller = $('#musicPlaylist').find('#controller');

	if (obj.cache.musicControllTimer !== 0) {
		claerTimeout(obj.cache.musicControllTimer);
	}
	if (state) {
		$(controller).addClass('active');
	} else {
		$(controller).removeClass('active');
	}
};

/**
 * 音楽を再生
 * @param jQueryObject e
 */
Vst.prototype.playMusic = function(e) {
	var obj = this;
	var items = $('#musicPlaylist').find('td.title');
	var src = $(e).attr('data-src');
	var info = obj.getMusicInfo(e);
	var analyser = null;

	if (!(obj.cache.musicPlayer instanceof Audio)) {
		obj.cache.musicPlayer = new Audio('');
		obj.cache.musicPlayer.autoplay = false;
		obj.cache.musicPlayer.volume = 1.0;
	} else {
		if (!obj.cache.musicPlayer.paused) {
			obj.pauseMusic();
		}
	}

	obj.cache.musicPlayer.src = src;
	obj.cache.currentMusic = e;
	obj.cache.musicPlayer.load();
	obj.cache.musicPlayer.addEventListener('canplaythrough', function() {
		setTimeout(function() {
			obj.cache.musicPlayer.play();
		}, 80);
		obj.updateMusicSeekbar();
		$('#controller > i.status')
			.removeClass('play')
			.addClass('pause');
		obj.writeMusicInfo(info);
		obj.musicControllerFade(true);
	});
	if (!obj.cache.events.musicEnded) {
		obj.cache.events.musicEnded = true;
		obj.cache.musicPlayer.addEventListener('ended', function() {
			obj.playNextMusic();
		});
	}
	if (!obj.isMobile()) {
		analyser = new Analyser(
			document.getElementById('analyser'),
			660, 70
		);
		analyser.exec(obj.cache.musicPlayer);
	}
	obj.musicVolume();
};

/**
 * 次へボタン、または自動で次の曲を再生
 */
Vst.prototype.playNextMusic = function() {
	var obj = this;
	var next = 0;
	var items = $('#musicPlaylist').find('td.title');
	var tmpItem = null;
	
	$('#musicPlaylist').find('tr').removeClass('plaing');
	$('#controller > i.status')
		.removeClass('pause')
		.addClass('play');
	$(items).each(function() {
		obj.musicStates(false, this);
	});
	if (obj.cache.shuffle) {
		tmpItem = obj.getShuffledMusic(items);
		$(tmpItem).closest('tr').addClass('plaing');
		obj.musicStates(true, tmpItem);
		if (obj.equalMusicCover(tmpItem)) {
			obj.removeMusicInfo(false);
		} else {
			obj.removeMusicInfo(true);
		}
		return obj.playMusic(tmpItem);
	} else {
		for (var i = 0; i < items.length; ++i) {
			if (obj.equalMusic($(items).eq(i))) {
				if (obj.cache.repeat) {
					$(items).eq(i).closest('tr').addClass('plaing');
					obj.musicStates(true, $(items).eq(i));
					obj.removeMusicInfo(false);
					return obj.playMusic($(items).eq(i));
				}
				if (i < items.length - 1) {
					next = i + 1;
				} else {
					next = 0;
				}
				$(items).eq(next).closest('tr').addClass('plaing');
				obj.musicStates(true, $(items).eq(next));
				if (obj.equalMusicCover($(items).eq(next))) {
					obj.removeMusicInfo(false);
				} else {
					obj.removeMusicInfo(true);
				}
				return obj.playMusic($(items).eq(next));
			}
		}
	}
};

/**
 * 前へボタンの動作
 */
Vst.prototype.playPrevMusic = function() {
	var obj = this;
	var next = 0;
	var items = $('#musicPlaylist').find('td.title');
	var tmpItem = null;
	
	$('#musicPlaylist').find('tr').removeClass('plaing');
	$('#controller > i.status')
		.removeClass('pause')
		.addClass('play');
	$(items).each(function() {
		obj.musicStates(false, this);
	});
	if (obj.cache.shuffle) {
		tmpItem = obj.getShuffledMusic(items);
		obj.musicStates(true, tmpItem);
		if (obj.equalMusicCover(tmpItem)) {
			obj.removeMusicInfo(false);
		} else {
			obj.removeMusicInfo(true);
		}
		return obj.playMusic(tmpItem);
	} else {
		for (var i = 0; i < items.length; ++i) {
			if (obj.equalMusic($(items).eq(i))) {
				if (obj.cache.repeat) {
					$(items).eq(i).closest('tr').addClass('plaing');
					obj.musicStates(true, $(items).eq(i));
					obj.removeMusicInfo(false);
					return obj.playMusic($(items).eq(i));
				}
				if (i > 0) {
					next = i - 1;
				} else {
					next = items.length - 1;
				}
				$(items).eq(next).closest('tr').addClass('plaing');
				obj.musicStates(true, $(items).eq(next));
				if (obj.equalMusicCover($(items).eq(next))) {
					obj.removeMusicInfo(false);
				} else {
					obj.removeMusicInfo(true);
				}
				return obj.playMusic($(items).eq(next));
			}
		}
	}
};

/**
 * ランダム再生用の次の曲を返す
 * @param Array items
 * @return jQueryObject
 */
Vst.prototype.getShuffledMusic = function(items) {
	var obj = this;
	var length = items.length;
	var rand = ~~(Math.random() * (length + 1));

	if (
		length > 1 &&
		obj.equalMusic($(items).eq(rand))
	) {
		return obj.getShuffledMusic(items);
	}
	return $(items).eq(rand);
};

/**
 * currentMusicと引数eが同一かを比較
 * @param jQueryObject e
 * @return boolean
 */
Vst.prototype.equalMusic = function(e) {
	var obj = this;
	var src1 = $(e).attr('data-src');
	var src2 = $(obj.cache.currentMusic).attr('data-src');

	if (src1 === src2) {
		return true;
	}
	return false;
};

/**
 * 次の曲のカバー画像が再生中(完了時)のカバーと同じかを比較
 * @param jQueryObject e
 * @return boolean
 */
Vst.prototype.equalMusicCover = function(e) {
	var album = $(e).closest('div.album');
	var cover = $(album).find('im.coverImage').attr('src');
	var current = $('#miniCover > img').attr('src');

	if (cover === current) {
		return true;
	}
	return false;
};

/**
 * Musicで再生・一時停止
 * @param Audio audio
 */
Vst.prototype.pauseMusic = function(audio) {
	var obj = this;

	if (audio instanceof Audio) {
		if (audio.paused) {
			audio.play();
			$('#controller > i.status')
				.removeClass('play').addClass('pause');
			obj.musicControllerFade(true);
		} else {
			audio.pause();
			$('#controller > i.status')
				.removeClass('pause').addClass('play');
			obj.musicControllerFade(false);
		}
	} else {
		if (obj.cache.musicPlayer instanceof Audio) {
			obj.cache.musicPlayer.pause();
			obj.cache.musicPlayer.src = '';
		}
		obj.cache.musicPlayerSrc = null;
		$('#controller > i.status')
			.removeClass('pause')
			.addClass('play');
		if (audio === true) {
			obj.removeMusicInfo(true);
		} else {
			obj.removeMusicInfo(false);
		}
		obj.musicControllerFade(false);
	}
};

/**
 * Musicの再生状態でMusicControllerを更新
 * @param boolean stat
 * @param jQueryObject elem
 */
Vst.prototype.musicStates = function(stat, elem) {
	var obj = this;
	var number = $(elem).closest('tr').find('td.number');
	var plaingStr = '<i class="video play outline icon" '
		+ 'data-number="__NUM__"></i>';
	var currentNumber = 0;
	var items = $('#musicPlaylist').find('td.number');
	var toNumber = function(elem) {
		var num = $(elem).find('i').attr('data-number');
		$(elem).text(num);
	};

	if (stat) {
		$(items).each(function() {
			toNumber(this);
		});
		currentNumber = $(number).text();
		plaingStr = plaingStr.replace('__NUM__', currentNumber);
		$(number).html(plaingStr);
	} else {
		toNumber(number);
	}
};

/**
 * Musicのページネーションを出力
 */
Vst.prototype.writeMusicPaginator = function() {
	var obj = this;
	var playlist = $('#musicPlaylist');
	var page = $(playlist).attr('data-page');
	var pages = $(playlist).attr('data-pages');
	var str = [
		'<div class="ui right floated pagination menu" ',
		'style="clear: both; margin: 20px 8px 26px 0;">',
		'<a class="item',
		page == 1? ' disabled': '',
		'" href="',obj.getNewUrl('n', 1), '">',
		'<i class="icon angle double left"></i>',
		'</a>',
		'<a class="item',
		page == 1? ' disabled': '',
		'" href="',obj.getNewUrl('n', page - 1), '">',
		'<i class="icon angle left"></i>',
		'</a>',
		'<div class="item">',
		page,' / ',pages, '</div>',
		'<a class="item',
		page == pages? ' disabled': '',
		'" href="',obj.getNewUrl('n', Number(page) + 1), '">',
		'<i class="icon angle right"></i>',
		'</a>',
		'<a class="item',
		page == pages? ' disabled': '',
		'" href="',obj.getNewUrl('n', pages), '">',
		'<i class="icon angle double right"></i>',
		'</a>',
		'</div>'
	];

	$('#content').find('.pagination').remove();
	$('#content').append(str.join(''));
};

/**
 * timeupdateイベントでMusicControllerのシークバーを更新
 */
Vst.prototype.updateMusicSeekbar = function() {
	var obj = this;
	var audio = obj.cache.musicPlayer;
	
	if (!obj.cache.events.timeupdate) {
		obj.cache.events.musicTimeupdate = true;
		audio.addEventListener('timeupdate', function() {
			var d = audio.duration;
			var df = obj.formatTime(d, false);
			var c = audio.currentTime;
			var p = obj.calcPart(c, d);
			$('#seekbar > #gage').width(p + '%');

			$('#controller > #time').html(
				obj.formatTime(c, false) + '&nbsp;/&nbsp;' + df
			);
		});
	}
	$('#seekbar').unbind('click').click(function(e) {
		var d = $(this).width();
		var c = e.originalEvent.layerX;
		var p = obj.calcPart(c, d);

		if (audio instanceof Audio) {
			var dx = audio.duration;
			audio.currentTime = dx * (p / 100);
		}
	});
	$('#controller > i').unbind('click').click(function() {
		if (audio instanceof Audio) {
			obj.pauseMusic(audio);
		}
	});
};

/**
 * c/dの％を取得
 * @param Numeric c
 * @param Numeric d
 * @return Numeric
 */
Vst.prototype.calcPart = function(c, d) {
	if (d === 0) {
		return 0;
	}
	return (c / d) * 100;
};

/**
 * 時間をフォーマッティング
 * timeは秒、hourは時間を返すかを真偽値で指定
 * @param String time
 * @param boolean hour
 * @return String
 */
Vst.prototype.formatTime = function(time, hour) {
	var h = ('00' + Math.floor(time / 3600)).slice(-2);
	var m = ('00' + Math.floor(time / 60) % 60).slice(-2);
	var s = ('00' + Math.floor(time % 60)).slice(-2);

	if (hour) {
		return h + ':' + m + ':' + s;
	} else {
		return m + ':' + s;
	}
};

/**
 * Musicの音量を変更
 */
Vst.prototype.musicVolume = function() {
	var obj = this;
	var audio = obj.cache.musicPlayer;
	var clickEv = function(e) {
		var d = $(this).width();
		var c = e.originalEvent.offsetX;
		var p = obj.calcPart(c, d);
		
		if (p > 100) {
			p = 100;
		} else if (p < 0) {
			p = 0;
		}
		setVolume(p / 100);
	};
	var setVolume = function(volume) {
		volume = parseFloat(volume);
		if (audio instanceof Audio) {
			if (analyserConfig.gain != null) {
				analyserConfig.gainNode.gain.value = volume;
			} else {
				audio.volume = volume;
			}
		}
		localStorage.setItem('volume', getVolume());
		$('#volumeController > #volumeGage').css(
			'width', (volume * 100) + '%'
		);
	};
	var getVolume = function() {
		if (analyserConfig.gain != null) {
			return parseFloat(analyserConfig.gainNode.gain.value);
		}
		return audio.volume;
	};

	if (localStorage.getItem('volume') !== null) {
		setVolume(localStorage.getItem('volume'));
	} else {
		setVolume(1.0);
	}
	$('#volumeController > #volumeGage').css(
		'width', (getVolume() * 100) + '%'
	);
	$('#volumeController').unbind('mouseup').mouseup(clickEv);
	$('#volumeContainer > i.volume').click(function() {
		if (audio.muted) {
			audio.muted = false;
			$(this).removeClass('off').addClass('up');
		} else {
			audio.muted = true;
			$(this).removeClass('up').addClass('off');
		}
	});
};

/**
 * ページスクロールを上下に設定
 */
Vst.prototype.pageUpDown = function() {
	var obj = this;
	var buttons = $('#pageController').find('i');
	var speed = 400;

	$(buttons).bind('click touchend', function() {
		if ($(this).is('.down')) {
			obj.scrollTo($(document).height());
		} else if ($(this).is('.up')) {
			obj.scrollTo(0);
		}
	});
};

/**
 * 再生中の曲にスクロールする
 * @return jQueryObject
 */
Vst.prototype.scrollToMusic = function() {
	var obj = this;
	var items = $('#musicPlaylist').find('td.title');
	var item = null;
	var album = null;

	$(items).each(function() {
		if (obj.equalMusic(this)) {
			item = this;
			album = $(item).closest('.album');
			obj.scrollTo(album);
			return obj;
		}
	});
};

/**
 * targetで数値を指定すると指定された高さまでスクロール
 * jQueryObjectを指定すると対象の要素までスクロール
 * @param jQueryObject|Numeric target
 */
Vst.prototype.scrollTo = function(target) {
	var top = 0;
	var speed = 400;

	if (!isNaN(target)) {
		top = target;
	} else {
		top = $(target).offset().top;
	}
	$('html,body').animate({
		scrollTop: top
	}, speed);
};

/**
 * TV番組リアルタイム視聴の開始
 */
Vst.prototype.realTimeTv = function() {
	var obj = this;
	var header = $('#content').find('thead > tr').eq(0).find('th');
	var buttonStr = [
		'<div id="realTimeTv" class="ui button tiny basic">',
		'リアルタイム視聴</div>'
	];
	
	$(header).find('#realTimeTv').remove();
	$(header).append(buttonStr.join(''));

	$('#realTimeTv').click(function() {
		obj.playRealTimeTv();
	});
};

/**
 * 動画を再生(realTimeTv)
 */
Vst.prototype.playRealTimeTv = function() {
	var obj = this;
	var playUrl = obj.url;
	var modal = $('#player');
	var selector = $('#player').find('#channelSelector');
	var video = $(modal).find('video').get(0);
	var name = 'リアルタイム視聴';
	var chButtons = [];

	$(modal).find('.videoTitle').html(
		obj.pageName(false)
		+ '&nbsp;>&nbsp;' + name
	);
	$(modal).find('div.state').css('display', 'none');
	$('#controller,#thumbnail').css('display', 'none');
	obj.getChannels(function(res) {
		for (var k in res) {
			if (k.length > 0) {
				chButtons.push(
					'<div class="ui channel button tiny" ',
					'data-type="', res[k].type, '" data-ch="',
					res[k].id, '">',
					'<img src="',
					res[k].logo, '">',
					'<span>',
					res[k].name, '</span></div>'
				);
			}
		}
		chButtons.push(
			'<div style="clear: left;"></div>'
		);
		$(selector).html(chButtons.join(''));
		$(selector).find('div.channel').click(function() {
			var uid = (new Date()).getTime();
			var videoUrl = obj.cache.sdvUrl + '/realtv/'
				+ $(this).attr('data-ch')
				+ '/watch.webm?s=' + uid;
			$(selector).hide();
			$(modal).find('video')
				.attr('type', 'video/webm')
				.attr('src', videoUrl);
			setTimeout(function() {
				obj.setVideoSize(modal);
			}, 50);
		});

		setTimeout(function() {
			obj.setVideoSize(modal);
		}, 50);
		$(selector).show();
		$(modal)
		.modal({
			closable: true,
			onShow: function() {
				$(modal).find('div.state').css('display', 'none');
			},
			onHidden: function() {
				$(modal).find('div.state').css('display', 'none');
				obj.toggleState(true);
			}
		}).modal('show');
	});
};

/**
 * video要素が再生している動画がリアルタイム変換かを返す
 * @param HTMLElement video
 * @return boolean
 */
Vst.prototype.isRealTimeAnime = function(url) {

	if (url.match('.webm') && url.match('realanime')) {
		return true;
	}
	return false;
};

/**
 * フルスクリーン時専用のCSSプロパティを設定
 */
Vst.prototype.setFullScreenVideoStyle = function() {
	$('body').css('overflow', 'hidden');
	$('#full').css({
		'display': 'flex',
		'align-item': 'center',
		'justify-content': 'center',
		'width': '100vw',
		'height': '100vh'
	}).find('video').css({
		'width': '100vw',
		'height': '100vh'
	}).removeAttr('width').removeAttr('height');
};

/**
 * フルスクリーン時専用のCSSプロパティを解除
 */
Vst.prototype.unsetFullScreenVideoStyle = function() {
	$('#full').css({
		'display': '',
		'align-item': '',
		'justify-content': '',
		'width': '',
		'height': ''
	});
	$('body').css('overflow', '');
};

/**
 * 対象の動画を再生したことを保存
 * @param String sub
 * @arapm String name
 * @return boolean
 */
Vst.prototype.savePlayedVideo = function(sub, name) {
	var md5 = CybozuLabs.MD5.calc(sub + name);
	var tmp = localStorage.getItem('playedVideo');
	var playedVideo = {};

	if (tmp !== null) {
		playedVideo = JSON.parse(tmp);
	}
	if (typeof(playedVideo[md5]) === 'undefined') {
		playedVideo[md5] = 1;
	} else {
		playedVideo[md5] += 1;
	}
	localStorage.setItem('playedVideo', JSON.stringify(playedVideo));
};

/**
 * 対象の動画が再生したことがあるかを返す
 * @param String sub
 * @arapm String name
 * @return boolean
 */
Vst.prototype.getPlayedVideo = function(sub, name) {
	var md5 = CybozuLabs.MD5.calc(sub + name);
	var tmp = localStorage.getItem('playedVideo');
	var playedVideo = {};

	if (tmp !== null) {
		playedVideo = JSON.parse(tmp);
	}
	if (typeof(playedVideo[md5]) !== 'undefined') {
		return true;
	}
	return false;
};
