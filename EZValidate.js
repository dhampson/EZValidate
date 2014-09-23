/**
* EZValidator by David Hampson  2014
* Validates by html5 rules. If <input type='number', then it will make sure that
* have a number (if the browser doesn't already do that for you. Various attributes
* described below.
*
* class="required ": required will make sure that the string length is > 0  That's all.
* The 'required' attribute is proper html5, but then the browser steps in and interferes. Use the class.
*
* data-pattern="/regex/i":  If the input need a certain form. regexp will be applied to the input value.
* If using Smarty, you many need to wrap this in {literal} tags. For example, /\d{3,4}/ does not
* compiile in smarty, but /\d{ 3,4 }/ does. However, the latter may not give the results you expect.
*
* data-custom='function_name':  name a function, and it will take the input dom element as a parameter and
* return true of false. An example would be to validate a credit card while highlighting the appropriate
* CC icon.
*
* data-message_selector:  If you have a (hidden) dom element with a validation message, then this will be shown/hidden.
*
*
* This validator will only add the class "error" to a item.  It may also reveal a message, already placed and hidden
* somewhere in the form. For example <span id="pw_warn">Password do not match</span>
*
* You may supply a custom validator, final_test(), for custom work.  For example: Validation of element A
* may depend on the value of Element B
*
* elements that are required won't be validated until they are "touched".  It's a data property (boolean) Once an element
* is blurred, or otherwise moved on from, then it will validate, and "untouct" the element.  from then on, validation
* is done with each keystroke.
**/


/**
 * TEMP NOTES
 * use data-type for the type, rather than type.  This will eliminate a lot of browser interferance.
 *
 *
 *
 */

