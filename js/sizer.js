//instantiate lists (global)
var keyList = [];
var compKeyList = [];
var staticList = [];
var clusterKeyList = [];

var keys = [];
var columns = [];
var likelyQueries = [];

//instantiate counts (global)
var compLength = 0;
var columnLength = 0;
var primaryKey;

var processTableDef = function(value){
	
//here's the regex defs
	var cqlCreateTableRegex  = /^CREATE\s+TABLE\s+(\S+)\s*\(\s*( *\t*\S+\s+\S+(\s+PRIMARY KEY|\s+static)*\s*,\s*)+(( *\t*\S+\s+\S+\s*\)$)|( *\t*PRIMARY KEY\s*\(.+\)\s*\)))/ig ;
	var cqlColumnsRegex = /^\(* *\t*\S+\s+\S+(\s+PRIMARY KEY|\s+static)*\s*,*\s*$/igm;
	var cqlCompoundPrimaryKeys = /\( *\( *\w+ *(, *[^\)]+ *)*\)/igm;
	var cqlPrimaryKeys = /^\(* *\t*PRIMARY KEY\s*\(.+\)\s*$/igm;
	
	
	$('#parameters input').remove();
	$('#parameters p, h2 ').remove();
	$('#parameters div').remove();
//	is the table definition valid?
	if(cqlCreateTableRegex.test(value)){
		keyList = [];
		compKeyList = [];
		staticList = [];
		
		
		$('#valid').html("Table Validated");
		$('#parameters').append("<h2>Please insert expected sizes in bytes</h2>");
		$('#parameters').append("<div style='width:200px'><h3>Number of Rows:</h3>"+"<input type='text' id='rowCount'></input></div>");
		
		var i=0;
		columns =value.match(cqlColumnsRegex);
		columnLength = columns.length;

		
		//identify explicit primary keys
		keys = value.match(cqlPrimaryKeys);
		if (keys !== null){
			keys = keys.toString();
			keys = keys.replace("PRIMARY KEY","").replace(/\(+/ig,"").replace(/\)+/gi,"").trim().split(",");
			keys = $.each(keys,function(i, v){
				keys[i] = v.trim();
			});
		}
		
		//identify explicit compound keys
		var compKeys = value.match(cqlCompoundPrimaryKeys);
		if (compKeys !== null){
			compKeys = compKeys.toString();
			compKeys = compKeys.replace("PRIMARY KEY","").replace(/\(+/ig,"").replace(/\)+/gi,"").trim().split(",");
			compKeys = $.each(compKeys,function(i, v){
				compKeys[i] = v.trim();
			});
		}
		
		while (i<columnLength){
			colDat = columns[i].replace(/\(\S+\)/i,"").replace(/\(/i,"").replace(/\)/i,"").replace(/,/i,"").trim().split(/\s+/);
			columns[i] = colDat[0];
			colString = colDat[0]+" of type "+colDat[1]+ ":";

			//find primitives and assign default size
			var defaultSize ="";
			if (colDat[1] == "int" || colDat[1] == "integer"){
				defaultSize = "4";
			}
			if (colDat[1] == "bigint"){
				defaultSize = "8";
			}
			if (colDat[1] == "boolean"){
				//because of Java word size
				defaultSize = "4";
			}
			if (colDat[1] == "counter"){
				defaultSize = "4";
			}
                        if (colDat[1] == "double"){
                                defaultSize = "8";
                        }
                        if (colDat[1] == "float"){
                                defaultSize = "4";
                        }
                        if (colDat[1] == "inet"){
                                //per http://en.wikipedia.org/wiki/IPv6
				defaultSize = "32";
                        }
                        if (colDat[1] == "timestamp"){
                                defaultSize = "8";
                        }
                        if (colDat[1] == "uuid"){
                                defaultSize = "32";
                        }
                        if (colDat[1] == "timeuuid"){
                                defaultSize = "32";
                        }
			
			//create input field
			createInputField(colString,i,"size","Fixed");
			//set value when known
			$('#columnSize_'+ i ).val(defaultSize);
			
			//create population input field
      createInputField(colString,i,"population","Fixed");
			//set value when known
			$('#column_Population'+ i ).val(defaultSize);

      $('[type="text"]').textinput();			
	
			//inline primary key declaration
			if ((colDat.length>2 && colDat[2]=="PRIMARY" && colDat[3]=="KEY")){
				keyList.push(i);
			}
			//count Static columns
			if ((colDat.length>2 && colDat[2]=="STATIC")){
				staticList.push(i);
			}
			//add explicit keys to list
			if($.inArray(colDat[0],keys) >= 0){
				keyList[$.inArray(colDat[0],keys)] = i;
			}
			//add comp keys to list
			if ($.inArray(colDat[0],compKeys)>=0){
				compKeyList.push(i);
			}


			insertHistogram('columnSizeGroup_'+ i);
			insertHistogram('columnPopulationGroup_'+ i);
			
			i=i+1;
		}
		
		//key split and print
		clusterKeyList = $.extend(true, [], keyList);
		
		if (compKeyList.length > 0){
			var i=0;
			var keyLength = clusterKeyList.length;
			while (i< keyLength){
				var shifted = clusterKeyList.shift();
				if ($.inArray(shifted, compKeyList) < 0){
					clusterKeyList.push(shifted);
				}
				i=i+1;
			}
			$('#parameters').append("<p>Compound Primary: "+compKeyList+" Clustering: "+clusterKeyList.toString()+"<\p>");	
		
		}else{
		
			primaryKey = clusterKeyList[0];
			clusterKeyList.shift();
			$('#parameters').append("<p>Primary: "+primaryKey+" Clustering: "+clusterKeyList.toString()+"<\p>");
		}
		
	}
	else{
		$('#valid').html("Invalid Syntax");
	}
	
	
	
	//bind
	$("#parameters input").change(function(){
		calculateSize();
	});
	
	//stat collection
	
	if (compKeys != null){
		compLength = compKeys.length;
	}
	
	//draw Storage Engine
	drawStorageEngine();
	
	$("#countResults h3").remove();
	$("#countResults").append("<h3>Likely select queries for this data model:</h3>");	

	if (value !="" && value != undefined){
		tableName = value.match(/CREATE TABLE.+/i)[0].split(" ")[2];
	}
	var query = "";
	if (compKeyList.length == 0){
		query = "Select * from "+ tableName + " where "+ columns[primaryKey] + " = ?";
	}else{
		var compCounter = 1;
		query = "Select * from "+  tableName + " where "+ columns[compKeyList[0]] + " = ?";
		while (compCounter < compKeyList.length){
			query = query + " and "+columns[compKeyList[compCounter]]+" = ?";
			compCounter++;
		}
	}
	likelyQueries = [];
	likelyQueries.push(query);
	$("#countResults").append("<h3>"+query+"</h3>");
		
	cCCount = 0;
	while (cCCount < clusterKeyList.length){
		var cColumn = columns[clusterKeyList[cCCount]];
		query = query + " and "+cColumn + " = ?";
		
		likelyQueries.push(query);

		$("#countResults").append("<h3>"+query+"</h3>");
		cCCount++;
	}
		
	//setup yaml and download
	//$("input[name*=columnSizeGroup_]").change(function() { downloadYaml("autoGen.yaml")} );
  $("#tabs").click(function() { downloadYaml("autoGen.yaml")} );
	downloadYaml("autoGen.yaml");
}


var calculateSize = function(){
	
	//Here we'll be doing some math to figure out the table size etc:
	/* Here's the math

Number of rows * ( Number of Columns - Partition Keys - Static Columns ) + Static Columns = Number of Values


Sum of the size of the Keys + Sum of the size of the static columns + Number of rows * 
	( Sum of the size of the rows + Sum of the size of the Clustering Columns) +  8 * Number of Values = Size of table
				
	*/
	$('#countResults').remove("p");

	if ($("#rowCount").val() != ""){
		rowCount = parseInt($("#rowCount").val());
	}else{
		rowCount = 0;
	}
	
	var staticCount = staticList.length;
	var keysCount = keyList.length
	
	var nv = rowCount*(columnLength - keysCount - staticCount ) + staticCount;
	$('#countResults p').remove();

	var clusterKeySize = 0;
	var rowsSize = 0;
	var rowsCount = 0;
	var staticSize = 0
	var i=0;
	while (i < columnLength){
		
		if (i == primaryKey){
			primaryKeySize = parseInt($('#columnSize_'+i).val());
		}
		
		else if ($.inArray(i, clusterKeyList) >=0 ){
			clusterKeySize = clusterKeySize + parseInt($('#columnSize_'+i).val());
		}
		
		else if ($.inArray(i, staticList) >= 0 ){
			staticSize = staticSize + parseInt($('#columnSize_'+i).val());
		}
		else{
			rowsSize = rowsSize + parseInt($('#columnSize_'+i).val());
			rowsCount = rowsCount + 1;
		}
		i = i+1;
		
	}

	var sizeOnDisk =  primaryKeySize + staticSize + rowCount * (rowsSize + rowsCount * clusterKeySize) + 8*nv
	

        //check for warning
        if (nv>100000 || sizeOnDisk > 100*1048567){
                $('#countResults').css("color", "red");
                $('#countResults').append("<p>Warning, try to stay under 100mb and 100,000 values per partition!</p>");
        }else{
		$('#countResults').css("color","white");
	}

	//format bytes
	if (sizeOnDisk > 1048567){
		sizeOnDisk = ""+Math.floor(sizeOnDisk/1048567) + " mb";
	}else if (sizeOnDisk > 1024){
		sizeOnDisk = ""+Math.floor(sizeOnDisk/1024) + " kb";
	}else{
		sizeOnDisk = ""+sizeOnDisk+ " bytes";
	}

	//	write results
	$('#countResults').append("<p>Number of Cells in Partition: "+(nv)+"</p>");
	$('#countResults').append("<p>Size of Partition: " + sizeOnDisk +"</p>");

}


//Ugly....
function downloadYaml(filename) {
  var text = $("#tableDef").val();
  var before = "### DML ### THIS IS UNDER CONSTRUCTION!!!\n"+
" \n"+
"# Keyspace Name\n"+
"keyspace: AutoGeneratedTest\n"+
" \n"+
"# The CQL for creating a keyspace (optional if it already exists)\n"+
"keyspace_definition: |\n"+
"  CREATE KEYSPACE AutoGeneratedTest WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};\n"+
" \n"+
"# Table name\n"+
"table: "+ tableName +"\n"+
" \n"+
"# The CQL for creating a table you wish to stress (optional if it already exists)\n"+
"table_definition: \n";

  var after = "\n"+
"### Column Distribution Specifications ###\n"+
" \n"+
"columnspec:\n";

  for (var i = 0;i < columnLength; i++){

    //set size distributions  
    if ($("input[name=columnSizeGroup_"+i+"-radio-choice-h-2]:checked").val() == "fixed"){
      after = after + "  - name: "+ columns[i]  +"\n"+
        "    size: fixed("+$("#columnSize_"+i).val() +")\n";
    }  
    if ($("input[name=columnSizeGroup_"+i+"-radio-choice-h-2]:checked").val() == "uni"){
      after = after + "  - name: "+ columns[i]  +"\n"+
        "    size: uniform("+$("#columnSize_"+i).val() +".."+ $("#columnSize_"+i+"_2").val()   +")\n";
    }if ($("input[name=columnSizeGroup_"+i+"-radio-choice-h-2]:checked").val() == "exp"){
      after = after + "  - name: "+ columns[i]  +"\n"+
        "    size: exponential("+$("#columnSize_"+i).val() +")\n";
    }if ($("input[name=columnSizeGroup_"+i+"-radio-choice-h-2]:checked").val() == "ext"){
      after = after + "  - name: "+ columns[i]  +"\n"+
        "    size: extreme("+$("#columnSize_"+i).val() +".."+ $("#columnSize_"+i+"_2").val()   +")\n";
    }if ($("input[name=columnSizeGroup_"+i+"-radio-choice-h-2]:checked").val() == "norm"){
      after = after + "  - name: "+ columns[i]  +"\n"+
        "    size: gaussian("+$("#columnSize_"+i).val() +".."+ $("#columnSize_"+i+"_2").val()   +")\n";
    }

    //set population distributions
    if ($("input[name=columnPopulationGroup_"+i+"-radio-choice-h-2]:checked").val() == "fixed"){
      after = after +
        "    population: fixed("+$("#columnPopulation_"+i).val() +")\n"+
        " \n";
    }    
    if ($("input[name=columnPopulationGroup_"+i+"-radio-choice-h-2]:checked").val() == "uni"){
      after = after +
        "    population: uniform("+$("#columnPopulation_"+i).val() +".."+ $("#columnPopulation_"+i+"_2").val()   +")\n"+
        " \n";
    }if ($("input[name=columnPopulationGroup_"+i+"-radio-choice-h-2]:checked").val() == "exp"){
      after = after +
        "    population: exponential("+$("#columnPopulation_"+i).val() +")\n"+
        " \n";
    }if ($("input[name=columnPopulationGroup_"+i+"-radio-choice-h-2]:checked").val() == "ext"){
      after = after +
        "    population: extreme("+$("#columnPopulation_"+i).val() +".."+ $("#columnPopulation_"+i+"_2").val()   +")\n"+
        " \n";
    }if ($("input[name=columnPopulationGroup_"+i+"-radio-choice-h-2]:checked").val() == "norm"){
      after = after +
        "    population: gaussian("+$("#columnPopulation_"+i).val() +".."+ $("#columnPopulation_"+i+"_2").val()   +")\n"+
        " \n";
    }
  }
	var after = after +
"\n"+
"   \n"+
"### Batch Ratio Distribution Specifications ###\n"+
" \n"+
"insert:\n"+
"  partitions: fixed(1)            # Our partition key is the domain so only insert one per batch\n"+
" \n"+
"  pervisit:  fixed(1)/1000        # We have 1000 posts per domain so 1/1000 will allow 1 post per batch  \n"+
" \n"+
"  perbatch:  fixed(1)/1           # With one partition per batch we can set this to 100% \n"+
" \n"+
"  batchtype: UNLOGGED             # Unlogged batches\n"+
" \n"+
" \n"+
"#\n"+
"# A list of queries you wish to run against the schema\n"+
"#\n"+
"queries:\n";

for (var i=0; i<likelyQueries.length; i++){
	after = after + "   likelyquery"+i+":  "+likelyQueries[i]+"\n";
}
 
  var pom = $("#generateYaml")[0];
  pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(before + text + after));
  pom.setAttribute('download', filename);
}

		

$("#tableDef").bind('input propertychange', function() {
	processTableDef($("#tableDef").val());
});


$(document).bind("mobileinit", function(){
  $.mobile.touchOverflowEnabled = true;
});
