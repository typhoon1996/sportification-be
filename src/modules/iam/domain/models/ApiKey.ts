import crypto from "crypto";
import {Schema, model, Model} from "mongoose";
import {IApiKey, IApiKeyStatics} from "../../../../shared/types";

const apiKeySchema = new Schema<IApiKey>(
  {
    name: {
      type: String,
      required: [true, "API key name is required"],
      trim: true,
      maxlength: 100,
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    permissions: [
      {
        type: String,
        enum: [
          "read:users",
          "write:users",
          "read:matches",
          "write:matches",
          "read:tournaments",
          "write:tournaments",
          "read:venues",
          "write:venues",
          "admin:all",
        ],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastUsedAt: {
      type: Date,
    },
    rateLimit: {
      maxRequests: {
        type: Number,
        default: 1000,
        min: 1,
        max: 10000,
      },
      windowMs: {
        type: Number,
        default: 3600000, // 1 hour
        min: 60000, // 1 minute
        max: 86400000, // 24 hours
      },
    },
    allowedIPs: [
      {
        type: String,
        validate: {
          validator: function (ip: string) {
            // Basic IP validation
            return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
              ip
            );
          },
          message: "Invalid IP address format",
        },
      },
    ],
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete (ret as any).keyHash; // Never expose the hash
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Indexes
apiKeySchema.index({userId: 1, isActive: 1});
apiKeySchema.index({expiresAt: 1}, {expireAfterSeconds: 0});

// Instance method to validate API key
apiKeySchema.methods.validateKey = function (providedKey: string): boolean {
  const hash = crypto.createHash("sha256").update(providedKey).digest("hex");
  return hash === this.keyHash;
};

// Instance method to update last used timestamp
apiKeySchema.methods.updateLastUsed = async function (): Promise<void> {
  this.lastUsedAt = new Date();
  await this.save();
};

// Static method to find by hash
apiKeySchema.statics.findByHash = function (keyHash: string) {
  return this.findOne({keyHash, isActive: true});
};

// Static method to generate API key
apiKeySchema.statics.generateApiKey = function (): {key: string; hash: string} {
  // Generate a 32-byte random key
  const key = `sk_${crypto.randomBytes(32).toString("hex")}`;
  const hash = crypto.createHash("sha256").update(key).digest("hex");

  return {key, hash};
};

export const ApiKey = model<IApiKey, Model<IApiKey> & IApiKeyStatics>(
  "ApiKey",
  apiKeySchema
);
