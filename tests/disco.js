module("plugins.Disco");
var discoPlugin = Strophe._connectionPlugins["disco"];
test("add identity",
     function()
     {
         ok(discoPlugin.addIdentity("conference", "text"));
         ok(discoPlugin.addIdentity("directory", "chatroom"));
         equals(true, discoPlugin.addIdentity("conference", "chat", "MUC server"));
         equals(false, discoPlugin.addIdentity("conference", "chat", "MUC server"));
         equals(true, discoPlugin.addIdentity("directory", "chatroom", "MUC server", "en-US"));
         equals(true, discoPlugin.addIdentity("directory", "chatroom", "MUC serveur", "fr-FR"));
         equals(false, discoPlugin.addIdentity("directory", "chatroom", "MUC serveur", "fr-FR"));
     }
    );

test("add feature",
     function() {
         ok(discoPlugin.addFeature("jabber:iq:version"));
     }
    );

function jackTest(name, fun) {
    test(name,
         function() {
             jack(
                 function() {
                     var mockConnection = jack.create("mockConnection", object2Array(Strophe.Connection));
                     fun(mockConnection);
                 }

             );
         }
        );
}

jackTest('Test iq get info features', function(mockConnection) {
    expect(7);
    jack.expect("mockConnection.send").once().mock(
                     function(iq) {
                         equals($(iq).attr('to'), 'romeo@montague.net/orchard');
                         equals($(iq).attr('id'), 'info1');
                         equals($(iq).find('query > identity').size(), 3);
                         equals($(iq).find('query > identity:first').attr('name'), undefined);
                         equals($(iq).find('query > identity[name="Neutron"]').size(), 2);
                         equals($(iq).find('query > identity[name="Neutron"]:first').attr('xml:lang'), undefined);
                         equals($(iq).find('query > identity[name="Neutron"]:last').attr('xml:lang'), 'fr-FR');
                     });
    discoPlugin.init(mockConnection);
    discoPlugin.addIdentity('client', 'web');
    discoPlugin.addIdentity('automation', 'bot', 'Neutron');
    discoPlugin.addIdentity('automation', 'bot', 'Neutron', 'fr-FR');
    var parser = new DOMParser();
    var xml = parser.parseFromString("<iq type='get' from='romeo@montague.net/orchard' id='info1'> <query xmlns='http://jabber.org/protocol/disco#info'/></iq>", "text/xml");
    discoPlugin._onDiscoInfo(xml.documentElement);
});

jackTest("query info", function(mockConnection) {
             expect(1);
    discoPlugin.init(mockConnection);
    discoPlugin.info("example.net");
});
