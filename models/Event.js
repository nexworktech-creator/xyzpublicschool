import mongoose from "mongoose";

const MediaItemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "video"], required: true },
    url: { type: String, required: true }, // Cloudinary URL or embed URL (e.g. YouTube)
    publicId: { type: String }, // present for Cloudinary-hosted uploads
    isEmbed: { type: Boolean, default: false }, // true if url is an external embed link
  },
  { _id: false }
);

const EventSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    eventDate: { type: Date, required: true },
    category: {
      type: String,
      enum: ["sports", "cultural", "academic", "excursion", "celebration", "other"],
      default: "other",
    },
    media: [MediaItemSchema],
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

EventSchema.index({ eventDate: -1 });

export default mongoose.models.Event || mongoose.model("Event", EventSchema);
