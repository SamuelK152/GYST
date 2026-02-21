import mongoose from 'mongoose'

const connectDB = async (mongoUri) => {
    try {
        await mongoose.connect(mongoUri)
        console.log('MongoDB connected')
    } catch (error) {
        console.error('MongoDB connection error', error)
        process.exit(1)
    }
}

export default connectDB
