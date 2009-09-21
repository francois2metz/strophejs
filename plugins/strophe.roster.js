/*
  Copyright 2009, François de Metz <francois@2metz.fr>
*/
/**
 * Roster Plugin
 * Allow roster management easily
 *
 * Get roster from server, handle presence, handle roster iq
 * subscribe/unsubscribe, authorize/unauthorize presence subscription
 */
Strophe.addConnectionPlugin('roster',
{
    _connection: null,
    /**
     * Reference to a query Selector engine
     * Currently we used jQuery maybe Prototype
     * or other engines will work
     */
    querySelector : $,
    /**
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
    /**
     * Plugin init
     */
    init: function(conn)
    {
	this._connection = conn;
        this.items = [];
        // Presence subscription
        conn.addHandler(this._onReceivePresence.bind(this), null, 'presence', null, null, null);
        conn.addHandler(this._onReceiveIQ.bind(this), Strophe.NS.ROSTER, 'iq', "set", null, null);
    },
    /**
     * Get Roster
     * Parameters:
     *     (Function) userCallback
     */
    get: function(userCallback)
    {
        var iq = $iq({type: 'get', id:'roster_1'}).c('query', {xmlns: Strophe.NS.ROSTER});
        this._connection.sendIQ(iq,
                                this._onReceiveRosterSuccess.bind(this).prependArg(userCallback),
                                this._onReceiveRosterError.bind(this).prependArg(userCallback));
    },
    /**
     * Find item by JID
     * Parameters:
     *     (String) jid
     */
    findItem : function(jid)
    {
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i].jid == jid) {
                return this.items[i];
            }
        }
        return false;
    },
    /**
     * Subscribe presence
     * Parameters:
     *     (String) jid
     */
    subscribe: function(jid)
    {
        this._connection.send($pres({to: jid, type: "subscribe"}));
    },
    /**
     * Unsubscribe presence
     * Parameters:
     *     (String) jid
     */
    unsubscribe: function(jid)
    {
        this._connection.send($pres({to: jid, type: "unsubscribe"}));
    },
    /**
     * Authorize presence subscription
     * Parameters:
     *     (String) jid
     */
    authorize: function(jid)
    {
        this._connection.send($pres({to: jid, type: "subscribed"}));
    },
    /**
     * Unauthorize presence subscription
     * Parameters:
     *     (String) jid
     */
    unauthorize: function(jid)
    {
        this._connection.send($pres({to: jid, type: "unsubscribed"}));
    },
    /**
     * Update roster item
     * Parameters:
     *     (String) jid
     *     (String) name
     *     (Array) groups
     *     (Function) call_back
     */
    update: function(jid, name, groups, call_back)
    {
        var item = this.findItem(jid);
        var newName = name || name;
        var newGroups = groups || item.group;
        var iq = $iq({type: 'set'}).c('query', {xmlns: Strophe.NS.ROSTER}).c('item', {jid: item.jid,
                                                                                      name: newName,
                                                                                      subscription: item.subscription});
        for (var i = 0; i < newGroups.length; i++)
        {
            iq.c('group').t(newGroups[i]).up();
        }
        this._connection.sendIQ(iq, call_back, call_back);
    },

    _onReceiveRosterSuccess: function(userCallback, stanza)
    {
        var self = this;
        this.querySelector(stanza).find('item').each(
            function () {
                var item = self.querySelector(this);
                self._updateItem(item);
            }
        );
        userCallback(this.items);
    },

    _onReceiveRosterError: function(userCallback, stanza)
    {
        userCallback(this.items);
    },
    /**
     * Handle presence
     */
    _onReceivePresence : function(stanza)
    {
        var presence = this.querySelector(stanza);
        // TODO: from is optional
        var jid = presence.attr('from');
        var from = Strophe.getBareJidFromJid(jid);
        var item = this.findItem(from);
        // not in roster
        if (!item) {
            return true;
        }
        var type = presence.attr('type');
        if (type == 'unavailable') {
            delete item.resources[Strophe.getResourceFromJid(jid)];
        } else {
            // TODO: add timestamp
            item.resources[Strophe.getResourceFromJid(jid)] = {
                show     : presence.find('show:first').text(),
                status   : presence.find('status:first').text(),
                priority : presence.find('priority:first').text()
            };
        }
        return true;
    },
    /**
     *
     */
    _onReceiveIQ : function(stanza)
    {
        var iq = this.querySelector(stanza);
        var id = iq.attr('id');
        var from = iq.attr('from');
        var iqresult = $iq({type: 'result', id: id, to: from});
        this._connection.send(iqresult);
        var self = this;
        var items = iq.find('item').each(
            function () {
                var item = self.querySelector(this);
                self._updateItem(item);
            }
        );
        return true;
    },
    /**
     * Update internal representation of roster item
     */
    _updateItem : function(aItem)
    {
        var querySelector = this.querySelector;
        var jid           = aItem.attr("jid");
        var name          = aItem.attr("name");
        var subscription  = aItem.attr("subscription");
        var groups        = aItem.find('group').map(function() {
                                                          return querySelector(this).text();
                                             });

        var item = this.findItem(jid);
        if (!item) {
            this.items.push({
                name         : name,
                jid          : jid,
                subscription : subscription,
                groups       : groups,
                resources    : {}
            });
        } else {
            item.name = name;
            item.subscription = subscription;
            item.group = groups;
        }
    }
});
