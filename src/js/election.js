
ElectionApp = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  init: async function() {
    return await ElectionApp.initWeb3();
  },

  initWeb3: async function() {

    if (window.ethereum) {
      ElectionApp.web3Provider = window.ethereum;
      await window.ethereum.enable();
      web3 = new Web3(ElectionApp.web3Provider);
      return ElectionApp.initContract();
    }
    else {
      ElectionApp.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(ElectionApp.web3Provider);
      return ElectionApp.initContract();
    }
  },

  initContract: function() {
    $.getJSON("Election.json", function(election) {
      // Instantiate a new truffle contract from the artifact
      ElectionApp.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      ElectionApp.contracts.Election.setProvider(ElectionApp.web3Provider);
      ElectionApp.listenForEvents();
      return ElectionApp.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    ElectionApp.contracts.Election.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("vote event triggered", event)
        // Reload when a new vote is recorded
        ElectionApp.render();
      });

      instance.registeredEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("register event triggered", event)
        // Reload when a new register is recorded
        ElectionApp.render();
      });
    });
  },




render: function() {
var electionInstance;
var loader = $("#loader");
var content = $("#content");

loader.show();
content.hide();

// Load account data
web3.eth.getCoinbase(function(err, account) {
  if (err === null) {
    ElectionApp.account = account;
    $("#accountAddress").html("Your Account: " + account);
  }
});

// Load contract data
ElectionApp.contracts.Election.deployed().then(function(instance) {
  electionInstance = instance;
  return electionInstance.candidatesCount();
}).then(function(candidatesCount) {
  var candArray = [];
  for (var i = 1; i <= candidatesCount; i++) {
    candArray.push(electionInstance.candidates(i));
  }
  Promise.all(candArray).then(function(values) {
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      var candidatesSelect = $('#candidatesSelect');
      var candidateRegisterImg = $('#candidatesRegisterImg'); 
      candidatesSelect.empty();
      candidateRegisterImg.empty();

    for (var i = 0; i < candidatesCount; i++) {
      var id = values[i][0];
      var petName = values[i][1];
      var petBreed = values[i][2];
      var petAge = values[i][3];
      var petLoc = values[i][4];
      var petImg = values[i][5];
      var voteCount = values[i][6];

      // Render candidate Result
      var candidateTemplate = "<tr><th>" + i + "</th><td>" + petName + "</td><td>" + petBreed + "</td><td>" + petAge + "</td><td>" + petLoc + "</td><td><img src="+petImg+" alt=\"\" border=3 height=100 width=100></img></td><td>" + voteCount + "</td></tr>";
      candidatesResults.append(candidateTemplate);

      // Render candidate ballot option
      var candidateOption = "<option value='" + id + "' >" + petName + "</ option>"
      candidatesSelect.append(candidateOption);
    }
    $.getJSON('../images.json', function(data) {  
      for (i = 0; i < data.length; i ++) {
        var option = "<option value='" + i + "' >" + data[i].name + "</ option>"
        candidateRegisterImg.append(option);
      }
    });
  });
  return electionInstance.voters(ElectionApp.account);
}).then(function(hasVoted) {
  // Do not allow a user to vote
  if(hasVoted) {
    $('form#voteForm').hide();
  }
  return electionInstance.regList(ElectionApp.account);
}).then(function(hasRegistered) {
  if(hasRegistered) {
    $('form#regForm').hide();
  }
  loader.hide();
  content.show();
}).catch(function(error) {
  console.warn(error);
});
  },




  castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    ElectionApp.contracts.Election.deployed().then(function(instance) {
      return instance.vote(candidateId, { from: ElectionApp.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  },

  castRegister: function() {
    var regName = $('#candidatesRegisterName').val();
    var regBreed = $('#candidatesRegisterBreed').val();
    var regAge = $('#candidatesRegisterAge').val();
    var regLoc = $('#candidatesRegisterLoc').val();
    var regImgId = $('#candidatesRegisterImg').val();
    ElectionApp.contracts.Election.deployed().then(function(instance) {
      $.getJSON('../images.json', function(data) {  
        return instance.register(regName, regBreed, regAge, regLoc, data[regImgId].img, { from: ElectionApp.account });
      })
    }).then(function(result) {
      // Wait for reg to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  }
};

$(function() {
  $(window).load(function() {
    ElectionApp.init();
  });
});
