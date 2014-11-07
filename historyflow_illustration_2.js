// HistoryFlow Visualization Code
function DocuViz(vizChart, width, height, margin, dataset) {
	/*
	** Data
	*/
	var full_revisions = dataset.revisions;
	var revisions = full_revisions;
	var authors = dataset.authors;
	var segments = dataset.segments;
	var doc_id = dataset.docId;
	var doc_name = dataset.docName;

	var revision_length = dataset.revisions.length;

	/*
	** Variables
	*/
	// How many revisions will be redenered at the first time, if there are too many revisions
	var initial_render_revision_amount = 3;
	// Until which revision slice that the visualization has rendered
	var rendered_revision_counter_end = initial_render_revision_amount;
	// Author label bar Height
	var barHeight = 10;
	// Color scheme 10 categories	
	var color = d3.scale.category10();
	// Inside margin for author labels, axis, and legend
	var chart_margin = {
	 	'top' : 150,
	 	'right' : 20,
	 	'bottom' : (height / 8),
	 	'left' : 60
	};

	/**
	* Slider
	**/
	var slider = vizChart.append("div").attr("id","slider");
	var revision_index_label = vizChart.append("label").attr("for","revision_index");
	var revision_index = vizChart.append("input").attr("id","revision_index");

	/**
	 * SVG
	 **/	
	var svg = vizChart.append("svg")
	 .attr(
	 	"width",
	 	width + margin.left
	 	+ margin.right)
	 .attr(
	 	"height",
	 	height + margin.top
	 	+ margin.bottom)
	 .attr(
	 	"margin-left",
	 	margin.left
	 	)
	 .attr(
	 	"margin-top",
	 	margin.top
	 	);

	/**
	* Slider to interact with historyflow
	**/
	$("#slider").slider({
	    range: true,
	    min: 1,
	    max: revision_length,
	    values: [ 1, revision_length > initial_render_revision_amount ? initial_render_revision_amount : revision_length ],
	    slide: function( event, ui ) {
	    	$( "#revision_index" ).val( "Revision: " + ui.values[ 0 ] + " - Revision: " + ui.values[ 1 ] );
	        
	 		/*
	 		** Interact with the filter
	 		*/

	 		// If there's no new revision slice that hasn't been rendered
	 		if(ui.values[ 1 ] <= rendered_revision_counter_end){
	 			//Do nothing about rendering, just transition and animation
	 			transitionFilter(ui.values[ 0 ] , ui.values[ 1 ]);
	 		}
	 		// If we need to render new revision slices
	 		else{
	 			// Render the non-rendered revision slices first, set them invisible


	 			// then transition and animation
	 			// transitionFilter(ui.values[ 0 ] , ui.values[ 1 ]);

	 			// update the counter
	 			// rendered_revision_counter_end = ui.values[ 1 ];
	 		}
	 		
	 		/*
	 		 * END of Drawing the history flow
	 		 */
	    }
	});
	
	/*
	** Slider label
	*/
	$( "#revision_index" ).val( "Revision: " + $( "#slider" ).slider( "values", 0 ) +
	       " - Revision: " + $( "#slider" ).slider( "values", 1 ) );
	
	//some common visualization area, e.g., legend, authorlist

	/*
	// update the author_list for change segment author function
	d3.select("#author_list")
	.selectAll("option").data(authors).enter().append("option")
	.attr("value", function(d,i){ return i; })
	.text(function(d){ return d; });

	// update the authorlabel_author_list for change authorlabel function
	d3.select("#authorlabel_author_list")
	.selectAll("option").data(authors).enter().append("option")
	.attr("value", function(d,i){ return i; })
	.text(function(d){ return d; });
    $('#authorlabel_author_list').multiselect("refresh"); 
    */

    var titleText = svg.append("text").attr("x",11).attr("y",16).attr("font-family", "sans-serif").attr("font-size", "20px").text(""+doc_name);

    var xScale;
    var yScale;
    var groups;
    var linkGroups;
	/*
	** The function to render a historyflow, default is equal scale
	*/

	this.renderHistoryFlow = function (revision_start_index, revision_end_index, timescale_flag ){
		revision_start_index = typeof revision_start_index !== 'undefined' ? revision_start_index : 1;
		revision_end_index = typeof revision_end_index !== 'undefined' ? revision_end_index : rendered_revision_counter_end;

		function filterRevisionArray(value,index) {
		  return (index >= revision_start_index-1) && (index <= revision_end_index-1);
		}
		revisions = full_revisions.filter(filterRevisionArray);

		// timescale flag, might consider removed in the future
		timescale_flag = typeof timescale_flag !== 'undefined' ? timescale_flag : false;

		yScale = d3.scale.linear().domain(
			[ 0, d3.max(revisions, function(d) {
				return d.revisionLength;
			}) ]).range([ 0, height - chart_margin.top - chart_margin.bottom ]);

		var yAxis = d3.svg.axis().scale(yScale).orient("right").ticks(10).tickFormat(d3.format("d"));
		svg.append("g").attr("class", "axis").attr("transform",
			"translate(" + (chart_margin.left - 55) + "," + chart_margin.top + ")")
		.call(yAxis);

		// the yAxis ending tick
		svg.append("text").attr("transform",
			"translate(" + 14 + "," + (height-chart_margin.bottom+4) + ")").text(d3.max(revisions, function(d) {
				return d.revisionLength;
			}));

		var legend = svg.selectAll("authorGroup").data(authors).enter()
		.append("rect")
		.attr("class", "author_legend").attr("x", 0)
		.attr("y",
			function(d, i) {
				return i * (barHeight*4 + 5 );
			})
		.attr("width", 40*4)
		.attr("height", barHeight*4).attr(
			"fill", function(d, i) {
				return color(i);
			})
		.attr(
			"transform",
			"translate(" + (chart_margin.left )+ ","
				+ (height - chart_margin.bottom ) + ")")
	 	//work on the "authors being there without editing anything" issue, the change will only effect the author label. code by Dakuo
		/*
		.on("click", function(d) {
			$('#addauthor_doc_id').val(doc_id);
			$('#addauthor_dialog_form').dialog( "open" );
		});
		*/;

		//  author contribution in the final revision
		var authorContribution = [];
		for (var i=0; i< authors.length; i++){
			authorContribution[i]=0;
		}
		// temporary variable
		revisions[revisions.length-1].segments.forEach(function(element){
			authorContribution[segments[element].authorId] += segments[element].segmentLength;
		});

		var legendText = svg.selectAll("authorText").data(authors).enter()
		.append("text").attr("x", 40*4 + 10).attr("y", function(d, i) {
			return i * (barHeight*4 + 5);
		})
		.attr("font-family", "sans-serif").attr("font-size", "38px")
		.attr("fill", "black").text(
			function(d, i) {
				return d + " " + authorContribution[i];
			})
		.attr(
			"transform",
			"translate(" + (chart_margin.left )
				+ "," + (height - chart_margin.bottom + (barHeight*4 ) ) + ")");

		xScale = d3.scale.ordinal().domain(d3.range(revisions.length)).rangeRoundBands([ 0, width - chart_margin.left - chart_margin.right ], 0.5);

		// time
		var dateLabel2 = svg.selectAll("dateLabel2").data(revisions).enter()
		.append("text").attr("x", function(d, i) {
			return 0;
		}).attr("y", function(d, i) {
			return xScale(i);
		}).attr("font-family", "sans-serif")
		.attr("font-size", "14px")
		.attr("fill", "black")
		.html(
			function(d) {
				return d.time.substring(5, 10) + " " + d.time.substring(11, 16);
			})
		.attr("transform","translate(" + (chart_margin.left + 15) + "," + (chart_margin.top- (5*barHeight)) + ") rotate(-90)");

		/**
		 * Draw the multi author labl on top of each one
		 */
		 for(var index = 0; index< revisions.length; index++){
		 	var rev = revisions[index];
			//deal with multi author
			if($.isArray(rev.authorId)){
				svg.selectAll("authorLabel_"+index).data(rev.authorId).enter().append("rect")
				.attr("x", function() {
					return xScale(index);
				})
				.attr("y", function(d,i){
					return i*(barHeight + 1);
				})
				// "rev" for the change authorlabel function
				.attr("rev",index + revision_start_index - 1)
				.attr("width", xScale.rangeBand())
				.attr("height", barHeight)
				.style("fill", function(d, i) {
					return color(d);
				})
				.attr(
					// "transform", "translate(" + chart_margin.left + "," + (chart_margin.top - (5*barHeight)) + ")")
					"transform", "translate( 0 ," + (chart_margin.top - (5*barHeight)) + ")")
				//work on the "authors being there without editing anything" issue, the change will only effect the author label. code by Dakuo
				/*
				.on("click", function(d) {
					$('#authorlabel_change_doc_id').val(doc_id);
					$('#authorlabel_change_rev_id').val($(this.attr("rev"));
					$('#authorlabel_dialog_form').dialog( "open" );
				});
				*/;
			}
			//deal with the old version single author heritage
			else{
					svg.append("rect")
					.attr("x", function() {
						return xScale(index);
					})
					.attr("y", 0)
					// "rev" for the change authorlabel function
					.attr("rev",index)
					.attr("width", xScale.rangeBand())
					.attr("height", barHeight)
					.style("fill",  function(){
						return color(rev.authorId);
					})
					.attr("transform", "translate( 0 ," + (chart_margin.top - (5*barHeight))+ ")")
					// .attr("transform", "translate(" + chart_margin.left + "," + (chart_margin.top - (5*barHeight))+ ")")
					//work on the "authors being there without editing anything" issue, the change will only effect the author label. code by Dakuo
				/*
				.on("click", function() {
				});
				*/;
			}
		}

		// segment rectangles
		groups = svg.selectAll("rectGroup").data(revisions).enter().append(
			"g").attr("class", "rectGroup").attr("transform",
			// "translate(" + chart_margin.left + "," + chart_margin.top + ")");
			"translate( 0 ," + chart_margin.top + ")");

		var revisionIndex = -1, revisionIndex2 = -1; //one for calculating x; one for calculating rev_index
		var accumulateSegLength = 0;
		groups
			.selectAll("segment")
			.data(function(d) {
				if (d.segments.length != 0)
					return d.segments;
				else
					return [ -1 ];
			})
			.enter()
			.append("rect")
			.attr("class", "segment")
			.attr("x", function(d, i) {
				if (i == 0)
					revisionIndex++;
				return xScale(revisionIndex);
			})
			.attr("rev",function(d, i) {
				if (i == 0)
					revisionIndex2++;
				return revisionIndex2;
			})
			.attr(
				"y",
				function(d, i) {
					if (i == 0) {
						if (d == -1)
							return yScale(0);
						else {
							accumulateSegLength = segments[d].segmentLength;
							return yScale(accumulateSegLength
								- segments[d].segmentLength);
						}
					} else {
						accumulateSegLength += segments[d].segmentLength;
						return yScale(accumulateSegLength
							- segments[d].segmentLength);
					}
				})
			.attr("width", xScale.rangeBand())
			.attr("height",
				function(d) {
					if (d == -1)
						return 0;
					else
						return yScale(segments[d].segmentLength);
				})
			.attr("fill", function(d, i) {
				if (d != -1)
					return color(segments[d].authorId)
			})
			/*
			.on({
				mouseenter: function(d, i) {
					helper.retrieveSegmentContent(doc_id, d);
					$('.text_content').css({opacity: 0.95, display: "none"}).fadeIn(0);
				},
				mouseleave: function(d, i) {
					$('.text_content').css({display: "none"});
				}

			}, ".hover")
			.on("click", function(d,i) {
				$('#change_doc_id').val(doc_id);
				$('#change_seg_id').val(d);
				$('#change_rev_id').val($(this.attr("rev"));
				$( "#dialog_form" ).dialog( "open" );

			});
			*/;

		// compute link 
		var link = [], preSegment = [];

		for (var j = 0; j < revisions.length - 1; j++) {
			link[j] = [];//link[j] represent the link between revision j and j+1
			preSegment = revisions[j].segments; //revision j segments
			newSegment = revisions[j + 1].segments; //revision j+1 segments
			//iterate revision j+1 segments to find father segment (segmentId) or it own(-1) in the previous revision
			for (var k = 0; k < newSegment.length; k++) {
				// If fatherSegmentIndex<0, it is not a child segment, either has a link to itself, or no link
				if (segments[newSegment[k]].fatherSegmentIndex < 0) {
					preIndex = preSegment.indexOf(newSegment[k]);
					//preIndex = -1 means that the segment is not in the previous revision
					if (preIndex != -1) {
						link[j].push([ preSegment[preIndex], newSegment[k] ]);
					} else {
						//No link
					}
				} else {
					// fatherSegmentIndex>0 it's a child segment, need to calculate the offset and position
					preIndex = preSegment
					.indexOf(segments[newSegment[k]].fatherSegmentIndex);
					//If preindex != -1 means, the father is in previous revision, so link the fathter segment and child segment
					if (preIndex != -1) {
						link[j].push([ preSegment[preIndex], newSegment[k] ]);
					}
					// If preindex = -1 means, the father is not in previous revision, so link the child segment and itself in previsous version
					else {
						preIndex = preSegment.indexOf(newSegment[k]);
						if (preIndex != -1) {
							link[j]
							.push([ preSegment[preIndex], newSegment[k] ]);
						} else {
							// means it has a father, but it's not in previous version,
							alert("link compute error" + preIndex + " "
								+ segments[newSegment[k]]);
							//console.log(segments[newSegment[k]]);
						}
					}
				}
			}// End of Segments  for-loop
			// If there's no link at all, put a empty link for visualize reason
			if (link[j].length == 0) {
				link[j].push([ -1, -1 ]);
			}
		}// End of revision for-loop to compute the links


		// Link rectangles
		var linkGroups = svg.selectAll("linkGroup").data(link).enter()
			.append("g")
			.attr("class", "linkGroup")
			// .attr("transform", "translate(" + (chart_margin.left + xScale.rangeBand()) + ","+ chart_margin.top + ")");
			.attr("transform", "translate(" +  xScale.rangeBand() + ","+ chart_margin.top + ")");

		var linkRevisionIndex = -1;

		linkGroups
			.selectAll("link")
			.data(function(d) {
				return d;
			})
			.enter()
			.append("path")
			.attr("class", "link")
			.attr(
				"d",
				function(d, i) {
					if (i == 0) {
						linkRevisionIndex++;
						accumulateSegLength1 = 0;
						accumulateSegLength2 = 0;
					}
					// If d[1] = -1 means it has only an empty link (-1,-1)
					if (d[1] == -1) {
						return "";
					} else {
						x0 = xScale(linkRevisionIndex);
						var tempSegments1 = revisions[linkRevisionIndex].segments;
						var tempSegments2 = revisions[linkRevisionIndex + 1].segments;

						var index1 = tempSegments1.indexOf(d[0]);
						var index2 = tempSegments2.indexOf(d[1]);

						var accumulateSegLength1 = 0, accumulateSegLength2 = 0;

						for (var q = 0; q < index1; q++) {
							accumulateSegLength1 += segments[tempSegments1[q]].segmentLength;
						}
						for (var q = 0; q < index2; q++) {
							accumulateSegLength2 += segments[tempSegments2[q]].segmentLength;
						}

						if (d[1] == d[0]) {
							y0 = yScale(accumulateSegLength1);
						} else {
							y0 = yScale(accumulateSegLength1
								+ segments[d[1]].offsetInFatherSegment);
						}
						y1 = yScale(accumulateSegLength2);

						x1 = x0 + xScale.rangeBand();
						dy = yScale(segments[d[1]].segmentLength);

						return "M " + x0 + "," + y0 + " " + x0
						+ "," + (y0 + dy) + " " + x1 + ","
						+ (y1 + dy) + " " + x1 + "," + y1
						+ "Z";
					}
			})
			.attr("fill", function(d, i) {
				if (d[1] != -1)
					return color(segments[d[1]].authorId);
			})
			.attr("opacity", 0.8);
	}

	
	// TODO to adjust the display of the historyflow, if any slices are not rendered, render them first and then adjust all slices together
	var transitionFilter = function (revision_start_index,revision_end_index) {

		function filterRevisionArray(value,index) {
		  return (index >= revision_start_index-1) && (index <= revision_end_index-1);
		}
		revisions = full_revisions.filter(filterRevisionArray);

		
		xScale.domain( d3.range(revision_start_index - 1, revision_end_index, 1 ));
		// xScale.domain([revision_start_index,revision_end_index]);
		yScale.domain([ 0, d3.max(revisions, function(d) {return d.revisionLength;}) ]);

		if (revision_end_index <= rendered_revision_counter_end) 
		{
				// just resize the display

				// Resize the display
				// var revisionIndex = -1, revisionIndex2 = -1; //one for calculating x; one for calculating rev_index
				// var accumulateSegLength = 0;

				// resize the segments
				d3.selectAll(".segment")
					.attr("opacity", function(d, i, j){
						var rev = $(this).attr("rev");
						// show these revisions
						if(rev >= (revision_start_index - 1) && rev<= ( revision_end_index - 1 )){
							return 1;
						}
						// dont show these revisions
						else{
							return 0; // push it to 0 inch wide
						}	
					})
					.transition()
					.duration(500)
					.delay(function(d, i) { return $(this).attr("rev") * 10; })
					.attr("x", function(d, i, j) { 
						var rev = $(this).attr("rev");
						// show these revisions
						if(rev >= (revision_start_index - 1) && rev<= ( revision_end_index - 1 )){
							return xScale( rev );
						}
						// don't show these revisions
						else{
							
						}
					})
					.transition()
					.attr("width", function(d, i, j){
						var rev = $(this).attr("rev");
						// show these revisions
						if(rev >= (revision_start_index - 1) && rev<= ( revision_end_index - 1 )){
							return xScale.rangeBand();
						}
						// dont show these revisions
						else{
							 return 0;
						}
					})
					
					;
					//.attr("y", function(d) { return yScale(d.length); });


				// TODO resize the links, for now, just invisible them
				d3.selectAll(".link").transition()
					.duration(500)
					.delay(function(d, i) { return i * 10; })
					.attr("opacity", function(d, i, j) { 
						return 0; // invisible
					})
					.transition();
		} 
		else
		{
				// need to render the un-rendered slices before resize the display

		}
	}

	var transitionTimeScale = function (){

		// timescale flag, might consider removed in the future
		timescale_flag = typeof timescale_flag !== 'undefined' ? timescale_flag : true;
	}

	var transitionEqualScale = function (){
		// timescale flag, might consider removed in the future
		timescale_flag = typeof timescale_flag !== 'undefined' ? timescale_flag : false;

	}

}





