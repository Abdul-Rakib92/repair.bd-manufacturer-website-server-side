const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.69otv.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    console.log("db connected");
    const toolCollection = client.db("repairBd").collection("tool");
    const orderCollection = client.db("repairBd").collection("order");
    const reviewCollection = client.db("repairBd").collection("review");
    const myOrderCollection = client.db("repairBd").collection("myOrder");
    const myProfileCollection = client.db("repairBd").collection("myProfile");
    const userCollection = client.db("repairBd").collection("users");


    // user api
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10d' })
      res.send({ result, token });

    })

    // tool api
    app.get("/tool", async (req, res) => {
      const query = {};
      const cursor = toolCollection.find(query);
      const tools = await cursor.toArray();
      res.send(tools);
    });

    app.get("/tool/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const tool = await toolCollection.findOne(query);
      res.send(tool);
    });

    //Post (add a new user)
    app.post("/tool", async (req, res) => {
      const newTool = req.body;
      const result = await toolCollection.insertOne(newTool);
      res.send(result);
    });

    // Delete tool
    app.delete("/tool/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await toolCollection.deleteOne(query);
      res.send(result);
    });

    // Order Collection API

    app.get("/order", async (req, res) => {
      // const email = req.query.email;
      const query = {};
      const cursor = orderCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    app.post("/order", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });

    // Delete order
    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });

    //My order api

    app.get("/myOrder", async (req, res) => {
      const email = req.query.email;
      // console.log(email);
      const query = { email: email };
      const cursor = myOrderCollection.find(query);
      const myOrders = await cursor.toArray();
      res.send(myOrders);
    });

    app.post("/myOrder", async (req, res) => {
      const myOrder = req.body;
      const result = await myOrderCollection.insertOne(myOrder);
      res.send(result);
    });

    // delete myOrder
    app.delete('/myOrder/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const result = await myOrderCollection.deleteOne(query);
      res.send(result);
    })

    // Review collection api
    app.get("/review", async (req, res) => {
      const query = {};
      const cursor = reviewCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    app.post('/review', async (req, res) => {
      const newReview = req.body;
      const result = await reviewCollection.insertOne(newReview);
      res.send(result);
    });


    // MyProfile collection api
    app.get("/myProfile", async (req, res) => {
      const query = {};
      const cursor = myProfileCollection.find(query);
      const myProfiles = await cursor.toArray();
      res.send(myProfiles);
    });

    app.post('/myProfile', async (req, res) => {
      const newMyProfile = req.body;
      const result = await myProfileCollection.insertOne(newMyProfile);
      res.send(result);
    });







  } 
  
  finally {

  }

}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Repair.BD is running");
});

app.listen(port, () => {
  console.log(`Repair.BD App listening on port ${port}`);
});
