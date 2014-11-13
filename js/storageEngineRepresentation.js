var drawStorageEngine = function(){

	jdataOld = [
	    {
	        "PartitionKey":"pupIdentificationCode",
	        " ":[
	            {
	                "name": "sarah",
	                "salary":10000
	            },
	            {
	                "name": "bill",
	                "salary":5000
	            }
	        ]
	    }
	];
	
	jdata = [
	    {
	        "PartitionKey":"<pupIdentificationCode>",
	        "Partition":[
	            {
	                "<ownerName>:<short_hair>:size": "<size>",
	
					"ownerAddress": "<ownerAddress>"
	            }
	        ]
	    }
	];
	
	var columnsArray = []
	

	var columnObject = {};
	
	//remove the keys from keylessColumns -- a deep copy of columns
	keyList.sort(function(a, b){return b-a})
	
	keylessColumns = columns.slice();
	for (i=0;i<keyList.length;i++){
		keylessColumns.splice(keyList[i],1)
	}
	
	
	//loop over keys to generate columns.
	for (j=0;j<keylessColumns.length;j++){
	
		colName = "<"+columns[clusterKeyList[0]]+">";
		for (i=1; i < clusterKeyList.length; i++){
			colName = colName+":"+"<"+columns[clusterKeyList[i]]+">";
		}
		var myKey = colName+":"+keylessColumns[j];
		var myValue = "<"+""+keylessColumns[j]+">";
		columnObject[myKey]= myValue;
	}

	columnsArray.push(columnObject);
	
	rowObject = {}
	
	if (compKeyList.length ==0){
		jdata = [
			{
				"PartitionKey": "<" + keys[primaryKey] + ">",
				" ":columnsArray
			}]
	}else{
		jdata = []
		
		var rowKey = "<"+columns[compKeyList[0]]+">";
		for (i=1;i<compKeyList.length;i++){
			rowKey = rowKey +":"+ "<"+columns[compKeyList[i]]+">";
		}
		for (i=0;i<compKeyList.length;i++){
			jdata[i]={
				"PartitionKey": rowKey,
				" ":columnsArray
			};
		}
	}
	
	d3.select("#trifthStorage table").remove();
	d3.select("#trifthStorage").selectAll("table")
	    .data([jdata])
	  .enter().append("table")
	    .call(recurse);
	
	function recurse(sel) {
	  // sel is a d3.selection of one or more empty tables
	  sel.each(function(d) {
	    // d is an array of objects
	    var colnames,
	        tds,
	        table = d3.select(this);
	
	    // obtain column names by gathering unique key names in all 1st level objects
	    // following method emulates a set by using the keys of a d3.map()
	    colnames = d                                                          // array of objects
	        .reduce(function(p,c) { return p.concat(d3.keys(c)); }, [])       // array with all keynames
	        .reduce(function(p,c) { return (p.set(c,0), p); }, d3.map())      // map with unique keynames as keys
	        .keys();                                                          // array with unique keynames (arb. order)
	
	    // colnames array is in arbitrary order
	    // sort colnames here if required
	
	    // create header row using standard 1D data join and enter()
	    table.append("thead").append("tr").selectAll("th")
	        .data(colnames)
	      .enter().append("th")
	        .text(function(d) { return d; });
	
	    // create the table cells by using nested 2D data join and enter()
	    // see also http://bost.ocks.org/mike/nest/
	    tds = table.append("tbody").selectAll("tr")
	        .data(d)                            // each row gets one object
	      .enter().append("tr").selectAll("td")
	        .data(function(d) {                 // each cell gets one value
	          return colnames.map(function(k) { // for each colname (i.e. key) find the corresponding value
	            return d[k] || "";              // use empty string if key doesn't exist for that object
	          });
	        })
	      .enter().append("td");
	
	    // cell contents depends on the data bound to the cell
	    // fill with text if data is not an Array
	    tds.filter(function(d) { return !(d instanceof Array); })
	        .text(function(d) { return d; });
	    // fill with a new table if data is an Array
	    tds.filter(function(d) { return (d instanceof Array); })
	        .append("table")
	        .call(recurse);
	  });
	}



}

processTableDef($("#tableDef").val());