// 	/* 
// 	 * Time Scale Rendering 
// 	 */ 
// 	else{

// 		var mindate = new Date(revisions[0].time),maxdate = new Date(revisions[(revisions.length-1)].time);
// 		var xScale = d3.time.scale().domain([mindate, maxdate])
// 		.range([ 0, width - margin.left - margin.right ]);
// 		var barWidth = 5;

// 		// time
// 		var dateLabel2 = svg.selectAll("dateLabel2").data(revisions).enter()
// 		.append("text")
// 		.attr("x", function(d, i) {
// 			return 0;
// 		})
// 		.attr("y", function(d, i) {
// 			return xScale(new Date(d.time));
// 		})
// 		.attr("font-family", "sans-serif").attr("font-size", "14px")
// 		.attr("fill", "black").html(
// 			function(d) {
// 				return d.time.substring(5, 10) + " " + d.time.substring(11, 16);
// 			})
// 		.attr(
// 			"transform","translate(" + (margin.left + 10) + "," + (margin.top-(5*barHeight)) + ") rotate(-90)");

// 		/**
// 		 * Draw the multi author labl on top of each one
// 		 **/
// 		 for(var index=0; index< revisions.length; index++){
// 		 	var rev = revisions[index];
// 			//deal with multi author
// 			if($.isArray(rev.authorId)){
// 				svg.selectAll("authorLabel_"+index).data(rev.authorId).enter().append("rect")
// 				.attr("x", function() {
// 					return xScale(new Date(rev.time));
// 				})
// 				.attr("y", function(d,i){return (barHeight+1)*i;})
// 				// "rev" for the change authorlabel function
// 				.attr("rev",index)
// 				.attr("width", barWidth)
// 				.attr("height", barHeight)
// 				.style("fill", function(d, i) {
// 					return color(d);
// 				})
// 				.attr(
// 					"transform", "translate(" + margin.left + "," + (margin.top - (5*barHeight))
// 						+ ")")//work on the "authors on but not doing editing thing, changes will only effect the author label"
// 				/*
// 				.on("click", function(d) {
// 					$('#authorlabel_change_doc_id').val(doc_id);
// 					//$('#change_seg_id_author').val(d);
// 					$('#authorlabel_change_rev_id').val($(this.attr("rev"));
// 					$('#authorlabel_dialog_form').dialog("open");
// 				});
// 				*/;
// 			}

