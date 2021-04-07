var Forum  = artifacts.require("./Forum.sol");

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract("Forum", function(accounts) {
  var forumInstance;

  before(async () => {
    forumInstance = await Forum.deployed()
  })

  describe('deployment', async () => {
    it('deploys successfully', async () => {
      const address = await forumInstance.address
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })
  })

  describe('comment', async () => {
    it("initializes with one comment", async () => {
      let count = await forumInstance.postCount();
      assert.equal(count, 1);
    });

    it("it initializes the product with the correct values", async () => {
      let post = await forumInstance.posts(1);
      assert.equal(post[0], 1, "contains the correct id");
      assert.equal(post[1], "Do you have something News Worthy to report?", "contains the correct comment");
      assert.equal(post[3], "Wed Apr 07 2021", "contains the correct time");
    });

    it("it creates posts", async () => {
      let receipt = await forumInstance.comment("tname", "ttime", {from: accounts[0]});
      assert.equal(receipt.logs.length, 1, "an event was triggered");
      assert.equal(receipt.logs[0].event, "postEvent", "the event type is correct");
      let post = await forumInstance.posts(2);
      assert.equal(post[0], 2, "contains the correct id");
      assert.equal(post[1], "tname", "contains the correct comment");
      assert.equal(post[2], accounts[0], "contains the correct owner");
      assert.equal(post[3], "ttime", "contains the correct time");
      
    });
  });

});