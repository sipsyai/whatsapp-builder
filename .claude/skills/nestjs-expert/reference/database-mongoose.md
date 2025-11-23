# Mongoose Database Integration

## Setup

```bash
npm install @nestjs/mongoose mongoose
```

```typescript
// app.module.ts
@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI, {
      connectionFactory: (connection) => {
        connection.plugin(require('mongoose-paginate-v2'));
        return connection;
      },
    }),
  ],
})
export class AppModule {}
```

## Schema Definition

```typescript
// user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ type: String, enum: ['user', 'admin'], default: 'user' })
  role: string;

  @Prop({ default: true })
  active: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Post' }] })
  posts: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Organization' })
  organization: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add indexes
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });

// Add virtual properties
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Add instance methods
UserSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

// Add static methods
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email });
};

// Pre-save hook
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
```

## Module Setup

```typescript
// users.module.ts
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Post.name, schema: PostSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

## Service Implementation

```typescript
// users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async findAll(query?: any): Promise<User[]> {
    return this.userModel
      .find({ active: true })
      .limit(query?.limit || 10)
      .skip(query?.skip || 0)
      .sort({ createdAt: -1 })
      .populate('organization')
      .exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel
      .findById(id)
      .populate('posts')
      .exec();

    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email }).exec();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    return user;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id: id }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(`User #${id} not found`);
    }
  }
}
```

## Queries

### Basic Operations

```typescript
// Find all
const users = await this.userModel.find().exec();

// Find with conditions
const users = await this.userModel.find({ active: true }).exec();

// Find one
const user = await this.userModel.findOne({ email }).exec();

// Find by ID
const user = await this.userModel.findById(id).exec();

// Create
const user = new this.userModel(data);
await user.save();

// Or
const user = await this.userModel.create(data);

// Update
const user = await this.userModel.findByIdAndUpdate(
  id,
  { $set: data },
  { new: true },
).exec();

// Update many
await this.userModel.updateMany(
  { active: false },
  { $set: { deleted: true } },
).exec();

// Delete
await this.userModel.findByIdAndDelete(id).exec();
await this.userModel.deleteOne({ _id: id }).exec();
await this.userModel.deleteMany({ active: false }).exec();
```

### Advanced Queries

```typescript
// Complex conditions
const users = await this.userModel
  .find({
    $and: [
      { active: true },
      { role: 'admin' },
      {
        $or: [
          { email: { $regex: '@example.com$' } },
          { createdAt: { $gte: new Date('2024-01-01') } },
        ],
      },
    ],
  })
  .exec();

// Projection (select fields)
const users = await this.userModel
  .find({}, 'email firstName lastName')
  .exec();

// Or
const users = await this.userModel
  .find()
  .select('email firstName lastName')
  .exec();

// Exclude fields
const users = await this.userModel
  .find()
  .select('-password -__v')
  .exec();

// Sorting
const users = await this.userModel
  .find()
  .sort({ createdAt: -1, email: 1 })
  .exec();

// Limit and skip
const users = await this.userModel
  .find()
  .limit(10)
  .skip(20)
  .exec();

// Count
const count = await this.userModel.countDocuments({ active: true }).exec();

// Distinct
const emails = await this.userModel.distinct('email').exec();
```

### Population (Relationships)

```typescript
// Simple populate
const user = await this.userModel
  .findById(id)
  .populate('posts')
  .exec();

// Multiple populates
const user = await this.userModel
  .findById(id)
  .populate('posts')
  .populate('organization')
  .exec();

// Nested populate
const user = await this.userModel
  .findById(id)
  .populate({
    path: 'posts',
    populate: {
      path: 'comments',
      select: 'text author',
    },
  })
  .exec();

// Conditional populate
const user = await this.userModel
  .findById(id)
  .populate({
    path: 'posts',
    match: { published: true },
    select: 'title content',
    options: { limit: 10, sort: { createdAt: -1 } },
  })
  .exec();
```

### Aggregation

```typescript
// Basic aggregation
const stats = await this.userModel.aggregate([
  { $match: { active: true } },
  { $group: {
    _id: '$role',
    count: { $sum: 1 },
    avgAge: { $avg: '$age' },
  }},
  { $sort: { count: -1 } },
]);

// Complex aggregation
const result = await this.userModel.aggregate([
  // Stage 1: Match active users
  { $match: { active: true } },

  // Stage 2: Lookup posts
  {
    $lookup: {
      from: 'posts',
      localField: '_id',
      foreignField: 'authorId',
      as: 'posts',
    },
  },

  // Stage 3: Add computed fields
  {
    $addFields: {
      postCount: { $size: '$posts' },
      fullName: { $concat: ['$firstName', ' ', '$lastName'] },
    },
  },

  // Stage 4: Project fields
  {
    $project: {
      email: 1,
      fullName: 1,
      postCount: 1,
      _id: 0,
    },
  },

  // Stage 5: Sort
  { $sort: { postCount: -1 } },

  // Stage 6: Limit
  { $limit: 10 },
]);

// Faceted search
const result = await this.userModel.aggregate([
  {
    $facet: {
      byRole: [
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ],
      byMonth: [
        {
          $group: {
            _id: { $month: '$createdAt' },
            count: { $sum: 1 },
          },
        },
      ],
      total: [
        { $count: 'total' },
      ],
    },
  },
]);
```

### Text Search

```typescript
// Add text index in schema
UserSchema.index({ email: 'text', firstName: 'text', lastName: 'text' });

