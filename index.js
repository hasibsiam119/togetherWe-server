import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import 'dotenv/config'

const app = express();
const PORT = 8000;
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URL);

export async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("You successfully connected to MongoDB!");
        return client;
    } catch (err) {
        console.dir(err);
    }
}

const mongoClient = await connectToMongoDB();
const db = mongoClient.db('togetherWe');
const eventsCollection = db.collection('events')

app.get('/events', async(req,res)=>{
const events = await eventsCollection.find({}).toArray()
res.send(events)
})

app.get('/', (req, res) => {
    res.send({ message: 'server is running fine' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});