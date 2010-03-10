/*
  Copyright 2010, François de Metz <francois@2metz.fr>
*/
/**
 * Roster Plugin
 * Allow easily roster management
 *
 *  Features
 *  * Get roster from server
 *  * handle presence
 *  * handle roster iq
 *  * subscribe/unsubscribe
 *  * authorize/unauthorize
 *  * roster versioning (xep 237)
 */
Strophe.addConnectionPlugin('roster',
{
    _connection: null,

    _callbacks : [],
    /**
     * Reference to a query Selector engine
     * Currently we are using jQuery
     */
    querySelector : jQuery,
    /** Property: items
     * Roster items
     * [
     *    {
     *        name         : "",
     *        jid          : "",
     *        subscription : "",
     *        groups       : ["", ""],
     *        resources    : {
     *            myresource : {
     *                show   : "",
     *                status : "",
     *                priority : ""
     *            }
     *        }
     *    }
     * ]
     */
    items : [],
    /** Property: ver
     * current roster revision
     * always null if server doesn't support xep 237
     */
    ver : null,
    /** Function: init
     * Plugin init
     * Need jQuery
     *
     * Parameters:
     *   (Strophe.Connection) conn - Strophe connection
     */
    init: function(conn)
    {
	this._connection = conn;
        this.items = [];
        // Presence subscription
        conn.addHandler(this._onReceivePresence.bind(this), null, 'presence', null, null, null);
        conn.addHandler(this._onReceiveIQ.bind(this), Strophe.NS.ROSTER, 'iq', "set", null, null);

        Strophe.addNamespace('ROSTER_VER', 'urn:xmpp:features:rosterver');
    },
    /** Function: supportVersioning
     * return true if roster versioning is enabled on server
     */
    supportVersioning: function()
    {
        return (this.querySelector(this._connection.features).find("ver[xmlns='"+ Strophe.NS.ROSTER_VER +"']").size() > 0);
    },
    /** Function: get
     * Get Roster on server
     *
     * Parameters:
     *   (Function) userCallback - callback on roster result
     *   (String) ver - current rev of roster
     *      (only used if roster versioning is enabled)
     *   (Array) items - initial items of ver
     *      (only used if roster versioning is enabled)
     *     In browser context you can use sessionStorage
     *     to store your roster in json (JSON.stringify())
     */
    get: function(userCallback, ver, items)
    {
        var attrs = {xmlns: Strophe.NS.ROSTER};
        this.items = [];
        if (this.supportVersioning())
        {
            // empty rev because i want an rev attribute in the result
            attrs.ver = ver || '';
            this.items = items || [];
        }
        var iq = $iq({type: 'get',  'id' : this._connection.getUniqueId('roster')}).c('query', attrs);
        this._connection.sendIQ(iq,
                                this._onReceiveRosterSuccess.bind(this).prependArg(userCallback),
                                this._onReceiveRosterError.bind(this).prependArg(userCallback));
    },
    /** Function: registerCallback
     * register callback on roster (presence and iq)
     *
     * Parameters:
     *   (Function) call_back
     */
    registerCallback: function(call_back)
    {
        this._callbacks.push(call_back);
    },
    /** Function: findItem
     * Find item by JID
     *
     * Parameters:
     *     (String) jid
     */
    findItem : function(jid)
    {
        for (var i = 0; i < this.items.length; i++)
        {
            if (this.items[i].jid == jid)
            {
                return this.items[i];
            }
        }
        return false;
    },
    /** Function: subscribe
     * Subscribe presence
     *
     * Parameters:
     *     (String) jid
     */
    subscribe: function(jid)
    {
        this._connection.send($pres({to: jid, type: "subscribe"}));
    },
    /** Function: unsubscribe
     * Unsubscribe presence
     *
     * Parameters:
     *     (String) jid
     */
    unsubscribe: function(jid)
    {
        this._connection.send($pres({to: jid, type: "unsubscribe"}));
    },
    /** Function: authorize
     * Authorize presence subscription
     *
     * Parameters:
     *     (String) jid
     */
    authorize: function(jid)
    {
        this._connection.send($pres({to: jid, type: "subscribed"}));
    },
    /** Function: unauthorize
     * Unauthorize presence subscription
     *
     * Parameters:
     *     (String) jid
     */
    unauthorize: function(jid)
    {
        this._connection.send($pres({to: jid, type: "unsubscribed"}));
    },
    /** Function: update
     * Update roster item
     *
     * Parameters:
     *   (String) jid - item jid
     *   (String) name - name
     *   (Array) groups
     *   (Function) call_back
     */
    update: function(jid, name, groups, call_back)
    {
        var item = this.findItem(jid);
        if (!item)
        {
            throw "item not found";
        }
        var newName = name || item.name;
        var newGroups = groups || item.groups;
        var iq = $iq({type: 'set'}).c('query', {xmlns: Strophe.NS.ROSTER}).c('item', {jid: item.jid,
                                                                                      name: newName,
                                                                                      subscription: item.subscription});
        for (var i = 0; i < newGroups.length; i++)
        {
            iq.c('group').t(newGroups[i]).up();
        }
        this._connection.sendIQ(iq, call_back, call_back);
    },
    /** PrivateFunction: _onReceiveRosterSuccess
     *
     */
    _onReceiveRosterSuccess: function(userCallback, stanza)
    {
        this._updateItems(this.querySelector(stanza));
        userCallback(this.items);
    },
    /** PrivateFunction: _onReceiveRosterError
     *
     */
    _onReceiveRosterError: function(userCallback, stanza)
    {
        userCallback(this.items);
    },
    /** PrivateFunction: _onReceivePresence
     * Handle presence
     */
    _onReceivePresence : function(stanza)
    {
        var presence = this.querySelector(stanza).find('presence');
        // TODO: from is optional
        var jid = presence.attr('from');
        var from = Strophe.getBareJidFromJid(jid);
        var item = this.findItem(from);
        // not in roster
        if (!item)
        {
            return true;
        }
        var type = presence.attr('type');
        if (type == 'unavailable')
        {
            delete item.resources[Strophe.getResourceFromJid(jid)];
        }
        else
        {
            // TODO: add timestamp
            item.resources[Strophe.getResourceFromJid(jid)] = {
                show     : presence.find('show:first').text(),
                status   : presence.find('status:first').text(),
                priority : presence.find('priority:first').text()
            };
        }
        this._call_backs(this.items, item);
        return true;
    },
    /** PrivateFunction: _call_backs
     *
     */
    _call_backs : function(items, item)
    {
        for (var i = 0; i < this._callbacks.length; i++) // [].forEach my love ...
        {
            this._callbacks[i](items, item);
        }
    },
    /** PrivateFunction: _onReceiveIQ
     *
     */
    _onReceiveIQ : function(stanza)
    {
        var iq = this.querySelector(stanza);
        var id = iq.attr('id');
        var from = iq.attr('from');
        var iqresult = $iq({type: 'result', id: id, to: from});
        this._connection.send(iqresult);
        this._updateItems(iq);
        return true;
    },
    /** PrivateFunction: _updateItems
     * Update items from iq
     */
    _updateItems : function(iq)
    {
        var self = this;
        this.ver = iq.find('query').eq(0).attr('ver');
        iq.find('item').each(
            function ()
            {
                var item = self.querySelector(this);
                self._updateItem(item);
            }
        );
        this._call_backs(this.items);
    },
    /** PrivateFunction: _updateItem
     * Update internal representation of roster item
     */
    _updateItem : function(aItem)
    {
        var querySelector = this.querySelector;
        var jid           = aItem.attr("jid");
        var name          = aItem.attr("name");
        var subscription  = aItem.attr("subscription");
        var groups        = querySelector.makeArray(aItem.find('group').map(
            function()
            {
                return querySelector(this).text();
            }
        ));

        var item = this.findItem(jid);
        if (!item)
        {
            this.items.push({
                name         : name,
                jid          : jid,
                subscription : subscription,
                groups       : groups,
                resources    : {}
            });
        }
        else
        {
            item.name = name;
            item.subscription = subscription;
            item.group = groups;
        }
    }
});