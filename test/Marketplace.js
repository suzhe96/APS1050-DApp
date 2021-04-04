var Marketplace = artifacts.require("./Marketplace.sol");

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract("Marketplace", function([deployer, seller, buyer]) {
  var marketplaceInstance;

  before(async () => {
    marketplaceInstance = await Marketplace.deployed()
  })

  describe('deployment', async () => {
    it('deploys successfully', async () => {
      const address = await marketplaceInstance.address
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })
  })

  describe('products', async () => {
    it("initializes with one product", async () => {
      let count = await marketplaceInstance.productCount();
      assert.equal(count, 1);
    });

    it("it initializes the product with the correct values", async () => {
      let product = await marketplaceInstance.products(1);
      assert.equal(product[0], 1, "contains the correct id");
      assert.equal(product[1], "Oli", "contains the correct name");
      assert.equal(product[2], "British Shorthair", "contains the correct breed");
      assert.equal(product[3], 1, "contains the correct age");
      assert.equal(product[4], "Toronto, Ontario", "contains the correct location");
      assert.equal(product[5], "../images/british-shorthair-golden.jpeg", "contains the correct img");
      assert.equal(product[6], 20, "contains the correct price");
    });

    it("it creates product", async () => {
      let receipt = await marketplaceInstance.createProduct("tname", "tbreed", 2, "tloc", "timg", web3.utils.toWei('1', 'Ether'), {from: seller});
      assert.equal(receipt.logs.length, 1, "an event was triggered");
      assert.equal(receipt.logs[0].event, "productCreated", "the event type is correct");
      let product = await marketplaceInstance.products(2);
      assert.equal(product[0], 2, "contains the correct id");
      assert.equal(product[1], "tname", "contains the correct name");
      assert.equal(product[2], "tbreed", "contains the correct breed");
      assert.equal(product[3], 2, "contains the correct age");
      assert.equal(product[4], "tloc", "contains the correct location");
      assert.equal(product[5], "timg", "contains the correct img");
      assert.equal(product[6], "1000000000000000000", "contains the correct price");
      
    });

    it("creates product exception", async () => {
      // FAILURE: Product must have a name
      await await marketplaceInstance.createProduct('', "tbreed", 2, "tloc", "timg", web3.utils.toWei('1', 'Ether'), { from: seller }).should.be.rejected;
      // FAILURE: Product must have a price
      await await marketplaceInstance.createProduct("tname", "tbreed", 2, "tloc", "timg", 0, { from: seller }).should.be.rejected;
    })

    it('sells products', async () => {
      // Track the seller balance before purchase
      let oldSellerBalance
      oldSellerBalance = await web3.eth.getBalance(seller)
      oldSellerBalance = new web3.utils.BN(oldSellerBalance)

      // SUCCESS: Buyer makes purchase
      result = await marketplaceInstance.purchaseProduct(2, { from: buyer, value: web3.utils.toWei('1', 'Ether')})

      // Check logs
      const event = result.logs[0].args;
      assert.equal(event.id.toNumber(), 2, 'id is correct');
      let product = await marketplaceInstance.products(2);
      assert.equal(product[7], buyer, 'owner is correct')
      assert.equal(product[8], true, 'purchased is correct')
      

      // Check that seller received funds
      let newSellerBalance
      newSellerBalance = await web3.eth.getBalance(seller)
      newSellerBalance = new web3.utils.BN(newSellerBalance)

      let price
      price = web3.utils.toWei('1', 'Ether')
      price = new web3.utils.BN(price)

      const exepectedBalance = oldSellerBalance.add(price)

      assert.equal(newSellerBalance.toString(), exepectedBalance.toString())

      // FAILURE: Tries to buy a product that does not exist, i.e., product must have valid id
      await marketplaceInstance.purchaseProduct(99, { from: buyer, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;      // FAILURE: Buyer tries to buy without enough ether
      // FAILURE: Buyer tries to buy without enough ether
      await marketplaceInstance.purchaseProduct(2, { from: buyer, value: web3.utils.toWei('0.5', 'Ether') }).should.be.rejected;
      // FAILURE: Deployer tries to buy the product, i.e., product can't be purchased twice
      await marketplaceInstance.purchaseProduct(2, { from: deployer, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected;
      // FAILURE: Buyer tries to buy again, i.e., buyer can't be the seller
      await marketplaceInstance.purchaseProduct(2, { from: buyer, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected;
    })
  });

});