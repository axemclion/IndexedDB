window.IndexedDBPerf = {
	suites: {},
	results: {
		running: false
	}
};
$(document).ready(function() {
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
		$this.addClass("active");
		content.html(contentTemplate($.extend({
			"name": $this.data("name"),
			"desc": "",
			"onStart": "",
			"setup": "",
			"tearDown": "",
			tests: []
		}, window.IndexedDBPerf.suites[$this.data("name")])));
		content.find('pre').each(function(){
			var $this = $(this);
			$this.html(js_beautify($this.html()));
		});
		$('.resultsContent').hide();
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

		$(this).hide();
		$(".abortTests").show();

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
					defer: true
				});
			}
			bm.on('complete', function() {
				progress.children('.done').width('10%');
				$('.runTests').show();
				$('.abortTests').hide();
				$('.resultsContent').hide();
				$('.rank').removeClass('badge-important badge-warning badge-success');
				_.each(_.sortBy(this, 'hz'), function(c, i, array) {
					$(".rank[data-name='" + c.name + "']").html(array.length - i).show().addClass(function() {
						if (i === 0) return 'badge-important';
						if (i === array.length - 1) return 'badge-success';
						return 'badge-warning';
					}).attr("title", c.hz);
				});
				$(".resultsContent").html(resultsTemplate({
					bm: this
				})).show();
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

	var hash = document.location.hash.substring(1);
	el.children(hash ? "li[data-name='" + hash + "']" : "li:first").children("a").click();

});

