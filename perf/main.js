window.IndexedDBPerf = {
	suites: {},
	results: {
		running: false
	},
	googleLoaded: false
};

try {
	google.load('visualization', '1.0', {
		'packages': ['corechart']
	});
	google.setOnLoadCallback(function() {
		window.IndexedDBPerf.googleLoaded = true;
		browserScope.loadResults();
	});
} catch (e) {

}

var disqus_shortname = 'indexeddbperformance',
	disqus_identifier, disqus_title, disqus_url;
var disqus = (function() {
	return {
		loadComments: function(currentPageId) {
			// http://docs.disqus.com/help/2/
			window.disqus_shortname = 'indexeddbperformance';
			window.disqus_identifier = currentPageId;
			window.disqus_url = 'http://nparashuram.com/IndexedDB/perf/' + currentPageId;

			// http://docs.disqus.com/developers/universal/
			(function() {
				var dsq = document.createElement('script');
				dsq.type = 'text/javascript';
				dsq.async = true;
				dsq.src = 'http://indexeddbperformance.disqus.com/embed.js';
				(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
				dsq.onload = function() {
					dsq.parentNode.removeChild(dsq)
				}
			})();
		}
	}
}());

var browserScope = (function() {
	var currentTest = null;
	return {
		saveResults: function() {
			$('.browserScope .alert').hide();
			if (typeof currentTest === 'undefined' || typeof window.IndexedDBPerf.suites[currentTest] === 'undefined' || window.IndexedDBPerf.suites[currentTest]._bTestKey === 'undefined') {
				$('.browserScope .saveError').fadeIn();
			}
			window._bTestResults = {};
			_.each(window.IndexedDBPerf.results, function(o) {
				// Hate losing the prescision here
				window._bTestResults[o.name.replace(/[,]/g, " ")] = (o.hz * 1000).toFixed(0);
			});
			var url = ['http://www.browserscope.org/user/beacon/', window.IndexedDBPerf.suites[currentTest]._bTestKey];
			$.getScript(url.join(''), function() {
				$('.browserScope .saveDone').fadeIn();
			});
		},
		loadResults: function(testName) {
			$('.browserScope .alert').hide();
			testName && (currentTest = testName);
			if (window.IndexedDBPerf.googleLoaded === false) return;

			if (typeof window.IndexedDBPerf.suites[currentTest] === 'undefined' || typeof window.IndexedDBPerf.suites[currentTest]._bTestKey === 'undefined') {
				$('#viz').empty();
				$('.browserScope .loadError').fadeIn();
				return;
			}

			$.getJSON('http://www.browserscope.org/user/tests/table/' + window.IndexedDBPerf.suites[currentTest]._bTestKey + '?o=json&callback=?', function(res, status) {
				if (status !== 'success') {
					$('.browserScope .loadError').fadeIn();
					return;
				}
				var data = new google.visualization.DataTable();
				data.addColumn('string', 'Browser');
				var headerAdded = false;
				_.each(res.results, function(o, key) {
					if (!headerAdded) {
						_.each(o.results, function(v, k) {
							data.addColumn('number', k);
						});
						headerAdded = true;
					}
					if (o.count > 0) {
						data.addRow([key].concat(_.map(o.results, function(x) {
							return parseInt(x.result);
						})));
					}
				});

				var chart = new google.visualization.BarChart(document.getElementById('viz'));
				chart.draw(data, {
					height: 500,
					animation: {
						duration: 500,
						easing: 'inAndOut'
					},
					legend: {
						position: 'top'
					}
				});
			});
		}
	}
}());

$(document).ready(function() {
	if (typeof window.indexedDB === 'undefined') {
		$('#idbUnsupported').show();
	}

	var el = $("#perfTestLinks");
	var content = $("#testContent");
	var contentTemplate = _.template(content.next("script[type='text/html']").text());
	var resultsTemplate = _.template($('.resultsContent').children('script[type="text/html"]').text());

	el.html(_.template(el.text())({
		perf: window.IndexedDBPerf.suites
	}))

	el.on("click", "li>a", function() {
		el.children("li").removeClass("active");
		var $this = $(this);
		$this.parent().addClass("active");
		content.html(contentTemplate($.extend({
			"name": $this.data("name"),
			"desc": "",
			"onStart": "",
			"setup": "",
			"tearDown": "",
			tests: []
		}, window.IndexedDBPerf.suites[$this.data("name")])));
		content.find('pre').each(function() {
			var $this = $(this);
			$this.html(js_beautify($this.html()));
		});

		$('.resultsContent').hide();
		browserScope.loadResults($this.data('name'));
		disqus.loadComments($this.data('name'));
	});

	$(document).on('click', '.runTestCase', function() {
		var $this = $(this);
		window.IndexedDBPerf.suites[$this.data('suite')].tests[$this.data('name')]({
			resolve: function() {
				alert("Ran " + $this.data('suite') + ":" + $this.data("name"));
			}
		})
	});

	$(document).on('click', '.runPreTest', function() {
		var $this = $(this);
		window.IndexedDBPerf.suites[$this.data('suite')][$this.data('name')]($.noop, $.noop);
	});

	$(document).on('click', '.abortTests', function() {
		if (window.IndexedDBPerf.results.running) {
			return;
		}
		if (confirm("Are you sure you want to abort the tests ? ")) {
			window.IndexedDBPerf.results.abort();
			$('.runTests').show();
			$('.abortTests').hide();
		}
	});

	$(document).on('click', '.runTests', function() {
		if (window.IndexedDBPerf.results.running) {
			return;
		}

		$('.runTests').hide();
		$('.abortTests').show();

		var progress = $(".progress").show();
		progress.children().width(0).empty();
		progress.children('.start').width('3%');
		progress.children('.tests');
		bar = progress.children('.pretest').width('7%').addClass('progress-active');
		var cycle = 0,
			suite = window.IndexedDBPerf.suites[$(this).data("name")],
			testWidth = (80 / _.size(suite.tests)) + "%";
		suite.onStart(function() {
			var bm = new Benchmark.Suite;
			window.IndexedDBPerf.results = bm;
			for (var test in suite.tests) {
				bm.add({
					name: test,
					fn: suite.tests[test],
					setup: suite.setup,
					teardown: suite.teardown,
					onStart: function() {
						bar = progress.children(".tests[data-name='" + this.name + "']").width(testWidth).addClass('progress-active bar-success');
						cycle = 0;
					},
					onComplete: function() {
						bar.removeClass('progress-active');
					},
					onCycle: function() {
						bar.html('<small>' + cycle+++'</small>');
					},
					defer: typeof suite.defer === 'undefined' ? true : suite.defer
				});
			}
			bm.on('complete', function() {
				progress.children('.done').width('10%');
				$('.runTests').show();
				$('.abortTests').hide();
				$('.resultsContent').hide();
				$(".resultsContent").html(resultsTemplate({
					bm: this
				})).show();
				$('.rank').removeClass('badge-important badge-warning badge-success');
				_.each(_.sortBy(this, 'hz'), function(c, i, array) {
					var best = array[array.length - 1].hz;
					$(".percentSlow[data-name='" + c.name + "']").html(((best - c.hz) / best * 100).toFixed(2));
					$(".rank[data-name='" + c.name + "']").html(array.length - i).show().addClass(function() {
						switch (i) {
							case 0:
								return 'badge-important';
							case array.length - 1:
								return 'badge-success';
							default:
								return 'badge-warning';
						}
					}).attr("title", c.hz);
				});
				browserScope.saveResults();
			});

			bm.on('abort', function() {
				progress.children(".tests").width(testWidth);
			});

			bm.run({
				'async': true
			});
			progress.children('.pretest').removeClass('progress-active')
		}, function(num) {
			bar.html('<small>' + cycle+++'</small>');
		});
	});

	var hash = unescape(document.location.hash.substring(1));
	el.children(hash ? "li[data-name='" + hash + "']" : "li:not('.nav-header'):first").children("a").click();
});