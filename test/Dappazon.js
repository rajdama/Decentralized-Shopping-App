const { expect } = require("chai")
const { ethers } = require("hardhat")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe("Dappazon", () => {
  let dappazon
  let deployer, buyer
  const ID = 1
  const NAME = "Shoes"
  const CATEGORY = "Clothing"
  const IMAGE = "https://ipfs.io/ipfs/QmTYEboq8raiBs7GTUg2yLXB3PMz6HuBNgNfSZBx5Msztg/shoes.jpg"
  const COST = tokens(1)
  const RATING = 4
  const STOCK = 5

  beforeEach(async() =>{

    //Setup Accounts
    [deployer, buyer] = await ethers.getSigners()

    //Deploy contract
    const Dappazon = await ethers.getContractFactory("Dappazon")
    dappazon = await Dappazon.deploy()
  })

  //TESTING DEPLOYMENT
  describe("Deployment",() => {

    // TEST_1
    it("has a name", async()=>{
      let name = await dappazon.name()
      expect(name).to.equal("Dappazon")
    })

    // TEST_2
    it("sets the owner", async()=>{
      let owner = await dappazon.owner()
      expect(owner).to.equal(deployer.address)
    })
  })

  // TESTING LIST ITEMS
  describe("LISTING",() => {

    let transaction

    beforeEach(async() =>{
      transaction = await dappazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      
      await transaction.wait()

    })

    // TEST_1
    it("returns item attributes", async()=>{
      let item = await dappazon.items(1)
      expect(item.id).to.equal(ID)
      expect(item.name).to.equal(NAME)
      expect(item.category).to.equal(CATEGORY)
      expect(item.image).to.equal(IMAGE)
      expect(item.cost).to.equal(COST)
      expect(item.rating).to.equal(RATING)
      expect(item.stock).to.equal(STOCK)
    })

    // TEST_2
    it("Emits List event", () => {
      expect(transaction).to.emit(dappazon, "List")
    })
  })

  // TESTING BUYING ITEMS
  describe("BUYING",() => {
    let transaction

    beforeEach(async () => {
      // List a item
      transaction = await dappazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait()

      // Buy a item
      transaction = await dappazon.connect(buyer).buy(ID, { value: COST })
      await transaction.wait()
    })

    //TEST1
    it("Updates buyer's order count", async () => {
      const result = await dappazon.orderCount(buyer.address)
      expect(result).to.equal(1)
    })

    //TEST2
    // it("Adds the order", async () => {
    //   const order = await dappazon.orders(buyer.address, 1)
    //   expect(order.time).to.be.greaterThan(0)
    //   expect(order.item.name).to.equal(NAME)
    // })
    it("Updates the contract balance", async () => {
      const result = await ethers.provider.getBalance(dappazon.address)
      expect(result).to.equal(COST)
    })

    //TEST3
    it("Emits Buy event", () => {
      expect(transaction).to.emit(dappazon, "Buy")
    })
  })

  // TESTING WITHDRAWING
  describe("Withdrawing", () => {
    let balanceBefore

    beforeEach(async () => {
      // List a item
      let transaction = await dappazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait()

      // Buy a item
      transaction = await dappazon.connect(buyer).buy(ID, { value: COST })
      await transaction.wait()

      // Get Deployer balance before
      balanceBefore = await ethers.provider.getBalance(deployer.address)

      // Withdraw
      transaction = await dappazon.connect(deployer).withdraw()
      await transaction.wait()
    })

    it('Updates the owner balance', async () => {
      const balanceAfter = await ethers.provider.getBalance(deployer.address)
      expect(balanceAfter).to.be.greaterThan(balanceBefore)
    })

    it('Updates the contract balance', async () => {
      const result = await ethers.provider.getBalance(dappazon.address)
      expect(result).to.equal(0)
    })
  })
})
