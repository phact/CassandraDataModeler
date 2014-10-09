var numberOfTerms = 20;
$("#search").val("userid")
var executeSearch = function(terms){
	
numberOfTerms = terms;
	
$(".cloudDiv svg").remove();

var searchTerm = $("#search").val();
myAjaxCall = $.ajax({
				url: "http://54.193.104.165:8983/solr/foods.reviews_by_day/select?q=*%3A*&wt=json&indent=true&facet=true&facet.field="+searchTerm,
  context: document.body,
  
  type: "POST", 
      contentType: "application/json; charset=utf-8", 
      dataType: 'jsonp', 
      crossDomain: true, 
      jsonp: 'json.wrf' 
}).done(function(data) {

  $("sloadStatus").empty();
  
  
	var wordResult = [];
	var textArray = [];
	
	var maxValue = data.facet_counts.facet_fields[searchTerm][1];
	var linearScale = d3.scale.linear().domain([0,maxValue]);
	

	for (i = 0 ; i < terms ; i++){ 
		 
		 var thisKey = data.facet_counts.facet_fields[searchTerm][i*2].toLowerCase();
		 
		 textArray.push(thisKey);
		 wordResult.push({size: data.facet_counts.facet_fields[searchTerm][i*2+1] , text: thisKey });
		 
	}	


    var fill = d3.scale.category10();

    var layout = d3.layout.cloud().size([1000, 1000])
        .words(textArray.map(function(d, i) {


		test= {text: wordResult[i].text, size: linearScale(wordResult[i].size)*50  };
		
		console.log(test);
		
		return test;
      }))
        .padding(1)
        .rotate(function() { return ~~(Math.random() * 2) * 90; })
        .font("Impact")
        .fontSize(function(d) { return d.size; })
        .on("end", drawNew)
        .start();

    function drawNew(words) {
      d3.select(".cloudDiv").append("svg")
          .attr("width", 1000)
          .attr("height", 1000)
        .append("g")
          .attr("transform", "translate(150,150)")
        .selectAll("text")
          .data(words)
        .enter().append("text")
          .style("font-size", function(d) { return d.size + "px"; })
          .style("font-family", "Impact")
          .style("fill", function(d, i) { return fill(i); })
          .attr("text-anchor", "middle")
          .attr("transform", function(d) {
            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
          })
          .text(function(d) { return d.text; });
    }


});

}

executeSearch(100);
