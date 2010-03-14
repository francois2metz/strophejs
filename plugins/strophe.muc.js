/*
  Copyright 2009, Renato Albano
*/

/**
 * Multi-User Chat Plugin
 * http://xmpp.org/extensions/xep-0045.html
 */
Strophe.addConnectionPlugin('muc',
{
    _connection: null,
    /** Function: init
     * Plugin init
     *
     * Parameters:
     *   (Strophe.Connection) conn - Strophe connection
     */
    init: function(conn)
    {
        this._connection = conn;
    },

    /** Function: join
     * Join chatroom
     *
     * Parameters:
     *   (String) room - like test@conference.jabber.org
     *   (String) nickname
     *   (String) password
     *   (Function) callback
     */
    join: function(room, nickname, password, callback)
    {
        var msg = Strophe.xmlElement("presence", [
                                         ["from", this._connection.jid],
                                         ["to", room + "/" + nickname]
                                     ]);
        var x = Strophe.xmlElement("x", [["xmlns", Strophe.NS.MUC]]);
        if (password)
        {
            var password_elem = Strophe.xmlElement("password", [],password);
            x.appendChild(password_elem);
            }
            msg.appendChild(x);
            if(typeof(callback) == 'function')
            {
                this._connection.addHandler(callback,
                                            null,
                                            "presence",
                                            null,
                                            null,
                                            room+'/'+nickname);
            }
            this._connection.send(msg);
        },
        /** Function: leave
         * Leave a chatroom
         *
         * Parameters:
         *   (String) room
         *   (String) nickname
         *   (Function) callback
         */
        leave: function(room, nickname, callback)
        {
            var presenceid = this._connection.getUniqueId();
            var presence = Strophe.xmlElement("presence", [
                                                  ["type",
                                                  "unavailable"],
                                                  ["id",
                                                  presenceid],
                                                  ["from",
                                                  this._connection.jid],
                                                  ["to",
                                                  room + "/" + nickname]
                                              ]);
            var x = Strophe.xmlElement("x", [
                                           ["xmlns", Strophe.NS.MUC]
                                               ]);
            presence.appendChild(x);
            if(typeof(callback) == 'function')
            {
                this._connection.addHandler(callback,
                                            null,
                                            "presence",
                                            null,
                                            presenceid,
                                            null);
            }
            this._connection.send(presence);
        },
        /** Function: nick
         * Change nickname
         *
         * Parameters:
         *   (String) room
         *   (String) nickname
         *   (String) newNickname
         */
        nick: function(room, nickname, newNickname)
        {
            var msg = Strophe.xmlElement("presence", [
                                             ["from", this._connection.jid],
                                             ["to", room + "/" + newNickname]
                                         ]);
            var x = Strophe.xmlElement("x", [["xmlns", Strophe.NS.MUC]]);
            msg.appendChild(x);
            this._connection.send(msg);
        },

        _htmlentities: function(text)
        {
            text = text.replace(/\&/g, "&amp;");
            text = text.replace(/</g,  "&lt;");
            text = text.replace(/>/g,  "&gt;");
            text = text.replace(/'/g,  "&#39;");
            return text;
        },

        _buildAndSendMessage: function(to, message, type)
        {
            var text = this._htmlentities(message);
            var msgid = this._connection.getUniqueId();
            var msg = Strophe.xmlElement("message",
                                                [
                                                 ["to", to],
                                                 ["from", this._connection.jid],
                                                 ["type", type],
                                                 ["id", msgid]
                                                 ]);
            msg.appendChild(Strophe.xmlElement("body",
                                                      [["xmlns",
                                                        "jabber:client"]],
                                                      text));

            var x = Strophe.xmlElement("x",
                                       [["xmlns", "jabber:x:event"]]);
            x.appendChild(Strophe.xmlElement("composing"));
            msg.appendChild(x);
            this._connection.send(msg);
        },
        /** Function: sendMessage
         *
         * Parameters:
         *   (String) room
         *   (String) message
         */
        sendMessage: function(room, message)
        {
            this._buildAndSendMessage(room, message, 'groupchat');
        }
});
