module('plugins.DataForms');
function getForm(type, title) {
    if (!type) {
        type = "form";
    }
    if (!title) {
        title = "Test dataForm";
    }
    try {
        var form = document.createElementNS("jabber:x:data", "x");
    } catch (e) {
        var form = document.createElement("x");
        form.setAttribute("xmlns", "jabber:x:data");
    }
    form.setAttribute("type", type);
    var titleNode = document.createElement("title");
    titleNode.textContent = title;
    form.appendChild(titleNode);
    return form;
}

var dataformsPlugin = Strophe._connectionPlugins.dataforms;

test("parse type and title", function() {
         var form = dataformsPlugin.parse(getForm());
         equal("form", form.type);
         equal("Test dataForm", form.title);
     });


test("parse another form", function() {
         var form = dataformsPlugin.parse(getForm("result", "Test Form"));
         equal("result", form.type);
         equal("Test Form", form.title);
     });

test("parse instructions", function() {
         var form = getForm("result", "Test Form");
         var instructions = document.createElement("instructions");
         instructions.textContent = 'Fill out this form to configure your new bot!';
         form.appendChild(instructions);
         var dataform = dataformsPlugin.parse(form);
         equal("Fill out this form to configure your new bot!", dataform.instructions);
     });

test("parse fields", function() {
         var form = getForm("result");
         var field = document.createElement("field");
         field.setAttribute("type", "text-single");
         field.setAttribute("var", "field");
         form.appendChild(field);
         var dataForm = dataformsPlugin.parse(form);
         equal(1, dataForm.fields.length);
         equal("text-single", dataForm.fields[0].type);
     });

test("parse field", function() {
         var field = document.createElement("field");
         field.setAttribute("var", "name-of-field");
         field.setAttribute("type", "text-single");
         var form = new Strophe.Field(field);
         equal("name-of-field", form.variable);
         equal("text-single", form.type);
     });

test("parse field without var attribute throw exception", function() {
         expect(1);
        var field = document.createElement("field");
        field.setAttribute("type", "text-single");
        try {
             var form = new Strophe.Field(field);
        } catch (e) {
            ok(true);
        }
     });

test("parse field type fixed without var attribute", function() {
         expect(1);
         var field = document.createElement("field");
         field.setAttribute("type", "fixed");
         try {
             var form = new Strophe.Field(field);
             ok(true);
         } catch (e) {

         }
     });

test("parse label field", function() {
         var field = document.createElement("field");
         field.setAttribute("type", "text-single");
         field.setAttribute("var", "test");
         field.setAttribute("label", "hello");
         var form = new Strophe.Field(field);
         equal("hello", form.label);
     });

test("parse required field", function() {
         var field = document.createElement("field");
         field.setAttribute("type", "text-single");
         field.setAttribute("var", "test");
         field.appendChild(document.createElement("required"));
         var form = new Strophe.Field(field);
         equal(true, form.required);
     });

test("parse non required field", function() {
         var field = document.createElement("field");
         field.setAttribute("type", "text-single");
         field.setAttribute("var", "test");
         var form = new Strophe.Field(field);
         equal(false, form.required);
     });

test("parse field description", function() {
         var field = document.createElement("field");
         field.setAttribute("type", "text-single");
         field.setAttribute("var", "test");
         var desc = document.createElement("desc");
         desc.textContent = "descriptionhasatooltip";
         field.appendChild(desc);
         var form = new Strophe.Field(field);
         equal("descriptionhasatooltip", form.desc);
     });

test("parse field value", function() {
         var field = document.createElement("field");
         field.setAttribute("type", "text-single");
         field.setAttribute("var", "test");
         var value = document.createElement("value");
         value.textContent = "onevalue";
         field.appendChild(value);
         var form = new Strophe.Field(field);
         equal("onevalue", form.value);
     });

test("parse multiple value", function() {
         var field = document.createElement("field");
         field.setAttribute("type", "text-multi");
         field.setAttribute("var", "test");
         var value = document.createElement("value");
         value.textContent = "onevalue";
         field.appendChild(value);
         var value2 = document.createElement("value");
         value2.textContent = "onevaluetoo";
         field.appendChild(value2);
         var form = new Strophe.Field(field);
         equal(2, form.values.length);
         equal("onevalue", form.values[0]);
         equal("onevaluetoo", form.values[1]);
     });

test("on parse multiple value in non multiple value field throw exception", function() {
         expect(1);
         var field = document.createElement("field");
         field.setAttribute("type", "text-single");
         field.setAttribute("var", "test");
         var value = document.createElement("value");
         value.textContent = "onevalue";
         field.appendChild(value);
         var value2 = document.createElement("value");
         value2.textContent = "onevaluetoo";
         field.appendChild(value2);
         try {
             var form = Strophe.Field(field);
         } catch (e) {
             ok(true);
         }
     });

test("on parse option in non list field throw exception", function() {
         expect(1);
         var field = document.createElement("field");
         field.setAttribute("type", "text-single");
         field.setAttribute("var", "test");
         var option = document.createElement("option");
         var value = document.createElement("value");
         value.textContent = "oneoption";
         option.appendChild(value);
         field.appendChild(option);
         try {
             var form = new Strophe.Field(field);
         } catch (e) {
             ok(true);
         }
     });

test("parse list-single", function() {
         var field = document.createElement("field");
         field.setAttribute("type", "list-single");
         field.setAttribute("var", "test");
         var option = document.createElement("option");
         var value = document.createElement("value");
         value.textContent = "oneoption";
         option.appendChild(value);
         field.appendChild(option);
         var form = new Strophe.Field(field);
         equal(1, form.options.length);
         equal("oneoption", form.options[0].value);
         equal("oneoption", form.options[0].label);
     });

test("parse list-multi field", function() {
         var field = document.createElement("field");
         field.setAttribute("type", "list-multi");
         field.setAttribute("var", "test");
         var option = document.createElement("option");
         option.setAttribute("label", "onelabel");
         var value = document.createElement("value");
         value.textContent = "oneoption";
         option.appendChild(value);
         field.appendChild(option);
         var option2 = document.createElement("option");
         var value2 = document.createElement("value");
         value2.textContent = "oneoptiontoo";
         option2.appendChild(value2);
         field.appendChild(option2);
         var form = new Strophe.Field(field);
         equal(2, form.options.length);
         equal("oneoption", form.options[0].value);
         equal("onelabel", form.options[0].label);
     });

test("parse 2 value in one option throw exception", function() {
         expect(1);
         var field = document.createElement("field");
         field.setAttribute("type", "list-multi");
         field.setAttribute("var", "test");
         var option = document.createElement("option");
         option.setAttribute("label", "onelabel");
         var value = document.createElement("value");
         value.textContent = "oneoption";
         option.appendChild(value);
         var value2 = document.createElement("value");
         value2.textContent = "onevalue";
         option.appendChild(value2);
         field.appendChild(option);
         try {
             var form = new Strophe.Field(field);
         } catch (e) {
             ok(true);
         }
     });
