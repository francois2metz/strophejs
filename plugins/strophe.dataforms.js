/*
  Copyright 2010, François de Metz <francois@2metz.fr>
*/
/**
 *
 */
Strophe.Field = function(field) {
    /**
     * @type String
     */
    this.type = field.getAttribute("type");
    /**
     * @type String
     */
    this.variable = field.getAttribute("var");
    /**
     * @type String
     */
    this.label = field.getAttribute("label");
    /**
     * @type Boolean
     */
    this.required = this._isRequired(field);
    /**
     * @type String
     */
    this.desc = this._getDesc(field);
    /**
     * @type String
     */
    this.value = null;
    /**
     * @type Array
     */
    this.values = [];
    this._fillValues(field);
    /**
     * @type Array
     */
    this.options = this._parseOptions(field);
    if (this.type != "fixed" && this.variable == null) {
        throw "must have a var attribute";
    }
};
Strophe.Field.prototype = {
    _isRequired: function(field) {
        var required = field.getElementsByTagName("required");
        if (required.length == 1) {
            return true;
        }
        return false;
    },

    _getDesc: function(field) {
        var desc = field.getElementsByTagName("desc");
        if (desc.length == 1) {
            return desc.item(0).textContent;
        }
        return null;
    },

    _fillValues: function(field) {
        var values = field.getElementsByTagName("value");
        if (values.length > 1) {
            var authorized = ["list-multi", "jid-multi",
                              "text-multi", "hidden"];
            if (authorized.indexOf(this.type) == -1) {
                throw "bad";
            }
            for (var i = 0; i < values.length; i++) {
                this.values.push(values.item(i).textContent);
            }
        } else if (values.length == 1) {
            this.value = values.item(0).textContent;
        }
    },

    _parseOptions: function(field) {
        var options = field.getElementsByTagName("option");
        if (options.length == 0) {
            return [];
        }
        var authorized = ["list-single", "list-multi"];
        if (authorized.indexOf(this.type) == -1) {
            throw "bad";
        }
        var o = [];
        for (var i = 0; i < options.length; i++) {
            var value = this._getValue(options.item(i));
            var label = options.item(i).getAttribute("label") || value;
            o.push({value: value, label: label});
        }
        return o;
    },

    _getValue : function(node) {
        var value = node.getElementsByTagName("value");
        if (value.length > 1 || value.length == 0) {
            throw "bad";
        }
        return value.item(0).textContent;
    }
};

/**
 * Data Forms strophe plugin
 * http://xmpp.org/extensions/xep-0004.html
 * TODO : implement http://xmpp.org/extensions/xep-0221.html
 */
Strophe.addConnectionPlugin('dataforms',
{
    init : function()
    {
        Strophe.addNamespace('DATA', 'jabber:x:data');
    },
    /** Function: parse
     * Parse form
     * Parameters:
     *   (DOMElement) form
     *
     */
    parse: function(form)
    {
        return {
            type : form.getAttribute("type"),
            // TODO: multiple title
            title : this._getTitle(form),
            // TODO: multiple instructions
            intructions : [],
            fields : this._parseFields(form)
        };
    },

    _getTitle: function(form) {
        var title = form.getElementsByTagName("title");
        if (title.length > 0) {
            return title.item(0).textContent;
        }
        return null;
    },

    _parseFields: function(form) {
        var fields = form.getElementsByTagName("field");
        var f = [];
        for (var i = 0; i < fields.length; i++) {
            f.push(new Strophe.Field(fields.item(i)));
        }
        return f;
    }
});
