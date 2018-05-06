/**
 * FFTアナライザ
 */
var Analyser = function(canvas, width, height) {
	analyserConfig.width = width;
	analyserConfig.height = height;
	analyserConfig.canvas = canvas;
	analyserConfig.ctx = analyserConfig.canvas.getContext('2d');
};

Analyser.prototype.getAudioContext = function() {
	if (typeof(window.AudioContext) != 'undefined') {
		return new window.AudioContext();
	} else if (typeof(window.webkitAudioContext) != 'undefined') {
		return new window.webkitAudioContext();
	}
	return false;		
};

var analyserConfig = {
	width: 0,
	height: 0,
	source: null,
	canvas: null,
	timer: false,
	ctx: null,
	source: null,
	context: null,
	gainNode: null,
	analyser: null,
	color: {
		red: 255,
		green: 255,
		blue: 255
	}
};

Analyser.prototype.exec = function(audio) {
	var obj = this;
	var configure = function() {
		analyserConfig.ctx.lineCap = 'butt';
		analyserConfig.analyser.fftSize = 2048;
		analyserConfig.ctx.lineWidth = 1.0;
		analyserConfig.analyser.smoothingTimeConstant = 0.65;
		analyserConfig.canvas.width = analyserConfig.width;
		analyserConfig.canvas.height = analyserConfig.height;
	};

	try {
		if (analyserConfig.context == null) {
			analyserConfig.context = obj.getAudioContext();
			analyserConfig.source = analyserConfig.context
				.createMediaElementSource(audio);
			analyserConfig.gainNode = analyserConfig.context.createGain();
			analyserConfig.analyser = analyserConfig.context.createAnalyser();
			analyserConfig.source.connect(analyserConfig.analyser);
			analyserConfig.analyser.connect(analyserConfig.gainNode);
			analyserConfig.gainNode.connect(analyserConfig.context.destination);
			//analyserConfig.source.connect(analyserConfig.context.destination);
			configure();
		}
		analyserConfig.timer = window.requestAnimationFrame(analyserEffect);
	}
	catch (e) {
		console.log("Analyser initialization failed.");
		console.log(e);
		setTimeout(function() {
			obj.exec();
		}, 200);
	}
};

function analyserEffect() {
	var cw = analyserConfig.width;
	var ch = analyserConfig.height;
	var freqBytes = new Uint8Array(analyserConfig.analyser.frequencyBinCount);
	var step = 2;
	var count = ~~(cw / step);
	var sizeX = 1;
	var blockSizeX = step;
	var left = 0;
	var top = 0;
	var color = '';
	var df = 0;
	var alphaMax = 0.2;
	var offsetLeft = 38;
	var offsetTop = 276;
	
	analyserConfig.analyser.getByteFrequencyData(freqBytes);
	// 描画開始
	analyserConfig.ctx.clearRect(0, 0, cw, ch);
	for (var i = 0; i < count; ++i) { // 列ループ
		left = i * blockSizeX;
		top = ch - (ch * (freqBytes[i + offsetLeft] / offsetTop));
		alpha = alphaMax;
		color = 'rgba('
			+ analyserConfig.color.red + ', '
			+ analyserConfig.color.green + ', '
			+ analyserConfig.color.blue + ', '
			+ alpha + ')';
		analyserConfig.ctx.fillStyle = color;
		analyserConfig.ctx.fillRect(
			left, top, sizeX, ch
		);
	}
	analyserConfig.timer = window.requestAnimationFrame(analyserEffect);
};
