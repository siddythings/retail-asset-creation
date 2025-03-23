'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Lock, Save, Trash2, User } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Implement profile update logic here
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated delay
            toast({
                title: 'Profile Updated',
                description: 'Your profile information has been successfully updated.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update profile. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Implement password change logic here
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated delay
            toast({
                title: 'Password Updated',
                description: 'Your password has been successfully changed.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to change password. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsLoading(true);
        try {
            // Implement account deletion logic here
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated delay
            toast({
                title: 'Account Deleted',
                description: 'Your account has been successfully deleted.',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete account. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
                <p className="text-sm text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>

            <Separator />

            {/* Profile Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Profile Information
                    </CardTitle>
                    <CardDescription>
                        Update your profile information and email address.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" placeholder="john@example.com" />
                            </div>
                        </div>
                        <Button type="submit" disabled={isLoading}>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Password Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Password
                    </CardTitle>
                    <CardDescription>
                        Change your password to keep your account secure.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>
                        <Button type="submit" disabled={isLoading}>
                            <Lock className="w-4 h-4 mr-2" />
                            Change Password
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Delete Account */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="w-5 h-5" />
                        Delete Account
                    </CardTitle>
                    <CardDescription>
                        Permanently delete your account and all associated data.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Account
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Are you absolutely sure?</DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone. This will permanently delete your
                                    account and remove all associated data from our servers.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="bg-muted/30 p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    To confirm, please type "DELETE" in the box below:
                                </p>
                                <Input className="mt-2" placeholder="Type DELETE to confirm" />
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="destructive"
                                    onClick={handleDeleteAccount}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Deleting...' : 'Delete Account'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
            <Separator />
        </div>
    );
}