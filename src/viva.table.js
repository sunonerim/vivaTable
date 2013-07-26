/**
 *	viva.table.js
 *		version 1.0
 * 
 */
jQuery.fn.exists = function(){return this.length>0;};


(function($){
	var	VivaTable = function(_table, _table_option){
		this.init( _table , _table_option);
	};
	
	VivaTable.prototype = {
		constructor:VivaTable,
		
		_$table:null,
		_$tableBody: null, //Reference to <body> in the table (jQuery object)
		_table_width : -1,
	
		mTableOption:null,
		
		_defaultOption : {		// default Option
				firstColumnCheck: true,
				
				paging			: true, 		//Enable paging
        		pageSize		: 10, 			//Set page size (default: 10)
        		pageCount		: 5,
        		
        		sorting			: true, 		//Enable sorting            	
		  		defaultSorting	: '', 			//Set default sorting		  		
				
		},
		
		init:function( _table, _table_option ){
			this._$table = _table;			
			
			console.log( "_table_option.sorting", _table_option.sorting );
			//this.mTableOption = $.extend( _table_option, this._defaultOption);
			this.mTableOption = $.extend(  this._defaultOption, _table_option);
			
			console.log( "this.mTableOption.sorting", this.mTableOption.sorting );
			
			this._buildTableHeader();
			this._$tableBody = $('<tbody></tbody>').appendTo(this._$table);
			
			console.log( "this.mTableOption.pageCount  > " + this.mTableOption.pageCount );
			this._buildClickEvent();
			this._buildSorting();
			this._buildOptionsFromCodes();
			
			var	self = this;
			$(window).resize(function() {
				console.log("WINDOWS RESIZE");
				self._buildTableContent();
				self._table_width = -1;
				self._adjustTableWidth();
			});
		},
		
		
		/*
		 * load data from TableOption.action.listAction
		 */
		load:function() {			
			// console.log( this._$table );			
			var parameter =  this._getRequestParameter();
			// console.log( parameter );
			this._load(parameter);
			this._adjustTableWidth();
		},
		
		
		/*
		 * OpenCreateForm
		 */
		openCreateForm:function() {
			alert("CreateFROM");
		},
		
		
		doCheckedCallback:function(){
			console.log("doCheckedCallback called.");
			
			if( this.mTableOption.checkRecordCallback ) {
				var index = 0;
				var	self = this;
				
				$(this._$table).find("input[type='checkbox']").each(function(){					
					if ($(this).is(":checked")){
						self.mTableOption.checkRecordCallback(self.mTableOption._records[index]);
					}
					index++;
				});
			}
		},
		
		
		setFieldOfCreatedialog : function (record) {
			this._setField(record);
		},

		
		//-----------------------------------------------------------------------------------------------
		//
		// private method.
		//
		_load:function(parameter){
			var	self = this;
			$.ajax({
				  dataType: "json"
				  ,"url": this.mTableOption.actions.listAction
				  ,async: false
				  ,data: parameter
				  ,success: function( data ) {
					  if( data.Result == "OK"){
						  self.mTableOption.totalRecordCount = data.TotalRecordCount;
						  self.mTableOption._records = data.Records;						  
						  self._buildTableContent(data.Records);
						} else {						
							alert(data.ErrorReason);
						}
				  }
				  ,error : function (jqXHR,textStatus,errorThrown  ){
					  alert("System Errorr");
				  }
				});
		},
		
		_buildTableHeader:function() {
			if( $(this._$table).has("thead").length == 0 ) {
				console.log("TABLE thead has to be build");
				
				var $thead = $("<thead></thead>");
				$thead.appendTo( this._$table);
				
				var $tr = $("<tr></tr>");
				$tr.appendTo( $thead );
				
				
				// first column
				if(  this.mTableOption.firstColumnCheck ){
					var $th = $("<th></th>");
					$th.appendTo( $tr );
					$th.width( 24 );
				}
				
				// console.log("this.mTableOption.fields.length", this.mTableOption.fields.length);
				for ( var field in this.mTableOption.fields ){
//					console.log(this.mTableOption.fields[field].title);

					var $th = $("<th></th>");
					$th.appendTo( $tr );
					$th.attr("vivatable-field", field );
					$th.text(this.mTableOption.fields[field].title);
				}
				
				// add delete, update column
				var $th = $("<th></th>");
				$th.appendTo( $tr );
				$th.width( 24 );
				
				$del_th = $("<th></th>");
				$del_th.appendTo( $tr );
				$del_th.width(24);
			} 
			
		},
		
		_adjustTableWidth:function() {
			console.log( $(this._$table).width() , $(this._$table).parent().width() , $(this._$table).parent().parent().width() 
					,$(this._$table).outerWidth(true) , $(this._$table).parent().outerWidth(true) , $(this._$table).parent().parent().outerWidth(true));
			
			if( $(this._$table).width() <  $(this._$table).parent().width() ) {
				if( this._table_width < 0 ) {
					this._table_width = $(this._$table).parent().width() ;					
				}				
				$(this._$table).width( this._table_width ); 
			}
		},
		
		/*
		 * build click event for list and delete.
		 */
		_buildClickEvent:function(){
			
			var self = this;
			$("[vivatable-load]").each(function(){
				if($(this).attr("vivatable-load") == self._$table.selector)  $(this).on({"click":$.proxy(self.load, self)});
			});
			
			// vivatable-create  for POPUP CREATE FORM
			$("[vivatable-create]").each(function(){
				if($(this).attr("vivatable-create") == self._$table.selector)  $(this).on({"click":$.proxy(self.openCreateForm, self)});
			});
			
			$("[vivatable-do-checked]").each(function(){
				if($(this).attr("vivatable-do-checked") == self._$table.selector)  $(this).on({"click":$.proxy(self.doCheckedCallback, self)});
			});
			

		},
		
		_buildSorting:function() {
			if(!this.mTableOption.sorting ) {
				console.log("SORTING FALSE");
				return ;
			}
			
			console.log("SORTING TRUE");
			
			var self = this;
			$(this._$table).find("th[vivatable-field]").each(function(){
				
				$(this).append("<div class='vivatable-sort-indicator'></div>");
				$(this).css("cursor", "pointer");
				$(this).click(function(){
					
					var	click_th = this;
					$(self._$table).find("th[vivatable-field]").each(function(){
						if( click_th != this ){
							$(this).removeClass("vivatable-sort-asc");
							$(this).removeClass("vivatable-sort-desc");
						}
					});
					
					if ( $(this).hasClass("vivatable-sort-asc") ) {
						self.mTableOption.defaultSorting = $(this).attr("vivatable-field") + " DESC";
						$(this).removeClass("vivatable-sort-asc");
						$(this).addClass("vivatable-sort-desc");
					} else {
						self.mTableOption.defaultSorting = $(this).attr("vivatable-field") + " ASC";
						$(this).removeClass("vivatable-sort-desc");
						$(this).addClass("vivatable-sort-asc");
					}															 
					self.load();
				});
			});
		},
		
		
		_buildOptionsFromCodes:function() {
			this._addCodeWithFields();
			this._addCodeWithSelectTag();
			this._requestCode();	
			this._setFieldOptionWithCodeValue();
			this._fillSelectWithCode();
		},
		
		/*
		 * build table body area.
		 */
		_buildTableContent:function( ){			
			this._$tableBody.empty();			
			this._addUpdateDeleteHeader();
			
			for ( var i=0; i<this.mTableOption._records.length; i++) {					
				this._addRow(this.mTableOption._records[i], i);
			}			
			this._buildPageContainer(1, 10, 54);			
			
			
			
			// check the width of th
			//Find data columns
            var headerCells = this._$table.find('>thead th');
            //Calculate total width of data columns
            var totalWidthInPixel = 0;
            var theaorical_total_width = 0;
            
            // normalize column width
            var self = this;
            headerCells.each(function () {
                var $cell = $(this);
                if ($cell.is(':visible') && $cell.attr('vivatable-field') ) {
                	var field = $cell.attr('vivatable-field');                	                	
                	// console.log( 'self.mTableOption.fields[field].width : ' + self.mTableOption.fields[field].width );
                	
                	$cell.width(self.mTableOption.fields[field].width);
                	             
                	theaorical_total_width += self.mTableOption.fields[field].width;
                    totalWidthInPixel += $cell.outerWidth();
                    // console.log( '$cell.outerWidth() : ' + $cell.outerWidth());
                }
            });
            // console.log( 'totalWidthInPixel : ' + totalWidthInPixel);
            this._$table.width( theaorical_total_width );            
		},
		
		/**
		 * add a column for Update and Delete button. 
		 */
		_addUpdateDeleteHeader:function(){
			if( this.mTableOption.didAddUpdateDeleteColumn ) return ;
			
			this._addHeaderColumn();
			this._addHeaderColumn();
			
			this.mTableOption.didAddUpdateDeleteColumn = true;
		},
		/**
		 * 
		 */
		_addHeaderColumn:function() {
			var count_rows = this._$table.find('>thead tr').size();
			
			if( count_rows > 1 ){
				this._$table.find(">thead>tr:first-child").each( function(){
//					console.log( "attache count_rows>" + count_rows );
					var $cell = $("<th></th>");
					$cell.appendTo( $(this) ).attr("rowspan", count_rows );
					$cell.width(24);
				});
			} else {
				// this._$table.find(">thead>tr:first-child")
			}
		},
		/**
		 * 
		 * @param record
		 */
		_addRow:function( record, index ){
			var	$tr = $("<tr></tr>");
			this._$tableBody.append($tr);			
			this._addFirstColumnCheckbox($tr);
			this._addCell($tr, record);
			this._addUpdateCell($tr);
			this._addDeleteCell($tr);
			$tr.data("rec-index", index);
		},
		
		
		/**
		 * 
		 * @param $tr
		 */
		_addFirstColumnCheckbox:function($tr){
			if( this.mTableOption.firstColumnCheck ) {
				var $checkbox_col = $("<td ><input type='checkbox'></td>").appendTo($tr);
			}
		}, 
		
		_addUpdateCell:function($tr){		
			var self = this;
			var $update_cell = $("<td><i class='fugue-table-pencil'></i></td>").appendTo($tr);
			var $row = $tr;
			$update_cell.click(function(e){
				//self._handleUpdateAction( $(this).parent().data('rec-index') );
				var $dialog = self._popupUpdateForm( $(this).parent().data('rec-index') );				

				
				var rec_index = $(this).parent().data('rec-index');
				var data = new Object();
				data.form      = $("#vivatable-update-popup");
				data.formType  = 'edit';
				data.record    = self.mTableOption._records[ rec_index];
				data.row       = $row;
				
				if( self.mTableOption.formCreated ) {
					self.mTableOption.formCreated(e,  data);
				}				
				
				$dialog.find("#vivatable-update-button").click(function(e){
					self._handleUpdateAction( rec_index );
					if( self.mTableOption.formClosed ) self.mTableOption.formClosed(e,  data);
				});

			});
		},

		//-------------------------------------------------------------------
		// update FORM part
		//-------------------------------------------------------------------
		_popupUpdateForm:function(index){
			var	$dialog = this._makeupDialogFrame();
			
			var	$dialog_content = $dialog.find(".modal-body");
			
			for (var field in this.mTableOption.fields ) {
				    fieldContents = this.mTableOption.fields[field];
				    if( this.mTableOption.fields[field].key){
				    	this._makeupJustField( this.mTableOption.fields[field].title, field, this.mTableOption._records[index][field], 	$dialog_content );
				    } else { 
				    	this._makeupTextInput ( this.mTableOption.fields[field].title, field, this.mTableOption._records[index][field], 	$dialog_content );
				    }
			}		
			
			$dialog.modal({
				backdrop: false,
  				keyboard: false
			});
			
			return $dialog;
		},

		
		_makeupDialogFrame:function() {
			if( $("body div#vivatable-dialog").exists() ) {
				return $("body div#vivatable-dialog");
			};			
			
			var template = "<div id='vivatable-dialog' class='modal hide vivatable-popup' tabindex='-1' role='dialog' aria-hidden='true' >"
				+ "<div class='modal-header' >"			
				+"<button type='button' class='close' data-dismiss='modal' aria-hidden='true'>×</button>"
				+"<h4 id='vivatable-dialog-title'>Dialog</h4>"
				+"</div>"
				+"<div class='modal-body viva-form-condensed' style='min-height:540px;background-color: #F5F6F9;'>"											
				+"</div>"			
				+"<div class='modal-footer'>"
				+"<button class='btn' data-dismiss='modal' aria-hidden='true'>Close</button>"
				+"<button id='vivatable-update-button' class='btn btn-primary'>Update</button>"
				+"</div></div>";
				
				return $(template).appendTo("body");
		},
		
		
		_makeupJustField:function(label, name, value, parent_selector) {
			if( value == undefined ) value = null;
			
			var row_markup = "<div class='row-fluid vivatable-control-group'><label class='span4'>" +   label + "</label><span>" + value + "</span>";
			parent_selector.append( row_markup );			
		},		
		_makeupTextInput:function( label, name, value, parent_selector ){
			if( value == undefined ) value = "";
			
			var row_markup = "<div class='row-fluid vivatable-control-group'><label class='span4'>" +   label + "</label><input type='text' name='"+name+"' value='" + value + "'></div>";
			parent_selector.append( row_markup );
		},
		
		_makeupCodeSelect:function(label, name, value, parent_selector ){
			
		},
		
		_makeupRadio:function(label, name, value, parent_selector ) {
			
		},
		//--------------------------------------------------------------------
		
		_handleUpdateAction:function( rec_index){
			console.log("_handleUpdateAction called", rec_index);
			var parameter = this._getKeyParameter(rec_index);
			parameter
			$.ajax({
				  dataType: "json"
				  ,"url": this.mTableOption.actions.updateAction
				  ,async: false
				  ,data: parameter
				  ,success: function( data ) {
					  if( data.Result == "OK"){
						  this.load();						  
						} else {						
							alert(data.ErrorReason);
						}
				  }
				  ,error : function (jqXHR,textStatus,errorThrown  ){
					  alert("System Errorr");
				  }
				});			
		},
		
		
		_addDeleteCell:function($tr){
			var self = this;
			
			var $delete_cell = $("<td><i class='fugue-table-minus'></i></td>").appendTo($tr);			
			$delete_cell.click(function(){
				self._popupDeleteConfirmDialog( $(this).parent().data("rec-index"));				
			});
		},
		
		_popupDeleteConfirmDialog:function( rec_index ){
			if( confirm("Delete"))
					this._handleDeleteAction( rec_index );			
		},
		
		_handleDeleteAction:function( rec_index){
			console.log("_handleDeleteAction called", rec_index);
			var parameter = this._getKeyParameter(rec_index);
			parameter
			$.ajax({
				  dataType: "json"
				  ,"url": this.mTableOption.actions.deleteAction
				  ,async: false
				  ,data: parameter
				  ,success: function( data ) {
					  if( data.Result == "OK"){
						  this.load();						  
						} else {						
							alert(data.ErrorReason);
						}
				  }
				  ,error : function (jqXHR,textStatus,errorThrown  ){
					  alert("System Errorr");
				  }
				});			
		},
		
		/**
		 *	 
		 * @param $tr
		 * @param record
		 */
		_addCell:function($tr, record){
			for (var field in this.mTableOption.fields ) {
				$td = $("<td></td>").appendTo($tr);
				
				if( this.mTableOption.fields[field].listClass ){
					$td.addClass(this.mTableOption.fields[field].listClass);
				} 
				
				var cell_text = "";
				if( this.mTableOption.fields[field].options ){
					for ( var i=0; i < this.mTableOption.fields[field].options.length; i++ ){
						// console.log( "_addCell", this.mTableOption.fields[field].options[i].Value, record[field]);
						
						if(  this.mTableOption.fields[field].options[i].Value == record[field]) {
							cell_text = this.mTableOption.fields[field].options[i].DisplayText;
							//console.log( "_addCell yes", cell_text ); 
						}
					}
				} else if( this.mTableOption.fields[field].display ) {
					cell_text = this.mTableOption.fields[field].display( record );
				}
				else{
					cell_text = record[field]; 
				}
				
				
				$td.html(cell_text);				
				
				// option 
				// add click event handler 
				if( this.mTableOption.fields[field].clickHandler ){
					var self = this;
					var cell_click_handler = this.mTableOption.fields[field].clickHandler ;
					$td.click( function(){
						var data = new Object();
						data.self = self;
						data.record = record;
						cell_click_handler(data);
					});
				}				
			}	
		},
		
		
		_buildPageContainer:function( ) {
			// if( this.mTableOption.paging ) return ;
			var	self = this;
			
			$("div.vivatable-page-container").each(function(){
				$(this).empty();
				var	$page_div = $("<div class='pagination pagination-small'></div>").appendTo( $(this)) ;
				var $page_box = $("<ul></ul>").appendTo($page_div);
				
				var total_pages = ( self.mTableOption.totalRecordCount - 1) / self.mTableOption.pageSize + 1;
				
				var	first_page  = parseInt( (self.mTableOption.page-1) / self.mTableOption.pageCount ) * self.mTableOption.pageCount + 1;	
				var	last_page   = first_page + self.mTableOption.pageCount > total_pages ? total_pages : first_page + self.mTableOption.pageCount-1;

				
				if( self.mTableOption.page  > 1 )
					$("<li><a href='#'>«</a></li>").appendTo($page_box).on({"click":$.proxy(self._loadPrevPage, self)});
				
				for ( var page = first_page ; page <= last_page; page++){
					if ( page == self.mTableOption.page )  {
						$("<li class='disabled'><a href='#'>" + page + "</a></li>").appendTo($page_box);
					} else {
						$("<li><a href='#'>" + page + "</a></li>").appendTo($page_box).on({"click":$.proxy(self._loadPage, self, page )});
					}
				}
				
				if ( self.mTableOption.page < total_pages )
					$("<li><a href='#'>»</a></li>").appendTo($page_box).on({"click":$.proxy(self._loadNextPage, self)});

			});
		},
		
		
		/**
		 * build request parameter 
		 *	jtPageSize : paging size.
		 *	jtStartIndex : start 0 for the first record. 
		 * @returns {Object}
		 */
		_getRequestParameter:function(){
			var	param = new Object();
			
			for (var field in this.mTableOption.fields ) {
				    fieldContents = this.mTableOption.fields[field];			
				    if( fieldContents.conditionInputID && $(fieldContents.conditionInputID).val() ){
				    	param[field] = $(fieldContents.conditionInputID).val();
				    }
			}
			
			if( ! this.mTableOption.page ) this.mTableOption.page = 1; 
			param["jtPageSize"]   =  this.mTableOption.pageSize ;
			param["jtStartIndex"] =  (this.mTableOption.page-1) *  this.mTableOption.pageSize ;
			
			// for sorting
			if( this.mTableOption.sorting ){
				param["jtSorting"] = this.mTableOption.defaultSorting;
			}
			return param;
		},
		
		
		_getKeyParameter:function(index){
			var	param = new Object();
			
			for (var field in this.mTableOption.fields ) {
				    fieldContents = this.mTableOption.fields[field];
				    if( fieldContents.key ){
				    	param[field] = this.mTableOption._records[index][field] ;
				    }
			}		
			return param;
		},
		
		_loadPage:function(page) {
			this.mTableOption.page = page;
			this.load();			
		},
		
		_loadPrevPage:function(){
			if(this.mTableOption.page <= 1 ) {
				this.mTableOption.page = 1 ;
				return ;
			}
			this.mTableOption.page--;
			this.load();
		},
		
		_loadNextPage:function(){
			/*
			if(this.mTableOption.page > 1 ) {
				this.mTableOption.page = 1 ;
				return ;
			}
			*/
			this.mTableOption.page++;
			this.load();
		},

		
		//######################   code option  begin ######################
		_codeExpress : null,
		_codes  	 : null,		

		
		_addCodeWithFields : function() {
			for (var field in this.mTableOption.fields ) {
				if( this.mTableOption.fields[field].codeOption ) {
					this._addCode ( this.mTableOption.fields[field].codeOption );	
				}
			}
		},
		
		
		_addCodeWithSelectTag : function () {
			var self = this;			
			if( this.mTableOption.createDialogID ){
				$( this.mTableOption.createDialogID ).find("select").each(function(){
//					console.log("_addCodeWithSelectTag  >> " , this );
					var code = $(this).attr("vivatable-code");
					if( code != undefined && code != null ){
						self._addCode(code);
					}
				});
			}
		},
		
		_addCode : function(code){
			if( this._codeExpress == null || this._codeExpress.length == 0 ){
				this._codeExpress = "'" + code + "'";
			} else {
				this._codeExpress += ",'" + code + "'";
			}
			return ;
		},
		
		
		
		
		_setField : function( record ){
			if( this.mTableOption.createDialogID == undefined ) return ;
			
			$( this.mTableOption.createDialogID).find("input").each( function(){
				if( $(this).attr('viva-field')) {
					$(this).val( record [$(this).attr('viva-field')] );
				}
			});
		},
								
		_requestCode : function() {
			
			if( this._codeExpress == null ) return ;
			if( this._codeExpress.length == 0 ) return ;
			
			var self= this;
			var	parameter = new Object();			
			parameter.Code  = this._codeExpress;
			
			
			$.ajax({
				  dataType: "json"
				  , "url":"/vivaCCP/s/code"
				  , async: false
				  , data: parameter
				  , success: function( data ) {
					  if( data.Result == "OK"){							  
							console.log("data.Options", data.Options);
							self._codes = data.Options;						
						} else {						
							alert(data.ErrorReason);
						}		    
				  }
				  ,error : function (jqXHR,textStatus,errorThrown  ){
					  alert("System Errorr");
				  }
				});				
		},
		
		
		_setFieldOptionWithCodeValue : function() {
			for (var field in this.mTableOption.fields ) {
				if( this.mTableOption.fields[field].codeOption ) {						
					this.mTableOption.fields[field].options = this._getCertainCode(this.mTableOption.fields[field].codeOption);
				}
			}			
		},
		
		_getCertainCode : function( code_name ){
			var	code_arr = new Array();
			for ( var i=0; i<this._codes.length; i++){
				if( this._codes[i].Code == code_name) { 
					code_arr.push( this._codes[i] );
				}
			}
			return code_arr;
		},
				
		_fillSelectWithCode : function( ){
			if( this._codes == null ) return;
			
			for ( var i=0; i< this._codes.length; i++ ){
				var	code_rec = this._codes[i];
				$(this.mTableOption.createDialogID).find("select[vivatable-code='" + code_rec.Code +"']").append("<option value='" + code_rec.Value + "'>" + code_rec.DisplayText );
			}
		}
		
		
		//######################   code option  end   ######################		
	};
	
	$.fn.vivaTable = function( _table_otpion){
		// console.log("viva table Yap", _table_otpion );
		var $this = $(this),     vivatable = $this.data('vivatable');
		if( ! vivatable  ){
			// console.log("NO viva table instance", _table_otpion.sorting );
			vivatable = new VivaTable($this, _table_otpion);
			$this.data('vivatable', vivatable);
		} 
		return vivatable;
	};	
})(jQuery);