// 			//deal with the old version single author heritage
// 			else{
// 				svg.append("rect")
// 				.attr("x", function() {
// 					return xScale(new Date(rev.time));
// 				})
// 				.attr("y", 0)
// 				// "rev" for the change authorlabel function
// 				.attr("rev",index)
// 				.attr("width", barWidth)
// 				.attr("height", barHeight)
// 				.style("fill",  function(){
// 					return color(rev.authorId);
// 				})
// 				.attr(
// 					"transform", "translate(" + margin.left + "," + (margin.top - (5*barHeight))
// 						+ ")")
// 				/*
// 				.on("click", function() {
// 					$('#authorlabel_change_doc_id').val(doc_id);
// 					//$('#change_seg_id_author').val(d);
// 					$('#authorlabel_change_rev_id').val($(this.attr("rev"));
// 					$('#authorlabel_dialog_form').dialog( "open" );
// 				});
// 				*/;
// 			}
// 		}

// 		var groups = svg.selectAll("rectGroup").data(revisions).enter()
// 		.append("g").attr("class", "rectGroup")
// 		.attr("transform","translate(" + margin.left + "," + margin.top + ")");

// 		var revisionIndex = -1, revisionIndex2 = -1;
// 		var accumulateSegLength = 0;
// 		var displayGroups = function(groups, start, end) {
// 			return groups
// 			.filter(function(d, i) {
// 				return i >= start && i <= end;
// 			})
// 			.selectAll("rect")
// 			.data(function(d) {
// 				if (d.segments.length != 0)
// 					return d.segments;
// 				else
// 					return [ -1 ];
// 			})
// 			.enter()
// 			.append("rect")
// 			.attr("class", "segment")
// 			.attr("x", function(d, i) {
// 				if (i == 0)
// 					revisionIndex++;
// 				return xScale(new Date(revisions[revisionIndex].time));
// 			})
// 			.attr("rev",function(d, i) {
// 				if (i == 0)
// 					revisionIndex2++;
// 				return revisionIndex2;
// 			})
// 			.attr(
// 				"y",
// 				function(d, i) {
// 					if (i == 0) {
// 						if (d == -1)
// 							return yScale(0);
// 						else {
// 							accumulateSegLength = segments[d].segmentLength;
// 							return yScale(accumulateSegLength
// 								- segments[d].segmentLength);
// 						}
// 					} else {
// 						accumulateSegLength += segments[d].segmentLength;
// 						return yScale(accumulateSegLength
// 							- segments[d].segmentLength);
// 					}
// 				})
// 			.attr("width", barWidth).attr("height",
// 				function(d) {
// 					if (d == -1)
// 						return 0;
// 					else
// 						return yScale(segments[d].segmentLength);
// 				})
// 			.attr("fill", function(d, i) {
// 					if (d != -1)
// 						return color(segments[d].authorId)
// 				})
			