(function($) {

	var settings = {
					submit_invalid		: true,
					error_class			: 'error',
					final_test			: null,
					submit_function		: null
					 };

	var methods = {

			init : function(options){
				settings = $.extend( {}, settings, options);
				return this.each( function(index, container){
						if ($(this).prop('tagName').toLowerCase() != 'form') return false;
						$(this).data(settings);

						$('input.required, select.required, textarea.required', this).data({ touched: false });

						//event listeners here
						$('input.required, textarea.required', this).on('blur', methods.untouch );
						$('select.required', this).on('change', methods.untouch );
						$(this).on('submit', methods.validate_form );
						return this;
					})// each
				 },//init

			untouch : function(){
				var tag = $(this).prop('tagName').toLowerCase();
                                var type = $(this).data('type') || $(this).prop('type');

				$(this).data({ touched: true }).off('blur, change');


				if ( tag == 'input' || tag == 'textarea' ){
                                    if (type == 'checkbox' || type=='radio' ) $(this).on('change', methods.validate_item);
                                    else $(this).on('keyup', methods.validate_item );
				}
				else if ( tag == 'select'){
					$(this).on('change', methods.validate_item );
				}
				test = methods.validate_item.call(this);
				return test;
			}, // untouch

			validate_form : function (event){
				var $this = $(this);  // the <form> itself
				var count = 0;
				var valid, final_test;

				$('input.required, textarea.required, select.required', $this).each(
						function(){
							if ( $(this).is(":visible")){
								if ( !$(this).data('touched')){
									test = methods.untouch.call(this);
								} else {
									test = methods.validate_item.call(this);
								}
								if (!test) count++;
							}
						}
				);

//				console.log("Count: " + count );
				valid = (count === 0);  // needed for default callback function

				// final, custom test
				if (typeof settings.final_test == 'function') {
					final_test = settings.final_test.call(this, valid);
					if (!final_test) count++;
				}

				valid = (count === 0);

				// submit invalid form anyway?
				if (!valid && settings.submit_invalid) {
					valid = confirm("You have "+count+" invalid form elements, are you sure you want to submit?");
				}

				// submit the form, custom form submission may be used.
				if (valid){
					test = true;
					if (typeof settings.submit_function == 'function') {
						test = settings.submit_function.call(this, event);
                        event.preventDefault();
					}
					return test;
				}
				else{
					event.preventDefault();
					return false;
				}

			}, // validate_form

			validate_item : function(){
				var $this = $(this);  // actual form element.
				var tag = $this.prop('tagName').toLowerCase();
				var type =  $this.data('type') || $this.prop('type').toLowerCase();
//                console.log("this element is of type: " + type);
				var value = $this.val();
				var float_val;
				var name = $this.prop('name');
				var filter = $this.data('pattern') || false;
				var n, R, f_array;

				var min = $this.attr('min') || ''; // can be used for number/dates
				var max = $this.attr('max') || '';
				var step = $this.attr('step') || '';
				var func = $this.data('custom');

				var msg_selector = $this.data('message_selector' );
				var $msg = $( msg_selector );

				// mods..
				if (tag == 'textarea' || tag =='search')  type = "text";

//				console.log("validating " + name + " ... " + value );



                // CONVERT MISC TYPES TO CUSTOM FILTER
//                 http://tools.ietf.org/html/rfc3339
                if (type == 'date'){
                    type='custom';
                    filter='/^\\d\\d\\d\\d-\\d\\d-\\d\\d$/';
                }
                else if (type == 'datetime-local'){
                    type='custom';
                    filter='/^\\d\\d\\d\\d-\\d\\d-\\d\\dT\\d\\d:\\d\\d:\\d\\d(\\.\\d\\d)?$/';
                }
                else if (type == 'datetime'){
                    type='custom';
                    filter='/^\\d\\d\\d\\d-\\d\\d-\\d\\dT\\d\\d:\\d\\d:\\d\\d(\\.\\d\\d)?(-\\d\\d:\\d\\d|Z)$/';
                }
                else if (type == 'time'){
                    type='custom';
                    filter='/^\\d\\d:\\d\\d:\\d\\d(\\.\\d\\d)?$/';
                }
//                else if (type == 'week'){                                    yyyy-ww  1 <= ww <= 53
//                    type='custom';
//                    filter='/^\\d\\d\\d\\d-W\\d\\d$/';   //                  http://www.w3.org/TR/html-markup/input.week.html
//                }
                else if (type == 'url'){
                    type='custom';
//                    filter='/^\d\d:\d\d:\d\d(\.\d\d)?$/';
                }
                else if (type == 'color'){
                    type='custom';
                    filter='/^#[0-9a-f]{6}?$/i';
                }


				// START TESTING
				// custom valiation/non-empty
				if (valid && typeof window[func] == 'function'){
					valid = window[func].call(this);
				} else {
					var valid = ( value != '');
				}

                // telephone
                if (valid && type == 'tel'){
                    value = value.replace( /[^\d]/g , '');
//                    console.log(value);
                    valid = (value.match( /^\d{7}(\d\d\d)?$/));
                }

               // week
              if (valid && type=="week"){
                  R = /^\d\d\d\d-W\d\d$/;
                  valid = R.test(value);
                  if (valid){
                      week = value.substr(-2);
                      valid = (week > 0 && week < 54);
                  }
             }



               // month
              if (valid && type=="month"){
                  R = /^\d\d\d\d-\d\d$/;
                  valid = R.test(value);
                  if (valid){
                      month = parseInt( value.substr(-2), 10);
                      valid = (month > 0 && month < 13);
                  }
             }

				// number / length
				if (valid && (type == 'number' || type == 'range' )){
                    float_val = parseFloat(value);
					valid = ( typeof float_val == 'number' );
					if (valid){
                        valid = (float_val == value ); // because '647.4hs' -> '647.4'
                        if (valid && min) valid = (parseFloat(value) >= parseFloat(min) );
                        if (valid && max) valid = (parseFloat(value) <= parseFloat(max));
                        if (valid && step) {
//                            console.log("stepping");
                            n =  (value - min) / step;
                            n = n.toFixed(6); // .1/.2 error correcting.
                            valid = (n == Math.round(n));
                        }
                    }
				}

				if (valid && type == 'email'){
					// NOTE, there are slightly better, much more complex expressions
					// for validating email.  So what, this is client side, and cannot be trusted.
					valid = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);
				}

                if (valid && type == 'tel'){

                }


				// custom filter
				if (valid && filter){
//					filter = filter.replace('\\', '\\\\');
//                    console.log(filter);
					f_array = filter.split("/");
//                    console.log(f_array);
					R = new RegExp(f_array[1], f_array[2] );
//                    console.log(R);
					valid = R.test(value);
				}


				if (valid && (type == 'checkbox')){
					valid = $this.is(':checked');
				}

				// end testing
				if (valid){
					$this.removeClass( settings.error_class );
					$msg.hide();
				}
				else {
					$this.addClass( settings.error_class );
					$msg.show();
				}
				return valid;
			} // validate_item
		} // methods

	$.fn.MBValidate = function ( method ){
			// Method calling logic
			if ( methods[method] ) {
				return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
				// calls the function name, cutting of the first item of arguments, which is the name of the function
			}
			else if ( typeof method === 'object' || ! method ) {
				return methods.init.apply( this, arguments );
				// otherwise just call init()
			}
			else {
				 $.error( 'Method ' +  method + ' does not exist on jQuery.initTabs' );
			}
	}
})(jQuery);
