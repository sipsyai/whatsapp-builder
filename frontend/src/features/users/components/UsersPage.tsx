import React, { useEffect, useState } from 'react';
import { getUsers, createUser, deleteUser, updateUser, type User } from '../api';
import { useAuth } from '../../../contexts/AuthContext';

export const UsersPage: React.FC = () => {
    const { user: currentUser } = useAuth();
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

    useEffect(() => {
        loadUsers();
    }, []);

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
            if (!emailRegex.test(editEmail)) {
                errors.email = 'Please enter a valid email address';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form before submission
        if (!validateForm()) {
            return;
        }

        try {
            const newUser = await createUser({ email: newUserEmail, name: newUserName });
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

    const handleOpenEdit = (user: User) => {
        setEditingUser(user);
        setEditName(user.name || '');
        setEditEmail(user.email || '');
        setValidationErrors({});
        setShowEditModal(true);
    };

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingUser) return;

        // Validate form before submission
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-8 h-full bg-background overflow-y-auto">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Users</h1>
                        <p className="text-zinc-400 mt-1">Manage system users</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-primary text-[#112217] rounded-lg font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Add User
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 relative">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <div className="bg-surface-dark rounded-xl border border-zinc-800 overflow-hidden">
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
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-400">
                                        No users found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
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

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-surface-dark rounded-xl border border-zinc-800 shadow-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Edit User</h2>
                        <form onSubmit={handleEditUser}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => {
                                            setEditName(e.target.value);
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
                                        value={editEmail}
                                        onChange={(e) => {
                                            setEditEmail(e.target.value);
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
                                        setShowEditModal(false);
                                        setEditingUser(null);
                                        setEditName('');
                                        setEditEmail('');
                                        setValidationErrors({});
                                    }}
                                    className="px-4 py-2 text-zinc-300 hover:bg-zinc-800 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!editName.trim() || !editEmail.trim()}
                                    className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                                        !editName.trim() || !editEmail.trim()
                                            ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                                            : 'bg-primary text-[#112217] hover:bg-primary/90'
                                    }`}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
