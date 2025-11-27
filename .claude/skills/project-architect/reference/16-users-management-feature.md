# User Management Feature

## Overview

The User Management feature provides a comprehensive interface for managing system users with enhanced security features, form validation, and CRUD operations. This feature is implemented across both backend (NestJS) and frontend (React) with a focus on security and user experience.

## Feature Highlights

- **Full CRUD Operations**: Create, Read, Update, Delete users
- **Self-Deletion Prevention**: Users cannot delete their own account (both frontend and backend protection)
- **Form Validation**: Name required, email format validation with regex
- **Email Uniqueness**: Prevents duplicate email addresses in the system
- **User Editing**: Modal-based editing with pre-filled data
- **Visual Design**: User avatar circles, clean table layout, action buttons

## Backend Implementation

### Module Structure

```
backend/src/modules/users/
├── users.controller.ts       # REST API endpoints
├── users.service.ts          # Business logic
├── users.module.ts           # Module configuration
└── dto/
    ├── create-user.dto.ts    # Create user validation
    ├── update-user.dto.ts    # Update user validation
    └── user-response.dto.ts  # API response format
```

### API Endpoints

#### 1. Get All Users

```typescript
GET /api/users
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+905321234567",
    "avatar": "https://example.com/avatar.jpg",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

**Features:**
- Orders by creation date (newest first)
- Returns all user fields
- No pagination (suitable for admin interface)

#### 2. Get User by ID

```typescript
GET /api/users/:id
```

**Parameters:**
- `id` (UUID): User identifier

**Response:** Single user object

**Error Responses:**
- `404 Not Found`: User with specified ID doesn't exist

#### 3. Create User

```typescript
POST /api/users
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+905321234567",
  "avatar": "https://example.com/avatar.jpg"  // optional
}
```

**Validation Rules:**
- `name`: Required, string, max 100 characters
- `email`: Optional for creation, must be valid email format if provided
- `phoneNumber`: Required, E.164 format, max 20 characters
- `avatar`: Optional, string, max 500 characters (URL)

**Response:** Created user object (201 Created)

**Error Responses:**
- `400 Bad Request`: Invalid input data
- `409 Conflict`: Phone number already exists

#### 4. Update User (Full Update)

```typescript
PUT /api/users/:id
```

**Request Body:** Same as Create User (all fields)

**Response:** Updated user object

**Error Responses:**
- `404 Not Found`: User doesn't exist
- `400 Bad Request`: Invalid input data
- `409 Conflict`: Phone number or email already exists

#### 5. Partial Update User

```typescript
PATCH /api/users/:id
```

**Request Body:** Partial user data (only fields to update)

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Validation Rules:**
- `name`: Optional, string, max 100 characters
- `email`: Optional, valid email format if provided, max 255 characters
- `phoneNumber`: Optional, E.164 format if provided
- `avatar`: Optional, string, max 500 characters

**Response:** Updated user object

**Error Responses:**
- `404 Not Found`: User doesn't exist
- `400 Bad Request`: Invalid input data
- `409 Conflict`: Email or phone number already exists

#### 6. Delete User

```typescript
DELETE /api/users/:id
```

**Parameters:**
- `id` (UUID): User identifier

**Authentication:**
- Requires JWT token
- Extracts current user from token via `@CurrentUser()` decorator

**Response:**
```json
{
  "success": true
}
```

**Error Responses:**
- `404 Not Found`: User doesn't exist
- `403 Forbidden`: Cannot delete your own account

**Security Feature:**
```typescript
async delete(id: string, currentUserId: string): Promise<{ success: boolean }> {
  // Prevent users from deleting their own account
  if (id === currentUserId) {
    throw new ForbiddenException('You cannot delete your own account');
  }

  const result = await this.userRepository.delete(id);
  if (result.affected === 0) {
    throw new NotFoundException(`User with ID ${id} not found`);
  }
  return { success: true };
}
```

### DTOs and Validation

#### CreateUserDto

```typescript
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format'
  })
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;
}
```

#### UpdateUserDto

```typescript
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format'
  })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEmail({}, {
    message: 'Email must be a valid email address'
  })
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;
}
```

### Service Layer

#### Key Methods

**findAll()** - Retrieves all users ordered by creation date:
```typescript
async findAll(): Promise<User[]> {
  return await this.userRepository.find({
    order: { createdAt: 'DESC' },
  });
}
```

**create()** - Creates new user with phone number uniqueness check:
```typescript
async create(userData: Partial<User>): Promise<User> {
  if (userData.phoneNumber) {
    const existingUser = await this.findByPhoneNumber(userData.phoneNumber);
    if (existingUser) {
      throw new ConflictException('User with this phone number already exists');
    }
  }

  const user = this.userRepository.create(userData);
  return await this.userRepository.save(user);
}
```

**update()** - Updates user with uniqueness checks:
```typescript
async update(id: string, updateData: Partial<User>): Promise<User> {
  const user = await this.findOne(id);

  // Check if phone number is being changed and if it already exists
  if (updateData.phoneNumber && updateData.phoneNumber !== user.phoneNumber) {
    const existingUser = await this.findByPhoneNumber(updateData.phoneNumber);
    if (existingUser) {
      throw new ConflictException('User with this phone number already exists');
    }
  }

  // Check if email is being changed and if it already exists
  if (updateData.email && updateData.email !== user.email) {
    const existingUser = await this.findByEmail(updateData.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
  }

  Object.assign(user, updateData);
  return await this.userRepository.save(user);
}
```

**delete()** - Deletes user with self-deletion prevention:
```typescript
async delete(id: string, currentUserId: string): Promise<{ success: boolean }> {
  if (id === currentUserId) {
    throw new ForbiddenException('You cannot delete your own account');
  }

  const result = await this.userRepository.delete(id);
  if (result.affected === 0) {
    throw new NotFoundException(`User with ID ${id} not found`);
  }
  return { success: true };
}
```

### Controller Layer

The controller uses `@CurrentUser()` decorator to extract authenticated user information:

```typescript
@Delete(':id')
delete(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserData) {
  return this.usersService.delete(id, currentUser.userId);
}
```

### Swagger Documentation

All endpoints are documented with Swagger decorators:

```typescript
@ApiTags('Users')
@Controller('api/users')
export class UsersController {
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete user',
    description: 'Permanently deletes a user from the system',
  })
  @ApiParam({ name: 'id', description: 'User UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Cannot delete your own account' })
  delete(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserData) {
    return this.usersService.delete(id, currentUser.userId);
  }
}
```

## Frontend Implementation

### Component Structure

```
frontend/src/features/users/
├── components/
│   └── UsersPage.tsx         # Main users page component
└── api.ts                     # API service functions
```

### UsersPage Component

**File:** `frontend/src/features/users/components/UsersPage.tsx`

#### State Management

```typescript
const [users, setUsers] = useState<User[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [showModal, setShowModal] = useState(false);
const [newUserEmail, setNewUserEmail] = useState('');
const [newUserName, setNewUserName] = useState('');
const [showEditModal, setShowEditModal] = useState(false);
const [editingUser, setEditingUser] = useState<User | null>(null);
const [editName, setEditName] = useState('');
const [editEmail, setEditEmail] = useState('');
const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    email?: string;
}>({});
```

#### Form Validation

**Create User Validation:**
```typescript
const validateForm = (): boolean => {
  const errors: { name?: string; email?: string } = {};

  // Validate name - required
  if (!newUserName.trim()) {
    errors.name = 'Name is required';
  }

  // Validate email - required and format
  if (!newUserEmail.trim()) {
    errors.email = 'Email is required';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserEmail)) {
      errors.email = 'Please enter a valid email address';
    }
  }

  setValidationErrors(errors);
  return Object.keys(errors).length === 0;
};
```

**Edit User Validation:**
```typescript
const validateEditForm = (): boolean => {
  const errors: { name?: string; email?: string } = {};

  // Validate name - required
  if (!editName.trim()) {
    errors.name = 'Name is required';
  }

  // Validate email - required and format
  if (!editEmail.trim()) {
    errors.email = 'Email is required';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editRegex.test(editEmail)) {
      errors.email = 'Please enter a valid email address';
    }
  }

  setValidationErrors(errors);
  return Object.keys(errors).length === 0;
};
```

#### CRUD Operations

**Load Users:**
```typescript
const loadUsers = async () => {
  try {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setError(null);
  } catch (err) {
    console.error('Failed to load users:', err);
    setError('Failed to load users. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

**Create User:**
```typescript
const handleCreateUser = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  try {
    const newUser = await createUser({
      email: newUserEmail,
      name: newUserName
    });
    setUsers([...users, newUser]);
    setShowModal(false);
    setNewUserEmail('');
    setNewUserName('');
    setValidationErrors({});
  } catch (err) {
    console.error('Failed to create user:', err);
    alert('Failed to create user');
  }
};
```

**Edit User:**
```typescript
const handleEditUser = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!editingUser) return;

  if (!validateEditForm()) {
    return;
  }

  try {
    const updatedUser = await updateUser(editingUser.id, {
      email: editEmail,
      name: editName
    });
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    setShowEditModal(false);
    setEditingUser(null);
    setEditName('');
    setEditEmail('');
    setValidationErrors({});
  } catch (err) {
    console.error('Failed to update user:', err);
    alert('Failed to update user');
  }
};
```

**Delete User (with self-deletion check):**
```typescript
const handleDelete = async (id: string) => {
  // Prevent self-deletion
  if (currentUser && currentUser.id === id) {
    alert('You cannot delete your own account');
    return;
  }

  if (!window.confirm('Are you sure you want to delete this user?')) return;

  try {
    await deleteUser(id);
    setUsers(users.filter(u => u.id !== id));
  } catch (err) {
    console.error('Failed to delete user:', err);
    alert('Failed to delete user');
  }
};
```

### UI Components

#### Users Table

```tsx
<table className="w-full text-left">
  <thead className="bg-zinc-900/50 border-b border-zinc-800">
    <tr>
      <th className="px-6 py-4 text-sm font-semibold text-white">Name</th>
      <th className="px-6 py-4 text-sm font-semibold text-white">Email</th>
      <th className="px-6 py-4 text-sm font-semibold text-white">Created At</th>
      <th className="px-6 py-4 text-sm font-semibold text-white text-right">Actions</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-zinc-800">
    {users.map((user) => (
      <tr key={user.id} className="hover:bg-zinc-900/20 transition-colors">
        <td className="px-6 py-4 text-sm text-white font-medium">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </div>
            {user.name || 'N/A'}
          </div>
        </td>
        <td className="px-6 py-4 text-sm text-zinc-400">{user.email}</td>
        <td className="px-6 py-4 text-sm text-zinc-400">
          {new Date(user.createdAt).toLocaleDateString()}
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => handleOpenEdit(user)}
              className="p-2 rounded-lg text-zinc-400 hover:text-primary hover:bg-primary/10 transition-colors"
              title="Edit User"
            >
              <span className="material-symbols-outlined">edit</span>
            </button>
            <button
              onClick={() => handleDelete(user.id)}
              disabled={currentUser?.id === user.id}
              className={`p-2 rounded-lg transition-colors ${
                currentUser?.id === user.id
                  ? 'text-zinc-600 cursor-not-allowed opacity-50'
                  : 'text-zinc-400 hover:text-red-600 hover:bg-red-900/20'
              }`}
              title={currentUser?.id === user.id ? "Cannot delete your own account" : "Delete User"}
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

**Key UI Features:**
- **Avatar Circle**: Shows first letter of name or email
- **Edit Button**: Opens pre-filled edit modal
- **Delete Button**:
  - Disabled for current user (visual + functional)
  - Shows tooltip explaining why it's disabled
  - Confirmation dialog before deletion

#### Add User Modal

```tsx
{showModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
    <div className="w-full max-w-md bg-surface-dark rounded-xl border border-zinc-800 shadow-2xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">Add New User</h2>
      <form onSubmit={handleCreateUser}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Name</label>
            <input
              type="text"
              value={newUserName}
              onChange={(e) => {
                setNewUserName(e.target.value);
                if (validationErrors.name) {
                  setValidationErrors({ ...validationErrors, name: undefined });
                }
              }}
              className={`w-full px-3 py-2 rounded-lg border bg-zinc-900 text-white focus:ring-2 focus:ring-primary focus:border-transparent ${
                validationErrors.name ? 'border-red-500' : 'border-zinc-700'
              }`}
              placeholder="John Doe"
            />
            {validationErrors.name && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Email</label>
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => {
                setNewUserEmail(e.target.value);
                if (validationErrors.email) {
                  setValidationErrors({ ...validationErrors, email: undefined });
                }
              }}
              className={`w-full px-3 py-2 rounded-lg border bg-zinc-900 text-white focus:ring-2 focus:ring-primary focus:border-transparent ${
                validationErrors.email ? 'border-red-500' : 'border-zinc-700'
              }`}
              placeholder="john@example.com"
            />
            {validationErrors.email && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => {
              setShowModal(false);
              setNewUserEmail('');
              setNewUserName('');
              setValidationErrors({});
            }}
            className="px-4 py-2 text-zinc-300 hover:bg-zinc-800 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!newUserName.trim() || !newUserEmail.trim()}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${
              !newUserName.trim() || !newUserEmail.trim()
                ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-primary text-[#112217] hover:bg-primary/90'
            }`}
          >
            Create User
          </button>
        </div>
      </form>
    </div>
  </div>
)}
```

**Modal Features:**
- Backdrop blur effect
- Form validation with error messages
- Red border on invalid fields
- Error messages clear when user types
- Disabled submit button when fields are empty
- Cancel button clears form and closes modal

#### Edit User Modal

Similar structure to Add User Modal but:
- Pre-fills fields with existing user data
- Uses `editName` and `editEmail` state
- Calls `updateUser` API instead of `createUser`
- Button text: "Save Changes" instead of "Create User"

### API Service

**File:** `frontend/src/features/users/api.ts`

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export const getUsers = async (): Promise<User[]> => {
  const response = await axios.get('/api/users');
  return response.data;
};

export const createUser = async (userData: {
  name: string;
  email: string
}): Promise<User> => {
  const response = await axios.post('/api/users', userData);
  return response.data;
};

export const updateUser = async (
  id: string,
  userData: { name: string; email: string }
): Promise<User> => {
  const response = await axios.patch(`/api/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await axios.delete(`/api/users/${id}`);
};
```

## Security Features

### 1. Self-Deletion Prevention

**Backend Protection:**
```typescript
// In users.service.ts
async delete(id: string, currentUserId: string): Promise<{ success: boolean }> {
  if (id === currentUserId) {
    throw new ForbiddenException('You cannot delete your own account');
  }
  // ... rest of deletion logic
}
```

**Frontend Protection:**
```typescript
// In UsersPage.tsx
const handleDelete = async (id: string) => {
  if (currentUser && currentUser.id === id) {
    alert('You cannot delete your own account');
    return;
  }
  // ... rest of deletion logic
};
```

**UI Protection:**
```tsx
<button
  onClick={() => handleDelete(user.id)}
  disabled={currentUser?.id === user.id}
  className={`... ${
    currentUser?.id === user.id
      ? 'text-zinc-600 cursor-not-allowed opacity-50'
      : 'text-zinc-400 hover:text-red-600 hover:bg-red-900/20'
  }`}
  title={currentUser?.id === user.id
    ? "Cannot delete your own account"
    : "Delete User"
  }
>
  <span className="material-symbols-outlined">delete</span>
</button>
```

**Protection Layers:**
1. Frontend JavaScript check (prevents accidental clicks)
2. Button disabled state (visual indicator)
3. Backend service validation (security enforcement)
4. HTTP 403 Forbidden response (proper error handling)

### 2. Email Uniqueness Validation

**Backend:**
```typescript
async update(id: string, updateData: Partial<User>): Promise<User> {
  const user = await this.findOne(id);

  if (updateData.email && updateData.email !== user.email) {
    const existingUser = await this.findByEmail(updateData.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
  }

  Object.assign(user, updateData);
  return await this.userRepository.save(user);
}
```

**Features:**
- Checks if email is being changed
- Only validates if email is different from current
- Prevents duplicate emails in database
- Returns 409 Conflict with clear error message

### 3. Form Validation

**Client-Side Validation:**
- Name: Required field
- Email: Required + Format validation (regex)
- Real-time error clearing when user types
- Submit button disabled when validation fails

**Server-Side Validation:**
- DTOs with class-validator decorators
- Global ValidationPipe in NestJS
- Automatic 400 Bad Request on validation failure
- Detailed error messages

## Authentication Integration

The Users module integrates with the JWT authentication system:

```typescript
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';

@Delete(':id')
delete(@Param('id') id: string, @CurrentUser() currentUser: CurrentUserData) {
  return this.usersService.delete(id, currentUser.userId);
}
```

**CurrentUser Decorator:**
- Extracts user information from JWT token
- Provides `userId` for authorization checks
- Enables self-deletion prevention logic

**Frontend Auth Context:**
```typescript
const { user: currentUser } = useAuth();
```

- Provides current user information to components
- Used for UI protection (disable delete button)
- Synchronized with backend via JWT

## Database Schema

The User entity is defined in `backend/src/entities/user.entity.ts`:

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 20 })
  phoneNumber: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 500, nullable: true })
  avatar: string;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  @ManyToMany(() => Conversation, (conversation) => conversation.participants)
  conversations: Conversation[];
}
```

**Key Fields:**
- `id`: UUID primary key
- `phoneNumber`: Unique, required for WhatsApp integration
- `name`: Required for display
- `email`: Unique, required for authentication
- `avatar`: Optional profile picture URL
- `createdAt`, `updatedAt`: Automatic timestamps

## Use Cases

### Use Case 1: Create New User

1. Admin clicks "Add User" button
2. Modal opens with empty form
3. Admin enters name and email
4. Client-side validation checks format
5. Submit button enabled if valid
6. API call to POST /api/users
7. Backend validates and checks uniqueness
8. User created in database
9. Frontend adds user to list
10. Modal closes, form resets

### Use Case 2: Edit User

1. Admin clicks edit button for a user
2. Edit modal opens with pre-filled data
3. Admin modifies name or email
4. Client-side validation checks format
5. Submit button enabled if valid
6. API call to PATCH /api/users/:id
7. Backend validates and checks uniqueness
8. User updated in database
9. Frontend updates user in list
10. Modal closes

### Use Case 3: Delete User (Other User)

1. Admin clicks delete button
2. Confirmation dialog appears
3. Admin confirms deletion
4. API call to DELETE /api/users/:id
5. Backend checks user is not deleting themselves
6. User deleted from database
7. Frontend removes user from list

### Use Case 4: Attempt Self-Deletion (Prevented)

1. Admin tries to delete their own account
2. Frontend immediately shows alert
3. No API call made
4. Button is disabled with visual indication
5. Tooltip explains why it's disabled

**If API is called directly (bypassing frontend):**
6. Backend validates currentUserId !== targetUserId
7. Returns 403 Forbidden error
8. Error message: "You cannot delete your own account"

## Error Handling

### Backend Errors

| Error Code | Scenario | Message |
|-----------|----------|---------|
| 400 | Invalid input | Validation error details |
| 403 | Self-deletion attempt | "You cannot delete your own account" |
| 404 | User not found | "User with ID {id} not found" |
| 409 | Duplicate email | "User with this email already exists" |
| 409 | Duplicate phone | "User with this phone number already exists" |

### Frontend Error Handling

```typescript
try {
  await createUser({ email: newUserEmail, name: newUserName });
  // Success handling
} catch (err) {
  console.error('Failed to create user:', err);
  alert('Failed to create user');
}
```

**Error Display:**
- Alert dialogs for API errors
- Inline validation errors for form fields
- Red borders on invalid inputs
- Error messages below fields

## Best Practices Demonstrated

### Backend
1. **Separation of Concerns**: Controller → Service → Repository
2. **DTO Validation**: Input validation with class-validator
3. **Error Handling**: Appropriate HTTP exceptions
4. **Security**: Self-deletion prevention at service level
5. **Uniqueness Checks**: Database constraints + service validation
6. **API Documentation**: Swagger decorators for all endpoints

### Frontend
1. **Component Organization**: Feature-based structure
2. **Form Validation**: Client-side validation before submission
3. **User Feedback**: Loading states, error messages, success indicators
4. **Accessibility**: Disabled states, tooltips, semantic HTML
5. **State Management**: React hooks for local state
6. **API Abstraction**: Separate API service functions
7. **Security**: Frontend + backend protection for sensitive operations

## Future Enhancements

Potential improvements for the User Management feature:

1. **Pagination**: For large user lists
2. **Search and Filter**: Find users by name, email, or phone
3. **Bulk Operations**: Select and delete multiple users
4. **Role Management**: Assign roles and permissions
5. **Profile Pictures**: Upload and manage user avatars
6. **Email Verification**: Verify email addresses on creation
7. **Activity Log**: Track user actions and changes
8. **Export**: Export user list to CSV/Excel
9. **Advanced Validation**: Password strength, phone number format per country
10. **Soft Delete**: Mark users as deleted instead of permanent deletion

## Integration Points

### With Authentication Module
- `@CurrentUser()` decorator for authorization
- JWT token validation
- User context in frontend

### With Database
- User entity relationships
- Cascade operations on deletion
- Unique constraints enforcement

### With Frontend Router
- `/users` route in application
- Navigation from settings or admin panel
- Deep linking to user management page

## Summary

The User Management feature provides a robust, secure, and user-friendly interface for managing system users. It demonstrates best practices in:

- **Security**: Multi-layer self-deletion prevention
- **Validation**: Both client and server-side validation
- **User Experience**: Clear feedback, intuitive modals, disabled states
- **Code Quality**: Separation of concerns, type safety, error handling
- **Documentation**: Swagger API docs, inline comments

This feature serves as a reference implementation for CRUD operations with enhanced security in the WhatsApp Builder project.