// 			.on("click", function(d) {
// 					$('#change_doc_id').val(doc_id);
// 					$('#change_seg_id').val(d);
// 					$('#change_rev_id').val($(this.attr("rev"));
// 					$( '#dialog_form' ).dialog( "open" );

// 			});
// 			;
// 		}

// 		displayGroups(groups, 0, 100);

// 		//===============================
// 		var link = [], preSegment = [];
// 		for (var j = 0; j < revisions.length - 1; j++) {
// 			link[j] = [];//link[j] represent the link between revision j and j+1
// 			preSegment = revisions[j].segments; //revision j segments
// 			newSegment = revisions[j + 1].segments; //revision j+1 segments
// 			//iterate revision j+1 segments to find father segment (segmentId) or it own(-1) in the previous revision
// 			for (var k = 0; k < newSegment.length; k++) {
// 				// If fatherSegmentIndex<0, it is not a child segment, either has a link to itself, or no link
// 				if (segments[newSegment[k]].fatherSegmentIndex < 0) {
// 					preIndex = preSegment.indexOf(newSegment[k]);
// 					//preIndex = -1 means that the segment is not in the previous revision
// 					if (preIndex != -1) {
// 						link[j].push([ preSegment[preIndex], newSegment[k] ]);
// 					} else {
// 						//No link
// 					}
// 				} else {
// 					// fatherSegmentIndex>0 it's a child segment, need to calculate the offset and position
// 					preIndex = preSegment
// 					.indexOf(segments[newSegment[k]].fatherSegmentIndex);
// 					//If preindex != -1 means, the father is in previous revision, so link the fathter segment and child segment
// 					if (preIndex != -1) {
// 						link[j].push([ preSegment[preIndex], newSegment[k] ]);
// 					}
// 					// If preindex = -1 means, the father is not in previous revision, so link the child segment and itself in previsous version
// 					else {
// 						preIndex = preSegment.indexOf(newSegment[k]);
// 						if (preIndex != -1) {
// 							link[j]
// 							.push([ preSegment[preIndex], newSegment[k] ]);
// 						} else {
// 							// means it has a father, but it's not in previous version,
// 							alert("link compute error" + preIndex + " "
// 								+ segments[newSegment[k]]);
// 							//console.log(segments[newSegment[k]]);
// 						}
// 					}
// 				}
// 			}//end of Segments  for loop
// 			// If there's no link at all, put a empty link for visualize reason
// 			if (link[j].length == 0) {
// 				link[j].push([ -1, -1 ]);
// 			}
// 		}// End of Revisions For loop

