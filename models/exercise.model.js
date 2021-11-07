import mongoose from 'mongoose';

const exerciseSchema = mongoose.Schema(
    {
        EDBmovement: {
            type: String
        },
        movement: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Movement",
        },
        reps: Number,
        sets: Number,
        resistance: Number,
    },
    { timestamps: true, toJSON: { virtuals: true } }
)

const Exercise = mongoose.model("Exercise", exerciseSchema);

export default Exercise;