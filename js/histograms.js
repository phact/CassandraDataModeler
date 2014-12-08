function insertHistogram(divID){

	function addMiniHist(divID){
		$("#"+divID+ " #svgDiv").remove();
		var myDiv = $("#"+divID).append("<div class='histogram' id='svgDiv'></div>");
		$("#"+divID+ " #svgDiv").append("<fieldset data-role='controlgroup' data-type='horizontal'>"+
		//myDiv.append("<fieldset data-role='controlgroup' data-type='horizontal'>"+
			"<legend>Distribution Type:</legend>"+
			"<input type='radio' name='"+ divID  +"-radio-choice-h-2' id='"+ divID  +"-radio-choice-h-2a' value='exp'>"+
			"<label for='"+ divID  +"-radio-choice-h-2a'>Exponential</label>"+
			"<input type='radio' name='"+ divID  +"-radio-choice-h-2' id='"+ divID  +"-radio-choice-h-2b' value='ext'>"+
			"<label for='"+ divID  +"-radio-choice-h-2b'>Extreme</label>"+
			"<input type='radio' name='"+ divID  +"-radio-choice-h-2' id='"+ divID  +"-radio-choice-h-2c' value='norm'>"+
			"<label for='"+ divID  +"-radio-choice-h-2c'>Normal</label>"+
			"<input type='radio' name='"+ divID  +"-radio-choice-h-2' id='"+ divID  +"-radio-choice-h-2d' value='uni'>"+
			"<label for='"+ divID  +"-radio-choice-h-2d'>Uniform</label>"+
			"</fieldset>");

			$(".histogram").trigger("create")

		}
		

		addMiniHist(divID);

		$("#"+divID+" input").change(function(){ drawMiniHist(divID, this.value)  } );

		function drawMiniHist(divId, distribution){
			var vars = new Random(Math.floor (1000*Math.random()));
			var nbins = 20;


			var lambda = 1000;

			var alpha = 20;
			var beta = 30;
			var n = 10000;

			var mean = 10;
			var stdv = 5;

			var min = 0;
			var max = 20;

			var values;

			//exponential
			if (distribution == "exp") {
				values = d3.range(n).map(function(x, i){ return vars.exponential(lambda); } );
			}
			//weibull
			if (distribution == "ext"){
				values = d3.range(n).map(function(x, i){ return vars.weibull(alpha,beta); } );
			}
			//normal
			if (distribution == "norm"){
				values = d3.range(n).map(function(x, i){ return vars.normal(mean, stdv); });
			}
			//uniform
			if (distribution == "uni"){
				values = d3.range(n).map(function(x, i){ return vars.uniform(min, max); });
				//    values = d3.range(n).map(function(x, i){ return min + Math.random()* max; });
			}
			// Generate a Bates distribution of 10 random variables.
			//var values = d3.range(1000).map(d3.random.bates(10));

			// A formatter for counts.
			var formatCount = d3.format(",.0f");

			var margin = {top: 0, right: 0, bottom: 0, left: 0},
			width = 200 - margin.left - margin.right,
			height = 30 - margin.top - margin.bottom;

			var x = d3.scale.linear()
			.domain([d3.min(values), d3.max(values)])
			.range([0, width]);


			// Generate a histogram using twenty uniformly-spaced bins.
			var data = d3.layout.histogram()
			.bins(x.ticks(nbins))
			(values);

			var x2 = d3.scale.linear().domain([d3.min(values),d3.max(values)]).range([0,width]);

			var y = d3.scale.linear()
			//    .domain([d3.min(data, function(d){ return d.y }), d3.max(data, function(d) { return d.y; })])
			.domain([0, d3.max(data, function(d) { return d.y; })])
			.range([height, 0]);

			var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom");

			$("#"+divId+" #svgDiv svg").remove();

			var svg = d3.select("#"+divId+ " #svgDiv").append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			var bar = svg.selectAll(".bar")
			.data(data)
			.enter().append("g")
			.attr("class", "bar")
			.attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

			bar.append("rect")
			.attr("x", 1)
			.attr("width", x2(d3.min(values) +data[0].dx) -1 )
			.attr("height", function(d) { return height - y(d.y); })
			.style("fill","#38c");


			svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);


		}

	}