// 		var linkGroups = svg.selectAll("linkGroup").data(link).enter().append("g")
// 		.attr("class", "linkGroup")
// 		.attr("transform",
// 			"translate(" + (margin.left + barWidth) + ","
// 				+ margin.top + ")");

// 		var linkRevisionIndex = -1;
// 		var displayLinks = function(linkGroups, start1, end1) {
// 			return linkGroups
// 			.filter(function(d, i) {
// 				return i >= start1 && i <= end1;
// 			})
// 			.selectAll("link")
// 			.data(function(d) {
// 				return d;
// 			})
// 			.enter()
// 			.append("path")
// 			.attr("class", "link")
// 			.attr(
// 				"d",
// 				function(d, i) {
// 					if (i == 0) {
// 						linkRevisionIndex++;
// 						accumulateSegLength1 = 0;
// 						accumulateSegLength2 = 0;
// 					}
// 				// If d[1] = -1 means it has only an empty link (-1,-1)
// 				if (d[1] == -1) {
// 					return "";
// 				} else {
// 					x0 = xScale(new Date(revisions[linkRevisionIndex].time));
// 					var tempSegments1 = revisions[linkRevisionIndex].segments;
// 					var tempSegments2 = revisions[linkRevisionIndex + 1].segments;

// 					var index1 = tempSegments1.indexOf(d[0]);
// 					var index2 = tempSegments2.indexOf(d[1]);

