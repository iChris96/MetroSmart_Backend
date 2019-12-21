import mongoose from 'mongoose';

export default async function connect() {

    try {
        await mongoose.connect(
            'mongodb://localhost/tutorialDB',
            { useNewUrlParser: true, useUnifiedTopology: true }
        );
        console.log('Db Connected');
    } catch (error) {
        console.log(`Imposible to connect to Database, Error: ${error}.`);
    }
    
}