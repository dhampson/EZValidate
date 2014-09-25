The reigning king of client-side validators is simply "jquery-validation". It's been around for quite a while, and does what you would expect, but there are several problems with it. Let's start with configuration. The following snippit introduces a custom validation function (3 digits), and validates.

```javascript
jQuery.validator.addMethod("digit3", function(text, element) {
return this.optional(element) || text.match(/^\d\d\d$/);
});

rules_ccform = {
    ccname   : {required:true},
    phone_0  : {required:true, digit3:true},
    phone_1  : {required:true, digit3:true},
    i_agree  : {required:true},
    phone_no : {required:false, phoneUS:true}
};

messages_payment = {
   ccnumber : "",
    phone_0 : "",
    phone_1 : "",
    i_agree : "",
    phone_no : ""
};
cc_validator = $('#payment_form').validate({
       rules : rules_ccform,
    messages : messages_payment });
```

In this case 'digit3' is the name of the custom function. First, we need to create the function (anonymous in this case) then get the jquery validator to recognize it, then attach it to one or more form elements. Note the 'messages_payment' object. This is a requirement for jquery validator. By default, jquery validator will place error messages through your dom. If you have nicely positioned elements making aneat form, then it will get horribly mashed up _by default_. Of course, you can configure it differently, but the default behavior out-of-the-box is extremely annoying, and this configuration is extremely complex. It requires the js developer to change the dom instead of the html/template builder. Which of these two people should be doing design work?

By default, jquery validator will only validate elements with the class 'required'. Which of course, can be configured. This illustrates another poor design feature: having multiple locations to configure your form validation. This is why, in the above code, I use javascript to define whether individual form elements are to be tested or not. There are a lot more grievances with jquery validator, but let's look at what html5 has to offer.

`<input type='date' min='2012-05-23' max='2019-12-31' required >`

A modern browser or smart phone will pull up a datepicker input form, and will disallow dates outside of the optional 'min' and 'max' attribute settings. In chrome, this is only tested on form submission, and it will only test elements one by one, rather than highlight all elements that have problems. The biggest bonus to this, is that there is no javascript. *Everything you need to know about validating an element, is an attribute of the element itself.* Your browser does the rest.

The biggest problem with html5, is when you want slightly more control. For example, what if you want to exclude weekends from the list of available dates? There is no html5 standard for doing so. Same with excluding holidays, or validating against an item in your server's database. (Testing for unique email for example.) There are just too many options for there to have standards declared for. We require javascript in these cases. Also, the w3c has recommendations for how dates should be formatted, but this is not used in practice. Is 6-2-2014 June second, or February 6th? w3c guidelines are a way around this, but since browsers don't actually adhere to these guidelines, you absolutely cannot trust the values sent to the server.

What would be nice, is a way to configure your form validation with html5 simplicity, but get the flexibility of jquery validator. This was the motivation for EZValidate.js

`<input type="text" data-type="date" class="required" name="mydate" id="mydate" data-message_selector='#msg2'/>`

`<span id="msg2" class="error_message">Date is required</span>`

Note the pseudo-html5 like syntax. EZValidate will grab the type from the item's data. If not there, it will use the regular type attribute. I suggest using the former however, as the browser may interfere with the user experience, or conflict with other javascript you have. The error message should be hidden by default (your choice :-), and will appear if the item does not validate. Note that this is done by designer, not the programmer.

What about more advanced validation? html5 offers the pattern="" attribute for input elements. This attribute is a regular expression and compliant browsers will test against it. EZValidate uses data-pattern. For example:  `data-pattern="/\d{3}[a-z]{3,5}/i"` will validate for three numbers followed by three or five letters. No custom function required, no javascript configuration.

Never-the-less, users may still need a custom function. Using a luhn algorithm for credit cards, while highlighting which type of credit card is being used is an example.  In this case just use a data-custom="my_function" element. The scope of the function is the element being tested, just make sure your function returns true or false. In the mean time your function can tweak the dom, or make SJAX calls, etc. With EZValidate there is no need to "register" the function, then assign it to various inputs. Just state the name of the function as an attribute.

About the only javascript configuration you may want to do it to define a "final test" function. If you want password1 to match password2, or when the validation of one input depends upon the value of another, this is how you would do it. Upon submit, all required elements are tested again, and if they all pass individually, then the final_test function is called, with the form itself as function scope. Again, your function needs to return true or false.

Finally, form validation is really a helpful aid to the user, but **do not depend on it.** The only real validation that counts is the one on the server. There is little need for intricate validation when it is so easily bypassed on any browser. If a form doesn't validate with EZValidate, the user can still submit it anyway, but a confirmation box will show up first. This behavior is optional, and can be disabled if desired.

Test EZValidate against your browser's implementation of html5 here:
http://dhampson.montanab.com/html5form.html