// Search
const users = await this.userModel
  .find({ $text: { $search: 'john doe' } })
  .exec();

// With score
const users = await this.userModel
  .find(
    { $text: { $search: 'john doe' } },
    { score: { $meta: 'textScore' } },
  )
  .sort({ score: { $meta: 'textScore' } })
  .exec();
```

## Pagination

```typescript
// Manual pagination
async paginate(page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    this.userModel
      .find({ active: true })
      .limit(limit)
      .skip(skip)
      .exec(),
    this.userModel.countDocuments({ active: true }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// Using mongoose-paginate-v2
import mongoosePaginate from 'mongoose-paginate-v2';

UserSchema.plugin(mongoosePaginate);

async paginate(page: number, limit: number) {
  return this.userModel.paginate(
    { active: true },
    {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: 'organization',
    },
  );
}
```

## Transactions

```typescript
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  async createUserWithPosts(data: CreateUserWithPostsDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const user = new this.userModel(data.user);
      await user.save({ session });

      const posts = data.posts.map((post) => ({
        ...post,
        authorId: user._id,
      }));

      await this.postModel.insertMany(posts, { session });

      await session.commitTransaction();
      return user;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
```

## Middleware (Hooks)

```typescript
// Pre hooks
UserSchema.pre('save', async function(next) {
  console.log('Before save:', this);
  next();
});

UserSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Post hooks
UserSchema.post('save', function(doc, next) {
  console.log('After save:', doc);
  next();
});

UserSchema.post('remove', async function(doc) {
  // Clean up related documents
  await Post.deleteMany({ authorId: doc._id });
});

// Error handling hook
UserSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Email already exists'));
  } else {
    next(error);
  }
});
```

## Virtual Properties

```typescript
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'authorId',
});

// Enable virtuals in JSON
UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});
```

## Custom Methods

```typescript
// Instance methods
UserSchema.methods.comparePassword = async function(password: string) {
  return bcrypt.compare(password, this.password);
};

UserSchema.methods.generateToken = function() {
  return jwt.sign({ id: this._id, email: this.email }, process.env.JWT_SECRET);
};

// Static methods
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email });
};

UserSchema.statics.findActive = function() {
  return this.find({ active: true });
};

// Query helpers
UserSchema.query.byRole = function(role: string) {
  return this.where({ role });
};

// Usage
const users = await this.userModel.find().byRole('admin').exec();
```

## Validation

```typescript
// Built-in validators
@Prop({
  required: [true, 'Email is required'],
  unique: true,
  lowercase: true,
  trim: true,
  match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
})
email: string;

@Prop({
  minlength: [8, 'Password must be at least 8 characters'],
  maxlength: [100, 'Password too long'],
})
password: string;

@Prop({
  min: [18, 'Must be 18 or older'],
  max: [100, 'Invalid age'],
})
age: number;

@Prop({
  enum: {
    values: ['user', 'admin', 'moderator'],
    message: '{VALUE} is not a valid role',
  },
})
role: string;

// Custom validator
@Prop({
  validate: {
    validator: function(v: string) {
      return /^\d{10}$/.test(v);
    },
    message: 'Invalid phone number',
  },
})
phone: string;

// Async validator
@Prop({
  validate: {
    validator: async function(email: string) {
      const user = await this.model('User').findOne({ email });
      return !user;
    },
    message: 'Email already exists',
  },
})
email: string;
```

## Subdocuments

```typescript
// Address subdocument
@Schema({ _id: false })
export class Address {
  @Prop()
  street: string;

  @Prop()
  city: string;

  @Prop()
  country: string;

  @Prop()
  zipCode: string;
}

const AddressSchema = SchemaFactory.createForClass(Address);

// Use in parent schema
@Schema()
export class User {
  @Prop({ type: AddressSchema })
  address: Address;

  @Prop({ type: [AddressSchema] })
  addresses: Address[];
}
```

## Plugins

```typescript
// Apply plugin to schema
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseDelete from 'mongoose-delete';

UserSchema.plugin(mongoosePaginate);
UserSchema.plugin(mongooseDelete, {
  deletedAt: true,
  overrideMethods: 'all',
});

// Custom plugin
function timestampPlugin(schema: Schema) {
  schema.add({
    createdBy: { type: Types.ObjectId, ref: 'User' },
    updatedBy: { type: Types.ObjectId, ref: 'User' },
  });

  schema.pre('save', function(next) {
    if (this.isNew) {
      this.createdBy = this.$locals.userId;
    }
    this.updatedBy = this.$locals.userId;
    next();
  });
}

UserSchema.plugin(timestampPlugin);
```

## Best Practices

### Schema Design
- Use embedded documents for 1-to-few relationships
- Use references for 1-to-many or many-to-many relationships
- Denormalize data when read performance is critical
- Use indexes for frequently queried fields

### Performance
- Always use `.exec()` for queries
- Use `.lean()` for read-only operations (returns plain objects)
- Select only needed fields with `.select()`
- Use indexes wisely
- Avoid N+1 queries with proper population

### Error Handling
```typescript
try {
  await this.userModel.create(data);
} catch (error) {
  if (error.code === 11000) {
    throw new ConflictException('Email already exists');
  }
  if (error.name === 'ValidationError') {
    throw new BadRequestException(error.message);
  }
  throw error;
}
```

### Connection Management
```typescript
// Use connection pooling
MongooseModule.forRoot(uri, {
  maxPoolSize: 10,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  family: 4,
});
```
