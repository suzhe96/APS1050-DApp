MarketspaceApp = {
    web3Provider: null,
    contracts: {},
    account: '0x0',
  
    init: async function() {
      return await MarketspaceApp.initWeb3();
    },
  
    initWeb3: async function() {
  
      if (window.ethereum) {
        MarketspaceApp.web3Provider = window.ethereum;
        await window.ethereum.enable();
        web3 = new Web3(MarketspaceApp.web3Provider);
        return MarketspaceApp.initContract();
      }
      else {
        MarketspaceApp.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        web3 = new Web3(MarketspaceApp.web3Provider);
        return MarketspaceApp.initContract();
      }
    },
  
    initContract: function() {
      $.getJSON("Marketplace.json", function(election) {
        // Instantiate a new truffle contract from the artifact
        MarketspaceApp.contracts.Marketplace = TruffleContract(election);
        // Connect provider to interact with contract
        MarketspaceApp.contracts.Marketplace.setProvider(MarketspaceApp.web3Provider);
        MarketspaceApp.listenForEvents();
        return MarketspaceApp.render();
      });
    },
  
    // Listen for events emitted from the contract
    listenForEvents: function() {
        MarketspaceApp.contracts.Marketplace.deployed().then(function(instance) {
        // Restart Chrome if you are unable to receive this event
        // This is a known issue with Metamask
        // https://github.com/MetaMask/metamask-extension/issues/2393
        instance.productCreated({}, {
          fromBlock: 0,
          toBlock: 'latest'
        }).watch(function(error, event) {
          console.log("product created event triggered", event)
          // Reload when a new vote is recorded
          MarketspaceApp.render();
        });
  
        instance.productPurchased({}, {
          fromBlock: 0,
          toBlock: 'latest'
        }).watch(function(error, event) {
          console.log("product sale event triggered", event)
          // Reload when a new register is recorded
          MarketspaceApp.render();
        });
      });
    },
  
  
  
  
  render: function() {
  var marketspaceInstance;
  var loader = $("div#loaderMarketspace");
  var content = $("div#contentMarketspace");
  
  loader.show();
  content.hide();
  
  // Load account data
  web3.eth.getCoinbase(function(err, account) {
    if (err === null) {
      MarketspaceApp.account = account;
      $("#accountAddressMarketspace").html("Your Account: " + account);
    }
  });
  
  // Load contract data
  MarketspaceApp.contracts.Marketplace.deployed().then(function(instance) {
    marketspaceInstance = instance;
    return marketspaceInstance.productCount();
  }).then(function(productCount) {
    var candArray = [];
    for (var i = 1; i <= productCount; i++) {
      candArray.push(marketspaceInstance.products(i));
    }
    Promise.all(candArray).then(function(values) {
        var marketResults = $("#marketResults");
        marketResults.empty();
  
        var marketRegisterImg = $('#marketRegisterImg'); 
        marketRegisterImg.empty();
  
      for (var i = 0; i < productCount; i++) {
        var id = values[i][0];
        var petName = values[i][1];
        var petBreed = values[i][2];
        var petAge = values[i][3];
        var petLoc = values[i][4];
        var petImg = values[i][5];
        var petPrice = values[i][6];
        var petOwner = values[i][7];
        var petSold = values[i][8];
  
        // Render Result
        var template = "<tr><th>" + id + "</th><td>" + 
            petName + "</td><td>" +
            petBreed + "</td><td>" +
            petAge + "</td><td>" +
            petLoc + "</td><td><img src="+petImg+" alt=\"\" border=3 height=100 width=100></img></td><td>" +
            petOwner + "</td><td>" +
            web3.fromWei(petPrice.toString(), "Ether") + "</td><td>" +
            petSold + "</td><td>" + "<button id=marketBuyButton onClick=\"MarketspaceApp.castPurchase(" + id +")\" type=\"button\">Buy</button></td></tr>";
        marketResults.append(template);
      }
      $.getJSON('../images.json', function(data) {  
        for (i = 0; i < data.length; i ++) {
          var option = "<option value='" + i + "' >" + data[i].name + "</ option>"
          marketRegisterImg.append(option);
        }
      });
    });
    loader.hide();
    content.show();
  }).catch(function(error) {
    console.warn(error);
  });
    },

    castRegister: function() {
        // web3 = new Web3(MarketspaceApp.web3Provider);
        var marketName = $('#marketRegisterName').val();
        var marketBreed = $('#marketRegisterBreed').val();
        var marketAge = $('#marketRegisterAge').val();
        var marketLoc = $('#marketRegisterLoc').val();
        var marketPrice = $('#marketRegisterPrice').val();
        var marketPriceEth = web3.toWei(marketPrice, 'Ether');
        var marketImgId = $('#marketRegisterImg').val();
        MarketspaceApp.contracts.Marketplace.deployed().then(function(instance) {
            $.getJSON('../images.json', function(data) {  
              return instance.createProduct(marketName, marketBreed, marketAge, marketLoc, data[marketImgId].img, marketPriceEth, { from: MarketspaceApp.account });
            })
        }).then(function(result) {
            // Wait for reg to update
            $("div#contentMarketspace").hide();
            $("div#loaderMarketspace").show();
        }).catch(function(err) {
            console.error(err);
        });
    },

    castPurchase: async (id) => {
        let instance = await MarketspaceApp.contracts.Marketplace.deployed();
        let data = await instance.products(id);
        await instance.purchaseProduct(id, {from: MarketspaceApp.account, value: data[6]});
        $("div#contentMarketspace").hide();
        $("div#loaderMarketspace").show();
        // MarketspaceApp.contracts.Marketplace.deployed().then(function(instance) {
        //     return instance.products(id, function(data) {
        //         var price = data[6];
        //         return instance.purchaseProduct(id, {from: MarketspaceApp.account, value: price});
        //     })
        // }).then(function(result) {
        //     // Wait for purchase to update
        //     $("div#contentMarketspace").hide();
        //     $("div#loaderMarketspace").show();
        // }).catch(function(err) {
        //     console.error(err);
        // });
    }
  };
  
  $(function() {
    $(window).load(function() {
      MarketspaceApp.init();
    });
  });
  