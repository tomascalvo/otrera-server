import mongoose from "mongoose";
import moment from 'moment';

const bodyStatusSchema = mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        region: { type: String, required: true },
        condition: { type: String, required: true },
    },
    { timestamps: true, toJSON: { virtuals: true } }
);

// function getExpirationDate () {
//     let lifespan = null;
//     switch (this.condition) {
//         case "impaired":
//             lifespan = 90;
//             break;
//         case "injured":
//             lifespan = 7;
//             break;
//         case "sore (acute)":
//             lifespan = 2;
//             break;
//         case "sore (mild)":
//             lifespan = 1;
//             break;
//         case "fatigue":
//             lifespan = 1;
//             break;
//         default:
//             break;
//         };
//     return moment().add(lifespan, 'days').toDate();
// }

// bodyStatusSchema.virtual("isExpired").get(function () {
//     let lifespan = null;
//     switch (this.condition) {
//         case "impaired":
//             lifespan = 90;
//             break;
//         case "injured":
//             lifespan = 7;
//             break;
//         case "sore (acute)":
//             lifespan = 2;
//             break;
//         case "sore (mild)":
//             lifespan = 1;
//             break;
//         case "fatigue":
//             lifespan = 1;
//             break;
//         default:
//             break;
//         };
//     if (moment().diff(moment(this.createdAt), 'days', true) > lifespan) {
//         return true;
//     } else {
//         return false;
//     }
// });

const BodyStatus = mongoose.model("BodyStatus", bodyStatusSchema);

export default BodyStatus;