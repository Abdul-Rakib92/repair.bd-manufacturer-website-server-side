const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    console.log("db connected");
    const toolCollection = client.db("repairBd").collection("tool");
    const orderCollection = client.db("repairBd").collection("order");
    const reviewCollection = client.db("repairBd").collection("review");
    const myOrderCollection = client.db("repairBd").collection("myOrder");
    const myProfileCollection = client.db("repairBd").collection("myProfile");
    const userCollection = client.db("repairBd").collection('users');
    const paymentCollection = client.db("repairBd").collection('payments');

    // user api

    app.post('/create-payment-intent',  async(req, res) =>{
      const service = req.body;
      const price = service.price;
      const amount = price*100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount : amount,
        currency: 'usd',
        payment_method_types:['card']
      });
      res.send({clientSecret: paymentIntent.client_secret})

    });


    app.get('/user', verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    // admin api
    app.get('/admin/:email', async(req, res) =>{
      const email = req.params.email;
      const user = await userCollection.findOne({email: email});
      const isAdmin = user.role === 'admin';
      res.send({admin: isAdmin})
    })


    app.put('/user/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({ email: requester });
      if (requesterAccount.role === 'admin') {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: 'admin' },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      }
      else{
        res.status(403).send({message: 'forbidden'});
      }

    })

    

    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "10d" }
      );
      res.send({ result, token });
    });

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

      const query = { email: email };
      const cursor = myOrderCollection.find(query);
      const myOrders = await cursor.toArray();
      res.send(myOrders);

    });

    app.get('/myOrder/:id', async(req, res) =>{
      const id = req.params.id;
      const query = {_id: ObjectId(id)};
      const myOrder = await myOrderCollection.findOne(query);
      res.send(myOrder);
    })


    app.post("/myOrder", async (req, res) => {
      const myOrder = req.body;
      const result = await myOrderCollection.insertOne(myOrder);
      res.send(result);
    });

    app.patch('/myOrder/:id',  async(req, res) =>{
      const id  = req.params.id;
      const payment = req.body;
      const filter = {_id: ObjectId(id)};
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId
        }
      }

      const result = await paymentCollection.insertOne(payment);
      const updatedMyOrder = await myOrderCollection.updateOne(filter, updatedDoc);
      res.send(updatedMyOrder);
    })





    // delete myOrder
    app.delete("/myOrder/:email", async (req, res) => {
      const email = req.params.email;

      const filter = { email: email };
      const result = await myOrderCollection.deleteOne(filter);
      res.send(result);
    });

    // app.delete("/myOrder/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: ObjectId(id) };
    //   const result = await myOrderCollection.deleteOne(query);
    //   res.send(result);
    // });



    // Review collection api
    app.get("/review", async (req, res) => {
      const query = {};
      const cursor = reviewCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    app.post("/review", async (req, res) => {
      const newReview = req.body;
      const result = await reviewCollection.insertOne(newReview);
      res.send(result);
    });

    // MyProfile collection api

    // app.get("/myProfile", async (req, res) => {
    //   const email = req.query.email;

    //   const query = {  email: email };
    //   const cursor = myProfileCollection.find(query);
    //   const myProfiles = await cursor.toArray();
    //   res.send(myProfiles);
    // });


    app.get("/myProfile", async (req, res) => {
      const query = {};
      const cursor = myProfileCollection.find(query);
      const myProfiles = await cursor.toArray();
      res.send(myProfiles);
    });

    app.post("/myProfile", async (req, res) => {
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
