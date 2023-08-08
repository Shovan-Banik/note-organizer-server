const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;


//middle ware
app.use(cors());
app.use(express.json())


const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fus4ier.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersCollection = client.db("noteOrganizerDB").collection("users");
    const notesCollection = client.db("noteOrganizerDB").collection("notes");


    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

      res.send({ token })
    })

// indexig for search

  /*   const indexKeys={title:1};
    const indexOptions={name:"searchTitle"};
    const result=await notesCollection.createIndex(indexKeys,indexOptions);


    app.get('/noteSearchByTitle/:text', async (req, res) => {
      const searchText = req.params.text;
  
      const query = {
          title: { $regex: searchText, $options: 'i' },
      };
  
      const searchResults = await notesCollection.find(query).toArray();
  
      res.json(searchResults);
  });
 */


    // users related api

    app.post('/users', async (req, res) => {
        const user = req.body;
        console.log(user);
        const query = { email: user.email }
        const existingUser = await usersCollection.findOne(query);
  
        if (existingUser) {
          return res.send({ message: 'user already exists' })
        }
  
        const result = await usersCollection.insertOne(user);
        res.send(result);
      });

    //   notes related api

    app.get('/notes',verifyJWT,async(req,res)=>{
        const email=req.query.email;
        if(!email){
          res.send([])
        }
        const decodedEmail=req.decoded.email;
        if(email !==decodedEmail){
          return res.status(401).send({error: true, message: 'forbidden access'});
        }
        const filter={email:email}
        const result=await notesCollection.find(filter).toArray();
        res.send(result);
    })

    app.get('/notes/:id',async(req,res)=>{
      const id=req.params.id;
      const query={_id: new ObjectId(id)};
      const result=await notesCollection.findOne(query);
      res.send(result);
    })

    app.post('/notes',async(req,res)=>{
        const note=req.body;
        console.log(note);
        const result=await notesCollection.insertOne(note);
        res.send(result);
    })


    app.delete('/notes/:id',async(req,res)=>{
        const id=req.params.id;
        const query={_id: new ObjectId(id)};
        const result=await notesCollection.deleteOne(query);
        res.send(result);
    })

    app.patch('/notes/:id',async(req,res)=>{
      const id=req.params.id;
      const query={_id:new ObjectId(id)};
      const updatedData=req.body;
      const result=await notesCollection.updateOne(query,{ $set: updatedData });
      res.send(result);
    })





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('note organizer server running');
  })
  
  app.listen(port, () => {
    console.log(`note organizer is running on port ${port}`);
  })