// 					var accumulateSegLength1 = 0, accumulateSegLength2 = 0;

// 					for (var q = 0; q < index1; q++) {
// 						accumulateSegLength1 += segments[tempSegments1[q]].segmentLength;
// 					}
// 					for (var q = 0; q < index2; q++) {
// 						accumulateSegLength2 += segments[tempSegments2[q]].segmentLength;
// 					}

// 					if (d[1] == d[0]) {
// 						y0 = yScale(accumulateSegLength1);
// 					} else {
// 						y0 = yScale(accumulateSegLength1
// 							+ segments[d[1]].offsetInFatherSegment);
// 					}
// 					y1 = yScale(accumulateSegLength2);

// 					x1 = xScale(new Date(revisions[linkRevisionIndex+1].time));
// 					dy = yScale(segments[d[1]].segmentLength);

// 					return "M " + x0 + "," + y0 + " " + x0
// 					+ "," + (y0 + dy) + " " + x1 + ","
// 					+ (y1 + dy) + " " + x1 + "," + y1
// 					+ "Z";
// 				}
// 			}).attr("fill", function(d, i) {
// 				if (d[1] != -1)
// 					return color(segments[d[1]].authorId);
// 			}).attr("opacity", 0.8);
// 		}

// 		displayLinks(linkGroups, 0, 100);
// 	}
// 	// END of Time Scale Rendering
// }


