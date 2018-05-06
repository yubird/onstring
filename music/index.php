<?php
include dirname(__FILE__).'/../common/settings.php';
include dirname(__FILE__).'/../common/functions.php';
ini_set('zlib.output_compression_level', 9);
$json = json_decode(
	file_get_contents(dirname(__FILE__).'/playlist.json'),
	true
);
$items = $json['items'];
$countFiles = $json['countFiles'];
$totalSize = $json['totalSize'];
unset($json);
$keyword = isset($_GET['s'])? rawurldecode($_GET['s']): false;
$page = isset($_GET['n'])? intval($_GET['n']): 1;
if ($page < 1) {
	$page = 1;
}
if ($keyword !== false && strlen($keyword) > 0) {
	$items = searchFromPlaylist($items, $keyword);
}
$offset = ALBUM_MAX * ($page - 1);
$pages = intval(ceil(count($items) / ALBUM_MAX));
$items = array_slice($items, $offset, ALBUM_MAX);
unset($json);
header('Content-Type: text/html;charset=UTF-8');
header('Content-Encoding: gzip');
ob_start('ob_gzhandler');
?>
<div id="musicPlaylist" data-page="<?php echo $page; ?>" data-pages="<?php echo $pages; ?>">
	<div id="musicHeader">
		<span>Music</span>
		<div class="extra">
			<?php echo number_format($countFiles); ?>曲 (<?php echo $totalSize; ?>GB)
		</div>
	</div>
<?php
$length1 = count($items);
$s1 = 0;
foreach ($items as $item) {
	if (++$s1 == $length1) {
		echo '<div class="album last" data-id="';
	} else {
		echo '<div class="album" data-id="';
	}
	echo $item['id'],'">';
	echo '	<div class="cover">';
	echo '		<img alt="cover" class="coverImage" src="',$item['image'], '">';
	echo '	</div>';
	echo '	<div class="items">';
	echo '		<h3>',$item['album'],'</h3>';
	echo '		<h4><a href="/?p=music&n=1&s=';
	echo rawurlencode($item['artist']);
	echo '">',$item['artist'],'</a></h4>';
	echo '		<table>';
	echo '<colgroup>';
	echo '<col style="width: 32px;">';
	echo '<col style="">';
	echo '<col style="width: 56px;">';
	echo '</colgroup>';
	echo '		<tbody>';
	$length2 = count($item['files']);
	$s2 = 0;
	foreach ($item['files'] as $file) {
		if (++$s2 == $length2) {
			echo '    <tr class="last">';
		} else {
			echo '		<tr>';
		}
		echo '			<td class="number">',$s2, '</td>';
		echo '			<td class="title" data-src="',$file['file'],'" ';
		echo 'data-artist="',htmlspecialchars($file['artist']),'">';
		echo htmlspecialchars($file['title']),'</td>';
		echo '			<td class="duration">';
		echo substr($file['duration'], 3),'</td>';
		echo '		</tr>';
	}
	echo '		</tbody></table>';
	echo '		<i class="ui dl icon cloud download"></i>';
	echo '	</div>'; //.items
	echo '</div>'; //.album
}
?>
	<div style="clear: left;"></div>
	<div id="controller">
		<div id="miniCover">
			<img alt="unknown" src="/img/cover/unknown.png" />
		</div>
		<div id="musicTitle"></div>
		<i class="ui icon play large status"></i>
		<div id="seekbar">
			<div id="gage"></div>
		</div>
		<div id="playControll">
			<i class="ui icon step backward"></i>
			<i class="ui icon step forward"></i>
			<i class="ui icon undo"></i>
			<i class="ui icon random"></i>
		</div>
		<div id="time">00:00&nbsp;/&nbsp;00:00</div>
		<div id="volumeContainer">
			<i class="ui icon volume up"></i>
			<div id="volumeController">
				<div id="volumeGage"></div>
			</div>
		</div>
		<canvas id="analyser"></canvas>
	</div><!-- #controller -->
</div><!-- #musicPlaylist -->
<?php ob_end_flush(); ?>
