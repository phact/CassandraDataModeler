
var keyList = [];
var compKeyList = [];

var staticCount = 0;
var compLength = 0;
var columnLength = 0;

var processTableDef = function(value){
	
//here's the regex defs
	var cqlCreateTableRegex  = /^CREATE\s+TABLE\s+(\S+)\s*\(\s*( *\t*\S+\s+\S+(\s+PRIMARY KEY|\s+static)*\s*,\s*)+(( *\t*\S+\s+\S+\s*\)$)|( *\t*PRIMARY KEY\s*\(.+\)\s*\)))/ig;
	var cqlColumnsRegex = /^\(* *\t*\S+\s+\S+(\s+PRIMARY KEY|\s+static)*\s*,*\s*$/igm;
	var cqlCompoundPrimaryKeys = /\(\(\s*\S+\s+\S+\)/igm;
	var cqlPrimaryKeys = /^\(* *\t*PRIMARY KEY\s*\(.+\)\s*$/igm;
	
	
	$('#parameters input').remove();
	$('#parameters p').remove();
//	is the table definition valid?
	if(cqlCreateTableRegex.test(value)){
		keyList = [];
		compKeyList = [];
		
		
		$('#valid').html("Table Validated, please insert expected sizes in bytes");
		$('#parameters').append("<p>Number of Rows:<\p>"+"<input id='rowCount'></input>");
		
		var i=0;
		var columns =value.match(cqlColumnsRegex);
		columnLength = columns.length;

		
		//identify explicit primary keys
		var keys = value.match(cqlPrimaryKeys);
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
			colString = colDat[0]+" of type "+colDat[1];
			$('#parameters').append("<p>"+colString+"<\p>"+"<input></input>");
			
			//inline primary key declaration
			if ((colDat.length>2 && colDat[2]=="PRIMARY" && colDat[3]=="KEY")){
				keyList.push(i);
			}
			//count Static columns
			if ((colDat.length>2 && colDat[2]=="STATIC")){
				staticCount++;
			}
			//add explicit keys to list
			if($.inArray(colDat[0],keys) >= 0){
				keyList[$.inArray(colDat[0],keys)] = i;
			}
			//add comp keys to list
			if ($.inArray(colDat[0],compKeys)>=0){
				compKeyList.push(i);
			}

			i=i+1;
		}
		
		//key split and print
		if (compKeyList.length > 0){
			var i=0;
			var keyLength = keyList.length;
			while (i< keyLength){
				var shifted = keyList.shift();
				if ($.inArray(shifted, compKeyList) < 0){
					keyList.push(shifted);
				}
				i=i+1;
			}
			$('#parameters').append("<p>Compound Primary: "+compKeyList+" Clustering: "+keyList.toString()+"<\p>");	
		
		}else{
		
			var primaryKey = keyList[0];
			keyList.shift();
			$('#parameters').append("<p>Primary: "+primaryKey+" Clustering: "+keyList.toString()+"<\p>");
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
}


var calculateSize = function(){
	
	//Here we'll be doing some math to figure out the table size etc:
	/* Here's the math

Number of rows * ( Number of Columns - Partition Keys - Static Columns ) + Static Columns = Number of Values


Sum of the size of the Keys + Sum of the size of the static columns + Number of rows * ( Sum of the size of the rows + Sum of the size of the Clustering Columns) +  8 * Number of Values = Size of table
				
	*/
	$('#countResults p').remove();

	if ($("#rowCount").val() != ""){
		rowCount = $("#rowCount").val();
	}else{
		rowCount = 0;
	}
	
	var nv = rowCount*(columnLength - compLength - staticCount ) + staticCount;
	$('#countResults').append("<p>Number of Values: "+(nv)+"</p>");

	$('#countResults').append("<p>Size of table: "+(nv)+"</p>");
	
	

}
		

$("#tableDef").bind('input propertychange', function() {
	processTableDef($("#tableDef").val());
});

