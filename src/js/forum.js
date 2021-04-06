
ForumApp = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: async function() {
    return await ForumApp.initWeb3();
  },

  initWeb3: async function() {

    if (window.ethereum) {
      ForumApp.web3Provider = window.ethereum;
      await window.ethereum.enable();
      web3 = new Web3(ForumApp.web3Provider);
      return ForumApp.initContract();
    }
    else {
      ForumApp.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(ForumApp.web3Provider);
      return ForumApp.initContract();
    }
  },

  initContract: function() {
    $.getJSON("Forum.json", function(forum) {
      // Instantiate a new truffle contract from the artifact
      ForumApp.contracts.Forum = TruffleContract(forum);
      // Connect provider to interact with contract
      ForumApp.contracts.Forum.setProvider(ForumApp.web3Provider);
      ForumApp.listenForEvents();
      return ForumApp.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    ForumApp.contracts.Forum.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.postEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("post event triggered", event)
        // Reload when a new vote is recorded
        ForumApp.render();
      });
    });
  },


render: function() {
var forumInstance;
var loader = $("div#loaderForum");
var content = $("div#contentForum")

loader.show();
content.hide();

// Load account data
web3.eth.getCoinbase(function(err, account) {
  if (err === null) {
    ForumApp.account = account;
    $("#accountAddress").html("Your Account: " + account);
  }
});

// Load contract data
ForumApp.contracts.Forum.deployed().then(function(instance) {
  forumInstance = instance;
  return forumInstance.postCount();
}).then(function(postCount) {
  var candArray = [];
  for (var i = 1; i <= postCount; i++) {
    candArray.push(forumInstance.posts(i));
  }
  Promise.all(candArray).then(function(values) {
      var postResults = $("#postResults");
      postResults.empty();

    for (var i = 0; i < postCount; i++) {
      var id = values[i][0];
      var forumContents = values[i][1];
      var formOwner = values[i][2];
      var forumTimestamp = values[i][3];
      

      // Render candidate Result
      var postTemplate = "<tr><th>" + i + "</th><td>" + forumContents + "</td><td>" + formOwner + "</td><td>" + forumTimestamp + "</td></tr>";
      postResults.append(postTemplate);
    }
  });
  loader.hide();
  content.show();
}).catch(function(error) {
  console.warn(error);
});
  },

  castComment: function() {
    var contents = $('#commentContents').val();
    var timestamp = new Date();
    var timestampStr = timestamp.toDateString();
    ForumApp.contracts.Forum.deployed().then(function(instance) {
      return instance.comment(contents, timestampStr, { from: ForumApp.account });
    }).then(function(result) {
      // Wait for votes to update
      $("div#contentForum").hide();
      $("div#loaderForum").show();
    }).catch(function(err) {
      console.error(err);
    });
  },
};

$(function() {
  $(window).load(function() {
    ForumApp.init();
  });
});
