/*
  Copyright 2010, François de Metz <francois@2metz.fr>
*/

/**
 * Disco Strophe Plugin
 * Implement http://xmpp.org/extensions/xep-0030.html
 */
Strophe.addConnectionPlugin('disco',
{
    _connection: null,

    _identities : [],

    _features : [],
    /** Function: init
     * Plugin init
     *
     * Parameters:
     *   (Strophe.Connection) conn - Strophe connection
     */
    init: function(conn)
    {
	this._connection = conn;
        this._identities = [];
        this._features = [];
        // disco info
        conn.addHandler(this._onDiscoInfo.bind(this), Strophe.NS.DISCO_INFO, 'iq', 'get', null, null);
        // disco items
        conn.addHandler(this._onDiscoItems.bind(this), Strophe.NS.DISCO_ITEMS, 'iq', 'get', null, null);
    },
    /** Function: addIdentity
     * See http://xmpp.org/registrar/disco-categories.html
     * Parameters:
     *   (String) category - category of identity like (client, automation, etc ...)
     *   (String) type - type of identity (like pc, web, bot , etc ...)
     *   (String) name - name of identity in natural language
     *   (String) lang - lang of name parameter
     *
     * Returns:
     *   Boolean
     */
    addIdentity: function(category, type, name, lang)
    {
        for (var i=0; i<this._identities.length; i++)
        {
            if (this._identities[i].category == category &&
                this._identities[i].type == type &&
                this._identities[i].name == name &&
                this._identities[i].lang == lang)
            {
                return false;
            }
        }
        this._identities.push({category: category, type: type, name: name, lang: lang});
        return true;
    },
    /** Function: addFeature
     *
     * Parameters:
     *   (String) var_name
     *
     * Returns:
     *   boolean
     */
    addFeature: function(var_name)
    {
        for (var i=0; i<this._features.length; i++)
        {
             if (this._features[i] == var_name)
                 return false;
        }
        this._features.push(var_name);
        return true;
    },
    /** Function: addItem
     *
     * Parameters:
     *   (String) jid
     *   (String) name
     *   (String) node
     *   (Function) call_back
     */
    addItem: function(jid, name, node, call_back)
    {

    },
    /** Function: info
     * Info query
     *
     * Parameters:
     *   (Function) call_back
     *   (String) jid
     *   (String) node
     */
    info: function(call_back, jid, node)
    {
        var disco = $iq({from : this._connection.jid,
	                 to   : jid,
		         type : 'get'}
                       ).c('query', {xmlns: Strophe.NS.DISCO_INFO});
        this._connection.sendIQ(disco, call_back, call_back);
    },
    /** Function: items
     * Items query
     *
     * Parameters:
     *   (Function) call_back
     *   (String) jid
     *   (String) node
     */
    items: function(call_back, jid, node)
    {
        var attrs = {xmlns: Strophe.NS.DISCO_ITEMS};
        if (node)
        {
            attrs.node = node;
        }
        var disco = $iq({from : this._connection.jid,
	                 to   : jid,
                         type : 'get'}).c('query', attrs);
        this._connection.sendIQ(disco, call_back, call_back);
    },
    /** PrivateFunction: _onDiscoInfo
     * Called when receive info request
     */
    _onDiscoInfo: function(stanza)
    {
        var id   =  stanza.getAttribute('id');
        var from = stanza.getAttribute('from');
        var iqresult = $iq({type: 'result', id: id, to: from}).c('query', {xmlns : Strophe.NS.DISCO_INFO, node: stanza.getElementsByTagNameNS(Strophe.NS.DISCO_INFO, 'query')[0].getAttribute('node')});
        for (var i=0; i<this._identities.length; i++)
        {
            var attrs = {category: this._identities[i].category,
                         type    : this._identities[i].type};
            if (this._identities[i].name)
                attrs.name = this._identities[i].name;
            if (this._identities[i].lang)
                attrs['xml:lang'] = this._identities[i].lang;
            iqresult.c('identity', attrs).up();
        }
        for (var i=0; i<this._features.length; i++)
        {
            iqresult.c('feature', {'var':this._features[i]}).up();
        }
        this._connection.send(iqresult.tree());
    },

    _onDiscoItems: function()
    {

    }
});
