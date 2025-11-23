# Relations

## Relation Types

TypeORM supports four relation types:
- One-to-one: `@OneToOne()`
- Many-to-one: `@ManyToOne()`
- One-to-many: `@OneToMany()`
- Many-to-many: `@ManyToMany()`

## One-to-Many / Many-to-One

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @OneToMany(() => Photo, photo => photo.user)
  photos: Photo[]
}

@Entity()
export class Photo {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => User, user => user.photos)
  user: User
}
```

Note: Use arrow functions `() => Photo` to avoid circular dependency issues.

## One-to-One

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @OneToOne(() => Profile, profile => profile.user)
  @JoinColumn()
  profile: Profile
}

@Entity()
export class Profile {
  @PrimaryGeneratedColumn()
  id: number

  @OneToOne(() => User, user => user.profile)
  user: User
}
```

`@JoinColumn()` is required on one side (owner side).

## Many-to-Many

```typescript
@Entity()
export class Question {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToMany(() => Category, category => category.questions)
  @JoinTable()
  categories: Category[]
}

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToMany(() => Question, question => question.categories)
  questions: Question[]
}
```

`@JoinTable()` is required on owner side.

## Relation Options

```typescript
@OneToMany(() => Photo, photo => photo.user, {
  eager: false,
  cascade: true,
  onDelete: "CASCADE",
  nullable: true,
  orphanedRowAction: "delete"
})
photos: Photo[]
```

**Options:**
- `eager` - Auto-load relation with entity (default: false)
- `cascade` - Auto-save related entities (default: false)
- `onDelete` - Foreign key behavior: RESTRICT, CASCADE, SET NULL
- `nullable` - Allow NULL (default: true)
- `orphanedRowAction` - Handle orphaned children: delete, soft-delete, nullify, disable

## Cascade Operations

**Full cascade:**
```typescript
@ManyToMany(() => Category, {
  cascade: true,
})
@JoinTable()
categories: Category[]

// Auto-saves categories when saving question
const question = new Question()
question.categories = [category1, category2]
await manager.save(question) // categories saved automatically
```

**Selective cascade:**
```typescript
@ManyToMany(() => Category, {
  cascade: ["insert"],
})
categories: Category[]
```

Cascade options:
- `insert` - Insert new entities
- `update` - Update existing entities
- `remove` - Delete entities
- `soft-remove` - Soft-delete entities
- `recover` - Recover soft-deleted entities

## Join Column Options

Customize foreign key column:

```typescript
@ManyToOne(() => Category)
@JoinColumn({ name: "cat_id" })
category: Category
```

Reference non-primary column:
```typescript
@ManyToOne(() => Category)
@JoinColumn({ referencedColumnName: "name" })
category: Category
```

Multiple columns:
```typescript
@ManyToOne(() => Category)
@JoinColumn([
    { name: "category_id", referencedColumnName: "id" },
    { name: "locale_id", referencedColumnName: "locale_id" }
])
category: Category
```

## Join Table Options

Customize junction table for many-to-many:

```typescript
@ManyToMany(() => Category)
@JoinTable({
    name: "question_categories",
    joinColumn: {
        name: "question",
        referencedColumnName: "id"
    },
    inverseJoinColumn: {
        name: "category",
        referencedColumnName: "id"
    }
})
categories: Category[]
```

## Eager Loading

Auto-load relations:
```typescript
@Entity()
export class User {
  @OneToMany(() => Photo, photo => photo.user, {
    eager: true
  })
  photos: Photo[]
}

// Photos automatically loaded
const users = await userRepository.find()
```

Note: Only one side can be eager. Cannot use eager with QueryBuilder.

## Lazy Relations

Load on access:
```typescript
@Entity()
export class User {
  @OneToMany(() => Photo, photo => photo.user)
  photos: Promise<Photo[]>
}

// Access triggers load
const user = await userRepository.findOne({ where: { id: 1 } })
const photos = await user.photos // Loaded here
```

## Bi-directional Relations

Both sides reference each other:

```typescript
@Entity()
export class User {
  @OneToMany(() => Photo, photo => photo.user)
  photos: Photo[]
}

@Entity()
export class Photo {
  @ManyToOne(() => User, user => user.photos)
  user: User
}
```

## Uni-directional Relations

Only one side references:

```typescript
@Entity()
export class Photo {
  @ManyToOne(() => User)
  user: User
}

// User entity has no photos property
```

## Self-referencing Relations

Entity relates to itself:

```typescript
@Entity()
export class Category {
  @ManyToOne(() => Category, category => category.children)
  parent: Category

  @OneToMany(() => Category, category => category.parent)
  children: Category[]
}
```

## Loading Relations

**Using find options:**
```typescript
const users = await userRepository.find({
  relations: {
    photos: true,
    profile: true,
  }
})
```

**Nested relations:**
```typescript
const users = await userRepository.find({
  relations: {
    photos: {
      album: true
    }
  }
})
```

**Using QueryBuilder:**
```typescript
const users = await userRepository
  .createQueryBuilder("user")
  .leftJoinAndSelect("user.photos", "photo")
  .leftJoinAndSelect("user.profile", "profile")
  .getMany()
```

## Orphaned Row Actions

Control what happens to orphaned children:

```typescript
@OneToMany(() => Photo, photo => photo.user, {
  cascade: true,
  orphanedRowAction: "delete" // or "soft-delete", "nullify", "disable"
})
photos: Photo[]

const user = await userRepository.findOne({
  where: { id: 1 },
  relations: { photos: true }
})

// Remove one photo from array
user.photos = user.photos.slice(1)

// Save - removed photo is deleted from database
await userRepository.save(user)
```

## Best Practices

- Use arrow functions to avoid circular dependencies
- Be cautious with cascade - can lead to unintended saves
- Only one side can be eager
- Use QueryBuilder for complex relation queries
- Prefer explicit loading over eager loading for better performance
- Use `orphanedRowAction` carefully to avoid data loss
